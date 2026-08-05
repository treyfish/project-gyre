import { describe, expect, it } from "vitest";

import { gameReducer, initialGameState } from "@/src/game/game-state";

describe("game state", () => {
  it("moves through opening, briefing, paused mission, play, and results", () => {
    const briefing = gameReducer(initialGameState, { type: "BEGIN" });
    const paused = gameReducer(briefing, { type: "ENTER_MISSION" });
    const playing = gameReducer(paused, { type: "PLAY" });
    const complete = gameReducer(playing, { type: "COMPLETE" });

    expect(briefing.mode).toBe("briefing");
    expect(paused).toMatchObject({ mode: "paused", missionVisible: true, placementEnabled: true });
    expect(playing.mode).toBe("playing");
    expect(complete.mode).toBe("complete");
  });

  it("opens data information without losing the current mode", () => {
    const state = gameReducer(initialGameState, { type: "OPEN_DATA" });
    expect(state).toMatchObject({ mode: "opening", dataOpen: true });
  });
});
