# Project Gyre Playable Prototype Design

**Status:** Approved by Trey Holland on 2026-08-04 with instruction to use the recommended approach and proceed autonomously.

## Product Intent

Project Gyre is a desktop-first browser game that makes the North Pacific circulation visible and turns ocean cleanup into a spatial strategy problem. The player does not erase pollution with a click. They place near-future current-control devices, preview how those devices alter local flow, advance simulated time, and guide catchable debris toward a cleanup corridor while limiting energy use and ecological disruption.

The prototype should feel like opening a cinematic Earth viewer and discovering that the ocean is alive. It must be visually credible and grounded in published current patterns, but it must clearly label current manipulation as speculative game technology.

## Prototype Success Criteria

The first public build succeeds when a new player can, without instructions from Trey:

1. Enter the North Pacific mission from a cinematic globe view.
2. Understand that flowing particles represent surface currents and the warm concentration field represents distributed plastic.
3. Place and rotate three devices, then see an immediate flow preview.
4. Advance the simulation through a short mission lasting roughly five to ten minutes.
5. Improve the cleanup score by routing debris through a collector while balancing energy and ecosystem impact.
6. Restart the same deterministic scenario and receive the same outcome for the same actions.
7. Play at a stable 30 FPS or better on a current mid-tier desktop browser, with 60 FPS as the visual target.

## Scope

### Included

- One scenario spanning the North Pacific and the Great Pacific Garbage Patch region.
- A cinematic globe entry and guided camera transition into the mission.
- Satellite-style Earth imagery, atmosphere, sunlight, stars, and subtle ocean specular effects.
- An animated surface-current visualization based on a committed historical OSCAR/NOAA vector-field extract.
- Distributed debris rendered as a soft concentration field plus visible representative fragments.
- Three identical current-control devices that can be placed, rotated, selected, and removed.
- One fixed cleanup corridor/collector.
- Play, pause, and three simulation speeds.
- A score combining debris captured, energy consumed, and ecosystem disturbance.
- A short onboarding sequence and an end-of-mission result panel.
- Local deterministic state only; restart is the persistence mechanism for the demo.
- Responsive error and compatibility messaging.

### Excluded

- User accounts, cloud saves, leaderboards, multiplayer, purchases, or Supabase.
- A global campaign, multiple missions, technology trees, or narrative cinematics.
- Live forecasts or runtime calls to scientific-data providers.
- Claims that the garbage patch is a solid island or that the devices are currently feasible engineering.
- Mobile optimization beyond a clear desktop-required message on unsupported screens.
- Google Photorealistic 3D Tiles in the default build.

## Player Experience

### Opening

The app opens on a full-screen Earth against a dark star field. A minimal title card reads `PROJECT GYRE` and `Redirect the current. Recover the ocean.` Selecting **Begin mission** flies the camera from a global view to the North Pacific. Current trails bloom into view during the approach, followed by the debris concentration and mission HUD.

### Mission Loop

1. Inspect the natural current field and debris density.
2. Choose a location and place a current-control device.
3. Rotate the device to redirect local flow. A ghost preview shows affected streamlines before confirmation.
4. Spend the limited deployment budget on up to three devices.
5. Advance simulated time and watch representative debris move with the combined natural and altered flow.
6. Pause and adjust the layout.
7. Route as much catchable debris as possible through the collector before the mission clock ends.

The player may replay immediately. The same initial seed and the same commands produce the same result.

### Scoring

The final mission score is normalized to 100:

- **Recovery, 70 points:** weighted debris mass entering the collector.
- **Energy efficiency, 20 points:** unused deployment/operating energy.
- **Ecosystem care, 10 points:** avoiding excessive device overlap and protected-zone influence.

The HUD exposes these as three separate meters so the player understands the tradeoff rather than seeing an unexplained number.

## Visual Direction

