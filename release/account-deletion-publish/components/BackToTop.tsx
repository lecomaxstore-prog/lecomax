"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setChatOpen(document.body.classList.contains("chat-open"));
    });
    observer.observe(document.body, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!visible || chatOpen || pathname.startsWith("/admin")) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut de page"
      className="hidden sm:flex fixed bottom-28 left-5 z-[9000] w-14 h-14 rounded-full bg-black text-white items-center justify-center hover:bg-neutral-800 active:bg-neutral-900 transition-all duration-200 shadow-lg hover:scale-110 active:scale-95"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
