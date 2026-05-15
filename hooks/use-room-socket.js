"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket/client";

export function useRoomSocket(roomId) {
  const { getToken, userId: clerkId } = useAuth();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const joinedRef = useRef(false);
  const intentionalLeaveRef = useRef(false);

  const joinRoom = useCallback(async () => {
    const socket = getSocket();
    const token = await getToken();
    if (!token) return;

    if (!socket.connected) socket.connect();

    socket.emit("join-room", { roomId, token });
    joinedRef.current = true;
  }, [roomId, getToken]);

  const leaveRoom = useCallback(() => {
    intentionalLeaveRef.current = true;
    getSocket().emit("leave-room", { roomId });
    joinedRef.current = false;
  }, [roomId]);

  const closeRoom = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    intentionalLeaveRef.current = true;
    getSocket().emit("close-room", { roomId, token });
    joinedRef.current = false;
  }, [roomId, getToken]);

  useEffect(() => {
    intentionalLeaveRef.current = false;
    joinedRef.current = false;
    setMessages([]);
    setRoomClosed(false);

    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      joinRoom();
    };
    const onDisconnect = () => setConnected(false);
    const onMessage = (msg) =>
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    const onSystem = (payload) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          userId: "system",
          username: "System",
          content: payload.content,
          timestamp: Date.now(),
        },
      ]);
    };
    const onParticipants = (list) => setParticipants(list);
    const onJoined = (payload) => setParticipants(payload.participants);
    const onLeft = (payload) => setParticipants(payload.participants);
    const onTyping = (users) => setTypingUsers(users);
    const onMic = (payload) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === payload.userId ? { ...p, isMuted: payload.isMuted } : p
        )
      );
    };
    const onMute = (payload) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === payload.userId ? { ...p, isMuted: payload.isMuted } : p
        )
      );
    };
    const onClosed = (payload) => {
      setRoomClosed(true);
      toast.info(payload.reason);
    };
    const onError = (payload) => toast.error(payload.message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room-message", onMessage);
    socket.on("system-message", onSystem);
    socket.on("participants-update", onParticipants);
    socket.on("user-joined", onJoined);
    socket.on("user-left", onLeft);
    socket.on("typing-update", onTyping);
    socket.on("mic-state-change", onMic);
    socket.on("mute-user", onMute);
    socket.on("room-closed", onClosed);
    socket.on("error", onError);

    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-message", onMessage);
      socket.off("system-message", onSystem);
      socket.off("participants-update", onParticipants);
      socket.off("user-joined", onJoined);
      socket.off("user-left", onLeft);
      socket.off("typing-update", onTyping);
      socket.off("mic-state-change", onMic);
      socket.off("mute-user", onMute);
      socket.off("room-closed", onClosed);
      socket.off("error", onError);

      // Only explicit leave — reload uses disconnect grace period on server
      if (intentionalLeaveRef.current) {
        socket.emit("leave-room", { roomId });
      }
      joinedRef.current = false;
    };
  }, [roomId, joinRoom]);

  const sendMessage = useCallback(
    (content) => getSocket().emit("send-message", { roomId, content }),
    [roomId]
  );
  const startTyping = useCallback(() => getSocket().emit("typing", { roomId }), [roomId]);
  const stopTyping = useCallback(() => getSocket().emit("stop-typing", { roomId }), [roomId]);
  const setMicMuted = useCallback(
    (isMuted) => getSocket().emit("mic-state-change", { roomId, isMuted }),
    [roomId]
  );
  const muteParticipant = useCallback(
    (targetUserId, mute) =>
      getSocket().emit("mute-user", { roomId, targetUserId, mute }),
    [roomId]
  );

  return {
    messages,
    participants,
    typingUsers,
    connected,
    roomClosed,
    clerkId,
    sendMessage,
    startTyping,
    stopTyping,
    setMicMuted,
    muteParticipant,
    setParticipants,
    leaveRoom,
    closeRoom,
  };
}
