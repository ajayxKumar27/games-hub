"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { recordScore, unlockAchievement } from "@/lib/store/preferencesSlice";

type GameKind = "runner" | "snake" | "flappy";

export function CanvasGame({ kind }: { kind: GameKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useAppDispatch();
  const high = useAppSelector((state) => state.preferences.scores[kind] ?? 0);
  const [score, setScore] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let active = true;
    let liveScore = 0;
    const controls = { left: false, right: false, up: false, down: false };

    const resize = () => {
      const parent = canvas.parentElement;
      const width = Math.min(parent?.clientWidth ?? 900, 980);
      canvas.width = width;
      canvas.height = Math.max(430, Math.min(560, Math.floor(width * 0.58)));
    };

    const end = () => {
      if (!active) return;
      active = false;
      cancelAnimationFrame(raf);
      setGameOver(true);
      dispatch(recordScore({ game: kind, score: Math.floor(liveScore) }));
      dispatch(unlockAchievement({ id: `${kind}-played`, label: `Played ${titleFor(kind)}` }));
    };

    resize();
    window.addEventListener("resize", resize);
    const down = (event: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) controls.left = true;
      if (["ArrowRight", "d", "D"].includes(event.key)) controls.right = true;
      if (["ArrowUp", " ", "w", "W"].includes(event.key)) controls.up = true;
      if (["ArrowDown", "s", "S"].includes(event.key)) controls.down = true;
    };
    const up = (event: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) controls.left = false;
      if (["ArrowRight", "d", "D"].includes(event.key)) controls.right = false;
      if (["ArrowUp", " ", "w", "W"].includes(event.key)) controls.up = false;
      if (["ArrowDown", "s", "S"].includes(event.key)) controls.down = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    canvas.addEventListener("pointerdown", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      controls.left = x < rect.width * 0.33;
      controls.right = x > rect.width * 0.66;
      controls.up = y < rect.height * 0.5;
      controls.down = y > rect.height * 0.5;
    });
    canvas.addEventListener("pointerup", () => {
      controls.left = false;
      controls.right = false;
      controls.up = false;
      controls.down = false;
    });

    if (kind === "runner") raf = runRunner(ctx, canvas, controls, (value) => { liveScore = value; setScore(Math.floor(value)); }, end);
    if (kind === "snake") raf = runSnake(ctx, canvas, controls, (value) => { liveScore = value; setScore(value); }, end);
    if (kind === "flappy") raf = runFlappy(ctx, canvas, controls, (value) => { liveScore = value; setScore(value); }, end);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [dispatch, kind, nonce]);

  return (
    <section className="pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[.2em] text-cyan-200">Single Player</p>
          <h1 className="text-3xl font-black">{titleFor(kind)}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="icon-button" aria-label="Back"><ArrowLeft size={18} /></Link>
          <button onClick={() => { setGameOver(false); setScore(0); setNonce((value) => value + 1); }} className="icon-button" aria-label="Restart"><RotateCcw size={18} /></button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="relative rounded-lg border border-white/10 bg-white/8 p-3 backdrop-blur-xl">
          <canvas ref={canvasRef} className="block w-full rounded-md bg-[#070816] touch-none" />
          {gameOver && (
            <div className="absolute inset-3 grid place-items-center rounded-md bg-black/70 backdrop-blur-sm">
              <div className="rounded-lg border border-red-300/30 bg-red-500/15 p-6 text-center">
                <div className="text-3xl font-black text-red-100">Game Over</div>
                <p className="mt-2 text-sm text-slate-300">Score saved locally. Press restart to play again.</p>
              </div>
            </div>
          )}
        </div>
        <aside className="rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Stat label="Score" value={score} />
            <Stat label="Best" value={Math.max(high, score)} />
          </div>
          <p className="text-sm leading-6 text-slate-300">{instructions(kind)}</p>
        </aside>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border border-white/10 bg-black/20 p-3"><div className="text-xs uppercase tracking-[.16em] text-slate-400">{label}</div><div className="text-2xl font-black text-cyan-200">{value}</div></div>;
}

function titleFor(kind: GameKind) {
  return kind === "runner" ? "Neon Runner" : kind === "snake" ? "Snake Circuit" : "Flappy Jet";
}

function instructions(kind: GameKind) {
  if (kind === "runner") return "Use left/right arrows or side taps to switch lanes. Avoid red obstacles as speed increases.";
  if (kind === "snake") return "Use arrow keys, WASD, or touch zones to steer. Walls wrap to the opposite side; only hitting yourself ends the run. More energy cells appear as levels increase.";
  return "Press space/up or tap to boost. Fly through gates and avoid the glowing pylons.";
}

function paintBackdrop(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#10143a");
  gradient.addColorStop(0.55, "#080a1d");
  gradient.addColorStop(1, "#15102c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(103,232,249,.22)";
  for (let x = 0; x < canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 120, canvas.height);
    ctx.stroke();
  }
}

