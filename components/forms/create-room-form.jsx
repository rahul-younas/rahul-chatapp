"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createRoomSchema } from "@/lib/validators";
import { createRoomAction } from "@/actions/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateRoomForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { roomName: "", maxMembers: 10 },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();
    formData.set("roomName", data.roomName);
    formData.set("maxMembers", String(data.maxMembers));

    const result = await createRoomAction(formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Room created!");
    router.push(`/room/${result.roomId}`);
  };

  return (
    <Card className="mx-auto max-w-md border-zinc-800">
      <CardHeader>
        <CardTitle>Create a voice room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="roomName">Room name</Label>
            <Input id="roomName" {...register("roomName")} placeholder="Team standup" />
            {errors.roomName && (
              <p className="mt-1 text-xs text-red-400">{errors.roomName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="maxMembers">Max members</Label>
            <Input
              id="maxMembers"
              type="number"
              min={2}
              max={50}
              {...register("maxMembers")}
            />
            {errors.maxMembers && (
              <p className="mt-1 text-xs text-red-400">{errors.maxMembers.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create room"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
