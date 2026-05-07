import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { COCKTAILS, INGREDIENTS, type Cocktail } from "@/lib/cocktails";
import { rollBarDrop, getCollectible, RARITY_COLOR, RARITY_LABEL } from "@/lib/collectibles";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

// ── helpers ────────────────────────────────────────────────────────────────

function scoreAmounts(cocktail: Cocktail, amounts: Record<string, number>): number {
  let total = 0;
  for (const ing of cocktail.ingredients) {
    const chosen = amounts[ing.id] ?? 1;
    const diff = Math.abs(chosen - ing.parts);
    total += diff === 0 ? 100 : diff === 1 ? 65 : diff === 2 ? 30 : 10;
  }
  return Math.round(total / cocktail.ingredients.length);
}

function chipsForResult(score: number, strikes: number): number {
  if (strikes >= 3) return 0;
  if (score === 100 && strikes === 0) return 600;
  if (score >= 90 && strikes <= 1) return 400;
  if (score >= 75) return 250;
  if (score >= 55) return 120;
  return 60;
}

// ── sub-components ─────────────────────────────────────────────────────────

function MysteryGlass({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 64, height: 96 }}>
        <svg viewBox="0 0 64 96" className="absolute inset-0 w-full h-full">
          <path d="M5 8 L18 76 L21 84 L21 92 L43 92 L43 84 L46 76 L59 8Z"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
          <clipPath id="bc"><path d="M5 8 L18 76 L21 84 L21 92 L43 92 L43 84 L46 76 L59 8Z" /></clipPath>
          <rect x="0" y="0" width="64" height="92" fill={color} fillOpacity="0.85" clipPath="url(#bc)" />
          <path d="M10 16 L14 60" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function StrikeBar({ strikes }: { strikes: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">Strikes</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={strikes > i ? { scale: [1.3, 1] } : {}}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
              strikes > i
                ? "bg-red-500/20 border-red-500 text-red-400"
                : "bg-background/40 border-border text-muted-foreground/30",
            )}
          >
            {strikes > i ? "✕" : "○"}
          </motion.div>
        ))}
      </div>
      {strikes >= 3 && <span className="text-xs text-red-400 font-semibold">Game Over</span>}
    </div>
  );
}

// ── main ───────────────────────────────────────────────────────────────────

type Phase = "idle" | "playing" | "serving" | "result";

interface ResultData {
  chips: number;
  score: number;
  collectibleId: string | null;
  gameOver: boolean;
}

