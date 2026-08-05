import { describe, expect, it } from "vitest";

import { calculateScore } from "@/src/sim/scoring";

describe("mission scoring", () => {
  it("weights recovery, energy, and ecology as 70/20/10", () => {
    expect(
      calculateScore({ recoveredMass: 50, totalMass: 100, energyUsed: 1, energyBudget: 2, disturbance: 0.25, disturbanceLimit: 1 }),
    ).toEqual({ recovery: 35, energy: 10, ecology: 7.5, total: 52.5 });
  });
});
