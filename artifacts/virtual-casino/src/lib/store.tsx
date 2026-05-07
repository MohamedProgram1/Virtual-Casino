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
import { playSound, setSoundMuted } from "./sounds";
import type { Loan } from "./loans";
import { owedFor } from "./loans";
import { rollDrop } from "./collectibles";

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
  | "baccarat"
  | "poker"
  | "pachinko"
  | "ownerVault"
  | "ownerSafe";

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

export interface ActiveBoost {
  itemId: string;
  name: string;
  /** Applied to the *winnings* (payout − stake) of each winning bet. 1.5 = +50%. */
  multiplier: number;
  /** Number of upcoming bets the boost is consumed by. Decrements per bet. */
  usesLeft: number;
}

export interface BarStats {
  /** Total drinks served at the bar across the lifetime of the account. */
  served: number;
  /** Total tip chips earned from the bartending minigame. */
  tipsEarned: number;
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
  /** Map of shop / bar item id → quantity owned. */
  inventory: Record<string, number>;
  /** The currently active boost. Only one boost may be active at a time. */
  activeBoost: ActiveBoost | null;
  bar: BarStats;
  /** Outstanding loan from the loan shark, or null if clean. */
  loan: Loan | null;
  /** Collectible items earned from gameplay or the bar. id → quantity. */
  collectibles: Record<string, number>;
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
  /** Buy an item with chips. Returns true on success. */
  purchaseItem: (
    item: { id: string; name: string; price: number },
  ) => boolean;
  /** Consume one of an inventory item, activating its boost. */
  activateItem: (
    item: {
      id: string;
      name: string;
      multiplier: number;
      uses: number;
    },
  ) => boolean;
  /** Bar served a drink. Adds to bar stats, optionally tips chips and grants drink. */
  serveDrink: (params: {
    tipChips: number;
    grantItemId?: string;
    grantItemName?: string;
  }) => void;
  /** Borrow chips from the loan shark. Replaces any existing loan. */
  takeLoan: (principal: number, dailyRate: number) => boolean;
  /** Pay down the outstanding loan balance. Pass `Infinity` to clear it. */
  repayLoan: (amount: number) => boolean;
  /** Sell a shop/boost item back to the pawn shop for chips. */
  pawnItem: (itemId: string, value: number, name: string) => boolean;
  /** Sell a collectible item to the pawn shop for chips. */
  pawnCollectible: (id: string, value: number, name: string) => boolean;
  /** Add a collectible to the player's collection (from gameplay/bar drops). */
  addCollectible: (id: string, name: string) => void;
  /** Buy a collectible from the store for chips. */
  purchaseCollectible: (id: string, name: string, price: number) => boolean;
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
  inventory: {},
  activeBoost: null,
  bar: { served: 0, tipsEarned: 0 },
  loan: null,
  collectibles: {},
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
    inventory: stored.inventory ?? {},
    activeBoost: stored.activeBoost ?? null,
    bar: { ...DEFAULT_STATE.bar, ...(stored.bar ?? {}) },
    loan: stored.loan ?? null,
    collectibles: stored.collectibles ?? {},
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

  // Keep the sound module in sync with the user setting.
  useEffect(() => {
    setSoundMuted(!state.settings.soundEnabled);
  }, [state.settings.soundEnabled]);

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

      // Apply active boost to the *winnings* portion of a winning bet.
      let effectivePayout = payout;
      let bonusFromBoost = 0;
      let nextActiveBoost = prev.activeBoost;
      let boostJustExpired: ActiveBoost | null = null;
      if (prev.activeBoost && prev.activeBoost.usesLeft > 0) {
        if (win) {
          const winnings = payout - amount;
          bonusFromBoost = Math.round(
            winnings * (prev.activeBoost.multiplier - 1),
          );
          effectivePayout = payout + bonusFromBoost;
        }
        const usesLeft = prev.activeBoost.usesLeft - 1;
        if (usesLeft <= 0) {
          boostJustExpired = prev.activeBoost;
          nextActiveBoost = null;
        } else {
          nextActiveBoost = { ...prev.activeBoost, usesLeft };
        }
      }

