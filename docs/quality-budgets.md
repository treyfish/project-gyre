# Project Gyre Quality Budgets

## Runtime targets

- Target 60 FPS during the opening orbit and active mission on a current mid-tier desktop.
- Maintain at least 30 FPS during placement, camera movement, and 12× simulation playback.
- Keep simulation work in the dedicated worker and avoid main-thread tasks longer than 50 ms during normal play.
- Preserve deterministic results across quality tiers; quality settings may change only cosmetic density, resolution, and camera duration.

## Adaptive tiers

| Tier | Render DPR cap | Current particles | Debris points | Camera flight |
| --- | ---: | ---: | ---: | ---: |
| Reduced | 1.0 | 420 | 600 | 0 seconds |
| Balanced | 1.25 | 820 | 900 | 2.4 seconds |
| High | 1.5 | 1,400 | 1,200 | 3 seconds |

Reduced motion, four or fewer logical CPU cores, or 4 GB or less reported device memory selects the reduced tier. High quality requires at least ten logical cores and 8 GB reported device memory. Other desktops use the balanced tier.

## Measurement procedure

1. Use a production build with browser extensions disabled and a 1440×900 viewport.
2. Record a Chrome Performance trace from `Begin mission` through one device placement and 30 seconds of 12× playback.
3. Inspect frame timing, long tasks, worker utilization, GPU activity, and memory stability.
4. Repeat with reduced motion enabled and confirm the simulation score is unchanged for the same command log.
5. If the 30 FPS floor is missed, lower cosmetic current/debris counts before changing simulation tick rate or scientific data.

The automated Chromium smoke test uses reduced motion because headless browsers commonly use software WebGL. Visual quality is additionally checked in a native desktop browser.
