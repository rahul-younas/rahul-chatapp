import { CreateRoomForm } from "@/components/forms/create-room-form";

export const metadata = { title: "Create Room — VoiceHub" };

export default function CreateRoomPage() {
  return (
    <div className="px-4 py-10 sm:px-6">
      <CreateRoomForm />
    </div>
  );
}
