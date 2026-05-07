import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { RECIPES } from "@/lib/barRecipes";
import { rollBarDrop, getCollectible, RARITY_COLOR, RARITY_LABEL } from "@/lib/collectibles";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

/* ── per-drink data: mixed color + clues ─────────────────────────── */
const DRINK_META: Record<
  string,
  { color: string; clues: [string, string, string] }
> = {
  old_fashioned: {
    color: "#b07a2b",
    clues: [
      "Rich and whiskey-forward",
      "Deep amber in the glass",
      "Finished with a bitter kiss",
    ],
  },
  martini: {
    color: "#c8eaf5",
    clues: [
      "Crystal-clear, almost watery",
      "Clean juniper on the nose",
      "Bone dry — no sweetness at all",
    ],
  },
  negroni: {
    color: "#c43355",
    clues: [
      "A striking ruby red color",
      "Three spirits in equal thirds",
      "Bittersweet Italian aperitivo",
    ],
  },
  highball: {
    color: "#c8b87a",
    clues: [
      "Tall, fizzy, and pale",
      "Spirit stretched with soda",
      "The easiest sipper on the menu",
    ],
  },
};

type Phase = "idle" | "reveal" | "guess" | "result";

interface RoundState {
  recipe: (typeof RECIPES)[number];
  cluesShown: number;
  guessesLeft: number;
  wrongIds: string[];
  won: boolean | null;
}

interface ResultState {
  chips: number;
  collectibleId: string | null;
  guessesUsed: number;
}

