"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { joinRoomSchema } from "@/lib/validators";
import { joinRoomAction } from "@/actions/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JoinRoomForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: { roomId: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();
    formData.set("roomId", data.roomId.toUpperCase());

    const result = await joinRoomAction(formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    router.push(`/room/${result.roomId}`);
  };

  return (
    <Card className="mx-auto max-w-md border-zinc-800">
      <CardHeader>
        <CardTitle>Join a voice room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              {...register("roomId")}
              placeholder="ABCD1234"
              className="uppercase"
            />
            {errors.roomId && (
              <p className="mt-1 text-xs text-red-400">{errors.roomId.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Joining..." : "Join room"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
