import { JoinRoomForm } from "@/components/forms/join-room-form";

export const metadata = { title: "Join Room — VoiceHub" };

export default function JoinRoomPage() {
  return (
    <div className="px-4 py-10 sm:px-6">
      <JoinRoomForm />
    </div>
  );
}
