import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { startMusic, stopMusic, getMusicTrackIds, playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const MUSIC_LABELS: Record<string, string> = {
  smoke: "🎷 Smoke & Linen",
  neon: "⚡ Neon Boulevard",
  midnight: "🌙 Midnight Swing",
  lounge: "🌺 Bossa Lounge",
  casino: "🎰 Lucky Vegas",
};

const COOLDOWN_MS = 60_000;

const HOUSE_DRINKS = [
  {
    id: "house_whiskey",
    name: "House Whiskey",
    tagline: "Smooth and uncomplicated.",
    emoji: "🥃",
    fill: "#b07a2b",
    minChips: 60,
    maxChips: 100,
    quip: [
      "A classic never goes out of style.",
      "Vincent pours with care.",
      "Amber gold. You earned it.",
    ],
  },
  {
    id: "gin_fizz",
    name: "Vincent's Gin Fizz",
    tagline: "Crisp, bright, and effervescent.",
    emoji: "🍹",
    fill: "#7ec8e3",
    minChips: 50,
    maxChips: 85,
    quip: [
      "He mixed it himself.",
      "Light as the evening air.",
      "Vincent's personal recipe.",
    ],
  },
  {
    id: "bitter_orange",
    name: "Bitter Orange Sour",
    tagline: "Complex, aromatic, alive.",
    emoji: "🍊",
    fill: "#e8741a",
    minChips: 70,
    maxChips: 115,
    quip: [
      "A citrus note for the bold.",
      "Vincent raises an eyebrow — impressed.",
      "The orange was fresh today.",
    ],
  },
  {
    id: "nightcap",
    name: "The Night Cap",
    tagline: "Dark, sweet, and mysterious.",
    emoji: "🌙",
    fill: "#5a2d82",
    minChips: 90,
    maxChips: 145,
    quip: [
      "This one's on the house.",
      "Vincent only serves this late.",
      "Last call for the lucky ones.",
    ],
  },
] as const;

type DrinkId = (typeof HOUSE_DRINKS)[number]["id"];
type Mood = "idle" | "happy" | "wow" | "pour";

function Vincent({ mood }: { mood: Mood }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const schedule = () => {
      const delay = 2500 + Math.random() * 4000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        schedule();
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  const eyesClosed = blink || mood === "happy";
  const mouthUp = mood === "happy" || mood === "wow";
  const mouthO = mood === "wow";

  return (
    <motion.svg
      viewBox="0 0 120 220"
      className="w-28 h-auto drop-shadow-[0_4px_16px_rgba(180,140,60,0.25)]"
      animate={mood === "idle" ? { y: [0, -4, 0] } : mood === "pour" ? { rotate: [-2, 2, -2] } : { y: 0 }}
      transition={
        mood === "idle"
          ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
          : mood === "pour"
          ? { repeat: 2, duration: 0.3, ease: "easeInOut" }
          : {}
      }
    >
      {/* Body - dark jacket */}
      <rect x="28" y="100" width="64" height="90" rx="12" fill="#1e1e3a" />
      {/* White shirt triangle */}
      <polygon points="60,100 46,100 50,160 60,148 70,160 74,100" fill="#f0ede8" />
      {/* Bow tie */}
      <polygon points="52,104 68,104 64,110 68,116 52,116 56,110" fill="#8b1a1a" />
      <circle cx="60" cy="110" r="3" fill="#6b1212" />

      {/* Neck */}
      <rect x="52" y="84" width="16" height="20" rx="6" fill="#c8956a" />

      {/* Head */}
      <circle cx="60" cy="65" r="34" fill="#d4a574" />

      {/* Hair */}
      <path d="M 26 52 Q 32 22 60 26 Q 88 22 94 52 Q 86 34 60 37 Q 34 34 26 52Z" fill="#1a0a00" />
      {/* Hair parting detail */}
      <path d="M 60 26 Q 62 38 61 50" stroke="#2a1000" strokeWidth="1.5" fill="none" />

      {/* Eyebrows */}
      <motion.rect
        x="40" y="46" width="16" height="3.5" rx="1.75" fill="#1a0a00"
        animate={{ rotate: mood === "wow" ? -8 : 0 }}
        style={{ transformOrigin: "48px 48px" }}
      />
      <motion.rect
        x="64" y="46" width="16" height="3.5" rx="1.75" fill="#1a0a00"
        animate={{ rotate: mood === "wow" ? 8 : 0 }}
        style={{ transformOrigin: "72px 48px" }}
      />

      {/* Eyes */}
      {eyesClosed ? (
        <>
          <path d="M 40 57 Q 48 62 56 57" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 64 57 Q 72 62 80 57" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="48" cy="58" rx={mood === "wow" ? 7 : 5.5} ry={mood === "wow" ? 8 : 6} fill="white" />
          <circle cx="49" cy="59" r="3" fill="#1a0a00" />
          <circle cx="50" cy="57" r="1" fill="white" />
          <ellipse cx="72" cy="58" rx={mood === "wow" ? 7 : 5.5} ry={mood === "wow" ? 8 : 6} fill="white" />
          <circle cx="73" cy="59" r="3" fill="#1a0a00" />
          <circle cx="74" cy="57" r="1" fill="white" />
        </>
      )}

      {/* Nose */}
      <path d="M 58 66 Q 55 72 60 74 Q 65 72 62 66" stroke="#b07040" strokeWidth="1.5" fill="none" />

      {/* Mustache */}
      <path
        d="M 48 78 Q 54 74 60 78 Q 66 74 72 78 Q 66 82 60 79 Q 54 82 48 78Z"
        fill="#1a0a00"
      />

      {/* Mouth */}
      {mouthO ? (
        <ellipse cx="60" cy="85" rx="6" ry="5.5" fill="#7a3020" />
      ) : mouthUp ? (
        <path d="M 50 84 Q 60 93 70 84" stroke="#7a3020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M 52 85 Q 60 88 68 85" stroke="#7a3020" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* Right arm (from Vincent's right) */}
      <motion.g
        animate={mood === "pour" ? { rotate: -35 } : { rotate: 0 }}
        style={{ transformOrigin: "90px 108px" }}
      >
        <rect x="88" y="100" width="26" height="13" rx="6.5" fill="#1e1e3a" />
        <circle cx="116" cy="106" r="8" fill="#c8956a" />
      </motion.g>

      {/* Left arm */}
      <rect x="6" y="100" width="26" height="13" rx="6.5" fill="#1e1e3a" />
      <circle cx="4" cy="106" r="8" fill="#c8956a" />
    </motion.svg>
  );
}

function GlassVisual({ fill, fillFraction }: { fill: string; fillFraction: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Stem glass shape */}
      <div className="relative" style={{ width: 56, height: 100 }}>
        <svg viewBox="0 0 56 100" className="absolute inset-0 w-full h-full">
          {/* Glass outline */}
          <path
            d="M 4 8 L 16 72 L 20 80 L 20 90 L 36 90 L 36 80 L 40 72 L 52 8 Z"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
          {/* Liquid fill (clipped to trapezoid) */}
          <clipPath id="glass-clip">
            <path d="M 4 8 L 16 72 L 20 80 L 20 90 L 36 90 L 36 80 L 40 72 L 52 8 Z" />
          </clipPath>
          <motion.rect
            x="0"
            y="0"
            width="56"
            height="90"
            fill={fill}
            fillOpacity="0.8"
            clipPath="url(#glass-clip)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: fillFraction }}
            style={{ transformOrigin: "bottom" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          {/* Highlight */}
          <path
            d="M 7 15 L 12 60"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="text-xs text-muted-foreground">
        {fillFraction > 0 ? "Cheers 🥂" : "Empty"}
      </div>
    </div>
  );
}

export default function Lounge() {
  const { serveDrink } = useCasinoStore();
  const [mood, setMood] = useState<Mood>("idle");
  const [currentDrink, setCurrentDrink] = useState<(typeof HOUSE_DRINKS)[number] | null>(null);
  const [fillFraction, setFillFraction] = useState(0);
  const [quip, setQuip] = useState("Evening. What'll it be?");
  const [lastOrdered, setLastOrdered] = useState<Record<DrinkId, number>>({} as Record<DrinkId, number>);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick every second so cooldown timers are reactive.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const orderDrink = useCallback(
    (drink: (typeof HOUSE_DRINKS)[number]) => {
      const last = lastOrdered[drink.id as DrinkId] ?? 0;
      if (Date.now() - last < COOLDOWN_MS) return;

      const chips =
        drink.minChips + Math.floor(Math.random() * (drink.maxChips - drink.minChips + 1));
      const q = drink.quip[Math.floor(Math.random() * drink.quip.length)];

      setCurrentDrink(drink);
      setMood("pour");
      setFillFraction(0);
      setQuip(q);
      setLastOrdered((prev) => ({ ...prev, [drink.id as DrinkId]: Date.now() }));

      // Play pour sound then credit chips
      playSound("chip");
      setTimeout(() => {
        setFillFraction(1);
        setMood("wow");
        serveDrink({ tipChips: chips });
        setTimeout(() => setMood("happy"), 800);
        setTimeout(() => setMood("idle"), 2800);
      }, 400);
    },
    [lastOrdered, serveDrink],
  );

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">The Lucky Vault</div>
        <h1 className="font-serif text-4xl casino-gradient-text">The Bar</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Pull up a stool. Vincent will sort you out. Drinks are on the house.
        </p>
      </div>

      {/* Vincent + Glass scene */}
      <div className="casino-card p-6 relative overflow-hidden">
        {/* Bar counter */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-amber-900/30 to-amber-950/50 border-t border-amber-700/30" />
        {/* Shelf silhouette */}
        <div className="absolute top-4 left-4 right-4 h-8 flex items-end gap-3 opacity-20">
          {["h-8", "h-6", "h-10", "h-7", "h-5", "h-9"].map((h, i) => (
            <div key={i} className={cn("w-3 bg-amber-200 rounded-sm", h)} />
          ))}
        </div>

        <div className="relative flex items-end justify-center gap-10">
          {/* Speech bubble */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-full max-w-xs pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={quip}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-center text-sm italic text-primary/80 font-serif"
              >
                "{quip}"
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-10">
            <Vincent mood={mood} />
          </div>

          <div className="mb-4">
            <GlassVisual
              fill={currentDrink?.fill ?? "#888"}
              fillFraction={fillFraction}
            />
          </div>
        </div>
      </div>

      {/* Drink menu */}
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground px-1">
          House Menu · Free · Refreshes every minute
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOUSE_DRINKS.map((drink) => {
            const lastMs = lastOrdered[drink.id as DrinkId] ?? 0;
            const elapsed = now - lastMs;
            const onCooldown = elapsed < COOLDOWN_MS;
            const secsLeft = onCooldown ? Math.ceil((COOLDOWN_MS - elapsed) / 1000) : 0;

            return (
              <motion.button
                key={drink.id}
                whileHover={onCooldown ? {} : { y: -2, scale: 1.01 }}
                whileTap={onCooldown ? {} : { scale: 0.98 }}
                onClick={() => orderDrink(drink)}
                disabled={onCooldown}
                className={cn(
                  "casino-card p-4 text-left transition-all relative overflow-hidden group",
                  onCooldown ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/40",
                )}
              >
                {/* Color accent */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at bottom right, ${drink.fill}80, transparent)` }}
                />
                <div className="relative flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border"
                    style={{ borderColor: drink.fill + "50", backgroundColor: drink.fill + "20" }}
                  >
                    {drink.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-base leading-tight">{drink.name}</div>
                    <div className="text-xs italic text-muted-foreground mt-0.5">{drink.tagline}</div>
                    <div className="text-xs text-primary/70 mt-1.5 font-semibold">
                      {drink.minChips}–{drink.maxChips} chips
                    </div>
                  </div>
                  {onCooldown && (
                    <div className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">
                      {secsLeft}s
                    </div>
                  )}
                  {!onCooldown && (
                    <div className="text-xs text-primary/60 group-hover:text-primary transition-colors shrink-0">
                      Order →
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Jukebox */}
      <div className="casino-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Jukebox</span>
          {playingTrack && (
            <span className="text-xs text-primary italic ml-1">
              ♪ {MUSIC_LABELS[playingTrack]}
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
    </div>
  );
}
