import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface Segment {
  mult: number;
  color: string;
  emoji: string;
  label: string;
}

const SEGMENTS: Segment[] = [
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 1,   color: "#0f766e", emoji: "🟢", label: "1×"     },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 2,   color: "#7c3aed", emoji: "🌟", label: "2×"     },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 1.5, color: "#0d9488", emoji: "💚", label: "1.5×"   },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 5,   color: "#D4AF37", emoji: "💰", label: "5×"     },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 1,   color: "#0f766e", emoji: "🟢", label: "1×"     },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 3,   color: "#9333ea", emoji: "💜", label: "3×"     },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 1.5, color: "#0d9488", emoji: "💚", label: "1.5×"   },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 10,  color: "#f59e0b", emoji: "👑", label: "10×"    },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 1,   color: "#0f766e", emoji: "🟢", label: "1×"     },
  { mult: 0,   color: "#27272a", emoji: "💀", label: "Bust"   },
  { mult: 2,   color: "#7c3aed", emoji: "🌟", label: "2×"     },
];

const N = SEGMENTS.length;
const SEG_DEG = 360 / N;
const RADIUS = 148;
const CENTER = 170;
const SVG_SIZE = 340;

const BET_PRESETS = [10, 25, 50, 100];

function describeSlice(idx: number): string {
  const start = idx * SEG_DEG - 90 - SEG_DEG / 2;
  const end = start + SEG_DEG;
  const sx = CENTER + RADIUS * Math.cos((start * Math.PI) / 180);
  const sy = CENTER + RADIUS * Math.sin((start * Math.PI) / 180);
  const ex = CENTER + RADIUS * Math.cos((end * Math.PI) / 180);
  const ey = CENTER + RADIUS * Math.sin((end * Math.PI) / 180);
  const large = SEG_DEG > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${sx} ${sy} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${ex} ${ey} Z`;
}

function labelPos(idx: number): { x: number; y: number; rot: number } {
  const angle = idx * SEG_DEG - 90;
  const r = RADIUS * 0.68;
  return {
    x: CENTER + r * Math.cos((angle * Math.PI) / 180),
    y: CENTER + r * Math.sin((angle * Math.PI) / 180),
    rot: angle + 90,
  };
}

export default function Wheel() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{
    idx: number;
    mult: number;
    payout: number;
    bet: number;
  } | null>(null);
  const rotationRef = useRef(0);

  const motionRot = useMotionValue(0);
  const [clackerKick, setClackerKick] = useState(0);
  const lastSegRef = useRef<number>(0);

  useEffect(() => {
    const unsub = motionRot.on("change", (v) => {
      const idx = Math.floor(((((-v % 360) + 360) % 360) / SEG_DEG));
      if (idx !== lastSegRef.current) {
        lastSegRef.current = idx;
        setClackerKick((k) => k + 1);
      }
    });
    return () => unsub();
  }, [motionRot]);

  const spin = () => {
    if (spinning || balance < bet) return;
    setResult(null);
    setSpinning(true);
    playSound("spin");

    const idx = Math.floor(Math.random() * N);
    const seg = SEGMENTS[idx];

    const turns = 7 + Math.floor(Math.random() * 5);
    const baseAngle = turns * 360;
    const targetAngle = baseAngle - idx * SEG_DEG;
    const newRotation = rotationRef.current + targetAngle;
    rotationRef.current = newRotation;
    setRotation(newRotation);

    setTimeout(() => {
      const payout = Math.floor(bet * seg.mult);
      placeBet("wheel", bet, payout, { multiplier: seg.mult });
      setResult({ idx, mult: seg.mult, payout, bet });
      setSpinning(false);
    }, 4500);
  };

  useRegisterPlayAgain(
    !spinning && result
      ? { label: "Spin Again", onClick: spin, disabled: balance < bet }
      : null,
    [spinning, result, bet, balance],
  );

  const bigWin = result && result.mult >= 5;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Spin the Wheel · Land on Gold
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">
          Wheel of Fortune
        </h1>
      </div>

      {/* Wheel */}
      <div className="casino-card p-4 sm:p-8 relative overflow-hidden" style={{ perspective: "1300px" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div
          className="relative mx-auto"
          style={{
            width: SVG_SIZE,
            height: SVG_SIZE + 40,
            transform: "rotateX(24deg)",
            transformStyle: "preserve-3d",
            filter:
              "drop-shadow(0 30px 30px rgba(0,0,0,0.55)) drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
          }}
        >
          {/* Outer decorative ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              margin: "auto",
              width: SVG_SIZE,
              height: SVG_SIZE,
              boxShadow: "0 0 40px rgba(212,175,55,0.15)",
            }}
          />

          {/* Pointer */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20"
            style={{ top: -6 }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "24px solid #D4AF37",
                filter: "drop-shadow(0 2px 6px rgba(212,175,55,0.6))",
              }}
            />
          </div>

          {/* Clacker */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 origin-top"
            style={{ top: 18 }}
          >
            <motion.div
              key={clackerKick}
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -25, 8, 0] }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ transformOrigin: "50% 0%" }}
            >
              <div
                className="w-2 h-7 rounded-b-md mx-auto"
                style={{
                  background: "linear-gradient(180deg, #D4AF37, #8a6b14)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                }}
              />
              <div
                className="w-3.5 h-3.5 -mt-1 mx-auto rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 30%, #f5d876, #8a6b14)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                }}
              />
            </motion.div>
          </div>

          <motion.svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            animate={{ rotate: rotation }}
            transition={{ duration: 4.5, ease: [0.15, 0.65, 0.3, 1] }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            onUpdate={(latest) => {
              const r = latest.rotate;
              if (typeof r === "number") motionRot.set(r);
              else if (typeof r === "string") motionRot.set(parseFloat(r));
            }}
          >
            {/* Outer rim */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 14}
              fill="url(#rimGrad)"
              stroke="rgba(212,175,55,0.3)"
              strokeWidth="1"
            />
            <defs>
              <radialGradient id="rimGrad" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#4a3010" />
                <stop offset="100%" stopColor="#1a0e04" />
              </radialGradient>
              <radialGradient id="hubGrad" cx="35%" cy="30%">
                <stop offset="0%" stopColor="#f5d876" />
                <stop offset="100%" stopColor="#8a6b14" />
              </radialGradient>
            </defs>

            {SEGMENTS.map((s, i) => {
              const lp = labelPos(i);
              return (
                <g key={i}>
                  <path
                    d={describeSlice(i)}
                    fill={s.color}
                    stroke="rgba(0,0,0,0.35)"
                    strokeWidth="1.5"
                  />
                  {/* Peg dot on edge */}
                  <circle
                    cx={
                      CENTER +
                      (RADIUS - 8) *
                        Math.cos(((i * SEG_DEG - 90 - SEG_DEG / 2) * Math.PI) / 180)
                    }
                    cy={
                      CENTER +
                      (RADIUS - 8) *
                        Math.sin(((i * SEG_DEG - 90 - SEG_DEG / 2) * Math.PI) / 180)
                    }
                    r="3"
                    fill="#D4AF37"
                    stroke="#0a0a0a"
                    strokeWidth="1"
                  />
                  {/* Segment label */}
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${lp.rot}, ${lp.x}, ${lp.y})`}
                    fontSize="14"
                    fontWeight="700"
                    fill={s.mult === 0 ? "#52525b" : s.mult >= 5 ? "#0a0a0a" : "#fff"}
                    style={{ fontFamily: "serif" }}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}

            {/* Center hub */}
            <circle cx={CENTER} cy={CENTER} r="26" fill="url(#hubGrad)" stroke="#0a0a0a" strokeWidth="2" />
            <circle cx={CENTER} cy={CENTER} r="10" fill="#1c1100" />
            <circle cx={CENTER - 4} cy={CENTER - 4} r="3" fill="rgba(245,216,118,0.5)" />
          </motion.svg>
        </div>

        {/* Result overlay */}
        <div className="mt-4 h-14 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {result && !spinning && (
              <motion.div
                key={result.idx}
                initial={{ scale: 0.7, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-center"
              >
                <div
                  className={cn(
                    "font-serif text-3xl",
                    result.payout > result.bet
                      ? "text-emerald-400"
                      : "text-rose-400",
                  )}
                >
                  {result.mult > 0 ? `${result.mult}× · ` : ""}
                  {bigWin && "🎉 "}
                  {result.payout > result.bet
                    ? `+${result.payout - result.bet}`
                    : result.mult === 0
                      ? `💀 Lost ${result.bet}`
                      : `${result.payout - result.bet}`}
                </div>
              </motion.div>
            )}
            {spinning && (
              <motion.div
                key="spinning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground italic text-sm"
              >
                Spinning...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Paytable legend */}
      <div className="casino-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
          Segments
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from(new Set(SEGMENTS.map((s) => s.mult)))
            .sort((a, b) => b - a)
            .map((m) => {
              const seg = SEGMENTS.find((s) => s.mult === m)!;
              return (
                <div
                  key={m}
                  className="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-sm font-mono"
                  style={{
                    borderColor: `${seg.color}60`,
                    background: `${seg.color}20`,
                    color: m === 0 ? "#71717a" : "#e4e4e7",
                  }}
                >
                  <span>{seg.emoji}</span>
                  <span>{seg.label}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Controls */}
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
          disabled={spinning || balance === 0}
        />
        <div className="flex gap-2">
          {BET_PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="outline"
              disabled={spinning || p > balance}
              onClick={() => setBet(p)}
              className="flex-1 border-primary/30"
            >
              {p}
            </Button>
          ))}
        </div>
        <Button
          size="lg"
          disabled={spinning || balance < bet}
          onClick={spin}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          <Coins className="w-5 h-5 mr-2" />
          {balance < bet
            ? "Insufficient Chips"
            : spinning
              ? "Spinning..."
              : `🎡 Spin · ${bet}`}
        </Button>
      </div>
    </div>
  );
}
