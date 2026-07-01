import { applyRoomAction, getRoom } from "@/lib/rooms";
import { RoomAction } from "@/lib/room-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const room = getRoom(roomId);
  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
  return Response.json({ room });
}

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const action = (await request.json()) as RoomAction;
    const result = applyRoomAction(roomId, action);
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ room: result.room }, { status: result.status });
  } catch {
    return Response.json({ error: "Invalid room action" }, { status: 400 });
  }
}
