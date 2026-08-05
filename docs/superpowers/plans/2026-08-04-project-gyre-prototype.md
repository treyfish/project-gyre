# Project Gyre Playable Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publicly deploy a five-to-ten-minute desktop browser game in which the player redirects a real historical North Pacific current field to route distributed debris into a collector.

**Architecture:** A static-first Next.js shell dynamically loads a client-only Cesium scene. A framework-free deterministic simulation runs at a fixed tick rate in a Dedicated Worker and publishes immutable typed snapshots to the renderer. A committed NOAA OSCAR extract supplies the base flow; device kernels add bounded local perturbations without runtime scientific-data calls.

**Tech Stack:** Node.js 24, npm, Next.js 16.3, React 19.2, TypeScript, CesiumJS 1.144, Web Workers, Vitest 4, Playwright 1.62, GitHub Actions, Vercel.

## Global Constraints

- The demo is desktop-first and contains one North Pacific mission.
- The mission is deterministic: the same initial seed and ordered command log produce the same score.
- Current manipulation is labeled speculative; the garbage patch is diffuse, not a solid island.
- Runtime gameplay makes no scientific-data API calls and uses no database.
- The static current asset includes source, timestamp, bounds, resolution, units, and checksum.
- The player may place, rotate, select, and remove at most three current-control devices.
- The score contains recovery (70), energy efficiency (20), and ecosystem care (10).
- The application targets 60 FPS with a 30 FPS hard fallback on a current mid-tier desktop.
- Natural flow uses cyan, player influence uses cyan-white, debris density uses amber-violet, and alerts use coral.
- Google branding and Google Photorealistic 3D Tiles are excluded from the default build.
- Supabase is excluded until cloud persistence or sharing is validated.

---

## File Map

- `app/layout.tsx`: document metadata, fonts, global styles.
- `app/page.tsx`: static shell and dynamic game entry.
- `app/globals.css`: visual system, HUD, overlays, responsive/compatibility states.
- `src/game/GameShell.tsx`: presentation-mode state and orchestration.
- `src/game/game-types.ts`: presentation types and device-tool state.
- `src/render/EarthScene.ts`: Cesium viewer lifecycle and camera.
- `src/render/CurrentLayer.ts`: animated current particle primitives.
- `src/render/DebrisLayer.ts`: concentration bloom and debris point primitives.
- `src/render/DeviceLayer.ts`: device primitives, ghosts, picking, and collector.
- `src/render/quality.ts`: adaptive render-quality tiers.
- `src/sim/contracts.ts`: commands, snapshot, worker-message contracts.
- `src/sim/current-field.ts`: grid sampling and local device influence.
- `src/sim/integrator.ts`: antimeridian-safe RK2 advection.
- `src/sim/prng.ts`: seeded deterministic generator.
- `src/sim/scoring.ts`: three-part mission score.
- `src/sim/simulation.ts`: authoritative state and fixed-step command processing.
- `src/sim/sim.worker.ts`: worker transport.
- `src/sim/worker-client.ts`: typed main-thread worker client.
- `src/data/current-field.json`: committed NOAA-derived grid.
- `src/data/current-field.schema.ts`: runtime manifest validation.
- `scripts/fetch-oscar.mjs`: reproducible ERDDAP subset downloader/normalizer.
- `scripts/copy-cesium.mjs`: copies Cesium runtime assets into `public/cesium`.
- `tests/sim/*.test.ts`: deterministic unit and golden tests.
- `tests/e2e/mission.spec.ts`: browser mission smoke test.
- `AGENTS.md`: shared Codex/Claude repository rules.
- `CLAUDE.md`: imports shared rules and records Claude render ownership.
- `.github/workflows/ci.yml`: lint, typecheck, unit, build, browser smoke.

### Task 1: Scaffold the Application and Collaboration Contract

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `scripts/copy-cesium.mjs`
- Create: `AGENTS.md`, `CLAUDE.md`, `.gitignore`

**Interfaces:**
- Consumes: approved design specification.
- Produces: `npm run dev`, `npm run test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`; a browser-safe Cesium asset base at `/cesium`.

- [ ] **Step 1: Create the Next.js package manifest**

