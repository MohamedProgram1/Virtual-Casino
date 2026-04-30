import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Coins, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Suit = "S" | "H" | "D" | "C";
type Rank = number; // 1..13

interface Card { suit: Suit; rank: Rank }

const SUITS: Suit[] = ["S", "H", "D", "C"];
const SUIT_SYMBOLS: Record<Suit, { symbol: string; color: string }> = {
  S: { symbol: "♠", color: "#1c1917" },
  C: { symbol: "♣", color: "#1c1917" },
  H: { symbol: "♥", color: "#dc2626" },
  D: { symbol: "♦", color: "#dc2626" },
};

const RANK_LABELS: Record<number, string> = { 1: "A", 11: "J", 12: "Q", 13: "K" };
function rankLabel(r: number): string { return RANK_LABELS[r] ?? String(r); }
function randomCard(): Card {
  return { suit: SUITS[Math.floor(Math.random() * 4)], rank: 1 + Math.floor(Math.random() * 13) };
}

const HOUSE_EDGE = 0.97;
function stepMult(current: Rank, choice: "higher" | "lower"): number {
  const wins = choice === "higher" ? 13 - current : current - 1;
  if (wins === 0) return 0;
  return +((13 / wins) * HOUSE_EDGE).toFixed(2);
}

const BET_PRESETS = [10, 25, 50, 100];

