import {
  Cartesian3,
  Color,
  Entity,
  EntityCollection,
  HeightReference,
  PointPrimitive,
  PointPrimitiveCollection,
  Scene,
} from "cesium";

import type { RenderSnapshot } from "@/src/sim/contracts";
import type { RenderQuality } from "@/src/render/quality";

export class DebrisLayer {
  private readonly collection: PointPrimitiveCollection;
  private readonly points: PointPrimitive[] = [];
  private readonly bloom: Entity[] = [];

  constructor(
    private readonly scene: Scene,
    private readonly entities: EntityCollection,
    private readonly quality: RenderQuality,
  ) {
    this.collection = scene.primitives.add(new PointPrimitiveCollection());
    this.bloom.push(
      entities.add({
        id: "debris-bloom-outer",
        position: Cartesian3.fromDegrees(220, 35, 1_000),
        ellipse: {
          semiMajorAxis: 2_050_000,
          semiMinorAxis: 780_000,
          rotation: -0.22,
          material: Color.fromCssColorString("#8c6ccb").withAlpha(0.07),
          outline: true,
          outlineColor: Color.fromCssColorString("#8c6ccb").withAlpha(0.16),
          height: 1_000,
          heightReference: HeightReference.NONE,
        },
      }),
      entities.add({
        id: "debris-bloom-core",
        position: Cartesian3.fromDegrees(220, 35, 1_500),
        ellipse: {
          semiMajorAxis: 1_250_000,
          semiMinorAxis: 480_000,
          rotation: -0.22,
          material: Color.fromCssColorString("#e8a24c").withAlpha(0.095),
          height: 1_500,
          heightReference: HeightReference.NONE,
        },
      }),
    );
  }

  update(snapshot: RenderSnapshot) {
    const count = Math.min(this.quality.debrisPoints, snapshot.debrisPositions.length / 2);
    while (this.points.length < count) {
      const index = this.points.length;
      this.points.push(
        this.collection.add({
          pixelSize: index % 11 === 0 ? 4 : index % 4 === 0 ? 2.5 : 1.6,
          color: (index % 5 === 0 ? Color.fromCssColorString("#8c6ccb") : Color.fromCssColorString("#e8a24c")).withAlpha(0.72),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }),
      );
    }

    this.points.forEach((point, index) => {
      const longitude = snapshot.debrisPositions[index * 2];
      const latitude = snapshot.debrisPositions[index * 2 + 1];
      point.show = Number.isFinite(longitude) && Number.isFinite(latitude);
      if (point.show) point.position = Cartesian3.fromDegrees(longitude, latitude, 25_000);
    });
  }

  destroy() {
    this.scene.primitives.remove(this.collection);
    this.bloom.forEach((entity) => this.entities.remove(entity));
  }
}
