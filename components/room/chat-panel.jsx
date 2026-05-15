"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel({ messages, typingUsers, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isSystem = msg.userId === "system";
            const isOwn = msg.userId === currentUserId;

            if (isSystem) {
              return (
                <p key={msg.id} className="text-center text-xs italic text-zinc-500">
                  {msg.content}
                </p>
              );
            }

            return (
              <div key={msg.id} className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={msg.imageUrl} />
                  <AvatarFallback>{msg.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={cn("max-w-[75%]", isOwn && "items-end")}>
                  <div className={cn("flex items-baseline gap-2", isOwn && "flex-row-reverse")}>
                    <span className="text-xs font-medium text-zinc-400">{msg.username}</span>
                    <span className="text-[10px] text-zinc-600">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 rounded-lg px-3 py-2 text-sm",
                      isOwn ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-100"
                    )}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      {typingUsers.length > 0 && (
        <p className="border-t border-zinc-800 px-4 py-2 text-xs text-zinc-500">
          {typingUsers.map((u) => u.username).join(", ")}{" "}
          {typingUsers.length === 1 ? "is" : "are"} typing...
        </p>
      )}
    </div>
  );
}

