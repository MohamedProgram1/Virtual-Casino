import { useState } from "react";
import {
  Volume2,
  RotateCcw,
  Trash2,
  AlertTriangle,
  KeyRound,
  Trophy,
  Lock,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCasinoStore } from "@/lib/store";
import {
  ALL_ACHIEVEMENTS,
  RARITY_STYLES,
  type Achievement,
} from "@/lib/achievements";
import { cn } from "@/lib/utils";

function AchievementsPanel() {
  const { achievements, equippedTitle, equipTitle } = useCasinoStore();
  const unlockedSet = new Set(achievements);

  const sorted = [...ALL_ACHIEVEMENTS].sort((a, b) => {
    const au = unlockedSet.has(a.id) ? 0 : 1;
    const bu = unlockedSet.has(b.id) ? 0 : 1;
    if (au !== bu) return au - bu;
    const order = { legendary: 0, epic: 1, rare: 2, common: 3 } as const;
    return order[a.rarity] - order[b.rarity];
  });

  const totalUnlocked = unlockedSet.size;

  return (
    <div className="casino-card p-6">
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-1">
            <Trophy className="w-3.5 h-3.5" />
            Titles & Achievements
          </div>
          <div className="text-sm text-muted-foreground">
            {totalUnlocked} of {ALL_ACHIEVEMENTS.length} unlocked · Tap an
            unlocked title to wear it.
          </div>
        </div>
        {equippedTitle && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => equipTitle(null)}
            className="border-primary/30"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Unequip
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((a: Achievement) => {
          const unlocked = unlockedSet.has(a.id);
          const equipped = equippedTitle === a.id;
          const styles = RARITY_STYLES[a.rarity];
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && equipTitle(equipped ? null : a.id)}
              className={cn(
                "text-left rounded-xl p-4 border bg-gradient-to-b transition-all relative",
                unlocked
                  ? "border-primary/20 hover:border-primary/40 cursor-pointer"
                  : "border-primary/10 opacity-50 cursor-not-allowed",
                equipped && "ring-2 ring-amber-400/60 border-amber-400/50",
                styles.bg,
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0 ring-2 bg-background/60",
                    styles.ring,
                  )}
                >
                  {unlocked ? (
                    <Icon className={cn("w-5 h-5", styles.color)} />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-base">{a.name}</span>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-semibold",
                        styles.color,
                      )}
                    >
                      {styles.label}
                    </span>
                    {equipped && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                        <Check className="w-3 h-3" />
                        Worn
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OwnerPanel() {
  const { ownerMode, unlockOwner } = useCasinoStore();
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);

  if (ownerMode) {
    return (
      <div className="casino-card p-6 border-amber-400/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-base text-amber-100">
              Owner Mode Active
            </div>
            <div className="text-xs text-muted-foreground">
              The Owner's Vault is unlocked from the lobby.
            </div>
          </div>
          <Check className="w-5 h-5 text-amber-300 shrink-0" />
        </div>
      </div>
    );
  }

  const submit = () => {
    if (!code.trim()) return;
    const ok = unlockOwner(code.trim());
    if (ok) setCode("");
  };

  return (
    <div className="casino-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-base">Owner Code</div>
          <div className="text-xs text-muted-foreground">
            Got the keys? Unlock the private game.
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Enter code"
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            aria-label={show ? "Hide code" : "Show code"}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          onClick={submit}
          disabled={!code.trim()}
          className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          Unlock
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, resetAccount, clearHistory, balance, stats } =
    useCasinoStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-2">
          The Cashier's Cage
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Settings</h1>
      </div>

      {/* Account snapshot */}
      <div className="casino-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
          Account
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="font-serif text-2xl text-primary tabular-nums">
              {balance.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Lifetime Hands</div>
            <div className="font-serif text-2xl text-primary tabular-nums">
              {stats.handsPlayed.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Sound */}
      <div className="casino-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-serif text-base">Sound Effects</div>
            <div className="text-xs text-muted-foreground">
              Toggle ambient room sounds and game effects
            </div>
          </div>
        </div>
        <Switch
          checked={settings.soundEnabled}
          onCheckedChange={(v) => updateSettings({ soundEnabled: v })}
        />
      </div>

      {/* Owner Code */}
      <OwnerPanel />

      {/* Achievements */}
      <AchievementsPanel />

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <div className="text-xs uppercase tracking-wider font-semibold">Danger Zone</div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-serif text-base">Clear History</div>
            <div className="text-xs text-muted-foreground">
              Empties your play log. Balance and stats remain.
            </div>
          </div>
          <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear play history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your recent play log. Your chip
                  balance is not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearHistory();
                    setClearOpen(false);
                  }}
                  className="bg-destructive text-destructive-foreground"
                >
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-serif text-base">Reset Account</div>
            <div className="text-xs text-muted-foreground">
              Wipes balance, stats, achievements, and history. Starts you back at 1,000 chips.
            </div>
          </div>
          <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                <AlertDialogDescription>
                  This wipes your balance, stats, achievements, and play history.
                  You'll start fresh with 1,000 chips. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetAccount();
                    setResetOpen(false);
                  }}
                  className="bg-destructive text-destructive-foreground"
                >
                  Reset Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Lucky Vault uses virtual chips only. No real money is involved.
      </p>
    </div>
  );
}
