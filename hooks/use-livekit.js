"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, ConnectionState } from "livekit-client";

export function useLiveKit(roomId) {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionState, setConnectionState] = useState(ConnectionState.Disconnected);
  const [error, setError] = useState(null);
  const roomRef = useRef(null);

  const connect = useCallback(async () => {
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (!res.ok) throw new Error("Failed to get voice token");

      const { token, serverUrl } = await res.json();
      const lkRoom = new Room({ adaptiveStream: true, dynacast: true });

      lkRoom.on(RoomEvent.ConnectionStateChanged, setConnectionState);
      lkRoom.on(RoomEvent.Disconnected, () => setConnected(false));
      lkRoom.on(RoomEvent.Reconnected, () => {
        setConnected(true);
        setError(null);
      });

      await lkRoom.connect(serverUrl, token);
      await lkRoom.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = lkRoom;
      setRoom(lkRoom);
      setConnected(true);
      setIsMuted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice connection failed");
    }
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => {
      roomRef.current?.disconnect();
    };
  }, [connect]);

  const toggleMute = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (!lkRoom) return;
    const enabled = lkRoom.localParticipant.isMicrophoneEnabled;
    await lkRoom.localParticipant.setMicrophoneEnabled(!enabled);
    setIsMuted(enabled);
    return !enabled;
  }, []);

  return {
    room,
    connected,
    isMuted,
    connectionState,
    error,
    toggleMute,
    reconnect: connect,
  };
}
