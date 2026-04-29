import {
  Wine,
  Martini,
  Beer,
  GlassWater,
  Sparkles,
  Gem,
  type LucideIcon,
} from "lucide-react";

export type ShopCategory = "drink" | "charm";

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  description: string;
  flavor: string;
  price: number;
  /** Multiplier applied to winnings (1.5 = +50% on top of normal payout). */
  multiplier: number;
  /** How many winning bets the boost is applied across. */
  uses: number;
  icon: LucideIcon;
  /** Tailwind text-color class for the icon. */
  color: string;
  /** Tailwind gradient classes for the card background. */
  accent: string;
}

/**
 * Drinks can also be earned from the bar minigame.
 * The id used here matches the recipe id in barRecipes.ts.
 */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "old_fashioned",
    name: "Old Fashioned",
    category: "drink",
    description: "+25% on your next winning bet.",
    flavor: "A quiet drink for a confident hand.",
    price: 120,
    multiplier: 1.25,
    uses: 1,
    icon: GlassWater,
    color: "text-amber-300",
    accent: "from-amber-500/20 to-amber-900/10",
  },
  {
    id: "martini",
    name: "Dry Martini",
    category: "drink",
    description: "+50% on your next winning bet.",
    flavor: "Cold, sharp, and a little dangerous.",
    price: 240,
    multiplier: 1.5,
    uses: 1,
    icon: Martini,
    color: "text-sky-200",
    accent: "from-sky-500/20 to-indigo-900/10",
  },
  {
    id: "negroni",
    name: "Negroni",
    category: "drink",
    description: "+30% on your next 3 wins.",
    flavor: "Bitter, balanced — built for a long sit at the table.",
    price: 360,
    multiplier: 1.3,
    uses: 3,
    icon: Wine,
    color: "text-rose-300",
    accent: "from-rose-500/20 to-rose-900/10",
  },
  {
    id: "highball",
    name: "Whiskey Highball",
    category: "drink",
    description: "+15% on your next 5 wins.",
    flavor: "Light and easy — sip it across a long session.",
    price: 280,
    multiplier: 1.15,
    uses: 5,
    icon: Beer,
    color: "text-yellow-200",
    accent: "from-yellow-500/20 to-amber-900/10",
  },
  {
    id: "lucky_charm",
    name: "Lucky Horseshoe",
    category: "charm",
    description: "+10% on your next 10 wins.",
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
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
