import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Info } from "lucide-react";
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
  emoji: string;
  label: string;
  glowColor: string;
  weight: number;
  // payout[n] = multiplier for n-in-a-row from left (index = count, 0-5)
  payout: number[];
};

const SYMBOLS: SymbolDef[] = [
  { id: "cherry",  emoji: "🍒", label: "Cherry",  glowColor: "#fb7185", weight: 28, payout: [0, 0, 0, 4,  8,  16]  },
  { id: "bell",    emoji: "🔔", label: "Bell",    glowColor: "#fbbf24", weight: 20, payout: [0, 0, 0, 7,  14, 28]  },
  { id: "star",    emoji: "⭐", label: "Star",    glowColor: "#fde047", weight: 14, payout: [0, 0, 0, 12, 25, 50]  },
  { id: "clover",  emoji: "🍀", label: "Clover",  glowColor: "#4ade80", weight: 10, payout: [0, 0, 0, 20, 45, 90]  },
  { id: "gold",    emoji: "💰", label: "Gold Bag",glowColor: "#d4af37", weight: 6,  payout: [0, 0, 0, 40, 85, 175] },
  { id: "rainbow", emoji: "🌈", label: "Rainbow", glowColor: "#a78bfa", weight: 3,  payout: [0, 0, 0, 80, 175, 350]},
  { id: "crown",   emoji: "👑", label: "Crown",   glowColor: "#ffd700", weight: 1,  payout: [0, 0, 0, 200, 500, 1000]},
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
  winningReels: number[];
  count: number;
  symbol: SymbolDef | null;
}

function evaluate(reels: SymbolDef[], bet: number, vipMult: number): WinInfo {
  const first = reels[0];
  let count = 1;
  for (let i = 1; i < reels.length; i++) {
    if (reels[i].id === first.id) count++;
    else break;
  }
  if (count >= 3) {
    const mult = first.payout[count] ?? 0;
    return {
      amount: mult * bet * vipMult,
      winningReels: Array.from({ length: count }, (_, i) => i),
      count,
      symbol: first,
    };
  }
  return { amount: 0, winningReels: [], count: 0, symbol: null };
}

const BET_PRESETS_STD = [10, 25, 50, 100];
const BET_PRESETS_VIP = [50, 100, 250, 500];

const SYMBOL_H = 84;
const STRIP_BEFORE = 20;
const STRIP_AFTER = 3;

interface ReelProps {
  finalSymbol: SymbolDef;
  spinning: boolean;
  delay: number;
  highlight: boolean;
}

