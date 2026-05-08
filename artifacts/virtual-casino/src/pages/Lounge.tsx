import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Music, VolumeX, Volume2 } from "lucide-react";
import { useCasinoStore } from "@/lib/store";
import { startMusic, stopMusic, getMusicTrackIds, playSound } from "@/lib/sounds";
import { rollLoungeDrop, getCollectible, RARITY_COLOR, RARITY_LABEL } from "@/lib/collectibles";
import { cn } from "@/lib/utils";

// ── Drinks ───────────────────────────────────────────────────────────────────

const HOUSE_DRINKS = [
  { id: "house_whiskey", name: "House Whiskey",        emoji: "🥃", fill: "#e8a020", glow: "#e8a020", cost:  50, tier: 1, tagline: "Smooth. No fuss.", quip: ["Solid choice.", "Poured it cold.", "Classic."] },
  { id: "gin_fizz",      name: "Luna's Gin Fizz",      emoji: "🍹", fill: "#40d8f0", glow: "#40d8f0", cost:  65, tier: 1, tagline: "Crisp and electric.",    quip: ["She shakes it herself.", "Fizz never lies.", "Her signature move."] },
  { id: "bitter_orange", name: "Bitter Orange Sour",   emoji: "🍊", fill: "#ff6820", glow: "#ff6820", cost:  80, tier: 1, tagline: "Complex. Aromatic. Alive.", quip: ["The orange was fresh.", "Bold pick.", "Luna nods — barely."] },
  { id: "lucky_clover",  name: "Lucky Clover",         emoji: "🍀", fill: "#30d060", glow: "#30d060", cost:  95, tier: 2, tagline: "Something Irish about it.", quip: ["Green, like your luck.", "She smiles. Rare.", "Luck in a glass."] },
  { id: "nightcap",      name: "The Night Cap",        emoji: "🌙", fill: "#a020f0", glow: "#a020f0", cost: 120, tier: 2, tagline: "Dark, sweet, mysterious.",  quip: ["Only after midnight.", "Last call energy.", "This one changes things."] },
  { id: "neon_shot",     name: "Neon Shot",            emoji: "⚡", fill: "#00f0c0", glow: "#00f0c0", cost: 145, tier: 2, tagline: "Two seconds to decide.",    quip: ["Down in one.", "She watches.", "Electric."] },
  { id: "casino_royale", name: "Casino Royale",        emoji: "👑", fill: "#f0d020", glow: "#f0d020", cost: 180, tier: 3, tagline: "For those with a reputation.", quip: ["Luna pauses first.", "The house special.", "Not for newcomers."] },
] as const;

type DrinkId = (typeof HOUSE_DRINKS)[number]["id"];
type Mood = "idle" | "happy" | "wow" | "pour" | "sad";

const COOLDOWN = 90_000;

const MUSIC_LABELS: Record<string, string> = {
  smoke:     "🎷 Smoke & Linen",
  neon:      "⚡ Neon Boulevard",
  midnight:  "🌙 Midnight Swing",
  lounge:    "🌺 Bossa Lounge",
  casino:    "🎰 Lucky Vegas",
  blues:     "🎸 Smoky Blues",
  jazz:      "🎺 Jazz Corner",
  chill:     "🌊 After Hours",
  retro:     "🌈 Synth Drive",
  deephouse: "🎛️ Deep House",
};

// ── LED Bottle Cabinet ───────────────────────────────────────────────────────

const CABINET_BOTTLES = [
  { h: 58, color: "#e8a020" },
  { h: 46, color: "#40d8f0" },
  { h: 52, color: "#ff4080" },
  { h: 66, color: "#ff6820" },
  { h: 50, color: "#30d060" },
  { h: 70, color: "#a020f0" },
  { h: 44, color: "#00f0c0" },
  { h: 60, color: "#f0d020" },
  { h: 48, color: "#40d8f0" },
  { h: 54, color: "#ff4080" },
  { h: 44, color: "#e8a020" },
  { h: 62, color: "#30d060" },
];

