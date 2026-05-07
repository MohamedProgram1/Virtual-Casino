export type CollectibleRarity = "common" | "uncommon" | "rare" | "legendary";

export interface Collectible {
  id: string;
  name: string;
  description: string;
  emoji: string;
  pawnValue: number;
  rarity: CollectibleRarity;
  /** null = can only be earned, never bought. */
  buyPrice: number | null;
}

export const COLLECTIBLES: Collectible[] = [
  {
    id: "lucky_coin",
    name: "Lucky Coin",
    description: "A worn silver coin. Every gambler's got one.",
    emoji: "🪙",
    pawnValue: 40,
    rarity: "common",
    buyPrice: 70,
  },
  {
    id: "signed_card",
    name: "Signed Playing Card",
    description: "An ace, signed in felt-tip. Allegedly famous.",
    emoji: "🃏",
    pawnValue: 55,
    rarity: "common",
    buyPrice: 90,
  },
  {
    id: "casino_chips",
    name: "Vintage Chip Set",
    description: "Five clay chips from a closed-down casino.",
    emoji: "🎰",
    pawnValue: 85,
    rarity: "common",
    buyPrice: 140,
  },
  {
    id: "vintage_lighter",
    name: "Gold Lighter",
    description: "Engraved with someone else's initials. Still works.",
    emoji: "🔥",
    pawnValue: 65,
    rarity: "common",
    buyPrice: 110,
  },
  {
    id: "gold_watch",
    name: "Gold Watch",
    description: "Solid gold, ticks perfectly. No idea whose it was.",
    emoji: "⌚",
    pawnValue: 160,
    rarity: "uncommon",
    buyPrice: 260,
  },
  {
    id: "pearl_necklace",
    name: "Pearl Necklace",
    description: "Real pearls. Left here by someone in a hurry.",
    emoji: "📿",
    pawnValue: 290,
    rarity: "uncommon",
    buyPrice: null,
  },
  {
    id: "ruby_ring",
    name: "Ruby Ring",
    description: "Pigeon-blood ruby. Flawless. Don't ask.",
    emoji: "💍",
    pawnValue: 490,
    rarity: "rare",
    buyPrice: null,
  },
  {
    id: "diamond_cufflinks",
    name: "Diamond Cufflinks",
    description: "A pair. Heavy. Possibly from the Vault upstairs.",
    emoji: "💎",
    pawnValue: 760,
    rarity: "rare",
    buyPrice: null,
  },
];

export const RARITY_LABEL: Record<CollectibleRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

export const RARITY_COLOR: Record<CollectibleRarity, string> = {
  common: "text-zinc-400",
  uncommon: "text-sky-400",
  rare: "text-amber-400",
  legendary: "text-fuchsia-400",
};

export const RARITY_BORDER: Record<CollectibleRarity, string> = {
  common: "border-zinc-500/30",
  uncommon: "border-sky-400/40",
  rare: "border-amber-400/50",
  legendary: "border-fuchsia-400/60",
};

export function getCollectible(id: string): Collectible | undefined {
  return COLLECTIBLES.find((c) => c.id === id);
}

const COMMON_IDS = COLLECTIBLES.filter((c) => c.rarity === "common").map((c) => c.id);
const UNCOMMON_IDS = COLLECTIBLES.filter((c) => c.rarity === "uncommon").map((c) => c.id);
const RARE_IDS = COLLECTIBLES.filter((c) => c.rarity === "rare").map((c) => c.id);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Roll for a random collectible drop based on the bet multiplier.
 * Returns a collectible id or null.
 */
export function rollDrop(multiplier: number): string | null {
  const r = Math.random();
  if (multiplier >= 20 && r < 0.18) return pick(RARE_IDS);
  if (multiplier >= 10 && r < 0.28) return pick(UNCOMMON_IDS);
  if (multiplier >= 5 && r < 0.32) return pick(COMMON_IDS);
  return null;
}

/**
 * Roll for a bar minigame drop based on accuracy (0-100).
 */
export function rollBarDrop(accuracy: number): string | null {
  if (accuracy >= 95 && Math.random() < 0.5) return pick(UNCOMMON_IDS);
  if (accuracy >= 80 && Math.random() < 0.35) return pick(COMMON_IDS);
  if (accuracy >= 60 && Math.random() < 0.15) return pick(COMMON_IDS);
  return null;
}
