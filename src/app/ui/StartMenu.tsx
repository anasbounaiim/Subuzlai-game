"use client";

import React from "react";

export function StartMenu(props: { onPlay: () => void; onLevels: () => void }) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      props.onPlay();
    }

    if (event.key.toLowerCase() === "l") {
      props.onLevels();
    }
  }

  return (
    <div
      aria-label="Talking Game start menu"
      tabIndex={0}
      style={screen}
      onKeyDown={handleKeyDown}
    >
      <style>{`
        @keyframes bgIntro {
          from { opacity: 0; filter: brightness(0.62) contrast(1.25); }
          to { opacity: 1; filter: brightness(1) contrast(1); }
        }

        @keyframes carParallax {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }

        @keyframes logoIntro {
          0% { opacity: 0; transform: translate(-50%, -18px) scale(0.94); }
          62% { opacity: 1; transform: translate(-50%, 4px) scale(1.02); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }

        @keyframes logoIdle {
          0%, 100% { margin-top: 0; }
          50% { margin-top: -4px; }
        }

        @keyframes logoFrameBase {
          0%, 33.333% { opacity: 1; }
          33.334%, 100% { opacity: 0; }
        }

        @keyframes logoFrameOne {
          0%, 33.333% { opacity: 0; }
          33.334%, 66.666% { opacity: 1; }
          66.667%, 100% { opacity: 0; }
        }

        @keyframes logoFrameTwo {
          0%, 66.666% { opacity: 0; }
          66.667%, 100% { opacity: 1; }
        }

        @keyframes startIntro {
          0%, 58% { opacity: 0; transform: translate(-50%, 12px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }

        @keyframes startBlink {
          0%, 48% { opacity: 1; }
          49%, 100% { opacity: 0; }
        }

        .start-menu-bg-layer {
          position: absolute;
          inset: -4%;
          display: flex;
          align-items: center;
          overflow: hidden;
          animation: bgIntro 650ms steps(7) both;
        }

        .start-menu-bg-track {
          display: flex;
          flex: 0 0 auto;
          height: 100%;
          animation: carParallax var(--scroll-time) linear infinite 650ms;
          will-change: transform;
        }

        .start-menu-bg-tile {
          display: block;
          flex: 0 0 auto;
          width: auto;
          height: 100%;
          max-width: none;
          image-rendering: pixelated;
          user-select: none;
          pointer-events: none;
        }

        .start-menu-bg-sky {
          --scroll-time: 90s;
        }

        .start-menu-bg-city-far {
          --scroll-time: 42s;
        }

        .start-menu-bg-city-near {
          --scroll-time: 28s;
        }

        .start-menu-bg-detail {
          --scroll-time: 18s;
        }

        .start-menu-bg-trees {
          --scroll-time: 12s;
        }

        .start-menu-vignette {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.02), transparent 20%, rgba(0,0,0,0.08) 100%),
            radial-gradient(circle at 50% 42%, transparent 0 42%, rgba(13,12,21,0.18) 82%);
          pointer-events: none;
        }

        .start-menu-logo-wrap {
          animation:
            logoIntro 820ms steps(9) both 140ms,
            logoIdle 3.6s steps(4) infinite 1050ms;
        }

        .start-menu-logo-frame {
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: auto;
          transform: translateY(-50%);
          image-rendering: pixelated;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 8px 0 rgba(5,6,18,0.28));
        }

        .start-menu-logo-base {
          animation: logoFrameBase 720ms steps(1) infinite;
        }

        .start-menu-logo-one {
          animation: logoFrameOne 720ms steps(1) infinite;
        }

        .start-menu-logo-two {
          animation: logoFrameTwo 720ms steps(1) infinite;
        }

        .start-menu-play {
          color: #f19aff;
          text-shadow:
            4px 0 0 #6f24ff,
            0 4px 0 #6f24ff,
            4px 4px 0 #101032;
          animation: startIntro 1100ms steps(10) both;
        }

        .start-menu-play:hover,
        .start-menu-play:focus-visible {
          animation: startIntro 1100ms steps(10) both;
          color: #ffd0ff;
          outline: none;
        }

        .start-menu-cursor {
          display: inline-block;
          width: 1ch;
          animation: startBlink 0.72s steps(2) infinite 1100ms;
        }

        .start-menu-play:focus-visible::before {
          content: ">";
          position: absolute;
          left: -42px;
          top: 8px;
          color: #f19aff;
        }

        .start-menu-social-link {
          transition:
            transform 80ms steps(2),
            filter 80ms steps(2);
        }

        .start-menu-social-link:hover,
        .start-menu-social-link:focus-visible {
          filter: brightness(1.2);
          transform: translateY(-2px);
          outline: none;
        }
      `}</style>

      <ParallaxLayer className="start-menu-bg-sky" src="/background/1.png" />
      <ParallaxLayer className="start-menu-bg-city-far" src="/background/2.png" />
      <ParallaxLayer className="start-menu-bg-city-near" src="/background/3.png" />
      <ParallaxLayer className="start-menu-bg-detail" src="/background/4.png" />
      <ParallaxLayer className="start-menu-bg-trees" src="/background/5.png" />
      <div className="start-menu-vignette" />

      <div className="start-menu-logo-wrap" style={logoWrap}>
        <img
          className="start-menu-logo-frame start-menu-logo-base"
          src="/logo start.png"
          alt="Talking Game"
          draggable={false}
        />
        <img
          className="start-menu-logo-frame start-menu-logo-one"
          src="/logo start 1.png"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <img
          className="start-menu-logo-frame start-menu-logo-two"
          src="/logo start 2.png"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>

      <button
        type="button"
        className="start-menu-play"
        onClick={props.onPlay}
        style={startButton}
      >
        <span className="start-menu-cursor" aria-hidden="true">{">"}</span>
        <span>Start game</span>
      </button>

      <div style={socialLinks}>
        <a
          className="start-menu-social-link"
          href="https://github.com/anasbounaiim"
          aria-label="GitHub profile"
          target="_blank"
          rel="noreferrer"
          style={socialLink}
        >
          <i aria-hidden="true" className="hn hn-github" style={socialIcon} />
        </a>
        <a
          className="start-menu-social-link"
          href="https://www.linkedin.com/in/anas-bounaim-37450621a/"
          aria-label="LinkedIn profile"
          target="_blank"
          rel="noreferrer"
          style={socialLink}
        >
          <i aria-hidden="true" className="hn hn-linkedin" style={socialIcon} />
        </a>
      </div>

      <div style={copyrightLine}>© 2026 ANAS BOUNAIM MAYBE A BAD IDEA</div>
    </div>
  );
}

