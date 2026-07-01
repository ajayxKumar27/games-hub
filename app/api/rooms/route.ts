import { createRoom } from "@/lib/rooms";
import { MultiplayerGame } from "@/lib/room-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validGames = new Set(["tic-tac-toe", "connect-four", "rps"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { game?: MultiplayerGame; playerId?: string; name?: string };
    if (!body.game || !validGames.has(body.game)) return Response.json({ error: "Invalid game" }, { status: 400 });
    if (!body.playerId || !body.name) return Response.json({ error: "Missing player" }, { status: 400 });
    return Response.json({ room: createRoom(body.game, body.playerId, body.name) }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
