import {
  Sparkles,
  Gem,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ShopCategory = "charm" | "token";

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  description: string;
  flavor: string;
  price: number;
  /** Multiplier applied to winnings (1.5 = +50% on top of normal payout). Tokens may set this to 1. */
  multiplier: number;
  /** How many winning bets the boost is applied across. */
  uses: number;
  icon: LucideIcon;
  color: string;
  accent: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "lucky_charm",
    name: "Lucky Horseshoe",
    category: "charm",
    description: "+10% on your next 10 winning bets.",
    flavor: "A little brass charm. The bartender swears it works.",
    price: 500,
    multiplier: 1.1,
    uses: 10,
    icon: Sparkles,
    color: "text-emerald-300",
    accent: "from-emerald-500/20 to-emerald-900/10",
  },
  {
    id: "high_roller",
    name: "High Roller's Pin",
    category: "charm",
    description: "+100% on your next winning bet.",
    flavor: "One shot. Make it count.",
    price: 900,
    multiplier: 2.0,
    uses: 1,
    icon: Gem,
    color: "text-fuchsia-300",
    accent: "from-fuchsia-500/25 to-purple-900/15",
  },
  {
    id: "iron_will",
    name: "Iron Will Badge",
    category: "charm",
    description: "+20% on your next 5 winning bets.",
    flavor: "Stamped with grit. Given only to those who survived a cold streak.",
    price: 650,
    multiplier: 1.2,
    uses: 5,
    icon: Shield,
    color: "text-sky-300",
    accent: "from-sky-500/20 to-blue-900/10",
  },
  {
    id: "voltage",
    name: "Voltage Chip",
    category: "token",
    description: "+50% on your next winning bet.",
    flavor: "A modified casino chip. Strictly off the books.",
    price: 400,
    multiplier: 1.5,
    uses: 1,
    icon: Zap,
    color: "text-yellow-300",
    accent: "from-yellow-500/20 to-amber-900/10",
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
