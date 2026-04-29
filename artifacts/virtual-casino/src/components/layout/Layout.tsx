import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Crown,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ArrowLeft,
  Sparkles,
  Award,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCasinoStore } from "@/lib/store";
import { getLevelFor, getNextLevel } from "@/lib/levels";
import { getAchievement } from "@/lib/achievements";
import { GAME_LABELS } from "@/lib/games";
import { cn } from "@/lib/utils";

const STATIC_TITLES: Record<string, string> = {
  "/": "The Lobby",
  "/history": "History",
  "/settings": "Settings",
};

const GAME_PAGE_TITLES: Record<string, string> = {
  "/slots": GAME_LABELS.slots,
  "/blackjack": GAME_LABELS.blackjack,
  "/roulette": GAME_LABELS.roulette,
  "/dice": GAME_LABELS.dice,
  "/plinko": GAME_LABELS.plinko,
  "/mines": GAME_LABELS.mines,
  "/crash": GAME_LABELS.crash,
  "/wheel": GAME_LABELS.wheel,
  "/hilo": GAME_LABELS.hilo,
  "/keno": GAME_LABELS.keno,
  "/owner-vault": GAME_LABELS.ownerVault,
};

const PAGE_TITLES: Record<string, string> = {
  ...STATIC_TITLES,
  ...GAME_PAGE_TITLES,
};

function ChipBalance() {
  const { balance, refill, lastRefillTime } = useCasinoStore();
  const canRefill = Date.now() - lastRefillTime >= 30_000;
  const showRefill = balance < 100;

  return (
    <div className="flex items-center gap-3">
      <motion.div
        key={balance}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-gradient-to-b from-primary/15 to-primary/5 shadow-inner"
      >
        <Coins className="w-4 h-4 text-primary" />
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {balance.toLocaleString()}
        </span>
      </motion.div>
      {showRefill && (
        <Button
          size="sm"
          variant="outline"
          onClick={refill}
          disabled={!canRefill}
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Refill +500
        </Button>
      )}
    </div>
  );
}

function TitleBadge() {
  const { equippedTitle } = useCasinoStore();
  if (!equippedTitle) return null;
  const a = getAchievement(equippedTitle);
  if (!a) return null;
  const Icon = a.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-400/40 bg-gradient-to-b from-amber-300/15 to-amber-700/10 cursor-default">
          <Icon className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-xs font-semibold text-amber-100 tracking-wide">
            {a.name}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">{a.description}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function LevelBadge() {
  const { stats } = useCasinoStore();
  const level = getLevelFor(stats.handsPlayed);
  const next = getNextLevel(stats.handsPlayed);
  const progress = next
    ? ((stats.handsPlayed - level.threshold) /
        (next.threshold - level.threshold)) *
      100
    : 100;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-card/40 cursor-default">
          <Award className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {level.name}
          </span>
          <div className="w-12 h-1 rounded-full bg-background overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/60 to-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {next ? (
          <span>
            {next.threshold - stats.handsPlayed} hands to{" "}
            <span className="text-primary">{next.name}</span>
          </span>
        ) : (
          <span>Highest tier reached.</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function OwnerBadge() {
  const { ownerMode } = useCasinoStore();
  if (!ownerMode) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-amber-400/50 bg-gradient-to-b from-amber-400/20 to-amber-700/15">
          <KeyRound className="w-3.5 h-3.5 text-amber-300" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">Owner mode active</span>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const pageTitle = PAGE_TITLES[location] ?? "Lucky Vault";
  const isLobby = location === "/";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {!isLobby ? (
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/">
                <div className="flex items-center gap-2 group cursor-pointer shrink-0">
                  <Crown className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-serif text-xl tracking-wide casino-gradient-text hidden sm:inline">
                    Lucky Vault
                  </span>
                </div>
              </Link>
            )}
            <div className="h-6 w-px bg-primary/20 hidden sm:block" />
            <h1 className="font-serif text-lg sm:text-xl truncate">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <TitleBadge />
            <LevelBadge />
            <OwnerBadge />
            <ChipBalance />
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/history">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-muted-foreground hover:text-primary",
                    location === "/history" && "text-primary",
                  )}
                >
                  <HistoryIcon className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-muted-foreground hover:text-primary",
                    location === "/settings" && "text-primary",
                  )}
                >
                  <SettingsIcon className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/10 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-muted-foreground">
            Lucky Vault · Virtual chips, no real money. For entertainment only.
          </p>
        </div>
      </footer>
    </div>
  );
}
