import { Link } from "wouter";
import { motion } from "framer-motion";
import { Dices, Spade, CircleDot, Cherry, TrendingUp, TrendingDown, Trophy, Coins } from "lucide-react";
import { useCasinoStore, GameType } from "@/lib/store";

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
          {GAMES.map((game, i) => (
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
                      <div className="font-serif text-xl mb-0.5">{game.title}</div>
                      <div className="text-sm text-primary/80 italic mb-2">
                        {game.tagline}
                      </div>
                      <div className="text-sm text-muted-foreground">{game.blurb}</div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
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
    </div>
  );
}
