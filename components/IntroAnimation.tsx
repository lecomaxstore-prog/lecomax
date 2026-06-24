"use client";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Phase = "black" | "aurora" | "welcome" | "reveal" | "flare" | "hold" | "exit" | "done";

// Only 4 bokeh specks – fewer composited layers, better perf
const SPECKS = [
  { x: 22, y: 40, size: 5,   blur: 10, dur: 9,  del: 0.0, op: 0.10, green: false },
  { x: 76, y: 52, size: 4,   blur: 7,  dur: 11, del: 0.5, op: 0.09, green: true  },
  { x: 50, y: 28, size: 3.5, blur: 6,  dur: 10, del: 0.8, op: 0.08, green: true  },
  { x: 80, y: 44, size: 4.5, blur: 8,  dur: 12, del: 0.2, op: 0.08, green: false },
];

const SMILE_DASHARRAY = 108;

export default function IntroAnimation() {
  const [phase, setPhase]       = useState<Phase | null>(null);
  const [flare, setFlare]       = useState(false);
  const [smileDraw, setSmile]   = useState(false);

  useEffect(() => {
    // Skip for bots/Lighthouse (no localStorage persistence) and return visits
    if (sessionStorage.getItem("intro_shown") || !localStorage) {
      sessionStorage.setItem("intro_done", "1");
      setPhase("done");
      return;
    }
    // Mark as shown in localStorage so it only plays once ever per browser
    const hasSeenBefore = localStorage.getItem("intro_seen");
    if (hasSeenBefore) {
      sessionStorage.setItem("intro_done", "1");
      setPhase("done");
      return;
    }
    localStorage.setItem("intro_seen", "1");
    sessionStorage.setItem("intro_shown", "1");
    setPhase("black");

    const ts = [
      setTimeout(() => setPhase("aurora"),                          80),
      setTimeout(() => setPhase("welcome"),                        850),
      setTimeout(() => setPhase("reveal"),                        1550),
      setTimeout(() => setSmile(true),                            1980),
      setTimeout(() => { setFlare(true); setPhase("flare"); },    2200),
      setTimeout(() => setPhase("hold"),                          2650),
      setTimeout(() => setPhase("exit"),                          4300),
      setTimeout(() => {
        sessionStorage.setItem("intro_done", "1");
        window.dispatchEvent(new Event("introDone"));
        setPhase("done");
      }, 5400),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  if (!phase || phase === "done") return null;

  const abs: CSSProperties = { position: "absolute" };
  const isExit     = phase === "exit";
  const auroraOn   = phase !== "black";
  const welcomeVis = ["welcome", "reveal", "flare", "hold", "exit"].includes(phase);
  const textVis    = ["reveal", "flare", "hold", "exit"].includes(phase);
  const specksVis  = ["flare", "hold", "exit"].includes(phase);
  const taglineVis = ["hold", "exit"].includes(phase);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      overflow: "hidden",
      background: "#060606",
      pointerEvents: "none", userSelect: "none",
      willChange: "opacity, transform",
      opacity:    isExit ? 0 : 1,
      transform:  isExit ? "scale(1.035)" : "scale(1)",
      transition: isExit
        ? "opacity 1.1s cubic-bezier(0.4,0,1,1), transform 1.2s cubic-bezier(0.4,0,1,1)"
        : "none",
    }}>

      {/* Vignette — single composited layer */}
      <div style={{
        ...abs, inset: 0, zIndex: 1,
        background: "radial-gradient(ellipse 115% 95% at 50% 50%, transparent 18%, rgba(0,0,0,0.7) 58%, rgba(0,0,0,0.97) 100%)",
      }} />

      {/* Aurora bloom — one layer, GPU promoted */}
      <div style={{
        ...abs, zIndex: 2,
        left: "50%", top: "50%",
        width: "min(1100px, 150vw)", height: "min(600px, 82vh)",
        transform: "translate(-50%, -50%) translateZ(0)",
        background: "radial-gradient(ellipse 50% 42% at 50% 50%, rgba(62,207,76,0.13) 0%, rgba(28,130,38,0.05) 46%, transparent 70%)",
        willChange: "opacity",
        opacity: auroraOn ? 1 : 0,
        transition: "opacity 2.6s cubic-bezier(0.16,1,0.3,1)",
      }} />

      {/* Cinematic letterbox bars */}
      <div style={{ ...abs, top: 0,    left: 0, right: 0, height: "10vh", background: "#000", zIndex: 8 }} />
      <div style={{ ...abs, bottom: 0, left: 0, right: 0, height: "10vh", background: "#000", zIndex: 8 }} />

      {/* Bokeh specks — GPU layers via translateZ */}
      {SPECKS.map((s, i) => (
        <div key={i} style={{
          ...abs, zIndex: 3,
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: s.green ? "#3ecf4c" : "#ffffff",
          filter: `blur(${s.blur}px)`,
          willChange: "opacity, transform",
          opacity: specksVis ? s.op : 0,
          transition: `opacity 1.8s ease ${s.del + 0.2}s`,
          animation: specksVis
            ? `__speck${i} ${s.dur}s ease-in-out ${s.del}s infinite alternate`
            : "none",
        }} />
      ))}

      {/* Anamorphic lens flare — 2 lines in one GPU layer */}
      <svg style={{
        ...abs, zIndex: 6,
        inset: 0, width: "100%", height: "100%",
        overflow: "visible",
        animation: flare ? "__flareSvg 0.85s cubic-bezier(0.4,0,0.2,1) forwards" : "none",
        opacity: 0,
      }}>
        <line x1="0%" y1="50%" x2="100%" y2="50%"
          stroke="url(#fg1)" strokeWidth="1.5" />
        <line x1="0%" y1="calc(50% + 5px)" x2="100%" y2="calc(50% + 5px)"
          stroke="url(#fg2)" strokeWidth="0.5" />
        <defs>
          <linearGradient id="fg1" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="14%"  stopColor="rgba(62,207,76,0.3)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.95)" />
            <stop offset="86%"  stopColor="rgba(62,207,76,0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="fg2" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="22%"  stopColor="rgba(62,207,76,0.35)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.6)" />
            <stop offset="78%"  stopColor="rgba(62,207,76,0.35)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div style={{
        ...abs, inset: 0, zIndex: 5,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>

        {/* Welcome greeting */}
        <div style={{ overflow: "hidden", marginBottom: "clamp(8px, 2vh, 20px)" }}>
          <p style={{
            margin: 0,
            fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 300,
            fontSize: "clamp(9px, 1.2vw, 12px)",
            letterSpacing: welcomeVis ? "0.45em" : "0.06em",
            color: "rgba(255,255,255,0.30)",
            textTransform: "uppercase",
            paddingLeft: "0.45em",
            willChange: "opacity, transform",
            opacity:    welcomeVis ? 1 : 0,
            transform:  welcomeVis ? "translateY(0)" : "translateY(22px)",
            transition: "opacity 0.9s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1), letter-spacing 1.8s cubic-bezier(0.4,0,0.2,1)",
          }}>Bienvenue chez</p>
        </div>

        {/* Wordmark — overflow hidden clips the upward reveal */}
        {/* padding-bottom gives room for the smile arc inside */}
        <div style={{ overflow: "hidden", paddingBottom: "26px" }}>
          <div style={{
            willChange: "transform, opacity",
            transform:  textVis ? "translateY(0%)" : "translateY(110%)",
            opacity:    textVis ? 1 : 0,
            transition: "transform 1.1s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease",
          }}>
            {/* L'eco */}
            <span style={{
              fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(52px, 9.5vw, 94px)",
              letterSpacing: "-0.04em",
              color: "#ffffff",
              lineHeight: 1,
            }}>L&apos;eco</span>

            {/* max + smile directly underneath */}
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{
                fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(52px, 9.5vw, 94px)",
                letterSpacing: "-0.04em",
                color: "#3ecf4c",
                lineHeight: 1,
                willChange: "filter",
                filter: specksVis
                  ? "drop-shadow(0 0 22px rgba(62,207,76,0.55))"
                  : "none",
                transition: "filter 1.6s ease 0.35s",
              }}>max</span>

              {/* Smile arc — absolutely under "max" only */}
              <svg
                viewBox="0 0 100 14"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  top: "calc(100% + 2px)",
                  left: 0,
                  width: "100%",
                  height: 14,
                  overflow: "visible",
                  opacity: smileDraw ? 1 : 0,
                  transition: "opacity 0.25s ease",
                }}
                fill="none"
              >
                <path
                  d="M 2 5 Q 50 14 98 5"
                  stroke="#3ecf4c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={SMILE_DASHARRAY}
                  strokeDashoffset={smileDraw ? 0 : SMILE_DASHARRAY}
                  style={{
                    filter: specksVis
                      ? "drop-shadow(0 0 5px rgba(62,207,76,1)) drop-shadow(0 0 12px rgba(62,207,76,0.55))"
                      : "drop-shadow(0 0 3px rgba(62,207,76,0.65))",
                    transition: smileDraw
                      ? "stroke-dashoffset 0.68s cubic-bezier(0.4,0,0.2,1), filter 1.5s ease 0.5s"
                      : "none",
                  }}
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          margin: "clamp(10px, 1.6vh, 16px) 0 0",
          fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
          fontWeight: 300,
          fontSize: "clamp(6px, 0.82vw, 9px)",
          letterSpacing: taglineVis ? "0.58em" : "0.10em",
          color: "rgba(255,255,255,0.16)",
          textTransform: "uppercase",
          paddingLeft: "0.58em",
          willChange: "opacity",
          opacity:    taglineVis ? 1 : 0,
          transition: "opacity 1.2s ease 0.25s, letter-spacing 2s cubic-bezier(0.4,0,0.2,1) 0.1s",
        }}>
          Performance &amp; Style
        </p>

      </div>

      {/* Progress line inside bottom bar */}
      <div style={{
        ...abs, bottom: 0, left: 0, right: 0, height: "10vh",
        zIndex: 9,
        display: "flex", alignItems: "flex-end",
        paddingBottom: "1.5vh",
      }}>
        <div style={{ width: "100%", height: "0.5px", background: "rgba(255,255,255,0.04)" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(62,207,76,0.45) 50%, #3ecf4c)",
            boxShadow: "0 0 6px rgba(62,207,76,0.4)",
            animation: auroraOn ? "__prog 4s linear forwards" : "none",
          }} />
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes __flareSvg {
          0%   { opacity: 0;   transform: scaleX(0.04); }
          9%   { opacity: 1;   transform: scaleX(1); }
          55%  { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes __prog {
          from { width: 0%; }
          to   { width: 100%; }
        }
        ${SPECKS.map((s, i) => {
          const dx = (i % 2 === 0 ? 1 : -1) * (4 + i * 2);
          const dy = -(3 + i * 0.8);
          return `@keyframes __speck${i} {
            from { transform: translate3d(0,0,0) scale(0.85); }
            to   { transform: translate3d(${dx}px,${dy}px,0) scale(1.25); }
          }`;
        }).join("\n")}
      `}</style>
    </div>
  );
}

