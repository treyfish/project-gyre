import { describe, expect, it } from "vitest";

import asset from "@/src/data/current-field.json";
import { parseCurrentFieldAsset } from "@/src/data/current-field.schema";

describe("current field asset", () => {
  it("ships an attributed NOAA North Pacific field with matching vectors", () => {
    const field = parseCurrentFieldAsset(asset);

    expect(field.manifest.source).toContain("NOAA");
    expect(field.manifest.sourceUrl).toContain("jplOscar");
    expect(field.manifest.units).toBe("m/s");
    expect(field.manifest.observationTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(field.u).toHaveLength(field.longitudes.length * field.latitudes.length);
    expect(field.v).toHaveLength(field.u.length);
    expect(field.mask).toHaveLength(field.u.length);
    expect(Math.max(...field.u.map(Math.abs))).toBeGreaterThan(0.01);
    expect(Math.max(...field.v.map(Math.abs))).toBeGreaterThan(0.01);
  });

  it("rejects mismatched vector dimensions", () => {
    expect(() =>
      parseCurrentFieldAsset({
        ...asset,
        u: asset.u.slice(1),
      }),
    ).toThrow("vector arrays must match the grid dimensions");
  });
});