```json
{
  "name": "project-gyre",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "postinstall": "node scripts/copy-cesium.mjs"
  },
  "dependencies": {
    "cesium": "1.144.0",
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@playwright/test": "1.62.1",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "16.3.0",
    "typescript": "^6.0.0",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Step 2: Install dependencies and copy Cesium assets**

Run: `npm install`

Expected: exit 0, a committed `package-lock.json`, and `public/cesium/Workers`, `Assets`, `ThirdParty`, and `Widgets`.

- [ ] **Step 3: Create the static shell and compatibility-first placeholder**

Create `app/page.tsx` with a semantic `<main>` containing the Project Gyre title, tagline, loading status, and a dynamic import for `src/game/GameShell.tsx` with SSR disabled from a small client wrapper.

Expected: `npm run build` produces `/` without server functions in the gameplay path.

- [ ] **Step 4: Record shared agent rules**

`AGENTS.md` must define commands, deterministic simulation invariants, owned path groups, no-runtime-data-call rule, data attribution requirement, and PR evidence. `CLAUDE.md` begins with `@AGENTS.md` and assigns Claude Code render/UI ownership only.

- [ ] **Step 5: Verify and commit**

Run: `npm run lint && npm run typecheck && npm run build`

Expected: all commands exit 0.

```bash
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs vitest.config.ts playwright.config.ts app scripts/copy-cesium.mjs public/cesium AGENTS.md CLAUDE.md .gitignore
git commit -m "chore: scaffold Project Gyre web prototype"
```

### Task 2: Create the Provenanced Current-Field Asset

**Files:**
- Create: `scripts/fetch-oscar.mjs`
- Create: `src/data/current-field.json`
- Create: `src/data/current-field.schema.ts`
- Test: `tests/data/current-field.test.ts`

**Interfaces:**
- Consumes: NOAA ERDDAP `jplOscar` variables `u` and `v` in meters per second.
- Produces: `CurrentFieldAsset` with `manifest`, longitude/latitude axes, and row-major `u`/`v` arrays.

- [ ] **Step 1: Write the failing manifest-validation test**

```ts
import asset from '../../src/data/current-field.json';
import { parseCurrentFieldAsset } from '../../src/data/current-field.schema';

it('ships an attributed North Pacific field with matching vectors', () => {
  const field = parseCurrentFieldAsset(asset);
  expect(field.manifest.source).toContain('NOAA');
  expect(field.manifest.units).toBe('m/s');
  expect(field.u).toHaveLength(field.longitudes.length * field.latitudes.length);
  expect(field.v).toHaveLength(field.u.length);
});
```

- [ ] **Step 2: Run the test and observe the missing module failure**

Run: `npm test -- tests/data/current-field.test.ts`

Expected: FAIL because the schema and asset do not exist.

- [ ] **Step 3: Implement the downloader and validator**

The script requests one historical OSCAR frame covering longitudes `140..260` degrees east and latitudes `10..60` degrees north, downsamples to a regular grid, converts non-finite cells to zero with an explicit mask, and emits the manifest fields `source`, `sourceUrl`, `retrievedAt`, `observationTime`, `bounds`, `resolutionDegrees`, `units`, `checksum`, and `license`.

- [ ] **Step 4: Generate and verify the asset**

Run: `node scripts/fetch-oscar.mjs && npm test -- tests/data/current-field.test.ts`

Expected: downloader exits 0 and the test passes with a non-zero vector field.

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-oscar.mjs src/data tests/data/current-field.test.ts
git commit -m "feat: add NOAA North Pacific current field"
```

### Task 3: Build the Deterministic Simulation Core

**Files:**
- Create: `src/sim/contracts.ts`, `src/sim/prng.ts`, `src/sim/current-field.ts`, `src/sim/integrator.ts`, `src/sim/scoring.ts`, `src/sim/simulation.ts`
- Test: `tests/sim/prng.test.ts`, `tests/sim/current-field.test.ts`, `tests/sim/integrator.test.ts`, `tests/sim/scoring.test.ts`, `tests/sim/simulation.test.ts`

**Interfaces:**
- Consumes: `CurrentFieldAsset` and ordered `SimulationCommand` values.
- Produces: `createSimulation(options): Simulation`, `Simulation.step(): RenderSnapshot`, `Simulation.dispatch(command): void`.

- [ ] **Step 1: Write failing tests for the six simulation invariants**

Test exact seeded PRNG output, bilinear grid sampling, local device influence decay, antimeridian-safe RK2 movement, the 70/20/10 score weights, three-device rejection, collector capture, and repeatable snapshots for identical command logs.

- [ ] **Step 2: Run tests and verify missing implementations**

Run: `npm test -- tests/sim`

Expected: FAIL on missing simulation modules.

- [ ] **Step 3: Implement contracts and pure helpers**

Define `Device`, `DebrisParticle`, `SimulationCommand`, `RenderSnapshot`, `ScoreBreakdown`, and `SimulationConfig`. Use `mulberry32` with a serialized unsigned 32-bit state. Clamp latitudes to the scenario bounds and normalize longitude into `0..360`.

