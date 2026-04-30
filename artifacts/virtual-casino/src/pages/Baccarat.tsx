import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { useRegisterPlayAgain } from "@/lib/playAgain";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type Suit = "♠" | "♥" | "♦" | "♣";
type Card = { rank: string; suit: Suit; value: number };

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS = [
  { r: "A", v: 1 },
  { r: "2", v: 2 },
  { r: "3", v: 3 },
  { r: "4", v: 4 },
  { r: "5", v: 5 },
  { r: "6", v: 6 },
  { r: "7", v: 7 },
  { r: "8", v: 8 },
  { r: "9", v: 9 },
  { r: "10", v: 0 },
  { r: "J", v: 0 },
  { r: "Q", v: 0 },
  { r: "K", v: 0 },
];

function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS)
    for (const r of RANKS) deck.push({ rank: r.r, suit: s, value: r.v });
  return deck;
}

function shuffled(deck: Card[]): Card[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function score(cards: Card[]): number {
  return cards.reduce((s, c) => s + c.value, 0) % 10;
}

type Side = "player" | "banker" | "tie";

const PAYOUTS: Record<Side, number> = {
  player: 2, // 1:1 → return 2x stake on win
  banker: 1.95, // 1:1 minus 5% commission
  tie: 9, // 8:1 → return 9x stake on win
};

const CHIP_VALUES = [10, 25, 100, 500];

export default function Baccarat() {
  const { balance, placeBet } = useCasinoStore();
  const [bets, setBets] = useState<Record<Side, number>>({
    player: 0,
    banker: 0,
    tie: 0,
  });
  const lastBetsRef = useRef<Record<Side, number>>({
    player: 0,
    banker: 0,
    tie: 0,
  });
  const [chip, setChip] = useState(25);
  const [dealing, setDealing] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [winner, setWinner] = useState<Side | null>(null);

  const totalBet = bets.player + bets.banker + bets.tie;

  const place = (side: Side) => {
    if (dealing) return;
    if (balance < totalBet + chip) return;
    playSound("chip");
    setBets((b) => ({ ...b, [side]: b[side] + chip }));
    setWinner(null);
  };

  const clear = () => {
    if (dealing) return;
    setBets({ player: 0, banker: 0, tie: 0 });
    setWinner(null);
  };

  const runDeal = (currentBets: Record<Side, number>) => {
    const total = currentBets.player + currentBets.banker + currentBets.tie;
    if (dealing || total === 0 || balance < total) return;
    setDealing(true);
    setWinner(null);
    setPlayerCards([]);
    setBankerCards([]);

    const deck = shuffled(newDeck());
    let idx = 0;

    // Initial 2-card deal alternating
    const p1 = deck[idx++];
    const b1 = deck[idx++];
    const p2 = deck[idx++];
    const b2 = deck[idx++];

    let pHand = [p1, p2];
    let bHand = [b1, b2];

    const pTotal = score(pHand);
    const bTotal = score(bHand);

    let p3: Card | null = null;
    let b3: Card | null = null;

    // Naturals: any 8 or 9 in initial hands → no draws
    const natural = pTotal >= 8 || bTotal >= 8;
    if (!natural) {
      // Player draws on 0-5, stands on 6-7
      if (pTotal <= 5) {
        p3 = deck[idx++];
        pHand = [...pHand, p3];
      }
      // Banker rules (simplified standard table)
      const pThird = p3 ? p3.value : null;
      const bDraws = (() => {
        if (pThird === null) return bTotal <= 5; // player stood
        if (bTotal <= 2) return true;
        if (bTotal === 3) return pThird !== 8;
        if (bTotal === 4) return pThird >= 2 && pThird <= 7;
        if (bTotal === 5) return pThird >= 4 && pThird <= 7;
        if (bTotal === 6) return pThird === 6 || pThird === 7;
        return false;
      })();
      if (bDraws) {
        b3 = deck[idx++];
        bHand = [...bHand, b3];
      }
    }

    // Sound staggering
    playSound("cardDeal");
    setTimeout(() => {
      setPlayerCards([p1]);
      playSound("cardDeal");
    }, 120);
    setTimeout(() => {
      setBankerCards([b1]);
      playSound("cardDeal");
    }, 380);
    setTimeout(() => {
      setPlayerCards([p1, p2]);
      playSound("cardDeal");
    }, 640);
    setTimeout(() => {
      setBankerCards([b1, b2]);
    }, 900);

    let resolveAt = 1500;
    if (p3) {
      const t = resolveAt;
      setTimeout(() => {
        setPlayerCards([p1, p2, p3 as Card]);
        playSound("cardDeal");
      }, t);
      resolveAt += 500;
    }
    if (b3) {
      const t = resolveAt;
      setTimeout(() => {
        setBankerCards([b1, b2, b3 as Card]);
        playSound("cardDeal");
      }, t);
      resolveAt += 500;
    }

    setTimeout(() => {
      const ps = score(pHand);
      const bs = score(bHand);
      const result: Side = ps > bs ? "player" : bs > ps ? "banker" : "tie";
      setWinner(result);

      const wager = total;
      let returned = 0;
      // Winners get back stake on the winning side. Tie pushes player/banker.
      if (result === "tie") {
        returned += currentBets.tie * PAYOUTS.tie;
        returned += currentBets.player; // push
        returned += currentBets.banker; // push
      } else {
        returned += currentBets[result] * PAYOUTS[result];
      }
      placeBet("baccarat", wager, Math.floor(returned), {
        special: result === "tie" ? "baccarat-tie" : `baccarat-${result}`,
      });
      lastBetsRef.current = { ...currentBets };
      setBets({ player: 0, banker: 0, tie: 0 });
      setDealing(false);
    }, resolveAt + 200);
  };

  const replayCost =
    lastBetsRef.current.player +
    lastBetsRef.current.banker +
    lastBetsRef.current.tie;

  useRegisterPlayAgain(
    !dealing && winner !== null && replayCost > 0
      ? {
          label: `Replay (${replayCost})`,
          onClick: () => {
            setBets({ ...lastBetsRef.current });
            runDeal({ ...lastBetsRef.current });
          },
          disabled: balance < replayCost || totalBet > 0,
        }
      : null,
    [dealing, winner, replayCost, balance, totalBet],
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          Punto Banco · Player 1:1 · Banker 1:1 −5% · Tie 8:1
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">Baccarat</h1>
      </div>

      {/* Felt */}
      <div
        className="relative rounded-2xl border-2 border-primary/20 p-5 sm:p-7"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(162 67% 22%) 0%, hsl(162 67% 12%) 80%)",
        }}
      >
        <div className="absolute inset-x-0 top-2 text-center text-[10px] uppercase tracking-[0.4em] text-amber-200/40">
          Lucky Vault · Baccarat
        </div>

        {/* Hands */}
        <div className="grid grid-cols-2 gap-6 mb-6 mt-4">
          <Hand
            label="Player"
            cards={playerCards}
            highlight={winner === "player"}
            score={playerCards.length ? score(playerCards) : null}
          />
          <Hand
            label="Banker"
            cards={bankerCards}
            highlight={winner === "banker"}
            score={bankerCards.length ? score(bankerCards) : null}
          />
        </div>

        {/* Tie/winner banner */}
        <AnimatePresence>
          {winner && !dealing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mb-4"
            >
              <div
                className={cn(
                  "inline-block px-5 py-1.5 rounded-full font-serif text-lg border-2",
                  winner === "player" && "border-blue-400 text-blue-200 bg-blue-500/15",
                  winner === "banker" && "border-rose-400 text-rose-200 bg-rose-500/15",
                  winner === "tie" && "border-amber-300 text-amber-100 bg-amber-500/20",
                )}
              >
                {winner === "tie" ? "Tie" : `${winner === "player" ? "Player" : "Banker"} wins`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet boxes */}
        <div className="grid grid-cols-3 gap-3">
          <BetBox
            label="Player"
            sub="1 : 1"
            color="blue"
            amount={bets.player}
            highlight={winner === "player"}
            onClick={() => place("player")}
          />
          <BetBox
            label="Tie"
            sub="8 : 1"
            color="amber"
            amount={bets.tie}
            highlight={winner === "tie"}
            onClick={() => place("tie")}
          />
          <BetBox
            label="Banker"
            sub="1 : 1 −5%"
            color="rose"
            amount={bets.banker}
            highlight={winner === "banker"}
            onClick={() => place("banker")}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="casino-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Chip Value</div>
          <div className="text-sm text-muted-foreground">
            On Table: <span className="font-mono text-primary">{totalBet}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          {CHIP_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => setChip(v)}
              className={cn(
                "w-12 h-12 rounded-full border-2 border-dashed font-bold text-sm shadow-lg bg-gradient-to-br transition-all",
                v === 10 && "from-blue-600 to-blue-800 border-blue-300 text-white",
                v === 25 && "from-emerald-600 to-emerald-800 border-emerald-300 text-white",
                v === 100 && "from-zinc-100 to-zinc-300 border-zinc-400 text-zinc-900",
                v === 500 && "from-purple-600 to-purple-900 border-purple-300 text-white",
                chip === v ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={clear}
            disabled={dealing || totalBet === 0}
            className="border-primary/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            size="lg"
            onClick={() => runDeal(bets)}
            disabled={dealing || totalBet === 0 || balance < totalBet}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            <Coins className="w-4 h-4 mr-2" />
            Deal ({totalBet})
          </Button>
        </div>
      </div>
    </div>
  );
}

function Hand({
  label,
  cards,
  highlight,
  score: total,
}: {
  label: string;
  cards: Card[];
  highlight: boolean;
  score: number | null;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-colors",
        highlight ? "border-amber-300 bg-amber-500/10" : "border-emerald-900/40 bg-black/20",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-emerald-100/80">
          {label}
        </div>
        {total !== null && (
          <div className="font-mono text-lg font-bold tabular-nums text-amber-200">
            {total}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 min-h-[88px]">
        <AnimatePresence>
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ y: -30, opacity: 0, rotate: -8 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "w-14 h-20 rounded-md bg-gradient-to-b from-zinc-100 to-zinc-300 border border-zinc-400 shadow-md flex flex-col items-center justify-center",
                (c.suit === "♥" || c.suit === "♦") ? "text-rose-700" : "text-zinc-900",
              )}
            >
              <div className="text-lg font-bold leading-none">{c.rank}</div>
              <div className="text-2xl leading-none">{c.suit}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BetBox({
  label,
  sub,
  color,
  amount,
  highlight,
  onClick,
}: {
  label: string;
  sub: string;
  color: "blue" | "rose" | "amber";
  amount: number;
  highlight: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border-2 p-4 text-center transition-all hover:brightness-125 active:scale-95",
        color === "blue" && "border-blue-400/60 bg-blue-500/15",
        color === "rose" && "border-rose-400/60 bg-rose-500/15",
        color === "amber" && "border-amber-300/60 bg-amber-500/15",
        highlight && "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-950",
      )}
    >
      <div className="font-serif text-xl">{label}</div>
      <div className="text-[11px] uppercase tracking-wider opacity-80">
        {sub}
      </div>
      {amount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 min-w-7 h-7 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg border border-primary/40"
        >
          {amount}
        </motion.div>
      )}
    </button>
  );
}
