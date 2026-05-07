import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Coins,
  Award,
  Lock,
  Sparkles,
  Dices,
  Target,
  CheckCircle2,
  KeyRound,
  ShoppingBag,
  Wine,
  Skull,
} from "lucide-react";
import { useCasinoStore, GameType } from "@/lib/store";
import {
  getLevelFor,
  getNextLevel,
  isVipUnlocked,
  hasVipVariant,
  VIP_UNLOCKS,
  LEVELS,
} from "@/lib/levels";
import { GAME_LABELS, GAME_ROUTES, GAME_ICONS } from "@/lib/games";
import {
  ALL_ACHIEVEMENTS,
  RARITY_STYLES,
  getAchievement,
} from "@/lib/achievements";
import { cn } from "@/lib/utils";

interface GameCard {
  id: GameType;
  tagline: string;
  blurb: string;
  accent: string;
  ownerOnly?: boolean;
}

const GAME_CARDS: GameCard[] = [
  {
    id: "slots",
    tagline: "Three reels. One pull. Endless thrill.",
    blurb: "Classic mechanical slots with a payout table that actually pays.",
    accent: "from-rose-500/20 to-amber-500/10",
  },
  {
    id: "blackjack",
    tagline: "You vs. the house. Twenty-one wins.",
    blurb: "Single deck. Dealer hits soft 17. Naturals pay three to two.",
    accent: "from-emerald-500/20 to-emerald-900/10",
  },
  {
    id: "roulette",
    tagline: "One zero. Infinite ways to bet.",
    blurb: "Place chips on red, black, columns, dozens, or a single number.",
    accent: "from-red-700/25 to-red-900/10",
  },
  {
    id: "dice",
    tagline: "Pick your number. Pick your edge.",
    blurb: "Slide the target — the multiplier moves with the risk.",
    accent: "from-violet-500/20 to-indigo-900/10",
  },
  {
    id: "plinko",
    tagline: "Drop the ball. Let physics decide.",
    blurb: "Twelve rows of pegs. Three risk modes. Edges pay big.",
    accent: "from-amber-500/20 to-yellow-900/10",
  },
  {
    id: "mines",
    tagline: "Find the gems. Avoid the bombs.",
    blurb: "Five-by-five grid. Press your luck for the bigger prize.",
    accent: "from-zinc-500/20 to-rose-900/10",
  },
  {
    id: "crash",
    tagline: "The rocket climbs. Cash out before it falls.",
    blurb: "Pick your moment. Get greedy and lose it all.",
    accent: "from-cyan-500/20 to-sky-900/10",
  },
  {
    id: "wheel",
    tagline: "One spin. Sixteen slices. Pure fortune.",
    blurb: "Land on a multiplier from a dud to the elusive top prize.",
    accent: "from-fuchsia-500/20 to-purple-900/10",
  },
  {
    id: "hilo",
    tagline: "Higher or lower? Read the cards.",
    blurb: "Stack a streak of correct calls for a soaring multiplier.",
    accent: "from-teal-500/20 to-emerald-900/10",
  },
  {
    id: "keno",
    tagline: "Pick four. Cross your fingers.",
    blurb: "Eight numbers drawn from forty. Hit all four for the jackpot.",
    accent: "from-indigo-500/20 to-blue-900/10",
  },
  {
    id: "coinflip",
    tagline: "Heads or tails. Fifty-fifty, almost.",
    blurb: "One toss, instant result. Double up or call it after a streak.",
    accent: "from-yellow-500/20 to-orange-900/10",
  },
  {
    id: "scratch",
    tagline: "Three of a kind pays. Scratch and pray.",
    blurb: "Reveal nine symbols. Match three for a multiplier on your stake.",
    accent: "from-pink-500/20 to-rose-900/10",
  },
  {
    id: "baccarat",
    tagline: "Player. Banker. Tie. That's the night.",
    blurb: "Punto Banco. Bet a side, take a sip, watch the cards fall.",
    accent: "from-emerald-500/20 to-amber-900/10",
  },
  {
    id: "poker",
    tagline: "Five cards. One draw. Jacks or better pays.",
    blurb: "Hold the keepers, draw the rest. Royal flush = 800×.",
    accent: "from-blue-500/20 to-indigo-900/10",
  },
  {
    id: "pachinko",
    tagline: "Drop a ball. Listen to the chimes.",
    blurb: "Eleven buckets, two 50× lanes at the edge, one heart-stopping zero in the middle.",
    accent: "from-purple-500/20 to-fuchsia-900/10",
  },
  {
    id: "ownerVault",
    tagline: "The owner's private game. Risk and reward.",
    blurb: "Five vaults — some pay, some don't. Pick wisely; the house is honest now.",
    accent: "from-amber-400/30 to-amber-900/15",
    ownerOnly: true,
  },
  {
    id: "ownerSafe",
    tagline: "Crack the combo. Empty the safe.",
    blurb: "Four-digit combination, eight tries, hot/cold feedback. Only the owner gets a turn.",
    accent: "from-amber-300/30 to-zinc-900/30",
    ownerOnly: true,
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

function DailyChallenges() {
  const { dailyChallenges } = useCasinoStore();
  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Daily Challenges
          </h2>
          <div className="text-xs text-muted-foreground mt-1">
            Resets at midnight · Rewards auto-credited
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {dailyChallenges.challenges.map((c) => {
          const pct = Math.min(100, (c.progress / c.metric.goal) * 100);
          const done = c.claimed;
          return (
            <div
              key={c.id}
              className={cn(
                "casino-card p-4 relative overflow-hidden",
                done && "border-emerald-500/40",
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="text-sm font-medium leading-tight">
                  {c.description}
                </div>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-primary/60 shrink-0" />
                )}
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full bg-background overflow-hidden border border-primary/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn(
                      "h-full",
                      done
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-300"
                        : "bg-gradient-to-r from-primary/50 to-primary",
                    )}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {Math.min(c.progress, c.metric.goal)} / {c.metric.goal}
                  </span>
                  <span
                    className={cn(
                      "font-mono",
                      done ? "text-emerald-400" : "text-primary/80",
                    )}
                  >
                    {done ? "Claimed" : `+${c.reward} chips`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AchievementsWidget() {
  const { achievements, equippedTitle } = useCasinoStore();
  const unlocked = achievements
    .map((id) => getAchievement(id))
    .filter((a): a is NonNullable<ReturnType<typeof getAchievement>> => Boolean(a));

  const total = ALL_ACHIEVEMENTS.length;
  const recent = unlocked.slice(-6).reverse();

  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Titles & Achievements
          </h2>
          <div className="text-xs text-muted-foreground mt-1">
            {unlocked.length} of {total} unlocked
            {equippedTitle && (
              <>
                {" · "}
                Wearing{" "}
                <span className="text-primary">
                  {getAchievement(equippedTitle)?.name}
                </span>
              </>
            )}
          </div>
        </div>
        <Link href="/settings">
          <button className="text-xs text-primary/70 hover:text-primary uppercase tracking-wider">
            Manage
          </button>
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          No titles yet. Play a few hands and they'll start rolling in.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {recent.map((a) => {
            const styles = RARITY_STYLES[a.rarity];
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-xl p-3 border bg-gradient-to-b border-primary/15 text-center",
                  styles.bg,
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ring-2",
                    styles.ring,
                    "bg-background/40",
                  )}
                >
                  <Icon className={cn("w-5 h-5", styles.color)} />
                </div>
                <div className="text-xs font-semibold truncate">{a.name}</div>
                <div
                  className={cn(
                    "text-[10px] uppercase tracking-wider mt-0.5",
                    styles.color,
                  )}
                >
                  {styles.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Lobby() {
  const { stats, balance, ownerMode } = useCasinoStore();

  const visibleGames = GAME_CARDS.filter((g) => !g.ownerOnly || ownerMode);

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

      {/* Daily Challenges */}
      <DailyChallenges />

      {/* Games */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-serif text-2xl">Tonight's Tables</h2>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {visibleGames.length} open
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleGames.map((game, i) => {
            const unlock = VIP_UNLOCKS[game.id];
            const hasVip = hasVipVariant(game.id);
            const vipUnlocked = isVipUnlocked(game.id, stats.handsPlayed);
            const requiredLevel = unlock
              ? LEVELS.find((l) => l.level === unlock.unlockLevel)
              : null;
            const Icon = GAME_ICONS[game.id];
            const isOwner = !!game.ownerOnly;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04 }}
              >
                <Link href={GAME_ROUTES[game.id]}>
                  <div
                    className={cn(
                      "group relative casino-card p-6 cursor-pointer hover:border-primary/40 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,175,55,0.15)]",
                      isOwner && "border-amber-400/40",
                    )}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-60 pointer-events-none`}
                    />
                    <div className="relative flex items-start gap-4">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl bg-background/60 border flex items-center justify-center shrink-0 transition-colors",
                          isOwner
                            ? "border-amber-400/60 group-hover:border-amber-300"
                            : "border-primary/30 group-hover:border-primary/60",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-7 h-7",
                            isOwner ? "text-amber-300" : "text-primary",
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-serif text-xl">
                            {GAME_LABELS[game.id]}
                          </span>
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-b from-amber-400/30 to-amber-700/20 border border-amber-400/50 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                              <KeyRound className="w-2.5 h-2.5" />
                              Owner
                            </span>
                          )}
                          {hasVip && vipUnlocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-b from-amber-300/30 to-primary/20 border border-primary/40 text-[10px] font-bold uppercase tracking-wider text-primary">
                              <Sparkles className="w-2.5 h-2.5" />
                              VIP
                            </span>
                          )}
                          {hasVip && !vipUnlocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/60 border border-muted-foreground/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <Lock className="w-2.5 h-2.5" />
                              VIP @ {requiredLevel?.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-primary/80 italic mb-2">
                          {game.tagline}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {game.blurb}
                        </div>
                        {hasVip && vipUnlocked && unlock && (
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

      {/* The Lounge — Bar + Store */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-serif text-2xl">The Lounge</h2>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Step away from the tables
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/lounge">
            <motion.div
              whileHover={{ y: -3 }}
              className="group relative casino-card p-6 cursor-pointer hover:border-primary/40 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-700/25 via-amber-700/15 to-amber-900/10 opacity-80 pointer-events-none" />
              <div className="absolute -bottom-6 -right-4 opacity-25 group-hover:opacity-40 transition-opacity">
                <Wine className="w-32 h-32 text-amber-300" />
              </div>
              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-background/60 border border-amber-400/40 flex items-center justify-center shrink-0 group-hover:border-amber-300 transition-colors">
                  <Wine className="w-7 h-7 text-amber-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-serif text-xl">The Bar</span>
                  </div>
                  <div className="text-sm text-primary/80 italic mb-2">
                    Pull up a stool. Drinks are on the house.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Vincent pours you a free drink every minute. Pick your
                    poison and pocket the chip tip.
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/bar">
            <motion.div
              whileHover={{ y: -3 }}
              className="group relative casino-card p-6 cursor-pointer hover:border-primary/40 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-700/20 via-indigo-700/10 to-zinc-900/10 opacity-80 pointer-events-none" />
              <div className="absolute -bottom-6 -right-4 opacity-20 group-hover:opacity-35 transition-opacity">
                <Sparkles className="w-32 h-32 text-violet-300" />
              </div>
              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-background/60 border border-violet-400/40 flex items-center justify-center shrink-0 group-hover:border-violet-300 transition-colors">
                  <span className="text-2xl">🍸</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-serif text-xl">Mystery Drink</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-b from-violet-400/30 to-violet-700/20 border border-violet-400/50 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                      <Sparkles className="w-2.5 h-2.5" />
                      Minigame
                    </span>
                  </div>
                  <div className="text-sm text-primary/80 italic mb-2">
                    Three clues. Two guesses. One drink.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Vincent pours a mystery cocktail. Study the clues and name
                    the drink to earn chips and maybe a rare collectible.
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/store">
            <motion.div
              whileHover={{ y: -3 }}
              className="group relative casino-card p-6 cursor-pointer hover:border-primary/40 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-emerald-700/10 to-zinc-900/10 opacity-80 pointer-events-none" />
              <div className="absolute -bottom-6 -right-4 opacity-25 group-hover:opacity-40 transition-opacity">
                <ShoppingBag className="w-32 h-32 text-emerald-300" />
              </div>
              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-background/60 border border-emerald-400/40 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                  <ShoppingBag className="w-7 h-7 text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-serif text-xl">The Vault Store</span>
                  </div>
                  <div className="text-sm text-primary/80 italic mb-2">
                    Spend chips. Get an edge.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cocktails and charms that boost the next win. Skip the
                    bartending if you'd rather just pay for the ammo.
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/loan-shark">
            <motion.div
              whileHover={{ y: -3 }}
              className="group relative casino-card p-6 cursor-pointer hover:border-rose-400/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-rose-900/10 to-zinc-900/10 opacity-80 pointer-events-none" />
              <div className="absolute -bottom-6 -right-4 opacity-25 group-hover:opacity-40 transition-opacity">
                <Skull className="w-32 h-32 text-rose-300" />
              </div>
              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-background/60 border border-rose-400/40 flex items-center justify-center shrink-0 group-hover:border-rose-300 transition-colors">
                  <Skull className="w-7 h-7 text-rose-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-serif text-xl">Loan Shark & Pawn</span>
                  </div>
                  <div className="text-sm text-primary/80 italic mb-2">
                    Stake yourself. Or sell the watch.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Borrow chips at compounding rates, or pawn what's on your
                    tab for fast money. No credit check.
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Achievements */}
      <AchievementsWidget />

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
