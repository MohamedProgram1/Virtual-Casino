import { motion } from "framer-motion";
import { Coins, ShoppingBag, Sparkles, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { SHOP_ITEMS, type ShopItem } from "@/lib/shopItems";
import {
  COLLECTIBLES,
  type Collectible,
  RARITY_COLOR,
  RARITY_LABEL,
  RARITY_BORDER,
} from "@/lib/collectibles";
import { cn } from "@/lib/utils";

function ActiveBoostStrip() {
  const { activeBoost } = useCasinoStore();
  if (!activeBoost) return null;
  const pct = Math.round((activeBoost.multiplier - 1) * 100);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent">
      <div className="flex items-center gap-3 min-w-0">
        <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{activeBoost.name} active</div>
          <div className="text-xs text-emerald-200/80">
            +{pct}% on the next {activeBoost.usesLeft} winning bet
            {activeBoost.usesLeft === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoostItemCard({ item }: { item: ShopItem }) {
  const { balance, inventory, purchaseItem, activateItem, activeBoost } = useCasinoStore();
  const owned = inventory[item.id] ?? 0;
  const canAfford = balance >= item.price;
  const Icon = item.icon;
  const isActive = activeBoost?.itemId === item.id;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={cn(
        "casino-card p-5 relative overflow-hidden flex flex-col",
        isActive && "border-emerald-400/40",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none opacity-60",
          item.accent,
        )}
      />
      <div className="relative flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-background/60 border border-primary/30 flex items-center justify-center shrink-0">
          <Icon className={cn("w-6 h-6", item.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-lg leading-tight">{item.name}</span>
            {owned > 0 && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold">
                {owned} owned
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground italic mt-0.5">{item.flavor}</div>
        </div>
      </div>
      <div className="relative text-sm text-foreground/90 mb-4">{item.description}</div>
      <div className="relative mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-background/60">
          <Coins className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono font-semibold tabular-nums text-sm">{item.price}</span>
        </div>
        <div className="flex items-center gap-2">
          {owned > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => activateItem({ id: item.id, name: item.name, multiplier: item.multiplier, uses: item.uses })}
              className="border-emerald-400/40 text-emerald-200 hover:bg-emerald-400/10"
            >
              Use
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => purchaseItem({ id: item.id, name: item.name, price: item.price })}
            disabled={!canAfford}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Buy
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CollectibleCard({ item }: { item: Collectible }) {
  const { balance, collectibles, purchaseCollectible } = useCasinoStore();
  const owned = collectibles[item.id] ?? 0;
  const canAfford = item.buyPrice !== null && balance >= item.buyPrice;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={cn(
        "casino-card p-5 relative overflow-hidden flex flex-col",
        RARITY_BORDER[item.rarity],
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 to-zinc-950/20 pointer-events-none" />
      <div className="relative flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-background/60 border border-primary/20 flex items-center justify-center shrink-0 text-2xl">
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-lg leading-tight">{item.name}</span>
            {owned > 0 && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold">
                {owned} owned
              </span>
            )}
          </div>
          <div className={cn("text-xs font-semibold mt-0.5", RARITY_COLOR[item.rarity])}>
            {RARITY_LABEL[item.rarity]}
          </div>
        </div>
      </div>
      <div className="relative text-sm text-foreground/80 italic mb-3">{item.description}</div>
      <div className="relative flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Pawn value:</span>
        <span className="text-xs font-mono font-semibold text-amber-300">
          {item.pawnValue} chips
        </span>
      </div>
      <div className="relative mt-auto flex items-center justify-between gap-3">
        {item.buyPrice !== null ? (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-background/60">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono font-semibold tabular-nums text-sm">{item.buyPrice}</span>
            </div>
            <Button
              size="sm"
              onClick={() => purchaseCollectible(item.id, item.name, item.buyPrice!)}
              disabled={!canAfford}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Buy
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground italic">Earn-only — found in big wins &amp; at the bar</span>
        )}
      </div>
    </motion.div>
  );
}

export default function Store() {
  const { balance, inventory, collectibles: ownedCollectibles } = useCasinoStore();
  const charms = SHOP_ITEMS.filter((i) => i.category === "charm");
  const tokens = SHOP_ITEMS.filter((i) => i.category === "token");
  const buyableCollectibles = COLLECTIBLES.filter((c) => c.buyPrice !== null);
  const earnOnlyCollectibles = COLLECTIBLES.filter((c) => c.buyPrice === null);

  const totalBoostOwned = Object.values(inventory).reduce((a, b) => a + b, 0);
  const totalCollectiblesOwned = Object.values(ownedCollectibles).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <section className="text-center space-y-2 pt-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">The Vault Store</div>
        <h1 className="font-serif text-4xl casino-gradient-text">Spend wisely. Win bigger.</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Charms and tokens boost your winnings. Collectibles can be pawned at the Loan Shark —
          or earned from big wins and the bar minigame.
        </p>
      </section>

      <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">
            {totalBoostOwned} boost{totalBoostOwned === 1 ? "" : "s"} ·{" "}
          </span>
          <Package className="w-4 h-4 text-amber-300" />
          <span className="text-muted-foreground">
            {totalCollectiblesOwned} collectible{totalCollectiblesOwned === 1 ? "" : "s"} ·{" "}
          </span>
          <span className="font-mono font-semibold">{balance.toLocaleString()}</span>
          <Coins className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      <ActiveBoostStrip />

      {/* Collectibles for sale */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-300" />
            Collectibles
          </h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Buy &amp; pawn for profit
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {buyableCollectibles.map((item) => (
            <CollectibleCard key={item.id} item={item} />
          ))}
        </div>
        {earnOnlyCollectibles.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Earn-only rarities (found in big wins &amp; bar minigame)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {earnOnlyCollectibles.map((item) => (
                <CollectibleCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Lucky Charms */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Lucky Charms &amp; Tokens
          </h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Win multipliers
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...charms, ...tokens].map((item) => (
            <BoostItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
