export type QualityInput = {
  hardwareConcurrency: number;
  deviceMemory?: number;
  devicePixelRatio: number;
  reducedMotion: boolean;
};

export type RenderQuality = {
  name: "reduced" | "balanced" | "high";
  dpr: number;
  currentParticles: number;
  debrisPoints: number;
  cameraDurationSeconds: number;
};

export function chooseQuality(input: QualityInput): RenderQuality {
  if (input.reducedMotion || input.hardwareConcurrency <= 4 || (input.deviceMemory ?? 8) <= 4) {
    return {
      name: "reduced",
      dpr: Math.min(1, input.devicePixelRatio),
      currentParticles: 420,
      debrisPoints: 600,
      cameraDurationSeconds: 0,
    };
  }
  if (input.hardwareConcurrency >= 10 && (input.deviceMemory ?? 8) >= 8) {
    return {
      name: "high",
      dpr: Math.min(1.5, input.devicePixelRatio),
      currentParticles: 1_400,
      debrisPoints: 1_200,
      cameraDurationSeconds: 3,
    };
  }
  return {
    name: "balanced",
    dpr: Math.min(1.25, input.devicePixelRatio),
    currentParticles: 820,
    debrisPoints: 900,
    cameraDurationSeconds: 2.4,
  };
}
