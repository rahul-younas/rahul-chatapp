import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { reopenRoomRecord } from "@/lib/room-lifecycle";
import { Room } from "@/models/Room";
import { RoomClient } from "@/components/room/room-client";

export async function generateMetadata({ params }) {
  const { roomId } = await params;
  return { title: `Room ${roomId} — VoiceHub` };
}

export default async function RoomPage({ params }) {
  const { roomId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");
  if (user.isBanned) redirect("/dashboard");

  await connectDB();
  let room = await Room.findOne({ roomId: roomId.toUpperCase() }).lean();

  if (!room) notFound();

  if (room.isClosed) {
    const reopened = await reopenRoomRecord(room.roomId, user);
    if (reopened.error) notFound();
    room = reopened.room;
    revalidatePath("/dashboard");
  }

  return (
    <RoomClient
      roomId={room.roomId}
      roomName={room.roomName}
      creatorId={room.creatorId}
      currentUserId={String(user._id)}
      isAdmin={user.role === "admin"}
    />
  );
}
