import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Music, RefreshCw, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { RECIPES, INGREDIENTS, scoreGlass, tipFor, type BarRecipe } from "@/lib/barRecipes";
import { rollBarDrop, getCollectible, RARITY_COLOR, RARITY_LABEL } from "@/lib/collectibles";
import { startMusic, stopMusic, getMusicTrackIds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const MUSIC_LABELS: Record<string, string> = {
  smoke: "🎷 Smoke & Linen",
  neon: "⚡ Neon Boulevard",
  midnight: "🌙 Midnight Swing",
  lounge: "🌺 Bossa Lounge",
  casino: "🎰 Lucky Vegas",
};

const MAX_TOTAL = 8;

type Phase = "pick" | "mix" | "result";

interface ResultState {
  score: number;
  chips: number;
  collectibleId: string | null;
}

function chipPrize(score: number): number {
  if (score >= 95) return 200;
  if (score >= 80) return 120;
  if (score >= 60) return 60;
  if (score >= 40) return 25;
  if (score >= 1) return 10;
  return 0;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "from-emerald-500 to-emerald-400" :
    score >= 60 ? "from-yellow-500 to-yellow-400" :
    score >= 40 ? "from-orange-500 to-orange-400" :
    "from-red-600 to-red-500";
  return (
    <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r", color)}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

function GlassVisual({ poured }: { poured: Record<string, number> }) {
  const totalPoured = Object.values(poured).reduce((a, b) => a + b, 0);
  const fillFraction = Math.min(1, totalPoured / MAX_TOTAL);

  const layers: { hex: string; fraction: number }[] = [];
  for (const [id, count] of Object.entries(poured)) {
    if (count <= 0) continue;
    const ing = INGREDIENTS.find((i) => i.id === id);
    if (!ing) continue;
    layers.push({ hex: ing.hex, fraction: count / MAX_TOTAL });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-16 rounded-b-2xl border-2 border-zinc-600 overflow-hidden bg-zinc-900"
        style={{ height: 96 }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col-reverse transition-all duration-300"
          style={{ height: `${fillFraction * 100}%` }}
        >
          {layers.map((l, i) => (
            <div
              key={i}
              style={{ flex: l.fraction, backgroundColor: l.hex, opacity: 0.85 }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent pointer-events-none" />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {totalPoured}/{MAX_TOTAL} parts
      </span>
    </div>
  );
}

export default function Bar() {
  const { serveDrink, addCollectible } = useCasinoStore();
  const [phase, setPhase] = useState<Phase>("pick");
  const [recipe, setRecipe] = useState<BarRecipe | null>(null);
  const [poured, setPoured] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ResultState | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const totalPoured = Object.values(poured).reduce((a, b) => a + b, 0);

  const pickRecipe = useCallback((r: BarRecipe) => {
    setRecipe(r);
    setPoured({});
    setResult(null);
    setPhase("mix");
  }, []);

  const pour = useCallback((ingId: string, delta: number) => {
    setPoured((prev) => {
      const current = prev[ingId] ?? 0;
      const newVal = Math.max(0, current + delta);
      const newTotal = Object.values(prev).reduce((a, b) => a + b, 0) - current + newVal;
      if (newTotal > MAX_TOTAL) return prev;
      return { ...prev, [ingId]: newVal };
    });
  }, []);

  const serve = useCallback(() => {
    if (!recipe) return;
    const score = scoreGlass(recipe, poured);
    const chips = chipPrize(score);
    const collectibleId = rollBarDrop(score);
    setResult({ score, chips, collectibleId });
    setPhase("result");
    serveDrink({ tipChips: chips });
    if (collectibleId) {
      const c = getCollectible(collectibleId);
      if (c) addCollectible(c.id, c.name);
    }
  }, [recipe, poured, serveDrink, addCollectible]);

  const reset = useCallback(() => {
    setPhase("pick");
    setRecipe(null);
    setPoured({});
    setResult(null);
  }, []);

  const toggleTrack = (trackId: string) => {
    if (playingTrack === trackId) {
      stopMusic();
      setPlayingTrack(null);
    } else {
      startMusic(trackId);
      setPlayingTrack(trackId);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-1 pt-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">The Back Room Bar</div>
        <h1 className="font-serif text-4xl casino-gradient-text">Vincent's Mixing Room</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Match the recipe to earn chips. Nail it and you might find a collectible.
        </p>
      </div>

      {/* Jukebox */}
      <div className="casino-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Jukebox</span>
          {playingTrack && (
            <span className="text-xs text-primary italic ml-1">
              Now playing: {MUSIC_LABELS[playingTrack]}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {getMusicTrackIds().map((id) => (
            <Button
              key={id}
              size="sm"
              variant={playingTrack === id ? "default" : "outline"}
              onClick={() => toggleTrack(id)}
              className={cn("text-xs", playingTrack === id && "bg-primary text-primary-foreground")}
            >
              {MUSIC_LABELS[id] ?? id}
            </Button>
          ))}
        </div>
      </div>

      {/* Game */}
      <AnimatePresence mode="wait">
        {phase === "pick" && (
          <motion.div
            key="pick"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <h2 className="font-serif text-xl text-center">Pick a drink to make</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RECIPES.map((r) => {
                const totalParts = Object.values(r.parts).reduce((a, b) => a + b, 0);
                return (
                  <motion.button
                    key={r.id}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => pickRecipe(r)}
                    className="casino-card p-5 text-left group cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif text-lg">{r.name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-3">{r.vibe}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(r.parts).map(([ingId, count]) => {
                        const ing = INGREDIENTS.find((i) => i.id === ingId);
                        return (
                          <span
                            key={ingId}
                            className={cn("text-xs px-2 py-0.5 rounded-full bg-background/60 border border-primary/20", ing?.color)}
                          >
                            {count}× {ing?.name ?? ingId}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {totalParts} parts total · up to 200 chips + collectible
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {phase === "mix" && recipe && (
          <motion.div
            key="mix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Recipe target */}
            <div className="casino-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Target Recipe</div>
              <div className="font-serif text-lg mb-1">{recipe.name}</div>
              <p className="text-xs italic text-muted-foreground mb-3">{recipe.vibe}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(recipe.parts).map(([ingId, count]) => {
                  const ing = INGREDIENTS.find((i) => i.id === ingId);
                  const current = poured[ingId] ?? 0;
                  const correct = current === count;
                  return (
                    <span
                      key={ingId}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border font-semibold transition-colors",
                        correct
                          ? "border-emerald-400/50 text-emerald-300 bg-emerald-500/10"
                          : "border-primary/20 text-muted-foreground bg-background/60",
                      )}
                    >
                      {count}× {ing?.name ?? ingId}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Controls + glass */}
            <div className="casino-card p-4">
              <div className="flex gap-6 items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Pour ingredients — {totalPoured}/{MAX_TOTAL} parts
                  </div>
                  {INGREDIENTS.map((ing) => {
                    const count = poured[ing.id] ?? 0;
                    const targetCount = recipe.parts[ing.id] ?? 0;
                    const isInRecipe = targetCount > 0;
                    return (
                      <div key={ing.id} className="flex items-center gap-3">
                        <span className={cn("text-sm w-20 font-medium shrink-0", ing.color, !isInRecipe && "opacity-35")}>
                          {ing.name}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-7 h-7 rounded-full text-base"
                          onClick={() => pour(ing.id, -1)}
                          disabled={count === 0}
                        >
                          −
                        </Button>
                        <span
                          className={cn(
                            "font-mono font-semibold w-6 text-center tabular-nums text-sm",
                            count > 0 && count === targetCount && "text-emerald-400",
                            count > 0 && count !== targetCount && "text-amber-300",
                          )}
                        >
                          {count}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-7 h-7 rounded-full text-base"
                          onClick={() => pour(ing.id, 1)}
                          disabled={totalPoured >= MAX_TOTAL}
                        >
                          +
                        </Button>
                        {isInRecipe && (
                          <span className="text-xs text-muted-foreground">need {targetCount}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <GlassVisual poured={poured} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="border-primary/30">
                <RefreshCw className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={serve}
                disabled={totalPoured === 0}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Serve It →
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "result" && result && recipe && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="casino-card p-6 text-center space-y-4">
              <div className="text-5xl">
                {result.score >= 80 ? "🍸" : result.score >= 60 ? "🥂" : result.score >= 40 ? "😅" : "💀"}
              </div>
              <div className="font-serif text-2xl">
                {result.score >= 95 ? "Flawless pour!" :
                 result.score >= 80 ? "Nicely done." :
                 result.score >= 60 ? "Close enough." :
                 result.score >= 40 ? "Needs work." :
                 "Vincent winces."}
              </div>
              <div className="text-sm text-muted-foreground italic">{recipe.name}</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-mono font-semibold">{result.score}%</span>
                </div>
                <ScoreBar score={result.score} />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                {result.chips > 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">+{result.chips} chips</span>
                    <Coins className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-muted-foreground">No tip this time.</span>
                  </div>
                )}

                {result.collectibleId && (() => {
                  const c = getCollectible(result.collectibleId!);
                  return c ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.35, type: "spring" }}
                      className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-amber-400/40 bg-amber-500/10"
                    >
                      <span className="text-2xl">{c.emoji}</span>
                      <div className="text-left">
                        <div className="text-sm font-semibold">{c.name} found!</div>
                        <div className={cn("text-xs", RARITY_COLOR[c.rarity])}>
                          {RARITY_LABEL[c.rarity]} · worth {c.pawnValue} chips at the pawn shop
                        </div>
                      </div>
                    </motion.div>
                  ) : null;
                })()}
              </div>
            </div>

            <Button variant="outline" onClick={reset} className="w-full border-primary/30">
              Mix Another
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
