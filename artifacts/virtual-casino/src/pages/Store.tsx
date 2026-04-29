import { motion } from "framer-motion";
import { Coins, ShoppingBag, Sparkles, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCasinoStore } from "@/lib/store";
import { SHOP_ITEMS, type ShopItem } from "@/lib/shopItems";
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
          <div className="text-sm font-semibold truncate">
            {activeBoost.name} active
          </div>
          <div className="text-xs text-emerald-200/80">
            +{pct}% on the next {activeBoost.usesLeft} winning bet
            {activeBoost.usesLeft === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: ShopItem }) {
  const { balance, inventory, purchaseItem, activateItem, activeBoost } =
    useCasinoStore();
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
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-background/60 border border-primary/30 flex items-center justify-center shrink-0",
          )}
        >
          <Icon className={cn("w-6 h-6", item.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-lg leading-tight">
              {item.name}
            </span>
            {owned > 0 && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold">
                {owned} owned
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground italic mt-0.5">
            {item.flavor}
          </div>
        </div>
      </div>
      <div className="relative text-sm text-foreground/90 mb-4">
        {item.description}
      </div>
      <div className="relative mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-background/60">
          <Coins className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono font-semibold tabular-nums text-sm">
            {item.price}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {owned > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                activateItem({
                  id: item.id,
                  name: item.name,
                  multiplier: item.multiplier,
                  uses: item.uses,
                })
              }
              className="border-emerald-400/40 text-emerald-200 hover:bg-emerald-400/10"
            >
              Use
            </Button>
          )}
          <Button
            size="sm"
            onClick={() =>
              purchaseItem({
                id: item.id,
                name: item.name,
                price: item.price,
              })
            }
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

export default function Store() {
  const { balance, inventory } = useCasinoStore();
  const drinks = SHOP_ITEMS.filter((i) => i.category === "drink");
  const charms = SHOP_ITEMS.filter((i) => i.category === "charm");
  const totalOwned = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <section className="text-center space-y-2 pt-2">
        <div className="text-xs uppercase tracking-[0.3em] text-primary/70">
          The Vault Store
        </div>
        <h1 className="font-serif text-4xl casino-gradient-text">
          Spend a few chips on something nice
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Drinks and charms grant a multiplier on your next winning bet.
          Mixing them yourself at the bar is free — but you'll have to earn it.
        </p>
      </section>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">
            {totalOwned} item{totalOwned === 1 ? "" : "s"} on your tab ·
          </span>
          <span className="font-mono font-semibold">
            {balance.toLocaleString()}
          </span>
          <Coins className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      <ActiveBoostStrip />

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Wine className="w-5 h-5 text-primary" />
            Cocktails
          </h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Single-use buffs
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {drinks.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Charms
          </h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Multi-bet buffs
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {charms.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
