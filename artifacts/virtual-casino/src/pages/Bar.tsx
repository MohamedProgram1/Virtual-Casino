import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, GlassWater } from "lucide-react";
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
  // Consolation on game over
  if (strikes >= 3) return 40;
  // Scale rewards — anyone who serves earns something
  if (score === 100 && strikes === 0) return 600;
  if (score >= 90 && strikes === 0) return 450;
  if (score >= 80) return 300;
  if (score >= 65) return 180;
  if (score >= 45) return 90;
  return 50;
}

// ── Glass path math (no clipPath — avoids CSS transform issues) ────────────

function buildFillPath(w: number, topY: number, bodyH: number, fillPct: number): string {
  // When empty, degenerate path at bottom (same # of commands so Framer can morph it)
  const clamped = Math.max(0, Math.min(1, fillPct));
  const fillY = topY + (bodyH - topY) * (1 - clamped * 0.96);
  const t = (fillY - topY) / Math.max(1, bodyH - topY);

  const xL = w * 0.13 + t * (w * 0.25 - w * 0.13);
  const xR = w * 0.87 + t * (w * 0.75 - w * 0.87);
  const bL = w * 0.25;
  const bR = w * 0.75;
  const cx = w * 0.5;
  const bY = bodyH;
  const bYq = bodyH + 4;

  return `M ${xL} ${fillY} L ${xR} ${fillY} L ${bR} ${bY} Q ${bR} ${bYq} ${cx} ${bYq} Q ${bL} ${bYq} ${bL} ${bY} Z`;
}

// ── Cocktail Glass ─────────────────────────────────────────────────────────

