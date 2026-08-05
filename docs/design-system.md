# Project Gyre Design System

## Accepted Visual References

- `docs/design/opening-concept.png`: opening composition and title treatment.
- `docs/design/mission-concept.png`: primary mission composition, layer treatment, HUD, devices, and current visualization.

Trey delegated the final visual choice on 2026-08-04 and approved proceeding with the recommended direction.

## Visual Point of View

Project Gyre is a cinematic Earth viewer with scientific instrumentation at the edges. The ocean is the interface. UI must frame the globe rather than turn the game into a dashboard.

## Tokens

```css
--ink: #071013;
--pacific: #061b26;
--ivory: #f2efe6;
--muted: #9aafb5;
--cyan: #57e5e5;
--cyan-bright: #c9ffff;
--amber: #e8a24c;
--violet: #8c6ccb;
--coral: #f06f61;
--panel: rgba(7, 16, 19, 0.78);
--line: rgba(201, 255, 255, 0.25);
--line-strong: rgba(87, 229, 229, 0.72);
--radius-panel: 4px;
--radius-control: 2px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--motion-fast: 160ms;
--motion-ui: 260ms;
--motion-camera: 3000ms;
```

Panels use one-pixel borders and a restrained inner highlight. Backdrop blur supports the orbital-canvas feeling but must have a solid `--ink` fallback under reduced-transparency preferences.

## Typography

- Title/wordmark: editorial high-contrast serif, uppercase, normal weight, tight optical spacing.
- Interface: narrow neutral sans-serif, uppercase only for terse telemetry labels.
- Numerals/data: monospaced lining figures.
- The opening title is approximately `clamp(4rem, 8vw, 8.5rem)` across two lines on common laptop screens.
- HUD labels are 11–13 px with deliberate tracking; button labels are 12–14 px and never browser-default text.

## Allowed Opening Copy

- `PROJECT GYRE`
- `Redirect the current. Recover the ocean.`
- `BEGIN MISSION`
- `ABOUT THE DATA`
- `A PLAYABLE OCEAN SYSTEM · BASED ON HISTORICAL SURFACE CURRENTS`
- `PROTOTYPE 01`

No eyebrow, navigation, badge, fake metric, or extra marketing claim may be added above the fold.

## Allowed Mission Copy

- `PROJECT GYRE`
- `NORTH PACIFIC / OPERATION 01`
- `18 WEEKS`
- `3 AVAILABLE`
- `RECOVERY`
- `ENERGY`
- `ECOLOGY`
- `CLICK TO DEPLOY · DRAG TO ORIENT`
- `CURRENT FIELD`
- `NATURAL`
- `REDIRECTED`
- `1×`, `4×`, `12×`

Scientific disclosures and retry/error text may appear in drawers or blocking error states when functionally required.

## Container Model

- Full-bleed globe canvas at all times.
- Opening copy is open on the orbital background with no surrounding card.
- Mission UI uses four edge systems: left tool dock, top mission status, right score rail, bottom transport and legend.
- Avoid nested panels. The score rail and legend are the only persistent glass panels larger than a control.

## Component Families

- **Primary action:** transparent black fill, cyan one-pixel border, square corners, subtle cyan inner glow on hover/focus.
- **Text action:** unboxed uppercase monospace label with underline on hover/focus.
- **Tool dock:** connected vertical cells, one cyan-selected state, muted line icons.
- **Transport:** connected square controls; active speed receives a cyan underline.
- **Score meter:** label, segmented horizontal rail, value; cyan/amber/violet map to recovery/energy/ecology.
- **Device:** white-cyan radial turbine, three vanes, concentric influence circles, clear orientation line.
- **Collector:** thin modular corridor perpendicular to desired current path.
- **Legend:** two arrowed line samples; no pill labels.

## Icon Inventory

- Play: filled right-facing triangle.
- Pause: two vertical bars.
- Device: custom three-vane radial line icon, 1.5 px apparent stroke.
- Information: lowercase `i` inside a thin circle.
- Close: two thin diagonal strokes.
- Natural/redirected: horizontal line with a narrow arrowhead.

Icons use inline SVG with `currentColor`; plain Unicode glyphs are excluded.

## Motion

- Current particles communicate direction and speed.
- Device preview motion communicates placement and orientation.
- Camera flight communicates scale transition from planet to mission.
- Score changes animate only to acknowledge capture or resource use.
- Reduced motion shortens camera movement and reduces particle density; it never hides information.

## Responsive Boundary

The playable layout requires at least 900 CSS pixels of width. Smaller screens receive a branded desktop-required state because collapsing the globe instrumentation would compromise the prototype rather than produce a useful mobile experience.

## Asset Treatment

- Earth imagery has no color wash over it. Edge fades may blend the globe into true black.
- Currents and device influence may glow; panels, copy, and the globe may not.
- The concentration bloom uses low-opacity amber and violet density rather than discrete piles.
- The generated concept images are implementation references only and are not shipped as the interactive UI.

