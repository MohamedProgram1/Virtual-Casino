import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ArrowLeft,
  Sparkles,
  Award,
  KeyRound,
  RotateCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCasinoStore } from "@/lib/store";
import { getLevelFor, getNextLevel } from "@/lib/levels";
import { getAchievement } from "@/lib/achievements";
import { owedFor } from "@/lib/loans";
import { GAME_LABELS } from "@/lib/games";
import { usePlayAgainSlot } from "@/lib/playAgain";
import { cn } from "@/lib/utils";

const STATIC_TITLES: Record<string, string> = {
  "/": "The Lobby",
  "/history": "History",
  "/settings": "Settings",
  "/store": "The Vault Store",
  "/bar": "The Bar",
  "/lounge": "The Lounge",
  "/loan-shark": "Loan Shark & Pawn",
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
  "/coin-flip": GAME_LABELS.coinflip,
  "/scratch": GAME_LABELS.scratch,
  "/baccarat": GAME_LABELS.baccarat,
  "/poker": GAME_LABELS.poker,
  "/pachinko": GAME_LABELS.pachinko,
  "/owner-vault": GAME_LABELS.ownerVault,
  "/owner-safe": GAME_LABELS.ownerSafe,
};

const PAGE_TITLES: Record<string, string> = {
  ...STATIC_TITLES,
  ...GAME_PAGE_TITLES,
};

// ── Balance ─────────────────────────────────────────────────────────────────

function ChipBalance() {
  const { balance, refill, lastRefillTime } = useCasinoStore();
  const canRefill = Date.now() - lastRefillTime >= 30_000;
  const low = balance < 100;

  return (
    <div className="flex items-center gap-2">
      <motion.div
        key={balance}
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 16 }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono font-semibold tabular-nums text-sm",
          low
            ? "border-amber-500/50 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_rgba(212,160,23,0.18)]"
            : "border-primary/35 bg-gradient-to-b from-primary/12 to-primary/5 text-foreground",
        )}
      >
        <Coins className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>{balance.toLocaleString()}</span>
      </motion.div>

      {low && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={refill}
              disabled={!canRefill}
              className="h-7 px-2.5 text-xs border border-primary/25 hover:bg-primary/10 text-primary disabled:opacity-30"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              +500
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-xs">{canRefill ? "Refill 500 chips" : "Wait 30 s between refills"}</span>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ── Level badge ──────────────────────────────────────────────────────────────

function LevelBadge() {
  const { stats } = useCasinoStore();
  const level = getLevelFor(stats.handsPlayed);
  const next  = getNextLevel(stats.handsPlayed);
  const pct   = next
    ? ((stats.handsPlayed - level.threshold) / (next.threshold - level.threshold)) * 100
    : 100;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/60 bg-card/40 cursor-default">
          <Award className="w-3 h-3 text-primary/80" />
          <span className="text-[11px] font-semibold text-zinc-300">{level.name}</span>
          <div className="w-10 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {next
          ? <span>{next.threshold - stats.handsPlayed} hands to <span className="text-primary">{next.name}</span></span>
          : <span>Highest tier reached.</span>
        }
      </TooltipContent>
    </Tooltip>
  );
}

// ── Title badge ──────────────────────────────────────────────────────────────

function TitleBadge() {
  const { equippedTitle } = useCasinoStore();
  if (!equippedTitle) return null;
  const a = getAchievement(equippedTitle);
  if (!a) return null;
  const Icon = a.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-400/35 bg-amber-400/8 cursor-default">
          <Icon className="w-3 h-3 text-amber-300" />
          <span className="text-[11px] font-semibold text-amber-200">{a.name}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent><span className="text-xs">{a.description}</span></TooltipContent>
    </Tooltip>
  );
}

// ── Boost badge ──────────────────────────────────────────────────────────────