function CocktailGlass({
  fillPct,
  color,
  shake,
  size = "md",
}: {
  fillPct: number;
  color: string;
  shake: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [w, h] = ({ sm: [64, 90], md: [96, 130], lg: [120, 168] } as const)[size];
  const bodyH = h * 0.8;
  const topY = h * 0.06;
  const stemX = w * 0.5;
  const baseW = w * 0.55;
  const stemBaseY = bodyH + 4;

  const glassOutline = `M${w * 0.13} ${topY} L${w * 0.87} ${topY} L${w * 0.75} ${bodyH} Q${w * 0.75} ${stemBaseY} ${stemX} ${stemBaseY} Q${w * 0.25} ${stemBaseY} ${w * 0.25} ${bodyH} Z`;

  const emptyPath = buildFillPath(w, topY, bodyH, 0);
  const fillPath  = useMemo(() => buildFillPath(w, topY, bodyH, fillPct), [w, topY, bodyH, fillPct]);
  const shineClipId = `gs-${size}`;

  return (
    <motion.div
      animate={
        shake
          ? { rotate: [0, -7, 7, -5, 5, -3, 3, 0], transition: { duration: 0.65 } }
          : { rotate: 0 }
      }
      className="inline-flex flex-col items-center"
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
        <defs>
          {/* Used only for the shine overlay, not the fill */}
          <clipPath id={shineClipId}>
            <path d={glassOutline} />
          </clipPath>
          <linearGradient id={`lg-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`sh-${size}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        {/* Glass body tint */}
        <path d={glassOutline} fill="rgba(255,255,255,0.025)" />

        {/* Liquid fill — computed path, no clipPath transform issues */}
        <motion.path
          fill={`url(#lg-${size})`}
          initial={{ d: emptyPath }}
          animate={{ d: fillPath }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
        />

        {/* Glass shine (clipped correctly — only decorative, no liquid) */}
        <path
          d={glassOutline}
          fill={`url(#sh-${size})`}
          clipPath={`url(#${shineClipId})`}
        />

        {/* Inner highlight line */}
        <line
          x1={w * 0.18} y1={topY + 4}
          x2={w * 0.20} y2={bodyH - 10}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2.5"
          strokeLinecap="round"
          clipPath={`url(#${shineClipId})`}
        />

        {/* Glass outline */}
        <path d={glassOutline} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />

        {/* Stem + base */}
        <line x1={stemX} y1={stemBaseY} x2={stemX} y2={stemBaseY + h * 0.12}
          stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" />
        <line
          x1={(w - baseW) / 2} y1={stemBaseY + h * 0.12}
          x2={(w + baseW) / 2} y2={stemBaseY + h * 0.12}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"
        />
      </svg>
    </motion.div>
  );
}

// ── Bottle ─────────────────────────────────────────────────────────────────

function Bottle({
  id,
  shortName,
  hex,
  found,
  wrong,
  onClick,
}: {
  id: string;
  shortName: string;
  hex: string;
  found: boolean;
  wrong: boolean;
  onClick: () => void;
}) {
  const disabled = found || wrong;
  // W=20 H=54 clean bottle path: narrow neck → curved shoulders → body
  const W = 20;
  const H = 54;
  // One continuous outline path
  const bottlePath = `M 7.5 0 L 12.5 0 L 12.5 10 Q 17 14 17 20 L 17 48 Q 17 54 10 54 Q 3 54 3 48 L 3 20 Q 3 14 7.5 10 Z`;
  const fillId = `bf-${id}`;
  const clipId  = `bc-${id}`;

  return (
    <motion.button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      whileHover={!disabled ? { y: -5, scale: 1.1 } : undefined}
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      className={cn(
        "flex flex-col items-center gap-0.5 px-0.5 pt-1 pb-0.5 rounded focus:outline-none transition-all group",
        !disabled && "cursor-pointer hover:bg-white/5",
        disabled && "cursor-default",
      )}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="visible">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hex} stopOpacity={wrong ? 0.12 : found ? 1 : 0.72} />
            <stop offset="100%" stopColor={hex} stopOpacity={wrong ? 0.04 : found ? 0.82 : 0.48} />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={bottlePath} />
          </clipPath>
        </defs>

        {/* Body fill */}
        <path d={bottlePath} fill={`url(#${fillId})`} />

        {/* Shine */}
        {!wrong && (
          <line x1="6" y1="22" x2="5.5" y2="46"
            stroke="rgba(255,255,255,0.2)" strokeWidth="1.8"
            strokeLinecap="round" clipPath={`url(#${clipId})`} />
        )}

        {/* Label band */}
        {!wrong && !found && (
          <rect x="3" y="26" width="14" height="8" rx="1"
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        )}

        {/* Outline */}
        <path d={bottlePath} fill="none"
          stroke={found ? "#4ade80" : wrong ? "#ef4444aa" : "rgba(255,255,255,0.2)"}
          strokeWidth={found ? "1.4" : "0.9"} />

        {/* Found: check */}
        {found && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ transformOrigin: `${W / 2}px 36px` }}
          >
            <circle cx={W / 2} cy={36} r={6.5}
              fill="rgba(74,222,128,0.22)" stroke="#4ade80" strokeWidth="1.2" />
            <motion.path
              d={`M${W / 2 - 3.5} 36 L${W / 2 - 1} 39 L${W / 2 + 4} 32.5`}
              stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.28, delay: 0.06 }}
            />
          </motion.g>
        )}

        {/* Wrong: X */}
        {wrong && (
          <g opacity="0.65">
            <line x1="6" y1="28" x2="14" y2="44" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="14" y1="28" x2="6"  y2="44" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        )}
      </svg>
      <span className={cn(
        "text-[7px] leading-tight text-center font-medium w-5 truncate block",
        found ? "text-emerald-400" : wrong ? "text-red-400/40 line-through" : "text-zinc-500 group-hover:text-zinc-300"
      )}>
        {shortName}
      </span>
    </motion.button>
  );
}

// ── Strike dots ────────────────────────────────────────────────────────────

function StrikeRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-widest text-zinc-600">Strikes</span>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div key={i}
            animate={count > i ? { scale: [1.5, 1] } : {}}
            className={cn(
              "w-6 h-6 rounded-full border-2 text-[10px] font-bold flex items-center justify-center",
              count > i ? "bg-red-500/20 border-red-500 text-red-400" : "border-zinc-800 text-zinc-700"
            )}
          >
            {count > i ? "✕" : "○"}
          </motion.div>
        ))}
      </div>
      {count >= 3 && (
        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          className="text-xs text-red-400 font-semibold">
          You're cut off.
        </motion.span>
      )}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type Phase = "idle" | "playing" | "result";

