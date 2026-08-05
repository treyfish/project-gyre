# Current Data Provenance

Project Gyre ships a committed historical current field so gameplay never depends on a live scientific-data service.

## Source manifest

| Field | Value |
| --- | --- |
| Provider | NOAA CoastWatch ERDDAP / Earth & Space Research OSCAR Sea Surface Velocity |
| Variables | `u`, `v` horizontal velocity components |
| Observation | 2014-10-06 00:00:00 UTC |
| Retrieved | 2026-08-05 03:39:18 UTC |
| Bounds | 140°E–260°E, 10°N–60°N |
| Resolution | 1° regular grid, 121 × 51 cells |
| Units | meters per second |
| SHA-256 | `33342b61e86273e12caa2f9eda80370dbae3806bd38f7efe236667bc069a7790` |

The exact subset URL is:

`https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplOscar.csv0?u[117][0][60:3:210][360:3:720],v[117][0][60:3:210][360:3:720]`

## Transformation

`scripts/fetch-oscar.mjs` downloads one OSCAR frame, normalizes longitude into the prototype's 0–360 convention, downsamples it to a 1° regular grid, and replaces non-finite cells with zero while preserving a validity mask. It writes row-major velocity arrays and the source manifest to `src/data/current-field.json`. Tests validate dimensions, attribution, non-zero flow, and the recorded checksum.

## Scientific framing

- OSCAR is a gridded surface-current estimate. This prototype does not model the full ocean, weather, waves, density structure, or climate feedbacks.
- The visible debris represents weighted particles in a diffuse concentration. The Great Pacific Garbage Patch is not a solid island.
- Current-control arrays are speculative game technology, not a proposed or validated cleanup system.
- The dataset's provider warranty and accuracy disclaimers apply; the prototype is educational entertainment and is not intended for navigation, policy, engineering, or legal use.

The Earth texture is NASA Visible Earth / Blue Marble imagery. Provider and data credits remain visible in the game HUD.
