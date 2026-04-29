import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

interface SymbolDef {
  id: string;
  glyph: string;
  mult: number;
  weight: number;
  color: string;
  bg: string;
}

// Match any 3 of the same symbol on the 9-cell card to win mult × bet.
// Weights tuned so house keeps a small edge over many cards.
const SYMBOLS: SymbolDef[] = [
  { id: "cherry", glyph: "🍒", mult: 1.5, weight: 32, color: "text-rose-300", bg: "from-rose-500/20 to-rose-900/10" },
  { id: "lemon", glyph: "🍋", mult: 2, weight: 26, color: "text-yellow-300", bg: "from-yellow-500/20 to-yellow-900/10" },
  { id: "bell", glyph: "🔔", mult: 4, weight: 18, color: "text-amber-300", bg: "from-amber-500/20 to-amber-900/10" },
  { id: "clover", glyph: "🍀", mult: 8, weight: 12, color: "text-emerald-300", bg: "from-emerald-500/20 to-emerald-900/10" },
  { id: "diamond", glyph: "💎", mult: 25, weight: 7, color: "text-cyan-300", bg: "from-cyan-500/20 to-cyan-900/10" },
  { id: "crown", glyph: "👑", mult: 100, weight: 2.5, color: "text-amber-200", bg: "from-amber-300/30 to-amber-700/15" },
  { id: "vault", glyph: "🗝️", mult: 500, weight: 0.5, color: "text-amber-100", bg: "from-amber-200/40 to-amber-600/20" },
];

const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

function pickSymbol(): SymbolDef {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    if (r < s.weight) return s;
    r -= s.weight;
  }
  return SYMBOLS[0];
}

function generateCard(): SymbolDef[] {
  return Array.from({ length: 9 }, () => pickSymbol());
}

const BET_PRESETS = [10, 25, 50, 100];

interface CardResult {
  card: SymbolDef[];
  bestMatch: { symbol: SymbolDef; count: number; indices: number[] } | null;
  payout: number;
  bet: number;
  settled: boolean;
}

function findBestMatch(card: SymbolDef[]): CardResult["bestMatch"] {
  const counts = new Map<string, { sym: SymbolDef; count: number; idx: number[] }>();
  card.forEach((s, i) => {
    const entry = counts.get(s.id);
    if (entry) {
      entry.count += 1;
      entry.idx.push(i);
    } else {
      counts.set(s.id, { sym: s, count: 1, idx: [i] });
    }
  });
  let best: CardResult["bestMatch"] = null;
  for (const { sym, count, idx } of counts.values()) {
    if (count >= 3) {
      // Higher mult wins ties; if still tied, more matches wins
      if (
        !best ||
        sym.mult > best.symbol.mult ||
        (sym.mult === best.symbol.mult && count > best.count)
      ) {
        best = { symbol: sym, count, indices: idx };
      }
    }
  }
  return best;
}

