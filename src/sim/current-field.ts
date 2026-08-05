import type { CurrentFieldAsset } from "@/src/data/current-field.schema";
import type { Device, Velocity } from "@/src/sim/contracts";
import { normalizeLongitude } from "@/src/sim/integrator";

function lowerIndex(axis: number[], value: number): number {
  if (value <= axis[0]) return 0;
  for (let index = 0; index < axis.length - 1; index += 1) {
    if (value <= axis[index + 1]) return index;
  }
  return axis.length - 2;
}

function interpolate(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

export function sampleBaseCurrent(field: CurrentFieldAsset, longitude: number, latitude: number): Velocity {
  const lon = Math.min(field.longitudes.at(-1)!, Math.max(field.longitudes[0], normalizeLongitude(longitude)));
  const lat = Math.min(field.latitudes.at(-1)!, Math.max(field.latitudes[0], latitude));
  const x = lowerIndex(field.longitudes, lon);
  const y = lowerIndex(field.latitudes, lat);
  const width = field.longitudes.length;
  const xAmount = (lon - field.longitudes[x]) / (field.longitudes[x + 1] - field.longitudes[x]);
  const yAmount = (lat - field.latitudes[y]) / (field.latitudes[y + 1] - field.latitudes[y]);
  const index00 = y * width + x;
  const index10 = index00 + 1;
  const index01 = index00 + width;
  const index11 = index01 + 1;

  const weighted = (values: number[]) =>
    interpolate(
      interpolate(values[index00], values[index10], xAmount),
      interpolate(values[index01], values[index11], xAmount),
      yAmount,
    );

  const validWeight = weighted(field.mask);
  return validWeight < 0.25 ? { u: 0, v: 0 } : { u: weighted(field.u), v: weighted(field.v) };
}

function wrappedDelta(longitude: number, origin: number): number {
  const delta = normalizeLongitude(longitude) - normalizeLongitude(origin);
  return ((delta + 540) % 360) - 180;
}

export function deviceInfluence(device: Device, longitude: number, latitude: number): Velocity {
  const dx = wrappedDelta(longitude, device.longitude) * Math.cos((latitude * Math.PI) / 180);
  const dy = latitude - device.latitude;
  const distance = Math.hypot(dx, dy);
  const radius = 12;
  if (distance >= radius) return { u: 0, v: 0 };

  const sigma = radius / 2.6;
  const gaussian = Math.exp(-(distance * distance) / (2 * sigma * sigma));
  const returnFlow = 1 - (distance * distance) / (radius * radius);
  const magnitude = device.strength * gaussian * Math.max(0, returnFlow);
  const angle = (device.orientationDeg * Math.PI) / 180;
  return { u: Math.cos(angle) * magnitude, v: Math.sin(angle) * magnitude };
}

export function sampleCombinedCurrent(
  field: CurrentFieldAsset,
  devices: Device[],
  longitude: number,
  latitude: number,
): Velocity {
  const base = sampleBaseCurrent(field, longitude, latitude);
  return devices.reduce(
    (velocity, device) => {
      const influence = deviceInfluence(device, longitude, latitude);
      return { u: velocity.u + influence.u, v: velocity.v + influence.v };
    },
    base,
  );
}
