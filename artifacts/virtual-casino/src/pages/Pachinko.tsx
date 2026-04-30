import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

// Symmetric bucket multipliers across the bottom of the tray.
// Highest payouts at the edges, big "0" smack in the middle.
const BUCKETS = [50, 10, 4, 2, 0.4, 0, 0.4, 2, 4, 10, 50];

const ANTES = [5, 10, 25, 100];

const WIDTH = 360;
const HEIGHT = 460;
const PEG_R = 4;
const BALL_R = 7;
const ROWS = 10;

interface Peg {
  x: number;
  y: number;
}

// Pre-compute pegs once at module load.
function buildPegs(): Peg[] {
  const pegs: Peg[] = [];
  const topY = 60;
  const rowGap = 32;
  const colGap = 28;
  for (let r = 0; r < ROWS; r++) {
    const y = topY + r * rowGap;
    const offset = r % 2 === 0 ? 0 : colGap / 2;
    const cols = r % 2 === 0 ? 11 : 10;
    const startX = (WIDTH - (cols - 1) * colGap) / 2 + offset;
    for (let c = 0; c < cols; c++) {
      pegs.push({ x: startX + c * colGap, y });
    }
  }
  return pegs;
}

const PEGS = buildPegs();

const BUCKET_TOP = HEIGHT - 60;
const BUCKET_W = WIDTH / BUCKETS.length;

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  done: boolean;
}

