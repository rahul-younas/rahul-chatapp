"use server";

import { revalidatePath } from "next/cache";
import { requireAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { generateRoomId } from "@/lib/utils";
import { createRoomSchema, joinRoomSchema } from "@/lib/validators";
import { Room } from "@/models/Room";
import { reopenRoomRecord } from "@/lib/room-lifecycle";

export async function createRoomAction(formData) {
  const user = await requireAuthUser();

  const parsed = createRoomSchema.safeParse({
    roomName: formData.get("roomName"),
    maxMembers: formData.get("maxMembers"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectDB();

  let roomId = generateRoomId();
  let attempts = 0;

  while (attempts < 5) {
    const exists = await Room.findOne({ roomId });
    if (!exists) break;
    roomId = generateRoomId();
    attempts++;
  }

  await Room.create({
    roomId,
    roomName: parsed.data.roomName,
    creatorId: String(user._id),
    maxMembers: parsed.data.maxMembers,
    activeUsers: [],
    lastEmptyAt: null,
    isClosed: false,
  });

  revalidatePath("/dashboard");
  return { success: true, roomId };
}

export async function joinRoomAction(formData) {
  await requireAuthUser();

  const parsed = joinRoomSchema.safeParse({
    roomId: formData.get("roomId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid room ID" };
  }

  await connectDB();
  const room = await Room.findOne({
    roomId: parsed.data.roomId,
    isClosed: { $ne: true },
  });

  if (!room) return { error: "Room not found" };
  if (room.activeUsers.length >= room.maxMembers) {
    return { error: "Room is full" };
  }

  return { success: true, roomId: room.roomId };
}

/** Reopen a closed room (creator or admin) — same room ID and name */
export async function reopenRoomAction(roomId) {
  const user = await requireAuthUser();
  const result = await reopenRoomRecord(roomId, user);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/room/${result.room.roomId}`);
  return { success: true, roomId: result.room.roomId };
}
