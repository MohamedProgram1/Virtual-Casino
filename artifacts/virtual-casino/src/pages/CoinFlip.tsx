import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

type Side = "heads" | "tails";

const BET_PRESETS = [10, 25, 50, 100];
const PAYOUT_MULTIPLIER = 1.95;

function CoinFace({ side }: { side: Side }) {
  const isHeads = side === "heads";
  return (
    <div
      className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1"
      style={{
        background: isHeads
          ? "radial-gradient(circle at 35% 30%, #fde68a 0%, #d4af37 50%, #8a6b14 100%)"
          : "radial-gradient(circle at 35% 30%, #a37e2c 0%, #6b4e0c 50%, #3a2800 100%)",
        boxShadow: isHeads
          ? "inset 0 3px 8px rgba(255,240,160,0.4), inset 0 -3px 8px rgba(0,0,0,0.4)"
          : "inset 0 3px 8px rgba(255,200,100,0.2), inset 0 -3px 8px rgba(0,0,0,0.6)",
        backfaceVisibility: "hidden",
        border: "4px solid",
        borderColor: isHeads ? "rgba(245,216,118,0.8)" : "rgba(140,100,30,0.6)",
      }}
    >
      {isHeads ? (
        <>
          <div className="text-zinc-900 text-[10px] tracking-[0.4em] uppercase font-bold opacity-70">
            Lucky
          </div>
          <div className="text-4xl select-none">🍀</div>
          <div className="text-zinc-900 text-[10px] tracking-[0.4em] uppercase font-bold opacity-70">
            Vault
          </div>
        </>
      ) : (
        <>
          <div className="text-amber-200 text-[10px] tracking-[0.4em] uppercase font-bold opacity-70">
            Lucky
          </div>
          <div className="text-4xl select-none">🏆</div>
          <div className="text-amber-200 text-[10px] tracking-[0.4em] uppercase font-bold opacity-70">
            Vault
          </div>
        </>
      )}
    </div>
  );
}

function ConfettiDot({ i }: { i: number }) {
  const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
  const dist = 90 + Math.random() * 70;
  const colors = ["#d4af37", "#4ade80", "#60a5fa", "#f472b6", "#a78bfa"];
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
      animate={{
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 30,
        opacity: [1, 1, 0],
        scale: [0.5, 1.2, 0.5],
      }}
      transition={{ duration: 1.4, ease: "easeOut", delay: i * 0.03 }}
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{ background: colors[i % colors.length] }}
    />
  );
}