function BoostBadge() {
  const { activeBoost } = useCasinoStore();
  if (!activeBoost) return null;
  const pct = Math.round((activeBoost.multiplier - 1) * 100);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          key={`${activeBoost.itemId}-${activeBoost.usesLeft}`}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-400/40 bg-emerald-500/8 cursor-default"
        >
          <Zap className="w-3 h-3 text-emerald-300" />
          <span className="text-[11px] font-semibold text-emerald-200">+{pct}%</span>
          <span className="text-[10px] text-emerald-400/70 font-mono">×{activeBoost.usesLeft}</span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">{activeBoost.name} · {activeBoost.usesLeft} bet{activeBoost.usesLeft === 1 ? "" : "s"} left</span>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Debt badge ───────────────────────────────────────────────────────────────

function DebtBadge() {
  const { loan } = useCasinoStore();
  if (!loan) return null;
  const owed = owedFor(loan);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border border-red-500/45 bg-red-500/10 cursor-default"
        >
          <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Owed</span>
          <span className="font-mono font-semibold text-red-300 text-[11px] tabular-nums">{owed.toLocaleString()}</span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs text-red-300">Loan outstanding — visit the Pawn Shop to repay.</span>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Owner badge ──────────────────────────────────────────────────────────────

function OwnerBadge() {
  const { ownerMode } = useCasinoStore();
  if (!ownerMode) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full border border-amber-400/45 bg-amber-400/10">
          <KeyRound className="w-3 h-3 text-amber-300" />
        </div>
      </TooltipTrigger>
      <TooltipContent><span className="text-xs">Owner mode active</span></TooltipContent>
    </Tooltip>
  );
}

// ── Play again FAB ───────────────────────────────────────────────────────────

function PlayAgainFab() {
  const slot = usePlayAgainSlot();
  return (
    <AnimatePresence>
      {slot && (
        <motion.div
          key="play-again-fab"
          initial={{ opacity: 0, y: 20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8"
        >
          <Button
            size="lg"
            onClick={slot.onClick}
            disabled={slot.disabled}
            className="rounded-full h-14 px-6 shadow-2xl shadow-primary/40 bg-gradient-to-b from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground font-semibold border border-primary-foreground/20"
          >
            <RotateCw className="w-5 h-5 mr-2" />
            {slot.label ?? "Play Again"}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const pageTitle = PAGE_TITLES[location] ?? "Lucky Vault";
  const isLobby   = location === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40">
        {/* Subtle gold gradient strip at the very top */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div
          className="border-b border-primary/12 backdrop-blur-xl"
          style={{
            background: "linear-gradient(180deg, rgba(212,160,23,0.055) 0%, rgba(0,0,0,0.72) 100%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">

            {/* ── Left: logo + page context ── */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">

              {/* Logo — always visible */}
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 cursor-pointer shrink-0 group"
                >
                  {/* Crown with glow */}
                  <div className="relative flex items-center justify-center w-7 h-7 rounded-full border border-primary/30 bg-primary/10 group-hover:border-primary/60 transition-colors">
                    <span className="text-sm">👑</span>
                    <div className="absolute inset-0 rounded-full blur-md bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-serif text-base sm:text-lg tracking-wide casino-gradient-text hidden xs:inline">
                    Lucky Vault
                  </span>
                </motion.div>
              </Link>

              {/* Separator + page context */}
              {!isLobby && (
                <>
                  <div className="w-px h-5 bg-primary/15 shrink-0" />
                  <Link href="/">
                    <Button variant="ghost" size="icon"
                      className="w-7 h-7 text-zinc-500 hover:text-primary shrink-0 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                  <h1 className="font-serif text-base sm:text-lg truncate text-zinc-200 min-w-0">
                    {pageTitle}
                  </h1>
                </>
              )}

              {isLobby && (
                <>
                  <div className="w-px h-5 bg-primary/15 hidden sm:block shrink-0" />
                  <span className="hidden sm:block text-xs text-zinc-600 font-medium tracking-wider uppercase">
                    The Floor
                  </span>
                </>
              )}
            </div>

            {/* ── Right: badges + balance + icons ── */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <TitleBadge />
              <LevelBadge />
              <BoostBadge />
              <DebtBadge />
              <OwnerBadge />

              {/* Divider before balance */}
              <div className="w-px h-5 bg-primary/12 hidden sm:block" />

              <ChipBalance />

              {/* Icon nav */}
              <div className="flex items-center gap-0.5 ml-0.5">
                <Link href="/history">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className={cn(
                          "w-8 h-8 text-zinc-600 hover:text-primary transition-colors",
                          location === "/history" && "text-primary bg-primary/8"
                        )}>
                        <HistoryIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><span className="text-xs">History</span></TooltipContent>
                  </Tooltip>
                </Link>
                <Link href="/settings">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className={cn(
                          "w-8 h-8 text-zinc-600 hover:text-primary transition-colors",
                          location === "/settings" && "text-primary bg-primary/8"
                        )}>
                        <SettingsIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><span className="text-xs">Settings</span></TooltipContent>
                  </Tooltip>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <PlayAgainFab />

      {/* ── Footer ── */}
      <footer className="border-t border-primary/8 py-5 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-3">
          <div className="w-1 h-1 rounded-full bg-primary/30" />
          <p className="text-[11px] text-zinc-700">
            Lucky Vault · Virtual chips only · For entertainment
          </p>
          <div className="w-1 h-1 rounded-full bg-primary/30" />
        </div>
      </footer>
    </div>
  );
}
