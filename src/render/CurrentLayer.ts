import {
  Cartesian3,
  Color,
  Material,
  PointPrimitive,
  PointPrimitiveCollection,
  PolylineCollection,
  Scene,
} from "cesium";

import type { CurrentFieldAsset } from "@/src/data/current-field.schema";
import type { Device } from "@/src/sim/contracts";
import { sampleCombinedCurrent } from "@/src/sim/current-field";
import { advanceParticle } from "@/src/sim/integrator";
import type { RenderQuality } from "@/src/render/quality";

type FlowParticle = { longitude: number; latitude: number; point: PointPrimitive; seedIndex: number };

export class CurrentLayer {
  private readonly points: PointPrimitiveCollection;
  private lines: PolylineCollection;
  private readonly particles: FlowParticle[] = [];
  private readonly validCells: number[];
  private devices: Device[] = [];
  private deviceSignature = "";
  private lastFrame = 0;

  constructor(
    private readonly scene: Scene,
    private readonly field: CurrentFieldAsset,
    quality: RenderQuality,
  ) {
    this.points = scene.primitives.add(new PointPrimitiveCollection());
    this.lines = scene.primitives.add(new PolylineCollection());
    this.validCells = field.mask.flatMap((value, index) => (value ? [index] : []));
    const width = field.longitudes.length;

    for (let index = 0; index < quality.currentParticles; index += 1) {
      const seedIndex = this.validCells[(index * 97) % this.validCells.length];
      const x = seedIndex % width;
      const y = Math.floor(seedIndex / width);
      const longitude = field.longitudes[x] + (((index * 37) % 100) / 100 - 0.5) * field.manifest.resolutionDegrees;
      const latitude = field.latitudes[y] + (((index * 61) % 100) / 100 - 0.5) * field.manifest.resolutionDegrees;
      const point = this.points.add({
        position: Cartesian3.fromDegrees(longitude, latitude, 14_000),
        pixelSize: index % 7 === 0 ? 2.2 : 1.25,
        color: Color.fromCssColorString("#57e5e5").withAlpha(index % 5 === 0 ? 0.88 : 0.48),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
      this.particles.push({ longitude, latitude, point, seedIndex });
    }
    this.rebuildStreamlines();
  }

  setDevices(devices: Device[]) {
    const signature = devices
      .map((device) => `${device.id}:${device.longitude.toFixed(3)}:${device.latitude.toFixed(3)}:${device.orientationDeg.toFixed(1)}`)
      .join("|");
    if (signature === this.deviceSignature) return;
    this.deviceSignature = signature;
    this.devices = devices.map((device) => ({ ...device }));
    this.rebuildStreamlines();
  }

  setVisible(visible: boolean) {
    this.points.show = visible;
    this.lines.show = visible;
  }

  tick(now = performance.now()) {
    if (document.hidden) return;
    if (this.lastFrame === 0) this.lastFrame = now;
    const elapsed = Math.min(0.05, (now - this.lastFrame) / 1_000);
    if (elapsed < 1 / 40) return;
    this.lastFrame = now;
    const bounds = this.field.manifest.bounds;
    const width = this.field.longitudes.length;

    this.particles.forEach((particle, index) => {
      const next = advanceParticle(
        particle,
        elapsed * 900_000,
        (longitude, latitude) => sampleCombinedCurrent(this.field, this.devices, longitude, latitude),
      );
      const outside =
        next.longitude < bounds.west ||
        next.longitude > bounds.east ||
        next.latitude < bounds.south ||
        next.latitude > bounds.north;
      if (outside) {
        particle.seedIndex = this.validCells[(particle.seedIndex + index * 13 + 1) % this.validCells.length];
        const x = particle.seedIndex % width;
        const y = Math.floor(particle.seedIndex / width);
        particle.longitude = this.field.longitudes[x];
        particle.latitude = this.field.latitudes[y];
      } else {
        particle.longitude = next.longitude;
        particle.latitude = next.latitude;
      }
      particle.point.position = Cartesian3.fromDegrees(particle.longitude, particle.latitude, 14_000);
    });
  }

  destroy() {
    this.scene.primitives.remove(this.points);
    this.scene.primitives.remove(this.lines);
  }

  private rebuildStreamlines() {
    this.scene.primitives.remove(this.lines);
    this.lines = this.scene.primitives.add(new PolylineCollection());
    const width = this.field.longitudes.length;
    const color = Color.fromCssColorString("#57e5e5").withAlpha(0.2);

    for (let y = 2; y < this.field.latitudes.length - 2; y += 4) {
      for (let x = 2; x < width - 2; x += 5) {
        const cell = y * width + x;
        if (!this.field.mask[cell]) continue;
        let cursor = { longitude: this.field.longitudes[x], latitude: this.field.latitudes[y] };
        const positions = [Cartesian3.fromDegrees(cursor.longitude, cursor.latitude, 7_000)];
        for (let step = 0; step < 8; step += 1) {
          cursor = advanceParticle(
            cursor,
            300_000,
            (longitude, latitude) => sampleCombinedCurrent(this.field, this.devices, longitude, latitude),
          );
          positions.push(Cartesian3.fromDegrees(cursor.longitude, cursor.latitude, 7_000));
        }
        this.lines.add({
          positions,
          width: 1.15,
          material: Material.fromType("Color", { color }),
        });
      }
    }
  }
}
