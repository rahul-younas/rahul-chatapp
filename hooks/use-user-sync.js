"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function useUserSync() {
  const { isSignedIn, isLoaded } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || synced.current) return;
    synced.current = true;
    fetch("/api/users/sync", { method: "POST" }).catch(() => {
      synced.current = false;
    });
  }, [isLoaded, isSignedIn]);
}