function CardView({ card, small, highlighted }: { card: Card | null; small?: boolean; highlighted?: boolean }) {
  const sym = card ? SUIT_SYMBOLS[card.suit] : null;
  const isRed = card && (card.suit === "H" || card.suit === "D");
  return (
    <div
      className={cn(
        "rounded-2xl flex flex-col justify-between shadow-xl border-2 select-none relative overflow-hidden",
        small ? "w-14 h-20 p-1" : "w-28 h-40 sm:w-32 sm:h-44 p-2",
        highlighted && "ring-4 ring-amber-300 ring-offset-2 ring-offset-emerald-900",
      )}
      style={{
        background: "linear-gradient(145deg, #fafafa 0%, #f0ede8 100%)",
        borderColor: isRed ? "rgba(220,38,38,0.3)" : "rgba(0,0,0,0.2)",
      }}
    >
      {card && sym && (
        <>
          <div
            className={cn("font-extrabold leading-none", small ? "text-base" : "text-2xl")}
            style={{ color: sym.color }}
          >
            {rankLabel(card.rank)}
            <span className={cn("ml-0.5", small ? "text-xs" : "text-lg")}>{sym.symbol}</span>
          </div>
          <div
            className="flex items-center justify-center self-center"
            style={{ fontSize: small ? "1.8rem" : "3rem", lineHeight: 1, color: sym.color }}
          >
            {sym.symbol}
          </div>
          <div
            className={cn("font-extrabold leading-none self-end rotate-180", small ? "text-base" : "text-2xl")}
            style={{ color: sym.color }}
          >
            {rankLabel(card.rank)}
            <span className={cn("ml-0.5", small ? "text-xs" : "text-lg")}>{sym.symbol}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function HiLo() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [phase, setPhase] = useState<"betting" | "playing" | "done">("betting");
  const [current, setCurrent] = useState<Card>(() => randomCard());
  const [streak, setStreak] = useState(0);
  const [streakMult, setStreakMult] = useState(1);
  const [trail, setTrail] = useState<Card[]>([]);
  const [lastResult, setLastResult] = useState<{
    won: boolean; payout: number; streak: number; cashed: boolean;
  } | null>(null);
  const [revealing, setRevealing] = useState<{ card: Card; won: boolean } | null>(null);

  const higherMult = stepMult(current.rank, "higher");
  const lowerMult = stepMult(current.rank, "lower");

  const startGame = () => {
    if (balance < bet) return;
    setCurrent(randomCard());
    setStreak(0); setStreakMult(1); setTrail([]); setLastResult(null); setRevealing(null);
    setPhase("playing");
  };

  const guess = (choice: "higher" | "lower") => {
    if (phase !== "playing" || revealing) return;
    let next = randomCard();
    let safety = 0;
    while (
      ((current.rank === 1 && choice === "lower") ||
        (current.rank === 13 && choice === "higher")) &&
      safety < 10
    ) {
      next = randomCard();
      safety++;
    }
    const won =
      choice === "higher" ? next.rank > current.rank : next.rank < current.rank;
    setRevealing({ card: next, won });

    setTimeout(() => {
      if (!won) {
        placeBet("hilo", bet, 0, { streak });
        setLastResult({ won: false, payout: 0, streak, cashed: false });
        setTrail((t) => [next, ...t].slice(0, 5));
        setRevealing(null);
        setPhase("done");
      } else {
        const newStreak = streak + 1;
        const newMult = +(streakMult * stepMult(current.rank, choice)).toFixed(2);
        setTrail((t) => [next, ...t].slice(0, 5));
        setCurrent(next);
        setStreak(newStreak);
        setStreakMult(newMult);
        setRevealing(null);
      }
    }, 700);
  };

  const cashOut = () => {
    if (phase !== "playing" || streak === 0) return;
    const payout = Math.floor(bet * streakMult);
    placeBet("hilo", bet, payout, { streak });
    setLastResult({ won: true, payout, streak, cashed: true });
    setPhase("done");
  };

  const currentPayout = Math.floor(bet * streakMult);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Predict Higher or Lower · Build the Streak
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Hi-Lo</h1>
      </div>

      {/* Status */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Streak", value: String(streak), color: "text-primary" },
          { label: "Multiplier", value: `${streakMult.toFixed(2)}×`, color: "text-primary" },
          {
            label: "Cash Out",
            value: phase === "playing" && streak > 0 ? String(currentPayout) : "—",
            color: currentPayout > bet ? "text-emerald-400" : "text-foreground",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="casino-card p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className={cn("font-mono text-xl tabular-nums", color)}>{value}</div>
          </div>
        ))}
      </div>

      {/* Felt table */}
      <div
        className="rounded-3xl border-2 border-primary/20 p-6 sm:p-10 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at center, hsl(162 67% 22%) 0%, hsl(162 67% 12%) 100%)",
          boxShadow: "inset 0 4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Trail */}
          <div className="hidden sm:flex flex-col gap-1 items-end">
            <div className="text-[10px] uppercase tracking-wider text-emerald-100/50 mb-1">History</div>
            <div className="flex flex-col gap-1.5">
              {trail.slice(0, 4).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1 - i * 0.2, x: 0 }}
                  style={{ scale: 1 - i * 0.04 }}
                >
                  <CardView card={c} small />
                </motion.div>
              ))}
              {trail.length === 0 && (
                <div className="text-emerald-100/30 italic text-xs w-14 text-center">No history</div>
              )}
            </div>
          </div>

          {/* Current card */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {revealing ? (
                <motion.div
                  key="reveal"
                  initial={{ y: -30, opacity: 0, scale: 0.85 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="relative"
                >
                  <CardView card={revealing.card} highlighted />
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      "absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg",
                      revealing.won
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-600 text-white",
                    )}
                  >
                    {revealing.won ? "✓ Win" : "✗ Bust"}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key={`cur-${current.rank}-${current.suit}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CardView card={current} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rank scale */}
          <div className="hidden sm:flex flex-col items-start gap-1">
            <div className="text-[10px] uppercase tracking-wider text-emerald-100/50 mb-1">Rank</div>
            <div className="space-y-0.5">
              {["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"].map((r) => (
                <div
                  key={r}
                  className={cn(
                    "text-[10px] font-mono w-6 text-center rounded transition-all",
                    r === rankLabel(current.rank)
                      ? "bg-amber-400/80 text-zinc-900 font-bold text-xs"
                      : "text-emerald-100/30",
                  )}
                >
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {phase === "playing" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => guess("higher")}
              disabled={!!revealing || higherMult === 0}
              className="h-16 font-serif text-lg bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-40"
            >
              <ArrowUp className="w-5 h-5 mr-2" />
              Higher · {higherMult > 0 ? `${higherMult.toFixed(2)}×` : "N/A"}
            </Button>
            <Button
              size="lg"
              onClick={() => guess("lower")}
              disabled={!!revealing || lowerMult === 0}
              className="h-16 font-serif text-lg bg-gradient-to-b from-rose-500 to-rose-700 text-white hover:from-rose-400 shadow-lg shadow-rose-500/20 disabled:opacity-40"
            >
              <ArrowDown className="w-5 h-5 mr-2" />
              Lower · {lowerMult > 0 ? `${lowerMult.toFixed(2)}×` : "N/A"}
            </Button>
          </div>
          {streak > 0 && (
            <Button
              size="lg"
              variant="outline"
              onClick={cashOut}
              disabled={!!revealing}
              className="w-full h-12 font-serif border-primary/40 text-primary hover:bg-primary/10"
            >
              <Coins className="w-4 h-4 mr-2" />
              💰 Cash Out · {currentPayout} chips
            </Button>
          )}
        </>
      ) : phase === "done" ? (
        <div className="space-y-3">
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center font-serif text-2xl"
            >
              {lastResult.cashed ? (
                <span className="text-emerald-400">
                  🎉 Cashed {lastResult.streak} in a row · +{lastResult.payout - bet}
                </span>
              ) : (
                <span className="text-rose-400">
                  💥 Bust at {lastResult.streak} in a row.
                </span>
              )}
            </motion.div>
          )}
          <Button
            size="lg"
            onClick={() => setPhase("betting")}
            className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            New Round
          </Button>
        </div>
      ) : (
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
            disabled={balance < bet}
            onClick={startGame}
            className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          >
            {balance < bet ? "Insufficient Chips" : "🃏 Deal"}
          </Button>
        </div>
      )}
    </div>
  );
}
