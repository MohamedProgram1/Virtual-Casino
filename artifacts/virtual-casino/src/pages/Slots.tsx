import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cherry,
  Diamond,
  Crown,
  Star,
  Gem,
  Bell,
  Coins,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCasinoStore } from "@/lib/store";
import { isVipUnlocked } from "@/lib/levels";
import { VipToggle } from "@/components/VipToggle";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

type SymbolDef = {
  id: string;
  Icon: typeof Cherry;
  color: string;
  glowColor: string;
  weight: number;
  payout3: number; // multiplier of bet for 3 of a kind
  payout2: number; // multiplier for 2 of a kind on left two reels
};

// Reel weights determine probabilities. Higher weight = more common.
const SYMBOLS: SymbolDef[] = [
  { id: "cherry", Icon: Cherry, color: "text-rose-400", glowColor: "rgb(251 113 133)", weight: 30, payout3: 5, payout2: 1 },
  { id: "bell", Icon: Bell, color: "text-amber-400", glowColor: "rgb(251 191 36)", weight: 22, payout3: 8, payout2: 0 },
  { id: "star", Icon: Star, color: "text-yellow-300", glowColor: "rgb(253 224 71)", weight: 16, payout3: 15, payout2: 0 },
  { id: "gem", Icon: Gem, color: "text-cyan-400", glowColor: "rgb(34 211 238)", weight: 10, payout3: 25, payout2: 0 },
  { id: "diamond", Icon: Diamond, color: "text-violet-400", glowColor: "rgb(167 139 250)", weight: 6, payout3: 50, payout2: 0 },
  { id: "crown", Icon: Crown, color: "text-primary", glowColor: "rgb(212 175 55)", weight: 3, payout3: 100, payout2: 0 },
];

const TOTAL_WEIGHT = SYMBOLS.reduce((s, sym) => s + sym.weight, 0);

function pickSymbol(): SymbolDef {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const sym of SYMBOLS) {
    if (r < sym.weight) return sym;
    r -= sym.weight;
  }
  return SYMBOLS[0];
}

interface WinInfo {
  amount: number;
  // 0-based reel indexes that are part of the winning combo (for highlight glow).
  winningReels: number[];
  kind: "three" | "cherry-pair" | "none";
  symbol: SymbolDef | null;
}

function evaluate(reels: SymbolDef[], bet: number, vipMultiplier: number): WinInfo {
  if (reels[0].id === reels[1].id && reels[1].id === reels[2].id) {
    return {
      amount: reels[0].payout3 * bet * vipMultiplier,
      winningReels: [0, 1, 2],
      kind: "three",
      symbol: reels[0],
    };
  }
  // 2-of-a-kind only for cherries on adjacent left reels (positions 0-1)
  if (reels[0].id === "cherry" && reels[1].id === "cherry") {
    return {
      amount: SYMBOLS[0].payout2 * bet * vipMultiplier,
      winningReels: [0, 1],
      kind: "cherry-pair",
      symbol: SYMBOLS[0],
    };
  }
  return { amount: 0, winningReels: [], kind: "none", symbol: null };
}

const BET_PRESETS_STD = [10, 25, 50, 100];
const BET_PRESETS_VIP = [50, 100, 250, 500];

interface ReelProps {
  finalSymbol: SymbolDef;
  spinning: boolean;
  delay: number;
  highlight: boolean;
}

