# Project Gyre

[Play the production demo](https://project-gyre.vercel.app)

Project Gyre is a desktop web game about redirecting a historical North Pacific surface-current field to route modeled ocean debris through a collector. It pairs a cinematic Cesium globe with a deterministic simulation, then asks the player to balance recovery, energy, and ecosystem disturbance over an 18-week mission.

## How to play

1. Select the current-control device tool.
2. Click the ocean to deploy, or drag to orient, up to three speculative current-control arrays.
3. Advance the mission at 1×, 4×, or 12× speed.
4. Route debris through the white collector corridor east of the modeled patch.

The default 1× mission runs about seven minutes. The same seed and ordered device commands always produce the same result.

## Scientific framing

The natural flow is a committed NOAA CoastWatch OSCAR surface-velocity snapshot observed on October 6, 2014. The Earth texture is NASA Visible Earth imagery. The Great Pacific Garbage Patch is represented as a diffuse moving concentration, not a solid island, and the current-control arrays are explicitly labeled as speculative game technology.

See [data provenance](docs/data-provenance.md) for the exact NOAA subset, timestamp, transformation, checksum, and limitations.

## Stack

- Next.js 16, React 19, and TypeScript
- CesiumJS with bundled NASA Blue Marble imagery
- Deterministic fixed-step simulation in a dedicated Web Worker
- Vitest and Playwright
- GitHub Actions and Vercel

No database or live scientific-data API is used in the prototype. Supabase is intentionally deferred until cloud saves or sharing are validated.

## Local development

Requires Node.js 24 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a desktop browser at least 900 pixels wide.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Current limitations

- One desktop-only North Pacific mission
- Historical 1° surface-current field rather than a live forecast or full ocean model
- Local, single-player sessions with no save system or leaderboard
- Simplified device influence, collector, energy, and ecosystem scoring

## Codex + Claude workflow

Codex owns the repository, data pipeline, simulation, worker contract, tests, CI, and deployment. Claude Code provides an independent read-only review of the rendered experience, usability, scientific framing, and release blockers before publication. Shared invariants live in [AGENTS.md](AGENTS.md), with Claude-specific context in [CLAUDE.md](CLAUDE.md).

## Attribution

Current data: NOAA CoastWatch ERDDAP / Earth & Space Research OSCAR. Earth imagery: NASA Visible Earth. Globe engine: CesiumJS. Provider and data credits remain visible in the experience.
