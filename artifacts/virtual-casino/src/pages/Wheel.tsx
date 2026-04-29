import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { PieChart, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

const SEGMENTS: { mult: number; color: string }[] = [
  { mult: 0, color: "#3f3f46" },
  { mult: 1, color: "#0d9488" },
  { mult: 0, color: "#3f3f46" },
  { mult: 2, color: "#7c3aed" },
  { mult: 0, color: "#3f3f46" },
  { mult: 1, color: "#0d9488" },
  { mult: 0, color: "#3f3f46" },
  { mult: 5, color: "#D4AF37" },
  { mult: 0, color: "#3f3f46" },
  { mult: 1, color: "#0d9488" },
  { mult: 0, color: "#3f3f46" },
  { mult: 2, color: "#7c3aed" },
  { mult: 0, color: "#3f3f46" },
  { mult: 1, color: "#0d9488" },
  { mult: 0, color: "#3f3f46" },
  { mult: 1, color: "#0d9488" },
];

const N = SEGMENTS.length;
const SEG_DEG = 360 / N;
const RADIUS = 140;
const CENTER = 160;

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
  const r = RADIUS * 0.7;
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

  // Clacker — bounces each time a peg passes the pointer
  const motionRot = useMotionValue(0);
  const [clackerKick, setClackerKick] = useState(0);
  const lastSegRef = useRef<number>(0);

  useEffect(() => {
    const unsub = motionRot.on("change", (v) => {
      // Compute the segment index currently under the pointer (top, -90°).
      // Wheel rotates by `v` degrees; segment 0 starts at the top.
      // After rotation, segment under pointer = (-v / SEG_DEG) mod N
      const idx = Math.floor(((-v % 360) + 360) % 360 / SEG_DEG);
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

    const idx = Math.floor(Math.random() * N);
    const seg = SEGMENTS[idx];

    const turns = 6 + Math.floor(Math.random() * 4);
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
    }, 4200);
  };

  useRegisterPlayAgain(
    !spinning && result
      ? { label: "Spin Again", onClick: spin, disabled: balance < bet }
      : null,
    [spinning, result, bet, balance],
  );

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
      <div className="casino-card p-6 sm:p-10">
        <div className="relative mx-auto" style={{ width: 320, height: 360 }}>
          {/* Pointer */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20"
            style={{ top: -4 }}
          >
            <div
              className="w-0 h-0"
              style={{
                borderLeft: "12px solid transparent",
                borderRight: "12px solid transparent",
                borderTop: "20px solid hsl(46 65% 53%)",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            />
          </div>

          {/* Clacker — small flexible arm just below the pointer that bounces
              when each segment edge passes underneath. */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 origin-top"
            style={{ top: 16 }}
          >
            <motion.div
              key={clackerKick}
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -22, 6, 0] }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ transformOrigin: "50% 0%" }}
            >
              <div
                className="w-1.5 h-6 rounded-b-md mx-auto"
                style={{
                  background:
                    "linear-gradient(180deg, hsl(46 65% 53%), hsl(46 60% 35%))",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                }}
              />
              <div
                className="w-3 h-3 -mt-1 mx-auto rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, hsl(46 80% 70%), hsl(46 50% 30%))",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              />
            </motion.div>
          </div>

          <motion.svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.17, 0.67, 0.32, 1] }}
            style={{ transformOrigin: "160px 160px" }}
            onUpdate={(latest) => {
              const r = latest.rotate;
              if (typeof r === "number") motionRot.set(r);
              else if (typeof r === "string") motionRot.set(parseFloat(r));
            }}
          >
            {SEGMENTS.map((s, i) => {
              const lp = labelPos(i);
              return (
                <g key={i}>
                  <path
                    d={describeSlice(i)}
                    fill={s.color}
                    stroke="hsl(0 0% 7%)"
                    strokeWidth="2"
                  />
                  {/* Edge peg dot — visual reference for the clacker */}
                  <circle
                    cx={
                      CENTER +
                      (RADIUS - 6) *
                        Math.cos(((i * SEG_DEG - 90 - SEG_DEG / 2) * Math.PI) / 180)
                    }
                    cy={
                      CENTER +
                      (RADIUS - 6) *
                        Math.sin(((i * SEG_DEG - 90 - SEG_DEG / 2) * Math.PI) / 180)
                    }
                    r="2.5"
                    fill="hsl(46 65% 53%)"
                    stroke="hsl(0 0% 5%)"
                    strokeWidth="1"
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${lp.rot}, ${lp.x}, ${lp.y})`}
                    className="font-serif font-bold"
                    fontSize="18"
                    fill={s.mult === 0 ? "#71717a" : "#0a0a0a"}
                  >
                    {s.mult}×
                  </text>
                </g>
              );
            })}
            {/* Center hub */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r="22"
              fill="hsl(46 65% 53%)"
              stroke="hsl(0 0% 5%)"
              strokeWidth="3"
            />
            <circle cx={CENTER} cy={CENTER} r="6" fill="hsl(0 0% 5%)" />
          </motion.svg>
        </div>

        {/* Result message */}
        <div className="mt-6 h-12 flex items-center justify-center">
          {result && !spinning && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div
                className={cn(
                  "font-serif text-2xl",
                  result.payout > result.bet
                    ? "text-emerald-400"
                    : "text-rose-400",
                )}
              >
                {result.mult}× ·{" "}
                {result.payout > result.bet
                  ? `+${result.payout - result.bet}`
                  : `-${result.bet}`}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
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
          <PieChart className="w-5 h-5 mr-2" />
          {balance < bet
            ? "Insufficient Chips"
            : spinning
              ? "Spinning..."
              : "Spin"}
          {!spinning && balance >= bet && (
            <span className="ml-2 opacity-75">
              <Coins className="w-4 h-4 inline -mt-0.5" /> {bet}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
