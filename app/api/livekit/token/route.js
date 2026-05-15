import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createLiveKitToken } from "@/lib/livekit/token";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";
import { Room } from "@/models/Room";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = rateLimit(`lk:${userId}`, 30, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const user = await getAuthUser();
    if (!user || user.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await req.json();
    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    await connectDB();
    const room = await Room.findOne({ roomId: String(roomId).toUpperCase() });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const token = await createLiveKitToken(
      room.roomId,
      user.username,
      String(user._id)
    );

    return NextResponse.json({
      token,
      roomName: room.roomId,
      serverUrl: process.env.LIVEKIT_URL,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
