"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import rawField from "@/src/data/current-field.json";
import { parseCurrentFieldAsset } from "@/src/data/current-field.schema";
import { gameReducer, initialGameState } from "@/src/game/game-state";
import { EarthScene, webGlAvailable } from "@/src/render/EarthScene";
import { chooseQuality } from "@/src/render/quality";
import type { GeoPoint, RenderSnapshot } from "@/src/sim/contracts";
import { SimulationWorkerClient, type SimulationSpeed } from "@/src/sim/worker-client";

const field = parseCurrentFieldAsset(rawField);

function PlayIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8 19 12 7 19.2Z" fill="currentColor" /></svg>;
}

function PauseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" fill="currentColor" /></svg>;
}

function DeviceIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
      <path d="M24 17V5m6 16 10-6M29 28l9 8M19 28l-9 8M18 21 8 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" /><path d="M12 10v7" stroke="currentColor" /><circle cx="12" cy="7" r="1" fill="currentColor" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function Meter({ label, value, tone, display }: { label: string; value: number; tone: string; display: string }) {
  return (
    <div className="score-meter">
      <div className="meter-head"><span>{label}</span><strong>{display}</strong></div>
      <div className="meter-track" aria-label={`${label} ${display}`}>
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: tone }} />
      </div>
    </div>
  );
}

