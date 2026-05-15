"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { adminBanSchema, adminRoleSchema } from "@/lib/validators";
import { Room } from "@/models/Room";
import { User } from "@/models/User";

export async function banUserAction(formData) {
  await requireAdmin();

  const parsed = adminBanSchema.safeParse({
    userId: formData.get("userId"),
    banned: formData.get("banned") === "true",
  });

  if (!parsed.success) return { error: "Invalid input" };

  await connectDB();
  await User.findByIdAndUpdate(parsed.data.userId, {
    isBanned: parsed.data.banned,
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUserRoleAction(formData) {
  const admin = await requireAdmin();

  const parsed = adminRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) return { error: "Invalid input" };
  if (String(admin._id) === parsed.data.userId) {
    return { error: "Cannot change your own role" };
  }

  await connectDB();
  await User.findByIdAndUpdate(parsed.data.userId, { role: parsed.data.role });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteRoomAction(formData) {
  await requireAdmin();

  const roomId = String(formData.get("roomId") ?? "").toUpperCase();
  if (!roomId) return { error: "Invalid room ID" };

  await connectDB();
  await Room.deleteOne({ roomId });

  revalidatePath("/admin");
  return { success: true };
}