function Reel({ finalSymbol, spinning, delay, highlight }: ReelProps) {
  // Generate a long strip of random symbols ending with the final one
  const stripRef = useRef<SymbolDef[]>([]);
  if (spinning && stripRef.current.length === 0) {
    const strip: SymbolDef[] = [];
    for (let i = 0; i < 30; i++) strip.push(pickSymbol());
    strip.push(finalSymbol);
    stripRef.current = strip;
  } else if (!spinning) {
    stripRef.current = [];
  }

  const symbols = spinning ? stripRef.current : [finalSymbol];
  const symbolHeight = 96; // px

  return (
    <motion.div
      animate={
        highlight
          ? {
              boxShadow: [
                `0 0 0px ${finalSymbol.glowColor}`,
                `0 0 28px ${finalSymbol.glowColor}`,
                `0 0 12px ${finalSymbol.glowColor}`,
              ],
              scale: [1, 1.06, 1],
            }
          : { boxShadow: "0 0 0px rgba(0,0,0,0)", scale: 1 }
      }
      transition={
        highlight
          ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }
      }
      className={cn(
        "relative w-24 h-24 sm:w-32 sm:h-32 overflow-hidden rounded-xl border-2 shadow-[inset_0_4px_24px_rgba(0,0,0,0.6)]",
        "bg-gradient-to-b from-background via-card to-background",
        highlight ? "border-primary/80" : "border-primary/30",
      )}
    >
      <div
        className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.9) 0%, transparent 30%, transparent 70%, rgba(10,10,10,0.9) 100%)",
        }}
      />
      {spinning ? (
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: -(symbols.length - 1) * symbolHeight }}
          transition={{
            duration: 1.6 + delay,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="flex flex-col"
        >
          {symbols.map((sym, i) => (
            <div
              key={i}
              className="flex items-center justify-center shrink-0"
              style={{ height: symbolHeight }}
            >
              <sym.Icon className={`w-12 h-12 sm:w-14 sm:h-14 ${sym.color} drop-shadow-lg`} />
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <finalSymbol.Icon
            className={`w-12 h-12 sm:w-14 sm:h-14 ${finalSymbol.color} drop-shadow-lg`}
          />
        </div>
      )}
    </motion.div>
  );
}

interface HistoryEntry {
  id: number;
  symbols: SymbolDef[];
  win: number;
}

export default function Slots() {
  const { balance, placeBet, stats } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [reels, setReels] = useState<SymbolDef[]>([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<WinInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const idRef = useRef(0);
  const vipUnlocked = isVipUnlocked("slots", stats.handsPlayed);
  const [isVip, setIsVip] = useState(false);
  const effectiveVip = isVip && vipUnlocked;
  const vipMultiplier = effectiveVip ? 2 : 1;
  const maxBet = effectiveVip ? 1000 : 500;
  const presets = effectiveVip ? BET_PRESETS_VIP : BET_PRESETS_STD;

  const canSpin = balance >= bet && !spinning;

  const handleSpin = () => {
    if (!canSpin) return;
    const result: SymbolDef[] = [pickSymbol(), pickSymbol(), pickSymbol()];
    setReels(result);
    setSpinning(true);
    setLastResult(null);

    const info = evaluate(result, bet, vipMultiplier);

    setTimeout(() => {
      setSpinning(false);
      setLastResult(info);
      setHistory((prev) =>
        [{ id: ++idRef.current, symbols: result, win: info.amount }, ...prev].slice(0, 8),
      );
      placeBet("slots", bet, info.amount, {
        multiplier: bet > 0 ? info.amount / bet : 0,
        special: info.kind === "three" && info.symbol?.id === "crown" ? "slots-jackpot" : undefined,
      });
    }, 2200);
  };

  // Floating Play Again button — re-spins at the same bet.
  useRegisterPlayAgain(
    !spinning && lastResult
      ? {
          label: "Spin Again",
          onClick: handleSpin,
          disabled: balance < bet,
        }
      : null,
    [spinning, lastResult, bet, balance, vipMultiplier],
  );

  const isJackpot = lastResult?.kind === "three" && lastResult.symbol?.id === "crown";
  const reelHighlight = (i: number) =>
    !spinning && !!lastResult && lastResult.winningReels.includes(i);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          {effectiveVip ? "Doubled Paytable · Higher Limits" : "Three Reels of Fortune"}
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Lucky Reels</h1>
        <div className="flex justify-center">
          <VipToggle game="slots" isVip={isVip} onChange={setIsVip} disabled={spinning} />
        </div>
      </div>

      {/* Machine */}
      <motion.div
        animate={isJackpot ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
        transition={isJackpot ? { duration: 0.5, repeat: 2 } : { duration: 0 }}
        className="casino-card p-6 sm:p-10 relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Jackpot sparkle burst */}
        <AnimatePresence>
          {isJackpot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              {Array.from({ length: 14 }).map((_, i) => {
                const angle = (i / 14) * Math.PI * 2;
                const dist = 140 + Math.random() * 60;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: [0, 1, 0],
                      scale: [0.4, 1.1, 0.6],
                    }}
                    transition={{ duration: 1.6, ease: "easeOut", delay: i * 0.03 }}
                    className="absolute"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-3 sm:gap-4 mb-8 relative z-10">
          {reels.map((sym, i) => (
            <Reel
              key={i}
              finalSymbol={sym}
              spinning={spinning}
              delay={i * 0.25}
              highlight={reelHighlight(i)}
            />
          ))}
        </div>

        {/* Win display */}
        <div className="text-center mb-6 h-12 flex items-center justify-center">
          {lastResult && lastResult.amount > 0 ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "font-serif",
                isJackpot ? "text-4xl casino-gradient-text" : "text-3xl casino-gradient-text",
              )}
            >
              {isJackpot ? "JACKPOT! " : "+ "}
              {lastResult.amount} chips
            </motion.div>
          ) : lastResult && lastResult.amount === 0 && !spinning ? (
            <div className="text-muted-foreground text-sm italic">
              No match. The wheel keeps turning.
            </div>
          ) : null}
        </div>

        {/* Bet controls */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Bet</div>
            <div className="font-mono text-2xl text-primary tabular-nums">
              {bet}
            </div>
          </div>
          <Slider
            value={[bet]}
            min={1}
            max={Math.max(1, Math.min(maxBet, balance))}
            step={1}
            onValueChange={(v) => setBet(v[0])}
            disabled={spinning || balance === 0}
          />
          <div className="flex gap-2">
            {presets.map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant="outline"
                disabled={spinning || preset > balance}
                onClick={() => setBet(preset)}
                className="flex-1 border-primary/30 text-foreground hover:bg-primary/10"
              >
                {preset}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={spinning || balance === 0}
              onClick={() => setBet(Math.min(balance, maxBet))}
              className="flex-1 border-primary/30 text-foreground hover:bg-primary/10"
            >
              Max
            </Button>
          </div>

          <Button
            size="lg"
            disabled={!canSpin}
            onClick={handleSpin}
            className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground hover:from-primary hover:to-primary border border-primary disabled:opacity-50"
          >
            <Coins className="w-5 h-5 mr-2" />
            {spinning ? "Spinning..." : balance < bet ? "Insufficient Chips" : "Spin"}
          </Button>
        </div>
      </motion.div>

      {/* Recent spins strip */}
      {history.length > 0 && (
        <div className="casino-card p-4">
          <div className="text-xs uppercase tracking-[0.25em] text-primary/70 mb-3">
            Recent Spins
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {history.map((h) => {
              const won = h.win > 0;
              return (
                <div
                  key={h.id}
                  className={cn(
                    "shrink-0 rounded-lg border px-2 py-2 flex flex-col items-center gap-1",
                    won
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/40 bg-background/40",
                  )}
                >
                  <div className="flex items-center gap-1">
                    {h.symbols.map((s, i) => (
                      <s.Icon key={i} className={cn("w-4 h-4", s.color)} />
                    ))}
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-mono tabular-nums",
                      won ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {won ? `+${h.win}` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paytable trigger */}
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              <Info className="w-4 h-4 mr-2" />
              View Paytable
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl casino-gradient-text">
                Paytable
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {effectiveVip && (
                <div className="text-xs uppercase tracking-wider text-primary mb-2 text-center">
                  VIP table — all payouts doubled
                </div>
              )}
              {SYMBOLS.slice()
                .sort((a, b) => b.payout3 - a.payout3)
                .map((sym) => (
                  <div
                    key={sym.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-primary/10"
                  >
                    <div className="flex items-center gap-3">
                      <sym.Icon className={`w-6 h-6 ${sym.color}`} />
                      <span className="text-sm capitalize">
                        {sym.id} × 3
                      </span>
                    </div>
                    <span className="font-mono text-primary">{sym.payout3 * vipMultiplier}× bet</span>
                  </div>
                ))}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-primary/10">
                <div className="flex items-center gap-3">
                  <Cherry className="w-6 h-6 text-rose-400" />
                  <span className="text-sm">cherry × 2 (left)</span>
                </div>
                <span className="font-mono text-primary">{1 * vipMultiplier}× bet</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
