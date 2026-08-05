import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "src", "data", "current-field.json");
const query = "u[117][0][60:3:210][360:3:720],v[117][0][60:3:210][360:3:720]";
const sourceUrl = `https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplOscar.csv0?${query}`;

const response = await fetch(sourceUrl, { headers: { "user-agent": "project-gyre-data-pipeline/0.1" } });
if (!response.ok) {
  throw new Error(`NOAA ERDDAP request failed: ${response.status} ${response.statusText}`);
}

const rows = (await response.text())
  .trim()
  .split("\n")
  .map((line) => {
    const [time, , latitude, longitude, eastward, northward] = line.split(",");
    return {
      time,
      latitude: Number(latitude),
      longitude: Number(longitude),
      u: Number(eastward),
      v: Number(northward),
    };
  })
  .sort((a, b) => a.latitude - b.latitude || a.longitude - b.longitude);

if (rows.length === 0) {
  throw new Error("NOAA ERDDAP returned no current rows");
}

const longitudes = [...new Set(rows.map((row) => row.longitude))].sort((a, b) => a - b);
const latitudes = [...new Set(rows.map((row) => row.latitude))].sort((a, b) => a - b);
const byCoordinate = new Map(rows.map((row) => [`${row.latitude}:${row.longitude}`, row]));
const u = [];
const v = [];
const mask = [];

for (const latitude of latitudes) {
  for (const longitude of longitudes) {
    const row = byCoordinate.get(`${latitude}:${longitude}`);
    const valid = Boolean(row && Number.isFinite(row.u) && Number.isFinite(row.v));
    u.push(valid ? Number(row.u.toFixed(5)) : 0);
    v.push(valid ? Number(row.v.toFixed(5)) : 0);
    mask.push(valid ? 1 : 0);
  }
}

const checksum = createHash("sha256")
  .update(JSON.stringify({ longitudes, latitudes, u, v, mask }))
  .digest("hex");

const asset = {
  manifest: {
    source: "NOAA CoastWatch ERDDAP / Earth & Space Research OSCAR Sea Surface Velocity",
    sourceUrl,
    retrievedAt: new Date().toISOString(),
    observationTime: rows[0].time,
    bounds: {
      west: longitudes[0],
      south: latitudes[0],
      east: longitudes.at(-1),
      north: latitudes.at(-1),
    },
    resolutionDegrees: Number((longitudes[1] - longitudes[0]).toFixed(6)),
    units: "m/s",
    checksum,
    license: "Free use and redistribution with NOAA/ERD accuracy and warranty disclaimer; not intended for legal use.",
  },
  longitudes,
  latitudes,
  u,
  v,
  mask,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(asset)}\n`);
console.log(`Wrote ${output} (${longitudes.length}×${latitudes.length}, ${rows[0].time}, sha256:${checksum.slice(0, 12)})`);
