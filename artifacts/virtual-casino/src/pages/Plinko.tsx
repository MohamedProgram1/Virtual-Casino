import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Coins, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Risk = "low" | "medium" | "high";

const ROWS = 12;
const SLOTS = ROWS + 1; // 13
const PEG_SPACING_X = 30;
const PEG_SPACING_Y = 28;
const BOARD_WIDTH = ROWS * PEG_SPACING_X + 60;
const BOARD_HEIGHT = (ROWS + 1) * PEG_SPACING_Y + 40;

const MULTIPLIERS: Record<Risk, number[]> = {
  low: [8, 3, 1.4, 1.1, 1, 0.7, 0.5, 0.7, 1, 1.1, 1.4, 3, 8],
  medium: [22, 9, 2, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 2, 9, 22],
  high: [110, 24, 8, 3, 1.5, 0.5, 0.2, 0.5, 1.5, 3, 8, 24, 110],
};

const SLOT_COLORS = [
  "from-rose-500 to-rose-600",
  "from-orange-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-amber-400 to-amber-500",
  "from-yellow-400 to-amber-400",
  "from-yellow-300 to-yellow-400",
  "from-yellow-200 to-yellow-300",
  "from-yellow-300 to-yellow-400",
  "from-yellow-400 to-amber-400",
  "from-amber-400 to-amber-500",
  "from-amber-500 to-orange-500",
  "from-orange-500 to-rose-500",
  "from-rose-500 to-rose-600",
];

const BET_PRESETS = [10, 25, 50, 100];

interface BallDrop {
  id: number;
  path: number[]; // 0 = left, 1 = right
  slot: number;
}

