import {
  Star,
  Flame,
  Zap,
  Crown,
  Trophy,
  Diamond,
  Spade,
  Bomb,
  Gem,
  TrendingUp,
  Cherry,
  KeyRound,
  Award,
  Sparkles,
  Hash,
  ArrowUpDown,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import type { CasinoState, GameType, BetMeta } from "./store";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementContext {
  prev: CasinoState;
  game: GameType;
  amount: number;
  payout: number;
  win: boolean;
  newStreak: number;
  meta?: BetMeta;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: LucideIcon;
  check: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "tourist",
    name: "Tourist",
    description: "Play your very first hand.",
    rarity: "common",
    icon: Star,
    check: (c) => c.prev.stats.handsPlayed === 0,
  },
  {
    id: "player",
    name: "Player",
    description: "Play 10 hands.",
    rarity: "common",
    icon: Award,
    check: (c) => c.prev.stats.handsPlayed + 1 >= 10,
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Play 100 hands.",
    rarity: "rare",
    icon: Trophy,
    check: (c) => c.prev.stats.handsPlayed + 1 >= 100,
  },
  {
    id: "devoted",
    name: "Devoted",
    description: "Play 500 hands.",
    rarity: "epic",
    icon: Trophy,
    check: (c) => c.prev.stats.handsPlayed + 1 >= 500,
  },
  {
    id: "lucky_streak",
    name: "Lucky Streak",
    description: "Win 5 hands in a row.",
    rarity: "common",
    icon: Sparkles,
    check: (c) => c.newStreak >= 5,
  },
  {
    id: "on_fire",
    name: "On Fire",
    description: "Win 10 hands in a row.",
    rarity: "rare",
    icon: Flame,
    check: (c) => c.newStreak >= 10,
  },
  {
    id: "untouchable",
    name: "Untouchable",
    description: "Win 15 hands in a row.",
    rarity: "epic",
    icon: Zap,
    check: (c) => c.newStreak >= 15,
  },
  {
    id: "natural",
    name: "Natural",
    description: "Score a natural blackjack.",
    rarity: "rare",
    icon: Spade,
    check: (c) => c.meta?.special === "natural",
  },
  {
    id: "card_shark",
    name: "Card Shark",
    description: "Win 25 blackjack hands.",
    rarity: "epic",
    icon: Spade,
    check: (c) =>
      c.win &&
      c.game === "blackjack" &&
      ((c.prev.gameWins?.blackjack ?? 0) + 1) >= 25,
  },
  {
    id: "king_of_numbers",
    name: "King of Numbers",
    description: "Hit a straight number on Roulette.",
    rarity: "rare",
    icon: Crown,
    check: (c) => c.meta?.special === "roulette-straight",
  },
  {
    id: "plinko_pro",
    name: "Plinko Pro",
    description: "Land on a 22× slot or higher.",
    rarity: "rare",
    icon: Star,
    check: (c) =>
      c.game === "plinko" && (c.meta?.multiplier ?? 0) >= 22,
  },
  {
    id: "plinko_legend",
    name: "Plinko Legend",
    description: "Land on the 110× slot on High risk.",
    rarity: "legendary",
    icon: Sparkles,
    check: (c) =>
      c.game === "plinko" && (c.meta?.multiplier ?? 0) >= 110,
  },
  {
    id: "mine_sweeper",
    name: "Mine Sweeper",
    description: "Clear all gems in a Mines game.",
    rarity: "epic",
    icon: Gem,
    check: (c) => c.meta?.special === "mines-cleared",
  },
  {
    id: "demolitionist",
    name: "Demolitionist",
    description: "Clear all gems with 10+ mines hidden.",
    rarity: "legendary",
    icon: Bomb,
    check: (c) =>
      c.meta?.special === "mines-cleared" && (c.meta?.minesCount ?? 0) >= 10,
  },
  {
    id: "cool_hand",
    name: "Cool Hand",
    description: "Cash out at 5× or higher on Crash.",
    rarity: "rare",
    icon: TrendingUp,
    check: (c) => c.game === "crash" && (c.meta?.cashOutAt ?? 0) >= 5,
  },
  {
    id: "diamond_hands",
    name: "Diamond Hands",
    description: "Cash out at 25× or higher on Crash.",
    rarity: "epic",
    icon: Diamond,
    check: (c) => c.game === "crash" && (c.meta?.cashOutAt ?? 0) >= 25,
  },
  {
    id: "rocket_rider",
    name: "Rocket Rider",
    description: "Cash out at 100× or higher on Crash.",
    rarity: "legendary",
    icon: Sparkles,
    check: (c) => c.game === "crash" && (c.meta?.cashOutAt ?? 0) >= 100,
  },
  {
    id: "wheel_master",
    name: "Wheel Master",
    description: "Hit the top multiplier on Wheel of Fortune.",
    rarity: "rare",
    icon: PieChart,
    check: (c) => c.game === "wheel" && (c.meta?.multiplier ?? 0) >= 5,
  },
  {
    id: "card_reader",
    name: "Card Reader",
    description: "Get 5 correct in a row on Hi-Lo.",
    rarity: "rare",
    icon: ArrowUpDown,
    check: (c) =>
      c.game === "hilo" && (c.meta?.streak ?? 0) >= 5,
  },
  {
    id: "mind_reader",
    name: "Mind Reader",
    description: "Get 10 correct in a row on Hi-Lo.",
    rarity: "epic",
    icon: ArrowUpDown,
    check: (c) =>
      c.game === "hilo" && (c.meta?.streak ?? 0) >= 10,
  },
  {
    id: "sharp_eye",
    name: "Sharp Eye",
    description: "Hit all 4 picks on Keno.",
    rarity: "legendary",
    icon: Hash,
    check: (c) => c.game === "keno" && (c.meta?.hits ?? 0) >= 4,
  },
  {
    id: "jackpot",
    name: "Jackpot!",
    description: "Land a 100× win on Slots.",
    rarity: "epic",
    icon: Cherry,
    check: (c) =>
      c.game === "slots" && c.amount > 0 && c.payout / c.amount >= 100,
  },
  {
    id: "high_roller",
    name: "High Roller",
    description: "Place a bet of 500 chips.",
    rarity: "rare",
    icon: Trophy,
    check: (c) => c.amount >= 500,
  },
  {
    id: "whale_bet",
    name: "Whale",
    description: "Place a bet of 1,000 chips.",
    rarity: "epic",
    icon: Trophy,
    check: (c) => c.amount >= 1000,
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Reach 1,000 chips after dropping under 100.",
    rarity: "rare",
    icon: TrendingUp,
    check: (c) => {
      const newBal = c.prev.balance + c.payout - c.amount;
      return c.prev.lowestBalance < 100 && newBal >= 1000;
    },
  },
  {
    id: "big_spender",
    name: "Big Spender",
    description: "Wager 10,000 chips lifetime.",
    rarity: "rare",
    icon: Award,
    check: (c) => c.prev.stats.totalWagered + c.amount >= 10000,
  },
  {
    id: "casino_legend",
    name: "Casino Legend",
    description: "Wager 100,000 chips lifetime.",
    rarity: "legendary",
    icon: Crown,
    check: (c) => c.prev.stats.totalWagered + c.amount >= 100000,
  },
];

export const OWNER_ACHIEVEMENT: Achievement = {
  id: "the_owner",
  name: "The Owner",
  description: "Hold the keys to the vault.",
  rarity: "legendary",
  icon: KeyRound,
  check: () => false,
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...ACHIEVEMENTS,
  OWNER_ACHIEVEMENT,
];

export function getAchievement(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find((a) => a.id === id);
}

export const RARITY_STYLES: Record<
  Rarity,
  { color: string; ring: string; bg: string; label: string }
> = {
  common: {
    color: "text-zinc-300",
    ring: "ring-zinc-500/30",
    bg: "from-zinc-700/30 to-zinc-900/20",
    label: "Common",
  },
  rare: {
    color: "text-sky-300",
    ring: "ring-sky-500/40",
    bg: "from-sky-700/30 to-sky-900/20",
    label: "Rare",
  },
  epic: {
    color: "text-violet-300",
    ring: "ring-violet-500/40",
    bg: "from-violet-700/30 to-violet-900/20",
    label: "Epic",
  },
  legendary: {
    color: "text-amber-300",
    ring: "ring-amber-500/50",
    bg: "from-amber-600/30 to-amber-900/20",
    label: "Legendary",
  },
};
