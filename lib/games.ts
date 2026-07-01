export type GameId = "tic-tac-toe" | "connect-four" | "rps" | "runner" | "snake" | "flappy";

export type GameCategory = "Multiplayer" | "Arcade" | "Classic";

export type GameMeta = {
  id: GameId;
  title: string;
  category: GameCategory;
  mode: "multiplayer" | "single";
  href: string;
  description: string;
  accent: string;
  stats: string;
};

export const games: GameMeta[] = [
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    category: "Multiplayer",
    mode: "multiplayer",
    href: "/#lobby",
    description: "Fast room-based duels with turn sync, rematches, and win detection.",
    accent: "from-cyan-400 to-blue-600",
    stats: "2 players",
  },
  {
    id: "connect-four",
    title: "Connect Four",
    category: "Multiplayer",
    mode: "multiplayer",
    href: "/#lobby",
    description: "Drop discs into a live shared board and connect four before your rival.",
    accent: "from-amber-300 to-orange-600",
    stats: "7 x 6 grid",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    category: "Multiplayer",
    mode: "multiplayer",
    href: "/#lobby",
    description: "Room matchmaking with hidden choices and instant round resolution.",
    accent: "from-fuchsia-400 to-rose-600",
    stats: "Best reflexes",
  },
  {
    id: "runner",
    title: "Neon Runner",
    category: "Arcade",
    mode: "single",
    href: "/games/runner",
    description: "Subway Surfers-inspired lane runner with canvas obstacles and scaling speed.",
    accent: "from-lime-300 to-emerald-600",
    stats: "Canvas",
  },
  {
    id: "snake",
    title: "Snake Circuit",
    category: "Classic",
    mode: "single",
    href: "/games/snake",
    description: "Grid classic with saved local high score and responsive controls.",
    accent: "from-green-300 to-teal-600",
    stats: "High score",
  },
  {
    id: "flappy",
    title: "Flappy Jet",
    category: "Arcade",
    mode: "single",
    href: "/games/flappy",
    description: "Physics-based flight through moving gates with local score tracking.",
    accent: "from-sky-300 to-indigo-600",
    stats: "Physics",
  },
];

export const multiplayerGames = games.filter((game) => game.mode === "multiplayer");
