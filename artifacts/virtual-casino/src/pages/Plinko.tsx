import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

type Risk = "low" | "medium" | "high";

const ROWS = 12;
const PEG_SPACING_X = 32;
const PEG_SPACING_Y = 30;
const BOARD_WIDTH = ROWS * PEG_SPACING_X + 64;
const BOARD_HEIGHT = (ROWS + 1) * PEG_SPACING_Y + 50;

const MULTIPLIERS: Record<Risk, number[]> = {
  low:    [8, 3, 1.4, 1.1, 1, 0.7, 0.5, 0.7, 1, 1.1, 1.4, 3, 8],
  medium: [22, 9, 2, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 2, 9, 22],
  high:   [110, 24, 8, 3, 1.5, 0.5, 0.2, 0.5, 1.5, 3, 8, 24, 110],
};

const SLOT_COLORS = [
  "#e11d48", "#f97316", "#f59e0b", "#d4af37",
  "#a3e635", "#84cc16", "#fde68a",
  "#84cc16", "#a3e635", "#d4af37",
  "#f59e0b", "#f97316", "#e11d48",
];

const BALL_COLORS = [
  "from-amber-200 to-amber-500",
  "from-emerald-200 to-emerald-500",
  "from-sky-200 to-sky-500",
  "from-fuchsia-200 to-fuchsia-500",
  "from-rose-200 to-rose-500",
  "from-teal-200 to-teal-500",
  "from-orange-200 to-orange-500",
  "from-violet-200 to-violet-500",
  "from-lime-200 to-lime-500",
  "from-cyan-200 to-cyan-500",
];

const BET_PRESETS = [10, 25, 50, 100];
const BALL_COUNTS = [1, 3, 5, 10] as const;

interface BallDrop {
  id: number;
  path: number[];
  slot: number;
  delay: number;
  colorIdx: number;
}

interface SettleSummary {
  drops: number;
  totalBet: number;
  totalPayout: number;
  hits: { slot: number; mult: number }[];
}

