import { useState } from "react";
import { Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Coins, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Owner-exclusive game: pick one of 5 vaults. Always profitable.
// Contents shuffled each round; minimum return is 1.2× (your bet plus a touch).
const VAULT_CONTENTS = [1.2, 1.5, 2, 3, 5];

const BET_PRESETS = [25, 100, 250, 500];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function OwnerVault() {
  const { balance, placeBet, ownerMode } = useCasinoStore();
  const [bet, setBet] = useState(100);
  const [vaults, setVaults] = useState<number[]>(() => shuffle(VAULT_CONTENTS));
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{
    mult: number;
    payout: number;
    bet: number;
  } | null>(null);

  if (!ownerMode) {
    return <Redirect to="/" />;
  }

  const startNew = () => {
    setVaults(shuffle(VAULT_CONTENTS));
    setPicked(null);
    setRevealed(false);
    setResult(null);
  };

  const pick = (idx: number) => {
    if (picked !== null) return;
    if (balance < bet) return;
    setPicked(idx);
    setRevealed(true);
    const mult = vaults[idx];
    const payout = Math.floor(bet * mult);
    placeBet("ownerVault", bet, payout, { multiplier: mult });
    setResult({ mult, payout, bet });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-amber-300">
          Owner Access · Always in Profit
        </div>
        <h1 className="font-serif text-4xl bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
          Owner's Vault
        </h1>
        <div className="text-xs text-muted-foreground italic">
          Five vaults. Every one pays at least your bet back.
        </div>
      </div>

      {/* Vault row */}
      <div
        className="rounded-3xl border-2 border-amber-500/30 p-6 sm:p-10 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(46 50% 18%) 0%, hsl(0 0% 5%) 80%)",
          boxShadow:
            "inset 0 4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(212,175,55,0.15)",
        }}
      >
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {vaults.map((mult, i) => {
            const isPicked = picked === i;
            const showAll = revealed;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => pick(i)}
                disabled={picked !== null}
                whileHover={picked === null ? { y: -4, scale: 1.03 } : undefined}
                whileTap={picked === null ? { scale: 0.97 } : undefined}
                animate={isPicked ? { scale: [1, 1.1, 1.05] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden",
                  picked === null &&
                    "border-amber-500/40 bg-gradient-to-b from-amber-700/20 to-zinc-900 hover:border-amber-400 cursor-pointer",
                  showAll &&
                    isPicked &&
                    "border-amber-300 bg-gradient-to-b from-amber-400/40 to-amber-700/20 shadow-[0_0_30px_rgba(212,175,55,0.6)]",
                  showAll &&
                    !isPicked &&
                    "border-amber-500/20 bg-zinc-900/60 opacity-60",
                )}
              >
                <KeyRound
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10",
                    showAll && isPicked
                      ? "text-amber-300"
                      : showAll
                        ? "text-amber-700"
                        : "text-amber-400",
                  )}
                />
                <div className="font-serif text-xs uppercase tracking-wider opacity-80">
                  Vault {i + 1}
                </div>
                <AnimatePresence>
                  {showAll && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.06, type: "spring" }}
                      className={cn(
                        "font-mono font-bold tabular-nums",
                        isPicked
                          ? "text-2xl text-amber-200"
                          : "text-lg text-amber-700",
                      )}
                    >
                      {mult}×
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Result */}
        <div className="mt-6 h-10 flex items-center justify-center">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-2xl text-amber-300"
            >
              {result.mult}× · +{result.payout - result.bet}
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
      {picked === null ? (
        <div className="casino-card p-6 space-y-4 border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Bet</div>
            <div className="font-mono text-2xl text-amber-300 tabular-nums">
              {bet}
            </div>
          </div>
          <Slider
            value={[bet]}
            min={1}
            max={Math.max(1, Math.min(2000, balance))}
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
                className="flex-1 border-amber-500/40"
              >
                {p}
              </Button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center italic">
            Pick a vault above to commit your bet.
          </div>
        </div>
      ) : (
        <Button
          size="lg"
          onClick={startNew}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-amber-400 to-amber-600 text-zinc-900 hover:from-amber-300"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          New Vault Set
        </Button>
      )}

      <div className="text-xs text-muted-foreground/70 text-center">
        Owner perk: All vaults guarantee at least 1.2× return. Average payout 2.54×.
      </div>
    </div>
  );
}
