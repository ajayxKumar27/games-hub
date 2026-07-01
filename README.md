# Nexus Arcade Gaming Hub

A complete self-contained gaming portal built with Next.js App Router, TypeScript, Tailwind CSS, Redux Toolkit, Framer Motion, Local Storage, and in-memory Route Handler state.

## Features

- Modern responsive dark gaming dashboard with glass panels, animated cards, categories, profile controls, local leaderboards, and achievements.
- Multiplayer rooms at `/room/[roomId]` with create, join, share code, turn synchronization, rematches, room validation, heartbeat sync, and disconnect status.
- Route Handlers under `app/api/rooms` manage all multiplayer communication without an external database.
- Multiplayer games: Tic Tac Toe, Connect Four, and Rock Paper Scissors.
- Single-player canvas games: Neon Runner, Snake Circuit, and Flappy Jet.
- Redux Toolkit stores profile, preferences, local high scores, and achievements, persisted to Local Storage.

## Project Structure

- `app/page.tsx` - dashboard entry.
- `app/room/[roomId]/page.tsx` - dynamic multiplayer room route.
- `app/games/*/page.tsx` - single-player canvas game routes.
- `app/api/rooms/route.ts` - room creation endpoint.
- `app/api/rooms/[roomId]/route.ts` - room read and action endpoint.
- `components/` - reusable shell, dashboard, room, and game UI.
- `lib/rooms.ts` - in-memory multiplayer room engine and game rules.
- `lib/store/` - Redux Toolkit store and local preference slice.

## Implementation Steps

1. Install dependencies with `npm install`.
2. Run `npm run dev`.
3. Open `http://localhost:3000`.
4. Edit the player name in the top navigation.
5. Create a multiplayer room from the lobby, copy the room code, and open the same URL in another browser/profile to join as player two.
6. Launch the single-player games from the game library. Scores persist locally in the browser.

## Multiplayer Architecture

Rooms live in a process-level `Map` stored on `globalThis`. Clients call Route Handlers with short polling and actions:

- `POST /api/rooms` creates a room.
- `GET /api/rooms/[roomId]` returns the current room state.
- `POST /api/rooms/[roomId]` applies joins, heartbeats, moves, rematches, and leaves.

This is intentionally database-free. On Vercel or other serverless hosting, in-memory rooms are ephemeral and may reset across cold starts or scale-out instances. For durable rooms, an external realtime backend would normally be required, but this project follows the no-external-database requirement.

## Vercel Deployment

1. Push the repository to GitHub.
2. Import it in Vercel.
3. Keep the default framework preset: Next.js.
4. Build command: `npm run build`.
5. Output directory: `.next`.
6. Deploy.

For stable multiplayer rooms in production, prefer a single long-lived Node process or sticky sessions. The app itself does not require MongoDB, PostgreSQL, Firebase, Supabase, or any other database.
