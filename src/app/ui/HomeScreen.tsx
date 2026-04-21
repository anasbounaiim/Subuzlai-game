"use client";

const UI = {
  mist: "#8e8a98",
  pink: "#cf73e6",
  ink: "#17131f",
  plum: "#343140",
  lilac: "#cf86ff",
};

export function HomeScreen(props: { onPlay: () => void; onReset: () => void; onQuickStart: () => void }) {
  return (
    <div style={{ width: 900, color: UI.mist, textAlign: "center" }}>
      <div
        style={{
          margin: "0 auto",
          maxWidth: 720,
          border: `4px solid ${UI.ink}`,
          background: UI.plum,
          borderRadius: 18,
          padding: 22
        }}
      >
        <h1 style={{ fontSize: 48, fontWeight: 950, margin: 0, letterSpacing: -1 }}>
          Flat Puzzle Platformer
        </h1>

        {/* ✅ updated subtitle */}
        <p style={{ opacity: 0.85, marginTop: 10, marginBottom: 18 }}>
          Dual Characters • Trampolines • Keys • Switches • Gun Puzzles
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={props.onPlay} style={btnPrimary}>Play</button>
          <button onClick={props.onReset} style={btnGhost}>Reset Progress</button>
          <button onClick={props.onQuickStart} style={btnGreen}>Quick Start (Level 1)</button>
        </div>

        {/* ✅ updated controls */}
        <div style={{ marginTop: 16, opacity: 0.8, fontSize: 13, lineHeight: 1.75 }}>
          Controls: <b>A/D</b> or <b>←/→</b> move — <b>W/↑/Space</b> jump — <b>E</b> action
          <br />
          <b>Q</b> swap Human/Cat — <b>K</b> shoot (Human only) — <b>R</b> restart — <b>Esc</b> level select
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: `3px solid ${UI.ink}`,
  background: UI.lilac,
  color: UI.ink,
  fontWeight: 900,
  cursor: "pointer"
};

const btnGhost: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: `3px solid ${UI.ink}`,
  background: UI.ink,
  color: UI.mist,
  fontWeight: 900,
  cursor: "pointer"
};

const btnGreen: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: `3px solid ${UI.ink}`,
  background: UI.pink,
  color: UI.ink,
  fontWeight: 900,
  cursor: "pointer"
};
