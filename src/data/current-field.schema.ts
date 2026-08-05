export type CurrentFieldManifest = {
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  observationTime: string;
  bounds: { west: number; south: number; east: number; north: number };
  resolutionDegrees: number;
  units: "m/s";
  checksum: string;
  license: string;
};

export type CurrentFieldAsset = {
  manifest: CurrentFieldManifest;
  longitudes: number[];
  latitudes: number[];
  u: number[];
  v: number[];
  mask: number[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));
}

export function parseCurrentFieldAsset(value: unknown): CurrentFieldAsset {
  if (!isRecord(value) || !isRecord(value.manifest)) {
    throw new Error("current field must include a manifest");
  }

  const { manifest } = value;
  const strings = ["source", "sourceUrl", "retrievedAt", "observationTime", "units", "checksum", "license"] as const;
  if (strings.some((key) => typeof manifest[key] !== "string" || manifest[key].length === 0)) {
    throw new Error("current field manifest is incomplete");
  }
  if (manifest.units !== "m/s" || typeof manifest.resolutionDegrees !== "number" || !isRecord(manifest.bounds)) {
    throw new Error("current field manifest has invalid units, resolution, or bounds");
  }

  const longitudes = value.longitudes;
  const latitudes = value.latitudes;
  const u = value.u;
  const v = value.v;
  const mask = value.mask;
  if (
    !isNumberArray(longitudes) ||
    !isNumberArray(latitudes) ||
    !isNumberArray(u) ||
    !isNumberArray(v) ||
    !isNumberArray(mask)
  ) {
    throw new Error("current field axes and vectors must be finite number arrays");
  }

  const length = longitudes.length * latitudes.length;
  if (u.length !== length || v.length !== length || mask.length !== length) {
    throw new Error("vector arrays must match the grid dimensions");
  }
  if (longitudes.length < 2 || latitudes.length < 2 || !mask.every((entry) => entry === 0 || entry === 1)) {
    throw new Error("current field grid or mask is invalid");
  }

  return value as CurrentFieldAsset;
}
