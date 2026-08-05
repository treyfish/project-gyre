# Project Gyre Agent Rules

## Required Reading

1. `docs/superpowers/specs/2026-08-04-project-gyre-prototype-design.md`
2. `docs/superpowers/plans/2026-08-04-project-gyre-prototype.md`
3. `docs/design-system.md`

## Commands

- Install: `npm install`
- Develop: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Unit tests: `npm test`
- Browser tests: `npm run test:e2e`
- Production build: `npm run build`

## Invariants

- Simulation state changes only through ordered commands in `src/sim/**`.
- Authoritative simulation uses fixed ticks and seeded randomness; wall-clock time and GPU results never change outcomes.
- Rendering consumes snapshots and never mutates devices, debris, mission time, or score.
- Gameplay makes no runtime calls to scientific-data providers.
- Current assets include source, timestamp, units, bounds, license, and checksum.
- The garbage patch is diffuse. Current-control devices are speculative. Preserve both disclosures.
- Do not add Supabase, auth, cloud saves, multiplayer, or leaderboards to the prototype.
- Do not hide required imagery/data attribution behind the HUD.

## Ownership

- Codex: repository, contracts, data pipeline, simulation, worker, tests, CI, deployment.
- Claude Code: Earth scene, current/debris visuals, device interaction, HUD, onboarding, accessibility, visual fixtures.
- Never have two agents edit the same branch or worktree.
- Merge contract changes before render work that depends on them.

## Pull Request Evidence

Every PR records commands run, contract or data-manifest changes, replay/determinism impact, measured visual/performance impact, and its Vercel preview URL.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
