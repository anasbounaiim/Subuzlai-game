// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { StartMenu } from "./ui/StartMenu";
import { LevelSelect } from "./ui/LevelSelect";
import { PlatformerGame } from "./game/PlatformerGame";
import { playPixelSound } from "./game/audio";

export default function Page() {
  const [screen, setScreen] = useState<"start" | "levels" | "game">("start");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#000000", color: "#FFF1E8", padding: 20, fontFamily: "var(--font-pixel), 'Courier New', monospace" }}>
      {loading && (
        <div style={loadingScreen} aria-label="Loading">
          <style>{`
            @keyframes loadingLogoPulse {
              0%, 100% { transform: translateY(0) scale(1); filter: brightness(0.88); }
              50% { transform: translateY(-6px) scale(1.03); filter: brightness(1.16); }
            }

            @keyframes loadingLogoReveal {
              from { clip-path: inset(0 100% 0 0); }
              to { clip-path: inset(0 0 0 0); }
            }
          `}</style>
          <div style={loadingLogoWrap}>
            <img src="/loading_logo.png" alt="Loading" draggable={false} style={loadingLogoGhost} />
            <img src="/loading_logo.png" alt="" aria-hidden="true" draggable={false} style={loadingLogo} />
          </div>
        </div>
      )}

      {!loading && (
      <>
      {screen === "start" && (
        <StartMenu
          onPlay={() => {
            playPixelSound("click");
            setSelectedLevel(1);
            setScreen("game");
          }}
          onLevels={() => {
            playPixelSound("click");
            setScreen("levels");
          }}
        />
      )}
      
      {screen === "levels" && (
        <LevelSelect
          onPick={(id) => {
            playPixelSound("click");
            setSelectedLevel(id);
            setScreen("game");
          }}
        />
      )}

      {screen === "game" && (
        <PlatformerGame
          startLevelId={selectedLevel}
          onBack={() => setScreen("levels")}
        />
      )}
      </>
      )}
    </div>
  );
}

const loadingScreen: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 20,
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "clamp(24px, 5vw, 50px)",
  background: "#000000",
  overflow: "hidden",
  imageRendering: "pixelated",
};

const loadingLogoWrap: React.CSSProperties = {
  position: "relative",
  width: "min(62vw, 440px)",
  lineHeight: 0,
  animation: "loadingLogoPulse 920ms steps(5) infinite",
};

const loadingLogoGhost: React.CSSProperties = {
  width: "100%",
  height: "auto",
  opacity: 0.22,
  filter: "grayscale(1) brightness(0.58)",
  imageRendering: "pixelated",
};

const loadingLogo: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "auto",
  animation: "loadingLogoReveal 3000ms steps(14) both",
  imageRendering: "pixelated",
};
