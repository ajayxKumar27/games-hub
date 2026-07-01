"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Home, RotateCcw, Users } from "lucide-react";
import { Room, RoomAction, RpsChoice } from "@/lib/room-types";
import { useAppSelector } from "@/lib/store/hooks";

export function RoomClient({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { playerId, playerName } = useAppSelector((state) => state.preferences);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const opponent = useMemo(() => room?.players.find((player) => player.id !== playerId), [room, playerId]);

  async function send(action: RoomAction) {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Room action failed");
      return;
    }
    setRoom(data.room);
    setError("");
  }

  async function fetchRoom() {
    const response = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Room not found");
      setBusy(false);
      return;
    }
    setRoom(data.room);
    setBusy(false);
  }

  useEffect(() => {
    if (!playerId) return;
    window.setTimeout(() => {
      void send({ type: "join", playerId, name: playerName });
    }, 0);
    const interval = window.setInterval(() => {
      void fetchRoom();
      void send({ type: "heartbeat", playerId });
    }, 1200);
    const leave = () => navigator.sendBeacon?.(`/api/rooms/${roomId}`, JSON.stringify({ type: "leave", playerId }));
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, roomId]);

  if (busy) return <div className="rounded-lg border border-white/10 bg-white/8 p-8">Loading room...</div>;
  if (!room) return <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-8 text-red-100">{error}</div>;

  return (
    <div className="grid gap-5 pb-12 lg:grid-cols-[1fr_320px]">
      <section className="rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[.2em] text-cyan-200">Room {room.id}</p>
            <h1 className="mt-1 text-3xl font-black capitalize">{room.game.replaceAll("-", " ")}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard?.writeText(room.id)} className="icon-button" aria-label="Copy room code"><Copy size={18} /></button>
            <button onClick={() => send({ type: "rematch", playerId })} className="icon-button" aria-label="Rematch"><RotateCcw size={18} /></button>
            <Link href="/" className="icon-button" aria-label="Home"><Home size={18} /></Link>
          </div>
        </div>
        {room.game === "tic-tac-toe" && <TicTacToe room={room} playerId={playerId} send={send} />}
        {room.game === "connect-four" && <ConnectFour room={room} playerId={playerId} send={send} />}
        {room.game === "rps" && <Rps room={room} playerId={playerId} send={send} />}
        {error && <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      </section>
      <aside className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 font-bold"><Users size={18} />Players</div>
          {room.players.map((player) => (
            <div key={player.id} className="mb-3 rounded-md border border-white/10 bg-black/20 p-3 last:mb-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{player.name}{player.id === playerId ? " (you)" : ""}</span>
                <span className={player.connected ? "text-emerald-300" : "text-amber-300"}>{player.connected ? "online" : "away"}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-400"><span>Mark {player.mark}</span><span>{player.score} wins</span></div>
            </div>
          ))}
          {!opponent && <p className="mt-3 text-sm text-slate-400">Waiting for another player. Share code {room.id}.</p>}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
          <div className="mb-3 font-bold">Event Feed</div>
          {room.events.map((item) => <p key={item.id} className="border-b border-white/10 py-2 text-sm text-slate-300 last:border-0">{item.message}</p>)}
        </div>
      </aside>
    </div>
  );
}

function status(room: Room, playerId: string) {
  const me = room.players.find((player) => player.id === playerId);
  if (room.players.length < 2) return "Waiting for opponent";
  if (room.status === "finished") return "Round finished";
  return me ? `You are ${me.mark}` : "Spectating";
}

function TicTacToe({ room, playerId, send }: { room: Room; playerId: string; send: (action: RoomAction) => void }) {
  const state = room.state.ticTacToe;
  return (
    <GameFrame title={state.winner ? `Winner: ${state.winner}` : `Turn: ${state.turn}`} subtitle={status(room, playerId)}>
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
        {state.board.map((cell, index) => (
          <motion.button whileTap={{ scale: 0.94 }} key={index} onClick={() => send({ type: "ticTacToeMove", playerId, index })} className="aspect-square rounded-lg border border-white/10 bg-black/30 text-5xl font-black text-cyan-200 transition hover:bg-white/10">
            {cell}
          </motion.button>
        ))}
      </div>
    </GameFrame>
  );
}

function ConnectFour({ room, playerId, send }: { room: Room; playerId: string; send: (action: RoomAction) => void }) {
  const state = room.state.connectFour;
  return (
    <GameFrame title={state.winner ? `Winner: ${state.winner}` : `Turn: ${state.turn}`} subtitle={status(room, playerId)}>
      <div className="mx-auto max-w-2xl rounded-lg border border-cyan-300/20 bg-blue-950/50 p-3">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, column) => <button key={column} onClick={() => send({ type: "connectFourMove", playerId, column })} className="rounded-md bg-cyan-300/20 py-2 text-sm hover:bg-cyan-300/40">Drop</button>)}
          {state.board.flatMap((row, rowIndex) => row.map((cell, column) => (
            <div key={`${rowIndex}-${column}`} className="aspect-square rounded-full border border-white/10 bg-black/50 p-1">
              <div className={`size-full rounded-full ${cell === "X" ? "bg-cyan-300" : cell === "O" ? "bg-fuchsia-400" : "bg-slate-900"}`} />
            </div>
          )))}
        </div>
      </div>
    </GameFrame>
  );
}

function Rps({ room, playerId, send }: { room: Room; playerId: string; send: (action: RoomAction) => void }) {
  const state = room.state.rps;
  const choices: RpsChoice[] = ["rock", "paper", "scissors"];
  return (
    <GameFrame title={state.roundWinner ? "Round resolved" : `Round ${state.round}`} subtitle={status(room, playerId)}>
      <div className="grid gap-3 sm:grid-cols-3">
        {choices.map((choice) => (
          <motion.button whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} key={choice} onClick={() => send({ type: "rpsChoice", playerId, choice })} className="rounded-lg border border-white/10 bg-black/30 p-6 text-2xl font-black capitalize transition hover:bg-white/10">
            {choice}
          </motion.button>
        ))}
      </div>
      <p className="mt-5 text-center text-slate-300">
        {state.roundWinner === "draw" ? "Draw" : state.roundWinner ? `${room.players.find((player) => player.id === state.roundWinner)?.name} wins` : state.choices[playerId] ? "Choice locked. Waiting for opponent." : "Pick your move."}
      </p>
    </GameFrame>
  );
}

function GameFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="text-xl font-bold">{title}</div>
        <div className="text-sm text-slate-400">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}
