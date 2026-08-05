import {
  Cartesian3,
  Color,
  Entity,
  EntityCollection,
  PolylineGlowMaterialProperty,
} from "cesium";

import type { Device } from "@/src/sim/contracts";

const collectorLongitude = 234.8;

function orientationEnd(device: Device, orientationOffset = 0, length = 5) {
  const angle = ((device.orientationDeg + orientationOffset) * Math.PI) / 180;
  return {
    longitude: device.longitude + (Math.cos(angle) * length) / Math.max(0.4, Math.cos((device.latitude * Math.PI) / 180)),
    latitude: device.latitude + Math.sin(angle) * length,
  };
}

export class DeviceLayer {
  private deviceEntities: Entity[] = [];
  private previewEntities: Entity[] = [];
  private readonly collector: Entity[] = [];
  private deviceSignature = "";

  constructor(private readonly entities: EntityCollection) {
    const collectorColor = Color.fromCssColorString("#c9ffff").withAlpha(0.8);
    this.collector.push(
      entities.add({
        id: "collector-corridor",
        polyline: {
          positions: Cartesian3.fromDegreesArray([collectorLongitude, 25, collectorLongitude, 46]),
          width: 5,
          material: new PolylineGlowMaterialProperty({ glowPower: 0.18, color: collectorColor }),
          clampToGround: false,
        },
      }),
    );
    for (let latitude = 26; latitude <= 45; latitude += 2.7) {
      this.collector.push(
        entities.add({
          id: `collector-node-${latitude}`,
          position: Cartesian3.fromDegrees(collectorLongitude, latitude, 32_000),
          point: { pixelSize: 5, color: collectorColor, outlineColor: Color.WHITE.withAlpha(0.7), outlineWidth: 1 },
        }),
      );
    }
  }

  setDevices(devices: Device[]) {
    const signature = devices
      .map((device) => `${device.id}:${device.longitude.toFixed(3)}:${device.latitude.toFixed(3)}:${device.orientationDeg.toFixed(1)}`)
      .join("|");
    if (signature === this.deviceSignature) return;
    this.deviceSignature = signature;
    this.deviceEntities.forEach((entity) => this.entities.remove(entity));
    this.deviceEntities = devices.flatMap((device) => this.createDevice(device, false));
  }

  setPreview(device: Device | null) {
    this.previewEntities.forEach((entity) => this.entities.remove(entity));
    this.previewEntities = device ? this.createDevice(device, true) : [];
  }

  setVisible(visible: boolean) {
    [...this.deviceEntities, ...this.previewEntities, ...this.collector].forEach((entity) => {
      entity.show = visible;
    });
  }

  destroy() {
    [...this.deviceEntities, ...this.previewEntities, ...this.collector].forEach((entity) => this.entities.remove(entity));
  }

  private createDevice(device: Device, preview: boolean): Entity[] {
    const suffix = preview ? "preview" : device.id;
    const color = Color.fromCssColorString(preview ? "#c9ffff" : "#57e5e5").withAlpha(preview ? 0.62 : 0.92);
    const result: Entity[] = [
      this.entities.add({
        id: `device-center-${suffix}`,
        position: Cartesian3.fromDegrees(device.longitude, device.latitude, 38_000),
        point: { pixelSize: preview ? 10 : 12, color: Color.fromCssColorString("#071013"), outlineColor: color, outlineWidth: 3 },
      }),
      this.entities.add({
        id: `device-ring-${suffix}`,
        position: Cartesian3.fromDegrees(device.longitude, device.latitude, 18_000),
        ellipse: {
          semiMajorAxis: 650_000,
          semiMinorAxis: 650_000,
          material: color.withAlpha(0.035),
          outline: true,
          outlineColor: color.withAlpha(0.48),
          height: 18_000,
        },
      }),
    ];

    for (const offset of [0, 120, 240]) {
      const end = orientationEnd(device, offset, offset === 0 ? 6 : 3.6);
      result.push(
        this.entities.add({
          id: `device-vane-${suffix}-${offset}`,
          polyline: {
            positions: Cartesian3.fromDegreesArray([device.longitude, device.latitude, end.longitude, end.latitude]),
            width: offset === 0 ? 3 : 2,
            material: new PolylineGlowMaterialProperty({ glowPower: 0.15, color }),
          },
        }),
      );
    }
    return result;
  }
}
