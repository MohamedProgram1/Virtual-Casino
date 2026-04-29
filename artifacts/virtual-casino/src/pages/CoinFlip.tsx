import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

type Side = "heads" | "tails";

const BET_PRESETS = [10, 25, 50, 100];
// 1.95× payout — small house edge of 2.5%
const PAYOUT_MULTIPLIER = 1.95;

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
  // rotation accumulates; even multiple of 180 lands on heads, odd lands on tails
  const [rotateY, setRotateY] = useState(0);

  const flip = () => {
    if (flipping || balance < bet) return;
    setResult(null);
    setFlipping(true);

    const landed: Side = Math.random() < 0.5 ? "heads" : "tails";
    // 6–9 full spins + final orientation matching landed side
    const spins = 6 + Math.floor(Math.random() * 4);
    const targetMod = landed === "heads" ? 0 : 180;
    const currentMod = ((rotateY % 360) + 360) % 360;
    // pick next absolute angle that ends on targetMod after `spins` rotations
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
    }, 1400);
  };

  useRegisterPlayAgain(
    !flipping && result
      ? { label: "Flip Again", onClick: flip, disabled: balance < bet }
      : null,
    [flipping, result, bet, balance, pick],
  );

  // Keyboard: H/T to pick, Space to flip
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
        <div className="flex justify-center gap-1.5 flex-wrap">
          {streak.map((s, i) => (
            <div
              key={i}
              className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border",
                s.won
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-300",
              )}
            >
              {s.side === "heads" ? "H" : "T"}
            </div>
          ))}
        </div>
      )}

      {/* Coin */}
      <div
        className="casino-card relative overflow-hidden p-8 sm:p-12"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(46 35% 14%) 0%, hsl(0 0% 5%) 75%)",
        }}
      >
        <div className="flex items-center justify-center min-h-56">
          <div
            className="relative"
            style={{ perspective: "900px", width: 180, height: 180 }}
          >
            <motion.div
              animate={{ rotateY }}
              transition={{ duration: 1.4, ease: [0.17, 0.67, 0.32, 1] }}
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Heads face */}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center font-serif text-4xl text-zinc-900 border-4 border-amber-300/70 shadow-[0_10px_40px_rgba(212,175,55,0.45)]"
                style={{
                  background:
                    "radial-gradient(circle at 30% 25%, #fde68a 0%, #d4af37 55%, #8a6b14 100%)",
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase">
                    Lucky
                  </div>
                  <div className="text-5xl leading-none">H</div>
                  <div className="text-[10px] tracking-[0.4em] uppercase">
                    Vault
                  </div>
                </div>
              </div>
              {/* Tails face (back) */}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center font-serif text-4xl text-amber-200 border-4 border-amber-300/70 shadow-[0_10px_40px_rgba(212,175,55,0.45)]"
                style={{
                  background:
                    "radial-gradient(circle at 30% 25%, #6b5215 0%, #3f2f0a 80%)",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase">
                    Lucky
                  </div>
                  <div className="text-5xl leading-none">T</div>
                  <div className="text-[10px] tracking-[0.4em] uppercase">
                    Vault
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-4 h-10 text-center">
          {result && !flipping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "font-serif text-2xl",
                result.won ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {result.side === "heads" ? "Heads" : "Tails"} ·{" "}
              {result.won ? `+${result.payout - result.bet}` : `-${result.bet}`}
            </motion.div>
          )}
          {flipping && (
            <div className="text-muted-foreground text-sm">Spinning...</div>
          )}
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
              "rounded-xl border-2 py-4 font-serif text-xl transition-all relative overflow-hidden",
              pick === s
                ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                : "border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground",
              flipping && "opacity-60 cursor-not-allowed",
            )}
          >
            {s === "heads" ? "Heads" : "Tails"}
            <span className="absolute top-1.5 right-2 text-[9px] uppercase tracking-wider opacity-50 font-mono">
              [{s === "heads" ? "H" : "T"}]
            </span>
          </button>
        ))}
      </div>

      {/* Bet */}
      <div className="casino-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Bet</div>
          <div className="font-mono text-2xl text-primary tabular-nums">
            {bet}
          </div>
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
              : `Flip on ${pick === "heads" ? "Heads" : "Tails"}`}
        </Button>
      </div>
    </div>
  );
}
