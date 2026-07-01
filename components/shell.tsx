"use client";

import Link from "next/link";
import { Gamepad2, Home, Trophy, UserRound } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setPlayerName } from "@/lib/store/preferencesSlice";

export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { playerName } = useAppSelector((state) => state.preferences);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070816] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(0,229,255,.26),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(255,70,190,.22),transparent_30%),linear-gradient(135deg,#070816,#111827_45%,#020617)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <nav className="sticky top-4 z-40 mb-6 flex items-center justify-between rounded-lg border border-white/10 bg-white/8 px-4 py-3 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-10 place-items-center rounded-md bg-cyan-400 text-black"><Gamepad2 size={22} /></span>
            <span className="hidden sm:block">Nexus Arcade</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Link className="nav-pill" href="/"><Home size={16} />Home</Link>
            <Link className="nav-pill" href="/#leaderboards"><Trophy size={16} />Boards</Link>
            <label className="hidden items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 md:flex">
              <UserRound size={16} />
              <input
                value={playerName}
                onChange={(event) => dispatch(setPlayerName(event.target.value))}
                className="w-32 bg-transparent text-white outline-none"
                aria-label="Player name"
              />
            </label>
          </div>
        </nav>
        {children}
      </div>
    </main>
  );
}
