"use client";

import React, { useEffect, useMemo, useState } from "react";
import { loadUnlockedMax, saveUnlockedMax } from "../game/engine/storage";
import { getLevelCount } from "../levels";

const UI = {
  mist: "#8e8a98",
  pink: "#cf73e6",
  ink: "#17131f",
  plum: "#343140",
  lilac: "#cf86ff",
  monsterInk: "#04193f",
  monsterViolet: "#6f24ff",
  monsterPink: "#ee84ff",
  monsterWhite: "#fff7ff",
};

export function LevelSelect(props: { onPick: (levelId: number) => void }) {
  const totalLevels = getLevelCount();
  const [unlockedMax, setUnlockedMax] = useState(totalLevels);

  useEffect(() => {
    const fullyUnlocked = Math.max(loadUnlockedMax(), totalLevels);
    saveUnlockedMax(fullyUnlocked);
    setUnlockedMax(fullyUnlocked);
  }, [totalLevels]);

  const levels = useMemo(
    () => Array.from({ length: totalLevels }, (_, i) => i + 1),
    [totalLevels]
  );

  return (
    <div style={shell}>
      <div style={screen}>
        <style>{`
          @keyframes levelBgIntro {
            from { opacity: 0; filter: brightness(0.62) contrast(1.25); }
            to { opacity: 1; filter: brightness(1) contrast(1); }
          }

          @keyframes levelCarParallax {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(-50%, 0, 0); }
          }

          .level-bg-layer {
            position: absolute;
            inset: -4%;
            display: flex;
            align-items: center;
            overflow: hidden;
            animation: levelBgIntro 650ms steps(7) both;
          }

          .level-bg-track {
            display: flex;
            flex: 0 0 auto;
            height: 100%;
            animation: levelCarParallax var(--scroll-time) linear infinite 650ms;
            will-change: transform;
          }

          .level-bg-tile {
            display: block;
            flex: 0 0 auto;
            width: auto;
            height: 100%;
            max-width: none;
            image-rendering: pixelated;
            user-select: none;
            pointer-events: none;
          }

          .level-bg-sky {
            --scroll-time: 90s;
          }

          .level-bg-city-far {
            --scroll-time: 42s;
          }

          .level-bg-city-near {
            --scroll-time: 28s;
          }

          .level-bg-detail {
            --scroll-time: 18s;
          }

          .level-bg-trees {
            --scroll-time: 12s;
          }

          .arcade-button {
            transition:
              transform 80ms steps(2),
              box-shadow 80ms steps(2),
              filter 80ms steps(2);
          }

          .arcade-button:not(:disabled):hover,
          .arcade-button:not(:disabled):focus-visible {
            filter: brightness(1.08);
            transform: translate(-3px, -4px);
            box-shadow:
              inset 7px 7px 0 rgba(255,247,255,0.62),
              inset -7px 0 0 #a737ff,
              inset 0 -10px 0 #7b24f5,
              0 9px 0 #7b24f5;
            outline: none;
          }

          .arcade-button:not(:disabled):active {
            transform: translate(6px, 7px);
            box-shadow:
              inset 4px 4px 0 rgba(255,247,255,0.36),
              inset -4px 0 0 #a737ff,
              inset 0 -4px 0 #7b24f5,
              0 1px 0 #7b24f5;
          }

        `}</style>

        <ParallaxLayer className="level-bg-sky" src="/background/1.png" />
        <ParallaxLayer className="level-bg-city-far" src="/background/2.png" />
        <ParallaxLayer className="level-bg-city-near" src="/background/3.png" />
        <ParallaxLayer className="level-bg-detail" src="/background/4.png" />
        <ParallaxLayer className="level-bg-trees" src="/background/5.png" />
        <div style={shade} />

        <div style={panel}>
          <h1 style={title} aria-live="polite">
            SELECT LEVEL
          </h1>

          <div style={levelGrid}>
            {levels.map((id) => {
              const locked = id > unlockedMax;

              return (
                <ArcadeButton
                  key={id}
                  onClick={() => {
                    if (locked) return;
                    props.onPick(id);
                  }}
                  disabled={locked}
                  style={{
                    ...levelButton,
                    ...(id > 10 ? twoDigitLevelButton : null),
                    ...(locked ? lockedLevelButton : openLevelButton),
                  }}
                >
                  {id === 10 ? (
                    <img
                      src="/level10.png"
                      alt="Level 10"
                      draggable={false}
                      style={level10Image}
                    />
                  ) : locked ? (
                    "LOCK"
                  ) : (
                    id
                  )}
                </ArcadeButton>
              );
            })}
          </div>
        </div>

        <div style={copyrightLine}>© 2026 ANAS BOUNAIM MAYBE A BAD IDEA</div>
      </div>
    </div>
  );
}

