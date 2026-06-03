"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { DoorClosed, Copy } from "lucide-react";
import { toast } from "sonner";
import { useUserSync } from "@/hooks/use-user-sync";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { ParticipantSidebar } from "@/components/room/participant-sidebar";
import { ChatPanel } from "@/components/room/chat-panel";
import { MessageInput } from "@/components/room/message-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RoomClient({
  roomId,
  roomName,
  creatorId,
  currentUserId,
  isAdmin,
}) {
  useUserSync();
  const router = useRouter();
  const { user } = useUser();
  const [closing, setClosing] = useState(false);

  const {
    messages,
    roomClosed,
    sendMessage,
    startTyping,
    stopTyping,
    leaveRoom,
    closeRoom,
  } = useRoomSocket(roomId);

  const isCreator = creatorId === currentUserId;
  const canCloseRoom = isCreator || isAdmin;

  const participants = [
    {
      userId: currentUserId,
      username: user?.fullName || user?.username || "You",
      imageUrl: user?.imageUrl,
      role: isAdmin ? "admin" : "user",
    },
  ];

  useEffect(() => {
    if (roomClosed) router.push("/dashboard");
  }, [roomClosed, router]);

  const handleLeave = () => {
    leaveRoom();
    router.push("/dashboard");
  };

  const handleCloseRoom = async () => {
    if (!confirm("Close this room for everyone?")) return;
    setClosing(true);
    try {
      await closeRoom();
      toast.success("Room closed");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to close room");
    } finally {
      setClosing(false);
    }
  };

  const activeUserId = currentUserId;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-50">{roomName}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
            <p>Room ID: {roomId}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-zinc-500 hover:text-zinc-300"
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                toast.success("Room ID copied to clipboard");
              }}
              title="Copy Room ID"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{participants.length} online</Badge>
          {!canCloseRoom && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLeave}
            >
              Leave room
            </Button>
          )}
          {canCloseRoom && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCloseRoom}
              disabled={closing}
            >
              <DoorClosed className="mr-1 h-4 w-4" />
              Close room
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <ParticipantSidebar
            participants={participants}
            currentUserId={activeUserId}
            isAdmin={isAdmin}
          />
        </div>
        <main className="flex flex-1 flex-col">
          <ChatPanel
            messages={messages}
            typingUsers={[]}
            currentUserId={activeUserId}
          />
          <MessageInput
            onSend={sendMessage}
            onTyping={startTyping}
            onStopTyping={stopTyping}
            disabled={roomClosed}
          />
        </main>
      </div>
    </div>
  );
}
