import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Room } from "@/models/Room";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = { title: "Admin — VoiceHub" };

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  await connectDB();
  const [users, rooms] = await Promise.all([
    User.find().sort({ createdAt: -1 }).lean(),
    Room.find().sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-zinc-50">Admin Dashboard</h1>
      <AdminDashboard users={JSON.parse(JSON.stringify(users))} rooms={JSON.parse(JSON.stringify(rooms))} />
    </div>
  );
}
