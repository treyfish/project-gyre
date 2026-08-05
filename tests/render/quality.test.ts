import { describe, expect, it } from "vitest";

import { chooseQuality } from "@/src/render/quality";

describe("render quality", () => {
  it("caps DPR and reduces cosmetic density for reduced motion", () => {
    const high = chooseQuality({ hardwareConcurrency: 12, deviceMemory: 16, devicePixelRatio: 2, reducedMotion: false });
    const reduced = chooseQuality({ hardwareConcurrency: 12, deviceMemory: 16, devicePixelRatio: 2, reducedMotion: true });

    expect(high.dpr).toBeLessThanOrEqual(1.5);
    expect(reduced.currentParticles).toBeLessThan(high.currentParticles);
    expect(reduced.debrisPoints).toBeLessThan(high.debrisPoints);
    expect(reduced.cameraDurationSeconds).toBe(0);
  });
});
