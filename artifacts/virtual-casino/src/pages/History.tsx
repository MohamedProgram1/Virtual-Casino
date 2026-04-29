import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Trophy, Coins, Dices, Wallet } from "lucide-react";
import { useCasinoStore, GameType } from "@/lib/store";
import { GAME_LABELS } from "@/lib/games";
import { cn } from "@/lib/utils";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const { history, stats, balance } = useCasinoStore();

  const aggregates = useMemo(() => {
    const byGame: Record<string, { played: number; wagered: number; net: number }> = {};
    let totalNet = 0;
    let wins = 0;
    for (const h of history) {
      const net = h.payout - h.bet;
      totalNet += net;
      if (net > 0) wins++;
      const g = byGame[h.game] ?? { played: 0, wagered: 0, net: 0 };
      g.played += 1;
      g.wagered += h.bet;
      g.net += net;
      byGame[h.game] = g;
    }
    return { byGame, totalNet, wins, winRate: history.length ? wins / history.length : 0 };
  }, [history]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-2">
          The Ledger
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">History</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Wallet} label="Balance" value={balance.toLocaleString()} />
        <StatCard
          icon={Coins}
          label="Total Wagered"
          value={stats.totalWagered.toLocaleString()}
        />
        <StatCard
          icon={Trophy}
          label="Biggest Win"
          value={stats.biggestWin.toLocaleString()}
        />
        <StatCard
          icon={Dices}
          label="Hands Played"
          value={stats.handsPlayed.toLocaleString()}
        />
      </div>

      {/* By game breakdown */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl">By Game</h2>
        {Object.keys(aggregates.byGame).length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            No plays yet. Visit a table to begin your record.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(aggregates.byGame).map(([game, agg]) => (
              <div
                key={game}
                className="casino-card p-5 flex items-center justify-between"
              >
                <div>
                  <div className="font-serif text-lg">{GAME_LABELS[game as GameType]}</div>
                  <div className="text-xs text-muted-foreground">
                    {agg.played} hands · wagered {agg.wagered.toLocaleString()}
                  </div>
                </div>
                <div
                  className={cn(
                    "font-mono text-lg tabular-nums",
                    agg.net > 0
                      ? "text-emerald-400"
                      : agg.net < 0
                        ? "text-rose-500"
                        : "text-muted-foreground",
                  )}
                >
                  {agg.net > 0 ? "+" : ""}
                  {agg.net}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rolling log */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Recent Plays</h2>
          <span className="text-xs text-muted-foreground">last {history.length}</span>
        </div>
        {history.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            Empty ledger. The night is young.
          </div>
        ) : (
          <div className="rounded-xl border border-primary/15 overflow-hidden divide-y divide-primary/10">
            {history.map((h, i) => {
              const net = h.payout - h.bet;
              const isWin = net > 0;
              const isPush = net === 0;
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="grid grid-cols-12 items-center px-4 py-3 bg-card/30 hover:bg-card/60 transition-colors"
                >
                  <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isWin ? "bg-emerald-400" : isPush ? "bg-muted-foreground" : "bg-rose-500",
                      )}
                    />
                    <span className="text-sm font-medium">{GAME_LABELS[h.game]}</span>
                  </div>
                  <div className="col-span-3 sm:col-span-3 text-xs text-muted-foreground">
                    {formatTime(h.timestamp)}
                  </div>
                  <div className="col-span-3 sm:col-span-3 text-sm font-mono text-muted-foreground tabular-nums">
                    bet {h.bet}
                  </div>
                  <div className="col-span-3 sm:col-span-4 flex items-center justify-end gap-2">
                    {isWin ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : isPush ? null : (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    )}
                    <span
                      className={cn(
                        "font-mono font-semibold tabular-nums",
                        isWin ? "text-emerald-400" : isPush ? "text-muted-foreground" : "text-rose-500",
                      )}
                    >
                      {isPush ? "push" : `${net > 0 ? "+" : ""}${net}`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="casino-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-serif text-2xl tabular-nums">{value}</div>
    </div>
  );
}
