"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ConnectionState, RoomEvent } from "livekit-client";
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
  const { user } = useUser();
  const [closing, setClosing] = useState(false);
  const [systemMessages, setSystemMessages] = useState([]);

  const {
    messages,
    roomClosed,
    sendMessage,
    startTyping,
    stopTyping,
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

  const addSystemMessage = useCallback((content) => {
    setSystemMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: "system",
        content,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const allMessages = useMemo(() => {
    return [...systemMessages, ...messages].sort((a, b) => a.timestamp - b.timestamp);
  }, [systemMessages, messages]);

  useEffect(() => {
    if (!lkRoom) return;

    const handleParticipantConnected = (participant) => {
      const name = participant.name || "Someone";
      addSystemMessage(`${name} has joined the room`);
    };

    const handleParticipantDisconnected = (participant) => {
      const name = participant.name || "Someone";
      addSystemMessage(`${name} has left the room`);
    };

    lkRoom.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    lkRoom.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      lkRoom.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      lkRoom.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [lkRoom, addSystemMessage]);

  const participants = useMemo(() => {
    if (!lkRoom) return [];
    const lkParticipants = Array.from(lkRoom.participants.values());
    return [
      {
        userId: lkRoom.localParticipant.identity,
        clerkId: clerkId,
        username: user?.fullName || user?.username || "You",
        imageUrl: user?.imageUrl,
        role: isAdmin ? "admin" : "user",
        isMuted: lkRoom.localParticipant.isMicrophoneEnabled === false,
        isSpeaking: false,
      },
      ...lkParticipants.map((p) => ({
        userId: p.identity,
        clerkId: p.identity,
        username: p.name || "Participant",
        imageUrl: "",
        role: "user",
        isMuted: p.isMicrophoneEnabled === false,
        isSpeaking: false,
      })),
    ];
  }, [lkRoom, clerkId, user, isAdmin]);

  const speakingIds = useMemo(() => {
    if (!lkRoom) return new Set();
    return new Set(lkRoom.activeSpeakers.map((s) => s.identity));
  }, [lkRoom]);

  useEffect(() => {
    if (roomClosed) router.push("/dashboard");
  }, [roomClosed, router]);

  const handleToggleMute = async () => {
    await toggleMute();
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

  const activeUserId = currentUserId;

  if (connectionState === ConnectionState.Connecting) {
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
        <div className="hidden lg:block">
          <ParticipantSidebar
            participants={participants.map((p) => ({
              ...p,
              isSpeaking: speakingIds.has(p.userId),
            }))}
            currentUserId={activeUserId}
            isCreator={isCreator}
            isAdmin={isAdmin}
            onMuteUser={() => {}}
          />
        </div>
        <main className="flex flex-1 flex-col">
          <ChatPanel
            messages={allMessages}
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