The visual language is cinematic scientific instrumentation, not a conventional blue dashboard. Earth imagery and the moving current field dominate the screen. UI panels use translucent ink-black glass, fine white keylines, warm ivory type, electric cyan for natural flow, and amber for player influence. Critical alerts use coral sparingly.

The garbage patch appears as a broad, translucent amber-violet density bloom with scattered representative debris. It must never resemble a walkable island. Natural current particles are thin and luminous; altered flow gains a brighter cyan/white edge near each device. Devices are compact, radial floating structures with restrained navigation lights and a visible orientation vane.

Typography uses a high-contrast editorial serif for the title and a clean sans-serif for telemetry. Motion is slow and weighty. UI transitions stay under 300 ms while camera travel may take 2–4 seconds. Reduced-motion mode shortens camera travel and reduces particle density.

## Technical Architecture

### Application Shell

- Next.js App Router with TypeScript.
- Static-first Vercel deployment.
- A small server-rendered shell for metadata and fallback content.
- A client-only game island loaded dynamically because Cesium and workers require browser APIs.
- No Vercel Functions in the gameplay path.

### Globe and Rendering

- CesiumJS provides the WGS84 globe, camera, atmosphere, star field, imagery layers, picking, and coordinate conversion.
- The demo uses a separately licensed satellite-style imagery provider or a committed public-domain global texture. Cesium ion and Google tile dependencies are optional adapters, not hard requirements.
- Currents use a focused render layer that owns streamlines/particles and exposes only `setField`, `setInfluences`, `setQuality`, and `dispose`.
- Debris rendering consumes immutable simulation snapshots and never mutates game state.
- Quality tiers adjust device-pixel ratio, current-particle count, trail lifetime, debris sprites, and post-processing.

### Simulation

- A framework-free deterministic simulation runs in a Dedicated Web Worker at a fixed 30 Hz.
- The natural field is a versioned static grid of eastward/northward surface velocity components.
- The prototype uses one representative historical OSCAR frame; data provenance and timestamp are shown in the information panel.
- Each device adds a smooth, bounded, local dipole-like influence with compensating return flow. This changes routes without visually creating or destroying water.
- Weighted debris particles use second-order Runge–Kutta advection over the combined field.
- Commands are applied in `(tick, sequence)` order.
- A seeded PRNG controls cosmetic variation that affects authoritative particle placement.
- The main thread receives compact render snapshots through transferable typed-array buffers.

### State Model

The authoritative state contains:

- simulation version and data-manifest hash;
- current tick and remaining mission time;
- device list with position, orientation, strength, and active state;
- weighted debris-particle positions and capture state;
- energy use, disturbance, recovered mass, and score inputs;
- seeded PRNG state;
- ordered player command log.

React owns only presentation state: selected tool, selected device, panel visibility, camera mode, onboarding step, and quality preference.

### Data Pipeline

The repository includes a reproducible preprocessing script and a committed browser asset. The preferred demo source is NOAA CoastWatch's public OSCAR surface-current grid; a future upgrade may substitute Copernicus GLORYS12 without changing the runtime field interface.

The preprocessing step:

1. Downloads or reads an attributed North Pacific `u`/`v` subset.
2. Normalizes longitude across the antimeridian.
3. Downsamples to the prototype grid.
4. Masks missing/land cells.
5. Quantizes vector components.
6. Emits a compact binary or JSON asset plus a manifest containing source, timestamp, bounds, resolution, units, and checksum.

Gameplay never downloads scientific data at runtime and never exposes provider credentials.

## Component Boundaries

- `GameShell`: coordinates modes and presentation; depends on the worker client and renderer interfaces.
- `EarthScene`: owns Cesium lifecycle, camera, imagery, and layer composition.
- `CurrentLayer`: renders the natural and altered current field.
- `DebrisLayer`: renders representative debris and the concentration bloom.
- `DeviceLayer`: handles device ghosts, picking, selection, and models.
- `SimulationCore`: pure deterministic commands and fixed-step evolution.
- `SimulationWorker`: transfers commands and snapshots between browser and core.
- `CurrentField`: samples the static natural grid plus device influences.
- `MissionScoring`: computes recovery, energy, disturbance, and total score.
- `MissionHUD`: presents clock, controls, score meters, and device budget.
- `CompatibilityGate`: reports WebGL/data-loading failures and offers retry or reduced quality.

