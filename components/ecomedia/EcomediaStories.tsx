"use client";

const STORIES = [
  {
    key: "all",
    label: "Tout",
    gradient: "from-[#3ecf4c] to-[#16b277]",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: "images",
    label: "Photos",
    gradient: "from-amber-400 to-orange-500",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="white" stroke="none"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    key: "videos",
    label: "Vidéos",
    gradient: "from-purple-500 to-violet-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <polygon points="5 3 19 12 5 21 5 3" fill="white" stroke="none"/>
      </svg>
    ),
  },
  {
    key: "offers",
    label: "Offres",
    gradient: "from-rose-500 to-pink-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3"/>
      </svg>
    ),
  },
  {
    key: "product",
    label: "Produits",
    gradient: "from-blue-500 to-cyan-500",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
];

interface Props {
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

export default function EcomediaStories({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="bg-white border-b border-neutral-100">
      <div className="flex gap-5 px-4 py-3 overflow-x-auto scrollbar-none">
        {STORIES.map((s) => {
          const isActive = activeFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onFilterChange(s.key)}
              className="flex flex-col items-center gap-2 shrink-0 active:scale-90 transition-all duration-150"
            >
              {/* Ring + circle */}
              <div className={`p-[2px] rounded-full transition-all duration-300 ${isActive ? `bg-gradient-to-br ${s.gradient}` : "bg-neutral-200"}`}>
                <div className="bg-white p-[2.5px] rounded-full">
                  <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center bg-gradient-to-br ${isActive ? s.gradient : "from-neutral-100 to-neutral-200"} transition-all duration-300`}>
                    <div className={`transition-all duration-300 ${isActive ? "opacity-100 scale-100" : "opacity-40 scale-90 grayscale"}`}>
                      {s.icon}
                    </div>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-black transition-colors duration-200 ${isActive ? "text-black" : "text-neutral-400"}`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