function Reel({ finalSymbol, spinning, delay, highlight }: ReelProps) {
  const stripRef = useRef<SymbolDef[]>([]);
  const adjacentRef = useRef<[SymbolDef, SymbolDef]>([SYMBOLS[1], SYMBOLS[2]]);

  if (spinning && stripRef.current.length === 0) {
    const strip: SymbolDef[] = [];
    for (let i = 0; i < STRIP_BEFORE; i++) strip.push(pickSymbol());
    strip.push(finalSymbol);
    for (let i = 0; i < STRIP_AFTER; i++) strip.push(pickSymbol());
    stripRef.current = strip;
    adjacentRef.current = [strip[STRIP_BEFORE - 1], strip[STRIP_BEFORE + 1]];
  } else if (!spinning) {
    stripRef.current = [];
  }

  const endY = -(STRIP_BEFORE - 1) * SYMBOL_H;

  return (
    <motion.div
      animate={
        highlight
          ? {
              boxShadow: [
                `0 0 0px ${finalSymbol.glowColor}`,
                `0 0 30px ${finalSymbol.glowColor}`,
                `0 0 15px ${finalSymbol.glowColor}`,
              ],
            }
          : { boxShadow: "0 0 0px rgba(0,0,0,0)" }
      }
      transition={highlight ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      className={cn(
        "relative rounded-lg border-2 overflow-hidden",
        highlight ? "border-yellow-300" : "border-emerald-800/60",
      )}
      style={{
        width: 90,
        height: SYMBOL_H * 3,
        background: "linear-gradient(180deg, #021a0a 0%, #03300f 50%, #021a0a 100%)",
      }}
    >
      {/* Spinning strip */}
      {spinning ? (
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: endY }}
          transition={{ duration: 1.7 + delay * 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          className="absolute top-0 left-0 right-0"
        >
          {stripRef.current.map((sym, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ height: SYMBOL_H }}
            >
              <span style={{ fontSize: "2.6rem", lineHeight: 1 }}>{sym.emoji}</span>
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="absolute top-0 left-0 right-0">
          {/* Above */}
          <div
            className="flex items-center justify-center"
            style={{ height: SYMBOL_H, opacity: 0.45 }}
          >
            <span style={{ fontSize: "2rem", lineHeight: 1 }}>{adjacentRef.current[0].emoji}</span>
          </div>
          {/* Center — payline */}
          <div className="flex items-center justify-center" style={{ height: SYMBOL_H }}>
            <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>{finalSymbol.emoji}</span>
          </div>
          {/* Below */}
          <div
            className="flex items-center justify-center"
            style={{ height: SYMBOL_H, opacity: 0.45 }}
          >
            <span style={{ fontSize: "2rem", lineHeight: 1 }}>{adjacentRef.current[1].emoji}</span>
          </div>
        </div>
      )}

      {/* Top/bottom fade */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{
          height: SYMBOL_H,
          background: "linear-gradient(to bottom, rgba(2,26,10,0.92) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{
          height: SYMBOL_H,
          background: "linear-gradient(to top, rgba(2,26,10,0.92) 0%, transparent 100%)",
        }}
      />
    </motion.div>
  );
}

interface HistoryEntry {
  id: number;
  reels: SymbolDef[];
  win: number;
}

function CoinParticle({ i, total }: { i: number; total: number }) {
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  const dist = 80 + Math.random() * 80;
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 0.5, rotate: 0 }}
      animate={{
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 40,
        opacity: [1, 1, 0],
        scale: [0.5, 1, 0.7],
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
      }}
      transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.04 }}
      className="absolute text-2xl pointer-events-none"
    >
      🪙
    </motion.div>
  );
}

