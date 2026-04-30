import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { isVipUnlocked } from "@/lib/levels";
import { VipToggle } from "@/components/VipToggle";
import { cn } from "@/lib/utils";

type Suit = "S" | "H" | "D" | "C";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
interface Card { suit: Suit; rank: Rank }

const SUITS: Suit[] = ["S", "H", "D", "C"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const SUIT_SYMBOLS: Record<Suit, { symbol: string; color: string }> = {
  S: { symbol: "♠", color: "#1c1917" },
  C: { symbol: "♣", color: "#1c1917" },
  H: { symbol: "♥", color: "#dc2626" },
  D: { symbol: "♦", color: "#dc2626" },
};

function freshDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ suit: s, rank: r });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J") return 10;
  return parseInt(rank, 10);
}

function handTotal(cards: Card[]): number {
  let total = 0; let aces = 0;
  for (const c of cards) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards) === 21;
}

function PlayingCard({ card, hidden, index }: { card?: Card; hidden?: boolean; index: number }) {
  const sym = card ? SUIT_SYMBOLS[card.suit] : null;
  return (
    <motion.div
      initial={{ y: -24, opacity: 0, rotateZ: -5 }}
      animate={{ y: 0, opacity: 1, rotateZ: 0 }}
      transition={{ delay: index * 0.12, duration: 0.35, ease: "easeOut" }}
      className="relative"
      style={{ width: 76, height: 108, perspective: 900, flexShrink: 0 }}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: hidden ? 180 : 0 }}
        transition={{ duration: 0.45, type: "spring", stiffness: 120, damping: 18 }}
        style={{
          transformStyle: "preserve-3d",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl shadow-xl flex flex-col justify-between p-1.5 select-none"
          style={{
            background: "linear-gradient(145deg, #fafafa 0%, #f0f0f0 100%)",
            border: "1px solid rgba(0,0,0,0.15)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {card && sym && (
            <>
              <div
                className="text-xl font-extrabold leading-none"
                style={{ color: sym.color }}
              >
                {card.rank}
                <span className="text-sm ml-0.5">{sym.symbol}</span>
              </div>
              <div className="flex items-center justify-center" style={{ fontSize: "2rem", lineHeight: 1 }}>
                <span style={{ color: sym.color }}>{sym.symbol}</span>
              </div>
              <div
                className="text-xl font-extrabold leading-none self-end rotate-180"
                style={{ color: sym.color }}
              >
                {card.rank}
                <span className="text-sm ml-0.5">{sym.symbol}</span>
              </div>
            </>
          )}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl shadow-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f2240 100%)",
            border: "2px solid rgba(212,175,55,0.5)",
          }}
        >
          {/* Diamond pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(212,175,55,0.08) 0px, rgba(212,175,55,0.08) 4px, transparent 4px, transparent 12px), repeating-linear-gradient(-45deg, rgba(212,175,55,0.08) 0px, rgba(212,175,55,0.08) 4px, transparent 4px, transparent 12px)",
            }}
          />
          <div className="absolute inset-2 rounded-lg border border-amber-400/30 flex items-center justify-center">
            <div className="text-amber-400/60 text-2xl">♠</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

type GamePhase = "betting" | "playing" | "dealer" | "done";

export default function Blackjack() {
  const { balance, placeBet, stats } = useCasinoStore();
  const [bet, setBet] = useState(25);
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<GamePhase>("betting");
  const [message, setMessage] = useState<string>("");
  const [outcome, setOutcome] = useState<"win" | "lose" | "push" | "blackjack" | null>(null);
  const [hasDoubled, setHasDoubled] = useState(false);
  const [activeBet, setActiveBet] = useState(0);
  const vipUnlocked = isVipUnlocked("blackjack", stats.handsPlayed);
  const [isVip, setIsVip] = useState(false);
  const effectiveVip = isVip && vipUnlocked;
  const maxBet = effectiveVip ? 1000 : 500;

  const playerTotal = handTotal(player);
  const dealerTotal = handTotal(dealer);

  const dealNew = () => {
    if (balance < bet) return;
    const d = freshDeck();
    const p: Card[] = [d.pop()!, d.pop()!];
    const dl: Card[] = [d.pop()!, d.pop()!];
    setDeck(d); setPlayer(p); setDealer(dl);
    setHasDoubled(false); setActiveBet(bet);
    setMessage(""); setOutcome(null);

    const playerBJ = isBlackjack(p);
    const dealerBJ = isBlackjack(dl);
    if (playerBJ || dealerBJ) {
      setPhase("done");
      setTimeout(() => resolve(p, dl, bet, false, playerBJ, dealerBJ), 800);
    } else {
      setPhase("playing");
    }
  };

  const hit = () => {
    const d = [...deck];
    const newPlayer = [...player, d.pop()!];
    setDeck(d); setPlayer(newPlayer);
    if (handTotal(newPlayer) >= 21) {
      setPhase("dealer");
      setTimeout(() => playDealer(d, newPlayer, activeBet, hasDoubled), 600);
    }
  };

  const stand = () => {
    setPhase("dealer");
    setTimeout(() => playDealer(deck, player, activeBet, hasDoubled), 400);
  };

  const double = () => {
    if (balance < activeBet) return;
    const d = [...deck];
    const newPlayer = [...player, d.pop()!];
    const newBet = activeBet * 2;
    setDeck(d); setPlayer(newPlayer);
    setActiveBet(newBet); setHasDoubled(true);
    setPhase("dealer");
    setTimeout(() => playDealer(d, newPlayer, newBet, true), 600);
  };

  const playDealer = (
    currentDeck: Card[],
    playerHand: Card[],
    finalBet: number,
    doubled: boolean,
  ) => {
    const d = [...currentDeck];
    let dealerHand = [...dealer];
    const playerBust = handTotal(playerHand) > 21;
    if (!playerBust) {
      while (handTotal(dealerHand) < 17) {
        dealerHand = [...dealerHand, d.pop()!];
      }
    }
    setDeck(d); setDealer(dealerHand);
    setPhase("done");
    setTimeout(() => resolve(playerHand, dealerHand, finalBet, doubled, false, false), 600);
  };

  const resolve = (
    p: Card[],
    dl: Card[],
    finalBet: number,
    _doubled: boolean,
    playerBJ: boolean,
    dealerBJ: boolean,
  ) => {
    const pTotal = handTotal(p);
    const dTotal = handTotal(dl);
    let payout = 0;
    let msg = "";
    let out: "win" | "lose" | "push" | "blackjack" = "lose";

    if (playerBJ && dealerBJ) {
      payout = finalBet; msg = "Push — both dealt blackjack."; out = "push";
    } else if (playerBJ) {
      payout = effectiveVip ? finalBet * 3 : Math.floor(finalBet * 2.5);
      msg = effectiveVip ? "♠ Blackjack! Pays 2 to 1." : "♠ Blackjack! Pays 3 to 2.";
      out = "blackjack";
    } else if (dealerBJ) {
      payout = 0; msg = "Dealer blackjack."; out = "lose";
    } else if (pTotal > 21) {
      payout = 0; msg = `Bust at ${pTotal}.`; out = "lose";
    } else if (dTotal > 21) {
      payout = finalBet * 2; msg = `Dealer busts at ${dTotal}. You win!`; out = "win";
    } else if (pTotal > dTotal) {
      payout = finalBet * 2; msg = `You win — ${pTotal} vs ${dTotal}.`; out = "win";
    } else if (pTotal < dTotal) {
      payout = 0; msg = `Dealer wins — ${dTotal} vs ${pTotal}.`; out = "lose";
    } else {
      payout = finalBet; msg = `Push at ${pTotal}.`; out = "push";
    }

    setMessage(msg);
    setOutcome(out);
    placeBet("blackjack", finalBet, payout, playerBJ && !dealerBJ ? { special: "natural" } : undefined);
  };

  const reset = () => {
    setPlayer([]); setDealer([]);
    setPhase("betting"); setMessage(""); setOutcome(null);
  };

  const canDouble = phase === "playing" && player.length === 2 && balance >= activeBet;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Single Deck · Dealer Stands on 17 · BJ pays {effectiveVip ? "2:1" : "3:2"}
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Blackjack</h1>
        <div className="flex justify-center">
          <VipToggle game="blackjack" isVip={isVip} onChange={setIsVip} disabled={phase !== "betting"} />
        </div>
      </div>

      {/* Felt */}
      <div
        className="rounded-3xl border-2 border-primary/20 p-6 sm:p-10 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at center, hsl(162 67% 22%) 0%, hsl(162 67% 12%) 100%)",
          boxShadow: "inset 0 4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Dealer */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs uppercase tracking-wider text-emerald-100/70">Dealer</div>
            {dealer.length > 0 && (
              <div className="font-mono text-emerald-100 text-lg tabular-nums">
                {phase === "playing" ? "?" : dealerTotal}
              </div>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap min-h-28">
            <AnimatePresence>
              {dealer.map((c, i) => (
                <PlayingCard
                  key={`d-${i}-${c.suit}-${c.rank}`}
                  card={c}
                  hidden={phase === "playing" && i === 1}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center message area */}
        <div className="h-20 flex items-center justify-center relative">
          <AnimatePresence mode="wait">
            {outcome === "blackjack" && (
              <motion.div
                key="bj"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 12 }}
                className="text-center"
              >
                <div className="text-5xl mb-1">🃏</div>
                <div
                  className="font-serif text-4xl font-bold"
                  style={{ color: "#ffd700", textShadow: "0 0 20px #ffd700" }}
                >
                  BLACKJACK!
                </div>
              </motion.div>
            )}
            {outcome && outcome !== "blackjack" && message && (
              <motion.div
                key="msg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "font-serif text-2xl text-center px-4",
                  outcome === "win" && "text-emerald-300",
                  outcome === "lose" && "text-rose-300",
                  outcome === "push" && "text-amber-200",
                )}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs uppercase tracking-wider text-emerald-100/70">You</div>
            {player.length > 0 && (
              <div
                className={cn(
                  "font-mono text-lg tabular-nums",
                  playerTotal > 21 ? "text-rose-400" : "text-emerald-100",
                )}
              >
                {playerTotal}
                {playerTotal > 21 && " — BUST"}
              </div>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap min-h-28">
            <AnimatePresence>
              {player.map((c, i) => (
                <PlayingCard
                  key={`p-${i}-${c.suit}-${c.rank}`}
                  card={c}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Controls */}
      {phase === "betting" ? (
        <div className="space-y-4 casino-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Bet</div>
            <div className="font-mono text-2xl text-primary tabular-nums">{bet}</div>
          </div>
          <Slider
            value={[bet]}
            min={1}
            max={Math.max(1, Math.min(maxBet, balance))}
            step={1}
            onValueChange={(v) => setBet(v[0])}
            disabled={balance === 0}
          />
          <div className="flex gap-2">
            {(effectiveVip ? [50, 100, 250, 500] : [10, 25, 50, 100]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant="outline"
                disabled={p > balance}
                onClick={() => setBet(p)}
                className="flex-1 border-primary/30"
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            size="lg"
            disabled={balance < bet}
            onClick={dealNew}
            className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
          >
            <Coins className="w-5 h-5 mr-2" />
            {balance < bet ? "Insufficient Chips" : "🃏 Deal"}
          </Button>
        </div>
      ) : phase === "playing" ? (
        <div className="grid grid-cols-3 gap-3">
          <Button
            size="lg"
            onClick={hit}
            className="h-14 font-serif bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-600"
          >
            Hit
          </Button>
          <Button
            size="lg"
            onClick={stand}
            variant="secondary"
            className="h-14 font-serif"
          >
            Stand
          </Button>
          <Button
            size="lg"
            onClick={double}
            disabled={!canDouble}
            variant="outline"
            className="h-14 font-serif border-primary/40"
          >
            Double
          </Button>
        </div>
      ) : phase === "done" ? (
        <Button
          size="lg"
          onClick={reset}
          className="w-full h-14 text-lg font-serif bg-gradient-to-b from-primary to-primary/80 text-primary-foreground"
        >
          Next Hand
        </Button>
      ) : (
        <div className="text-center text-muted-foreground py-4 italic">
          Dealer is playing...
        </div>
      )}
    </div>
  );
}
