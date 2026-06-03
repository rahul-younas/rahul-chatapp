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

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage = {
        id: tempId,
        userId: user.id,
        username: user.fullName || user.username || "User",
        imageUrl: user.imageUrl,
        content: sanitized,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          room_id: normalizedRoomId,
          user_id: user.id,
          username: user.fullName || user.username || "User",
          image_url: user.imageUrl,
          message: sanitized,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to send message");
        console.error(error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else if (data) {
        const actualMessage = mapSupabaseMessage(data);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? actualMessage : m))
        );

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: actualMessage,
          });
        }
      }
    },
    [user, normalizedRoomId]
  );

  const startTyping = useCallback(async () => {
    if (!channelRef.current || !user) return;
    await channelRef.current.track({
      user_id: user.id,
      username: user.fullName || user.username || "User",
      image_url: user.imageUrl,
      isTyping: true,
    });
  }, [user]);

  const stopTyping = useCallback(async () => {
    if (!channelRef.current || !user) return;
    await channelRef.current.track({
      user_id: user.id,
      username: user.fullName || user.username || "User",
      image_url: user.imageUrl,
      isTyping: false,
    });
  }, [user]);

  const leaveRoom = useCallback(() => {
  }, [normalizedRoomId]);

  const closeRoom = useCallback(async () => {
  }, [normalizedRoomId, getToken]);

  useEffect(() => {
    if (!normalizedRoomId || !user) return;

    fetchMessages();

    const channel = supabase.channel(`room:${normalizedRoomId}`, {
      config: { presence: { key: user.id } },
    });

    channel
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
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing = [];
        const parts = [];

        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            parts.push({
              userId: presence.user_id,
              username: presence.username,
              imageUrl: presence.image_url,
            });
            if (presence.isTyping && presence.user_id !== user.id) {
              typing.push({
                userId: presence.user_id,
                username: presence.username,
              });
            }
          });
        });

        // remove duplicates
        const uniqueTyping = Array.from(new Map(typing.map((item) => [item.userId, item])).values());
        const uniqueParts = Array.from(new Map(parts.map((item) => [item.userId, item])).values());

        setTypingUsers(uniqueTyping);
        setParticipants(uniqueParts);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        newPresences.forEach((presence) => {
          if (presence.user_id !== user.id) {
            setMessages((prev) => [
              ...prev,
              {
                id: `join-${presence.user_id}-${Date.now()}-${Math.random()}`,
                userId: "system",
                content: `${presence.username} joined the room`,
                timestamp: Date.now(),
              },
            ]);
          }
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        leftPresences.forEach((presence) => {
          if (presence.user_id !== user.id) {
            setMessages((prev) => [
              ...prev,
              {
                id: `leave-${presence.user_id}-${Date.now()}-${Math.random()}`,
                userId: "system",
                content: `${presence.username} left the room`,
                timestamp: Date.now(),
              },
            ]);
          }
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            username: user.fullName || user.username || "User",
            image_url: user.imageUrl,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [normalizedRoomId, fetchMessages, user]);

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
    setParticipants,
    leaveRoom,
    closeRoom,
  };
}
