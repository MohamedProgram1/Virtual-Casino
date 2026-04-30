import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TOTAL_NUMBERS = 40;
const PICKS_REQUIRED = 4;
const NUMBERS_DRAWN = 8;
const PAYOUTS: Record<number, number> = {
  4: 500,
  3: 15,
  2: 2,
  1: 0,
  0: 0,
};

const BET_PRESETS = [10, 25, 50, 100];

type Phase = "picking" | "drawing" | "done";

export default function Keno() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [picks, setPicks] = useState<Set<number>>(new Set());
  const [drawn, setDrawn] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("picking");
  const [result, setResult] = useState<{
    hits: number;
    payout: number;
    bet: number;
  } | null>(null);
  const drawTimerRef = useRef<number | null>(null);
  const [latestBall, setLatestBall] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (drawTimerRef.current !== null) clearInterval(drawTimerRef.current);
    };
  }, []);

  const togglePick = (n: number) => {
    if (phase !== "picking") return;
    setPicks((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else if (next.size < PICKS_REQUIRED) {
        next.add(n);
      }
      return next;
    });
  };

  const quickPick = () => {
    if (phase !== "picking") return;
    const next = new Set<number>();
    while (next.size < PICKS_REQUIRED) {
      next.add(1 + Math.floor(Math.random() * TOTAL_NUMBERS));
    }
    setPicks(next);
  };

  const clearPicks = () => {
    if (phase !== "picking") return;
    setPicks(new Set());
  };

  const draw = () => {
    if (phase !== "picking") return;
    if (picks.size !== PICKS_REQUIRED) return;
    if (balance < bet) return;

    const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const drawnNums = pool.slice(0, NUMBERS_DRAWN);
    setDrawn(drawnNums);
    setRevealedCount(0);
    setLatestBall(null);
    setPhase("drawing");

    let i = 0;
    drawTimerRef.current = window.setInterval(() => {
      i += 1;
      setRevealedCount(i);
      setLatestBall(drawnNums[i - 1]);
      if (i >= NUMBERS_DRAWN) {
        if (drawTimerRef.current !== null) {
          clearInterval(drawTimerRef.current);
          drawTimerRef.current = null;
        }
        const hits = drawnNums.filter((n) => picks.has(n)).length;
        const mult = PAYOUTS[hits] ?? 0;
        const payout = Math.floor(bet * mult);
        placeBet("keno", bet, payout, { multiplier: mult, hits });
        setResult({ hits, payout, bet });
        setPhase("done");
        setLatestBall(null);
      }
    }, 280);
  };

  const reset = () => {
    setPhase("picking");
    setDrawn([]);
    setRevealedCount(0);
    setResult(null);
    setLatestBall(null);
  };

  const newGame = () => {
    reset();
    setPicks(new Set());
  };

  const drawnSet = new Set(drawn.slice(0, revealedCount));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Pick Four · We Draw Eight
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Keno</h1>
      </div>

      {/* Paytable */}
      <div className="casino-card p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 text-center">
          Paytable · 4 Picks · 8 Drawn from 40
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[4, 3, 2, 1].map((h) => (
            <motion.div
              key={h}
              animate={
                result?.hits === h
                  ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px transparent", "0 0 20px rgba(212,175,55,0.5)", "0 0 8px rgba(212,175,55,0.3)"] }
                  : { scale: 1 }
              }
              className={cn(
                "rounded-xl border py-3 px-1",
                result?.hits === h
                  ? "border-primary bg-primary/15 ring-2 ring-primary/40"
                  : "border-primary/20 bg-card/40",
              )}
            >
              <div className="text-[10px] text-muted-foreground uppercase">
                {h} hit{h === 1 ? "" : "s"}
              </div>
              <div className="font-mono text-xl text-primary tabular-nums font-bold">
                {PAYOUTS[h]}×
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live ball display */}
      <div className="flex justify-center h-12 items-center gap-3">
        {phase === "drawing" && (
          <>
            <div className="text-sm text-muted-foreground italic">Drawing:</div>
            <AnimatePresence mode="popLayout">
              {latestBall !== null && (
                <motion.div
                  key={latestBall}
                  initial={{ scale: 0, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center text-base font-bold tabular-nums border-2 shadow-lg",
                    picks.has(latestBall)
                      ? "bg-gradient-to-b from-amber-300 to-amber-500 border-amber-200 text-zinc-900 shadow-amber-400/50"
                      : "bg-gradient-to-b from-slate-400 to-slate-600 border-slate-300 text-white",
                  )}
                >
                  {latestBall}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="text-sm text-muted-foreground font-mono">
              {revealedCount}/{NUMBERS_DRAWN}
            </div>
          </>
        )}
      </div>

      {/* Number grid */}
      <div className="casino-card p-4 sm:p-6">
        <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
          {Array.from({ length: TOTAL_NUMBERS }, (_, i) => {
            const n = i + 1;
            const isPicked = picks.has(n);
            const isDrawn = drawnSet.has(n);
            const isHit = isPicked && isDrawn;
            const isMissPicked = isPicked && phase === "done" && !isDrawn;
            return (
              <motion.button
                key={n}
                type="button"
                onClick={() => togglePick(n)}
                disabled={phase !== "picking"}
                whileHover={phase === "picking" ? { scale: 1.1, y: -2 } : undefined}
                whileTap={phase === "picking" ? { scale: 0.9 } : undefined}
                animate={isDrawn ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "aspect-square rounded-lg border-2 flex items-center justify-center font-mono font-bold tabular-nums text-sm transition-colors",
                  !isPicked && !isDrawn &&
                    "border-primary/15 bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5",
                  isPicked && !isDrawn && phase !== "done" &&
                    "border-primary/70 bg-primary/20 text-primary shadow-[0_0_12px_rgba(212,175,55,0.25)]",
                  isMissPicked &&
                    "border-zinc-600/40 bg-zinc-700/20 text-zinc-500 line-through",
                  isHit &&
                    "border-amber-300 bg-gradient-to-b from-amber-300 to-amber-500 text-zinc-900 shadow-lg shadow-amber-500/40",
                  !isPicked && isDrawn &&
                    "border-slate-600/40 bg-slate-700/20 text-slate-400",
                )}
              >
                {n}
              </motion.button>
            );
          })}
        </div>

        {/* Result line */}
        <div className="mt-5 h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {result && phase === "done" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={cn(
                  "font-serif text-2xl",
                  result.payout > result.bet
                    ? "text-emerald-400"
                    : result.payout > 0
                      ? "text-amber-200"
                      : "text-rose-400",
                )}
              >
                {result.hits} hit{result.hits === 1 ? "" : "s"} ·{" "}
                {result.payout > result.bet
                  ? `🎉 +${result.payout - result.bet}`
                  : result.payout === 0
                    ? `❌ −${result.bet}`
                    : `${result.payout - result.bet}`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      {phase === "picking" ? (
        <div className="casino-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Picks:{" "}
              <span className={cn("font-mono font-bold", picks.size === PICKS_REQUIRED ? "text-emerald-400" : "text-primary")}>
                {picks.size} / {PICKS_REQUIRED}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={quickPick}
                className="border-primary/30"
              >
                <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                Quick Pick
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearPicks}
                disabled={picks.size === 0}
                className="border-primary/30"
              >
                Clear
              </Button>
            </div>
          </div>

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
            disabled={balance === 0}
          />
          <div className="flex gap-2">
            {BET_PRESETS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant="outline"
                disabled={p > balance}
                onClick={() => setBet(p)}
                className="flex-1 border-primary/30"
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            size="lg"
            disabled={balance < bet || picks.size !== PICKS_REQUIRED}
            onClick={draw}
            className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          >
            <Coins className="w-5 h-5 mr-2" />
            {balance < bet
              ? "Insufficient Chips"
              : picks.size !== PICKS_REQUIRED
                ? `Pick ${PICKS_REQUIRED - picks.size} more`
                : "🎱 Draw"}
          </Button>
        </div>
      ) : phase === "done" ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={reset}
            className="h-14 font-serif border-primary/40"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Same Picks
          </Button>
          <Button
            size="lg"
            onClick={newGame}
            className="h-14 font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          >
            <Coins className="w-4 h-4 mr-2" />
            New Picks
          </Button>
        </div>
      ) : null}
    </div>
  );
}
