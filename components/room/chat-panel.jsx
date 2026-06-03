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
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-900/30">
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.map((msg) => {
            const isSystem = msg.userId === "system";
            const isOwn = msg.userId === currentUserId;

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <span className="inline-flex items-center rounded-full bg-zinc-800/80 px-4 py-1 text-xs font-medium text-zinc-300">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  isOwn ? "justify-end flex-row-reverse" : "justify-start flex-row"
                )}
              >
                <Avatar
                  className={cn(
                    "h-8 w-8 shrink-0",
                    isOwn && "hidden sm:flex"
                  )}
                >
                  <AvatarImage src={msg.imageUrl} />
                  <AvatarFallback>{msg.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col max-w-[80%] sm:max-w-[60%]",
                    isOwn && "items-end"
                  )}
                >
                  {!isOwn && (
                    <span className="mb-1 ml-1 text-xs font-medium text-zinc-400">
                      {msg.username}
                    </span>
                  )}

                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm",
                      isOwn
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                    )}
                  >
                    <p className="break-words">{msg.content}</p>
                    <span
                      className={cn(
                        "mt-1 flex justify-end text-[10px]",
                        isOwn ? "text-emerald-200" : "text-zinc-400"
                      )}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      {typingUsers && typingUsers.filter(u => u.userId !== currentUserId).length > 0 && (
        <div className="border-t border-zinc-800 bg-zinc-950/80 px-4 py-2">
          <p className="text-xs text-zinc-500">
            {typingUsers.filter(u => u.userId !== currentUserId).map((u) => u.username).join(", ")}{" "}
            {typingUsers.filter(u => u.userId !== currentUserId).length === 1 ? "is" : "are"} typing...
          </p>
        </div>
      )}
    </div>
  );
}