function ParallaxLayer(props: { className: string; src: string }) {
  return (
    <div className={`start-menu-bg-layer ${props.className}`} aria-hidden="true">
      <div className="start-menu-bg-track">
        <img className="start-menu-bg-tile" src={props.src} alt="" draggable={false} />
        <img className="start-menu-bg-tile" src={props.src} alt="" draggable={false} />
      </div>
    </div>
  );
}

const screen: React.CSSProperties = {
  position: "relative",
  width: "min(100%, 1022px)",
  aspectRatio: "1022 / 616",
  overflow: "hidden",
  backgroundColor: "#5a5a60",
  fontFamily: "var(--font-pixel), 'Courier New', monospace",
  imageRendering: "pixelated",
  outline: "none",
  touchAction: "none",
};

const logoWrap: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "15%",
  width: "80%",
  height: "48%",
  display: "grid",
  placeItems: "center",
  overflow: "visible",
  willChange: "transform, margin-top",
};

const startButton: React.CSSProperties = {
  appearance: "none",
  position: "absolute",
  left: "50%",
  top: "74.8%",
  transform: "translateX(-50%)",
  border: 0,
  borderRadius: 0,
  background: "transparent",
  padding: "8px 12px",
  fontFamily: "inherit",
  fontSize: "clamp(20px, 3.8vw, 40px)",
  lineHeight: 1,
  fontWeight: 400,
  letterSpacing: 0,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const socialLinks: React.CSSProperties = {
  position: "absolute",
  top: 18,
  right: 18,
  zIndex: 5,
  display: "flex",
  gap: "clamp(12px, 2vw, 16px)",
};

const socialLink: React.CSSProperties = {
  width: "clamp(26px, 3.8vw, 36px)",
  height: "clamp(26px, 3.8vw, 36px)",
  display: "grid",
  placeItems: "center",
  color: "#fff7ff",
  textDecoration: "none",
};

const socialIcon: React.CSSProperties = {
  fontSize: "clamp(42px, 3.2vw, 30px)",
  lineHeight: 1,
  filter: "drop-shadow(3px 3px 0 #333333)",
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
