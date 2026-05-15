"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageInput({ onSend, onTyping, onStopTyping, disabled }) {
  const [value, setValue] = useState("");
  const typingTimeout = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    onStopTyping();
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    onTyping();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(onStopTyping, 2000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t border-zinc-800 bg-zinc-950/80 p-4"
    >
      <Input
        value={value}
        onChange={handleChange}
        placeholder="Message the room..."
        disabled={disabled}
        maxLength={500}
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={disabled || !value.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
