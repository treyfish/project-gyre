import { describe, expect, it } from "vitest";

import type { RenderSnapshot, SimulationCommand } from "@/src/sim/contracts";
import { SimulationWorkerClient, type SimulationWorkerEvent, type WorkerPort } from "@/src/sim/worker-client";

class FakeWorker implements WorkerPort {
  messages: unknown[] = [];
  onmessage: ((event: MessageEvent<SimulationWorkerEvent>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(message: unknown) {
    this.messages.push(message);
  }

  terminate() {}

  emit(event: SimulationWorkerEvent) {
    this.onmessage?.({ data: event } as MessageEvent<SimulationWorkerEvent>);
  }
}

const snapshot: RenderSnapshot = {
  tick: 0,
  missionTicks: 100,
  remainingWeeks: 18,
  status: "ready",
  debrisPositions: new Float32Array([220, 35]),
  devices: [],
  availableDevices: 3,
  recoveredMass: 0,
  totalMass: 1,
  energyUsed: 0,
  disturbance: 0,
  score: { recovery: 0, energy: 20, ecology: 10, total: 30 },
  lastRejection: null,
};

describe("SimulationWorkerClient", () => {
  it("sends typed controls and publishes snapshots", () => {
    const worker = new FakeWorker();
    const client = new SimulationWorkerClient(worker);
    const received: RenderSnapshot[] = [];
    const command: SimulationCommand = {
      type: "placeDevice",
      tick: 0,
      sequence: 0,
      device: { id: "device-a", longitude: 220, latitude: 35, orientationDeg: 20, strength: 0.12 },
    };

    client.subscribe((event) => {
      if (event.type === "snapshot") received.push(event.snapshot);
    });
    client.init({ seed: 42, particleCount: 100 });
    client.command(command);
    client.setSpeed(4);
    worker.emit({ type: "snapshot", snapshot });

    expect(worker.messages).toEqual([
      { type: "init", seed: 42, particleCount: 100 },
      { type: "command", command },
      { type: "setSpeed", speed: 4 },
    ]);
    expect(received).toEqual([snapshot]);
  });
});