function LEDCabinet() {
  const W = 16;
  const bp = (h: number) =>
    `M5.5 0 L${W - 5.5} 0 L${W - 5.5} ${h * 0.18} Q${W - 2} ${h * 0.24} ${W - 2} ${h * 0.36} L${W - 2} ${h * 0.86} Q${W - 2} ${h} ${W / 2} ${h} Q2 ${h} 2 ${h * 0.86} L2 ${h * 0.36} Q2 ${h * 0.24} 5.5 ${h * 0.18} Z`;

  return (
    <div className="flex items-end justify-center gap-2.5 px-4 pt-2 pb-0 relative">
      {/* LED strip above bottles */}
      <div className="absolute top-0 left-2 right-2 h-0.5 rounded-full"
        style={{ background: "linear-gradient(90deg, #a020f0, #40d8f0, #ff4080, #30d060, #f0d020, #a020f0)", boxShadow: "0 0 8px 2px rgba(160,32,240,0.5)" }} />
      {CABINET_BOTTLES.map((b, i) => (
        <div key={i} className="relative shrink-0">
          {/* Glow bloom */}
          <div className="absolute inset-x-[-5px] bottom-0 top-[-6px] rounded-t-full blur-lg opacity-55 pointer-events-none"
            style={{ background: b.color }} />
          <svg width={W} height={b.h} viewBox={`0 0 ${W} ${b.h}`} className="relative">
            <defs>
              <linearGradient id={`lb-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={b.color} stopOpacity="0.5" />
                <stop offset="40%" stopColor={b.color} stopOpacity="0.95" />
                <stop offset="100%" stopColor={b.color} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path d={bp(b.h)} fill={`url(#lb-${i})`} />
            <line x1="4.5" y1={b.h * 0.3} x2="4" y2={b.h * 0.82} stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" />
            <path d={bp(b.h)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
          </svg>
        </div>
      ))}
      {/* Shelf rail */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded"
        style={{ background: "linear-gradient(90deg, transparent, rgba(160,32,240,0.6) 20%, rgba(64,216,240,0.8) 50%, rgba(160,32,240,0.6) 80%, transparent)" }} />
    </div>
  );
}

// ── Luna SVG ─────────────────────────────────────────────────────────────────

function Luna({ mood }: { mood: Mood }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const go = (): ReturnType<typeof setTimeout> =>
      setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 120); go(); }, 2500 + Math.random() * 3000);
    const t = go();
    return () => clearTimeout(t);
  }, []);

  const eyesClosed = blink || mood === "happy";
  const mouthWow   = mood === "wow";
  const mouthHappy = mood === "happy";
  const mouthDown  = mood === "sad";

  return (
    <motion.svg viewBox="0 0 130 240" className="w-28 h-auto drop-shadow-[0_6px_24px_rgba(160,32,240,0.35)]"
      animate={
        mood === "idle"  ? { y: [0, -5, 0] } :
        mood === "pour"  ? { rotate: [0, -8, 4, -5, 0] } :
        mood === "happy" ? { y: [0, -10, 0, -5, 0] } :
        mood === "wow"   ? { scale: [1, 1.04, 1] } :
        { y: 0 }
      }
      transition={
        mood === "idle"  ? { repeat: Infinity, duration: 3.2, ease: "easeInOut" } :
        mood === "pour"  ? { repeat: 1, duration: 0.5 } :
        mood === "happy" ? { duration: 0.7 } :
        mood === "wow"   ? { duration: 0.4 } :
        {}
      }
    >
      {/* ── Body: sleeveless jacket ── */}
      {/* Jacket body */}
      <rect x="28" y="110" width="74" height="98" rx="16" fill="#141020" />
      {/* Inner top (neon pink) */}
      <polygon points="65,110 50,110 55,172 65,158 75,172 80,110" fill="#2a0838" />
      {/* Neon accent stripe on jacket edge left */}
      <line x1="45" y1="118" x2="43" y2="200" stroke="#a020f0" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      {/* Neon accent stripe on jacket edge right */}
      <line x1="85" y1="118" x2="87" y2="200" stroke="#40d8f0" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      {/* Lapels */}
      <path d="M50,110 L38,142 L65,150" fill="#1a0a28" />
      <path d="M80,110 L92,142 L65,150" fill="#1a0a28" />
      {/* Geometric tattoo on left arm area */}
      <line x1="36" y1="148" x2="28" y2="170" stroke="#a020f0" strokeWidth="1" opacity="0.55" />
      <line x1="32" y1="150" x2="25" y2="168" stroke="#a020f0" strokeWidth="0.7" opacity="0.35" />
      <circle cx="30" cy="157" r="2" fill="none" stroke="#a020f0" strokeWidth="0.8" opacity="0.5" />

      {/* ── Left arm ── */}
      <rect x="4" y="110" width="30" height="14" rx="7" fill="#141020" />
      <circle cx="3" cy="117" r="9" fill="#8a5840" />

      {/* ── Right arm (pour) ── */}
      <motion.g
        animate={mood === "pour" ? { rotate: -40, x: 8, y: -6 } : { rotate: 0, x: 0, y: 0 }}
        style={{ transformOrigin: "95px 117px" }}
        transition={{ duration: 0.32 }}
      >
        <rect x="96" y="110" width="30" height="14" rx="7" fill="#141020" />
        <circle cx="127" cy="117" r="9" fill="#8a5840" />
      </motion.g>

      {/* ── Neck ── */}
      <rect x="56" y="93" width="18" height="22" rx="7" fill="#8a5840" />

      {/* ── Head ── */}
      <ellipse cx="65" cy="70" rx="33" ry="35" fill="#8a5840" />

      {/* ── Hair (undercut, dark with streak) ── */}
      {/* Base hair cap */}
      <path d="M32 52 Q36 18 65 22 Q94 18 98 52 Q90 30 65 34 Q40 30 32 52Z" fill="#0a0610" />
      {/* Sides */}
      <path d="M32 52 Q30 44 34 36 Q38 32 42 36 Q38 44 32 52Z" fill="#120918" />
      <path d="M98 52 Q100 44 96 36 Q92 32 88 36 Q92 44 98 52Z" fill="#120918" />
      {/* Top sweep */}
      <path d="M38 34 Q52 20 68 24 Q78 26 84 34 Q72 28 65 30 Q50 28 38 34Z" fill="#0a0610" />
      {/* Purple streak */}
      <path d="M64 22 Q70 26 74 34 Q70 30 65 32 Q62 26 64 22Z" fill="#c040f8" opacity="0.85" />
      {/* Pink edge on streak */}
      <path d="M70 24 Q73 28 75 34 Q72 30 70 34 Q68 28 70 24Z" fill="#ff40c0" opacity="0.5" />
      {/* Shaved side texture (faint lines) */}
      <line x1="35" y1="52" x2="39" y2="40" stroke="#1e1428" strokeWidth="1.2" opacity="0.6" />
      <line x1="38" y1="54" x2="41" y2="42" stroke="#1e1428" strokeWidth="0.9" opacity="0.4" />

      {/* ── Eyebrows (thin, arched) ── */}
      <path d={mood === "wow" ? "M43 47 Q51 44 58 48" : "M43 50 Q51 46 58 50"}
        stroke="#0a0610" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={mood === "wow" ? "M72 47 Q79 44 87 48" : "M72 50 Q79 46 87 50"}
        stroke="#0a0610" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* ── Eyes ── */}
      {eyesClosed ? (
        <>
          <path d="M43 62 Q51 67 59 62" stroke="#0a0610" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M71 62 Q79 67 87 62" stroke="#0a0610" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Left */}
          <ellipse cx="51" cy="62" rx={mood === "wow" ? 8.5 : 7} ry={mood === "wow" ? 9 : 7.5} fill="white" />
          <circle cx="51" cy="63" r={4} fill="#1a0030" />
          {/* Neon iris ring */}
          <circle cx="51" cy="63" r={4} fill="none" stroke="#a020f0" strokeWidth="1" opacity="0.7" />
          <circle cx="52.5" cy="61.5" r={1.3} fill="white" />
          {/* Right */}
          <ellipse cx="79" cy="62" rx={mood === "wow" ? 8.5 : 7} ry={mood === "wow" ? 9 : 7.5} fill="white" />
          <circle cx="79" cy="63" r={4} fill="#1a0030" />
          <circle cx="79" cy="63" r={4} fill="none" stroke="#40d8f0" strokeWidth="1" opacity="0.7" />
          <circle cx="80.5" cy="61.5" r={1.3} fill="white" />
          {/* Liner top */}
          <path d="M43 59 Q51 56 60 59" stroke="#0a0610" strokeWidth="1.8" fill="none" />
          <path d="M71 59 Q79 56 87 59" stroke="#0a0610" strokeWidth="1.8" fill="none" />
          {/* Subtle lash flicks */}
          <line x1="43" y1="59" x2="40" y2="57" stroke="#0a0610" strokeWidth="1.2" />
          <line x1="87" y1="59" x2="90" y2="57" stroke="#0a0610" strokeWidth="1.2" />
        </>
      )}

      {/* ── Nose ── */}
      <path d="M62 70 Q60 76 65 78 Q70 76 68 70" stroke="#6a3820" strokeWidth="1.2" fill="none" />

      {/* ── Cheek blush (neon-ish) ── */}
      <ellipse cx="40" cy="72" rx="7" ry="4" fill="#ff40a0" opacity="0.15" />
      <ellipse cx="90" cy="72" rx="7" ry="4" fill="#ff40a0" opacity="0.15" />

      {/* ── Mouth ── */}
      {mouthWow ? (
        <ellipse cx="65" cy="90" rx="7" ry="6" fill="#7a1a1a" />
      ) : mouthHappy ? (
        <path d="M53 89 Q65 100 77 89" stroke="#7a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : mouthDown ? (
        <path d="M54 93 Q65 87 76 93" stroke="#7a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        /* smirk — right side slightly lower */
        <path d="M53 90 Q62 94 77 88" stroke="#7a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* ── Earrings (hoop + stud) ── */}
      <circle cx="33" cy="70" r="5" stroke="#c040f8" strokeWidth="1.8" fill="none" />
      <circle cx="97" cy="68" r="2.5" fill="#40d8f0" opacity="0.9" />
      <circle cx="97" cy="74" r="1.8" fill="#c040f8" opacity="0.85" />
    </motion.svg>
  );
}

