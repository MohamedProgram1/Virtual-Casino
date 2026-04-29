import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { toast } from "sonner";
import { getLevelFor } from "./levels";
import {
  ACHIEVEMENTS,
  OWNER_ACHIEVEMENT,
  getAchievement,
  type AchievementContext,
} from "./achievements";
import {
  generateDailyChallenges,
  todayDate,
  updateChallenge,
  type DailyChallengeState,
} from "./dailyChallenges";

export type GameType =
  | "slots"
  | "blackjack"
  | "roulette"
  | "dice"
  | "plinko"
  | "mines"
  | "crash"
  | "wheel"
  | "hilo"
  | "keno"
  | "coinflip"
  | "scratch"
  | "ownerVault";

export interface BetMeta {
  multiplier?: number;
  special?: string;
  hits?: number;
  minesCleared?: number;
  minesCount?: number;
  cashOutAt?: number;
  streak?: number;
}

export interface GameHistoryEvent {
  id: string;
  game: GameType;
  bet: number;
  payout: number;
  timestamp: number;
}

export interface CasinoStats {
  totalWagered: number;
  biggestWin: number;
  handsPlayed: number;
}

export interface CasinoSettings {
  soundEnabled: boolean;
}

export interface CasinoState {
  balance: number;
  history: GameHistoryEvent[];
  stats: CasinoStats;
  settings: CasinoSettings;
  lastRefillTime: number;
  winStreaks: Partial<Record<GameType, number>>;
  gameWins: Partial<Record<GameType, number>>;
  achievements: string[];
  equippedTitle: string | null;
  ownerMode: boolean;
  dailyChallenges: DailyChallengeState;
  lowestBalance: number;
}

interface CasinoContextType extends CasinoState {
  placeBet: (
    game: GameType,
    amount: number,
    payout: number,
    meta?: BetMeta,
  ) => void;
  refill: () => void;
  resetAccount: () => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<CasinoSettings>) => void;
  unlockOwner: (code: string) => boolean;
  lockOwner: () => void;
  equipTitle: (id: string | null) => void;
}

const STARTING_BALANCE = 1000;
const OWNER_CODE = "MOMA20100711";

const DEFAULT_STATE: CasinoState = {
  balance: STARTING_BALANCE,
  history: [],
  stats: {
    totalWagered: 0,
    biggestWin: 0,
    handsPlayed: 0,
  },
  settings: {
    soundEnabled: true,
  },
  lastRefillTime: 0,
  winStreaks: {},
  gameWins: {},
  achievements: [],
  equippedTitle: null,
  ownerMode: false,
  dailyChallenges: generateDailyChallenges(todayDate()),
  lowestBalance: STARTING_BALANCE,
};

const STORAGE_KEY = "lucky_vault_casino_state";

const CasinoContext = createContext<CasinoContextType | null>(null);

function migrate(stored: Partial<CasinoState>): CasinoState {
  return {
    ...DEFAULT_STATE,
    ...stored,
    stats: { ...DEFAULT_STATE.stats, ...(stored.stats ?? {}) },
    settings: { ...DEFAULT_STATE.settings, ...(stored.settings ?? {}) },
    winStreaks: stored.winStreaks ?? {},
    gameWins: stored.gameWins ?? {},
    achievements: stored.achievements ?? [],
    equippedTitle: stored.equippedTitle ?? null,
    ownerMode: stored.ownerMode ?? false,
    dailyChallenges:
      stored.dailyChallenges ?? generateDailyChallenges(todayDate()),
    lowestBalance: stored.lowestBalance ?? stored.balance ?? STARTING_BALANCE,
  };
}

