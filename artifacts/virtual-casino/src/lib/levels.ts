import { GameType } from "./store";

export interface Level {
  level: number;
  name: string;
  threshold: number;
  blurb: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: "Newcomer", threshold: 0, blurb: "Just walked through the door." },
  { level: 2, name: "Regular", threshold: 25, blurb: "The bartender knows your drink." },
  { level: 3, name: "High Roller", threshold: 75, blurb: "Comped seats. Watched bets." },
  { level: 4, name: "VIP", threshold: 200, blurb: "A private elevator to the back room." },
  { level: 5, name: "Whale", threshold: 500, blurb: "The house keeps a tab in your name." },
];

export interface VipUnlock {
  game: GameType;
  unlockLevel: number;
  perk: string;
}

export const VIP_UNLOCKS: Partial<Record<GameType, VipUnlock>> = {
  slots: {
    game: "slots",
    unlockLevel: 2,
    perk: "Doubled paytable, max bet 1,000",
  },
  blackjack: {
    game: "blackjack",
    unlockLevel: 3,
    perk: "Blackjack pays 2:1 (instead of 3:2)",
  },
  roulette: {
    game: "roulette",
    unlockLevel: 4,
    perk: "Straight-up numbers pay 36:1",
  },
  dice: {
    game: "dice",
    unlockLevel: 5,
    perk: "House edge cut to 0.5%",
  },
};

export function getLevelFor(handsPlayed: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (handsPlayed >= l.threshold) current = l;
  }
  return current;
}

export function getNextLevel(handsPlayed: number): Level | null {
  for (const l of LEVELS) {
    if (handsPlayed < l.threshold) return l;
  }
  return null;
}

export function isVipUnlocked(game: GameType, handsPlayed: number): boolean {
  const unlock = VIP_UNLOCKS[game];
  if (!unlock) return false;
  return getLevelFor(handsPlayed).level >= unlock.unlockLevel;
}

export function hasVipVariant(game: GameType): boolean {
  return VIP_UNLOCKS[game] !== undefined;
}
