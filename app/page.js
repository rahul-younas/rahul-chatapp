import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Headphones, MessageSquare, Mic, Shield, Users, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: Mic, title: "Crystal-clear voice", desc: "Powered by LiveKit for low-latency audio." },
  { icon: MessageSquare, title: "Realtime chat", desc: "Ephemeral messages — nothing stored in DB." },
  { icon: Users, title: "Temporary rooms", desc: "Create, join, and auto-cleanup when empty." },
  { icon: Shield, title: "Secure by default", desc: "Clerk auth, rate limits, and admin controls." },
  { icon: Zap, title: "Instant join", desc: "Share a room ID and start talking in seconds." },
  { icon: Headphones, title: "Voice-first UX", desc: "Discord-inspired layout built for voice." },
];

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-950 to-zinc-950" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
              <Headphones className="h-4 w-4" />
              Realtime voice rooms
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
              Voice chat rooms for{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                teams & friends
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Create temporary voice rooms with realtime text chat. No chat history stored —
              privacy-first, production-ready.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {userId ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/sign-up">Get started free</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="animate-fade-in border-zinc-800 bg-zinc-900/40">
                <CardHeader>
                  <f.icon className="mb-2 h-8 w-8 text-indigo-400" />
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