      const newBalance = prev.balance + effectivePayout - amount;
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
        payout: effectivePayout,
        timestamp: Date.now(),
      };

      const history = [event, ...prev.history].slice(0, 50);

      const stats = {
        totalWagered: prev.stats.totalWagered + amount,
        biggestWin: Math.max(prev.stats.biggestWin, effectivePayout),
        handsPlayed: prev.stats.handsPlayed + 1,
      };

      // Daily challenges (use the boosted payout so wins still count)
      const challengeInput = {
        game,
        amount,
        payout: effectivePayout,
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

      // Achievements (boost-aware so big-win titles still trigger)
      const ctx: AchievementContext = {
        prev,
        game,
        amount,
        payout: effectivePayout,
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

      // Sound effect on resolution (respects settings.soundEnabled via setSoundMuted)
      if (amount > 0) {
        if (effectivePayout >= amount * 10) playSound("bigWin");
        else if (effectivePayout > amount) playSound("win");
        else if (effectivePayout === 0) playSound("lose");
      }

      // Collectible drop on big wins
      let droppedCollectibleId: string | null = null;
      let nextCollectibles = prev.collectibles;
      if (win && meta?.multiplier != null && meta.multiplier >= 5) {
        droppedCollectibleId = rollDrop(meta.multiplier);
        if (droppedCollectibleId) {
          nextCollectibles = {
            ...prev.collectibles,
            [droppedCollectibleId]: (prev.collectibles[droppedCollectibleId] ?? 0) + 1,
          };
        }
      }

      // Side-effect toasts (deferred). Use the boosted payout for the headline,
      // but call out the bonus separately so the player sees what the drink did.
      if (effectivePayout > 0) {
        if (amount > 0 && effectivePayout >= amount * 10) {
          setTimeout(
            () =>
              toast.success(
                `MASSIVE WIN! +${effectivePayout - amount} chips`,
                bonusFromBoost > 0
                  ? { description: `Drink bonus +${bonusFromBoost}` }
                  : undefined,
              ),
            0,
          );
        } else if (effectivePayout > amount) {
          setTimeout(
            () =>
              toast.success(
                `Winner! +${effectivePayout - amount} chips`,
                bonusFromBoost > 0
                  ? { description: `Drink bonus +${bonusFromBoost}` }
                  : undefined,
              ),
            0,
          );
        }
      }
      if (droppedCollectibleId) {
        const dId = droppedCollectibleId;
        setTimeout(() => {
          playSound("collectible");
          toast.success(`Item found: ${dId.replace(/_/g, " ")}`, {
            description: "Check the Pawn Shop to sell it.",
          });
        }, 600);
      }
      if (boostJustExpired) {
        setTimeout(
          () =>
            toast(`${boostJustExpired!.name} faded`, {
              description: "Mix or buy another to keep the magic going.",
            }),
          240,
        );
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
        activeBoost: nextActiveBoost,
        collectibles: nextCollectibles,
      };
    });
  };

  const purchaseItem = (item: {
    id: string;
    name: string;
    price: number;
  }): boolean => {
    let success = false;
    setState((prev) => {
      if (prev.balance < item.price) {
        setTimeout(() => toast.error("Not enough chips for that."), 0);
        return prev;
      }
      success = true;
      const inventory = {
        ...prev.inventory,
        [item.id]: (prev.inventory[item.id] ?? 0) + 1,
      };
      setTimeout(
        () =>
          toast.success(`Bought ${item.name}`, {
            description: `−${item.price} chips · stashed in your tab`,
          }),
        0,
      );
      return {
        ...prev,
        balance: prev.balance - item.price,
        inventory,
      };
    });
    return success;
  };

  const activateItem = (item: {
    id: string;
    name: string;
    multiplier: number;
    uses: number;
  }): boolean => {
    let success = false;
    setState((prev) => {
      const owned = prev.inventory[item.id] ?? 0;
      if (owned <= 0) {
        setTimeout(() => toast.error("You don't have any of those."), 0);
        return prev;
      }
      success = true;
      const inventory = { ...prev.inventory, [item.id]: owned - 1 };
      if (inventory[item.id] === 0) delete inventory[item.id];
      const pct = Math.round((item.multiplier - 1) * 100);
      setTimeout(
        () =>
          toast.success(`${item.name} activated`, {
            description: `+${pct}% on next ${item.uses} win${item.uses === 1 ? "" : "s"}`,
          }),
        0,
      );
      return {
        ...prev,
        inventory,
        activeBoost: {
          itemId: item.id,
          name: item.name,
          multiplier: item.multiplier,
          usesLeft: item.uses,
        },
      };
    });
    return success;
  };

  const serveDrink = (params: {
    tipChips: number;
    grantItemId?: string;
    grantItemName?: string;
  }) => {
    setState((prev) => {
      const inventory = { ...prev.inventory };
      if (params.grantItemId) {
        inventory[params.grantItemId] =
          (inventory[params.grantItemId] ?? 0) + 1;
      }
      const newBal = prev.balance + params.tipChips;
      if (params.tipChips > 0) {
        setTimeout(
          () =>
            toast.success(`Tip jar: +${params.tipChips} chips`, {
              description: params.grantItemName
                ? `${params.grantItemName} added to your tab`
                : undefined,
            }),
          0,
        );
      } else if (params.grantItemName) {
        setTimeout(
          () =>
            toast(`${params.grantItemName} added to your tab`, {
              description: "No tip — keep practicing.",
            }),
          0,
        );
      }
      return {
        ...prev,
        balance: newBal,
        inventory,
        bar: {
          served: prev.bar.served + 1,
          tipsEarned: prev.bar.tipsEarned + Math.max(0, params.tipChips),
        },
      };
    });
  };

  const addCollectible = (id: string, name: string) => {
    setState((prev) => {
      const collectibles = { ...prev.collectibles, [id]: (prev.collectibles[id] ?? 0) + 1 };
      setTimeout(
        () =>
          toast.success(`${name} added to your collection`, {
            description: "Sell it at the Pawn Shop.",
          }),
        0,
      );
      return { ...prev, collectibles };
    });
  };

  const purchaseCollectible = (id: string, name: string, price: number): boolean => {
    let success = false;
    setState((prev) => {
      if (prev.balance < price) {
        setTimeout(() => toast.error("Not enough chips for that."), 0);
        return prev;
      }
      success = true;
      const collectibles = { ...prev.collectibles, [id]: (prev.collectibles[id] ?? 0) + 1 };
      setTimeout(
        () =>
          toast.success(`Bought ${name}`, {
            description: `−${price} chips · in your collection`,
          }),
        0,
      );
      return { ...prev, balance: prev.balance - price, collectibles };
    });
    return success;
  };

  const pawnCollectible = (id: string, value: number, name: string): boolean => {
    let success = false;
    setState((prev) => {
      const owned = prev.collectibles[id] ?? 0;
      if (owned <= 0) {
        setTimeout(() => toast.error("Nothing to pawn."), 0);
        return prev;
      }
      success = true;
      const collectibles = { ...prev.collectibles, [id]: owned - 1 };
      if (collectibles[id] === 0) delete collectibles[id];
      setTimeout(
        () => toast.success(`Pawned ${name}`, { description: `+${value} chips` }),
        0,
      );
      return { ...prev, collectibles, balance: prev.balance + value };
    });
    return success;
  };

  const takeLoan = (principal: number, dailyRate: number): boolean => {
    let success = false;
    setState((prev) => {
      if (prev.loan) {
        setTimeout(
          () =>
            toast.error("You already have a loan out.", {
              description: "Settle it before signing for another.",
            }),
          0,
        );
        return prev;
      }
      if (principal <= 0) return prev;
      success = true;
      setTimeout(
        () =>
          toast.success(`Loan signed: +${principal} chips`, {
            description: `${Math.round(dailyRate * 100)}% per day. Don't be late.`,
          }),
        0,
      );
      return {
        ...prev,
        balance: prev.balance + principal,
        loan: { principal, takenAt: Date.now(), dailyRate },
      };
    });
    return success;
  };

  const repayLoan = (amount: number): boolean => {
    let success = false;
    setState((prev) => {
      if (!prev.loan) {
        setTimeout(() => toast.error("No loan to repay."), 0);
        return prev;
      }
      const owed = owedFor(prev.loan);
      const pay = Math.min(prev.balance, Math.max(1, Math.floor(amount)), owed);
      if (pay <= 0) {
        setTimeout(() => toast.error("Not enough chips to make a payment."), 0);
        return prev;
      }
      success = true;
      const newOwed = owed - pay;
      if (newOwed <= 0) {
        setTimeout(
          () =>
            toast.success("Loan paid in full.", {
              description: "The shark smiles. Don't get used to it.",
            }),
          0,
        );
        return { ...prev, balance: prev.balance - pay, loan: null };
      }
      // Fold the remaining debt back into a fresh "principal" so interest
      // continues to compound from this moment, on the new lower amount.
      setTimeout(
        () =>
          toast.success(`Paid −${pay} chips`, {
            description: `${newOwed} still owed.`,
          }),
        0,
      );
      return {
        ...prev,
        balance: prev.balance - pay,
        loan: {
          principal: newOwed,
          takenAt: Date.now(),
          dailyRate: prev.loan.dailyRate,
        },
      };
    });
    return success;
  };

  const pawnItem = (itemId: string, value: number, name: string): boolean => {
    let success = false;
    setState((prev) => {
      const owned = prev.inventory[itemId] ?? 0;
      if (owned <= 0) {
        setTimeout(() => toast.error("Nothing to pawn."), 0);
        return prev;
      }
      success = true;
      const inventory = { ...prev.inventory, [itemId]: owned - 1 };
      if (inventory[itemId] === 0) delete inventory[itemId];
      setTimeout(
        () =>
          toast.success(`Pawned ${name}`, {
            description: `+${value} chips`,
          }),
        0,
      );
      return {
        ...prev,
        inventory,
        balance: prev.balance + value,
      };
    });
    return success;
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
        purchaseItem,
        activateItem,
        serveDrink,
        takeLoan,
        repayLoan,
        pawnItem,
        pawnCollectible,
        addCollectible,
        purchaseCollectible,
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
