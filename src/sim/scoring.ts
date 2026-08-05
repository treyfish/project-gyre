import type { ScoreBreakdown } from "@/src/sim/contracts";

type ScoreInput = {
  recoveredMass: number;
  totalMass: number;
  energyUsed: number;
  energyBudget: number;
  disturbance: number;
  disturbanceLimit: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const round = (value: number) => Math.round(value * 100) / 100;

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const recovery = round(clamp01(input.recoveredMass / Math.max(1, input.totalMass)) * 70);
  const energy = round(clamp01(1 - input.energyUsed / Math.max(0.0001, input.energyBudget)) * 20);
  const ecology = round(clamp01(1 - input.disturbance / Math.max(0.0001, input.disturbanceLimit)) * 10);
  return { recovery, energy, ecology, total: round(recovery + energy + ecology) };
}
