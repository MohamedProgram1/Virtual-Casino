import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { isVipUnlocked } from "@/lib/levels";
import { VipToggle } from "@/components/VipToggle";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

// Standard European wheel order (single zero)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

type BetType =
  | { kind: "number"; value: number }
  | { kind: "red" }
  | { kind: "black" }
  | { kind: "odd" }
  | { kind: "even" }
  | { kind: "low" } // 1-18
  | { kind: "high" } // 19-36
  | { kind: "dozen"; value: 1 | 2 | 3 }
  | { kind: "column"; value: 1 | 2 | 3 };

interface PlacedBet {
  id: string;
  type: BetType;
  amount: number;
  label: string;
}

const CHIP_VALUES_STD = [5, 10, 25, 100];
const CHIP_VALUES_VIP = [25, 50, 100, 250];

function colorOf(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

function payoutFor(type: BetType, n: number, amount: number, vip: boolean): number {
  // Returns total returned to player (stake + winnings) on win, 0 on loss
  switch (type.kind) {
    case "number":
      // Standard: 35:1 + stake = 36x. VIP: 36:1 + stake = 37x.
      return n === type.value ? amount * (vip ? 37 : 36) : 0;
    case "red":
      return n !== 0 && colorOf(n) === "red" ? amount * 2 : 0;
    case "black":
      return n !== 0 && colorOf(n) === "black" ? amount * 2 : 0;
    case "odd":
      return n !== 0 && n % 2 === 1 ? amount * 2 : 0;
    case "even":
      return n !== 0 && n % 2 === 0 ? amount * 2 : 0;
    case "low":
      return n >= 1 && n <= 18 ? amount * 2 : 0;
    case "high":
      return n >= 19 && n <= 36 ? amount * 2 : 0;
    case "dozen": {
      const start = (type.value - 1) * 12 + 1;
      const end = type.value * 12;
      return n >= start && n <= end ? amount * 3 : 0;
    }
    case "column": {
      // Column 1 = numbers where (n - 1) % 3 === 0
      // Column 2 = (n - 2) % 3 === 0
      // Column 3 = n % 3 === 0
      if (n === 0) return 0;
      const col = type.value === 3 ? (n % 3 === 0 ? 3 : 0) : (n % 3 === type.value ? type.value : 0);
      return col === type.value ? amount * 3 : 0;
    }
  }
}

function isWinning(type: BetType, n: number): boolean {
  return payoutFor(type, n, 1, false) > 0;
}

function Chip({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  const colors: Record<number, string> = {
    5: "from-red-600 to-red-800 border-red-300",
    10: "from-blue-600 to-blue-800 border-blue-300",
    25: "from-emerald-600 to-emerald-800 border-emerald-300",
    50: "from-orange-500 to-orange-700 border-orange-300",
    100: "from-zinc-100 to-zinc-300 border-zinc-400 text-zinc-900",
    250: "from-purple-600 to-purple-900 border-purple-300",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center font-bold text-sm shadow-lg transition-all bg-gradient-to-br",
        colors[value] ?? "from-zinc-500 to-zinc-700 border-zinc-300",
        selected ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105",
      )}
    >
      {value}
    </button>
  );
}

interface BetSpotProps {
  label: string | number;
  amount: number;
  onPlace: () => void;
  className?: string;
  highlight?: boolean;
  children?: React.ReactNode;
}

function BetSpot({ amount, onPlace, className, highlight, children, label }: BetSpotProps) {
  return (
    <button
      onClick={onPlace}
      className={cn(
        "relative flex items-center justify-center font-semibold text-sm transition-all hover:brightness-125 active:scale-95",
        highlight && "ring-2 ring-primary ring-offset-1 ring-offset-emerald-950 z-[5]",
        className,
      )}
    >
      {children ?? label}
      {amount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-7 h-7 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg z-10 border border-primary/40"
        >
          {amount}
        </motion.div>
      )}
    </button>
  );
}