- [ ] **Step 4: Implement fixed-step simulation behavior**

`Simulation.step()` applies queued commands by `(tick, sequence)`, samples natural plus device flow, advances uncaptured debris with RK2, marks particles entering the collector, charges active-device energy, calculates overlap disturbance, and publishes typed positions plus score inputs.

- [ ] **Step 5: Run the deterministic suite**

Run: `npm test -- tests/sim`

Expected: all simulation tests pass twice with identical hashes.

- [ ] **Step 6: Commit**

```bash
git add src/sim tests/sim
git commit -m "feat: add deterministic gyre simulation"
```

### Task 4: Move the Simulation Behind a Worker Contract

**Files:**
- Create: `src/sim/sim.worker.ts`, `src/sim/worker-client.ts`
- Test: `tests/sim/worker-client.test.ts`

**Interfaces:**
- Consumes: `WorkerRequest = init | command | play | pause | setSpeed | reset`.
- Produces: `WorkerEvent = ready | snapshot | state | error` and `SimulationWorkerClient` methods with the same names.

- [ ] **Step 1: Write a failing typed-protocol test**

Use a fake Worker to assert that initialization sends the current-field asset and that a snapshot event reaches subscribers without allowing UI code to mutate its arrays.

- [ ] **Step 2: Run the failing test**

Run: `npm test -- tests/sim/worker-client.test.ts`

Expected: FAIL because the client does not exist.

- [ ] **Step 3: Implement worker and client**

Run the fixed step at 30 Hz while playing, cap catch-up at three ticks, pause when requested, and transfer fresh position buffers in snapshot events. Convert thrown values to a serializable `WorkerError` containing `code` and `message`.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- tests/sim/worker-client.test.ts && npm run typecheck`

Expected: both commands exit 0.

```bash
git add src/sim/sim.worker.ts src/sim/worker-client.ts tests/sim/worker-client.test.ts
git commit -m "feat: run ocean simulation in a web worker"
```

### Task 5: Render the Cinematic Earth and Mission Layers

**Files:**
- Create: `src/render/EarthScene.ts`, `src/render/CurrentLayer.ts`, `src/render/DebrisLayer.ts`, `src/render/DeviceLayer.ts`, `src/render/quality.ts`
- Create: `public/textures/earth-blue-marble.jpg`
- Test: `tests/render/quality.test.ts`

**Interfaces:**
- Consumes: `RenderSnapshot`, current-field asset, selected tool, and callbacks `onOceanPick` and `onDevicePick`.
- Produces: `EarthScene.mount(container)`, `applySnapshot(snapshot)`, `setPlacementPreview`, `flyToMission`, `setQuality`, and `destroy`.

- [ ] **Step 1: Write a failing quality-tier test**

Assert that `chooseQuality({ reducedMotion: true })` reduces current particles and DPR, while high quality remains below the specified DPR cap.

- [ ] **Step 2: Implement EarthScene with a bundled imagery fallback**

Create the Cesium viewer without geocoder, timeline, animation, navigation help, info box, selection indicator, or default base layer. Add the bundled public-domain Earth texture, atmosphere, sun lighting, and visible provider/data credits.

- [ ] **Step 3: Implement focused render layers**

Use primitive collections rather than React components per particle. Animate current particles from the static field on the main thread as cosmetic state. Update debris points from worker snapshots. Render device rings, orientation vanes, influence radii, ghost placement, and the collector corridor.

- [ ] **Step 4: Implement camera and cleanup**

Start at a global camera, fly to the North Pacific in 3 seconds, honor reduced motion, pause cosmetic animation on hidden tabs, and destroy every Cesium primitive/listener on unmount.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/render/quality.test.ts && npm run typecheck && npm run build`

Expected: all commands exit 0 and the build contains Cesium runtime assets.

```bash
git add src/render public/textures tests/render/quality.test.ts
git commit -m "feat: render cinematic North Pacific mission"
```

### Task 6: Build the Playable Mission UI

**Files:**
- Create: `src/game/GameShell.tsx`, `src/game/GameClient.tsx`, `src/game/game-types.ts`
- Modify: `app/page.tsx`, `app/globals.css`
- Test: `tests/game/game-shell.test.tsx`

**Interfaces:**
- Consumes: `EarthScene` and `SimulationWorkerClient`.
- Produces: opening, onboarding, playing, paused, results, compatibility, and error modes.

- [ ] **Step 1: Write failing interaction tests**

