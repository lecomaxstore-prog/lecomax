import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AnnouncementBar() {
  const { data } = await supabaseAdmin
    .from("announcements")
    .select("text")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.text) return null;

  // Repeat enough times so the marquee never shows a gap
  const repeats = Array(10).fill(data.text);

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        background: "linear-gradient(90deg, #08080d 0%, #0f0f17 40%, #0f0f17 60%, #08080d 100%)",
      }}
    >
      {/* Green shimmer line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, #3ecf4c 0%, #60a5fa 40%, #3ecf4c 100%)", opacity: 0.7 }}
      />

      {/* Edge fade masks */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10"
        style={{ background: "linear-gradient(to right, #08080d, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10"
        style={{ background: "linear-gradient(to left, #08080d, transparent)" }}
      />

      <div className="marquee-track py-[9px] text-[11px] tracking-[0.18em] font-semibold">
        {repeats.map((text, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-white/80 cursor-default">
            <span
              className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full shrink-0"
              style={{ background: "rgba(62,207,76,0.2)" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span>{text}</span>
            <span className="mx-5 shrink-0 text-[#3ecf4c]/40 text-[8px]">◆</span>
          </span>
        ))}
      </div>

      {/* Subtle bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

