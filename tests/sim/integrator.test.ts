import { describe, expect, it } from "vitest";

import { advanceParticle, normalizeLongitude } from "@/src/sim/integrator";

describe("particle integrator", () => {
  it("normalizes longitude across the antimeridian", () => {
    expect(normalizeLongitude(361)).toBe(1);
    expect(normalizeLongitude(-1)).toBe(359);
  });

  it("advances eastward with RK2 without changing latitude", () => {
    const result = advanceParticle(
      { longitude: 359.999, latitude: 30 },
      3_600,
      () => ({ u: 1, v: 0 }),
    );

    expect(result.longitude).toBeGreaterThan(0);
    expect(result.longitude).toBeLessThan(0.1);
    expect(result.latitude).toBeCloseTo(30, 8);
  });
});
