"use client";
import { useEffect, useState } from "react";

export default function IntroAnimation() {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit" | "done">("enter");

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("intro_shown")) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("intro_shown", "1");

    // enter → hold → exit → done
    const t1 = setTimeout(() => setPhase("hold"), 200);
    const t2 = setTimeout(() => setPhase("exit"), 1800);
    const t3 = setTimeout(() => setPhase("done"), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white pointer-events-none"
      style={{
        transition: phase === "exit" ? "opacity 0.7s ease, transform 0.7s ease" : "opacity 0.4s ease",
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "scale(1.04)" : "scale(1)",
      }}
    >
      {/* Black sweep background */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          clipPath: "circle(0% at 50% 50%)",
          transition: phase === "hold" || phase === "exit" ? "clip-path 0.9s cubic-bezier(0.76,0,0.24,1)" : "none",
          ...(phase === "hold" || phase === "exit" ? { clipPath: "circle(150% at 50% 50%)" } : {}),
        }}
      />

      {/* White circle burst */}
      <div
        className="absolute inset-0 bg-white"
        style={{
          clipPath: "circle(0% at 50% 50%)",
          transition: phase === "exit" ? "clip-path 0.5s cubic-bezier(0.76,0,0.24,1) 0.15s" : "none",
          ...(phase === "exit" ? { clipPath: "circle(150% at 50% 50%)" } : {}),
        }}
      />

      {/* Logo */}
      <div
        className="relative z-10 flex flex-col items-center gap-5"
        style={{
          transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          opacity: phase === "enter" ? 0 : phase === "exit" ? 0 : 1,
          transform: phase === "enter" ? "translateY(18px) scale(0.9)" : phase === "exit" ? "translateY(-12px) scale(0.95)" : "translateY(0) scale(1)",
        }}
      >
        {/* Logo SVG */}
        <svg viewBox="0 0 220 56" height="64" width="220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text
            x="0" y="44"
            fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
            fontWeight="900"
            fontSize="42"
            letterSpacing="-1"
            style={{ transition: "fill 0.4s ease", fill: phase === "hold" || phase === "exit" ? "#ffffff" : "#000000" }}
          >
            L&apos;eco
          </text>
          <text
            x="115" y="44"
            fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
            fontWeight="900"
            fontSize="42"
            letterSpacing="-1"
            fill="#3ecf4c"
          >
            max
          </text>
          <path
            d="M 115 50 Q 165 60 215 50"
            stroke="#3ecf4c"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Tagline */}
        <p
          className="text-[11px] uppercase tracking-[0.5em] font-bold"
          style={{
            color: "#fff",
            transition: "opacity 0.5s ease",
            opacity: phase === "hold" ? 1 : 0,
          }}
        >
          Performance &amp; Style
        </p>

        {/* Animated dots loader */}
        <div
          className="flex gap-1.5"
          style={{
            opacity: phase === "hold" ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#3ecf4c]"
              style={{
                animation: phase === "hold" ? `bounce 0.9s ease-in-out ${i * 0.15}s infinite` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
