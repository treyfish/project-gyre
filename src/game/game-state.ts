export type GameMode = "opening" | "briefing" | "paused" | "playing" | "complete" | "incompatible" | "error";

export type GameState = {
  mode: GameMode;
  missionVisible: boolean;
  placementEnabled: boolean;
  dataOpen: boolean;
  errorMessage: string | null;
};

export type GameAction =
  | { type: "BEGIN" }
  | { type: "ENTER_MISSION" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "COMPLETE" }
  | { type: "OPEN_DATA" }
  | { type: "CLOSE_DATA" }
  | { type: "SET_PLACEMENT"; enabled: boolean }
  | { type: "INCOMPATIBLE" }
  | { type: "ERROR"; message: string }
  | { type: "RESTART" };

export const initialGameState: GameState = {
  mode: "opening",
  missionVisible: false,
  placementEnabled: false,
  dataOpen: false,
  errorMessage: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "BEGIN":
      return { ...state, mode: "briefing", missionVisible: true, dataOpen: false };
    case "ENTER_MISSION":
      return { ...state, mode: "paused", missionVisible: true, placementEnabled: true };
    case "PLAY":
      return { ...state, mode: "playing", placementEnabled: false };
    case "PAUSE":
      return { ...state, mode: "paused", placementEnabled: true };
    case "COMPLETE":
      return { ...state, mode: "complete", placementEnabled: false };
    case "OPEN_DATA":
      return { ...state, dataOpen: true };
    case "CLOSE_DATA":
      return { ...state, dataOpen: false };
    case "SET_PLACEMENT":
      return { ...state, placementEnabled: action.enabled };
    case "INCOMPATIBLE":
      return { ...state, mode: "incompatible", errorMessage: null };
    case "ERROR":
      return { ...state, mode: "error", errorMessage: action.message };
    case "RESTART":
      return { ...initialGameState };
  }
}
