"use client";

import { Mic, MicOff, Volume2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ParticipantSidebar({
  participants,
  currentUserId,
  isCreator,
  isAdmin,
  onMuteUser,
}) {
  const canModerate = isCreator || isAdmin;

  return (
    <aside className="flex w-full flex-col border-r border-zinc-800 bg-zinc-950/50 lg:w-64">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-zinc-300">
          Participants — {participants.length}
        </h2>
      </div>
      <ScrollArea className="flex-1 p-3">
        <ul className="space-y-2">
          {participants.map((p) => (
            <li
              key={p.userId}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-900/80"
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.imageUrl} alt={p.username} />
                  <AvatarFallback>{p.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                {p.isSpeaking && !p.isMuted && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {p.username}
                  {p.userId === currentUserId && (
                    <span className="ml-1 text-xs text-zinc-500">(you)</span>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  {p.isMuted ? (
                    <MicOff className="h-3 w-3 text-red-400" />
                  ) : (
                    <Mic className="h-3 w-3 text-emerald-400" />
                  )}
                  {p.isSpeaking && !p.isMuted && (
                    <Volume2 className="h-3 w-3 animate-pulse text-indigo-400" />
                  )}
                  {p.role === "admin" && (
                    <Badge variant="default" className="ml-1 text-[10px]">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
              {canModerate && p.userId !== currentUserId && onMuteUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMuteUser(p.userId, !p.isMuted)}
                >
                  {p.isMuted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}

