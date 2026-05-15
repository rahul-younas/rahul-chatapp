"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { RoomEvent } from "livekit-client";
import { DoorClosed } from "lucide-react";
import { toast } from "sonner";
import { useUserSync } from "@/hooks/use-user-sync";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { useLiveKit } from "@/hooks/use-livekit";
import { ParticipantSidebar } from "@/components/room/participant-sidebar";
import { ChatPanel } from "@/components/room/chat-panel";
import { MessageInput } from "@/components/room/message-input";
import { VoiceControls } from "@/components/room/voice-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function RoomClient({
  roomId,
  roomName,
  creatorId,
  currentUserId,
  isAdmin,
}) {
  useUserSync();
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [closing, setClosing] = useState(false);

  const {
    messages,
    participants,
    typingUsers,
    connected: socketConnected,
    roomClosed,
    sendMessage,
    startTyping,
    stopTyping,
    setMicMuted,
    muteParticipant,
    setParticipants,
    leaveRoom,
    closeRoom,
  } = useRoomSocket(roomId);

  const {
    room: lkRoom,
    connected: voiceConnected,
    isMuted,
    connectionState,
    toggleMute,
    reconnect,
  } = useLiveKit(roomId);

  const isCreator = creatorId === currentUserId;
  const canCloseRoom = isCreator || isAdmin;

  useEffect(() => {
    if (roomClosed) router.push("/dashboard");
  }, [roomClosed, router]);

  useEffect(() => {
    if (!lkRoom) return;
    const onSpeakers = (speakers) => {
      const speakingIds = new Set(speakers.map((s) => s.identity));
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, isSpeaking: speakingIds.has(p.userId) }))
      );
    };
    lkRoom.on(RoomEvent.ActiveSpeakersChanged, onSpeakers);
    return () => lkRoom.off(RoomEvent.ActiveSpeakersChanged, onSpeakers);
  }, [lkRoom, setParticipants]);

  const handleToggleMute = async () => {
    const muted = await toggleMute();
    if (typeof muted === "boolean") setMicMuted(muted);
  };

  const handleLeave = () => {
    leaveRoom();
    lkRoom?.disconnect();
    router.push("/dashboard");
  };

  const handleCloseRoom = async () => {
    if (!confirm("Close this room for everyone? Chat and voice will end.")) return;
    setClosing(true);
    try {
      await closeRoom();
      lkRoom?.disconnect();
      toast.success("Room closed");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to close room");
    } finally {
      setClosing(false);
    }
  };

  const myParticipant = useMemo(
    () => participants.find((p) => p.clerkId === clerkId),
    [participants, clerkId]
  );

  const activeUserId = myParticipant?.userId ?? currentUserId;

  if (!socketConnected && participants.length === 0 && !roomClosed) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
        <Skeleton className="h-12 w-full" />
        <div className="flex flex-1 gap-4">
          <Skeleton className="hidden w-64 lg:block" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-50">{roomName}</h1>
          <p className="text-xs text-zinc-500">Room ID: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{participants.length} online</Badge>
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

      <VoiceControls
        isMuted={isMuted}
        connected={voiceConnected}
        connectionState={connectionState}
        onToggleMute={handleToggleMute}
        onReconnect={reconnect}
        onLeave={handleLeave}
      />

      <div className="flex flex-1 overflow-hidden">
        <ParticipantSidebar
          participants={participants}
          currentUserId={activeUserId}
          isCreator={isCreator}
          isAdmin={isAdmin}
          onMuteUser={muteParticipant}
        />
        <main className="flex flex-1 flex-col">
          <ChatPanel
            messages={messages}
            typingUsers={typingUsers}
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
