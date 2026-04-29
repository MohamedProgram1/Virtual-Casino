import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { toast } from "sonner";
import { getLevelFor } from "./levels";

export type GameType = "slots" | "blackjack" | "roulette" | "dice";

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
}

interface CasinoContextType extends CasinoState {
  placeBet: (game: GameType, amount: number, payout: number) => void;
  refill: () => void;
  resetAccount: () => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<CasinoSettings>) => void;
}

const DEFAULT_STATE: CasinoState = {
  balance: 1000,
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
};

const STORAGE_KEY = "lucky_vault_casino_state";

const CasinoContext = createContext<CasinoContextType | null>(null);

export function CasinoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CasinoState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_STATE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to load casino state", e);
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Level-up detection: compare current vs previous level on hands change
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

  const placeBet = (game: GameType, amount: number, payout: number) => {
    setState((prev) => {
      if (prev.balance < amount) {
        toast.error("Insufficient funds!");
        return prev;
      }

      const netChange = payout - amount;
      const newBalance = prev.balance + netChange;
      
      const newEvent: GameHistoryEvent = {
        id: Math.random().toString(36).substring(2, 9),
        game,
        bet: amount,
        payout,
        timestamp: Date.now(),
      };

      const newHistory = [newEvent, ...prev.history].slice(0, 50);
      
      const newStats = {
        totalWagered: prev.stats.totalWagered + amount,
        biggestWin: Math.max(prev.stats.biggestWin, payout),
        handsPlayed: prev.stats.handsPlayed + 1,
      };

      if (payout > 0) {
        if (payout >= amount * 10) {
          toast.success(`MASSIVE WIN! +${payout} chips!`);
        } else if (payout > amount) {
          toast.success(`Winner! +${payout} chips!`);
        }
      }

      return {
        ...prev,
        balance: newBalance,
        history: newHistory,
        stats: newStats,
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
      return {
        ...prev,
        balance: prev.balance + 500,
        lastRefillTime: now,
      };
    });
  };

  const resetAccount = () => {
    setState({ ...DEFAULT_STATE, lastRefillTime: Date.now() });
    prevLevelRef.current = 1;
    toast.success("Account reset to 1000 chips.");
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

  return (
    <CasinoContext.Provider value={{ ...state, placeBet, refill, resetAccount, clearHistory, updateSettings }}>
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
