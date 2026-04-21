"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { getLevelCount } from "../levels";
import type { UIState } from "./engine/types";
import { createInput } from "./engine/input";
import { createEngine } from "./engine/engine";
import { loadUnlockedMax, saveUnlockedMax } from "./engine/storage";
import { loadGameImages, type GameImages } from "./render/load";
import { renderGame, resetCamera } from "./render/renderGame";
import { W, H } from "./engine/constants";
import { playPixelSound } from "./audio";

const UI = {
  mist: "#8e8a98",
  pink: "#cf73e6",
  ink: "#17131f",
  plum: "#343140",
  lilac: "#cf86ff",
  monsterInk: "#04193f",
  monsterViolet: "#6f24ff",
  monsterPink: "#ee84ff",
};

type IntroLine = {
  speaker: "player" | "boss";
  name: string;
  text: string;
};

const INTRO_SCENES: Record<number, IntroLine[]> = {
  1: [
      {
    speaker: "player",
    name: "SUBUZLAI",
    text: "…Where am I? I’ve been stuck… just a developer with no path, searching for something… maybe a job, maybe a way out."  },
    {
      speaker: "player",
      name: "SUBUZLAI",
      text: "Keep going. This first stage will teach you the rhythm.",
    },
  ],
10: [
  {
    speaker: "player",
    name: "SUBUZLAI",
    text: "…So this is the end. The last chest… but something feels off.",
  },
  {
    speaker: "boss",
    name: "BOSS",
    text: "You made it this far… but tell me… why are you here?",
  },
  {
    speaker: "player",
    name: "SUBUZLAI",
    text: "I… don’t know. I just kept moving. Jump after jump… like I had no choice.",
  },
  {
    speaker: "boss",
    name: "BOSS",
    text: "Strange… I’ve been waiting here… guarding this place… and I don’t know why either.",
  },
  {
    speaker: "player",
    name: "SUBUZLAI",
    text: "So… we’re just… part of this?",
  },
  {
    speaker: "boss",
    name: "BOSS",
    text: "Seems like it.",
  },
  {
    speaker: "player",
    name: "SUBUZLAI",
    text: "Then what now?",
  },
  {
    speaker: "boss",
    name: "BOSS",
    text: "…I guess there’s only one thing left to do.",
  },
  {
    speaker: "player",
    name: "SUBUZLAI",
    text: "Yeah…",
  },
  {
    speaker: "boss",
    name: "BOSS",
    text: "Let’s fight.",
  },
],
};

function getIntroLines(levelId: number) {
  return INTRO_SCENES[levelId] ?? [];
}