export function CasinoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CasinoState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return migrate(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load casino state", e);
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Reset daily challenges on day change
  useEffect(() => {
    const today = todayDate();
    if (state.dailyChallenges.date !== today) {
      setState((prev) => ({
        ...prev,
        dailyChallenges: generateDailyChallenges(today),
      }));
    }
  }, [state.dailyChallenges.date]);

  // Level-up detection
  const prevLevelRef = useRef<number>(getLevelFor(state.stats.handsPlayed).level);
  useEffect(() => {
    const newLevel = getLevelFor(state.stats.handsPlayed);
    if (newLevel.level > prevLevelRef.current) {
      toast.success(`Promoted to ${newLevel.name}!`, {
        description: newLevel.blurb,
      });
      prevLevelRef.current = newLevel.level;
    }
  }, [state.stats.handsPlayed]);

  const placeBet = (
    game: GameType,
    amount: number,
    payout: number,
    meta?: BetMeta,
  ) => {
    setState((prev) => {
      if (prev.balance < amount) {
        toast.error("Insufficient funds!");
        return prev;
      }

      const win = payout > amount;
      const newBalance = prev.balance + payout - amount;
      const prevStreak = prev.winStreaks[game] ?? 0;
      const newStreak = win ? prevStreak + 1 : 0;
      const newStreaks = { ...prev.winStreaks, [game]: newStreak };
      const newGameWins = win
        ? {
            ...prev.gameWins,
            [game]: (prev.gameWins[game] ?? 0) + 1,
          }
        : prev.gameWins;

      const event: GameHistoryEvent = {
        id: Math.random().toString(36).substring(2, 9),
        game,
        bet: amount,
        payout,
        timestamp: Date.now(),
      };

      const history = [event, ...prev.history].slice(0, 50);

      const stats = {
        totalWagered: prev.stats.totalWagered + amount,
        biggestWin: Math.max(prev.stats.biggestWin, payout),
        handsPlayed: prev.stats.handsPlayed + 1,
      };

      // Daily challenges
      const challengeInput = {
        game,
        amount,
        payout,
        win,
        newStreak,
        meta,
      };
      let dailyChallenges = prev.dailyChallenges;
      let bonusFromChallenges = 0;
      const completedChallenges: { name: string; reward: number }[] = [];
      const updatedChallengeList = prev.dailyChallenges.challenges.map(
        (c, idx) => {
          const updated = updateChallenge(c, challengeInput);
          const wasJustClaimed = updated.claimed && !c.claimed;
          if (wasJustClaimed) {
            bonusFromChallenges += updated.reward;
            completedChallenges.push({
              name: prev.dailyChallenges.challenges[idx].description,
              reward: updated.reward,
            });
          }
          return updated;
        },
      );
      dailyChallenges = {
        ...prev.dailyChallenges,
        challenges: updatedChallengeList,
      };

      // Achievements
      const ctx: AchievementContext = {
        prev,
        game,
        amount,
        payout,
        win,
        newStreak,
        meta,
      };
      let achievements = prev.achievements;
      const newlyUnlocked: typeof ACHIEVEMENTS = [];
      for (const a of ACHIEVEMENTS) {
        if (achievements.includes(a.id)) continue;
        try {
          if (a.check(ctx)) {
            achievements = [...achievements, a.id];
            newlyUnlocked.push(a);
          }
        } catch {
          // ignore check errors
        }
      }

      // Lowest balance tracking (uses pre-bonus balance so dips count)
      const finalBalance = newBalance + bonusFromChallenges;
      const lowestBalance = Math.min(prev.lowestBalance, newBalance);

      // Side-effect toasts (deferred)
      if (payout > 0) {
        if (amount > 0 && payout >= amount * 10) {
          setTimeout(
            () => toast.success(`MASSIVE WIN! +${payout - amount} chips`),
            0,
          );
        } else if (payout > amount) {
          setTimeout(
            () => toast.success(`Winner! +${payout - amount} chips`),
            0,
          );
        }
      }
      newlyUnlocked.forEach((a, i) => {
        setTimeout(
          () =>
            toast.success(`Title unlocked: ${a.name}`, {
              description: a.description,
            }),
          120 + i * 80,
        );
      });
      completedChallenges.forEach((c, i) => {
        setTimeout(
          () =>
            toast.success(`Daily challenge complete!`, {
              description: `${c.name} · +${c.reward} chips`,
            }),
          200 + i * 100,
        );
      });

      return {
        ...prev,
        balance: finalBalance,
        history,
        stats,
        winStreaks: newStreaks,
        gameWins: newGameWins,
        achievements,
        dailyChallenges,
        lowestBalance,
      };
    });
  };

  const refill = () => {
    setState((prev) => {
      const now = Date.now();
      if (now - prev.lastRefillTime < 30000) {
        toast.error(`Please wait before refilling again.`);
        return prev;
      }
      toast.success("Refill successful! +500 chips");
      const newBal = prev.balance + 500;
      return {
        ...prev,
        balance: newBal,
        lastRefillTime: now,
        lowestBalance: Math.min(prev.lowestBalance, newBal),
      };
    });
  };

  const resetAccount = () => {
    const fresh: CasinoState = {
      ...DEFAULT_STATE,
      lastRefillTime: Date.now(),
      dailyChallenges: generateDailyChallenges(todayDate()),
    };
    setState(fresh);
    prevLevelRef.current = 1;
    toast.success("Account reset to 1,000 chips.");
  };

  const clearHistory = () => {
    setState((prev) => ({ ...prev, history: [] }));
    toast.success("History cleared.");
  };

  const updateSettings = (newSettings: Partial<CasinoSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  const lockOwner = () => {
    setState((prev) => {
      if (!prev.ownerMode) return prev;
      setTimeout(
        () =>
          toast.success("Owner mode locked.", {
            description: "Vault sealed. Re-enter the code to reopen.",
          }),
        0,
      );
      return { ...prev, ownerMode: false };
    });
  };

  const unlockOwner = (code: string): boolean => {
    if (code !== OWNER_CODE) {
      toast.error("Incorrect code.");
      return false;
    }
    setState((prev) => {
      if (prev.ownerMode) return prev;
      const achievements = prev.achievements.includes(OWNER_ACHIEVEMENT.id)
        ? prev.achievements
        : [...prev.achievements, OWNER_ACHIEVEMENT.id];
      setTimeout(
        () =>
          toast.success("Owner mode unlocked.", {
            description: "The vault is yours.",
          }),
        0,
      );
      setTimeout(
        () =>
          toast.success(`Title unlocked: ${OWNER_ACHIEVEMENT.name}`, {
            description: OWNER_ACHIEVEMENT.description,
          }),
        300,
      );
      return { ...prev, ownerMode: true, achievements };
    });
    return true;
  };

  const equipTitle = (id: string | null) => {
    setState((prev) => {
      if (id === null) return { ...prev, equippedTitle: null };
      if (!prev.achievements.includes(id)) {
        toast.error("You haven't earned that title yet.");
        return prev;
      }
      const a = getAchievement(id);
      if (a) {
        setTimeout(() => toast.success(`Title equipped: ${a.name}`), 0);
      }
      return { ...prev, equippedTitle: id };
    });
  };

  return (
    <CasinoContext.Provider
      value={{
        ...state,
        placeBet,
        refill,
        resetAccount,
        clearHistory,
        updateSettings,
        unlockOwner,
        lockOwner,
        equipTitle,
      }}
    >
      {children}
    </CasinoContext.Provider>
  );
}

export function useCasinoStore() {
  const context = useContext(CasinoContext);
  if (!context) {
    throw new Error("useCasinoStore must be used within a CasinoProvider");
  }
  return context;
}
