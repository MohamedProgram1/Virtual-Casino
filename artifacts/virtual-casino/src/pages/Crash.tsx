import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Coins, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

type Phase = "betting" | "running" | "crashed" | "cashed";

function getCrashPoint(): number {
  const r = Math.random();
  if (r < 0.03) return 1.0;
  return Math.max(1.01, +(0.99 / (1 - r)).toFixed(2));
}

const BET_PRESETS = [10, 25, 50, 100];

const CHART_W = 640;
const CHART_H = 220;
const CHART_PAD_L = 36;
const CHART_PAD_R = 8;
const CHART_PAD_T = 12;
const CHART_PAD_B = 22;
const PLOT_W = CHART_W - CHART_PAD_L - CHART_PAD_R;
const PLOT_H = CHART_H - CHART_PAD_T - CHART_PAD_B;
const TIME_WINDOW = 12; // seconds visible
const Y_MIN = 1;

function yScale(mult: number, yMax: number): number {
  // log scale for nicer feel
  const lm = Math.log(Math.max(Y_MIN, mult));
  const lmax = Math.log(yMax);
  return CHART_PAD_T + PLOT_H * (1 - lm / lmax);
}

function xScale(t: number, tMax: number): number {
  return CHART_PAD_L + PLOT_W * (t / Math.max(0.01, tMax));
}

