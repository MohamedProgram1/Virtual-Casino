import { useState } from "react";
import { Volume2, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

export default function Settings() {
  const { settings, updateSettings, resetAccount, clearHistory, balance, stats } =
    useCasinoStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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
              Wipes balance, stats, and history. Starts you back at 1,000 chips.
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
                  This wipes your balance, stats, and play history. You'll start
                  fresh with 1,000 chips. This cannot be undone.
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
