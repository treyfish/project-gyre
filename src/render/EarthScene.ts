import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  SingleTileImageryProvider,
  Viewer,
} from "cesium";

import type { CurrentFieldAsset } from "@/src/data/current-field.schema";
import { CurrentLayer } from "@/src/render/CurrentLayer";
import { DebrisLayer } from "@/src/render/DebrisLayer";
import { DeviceLayer } from "@/src/render/DeviceLayer";
import type { RenderQuality } from "@/src/render/quality";
import type { Device, GeoPoint, RenderSnapshot } from "@/src/sim/contracts";

type EarthSceneOptions = {
  field: CurrentFieldAsset;
  quality: RenderQuality;
  onOceanPick(point: GeoPoint): void;
  onReady?(): void;
  onError?(error: Error): void;
};

declare global {
  var CESIUM_BASE_URL: string | undefined;
}

globalThis.CESIUM_BASE_URL = "/cesium";

export class EarthScene {
  private readonly viewer: Viewer;
  private readonly currentLayer: CurrentLayer;
  private readonly debrisLayer: DebrisLayer;
  private readonly deviceLayer: DeviceLayer;
  private readonly handler: ScreenSpaceEventHandler;
  private readonly onPreRender = () => this.currentLayer.tick();
  private destroyed = false;

  constructor(container: HTMLElement, private readonly options: EarthSceneOptions) {
    this.viewer = new Viewer(container, {
      animation: false,
      baseLayer: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      scene3DOnly: true,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      requestRenderMode: false,
      shouldAnimate: false,
    });
    this.viewer.resolutionScale = options.quality.dpr / Math.max(1, window.devicePixelRatio);
    this.viewer.scene.backgroundColor = Color.fromCssColorString("#020506");
    this.viewer.scene.globe.baseColor = Color.fromCssColorString("#061b26");
    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.globe.showGroundAtmosphere = true;
    this.viewer.scene.fog.enabled = true;
    this.viewer.scene.fog.density = 0.00015;
    this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1_800_000;
    this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 32_000_000;

    this.currentLayer = new CurrentLayer(this.viewer.scene, options.field, options.quality);
    this.debrisLayer = new DebrisLayer(this.viewer.scene, this.viewer.entities, options.quality);
    this.deviceLayer = new DeviceLayer(this.viewer.entities);
    this.viewer.scene.preRender.addEventListener(this.onPreRender);
    this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((movement: { position: Cartesian2 }) => this.pickOcean(movement.position), ScreenSpaceEventType.LEFT_CLICK);

    this.setOpeningView();
    void this.loadImagery();
  }

  flyToMission() {
    return this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(205, 31, 8_700_000),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-87), roll: 0 },
      duration: this.options.quality.cameraDurationSeconds,
    });
  }

  applySnapshot(snapshot: RenderSnapshot) {
    if (this.destroyed) return;
    this.currentLayer.setDevices(snapshot.devices);
    this.debrisLayer.update(snapshot);
    this.deviceLayer.setDevices(snapshot.devices);
  }

  setPlacementPreview(device: Device | null) {
    this.deviceLayer.setPreview(device);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.viewer.scene.preRender.removeEventListener(this.onPreRender);
    this.handler.destroy();
    this.currentLayer.destroy();
    this.debrisLayer.destroy();
    this.deviceLayer.destroy();
    this.viewer.destroy();
  }

  private setOpeningView() {
    this.viewer.camera.setView({
      destination: Cartesian3.fromDegrees(190, 18, 20_500_000),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-74), roll: CesiumMath.toRadians(-4) },
    });
  }

  private async loadImagery() {
    try {
      const provider = await SingleTileImageryProvider.fromUrl("/textures/earth-blue-marble.jpg");
      if (this.destroyed) return;
      const layer = this.viewer.imageryLayers.addImageryProvider(provider);
      layer.brightness = 0.72;
      layer.contrast = 1.12;
      layer.saturation = 0.84;
      this.options.onReady?.();
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private pickOcean(windowPosition: Cartesian2) {
    const ray = this.viewer.camera.getPickRay(windowPosition);
    if (!ray) return;
    const position = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    if (!position) return;
    const cartographic = Cartographic.fromCartesian(position);
    const point = {
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      latitude: CesiumMath.toDegrees(cartographic.latitude),
    };
    if (point.longitude < 0) point.longitude += 360;
    this.options.onOceanPick(point);
  }
}

export function webGlAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
