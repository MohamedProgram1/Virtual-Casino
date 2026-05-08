import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { startMusic, stopMusic, getMusicTrackIds, playSound } from "@/lib/sounds";
import { rollLoungeDrop, getCollectible, RARITY_COLOR, RARITY_LABEL } from "@/lib/collectibles";
import { cn } from "@/lib/utils";

// ── Drinks menu ─────────────────────────────────────────────────────────────

const HOUSE_DRINKS = [
  {
    id: "house_whiskey",
    name: "House Whiskey",
    emoji: "🥃",
    fill: "#b07a2b",
    glow: "rgba(176,122,43,0.35)",
    cost: 50,
    tier: 1,
    tagline: "Smooth and uncomplicated.",
    quip: [
      "A classic. Good choice.",
      "Vincent pours without hesitation.",
      "Amber gold, every time.",
    ],
  },
  {
    id: "gin_fizz",
    name: "Vincent's Gin Fizz",
    emoji: "🍹",
    fill: "#7ec8e3",
    glow: "rgba(126,200,227,0.3)",
    cost: 65,
    tier: 1,
    tagline: "Crisp, bright, effervescent.",
    quip: [
      "He mixed it himself.",
      "Light as the evening air.",
      "His personal favourite.",
    ],
  },
  {
    id: "bitter_orange",
    name: "Bitter Orange Sour",
    emoji: "🍊",
    fill: "#e8741a",
    glow: "rgba(232,116,26,0.35)",
    cost: 80,
    tier: 1,
    tagline: "Complex, aromatic, alive.",
    quip: [
      "The orange was fresh today.",
      "Bold. Vincent nods.",
      "A dangerous kind of good.",
    ],
  },
  {
    id: "lucky_clover",
    name: "Lucky Clover",
    emoji: "🍀",
    fill: "#2d8a4e",
    glow: "rgba(45,138,78,0.35)",
    cost: 95,
    tier: 2,
    tagline: "Something Irish about tonight.",
    quip: [
      "Lucky in a glass.",
      "Brings out the gambler in everyone.",
      "Vincent smiles. That's rare.",
    ],
  },
  {
    id: "nightcap",
    name: "The Night Cap",
    emoji: "🌙",
    fill: "#5a2d82",
    glow: "rgba(90,45,130,0.4)",
    cost: 120,
    tier: 2,
    tagline: "Dark, sweet, and mysterious.",
    quip: [
      "Vincent only serves this late.",
      "Last call for the lucky ones.",
      "This one changes things.",
    ],
  },
  {
    id: "casino_royale",
    name: "Casino Royale",
    emoji: "👑",
    fill: "#d4a017",
    glow: "rgba(212,160,23,0.45)",
    cost: 180,
    tier: 3,
    tagline: "For those with a reputation.",
    quip: [
      "Vincent pauses before pouring.",
      "The house special. Obviously.",
      "Not for the faint-hearted.",
    ],
  },
] as const;

type DrinkId = (typeof HOUSE_DRINKS)[number]["id"];
type Mood = "idle" | "happy" | "wow" | "pour" | "sad";

const MUSIC_LABELS: Record<string, string> = {
  smoke:    "🎷 Smoke & Linen",
  neon:     "⚡ Neon Boulevard",
  midnight: "🌙 Midnight Swing",
  lounge:   "🌺 Bossa Lounge",
  casino:   "🎰 Lucky Vegas",
};

const COOLDOWN = 90_000;

// ── Backlit bottle shelf ────────────────────────────────────────────────────

const SHELF_BOTTLES = [
  { h: 48, color: "#b07a2b" },
  { h: 56, color: "#7ec8e3" },
  { h: 44, color: "#c43355" },
  { h: 60, color: "#e8741a" },
  { h: 52, color: "#2d8a4e" },
  { h: 64, color: "#5a2d82" },
  { h: 48, color: "#d4a017" },
  { h: 56, color: "#cfe9ff" },
  { h: 44, color: "#b07a2b" },
  { h: 52, color: "#e8741a" },
];

