import { verifyToken } from "@clerk/backend";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { sanitizeInput } from "../../lib/sanitize.js";
import { rateLimit } from "../../lib/rate-limit.js";
import { Room } from "../../models/Room.js";
import { User } from "../../models/User.js";
import {
  cancelPendingLeave,
  cleanupInactiveRooms,
  clearRoomState,
  deleteMemoryRoom,
  getMemoryRoom,
  getOrCreateMemoryRoom,
  getParticipantsList,
  getTypingList,
  schedulePendingLeave,
} from "./room-store.js";

const EMPTY_DB_ROOM_MS = 5 * 60 * 1000;

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

async function verifySocketToken(token) {
  const payload = await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  return payload.sub;
}

async function getDbUser(clerkId) {
  await connectMongo();
  return User.findOne({ clerkId }).lean();
}

/** Hard-delete a room document (idle cleanup / admin delete) */
export async function destroyRoom(roomId, io, reason) {
  const normalizedRoomId = roomId.toUpperCase();
  clearRoomState(normalizedRoomId);
  deleteMemoryRoom(normalizedRoomId);
  await connectMongo();
  await Room.deleteOne({ roomId: normalizedRoomId });
  if (reason) {
    io.to(normalizedRoomId).emit("room-closed", { reason });
  }
}

/** Creator/admin close — keep DB row so dashboard can reopen the same room ID */
async function softCloseRoom(roomId, io, reason) {
  const normalizedRoomId = roomId.toUpperCase();
  clearRoomState(normalizedRoomId);
  deleteMemoryRoom(normalizedRoomId);
  await connectMongo();
  await Room.updateOne(
    { roomId: normalizedRoomId },
    {
      $set: {
        isClosed: true,
        activeUsers: [],
        lastEmptyAt: new Date(),
      },
    }
  );
  io.to(normalizedRoomId).emit("room-closed", { reason });
}

async function cleanupEmptyDbRooms() {
  await connectMongo();
  const cutoff = new Date(Date.now() - EMPTY_DB_ROOM_MS);
  const stale = await Room.find({
    isClosed: { $ne: true },
    lastEmptyAt: { $ne: null, $lt: cutoff },
  }).lean();

  for (const room of stale) {
    await Room.deleteOne({ _id: room._id });
  }
  return stale.map((r) => r.roomId);
}

