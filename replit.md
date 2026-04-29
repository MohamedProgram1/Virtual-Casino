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

- **virtual-casino** (`/`) — Lucky Vault, a frontend-only virtual casino with thirteen games: slots, blackjack, roulette, over/under dice, plinko, mines, crash, wheel of fortune, hi-lo, keno, coin flip, scratch card, and the owner-only "Owner's Vault". Uses no real money. State (balance, history, stats, settings, achievements, daily challenges, owner mode) persists to `localStorage` under `lucky_vault_casino_state` via `src/lib/store.tsx` (with a `migrate()` for forward-compat). Pages live in `src/pages/`, layout in `src/components/layout/Layout.tsx`. Shared game metadata (labels, routes, icons) is in `src/lib/games.ts`. The level system (`src/lib/levels.ts`) has 7 tiers, ranks by lifetime `handsPlayed`, and gates VIP variants of the four classic games via `VIP_UNLOCKS` (Partial). Achievements (`src/lib/achievements.ts`, 28 total including legendary "The Owner") are checked inside `placeBet` from a `BetMeta` payload (multiplier, special tags like `"natural"`/`"roulette-straight"`/`"mines-cleared"`/`"slots-jackpot"`, hits, streak, cashOutAt). The equipped title shows in the top bar. Daily challenges (`src/lib/dailyChallenges.ts`) deterministically pick 3 from a 17-template pool per ISO date and auto-credit chip rewards on completion. Owner mode is unlocked from Settings with a code (`MOMA20100711`), which surfaces the Owner's Vault game card in the lobby and can be re-locked from the same panel. The Owner's Vault is a 5-vault pick game with two zero-payout duds — slight positive expected value but with real loss risk so it cannot be farmed for infinite chips. A floating "Play Again" button appears anywhere a round is settled, wired through `src/lib/playAgain.tsx` (`PlayAgainProvider` + `useRegisterPlayAgain(slot, deps)`). No backend.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
