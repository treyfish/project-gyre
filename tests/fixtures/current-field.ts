import type { CurrentFieldAsset } from "@/src/data/current-field.schema";

export const linearField: CurrentFieldAsset = {
  manifest: {
    source: "NOAA test fixture",
    sourceUrl: "https://example.test/jplOscar",
    retrievedAt: "2026-08-04T00:00:00.000Z",
    observationTime: "2014-10-06T00:00:00.000Z",
    bounds: { west: 0, south: 0, east: 10, north: 10 },
    resolutionDegrees: 10,
    units: "m/s",
    checksum: "fixture",
    license: "test",
  },
  longitudes: [0, 10],
  latitudes: [0, 10],
  u: [0, 2, 2, 4],
  v: [0, 0, 2, 2],
  mask: [1, 1, 1, 1],
};

export const eastwardField: CurrentFieldAsset = {
  ...linearField,
  u: [0.2, 0.2, 0.2, 0.2],
  v: [0, 0, 0, 0],
};
