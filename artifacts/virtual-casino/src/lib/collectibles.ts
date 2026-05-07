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
  // ── Common (10) ────────────────────────────────────────────────────────────
  {
    id: "lucky_coin",
    name: "Lucky Coin",
    description: "A worn silver coin. Every gambler's got one.",
    emoji: "🪙", pawnValue: 40, rarity: "common", buyPrice: 70,
  },
  {
    id: "signed_card",
    name: "Signed Playing Card",
    description: "An ace, signed in felt-tip. Allegedly famous.",
    emoji: "🃏", pawnValue: 55, rarity: "common", buyPrice: 90,
  },
  {
    id: "casino_chips",
    name: "Vintage Chip Set",
    description: "Five clay chips from a closed-down casino.",
    emoji: "🎰", pawnValue: 85, rarity: "common", buyPrice: 140,
  },
  {
    id: "vintage_lighter",
    name: "Gold Lighter",
    description: "Engraved with someone else's initials. Still works.",
    emoji: "🔥", pawnValue: 65, rarity: "common", buyPrice: 110,
  },
  {
    id: "matchbook",
    name: "Casino Matchbook",
    description: "Lucky Vault branded. One match left.",
    emoji: "🧨", pawnValue: 25, rarity: "common", buyPrice: 40,
  },
  {
    id: "bar_coaster",
    name: "Signed Bar Coaster",
    description: "Vincent's signature on the back. Probably means something.",
    emoji: "🫙", pawnValue: 30, rarity: "common", buyPrice: 50,
  },
  {
    id: "casino_token",
    name: "Vintage Casino Token",
    description: "No longer valid. Still cool.",
    emoji: "💿", pawnValue: 45, rarity: "common", buyPrice: 75,
  },
  {
    id: "lucky_die",
    name: "Lucky Die",
    description: "Always lands on six. Allegedly.",
    emoji: "🎲", pawnValue: 50, rarity: "common", buyPrice: 80,
  },
  {
    id: "red_poker_chip",
    name: "Red Poker Chip",
    description: "A single red chip. Worth more as a memento.",
    emoji: "🔴", pawnValue: 40, rarity: "common", buyPrice: 65,
  },
  {
    id: "cocktail_napkin",
    name: "Signed Cocktail Napkin",
    description: "Scrawled phone number on the back. Number doesn't work.",
    emoji: "📄", pawnValue: 28, rarity: "common", buyPrice: 45,
  },

  // ── Uncommon (10) ──────────────────────────────────────────────────────────
  {
    id: "gold_watch",
    name: "Gold Watch",
    description: "Solid gold, ticks perfectly. No idea whose it was.",
    emoji: "⌚", pawnValue: 160, rarity: "uncommon", buyPrice: 260,
  },
  {
    id: "silver_flask",
    name: "Silver Whiskey Flask",
    description: "Engraved 'To the one who always wins.' Found under a table.",
    emoji: "🍾", pawnValue: 120, rarity: "uncommon", buyPrice: 200,
  },
  {
    id: "casino_poster",
    name: "Vintage Casino Poster",
    description: "1962. The original Lucky Vault. Before the renovation.",
    emoji: "🖼️", pawnValue: 110, rarity: "uncommon", buyPrice: 185,
  },
  {
    id: "champagne_flute",
    name: "Crystal Champagne Flute",
    description: "Part of a set. The other five are missing.",
    emoji: "🥂", pawnValue: 130, rarity: "uncommon", buyPrice: 215,
  },
  {
    id: "ivory_dice_set",
    name: "Ivory Dice Set",
    description: "A matched pair. Someone rolled double sixes on a million-chip pot.",
    emoji: "🎯", pawnValue: 145, rarity: "uncommon", buyPrice: 240,
  },
  {
    id: "racing_form",
    name: "Marked Racing Form",
    description: "Circled horses, all winners. Dated last Tuesday.",
    emoji: "📰", pawnValue: 100, rarity: "uncommon", buyPrice: 170,
  },
  {
    id: "monogram_hc",
    name: "Monogrammed Handkerchief",
    description: "Silk. Initials: V.P. Nobody asks about Vincent's last name.",
    emoji: "🤝", pawnValue: 90, rarity: "uncommon", buyPrice: 150,
  },
  {
    id: "dealers_glove",
    name: "Dealer's White Glove",
    description: "One glove. Left hand. Retired from the high-stakes table.",
    emoji: "🧤", pawnValue: 115, rarity: "uncommon", buyPrice: 190,
  },
  {
    id: "silver_horseshoe",
    name: "Silver Horseshoe",
    description: "Small, polished. Allegedly from a champion racehorse.",
    emoji: "🧲", pawnValue: 125, rarity: "uncommon", buyPrice: 205,
  },
  {
    id: "vintage_card_case",
    name: "Vintage Card Case",
    description: "Sterling silver. Held by someone with very important meetings.",
    emoji: "💼", pawnValue: 135, rarity: "uncommon", buyPrice: 225,
  },

  // ── Rare (8) ───────────────────────────────────────────────────────────────
  {
    id: "pearl_necklace",
    name: "Pearl Necklace",
    description: "Real pearls. Left here by someone in a hurry.",
    emoji: "📿", pawnValue: 290, rarity: "rare", buyPrice: null,
  },
  {
    id: "ruby_ring",
    name: "Ruby Ring",
    description: "Pigeon-blood ruby. Flawless. Don't ask.",
    emoji: "💍", pawnValue: 420, rarity: "rare", buyPrice: null,
  },
  {
    id: "diamond_cufflinks",
    name: "Diamond Cufflinks",
    description: "A pair. Heavy. Possibly from the Vault upstairs.",
    emoji: "💎", pawnValue: 580, rarity: "rare", buyPrice: null,
  },
  {
    id: "antique_watch",
    name: "Antique Pocket Watch",
    description: "Opens to a faded photo. The case is 18-karat gold.",
    emoji: "🕰️", pawnValue: 380, rarity: "rare", buyPrice: null,
  },
  {
    id: "chip_1k",
    name: "1,000-Face Casino Chip",
    description: "The rarest chip in the house. Only six were ever made.",
    emoji: "🪬", pawnValue: 320, rarity: "rare", buyPrice: null,
  },
  {
    id: "signed_portrait",
    name: "Signed Portrait",
    description: "Vincent, painted in oils. The signature reads: 'To the best guest.'",
    emoji: "🎨", pawnValue: 450, rarity: "rare", buyPrice: null,
  },
  {
    id: "golden_horseshoe",
    name: "Golden Horseshoe",
    description: "Solid gold. Mounted. Came off a winning horse named Lucky Vault.",
    emoji: "🏅", pawnValue: 360, rarity: "rare", buyPrice: null,
  },
  {
    id: "black_diamond_ring",
    name: "Black Diamond Ring",
    description: "Obsidian-cut, set in platinum. Came in on a losing night.",
    emoji: "⚫", pawnValue: 650, rarity: "rare", buyPrice: null,
  },

  // ── Legendary (4) ──────────────────────────────────────────────────────────
  {
    id: "house_key",
    name: "The House Key",
    description: "An actual key to the Lucky Vault. No idea which door.",
    emoji: "🗝️", pawnValue: 1000, rarity: "legendary", buyPrice: null,
  },
  {
    id: "last_chip",
    name: "The Last Chip",
    description: "The final chip from the original Lucky Vault. Encased in resin.",
    emoji: "🎰", pawnValue: 1500, rarity: "legendary", buyPrice: null,
  },
  {
    id: "vincents_recipe",
    name: "Vincent's Secret Recipe",
    description: "A folded cocktail napkin. The ink is smudged but decipherable.",
    emoji: "📜", pawnValue: 1200, rarity: "legendary", buyPrice: null,
  },
  {
    id: "golden_deck",
    name: "24-Karat Gold Playing Cards",
    description: "Full deck. Unplayable. Unbelievably beautiful.",
    emoji: "✨", pawnValue: 2000, rarity: "legendary", buyPrice: null,
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
  legendary: "border-fuchsia-500/60",
};

