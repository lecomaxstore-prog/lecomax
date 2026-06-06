"use client";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

// ─── Deterministic PRNG ───────────────────────────────────────────────────────
const R = (n: number) => {
  const a = 1664525, c = 1013904223, m = 0x100000000;
  return ((a * n + c) % m) / m;
};

// ─── 60 particles ────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  id:    i,
  x:     R(i * 17 +  1) * 100,
  y:     R(i * 23 +  2) * 100,
  size:  R(i * 11 +  3) * 3.2 + 0.6,
  dur:   R(i *  7 +  4) * 3.8 + 1.6,
  del:   R(i * 13 +  5) * 4.4,
  op:    R(i * 19 +  6) * 0.45 + 0.08,
  shape: i % 4,
  col:   (["#fff","#fff","#3ecf4c","#9dfca7","#c8ffd0","#fff"] as const)[i % 6],
}));

// ─── Bokeh blobs ──────────────────────────────────────────────────────────────
const BOKEH = [
  { x: 12, y: 24, r: 200, op: 0.055, dx:  18, dy:  14 },
  { x: 80, y: 64, r: 140, op: 0.045, dx: -13, dy:  20 },
  { x: 48, y:  3, r: 220, op: 0.032, dx:   9, dy:  26 },
  { x: 18, y: 78, r: 120, op: 0.052, dx:  22, dy: -11 },
  { x: 75, y: 14, r: 110, op: 0.062, dx: -18, dy:  15 },
  { x: 55, y: 89, r:  96, op: 0.042, dx:  11, dy: -20 },
];

// ─── Radial rays ──────────────────────────────────────────────────────────────
const RAYS = Array.from({ length: 36 }, (_, i) => ({
  id:    i,
  angle: i * (360 / 36),
  len:   R(i * 31 + 7) * 34 + 18,
  op:    R(i * 41 + 9) * 0.15 + 0.05,
}));

// ─── Corner brackets ──────────────────────────────────────────────────────────
const CORNERS: Array<{
  pos: { top?: number; bottom?: number; left?: number; right?: number };
  bt?: boolean; bb?: boolean; bl?: boolean; br?: boolean;
}> = [
  { pos: { top: 22, left: 22 },     bt: true,  bl: true  },
  { pos: { top: 22, right: 22 },    bt: true,  br: true  },
  { pos: { bottom: 44, left: 22 },  bb: true,  bl: true  },
  { pos: { bottom: 44, right: 22 }, bb: true,  br: true  },
];

// ─── Types & constants ────────────────────────────────────────────────────────
type Phase = "init" | "scan" | "letters" | "glow" | "hold" | "exit" | "done";
const CIRC      = 2 * Math.PI * 16;
const SMILE_LEN = 115;
const PROG: Record<Phase, number> = {
  init: 0.02, scan: 0.18, letters: 0.48, glow: 0.74, hold: 1, exit: 1, done: 1,
};

