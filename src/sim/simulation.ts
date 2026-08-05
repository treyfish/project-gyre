import { sampleCombinedCurrent } from "@/src/sim/current-field";
import type {
  Device,
  RenderSnapshot,
  Simulation,
  SimulationCommand,
  SimulationOptions,
} from "@/src/sim/contracts";
import { advanceParticle } from "@/src/sim/integrator";
import { SeededRandom } from "@/src/sim/prng";
import { calculateScore } from "@/src/sim/scoring";

type Particle = { longitude: number; latitude: number; mass: number; captured: boolean };

export function createSimulation(options: SimulationOptions): Simulation {
  const particleCount = options.particleCount ?? 1_200;
  const missionTicks = options.missionTicks ?? 12_096;
  const stepSeconds = options.stepSeconds ?? 900;
  const initialSeed = options.seed >>> 0;
  let random = new SeededRandom(initialSeed);
  let tick = 0;
  let status: RenderSnapshot["status"] = "ready";
  let devices: Device[] = [];
  let commands: SimulationCommand[] = [];
  let energyUsed = 0;
  let disturbance = 0;
  let lastRejection: RenderSnapshot["lastRejection"] = null;
  const bounds = options.field.manifest.bounds;
  const longitudeSpan = bounds.east - bounds.west;
  const latitudeSpan = bounds.north - bounds.south;

  const createParticles = (): Particle[] =>
    Array.from({ length: particleCount }, () => {
      const lonNoise = Array.from({ length: 6 }, () => random.next()).reduce((sum, value) => sum + value, -3);
      const latNoise = Array.from({ length: 6 }, () => random.next()).reduce((sum, value) => sum + value, -3);
      return {
        longitude: bounds.west + longitudeSpan * 0.64 + lonNoise * longitudeSpan * 0.075,
        latitude: bounds.south + latitudeSpan * 0.5 + latNoise * latitudeSpan * 0.085,
        mass: 1,
        captured: false,
      };
    });

  let particles = createParticles();

  const applyCommand = (command: SimulationCommand) => {
    if (command.type === "placeDevice") {
      if (devices.some((device) => device.id === command.device.id)) {
        lastRejection = "DUPLICATE_DEVICE";
      } else if (devices.length >= 3) {
        lastRejection = "DEVICE_LIMIT";
      } else {
        devices = [...devices, { ...command.device }];
      }
      return;
    }
    if (command.type === "rotateDevice") {
      devices = devices.map((device) =>
        device.id === command.deviceId ? { ...device, orientationDeg: command.orientationDeg } : device,
      );
      return;
    }
    devices = devices.filter((device) => device.id !== command.deviceId);
  };

  const inCollector = (particle: Particle) => {
    const collectorLongitude = bounds.west + longitudeSpan * 0.79;
    const south = bounds.south + latitudeSpan * 0.3;
    const north = bounds.south + latitudeSpan * 0.72;
    return Math.abs(particle.longitude - collectorLongitude) <= longitudeSpan * 0.012 && particle.latitude >= south && particle.latitude <= north;
  };

  const snapshot = (): RenderSnapshot => {
    const positions = new Float32Array(particles.length * 2);
    particles.forEach((particle, index) => {
      positions[index * 2] = particle.captured ? Number.NaN : particle.longitude;
      positions[index * 2 + 1] = particle.captured ? Number.NaN : particle.latitude;
    });
    const recoveredMass = particles.reduce((mass, particle) => mass + (particle.captured ? particle.mass : 0), 0);
    const totalMass = particles.reduce((mass, particle) => mass + particle.mass, 0);
    return {
      tick,
      missionTicks,
      remainingWeeks: Math.max(0, ((missionTicks - tick) * stepSeconds) / (7 * 24 * 3_600)),
      status,
      debrisPositions: positions,
      devices: devices.map((device) => ({ ...device })),
      availableDevices: Math.max(0, 3 - devices.length),
      recoveredMass,
      totalMass,
      energyUsed,
      disturbance,
      score: calculateScore({ recoveredMass, totalMass, energyUsed, energyBudget: 2.5, disturbance, disturbanceLimit: 1 }),
      lastRejection,
    };
  };

  const reset = () => {
    random = new SeededRandom(initialSeed);
    tick = 0;
    status = "ready";
    devices = [];
    commands = [];
    energyUsed = 0;
    disturbance = 0;
    lastRejection = null;
    particles = createParticles();
    return snapshot();
  };

  return {
    dispatch(command) {
      commands.push(command);
      commands.sort((a, b) => a.tick - b.tick || a.sequence - b.sequence);
    },
    step() {
      if (status === "complete") return snapshot();
      status = "running";
      lastRejection = null;
      const due = commands.filter((command) => command.tick <= tick);
      commands = commands.filter((command) => command.tick > tick);
      due.forEach(applyCommand);

      particles = particles.map((particle) => {
        if (particle.captured) return particle;
        const next = advanceParticle(particle, stepSeconds, (longitude, latitude) =>
          sampleCombinedCurrent(options.field, devices, longitude, latitude),
        );
        const advanced = { ...particle, ...next };
        return inCollector(advanced) ? { ...advanced, captured: true } : advanced;
      });

      energyUsed += devices.length / missionTicks;
      for (let left = 0; left < devices.length; left += 1) {
        for (let right = left + 1; right < devices.length; right += 1) {
          const separation = Math.hypot(
            devices[left].longitude - devices[right].longitude,
            devices[left].latitude - devices[right].latitude,
          );
          if (separation < 12) disturbance += (12 - separation) / (12 * missionTicks);
        }
      }

      tick += 1;
      if (tick >= missionTicks) status = "complete";
      return snapshot();
    },
    snapshot,
    reset,
  };
}