export function PlatformerGame({ startLevelId, onBack }: { startLevelId: number; onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef(createInput());
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);

  const [levelId, setLevelId] = useState(startLevelId);
  const [restartNonce, setRestartNonce] = useState(0);
  const [introOpen, setIntroOpen] = useState(getIntroLines(startLevelId).length > 0);
  const [introStep, setIntroStep] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [endingOpen, setEndingOpen] = useState(false);
  const [, setUI] = useState<UIState>({
    tip: "Collect all coins and reach the door!",
    score: 0,
    coins: 0,
    totalCoins: 0,
    keys: 0,
    deaths: 0,
  });

  const maxLevels = getLevelCount();

  const imagesRef = useRef<GameImages | null>(null);
  const [, setAssetsReady] = useState(false);

  const tRef = useRef(0);
  const introOpenRef = useRef(introOpen);
  const pausedRef = useRef(paused);
  const gameOverRef = useRef(gameOver);
  const endingOpenRef = useRef(endingOpen);
  const lastHpRef = useRef<number | null>(null);
  const jumpHeldRef = useRef(false);

  const closeIntro = useCallback(() => {
    const input = inputRef.current.input;
    input.left = false;
    input.right = false;
    input.jump = false;
    input.shoot = false;
    input.dash = false;
    input.defend = false;
    setIntroOpen(false);
  }, []);

  const restartLevel = useCallback(() => {
    playPixelSound("restart");
    setGameOver(false);
    setCelebrating(false);
    setEndingOpen(false);
    lastHpRef.current = null;
    setRestartNonce((current) => current + 1);
  }, []);

  const goToLevels = useCallback(() => {
    playPixelSound("click");
    setGameOver(false);
    setCelebrating(false);
    setEndingOpen(false);
    onBack();
  }, [onBack]);

  const advanceIntro = useCallback(() => {
    const introLines = getIntroLines(levelId);
    const currentText = introLines[introStep]?.text ?? "";

    if (typedCount < currentText.length) {
      setTypedCount(currentText.length);
      return;
    }

    if (introStep < introLines.length - 1) {
      setIntroStep((current) => current + 1);
      setTypedCount(0);
      return;
    }

    closeIntro();
  }, [closeIntro, introStep, levelId, typedCount]);

  useEffect(() => {
    setLevelId(startLevelId);
  }, [startLevelId]);

  useEffect(() => {
    const shouldShowIntro = getIntroLines(levelId).length > 0;
    setIntroOpen(shouldShowIntro);
    setIntroStep(0);
    setTypedCount(0);
    setPaused(false);
    setGameOver(false);
    setCelebrating(false);
    setEndingOpen(false);
    lastHpRef.current = null;
  }, [levelId, restartNonce]);

  useEffect(() => {
    introOpenRef.current = introOpen;
  }, [introOpen]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    endingOpenRef.current = endingOpen;
  }, [endingOpen]);

  useEffect(() => {
    let alive = true;
    loadGameImages()
      .then((imgs) => {
        if (!alive) return;
        imagesRef.current = imgs;
        setAssetsReady(true);
      })
      .catch(() => {
        setAssetsReady(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    resetCamera();
    engineRef.current = createEngine(
      {
        onUI: (st) => {
          if (lastHpRef.current !== null && st.hp < lastHpRef.current && st.hp > 0) {
            playPixelSound("hurt");
          }
          lastHpRef.current = st.hp;
          setUI((prev) => ({
            ...prev,
            coins: st.coins,
            totalCoins: st.coinsTotal,
            hp: st.hp,
          }));
        },
        onLose: () => {
          playPixelSound("death");
          setGameOver(true);
          setPaused(false);
          setUI((prev) => ({ ...prev, deaths: (prev.deaths || 0) + 1 }));
        },
        onWin: () => {
          playPixelSound("win");
          const next = levelId + 1;
          if (next > maxLevels) {
            setEndingOpen(true);
            setPaused(false);
            setGameOver(false);
            return;
          }
          setLevelId(next);
          saveUnlockedMax(Math.max(loadUnlockedMax(), next));
        },
        onBossDefeated: () => {
          playPixelSound("bossDefeat");
          setCelebrating(true);
          window.setTimeout(() => setCelebrating(false), 3600);
        },
      },
      levelId
    );
  }, [levelId, maxLevels, onBack, restartNonce]);

  useEffect(() => {
    const { onKeyDown, onKeyUp } = inputRef.current;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!introOpen) return;

    const onIntroKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        advanceIntro();
      }
    };

    window.addEventListener("keydown", onIntroKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onIntroKeyDown, true);
    };
  }, [advanceIntro, introOpen]);

  useEffect(() => {
    if (!introOpen) return;

    const currentText = getIntroLines(levelId)[introStep]?.text ?? "";
    if (typedCount >= currentText.length) return;

    const timer = window.setInterval(() => {
      setTypedCount((current) => Math.min(current + 1, currentText.length));
    }, 24);

    return () => window.clearInterval(timer);
  }, [introOpen, introStep, levelId, typedCount]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    let last = performance.now();
    let raf = 0;

    function loop(now: number) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      tRef.current += dt;

      const engine = engineRef.current;
      const I = inputRef.current;

      if (engine) {
        if (!introOpenRef.current && !pausedRef.current && !gameOverRef.current && !endingOpenRef.current) {
          if (I.input.jump && !jumpHeldRef.current) playPixelSound("jump");
          if (I.input.shoot) playPixelSound("shoot");
          engine.step(dt, I.input);
        }
        jumpHeldRef.current = I.input.jump;

        const st = engine.getState?.();
        if (st) {
          renderGame(ctx, imagesRef.current, st, tRef.current, W, H);
        }
      }

      I.resetFrameInputs();
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentIntroLine = getIntroLines(levelId)[introStep] ?? null;
  const introSpeakerIsBoss = currentIntroLine?.speaker === "boss";

  return (
    <div style={gameShell}>
      <style>{`
        .game-arcade-button {
          transition:
            transform 80ms steps(2),
            box-shadow 80ms steps(2),
            filter 80ms steps(2);
        }

        .game-arcade-button:hover,
        .game-arcade-button:focus-visible {
          filter: brightness(1.08);
          transform: translate(-3px, -4px);
          box-shadow:
            inset 5px 5px 0 rgba(255,247,255,0.58),
            inset -5px 0 0 #a737ff,
            inset 0 -7px 0 #7b24f5,
            0 8px 0 #7b24f5;
          outline: none;
        }

        .game-arcade-button:active {
          transform: translate(5px, 6px);
          box-shadow:
            inset 3px 3px 0 rgba(255,247,255,0.36),
            inset -3px 0 0 #a737ff,
            inset 0 -4px 0 #7b24f5,
            0 1px 0 #7b24f5;
        }

        .game-arcade-button .hn,
        .game-dialogue-continue .hn {
          display: block;
        }

        .game-dialogue-continue {
          transition:
            transform 80ms steps(2),
            color 80ms steps(2);
        }

        .game-dialogue-continue:hover,
        .game-dialogue-continue:focus-visible {
          color: #fff7ff;
          transform: translateY(-2px);
          outline: none;
        }

        .game-dialogue-continue:active {
          transform: translateY(2px);
        }

        @keyframes introPromptBlink {
          0%, 48% { opacity: 1; }
          49%, 100% { opacity: 0.18; }
        }

        @keyframes confettiPop {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.5) rotate(0deg);
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform:
              translate3d(var(--confetti-x), var(--confetti-y), 0)
              scale(1)
              rotate(var(--confetti-rot));
          }
        }

        .game-confetti-piece {
          animation: confettiPop var(--confetti-time) steps(9) infinite;
          animation-delay: var(--confetti-delay);
        }

        @keyframes creditsRoll {
          from { transform: translateY(82%); }
          to { transform: translateY(-112%); }
        }
      `}</style>

      <canvas ref={canvasRef} width={W} height={H} style={canvasStyle} />

      {introOpen && (
        <div aria-label={`Level ${levelId} intro`} style={introOverlay}>
          <div style={introSpeakerIsBoss ? introBossPortraitWrap : introPortraitWrap}>
            <div style={introSpeakerIsBoss ? introBossPortrait : introPortrait} />
          </div>

          <div style={introSpeakerIsBoss ? dialogueBoxBoss : dialogueBox}>
            <div style={introSpeakerIsBoss ? dialogueNameBoss : dialogueName}>
              {currentIntroLine?.name ?? "SUBUZLAI"}
            </div>
            <p style={dialogueText}>{(currentIntroLine?.text ?? "").slice(0, typedCount)}</p>
            <button
              className="game-dialogue-continue"
              aria-label="Continue dialogue"
              onClick={advanceIntro}
              style={dialogueContinue}
              type="button"
            >
              <i aria-hidden="true" className="hn hn-arrow-right-solid" style={dialogueContinueIcon} />
            </button>
          </div>
        </div>
      )}

      {celebrating && <PixelConfetti />}

      {endingOpen && (
        <div aria-label="Ending credits" style={endingOverlay}>
          <div style={endingPanel}>
            <div style={endingTitle}>THE END</div>
            <div style={creditsViewport}>
              <div style={creditsRoll}>
                <p style={creditsLine}>CONGRATULATIONS</p>
                <p style={creditsLine}>YOU DEFEATED THE BOSS</p>
                <p style={creditsLine}>FOR NO REASON AT ALL</p>
                <p style={creditsSpacer}> </p>
                <p style={creditsLine}>A GAME BY</p>
                <p style={creditsLine}>ANAS BOUNAIM</p>
                <p style={creditsSpacer}> </p>
                <p style={creditsLine}>THANKS FOR PLAYING</p>
              </div>
            </div>
            <button
              className="game-arcade-button"
              aria-label="Back to level select"
              onClick={goToLevels}
              style={endingButton}
              type="button"
            >
              <i aria-hidden="true" className="hn hn-grid-solid" style={controlIcon} />
            </button>
          </div>
        </div>
      )}

      {gameOver && !introOpen && (
        <div aria-label="Game over" style={pauseOverlay}>
          <div style={gameOverModal}>
            <div style={gameOverTitle}>GAME OVER</div>
            <div style={gameOverActions}>
              <button
                className="game-arcade-button"
                aria-label="Restart level"
                onClick={restartLevel}
                style={pauseActionButton}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-refresh-solid" style={controlIcon} />
              </button>
              <button
                className="game-arcade-button"
                aria-label="Quit to level select"
                onClick={goToLevels}
                style={pauseActionButton}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-door-open-solid" style={controlIcon} />
              </button>
            </div>
          </div>
        </div>
      )}

      {paused && !introOpen && !gameOver && (
        <div aria-label="Game paused" style={pauseOverlay}>
          <div style={pauseModal}>
            <div style={pauseTitle}>PAUSED</div>
            <div style={pauseActions}>
              <button
                className="game-arcade-button"
                aria-label="Resume game"
                onClick={() => {
                  playPixelSound("click");
                  setPaused(false);
                }}
                style={pauseActionButton}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-play-solid" style={controlIcon} />
              </button>
              <button
                className="game-arcade-button"
                aria-label="Restart level"
                onClick={restartLevel}
                style={pauseActionButton}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-refresh-solid" style={controlIcon} />
              </button>
              <button
                className="game-arcade-button"
                aria-label="Back to level select"
                onClick={goToLevels}
                style={pauseActionButton}
                type="button"
              >
                <i aria-hidden="true" className="hn hn-grid-solid" style={controlIcon} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!gameOver && !endingOpen && (
      <div style={controlsGroup}>
        <button
          className="game-arcade-button"
          aria-label="Restart level"
          onClick={restartLevel}
          style={iconButton}
        >
          <i aria-hidden="true" className="hn hn-refresh-solid" style={controlIcon} />
        </button>

        <button
          className="game-arcade-button"
          aria-label={paused ? "Resume game" : "Pause game"}
          aria-pressed={paused}
          onClick={() => {
            playPixelSound("click");
            setPaused((current) => !current);
          }}
          style={iconButton}
        >
          <i
            aria-hidden="true"
            className={`hn ${paused ? "hn-play-solid" : "hn-pause-solid"}`}
            style={controlIcon}
          />
        </button>
      </div>
      )}
    </div>
  );
}

const confettiColors = ["#fff7ff", "#ffec27", "#ee84ff", "#29adff", "#00e756", "#ff77a8"];

function PixelConfetti() {
  return (
    <div style={celebrationOverlay} aria-live="polite">
      <div style={celebrationText}>CONGRATS!</div>
      {Array.from({ length: 56 }, (_, index) => {
        const angle = (index * 137.5) % 360;
        const distance = 90 + (index % 8) * 28;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance + 120;
        return (
          <span
            key={index}
            className="game-confetti-piece"
            style={{
              ...confettiPiece,
              left: `${18 + ((index * 17) % 64)}%`,
              top: `${18 + ((index * 23) % 28)}%`,
              background: confettiColors[index % confettiColors.length],
              ["--confetti-x" as string]: `${x.toFixed(0)}px`,
              ["--confetti-y" as string]: `${y.toFixed(0)}px`,
              ["--confetti-rot" as string]: `${(angle * 2).toFixed(0)}deg`,
              ["--confetti-time" as string]: `${1.2 + (index % 5) * 0.12}s`,
              ["--confetti-delay" as string]: `${(index % 14) * -0.08}s`,
            }}
          />
        );
      })}
    </div>
  );
}

const gameShell: React.CSSProperties = {
  position: "relative",
  width: "min(100%, 1022px)",
  aspectRatio: "1022 / 616",
  overflow: "hidden",
  background: UI.ink,
};

const canvasStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  imageRendering: "pixelated",
};

