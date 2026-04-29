import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Coins, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Phase = "betting" | "running" | "crashed" | "cashed";

function getCrashPoint(): number {
  const r = Math.random();
  if (r < 0.03) return 1.0;
  return Math.max(1.01, +(0.99 / (1 - r)).toFixed(2));
}

const BET_PRESETS = [10, 25, 50, 100];

export default function Crash() {
  const { balance, placeBet } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [phase, setPhase] = useState<Phase>("betting");
  const [currentMult, setCurrentMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState(0);
  const [history, setHistory] = useState<{ mult: number; cashed: boolean }[]>([]);
  const startTimeRef = useRef(0);
  const crashAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const settledRef = useRef(false);

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
    settledRef.current = false;
    startTimeRef.current = performance.now();

    const tick = () => {
      const t = (performance.now() - startTimeRef.current) / 1000;
      const m = +Math.exp(0.06 * t).toFixed(2);
      if (m >= crashAtRef.current) {
        setCurrentMult(crashAtRef.current);
        setPhase("crashed");
        if (!settledRef.current) {
          settledRef.current = true;
          placeBet("crash", bet, 0, { multiplier: 0, cashOutAt: 0 });
          setHistory((h) =>
            [{ mult: crashAtRef.current, cashed: false }, ...h].slice(0, 10),
          );
        }
        stopAnim();
        return;
      }
      setCurrentMult(m);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cashOut = () => {
    if (phase !== "running") return;
    stopAnim();
    const m = currentMult;
    setPhase("cashed");
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
  };

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

  const orbScale = Math.min(2.4, 1 + Math.log(currentMult) * 0.4);

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
        className="casino-card relative overflow-hidden p-8"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, hsl(348 50% 12%) 0%, hsl(0 0% 5%) 70%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Recent results bar */}
        {history.length > 0 && (
          <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
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

        {/* Multiplier */}
        <div className="relative h-56 flex items-center justify-center">
          {/* Glow orb */}
          <motion.div
            animate={{
              scale: orbScale,
              opacity: phase === "running" ? 1 : phase === "crashed" ? 0.3 : 0.7,
            }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <div
              className={cn(
                "w-32 h-32 rounded-full blur-3xl",
                phase === "crashed"
                  ? "bg-rose-500/40"
                  : phase === "cashed"
                    ? "bg-emerald-500/40"
                    : "bg-primary/40",
              )}
            />
          </motion.div>

          <motion.div
            key={phase}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative text-center z-10"
          >
            <div
              className={cn(
                "font-serif font-bold tabular-nums leading-none transition-colors",
                multColor,
                phase === "crashed" && "line-through decoration-4",
              )}
              style={{ fontSize: "min(20vw, 7rem)" }}
            >
              {currentMult.toFixed(2)}×
            </div>
            {phase === "crashed" && (
              <div className="mt-3 text-rose-400 font-serif text-2xl uppercase tracking-widest">
                Crashed
              </div>
            )}
            {phase === "cashed" && (
              <div className="mt-3 text-emerald-400 font-serif text-xl">
                Cashed at {currentMult.toFixed(2)}× · +
                {Math.floor(bet * currentMult) - bet}
              </div>
            )}
            {phase === "running" && (
              <div className="mt-3 text-muted-foreground text-sm flex items-center justify-center gap-1">
                <Rocket className="w-3.5 h-3.5" />
                Climbing...
              </div>
            )}
          </motion.div>
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
