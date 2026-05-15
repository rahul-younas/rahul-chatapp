import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  return User.findOne({ clerkId: userId }).lean();
}

export async function requireAuthUser() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  if (user.isBanned) throw new Error("Banned");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuthUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function syncClerkUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  await connectDB();

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";

  const username =
    clerkUser.username ??
    clerkUser.firstName ??
    email.split("@")[0] ??
    "user";

  const user = await User.findOneAndUpdate(
    { clerkId: clerkUser.id },
    {
      $set: { username, email, imageUrl: clerkUser.imageUrl },
      $setOnInsert: { clerkId: clerkUser.id, role: "user", isBanned: false },
    },
    { upsert: true, new: true, lean: true }
  );

  return user;
}