export function registerSocketHandlers(io) {
  setInterval(async () => {
    cleanupInactiveRooms();
    const deletedIds = await cleanupEmptyDbRooms();
    for (const roomId of deletedIds) {
      deleteMemoryRoom(roomId);
    }
  }, 60_000);

  io.on("connection", (socket) => {
    let currentRoomId = null;
    let currentUserId = null;

    socket.on("join-room", async ({ roomId, token }) => {
      try {
        const limit = rateLimit(`join:${socket.id}`, 10, 60_000);
        if (!limit.success) {
          socket.emit("error", { message: "Too many requests" });
          return;
        }

        const clerkId = await verifySocketToken(token);
        const dbUser = await getDbUser(clerkId);

        if (!dbUser || dbUser.isBanned) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        const normalizedRoomId = roomId.toUpperCase().trim();
        await connectMongo();
        const dbRoom = await Room.findOne({
          roomId: normalizedRoomId,
          isClosed: { $ne: true },
        });

        if (!dbRoom) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        const userId = String(dbUser._id);
        cancelPendingLeave(normalizedRoomId, userId);

        const memoryRoom = getOrCreateMemoryRoom(normalizedRoomId);
        const wasInRoom = memoryRoom.participants.has(userId);

        if (wasInRoom) {
          const existing = memoryRoom.participants.get(userId);
          existing.socketId = socket.id;
        } else {
          if (memoryRoom.participants.size >= dbRoom.maxMembers) {
            socket.emit("error", { message: "Room is full" });
            return;
          }

          memoryRoom.participants.set(userId, {
            userId,
            clerkId: dbUser.clerkId,
            username: dbUser.username,
            imageUrl: dbUser.imageUrl,
            role: dbUser.role,
            socketId: socket.id,
            isMuted: false,
            isSpeaking: false,
          });

          await Room.updateOne(
            { roomId: normalizedRoomId },
            {
              $pull: { activeUsers: { userId } },
              $set: { lastEmptyAt: null },
            }
          );

          await Room.updateOne(
            { roomId: normalizedRoomId },
            {
              $push: {
                activeUsers: {
                  userId,
                  username: dbUser.username,
                  imageUrl: dbUser.imageUrl,
                  joinedAt: new Date(),
                },
              },
            }
          );
        }

        currentRoomId = normalizedRoomId;
        currentUserId = userId;

        await socket.join(normalizedRoomId);

        const participants = getParticipantsList(memoryRoom);
        socket.emit("participants-update", participants);

        // Replay in-memory chat history for reconnects (same server session)
        for (const msg of memoryRoom.messages) {
          socket.emit("room-message", msg);
        }

        if (!wasInRoom) {
          socket.to(normalizedRoomId).emit("user-joined", {
            user: memoryRoom.participants.get(userId),
            participants,
          });
          io.to(normalizedRoomId).emit("system-message", {
            content: `${dbUser.username} joined the room`,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leave-room", async ({ roomId }) => {
      const rid = roomId?.toUpperCase() || currentRoomId;
      if (rid && currentUserId) {
        cancelPendingLeave(rid, currentUserId);
        await handleLeave(socket, rid, currentUserId, io, { immediate: true });
      }
      currentRoomId = null;
      currentUserId = null;
    });

    socket.on("close-room", async ({ roomId, token }) => {
      try {
        if (!currentUserId) return;

        await verifySocketToken(token);
        const memoryRoom = getMemoryRoom(roomId.toUpperCase());
        if (!memoryRoom) return;

        const actor = memoryRoom.participants.get(currentUserId);
        if (!actor) return;

        await connectMongo();
        const dbRoom = await Room.findOne({ roomId: roomId.toUpperCase() });
        const isCreator = dbRoom?.creatorId === currentUserId;
        const isAdmin = actor.role === "admin";

        if (!isCreator && !isAdmin) {
          socket.emit("error", { message: "Not authorized to close this room" });
          return;
        }

        await softCloseRoom(roomId, io, "Room closed by moderator");
        currentRoomId = null;
        currentUserId = null;
      } catch {
        socket.emit("error", { message: "Failed to close room" });
      }
    });

    socket.on("send-message", async ({ roomId, content }) => {
      try {
        if (!currentUserId) return;

        const limit = rateLimit(`msg:${currentUserId}`, 60, 60_000);
        if (!limit.success) return;

        const memoryRoom = getMemoryRoom(roomId.toUpperCase());
        if (!memoryRoom) return;

        const participant = memoryRoom.participants.get(currentUserId);
        if (!participant) return;

        const sanitized = sanitizeInput(content);
        if (!sanitized) return;

        const message = {
          id: nanoid(),
          userId: currentUserId,
          username: participant.username,
          imageUrl: participant.imageUrl,
          content: sanitized,
          timestamp: Date.now(),
        };

        memoryRoom.messages.push(message);
        memoryRoom.lastActivity = Date.now();

        io.to(roomId.toUpperCase()).emit("room-message", message);
      } catch {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", ({ roomId }) => {
      if (!currentUserId) return;
      const memoryRoom = getMemoryRoom(roomId.toUpperCase());
      if (!memoryRoom) return;
      const participant = memoryRoom.participants.get(currentUserId);
      if (!participant) return;
      memoryRoom.typing.set(currentUserId, {
        userId: currentUserId,
        username: participant.username,
      });
      io.to(roomId.toUpperCase()).emit("typing-update", getTypingList(memoryRoom));
    });

    socket.on("stop-typing", ({ roomId }) => {
      if (!currentUserId) return;
      const memoryRoom = getMemoryRoom(roomId.toUpperCase());
      if (!memoryRoom) return;
      memoryRoom.typing.delete(currentUserId);
      io.to(roomId.toUpperCase()).emit("typing-update", getTypingList(memoryRoom));
    });

    socket.on("mic-state-change", ({ roomId, isMuted }) => {
      if (!currentUserId) return;
      const memoryRoom = getMemoryRoom(roomId.toUpperCase());
      if (!memoryRoom) return;
      const participant = memoryRoom.participants.get(currentUserId);
      if (!participant) return;
      participant.isMuted = isMuted;
      io.to(roomId.toUpperCase()).emit("mic-state-change", {
        userId: currentUserId,
        isMuted,
      });
    });

    socket.on("mute-user", async ({ roomId, targetUserId, mute }) => {
      try {
        if (!currentUserId) return;
        const memoryRoom = getMemoryRoom(roomId.toUpperCase());
        if (!memoryRoom) return;
        const actor = memoryRoom.participants.get(currentUserId);
        const target = memoryRoom.participants.get(targetUserId);
        if (!actor || !target) return;

        await connectMongo();
        const dbRoom = await Room.findOne({ roomId: roomId.toUpperCase() });
        const isCreator = dbRoom?.creatorId === currentUserId;
        const isAdmin = actor.role === "admin";

        if (!isCreator && !isAdmin) {
          socket.emit("error", { message: "Not authorized to mute users" });
          return;
        }

        target.isMuted = mute;
        io.to(roomId.toUpperCase()).emit("mute-user", {
          userId: targetUserId,
          isMuted: mute,
        });
      } catch {
        socket.emit("error", { message: "Failed to mute user" });
      }
    });

    socket.on("disconnect", () => {
      if (currentRoomId && currentUserId) {
        const rid = currentRoomId;
        const uid = currentUserId;
        schedulePendingLeave(rid, uid, async () => {
          await handleLeave(socket, rid, uid, io, { immediate: true });
        });
      }
    });
  });
}

async function handleLeave(socket, roomId, userId, io, { immediate = false } = {}) {
  if (!userId) return;

  const normalizedRoomId = roomId.toUpperCase();
  const memoryRoom = getMemoryRoom(normalizedRoomId);
  if (!memoryRoom) return;

  const participant = memoryRoom.participants.get(userId);
  if (!participant) return;

  memoryRoom.participants.delete(userId);
  memoryRoom.typing.delete(userId);

  try {
    await socket.leave(normalizedRoomId);
  } catch {
    /* socket may already be disconnected */
  }

  await connectMongo();
  await Room.updateOne(
    { roomId: normalizedRoomId },
    { $pull: { activeUsers: { userId } } }
  );

  const participants = getParticipantsList(memoryRoom);

  if (memoryRoom.participants.size === 0) {
    clearRoomState(normalizedRoomId);
    deleteMemoryRoom(normalizedRoomId);
    // Keep MongoDB record so reload/rejoin works; auto-delete after idle timeout
    await Room.updateOne(
      { roomId: normalizedRoomId },
      { $set: { lastEmptyAt: new Date() } }
    );
    return;
  }

  socket.to(normalizedRoomId).emit("user-left", {
    userId,
    username: participant.username,
    participants,
  });

  io.to(normalizedRoomId).emit("system-message", {
    content: `${participant.username} left the room`,
    timestamp: Date.now(),
  });

  io.to(normalizedRoomId).emit("participants-update", participants);
}
