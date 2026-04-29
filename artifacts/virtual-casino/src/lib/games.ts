import {
  Cherry,
  Spade,
  CircleDot,
  Dices,
  Circle,
  Bomb,
  TrendingUp,
  PieChart,
  ArrowUpDown,
  Hash,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import type { GameType } from "./store";

export const GAME_LABELS: Record<GameType, string> = {
  slots: "Slots",
  blackjack: "Blackjack",
  roulette: "Roulette",
  dice: "Dice",
  plinko: "Plinko",
  mines: "Mines",
  crash: "Crash",
  wheel: "Wheel of Fortune",
  hilo: "Hi-Lo",
  keno: "Keno",
  ownerVault: "Owner's Vault",
};

export const GAME_ROUTES: Record<GameType, string> = {
  slots: "/slots",
  blackjack: "/blackjack",
  roulette: "/roulette",
  dice: "/dice",
  plinko: "/plinko",
  mines: "/mines",
  crash: "/crash",
  wheel: "/wheel",
  hilo: "/hilo",
  keno: "/keno",
  ownerVault: "/owner-vault",
};

export const GAME_ICONS: Record<GameType, LucideIcon> = {
  slots: Cherry,
  blackjack: Spade,
  roulette: CircleDot,
  dice: Dices,
  plinko: Circle,
  mines: Bomb,
  crash: TrendingUp,
  wheel: PieChart,
  hilo: ArrowUpDown,
  keno: Hash,
  ownerVault: KeyRound,
};