function runRunner(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, controls: { left: boolean; right: boolean }, score: (value: number) => void, end: () => void) {
  let lane = 1;
  let cooldown = 0;
  let frame = 0;
  let speed = 4;
  const obstacles: { lane: number; y: number }[] = [];
  const loop = () => {
    frame++;
    if (cooldown-- <= 0) {
      if (controls.left) { lane = Math.max(0, lane - 1); cooldown = 12; }
      if (controls.right) { lane = Math.min(2, lane + 1); cooldown = 12; }
    }
    speed += 0.003;
    if (frame % Math.max(28, Math.floor(75 - speed * 5)) === 0) obstacles.push({ lane: Math.floor(Math.random() * 3), y: -45 });
    paintBackdrop(ctx, canvas);
    const laneWidth = canvas.width / 3;
    for (let i = 1; i < 3; i++) {
      ctx.fillStyle = "rgba(255,255,255,.08)";
      ctx.fillRect(i * laneWidth - 2, 0, 4, canvas.height);
    }
    const px = lane * laneWidth + laneWidth / 2;
    ctx.fillStyle = "#67e8f9";
    ctx.fillRect(px - 20, canvas.height - 76, 40, 56);
    obstacles.forEach((obstacle) => {
      obstacle.y += speed;
      const x = obstacle.lane * laneWidth + laneWidth / 2;
      ctx.fillStyle = "#fb7185";
      ctx.fillRect(x - 26, obstacle.y, 52, 38);
      if (obstacle.lane === lane && obstacle.y > canvas.height - 110 && obstacle.y < canvas.height - 20) end();
    });
    score(frame / 4);
    return requestAnimationFrame(loop);
  };
  return loop();
}

function runSnake(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, controls: { left: boolean; right: boolean; up: boolean; down: boolean }, score: (value: number) => void, end: () => void) {
  const cells = 22;
  let snake = [{ x: 10, y: 10 }];
  let dir = { x: 1, y: 0 };
  let nextDir = dir;
  const foods = [{ x: 14, y: 10 }];
  let last = 0;
  let points = 0;

  const placeFood = () => {
    let dot = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
    while (snake.some((part) => part.x === dot.x && part.y === dot.y) || foods.some((food) => food.x === dot.x && food.y === dot.y)) {
      dot = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
    }
    return dot;
  };

  const loop = (time = 0) => {
    const level = Math.floor(points / 50) + 1;
    const tickMs = Math.max(82, 185 - level * 12);
    if (time - last > tickMs) {
      last = time;
      if (controls.left && dir.x !== 1) nextDir = { x: -1, y: 0 };
      if (controls.right && dir.x !== -1) nextDir = { x: 1, y: 0 };
      if (controls.up && dir.y !== 1) nextDir = { x: 0, y: -1 };
      if (controls.down && dir.y !== -1) nextDir = { x: 0, y: 1 };
      dir = nextDir;

      const head = {
        x: (snake[0].x + dir.x + cells) % cells,
        y: (snake[0].y + dir.y + cells) % cells,
      };
      const eatenIndex = foods.findIndex((food) => food.x === head.x && food.y === head.y);
      const nextSnake = [head, ...snake];
      if (eatenIndex === -1) nextSnake.pop();

      if (nextSnake.slice(1).some((part) => part.x === head.x && part.y === head.y)) {
        end();
        return 0;
      }

      snake = nextSnake;
      if (eatenIndex !== -1) {
        points += 10;
        foods.splice(eatenIndex, 1);
        const targetFoodCount = Math.min(5, Math.floor(points / 60) + 1);
        while (foods.length < targetFoodCount) foods.push(placeFood());
      }
      score(points);
    }
    paintBackdrop(ctx, canvas);
    const size = Math.min(canvas.width, canvas.height) / cells;
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.font = "700 16px sans-serif";
    ctx.fillText(`Level ${Math.floor(points / 50) + 1}`, 14, 24);
    ctx.fillStyle = "#67e8f9";
    snake.forEach((part) => ctx.fillRect(part.x * size, part.y * size, size - 2, size - 2));
    ctx.fillStyle = "#facc15";
    foods.forEach((food) => ctx.fillRect(food.x * size, food.y * size, size - 2, size - 2));
    return requestAnimationFrame(loop);
  };
  return loop();
}

function runFlappy(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, controls: { up: boolean }, score: (value: number) => void, end: () => void) {
  let y = canvas.height / 2;
  let velocity = 0;
  let frame = 0;
  let points = 0;
  const pipes: { x: number; gap: number; scored?: boolean }[] = [{ x: canvas.width, gap: 190 }];
  const loop = () => {
    frame++;
    velocity += 0.32;
    if (controls.up) velocity = -6;
    y += velocity;
    if (frame % 110 === 0) pipes.push({ x: canvas.width + 40, gap: 100 + Math.random() * (canvas.height - 240) });
    paintBackdrop(ctx, canvas);
    ctx.fillStyle = "#67e8f9";
    ctx.beginPath();
    ctx.arc(90, y, 18, 0, Math.PI * 2);
    ctx.fill();
    pipes.forEach((pipe) => {
      pipe.x -= 3.2;
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(pipe.x, 0, 58, pipe.gap - 72);
      ctx.fillRect(pipe.x, pipe.gap + 72, 58, canvas.height);
      if (pipe.x < 90 && pipe.x + 58 > 72 && (y < pipe.gap - 72 || y > pipe.gap + 72)) end();
      if (!pipe.scored && pipe.x + 58 < 72) {
        pipe.scored = true;
        points += 1;
        score(points);
      }
    });
    if (y < 0 || y > canvas.height) end();
    return requestAnimationFrame(loop);
  };
  return loop();
}
