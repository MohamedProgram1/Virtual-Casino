import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { startMusic, stopMusic, getMusicTrackIds, playSound } from "@/lib/sounds";
import { rollLoungeDrop, getCollectible, RARITY_COLOR, RARITY_LABEL } from "@/lib/collectibles";
import { cn } from "@/lib/utils";

const MUSIC_LABELS: Record<string, string> = {
  smoke: "🎷 Smoke & Linen",
  neon: "⚡ Neon Boulevard",
  midnight: "🌙 Midnight Swing",
  lounge: "🌺 Bossa Lounge",
  casino: "🎰 Lucky Vegas",
};

const HOUSE_DRINKS = [
  { id: "house_whiskey",  name: "House Whiskey",          tagline: "Smooth and uncomplicated.",        emoji: "🥃", fill: "#b07a2b", cost: 50,  quip: ["A classic. Good choice.", "Vincent pours without hesitation.", "Amber gold."] },
  { id: "gin_fizz",       name: "Vincent's Gin Fizz",     tagline: "Crisp, bright, effervescent.",      emoji: "🍹", fill: "#7ec8e3", cost: 65,  quip: ["He mixed it himself.", "Light as the evening air.", "His personal favourite."] },
  { id: "bitter_orange",  name: "Bitter Orange Sour",     tagline: "Complex, aromatic, alive.",         emoji: "🍊", fill: "#e8741a", cost: 80,  quip: ["The orange was fresh today.", "Vincent raises an eyebrow — impressed.", "Bold choice."] },
  { id: "nightcap",       name: "The Night Cap",          tagline: "Dark, sweet, and mysterious.",      emoji: "🌙", fill: "#5a2d82", cost: 100, quip: ["Vincent only serves this late.", "Last call for the lucky ones.", "This one changes things."] },
] as const;

type DrinkId = (typeof HOUSE_DRINKS)[number]["id"];
type Mood = "idle" | "happy" | "wow" | "pour" | "sad";

// ── Vincent SVG ────────────────────────────────────────────────────────────

