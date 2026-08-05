import type { GeoPoint, Velocity } from "@/src/sim/contracts";

const METERS_PER_DEGREE = 111_320;

export function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function offset(point: GeoPoint, velocity: Velocity, seconds: number): GeoPoint {
  const cosine = Math.max(0.1, Math.cos((point.latitude * Math.PI) / 180));
  return {
    longitude: normalizeLongitude(point.longitude + (velocity.u * seconds) / (METERS_PER_DEGREE * cosine)),
    latitude: Math.max(-89.9, Math.min(89.9, point.latitude + (velocity.v * seconds) / METERS_PER_DEGREE)),
  };
}

export function advanceParticle(
  point: GeoPoint,
  seconds: number,
  sample: (longitude: number, latitude: number) => Velocity,
): GeoPoint {
  const initial = sample(point.longitude, point.latitude);
  const midpoint = offset(point, initial, seconds / 2);
  const midpointVelocity = sample(midpoint.longitude, midpoint.latitude);
  return offset(point, midpointVelocity, seconds);
}
