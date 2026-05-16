"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { sanitizeInput } from "@/lib/sanitize";

function mapSupabaseMessage(msg) {
  return {
    id: msg.id,
    userId: msg.user_id,
    username: msg.username,
    imageUrl: msg.image_url,
    content: msg.message,
    timestamp: new Date(msg.created_at).getTime(),
  };
}

export function useRoomSocket(roomId) {
  const { getToken, userId: clerkId } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(true);
  const [roomClosed, setRoomClosed] = useState(false);
  const channelRef = useRef(null);

  const normalizedRoomId = roomId?.toUpperCase();

  const fetchMessages = useCallback(async () => {
    if (!normalizedRoomId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", normalizedRoomId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return;
    }
    console.log("Fetched messages:", data);
    setMessages((data || []).map(mapSupabaseMessage));
  }, [normalizedRoomId]);

  const sendMessage = useCallback(
    async (content) => {
      if (!user || !normalizedRoomId) return;
      const sanitized = sanitizeInput(content);
      if (!sanitized) return;

      const { error } = await supabase.from("messages").insert({
        room_id: normalizedRoomId,
        user_id: user.id,
        username: user.fullName || user.username || "User",
        image_url: user.imageUrl,
        message: sanitized,
      });

      if (error) {
        toast.error("Failed to send message");
        console.error(error);
      }
    },
    [user, normalizedRoomId]
  );

  const startTyping = useCallback(() => {
  }, []);

  const stopTyping = useCallback(() => {
  }, []);

  const setMicMuted = useCallback(() => {
  }, []);

  const muteParticipant = useCallback(() => {
  }, []);

  const leaveRoom = useCallback(() => {
  }, [normalizedRoomId]);

  const closeRoom = useCallback(async () => {
  }, [normalizedRoomId, getToken]);

  useEffect(() => {
    if (!normalizedRoomId) return;

    fetchMessages();

    channelRef.current = supabase
      .channel(`room:${normalizedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${normalizedRoomId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const mapped = mapSupabaseMessage(payload.new);
            if (prev.some((m) => m.id === mapped.id)) return prev;
            return [...prev, mapped];
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [normalizedRoomId, fetchMessages]);

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
