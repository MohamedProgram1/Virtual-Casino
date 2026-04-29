import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  GlassWater,
  Trash2,
  Sparkles,
  Coins,
  Wine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import {
  RECIPES,
  INGREDIENTS,
  scoreGlass,
  tipFor,
  shouldGrantDrink,
  shopItemForRecipe,
  type BarRecipe,
  type Ingredient,
} from "@/lib/barRecipes";
import { cn } from "@/lib/utils";

const MAX_GLASS_UNITS = 6;

type BartenderMood = "idle" | "happy" | "sad" | "wow";

function pickRecipe(prevId?: string): BarRecipe {
  if (RECIPES.length === 1) return RECIPES[0];
  let pick = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  let safety = 5;
  while (pick.id === prevId && safety-- > 0) {
    pick = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  }
  return pick;
}

/* -------------------------------------------------------------------------- */
/* Bartender — stylized SVG character with depth shading + framer animations  */
/* -------------------------------------------------------------------------- */

function Bartender({ mood }: { mood: BartenderMood }) {
  // Subtle idle bob always plays. Mood overlays on top.
  return (
    <motion.div
      className="relative w-full max-w-[280px] mx-auto"
      animate={{
        y: mood === "wow" ? [-2, -10, -2] : [0, -3, 0],
        rotate: mood === "happy" ? [0, -1.5, 1.5, 0] : 0,
      }}
      transition={{
        y: {
          duration: mood === "wow" ? 0.6 : 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: 0.7,
          repeat: mood === "happy" ? 2 : 0,
          ease: "easeInOut",
        },
      }}
    >
      <svg
        viewBox="0 0 220 260"
        className="w-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <radialGradient id="bm-skin" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#f4cfa7" />
            <stop offset="60%" stopColor="#d29a6e" />
            <stop offset="100%" stopColor="#7a4a2c" />
          </radialGradient>
          <linearGradient id="bm-vest" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f1f24" />
            <stop offset="100%" stopColor="#08080a" />
          </linearGradient>
          <linearGradient id="bm-shirt" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f4ede0" />
            <stop offset="100%" stopColor="#c8bfae" />
          </linearGradient>
          <linearGradient id="bm-hair" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3a2a1e" />
            <stop offset="100%" stopColor="#1a120a" />
          </linearGradient>
          <radialGradient id="bm-cheek" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#e88c8c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e88c8c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bm-towel" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#b9b4a3" />
            <stop offset="100%" stopColor="#7a7460" />
          </linearGradient>
          <radialGradient id="bm-spot" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="#ffd87a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffd87a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Spotlight halo */}
        <ellipse cx="110" cy="90" rx="120" ry="80" fill="url(#bm-spot)" />

        {/* Body (vest) */}
        <path
          d="M40 250 Q40 165 110 155 Q180 165 180 250 Z"
          fill="url(#bm-vest)"
        />
        {/* Shirt collar V */}
        <path
          d="M88 165 L110 200 L132 165 L122 158 L110 178 L98 158 Z"
          fill="url(#bm-shirt)"
        />
        {/* Bowtie */}
        <path
          d="M95 162 L110 170 L125 162 L125 178 L110 170 L95 178 Z"
          fill="#9b1c2c"
        />
        <circle cx="110" cy="170" r="2.5" fill="#5e0c18" />

        {/* Towel slung over shoulder */}
        <path
          d="M150 168 Q170 160 178 175 Q170 200 158 195 Z"
          fill="url(#bm-towel)"
          opacity="0.9"
        />

        {/* Neck */}
        <rect x="100" y="140" width="20" height="22" rx="4" fill="url(#bm-skin)" />

        {/* Head */}
        <ellipse cx="110" cy="105" rx="42" ry="46" fill="url(#bm-skin)" />

        {/* Hair (slick back) */}
        <path
          d="M70 78 Q70 55 110 52 Q150 55 150 80 Q140 70 110 70 Q80 72 70 90 Z"
          fill="url(#bm-hair)"
        />
        {/* Sideburn */}
        <path d="M72 95 Q70 110 78 122 L82 122 Q82 105 84 95 Z" fill="url(#bm-hair)" />

        {/* Ear */}
        <ellipse cx="68" cy="105" rx="5" ry="8" fill="url(#bm-skin)" />

        {/* Eyebrows (mood-driven) */}
        <motion.g
          animate={
            mood === "sad"
              ? { y: 2, rotate: 0 }
              : mood === "happy"
                ? { y: -1 }
                : mood === "wow"
                  ? { y: -3 }
                  : { y: 0 }
          }
          transition={{ duration: 0.3 }}
        >
          <path
            d={
              mood === "sad"
                ? "M88 92 Q95 88 102 92"
                : "M88 90 Q95 86 102 90"
            }
            stroke="#241510"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={
              mood === "sad"
                ? "M118 92 Q125 88 132 92"
                : "M118 90 Q125 86 132 90"
            }
            stroke="#241510"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Eyes (blink) */}
        <motion.g
          animate={{
            scaleY: mood === "wow" ? 1.4 : [1, 1, 1, 0.1, 1],
          }}
          transition={{
            duration: mood === "wow" ? 0.3 : 4,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          style={{ transformOrigin: "110px 102px" }}
        >
          <ellipse cx="95" cy="102" rx="3" ry="4" fill="#1a1208" />
          <ellipse cx="125" cy="102" rx="3" ry="4" fill="#1a1208" />
          <circle cx="96" cy="100.5" r="0.9" fill="#fff" />
          <circle cx="126" cy="100.5" r="0.9" fill="#fff" />
        </motion.g>

        {/* Cheek blush */}
        <ellipse cx="86" cy="118" rx="8" ry="5" fill="url(#bm-cheek)" />
        <ellipse cx="134" cy="118" rx="8" ry="5" fill="url(#bm-cheek)" />

        {/* Mouth (mood-driven) */}
        <AnimatePresence mode="wait">
          {mood === "happy" ? (
            <motion.path
              key="happy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              d="M98 122 Q110 138 122 122 Q110 130 98 122 Z"
              fill="#3a1418"
            />
          ) : mood === "sad" ? (
            <motion.path
              key="sad"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              d="M98 130 Q110 120 122 130"
              stroke="#3a1418"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : mood === "wow" ? (
            <motion.ellipse
              key="wow"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              cx="110"
              cy="128"
              rx="5"
              ry="6"
              fill="#3a1418"
            />
          ) : (
            <motion.path
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              d="M101 124 Q110 128 119 124"
              stroke="#3a1418"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </AnimatePresence>

        {/* Mustache */}
        <path
          d="M90 117 Q100 122 110 119 Q120 122 130 117 Q120 126 110 124 Q100 126 90 117 Z"
          fill="#1a120a"
        />

        {/* Subtle nose */}
        <path
          d="M108 108 Q110 118 112 108"
          stroke="#9c6a48"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Glass — vertical stack of colored liquid layers                            */
/* -------------------------------------------------------------------------- */

function Glass({
  pours,
  shake,
}: {
  pours: { ingredient: Ingredient; units: number }[];
  shake: boolean;
}) {
  const totalUnits = pours.reduce((a, p) => a + p.units, 0);
  // Glass dims (in svg units)
  const W = 110;
  const H = 200;
  // Liquid area: a trapezoid from (15, 60) wide top to (25, 180) base
  // For simplicity, render layered rects narrowing slightly toward bottom.
  const liquidTop = 60;
  const liquidBot = 180;
  const liquidHeight = liquidBot - liquidTop;
  const fillHeight = (totalUnits / MAX_GLASS_UNITS) * liquidHeight;
  const fillTop = liquidBot - fillHeight;

  // Build stacked layers from bottom up in pour order
  let cursor = liquidBot;
  const layers = pours.map((p, i) => {
    const h = (p.units / MAX_GLASS_UNITS) * liquidHeight;
    const y = cursor - h;
    cursor = y;
    return { ...p, y, h, key: `${p.ingredient.id}-${i}` };
  });

  return (
    <motion.div
      animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-44 sm:w-52 drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
      >
        <defs>
          <linearGradient id="glass-body" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="glass-rim" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
          <clipPath id="glass-clip">
            {/* Slightly tapered tumbler shape */}
            <path d="M18 55 L92 55 L86 185 L24 185 Z" />
          </clipPath>
        </defs>

        {/* Liquid layers (clipped to glass shape) */}
        <g clipPath="url(#glass-clip)">
          {/* Subtle level meniscus shadow at top of fill */}
          {totalUnits > 0 && (
            <rect
              x={0}
              y={fillTop - 2}
              width={W}
              height={3}
              fill="#ffffff"
              opacity={0.18}
            />
          )}
          {layers.map((l) => (
            <motion.rect
              key={l.key}
              initial={{ y: l.y - 30, opacity: 0 }}
              animate={{ y: l.y, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              x={0}
              width={W}
              height={l.h}
              fill={l.ingredient.hex}
            />
          ))}
        </g>

        {/* Glass body (outline + highlight) */}
        <path
          d="M18 55 L92 55 L86 185 L24 185 Z"
          fill="url(#glass-body)"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        {/* Rim */}
        <ellipse cx="55" cy="55" rx="37" ry="6" fill="url(#glass-rim)" />
        <ellipse
          cx="55"
          cy="55"
          rx="37"
          ry="6"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
        />
        {/* Side highlight */}
        <path
          d="M28 60 L26 175"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Coaster */}
        <ellipse cx="55" cy="195" rx="42" ry="6" fill="#000" opacity="0.45" />
      </svg>

      {/* Capacity bar */}
      <div className="absolute -right-3 top-12 bottom-12 w-1.5 rounded-full bg-background/40 border border-primary/15 overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-amber-300 transition-[height] duration-300"
          style={{ height: `${(totalUnits / MAX_GLASS_UNITS) * 100}%` }}
        />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bottle shelf                                                                */
/* -------------------------------------------------------------------------- */

function Bottle({
  ing,
  poured,
  onClick,
  disabled,
}: {
  ing: Ingredient;
  poured: number;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92, y: 4 }}
      whileHover={disabled ? {} : { y: -3 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center gap-1.5 group",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      aria-label={`Pour ${ing.name}`}
    >
      <svg viewBox="0 0 60 110" className="w-12 sm:w-14 drop-shadow-lg">
        <defs>
          <linearGradient id={`bot-${ing.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={ing.hex} stopOpacity="0.95" />
            <stop offset="100%" stopColor={ing.hex} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Cap */}
        <rect x="22" y="2" width="16" height="10" rx="2" fill="#1a1612" />
        {/* Neck */}
        <rect x="25" y="12" width="10" height="14" fill="#0f0c08" />
        {/* Body */}
        <path
          d="M14 38 Q14 28 30 28 Q46 28 46 38 L46 102 Q46 108 40 108 L20 108 Q14 108 14 102 Z"
          fill={`url(#bot-${ing.id})`}
          stroke="#000"
          strokeOpacity="0.4"
        />
        {/* Highlight */}
        <path
          d="M19 42 L19 95"
          stroke="#fff"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Label */}
        <rect
          x="17"
          y="55"
          width="26"
          height="32"
          rx="2"
          fill="#f4ede0"
          opacity="0.95"
        />
        <text
          x="30"
          y="74"
          fontFamily="ui-serif, Georgia, serif"
          fontSize="9"
          textAnchor="middle"
          fill="#241510"
          fontWeight="700"
        >
          {ing.name.slice(0, 4)}
        </text>
      </svg>
      <div
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider",
          ing.color,
        )}
      >
        {ing.name}
      </div>
      {poured > 0 && (
        <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center border-2 border-background">
          {poured}
        </div>
      )}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* Order ticket                                                                */
/* -------------------------------------------------------------------------- */

function OrderTicket({ recipe }: { recipe: BarRecipe }) {
  return (
    <motion.div
      key={recipe.id}
      initial={{ opacity: 0, y: -8, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="relative bg-[#f4ede0] text-zinc-900 px-5 py-4 rounded shadow-[0_8px_22px_rgba(0,0,0,0.4)] border-l-4 border-rose-700/70"
      style={{ fontFamily: "ui-serif, Georgia, serif" }}
    >
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-amber-300/50 rounded-sm border border-amber-700/40 -rotate-3" />
      <div className="text-[10px] uppercase tracking-[0.25em] text-rose-700 mb-1">
        Customer order
      </div>
      <div className="text-2xl font-bold leading-tight">{recipe.name}</div>
      <div className="text-xs italic text-zinc-700 mt-1">{recipe.vibe}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(recipe.parts).map(([id, n]) => {
          const ing = INGREDIENTS.find((i) => i.id === id)!;
          return (
            <div
              key={id}
              className="flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wider"
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: ing.hex }}
              />
              {n} × {ing.name}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bar page                                                                    */
/* -------------------------------------------------------------------------- */

export default function Bar() {
  const { serveDrink, bar, balance, inventory, activateItem, activeBoost } =
    useCasinoStore();

  const [recipe, setRecipe] = useState<BarRecipe>(() => pickRecipe());
  const [pours, setPours] = useState<Record<string, number>>({});
  const [pourLog, setPourLog] = useState<string[]>([]); // pour order
  const [mood, setMood] = useState<BartenderMood>("idle");
  const [lastResult, setLastResult] = useState<{
    accuracy: number;
    tip: number;
    granted: boolean;
  } | null>(null);
  const [shake, setShake] = useState(false);
  const moodTimeout = useRef<number | null>(null);

  const totalUnits = useMemo(
    () => Object.values(pours).reduce((a, b) => a + b, 0),
    [pours],
  );

  const setMoodTransient = useCallback((m: BartenderMood, ms = 2200) => {
    setMood(m);
    if (moodTimeout.current) window.clearTimeout(moodTimeout.current);
    moodTimeout.current = window.setTimeout(() => setMood("idle"), ms);
  }, []);

  useEffect(() => {
    return () => {
      if (moodTimeout.current) window.clearTimeout(moodTimeout.current);
    };
  }, []);

  const pour = useCallback(
    (ing: Ingredient) => {
      if (totalUnits >= MAX_GLASS_UNITS) {
        setShake(true);
        setMoodTransient("sad", 1200);
        window.setTimeout(() => setShake(false), 500);
        return;
      }
      setPours((prev) => ({ ...prev, [ing.id]: (prev[ing.id] ?? 0) + 1 }));
      setPourLog((prev) => [...prev, ing.id]);
      setLastResult(null);
      setMood("wow");
      if (moodTimeout.current) window.clearTimeout(moodTimeout.current);
      moodTimeout.current = window.setTimeout(() => setMood("idle"), 350);
    },
    [totalUnits, setMoodTransient],
  );

  const reset = useCallback(() => {
    setPours({});
    setPourLog([]);
    setLastResult(null);
  }, []);

  const serve = useCallback(() => {
    if (totalUnits === 0) return;
    const accuracy = scoreGlass(recipe, pours);
    const tip = tipFor(accuracy);
    const granted = shouldGrantDrink(accuracy);
    const item = granted ? shopItemForRecipe(recipe.id) : undefined;
    serveDrink({
      tipChips: tip,
      grantItemId: item?.id,
      grantItemName: item?.name,
    });
    setLastResult({ accuracy, tip, granted });
    setMoodTransient(accuracy >= 80 ? "happy" : accuracy >= 40 ? "idle" : "sad", 2400);
  }, [recipe, pours, totalUnits, serveDrink, setMoodTransient]);

  const next = useCallback(() => {
    setRecipe((prev) => pickRecipe(prev.id));
    setPours({});
    setPourLog([]);
    setLastResult(null);
    setMood("idle");
  }, []);

  // Build pour list in *order* for the glass, collapsing consecutive same-ingredient
  const orderedPours = useMemo(() => {
    const list: { ingredient: Ingredient; units: number }[] = [];
    for (const id of pourLog) {
      const ing = INGREDIENTS.find((i) => i.id === id)!;
      const last = list[list.length - 1];
      if (last && last.ingredient.id === id) {
        last.units += 1;
      } else {
        list.push({ ingredient: ing, units: 1 });
      }
    }
    return list;
  }, [pourLog]);

  // Inventory of mixed drinks (limit to drinks the user has on tab)
  const tabDrinks = useMemo(() => {
    return RECIPES.map((r) => ({
      recipe: r,
      shop: shopItemForRecipe(r.id),
      qty: inventory[r.id] ?? 0,
    })).filter((d) => d.qty > 0 && d.shop);
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* --- The bar scene --- */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-black/40">
        {/* Ambient back wall + shelves */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 10%, #2a1a18 0%, #14090a 60%, #08050a 100%)",
          }}
        />
        {/* Shelf 1 silhouettes */}
        <div className="absolute top-6 left-0 right-0 h-16 flex items-end justify-center gap-2 px-10 opacity-50">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="w-3 rounded-t-sm"
              style={{
                height: `${30 + ((i * 7) % 24)}px`,
                background: `linear-gradient(to top, rgba(0,0,0,0.6), ${
                  ["#7a3030", "#3a4a6a", "#5a3a18", "#6a4a30", "#3a3a4a"][i % 5]
                })`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
        <div className="absolute top-[88px] left-6 right-6 h-[2px] bg-amber-900/50" />

        {/* Shelf 2 silhouettes */}
        <div className="absolute top-[100px] left-0 right-0 h-12 flex items-end justify-center gap-1.5 px-16 opacity-40">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 rounded-t-sm"
              style={{
                height: `${20 + ((i * 5) % 18)}px`,
                background: `linear-gradient(to top, rgba(0,0,0,0.7), ${
                  ["#5a3030", "#2a4a6a", "#4a3a18", "#5a3a20"][i % 4]
                })`,
              }}
            />
          ))}
        </div>
        <div className="absolute top-[156px] left-10 right-10 h-[2px] bg-amber-900/40" />

        {/* Wood counter */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[42%]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 12%, #4a2a14 30%, #6a3a1a 70%, #2a1408 100%)",
          }}
        />
        {/* Counter top edge highlight */}
        <div
          className="absolute left-0 right-0 h-[3px] shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
          style={{ bottom: "42%", background: "rgba(255, 200, 120, 0.25)" }}
        />

        {/* Soft warm glow up top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-300/10 blur-2xl rounded-full pointer-events-none" />

        {/* Foreground content grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-4 p-5 sm:p-7 min-h-[480px]">
          {/* Left: bartender */}
          <div className="flex flex-col items-center justify-end relative">
            {/* Order ticket sits above the bartender */}
            <div className="absolute top-0 left-0 right-0 flex justify-center">
              <OrderTicket recipe={recipe} />
            </div>
            <div className="mt-24 sm:mt-28 w-full">
              <Bartender mood={mood} />
            </div>
            {/* Bartender's name plate */}
            <div className="mt-2 text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-primary/70">
                On the rail
              </div>
              <div className="font-serif text-lg text-foreground">
                Vincent
              </div>
            </div>
          </div>

          {/* Right: glass + bottles + actions */}
          <div className="flex flex-col items-center justify-end gap-5">
            {/* Result overlay */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-center min-w-[220px]",
                    lastResult.accuracy >= 80
                      ? "border-emerald-400/50 bg-emerald-500/10"
                      : lastResult.accuracy >= 40
                        ? "border-amber-400/50 bg-amber-500/10"
                        : "border-rose-400/50 bg-rose-500/10",
                  )}
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Accuracy
                  </div>
                  <div className="font-mono text-2xl font-bold tabular-nums">
                    {lastResult.accuracy}%
                  </div>
                  <div className="text-xs text-foreground/80">
                    {lastResult.tip > 0
                      ? `Tip +${lastResult.tip} chips`
                      : "No tip this time."}
                    {lastResult.granted && " · Drink earned"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Glass */}
            <Glass pours={orderedPours} shake={shake} />

            {/* Pour log strip */}
            <div className="w-full max-w-md">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 text-center">
                In the glass
              </div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap min-h-[24px]">
                {orderedPours.length === 0 && (
                  <span className="text-xs italic text-muted-foreground">
                    Empty. Tap a bottle to pour.
                  </span>
                )}
                {orderedPours.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/50 border border-primary/15 text-[11px]"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: p.ingredient.hex }}
                    />
                    {p.units} × {p.ingredient.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottles */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full max-w-md">
              {INGREDIENTS.map((ing) => (
                <Bottle
                  key={ing.id}
                  ing={ing}
                  poured={pours[ing.id] ?? 0}
                  onClick={() => pour(ing)}
                  disabled={totalUnits >= MAX_GLASS_UNITS}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={totalUnits === 0}
                className="border-primary/30"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Dump
              </Button>
              {lastResult ? (
                <Button
                  size="lg"
                  onClick={next}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Next order
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={serve}
                  disabled={totalUnits === 0}
                  className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground hover:from-primary px-8 shadow-lg shadow-primary/30"
                >
                  <GlassWater className="w-4 h-4 mr-2" />
                  Serve
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Stats + tab --- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="casino-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-lg">Behind the bar</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Served
              </div>
              <div className="font-mono text-xl tabular-nums">
                {bar.served}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Tips
              </div>
              <div className="font-mono text-xl tabular-nums text-emerald-300">
                +{bar.tipsEarned}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Chips
              </div>
              <div className="font-mono text-xl tabular-nums">
                {balance.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground italic">
            Hit 80%+ accuracy to earn the matching cocktail on your tab.
            Use it before your next casino bet for a bigger payout.
          </div>
        </div>

        <div className="casino-card p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-serif text-lg">Your tab</h2>
            </div>
            {activeBoost && (
              <div className="text-xs text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {activeBoost.name} · {activeBoost.usesLeft} use
                {activeBoost.usesLeft === 1 ? "" : "s"}
              </div>
            )}
          </div>
          {tabDrinks.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              No drinks on your tab yet. Mix one above (or grab one from the
              store) and use it before a bet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tabDrinks.map(({ recipe: r, shop, qty }) => {
                if (!shop) return null;
                const Icon = shop.icon;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-primary/15 bg-background/40"
                  >
                    <div className="w-10 h-10 rounded-lg bg-background/60 border border-primary/30 flex items-center justify-center shrink-0">
                      <Icon className={cn("w-5 h-5", shop.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">
                        {shop.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ×{qty}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        +{Math.round((shop.multiplier - 1) * 100)}% × {shop.uses}{" "}
                        win{shop.uses === 1 ? "" : "s"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-400/40 text-emerald-200 hover:bg-emerald-400/10 shrink-0"
                      onClick={() =>
                        activateItem({
                          id: shop.id,
                          name: shop.name,
                          multiplier: shop.multiplier,
                          uses: shop.uses,
                        })
                      }
                    >
                      Use
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-primary/10">
            <Coins className="w-3.5 h-3.5 text-primary" />
            Want more on tap? Visit the{" "}
            <a
              href={`${import.meta.env.BASE_URL}store`}
              className="text-primary hover:underline"
            >
              store
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