export default function Bar() {
  const { serveDrink, addCollectible } = useCasinoStore();

  const [phase, setPhase] = useState<Phase>("idle");
  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [resultData, setResultData] = useState<ResultData | null>(null);

  const allFound = cocktail !== null && found.length === cocktail.ingredients.length;

  const startRound = useCallback(() => {
    const c = COCKTAILS[Math.floor(Math.random() * COCKTAILS.length)];
    setCocktail(c);
    setStrikes(0);
    setFound([]);
    setWrong([]);
    setAmounts({});
    setResultData(null);
    setPhase("playing");
  }, []);

  const testIngredient = useCallback(
    (id: string) => {
      if (!cocktail || phase !== "playing") return;
      if (found.includes(id) || wrong.includes(id)) return;

      const inRecipe = cocktail.ingredients.some((i) => i.id === id);
      if (inRecipe) {
        playSound("chip");
        const newFound = [...found, id];
        setFound(newFound);
        setAmounts((prev) => ({ ...prev, [id]: 1 }));
      } else {
        playSound("lose");
        const newWrong = [...wrong, id];
        setWrong(newWrong);
        const newStrikes = strikes + 1;
        setStrikes(newStrikes);
        if (newStrikes >= 3) {
          setResultData({ chips: 0, score: 0, collectibleId: null, gameOver: true });
          setPhase("result");
        }
      }
    },
    [cocktail, phase, found, wrong, strikes],
  );

  const serve = useCallback(() => {
    if (!cocktail || !allFound) return;
    const score = scoreAmounts(cocktail, amounts);
    const chips = chipsForResult(score, strikes);
    const rawScore = score - strikes * 10;
    const collectibleId = rollBarDrop(Math.max(0, rawScore));
    setResultData({ chips, score, collectibleId, gameOver: false });
    setPhase("result");
    serveDrink({ tipChips: chips });
    if (collectibleId) {
      const c = getCollectible(collectibleId);
      if (c) addCollectible(c.id, c.name);
    }
  }, [cocktail, allFound, amounts, strikes, serveDrink, addCollectible]);

  const totalParts = cocktail
    ? cocktail.ingredients.reduce((s, i) => s + i.parts, 0)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">Vincent's Mixing Room</div>
        <h1 className="font-serif text-4xl casino-gradient-text">Mystery Drink</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Find all the ingredients. Set the amounts. Serve it perfectly for up to 600 chips.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ── IDLE ── */}
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="casino-card p-10 flex flex-col items-center gap-5 text-center">
            <div className="text-6xl">🍸</div>
            <div className="space-y-1">
              <div className="font-serif text-xl">95 cocktails. 30 ingredients.</div>
              <p className="text-sm text-muted-foreground">
                Click ingredients to test them. ✅ = in the recipe. ❌ = strike (max 3). Find every ingredient, dial in the parts, and serve.
              </p>
            </div>
            <Button onClick={startRound} className="bg-primary text-primary-foreground hover:bg-primary/90 px-10">
              Pour the Mystery Drink →
            </Button>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {phase === "playing" && cocktail && (
          <motion.div key="playing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Info bar */}
            <div className="casino-card px-4 py-3 flex items-center gap-4 flex-wrap">
              <MysteryGlass color={cocktail.color} label={`${cocktail.ingredients.length} ingredients`} />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {cocktail.clues.map((c, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 italic">
                      {c}
                    </span>
                  ))}
                  <span className="text-xs px-2.5 py-1 rounded-full border border-blue-400/20 bg-blue-500/5 text-blue-300">
                    {totalParts} parts total
                  </span>
                </div>
                <StrikeBar strikes={strikes} />
              </div>
            </div>

            {/* Found ingredients */}
            {found.length > 0 && (
              <div className="casino-card p-4 space-y-2">
                <div className="text-xs uppercase tracking-wider text-emerald-400/80 mb-1">
                  Found — {found.length}/{cocktail.ingredients.length}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {found.map((id) => {
                    const ing = INGREDIENTS.find((i) => i.id === id)!;
                    const val = amounts[id] ?? 1;
                    return (
                      <div key={id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className={cn("text-sm font-medium flex-1", ing.colorClass)}>{ing.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => setAmounts((p) => ({ ...p, [id]: Math.max(1, val - 1) }))}
                            className="w-6 h-6 rounded-full border border-border text-xs hover:border-primary/50 transition-colors">−</button>
                          <span className="w-5 text-center font-mono text-sm font-semibold tabular-nums">{val}</span>
                          <button onClick={() => setAmounts((p) => ({ ...p, [id]: Math.min(5, val + 1) }))}
                            className="w-6 h-6 rounded-full border border-border text-xs hover:border-primary/50 transition-colors">+</button>
                          <span className="text-xs text-muted-foreground ml-0.5">parts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {allFound && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <Button onClick={serve}
                      className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                      Serve It →
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Ingredient grid */}
            <div className="casino-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Test an ingredient — click to reveal if it's in the drink
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {INGREDIENTS.map((ing) => {
                  const isFound = found.includes(ing.id);
                  const isWrong = wrong.includes(ing.id);
                  return (
                    <motion.button
                      key={ing.id}
                      whileTap={isFound || isWrong ? {} : { scale: 0.93 }}
                      onClick={() => testIngredient(ing.id)}
                      disabled={isFound || isWrong}
                      className={cn(
                        "px-2 py-2 rounded-lg border text-xs font-medium text-center transition-all leading-tight",
                        isFound && "border-emerald-400/50 bg-emerald-500/15 text-emerald-300 cursor-default",
                        isWrong && "border-red-500/30 bg-red-500/10 text-red-400/50 cursor-not-allowed line-through",
                        !isFound && !isWrong && "border-border/50 bg-background/60 hover:border-primary/40 hover:bg-primary/8 cursor-pointer",
                        !isFound && !isWrong && ing.colorClass,
                      )}
                    >
                      {isWrong ? <X className="w-3 h-3 mx-auto opacity-40" /> : ing.shortName}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && cocktail && resultData && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="space-y-4">
            <div className="casino-card p-6 text-center space-y-4">
              <div className="text-5xl">
                {resultData.gameOver ? "💀" : resultData.score === 100 && strikes === 0 ? "🏆" : resultData.score >= 80 ? "🎉" : resultData.score >= 55 ? "😅" : "😬"}
              </div>
              <div className="font-serif text-2xl">
                {resultData.gameOver ? "Three strikes." :
                  resultData.score === 100 && strikes === 0 ? "Flawless. Absolutely perfect." :
                  resultData.score >= 80 ? "Nicely done." :
                  resultData.score >= 55 ? "Close enough." : "A bit off."}
              </div>

              {/* Reveal */}
              <div className="flex items-center justify-center gap-4 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
                <MysteryGlass color={cocktail.color} label="" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-0.5">The mystery drink was</div>
                  <div className="font-serif text-xl">{cocktail.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {cocktail.ingredients.map((i) => {
                      const ing = INGREDIENTS.find((x) => x.id === i.id);
                      const chosen = amounts[i.id] ?? "?";
                      const correct = amounts[i.id] === i.parts;
                      return (
                        <div key={i.id} className={cn("flex gap-2", correct ? "text-emerald-400" : "text-red-400")}>
                          <span>{correct ? "✓" : "✗"}</span>
                          <span>{ing?.name}</span>
                          <span className="text-muted-foreground">
                            (you: {chosen} · correct: {i.parts})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {!resultData.gameOver && (
                <div className="text-sm">
                  Accuracy: <span className="font-mono font-bold text-primary">{resultData.score}%</span>
                  {strikes > 0 && <span className="text-red-400 ml-2">· {strikes} strike{strikes !== 1 ? "s" : ""}</span>}
                </div>
              )}

              {resultData.chips > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-300 text-lg">+{resultData.chips} chips</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No chips this round.</div>
              )}

              {resultData.collectibleId && (() => {
                const c = getCollectible(resultData.collectibleId!);
                return c ? (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-amber-400/40 bg-amber-500/10">
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">{c.name} discovered!</div>
                      <div className={cn("text-xs", RARITY_COLOR[c.rarity])}>
                        {RARITY_LABEL[c.rarity]} · {c.pawnValue} chips at pawn shop
                      </div>
                    </div>
                  </motion.div>
                ) : null;
              })()}
            </div>

            <Button variant="outline" onClick={startRound} className="w-full border-primary/30">
              <RefreshCw className="w-4 h-4 mr-2" />
              New Mystery Drink
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