Test begin-mission, device-tool selection, three-device budget display, play/pause/speed controls, score meter labels, result screen, restart, and the scientific disclosure text.

- [ ] **Step 2: Implement the mode state machine**

Use an explicit reducer so mission modes cannot contradict one another. UI commands call the worker client; no component directly changes authoritative devices, clock, debris, or scores.

- [ ] **Step 3: Implement the instrument-style HUD**

Add the opening title card, mission briefing, top status bar, device dock, score panel, time controls, placement hint, information drawer, result panel, keyboard focus states, and reduced-motion styles.

- [ ] **Step 4: Add compatibility and recovery states**

Detect WebGL before mounting Cesium. Show reduced-quality retry for render failures and a retry-once flow for worker initialization errors. Screens below 900 CSS pixels show a desktop-required message.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/game/game-shell.test.tsx && npm run lint && npm run typecheck && npm run build`

Expected: all commands exit 0.

```bash
git add src/game app tests/game/game-shell.test.tsx
git commit -m "feat: add Project Gyre mission experience"
```

### Task 7: Add Browser, Accessibility, and Performance Verification

**Files:**
- Create: `tests/e2e/mission.spec.ts`, `tests/e2e/compatibility.spec.ts`
- Create: `.github/workflows/ci.yml`
- Create: `docs/quality-budgets.md`, `docs/data-provenance.md`

**Interfaces:**
- Consumes: production application and fixed mission seed.
- Produces: repeatable CI evidence and documented budgets/provenance.

- [ ] **Step 1: Write the Chromium mission smoke test**

The test loads `/`, begins the mission, places one device through a stable test hook, advances time, pauses, opens the information panel, verifies the speculative-device and diffuse-patch disclosures, restarts, and confirms the initial score.

- [ ] **Step 2: Write the compatibility test**

Use the app's supported test hook to force WebGL unavailable and assert a useful branded fallback with no unhandled page errors.

- [ ] **Step 3: Run browser tests**

Run: `npx playwright install chromium && npm run test:e2e`

Expected: mission and compatibility tests pass in Chromium.

- [ ] **Step 4: Add CI and documentation**

CI runs dependency install, lint, typecheck, unit tests, production build, Chromium install, and browser tests. Quality documentation records the 60/30 FPS targets, DPR/particle tiers, main-thread long-task rule, and manual measurement procedure. Provenance documentation records exact NOAA URL, observation time, retrieval time, transformation, checksum, and disclaimers.

- [ ] **Step 5: Run the complete local gate and commit**

Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`

Expected: every command exits 0.

```bash
git add tests/e2e .github/workflows/ci.yml docs/quality-budgets.md docs/data-provenance.md
git commit -m "test: verify Project Gyre playable demo"
```

### Task 8: Publish GitHub Repository and Vercel Production Demo

**Files:**
- Create: `README.md`, `.github/pull_request_template.md`
- Modify: `.gitignore` if deployment creates local metadata.

**Interfaces:**
- Consumes: verified `main` branch.
- Produces: `treyfish/project-gyre` GitHub repository and a production Vercel URL.

- [ ] **Step 1: Write the public README and PR template**

README includes the playable URL, concept, scientific framing, controls, stack, local commands, data provenance, current limitations, and Codex/Claude workflow. The PR template asks for tests, contract changes, replay changes, performance delta, and preview URL.

- [ ] **Step 2: Ask Claude Code for a focused review**

Run Claude in non-interactive read-only review mode with the spec, plan, current diff, and request to identify only blocking correctness, usability, scientific-framing, or deployment issues. Apply verified findings through new commits; record rejected suggestions with reasons in the handoff note.

- [ ] **Step 3: Run the final local quality gate**

Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e && git status --short`

Expected: all tests pass and the worktree is clean after the final documentation commit.

- [ ] **Step 4: Create and push the GitHub repository**

Run: `gh repo create project-gyre --public --source=. --remote=origin --push`

Expected: repository created under authenticated account `treyfish`, `main` pushed, and `origin` set.

- [ ] **Step 5: Deploy to Vercel production**

Run: `npx vercel --prod --yes`

Expected: deployment exits 0 and returns the production URL.

- [ ] **Step 6: Verify the public deployment**

Run the Playwright mission smoke test with `PLAYWRIGHT_BASE_URL` set to the production URL and inspect desktop screenshots at opening, active mission, and results states.

- [ ] **Step 7: Commit any verified deployment-only corrections and redeploy**

If verification produces a correction, run the complete local gate, commit with a narrow message, push `main`, redeploy production, and repeat the public smoke test. Stop only when the public demo passes.

