import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Dices,
  Spade,
  CircleDot,
  Cherry,
  TrendingUp,
  TrendingDown,
  Trophy,
  Coins,
  Award,
  Lock,
  Sparkles,
} from "lucide-react";
import { useCasinoStore, GameType } from "@/lib/store";
import { getLevelFor, getNextLevel, isVipUnlocked, VIP_UNLOCKS, LEVELS } from "@/lib/levels";
import { cn } from "@/lib/utils";

const GAMES: Array<{
  id: GameType;
  href: string;
  title: string;
  tagline: string;
  blurb: string;
  icon: typeof Dices;
  accent: string;
}> = [
  {
    id: "slots",
    href: "/slots",
    title: "Lucky Reels",
    tagline: "Three reels. One pull. Endless thrill.",
    blurb: "Classic mechanical slots with a payout table that actually pays.",
    icon: Cherry,
    accent: "from-rose-500/20 to-amber-500/10",
  },
  {
    id: "blackjack",
    href: "/blackjack",
    title: "Blackjack",
    tagline: "You vs. the house. Twenty-one wins.",
    blurb: "Single deck. Dealer hits soft 17. Naturals pay three to two.",
    icon: Spade,
    accent: "from-emerald-500/20 to-emerald-900/10",
  },
  {
    id: "roulette",
    href: "/roulette",
    title: "European Roulette",
    tagline: "One zero. Infinite ways to bet.",
    blurb: "Place chips on red, black, columns, dozens, or a single number.",
    icon: CircleDot,
    accent: "from-red-700/25 to-red-900/10",
  },
  {
    id: "dice",
    href: "/dice",
    title: "Over / Under",
    tagline: "Pick your number. Pick your edge.",
    blurb: "Slide the target — the multiplier moves with the risk.",
    icon: Dices,
    accent: "from-violet-500/20 to-indigo-900/10",
  },
];

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const GAME_LABELS: Record<GameType, string> = {
  slots: "Slots",
  blackjack: "Blackjack",
  roulette: "Roulette",
  dice: "Dice",
};

function ActivityTicker() {
  const { history } = useCasinoStore();
  const recent = history.slice(0, 6);

  if (recent.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        The floor is quiet. Place your first bet to start the night.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((event) => {
        const net = event.payout - event.bet;
        const isWin = net > 0;
        const isPush = net === 0;
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-card/40 border border-primary/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isWin ? "bg-emerald-400" : isPush ? "bg-muted-foreground" : "bg-rose-500"
                }`}
              />
              <span className="text-sm font-medium truncate">{GAME_LABELS[event.game]}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                bet {event.bet}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isWin ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : isPush ? null : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span
                className={`text-sm font-mono tabular-nums font-semibold ${
                  isWin ? "text-emerald-400" : isPush ? "text-muted-foreground" : "text-rose-500"
                }`}
              >
                {isWin ? "+" : isPush ? "" : ""}
                {net === 0 ? "push" : net > 0 ? `+${net}` : `${net}`}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {formatRelative(event.timestamp)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-card/50 border border-primary/15">
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-serif text-xl tabular-nums truncate">{value}</div>
      </div>
    </div>
  );
}

function LevelProgress() {
  const { stats } = useCasinoStore();
  const current = getLevelFor(stats.handsPlayed);
  const next = getNextLevel(stats.handsPlayed);
  const progress = next
    ? ((stats.handsPlayed - current.threshold) /
        (next.threshold - current.threshold)) *
      100
    : 100;

  return (
    <div className="casino-card p-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-primary" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Player Tier
            </div>
          </div>
          <div className="font-serif text-3xl casino-gradient-text">
            {current.name}
          </div>
          <div className="text-sm text-muted-foreground italic mt-1">
            {current.blurb}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Level
          </div>
          <div className="font-serif text-3xl text-primary">{current.level}</div>
        </div>
      </div>

      <div className="space-y-2 relative">
        <div className="h-2 rounded-full bg-background overflow-hidden border border-primary/15">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary/50 via-primary to-amber-300"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-mono">
            {stats.handsPlayed} hands played
          </span>
          {next ? (
            <span className="text-primary/80">
              {next.threshold - stats.handsPlayed} to{" "}
              <span className="font-semibold">{next.name}</span>
            </span>
          ) : (
            <span className="text-primary/80">Highest tier reached.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Lobby() {
  const { stats, balance } = useCasinoStore();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center space-y-3 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-3">
            Welcome to the floor
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl casino-gradient-text leading-tight">
            Lucky Vault
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            A late-night room behind a brass door. Polished felt, soft red leather, and
            a balance that's all yours to play with.
          </p>
        </motion.div>
      </section>

      {/* Player tier */}
      <LevelProgress />

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatTile icon={Coins} label="Balance" value={balance.toLocaleString()} />
        <StatTile icon={Trophy} label="Biggest Win" value={stats.biggestWin.toLocaleString()} />
        <StatTile
          icon={Dices}
          label="Hands Played"
          value={stats.handsPlayed.toLocaleString()}
        />
      </section>

      {/* Games */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-serif text-2xl">Tonight's Tables</h2>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            All open
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game, i) => {
            const unlock = VIP_UNLOCKS[game.id];
            const vipUnlocked = isVipUnlocked(game.id, stats.handsPlayed);
            const requiredLevel = LEVELS.find((l) => l.level === unlock.unlockLevel);
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06 }}
              >
                <Link href={game.href}>
                  <div className="group relative casino-card p-6 cursor-pointer hover:border-primary/40 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,175,55,0.15)]">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-60 pointer-events-none`}
                    />
                    <div className="relative flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-background/60 border border-primary/30 flex items-center justify-center shrink-0 group-hover:border-primary/60 transition-colors">
                        <game.icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-serif text-xl">{game.title}</span>
                          {vipUnlocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-b from-amber-300/30 to-primary/20 border border-primary/40 text-[10px] font-bold uppercase tracking-wider text-primary">
                              <Sparkles className="w-2.5 h-2.5" />
                              VIP
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/60 border border-muted-foreground/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                              )}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              VIP @ {requiredLevel?.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-primary/80 italic mb-2">
                          {game.tagline}
                        </div>
                        <div className="text-sm text-muted-foreground">{game.blurb}</div>
                        {vipUnlocked && (
                          <div className="text-xs text-primary/70 mt-2 italic">
                            VIP perk: {unlock.perk}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-serif text-2xl">The Floor</h2>
          <Link href="/history">
            <button className="text-xs text-primary/70 hover:text-primary uppercase tracking-wider">
              See all
            </button>
          </Link>
        </div>
        <ActivityTicker />
      </section>

      {/* Tier roadmap */}
      <section>
        <h2 className="font-serif text-2xl mb-5">Tier Roadmap</h2>
        <div className="space-y-2">
          {LEVELS.map((l) => {
            const reached = stats.handsPlayed >= l.threshold;
            const unlocksGames = Object.values(VIP_UNLOCKS).filter(
              (u) => u.unlockLevel === l.level,
            );
            return (
              <div
                key={l.level}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors",
                  reached
                    ? "border-primary/30 bg-primary/5"
                    : "border-primary/10 bg-card/30 opacity-70",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0",
                    reached
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {l.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-base">{l.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {l.threshold} hands
                    </span>
                  </div>
                  {unlocksGames.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Unlocks {unlocksGames.map((u) => GAME_LABELS[u.game]).join(", ")} VIP
                    </div>
                  )}
                </div>
                {reached && <Sparkles className="w-4 h-4 text-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