export default function Slots() {
  const { balance, placeBet, stats } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [reels, setReels] = useState<SymbolDef[]>([
    SYMBOLS[0], SYMBOLS[1], SYMBOLS[2], SYMBOLS[3], SYMBOLS[4],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<WinInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showCoins, setShowCoins] = useState(false);
  const idRef = useRef(0);
  const vipUnlocked = isVipUnlocked("slots", stats.handsPlayed);
  const [isVip, setIsVip] = useState(false);
  const effectiveVip = isVip && vipUnlocked;
  const vipMult = effectiveVip ? 2 : 1;
  const maxBet = effectiveVip ? 1000 : 500;
  const presets = effectiveVip ? BET_PRESETS_VIP : BET_PRESETS_STD;

  const canSpin = balance >= bet && !spinning;

  const handleSpin = () => {
    if (!canSpin) return;
    const result: SymbolDef[] = Array.from({ length: 5 }, () => pickSymbol());
    setReels(result);
    setSpinning(true);
    setLastResult(null);
    setShowCoins(false);

    const info = evaluate(result, bet, vipMult);

    setTimeout(() => {
      setSpinning(false);
      setLastResult(info);
      if (info.amount > 0) {
        setShowCoins(true);
        setTimeout(() => setShowCoins(false), 2000);
      }
      setHistory((prev) =>
        [{ id: ++idRef.current, reels: result, win: info.amount }, ...prev].slice(0, 8),
      );
      placeBet("slots", bet, info.amount, {
        multiplier: bet > 0 ? info.amount / bet : 0,
        special:
          info.count === 5 && info.symbol?.id === "crown" ? "slots-jackpot" : undefined,
      });
    }, 2600);
  };

  useRegisterPlayAgain(
    !spinning && lastResult
      ? { label: "Spin Again", onClick: handleSpin, disabled: balance < bet }
      : null,
    [spinning, lastResult, bet, balance, vipMult],
  );

  const isJackpot = lastResult?.count === 5 && lastResult.symbol?.id === "crown";
  const bigWin = !isJackpot && lastResult && lastResult.count === 5;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="text-xs uppercase tracking-[0.3em] text-emerald-400/80">
          {effectiveVip ? "VIP · Doubled Paytable" : "Five Reels · Irish Fortune"}
        </div>
        <h1 className="font-serif text-4xl" style={{ color: "#d4af37" }}>
          🍀 Clover Reels
        </h1>
        <div className="flex justify-center">
          <VipToggle game="slots" isVip={isVip} onChange={setIsVip} disabled={spinning} />
        </div>
      </div>

      {/* Machine cabinet */}
      <motion.div
        animate={isJackpot ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
        transition={isJackpot ? { duration: 0.5, repeat: 3 } : { duration: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0b2e0f 0%, #071a09 100%)",
          border: "3px solid",
          borderColor: "#2a7a35",
          boxShadow: "0 0 40px rgba(34,197,94,0.15), inset 0 0 40px rgba(0,0,0,0.5)",
          padding: "28px",
        }}
      >
        {/* Gold trim top */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: "linear-gradient(90deg, transparent, #d4af37, #f5d876, #d4af37, transparent)" }}
        />

        {/* Jackpot / Win celebration */}
        <AnimatePresence>
          {isJackpot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="text-center">
                <div className="text-7xl">🏆</div>
                <div
                  className="font-serif text-5xl font-bold mt-2"
                  style={{ color: "#ffd700", textShadow: "0 0 30px #ffd700" }}
                >
                  JACKPOT!
                </div>
              </div>
              {Array.from({ length: 20 }).map((_, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const dist = 120 + Math.random() * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: [0, 1, 0],
                      scale: [0, 1.4, 0],
                    }}
                    transition={{ duration: 2, ease: "easeOut", delay: i * 0.06 }}
                    className="absolute text-3xl"
                  >
                    {["🍀", "💰", "🌈", "⭐", "🪙"][i % 5]}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coin shower */}
        <AnimatePresence>
          {showCoins && !isJackpot && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              {Array.from({ length: 14 }).map((_, i) => (
                <CoinParticle key={i} i={i} total={14} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Payline indicator */}
        <div className="relative">
          {/* Arrow indicators on both sides */}
          <div className="absolute -left-5 flex items-center" style={{ top: SYMBOL_H }}>
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: "#ffd700", boxShadow: "0 0 8px #ffd700" }}
            />
          </div>
          <div className="absolute -right-5 flex items-center" style={{ top: SYMBOL_H }}>
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: "#ffd700", boxShadow: "0 0 8px #ffd700" }}
            />
          </div>

          {/* Payline line */}
          <div
            className="absolute inset-x-0 z-20 pointer-events-none"
            style={{
              top: SYMBOL_H + SYMBOL_H / 2 - 1,
              height: 2,
              background: "linear-gradient(90deg, transparent 0%, #ffd700 10%, #ffd700 90%, transparent 100%)",
              opacity: spinning ? 0.4 : 0.7,
            }}
          />

          {/* Reels row */}
          <div className="flex justify-center gap-1.5">
            {reels.map((sym, i) => (
              <Reel
                key={i}
                finalSymbol={sym}
                spinning={spinning}
                delay={i * 0.15}
                highlight={!spinning && !!lastResult && lastResult.winningReels.includes(i)}
              />
            ))}
          </div>
        </div>

        {/* Win message */}
        <div className="mt-5 h-12 flex items-center justify-center">
          {lastResult && lastResult.amount > 0 && !isJackpot ? (
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="font-serif text-3xl tabular-nums"
              style={{ color: "#4ade80", textShadow: "0 0 20px rgba(74,222,128,0.5)" }}
            >
              {bigWin ? "🌟 BIG WIN! " : ""}
              +{lastResult.amount.toLocaleString()} chips
            </motion.div>
          ) : lastResult && lastResult.amount === 0 && !spinning ? (
            <div className="text-emerald-900 text-sm italic">No luck this spin — try again!</div>
          ) : null}
        </div>

        {/* Bet controls */}
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400/70 text-sm">Bet</span>
            <span
              className="font-mono text-2xl tabular-nums"
              style={{ color: "#d4af37" }}
            >
              {bet}
            </span>
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
            {presets.map((p) => (
              <Button
                key={p}
                size="sm"
                variant="outline"
                disabled={spinning || p > balance}
                onClick={() => setBet(p)}
                className="flex-1"
                style={{ borderColor: "rgba(212,175,55,0.3)", color: "#d4af37" }}
              >
                {p}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={spinning || balance === 0}
              onClick={() => setBet(Math.min(balance, maxBet))}
              className="flex-1"
              style={{ borderColor: "rgba(212,175,55,0.3)", color: "#d4af37" }}
            >
              Max
            </Button>
          </div>
          <Button
            size="lg"
            disabled={!canSpin}
            onClick={handleSpin}
            className="w-full h-14 text-lg font-serif disabled:opacity-50"
            style={{
              background: canSpin
                ? "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)"
                : undefined,
              color: "white",
              border: "1px solid #22c55e",
              boxShadow: canSpin ? "0 0 20px rgba(34,197,94,0.3)" : undefined,
            }}
          >
            <Coins className="w-5 h-5 mr-2" />
            {spinning
              ? "Spinning..."
              : balance < bet
                ? "Insufficient Chips"
                : "🍀 Spin"}
          </Button>
        </div>

        {/* Gold trim bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-1"
          style={{ background: "linear-gradient(90deg, transparent, #d4af37, #f5d876, #d4af37, transparent)" }}
        />
      </motion.div>

      {/* History */}
      {history.length > 0 && (
        <div
          className="rounded-xl border p-3"
          style={{ borderColor: "rgba(34,197,94,0.2)", background: "rgba(2,26,10,0.6)" }}
        >
          <div className="text-xs uppercase tracking-[0.25em] text-emerald-600 mb-2">Recent Spins</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="shrink-0 rounded-lg border px-2 py-1.5 flex flex-col items-center gap-1"
                style={{
                  borderColor: h.win > 0 ? "rgba(212,175,55,0.4)" : "rgba(34,197,94,0.15)",
                  background: h.win > 0 ? "rgba(212,175,55,0.08)" : "rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-center gap-0.5">
                  {h.reels.map((s, i) => (
                    <span key={i} style={{ fontSize: "0.9rem" }}>
                      {s.emoji}
                    </span>
                  ))}
                </div>
                <div
                  className="text-[10px] font-mono tabular-nums"
                  style={{ color: h.win > 0 ? "#d4af37" : "#4a7a55" }}
                >
                  {h.win > 0 ? `+${h.win}` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paytable */}
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-emerald-600 hover:text-emerald-400">
              <Info className="w-4 h-4 mr-2" />
              View Paytable
            </Button>
          </DialogTrigger>
          <DialogContent
            style={{ background: "#071a09", border: "1px solid rgba(34,197,94,0.3)" }}
          >
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl" style={{ color: "#d4af37" }}>
                🍀 Paytable
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              {effectiveVip && (
                <div className="text-xs uppercase tracking-wider text-emerald-400 mb-2 text-center">
                  VIP — all payouts doubled
                </div>
              )}
              <div className="text-xs text-emerald-600 mb-2 text-center">
                Match left-to-right on centre payline
              </div>
              {SYMBOLS.slice()
                .sort((a, b) => (b.payout[3] ?? 0) - (a.payout[3] ?? 0))
                .map((sym) => (
                  <div
                    key={sym.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border"
                    style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(34,197,94,0.15)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{sym.emoji}</span>
                      <span className="text-sm text-emerald-300">{sym.label}</span>
                    </div>
                    <div className="flex gap-3 text-xs font-mono">
                      <span className="text-emerald-600">3×{sym.payout[3] * vipMult}</span>
                      <span className="text-emerald-400">4×{sym.payout[4] * vipMult}</span>
                      <span style={{ color: "#d4af37" }}>5×{sym.payout[5] * vipMult}</span>
                    </div>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
