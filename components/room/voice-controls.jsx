"use client";

import { Mic, MicOff, PhoneOff, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionState } from "livekit-client";

export function VoiceControls({
  isMuted,
  connected,
  connectionState,
  onToggleMute,
  onReconnect,
  onLeave,
}) {
  const isReconnecting = connectionState === ConnectionState.Reconnecting;

  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 py-2">
      <Badge variant={connected ? "success" : "destructive"} className="gap-1">
        {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isReconnecting ? "Reconnecting" : connected ? "Voice connected" : "Voice disconnected"}
      </Badge>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={onToggleMute}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        {!connected && (
          <Button variant="outline" size="icon" onClick={onReconnect}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button variant="destructive" size="icon" onClick={onLeave}>
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
