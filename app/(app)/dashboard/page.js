import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, LogIn } from "lucide-react";
import { getAuthUser, syncClerkUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSync } from "@/components/user-sync";

export default async function DashboardPage() {
  let user = await getAuthUser();
  if (!user) {
    try {
      user = await syncClerkUser();
    } catch {
      redirect("/sign-in");
    }
  }

  if (user.isBanned) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-red-400">Account suspended</h1>
        <p className="mt-2 text-zinc-400">Contact support if you believe this is an error.</p>
      </div>
    );
  }

  await connectDB();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <UserSync />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50">
          Welcome, {user.username}
        </h1>
        <p className="mt-1 text-zinc-400">Create or join a voice room</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/50 transition hover:border-indigo-500/50">
          <CardHeader>
            <Plus className="h-8 w-8 text-indigo-400" />
            <CardTitle>Create Room</CardTitle>
            <CardDescription>Start a new voice room and invite others</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/create-room">Create room</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50 transition hover:border-indigo-500/50">
          <CardHeader>
            <LogIn className="h-8 w-8 text-indigo-400" />
            <CardTitle>Join Room</CardTitle>
            <CardDescription>Enter a room ID shared with you</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/join-room">Join room</Link>
            </Button>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