const arcadeButtonBase: React.CSSProperties = {
  appearance: "none",
  width: "clamp(44px, 5.4vw, 56px)",
  height: "clamp(38px, 4.7vw, 48px)",
  padding: 0,
  display: "grid",
  placeItems: "center",
  border: `3px solid ${UI.monsterViolet}`,
  background: UI.monsterPink,
  color: UI.monsterInk,
  boxShadow: [
    "inset 5px 5px 0 rgba(255,247,255,0.55)",
    "inset -5px 0 0 #a737ff",
    "inset 0 -7px 0 #7b24f5",
    "6px 6px 0 #04193f",
    "9px 9px 0 rgba(5,6,18,0.34)",
  ].join(", "),
  fontSize: "clamp(9px, 1.4vw, 13px)",
  fontWeight: 400,
  cursor: "pointer",
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
  textTransform: "uppercase",
  imageRendering: "pixelated",
};

const controlsGroup: React.CSSProperties = {
  position: "absolute",
  top: 18,
  right: 18,
  zIndex: 4,
  display: "flex",
  gap: 14,
};

const iconButton: React.CSSProperties = {
  ...arcadeButtonBase,
};

const controlIcon: React.CSSProperties = {
  width: "auto",
  height: "auto",
  display: "block",
  color: "#fff7ff",
  fontSize: "clamp(22px, 2.8vw, 30px)",
  lineHeight: 1,
  filter: `drop-shadow(3px 3px 0 ${UI.monsterInk})`,
  pointerEvents: "none",
};

const pauseOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 7,
  display: "grid",
  placeItems: "center",
  background: "rgba(5, 6, 14, 0.48)",
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
  imageRendering: "pixelated",
};

const pauseModal: React.CSSProperties = {
  width: "min(82%, 430px)",
  minHeight: "clamp(140px, 21vw, 190px)",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "clamp(18px, 3.2vw, 28px)",
  padding: "clamp(22px, 3.4vw, 34px)",
  background: "rgba(32, 29, 45, 0.96)",
  border: "4px solid #fff7ff",
  boxShadow: [
    "inset 0 0 0 4px #343140",
    "9px 9px 0 rgba(5, 6, 18, 0.62)",
  ].join(", "),
};

const gameOverModal: React.CSSProperties = {
  ...pauseModal,
  width: "min(86%, 540px)",
  minHeight: "clamp(162px, 24vw, 230px)",
  gap: "clamp(22px, 3.5vw, 32px)",
  padding: "clamp(22px, 3.2vw, 34px) clamp(26px, 4vw, 44px)",
};

const pauseTitle: React.CSSProperties = {
  color: UI.lilac,
  fontSize: "clamp(28px, 5.6vw, 54px)",
  lineHeight: 1,
  textShadow: [
    "4px 0 0 #7b24f5",
    "0 4px 0 #7b24f5",
    "5px 5px 0 #04193f",
  ].join(", "),
};