Dependencies point inward toward contracts and the simulation core. Rendering depends on snapshots; the simulation never depends on React or Cesium.

## Failure Handling

- If WebGL or required browser APIs are unavailable, show a branded compatibility screen rather than a blank canvas.
- If satellite imagery fails, fall back to a bundled low-resolution Earth texture.
- If the current asset fails validation, stop the mission and show a retry action; do not silently run fabricated data.
- If the worker crashes, preserve presentation state, restart once, and surface a clear failure after a second crash.
- If frame time degrades, reduce cosmetic particles and resolution before altering authoritative simulation ticks.
- Pausing the browser tab pauses presentation and simulation advancement.

## Testing and Quality Gates

- Unit tests cover vector interpolation, device influence, particle integration, capture detection, score calculation, seeded randomness, and invalid commands.
- Golden replay tests verify that a canonical command log produces identical checkpoint hashes.
- Worker-protocol tests cover initialization, commands, pause/resume, snapshots, and errors.
- Playwright covers mission entry, device placement, time controls, results, restart, and compatibility fallback in Chromium.
- Visual snapshots use a fixed seed, tick, camera, and reduced-animation mode.
- The production build must pass lint, typecheck, unit tests, browser smoke tests, and a Vercel deployment check.

## Codex and Claude Collaboration

The repository uses stable ownership boundaries rather than two agents editing the same files.

### Codex Owns

- repository/toolchain and CI;
- contracts, simulation core, worker protocol, scoring, and deterministic tests;
- data preprocessing and provenance;
- build/deployment configuration;
- systems and performance review of render changes.

### Claude Code Owns

- Earth scene composition, current/debris visuals, device interaction, and HUD;
- onboarding, responsive presentation, accessibility, and visual regression fixtures;
- usability review of simulation-facing changes.

### Shared Protocol

- `AGENTS.md` is canonical for commands, invariants, paths, and quality gates.
- `CLAUDE.md` imports `AGENTS.md` and contains only Claude-specific notes.
- Work uses task branches: `codex/<issue>-<slug>` and `claude/<issue>-<slug>`.
- Interface changes land before dependent parallel work.
- Every pull request includes commands run, performance impact, contract changes, and its Vercel preview URL.
- The non-authoring agent reviews each subsystem PR before Trey merges production changes.

## Deployment

- Create a dedicated GitHub repository named `project-gyre` under Trey's authenticated account.
- Protect `main` after the prototype is live; subsequent changes use pull requests.
- Connect the GitHub repository to Vercel and keep automatic preview deployments enabled.
- The initial public deployment may use Vercel's generated domain.
- Add Supabase only after a validated requirement for cloud saves, shared replays, accounts, or leaderboards.

## Scientific and Legal Presentation

- The information panel identifies the current dataset, extract timestamp, license/usage terms, and simulation simplifications.
- Copy states that the garbage patch is diffuse and mobile, not a solid island.
- Copy states that current-control devices are speculative.
- All map and data attributions remain visible and are never obscured by the HUD.
- Google branding is not used in the product name or marketing; “Google Earth-like” describes the inspiration only.

## Source References

- NOAA OSCAR ERDDAP dataset: https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplOscar.html
- NOAA garbage-patch explanation: https://oceanservice.noaa.gov/facts/garbagepatch.html
- Copernicus GLORYS12 product: https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description
- CesiumJS fundamentals: https://cesium.com/learn/cesiumjs-fundamentals/
- Cesium terrain and water: https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/
- Vercel limits: https://vercel.com/docs/limits
