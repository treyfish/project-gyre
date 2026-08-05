import { describe, expect, it } from "vitest";

import { createSimulation } from "@/src/sim/simulation";
import { eastwardField } from "@/tests/fixtures/current-field";

describe("simulation", () => {
  it("rejects a fourth device and preserves the three-device budget", () => {
    const simulation = createSimulation({ field: eastwardField, seed: 7, particleCount: 8, missionTicks: 40 });

    for (let index = 0; index < 4; index += 1) {
      simulation.dispatch({
        type: "placeDevice",
        tick: 0,
        sequence: index,
        device: { id: `device-${index}`, longitude: 5, latitude: 5, orientationDeg: 0, strength: 0.12 },
      });
    }

    const snapshot = simulation.step();
    expect(snapshot.devices).toHaveLength(3);
    expect(snapshot.availableDevices).toBe(0);
    expect(snapshot.lastRejection).toBe("DEVICE_LIMIT");
  });

  it("produces identical snapshots for the same seed and commands", () => {
    const create = () => createSimulation({ field: eastwardField, seed: 81, particleCount: 16, missionTicks: 40 });
    const first = create();
    const second = create();
    const command = {
      type: "placeDevice" as const,
      tick: 0,
      sequence: 0,
      device: { id: "device-a", longitude: 5, latitude: 5, orientationDeg: 30, strength: 0.12 },
    };
    first.dispatch(command);
    second.dispatch(command);

    for (let index = 0; index < 10; index += 1) {
      expect(Array.from(first.step().debrisPositions)).toEqual(Array.from(second.step().debrisPositions));
    }
    expect(first.snapshot().score).toEqual(second.snapshot().score);
  });
});