export default function Crash() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [phase, setPhase] = useState<Phase>("betting");
  const [currentMult, setCurrentMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState(0);
  const [history, setHistory] = useState<{ mult: number; cashed: boolean }[]>([]);
  const [points, setPoints] = useState<{ t: number; m: number }[]>([
    { t: 0, m: 1 },
  ]);
  const [yMax, setYMax] = useState(2);
  const startTimeRef = useRef(0);
  const crashAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const settledRef = useRef(false);
  const cashedAtRef = useRef<{ t: number; m: number } | null>(null);

  const stopAnim = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAnim();
  }, [stopAnim]);

  const start = () => {
    if (balance < bet || phase === "running") return;
    const cp = getCrashPoint();
    crashAtRef.current = cp;
    setCrashAt(cp);
    setCurrentMult(1.0);
    setPhase("running");
    setPoints([{ t: 0, m: 1 }]);
    setYMax(2);
    cashedAtRef.current = null;
    settledRef.current = false;
    startTimeRef.current = performance.now();

    const tick = () => {
      const t = (performance.now() - startTimeRef.current) / 1000;
      const m = +Math.exp(0.06 * t).toFixed(3);
      if (m >= crashAtRef.current) {
        const finalMult = crashAtRef.current;
        setCurrentMult(finalMult);
        setPoints((prev) => [...prev, { t, m: finalMult }]);
        setYMax((y) => Math.max(y, finalMult * 1.15));
        setPhase("crashed");
        if (!settledRef.current) {
          settledRef.current = true;
          placeBet("crash", bet, 0, { multiplier: 0, cashOutAt: 0 });
          setHistory((h) =>
            [{ mult: finalMult, cashed: false }, ...h].slice(0, 10),
          );
        }
        stopAnim();
        return;
      }
      setCurrentMult(m);
      setPoints((prev) => {
        // sample at most every ~50ms to keep array small
        const last = prev[prev.length - 1];
        if (t - last.t < 0.05) return prev;
        const next = [...prev, { t, m }];
        // keep last TIME_WINDOW seconds
        const cutoff = t - TIME_WINDOW;
        return cutoff > 0 ? next.filter((p) => p.t >= cutoff) : next;
      });
      setYMax((y) => Math.max(y, m * 1.15, 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cashOut = () => {
    if (phase !== "running") return;
    stopAnim();
    const m = currentMult;
    const t = (performance.now() - startTimeRef.current) / 1000;
    setPhase("cashed");
    cashedAtRef.current = { t, m };
    if (!settledRef.current) {
      settledRef.current = true;
      const payout = Math.floor(bet * m);
      placeBet("crash", bet, payout, { multiplier: m, cashOutAt: m });
      setHistory((h) => [{ mult: m, cashed: true }, ...h].slice(0, 10));
    }
  };

  const reset = () => {
    setPhase("betting");
    setCurrentMult(1.0);
    setPoints([{ t: 0, m: 1 }]);
    setYMax(2);
    cashedAtRef.current = null;
  };

  useRegisterPlayAgain(
    phase === "crashed" || phase === "cashed"
      ? { label: "Play Again", onClick: reset }
      : null,
    [phase],
  );

  const multColor =
    phase === "crashed"
      ? "text-rose-400"
      : phase === "cashed"
        ? "text-emerald-400"
        : currentMult >= 10
          ? "text-amber-300"
          : currentMult >= 3
            ? "text-amber-200"
            : currentMult >= 1.5
              ? "text-primary"
              : "text-foreground";

  // Build the SVG polyline from points
  const tFirst = points[0]?.t ?? 0;
  const tLast = points[points.length - 1]?.t ?? 0;
  const tSpan = Math.max(TIME_WINDOW, tLast - tFirst);
  const lineColor =
    phase === "crashed"
      ? "#fb7185"
      : phase === "cashed"
        ? "#34d399"
        : "#D4AF37";
  const fillColor =
    phase === "crashed"
      ? "rgba(244,63,94,0.18)"
      : phase === "cashed"
        ? "rgba(52,211,153,0.18)"
        : "rgba(212,175,55,0.18)";

  const polyPoints = points
    .map((p) => `${xScale(p.t - tFirst, tSpan)},${yScale(p.m, yMax)}`)
    .join(" ");

  const areaPoints =
    points.length > 0
      ? `${xScale(0, tSpan)},${CHART_PAD_T + PLOT_H} ` +
        polyPoints +
        ` ${xScale(tLast - tFirst, tSpan)},${CHART_PAD_T + PLOT_H}`
      : "";

  // Y-axis ticks (multiplier guides)
  const yTicks = (() => {
    const ticks: number[] = [1];
    if (yMax >= 1.5) ticks.push(1.5);
    if (yMax >= 2) ticks.push(2);
    if (yMax >= 3) ticks.push(3);
    if (yMax >= 5) ticks.push(5);
    if (yMax >= 10) ticks.push(10);
    if (yMax >= 25) ticks.push(25);
    if (yMax >= 50) ticks.push(50);
    if (yMax >= 100) ticks.push(100);
    return ticks.filter((t) => t <= yMax);
  })();

  const headPoint = points[points.length - 1];
  const cashedPoint = cashedAtRef.current;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Watch the Multiplier · Cash Out Before It Pops
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Crash</h1>
      </div>

      {/* Stage */}
      <div
        className="casino-card relative overflow-hidden p-4 sm:p-6"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, hsl(348 50% 12%) 0%, hsl(0 0% 5%) 70%)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Recent results bar */}
        {history.length > 0 && (
          <div className="flex justify-center gap-1.5 mb-4 flex-wrap">
            {history.slice(0, 8).map((h, i) => (
              <div
                key={i}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums border",
                  h.cashed
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-300",
                )}
              >
                {h.mult.toFixed(2)}×
              </div>
            ))}
          </div>
        )}

        {/* Big multiplier readout */}
        <div className="text-center mb-2">
          <div
            className={cn(
              "font-serif font-bold tabular-nums leading-none transition-colors",
              multColor,
              phase === "crashed" && "line-through decoration-4",
            )}
            style={{ fontSize: "min(13vw, 4.5rem)" }}
          >
            {currentMult.toFixed(2)}×
          </div>
          <div className="h-5 mt-1">
            {phase === "crashed" && (
              <div className="text-rose-400 font-serif text-sm uppercase tracking-widest">
                Crashed
              </div>
            )}
            {phase === "cashed" && (
              <div className="text-emerald-400 font-serif text-sm">
                Cashed at {currentMult.toFixed(2)}× · +
                {Math.floor(bet * currentMult) - bet}
              </div>
            )}
            {phase === "running" && (
              <div className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                <Rocket className="w-3 h-3" /> Climbing...
              </div>
            )}
          </div>
        </div>

        {/* Stock chart */}
        <div className="rounded-xl border border-primary/15 bg-background/40 p-2 overflow-hidden">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            className="w-full h-48 sm:h-56"
          >
            <defs>
              <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y grid lines + labels */}
            {yTicks.map((t) => {
              const y = yScale(t, yMax);
              return (
                <g key={`y-${t}`}>
                  <line
                    x1={CHART_PAD_L}
                    x2={CHART_W - CHART_PAD_R}
                    y1={y}
                    y2={y}
                    stroke="rgba(212,175,55,0.12)"
                    strokeDasharray="3 4"
                  />
                  <text
                    x={CHART_PAD_L - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="rgba(228,228,231,0.5)"
                    className="font-mono"
                  >
                    {t}×
                  </text>
                </g>
              );
            })}

            {/* X axis baseline */}
            <line
              x1={CHART_PAD_L}
              x2={CHART_W - CHART_PAD_R}
              y1={CHART_PAD_T + PLOT_H}
              y2={CHART_PAD_T + PLOT_H}
              stroke="rgba(212,175,55,0.25)"
            />

            {/* Filled area under the line */}
            {points.length > 1 && (
              <polygon points={areaPoints} fill="url(#crashFill)" />
            )}

            {/* The line itself */}
            {points.length > 1 && (
              <polyline
                points={polyPoints}
                fill="none"
                stroke={lineColor}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Cashed out marker */}
            {cashedPoint && (
              <g>
                <circle
                  cx={xScale(cashedPoint.t - tFirst, tSpan)}
                  cy={yScale(cashedPoint.m, yMax)}
                  r="6"
                  fill="#34d399"
                  stroke="#0a0a0a"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Live head dot */}
            {headPoint && phase === "running" && (
              <g>
                <circle
                  cx={xScale(headPoint.t - tFirst, tSpan)}
                  cy={yScale(headPoint.m, yMax)}
                  r="9"
                  fill={lineColor}
                  fillOpacity="0.25"
                >
                  <animate
                    attributeName="r"
                    values="6;12;6"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={xScale(headPoint.t - tFirst, tSpan)}
                  cy={yScale(headPoint.m, yMax)}
                  r="4"
                  fill={lineColor}
                  stroke="#0a0a0a"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* Crash explosion marker */}
            {phase === "crashed" && headPoint && (
              <g>
                <circle
                  cx={xScale(headPoint.t - tFirst, tSpan)}
                  cy={yScale(headPoint.m, yMax)}
                  r="10"
                  fill="#fb7185"
                  fillOpacity="0.4"
                />
                <text
                  x={xScale(headPoint.t - tFirst, tSpan)}
                  y={yScale(headPoint.m, yMax) - 14}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#fb7185"
                  className="font-mono font-bold"
                >
                  {crashAt.toFixed(2)}×
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Controls */}
      {phase === "betting" || phase === "crashed" || phase === "cashed" ? (
        <div className="casino-card p-6 space-y-4">
          {phase === "betting" ? (
            <>
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
                    className="flex-1 border-primary/30"
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                size="lg"
                disabled={balance < bet}
                onClick={start}
                className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                {balance < bet ? "Insufficient Chips" : "Launch"}
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              onClick={reset}
              className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
            >
              Play Again
            </Button>
          )}
        </div>
      ) : (
        <Button
          size="lg"
          onClick={cashOut}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 shadow-lg shadow-emerald-500/30"
        >
          <Coins className="w-5 h-5 mr-2" />
          Cash Out · {Math.floor(bet * currentMult)}
        </Button>
      )}
    </div>
  );
}
