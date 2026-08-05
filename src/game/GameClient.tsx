"use client";

import dynamic from "next/dynamic";

const GameShell = dynamic(() => import("@/src/game/GameShell").then((module) => module.GameShell), {
  ssr: false,
  loading: () => (
    <main className="boot-shell" aria-live="polite">
      <div className="boot-copy">
        <h1>Project<br />Gyre</h1>
        <p>Redirect the current. Recover the ocean.</p>
        <span>Loading ocean system…</span>
      </div>
    </main>
  ),
});

export function GameClient() {
  return <GameShell />;
}
