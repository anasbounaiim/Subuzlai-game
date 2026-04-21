"use client";

import type { UIState } from "../../app/game/engine/types";

export function GameHUD(props: {
  title: string;
  n: number;
  max: number;
  ui: UIState;
  onLevels: () => void;
}) {
  const { ui } = props;

  return (
    <div style={hud}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={props.onLevels} style={btnBack}>← BACK</button>
        <div style={{ width: 4, height: 40, background: "#000000" }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#FFEC27", letterSpacing: "0.1em" }}>
            LVL {props.n} / {props.max}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#FFF1E8", fontFamily: "var(--font-pixel), 'Courier New', monospace", textTransform: "uppercase" }}>{props.title}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Stat label="SCORE" value={ui.score || 0} color="#FFF1E8" />
        
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <Stat label="COINS" value={`${ui.coins}/${ui.totalCoins}`} color="#FFF1E8" />
          <div style={{ position: "relative", width: 80, height: 8, border: "2px solid #000000", background: "#1D2B53", overflow: "hidden" }}>
             <div style={{ 
               width: `${( (ui.coins || 0) / Math.max(1, ui.totalCoins || 1) ) * 100}%`, 
               height: "100%", 
               background: "#FFEC27",
               transition: "width 0.4s steps(4)",
             }} />
          </div>
        </div>

        <Stat label="DEATHS" value={ui.deaths || 0} color="#FF004D" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
         <div style={{ fontSize: 9, fontWeight: 800, color: "#C2C3C7", letterSpacing: "0.1em" }}>CONTROLS</div>
         <div style={{ fontSize: 14, color: "#FFF1E8", fontWeight: 700, fontFamily: "var(--font-pixel), 'Courier New', monospace" }}>
           W A S D - SPACE - R
         </div>
      </div>
    </div>
  );
}

function Stat(props: { label: string; value: any, color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: "#C2C3C7", marginBottom: 0, letterSpacing: "0.1em" }}>{props.label}</div>
      <div style={{ fontWeight: 900, fontSize: 22, color: props.color || "#FFF1E8", fontFamily: "var(--font-pixel), 'Courier New', monospace" }}>{props.value}</div>
    </div>
  );
}

const hud: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 20px",
  border: "4px solid #000000", // Blocky border
  background: "#1D2B53", // Pico-8 Dark Blue
  boxShadow: "6px 6px 0px #000000", // Drop shadow pixel art
  fontFamily: "var(--font-pixel), 'Courier New', monospace"
};

const btnBack: React.CSSProperties = {
  padding: "8px 14px",
  border: "4px solid #000000",
  background: "#FF004D", // Pico-8 Red
  color: "#FFF1E8",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
  textTransform: "uppercase"
};
