import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Sparkles,
  Coins,
  RotateCcw,
  Flame,
  Snowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const COMBO_LENGTH = 4;
const MAX_ATTEMPTS = 8;
const ANTE = 200;

interface AttemptRow {
  guess: number[];
  hits: number; // digits in correct position
  warm: number; // digits present but wrong position
}

function newCombo(): number[] {
  const out: number[] = [];
  for (let i = 0; i < COMBO_LENGTH; i++) out.push(Math.floor(Math.random() * 10));
  return out;
}

function evaluate(guess: number[], combo: number[]): { hits: number; warm: number } {
  let hits = 0;
  const comboCounts: Record<number, number> = {};
  const guessCounts: Record<number, number> = {};
  for (let i = 0; i < COMBO_LENGTH; i++) {
    if (guess[i] === combo[i]) hits++;
    else {
      comboCounts[combo[i]] = (comboCounts[combo[i]] ?? 0) + 1;
      guessCounts[guess[i]] = (guessCounts[guess[i]] ?? 0) + 1;
    }
  }
  let warm = 0;
  for (const k of Object.keys(comboCounts)) {
    const d = Number(k);
    warm += Math.min(comboCounts[d], guessCounts[d] ?? 0);
  }
  return { hits, warm };
}

// Multiplier scales with attempts remaining when cracked.
const PAYOUT_BY_REMAINING: Record<number, number> = {
  0: 4,
  1: 5,
  2: 6,
  3: 8,
  4: 10,
  5: 14,
  6: 20,
  7: 30,
};

