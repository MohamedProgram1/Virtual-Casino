# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

- **virtual-casino** (`/`) — Lucky Vault, a frontend-only virtual casino with seventeen games (slots, blackjack, roulette, over/under dice, plinko, mines, crash, wheel of fortune, hi-lo, keno, coin flip, scratch card, **baccarat (Punto Banco), 5-card video poker, pachinko**, plus owner-only "Owner's Vault" and "Owner's Safe" combo crack), a **Loan Shark / Pawn Shop** (`/loan-shark`), Web Audio sound effects (toggleable from Settings, `src/lib/sounds.ts`), and 3D presentation on the Roulette wheel, Wheel of Fortune, and Dice cube. All 12 public games have been fully redesigned: Slots = Irish "Clover Reels" with 5×3 animated emoji reels; Dice = SVG dot-face die with animated rolling, color-coded direction bar; Mines = emoji 💎/💣/💥 tiles on dark grid; Wheel = 20-segment vibrant wheel with emoji labels (bust/1×/1.5×/2×/3×/5×/10×), gold pointer + clacker; CoinFlip = 3D flip coin with Irish 🍀 heads / 🏆 tails, confetti on win; Blackjack = card suit symbols ♠♥♦♣, navy diamond-pattern card back, animated BLACKJACK! overlay; Plinko = glowing gold pegs, colored balls, colorful slot labels; Keno = animated ball pop with Quick Pick button, highlighted paytable on win; HiLo = playing card on green felt, rank scale sidebar, trail of past cards; CoinFlip = streak emoji bar. plus two non-game features: **The Bar** (`/bar`) and **The Vault Store** (`/store`). Uses no real money. State (balance, history, stats, settings, achievements, daily challenges, owner mode, **inventory, activeBoost, bar stats**) persists to `localStorage` under `lucky_vault_casino_state` via `src/lib/store.tsx` (with a `migrate()` for forward-compat). Pages live in `src/pages/`, layout in `src/components/layout/Layout.tsx`. Shared game metadata (labels, routes, icons) is in `src/lib/games.ts`. The level system (`src/lib/levels.ts`) has 7 tiers, ranks by lifetime `handsPlayed`, and gates VIP variants of the four classic games via `VIP_UNLOCKS` (Partial). Achievements (`src/lib/achievements.ts`, 28 total including legendary "The Owner") are checked inside `placeBet` from a `BetMeta` payload (multiplier, special tags like `"natural"`/`"roulette-straight"`/`"mines-cleared"`/`"slots-jackpot"`, hits, streak, cashOutAt). The equipped title shows in the top bar. Daily challenges (`src/lib/dailyChallenges.ts`) deterministically pick 3 from a 17-template pool per ISO date and auto-credit chip rewards on completion. Owner mode is unlocked from Settings with a code (`MOMA20100711`), which surfaces the Owner's Vault game card in the lobby and can be re-locked from the same panel. The Owner's Vault is a 5-vault pick game with two zero-payout duds — slight positive expected value but with real loss risk so it cannot be farmed for infinite chips. A floating "Play Again" button appears anywhere a round is settled, wired through `src/lib/playAgain.tsx` (`PlayAgainProvider` + `useRegisterPlayAgain(slot, deps)`). The **Boost system** (`activeBoost: { itemId, name, multiplier, usesLeft } | null`) lets one drink/charm at a time multiply the *winnings* portion of subsequent winning bets — applied inside `placeBet`, decremented per bet, surfaced in a header `BoostBadge`. Items live in `src/lib/shopItems.ts`; the Store page (`src/pages/Store.tsx`) sells drinks + charms via `purchaseItem`/`activateItem`. The Bar page (`src/pages/Bar.tsx`) is a stylized bartending minigame inspired by Bartender: The Right Mix — a SVG bartender ("Vincent") with mood-driven facial animations (idle bob, blink, happy/sad/wow) renders against a wood-counter scene with shelf silhouettes; recipes (`src/lib/barRecipes.ts`) are scored by `scoreGlass(recipe, poured)`, paying chip tips via `tipFor(accuracy)` and granting the matching drink to inventory at ≥80%. No backend.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
