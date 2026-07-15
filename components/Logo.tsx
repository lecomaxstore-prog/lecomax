"use client";

import { useSettings } from "@/lib/use-settings";

type Props = {
  className?: string;
  variant?: "dark" | "light";
  showWordmark?: boolean;
};

export default function Logo({
  className = "",
  variant = "dark",
  showWordmark = false,
}: Props) {
  const siteSettings = useSettings();
  const textColor = variant === "light" ? "#ffffff" : "#000000";
  const configuredLogo = siteSettings.logo_image?.trim();

  if (configuredLogo && variant === "dark" && !showWordmark) {
    return (
      <span className={`inline-flex h-10 w-[135px] items-center select-none ${className}`}>
        {/* Uploaded Supabase URLs and local assets are both supported here. */}
        <img src={configuredLogo} alt={siteSettings.store_name || "L'ecomax"} className="max-h-10 max-w-[135px] object-contain object-left" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 180 48"
        height="40"
        width="135"
        aria-label="L'ecomax"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Apostrophe + L'eco */}
        <text
          x="0"
          y="36"
          fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
          fontWeight="900"
          fontSize="34"
          fill={textColor}
          letterSpacing="-1"
        >
          L&apos;eco
        </text>
        {/* max in brand green */}
        <text
          x="93"
          y="36"
          fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
          fontWeight="900"
          fontSize="34"
          fill="#3ecf4c"
          letterSpacing="-1"
        >
          max
        </text>
        {/* Animated smile under "max" */}
        <defs>
          <style>{`
            @keyframes smileWiggle {
              0%   { transform: scaleX(1)    translateY(0px);  opacity: 0.85; }
              25%  { transform: scaleX(1.08) translateY(1px);  opacity: 1;    }
              50%  { transform: scaleX(0.92) translateY(-1px); opacity: 0.9;  }
              75%  { transform: scaleX(1.05) translateY(1px);  opacity: 1;    }
              100% { transform: scaleX(1)    translateY(0px);  opacity: 0.85; }
            }
            .logo-smile {
              animation: smileWiggle 2.6s ease-in-out infinite;
              transform-box: fill-box;
              transform-origin: center center;
            }
          `}</style>
        </defs>
        {/* smile arc: starts bottom-left of "max", curves down in centre, ends bottom-right */}
        <path
          className="logo-smile"
          d="M 93 41 Q 135 50 177 41"
          stroke="#3ecf4c"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