function ArcadeButton(props: {
  children: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      className="arcade-button"
      aria-label={props.ariaLabel}
      disabled={props.disabled}
      onClick={props.onClick}
      style={props.style}
    >
      {props.children}
    </button>
  );
}

function ParallaxLayer(props: { className: string; src: string }) {
  return (
    <div className={`level-bg-layer ${props.className}`} aria-hidden="true">
      <div className="level-bg-track">
        <img className="level-bg-tile" src={props.src} alt="" draggable={false} />
        <img className="level-bg-tile" src={props.src} alt="" draggable={false} />
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  width: "min(100%, 1022px)",
  aspectRatio: "1022 / 616",
  display: "grid",
  placeItems: "center",
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
};

const screen: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  aspectRatio: "1022 / 616",
  overflow: "hidden",
  background: "#5a5a60",
  imageRendering: "pixelated",
};

const shade: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(142,138,152,0.35) 0%, rgba(52,49,64,0.24) 48%, rgba(23,19,31,0.1) 100%)",
  pointerEvents: "none",
};

const panel: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
};

const title: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "11%",
  transform: "translateX(-50%)",
  margin: 0,
  color: "#f19aff",
  fontSize: "clamp(32px, 5.4vw, 56px)",
  lineHeight: 1,
  fontWeight: 600,
  letterSpacing: 0,
  wordSpacing: "clamp(16px, 3.4vw, 34px)",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  textShadow: [
    "9px 0 0 #6f24ff",
    "0 4px 0 #6f24ff",
  ].join(", "),
};

const levelGrid: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "34%",
  transform: "translateX(-50%)",
  display: "grid",
  gridTemplateColumns: "repeat(5, clamp(78px, 10vw, 104px))",
  justifyContent: "center",
  gap: "16px 20px",
};

const levelButton: React.CSSProperties = {
  appearance: "none",
  width: "clamp(78px, 10vw, 104px)",
  height: "clamp(78px, 10vw, 104px)",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  padding: 0,
  border: `3px solid ${UI.monsterViolet}`,
  boxShadow: [
    `inset 7px 7px 0 rgba(255,247,255,0.55)`,
    `inset -7px 0 0 #a737ff`,
    `inset 0 -10px 0 #7b24f5`,
    `8px 8px 0 ${UI.monsterInk}`,
    `12px 12px 0 rgba(5,6,18,0.38)`,
  ].join(", "),
  fontFamily: "inherit",
  fontSize: "clamp(38px, 5vw, 54px)",
  fontWeight: 400,
  cursor: "pointer",
  imageRendering: "pixelated",
  textShadow: "none",
};

const openLevelButton: React.CSSProperties = {
  background: UI.monsterPink,
  color: UI.monsterInk,
};

const lockedLevelButton: React.CSSProperties = {
  background: UI.monsterViolet,
  color: UI.monsterWhite,
  cursor: "not-allowed",
  opacity: 0.78,
  filter: "grayscale(0.35) brightness(0.82)",
};

const twoDigitLevelButton: React.CSSProperties = {
  fontSize: "clamp(30px, 4.1vw, 44px)",
};

const level10Image: React.CSSProperties = {
  width: "86%",
  height: "86%",
  objectFit: "contain",
  imageRendering: "pixelated",
  pointerEvents: "none",
  userSelect: "none",
};

const resetButton: React.CSSProperties = {
  position: "absolute",
  right: 28,
  bottom: 28,
  zIndex: 3,
  padding: "12px 18px",
  border: `4px solid ${UI.ink}`,
  background: UI.lilac,
  color: UI.ink,
  boxShadow: `4px 4px 0 ${UI.plum}`,
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
  textTransform: "uppercase",
};

const copyrightLine: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: 12,
  transform: "translateX(-50%)",
  zIndex: 4,
  color: "#fff7ff",
  fontSize: "clamp(9px, 1.5vw, 16px)",
  lineHeight: 1,
  fontWeight: 900,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  textShadow: "2px 0 0 #343140, 0 2px 0 #343140, 3px 3px 0 #17131f",
  pointerEvents: "none",
};

