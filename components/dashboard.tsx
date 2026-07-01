"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Copy, Dices, Gamepad2, Joystick, Play, Sparkles, Trophy } from "lucide-react";
import { games, multiplayerGames } from "@/lib/games";
import { MultiplayerGame } from "@/lib/room-types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setFavoriteCategory, unlockAchievement } from "@/lib/store/preferencesSlice";

const categories = ["All", "Multiplayer", "Arcade", "Classic"];

export function Dashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { playerId, playerName, favoriteCategory, scores, achievements } = useAppSelector((state) => state.preferences);
  const [game, setGame] = useState<MultiplayerGame>("tic-tac-toe");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const visibleGames = useMemo(
    () => games.filter((item) => favoriteCategory === "All" || item.category === favoriteCategory),
    [favoriteCategory],
  );

  async function createRoom() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, playerId, name: playerName }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "Could not create room");
    dispatch(unlockAchievement({ id: "host", label: "Opened a multiplayer room" }));
    router.push(`/room/${data.room.id}`);
  }

  function joinRoom(event: FormEvent) {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code) router.push(`/room/${code}`);
  }

  return (
    <div className="space-y-10 pb-12">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-lg border border-white/10 bg-white/8 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-cyan-200"><Sparkles size={18} />Local profile, local scores, live in-memory rooms</div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">Professional dark-mode Gaming Hub</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Launch arcade games, track local progress, create multiplayer rooms, share codes, and play turn-synced games through Next.js Route Handlers.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[["6", "Playable games"], ["3", "Room games"], [achievements.length.toString(), "Achievements"]].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-3xl font-black text-cyan-300">{value}</div>
                <div className="text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div id="lobby" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 font-semibold"><Dices size={20} />Multiplayer Lobby</div>
          <label className="text-xs uppercase tracking-[.18em] text-slate-400">Game</label>
          <select value={game} onChange={(event) => setGame(event.target.value as MultiplayerGame)} className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-white outline-none">
            {multiplayerGames.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <button disabled={loading} onClick={createRoom} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-bold text-black transition hover:bg-white disabled:opacity-50">
            <Play size={18} />{loading ? "Creating..." : "Create Room"}
          </button>
          <form onSubmit={joinRoom} className="mt-5">
            <label className="text-xs uppercase tracking-[.18em] text-slate-400">Join code</label>
            <div className="mt-2 flex gap-2">
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="ABC123" className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-3 font-mono uppercase outline-none" />
              <button className="rounded-md border border-white/10 px-4 transition hover:bg-white/10" aria-label="Join room"><ArrowRight size={20} /></button>
            </div>
          </form>
          {error && <p className="mt-3 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          <div className="mt-5 rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
            Rooms are stored in server memory, so they reset when a serverless instance cold-starts or the local dev server restarts.
          </div>
        </motion.div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Game Library</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button key={category} onClick={() => dispatch(setFavoriteCategory(category))} className={`rounded-md border px-3 py-2 text-sm transition ${favoriteCategory === category ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -5 }}>
              <Link href={item.href} className="group block h-full rounded-lg border border-white/10 bg-white/8 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
                <div className={`mb-5 grid size-12 place-items-center rounded-md bg-gradient-to-br ${item.accent} text-black`}><Gamepad2 /></div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300">{item.stats}</span>
                </div>
                <p className="mt-3 min-h-16 text-sm leading-6 text-slate-300">{item.description}</p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-cyan-200">{item.category}</span>
                  <span className="flex items-center gap-1 text-slate-400 transition group-hover:text-white">Launch <ArrowRight size={15} /></span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="leaderboards" className="grid gap-5 lg:grid-cols-2">
        <Panel title="Local Leaderboards" icon={<Trophy size={20} />}>
          {["runner", "snake", "flappy"].map((key) => (
            <div key={key} className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
              <span className="capitalize text-slate-300">{key}</span>
              <span className="font-mono text-cyan-200">{scores[key] ?? 0}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Achievements" icon={<Joystick size={20} />}>
          {achievements.length === 0 ? <p className="text-slate-400">Play a game or create a room to unlock achievements.</p> : achievements.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0">
              <Copy size={16} className="text-cyan-200" />
              <span>{item.label}</span>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2 font-bold">{icon}{title}</div>
      {children}
    </div>
  );
}