const gameOverTitle: React.CSSProperties = {
  ...pauseTitle,
  fontSize: "clamp(24px, 4.2vw, 46px)",
  whiteSpace: "nowrap",
  textAlign: "center",
};

const pauseActions: React.CSSProperties = {
  display: "flex",
  gap: "clamp(14px, 2.6vw, 22px)",
};

const gameOverActions: React.CSSProperties = {
  ...pauseActions,
  justifyContent: "center",
  gap: "clamp(22px, 4vw, 34px)",
};

const pauseActionButton: React.CSSProperties = {
  ...arcadeButtonBase,
  width: "clamp(58px, 8vw, 76px)",
  height: "clamp(50px, 7vw, 66px)",
};

const celebrationOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 6,
  pointerEvents: "none",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
};

const celebrationText: React.CSSProperties = {
  color: "#fff7ff",
  fontSize: "clamp(24px, 5vw, 52px)",
  lineHeight: 1,
  textShadow: [
    "4px 0 0 #ee84ff",
    "0 4px 0 #7b24f5",
    "5px 5px 0 #04193f",
  ].join(", "),
};

const confettiPiece: React.CSSProperties = {
  position: "absolute",
  width: "clamp(7px, 1.1vw, 11px)",
  height: "clamp(7px, 1.1vw, 11px)",
  boxShadow: "3px 3px 0 rgba(5, 6, 18, 0.42)",
  imageRendering: "pixelated",
};

const endingOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 9,
  display: "grid",
  placeItems: "center",
  background: "rgba(5, 6, 14, 0.64)",
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
  imageRendering: "pixelated",
};

const endingPanel: React.CSSProperties = {
  position: "relative",
  width: "min(86%, 540px)",
  minHeight: "clamp(330px, 58vw, 470px)",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  justifyItems: "center",
  gap: "clamp(12px, 2.3vw, 20px)",
  padding: "clamp(24px, 4vw, 38px)",
  background: "rgba(32, 29, 45, 0.96)",
  border: "4px solid #fff7ff",
  boxShadow: [
    "inset 0 0 0 4px #343140",
    "9px 9px 0 rgba(5, 6, 18, 0.62)",
  ].join(", "),
};

const endingTitle: React.CSSProperties = {
  ...pauseTitle,
  fontSize: "clamp(27px, 5.1vw, 50px)",
  whiteSpace: "nowrap",
};

const creditsViewport: React.CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: "clamp(150px, 28vw, 230px)",
  overflow: "hidden",
  borderTop: "3px solid rgba(255, 247, 255, 0.28)",
  borderBottom: "3px solid rgba(255, 247, 255, 0.28)",
};

const creditsRoll: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  alignContent: "center",
  gap: "clamp(12px, 2vw, 18px)",
  animation: "creditsRoll 9s steps(36) infinite",
};

const creditsLine: React.CSSProperties = {
  margin: 0,
  color: "#fff7ff",
  fontSize: "clamp(12px, 2.1vw, 22px)",
  lineHeight: 1.2,
  textAlign: "center",
  textShadow: `3px 3px 0 ${UI.monsterInk}`,
  whiteSpace: "nowrap",
};

const creditsSpacer: React.CSSProperties = {
  ...creditsLine,
  minHeight: "clamp(12px, 2vw, 18px)",
};

const endingButton: React.CSSProperties = {
  ...pauseActionButton,
};

const introOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 8,
  cursor: "pointer",
  background: "rgba(5, 6, 14, 0.58)",
  color: "#fff7ff",
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
  imageRendering: "pixelated",
};

const introPortraitWrap: React.CSSProperties = {
  position: "absolute",
  left: "clamp(8px, 4vw, 52px)",
  bottom: "clamp(54px, 9vw, 86px)",
  width: "clamp(126px, 18vw, 190px)",
  height: "clamp(138px, 19vw, 206px)",
  overflow: "hidden",
  filter: "drop-shadow(7px 7px 0 rgba(4, 25, 63, 0.7))",
};

const introPortrait: React.CSSProperties = {
  width: "100%",
  height: "100%",
  backgroundImage: "url('/Pink_Monster_Idle_4.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "400% 100%",
  backgroundPosition: "0 0",
  imageRendering: "pixelated",
  transform: "scale(1.1)",
  transformOrigin: "center bottom",
};

