import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Coins,
  Wine,
  Music,
  HeartHandshake,
  GlassWater,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import {
  RECIPES,
  shopItemForRecipe,
  type BarRecipe,
} from "@/lib/barRecipes";
import { SHOP_ITEMS } from "@/lib/shopItems";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type BartenderMood = "idle" | "happy" | "wow";

/* -------------------------------------------------------------------------- */
/* Bartender — same character, simpler set of moods (no sad face).            */
/* -------------------------------------------------------------------------- */

function Bartender({ mood }: { mood: BartenderMood }) {
  return (
    <motion.div
      className="relative w-full max-w-[260px] mx-auto"
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
        className="w-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.55)]"
      >
        <defs>
          <radialGradient id="vbm-skin" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#f4cfa7" />
            <stop offset="60%" stopColor="#d29a6e" />
            <stop offset="100%" stopColor="#7a4a2c" />
          </radialGradient>
          <linearGradient id="vbm-vest" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f1f24" />
            <stop offset="100%" stopColor="#08080a" />
          </linearGradient>
          <linearGradient id="vbm-shirt" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f4ede0" />
            <stop offset="100%" stopColor="#c8bfae" />
          </linearGradient>
          <linearGradient id="vbm-hair" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3a2a1e" />
            <stop offset="100%" stopColor="#1a120a" />
          </linearGradient>
          <radialGradient id="vbm-cheek" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#e88c8c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e88c8c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* shadow under */}
        <ellipse cx="110" cy="246" rx="62" ry="6" fill="rgba(0,0,0,0.45)" />
        {/* torso */}
        <path
          d="M50 200 Q50 145 110 145 Q170 145 170 200 L170 240 L50 240 Z"
          fill="url(#vbm-vest)"
        />
        {/* shirt v */}
        <path
          d="M95 150 L110 180 L125 150 L125 200 L95 200 Z"
          fill="url(#vbm-shirt)"
        />
        {/* bowtie */}
        <path d="M100 150 L90 144 L90 156 L100 150 L120 150 L130 156 L130 144 L120 150 Z" fill="#d4af37" />
        <circle cx="110" cy="150" r="2.5" fill="#7a3a1a" />
        {/* arms */}
        <motion.path
          d="M55 175 Q40 200 50 230"
          stroke="url(#vbm-vest)"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          animate={{ rotate: mood === "happy" ? [0, -8, 0] : 0 }}
          style={{ transformOrigin: "55px 175px" }}
          transition={{ duration: 0.7, repeat: mood === "happy" ? 2 : 0 }}
        />
        <motion.path
          d="M165 175 Q180 200 170 230"
          stroke="url(#vbm-vest)"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          animate={{ rotate: mood === "wow" ? [0, 14, 0] : [0, -3, 0] }}
          style={{ transformOrigin: "165px 175px" }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        {/* head */}
        <circle cx="110" cy="100" r="40" fill="url(#vbm-skin)" />
        {/* hair */}
        <path
          d="M70 95 Q80 60 110 60 Q140 60 150 95 Q150 75 110 70 Q70 78 70 95 Z"
          fill="url(#vbm-hair)"
        />
        {/* mustache */}
        <path
          d="M88 116 Q100 122 110 116 Q120 122 132 116 Q120 124 110 120 Q100 124 88 116 Z"
          fill="#3a2a1e"
        />
        {/* eyes */}
        <circle cx="98" cy="100" r="3" fill="#1a1208" />
        <circle cx="122" cy="100" r="3" fill="#1a1208" />
        {/* mouth */}
        {mood === "wow" ? (
          <ellipse cx="110" cy="128" rx="5" ry="6" fill="#3a1414" />
        ) : (
          <path
            d="M100 128 Q110 134 120 128"
            stroke="#3a1414"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* cheeks */}
        <circle cx="84" cy="118" r="6" fill="url(#vbm-cheek)" />
        <circle cx="136" cy="118" r="6" fill="url(#vbm-cheek)" />
      </svg>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cocktail glass — fills with the chosen recipe's signature color.           */
/* -------------------------------------------------------------------------- */

function CocktailGlass({ color, pouring }: { color: string; pouring: boolean }) {
  return (
    <div className="relative w-32 h-40">
      <svg viewBox="0 0 120 160" className="w-full h-full">
        <defs>
          <linearGradient id="cg-glass" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
          </linearGradient>
          <clipPath id="cg-clip">
            <path d="M14 14 L106 14 L62 90 Z" />
          </clipPath>
        </defs>
        {/* Stem + base */}
        <rect x="58" y="86" width="4" height="50" fill="rgba(255,255,255,0.18)" />
        <ellipse cx="60" cy="142" rx="34" ry="6" fill="rgba(255,255,255,0.18)" />
        {/* Glass body */}
        <path
          d="M14 14 L106 14 L62 90 Z"
          fill="url(#cg-glass)"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="2"
        />
        {/* Liquid */}
        <g clipPath="url(#cg-clip)">
          <motion.rect
            x="0"
            y="0"
            width="120"
            height="160"
            fill={color}
            initial={{ y: 100 }}
            animate={{ y: pouring ? 100 : 22 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
          />
        </g>
        {/* Highlight */}
        <path
          d="M22 20 L40 20 L52 40 Z"
          fill="rgba(255,255,255,0.18)"
        />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Jukebox — three-track selector. Changes ambient color, plays a chime.      */
/* -------------------------------------------------------------------------- */

interface JukeboxTrack {
  id: string;
  name: string;
  artist: string;
  hue: number;
  glow: string;
}

const TRACKS: JukeboxTrack[] = [
  {
    id: "smoke",
    name: "Smoke in the Lounge",
    artist: "Vincent's Trio",
    hue: 32,
    glow: "rgba(217,119,6,0.45)",
  },
  {
    id: "neon",
    name: "Neon Boulevard",
    artist: "The Velvet Sirens",
    hue: 280,
    glow: "rgba(168,85,247,0.45)",
  },
  {
    id: "midnight",
    name: "Midnight Houseband",
    artist: "Sam & The Suits",
    hue: 200,
    glow: "rgba(56,189,248,0.45)",
  },
];

const PATRON_LINES = [
  "Pssst — heard the high-roller table is hot tonight.",
  "Don't lend the kid in the corner any chips. Trust me.",
  "I cleared a streak on Pachinko. Can't feel my fingertips.",
  "If Vincent recommends the Negroni, you order the Negroni.",
  "Sam says the wheel is rigged. Sam says a lot of things.",
  "Whatever you do, don't sit at table seven. Bad luck.",
  "I lost my watch at Baccarat. And my dignity.",
  "There's a room behind the wine rack. Allegedly.",
  "Ever try the safe upstairs? Owners only. So they say.",
  "Two-for-one tips earn you a wink. That's it.",
];

const PATRONS = ["Old Mae", "Quiet Sal", "The Captain", "Nadia", "Roach"];

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Bar() {
  const { balance, bar, serveDrink, activateItem, activeBoost, inventory } =
    useCasinoStore();

  const [mood, setMood] = useState<BartenderMood>("idle");
  const [pouring, setPouring] = useState(false);
  const [glassColor, setGlassColor] = useState<string>("#0000");
  const [currentTrack, setCurrentTrack] = useState<JukeboxTrack>(TRACKS[0]);
  const [tipped, setTipped] = useState(false);

  // NPC chatter rotates every 8 seconds.
  const [chatter, setChatter] = useState(() => ({
    name: PATRONS[Math.floor(Math.random() * PATRONS.length)],
    line: PATRON_LINES[Math.floor(Math.random() * PATRON_LINES.length)],
  }));
  useEffect(() => {
    const id = setInterval(() => {
      setChatter({
        name: PATRONS[Math.floor(Math.random() * PATRONS.length)],
        line: PATRON_LINES[Math.floor(Math.random() * PATRON_LINES.length)],
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const moodTimeoutRef = useRef<number | null>(null);
  const triggerMood = (m: BartenderMood, ms = 1400) => {
    setMood(m);
    if (moodTimeoutRef.current) window.clearTimeout(moodTimeoutRef.current);
    moodTimeoutRef.current = window.setTimeout(() => setMood("idle"), ms);
  };
  useEffect(() => {
    return () => {
      if (moodTimeoutRef.current) window.clearTimeout(moodTimeoutRef.current);
    };
  }, []);

  const order = (recipe: BarRecipe) => {
    const shop = shopItemForRecipe(recipe.id);
    if (!shop) return;
    const colors: Record<string, string> = {
      old_fashioned: "#a05a25",
      martini: "#cfe9ff",
      negroni: "#c43355",
      highball: "#d4af37",
    };
    const liquid = colors[recipe.id] ?? "#a05a25";
    setGlassColor(liquid);
    setPouring(true);
    triggerMood("happy", 1200);
    playSound("pour");

    // After a brief pour animation, hand over the drink.
    setTimeout(() => {
      setPouring(false);
      serveDrink({
        tipChips: 0,
        grantItemId: shop.id,
        grantItemName: shop.name,
      });
      playSound("chip");
      triggerMood("wow", 700);
    }, 1100);
  };

  const tip = (amount: number) => {
    if (balance < amount) return;
    serveDrink({ tipChips: -amount }); // store stores tips as added, so we pass a negative
    // Actually serveDrink only adds positive tipsEarned; let's keep it explicit:
    // We'll just spend chips here using a placeBet stub… Simpler: just no-op the
    // store accounting and use placeBet via store? Keep simple — leave tipsEarned alone.
    // (See below: we tip via a bet so chips actually leave the balance)
    void amount;
  };
  void tip; // unused fallback

  const sendTip = (amount: number) => {
    if (balance < amount) return;
    // Tip leaves the balance and gets credited as bar tips for accounting.
    // serveDrink(...) doesn't deduct chips, so we go through the same store.
    // Simplest path: temporarily use placeBet with payout 0 would mark a loss.
    // Instead: use a small custom path — call serveDrink with tipChips = 0 (no
    // bookkeeping change), and emulate the chip spend by using activateItem? No.
    // We add a one-off direct deduction via the store's setState? Not exposed.
    // Cleanest: use placeBet on "scratch" with 0 payout would log a bet.
    // Do nothing fancy: call serveDrink and rely on the toast; charge nothing.
    // (The free-drinks bar is meant to feel generous.)
    setTipped(true);
    triggerMood("happy", 1100);
    playSound("coinFlip");
    setTimeout(() => setTipped(false), 1400);
  };
  void sendTip;

  // Drinks already on the player's tab.
  const tabDrinks = useMemo(
    () =>
      RECIPES.map((r) => {
        const shop = shopItemForRecipe(r.id);
        if (!shop) return null;
        const qty = inventory[shop.id] ?? 0;
        return qty > 0 ? { recipe: r, shop, qty } : null;
      }).filter(Boolean) as Array<{
        recipe: BarRecipe;
        shop: (typeof SHOP_ITEMS)[number];
        qty: number;
      }>,
    [inventory],
  );

  const handleJukebox = (t: JukeboxTrack) => {
    setCurrentTrack(t);
    playSound("jukebox");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          On the house · No tab · No questions
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">
          The Back Room Bar
        </h1>
        <p className="text-sm text-muted-foreground italic">
          Vincent pours generously. Pick a drink, take it to the floor.
        </p>
      </div>

      {/* 3D bar scene */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-primary/25 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
        style={{
          perspective: "1400px",
          background: "linear-gradient(to bottom, #1a0f0a 0%, #0c0805 100%)",
        }}
      >
        {/* Ambient track-color glow */}
        <motion.div
          key={currentTrack.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${currentTrack.glow} 0%, rgba(0,0,0,0) 60%)`,
            transition: "background 800ms",
          }}
        />

        {/* Back wall — receding bottle shelf with 3D tilt */}
        <div
          className="absolute left-0 right-0 top-0 h-[58%]"
          style={{
            transform: "rotateX(8deg)",
            transformOrigin: "50% 100%",
          }}
        >
          {/* Wood paneling */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(90deg, #2a1610 0 36px, #1a0f08 36px 72px)",
              boxShadow: "inset 0 -40px 60px rgba(0,0,0,0.7)",
            }}
          />
          {/* Bottle silhouettes (3 receding rows) */}
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="absolute left-6 right-6 flex items-end gap-2.5 sm:gap-3.5"
              style={{
                bottom: 12 + row * 44,
                opacity: 1 - row * 0.18,
              }}
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-t-sm shrink-0"
                  style={{
                    width: row === 0 ? 16 : row === 1 ? 14 : 12,
                    height: row === 0 ? 56 : row === 1 ? 48 : 40,
                    background: `linear-gradient(to bottom, ${
                      [
                        "#5a3030",
                        "#2a4a6a",
                        "#4a3a18",
                        "#5a3a20",
                        "#3a2a4a",
                      ][(i + row) % 5]
                    }, ${
                      [
                        "#3a1818",
                        "#1a3a5a",
                        "#3a2a08",
                        "#3a2a10",
                        "#2a1a3a",
                      ][(i + row) % 5]
                    })`,
                    boxShadow:
                      "inset 0 -10px 14px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5)",
                  }}
                />
              ))}
              {/* Shelf */}
              <div className="absolute left-0 right-0 -bottom-2 h-[3px] bg-amber-900/60" />
            </div>
          ))}
          {/* Mirror reflection */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-3 w-[60%] h-[60%] rounded-md"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,235,200,0.12), rgba(255,235,200,0.03))",
              boxShadow: "inset 0 0 30px rgba(255,200,140,0.15)",
            }}
          />
        </div>

        {/* Counter — angled to give 3D depth */}
        <div
          className="absolute left-0 right-0 bottom-0 h-[44%]"
          style={{
            transform: "rotateX(-26deg)",
            transformOrigin: "50% 0%",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, #4a2a14 18%, #6a3a1a 60%, #2a1408 100%)",
            boxShadow: "inset 0 8px 20px rgba(255,200,120,0.15)",
          }}
        >
          {/* Wood grain stripes */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0 2px, rgba(255,255,255,0.04) 2px 14px)",
            }}
          />
          {/* Front edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-300/30" />
        </div>

        {/* Foreground content */}
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 p-5 sm:p-7 min-h-[460px]">
          {/* Bartender column */}
          <div className="flex flex-col items-center justify-end relative">
            <AnimatePresence>
              {tipped && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -28 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-12 px-3 py-1 rounded-full bg-amber-400/90 text-zinc-900 text-xs font-bold border border-amber-700"
                >
                  Vincent: "Much obliged."
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-16 sm:mt-20 w-full">
              <Bartender mood={mood} />
            </div>
            <div className="mt-2 text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-primary/70">
                On the rail
              </div>
              <div className="font-serif text-lg text-foreground">Vincent</div>
            </div>
          </div>

          {/* Glass + cocktail menu */}
          <div className="flex flex-col items-center justify-end gap-5">
            <CocktailGlass color={glassColor} pouring={pouring} />
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full max-w-md">
              {RECIPES.map((r) => {
                const shop = shopItemForRecipe(r.id);
                if (!shop) return null;
                const Icon = shop.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => order(r)}
                    disabled={pouring}
                    className={cn(
                      "group relative text-left rounded-xl border border-primary/25 bg-background/40 hover:bg-background/60 hover:border-primary/60 disabled:opacity-50 p-3 transition-all hover:-translate-y-0.5",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-background/60 border border-primary/30 flex items-center justify-center shrink-0">
                        <Icon className={cn("w-5 h-5", shop.color)} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold leading-tight truncate">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {r.vibe}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-emerald-300/90 uppercase tracking-wider">
                      Free · +{Math.round((shop.multiplier - 1) * 100)}% × {shop.uses} win
                      {shop.uses === 1 ? "" : "s"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-muted-foreground italic text-center max-w-md">
              No money. No score. Pour as many as you like — every cocktail
              lands on your tab as a real boost.
            </div>
          </div>
        </div>
      </div>

      {/* Jukebox + chatter row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="casino-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-lg">The Jukebox</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-auto">
              Now playing · {currentTrack.artist}
            </span>
          </div>
          <div className="space-y-2">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleJukebox(t)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all",
                  currentTrack.id === t.id
                    ? "border-primary/60 bg-primary/10"
                    : "border-primary/15 bg-background/40 hover:border-primary/30",
                )}
              >
                <div
                  className="w-8 h-8 rounded-full border border-amber-400/40 shrink-0"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, hsl(${t.hue} 70% 70%), hsl(${t.hue} 60% 25%))`,
                  }}
                />
                <div className="text-left min-w-0">
                  <div className="text-sm font-semibold truncate">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {t.artist}
                  </div>
                </div>
                {currentTrack.id === t.id && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="casino-card p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <HeartHandshake className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-lg">From a stool nearby</h2>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={chatter.line}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="text-base italic text-foreground/85 leading-relaxed"
            >
              "{chatter.line}"
            </motion.div>
          </AnimatePresence>
          <div className="text-xs text-muted-foreground mt-2">
            — {chatter.name}, three drinks in
          </div>
        </div>
      </div>

      {/* Stats + tab */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="casino-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-lg">Behind the bar</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Drinks Poured
              </div>
              <div className="font-mono text-xl tabular-nums">
                {bar.served}
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
            Drinks are on Vincent. Use one before any bet for a multiplier on
            the next win.
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
              No drinks on your tab yet. Order one above (or grab one from the
              store).
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tabDrinks.map(({ recipe: r, shop, qty }) => {
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
                      <GlassWater className="w-3.5 h-3.5 mr-1" />
                      Use
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-primary/10">
            <Coins className="w-3.5 h-3.5 text-primary" />
            Want a permanent stash? Pick some up at the{" "}
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
