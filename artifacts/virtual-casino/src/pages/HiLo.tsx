import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Coins, Spade, Heart, Diamond, Club, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Suit = "S" | "H" | "D" | "C";
type Rank = number; // 1..13

interface Card {
  suit: Suit;
  rank: Rank;
}

const SUITS: Suit[] = ["S", "H", "D", "C"];
const SUIT_INFO: Record<Suit, { Icon: typeof Spade; color: string }> = {
  S: { Icon: Spade, color: "text-foreground" },
  C: { Icon: Club, color: "text-foreground" },
  H: { Icon: Heart, color: "text-rose-500" },
  D: { Icon: Diamond, color: "text-rose-500" },
};

const RANK_LABELS: Record<number, string> = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K",
};
function rankLabel(r: number): string {
  return RANK_LABELS[r] ?? String(r);
}

function randomCard(): Card {
  return {
    suit: SUITS[Math.floor(Math.random() * 4)],
    rank: 1 + Math.floor(Math.random() * 13),
  };
}

const HOUSE_EDGE = 0.97;

function stepMult(current: Rank, choice: "higher" | "lower"): number {
  // Probability of winning = wins / 13 (treating equal as loss).
  const wins = choice === "higher" ? 13 - current : current - 1;
  if (wins === 0) return 0; // impossible win
  return +((13 / wins) * HOUSE_EDGE).toFixed(2);
}

const BET_PRESETS = [10, 25, 50, 100];

interface FlipCardProps {
  card: Card | null;
  small?: boolean;
}

function CardView({ card, small }: FlipCardProps) {
  const { Icon, color } = card ? SUIT_INFO[card.suit] : { Icon: Spade, color: "" };
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-b from-zinc-50 to-zinc-200 shadow-xl border border-zinc-300 p-2 flex flex-col justify-between",
        small ? "w-16 h-24" : "w-28 h-40 sm:w-32 sm:h-44",
      )}
    >
      {card && (
        <>
          <div className={cn("font-bold leading-none", color, small ? "text-base" : "text-2xl")}>
            {rankLabel(card.rank)}
          </div>
          <div className="self-center">
            <Icon className={cn(color, small ? "w-7 h-7" : "w-12 h-12")} fill="currentColor" />
          </div>
          <div
            className={cn(
              "font-bold leading-none self-end rotate-180",
              color,
              small ? "text-base" : "text-2xl",
            )}
          >
            {rankLabel(card.rank)}
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
    won: boolean;
    payout: number;
    streak: number;
    cashed: boolean;
  } | null>(null);
  const [revealing, setRevealing] = useState<{
    card: Card;
    won: boolean;
  } | null>(null);

  const higherMult = stepMult(current.rank, "higher");
  const lowerMult = stepMult(current.rank, "lower");

  const startGame = () => {
    if (balance < bet) return;
    setCurrent(randomCard());
    setStreak(0);
    setStreakMult(1);
    setTrail([]);
    setLastResult(null);
    setRevealing(null);
    setPhase("playing");
  };

  const guess = (choice: "higher" | "lower") => {
    if (phase !== "playing" || revealing) return;

    let next = randomCard();
    // Avoid degenerate same-card draws when one direction has 0 prob (rank 1 or 13)
    let safety = 0;
    while (
      ((current.rank === 1 && choice === "lower") ||
        (current.rank === 13 && choice === "higher")) &&
      safety < 10
    ) {
      // These choices can never win; just deal a different card so player learns.
      next = randomCard();
      safety++;
    }

    const won =
      choice === "higher"
        ? next.rank > current.rank
        : next.rank < current.rank;

    setRevealing({ card: next, won });

    setTimeout(() => {
      if (!won) {
        // Bust — placeBet with payout 0
        placeBet("hilo", bet, 0, { streak });
        setLastResult({ won: false, payout: 0, streak, cashed: false });
        setTrail((t) => [next, ...t].slice(0, 6));
        setRevealing(null);
        setPhase("done");
      } else {
        const newStreak = streak + 1;
        const newMult = +(streakMult * stepMult(current.rank, choice)).toFixed(
          2,
        );
        setTrail((t) => [next, ...t].slice(0, 6));
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
        <div className="casino-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Streak
          </div>
          <div className="font-mono text-xl text-primary tabular-nums">
            {streak}
          </div>
        </div>
        <div className="casino-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Multiplier
          </div>
          <div className="font-mono text-xl text-primary tabular-nums">
            {streakMult.toFixed(2)}×
          </div>
        </div>
        <div className="casino-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Cash Out
          </div>
          <div
            className={cn(
              "font-mono text-xl tabular-nums",
              currentPayout > bet ? "text-emerald-400" : "text-foreground",
            )}
          >
            {phase === "playing" && streak > 0 ? currentPayout : "—"}
          </div>
        </div>
      </div>

      {/* Felt */}
      <div
        className="rounded-3xl border-2 border-primary/20 p-6 sm:p-10 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(162 67% 22%) 0%, hsl(162 67% 12%) 100%)",
          boxShadow:
            "inset 0 4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Trail */}
          <div className="hidden sm:flex flex-col gap-1.5 items-end opacity-60">
            <div className="text-[10px] uppercase tracking-wider text-emerald-100/60">
              Recent
            </div>
            <div className="flex gap-1">
              {trail.slice(0, 3).map((c, i) => (
                <div key={i} style={{ opacity: 1 - i * 0.25 }}>
                  <CardView card={c} small />
                </div>
              ))}
              {trail.length === 0 && (
                <div className="text-emerald-100/40 italic text-xs">
                  No history
                </div>
              )}
            </div>
          </div>

          {/* Current card with reveal */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {revealing ? (
                <motion.div
                  key="reveal"
                  initial={{ y: -20, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  className="relative"
                >
                  <CardView card={revealing.card} />
                  <div
                    className={cn(
                      "absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      revealing.won
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white",
                    )}
                  >
                    {revealing.won ? "Win" : "Bust"}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`cur-${current.rank}-${current.suit}`}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <CardView card={current} />
                </motion.div>
              )}
            </AnimatePresence>
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
              className="h-16 font-serif bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-600"
            >
              <ArrowUp className="w-5 h-5 mr-2" />
              Higher · {higherMult > 0 ? `${higherMult.toFixed(2)}×` : "N/A"}
            </Button>
            <Button
              size="lg"
              onClick={() => guess("lower")}
              disabled={!!revealing || lowerMult === 0}
              className="h-16 font-serif bg-gradient-to-b from-rose-500 to-rose-700 text-white hover:from-rose-600"
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
              Cash Out · {currentPayout}
            </Button>
          )}
        </>
      ) : phase === "done" ? (
        <div className="space-y-3">
          {lastResult && (
            <div className="text-center font-serif text-2xl">
              {lastResult.cashed ? (
                <span className="text-emerald-400">
                  Cashed out at {lastResult.streak} in a row · +
                  {lastResult.payout - bet}
                </span>
              ) : (
                <span className="text-rose-400">
                  Bust at {lastResult.streak} in a row.
                </span>
              )}
            </div>
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
            {balance < bet ? "Insufficient Chips" : "Deal"}
          </Button>
        </div>
      )}
    </div>
  );
}