export default function Scratch() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [round, setRound] = useState<CardResult | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>(Array(9).fill(false));

  const allRevealed = revealed.every(Boolean);
  const inProgress = round !== null && !round.settled;

  const buy = () => {
    if (balance < bet || inProgress) return;
    const card = generateCard();
    const bestMatch = findBestMatch(card);
    setRound({
      card,
      bestMatch,
      payout: bestMatch ? Math.floor(bet * bestMatch.symbol.mult) : 0,
      bet,
      settled: false,
    });
    setRevealed(Array(9).fill(false));
  };

  const revealCell = (idx: number) => {
    if (!round || round.settled) return;
    setRevealed((prev) => {
      if (prev[idx]) return prev;
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  };

  const revealAll = () => {
    if (!round || round.settled) return;
    setRevealed(Array(9).fill(true));
  };

  // Settle once everything is revealed (in an effect — never during render).
  useEffect(() => {
    if (round && !round.settled && allRevealed) {
      placeBet("scratch", round.bet, round.payout, {
        multiplier: round.bestMatch ? round.bestMatch.symbol.mult : 0,
        special: round.bestMatch ? round.bestMatch.symbol.id : "no-match",
      });
      setRound({ ...round, settled: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRevealed, round?.settled]);

  const newCard = () => {
    setRound(null);
    setRevealed(Array(9).fill(false));
  };

  useRegisterPlayAgain(
    round?.settled
      ? { label: "New Card", onClick: newCard }
      : null,
    [round?.settled],
  );

  // EV badges (max possible) for the buy panel
  const maxPossible = useMemo(
    () => Math.floor(bet * Math.max(...SYMBOLS.map((s) => s.mult))),
    [bet],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Match 3 to Win · Higher Symbols Pay More
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">
          Scratch Card
        </h1>
      </div>

      {/* Card */}
      <div
        className="casino-card relative overflow-hidden p-6"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(330 35% 14%) 0%, hsl(0 0% 5%) 80%)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {!round ? (
          <div className="text-center py-16 text-muted-foreground italic">
            Buy a card to start scratching.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-sm mx-auto">
              {round.card.map((sym, i) => {
                const isRevealed = revealed[i];
                const isWinning =
                  round.bestMatch?.indices.includes(i) ?? false;
                return (
                  <motion.button
                    key={i}
                    type="button"
                    disabled={isRevealed || round.settled}
                    onClick={() => revealCell(i)}
                    whileHover={
                      !isRevealed && !round.settled
                        ? { scale: 1.04 }
                        : undefined
                    }
                    whileTap={
                      !isRevealed && !round.settled
                        ? { scale: 0.96 }
                        : undefined
                    }
                    className={cn(
                      "aspect-square rounded-xl border-2 flex items-center justify-center relative overflow-hidden text-4xl sm:text-5xl",
                      !isRevealed &&
                        "border-amber-400/40 bg-gradient-to-br from-amber-700/40 via-amber-900/30 to-zinc-900 cursor-pointer hover:border-amber-300",
                      isRevealed &&
                        cn(
                          "bg-gradient-to-b border-primary/30",
                          sym.bg,
                          isWinning &&
                            "ring-2 ring-amber-300 border-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.6)]",
                        ),
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {!isRevealed ? (
                        <motion.div
                          key="cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgba(0,0,0,0.4)_4px_8px)]" />
                          <Sparkles className="w-7 h-7 text-amber-300/70 relative z-10" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="symbol"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="relative z-10"
                        >
                          {sym.glyph}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Reveal-all helper while unsettled */}
            {!round.settled && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={revealAll}
                  className="text-xs text-muted-foreground hover:text-primary uppercase tracking-wider"
                >
                  Reveal all
                </button>
              </div>
            )}

            {/* Result message */}
            {round.settled && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 text-center"
              >
                {round.bestMatch ? (
                  <>
                    <div className="text-3xl mb-1">
                      {round.bestMatch.symbol.glyph}
                      {round.bestMatch.symbol.glyph}
                      {round.bestMatch.symbol.glyph}
                    </div>
                    <div
                      className={cn(
                        "font-serif text-2xl",
                        round.payout > round.bet
                          ? "text-emerald-400"
                          : "text-amber-200",
                      )}
                    >
                      {round.bestMatch.symbol.mult}× ·{" "}
                      {round.payout > round.bet
                        ? `+${round.payout - round.bet}`
                        : `${round.payout - round.bet}`}
                    </div>
                  </>
                ) : (
                  <div className="font-serif text-xl text-rose-400">
                    No match · -{round.bet}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Paytable */}
      <div className="casino-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
          Paytable · Match 3
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {SYMBOLS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "rounded-lg border border-primary/15 p-2 text-center bg-gradient-to-b",
                s.bg,
              )}
            >
              <div className="text-2xl">{s.glyph}</div>
              <div
                className={cn(
                  "text-xs font-mono font-bold tabular-nums",
                  s.color,
                )}
              >
                {s.mult}×
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy controls */}
      <div className="casino-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Card price</div>
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
          disabled={inProgress || balance === 0}
        />
        <div className="flex gap-2">
          {BET_PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="outline"
              disabled={inProgress || p > balance}
              onClick={() => setBet(p)}
              className="flex-1 border-primary/30"
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Top prize: 🗝️ vault key</span>
          <span className="font-mono">max +{maxPossible.toLocaleString()}</span>
        </div>
        <Button
          size="lg"
          disabled={inProgress || balance < bet}
          onClick={round?.settled ? newCard : buy}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          <Ticket className="w-5 h-5 mr-2" />
          {balance < bet
            ? "Insufficient Chips"
            : inProgress
              ? "Scratch the cells above"
              : round?.settled
                ? "New Card"
                : `Buy Card · ${bet}`}
        </Button>
      </div>
    </div>
  );
}
