import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Room } from "@/models/Room";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const rooms = await Room.find().sort({ createdAt: -1 }).select("-__v").lean();
    return NextResponse.json({ rooms });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
