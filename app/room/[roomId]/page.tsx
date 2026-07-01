import { RoomClient } from "@/components/room-client";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  return <RoomClient params={params} />;
}
