import { describe, expect, it } from "vitest";

import { deviceInfluence, sampleBaseCurrent } from "@/src/sim/current-field";
import { linearField } from "@/tests/fixtures/current-field";

describe("current field", () => {
  it("bilinearly interpolates velocity at the center of a grid cell", () => {
    expect(sampleBaseCurrent(linearField, 5, 5)).toEqual({ u: 2, v: 1 });
  });

  it("applies a bounded oriented device influence that decays with distance", () => {
    const device = { id: "alpha", longitude: 200, latitude: 35, orientationDeg: 0, strength: 0.14 };
    const center = deviceInfluence(device, 200, 35);
    const edge = deviceInfluence(device, 207, 35);
    const far = deviceInfluence(device, 230, 35);

    expect(center.u).toBeGreaterThan(0.1);
    expect(Math.abs(center.v)).toBeLessThan(0.00001);
    expect(Math.abs(edge.u)).toBeLessThan(Math.abs(center.u));
    expect(far).toEqual({ u: 0, v: 0 });
  });
});
