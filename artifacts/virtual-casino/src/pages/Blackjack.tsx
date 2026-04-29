import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spade, Heart, Diamond, Club, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCasinoStore } from "@/lib/store";
import { isVipUnlocked } from "@/lib/levels";
import { VipToggle } from "@/components/VipToggle";
import { cn } from "@/lib/utils";

type Suit = "S" | "H" | "D" | "C";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
interface Card {
  suit: Suit;
  rank: Rank;
}

const SUITS: Suit[] = ["S", "H", "D", "C"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

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
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards) === 21;
}

const SUIT_INFO: Record<Suit, { Icon: typeof Spade; color: string }> = {
  S: { Icon: Spade, color: "text-foreground" },
  C: { Icon: Club, color: "text-foreground" },
  H: { Icon: Heart, color: "text-rose-500" },
  D: { Icon: Diamond, color: "text-rose-500" },
};

function PlayingCard({ card, hidden, index }: { card?: Card; hidden?: boolean; index: number }) {
  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.12, duration: 0.3, ease: "easeOut" }}
      className="relative w-20 h-28 sm:w-24 sm:h-32"
      style={{ perspective: 800 }}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: hidden ? 180 : 0 }}
        transition={{ duration: 0.45, type: "spring", stiffness: 110, damping: 16 }}
        style={{
          transformStyle: "preserve-3d",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-lg bg-gradient-to-b from-zinc-50 to-zinc-200 shadow-xl border border-zinc-300 p-2 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {card && (() => {
            const { Icon, color } = SUIT_INFO[card.suit];
            return (
              <>
                <div className={cn("text-lg font-bold leading-none", color)}>{card.rank}</div>
                <div className="self-center">
                  <Icon className={cn("w-8 h-8", color)} fill="currentColor" />
                </div>
                <div className={cn("text-lg font-bold leading-none self-end rotate-180", color)}>
                  {card.rank}
                </div>
              </>
            );
          })()}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-lg border border-primary/30 shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background:
              "repeating-linear-gradient(45deg, hsl(348 68% 18%), hsl(348 68% 18%) 8px, hsl(0 0% 7%) 8px, hsl(0 0% 7%) 16px)",
          }}
        >
          <div className="absolute inset-2 rounded border border-primary/40 flex items-center justify-center">
            <Spade className="w-8 h-8 text-primary/60" fill="currentColor" />
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
    setDeck(d);
    setPlayer(p);
    setDealer(dl);
    setHasDoubled(false);
    setActiveBet(bet);
    setMessage("");

    // Check for naturals
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
    setDeck(d);
    setPlayer(newPlayer);
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
    setDeck(d);
    setPlayer(newPlayer);
    setActiveBet(newBet);
    setHasDoubled(true);
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
      // Dealer hits to 17 (stands on all 17 including soft)
      while (handTotal(dealerHand) < 17) {
        dealerHand = [...dealerHand, d.pop()!];
      }
    }
    setDeck(d);
    setDealer(dealerHand);
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

    if (playerBJ && dealerBJ) {
      payout = finalBet; // push
      msg = "Push. Both natural blackjack.";
    } else if (playerBJ) {
      // Standard: pays 3:2 (returns 2.5x stake). VIP: pays 2:1 (returns 3x stake).
      payout = effectiveVip ? finalBet * 3 : Math.floor(finalBet * 2.5);
      msg = effectiveVip ? "Blackjack! Pays 2 to 1." : "Blackjack! Pays 3 to 2.";
    } else if (dealerBJ) {
      payout = 0;
      msg = "Dealer blackjack.";
    } else if (pTotal > 21) {
      payout = 0;
      msg = "Bust.";
    } else if (dTotal > 21) {
      payout = finalBet * 2;
      msg = "Dealer busts. You win.";
    } else if (pTotal > dTotal) {
      payout = finalBet * 2;
      msg = `You win, ${pTotal} over ${dTotal}.`;
    } else if (pTotal < dTotal) {
      payout = 0;
      msg = `Dealer wins, ${dTotal} over ${pTotal}.`;
    } else {
      payout = finalBet;
      msg = `Push at ${pTotal}.`;
    }

    setMessage(msg);
    const meta =
      playerBJ && !dealerBJ ? { special: "natural" } : undefined;
    placeBet("blackjack", finalBet, payout, meta);
  };

  const reset = () => {
    setPlayer([]);
    setDealer([]);
    setPhase("betting");
    setMessage("");
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
          <VipToggle
            game="blackjack"
            isVip={isVip}
            onChange={setIsVip}
            disabled={phase !== "betting"}
          />
        </div>
      </div>

      {/* Felt */}
      <div
        className="rounded-3xl border-2 border-primary/20 p-6 sm:p-10 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(162 67% 22%) 0%, hsl(162 67% 12%) 100%)",
          boxShadow:
            "inset 0 4px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Dealer */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs uppercase tracking-wider text-emerald-100/70">Dealer</div>
            {dealer.length > 0 && (
              <div className="font-mono text-emerald-100 text-lg tabular-nums">
                {phase === "playing" ? "?" : dealerTotal}
              </div>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 min-h-32">
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

        {/* Center message */}
        <div className="h-16 flex items-center justify-center">
          {message && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-serif text-2xl text-amber-100 text-center"
            >
              {message}
            </motion.div>
          )}
        </div>

        {/* Player */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs uppercase tracking-wider text-emerald-100/70">You</div>
            {player.length > 0 && (
              <div className="font-mono text-emerald-100 text-lg tabular-nums">
                {playerTotal}
              </div>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 min-h-32">
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
            {balance < bet ? "Insufficient Chips" : "Deal"}
          </Button>
        </div>
      ) : phase === "playing" ? (
        <div className="grid grid-cols-3 gap-3">
          <Button size="lg" onClick={hit} className="h-14 font-serif">
            Hit
          </Button>
          <Button size="lg" onClick={stand} variant="secondary" className="h-14 font-serif">
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
        <div className="text-center text-muted-foreground py-4 italic">Dealer is playing...</div>
      )}
    </div>
  );
}