interface ResultData {
  chips: number;
  score: number;
  collectibleId: string | null;
  gameOver: boolean;
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function Bar() {
  const { serveDrink, addCollectible } = useCasinoStore();

  const [phase, setPhase]         = useState<Phase>("idle");
  const [cocktail, setCocktail]   = useState<Cocktail | null>(null);
  const [strikes, setStrikes]     = useState(0);
  const [found, setFound]         = useState<string[]>([]);
  const [wrong, setWrong]         = useState<string[]>([]);
  const [amounts, setAmounts]     = useState<Record<string, number>>({});
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [serving, setServing]     = useState(false);

  const allFound   = cocktail !== null && found.length === cocktail.ingredients.length;
  const totalParts = cocktail ? cocktail.ingredients.reduce((s, i) => s + i.parts, 0) : 0;
  const foundParts = found.reduce((s, id) => s + (amounts[id] ?? 1), 0);
  const fillPct    = cocktail && totalParts > 0 ? Math.min(1, foundParts / totalParts) : 0;

  const startRound = useCallback(() => {
    const c = COCKTAILS[Math.floor(Math.random() * COCKTAILS.length)];
    setCocktail(c);
    setStrikes(0);
    setFound([]);
    setWrong([]);
    setAmounts({});
    setResultData(null);
    setServing(false);
    setPhase("playing");
  }, []);

  const testIngredient = useCallback((id: string) => {
    if (!cocktail || phase !== "playing") return;
    if (found.includes(id) || wrong.includes(id)) return;
    const inRecipe = cocktail.ingredients.some((i) => i.id === id);
    if (inRecipe) {
      playSound("chip");
      setFound((prev) => [...prev, id]);
      setAmounts((prev) => ({ ...prev, [id]: 1 }));
    } else {
      playSound("lose");
      const newStrikes = strikes + 1;
      setWrong((prev) => [...prev, id]);
      setStrikes(newStrikes);
      if (newStrikes >= 3) {
        const chips = chipsForResult(0, 3);
        setResultData({ chips, score: 0, collectibleId: null, gameOver: true });
        setPhase("result");
        serveDrink({ tipChips: chips });
      }
    }
  }, [cocktail, phase, found, wrong, strikes, serveDrink]);

  const serve = useCallback(async () => {
    if (!cocktail || !allFound || serving) return;
    setServing(true);
    await new Promise((r) => setTimeout(r, 700));
    const score       = scoreAmounts(cocktail, amounts);
    const chips       = chipsForResult(score, strikes);
    const rawScore    = score - strikes * 10;
    const collectibleId = rollBarDrop(Math.max(0, rawScore));
    setResultData({ chips, score, collectibleId, gameOver: false });
    setPhase("result");
    serveDrink({ tipChips: chips });
    if (collectibleId) {
      const c = getCollectible(collectibleId);
      if (c) addCollectible(c.id, c.name);
    }
  }, [cocktail, allFound, amounts, strikes, serveDrink, addCollectible, serving]);

  const resultEmoji =
    !resultData ? "🍸"
    : resultData.gameOver ? "💀"
    : resultData.score === 100 && strikes === 0 ? "🏆"
    : resultData.score >= 80 ? "🎉"
    : resultData.score >= 55 ? "😅"
    : "😬";

  const resultLine =
    !resultData ? ""
    : resultData.gameOver ? "Three strikes — but you still earn something."
    : resultData.score === 100 && strikes === 0 ? "Flawless. A perfect serve."
    : resultData.score >= 80 ? "Well poured. Good effort."
    : resultData.score >= 55 ? "Close enough. Kind of."
    : "That was rough.";

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* ── Header ── */}
      <div className="text-center pt-4 space-y-0.5">
        <div className="text-[10px] uppercase tracking-[0.35em] text-primary/60">Vincent's</div>
        <h1 className="font-serif text-4xl casino-gradient-text">The Bar</h1>
        <p className="text-xs text-muted-foreground/70">
          Identify the ingredients · Set the parts · Serve the mystery drink
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ════ IDLE ════ */}
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}>
            <div className="casino-card overflow-hidden">
              <div className="relative px-6 pt-10 pb-8 flex flex-col items-center gap-5 text-center"
                style={{ background: "linear-gradient(180deg,rgba(212,160,23,0.08) 0%,transparent 100%)" }}>
                <div className="relative">
                  <div className="absolute inset-[-24px] rounded-full blur-3xl pointer-events-none"
                    style={{ background: "rgba(180,120,20,0.18)" }} />
                  <CocktailGlass fillPct={0.55} color="#c8904a" shake={false} size="lg" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <div className="font-serif text-2xl text-zinc-100">95 cocktails. 30 ingredients.</div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Tap bottles on the shelf to test if they're in tonight's mystery drink. Find every ingredient, dial in the parts, and serve. Three wrong taps and you're cut off — but you still walk away with something.
                  </p>
                </div>
                <div className="flex items-center gap-6 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5"><span>🏆</span>Perfect = 600 chips</span>
                  <div className="w-px h-4 bg-zinc-700" />
                  <span className="flex items-center gap-1.5"><span>💀</span>3 strikes = 40 chips</span>
                </div>
                <Button onClick={startRound} size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 font-semibold text-sm h-11 mt-1">
                  Pour the Mystery Drink
                </Button>
              </div>
              <div className="px-6 py-3 border-t border-border/50 flex justify-center gap-8 text-xs text-zinc-600">
                <span>Perfect: 600 chips</span>
                <span>·</span>
                <span>Good: 180–450 chips</span>
                <span>·</span>
                <span>Any serve: 50+ chips</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════ PLAYING ════ */}
        {phase === "playing" && cocktail && (
          <motion.div key="playing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} className="space-y-3">

            {/* Top card */}
            <div className="casino-card p-4 flex gap-4">
              {/* Glass */}
              <div className="flex flex-col items-center gap-1.5 shrink-0 pr-4 border-r border-border/50">
                <CocktailGlass fillPct={fillPct} color={cocktail.color} shake={serving} size="md" />
                <div className="text-center space-y-0.5">
                  <div className="text-[10px] font-mono tabular-nums text-zinc-400">
                    {found.length}<span className="text-zinc-700">/</span>{cocktail.ingredients.length}
                  </div>
                  <div className="text-[9px] text-zinc-600">{totalParts} parts total</div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-primary/50 mb-1.5">Mystery Drink</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cocktail.clues.map((c, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-primary/20 bg-primary/8 italic text-zinc-300">{c}</span>
                    ))}
                  </div>
                </div>

                <StrikeRow count={strikes} />

                <AnimatePresence>
                  {found.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1 overflow-hidden">
                      <div className="text-[9px] uppercase tracking-widest text-emerald-500/60">In the drink</div>
                      {found.map((id) => {
                        const ing = INGREDIENTS.find((i) => i.id === id)!;
                        const val = amounts[id] ?? 1;
                        return (
                          <motion.div key={id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8">
                            <div className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: ing.hex, boxShadow: `0 0 5px ${ing.hex}88` }} />
                            <span className="text-xs font-medium text-zinc-200 flex-1 truncate">{ing.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setAmounts((p) => ({ ...p, [id]: Math.max(1, val - 1) }))}
                                className="w-5 h-5 rounded border border-zinc-700 text-[11px] hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center">−</button>
                              <span className="w-4 text-center text-xs font-mono font-bold text-zinc-100 tabular-nums">{val}</span>
                              <button onClick={() => setAmounts((p) => ({ ...p, [id]: Math.min(6, val + 1) }))}
                                className="w-5 h-5 rounded border border-zinc-700 text-[11px] hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center">+</button>
                              <span className="text-[9px] text-zinc-600 ml-0.5">pts</span>
                            </div>
                          </motion.div>
                        );
                      })}
                      <AnimatePresence>
                        {allFound && (
                          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-0.5">
                            <Button onClick={serve} disabled={serving}
                              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-8 text-sm">
                              {serving ? (
                                <span className="flex items-center gap-2">
                                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }} className="inline-block">⟳</motion.span>
                                  Shaking…
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5"><GlassWater className="w-3.5 h-3.5" />Serve It</span>
                              )}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {found.length === 0 && (
                  <p className="text-xs text-zinc-600 italic">Tap a bottle below to start testing.</p>
                )}
              </div>
            </div>

            {/* Bottle shelf */}
            <div className="casino-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[9px] uppercase tracking-widest text-zinc-600">Ingredient Shelf — tap to test</div>
                <div className="text-[9px] text-zinc-700">{30 - found.length - wrong.length} untested</div>
              </div>

              <div className="relative">
                {/* Shelf rail */}
                <div className="absolute bottom-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
                <div className="absolute bottom-7 left-0 right-0 h-1.5 bg-gradient-to-b from-zinc-800/60 to-transparent rounded" />

                <div className="grid grid-cols-10 gap-x-0 gap-y-0 justify-items-center pb-2">
                  {INGREDIENTS.map((ing) => (
                    <Bottle
                      key={ing.id}
                      id={ing.id}
                      shortName={ing.shortName}
                      hex={ing.hex}
                      found={found.includes(ing.id)}
                      wrong={wrong.includes(ing.id)}
                      onClick={() => testIngredient(ing.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-1 pt-2 border-t border-border/30 text-[9px] text-zinc-700">
                <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> In the drink</span>
                <span className="flex items-center gap-1"><span className="text-red-400">✕</span> Not in it (−1 strike)</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════ RESULT ════ */}
        {phase === "result" && cocktail && resultData && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="space-y-3">
            <div className="casino-card overflow-hidden">
              <div className="px-6 pt-8 pb-5 text-center space-y-3"
                style={{
                  background: resultData.gameOver
                    ? "linear-gradient(180deg,rgba(239,68,68,0.07) 0%,transparent 100%)"
                    : resultData.score >= 90
                    ? "linear-gradient(180deg,rgba(212,160,23,0.1) 0%,transparent 100%)"
                    : "linear-gradient(180deg,rgba(80,160,80,0.06) 0%,transparent 100%)"
                }}>
                <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18 }} className="text-6xl">
                  {resultEmoji}
                </motion.div>
                <div className="font-serif text-2xl text-zinc-100">{resultLine}</div>
                {!resultData.gameOver && (
                  <div className="text-sm text-zinc-400">
                    Accuracy: <span className="font-mono font-bold text-primary text-lg">{resultData.score}%</span>
                    {strikes > 0 && <span className="text-red-400 ml-2 text-xs">· {strikes} strike{strikes !== 1 ? "s" : ""}</span>}
                  </div>
                )}
              </div>

              {/* Drink reveal */}
              <div className="mx-4 mb-4 flex items-center gap-4 px-4 py-4 rounded-xl border border-white/8 bg-white/3">
                <CocktailGlass fillPct={0.78} color={cocktail.color} shake={false} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-zinc-600 mb-0.5">The mystery drink was</div>
                  <div className="font-serif text-xl text-zinc-100 mb-2">{cocktail.name}</div>
                  <div className="space-y-1">
                    {cocktail.ingredients.map((i) => {
                      const ing = INGREDIENTS.find((x) => x.id === i.id);
                      const chosen = amounts[i.id];
                      const correct = chosen === i.parts;
                      return (
                        <div key={i.id} className={cn("flex items-center gap-2 text-xs", correct ? "text-emerald-400" : "text-red-400/75")}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ing?.hex ?? "#666" }} />
                          <span className="truncate">{ing?.name}</span>
                          <span className="ml-auto text-zinc-600 shrink-0 tabular-nums">{chosen ?? "?"} / {i.parts}</span>
                          <span className="shrink-0">{correct ? "✓" : "✗"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-4 pb-5 space-y-2">
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 bg-primary/8">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary text-xl font-mono">+{resultData.chips}</span>
                  <span className="text-sm text-zinc-400">chips</span>
                </motion.div>

                {resultData.collectibleId && (() => {
                  const c = getCollectible(resultData.collectibleId!);
                  return c ? (
                    <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-500/8">
                      <span className="text-2xl">{c.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-200">{c.name} discovered!</div>
                        <div className={cn("text-xs", RARITY_COLOR[c.rarity])}>
                          {RARITY_LABEL[c.rarity]} · {c.pawnValue} chips at pawn shop
                        </div>
                      </div>
                    </motion.div>
                  ) : null;
                })()}
              </div>
            </div>

            <Button variant="outline" onClick={startRound} className="w-full border-primary/30 h-10">
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              New Mystery Drink
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
