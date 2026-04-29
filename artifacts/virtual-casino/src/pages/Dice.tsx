import { useState } from "react";
import { motion } from "framer-motion";
import { Dices, Coins, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { isVipUnlocked } from "@/lib/levels";
import { VipToggle } from "@/components/VipToggle";
import { cn } from "@/lib/utils";

const HOUSE_EDGE_STD = 0.01;
const HOUSE_EDGE_VIP = 0.005;

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

  // Win chance: under -> roll < target, over -> roll > target
  // We use 1-100 inclusive, target is exclusive boundary.
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

    const result = Math.floor(Math.random() * 100) + 1; // 1..100
    const won = direction === "under" ? result < target : result > target;
    const payout = won ? potentialPayout : 0;

    setTimeout(() => {
      setLastRoll(result);
      setLastWin(won);
      setRolling(false);
      placeBet("dice", bet, payout);
    }, 1100);
  };

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
        <div className="flex items-center justify-center">
          {rolling ? (
            <motion.div
              animate={{ rotate: [0, 360, 720, 1080] }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            >
              <Dices className="w-24 h-24 text-primary" />
            </motion.div>
          ) : lastRoll !== null ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className={cn(
                "font-serif text-7xl sm:text-8xl tabular-nums",
                lastWin ? "text-emerald-400" : "text-rose-500",
              )}
            >
              {lastRoll}
            </motion.div>
          ) : (
            <Dices className="w-24 h-24 text-primary/40" />
          )}
        </div>
        {lastRoll !== null && !rolling && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground"
          >
            {lastWin ? `Won ${potentialPayout - bet} chips` : "Lost this round"}
          </motion.div>
        )}

        {/* Target slider visualization */}
        <div className="space-y-3 pt-4">
          <div className="relative h-3 rounded-full overflow-hidden bg-background border border-primary/20">
            <div
              className={cn(
                "absolute inset-y-0 left-0 transition-all",
                direction === "under" ? "bg-emerald-500/40" : "bg-rose-500/30",
              )}
              style={{ width: `${target}%` }}
            />
            <div
              className={cn(
                "absolute inset-y-0 right-0 transition-all",
                direction === "over" ? "bg-emerald-500/40" : "bg-rose-500/30",
              )}
              style={{ width: `${100 - target}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary"
              style={{ left: `${target}%` }}
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
            <span className="text-primary text-base">Target: {target}</span>
            <span>100</span>
          </div>
        </div>

        {/* Direction toggle */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={direction === "under" ? "default" : "outline"}
            onClick={() => setDirection("under")}
            disabled={rolling}
            className={cn(
              "h-12",
              direction === "under" && "bg-primary text-primary-foreground",
            )}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Roll Under {target}
          </Button>
          <Button
            variant={direction === "over" ? "default" : "outline"}
            onClick={() => setDirection("over")}
            disabled={rolling}
            className={cn(
              "h-12",
              direction === "over" && "bg-primary text-primary-foreground",
            )}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Roll Over {target}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="px-3 py-2 rounded-lg bg-background/40 border border-primary/15">
            <div className="text-xs text-muted-foreground">Win Chance</div>
            <div className="font-mono text-lg text-primary">{winChance}%</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-background/40 border border-primary/15">
            <div className="text-xs text-muted-foreground">Multiplier</div>
            <div className="font-mono text-lg text-primary">{multiplier.toFixed(2)}×</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-background/40 border border-primary/15">
            <div className="text-xs text-muted-foreground">Payout</div>
            <div className="font-mono text-lg text-primary">{potentialPayout}</div>
          </div>
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
          {rolling ? "Rolling..." : balance < bet ? "Insufficient Chips" : "Roll"}
        </Button>
      </div>
    </div>
  );
}
