"use client";

import { useState } from "react";
import { toast } from "sonner";
import { banUserAction, updateUserRoleAction, deleteRoomAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export function AdminDashboard({ users, rooms }) {
  const [loading, setLoading] = useState(null);

  async function handleBan(userId, banned) {
    setLoading(`ban-${userId}`);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("banned", String(banned));
    const r = await banUserAction(fd);
    setLoading(null);
    if (r.error) toast.error(r.error);
    else toast.success(banned ? "User banned" : "User unbanned");
  }

  async function handleRole(userId, role) {
    setLoading(`role-${userId}`);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", role);
    const r = await updateUserRoleAction(fd);
    setLoading(null);
    if (r.error) toast.error(r.error);
    else toast.success(`Role updated to ${role}`);
  }

  async function handleCloseRoom(roomId) {
    if (!confirm(`Close room ${roomId} for everyone?`)) return;
    setLoading(`room-${roomId}`);
    const fd = new FormData();
    fd.set("roomId", roomId);
    const r = await deleteRoomAction(fd);
    setLoading(null);
    if (r.error) toast.error(r.error);
    else toast.success("Room closed");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[500px] space-y-3 overflow-y-auto">
          {users.map((u) => (
            <div
              key={String(u._id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 p-3"
            >
              <div>
                <p className="font-medium text-zinc-100">{u.username}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
                <div className="mt-1 flex gap-1">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                  {u.isBanned && <Badge variant="destructive">Banned</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!loading}
                  onClick={() => handleBan(String(u._id), !u.isBanned)}
                >
                  {u.isBanned ? "Unban" : "Ban"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!!loading}
                  onClick={() =>
                    handleRole(String(u._id), u.role === "admin" ? "user" : "admin")
                  }
                >
                  {u.role === "admin" ? "Demote" : "Promote"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle>Active Rooms ({rooms.length})</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[500px] space-y-3 overflow-y-auto">
          {rooms.length === 0 ? (
            <p className="text-sm text-zinc-500">No active rooms</p>
          ) : (
            rooms.map((room) => (
              <div
                key={room.roomId}
                className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
              >
                <div>
                  <p className="font-medium text-zinc-100">{room.roomName}</p>
                  <p className="text-xs text-zinc-500">
                    ID: {room.roomId} · {room.activeUsers?.length ?? 0}/{room.maxMembers} users
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!!loading}
                  onClick={() => handleCloseRoom(room.roomId)}
                >
                  Close room
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