// ── Cocktail glass (rect fill approach — CSS height/y are real SVG geometry,
//   respected by clipPath unlike CSS transforms) ────────────────────────────

function NeonGlass({ fillPct, color }: { fillPct: number; color: string }) {
  const W = 52; const H = 92;
  const ti = W * 0.06; const bi = W * 0.1;
  const outline = `M${ti} 0 L${W - ti} 0 L${W - bi} ${H} L${bi} ${H} Z`;
  const clipId  = "ng-clip";

  // Liquid rect geometry — height and y set via CSS (not transforms)
  const liqH   = H * Math.max(0, Math.min(1, fillPct)) * 0.93;
  const liqY   = H - liqH;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={W} height={H + 10} viewBox={`0 0 ${W} ${H + 10}`} overflow="visible"
        className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
        <defs>
          <clipPath id={clipId}>
            <path d={outline} />
          </clipPath>
          <linearGradient id="ng-liq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.88" />
          </linearGradient>
        </defs>

        {/* Glass body */}
        <path d={outline} fill="rgba(255,255,255,0.03)" />

        {/* Liquid fill — CSS height/y transition, no transform (respects clipPath) */}
        <rect
          x={0} width={W}
          fill="url(#ng-liq)"
          clipPath={`url(#${clipId})`}
          style={{
            y: `${liqY}`,
            height: `${liqH}`,
            transition: "y 1.1s cubic-bezier(0.22,1,0.36,1), height 1.1s cubic-bezier(0.22,1,0.36,1)",
          } as React.CSSProperties}
        />

        {/* Neon surface line */}
        {fillPct > 0.05 && (
          <line
            x1={ti + 2} x2={W - ti - 2}
            y1={liqY} y2={liqY}
            stroke={color} strokeWidth="1.5" strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 3px ${color})`,
              transition: "y1 1.1s cubic-bezier(0.22,1,0.36,1), y2 1.1s cubic-bezier(0.22,1,0.36,1)",
              opacity: 0.7,
            }}
          />
        )}

        {/* Bubbles */}
        {fillPct > 0.1 && [0.28, 0.52, 0.76].map((bx, i) => (
          <motion.circle key={i} cx={W * bx} r={1.2}
            fill="rgba(255,255,255,0.5)"
            clipPath={`url(#${clipId})`}
            animate={{ cy: [H * 0.88, H * 0.12], opacity: [0.6, 0] }}
            transition={{ duration: 1.3 + i * 0.3, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }} />
        ))}

        {/* Glass outline */}
        <path d={outline} fill="none"
          stroke={fillPct > 0 ? color : "rgba(255,255,255,0.15)"}
          strokeWidth="1"
          style={{ filter: fillPct > 0 ? `drop-shadow(0 0 4px ${color})` : "none", opacity: fillPct > 0 ? 0.4 : 1 }} />

        {/* Base */}
        <rect x={bi - 2} y={H} width={W - (bi - 2) * 2} height={10} rx="4"
          fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

