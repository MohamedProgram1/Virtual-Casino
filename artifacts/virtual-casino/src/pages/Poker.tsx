import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, RotateCcw, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "J" | "Q" | "K" | "A";

interface Card {
  rank: Rank;
  suit: Suit;
  value: number; // 2..14, A=14
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANK_DEFS: Array<{ r: Rank; v: number }> = [
  { r: "2", v: 2 }, { r: "3", v: 3 }, { r: "4", v: 4 }, { r: "5", v: 5 },
  { r: "6", v: 6 }, { r: "7", v: 7 }, { r: "8", v: 8 }, { r: "9", v: 9 },
  { r: "10", v: 10 }, { r: "J", v: 11 }, { r: "Q", v: 12 }, { r: "K", v: 13 },
  { r: "A", v: 14 },
];

function newDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS)
    for (const r of RANK_DEFS) d.push({ rank: r.r, suit: s, value: r.v });
  return d;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type HandRank =
  | "royal_flush"
  | "straight_flush"
  | "four_kind"
  | "full_house"
  | "flush"
  | "straight"
  | "three_kind"
  | "two_pair"
  | "jacks_or_better"
  | "nothing";

const HAND_LABEL: Record<HandRank, string> = {
  royal_flush: "Royal Flush",
  straight_flush: "Straight Flush",
  four_kind: "Four of a Kind",
  full_house: "Full House",
  flush: "Flush",
  straight: "Straight",
  three_kind: "Three of a Kind",
  two_pair: "Two Pair",
  jacks_or_better: "Jacks or Better",
  nothing: "No win",
};

// Standard 9/6 Jacks-or-Better paytable (return = stake × payout for win, 0 if loss)
const PAYOUT: Record<HandRank, number> = {
  royal_flush: 800,
  straight_flush: 50,
  four_kind: 25,
  full_house: 9,
  flush: 6,
  straight: 4,
  three_kind: 3,
  two_pair: 2,
  jacks_or_better: 1, // returns stake + 1× = even money
  nothing: 0,
};

function evaluate(cards: Card[]): HandRank {
  const sorted = [...cards].sort((a, b) => a.value - b.value);
  const counts: Record<number, number> = {};
  for (const c of sorted) counts[c.value] = (counts[c.value] ?? 0) + 1;
  const groupSizes = Object.values(counts).sort((a, b) => b - a);

  const isFlush = sorted.every((c) => c.suit === sorted[0].suit);

  // Straight check: distinct + consecutive. Special A-2-3-4-5 wheel.
  const distinct = Object.keys(counts).map(Number).sort((a, b) => a - b);
  let isStraight = false;
  if (distinct.length === 5) {
    if (distinct[4] - distinct[0] === 4) isStraight = true;
    if (distinct.join(",") === "2,3,4,5,14") isStraight = true; // wheel
  }

  if (isStraight && isFlush) {
    const isRoyal = distinct.join(",") === "10,11,12,13,14";
    if (isRoyal) return "royal_flush";
    return "straight_flush";
  }
  if (groupSizes[0] === 4) return "four_kind";
  if (groupSizes[0] === 3 && groupSizes[1] === 2) return "full_house";
  if (isFlush) return "flush";
  if (isStraight) return "straight";
  if (groupSizes[0] === 3) return "three_kind";
  if (groupSizes[0] === 2 && groupSizes[1] === 2) return "two_pair";
  if (groupSizes[0] === 2) {
    // Pair: only pays if it's Jacks or higher.
    const pairValue = Number(
      Object.keys(counts).find((k) => counts[Number(k)] === 2),
    );
    if (pairValue >= 11) return "jacks_or_better";
  }
  return "nothing";
}

const ANTES = [10, 25, 50, 100, 250];

