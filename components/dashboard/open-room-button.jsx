"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { reopenRoomAction } from "@/actions/room";
import { Button } from "@/components/ui/button";

export function OpenRoomButton({ roomId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    const result = await reopenRoomAction(roomId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      router.refresh();
      return;
    }

    router.push(`/room/${result.roomId}`);
    router.refresh();
  };

  return (
    <Button size="sm" onClick={handleOpen} disabled={loading}>
      {loading ? "Opening..." : "Open"}
    </Button>
  );
}