// ── Neon chat bubble ─────────────────────────────────────────────────────────

function NeonBubble({ text, color = "#a020f0" }: { text: string; color?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={text}
        initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.28 }}
        className="relative px-4 py-2.5 rounded-2xl max-w-[190px] text-center"
        style={{
          background: "rgba(8,3,20,0.85)",
          border: `1px solid ${color}55`,
          boxShadow: `0 0 12px ${color}30`,
        }}
      >
        <p className="text-sm font-mono leading-snug" style={{ color: `${color}ee` }}>
          "{text}"
        </p>
        {/* Tail */}
        <div className="absolute -bottom-2.5 left-10 w-0 h-0"
          style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `10px solid ${color}44` }} />
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Lounge() {
  const { balance, purchaseDrink, addCollectible } = useCasinoStore();

  const [mood, setMood]                 = useState<Mood>("idle");
  const [currentDrink, setCurrentDrink] = useState<(typeof HOUSE_DRINKS)[number] | null>(null);
  const [fillPct, setFillPct]           = useState(0);
  const [quip, setQuip]                 = useState("Hey. Pull up a stool.");
  const [bubbleColor, setBubbleColor]   = useState("#a020f0");
  const [lastDrop, setLastDrop]         = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [lastOrdered, setLastOrdered]   = useState<Partial<Record<DrinkId, number>>>({});
  const [now, setNow]                   = useState(Date.now());
  const [tab, setTab]                   = useState<string[]>([]);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const orderDrink = useCallback((drink: (typeof HOUSE_DRINKS)[number]) => {
    const last = lastOrdered[drink.id as DrinkId] ?? 0;
    if (Date.now() - last < COOLDOWN) return;
    if (balance < drink.cost) {
      setMood("sad"); setQuip("Not enough chips."); setBubbleColor("#ff4060");
      setTimeout(() => { setMood("idle"); setQuip("Hey. Pull up a stool."); setBubbleColor("#a020f0"); }, 2200);
      return;
    }
    if (!purchaseDrink(drink.cost, drink.name)) return;

    const q = drink.quip[Math.floor(Math.random() * drink.quip.length)];
    setCurrentDrink(drink); setFillPct(0); setMood("pour");
    setQuip(q); setBubbleColor(drink.glow);
    setLastOrdered(p => ({ ...p, [drink.id as DrinkId]: Date.now() }));
    setLastDrop(null);
    playSound("chip");
    setTimeout(() => setFillPct(1), 80);

    setTimeout(() => {
      setMood("wow");
      const drop = rollLoungeDrop();
      if (drop) { const c = getCollectible(drop); if (c) { setLastDrop(drop); addCollectible(c.id, c.name); } }
      setTab(p => [...p, drink.emoji]);
      setTimeout(() => setMood("happy"), 600);
      setTimeout(() => { setMood("idle"); setQuip("Another?"); setBubbleColor("#a020f0"); }, 2600);
    }, 900);
  }, [lastOrdered, balance, purchaseDrink, addCollectible]);

  const toggleTrack = (id: string) => {
    if (playingTrack === id) { stopMusic(); setPlayingTrack(null); }
    else { startMusic(id); setPlayingTrack(id); }
  };

  const allTracks = getMusicTrackIds();

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      {/* ── Header ── */}
      <div className="text-center pt-3 space-y-1">
        <div className="text-[10px] tracking-[0.4em] uppercase" style={{ color: "#a020f0cc" }}>Underground</div>
        <h1 className="font-mono text-4xl font-bold tracking-tight"
          style={{ color: "#40d8f0", textShadow: "0 0 20px #40d8f0aa, 0 0 40px #40d8f060" }}>
          THE LOUNGE
        </h1>
        <p className="text-xs" style={{ color: "#a020f080" }}>Luna's behind the bar tonight.</p>
      </div>

      {/* ── Bar scene ── */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: "linear-gradient(180deg, #04010f 0%, #080218 55%, #0e0525 100%)", border: "1px solid #a020f030" }}>

        {/* Neon ceiling strip */}
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: "linear-gradient(90deg, #a020f0, #40d8f0, #ff4080, #a020f0)", boxShadow: "0 0 12px 3px rgba(160,32,240,0.4)" }} />

        {/* Ambient glow from ceiling */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse at 50% -10%, #40d8f0, transparent 65%)" }} />

        {/* LED bottle cabinet */}
        <div className="relative pt-3 pb-1 mx-4 rounded-xl overflow-hidden"
          style={{ background: "rgba(4, 1, 16, 0.9)", border: "1px solid rgba(160,32,240,0.2)" }}>
          <LEDCabinet />
        </div>

        {/* Scene: Luna + glass */}
        <div className="relative flex items-end justify-around px-6 pt-4 pb-0 gap-4 min-h-[168px]">

          {/* Luna + chat bubble */}
          <div className="flex flex-col items-center gap-2 pb-4">
            <NeonBubble text={quip} color={bubbleColor} />
            <Luna mood={mood} />
          </div>

          {/* Glass */}
          <div className="flex flex-col items-center gap-1.5 pb-5">
            <NeonGlass fillPct={fillPct} color={currentDrink?.fill ?? "#444"} />
            <AnimatePresence>
              {fillPct > 0 && currentDrink ? (
                <motion.div key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-center font-mono"
                  style={{ color: currentDrink.glow, textShadow: `0 0 8px ${currentDrink.glow}` }}>
                  {currentDrink.emoji} {currentDrink.name}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
                  className="text-[10px] font-mono" style={{ color: "#6040a0" }}>
                  empty
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Counter */}
        <div className="relative h-14"
          style={{ background: "linear-gradient(180deg, #0a0320 0%, #060112 100%)" }}>
          {/* Neon counter edge */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #a020f0 25%, #40d8f0 50%, #a020f0 75%, transparent)", boxShadow: "0 0 8px 2px rgba(64,216,240,0.3)" }} />
          {/* Counter reflection glow */}
          <div className="absolute top-px left-0 right-0 h-6 opacity-15"
            style={{ background: "linear-gradient(180deg, rgba(64,216,240,0.15), transparent)" }} />
          {/* Tab */}
          {tab.length > 0 && (
            <div className="absolute right-4 top-3 flex items-center gap-1">
              <span className="text-[9px] font-mono mr-1" style={{ color: "#6040a0" }}>tonight</span>
              {tab.slice(-7).map((em, i) => <span key={i} className="text-base leading-none">{em}</span>)}
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
              initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(160,32,240,0.1)", border: "1px solid rgba(160,32,240,0.3)", boxShadow: "0 0 20px rgba(160,32,240,0.15)" }}>
              <span className="text-xl">{c.emoji}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "#e8d0ff" }}>Dropped: {c.name}</div>
                <div className={cn("text-xs", RARITY_COLOR[c.rarity])}>{RARITY_LABEL[c.rarity]} · {c.pawnValue} chips at pawn shop</div>
              </div>
            </motion.div>
          ) : null;
        })()}
      </AnimatePresence>

      {/* ── Menu ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(160,32,240,0.3))" }} />
          <span className="text-[10px] uppercase tracking-[0.35em] font-mono" style={{ color: "#a020f080" }}>Menu</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, transparent, rgba(160,32,240,0.3))" }} />
        </div>

        {[1, 2, 3].map(tier => {
          const drinks = HOUSE_DRINKS.filter(d => d.tier === tier);
          const tierLabel = tier === 1 ? "Well" : tier === 2 ? "Signature" : "Premium";
          const tierCol   = tier === 1 ? "#6040a0" : tier === 2 ? "#a020f0" : "#40d8f0";
          return (
            <div key={tier} className="space-y-1.5">
              <div className="text-[9px] uppercase tracking-widest font-mono px-1" style={{ color: tierCol }}>{tierLabel}</div>
              {drinks.map(drink => {
                const last      = lastOrdered[drink.id as DrinkId] ?? 0;
                const elapsed   = now - last;
                const onCD      = elapsed < COOLDOWN;
                const secsLeft  = onCD ? Math.ceil((COOLDOWN - elapsed) / 1000) : 0;
                const canAfford = balance >= drink.cost;
                const blocked   = onCD || !canAfford;

                return (
                  <motion.div key={drink.id}
                    className={cn("rounded-xl overflow-hidden relative cursor-pointer transition-all", blocked && "opacity-45 cursor-default")}
                    style={{ background: "rgba(8,3,20,0.9)", border: `1px solid ${blocked ? "rgba(80,40,120,0.3)" : drink.glow + "30"}` }}
                    whileHover={!blocked ? { scale: 1.01 } : {}}
                    onClick={() => !blocked && orderDrink(drink)}
                  >
                    {/* Left color accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                      style={{ background: drink.fill, boxShadow: blocked ? "none" : `0 0 6px ${drink.glow}` }} />

                    {/* Hover glow */}
                    {!blocked && (
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
                        style={{ background: `radial-gradient(ellipse at bottom right, ${drink.fill}14, transparent 65%)` }} />
                    )}

                    <div className="flex items-center gap-3 px-4 py-3 pl-5">
                      {/* Emoji */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${drink.fill}18`, border: `1px solid ${drink.fill}40` }}>
                        {drink.emoji}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono font-semibold leading-tight" style={{ color: "#e0d0ff" }}>{drink.name}</div>
                        <div className="text-[11px] italic mt-0.5" style={{ color: "#6040a0" }}>{drink.tagline}</div>
                      </div>

                      {/* Price + status */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                          style={{ background: `${drink.fill}18`, border: `1px solid ${drink.fill}40` }}>
                          <Coins className="w-3 h-3" style={{ color: drink.fill }} />
                          <span className="text-xs font-mono font-semibold" style={{ color: drink.fill }}>{drink.cost}</span>
                        </div>
                        {onCD ? (
                          <div className="w-9 text-center text-xs font-mono tabular-nums" style={{ color: "#604080" }}>{secsLeft}s</div>
                        ) : !canAfford ? (
                          <div className="w-9 text-center text-xs font-mono" style={{ color: "#ff4060" }}>low</div>
                        ) : (
                          <div className="w-9 text-center text-xs font-mono" style={{ color: drink.glow, textShadow: `0 0 6px ${drink.glow}` }}>→</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })}
        <p className="text-[10px] font-mono text-center" style={{ color: "#3a2060" }}>
          90s cooldown per drink · collectibles drop on every order
        </p>
      </div>

      {/* ── Jukebox ── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(6,2,18,0.95)", border: "1px solid rgba(64,216,240,0.2)", boxShadow: "0 0 20px rgba(64,216,240,0.06)" }}>
        <div className="flex items-center gap-2">
          {/* Jukebox icon */}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(64,216,240,0.12)", border: "1px solid rgba(64,216,240,0.3)" }}>
            <Music className="w-3.5 h-3.5" style={{ color: "#40d8f0" }} />
          </div>
          <span className="text-sm font-mono font-semibold" style={{ color: "#40d8f0" }}>Jukebox</span>

          <AnimatePresence>
            {playingTrack && (
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 ml-1">
                {/* Waveform bars */}
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-0.5 rounded-full"
                    style={{ background: "#40d8f0", boxShadow: "0 0 4px #40d8f0" }}
                    animate={{ height: ["4px", "12px", "4px"] }}
                    transition={{ repeat: Infinity, duration: 0.6 + i * 0.15, delay: i * 0.1, ease: "easeInOut" }} />
                ))}
                <span className="text-xs font-mono" style={{ color: "#40d8f0aa" }}>
                  {MUSIC_LABELS[playingTrack] ?? playingTrack}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {playingTrack && (
            <button onClick={() => { stopMusic(); setPlayingTrack(null); }}
              className="ml-auto transition-opacity hover:opacity-60" style={{ color: "#604080" }}>
              <VolumeX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Track grid */}
        <div className="flex flex-wrap gap-2">
          {allTracks.map(id => (
            <motion.button key={id}
              onClick={() => toggleTrack(id)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="text-[11px] font-mono px-3 py-1.5 rounded-full transition-all"
              style={playingTrack === id ? {
                background: "rgba(64,216,240,0.15)",
                border: "1px solid rgba(64,216,240,0.6)",
                color: "#40d8f0",
                boxShadow: "0 0 8px rgba(64,216,240,0.25)",
              } : {
                background: "rgba(20,10,40,0.8)",
                border: "1px solid rgba(80,40,120,0.4)",
                color: "#7050a0",
              }}>
              {MUSIC_LABELS[id] ?? id}
              {playingTrack === id && <Volume2 className="inline w-3 h-3 ml-1.5 opacity-70" />}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