export default function CoinFlip() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [pick, setPick] = useState<Side>("heads");
  const [flipping, setFlipping] = useState(false);
  const [face, setFace] = useState<Side>("heads");
  const [result, setResult] = useState<{
    side: Side;
    pick: Side;
    won: boolean;
    payout: number;
    bet: number;
  } | null>(null);
  const [streak, setStreak] = useState<{ side: Side; won: boolean }[]>([]);
  const [rotateY, setRotateY] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const flip = () => {
    if (flipping || balance < bet) return;
    setResult(null);
    setFlipping(true);
    setShowConfetti(false);

    const landed: Side = Math.random() < 0.5 ? "heads" : "tails";
    const spins = 7 + Math.floor(Math.random() * 4);
    const targetMod = landed === "heads" ? 0 : 180;
    const currentMod = ((rotateY % 360) + 360) % 360;
    const delta = spins * 360 + ((targetMod - currentMod + 360) % 360);
    setRotateY((r) => r + delta);

    window.setTimeout(() => {
      setFace(landed);
      const won = landed === pick;
      const payout = won ? Math.floor(bet * PAYOUT_MULTIPLIER) : 0;
      placeBet("coinflip", bet, payout, {
        multiplier: won ? PAYOUT_MULTIPLIER : 0,
        special: `${pick}→${landed}`,
      });
      setResult({ side: landed, pick, won, payout, bet });
      setStreak((s) => [{ side: landed, won }, ...s].slice(0, 8));
      setFlipping(false);
      if (won) setShowConfetti(true);
    }, 1600);
  };

  useRegisterPlayAgain(
    !flipping && result
      ? { label: "Flip Again", onClick: flip, disabled: balance < bet }
      : null,
    [flipping, result, bet, balance, pick],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "h") setPick("heads");
      else if (e.key.toLowerCase() === "t") setPick("tails");
      else if (e.code === "Space") {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipping, balance, bet, pick]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Heads or Tails · One Toss, Instant Result
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Coin Flip</h1>
      </div>

      {/* Streak bar */}
      {streak.length > 0 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {streak.map((s, i) => (
            <div
              key={i}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 shadow-md",
                s.won
                  ? "border-emerald-500/60 bg-emerald-500/15"
                  : "border-rose-500/40 bg-rose-500/10",
              )}
              title={s.side}
            >
              {s.side === "heads" ? "🍀" : "🏆"}
            </div>
          ))}
        </div>
      )}

      {/* Coin stage */}
      <div
        className="casino-card relative overflow-hidden p-8 sm:p-12"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(46 35% 14%) 0%, hsl(0 0% 5%) 75%)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: 16 }).map((_, i) => (
              <ConfettiDot key={i} i={i} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center min-h-56">
          <div className="relative" style={{ perspective: "1000px", width: 200, height: 200 }}>
            <motion.div
              animate={{ rotateY }}
              transition={{ duration: 1.6, ease: [0.17, 0.67, 0.28, 1] }}
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Heads face */}
              <div
                className="absolute inset-0 rounded-full border-4 shadow-[0_12px_50px_rgba(212,175,55,0.5)]"
                style={{
                  borderColor: "rgba(245,216,118,0.7)",
                  backfaceVisibility: "hidden",
                }}
              >
                <CoinFace side="heads" />
              </div>
              {/* Tails face */}
              <div
                className="absolute inset-0 rounded-full border-4 shadow-[0_12px_50px_rgba(212,175,55,0.5)]"
                style={{
                  borderColor: "rgba(140,100,30,0.6)",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <CoinFace side="tails" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Result message */}
        <div className="mt-4 h-12 text-center">
          <AnimatePresence mode="wait">
            {result && !flipping && (
              <motion.div
                key={`${result.side}-${result.won}`}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "font-serif text-2xl",
                  result.won ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {result.side === "heads" ? "🍀 Heads" : "🏆 Tails"} ·{" "}
                {result.won
                  ? `+${result.payout - result.bet} chips`
                  : `−${result.bet} chips`}
              </motion.div>
            )}
            {flipping && (
              <motion.div
                key="flipping"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-sm italic"
              >
                Flipping...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pick side */}
      <div className="grid grid-cols-2 gap-3">
        {(["heads", "tails"] as Side[]).map((s) => (
          <button
            key={s}
            type="button"
            disabled={flipping}
            onClick={() => setPick(s)}
            className={cn(
              "rounded-2xl border-2 py-5 font-serif text-xl transition-all relative overflow-hidden flex flex-col items-center gap-2",
              pick === s
                ? "border-primary bg-primary/15 text-primary shadow-[0_0_24px_rgba(212,175,55,0.3)]"
                : "border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground",
              flipping && "opacity-60 cursor-not-allowed",
            )}
          >
            <span className="text-3xl">{s === "heads" ? "🍀" : "🏆"}</span>
            <span>{s === "heads" ? "Heads" : "Tails"}</span>
            <span className="text-[9px] uppercase tracking-widest opacity-50 font-mono">
              [{s === "heads" ? "H" : "T"}]
            </span>
          </button>
        ))}
      </div>

      {/* Bet */}
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
          disabled={flipping || balance === 0}
        />
        <div className="flex gap-2">
          {BET_PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="outline"
              disabled={flipping || p > balance}
              onClick={() => setBet(p)}
              className="flex-1 border-primary/30"
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Win pays {PAYOUT_MULTIPLIER}× your bet</span>
          <span className="font-mono">
            potential +{Math.floor(bet * PAYOUT_MULTIPLIER) - bet}
          </span>
        </div>
        <Button
          size="lg"
          disabled={flipping || balance < bet}
          onClick={flip}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          <Coins className="w-5 h-5 mr-2" />
          {balance < bet
            ? "Insufficient Chips"
            : flipping
              ? "Flipping..."
              : `Flip on ${pick === "heads" ? "🍀 Heads" : "🏆 Tails"}`}
        </Button>
      </div>
    </div>
  );
}
