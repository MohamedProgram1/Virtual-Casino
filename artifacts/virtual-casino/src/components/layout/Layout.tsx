import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Crown, History as HistoryIcon, Settings as SettingsIcon, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "The Lobby",
  "/slots": "Slots",
  "/blackjack": "Blackjack",
  "/roulette": "Roulette",
  "/dice": "Dice",
  "/history": "History",
  "/settings": "Settings",
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
