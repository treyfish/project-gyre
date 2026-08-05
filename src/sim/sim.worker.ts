import rawField from "@/src/data/current-field.json";
import { parseCurrentFieldAsset } from "@/src/data/current-field.schema";
import type { Simulation } from "@/src/sim/contracts";
import { createSimulation } from "@/src/sim/simulation";
import type { SimulationSpeed, SimulationWorkerEvent, SimulationWorkerRequest } from "@/src/sim/worker-client";

const field = parseCurrentFieldAsset(rawField);
let simulation: Simulation | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let playing = false;
let speed: SimulationSpeed = 1;

function send(event: SimulationWorkerEvent) {
  if (event.type === "snapshot" || event.type === "ready") {
    self.postMessage(event, { transfer: [event.snapshot.debrisPositions.buffer] });
    return;
  }
  self.postMessage(event);
}

function sendError(code: string, error: unknown) {
  send({ type: "error", error: { code, message: error instanceof Error ? error.message : String(error) } });
}

function stopTimer() {
  if (interval) clearInterval(interval);
  interval = null;
}

function startTimer() {
  stopTimer();
  interval = setInterval(() => {
    if (!simulation || !playing) return;
    let snapshot = simulation.snapshot();
    for (let index = 0; index < speed; index += 1) snapshot = simulation.step();
    send({ type: "snapshot", snapshot });
    if (snapshot.status === "complete") {
      playing = false;
      stopTimer();
      send({ type: "state", playing, speed });
    }
  }, 1_000 / 30);
}

self.onmessage = (event: MessageEvent<SimulationWorkerRequest>) => {
  try {
    const request = event.data;
    if (request.type === "init") {
      simulation = createSimulation({
        field,
        seed: request.seed,
        particleCount: request.particleCount,
        missionTicks: request.missionTicks,
      });
      playing = false;
      speed = 1;
      stopTimer();
      send({ type: "ready", snapshot: simulation.snapshot() });
      send({ type: "state", playing, speed });
      return;
    }
    if (!simulation) throw new Error("Simulation must be initialized before receiving controls");
    if (request.type === "command") {
      simulation.dispatch(request.command);
      if (!playing) send({ type: "snapshot", snapshot: simulation.step() });
      return;
    }
    if (request.type === "setSpeed") {
      speed = request.speed;
      send({ type: "state", playing, speed });
      return;
    }
    if (request.type === "play") {
      playing = true;
      startTimer();
      send({ type: "state", playing, speed });
      return;
    }
    if (request.type === "pause") {
      playing = false;
      stopTimer();
      send({ type: "state", playing, speed });
      return;
    }
    playing = false;
    stopTimer();
    send({ type: "snapshot", snapshot: simulation.reset() });
    send({ type: "state", playing, speed });
  } catch (error) {
    sendError("WORKER_REQUEST", error);
  }
};
