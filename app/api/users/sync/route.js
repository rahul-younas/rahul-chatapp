import { NextResponse } from "next/server";
import { syncClerkUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const limit = rateLimit("sync-user", 20, 60_000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const user = await syncClerkUser();
    return NextResponse.json({
      id: String(user._id),
      username: user.username,
      role: user.role,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