export default function Plinko() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [risk, setRisk] = useState<Risk>("medium");
  const [drops, setDrops] = useState<BallDrop[]>([]);
  const [lastResult, setLastResult] = useState<{ slot: number; mult: number; payout: number; bet: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const multipliers = MULTIPLIERS[risk];

  const pegRows = useMemo(() => {
    // Each row r has r+1 pegs, centered
    const rows: { x: number; y: number }[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: { x: number; y: number }[] = [];
      for (let i = 0; i <= r; i++) {
        const x = (i - r / 2) * PEG_SPACING_X;
        const y = (r + 1) * PEG_SPACING_Y;
        row.push({ x, y });
      }
      rows.push(row);
    }
    return rows;
  }, []);

  const drop = () => {
    if (busy || balance < bet) return;
    setBusy(true);
    setLastResult(null);

    const path: number[] = [];
    for (let i = 0; i < ROWS; i++) {
      path.push(Math.random() > 0.5 ? 1 : 0);
    }
    const slot = path.reduce((s, c) => s + c, 0);
    const id = Date.now();
    const newDrop: BallDrop = { id, path, slot };
    setDrops((prev) => [...prev.slice(-4), newDrop]);

    const mult = multipliers[slot];
    const payout = Math.floor(bet * mult);

    // Wait for drop animation, then settle
    const animDuration = 1900;
    setTimeout(() => {
      placeBet("plinko", bet, payout, { multiplier: mult });
      setLastResult({ slot, mult, payout, bet });
      setBusy(false);
      // Clean up old drops
      setTimeout(() => {
        setDrops((prev) => prev.filter((d) => d.id !== id));
      }, 600);
    }, animDuration);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Drop the Ball · Watch It Fall
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Plinko</h1>
      </div>

      {/* Risk Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-full border border-primary/25 bg-card/60">
          {(["low", "medium", "high"] as Risk[]).map((r) => (
            <button
              key={r}
              type="button"
              disabled={busy}
              onClick={() => setRisk(r)}
              className={cn(
                "px-5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all",
                risk === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                busy && "opacity-50 cursor-not-allowed",
              )}
            >
              {r} Risk
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="casino-card p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div
          className="relative mx-auto"
          style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
        >
          {/* Pegs */}
          <div
            className="absolute"
            style={{
              left: BOARD_WIDTH / 2,
              top: 0,
            }}
          >
            {pegRows.map((row, r) =>
              row.map((peg, i) => (
                <div
                  key={`peg-${r}-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-primary/40 shadow-[0_0_6px_rgba(212,175,55,0.4)]"
                  style={{
                    left: peg.x - 4,
                    top: peg.y - 4,
                  }}
                />
              )),
            )}
          </div>

          {/* Balls */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: BOARD_WIDTH / 2,
              top: 0,
            }}
          >
            {drops.map((d) => {
              // Build keyframes
              const xs: number[] = [0];
              const ys: number[] = [0];
              let x = 0;
              for (let i = 0; i < d.path.length; i++) {
                x += d.path[i] === 1 ? 0.5 : -0.5;
                xs.push(x * PEG_SPACING_X);
                ys.push((i + 1) * PEG_SPACING_Y);
              }
              // Final settle into the slot
              xs.push(x * PEG_SPACING_X);
              ys.push(BOARD_HEIGHT - 24);

              return (
                <motion.div
                  key={d.id}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x: xs, y: ys, opacity: [0, 1, 1, 1] }}
                  transition={{
                    duration: 1.9,
                    times: [
                      0,
                      0.05,
                      ...xs.slice(2).map((_, i) => 0.05 + ((i + 1) / xs.length) * 0.9),
                    ].slice(0, xs.length),
                    ease: "easeIn",
                  }}
                  className="absolute"
                  style={{ left: -7, top: -7 }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                </motion.div>
              );
            })}
          </div>

          {/* Slot row at bottom */}
          <div
            className="absolute left-0 right-0 flex justify-center gap-px"
            style={{ bottom: 0, height: 28 }}
          >
            {multipliers.map((m, i) => {
              const isHit = lastResult?.slot === i;
              return (
                <motion.div
                  key={i}
                  animate={
                    isHit
                      ? { scale: [1, 1.15, 1], y: [0, -3, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "flex-1 max-w-[26px] rounded-sm flex items-center justify-center text-[9px] font-bold tabular-nums bg-gradient-to-b text-zinc-900 shadow-md",
                    SLOT_COLORS[i],
                    isHit && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                  )}
                >
                  {m}×
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Result message */}
        <div className="mt-4 h-12 flex items-center justify-center">
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div
                className={cn(
                  "font-serif text-2xl",
                  lastResult.payout > lastResult.bet
                    ? "text-emerald-400"
                    : lastResult.payout === lastResult.bet
                      ? "text-amber-200"
                      : "text-rose-400",
                )}
              >
                {lastResult.mult}× ·{" "}
                {lastResult.payout > lastResult.bet
                  ? `+${lastResult.payout - lastResult.bet}`
                  : lastResult.payout === lastResult.bet
                    ? "even"
                    : `${lastResult.payout - lastResult.bet}`}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bet controls */}
      <div className="casino-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Bet</div>
          <div className="font-mono text-2xl text-primary tabular-nums">{bet}</div>
        </div>
        <Slider
          value={[bet]}
          min={1}
          max={Math.max(1, Math.min(500, balance))}
          step={1}
          onValueChange={(v) => setBet(v[0])}
          disabled={busy || balance === 0}
        />
        <div className="flex gap-2">
          {BET_PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="outline"
              disabled={busy || p > balance}
              onClick={() => setBet(p)}
              className="flex-1 border-primary/30"
            >
              {p}
            </Button>
          ))}
        </div>
        <Button
          size="lg"
          disabled={busy || balance < bet}
          onClick={drop}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          <Circle className="w-5 h-5 mr-2" fill="currentColor" />
          {balance < bet ? "Insufficient Chips" : busy ? "Falling..." : "Drop"}
          {!busy && balance >= bet && (
            <span className="ml-2 opacity-75">
              <Coins className="w-4 h-4 inline -mt-0.5" /> {bet}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