export default function OwnerSafe() {
  const { ownerMode, balance, placeBet } = useCasinoStore();
  const [combo, setCombo] = useState<number[]>(() => newCombo());
  const [digits, setDigits] = useState<number[]>([0, 0, 0, 0]);
  const [active, setActive] = useState(0);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [phase, setPhase] = useState<"idle" | "playing" | "cracked" | "busted">(
    "idle",
  );

  const start = () => {
    if (balance < ANTE) return;
    setCombo(newCombo());
    setDigits([0, 0, 0, 0]);
    setActive(0);
    setAttempts([]);
    setPhase("playing");
    playSound("chip");
  };

  const reset = () => {
    setPhase("idle");
    setAttempts([]);
    setDigits([0, 0, 0, 0]);
    setActive(0);
  };

  const bumpDigit = (i: number, dir: 1 | -1) => {
    if (phase !== "playing") return;
    setDigits((prev) => {
      const next = [...prev];
      next[i] = (next[i] + dir + 10) % 10;
      return next;
    });
    setActive(i);
    playSound("click");
  };

  const tryCombo = () => {
    if (phase !== "playing") return;
    const result = evaluate(digits, combo);
    const row: AttemptRow = { guess: [...digits], hits: result.hits, warm: result.warm };
    const newAttempts = [...attempts, row];
    setAttempts(newAttempts);

    if (result.hits === COMBO_LENGTH) {
      const remaining = MAX_ATTEMPTS - newAttempts.length;
      const mult = PAYOUT_BY_REMAINING[Math.min(remaining, 7)] ?? 4;
      const payout = ANTE * mult;
      placeBet("ownerSafe", ANTE, payout, { multiplier: mult, special: "owner-safe-cracked" });
      setPhase("cracked");
      playSound("unlock");
      return;
    }
    if (newAttempts.length >= MAX_ATTEMPTS) {
      placeBet("ownerSafe", ANTE, 0);
      setPhase("busted");
      playSound("lose");
      return;
    }
    playSound("click");
  };

  const lastAttempt = attempts[attempts.length - 1];
  const remaining = MAX_ATTEMPTS - attempts.length;

  // Hot/cold compass tracks distance from the secret combo.
  const heat = useMemo(() => {
    if (!lastAttempt) return null;
    if (lastAttempt.hits + lastAttempt.warm === 0) return "freezing" as const;
    if (lastAttempt.hits >= 3) return "blazing" as const;
    if (lastAttempt.hits >= 2 || lastAttempt.warm >= 3) return "hot" as const;
    if (lastAttempt.hits >= 1 || lastAttempt.warm >= 2) return "warm" as const;
    return "cool" as const;
  }, [lastAttempt]);

  // Reset on route change basically: nothing else needed.
  useEffect(() => {
    return () => {
      // No timer to clean up.
    };
  }, []);

  if (!ownerMode) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
        <h1 className="font-serif text-3xl">Owner's Safe</h1>
        <p className="text-sm text-muted-foreground">
          The vault behind the vault. Owner credentials required.
        </p>
        <Link href="/owner-vault">
          <Button variant="outline" className="border-primary/40">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Owner's Vault
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/owner-vault">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Owner's Vault
          </Button>
        </Link>
        <div className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
          Owner-only · Combo Crack
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="font-serif text-4xl casino-gradient-text">
          Owner's Safe
        </h1>
        <p className="text-sm text-muted-foreground">
          {COMBO_LENGTH}-digit combination · {MAX_ATTEMPTS} attempts · Ante {ANTE}
        </p>
      </div>

      {/* The safe itself */}
      <div
        className="relative mx-auto rounded-3xl border-4 border-amber-700/60 shadow-2xl bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 max-w-md p-6"
        style={{
          boxShadow:
            "inset 0 4px 14px rgba(255,210,140,0.15), inset 0 -10px 30px rgba(0,0,0,0.6), 0 30px 60px -20px rgba(0,0,0,0.6)",
        }}
      >
        {/* Bolts */}
        {[
          [10, 10],
          [10, 90],
          [90, 10],
          [90, 90],
        ].map(([x, y], i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-amber-300 to-amber-700 border border-black/40"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          />
        ))}

        <div className="text-center text-xs uppercase tracking-[0.4em] text-amber-200/70 mb-2">
          {phase === "cracked" ? "OPEN" : "LOCKED"}
        </div>

        {/* Digit dials */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {digits.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <button
                onClick={() => bumpDigit(i, 1)}
                disabled={phase !== "playing"}
                className="w-8 h-6 rounded-sm bg-amber-600/40 hover:bg-amber-500/60 text-amber-50 text-xs font-bold disabled:opacity-30"
              >
                ▲
              </button>
              <div
                onClick={() => setActive(i)}
                className={cn(
                  "w-14 h-16 sm:w-16 sm:h-20 rounded-md border-2 flex items-center justify-center font-mono text-3xl sm:text-4xl font-bold cursor-pointer select-none transition-all bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-900 shadow-inner",
                  active === i && phase === "playing"
                    ? "border-amber-300 ring-2 ring-amber-300/50"
                    : "border-zinc-500/60",
                )}
              >
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={d}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {d}
                  </motion.span>
                </AnimatePresence>
              </div>
              <button
                onClick={() => bumpDigit(i, -1)}
                disabled={phase !== "playing"}
                className="w-8 h-6 rounded-sm bg-amber-600/40 hover:bg-amber-500/60 text-amber-50 text-xs font-bold disabled:opacity-30"
              >
                ▼
              </button>
            </div>
          ))}
        </div>

        {/* Heat compass */}
        <div className="mt-5 h-7 flex items-center justify-center">
          {heat && phase === "playing" && (
            <motion.div
              key={heat + (attempts.length || 0)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border",
                heat === "blazing" && "border-rose-400/60 text-rose-100 bg-rose-500/20",
                heat === "hot" && "border-amber-400/60 text-amber-100 bg-amber-500/20",
                heat === "warm" && "border-yellow-400/60 text-yellow-100 bg-yellow-500/15",
                heat === "cool" && "border-sky-400/60 text-sky-100 bg-sky-500/10",
                heat === "freezing" && "border-blue-400/60 text-blue-100 bg-blue-500/10",
              )}
            >
              {(heat === "blazing" || heat === "hot" || heat === "warm") ? (
                <Flame className="w-3.5 h-3.5" />
              ) : (
                <Snowflake className="w-3.5 h-3.5" />
              )}
              {heat.toUpperCase()}
            </motion.div>
          )}
        </div>

        {/* Action */}
        <div className="mt-2 flex items-center justify-center gap-2">
          {phase === "playing" && (
            <Button
              onClick={tryCombo}
              size="lg"
              className="bg-gradient-to-b from-amber-500 to-amber-700 text-zinc-950 hover:from-amber-400 px-8 shadow-lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              Try combo
            </Button>
          )}
          {phase === "idle" && (
            <Button
              onClick={start}
              size="lg"
              disabled={balance < ANTE}
              className="bg-gradient-to-b from-amber-500 to-amber-700 text-zinc-950 hover:from-amber-400 px-8 shadow-lg"
            >
              <Coins className="w-4 h-4 mr-2" />
              Ante {ANTE} & start
            </Button>
          )}
          {(phase === "cracked" || phase === "busted") && (
            <Button
              onClick={reset}
              size="lg"
              variant="outline"
              className="border-primary/40"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Outcome */}
      <AnimatePresence>
        {(phase === "cracked" || phase === "busted") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "rounded-xl border-2 p-4 text-center",
              phase === "cracked"
                ? "border-emerald-400/60 bg-emerald-500/10"
                : "border-rose-400/60 bg-rose-500/10",
            )}
          >
            {phase === "cracked" ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Unlock className="w-5 h-5 text-emerald-300" />
                  <span className="font-serif text-xl">Vault popped</span>
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="text-xs text-foreground/80">
                  {remaining} attempts left · {(PAYOUT_BY_REMAINING[Math.min(remaining, 7)] ?? 4)}× ante
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="font-serif text-xl">Out of attempts</div>
                <div className="text-xs text-foreground/80">
                  Combo was{" "}
                  <span className="font-mono text-base text-rose-100">
                    {combo.join(" ")}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attempts log */}
      {attempts.length > 0 && (
        <div className="casino-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Attempts ({attempts.length}/{MAX_ATTEMPTS})
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="text-emerald-300">●</span> right spot ·{" "}
              <span className="text-amber-300">●</span> right digit, wrong spot
            </div>
          </div>
          <div className="space-y-1.5">
            {attempts.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-md bg-background/40 border border-primary/10"
              >
                <div className="font-mono text-base tracking-[0.3em]">
                  {a.guess.join(" ")}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                    {a.hits} hit
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-400/30">
                    {a.warm} near
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout key */}
      <div className="casino-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Payout (multiplier × ante {ANTE})
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-xs">
          {Object.entries(PAYOUT_BY_REMAINING)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([rem, mult]) => (
              <div
                key={rem}
                className="px-2 py-1.5 rounded-md bg-background/40 border border-primary/10"
              >
                <div className="text-[10px] text-muted-foreground">
                  {rem} left
                </div>
                <div className="font-mono font-bold text-primary">{mult}×</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