export function GameShell() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [snapshot, setSnapshot] = useState<RenderSnapshot | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState<SimulationSpeed>(1);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<EarthScene | null>(null);
  const clientRef = useRef<SimulationWorkerClient | null>(null);
  const snapshotRef = useRef<RenderSnapshot | null>(null);
  const sequenceRef = useRef(0);

  const deployDevice = useCallback((point: GeoPoint, orientationDeg: number) => {
    const current = snapshotRef.current;
    if (!current || current.availableDevices <= 0) return;
    const sequence = sequenceRef.current++;
    clientRef.current?.command({
      type: "placeDevice",
      tick: current.tick,
      sequence,
      device: {
        id: `current-control-${sequence + 1}`,
        longitude: point.longitude,
        latitude: point.latitude,
        orientationDeg,
        strength: 0.14,
      },
    });
  }, []);

  useEffect(() => {
    if (!sceneContainerRef.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const forcedFailure = searchParams.has("forceNoWebgl");
    if (forcedFailure || !webGlAvailable()) {
      dispatch({ type: "INCOMPATIBLE" });
      return;
    }

    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const quality = chooseQuality({
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: memory,
      devicePixelRatio: window.devicePixelRatio,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    const scene = new EarthScene(sceneContainerRef.current, {
      field,
      quality,
      onDeploy: deployDevice,
      onReady: () => setSceneReady(true),
      onError: (error) => dispatch({ type: "ERROR", message: error.message }),
    });
    const client = new SimulationWorkerClient();
    sceneRef.current = scene;
    clientRef.current = client;

    const unsubscribe = client.subscribe((event) => {
      if (event.type === "error") {
        dispatch({ type: "ERROR", message: event.error.message });
        return;
      }
      if (event.type === "state") {
        setPlaying(event.playing);
        setSpeedState(event.speed);
        return;
      }
      snapshotRef.current = event.snapshot;
      setSnapshot(event.snapshot);
      scene.applySnapshot(event.snapshot);
      if (event.snapshot.status === "complete") dispatch({ type: "COMPLETE" });
    });
    const testMissionTicks = Number(searchParams.get("testMissionTicks"));
    client.init({
      seed: 2_026_080_4,
      particleCount: 1_200,
      missionTicks: Number.isInteger(testMissionTicks) && testMissionTicks >= 60 ? testMissionTicks : undefined,
    });

    return () => {
      unsubscribe();
      client.terminate();
      scene.destroy();
      clientRef.current = null;
      sceneRef.current = null;
    };
  }, [deployDevice]);

  useEffect(() => {
    sceneRef.current?.setMissionVisible(state.missionVisible);
    sceneRef.current?.setPlacementMode(state.placementEnabled && (snapshot?.availableDevices ?? 0) > 0);
  }, [state.missionVisible, state.placementEnabled, snapshot?.availableDevices]);

  const beginMission = () => {
    dispatch({ type: "BEGIN" });
    sceneRef.current?.setMissionVisible(true);
    void sceneRef.current?.flyToMission();
  };

  const enterMission = () => {
    clientRef.current?.pause();
    dispatch({ type: "ENTER_MISSION" });
  };

  const togglePlay = () => {
    if (playing) {
      clientRef.current?.pause();
      dispatch({ type: "PAUSE" });
    } else {
      clientRef.current?.play();
      dispatch({ type: "PLAY" });
    }
  };

  const changeSpeed = (nextSpeed: SimulationSpeed) => {
    setSpeedState(nextSpeed);
    clientRef.current?.setSpeed(nextSpeed);
  };

  const replay = () => {
    clientRef.current?.reset();
    dispatch({ type: "ENTER_MISSION" });
  };

  const recoveryPercent = snapshot ? (snapshot.score.recovery / 70) * 100 : 0;
  const energyPercent = snapshot ? (snapshot.score.energy / 20) * 100 : 100;
  const ecologyPercent = snapshot ? (snapshot.score.ecology / 10) * 100 : 100;
  const remainingWeeks = snapshot ? Math.ceil(snapshot.remainingWeeks) : 18;

  return (
    <main className={`game-shell mode-${state.mode}`}>
      <div ref={sceneContainerRef} className="earth-canvas" data-testid="earth-canvas" aria-hidden="true" />
      <div className="orbit-vignette" />

      {!sceneReady && state.mode !== "incompatible" && state.mode !== "error" && (
        <div className="loading-state" role="status"><span /> Initializing ocean system</div>
      )}

      {state.mode === "opening" && (
        <section className="opening-screen" aria-labelledby="game-title">
          <div className="opening-copy">
            <h1 id="game-title">Project<br />Gyre</h1>
            <p>Redirect the current. Recover the ocean.</p>
            <button className="primary-action" onClick={beginMission} disabled={!sceneReady || !snapshot}>Begin mission</button>
            <button className="text-action" onClick={() => dispatch({ type: "OPEN_DATA" })}>About the data</button>
          </div>
          <p className="opening-note">A playable ocean system · Based on historical surface currents</p>
          <span className="prototype-label">Prototype 01</span>
        </section>
      )}

      {state.mode === "briefing" && (
        <section className="briefing-panel" aria-labelledby="briefing-title">
          <span>Operation 01</span>
          <h2 id="briefing-title">The gyre holds the debris.<br />Make it release.</h2>
          <p>Deploy three current-control arrays. Drag from each placement point to orient its local flow, then advance time and route catchable debris through the collector east of the patch.</p>
          <div className="briefing-steps">
            <div><b>01</b><span>Read the natural flow</span></div>
            <div><b>02</b><span>Deploy and orient</span></div>
            <div><b>03</b><span>Advance and recover</span></div>
          </div>
          <button className="primary-action" onClick={enterMission}>Enter North Pacific</button>
        </section>
      )}

      {(state.mode === "paused" || state.mode === "playing") && snapshot && (
        <section className="mission-hud" aria-label="North Pacific mission controls">
          <header className="mission-topbar">
            <strong>Project Gyre</strong>
            <div><span>North Pacific / Operation 01</span><b>{remainingWeeks} weeks</b></div>
            <button className="icon-button" onClick={() => dispatch({ type: "OPEN_DATA" })} aria-label="About the current data"><InfoIcon /></button>
          </header>

          <aside className="device-dock" aria-label="Current control devices">
            <button
              className={state.placementEnabled ? "selected" : ""}
              onClick={() => dispatch({ type: "SET_PLACEMENT", enabled: !state.placementEnabled })}
              aria-pressed={state.placementEnabled}
              disabled={snapshot.availableDevices === 0}
              aria-label="Deploy current-control device"
            ><DeviceIcon /></button>
            <span>{snapshot.availableDevices} available</span>
          </aside>

          <aside className="score-rail" aria-label="Mission score">
            <Meter label="Recovery" value={recoveryPercent} tone="var(--cyan)" display={`${Math.round(snapshot.score.recovery)} / 70`} />
            <Meter label="Energy" value={energyPercent} tone="var(--amber)" display={`${Math.round(snapshot.score.energy)} / 20`} />
            <Meter label="Ecology" value={ecologyPercent} tone="var(--violet)" display={`${Math.round(snapshot.score.ecology)} / 10`} />
            <div className="total-score"><strong>{Math.round(snapshot.score.total)}</strong><span>/ 100</span></div>
          </aside>

          <div className={`placement-prompt ${state.placementEnabled ? "visible" : ""}`}>
            <DeviceIcon /><span>Click to deploy · Drag to orient</span>
          </div>

          <nav className="transport" aria-label="Simulation time controls">
            <button onClick={togglePlay} aria-label={playing ? "Pause simulation" : "Play simulation"}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
            {([1, 4, 12] as SimulationSpeed[]).map((value) => (
              <button key={value} className={speed === value ? "active" : ""} onClick={() => changeSpeed(value)}>{value}×</button>
            ))}
          </nav>

          <div className="current-legend">
            <strong>Current field</strong>
            <span><i className="natural-line" />Natural</span>
            <span><i className="redirected-line" />Redirected</span>
          </div>

          <p className="data-credit">Earth: NASA Visible Earth · Current: NOAA OSCAR</p>
        </section>
      )}

      {state.mode === "complete" && snapshot && (
        <section className="results-panel" aria-labelledby="results-title">
          <span>Operation complete</span>
          <h2 id="results-title">{Math.round(snapshot.score.total)}<small>/ 100</small></h2>
          <p>{snapshot.recoveredMass > 0 ? "The collector recovered part of the modeled debris field." : "The flow shifted, but the collector missed the modeled debris field."}</p>
          <div className="result-breakdown">
            <div><b>{Math.round(snapshot.score.recovery)}</b><span>Recovery</span></div>
            <div><b>{Math.round(snapshot.score.energy)}</b><span>Energy</span></div>
            <div><b>{Math.round(snapshot.score.ecology)}</b><span>Ecology</span></div>
          </div>
          <button className="primary-action" onClick={replay}>Run again</button>
          <button className="text-action" onClick={() => dispatch({ type: "OPEN_DATA" })}>Review the model</button>
        </section>
      )}

      {state.dataOpen && (
        <aside className="data-drawer" aria-labelledby="data-title">
          <button className="icon-button drawer-close" onClick={() => dispatch({ type: "CLOSE_DATA" })} aria-label="Close data information"><CloseIcon /></button>
          <span>Model disclosure</span>
          <h2 id="data-title">What you are seeing</h2>
          <p>The current field is a historical OSCAR surface-velocity snapshot from NOAA CoastWatch, observed on {new Date(field.manifest.observationTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}.</p>
          <p>The Great Pacific Garbage Patch is diffuse and mobile, not a solid island. The visible fragments represent weighted debris within a broader modeled concentration.</p>
          <p>Current-control arrays are speculative game technology. Real ocean circulation is connected to wind, waves, density, ecosystems, and climate at scales this prototype intentionally simplifies.</p>
          <a href="https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplOscar.html" target="_blank" rel="noreferrer">Open NOAA source ↗</a>
        </aside>
      )}

      {state.mode === "incompatible" && (
        <section className="blocking-state"><h1>Project Gyre</h1><h2>This ocean needs WebGL.</h2><p>Open the demo in a current desktop version of Chrome, Edge, Firefox, or Safari with hardware acceleration enabled.</p></section>
      )}

      {state.mode === "error" && (
        <section className="blocking-state"><h1>Project Gyre</h1><h2>The ocean system did not initialize.</h2><p>{state.errorMessage}</p><button className="primary-action" onClick={() => window.location.reload()}>Retry</button></section>
      )}

      <section className="desktop-gate"><h1>Project Gyre</h1><h2>Designed for a wider horizon.</h2><p>This first playable prototype requires a desktop display at least 900 pixels wide.</p></section>
    </main>
  );
}
