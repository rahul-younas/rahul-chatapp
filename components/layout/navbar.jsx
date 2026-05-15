"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Headphones, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar({ isAdmin }) {
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <span className="hidden sm:inline">VoiceHub</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
