"use client";

import { useUserSync } from "@/hooks/use-user-sync";

export function UserSync() {
  useUserSync();
  return null;
}