function BottleShelf() {
  const W = 20;
  const bottlePath = (h: number) =>
    `M 7.5 0 L 12.5 0 L 12.5 ${h * 0.2} Q ${W - 3} ${h * 0.26} ${W - 3} ${h * 0.38} L ${W - 3} ${h * 0.88} Q ${W - 3} ${h} ${W / 2} ${h} Q 3 ${h} 3 ${h * 0.88} L 3 ${h * 0.38} Q 3 ${h * 0.26} 7.5 ${h * 0.2} Z`;

  return (
    <div className="absolute top-0 left-0 right-0 flex items-end justify-center gap-3 px-6 pt-3 pointer-events-none">
      {SHELF_BOTTLES.map((b, i) => (
        <div key={i} className="relative flex-shrink-0">
          {/* Glow behind bottle */}
          <div
            className="absolute inset-x-[-4px] bottom-0 top-[-4px] rounded-t-full blur-md opacity-60"
            style={{ background: b.color }}
          />
          <svg width={W} height={b.h} viewBox={`0 0 ${W} ${b.h}`} className="relative">
            <defs>
              <linearGradient id={`sb-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={b.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <path d={bottlePath(b.h)} fill={`url(#sb-${i})`} />
            <line x1="5.5" y1={b.h * 0.35} x2="5" y2={b.h * 0.85}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
            <path d={bottlePath(b.h)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          </svg>
        </div>
      ))}
      {/* Shelf rail */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded"
        style={{ background: "linear-gradient(90deg, transparent, #4a3010 20%, #6a4820 50%, #4a3010 80%, transparent)" }} />
    </div>
  );
}

// ── Vincent ─────────────────────────────────────────────────────────────────

function Vincent({ mood }: { mood: Mood }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const schedule = (): ReturnType<typeof setTimeout> => {
      const delay = 2800 + Math.random() * 3500;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
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
      className="w-28 h-auto drop-shadow-[0_8px_28px_rgba(180,140,60,0.25)]"
      animate={
        mood === "idle"  ? { y: [0, -4, 0] } :
        mood === "pour"  ? { rotate: [0, -5, 3, -4, 0] } :
        mood === "happy" ? { y: [0, -9, 0, -4, 0] } :
        { y: 0 }
      }
      transition={
        mood === "idle"  ? { repeat: Infinity, duration: 2.8, ease: "easeInOut" } :
        mood === "pour"  ? { repeat: 1, duration: 0.55 } :
        mood === "happy" ? { duration: 0.65 } :
        {}
      }
    >
      {/* Body jacket */}
      <rect x="28" y="108" width="74" height="100" rx="14" fill="#1a1a32" />
      {/* Shirt */}
      <polygon points="65,108 50,108 55,175 65,162 75,175 80,108" fill="#f0ede8" />
      {/* Bow tie */}
      <polygon points="55,111 75,111 71,118 75,125 55,125 59,118" fill="#7a1010" />
      <circle cx="65" cy="118" r="3.5" fill="#5a0808" />
      {/* Lapels */}
      <path d="M50,108 L42,135 L65,145" fill="#232340" />
      <path d="M80,108 L88,135 L65,145" fill="#232340" />
      {/* Pocket square */}
      <rect x="76" y="118" width="10" height="8" rx="2" fill="#c8a020" opacity="0.75" />
      {/* Neck */}
      <rect x="55" y="92" width="20" height="22" rx="7" fill="#c8956a" />
      {/* Head */}
      <circle cx="65" cy="72" r="36" fill="#d4a574" />
      {/* Hair */}
      <path d="M29 55 Q34 22 65 26 Q96 22 101 55 Q93 36 65 40 Q37 36 29 55Z" fill="#1a0a00" />
      <path d="M65 26 Q67 40 66 54" stroke="#2a1200" strokeWidth="1.5" fill="none" opacity="0.5" />
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
          <path d="M42 63 Q51 68 60 63" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M70 63 Q79 68 88 63" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
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
      <path d="M63 70 Q59 78 65 81 Q71 78 67 70" stroke="#b07040" strokeWidth="1.5" fill="none" />
      {/* Mustache */}
      <path d="M51 85 Q58 80 65 85 Q72 80 79 85 Q72 91 65 87 Q58 91 51 85Z" fill="#1a0a00" />
      {/* Mouth */}
      {mouthO ? (
        <ellipse cx="65" cy="94" rx="7" ry="6.5" fill="#7a2820" />
      ) : mouthUp ? (
        <path d="M53 93 Q65 104 77 93" stroke="#7a2820" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : mouthDown ? (
        <path d="M54 97 Q65 90 76 97" stroke="#7a2820" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M55 94 Q65 97 75 94" stroke="#7a2820" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {/* Right arm — pour arm */}
      <motion.g
        animate={mood === "pour" ? { rotate: -42, x: 7, y: -5 } : { rotate: 0, x: 0, y: 0 }}
        style={{ transformOrigin: "95px 115px" }}
        transition={{ duration: 0.35 }}
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

// ── Highball glass (fixed — computed path, no clipPath transform issues) ────

function buildHighballFill(
  w: number, h: number, fillPct: number,
): string {
  // Glass is a slight trapezoid: wider at top, narrower at bottom
  // Top corners: (topInset, 0) and (w - topInset, 0)
  // Bottom corners: (botInset, h) and (w - botInset, h)
  const topInset = w * 0.06;
  const botInset = w * 0.1;

  const clamped = Math.max(0, Math.min(1, fillPct));
  const liquidTop = h * (1 - clamped * 0.93);
  const t = liquidTop / h; // 0=top, 1=bottom of glass

  // x at liquidTop (lerp from top to bottom)
  const xL = topInset + t * (botInset - topInset);
  const xR = (w - topInset) + t * ((w - botInset) - (w - topInset));
  const xBL = botInset;
  const xBR = w - botInset;

  // Same command structure at all fill levels (so Framer can morph)
  return `M ${xL} ${liquidTop} L ${xR} ${liquidTop} L ${xBR} ${h} L ${xBL} ${h} Z`;
}

function HighballGlass({
  fillPct,
  color,
}: {
  fillPct: number;
  color: string;
}) {
  const W = 52;
  const H = 96;
  const ti = W * 0.06;
  const bi = W * 0.1;
  const glassOutline = `M${ti} 0 L${W - ti} 0 L${W - bi} ${H} L${bi} ${H} Z`;
  const emptyPath = buildHighballFill(W, H, 0);
  const fillPath  = useMemo(() => buildHighballFill(W, H, fillPct), [fillPct]);
  const clipId    = "hg-shine";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={W} height={H + 8} viewBox={`0 0 ${W} ${H + 8}`} overflow="visible"
        className="drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <defs>
          <clipPath id={clipId}>
            <path d={glassOutline} />
          </clipPath>
          <linearGradient id="hg-liq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="hg-shine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        {/* Glass body */}
        <path d={glassOutline} fill="rgba(255,255,255,0.025)" />

        {/* Fill — morphing path, no clipPath CSS transform */}
        <motion.path
          fill="url(#hg-liq)"
          initial={{ d: emptyPath }}
          animate={{ d: fillPath }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Shine overlay (only decorative — clipPath is fine here) */}
        <path d={glassOutline} fill="url(#hg-shine)" clipPath={`url(#${clipId})`} />

        {/* Left highlight line */}
        <line x1={ti + 4} y1={6} x2={ti + 5} y2={H - 8}
          stroke="rgba(255,255,255,0.1)" strokeWidth="3" strokeLinecap="round"
          clipPath={`url(#${clipId})`} />

        {/* Bubbles rising when filled */}
        {fillPct > 0.1 && [0.25, 0.5, 0.72].map((bx, i) => (
          <motion.circle key={i}
            cx={W * bx} r={1.2}
            fill="rgba(255,255,255,0.4)"
            clipPath={`url(#${clipId})`}
            animate={{ cy: [H * 0.9, H * 0.15], opacity: [0.5, 0] }}
            transition={{ duration: 1.4 + i * 0.35, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          />
        ))}

        {/* Glass outline */}
        <path d={glassOutline} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

        {/* Base */}
        <rect x={bi - 2} y={H} width={W - (bi - 2) * 2} height={8} rx="3"
          fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Speech bubble ────────────────────────────────────────────────────────────

function SpeechBubble({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={text}
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3 }}
        className="relative px-4 py-2.5 rounded-2xl border border-primary/20 bg-black/40 backdrop-blur-sm max-w-[200px] text-center"
      >
        <p className="font-serif text-sm italic text-primary/90 leading-snug">"{text}"</p>
        {/* Bubble tail pointing down-left toward Vincent */}
        <div className="absolute -bottom-2.5 left-8 w-0 h-0"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "10px solid rgba(212,160,23,0.2)",
          }} />
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Lounge() {
  const { balance, purchaseDrink, addCollectible } = useCasinoStore();

  const [mood, setMood]               = useState<Mood>("idle");
  const [currentDrink, setCurrentDrink] = useState<(typeof HOUSE_DRINKS)[number] | null>(null);
  const [fillPct, setFillPct]         = useState(0);
  const [quip, setQuip]               = useState("Evening. What'll it be?");
  const [lastDrop, setLastDrop]       = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [lastOrdered, setLastOrdered] = useState<Partial<Record<DrinkId, number>>>({});
  const [now, setNow]                 = useState(Date.now());
  const [orderedThis, setOrderedThis] = useState<string[]>([]); // session tab

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const orderDrink = useCallback(
    (drink: (typeof HOUSE_DRINKS)[number]) => {
      const last = lastOrdered[drink.id as DrinkId] ?? 0;
      if (Date.now() - last < COOLDOWN) return;
      if (balance < drink.cost) {
        setMood("sad");
        setQuip("Not enough chips for that one, friend.");
        setTimeout(() => { setMood("idle"); setQuip("Evening. What'll it be?"); }, 2200);
        return;
      }

      const ok = purchaseDrink(drink.cost, drink.name);
      if (!ok) return;

      const q = drink.quip[Math.floor(Math.random() * drink.quip.length)];
      setCurrentDrink(drink);
      setFillPct(0);
      setMood("pour");
      setQuip(q);
      setLastOrdered((p) => ({ ...p, [drink.id as DrinkId]: Date.now() }));
      setLastDrop(null);
      playSound("chip");

      // Glass fills while Vincent pours
      setTimeout(() => setFillPct(1), 80);

      setTimeout(() => {
        setMood("wow");
        const drop = rollLoungeDrop();
        if (drop) {
          const c = getCollectible(drop);
          if (c) { setLastDrop(drop); addCollectible(c.id, c.name); }
        }
        setOrderedThis((p) => [...p, drink.emoji]);
        setTimeout(() => setMood("happy"), 600);
        setTimeout(() => { setMood("idle"); setQuip("Another round?"); }, 2600);
      }, 900);
    },
    [lastOrdered, balance, purchaseDrink, addCollectible],
  );

  const toggleTrack = (trackId: string) => {
    if (playingTrack === trackId) { stopMusic(); setPlayingTrack(null); }
    else { startMusic(trackId); setPlayingTrack(trackId); }
  };

  const tierLabel = (t: number) =>
    t === 1 ? "Well Drinks" : t === 2 ? "Signature" : "Premium";

  const tierColor = (t: number) =>
    t === 1 ? "text-zinc-500" : t === 2 ? "text-amber-500/70" : "text-amber-300";

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="text-center pt-3 space-y-0.5">
        <div className="text-[10px] uppercase tracking-[0.35em] text-primary/60">Lucky Vault</div>
        <h1 className="font-serif text-4xl casino-gradient-text">The Bar</h1>
        <p className="text-xs text-muted-foreground/70">Pull up a stool. Vincent will sort you out.</p>
      </div>

      {/* ── Bar scene ── */}
      <div className="casino-card overflow-hidden relative"
        style={{ background: "linear-gradient(180deg, #0f0c08 0%, #1a1208 60%, #251a0a 100%)" }}>

        {/* Ambient light from bottles */}
        <div className="absolute top-0 left-0 right-0 h-24 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(200,160,40,0.35), transparent 70%)" }} />

        {/* Bottle shelf */}
        <div className="relative h-20">
          <BottleShelf />
        </div>

        {/* Scene content */}
        <div className="relative flex items-end justify-around px-6 pb-0 gap-4 min-h-[160px]">

          {/* Vincent + speech bubble */}
          <div className="flex flex-col items-center gap-2 pb-4">
            <SpeechBubble text={quip} />
            <Vincent mood={mood} />
          </div>

          {/* Drink glass on counter */}
          <div className="flex flex-col items-center gap-1 pb-5">
            <HighballGlass
              fillPct={fillPct}
              color={currentDrink?.fill ?? "#888"}
            />
            <AnimatePresence>
              {fillPct > 0 && currentDrink && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground text-center"
                >
                  {currentDrink.emoji} {currentDrink.name}
                </motion.div>
              )}
              {fillPct === 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[10px] text-zinc-700"
                >
                  Empty
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Counter surface */}
        <div className="relative h-12"
          style={{ background: "linear-gradient(180deg, #3a1f08 0%, #2a1206 100%)" }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(180,120,40,0.6) 30%, rgba(200,150,60,0.8) 50%, rgba(180,120,40,0.6) 70%, transparent)" }} />
          {/* Counter reflection */}
          <div className="absolute top-px left-0 right-0 h-4 opacity-20"
            style={{ background: "linear-gradient(180deg, rgba(255,200,100,0.12), transparent)" }} />

          {/* Session tab */}
          {orderedThis.length > 0 && (
            <div className="absolute right-4 top-2 flex items-center gap-1">
              <span className="text-[9px] text-zinc-600 mr-1">Tonight</span>
              {orderedThis.slice(-6).map((em, i) => (
                <span key={i} className="text-sm">{em}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Collectible drop ── */}
      <AnimatePresence>
        {lastDrop && (() => {
          const c = getCollectible(lastDrop);
          return c ? (
            <motion.div key={lastDrop}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="casino-card px-4 py-3 flex items-center gap-3 border-amber-400/30 bg-amber-500/8">
              <span className="text-xl">{c.emoji}</span>
              <div>
                <div className="text-sm font-semibold">Found in your pocket: {c.name}</div>
                <div className={cn("text-xs", RARITY_COLOR[c.rarity])}>
                  {RARITY_LABEL[c.rarity]} · worth {c.pawnValue} chips at the pawn shop
                </div>
              </div>
            </motion.div>
          ) : null;
        })()}
      </AnimatePresence>

      {/* ── Menu ── */}
      <div className="space-y-2">
        {/* Section header */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/15" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary/40">Tonight's Menu</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/15" />
        </div>

        {/* Group by tier */}
        {[1, 2, 3].map((tier) => {
          const drinks = HOUSE_DRINKS.filter((d) => d.tier === tier);
          return (
            <div key={tier} className="space-y-1.5">
              <div className={cn("text-[9px] uppercase tracking-widest font-semibold px-1", tierColor(tier))}>
                {tierLabel(tier)}
              </div>
              <div className="space-y-1.5">
                {drinks.map((drink) => {
                  const last      = lastOrdered[drink.id as DrinkId] ?? 0;
                  const elapsed   = now - last;
                  const onCooldown = elapsed < COOLDOWN;
                  const secsLeft  = onCooldown ? Math.ceil((COOLDOWN - elapsed) / 1000) : 0;
                  const canAfford = balance >= drink.cost;
                  const blocked   = onCooldown || !canAfford;

                  return (
                    <motion.div key={drink.id}
                      className={cn(
                        "casino-card relative overflow-hidden transition-all",
                        !blocked && "hover:border-primary/40 cursor-pointer group",
                        blocked && "opacity-50",
                      )}
                      whileHover={!blocked ? { y: -1 } : {}}
                      onClick={() => !blocked && orderDrink(drink)}
                    >
                      {/* Drink color glow */}
                      <div className="absolute inset-0 opacity-[0.07] pointer-events-none transition-opacity group-hover:opacity-[0.12]"
                        style={{ background: `radial-gradient(ellipse at bottom right, ${drink.fill}, transparent 65%)` }} />

                      <div className="relative flex items-center gap-3 px-4 py-3">
                        {/* Emoji in colored circle */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border"
                          style={{ borderColor: drink.fill + "44", background: drink.fill + "18" }}>
                          {drink.emoji}
                        </div>

                        {/* Name + tagline */}
                        <div className="flex-1 min-w-0">
                          <div className="font-serif text-sm leading-tight text-zinc-100">{drink.name}</div>
                          <div className="text-[11px] italic text-zinc-500 mt-0.5">{drink.tagline}</div>
                        </div>

                        {/* Price + CTA */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-primary/20 bg-primary/8">
                            <Coins className="w-3 h-3 text-primary" />
                            <span className="text-xs font-semibold text-primary/90">{drink.cost}</span>
                          </div>

                          {onCooldown ? (
                            <div className="w-10 text-center text-xs font-mono text-zinc-600 tabular-nums">{secsLeft}s</div>
                          ) : !canAfford ? (
                            <div className="w-10 text-center text-xs text-red-500/60">Low</div>
                          ) : (
                            <div className="w-10 text-center text-xs text-primary/50 group-hover:text-primary transition-colors">
                              Order →
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Hint */}
        <p className="text-[10px] text-zinc-700 px-1 text-center">
          Each drink has a 90-second cooldown · Collectibles drop on orders
        </p>
      </div>

      {/* ── Jukebox ── */}
      <div className="casino-card p-4"
        style={{ background: "linear-gradient(135deg, rgba(15,10,5,0.8), rgba(20,15,8,0.9))" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Music className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm font-semibold">Jukebox</span>
          <AnimatePresence>
            {playingTrack && (
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 ml-1">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
                <span className="text-xs text-primary/70 italic">{MUSIC_LABELS[playingTrack]}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {playingTrack && (
            <button onClick={() => { stopMusic(); setPlayingTrack(null); }}
              className="ml-auto text-zinc-600 hover:text-zinc-400 transition-colors">
              <VolumeX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {getMusicTrackIds().map((id) => (
            <button key={id}
              onClick={() => toggleTrack(id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                playingTrack === id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}>
              {MUSIC_LABELS[id] ?? id}
              {playingTrack === id && <Volume2 className="inline w-3 h-3 ml-1.5 opacity-70" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
