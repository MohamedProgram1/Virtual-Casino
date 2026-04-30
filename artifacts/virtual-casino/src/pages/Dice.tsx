import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { isVipUnlocked } from "@/lib/levels";
import { VipToggle } from "@/components/VipToggle";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const HOUSE_EDGE_STD = 0.01;
const HOUSE_EDGE_VIP = 0.005;

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 28], [70, 28], [30, 50], [70, 50], [30, 72], [70, 72]],
};

function DieFace({
  value,
  size = 100,
  glowing = false,
  won,
}: {
  value: number;
  size?: number;
  glowing?: boolean;
  won?: boolean;
}) {
  const dots = DOT_POSITIONS[value] ?? DOT_POSITIONS[1];
  const dotColor = won === true ? "#16a34a" : won === false ? "#e11d48" : "#1c1917";
  const faceId = `face-${size}-${value}-${String(glowing)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={faceId} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fafafa" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </radialGradient>
      </defs>
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="18"
        fill={`url(#${faceId})`}
        stroke={glowing ? (won ? "#4ade80" : "#fb7185") : "rgba(0,0,0,0.2)"}
        strokeWidth={glowing ? 3 : 1.5}
        style={
          glowing
            ? {
                filter: `drop-shadow(0 0 8px ${won ? "#4ade80" : "#fb7185"})`,
              }
            : undefined
        }
      />
      {/* Rounded corners accent */}
      <rect x="4" y="4" width="92" height="92" rx="18" fill="rgba(0,0,0,0.04)" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="8.5" fill={dotColor} />
      ))}
    </svg>
  );
}

function RollingDice({ size = 100 }: { size?: number }) {
  // Tumble the cube continuously while the roll resolves.
  const half = size / 2;
  const faceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
  };
  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: 700,
        filter:
          "drop-shadow(0 18px 22px rgba(0,0,0,0.55)) drop-shadow(0 4px 6px rgba(0,0,0,0.4))",
      }}
    >
      <motion.div
        animate={{ rotateX: [0, 360, 720, 1080], rotateY: [0, 360, 0, -360] }}
        transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
        style={{
          width: size,
          height: size,
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ ...faceStyle, transform: `translateZ(${half}px)` }}>
          <DieFace value={1} size={size} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${half}px)` }}>
          <DieFace value={6} size={size} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${half}px)` }}>
          <DieFace value={2} size={size} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${half}px)` }}>
          <DieFace value={5} size={size} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${half}px)` }}>
          <DieFace value={3} size={size} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${half}px)` }}>
          <DieFace value={4} size={size} />
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dice3D — CSS 3D cube with all six faces. Rotates to land on `value`.       */
/* -------------------------------------------------------------------------- */

// Rotation that brings each face value to the front of the cube.
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
};

function Dice3D({
  value,
  size = 100,
  rolling = false,
  won,
}: {
  value: number;
  size?: number;
  rolling?: boolean;
  won?: boolean;
}) {
  const target = FACE_ROTATIONS[value] ?? FACE_ROTATIONS[1];
  // When rolling, layer multiple full turns onto the target rotation so the
  // cube tumbles dramatically before settling on the right face.
  const animateRotate = rolling
    ? { rotateX: target.x + 720, rotateY: target.y + 720 }
    : { rotateX: target.x, rotateY: target.y };
  const half = size / 2;
  const faceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
  };
  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: 700,
        filter:
          "drop-shadow(0 18px 22px rgba(0,0,0,0.5)) drop-shadow(0 4px 6px rgba(0,0,0,0.4))",
      }}
    >
      <motion.div
        animate={animateRotate}
        transition={{
          duration: rolling ? 1.0 : 0.4,
          ease: rolling ? [0.2, 0.6, 0.3, 1] : "easeOut",
          repeat: rolling ? Infinity : 0,
        }}
        style={{
          width: size,
          height: size,
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ ...faceStyle, transform: `translateZ(${half}px)` }}>
          <DieFace value={1} size={size} won={won} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${half}px)` }}>
          <DieFace value={6} size={size} won={won} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${half}px)` }}>
          <DieFace value={2} size={size} won={won} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${half}px)` }}>
          <DieFace value={5} size={size} won={won} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${half}px)` }}>
          <DieFace value={3} size={size} won={won} />
        </div>
        <div style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${half}px)` }}>
          <DieFace value={4} size={size} won={won} />
        </div>
      </motion.div>
    </div>
  );
}