export default function IntroAnimation() {
  const [phase, setPhase]         = useState<Phase | null>(null);
  const [shimmer, setShimmer]     = useState(false);
  const [flash, setFlash]         = useState(false);
  const [smileDraw, setSmileDraw] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("intro_shown")) {
      sessionStorage.setItem("intro_done", "1");
      setPhase("done");
      return;
    }
    sessionStorage.setItem("intro_shown", "1");
    setPhase("init");
    const ts = [
      setTimeout(() => setPhase("scan"),      150),
      setTimeout(() => setPhase("letters"),   650),
      setTimeout(() => setSmileDraw(true),    1050),
      setTimeout(() => setPhase("glow"),      1380),
      setTimeout(() => setShimmer(true),      1600),
      setTimeout(() => setPhase("hold"),      2050),
      setTimeout(() => setFlash(true),        3750),
      setTimeout(() => setPhase("exit"),      3850),
      setTimeout(() => {
        sessionStorage.setItem("intro_done", "1");
        window.dispatchEvent(new Event("introDone"));
        setPhase("done");
      }, 4750),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  if (!phase || phase === "done") return null;

  const lit      = phase !== "init";
  const letVis   = phase === "letters" || phase === "glow" || phase === "hold" || phase === "exit";
  const glow     = phase === "glow"    || phase === "hold" || phase === "exit";
  const tagline  = phase === "hold"    || phase === "exit";
  const corners  = phase === "glow"    || phase === "hold" || phase === "exit";
  const progress = PROG[phase] ?? 0;

  const base: CSSProperties = { position: "absolute" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      overflow: "hidden",
      background: "#030303",
      pointerEvents: "none", userSelect: "none",
      opacity:   phase === "exit" ? 0 : 1,
      transform: phase === "exit" ? "scale(1.06)" : "scale(1)",
      transition: phase === "exit"
        ? "opacity 0.72s cubic-bezier(0.4,0,1,1) 0.08s, transform 0.95s cubic-bezier(0.4,0,1,1)"
        : "none",
      willChange: "opacity, transform",
    }}>

      {/* ── Radial green atmosphere ── */}
      <div style={{
        ...base, inset: 0,
        background: "radial-gradient(ellipse 72% 58% at 50% 50%, rgba(62,207,76,0.22) 0%, rgba(0,18,5,0.36) 44%, transparent 72%)",
        opacity: lit ? 1 : 0, transition: "opacity 1.6s ease",
      }} />

      {/* ── Vignette ── */}
      <div style={{
        ...base, inset: 0,
        background: "radial-gradient(ellipse 140% 120% at 50% 50%, transparent 30%, rgba(0,0,0,0.9) 100%)",
      }} />

      {/* ── Tech grid ── */}
      <div style={{
        ...base, inset: 0,
        backgroundImage: [
          "linear-gradient(rgba(62,207,76,0.026) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(62,207,76,0.026) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "56px 56px",
        opacity: lit ? 1 : 0, transition: "opacity 1.5s ease 0.2s",
      }} />

      {/* ── Bokeh ── */}
      {BOKEH.map((b, i) => (
        <div key={i} style={{
          ...base, left: `${b.x}%`, top: `${b.y}%`,
          width: b.r, height: b.r, borderRadius: "50%",
          background: "#3ecf4c",
          filter: `blur(${Math.round(b.r * 0.44)}px)`,
          opacity: lit ? b.op : 0,
          transition: `opacity 1.8s ease ${i * 0.12}s`,
          animation: lit ? `__bk${i} ${7.5 + i * 1.1}s ease-in-out ${i * 0.33}s infinite alternate` : "none",
        }} />
      ))}

      {/* ── Particles ── */}
      {PARTICLES.map((p) => (
        <div key={p.id} style={{
          ...base, left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: p.shape === 3 ? "0" : "50%",
          background: p.col,
          transform: p.shape === 3 ? "rotate(45deg)" : "none",
          opacity: lit ? p.op : 0,
          transition: `opacity 0.9s ease ${(p.del * 0.2).toFixed(2)}s`,
          animation: lit ? `__sp${p.id % 4} ${p.dur.toFixed(2)}s ease-in-out ${p.del.toFixed(2)}s infinite` : "none",
        }} />
      ))}

      {/* ── Pulse rings ── */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          ...base, left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: `1px solid rgba(62,207,76,${0.55 - i * 0.14})`,
          boxShadow: `0 0 ${20 + i * 16}px rgba(62,207,76,${0.18 - i * 0.04}),
                      inset 0 0 ${12 + i * 8}px rgba(62,207,76,${0.07 - i * 0.015})`,
          animation: lit ? `__ring${i} ${2.6 + i * 0.75}s cubic-bezier(0.1,0,0.9,1) ${i * 0.38}s infinite` : "none",
          opacity: lit ? 1 : 0,
        }} />
      ))}

      {/* ── Radial rays (glow phase) ── */}
      {glow && (
        <div style={{ ...base, left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "220vmax", height: "220vmax" }}>
          {RAYS.map((ray) => (
            <div key={ray.id} style={{
              ...base, left: "50%", top: "50%",
              height: 1, width: `${ray.len}%`,
              transformOrigin: "left center",
              transform: `rotate(${ray.angle}deg)`,
              background: `linear-gradient(90deg, rgba(62,207,76,${ray.op}) 0%, transparent 100%)`,
            }} />
          ))}
        </div>
      )}

      {/* ── Scan line ── */}
      <div style={{
        ...base, left: 0, right: 0, height: 3,
        background: "linear-gradient(90deg, transparent 0%, rgba(62,207,76,0.35) 18%, rgba(62,207,76,1) 50%, rgba(62,207,76,0.35) 82%, transparent 100%)",
        boxShadow: "0 0 24px 6px rgba(62,207,76,0.44), 0 0 64px 16px rgba(62,207,76,0.14)",
        animation: phase === "scan" ? "__scan 1.2s cubic-bezier(0.22,0.08,0.28,1) forwards" : "none",
        opacity: phase === "scan" ? 1 : 0,
      }} />

      {/* ══════════════════ CENTER ══════════════════ */}
      <div style={{
        ...base, inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>

        {/* ── Wordmark ── */}
        <div style={{ position: "relative" }}>

          {/* Outer glow halo */}
          <div style={{
            ...base, inset: "-56px -44px",
            borderRadius: 18,
            background: "radial-gradient(ellipse 95% 72% at 50% 52%, rgba(62,207,76,0.3) 0%, transparent 70%)",
            opacity: glow ? 1 : 0, transition: "opacity 1.1s ease",
          }} />

          {/* SVG wordmark — text slides from opposite sides */}
          <div style={{ position: "relative", zIndex: 1, overflow: "hidden", paddingBottom: 18 }}>
            <svg
              viewBox="0 0 180 48"
              width="clamp(270px, 52vw, 480px)"
              height="auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", overflow: "visible" }}
            >
              <defs>
                <style>{`
                  @keyframes __eco_in {
                    from { opacity:0; transform:translateX(-48px); filter:blur(8px); }
                    to   { opacity:1; transform:translateX(0);     filter:blur(0px); }
                  }
                  @keyframes __max_in {
                    from { opacity:0; transform:translateX(48px);  filter:blur(8px); }
                    to   { opacity:1; transform:translateX(0);     filter:blur(0px); }
                  }
                  @keyframes smileWiggle {
                    0%,100% { transform:scaleX(1)    translateY(0px);  }
                    30%     { transform:scaleX(1.07) translateY(1px);  }
                    65%     { transform:scaleX(0.94) translateY(-1px); }
                  }
                  .intro-eco       { opacity:0; }
                  .intro-eco.vis   { animation:__eco_in 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards; }
                  .intro-max       { opacity:0; }
                  .intro-max.vis   { animation:__max_in 0.55s cubic-bezier(0.34,1.3,0.64,1) 0.07s forwards; }
                  .intro-smile     {
                    animation:smileWiggle 2.8s ease-in-out 0.8s infinite;
                    transform-box:fill-box;
                    transform-origin:center center;
                  }
                `}</style>
              </defs>

              <text
                className={`intro-eco${letVis ? " vis" : ""}`}
                x="0" y="36"
                fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
                fontWeight="900" fontSize="34" fill="#ffffff" letterSpacing="-1"
                style={{
                  filter: glow ? "drop-shadow(0 0 14px rgba(255,255,255,0.55))" : "none",
                  transition: "filter 0.65s ease",
                }}
              >L&apos;eco</text>

              <text
                className={`intro-max${letVis ? " vis" : ""}`}
                x="93" y="36"
                fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
                fontWeight="900" fontSize="34" fill="#3ecf4c" letterSpacing="-1"
                style={{
                  filter: glow
                    ? "drop-shadow(0 0 22px rgba(62,207,76,0.9)) drop-shadow(0 0 44px rgba(62,207,76,0.45))"
                    : "none",
                  transition: "filter 0.65s ease",
                }}
              >max</text>

              <path
                className="intro-smile"
                d="M 93 41 Q 135 50 177 41"
                stroke="#3ecf4c" strokeWidth="3" strokeLinecap="round" fill="none"
                strokeDasharray={SMILE_LEN}
                strokeDashoffset={smileDraw ? 0 : SMILE_LEN}
                style={{
                  transition: smileDraw ? "stroke-dashoffset 0.58s cubic-bezier(0.4,0,0.2,1)" : "none",
                  filter: glow ? "drop-shadow(0 0 7px rgba(62,207,76,0.95))" : "none",
                }}
              />
            </svg>

            {/* Shimmer sweep */}
            <div style={{
              ...base, inset: 0,
              background: "linear-gradient(110deg, transparent 8%, rgba(255,255,255,0.68) 40%, rgba(255,255,255,0.16) 55%, transparent 82%)",
              transform: shimmer ? "translateX(260%)" : "translateX(-260%)",
              transition: shimmer ? "transform 0.56s cubic-bezier(0.4,0,0.2,1)" : "none",
              pointerEvents: "none", zIndex: 3,
            }} />
          </div>

          {/* Underline glow bar */}
          <div style={{
            position: "absolute", bottom: 0, left: "10%", right: "10%", height: 1,
            background: "linear-gradient(90deg, transparent, rgba(62,207,76,0.5) 30%, rgba(62,207,76,0.5) 70%, transparent)",
            opacity: glow ? 1 : 0, transition: "opacity 0.8s ease 0.3s",
          }} />
        </div>

        {/* ── Tagline ── */}
        <p style={{
          margin: "20px 0 0",
          fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
          fontWeight: 700,
          fontSize: "clamp(8px, 1.4vw, 10px)",
          letterSpacing: tagline ? "0.65em" : "0.06em",
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
          opacity: tagline ? 1 : 0,
          transition: "opacity 0.7s ease 0.22s, letter-spacing 1.05s ease 0.15s",
        }}>
          Performance &amp; Style
        </p>

      </div>

      {/* ── Progress ring ── */}
      <div style={{
        ...base, bottom: 28, left: "50%",
        transform: "translateX(-50%)",
        opacity: lit ? 1 : 0, transition: "opacity 0.5s ease",
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44"
          style={{ transform: "rotate(-90deg)", display: "block" }}>
          <circle cx="22" cy="22" r="16" fill="none"
            stroke="rgba(255,255,255,0.045)" strokeWidth="1.5" />
          <circle cx="22" cy="22" r="16" fill="none"
            stroke="#3ecf4c" strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray={CIRC.toFixed(2)}
            strokeDashoffset={(CIRC * (1 - progress)).toFixed(2)}
            style={{
              transition: "stroke-dashoffset 0.92s cubic-bezier(0.4,0,0.2,1)",
              filter: "drop-shadow(0 0 5px rgba(62,207,76,0.78))",
            }}
          />
          <circle cx="22" cy="22" r="2.5" fill="rgba(62,207,76,0.55)"
            style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px" }} />
        </svg>
      </div>

      {/* ── Corner brackets ── */}
      {CORNERS.map((c, i) => (
        <div key={i} style={{
          ...base,
          top: c.pos.top, bottom: c.pos.bottom,
          left: c.pos.left, right: c.pos.right,
          width: 28, height: 28,
          borderTop:    c.bt ? "1.5px solid rgba(62,207,76,0.52)" : "none",
          borderBottom: c.bb ? "1.5px solid rgba(62,207,76,0.52)" : "none",
          borderLeft:   c.bl ? "1.5px solid rgba(62,207,76,0.52)" : "none",
          borderRight:  c.br ? "1.5px solid rgba(62,207,76,0.52)" : "none",
          opacity:   corners ? 1 : 0,
          transform: corners ? "scale(1)" : "scale(0.1)",
          transition: `opacity 0.42s ease ${0.08 + i * 0.08}s,
                       transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${0.08 + i * 0.08}s`,
        }} />
      ))}

      {/* ── White flash ── */}
      <div style={{
        ...base, inset: 0,
        background: "#fff",
        opacity: flash ? 0.18 : 0,
        transition: flash ? "opacity 0.12s ease" : "none",
      }} />

      {/* ══════════════════ KEYFRAMES ══════════════════ */}
      <style>{`
        @keyframes __scan {
          from { top: -4px; opacity: 1; }
          to   { top: calc(100% + 4px); opacity: 0.05; }
        }
        @keyframes __ring0 {
          0%   { width: 6px;    height: 6px;    opacity: 0.85; }
          100% { width: 820px;  height: 820px;  opacity: 0; }
        }
        @keyframes __ring1 {
          0%   { width: 6px;    height: 6px;    opacity: 0.65; }
          100% { width: 1020px; height: 1020px; opacity: 0; }
        }
        @keyframes __ring2 {
          0%   { width: 6px;    height: 6px;    opacity: 0.45; }
          100% { width: 1220px; height: 1220px; opacity: 0; }
        }
        @keyframes __sp0 {
          0%,100% { opacity:.13; transform:scale(.78); }
          50%     { opacity:1;   transform:scale(2.1); }
        }
        @keyframes __sp1 {
          0%,100% { opacity:.26; transform:scale(1); }
          32%     { opacity:.92; transform:scale(1.7); }
          68%     { opacity:.04; transform:scale(.52); }
        }
        @keyframes __sp2 {
          0%,100% { opacity:.07; transform:scale(.82) rotate(0deg); }
          50%     { opacity:1;   transform:scale(2.4) rotate(45deg); }
        }
        @keyframes __sp3 {
          0%,100% { opacity:.36; transform:scale(1.12); }
          20%     { opacity:.04; transform:scale(.48); }
          80%     { opacity:1;   transform:scale(1.8); }
        }
        ${BOKEH.map((b, i) => `
          @keyframes __bk${i} {
            from { transform: translate(0,0) scale(1); }
            to   { transform: translate(${b.dx}px,${b.dy}px) scale(1.22); }
          }
        `).join("")}
      `}</style>
    </div>
  );
}
