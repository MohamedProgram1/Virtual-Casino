import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bomb, Gem, Coins, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GRID_SIZE = 25;
const HOUSE_EDGE = 0.01;

function multiplierFor(reveals: number, mines: number): number {
  if (reveals === 0) return 1;
  const safe = GRID_SIZE - mines;
  if (reveals > safe) return 0;
  let p = 1;
  for (let i = 0; i < reveals; i++) {
    p *= (safe - i) / (GRID_SIZE - i);
  }
  return +((1 - HOUSE_EDGE) / p).toFixed(2);
}

function nextGain(reveals: number, mines: number, bet: number): number {
  const cur = Math.floor(bet * multiplierFor(reveals, mines));
  const nxt = Math.floor(bet * multiplierFor(reveals + 1, mines));
  return nxt - cur;
}

type TileState = "hidden" | "safe" | "mine";

export default function Mines() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [mineCount, setMineCount] = useState(3);
  const [active, setActive] = useState(false);
  const [mines, setMines] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [exploded, setExploded] = useState<number | null>(null);
  const [activeBet, setActiveBet] = useState(0);
  const [activeMineCount, setActiveMineCount] = useState(0);
  const [lastResult, setLastResult] = useState<{
    bet: number;
    payout: number;
    mult: number;
    busted: boolean;
  } | null>(null);

  const safeRevealed = revealed.size;
  const currentMult = multiplierFor(safeRevealed, activeMineCount);
  const currentPayout = Math.floor(activeBet * currentMult);
  const nextStepGain = active && safeRevealed < GRID_SIZE - activeMineCount
    ? nextGain(safeRevealed, activeMineCount, activeBet)
    : 0;

  const startGame = () => {
    if (balance < bet) return;
    const set = new Set<number>();
    while (set.size < mineCount) {
      set.add(Math.floor(Math.random() * GRID_SIZE));
    }
    setMines(set);
    setRevealed(new Set());
    setExploded(null);
    setActiveBet(bet);
    setActiveMineCount(mineCount);
    setActive(true);
    setLastResult(null);
  };

  const reveal = (i: number) => {
    if (!active) return;
    if (revealed.has(i)) return;

    if (mines.has(i)) {
      // Bust
      setExploded(i);
      setActive(false);
      placeBet("mines", activeBet, 0);
      setLastResult({ bet: activeBet, payout: 0, mult: 0, busted: true });
    } else {
      const next = new Set(revealed);
      next.add(i);
      setRevealed(next);
      // Auto cash-out if all safe tiles revealed
      if (next.size === GRID_SIZE - activeMineCount) {
        const finalMult = multiplierFor(next.size, activeMineCount);
        const finalPayout = Math.floor(activeBet * finalMult);
        setActive(false);
        placeBet("mines", activeBet, finalPayout);
        setLastResult({
          bet: activeBet,
          payout: finalPayout,
          mult: finalMult,
          busted: false,
        });
      }
    }
  };

  const cashOut = () => {
    if (!active || safeRevealed === 0) return;
    placeBet("mines", activeBet, currentPayout);
    setLastResult({
      bet: activeBet,
      payout: currentPayout,
      mult: currentMult,
      busted: false,
    });
    setActive(false);
  };

  const resetGame = () => {
    setActive(false);
    setMines(new Set());
    setRevealed(new Set());
    setExploded(null);
    setLastResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Find the Gems · Avoid the Mines
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Mines</h1>
      </div>

      {/* Status bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="casino-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Multiplier
          </div>
          <div className="font-mono text-xl text-primary tabular-nums">
            {active ? currentMult.toFixed(2) : "—"}×
          </div>
        </div>
        <div className="casino-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Profit
          </div>
          <div
            className={cn(
              "font-mono text-xl tabular-nums",
              active && currentPayout > activeBet
                ? "text-emerald-400"
                : "text-foreground",
            )}
          >
            {active
              ? currentPayout > activeBet
                ? `+${currentPayout - activeBet}`
                : "0"
              : "—"}
          </div>
        </div>
        <div className="casino-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Next Tile
          </div>
          <div className="font-mono text-xl text-primary/70 tabular-nums">
            {active ? `+${nextStepGain}` : "—"}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="casino-card p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-md mx-auto">
          {Array.from({ length: GRID_SIZE }, (_, i) => {
            const isRevealedSafe = revealed.has(i);
            const isMine = mines.has(i);
            const showAll = !active && (exploded !== null || lastResult !== null);
            const showMine = isMine && (i === exploded || (showAll && lastResult?.busted));
            const showSafe = isRevealedSafe || (showAll && !isMine && lastResult?.busted);

            const state: TileState = showMine
              ? "mine"
              : showSafe
                ? "safe"
                : "hidden";

            return (
              <Tile
                key={i}
                state={state}
                isExploded={i === exploded}
                disabled={!active || isRevealedSafe}
                onClick={() => reveal(i)}
              />
            );
          })}
        </div>

        {/* Result message */}
        <div className="mt-4 h-12 flex items-center justify-center">
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                {lastResult.busted ? (
                  <div className="font-serif text-2xl text-rose-400">
                    Boom. Lost {lastResult.bet}.
                  </div>
                ) : (
                  <div className="font-serif text-2xl text-emerald-400">
                    Cashed out {lastResult.mult}× ·{" "}
                    {lastResult.payout > lastResult.bet ? "+" : ""}
                    {lastResult.payout - lastResult.bet}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      {active ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={resetGame}
            className="h-14 font-serif border-primary/40"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Forfeit
          </Button>
          <Button
            size="lg"
            onClick={cashOut}
            disabled={safeRevealed === 0}
            className="h-14 font-serif bg-gradient-to-b from-emerald-500 to-emerald-600 text-white hover:from-emerald-600"
          >
            <Coins className="w-4 h-4 mr-2" />
            Cash Out {currentPayout > 0 ? `(${currentPayout})` : ""}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 casino-card p-6">
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
            {[10, 25, 50, 100].map((p) => (
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

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Bomb className="w-4 h-4" />
              Mines
            </div>
            <div className="font-mono text-2xl text-rose-400 tabular-nums">{mineCount}</div>
          </div>
          <Slider
            value={[mineCount]}
            min={1}
            max={24}
            step={1}
            onValueChange={(v) => setMineCount(v[0])}
          />
          <div className="text-xs text-muted-foreground text-center">
            First gem pays{" "}
            <span className="text-primary font-mono">
              {multiplierFor(1, mineCount).toFixed(2)}×
            </span>
            {" · "}
            Clear all pays{" "}
            <span className="text-primary font-mono">
              {multiplierFor(GRID_SIZE - mineCount, mineCount).toFixed(2)}×
            </span>
          </div>

          <Button
            size="lg"
            disabled={balance < bet}
            onClick={startGame}
            className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          >
            <Gem className="w-5 h-5 mr-2" />
            {balance < bet ? "Insufficient Chips" : "Play"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface TileProps {
  state: TileState;
  isExploded: boolean;
  disabled: boolean;
  onClick: () => void;
}

function Tile({ state, isExploded, disabled, onClick }: TileProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      animate={
        isExploded
          ? { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }
          : { scale: 1 }
      }
      transition={{ duration: 0.4 }}
      className={cn(
        "aspect-square rounded-lg border flex items-center justify-center transition-colors",
        state === "hidden" &&
          "bg-gradient-to-b from-card to-background border-primary/20 hover:border-primary/50 cursor-pointer",
        state === "safe" &&
          "bg-gradient-to-b from-emerald-500/30 to-emerald-700/20 border-emerald-500/50",
        state === "mine" && !isExploded &&
          "bg-gradient-to-b from-rose-900/40 to-rose-950/30 border-rose-500/30 opacity-70",
        state === "mine" && isExploded &&
          "bg-gradient-to-b from-rose-500 to-rose-700 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)]",
        disabled && state === "hidden" && "opacity-50 cursor-not-allowed",
      )}
    >
      {state === "safe" && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
        >
          <Gem className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" fill="currentColor" />
        </motion.div>
      )}
      {state === "mine" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
        >
          <Bomb
            className={cn(
              "w-5 h-5 sm:w-6 sm:h-6",
              isExploded ? "text-white" : "text-rose-400",
            )}
            fill={isExploded ? "currentColor" : "none"}
          />
        </motion.div>
      )}
    </motion.button>
  );
}