export default function Dice() {
  const { balance, placeBet, stats } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<"over" | "under">("over");
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const vipUnlocked = isVipUnlocked("dice", stats.handsPlayed);
  const [isVip, setIsVip] = useState(false);
  const effectiveVip = isVip && vipUnlocked;
  const houseEdge = effectiveVip ? HOUSE_EDGE_VIP : HOUSE_EDGE_STD;
  const maxBet = effectiveVip ? 1000 : 500;

  const winChance =
    direction === "under" ? Math.max(1, target - 1) : Math.max(1, 100 - target);
  const multiplier = +(((1 - houseEdge) * 100) / winChance).toFixed(4);
  const potentialPayout = Math.floor(bet * multiplier);

  const canRoll = balance >= bet && !rolling && winChance >= 1 && winChance <= 99;

  const roll = () => {
    if (!canRoll) return;
    setRolling(true);
    setLastRoll(null);
    setLastWin(null);
    playSound("dice");

    const result = Math.floor(Math.random() * 100) + 1;
    const won = direction === "under" ? result < target : result > target;
    const payout = won ? potentialPayout : 0;

    setTimeout(() => {
      setLastRoll(result);
      setLastWin(won);
      setRolling(false);
      placeBet("dice", bet, payout, { multiplier });
    }, 1100);
  };

  // Convert 1-100 roll to a 1-6 die face (just for display)
  const displayFace = lastRoll !== null ? Math.ceil((lastRoll / 100) * 6) : 1;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          {(houseEdge * 100).toFixed(1)}% House Edge · Pick Your Risk
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Over / Under</h1>
        <div className="flex justify-center">
          <VipToggle game="dice" isVip={isVip} onChange={setIsVip} disabled={rolling} />
        </div>
      </div>

      {/* Roll display */}
      <div className="casino-card p-8 sm:p-10 text-center space-y-6">
        {/* Dice visual */}
        <div className="flex items-center justify-center gap-6 min-h-36">
          <AnimatePresence mode="wait">
            {rolling ? (
              <motion.div key="rolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RollingDice size={110} />
              </motion.div>
            ) : lastRoll !== null ? (
              <motion.div
                key={`result-${lastRoll}`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 14 }}
              >
                <Dice3D
                  value={displayFace}
                  size={110}
                  won={lastWin ?? undefined}
                />
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}>
                <Dice3D value={1} size={110} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Number result */}
          {lastRoll !== null && !rolling && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-left"
            >
              <div
                className={cn(
                  "font-serif text-7xl sm:text-8xl tabular-nums font-bold leading-none",
                  lastWin ? "text-emerald-400" : "text-rose-500",
                )}
              >
                {lastRoll}
              </div>
              <div
                className={cn(
                  "text-sm font-mono mt-1",
                  lastWin ? "text-emerald-400/70" : "text-rose-400/70",
                )}
              >
                {lastWin ? `+${potentialPayout - bet} chips` : `−${bet} chips`}
              </div>
            </motion.div>
          )}
        </div>

        {/* Target slider visualization */}
        <div className="space-y-3 pt-2">
          <div className="relative h-4 rounded-full overflow-hidden border border-primary/20">
            <div
              className={cn(
                "absolute inset-y-0 left-0 transition-all duration-300 rounded-l-full",
                direction === "under"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                  : "bg-gradient-to-r from-rose-800 to-rose-600",
              )}
              style={{ width: `${target}%` }}
            />
            <div
              className={cn(
                "absolute inset-y-0 right-0 transition-all duration-300 rounded-r-full",
                direction === "over"
                  ? "bg-gradient-to-l from-emerald-600 to-emerald-400"
                  : "bg-gradient-to-l from-rose-800 to-rose-600",
              )}
              style={{ width: `${100 - target}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
              style={{ left: `${target}%`, transform: "translateX(-50%)" }}
            />
          </div>
          <Slider
            value={[target]}
            min={2}
            max={99}
            step={1}
            onValueChange={(v) => setTarget(v[0])}
            disabled={rolling}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>1</span>
            <span className="text-primary text-base font-semibold">Target: {target}</span>
            <span>100</span>
          </div>
        </div>

        {/* Direction toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDirection("under")}
            disabled={rolling}
            className={cn(
              "h-14 rounded-xl border-2 font-serif text-base transition-all flex items-center justify-center gap-2",
              direction === "under"
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                : "border-primary/20 text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-300",
              rolling && "opacity-50 cursor-not-allowed",
            )}
          >
            <ArrowDown className="w-5 h-5" />
            Roll Under {target}
          </button>
          <button
            type="button"
            onClick={() => setDirection("over")}
            disabled={rolling}
            className={cn(
              "h-14 rounded-xl border-2 font-serif text-base transition-all flex items-center justify-center gap-2",
              direction === "over"
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                : "border-primary/20 text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-300",
              rolling && "opacity-50 cursor-not-allowed",
            )}
          >
            <ArrowUp className="w-5 h-5" />
            Roll Over {target}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { label: "Win Chance", val: `${winChance}%` },
            { label: "Multiplier", val: `${multiplier.toFixed(2)}×` },
            { label: "Payout", val: `${potentialPayout}` },
          ].map(({ label, val }) => (
            <div
              key={label}
              className="rounded-xl border border-primary/15 bg-background/50 px-3 py-2.5 text-center"
            >
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {label}
              </div>
              <div className="font-mono text-xl text-primary tabular-nums mt-0.5">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bet controls */}
      <div className="casino-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Bet</div>
          <div className="font-mono text-2xl text-primary tabular-nums">{bet}</div>
        </div>
        <Slider
          value={[bet]}
          min={1}
          max={Math.max(1, Math.min(maxBet, balance))}
          step={1}
          onValueChange={(v) => setBet(v[0])}
          disabled={rolling || balance === 0}
        />
        <div className="flex gap-2">
          {(effectiveVip ? [50, 100, 250, 500] : [10, 25, 50, 100]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant="outline"
              disabled={rolling || p > balance}
              onClick={() => setBet(p)}
              className="flex-1 border-primary/30"
            >
              {p}
            </Button>
          ))}
        </div>
        <Button
          size="lg"
          disabled={!canRoll}
          onClick={roll}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          <Coins className="w-5 h-5 mr-2" />
          {rolling ? "Rolling..." : balance < bet ? "Insufficient Chips" : "🎲 Roll"}
        </Button>
      </div>
    </div>
  );
}