function MysteryGlass({
  color,
  revealed,
}: {
  color: string;
  revealed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 72, height: 110 }}>
        <svg viewBox="0 0 72 110" className="absolute inset-0 w-full h-full">
          <path
            d="M 6 10 L 20 82 L 24 92 L 24 104 L 48 104 L 48 92 L 52 82 L 66 10 Z"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
          />
          <clipPath id="mystery-clip">
            <path d="M 6 10 L 20 82 L 24 92 L 24 104 L 48 104 L 48 92 L 52 82 L 66 10 Z" />
          </clipPath>
          {revealed ? (
            <motion.rect
              x="0"
              y="0"
              width="72"
              height="104"
              fill={color}
              fillOpacity="0.82"
              clipPath="url(#mystery-clip)"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              style={{ transformOrigin: "bottom" }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          ) : (
            <rect
              x="0"
              y="0"
              width="72"
              height="104"
              fill="rgba(60,60,80,0.7)"
              clipPath="url(#mystery-clip)"
            />
          )}
          {/* ? overlay before reveal */}
          {!revealed && (
            <text
              x="36"
              y="60"
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="28"
              fontWeight="bold"
            >
              ?
            </text>
          )}
          {/* Highlight */}
          <path
            d="M 10 18 L 15 70"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function clueChips(won: boolean, guessesUsed: number): number {
  if (!won) return 0;
  return guessesUsed === 1 ? 250 : 100;
}

export default function Bar() {
  const { serveDrink, addCollectible } = useCasinoStore();

  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState<RoundState | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [revealTimer, setRevealTimer] = useState(0);

  /* Start a new round */
  const startRound = useCallback(() => {
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    setRound({ recipe, cluesShown: 0, guessesLeft: 2, wrongIds: [], won: null });
    setResult(null);
    setRevealTimer(0);
    setPhase("reveal");
  }, []);

  /* Reveal clues one at a time */
  useEffect(() => {
    if (phase !== "reveal" || !round) return;
    if (round.cluesShown >= 3) return;

    const t = setTimeout(() => {
      setRound((prev) =>
        prev ? { ...prev, cluesShown: prev.cluesShown + 1 } : prev,
      );
    }, 900);
    return () => clearTimeout(t);
  }, [phase, round?.cluesShown]);

  /* After all clues revealed, short pause then open guess phase */
  useEffect(() => {
    if (phase !== "reveal" || !round || round.cluesShown < 3) return;
    const t = setTimeout(() => setPhase("guess"), 600);
    return () => clearTimeout(t);
  }, [phase, round?.cluesShown]);

  const makeGuess = useCallback(
    (drinkId: string) => {
      if (!round || phase !== "guess") return;
      const correct = drinkId === round.recipe.id;

      if (correct) {
        const guessesUsed = 2 - round.guessesLeft + 1;
        const chips = clueChips(true, guessesUsed);
        const collectibleId = guessesUsed === 1 ? rollBarDrop(90) : rollBarDrop(55);
        setRound((prev) => prev ? { ...prev, won: true } : prev);
        setResult({ chips, collectibleId, guessesUsed });
        setPhase("result");
        playSound("win");
        serveDrink({ tipChips: chips });
        if (collectibleId) {
          const c = getCollectible(collectibleId);
          if (c) addCollectible(c.id, c.name);
        }
      } else {
        const newGuessesLeft = round.guessesLeft - 1;
        playSound("loss");
        if (newGuessesLeft <= 0) {
          setRound((prev) =>
            prev
              ? { ...prev, guessesLeft: 0, wrongIds: [...prev.wrongIds, drinkId], won: false }
              : prev,
          );
          setResult({ chips: 0, collectibleId: null, guessesUsed: 2 });
          setPhase("result");
        } else {
          setRound((prev) =>
            prev
              ? { ...prev, guessesLeft: newGuessesLeft, wrongIds: [...prev.wrongIds, drinkId] }
              : prev,
          );
        }
      }
    },
    [round, phase, serveDrink, addCollectible],
  );

  const meta = round ? DRINK_META[round.recipe.id] : null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">Vincent's Mixing Room</div>
        <h1 className="font-serif text-4xl casino-gradient-text">Mystery Drink</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Vincent pours a mystery drink. Three clues. Two guesses. Can you name it?
        </p>
      </div>

      {/* Prize table */}
      <div className="casino-card px-5 py-3 flex items-center justify-around text-sm">
        <div className="text-center">
          <div className="font-mono font-bold text-emerald-300">250</div>
          <div className="text-xs text-muted-foreground">chips (1st guess)</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="font-mono font-bold text-amber-300">100</div>
          <div className="text-xs text-muted-foreground">chips (2nd guess)</div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center">
          <div className="text-lg">✨</div>
          <div className="text-xs text-muted-foreground">collectible chance</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Idle */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="casino-card p-10 flex flex-col items-center gap-5"
          >
            <div className="text-6xl">🍸</div>
            <p className="text-muted-foreground text-sm text-center">
              Vincent has a mystery drink waiting. Think you can tell what it is?
            </p>
            <Button
              onClick={startRound}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            >
              Pour It →
            </Button>
          </motion.div>
        )}

        {/* Reveal phase */}
        {phase === "reveal" && round && meta && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="casino-card p-6 flex flex-col items-center gap-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Vincent pours…
              </div>
              <MysteryGlass color={meta.color} revealed={true} />
              <div className="w-full space-y-2.5">
                {meta.clues.map((clue, i) => (
                  <AnimatePresence key={i}>
                    {round.cluesShown > i && (
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span>{clue}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))}
              </div>
              {round.cluesShown < 3 && (
                <p className="text-xs text-muted-foreground italic animate-pulse">
                  Clue {round.cluesShown + 1} of 3…
                </p>
              )}
              {round.cluesShown >= 3 && (
                <p className="text-xs text-primary/70 italic">Identifying…</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Guess phase */}
        {phase === "guess" && round && meta && (
          <motion.div
            key="guess"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="casino-card p-6 space-y-4">
              <div className="flex gap-5 items-start">
                <MysteryGlass color={meta.color} revealed={true} />
                <div className="flex-1 space-y-2">
                  {meta.clues.map((clue, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <HelpCircle className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                      <span>{clue}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">What is this drink?</span>
                  <span className="text-xs text-muted-foreground">
                    {round.guessesLeft} guess{round.guessesLeft !== 1 ? "es" : ""} left
                  </span>
                </div>

                {round.guessesLeft === 1 && round.wrongIds.length > 0 && (
                  <p className="text-xs text-amber-300 mb-3 italic">
                    One more chance. Think carefully.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {RECIPES.map((r) => {
                    const isWrong = round.wrongIds.includes(r.id);
                    return (
                      <Button
                        key={r.id}
                        variant="outline"
                        disabled={isWrong}
                        onClick={() => makeGuess(r.id)}
                        className={cn(
                          "h-auto py-3 font-serif text-base transition-all",
                          isWrong && "opacity-30 line-through cursor-not-allowed",
                          !isWrong && "hover:border-primary/60 hover:bg-primary/10",
                        )}
                      >
                        {r.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Result phase */}
        {phase === "result" && round && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="casino-card p-6 text-center space-y-4">
              <div className="text-5xl">
                {round.won ? (result.guessesUsed === 1 ? "🎉" : "😅") : "😬"}
              </div>
              <div className="font-serif text-2xl">
                {round.won
                  ? result.guessesUsed === 1
                    ? "Perfect guess!"
                    : "Got it on the second try."
                  : "Not quite."}
              </div>

              {/* Reveal answer */}
              <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
                <MysteryGlass color={DRINK_META[round.recipe.id].color} revealed={true} />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-0.5">The mystery drink was</div>
                  <div className="font-serif text-xl">{round.recipe.name}</div>
                  <div className="text-xs italic text-muted-foreground">{round.recipe.vibe}</div>
                </div>
              </div>

              {/* Chips */}
              {result.chips > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">+{result.chips} chips</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-muted-foreground">No chips this round.</span>
                </div>
              )}

              {/* Collectible */}
              {result.collectibleId && (() => {
                const c = getCollectible(result.collectibleId!);
                return c ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-amber-400/40 bg-amber-500/10"
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">{c.name} found!</div>
                      <div className={cn("text-xs", RARITY_COLOR[c.rarity])}>
                        {RARITY_LABEL[c.rarity]} · {c.pawnValue} chips at the pawn shop
                      </div>
                    </div>
                  </motion.div>
                ) : null;
              })()}
            </div>

            <Button
              variant="outline"
              onClick={startRound}
              className="w-full border-primary/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Another
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
