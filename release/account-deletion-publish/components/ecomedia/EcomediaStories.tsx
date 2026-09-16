"use client";

import type { CSSProperties, ReactNode } from "react";

type Story = {
  key: string;
  label: string;
  color: string;
  soft: string;
  icon: ReactNode;
};

const iconProps = {
  width: 21,
  height: 21,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const STORIES: Story[] = [
  {
    key: "all", label: "Tout", color: "#16b955", soft: "#eafbf0",
    icon: <svg {...iconProps}><path d="m12 3-9 4.5 9 4.5 9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/></svg>,
  },
  {
    key: "images", label: "Photos", color: "#ee8a17", soft: "#fff6e8",
    icon: <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
  },
  {
    key: "videos", label: "Vidéos", color: "#7c5ce7", soft: "#f2efff",
    icon: <svg {...iconProps}><rect x="3" y="4" width="18" height="16" rx="4"/><path d="m10 9 5 3-5 3V9Z"/></svg>,
  },
  {
    key: "offers", label: "Offres", color: "#e94f7a", soft: "#fff0f5",
    icon: <svg {...iconProps}><path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/></svg>,
  },
  {
    key: "product", label: "Produits", color: "#2582dc", soft: "#edf7ff",
    icon: <svg {...iconProps}><path d="M6 3 3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-4H6Z"/><path d="M3 7h18M16 11a4 4 0 0 1-8 0"/></svg>,
  },
];

interface Props {
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

export default function EcomediaStories({ activeFilter, onFilterChange }: Props) {
  return (
    <nav className="relative overflow-hidden border-b border-neutral-100 bg-white" aria-label="Catégories Ecomedia">
      <style>{`
        @keyframes story-enter { from { opacity: 0; transform: translateY(8px) scale(.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes story-pop { 0% { transform: scale(.72) rotate(-8deg) } 65% { transform: scale(1.12) rotate(3deg) } 100% { transform: scale(1) rotate(0) } }
        @keyframes story-pulse { 0% { transform: scale(.82); opacity: .5 } 100% { transform: scale(1.28); opacity: 0 } }
        @keyframes story-dot { 0% { transform: scaleX(.2); opacity: 0 } 100% { transform: scaleX(1); opacity: 1 } }
        .ecomedia-story { animation: story-enter .45s cubic-bezier(.16,1,.3,1) both }
        .ecomedia-story-icon-active { animation: story-pop .42s cubic-bezier(.16,1,.3,1) both }
        .ecomedia-story-pulse { animation: story-pulse 1.8s ease-out infinite }
        .ecomedia-story-dot { animation: story-dot .35s cubic-bezier(.16,1,.3,1) both }
        @media (prefers-reduced-motion: reduce) { .ecomedia-story, .ecomedia-story-icon-active, .ecomedia-story-pulse, .ecomedia-story-dot { animation: none !important } }
      `}</style>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-neutral-50/80 to-transparent" />
      <div className="relative flex gap-2 overflow-x-auto px-3 py-3.5 scrollbar-none sm:gap-3 sm:px-4">
        {STORIES.map((story, index) => {
          const isActive = activeFilter === story.key;
          return (
            <button
              key={story.key}
              type="button"
              onClick={() => onFilterChange(story.key)}
              aria-pressed={isActive}
              className="ecomedia-story group relative flex w-[68px] shrink-0 flex-col items-center gap-2 rounded-2xl py-1 outline-none transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:w-[72px]"
              style={{ animationDelay: `${index * 55}ms`, "--story-color": story.color } as CSSProperties}
            >
              <span className="relative flex h-[58px] w-[58px] items-center justify-center">
                {isActive && <span className="ecomedia-story-pulse absolute inset-[3px] rounded-[20px] border-2" style={{ borderColor: story.color }} />}
                <span
                  className={`relative flex h-[54px] w-[54px] items-center justify-center rounded-[19px] border transition-all duration-300 ${isActive ? "-translate-y-0.5 text-white shadow-[0_10px_24px_rgba(0,0,0,.15)]" : "border-neutral-200 bg-white text-neutral-400 shadow-[0_5px_15px_rgba(0,0,0,.04)] group-hover:border-transparent group-hover:text-[var(--story-color)] group-hover:shadow-md"}`}
                  style={isActive ? { background: `linear-gradient(145deg, ${story.color}, color-mix(in srgb, ${story.color} 72%, #07110b))`, borderColor: story.color } : undefined}
                >
                  {!isActive && <span className="absolute inset-1 rounded-[15px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundColor: story.soft }} />}
                  <span key={`${story.key}-${isActive}`} className={`relative transition-transform duration-300 group-hover:scale-110 ${isActive ? "ecomedia-story-icon-active" : ""}`}>{story.icon}</span>
                  {isActive && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#b9ff54] shadow-sm" />}
                </span>
              </span>

              <span className={`text-[10px] font-black tracking-[-.01em] transition-colors duration-300 ${isActive ? "text-neutral-950" : "text-neutral-400 group-hover:text-neutral-700"}`}>{story.label}</span>
              {isActive && <span className="ecomedia-story-dot absolute -bottom-1 h-[3px] w-5 rounded-full" style={{ backgroundColor: story.color }} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
