import { Lock, Sparkles } from "lucide-react";
import { GameType, useCasinoStore } from "@/lib/store";
import { VIP_UNLOCKS, isVipUnlocked, LEVELS } from "@/lib/levels";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VipToggleProps {
  game: GameType;
  isVip: boolean;
  onChange: (vip: boolean) => void;
  disabled?: boolean;
}

export function VipToggle({ game, isVip, onChange, disabled }: VipToggleProps) {
  const { stats } = useCasinoStore();
  const unlock = VIP_UNLOCKS[game];
  if (!unlock) return null;
  const unlocked = isVipUnlocked(game, stats.handsPlayed);
  const requiredLevel = LEVELS.find((l) => l.level === unlock.unlockLevel);

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-primary/25 bg-card/60">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all",
          !isVip
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        Standard
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={disabled || !unlocked}
            onClick={() => unlocked && onChange(true)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5",
              isVip && unlocked
                ? "bg-gradient-to-b from-amber-300 to-primary text-zinc-900 shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              !unlocked && "cursor-not-allowed opacity-60",
            )}
          >
            {!unlocked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            VIP
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {unlocked ? (
            <span>{unlock.perk}</span>
          ) : (
            <span>
              Reach <span className="text-primary">{requiredLevel?.name}</span> to
              unlock — {unlock.perk.toLowerCase()}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
