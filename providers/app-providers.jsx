"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function AppProviders({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <TooltipProvider>
        {children}
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </TooltipProvider>
    </ClerkProvider>
  );
}
