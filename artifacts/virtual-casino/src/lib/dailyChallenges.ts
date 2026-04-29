import type { GameType, BetMeta } from "./store";

export type ChallengeKind =
  | "hands"
  | "wins"
  | "netChips"
  | "streak"
  | "minMult"
  | "natural"
  | "minesGems"
  | "kenoHits"
  | "crashCashOut"
  | "wheelHit";

export interface ChallengeMetric {
  kind: ChallengeKind;
  game?: GameType;
  goal: number;
}

export interface DailyChallenge {
  id: string;
  description: string;
  reward: number;
  metric: ChallengeMetric;
  progress: number;
  claimed: boolean;
}

export interface DailyChallengeState {
  date: string;
  challenges: DailyChallenge[];
}

interface ChallengeTemplate {
  id: string;
  description: string;
  reward: number;
  metric: ChallengeMetric;
}

const CHALLENGE_POOL: ChallengeTemplate[] = [
  {
    id: "play10",
    description: "Play 10 hands of any game.",
    reward: 200,
    metric: { kind: "hands", goal: 10 },
  },
  {
    id: "play25",
    description: "Play 25 hands of any game.",
    reward: 350,
    metric: { kind: "hands", goal: 25 },
  },
  {
    id: "win5",
    description: "Win 5 hands.",
    reward: 200,
    metric: { kind: "wins", goal: 5 },
  },
  {
    id: "win15",
    description: "Win 15 hands.",
    reward: 400,
    metric: { kind: "wins", goal: 15 },
  },
  {
    id: "netWin300",
    description: "Net win 300 chips.",
    reward: 250,
    metric: { kind: "netChips", goal: 300 },
  },
  {
    id: "netWin1000",
    description: "Net win 1,000 chips.",
    reward: 500,
    metric: { kind: "netChips", goal: 1000 },
  },
  {
    id: "streak3",
    description: "Win 3 hands in a row.",
    reward: 200,
    metric: { kind: "streak", goal: 3 },
  },
  {
    id: "streak6",
    description: "Win 6 hands in a row.",
    reward: 400,
    metric: { kind: "streak", goal: 6 },
  },
  {
    id: "fiveX",
    description: "Land a 5× win or higher.",
    reward: 200,
    metric: { kind: "minMult", goal: 5 },
  },
  {
    id: "twentyX",
    description: "Land a 20× win or higher.",
    reward: 500,
    metric: { kind: "minMult", goal: 20 },
  },
  {
    id: "natural",
    description: "Score a natural blackjack.",
    reward: 400,
    metric: { kind: "natural", game: "blackjack", goal: 1 },
  },
  {
    id: "mines5",
    description: "Reveal 5+ gems in a single Mines game.",
    reward: 250,
    metric: { kind: "minesGems", game: "mines", goal: 5 },
  },
  {
    id: "mines10",
    description: "Reveal 10+ gems in a single Mines game.",
    reward: 450,
    metric: { kind: "minesGems", game: "mines", goal: 10 },
  },
  {
    id: "crash2",
    description: "Cash out at 2× on Crash.",
    reward: 200,
    metric: { kind: "crashCashOut", game: "crash", goal: 2 },
  },
  {
    id: "crash5",
    description: "Cash out at 5× on Crash.",
    reward: 400,
    metric: { kind: "crashCashOut", game: "crash", goal: 5 },
  },
  {
    id: "keno3",
    description: "Hit 3+ numbers on Keno.",
    reward: 250,
    metric: { kind: "kenoHits", game: "keno", goal: 3 },
  },
  {
    id: "wheelWin",
    description: "Win on the Wheel of Fortune.",
    reward: 200,
    metric: { kind: "wheelHit", game: "wheel", goal: 1 },
  },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateDailyChallenges(date: string): DailyChallengeState {
  // Deterministic shuffle from date so it's stable per day
  const seed = hashStr(date);
  const pool = [...CHALLENGE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (seed * (i + 7919)) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, 3);
  return {
    date,
    challenges: picked.map((t) => ({
      id: t.id,
      description: t.description,
      reward: t.reward,
      metric: t.metric,
      progress: 0,
      claimed: false,
    })),
  };
}

export interface ChallengeUpdateInput {
  game: GameType;
  amount: number;
  payout: number;
  win: boolean;
  newStreak: number;
  meta?: BetMeta;
}

export function updateChallenge(
  c: DailyChallenge,
  ev: ChallengeUpdateInput,
): DailyChallenge {
  if (c.claimed) return c;
  const m = c.metric;
  if (m.game && ev.game !== m.game) return c;

  let progress = c.progress;
  switch (m.kind) {
    case "hands":
      progress += 1;
      break;
    case "wins":
      if (ev.win) progress += 1;
      break;
    case "netChips":
      if (ev.win) progress += ev.payout - ev.amount;
      break;
    case "streak":
      progress = Math.max(progress, ev.newStreak);
      break;
    case "minMult": {
      const mult = ev.amount > 0 ? ev.payout / ev.amount : 0;
      if (mult >= m.goal) progress = m.goal;
      break;
    }
    case "natural":
      if (ev.meta?.special === "natural") progress = m.goal;
      break;
    case "minesGems":
      progress = Math.max(progress, ev.meta?.minesCleared ?? 0);
      break;
    case "kenoHits":
      progress = Math.max(progress, ev.meta?.hits ?? 0);
      break;
    case "crashCashOut":
      if (ev.meta?.cashOutAt) {
        progress = Math.max(progress, ev.meta.cashOutAt);
      }
      break;
    case "wheelHit":
      if (ev.win) progress = m.goal;
      break;
  }
  const claimed = progress >= m.goal;
  return { ...c, progress, claimed };
}