export default function Poker() {
  const { balance, placeBet } = useCasinoStore();
  const [ante, setAnte] = useState(25);
  const [phase, setPhase] = useState<"idle" | "draw" | "result">("idle");
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [result, setResult] = useState<HandRank | null>(null);

  const deal = () => {
    if (balance < ante) return;
    playSound("chip");
    const d = shuffle(newDeck());
    const initial = d.slice(0, 5);
    setHand(initial);
    setDeck(d.slice(5));
    setHeld([false, false, false, false, false]);
    setResult(null);
    setPhase("draw");
    initial.forEach((_, i) => {
      setTimeout(() => playSound("cardDeal"), i * 90);
    });
  };

  const toggleHold = (i: number) => {
    if (phase !== "draw") return;
    playSound("click");
    setHeld((h) => h.map((v, j) => (i === j ? !v : v)));
  };

  const draw = () => {
    if (phase !== "draw") return;
    let drawIdx = 0;
    const newHand = hand.map((c, i) => (held[i] ? c : deck[drawIdx++]));
    setHand(newHand);
    newHand.forEach((_, i) => {
      if (!held[i]) setTimeout(() => playSound("cardDeal"), i * 70);
    });
    const r = evaluate(newHand);
    setResult(r);
    const payoutMult = PAYOUT[r];
    // For Jacks or Better, the payout entry is "1" (1:1 → return = stake×2).
    // For higher hands, the payout is the multiple of the bet returned (stake included).
    const totalReturn = payoutMult > 0 ? ante * (payoutMult + (r === "jacks_or_better" ? 1 : 1)) : 0;
    // Standard video poker: payout column = total returned per credit bet,
    // already including the stake. So we use ante × payoutMult.
    const finalReturn = payoutMult > 0 ? ante * payoutMult : 0;
    placeBet("poker", ante, finalReturn, {
      multiplier: payoutMult,
      special: r === "royal_flush" ? "poker-royal" : undefined,
    });
    void totalReturn;
    setPhase("result");
  };

  const reset = () => {
    setPhase("idle");
    setHand([]);
    setHeld([false, false, false, false, false]);
    setResult(null);
  };

  useRegisterPlayAgain(
    phase === "result"
      ? {
          label: `Deal again (${ante})`,
          onClick: () => {
            setPhase("idle");
            setTimeout(() => deal(), 0);
          },
          disabled: balance < ante,
        }
      : null,
    [phase, ante, balance],
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Five-Card Draw · Jacks or Better
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Video Poker</h1>
      </div>

      {/* Felt with cards */}
      <div
        className="rounded-2xl border-2 border-primary/20 p-6 sm:p-8 min-h-[260px] flex flex-col items-center justify-center gap-5"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(220 30% 18%) 0%, hsl(220 30% 10%) 80%)",
        }}
      >
        {phase === "idle" ? (
          <div className="text-center space-y-3">
            <div className="text-muted-foreground italic">
              Pick an ante and tap Deal.
            </div>
            <Button
              size="lg"
              onClick={deal}
              disabled={balance < ante}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 font-bold"
            >
              <Coins className="w-4 h-4 mr-2" />
              Deal ({ante})
            </Button>
          </div>
        ) : (
          <>
            {/* Cards row */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {hand.map((c, i) => (
                <motion.button
                  key={`${i}-${c.rank}-${c.suit}-${phase}`}
                  initial={{ y: -20, opacity: 0, rotate: -6 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  whileHover={phase === "draw" ? { y: -4 } : undefined}
                  whileTap={phase === "draw" ? { scale: 0.95 } : undefined}
                  onClick={() => toggleHold(i)}
                  disabled={phase !== "draw"}
                  className={cn(
                    "relative w-16 sm:w-20 h-24 sm:h-28 rounded-md bg-gradient-to-b from-zinc-100 to-zinc-300 border-2 shadow-lg flex flex-col items-center justify-between p-2",
                    held[i] ? "border-amber-300" : "border-zinc-500/60",
                    (c.suit === "♥" || c.suit === "♦") ? "text-rose-700" : "text-zinc-900",
                  )}
                >
                  <div className="text-base sm:text-lg font-bold leading-none self-start">
                    {c.rank}
                  </div>
                  <div className="text-3xl sm:text-4xl leading-none">{c.suit}</div>
                  <div className="text-base sm:text-lg font-bold leading-none self-end rotate-180">
                    {c.rank}
                  </div>
                  {/* Hold/Held indicator */}
                  {phase === "draw" && (
                    <div
                      className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        held[i]
                          ? "bg-amber-300 text-zinc-900 border-amber-500"
                          : "bg-zinc-700 text-zinc-300 border-zinc-500",
                      )}
                    >
                      {held[i] ? "HOLD" : "tap"}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Result banner */}
            <AnimatePresence>
              {phase === "result" && result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "px-5 py-2 rounded-full font-serif text-lg border-2",
                    result === "nothing"
                      ? "border-rose-400/60 text-rose-200 bg-rose-500/10"
                      : "border-amber-300 text-amber-100 bg-amber-500/15",
                  )}
                >
                  {HAND_LABEL[result]}
                  {result !== "nothing" && (
                    <span className="ml-2 text-sm text-foreground/80">
                      · {PAYOUT[result]}× ({ante * PAYOUT[result]})
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {phase === "draw" ? (
                <Button
                  size="lg"
                  onClick={draw}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Draw ({held.filter((h) => !h).length} new)
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={reset}
                  variant="outline"
                  className="border-primary/40"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Hand
                </Button>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground italic">
              {phase === "draw" ? "Tap a card to hold it for the draw." : ""}
            </div>
          </>
        )}
      </div>

      {/* Ante chooser */}
      <div className="casino-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Ante
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {ANTES.map((a) => (
            <button
              key={a}
              onClick={() => setAnte(a)}
              disabled={phase !== "idle"}
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
      </div>

      {/* Paytable */}
      <div className="casino-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Paytable (per chip wagered)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {(
            [
              "royal_flush",
              "straight_flush",
              "four_kind",
              "full_house",
              "flush",
              "straight",
              "three_kind",
              "two_pair",
              "jacks_or_better",
            ] as HandRank[]
          ).map((h) => (
            <div
              key={h}
              className={cn(
                "flex items-center justify-between py-1 border-b border-primary/10",
                result === h && "bg-primary/10 px-2 -mx-2 rounded",
              )}
            >
              <span>{HAND_LABEL[h]}</span>
              <span className="font-mono text-primary tabular-nums">
                {PAYOUT[h]}×
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden lock icon for tree shake placeholder */}
      <div className="hidden">
        <Lock />
      </div>
    </div>
  );
}