export default function Pachinko() {
  const { balance, placeBet } = useCasinoStore();
  const [ante, setAnte] = useState(10);
  const [running, setRunning] = useState(false);
  const [ball, setBall] = useState<BallState | null>(null);
  const [result, setResult] = useState<{ bucket: number; mult: number } | null>(
    null,
  );
  const [history, setHistory] = useState<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const ballRef = useRef<BallState | null>(null);

  const drop = () => {
    if (running || balance < ante) return;
    const startX = WIDTH / 2 + (Math.random() - 0.5) * 8;
    const initial: BallState = { x: startX, y: 14, vx: 0, vy: 0, done: false };
    ballRef.current = initial;
    setBall(initial);
    setResult(null);
    setRunning(true);
    playSound("chip");
  };

  const reset = () => {
    setBall(null);
    setResult(null);
    ballRef.current = null;
  };

  // Physics loop
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const b = ballRef.current;
      if (!b || b.done) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const gravity = 700;
      b.vy += gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // Wall collision
      if (b.x < BALL_R) {
        b.x = BALL_R;
        b.vx = -b.vx * 0.6;
      }
      if (b.x > WIDTH - BALL_R) {
        b.x = WIDTH - BALL_R;
        b.vx = -b.vx * 0.6;
      }
      // Peg collisions
      for (const p of PEGS) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const min = PEG_R + BALL_R;
        if (d < min) {
          // Resolve overlap
          const nx = dx / (d || 1);
          const ny = dy / (d || 1);
          b.x = p.x + nx * min;
          b.y = p.y + ny * min;
          // Bounce: reflect velocity along the normal, soften and add a small
          // random kick so the ball doesn't get stuck in vertical lines.
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.55 + (Math.random() - 0.5) * 30;
          b.vy = (b.vy - 2 * dot * ny) * 0.55;
          if (Math.abs(b.vy) < 50) b.vy = 60;
          playSound("click");
          break;
        }
      }
      // Bucket landing
      if (b.y >= BUCKET_TOP - BALL_R) {
        b.y = BUCKET_TOP - BALL_R;
        b.done = true;
        const idx = Math.max(
          0,
          Math.min(BUCKETS.length - 1, Math.floor(b.x / BUCKET_W)),
        );
        const mult = BUCKETS[idx];
        const totalReturn = Math.floor(ante * mult);
        placeBet("pachinko", ante, totalReturn, { multiplier: mult });
        setResult({ bucket: idx, mult });
        setHistory((h) => [mult, ...h].slice(0, 10));
        setRunning(false);
      }
      setBall({ ...b });
      if (!b.done) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, ante, placeBet]);

  useRegisterPlayAgain(
    !running && result !== null
      ? {
          label: `Drop again (${ante})`,
          onClick: () => {
            setResult(null);
            setBall(null);
            setTimeout(() => drop(), 0);
          },
          disabled: balance < ante,
        }
      : null,
    [running, result, ante, balance],
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Drop · Bounce · Pray
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Pachinko</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5">
        {/* Board */}
        <div
          className="relative rounded-2xl border-2 border-primary/30 mx-auto"
          style={{
            width: WIDTH,
            height: HEIGHT,
            background:
              "radial-gradient(ellipse at top, rgba(255,210,140,0.15) 0%, rgba(0,0,0,0) 50%), linear-gradient(to bottom, #1a1530 0%, #08081a 100%)",
            boxShadow:
              "inset 0 0 40px rgba(0,0,0,0.7), 0 20px 50px -20px rgba(0,0,0,0.5)",
          }}
        >
          {/* Drop chute */}
          <div
            className="absolute top-0 -translate-x-1/2 w-3 h-10 bg-amber-300/30 rounded-b-md"
            style={{ left: "50%" }}
          />

          {/* SVG with pegs + ball */}
          <svg width={WIDTH} height={HEIGHT} className="absolute inset-0">
            {PEGS.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={PEG_R}
                fill="url(#peg)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={0.6}
              />
            ))}
            <defs>
              <radialGradient id="peg" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fff8" />
                <stop offset="100%" stopColor="#9b6b2f" />
              </radialGradient>
              <radialGradient id="ball" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#cdd5e0" />
              </radialGradient>
            </defs>
            {ball && (
              <circle
                cx={ball.x}
                cy={ball.y}
                r={BALL_R}
                fill="url(#ball)"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={0.6}
              />
            )}
          </svg>

          {/* Buckets */}
          <div
            className="absolute left-0 right-0 grid"
            style={{
              top: BUCKET_TOP,
              height: 60,
              gridTemplateColumns: `repeat(${BUCKETS.length}, 1fr)`,
            }}
          >
            {BUCKETS.map((m, i) => {
              const tone =
                m >= 10
                  ? "from-amber-400 to-amber-700 text-zinc-900"
                  : m >= 4
                    ? "from-emerald-400 to-emerald-700 text-zinc-900"
                    : m >= 1
                      ? "from-sky-400 to-sky-700 text-white"
                      : m === 0
                        ? "from-rose-700 to-rose-900 text-rose-100"
                        : "from-zinc-500 to-zinc-700 text-zinc-100";
              return (
                <div
                  key={i}
                  className={cn(
                    "border-l border-r border-zinc-900/60 bg-gradient-to-b flex flex-col items-center justify-end pb-1 text-xs font-bold",
                    tone,
                    result?.bucket === i &&
                      "ring-2 ring-amber-300 z-10 brightness-125",
                  )}
                >
                  {m}×
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="casino-card p-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Ante
            </div>
            <div className="flex flex-wrap gap-2">
              {ANTES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAnte(a)}
                  disabled={running}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-mono border transition-all",
                    ante === a
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-primary/30 hover:border-primary/60 disabled:opacity-50",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>

            <Button
              size="lg"
              onClick={drop}
              disabled={running || balance < ante}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            >
              <Coins className="w-4 h-4 mr-2" />
              Drop ball ({ante})
            </Button>
            {result && !running && (
              <Button
                size="sm"
                variant="outline"
                onClick={reset}
                className="w-full border-primary/30"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear board
              </Button>
            )}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "rounded-xl border-2 p-4 text-center",
                  result.mult >= 10
                    ? "border-amber-300 bg-amber-500/15"
                    : result.mult >= 1
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-rose-400/60 bg-rose-500/10",
                )}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Bucket
                </div>
                <div className="font-mono text-3xl font-bold tabular-nums">
                  {result.mult}×
                </div>
                <div className="text-xs text-foreground/80 mt-0.5">
                  {result.mult > 0
                    ? `+${Math.floor(ante * result.mult) - ante} chips`
                    : `−${ante} chips`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {history.length > 0 && (
            <div className="casino-card p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Recent drops
              </div>
              <div className="flex flex-wrap gap-1">
                {history.map((m, i) => (
                  <span
                    key={i}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-mono border",
                      m >= 10
                        ? "border-amber-400/40 text-amber-200"
                        : m >= 1
                          ? "border-emerald-400/30 text-emerald-200"
                          : "border-rose-400/30 text-rose-200",
                    )}
                  >
                    {m}×
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
