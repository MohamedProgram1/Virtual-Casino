import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Coins,
  AlertTriangle,
  HandCoins,
  Skull,
  ArrowLeft,
  Tag,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { LOAN_TIERS, owedFor, loanAgeHours, pawnValueFor } from "@/lib/loans";
import { SHOP_ITEMS } from "@/lib/shopItems";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

function timeAgo(hours: number): string {
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(hours * 60));
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (hours < 24) {
    const h = Math.floor(hours);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(hours / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export default function LoanShark() {
  const { loan, balance, takeLoan, repayLoan, pawnItem, inventory } =
    useCasinoStore();
  const [tick, setTick] = useState(0);
  const [payAmount, setPayAmount] = useState<number>(100);

  // Tick every 30s so the owed value visibly creeps upward when staring.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const owed = loan ? owedFor(loan) : 0;
  const ageHours = loan ? loanAgeHours(loan) : 0;

  // Items the player currently owns and could pawn back.
  const pawnable = useMemo(() => {
    return SHOP_ITEMS.filter((item) => (inventory[item.id] ?? 0) > 0).map(
      (item) => ({ item, qty: inventory[item.id] ?? 0 }),
    );
  }, [inventory]);

  // Suppress "unused" warning on tick.
  void tick;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Lobby
          </Button>
        </Link>
        <div className="text-xs uppercase tracking-[0.3em] text-rose-300/70">
          Off-the-books · No questions asked
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/30 bg-gradient-to-br from-rose-950 via-zinc-900 to-zinc-950 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-rose-500/30 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl" />
        </div>
        <div className="relative flex items-start gap-5">
          <div className="hidden sm:flex w-16 h-16 rounded-xl bg-zinc-950/70 border border-rose-400/40 items-center justify-center shrink-0">
            <Skull className="w-9 h-9 text-rose-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl sm:text-4xl casino-gradient-text">
              The Back Alley
            </h1>
            <p className="text-sm text-foreground/80 mt-1 italic">
              "Need a stake? I got you. Just don't be late, friend."
            </p>
            <div className="text-xs text-rose-200/80 mt-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Loans compound daily. The longer you wait, the deeper the hole.
            </div>
          </div>
        </div>
      </div>

      {/* Active loan card */}
      {loan ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="casino-card p-5 sm:p-6 border-rose-400/40 bg-gradient-to-br from-rose-950/30 to-background"
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            <h2 className="font-serif text-lg">Outstanding loan</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Stat label="Borrowed" value={loan.principal.toLocaleString()} />
            <Stat
              label="Owed Now"
              value={owed.toLocaleString()}
              accent
              highlight
            />
            <Stat
              label="Daily Rate"
              value={`${Math.round(loan.dailyRate * 100)}%`}
            />
            <Stat label="Age" value={timeAgo(ageHours)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[100, 250, 1000].map((amt) => (
              <Button
                key={amt}
                size="sm"
                variant="outline"
                className="border-rose-400/30 hover:bg-rose-500/10"
                disabled={balance <= 0 || amt > balance}
                onClick={() => {
                  playSound("chip");
                  repayLoan(amt);
                }}
              >
                Pay {amt}
              </Button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="number"
                min={1}
                value={payAmount}
                onChange={(e) =>
                  setPayAmount(Math.max(1, Number(e.target.value) || 0))
                }
                className="w-24 px-2 py-1.5 rounded-md bg-background border border-primary/30 text-right font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                className="border-rose-400/40"
                disabled={payAmount <= 0 || payAmount > balance}
                onClick={() => {
                  playSound("chip");
                  repayLoan(payAmount);
                }}
              >
                Pay custom
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={balance < owed}
                onClick={() => {
                  playSound("unlock");
                  repayLoan(owed);
                }}
              >
                Settle ({owed})
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="casino-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <HandCoins className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-lg">Borrow chips</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Pick a tier. Interest compounds daily on the unpaid balance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LOAN_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => {
                  playSound("coinFlip");
                  takeLoan(tier.amount, tier.dailyRate);
                }}
                className={cn(
                  "relative text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5 active:scale-[0.98]",
                  tier.id === "small" &&
                    "border-emerald-400/30 bg-emerald-500/10 hover:border-emerald-400/60",
                  tier.id === "medium" &&
                    "border-amber-400/30 bg-amber-500/10 hover:border-amber-400/60",
                  tier.id === "large" &&
                    "border-rose-400/30 bg-rose-500/10 hover:border-rose-400/60",
                )}
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {tier.name}
                </div>
                <div className="font-mono text-3xl font-bold mt-1">
                  +{tier.amount.toLocaleString()}
                </div>
                <div className="text-xs mt-2 text-foreground/80">
                  {Math.round(tier.dailyRate * 100)}% daily compounded
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {tier.blurb}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pawn shop */}
      <div className="casino-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-4 h-4 text-primary" />
          <h2 className="font-serif text-lg">Pawn Shop</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Need quick chips? Hock anything off your tab. The shop pays 60% of
          retail. No refunds.
        </p>
        {pawnable.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-6 text-center">
            Nothing to pawn. Pick up something from the{" "}
            <Link href="/store">
              <span className="text-primary hover:underline">Vault Store</span>
            </Link>{" "}
            first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pawnable.map(({ item, qty }) => {
              const Icon = item.icon;
              const value = pawnValueFor(item.price);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-primary/15 bg-background/40"
                >
                  <div className="w-10 h-10 rounded-lg bg-background/60 border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className={cn("w-5 h-5", item.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">
                      {item.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        ×{qty}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Retail {item.price} · Pawn {value}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400/40 text-amber-200 hover:bg-amber-400/10 shrink-0"
                    onClick={() => {
                      playSound("chip");
                      pawnItem(item.id, value, item.name);
                    }}
                  >
                    <Coins className="w-3.5 h-3.5 mr-1" />
                    Pawn
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight
          ? "border-rose-400/50 bg-rose-500/10"
          : "border-primary/15 bg-background/40",
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-lg sm:text-xl font-bold tabular-nums",
          accent && "text-rose-200",
        )}
      >
        {value}
      </div>
    </div>
  );
}
