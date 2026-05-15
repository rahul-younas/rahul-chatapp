import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";

/** Reactivate a closed or empty room for the creator or an admin */
export async function reopenRoomRecord(roomId, user) {
  await connectDB();
  const normalized = String(roomId).toUpperCase();
  const room = await Room.findOne({ roomId: normalized });

  if (!room) {
    return { error: "Room not found. Create a new room instead." };
  }

  const userId = String(user._id);
  const isOwner = room.creatorId === userId;
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin) {
    return { error: "You do not have permission to reopen this room" };
  }

  await Room.updateOne(
    { roomId: normalized },
    {
      $set: {
        isClosed: false,
        lastEmptyAt: null,
        activeUsers: [],
      },
    }
  );

  const reopened = await Room.findOne({ roomId: normalized }).lean();
  return { success: true, room: reopened };
}