const introBossPortraitWrap: React.CSSProperties = {
  position: "absolute",
  right: "clamp(6px, 4vw, 52px)",
  bottom: "clamp(52px, 8vw, 82px)",
  width: "clamp(152px, 22vw, 232px)",
  height: "clamp(154px, 22vw, 232px)",
  overflow: "hidden",
  filter: "drop-shadow(-7px 7px 0 rgba(4, 25, 63, 0.72))",
};

const introBossPortrait: React.CSSProperties = {
  width: "60%",
  height: "100%",
  backgroundImage: "url('/Demon_Boss.png')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "contain",
  backgroundPosition: "center bottom",
  imageRendering: "pixelated",
  transform: "scale(2.9)",
  transformOrigin: "center bottom",
};

const dialogueBox: React.CSSProperties = {
  position: "absolute",
  left: "clamp(170px, 24vw, 250px)",
  right: "clamp(20px, 4vw, 46px)",
  bottom: "clamp(22px, 4vw, 38px)",
  minHeight: "clamp(112px, 17vw, 152px)",
  padding: "clamp(22px, 3.4vw, 34px) clamp(20px, 3.5vw, 34px) clamp(22px, 3vw, 30px)",
  background: "rgba(32, 29, 45, 0.96)",
  border: "4px solid #fff7ff",
  boxShadow: [
    "inset 0 0 0 4px #343140",
    "8px 8px 0 rgba(5, 6, 18, 0.55)",
  ].join(", "),
};

const dialogueBoxBoss: React.CSSProperties = {
  ...dialogueBox,
  left: "clamp(20px, 4vw, 46px)",
  right: "clamp(178px, 24vw, 266px)",
};

const dialogueName: React.CSSProperties = {
  position: "absolute",
  top: "-38px",
  left: "22px",
  minWidth: "150px",
  padding: "10px 18px 8px",
  background: "rgba(32, 29, 45, 0.98)",
  border: "4px solid #fff7ff",
  boxShadow: "inset 0 0 0 4px #343140",
  color: "#fff7ff",
  fontSize: "clamp(15px, 2.4vw, 26px)",
  lineHeight: 1,
  textShadow: "4px 4px 0 #04193f",
};

const dialogueNameBoss: React.CSSProperties = {
  ...dialogueName,
  left: "auto",
  right: "22px",
  color: "#ffe6e6",
  textShadow: "4px 4px 0 #3a1118",
};

const dialogueText: React.CSSProperties = {
  margin: 0,
  maxWidth: "760px",
  color: "#fff7ff",
  fontSize: "clamp(14px, 2.25vw, 26px)",
  lineHeight: 1.45,
  textShadow: "4px 4px 0 #04193f",
};

const dialoguePrompt: React.CSSProperties = {
  position: "absolute",
  right: "clamp(18px, 3vw, 30px)",
  bottom: "clamp(10px, 1.8vw, 18px)",
  color: UI.lilac,
  fontSize: "clamp(9px, 1.35vw, 13px)",
  lineHeight: 1,
  textShadow: "3px 3px 0 #04193f",
  animation: "introPromptBlink 1s steps(2, end) infinite",
};

const dialogueContinue: React.CSSProperties = {
  appearance: "none",
  position: "absolute",
  right: "clamp(18px, 3vw, 30px)",
  bottom: "clamp(10px, 1.8vw, 18px)",
  padding: 0,
  border: 0,
  background: "transparent",
  color: UI.lilac,
  cursor: "pointer",
  width: "clamp(24px, 3.2vw, 34px)",
  height: "clamp(24px, 3.2vw, 34px)",
  display: "grid",
  placeItems: "center",
  animation: "introPromptBlink 1s steps(2, end) infinite",
};

const dialogueContinueIcon: React.CSSProperties = {
  width: "auto",
  height: "auto",
  display: "block",
  color: UI.lilac,
  fontSize: "clamp(24px, 3.2vw, 34px)",
  lineHeight: 1,
  filter: `drop-shadow(3px 3px 0 ${UI.monsterInk})`,
  pointerEvents: "none",
};