export default function Plinko() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [ballCount, setBallCount] = useState<number>(1);
  const [risk, setRisk] = useState<Risk>("medium");
  const [drops, setDrops] = useState<BallDrop[]>([]);
  const [hitSlots, setHitSlots] = useState<Map<number, number>>(new Map());
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<SettleSummary | null>(null);
  const idRef = useRef(0);
  const colorIdxRef = useRef(0);

  const multipliers = MULTIPLIERS[risk];
  const totalCost = bet * ballCount;

  const pegRows = useMemo(() => {
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
    if (busy || balance < totalCost) return;
    setBusy(true);
    setSummary(null);
    setHitSlots(new Map());

    const newDrops: BallDrop[] = [];
    const baseId = idRef.current;
    const stagger = 110;

    for (let n = 0; n < ballCount; n++) {
      const path: number[] = [];
      for (let i = 0; i < ROWS; i++) path.push(Math.random() > 0.5 ? 1 : 0);
      const slot = path.reduce((s, c) => s + c, 0);
      newDrops.push({
        id: baseId + n + 1,
        path,
        slot,
        delay: n * stagger,
        colorIdx: (colorIdxRef.current + n) % BALL_COLORS.length,
      });
    }
    idRef.current = baseId + ballCount;
    colorIdxRef.current = (colorIdxRef.current + ballCount) % BALL_COLORS.length;
    setDrops((prev) => [...prev, ...newDrops]);

    const animDuration = 2000;
    const lastSettle = animDuration + (ballCount - 1) * stagger;

    let totalPayout = 0;
    const hits: { slot: number; mult: number }[] = [];

    newDrops.forEach((d) => {
      window.setTimeout(() => {
        const mult = multipliers[d.slot];
        const payout = Math.floor(bet * mult);
        totalPayout += payout;
        hits.push({ slot: d.slot, mult });
        placeBet("plinko", bet, payout, { multiplier: mult });
        setHitSlots((prev) => {
          const next = new Map(prev);
          next.set(d.slot, (next.get(d.slot) ?? 0) + 1);
          return next;
        });
      }, animDuration + d.delay);
    });

    window.setTimeout(() => {
      setSummary({ drops: ballCount, totalBet: bet * ballCount, totalPayout, hits });
      setBusy(false);
      window.setTimeout(() => {
        setDrops((prev) =>
          prev.filter((existing) => !newDrops.find((n) => n.id === existing.id)),
        );
      }, 600);
    }, lastSettle + 80);
  };

  useRegisterPlayAgain(
    !busy && summary
      ? {
          label: ballCount > 1 ? `Drop ${ballCount} Balls` : "Drop Again",
          onClick: drop,
          disabled: balance < totalCost,
        }
      : null,
    [busy, summary, ballCount, totalCost, balance],
  );

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
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="casino-card p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="relative mx-auto" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
          {/* Pegs */}
          <div className="absolute" style={{ left: BOARD_WIDTH / 2, top: 0 }}>
            {pegRows.map((row, r) =>
              row.map((peg, i) => (
                <div
                  key={`peg-${r}-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 10,
                    height: 10,
                    left: peg.x - 5,
                    top: peg.y - 5,
                    background: "radial-gradient(circle at 35% 30%, hsl(46 80% 75%), hsl(46 60% 45%))",
                    boxShadow: "0 0 8px rgba(212,175,55,0.5), 0 1px 3px rgba(0,0,0,0.4)",
                  }}
                />
              )),
            )}
          </div>

          {/* Balls */}
          <div
            className="absolute pointer-events-none"
            style={{ left: BOARD_WIDTH / 2, top: 0 }}
          >
            {drops.map((d) => {
              const xs: number[] = [0];
              const ys: number[] = [0];
              let x = 0;
              for (let i = 0; i < d.path.length; i++) {
                x += d.path[i] === 1 ? 0.5 : -0.5;
                xs.push(x * PEG_SPACING_X);
                ys.push((i + 1) * PEG_SPACING_Y);
              }
              xs.push(x * PEG_SPACING_X);
              ys.push(BOARD_HEIGHT - 28);

              const ballColor = BALL_COLORS[d.colorIdx];
              return (
                <motion.div
                  key={d.id}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x: xs, y: ys, opacity: [0, 1, 1, 1] }}
                  transition={{
                    duration: 2.0,
                    delay: d.delay / 1000,
                    times: [0, 0.04, ...xs.slice(2).map((_, i) => 0.04 + ((i + 1) / xs.length) * 0.92)].slice(0, xs.length),
                    ease: "easeIn",
                  }}
                  className="absolute"
                  style={{ left: -9, top: -9 }}
                >
                  <div
                    className={cn("w-5 h-5 rounded-full bg-gradient-to-b", ballColor)}
                    style={{
                      boxShadow: "0 0 12px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.5)",
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Slot row */}
          <div
            className="absolute left-0 right-0 flex justify-center gap-px"
            style={{ bottom: 0, height: 34 }}
          >
            {multipliers.map((m, i) => {
              const isHit = hitSlots.has(i);
              const hitCount = hitSlots.get(i) ?? 0;
              return (
                <motion.div
                  key={i}
                  animate={
                    isHit
                      ? { scale: [1, 1.22, 1], y: [0, -5, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "flex-1 max-w-[28px] rounded-md flex items-center justify-center text-[8px] sm:text-[9px] font-bold tabular-nums shadow-lg relative overflow-hidden",
                    isHit && "ring-2 ring-white ring-offset-1 ring-offset-background",
                  )}
                  style={{
                    background: isHit
                      ? `linear-gradient(to bottom, white, ${SLOT_COLORS[i]})`
                      : `linear-gradient(to bottom, ${SLOT_COLORS[i]}cc, ${SLOT_COLORS[i]})`,
                    color: "#0a0a0a",
                    boxShadow: isHit
                      ? `0 0 16px ${SLOT_COLORS[i]}aa`
                      : `0 2px 6px rgba(0,0,0,0.4)`,
                  }}
                >
                  {m < 10 ? `${m}×` : m >= 100 ? `${m}` : `${m}×`}
                  {hitCount > 1 && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white text-[7px] font-bold flex items-center justify-center text-zinc-900">
                      {hitCount}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Result message */}
        <div className="mt-5 min-h-12 flex items-center justify-center">
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div
                className={cn(
                  "font-serif text-2xl",
                  summary.totalPayout > summary.totalBet
                    ? "text-emerald-400"
                    : summary.totalPayout === summary.totalBet
                      ? "text-amber-200"
                      : "text-rose-400",
                )}
              >
                {summary.drops > 1 ? `${summary.drops} balls · ` : ""}
                {summary.totalPayout > summary.totalBet
                  ? `🎉 +${summary.totalPayout - summary.totalBet}`
                  : summary.totalPayout === summary.totalBet
                    ? "Even"
                    : `${summary.totalPayout - summary.totalBet}`}
              </div>
              {summary.drops > 1 && (
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  bet {summary.totalBet} → won {summary.totalPayout} ·{" "}
                  best {Math.max(...summary.hits.map((h) => h.mult))}×
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bet controls */}
      <div className="casino-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Bet per ball</div>
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

        {/* Ball count */}
        <div className="pt-2 border-t border-primary/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Balls per drop</div>
            <div className="font-mono text-lg text-primary tabular-nums">×{ballCount}</div>
          </div>
          <div className="flex gap-2">
            {BALL_COUNTS.map((n) => {
              const cost = bet * n;
              const can = cost <= balance;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={busy || !can}
                  onClick={() => setBallCount(n)}
                  className={cn(
                    "flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all",
                    ballCount === n
                      ? "border-primary bg-primary/15 text-primary shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                      : "border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    (busy || !can) && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          size="lg"
          disabled={busy || balance < totalCost}
          onClick={drop}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          <Coins className="w-5 h-5 mr-2" />
          {balance < totalCost
            ? "Insufficient Chips"
            : busy
              ? "Falling..."
              : ballCount > 1
                ? `🎱 Drop ${ballCount} · ${totalCost}`
                : `🎱 Drop · ${bet}`}
        </Button>
      </div>
    </div>
  );
}
