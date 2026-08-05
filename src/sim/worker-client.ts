import type { RenderSnapshot, SimulationCommand } from "@/src/sim/contracts";

export type SimulationSpeed = 1 | 4 | 12;

export type SimulationWorkerRequest =
  | { type: "init"; seed: number; particleCount?: number }
  | { type: "command"; command: SimulationCommand }
  | { type: "play" }
  | { type: "pause" }
  | { type: "setSpeed"; speed: SimulationSpeed }
  | { type: "reset" };

export type SimulationWorkerEvent =
  | { type: "ready"; snapshot: RenderSnapshot }
  | { type: "snapshot"; snapshot: RenderSnapshot }
  | { type: "state"; playing: boolean; speed: SimulationSpeed }
  | { type: "error"; error: { code: string; message: string } };

export type WorkerPort = {
  onmessage: ((event: MessageEvent<SimulationWorkerEvent>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
};

type Listener = (event: SimulationWorkerEvent) => void;

function createBrowserWorker(): WorkerPort {
  return new Worker(new URL("./sim.worker.ts", import.meta.url), { type: "module", name: "project-gyre-simulation" });
}

export class SimulationWorkerClient {
  private readonly worker: WorkerPort;
  private readonly listeners = new Set<Listener>();

  constructor(worker: WorkerPort = createBrowserWorker()) {
    this.worker = worker;
    this.worker.onmessage = (event) => this.listeners.forEach((listener) => listener(event.data));
    this.worker.onerror = (event) =>
      this.listeners.forEach((listener) =>
        listener({ type: "error", error: { code: "WORKER_RUNTIME", message: event.message || "Simulation worker failed" } }),
      );
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  init(options: { seed: number; particleCount?: number }) {
    this.worker.postMessage({ type: "init", ...options } satisfies SimulationWorkerRequest);
  }

  command(command: SimulationCommand) {
    this.worker.postMessage({ type: "command", command } satisfies SimulationWorkerRequest);
  }

  play() {
    this.worker.postMessage({ type: "play" } satisfies SimulationWorkerRequest);
  }

  pause() {
    this.worker.postMessage({ type: "pause" } satisfies SimulationWorkerRequest);
  }

  setSpeed(speed: SimulationSpeed) {
    this.worker.postMessage({ type: "setSpeed", speed } satisfies SimulationWorkerRequest);
  }

  reset() {
    this.worker.postMessage({ type: "reset" } satisfies SimulationWorkerRequest);
  }

  terminate() {
    this.worker.terminate();
    this.listeners.clear();
  }
}
