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

- **virtual-casino** (`/`) — Lucky Vault, a frontend-only virtual casino with thirteen games (slots, blackjack, roulette, over/under dice, plinko, mines, crash, wheel of fortune, hi-lo, keno, coin flip, scratch card, owner-only "Owner's Vault") plus two non-game features: **The Bar** (`/bar`) and **The Vault Store** (`/store`). Uses no real money. State (balance, history, stats, settings, achievements, daily challenges, owner mode, **inventory, activeBoost, bar stats**) persists to `localStorage` under `lucky_vault_casino_state` via `src/lib/store.tsx` (with a `migrate()` for forward-compat). Pages live in `src/pages/`, layout in `src/components/layout/Layout.tsx`. Shared game metadata (labels, routes, icons) is in `src/lib/games.ts`. The level system (`src/lib/levels.ts`) has 7 tiers, ranks by lifetime `handsPlayed`, and gates VIP variants of the four classic games via `VIP_UNLOCKS` (Partial). Achievements (`src/lib/achievements.ts`, 28 total including legendary "The Owner") are checked inside `placeBet` from a `BetMeta` payload (multiplier, special tags like `"natural"`/`"roulette-straight"`/`"mines-cleared"`/`"slots-jackpot"`, hits, streak, cashOutAt). The equipped title shows in the top bar. Daily challenges (`src/lib/dailyChallenges.ts`) deterministically pick 3 from a 17-template pool per ISO date and auto-credit chip rewards on completion. Owner mode is unlocked from Settings with a code (`MOMA20100711`), which surfaces the Owner's Vault game card in the lobby and can be re-locked from the same panel. The Owner's Vault is a 5-vault pick game with two zero-payout duds — slight positive expected value but with real loss risk so it cannot be farmed for infinite chips. A floating "Play Again" button appears anywhere a round is settled, wired through `src/lib/playAgain.tsx` (`PlayAgainProvider` + `useRegisterPlayAgain(slot, deps)`). The **Boost system** (`activeBoost: { itemId, name, multiplier, usesLeft } | null`) lets one drink/charm at a time multiply the *winnings* portion of subsequent winning bets — applied inside `placeBet`, decremented per bet, surfaced in a header `BoostBadge`. Items live in `src/lib/shopItems.ts`; the Store page (`src/pages/Store.tsx`) sells drinks + charms via `purchaseItem`/`activateItem`. The Bar page (`src/pages/Bar.tsx`) is a stylized bartending minigame inspired by Bartender: The Right Mix — a SVG bartender ("Vincent") with mood-driven facial animations (idle bob, blink, happy/sad/wow) renders against a wood-counter scene with shelf silhouettes; recipes (`src/lib/barRecipes.ts`) are scored by `scoreGlass(recipe, poured)`, paying chip tips via `tipFor(accuracy)` and granting the matching drink to inventory at ≥80%. No backend.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