function Vincent({ mood }: { mood: Mood }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const schedule = (): ReturnType<typeof setTimeout> => {
      const delay = 2500 + Math.random() * 4000;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        schedule();
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  const eyesClosed = blink || mood === "happy";
  const mouthO     = mood === "wow";
  const mouthUp    = mood === "happy" || mood === "wow";
  const mouthDown  = mood === "sad";

  return (
    <motion.svg
      viewBox="0 0 130 240"
      className="w-32 h-auto drop-shadow-[0_8px_24px_rgba(180,140,60,0.3)]"
      animate={
        mood === "idle" ? { y: [0, -5, 0] } :
        mood === "pour" ? { rotate: [0, -4, 2, -3, 0] } :
        mood === "happy" ? { y: [0, -8, 0, -4, 0] } :
        { y: 0 }
      }
      transition={
        mood === "idle"  ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } :
        mood === "pour"  ? { repeat: 1, duration: 0.5 } :
        mood === "happy" ? { duration: 0.6 } :
        {}
      }
    >
      {/* Body — dark jacket */}
      <rect x="28" y="108" width="74" height="100" rx="14" fill="#1a1a32" />
      {/* White shirt */}
      <polygon points="65,108 50,108 55,175 65,162 75,175 80,108" fill="#f0ede8" />
      {/* Bow tie */}
      <polygon points="55,111 75,111 71,118 75,125 55,125 59,118" fill="#7a1010" />
      <circle cx="65" cy="118" r="3.5" fill="#5a0808" />
      {/* Lapels */}
      <path d="M50,108 L42,135 L65,145" fill="#232340" />
      <path d="M80,108 L88,135 L65,145" fill="#232340" />
      {/* Pocket square */}
      <rect x="76" y="118" width="10" height="8" rx="2" fill="#c8a020" opacity="0.7" />

      {/* Neck */}
      <rect x="55" y="92" width="20" height="22" rx="7" fill="#c8956a" />

      {/* Head */}
      <circle cx="65" cy="72" r="36" fill="#d4a574" />

      {/* Hair */}
      <path d="M29 55 Q34 22 65 26 Q96 22 101 55 Q93 36 65 40 Q37 36 29 55Z" fill="#1a0a00" />
      <path d="M65 26 Q67 40 66 54" stroke="#2a1200" strokeWidth="1.5" fill="none" opacity="0.6" />

      {/* Eyebrows */}
      <motion.g animate={mood === "wow" ? { y: -3 } : mood === "sad" ? { rotate: 8 } : { y: 0 }}>
        <rect x="42" y="50" width="18" height="3.5" rx="1.75" fill="#1a0a00" />
      </motion.g>
      <motion.g animate={mood === "wow" ? { y: -3 } : mood === "sad" ? { rotate: -8 } : { y: 0 }}>
        <rect x="70" y="50" width="18" height="3.5" rx="1.75" fill="#1a0a00" />
      </motion.g>

      {/* Eyes */}
      {eyesClosed ? (
        <>
          <path d="M 42 63 Q 51 68 60 63" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 70 63 Q 79 68 88 63" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="51" cy="63" rx={mood === "wow" ? 8 : 6} ry={mood === "wow" ? 9 : 7} fill="white" />
          <circle  cx="52" cy="64" r={3.5} fill="#1a0a00" />
          <circle  cx="53" cy="62" r={1.2} fill="white" />
          <ellipse cx="79" cy="63" rx={mood === "wow" ? 8 : 6} ry={mood === "wow" ? 9 : 7} fill="white" />
          <circle  cx="80" cy="64" r={3.5} fill="#1a0a00" />
          <circle  cx="81" cy="62" r={1.2} fill="white" />
        </>
      )}

      {/* Nose */}
      <path d="M 63 70 Q 59 78 65 81 Q 71 78 67 70" stroke="#b07040" strokeWidth="1.5" fill="none" />

      {/* Mustache */}
      <path d="M 51 85 Q 58 80 65 85 Q 72 80 79 85 Q 72 91 65 87 Q 58 91 51 85Z" fill="#1a0a00" />

      {/* Mouth */}
      {mouthO ? (
        <ellipse cx="65" cy="94" rx="7" ry="6.5" fill="#7a2820" />
      ) : mouthUp ? (
        <path d="M 53 93 Q 65 104 77 93" stroke="#7a2820" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : mouthDown ? (
        <path d="M 54 97 Q 65 90 76 97" stroke="#7a2820" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M 55 94 Q 65 97 75 94" stroke="#7a2820" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* Right arm (pour arm) */}
      <motion.g
        animate={mood === "pour" ? { rotate: -40, x: 6, y: -4 } : { rotate: 0, x: 0, y: 0 }}
        style={{ transformOrigin: "95px 115px" }}
      >
        <rect x="95" y="108" width="30" height="14" rx="7" fill="#1a1a32" />
        <circle cx="126" cy="115" r="9" fill="#c8956a" />
      </motion.g>

      {/* Left arm */}
      <rect x="5" y="108" width="30" height="14" rx="7" fill="#1a1a32" />
      <circle cx="4" cy="115" r="9" fill="#c8956a" />
    </motion.svg>
  );
}

// ── Glass ──────────────────────────────────────────────────────────────────

function BarGlass({ fill, poured }: { fill: string; poured: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: 58, height: 104 }}>
        <svg viewBox="0 0 58 104" className="absolute inset-0 w-full h-full">
          <path d="M4 6 L16 78 L19 88 L19 100 L39 100 L39 88 L42 78 L54 6Z"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
          <clipPath id="lc"><path d="M4 6 L16 78 L19 88 L19 100 L39 100 L39 88 L42 78 L54 6Z" /></clipPath>
          <motion.rect x="0" y="0" width="58" height="100" fill={fill} fillOpacity="0.85"
            clipPath="url(#lc)"
            initial={{ scaleY: 0 }} animate={{ scaleY: poured ? 1 : 0 }}
            style={{ transformOrigin: "bottom" }}
            transition={{ duration: 1.2, ease: "easeOut" }} />
          <path d="M8 14 L12 64" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[10px] text-muted-foreground">{poured ? "Cheers 🥂" : "Empty"}</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function Lounge() {
  const { balance, purchaseDrink, addCollectible } = useCasinoStore();
  const [mood, setMood] = useState<Mood>("idle");
  const [currentDrink, setCurrentDrink] = useState<(typeof HOUSE_DRINKS)[number] | null>(null);
  const [poured, setPoured] = useState(false);
  const [quip, setQuip] = useState("Evening. What'll it be?");
  const [lastDrop, setLastDrop] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [lastOrdered, setLastOrdered] = useState<Partial<Record<DrinkId, number>>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const COOLDOWN = 90_000;

  const orderDrink = useCallback(
    (drink: (typeof HOUSE_DRINKS)[number]) => {
      const last = lastOrdered[drink.id as DrinkId] ?? 0;
      if (Date.now() - last < COOLDOWN) return;
      if (balance < drink.cost) {
        setMood("sad");
        setQuip("Not enough chips for that one.");
        setTimeout(() => setMood("idle"), 2000);
        return;
      }

      const ok = purchaseDrink(drink.cost, drink.name);
      if (!ok) return;

      const q = drink.quip[Math.floor(Math.random() * drink.quip.length)];
      setCurrentDrink(drink);
      setPoured(false);
      setMood("pour");
      setQuip(q);
      setLastOrdered((prev) => ({ ...prev, [drink.id as DrinkId]: Date.now() }));
      setLastDrop(null);
      playSound("chip");

      setTimeout(() => {
        setPoured(true);
        setMood("wow");
        const drop = rollLoungeDrop();
        if (drop) {
          const c = getCollectible(drop);
          if (c) {
            setLastDrop(drop);
            addCollectible(c.id, c.name);
          }
        }
        setTimeout(() => setMood("happy"), 700);
        setTimeout(() => setMood("idle"), 2800);
      }, 500);
    },
    [lastOrdered, balance, purchaseDrink, addCollectible],
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
          Pull up a stool. Vincent will sort you out.
        </p>
      </div>

      {/* Bar scene */}
      <div className="casino-card p-6 relative overflow-hidden min-h-[220px]">
        {/* Shelf silhouettes */}
        <div className="absolute top-3 left-4 right-4 flex items-end gap-3 opacity-15 pointer-events-none">
          {[32, 28, 38, 30, 24, 36, 26].map((h, i) => (
            <div key={i} className="w-3 bg-amber-200 rounded-sm" style={{ height: h }} />
          ))}
        </div>
        {/* Counter */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-b from-amber-900/25 to-amber-950/45 border-t border-amber-700/25" />

        {/* Speech bubble */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full px-4 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div key={quip} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center text-sm italic text-primary/80 font-serif">
              "{quip}"
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative flex items-end justify-center gap-12 pt-8">
          <Vincent mood={mood} />
          <BarGlass fill={currentDrink?.fill ?? "#555"} poured={poured} />
        </div>
      </div>

      {/* Collectible drop */}
      <AnimatePresence>
        {lastDrop && (() => {
          const c = getCollectible(lastDrop);
          return c ? (
            <motion.div key={lastDrop}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="casino-card px-4 py-3 flex items-center gap-3 border-amber-400/30 bg-amber-500/8">
              <span className="text-xl">{c.emoji}</span>
              <div>
                <div className="text-sm font-semibold">{c.name} found in your pocket!</div>
                <div className={cn("text-xs", RARITY_COLOR[c.rarity])}>
                  {RARITY_LABEL[c.rarity]} · worth {c.pawnValue} chips at the pawn shop
                </div>
              </div>
            </motion.div>
          ) : null;
        })()}
      </AnimatePresence>

      {/* Drink menu */}
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground px-1">
          House Menu · Costs chips · Refreshes every 90 seconds
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOUSE_DRINKS.map((drink) => {
            const last = lastOrdered[drink.id as DrinkId] ?? 0;
            const elapsed = now - last;
            const onCooldown = elapsed < COOLDOWN;
            const secsLeft = onCooldown ? Math.ceil((COOLDOWN - elapsed) / 1000) : 0;
            const canAfford = balance >= drink.cost;

            return (
              <motion.button key={drink.id}
                whileHover={onCooldown || !canAfford ? {} : { y: -2, scale: 1.01 }}
                whileTap={onCooldown || !canAfford ? {} : { scale: 0.98 }}
                onClick={() => orderDrink(drink)}
                disabled={onCooldown || !canAfford}
                className={cn(
                  "casino-card p-4 text-left transition-all relative overflow-hidden group",
                  onCooldown || !canAfford
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:border-primary/40",
                )}
              >
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at bottom right, ${drink.fill}80, transparent)` }} />
                <div className="relative flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border"
                    style={{ borderColor: drink.fill + "50", backgroundColor: drink.fill + "18" }}>
                    {drink.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-base leading-tight">{drink.name}</div>
                    <div className="text-xs italic text-muted-foreground mt-0.5">{drink.tagline}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Coins className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary/80 font-semibold">{drink.cost} chips</span>
                    </div>
                  </div>
                  {onCooldown ? (
                    <div className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">{secsLeft}s</div>
                  ) : !canAfford ? (
                    <div className="text-xs text-red-400 shrink-0">Can't afford</div>
                  ) : (
                    <div className="text-xs text-primary/60 group-hover:text-primary transition-colors shrink-0">Order →</div>
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
            <span className="text-xs text-primary italic ml-1">♪ {MUSIC_LABELS[playingTrack]}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {getMusicTrackIds().map((id) => (
            <Button key={id} size="sm" variant={playingTrack === id ? "default" : "outline"}
              onClick={() => toggleTrack(id)}
              className={cn("text-xs", playingTrack === id && "bg-primary text-primary-foreground")}>
              {MUSIC_LABELS[id] ?? id}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