interface SpinHistoryEntry {
  id: number;
  number: number;
  net: number;
}

const SPIN_DURATION_MS = 4200;

export default function Roulette() {
  const { balance, placeBet, stats } = useCasinoStore();
  const vipUnlocked = isVipUnlocked("roulette", stats.handsPlayed);
  const [isVip, setIsVip] = useState(false);
  const effectiveVip = isVip && vipUnlocked;
  const chipValues = effectiveVip ? CHIP_VALUES_VIP : CHIP_VALUES_STD;
  const [chipValue, setChipValue] = useState(5);
  const [bets, setBets] = useState<Map<string, PlacedBet>>(new Map());
  const lastBetsRef = useRef<Map<string, PlacedBet>>(new Map());
  const [spinning, setSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [history, setHistory] = useState<SpinHistoryEntry[]>([]);
  const idRef = useRef(0);

  // Reset chip value when toggling VIP if current value isn't in the new set
  if (!chipValues.includes(chipValue)) {
    setChipValue(chipValues[0]);
  }

  const totalBet = useMemo(
    () => Array.from(bets.values()).reduce((s, b) => s + b.amount, 0),
    [bets],
  );

  const placeChip = (key: string, type: BetType, label: string) => {
    if (spinning) return;
    if (balance < totalBet + chipValue) return;
    setBets((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing) {
        next.set(key, { ...existing, amount: existing.amount + chipValue });
      } else {
        next.set(key, { id: key, type, amount: chipValue, label });
      }
      return next;
    });
    setResultNumber(null);
  };

  const clearBets = () => {
    if (spinning) return;
    setBets(new Map());
    setResultNumber(null);
  };

  const repeatLastBets = () => {
    if (spinning) return;
    const last = lastBetsRef.current;
    if (last.size === 0) return;
    const total = Array.from(last.values()).reduce((s, b) => s + b.amount, 0);
    if (balance < total) return;
    setBets(new Map(last));
    setResultNumber(null);
  };

  const runSpin = (currentBets: Map<string, PlacedBet>) => {
    if (spinning || currentBets.size === 0) return;
    const wager = Array.from(currentBets.values()).reduce((s, b) => s + b.amount, 0);
    if (balance < wager) return;

    setSpinning(true);
    setResultNumber(null);

    const winning = Math.floor(Math.random() * 37);
    const wheelIndex = WHEEL_ORDER.indexOf(winning);
    const sliceAngle = 360 / WHEEL_ORDER.length;

    // Wheel spins clockwise; ball spins counter-clockwise relative to wheel
    // and finally lands on the winning slice. We compute their final
    // orientations so the ball sits over the winning pocket.
    const wheelExtra = 360 * 6;
    setWheelRotation((prev) => prev + wheelExtra);

    // The ball needs to end at angle = -wheelIndex * sliceAngle - (wheel's
    // final rotation modulo 360) so visually the ball is locked above the
    // winning pocket. We simplify by matching the wheel's final orientation
    // and offsetting so the ball is at the correct slice.
    const ballExtra = -360 * 9 - wheelIndex * sliceAngle;
    setBallRotation((prev) => prev + ballExtra);

    setTimeout(() => {
      const totalReturn = Array.from(currentBets.values()).reduce(
        (sum, b) => sum + payoutFor(b.type, winning, b.amount, effectiveVip),
        0,
      );
      const straightHit = Array.from(currentBets.values()).some(
        (b) => b.type.kind === "number" && b.type.value === winning,
      );
      placeBet(
        "roulette",
        wager,
        totalReturn,
        straightHit ? { special: "roulette-straight" } : undefined,
      );
      setResultNumber(winning);
      setSpinning(false);
      setHistory((prev) =>
        [{ id: ++idRef.current, number: winning, net: totalReturn - wager }, ...prev].slice(0, 12),
      );
      // Remember bets for "Repeat" / "Play Again" but clear the table
      lastBetsRef.current = new Map(currentBets);
      setBets(new Map());
    }, SPIN_DURATION_MS);
  };

  const spin = () => runSpin(bets);

  // Floating Play Again — re-places the previous bets and spins again.
  // Only show after a spin has resolved and the user has a saved bet pattern.
  const replayCost = useMemo(
    () => Array.from(lastBetsRef.current.values()).reduce((s, b) => s + b.amount, 0),
    // resultNumber gates registration; lastBetsRef updates synchronously inside runSpin
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resultNumber],
  );
  useRegisterPlayAgain(
    !spinning && resultNumber !== null && lastBetsRef.current.size > 0
      ? {
          label: `Replay (${replayCost})`,
          onClick: () => runSpin(new Map(lastBetsRef.current)),
          disabled: balance < replayCost || bets.size > 0,
        }
      : null,
    [spinning, resultNumber, replayCost, balance, bets.size, effectiveVip],
  );

  const getAmount = (key: string) => bets.get(key)?.amount ?? 0;

  // Highlight cells that would have won given the latest result.
  const isCellHighlighted = (type: BetType): boolean => {
    if (spinning || resultNumber === null) return false;
    return isWinning(type, resultNumber);
  };

  const numberCellClass = (n: number, highlight: boolean) => {
    const c = colorOf(n);
    return cn(
      "h-12 border border-emerald-900/60 text-white",
      c === "red" && "bg-red-700",
      c === "black" && "bg-zinc-900",
      c === "green" && "bg-emerald-600",
      highlight && "outline outline-2 outline-primary",
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          European · Single Zero · Straight pays {effectiveVip ? "36:1" : "35:1"}
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Roulette</h1>
        <div className="flex justify-center">
          <VipToggle
            game="roulette"
            isVip={isVip}
            onChange={setIsVip}
            disabled={spinning || bets.size > 0}
          />
        </div>
      </div>

      {/* Wheel + ball */}
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
          {/* Outer rim */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-700 to-amber-950 shadow-2xl" />
          {/* Wheel */}
          <motion.div
            animate={{ rotate: wheelRotation }}
            transition={{ duration: SPIN_DURATION_MS / 1000, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-3 rounded-full overflow-hidden"
            style={{
              background:
                "conic-gradient(from 0deg, " +
                WHEEL_ORDER.map((n, i) => {
                  const c = colorOf(n);
                  const bg = c === "red" ? "#b91c1c" : c === "black" ? "#18181b" : "#059669";
                  const start = (i / WHEEL_ORDER.length) * 360;
                  const end = ((i + 1) / WHEEL_ORDER.length) * 360;
                  return `${bg} ${start}deg ${end}deg`;
                }).join(", ") +
                ")",
              boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)",
            }}
          >
            {/* Slice number ring */}
            <div className="absolute inset-0">
              {WHEEL_ORDER.map((n, i) => {
                const angle = (i + 0.5) * (360 / WHEEL_ORDER.length);
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 origin-[0_0]"
                    style={{
                      transform: `rotate(${angle}deg) translate(-50%, -100%) translateY(8px)`,
                    }}
                  >
                    <span className="block text-[9px] sm:text-[10px] font-bold text-white/90 select-none">
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Hub */}
            <div className="absolute inset-1/3 rounded-full bg-gradient-to-b from-amber-600 to-amber-900 border-2 border-amber-400/40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-amber-950" />
            </div>
          </motion.div>

          {/* Ball track ring (decorative) */}
          <div className="absolute inset-2 rounded-full border border-amber-300/15 pointer-events-none" />

          {/* Ball — counter-rotates and lands on winning slice */}
          <motion.div
            animate={{ rotate: ballRotation }}
            transition={{ duration: SPIN_DURATION_MS / 1000, ease: [0.18, 0.55, 0.3, 1] }}
            className="absolute inset-3 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0">
              <div className="w-3 h-3 rounded-full bg-gradient-to-b from-white to-zinc-300 shadow-[0_0_6px_rgba(255,255,255,0.7)] border border-zinc-400/60" />
            </div>
          </motion.div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
          </div>
        </div>

        {/* Result */}
        <div className="h-12 flex items-center mt-4">
          {resultNumber !== null && !spinning && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="text-sm text-muted-foreground">The ball lands on</div>
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg",
                  colorOf(resultNumber) === "red" && "bg-red-700",
                  colorOf(resultNumber) === "black" && "bg-zinc-900",
                  colorOf(resultNumber) === "green" && "bg-emerald-600",
                )}
              >
                {resultNumber}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recent results strip */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            <span className="text-xs uppercase tracking-[0.25em] text-primary/70 mr-1">
              Recent
            </span>
            {history.map((h) => {
              const c = colorOf(h.number);
              return (
                <div
                  key={h.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md",
                    c === "red" && "bg-red-700",
                    c === "black" && "bg-zinc-900",
                    c === "green" && "bg-emerald-600",
                  )}
                  title={h.net >= 0 ? `+${h.net}` : `${h.net}`}
                >
                  {h.number}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout */}
      <div
        className="rounded-2xl border-2 border-primary/20 p-3 sm:p-5"
        style={{
          background: "linear-gradient(135deg, hsl(162 67% 18%) 0%, hsl(162 67% 12%) 100%)",
        }}
      >
        {/* Numbers grid */}
        <div className="flex gap-1">
          {/* Zero */}
          <BetSpot
            label="0"
            amount={getAmount("n0")}
            onPlace={() => placeChip("n0", { kind: "number", value: 0 }, "0")}
            highlight={isCellHighlighted({ kind: "number", value: 0 })}
            className={cn("w-10 sm:w-12 rounded-l-md text-white", "bg-emerald-600 hover:brightness-125")}
          >
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>0</span>
          </BetSpot>
          {/* 3x12 grid */}
          <div className="flex-1 grid grid-cols-12 grid-rows-3 gap-1">
            {/* Top row: 3, 6, 9, ..., 36 */}
            {Array.from({ length: 12 }, (_, i) => 3 + i * 3).map((n) => (
              <BetSpot
                key={`n${n}`}
                label={n}
                amount={getAmount(`n${n}`)}
                onPlace={() => placeChip(`n${n}`, { kind: "number", value: n }, `${n}`)}
                highlight={isCellHighlighted({ kind: "number", value: n })}
                className={numberCellClass(n, false)}
              />
            ))}
            {Array.from({ length: 12 }, (_, i) => 2 + i * 3).map((n) => (
              <BetSpot
                key={`n${n}`}
                label={n}
                amount={getAmount(`n${n}`)}
                onPlace={() => placeChip(`n${n}`, { kind: "number", value: n }, `${n}`)}
                highlight={isCellHighlighted({ kind: "number", value: n })}
                className={numberCellClass(n, false)}
              />
            ))}
            {Array.from({ length: 12 }, (_, i) => 1 + i * 3).map((n) => (
              <BetSpot
                key={`n${n}`}
                label={n}
                amount={getAmount(`n${n}`)}
                onPlace={() => placeChip(`n${n}`, { kind: "number", value: n }, `${n}`)}
                highlight={isCellHighlighted({ kind: "number", value: n })}
                className={numberCellClass(n, false)}
              />
            ))}
          </div>
          {/* Columns 2:1 */}
          <div className="flex flex-col gap-1 w-12 sm:w-16">
            {[3, 2, 1].map((c) => (
              <BetSpot
                key={`col${c}`}
                label="2:1"
                amount={getAmount(`col${c}`)}
                onPlace={() =>
                  placeChip(`col${c}`, { kind: "column", value: c as 1 | 2 | 3 }, `Col ${c}`)
                }
                highlight={isCellHighlighted({ kind: "column", value: c as 1 | 2 | 3 })}
                className="h-12 bg-emerald-900/50 rounded-md text-emerald-100 hover:bg-emerald-800"
              />
            ))}
          </div>
        </div>

        {/* Dozens */}
        <div className="grid grid-cols-3 gap-1 mt-1 ml-12 sm:ml-13" style={{ marginRight: "calc(3rem + 4px)" }}>
          {[1, 2, 3].map((d) => (
            <BetSpot
              key={`dz${d}`}
              label={d === 1 ? "1st 12" : d === 2 ? "2nd 12" : "3rd 12"}
              amount={getAmount(`dz${d}`)}
              onPlace={() => placeChip(`dz${d}`, { kind: "dozen", value: d as 1 | 2 | 3 }, `${d} doz`)}
              highlight={isCellHighlighted({ kind: "dozen", value: d as 1 | 2 | 3 })}
              className="h-10 bg-emerald-900/50 rounded-md text-emerald-100 hover:bg-emerald-800"
            />
          ))}
        </div>

        {/* Outside bets */}
        <div className="grid grid-cols-6 gap-1 mt-1 ml-12 sm:ml-13" style={{ marginRight: "calc(3rem + 4px)" }}>
          <BetSpot
            label="1-18"
            amount={getAmount("low")}
            onPlace={() => placeChip("low", { kind: "low" }, "Low")}
            highlight={isCellHighlighted({ kind: "low" })}
            className="h-10 bg-emerald-900/50 rounded-md text-emerald-100 hover:bg-emerald-800"
          />
          <BetSpot
            label="EVEN"
            amount={getAmount("even")}
            onPlace={() => placeChip("even", { kind: "even" }, "Even")}
            highlight={isCellHighlighted({ kind: "even" })}
            className="h-10 bg-emerald-900/50 rounded-md text-emerald-100 hover:bg-emerald-800"
          />
          <BetSpot
            label="RED"
            amount={getAmount("red")}
            onPlace={() => placeChip("red", { kind: "red" }, "Red")}
            highlight={isCellHighlighted({ kind: "red" })}
            className="h-10 bg-red-700 rounded-md text-white hover:brightness-125"
          />
          <BetSpot
            label="BLACK"
            amount={getAmount("black")}
            onPlace={() => placeChip("black", { kind: "black" }, "Black")}
            highlight={isCellHighlighted({ kind: "black" })}
            className="h-10 bg-zinc-900 rounded-md text-white hover:brightness-125"
          />
          <BetSpot
            label="ODD"
            amount={getAmount("odd")}
            onPlace={() => placeChip("odd", { kind: "odd" }, "Odd")}
            highlight={isCellHighlighted({ kind: "odd" })}
            className="h-10 bg-emerald-900/50 rounded-md text-emerald-100 hover:bg-emerald-800"
          />
          <BetSpot
            label="19-36"
            amount={getAmount("high")}
            onPlace={() => placeChip("high", { kind: "high" }, "High")}
            highlight={isCellHighlighted({ kind: "high" })}
            className="h-10 bg-emerald-900/50 rounded-md text-emerald-100 hover:bg-emerald-800"
          />
        </div>
      </div>

      {/* Chips & controls */}
      <div className="casino-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Chip Value</div>
          <div className="text-sm text-muted-foreground">
            On Table: <span className="font-mono text-primary">{totalBet}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          {chipValues.map((v) => (
            <Chip
              key={v}
              value={v}
              selected={chipValue === v}
              onClick={() => setChipValue(v)}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={clearBets}
            disabled={spinning || bets.size === 0}
            className="border-primary/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            variant="outline"
            onClick={repeatLastBets}
            disabled={
              spinning ||
              lastBetsRef.current.size === 0 ||
              balance <
                Array.from(lastBetsRef.current.values()).reduce((s, b) => s + b.amount, 0)
            }
            className="border-primary/30"
          >
            Repeat
          </Button>
          <Button
            size="lg"
            onClick={spin}
            disabled={spinning || bets.size === 0 || balance < totalBet}
            className="font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          >
            <Coins className="w-4 h-4 mr-2" />
            {spinning ? "Spinning..." : "Spin"}
          </Button>
        </div>
      </div>
    </div>
  );
}
