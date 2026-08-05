import type { CurrentFieldAsset } from "@/src/data/current-field.schema";

export type Velocity = { u: number; v: number };
export type GeoPoint = { longitude: number; latitude: number };

export type Device = GeoPoint & {
  id: string;
  orientationDeg: number;
  strength: number;
};

export type PlaceDeviceCommand = {
  type: "placeDevice";
  tick: number;
  sequence: number;
  device: Device;
};

export type RotateDeviceCommand = {
  type: "rotateDevice";
  tick: number;
  sequence: number;
  deviceId: string;
  orientationDeg: number;
};

export type RemoveDeviceCommand = {
  type: "removeDevice";
  tick: number;
  sequence: number;
  deviceId: string;
};

export type SimulationCommand = PlaceDeviceCommand | RotateDeviceCommand | RemoveDeviceCommand;

export type ScoreBreakdown = {
  recovery: number;
  energy: number;
  ecology: number;
  total: number;
};

export type RenderSnapshot = {
  tick: number;
  missionTicks: number;
  remainingWeeks: number;
  status: "ready" | "running" | "complete";
  debrisPositions: Float32Array;
  devices: Device[];
  availableDevices: number;
  recoveredMass: number;
  totalMass: number;
  energyUsed: number;
  disturbance: number;
  score: ScoreBreakdown;
  lastRejection: "DEVICE_LIMIT" | "DUPLICATE_DEVICE" | null;
};

export type SimulationOptions = {
  field: CurrentFieldAsset;
  seed: number;
  particleCount?: number;
  missionTicks?: number;
  stepSeconds?: number;
};

export type Simulation = {
  dispatch(command: SimulationCommand): void;
  step(): RenderSnapshot;
  snapshot(): RenderSnapshot;
  reset(): RenderSnapshot;
};
