const fs = require('fs');

const content = `"use client";
import { useRef, useEffect, useState } from "react";

interface Props {
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

const SIZE_STYLES: Record<string, { fontSize: string; letterSpacing: string; fontWeight: number }> = {
  sm: { fontSize: "17px", letterSpacing: "-0.4px", fontWeight: 900 },
  md: { fontSize: "22px", letterSpacing: "-0.5px", fontWeight: 900 },
  lg: { fontSize: "28px", letterSpacing: "-0.6px", fontWeight: 900 },
};

const SMILE_SIZE: Record<string, number> = { sm: 2.5, md: 3, lg: 4 };

export default function EcomediaWordmark({ size = "md", dark = false }: Props) {
  const mediaRef = useRef<HTMLSpanElement>(null);
  const [smileW, setSmileW] = useState(0);
  const style = SIZE_STYLES[size];
  const strokeW = SMILE_SIZE[size];

  useEffect(() => {
    const measure = () => {
      if (mediaRef.current) setSmileW(mediaRef.current.offsetWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [size]);

  const smileH = strokeW * 3;
  const textColor = dark ? "#fff" : "#0d0d0d";
  const mid = smileW / 2;

  return (
    <span
      className="inline-flex items-center select-none"
      style={{
        fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
        fontSize: style.fontSize,
        letterSpacing: style.letterSpacing,
        fontWeight: style.fontWeight,
        lineHeight: 1,
      }}
    >
      <span style={{ color: textColor }}>Eco</span>
      <span className="relative" style={{ color: "#3ecf4c" }}>
        <span ref={mediaRef}>media</span>
        {smileW > 0 && (
          <svg
            width={smileW}
            height={smileH + 3}
            viewBox={\`0 0 \${smileW} \${smileH + 3}\`}
            style={{ position: "absolute", left: 0, top: "100%", marginTop: 2, overflow: "visible" }}
            fill="none"
          >
            <style>{\`
              @keyframes smWave {
                0%,100%{ transform:scaleX(1)    translateY(0);   opacity:.85 }
                25%    { transform:scaleX(1.07) translateY(1px); opacity:1   }
                50%    { transform:scaleX(.93)  translateY(-1px);opacity:.9  }
                75%    { transform:scaleX(1.04) translateY(1px); opacity:1   }
              }
              .sm-arc { animation:smWave 2.6s ease-in-out infinite; transform-box:fill-box; transform-origin:center }
            \`}</style>
            <path
              className="sm-arc"
              d={\`M 2 2 Q \${mid} \${smileH + 2} \${smileW - 2} 2\`}
              stroke="#3ecf4c"
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </span>
  );
}
`;

fs.writeFileSync('components/ecomedia/EcomediaWordmark.tsx', content, 'utf8');
console.log('Written', content.split('\n').length, 'lines');