export function getCollectible(id: string): Collectible | undefined {
  return COLLECTIBLES.find((c) => c.id === id);
}

const COMMON_IDS    = COLLECTIBLES.filter((c) => c.rarity === "common").map((c) => c.id);
const UNCOMMON_IDS  = COLLECTIBLES.filter((c) => c.rarity === "uncommon").map((c) => c.id);
const RARE_IDS      = COLLECTIBLES.filter((c) => c.rarity === "rare").map((c) => c.id);
const LEGENDARY_IDS = COLLECTIBLES.filter((c) => c.rarity === "legendary").map((c) => c.id);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Roll for a random collectible drop based on the bet multiplier. */
export function rollDrop(multiplier: number): string | null {
  const r = Math.random();
  if (multiplier >= 50 && r < 0.08) return pick(LEGENDARY_IDS);
  if (multiplier >= 20 && r < 0.18) return pick(RARE_IDS);
  if (multiplier >= 10 && r < 0.30) return pick(UNCOMMON_IDS);
  if (multiplier >= 5  && r < 0.35) return pick(COMMON_IDS);
  return null;
}

/** Roll for a bar/lounge collectible drop based on score (0-100). */
export function rollBarDrop(score: number): string | null {
  const r = Math.random();
  if (score >= 100 && r < 0.10) return pick(RARE_IDS);
  if (score >= 95  && r < 0.25) return pick(UNCOMMON_IDS);
  if (score >= 80  && r < 0.40) return pick(COMMON_IDS);
  if (score >= 60  && r < 0.18) return pick(COMMON_IDS);
  return null;
}

/** Roll for a lounge drink order (always common or nothing). */
export function rollLoungeDrop(): string | null {
  return Math.random() < 0.12 ? pick(COMMON_IDS) : null;
}
