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

- **virtual-casino** (`/`) — Lucky Vault, a frontend-only virtual casino with six games: slots, blackjack, roulette, over/under dice, plinko, and mines. Uses no real money. State (balance, history, stats, settings) persists to `localStorage` under `lucky_vault_casino_state` via `src/lib/store.tsx`. Pages live in `src/pages/`, persistent top bar / page transitions are in `src/components/layout/Layout.tsx`. The level system (`src/lib/levels.ts`) ranks players by lifetime `handsPlayed` and gates VIP variants of the four classic games — `VIP_UNLOCKS` is `Partial<Record<GameType, ...>>` so new games (plinko, mines) can opt in later. No backend.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
