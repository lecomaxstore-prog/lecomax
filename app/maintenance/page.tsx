import Logo from "@/components/Logo";

export default function MaintenancePage() {
  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-12px) rotate(1deg); }
          66%       { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes blob-move {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: translate(0,0) scale(1); }
          33%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: translate(20px,-10px) scale(1.04); }
          66%       { border-radius: 50% 60% 30% 60% / 40% 30% 60% 50%; transform: translate(-10px,10px) scale(0.97); }
        }
        @keyframes blob-move-2 {
          0%, 100% { border-radius: 40% 60% 60% 40% / 70% 30% 70% 30%; transform: translate(0,0) scale(1); }
          50%       { border-radius: 60% 40% 40% 60% / 30% 70% 30% 70%; transform: translate(-15px,8px) scale(1.05); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes progress-fill {
          0%   { width: 0%; }
          15%  { width: 18%; }
          30%  { width: 35%; }
          50%  { width: 52%; }
          70%  { width: 71%; }
          85%  { width: 83%; }
          95%  { width: 91%; }
          100% { width: 91%; }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ping-ring {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes slide-right {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }

        .anim-fade-up-1 { animation: fade-up 0.7s cubic-bezier(.22,1,.36,1) both 0.05s; }
        .anim-fade-up-2 { animation: fade-up 0.7s cubic-bezier(.22,1,.36,1) both 0.2s; }
        .anim-fade-up-3 { animation: fade-up 0.7s cubic-bezier(.22,1,.36,1) both 0.35s; }
        .anim-fade-up-4 { animation: fade-up 0.7s cubic-bezier(.22,1,.36,1) both 0.5s; }
        .anim-fade-up-5 { animation: fade-up 0.7s cubic-bezier(.22,1,.36,1) both 0.65s; }
        .anim-scale-in  { animation: scale-in 0.8s cubic-bezier(.34,1.56,.64,1) both 0.1s; }
        .anim-float     { animation: float 5s ease-in-out infinite; }
        .anim-blob-1    { animation: blob-move 8s ease-in-out infinite; }
        .anim-blob-2    { animation: blob-move-2 10s ease-in-out infinite; }
        .anim-spin      { animation: spin-slow 12s linear infinite; }
        .anim-spin-rev  { animation: spin-reverse 8s linear infinite; }
        .anim-progress  { animation: progress-fill 4s cubic-bezier(.4,0,.2,1) both 0.8s; }
        .anim-dot-1     { animation: dot-bounce 1.4s ease-in-out infinite 0s; }
        .anim-dot-2     { animation: dot-bounce 1.4s ease-in-out infinite 0.2s; }
        .anim-dot-3     { animation: dot-bounce 1.4s ease-in-out infinite 0.4s; }
        .anim-ping      { animation: ping-ring 1.8s ease-out infinite; }
        .anim-shimmer   {
          background: linear-gradient(90deg, transparent 0%, rgba(62,207,76,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2.5s linear infinite;
        }
        .anim-slide     { animation: slide-right 2s linear infinite; }
      `}</style>

      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center px-6 overflow-hidden z-[9999]">

        {/* Animated blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 opacity-[0.12] anim-blob-1 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3ecf4c 0%, #1aad2a 100%)" }} />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] opacity-[0.08] anim-blob-2 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3ecf4c 0%, #0d8a1f 100%)" }} />

        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">

          {/* Logo */}
          <div className="anim-fade-up-1 mb-10">
            <Logo variant="dark" className="scale-125 origin-center" />
          </div>

          {/* Animated icon with rings */}
          <div className="anim-scale-in relative flex items-center justify-center mb-10">
            {/* Ping rings */}
            <div className="anim-ping absolute w-24 h-24 rounded-full border-2 border-[#3ecf4c]/30" />
            <div className="anim-ping absolute w-20 h-20 rounded-full border border-[#3ecf4c]/20"
              style={{ animationDelay: "0.6s" }} />

            {/* Spinning orbit */}
            <div className="absolute w-32 h-32 anim-spin">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#3ecf4c]" />
            </div>
            <div className="absolute w-24 h-24 anim-spin-rev">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#3ecf4c]/50" />
            </div>

            {/* Icon box */}
            <div className="anim-float relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-[#3ecf4c]/20"
              style={{ background: "linear-gradient(135deg, #3ecf4c 0%, #1db42a 100%)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
          </div>

          {/* Headline */}
          <div className="anim-fade-up-2 mb-3">
            <h1 className="font-black text-5xl md:text-6xl text-black leading-[0.95] tracking-tight">
              Bientôt<br />
              <span style={{ color: "#3ecf4c" }}>de retour</span>
            </h1>
          </div>

          <p className="anim-fade-up-3 text-black/45 text-[15px] leading-relaxed mb-8 max-w-xs">
            Nous travaillons pour améliorer votre expérience.<br />La boutique revient très bientôt.
          </p>

          {/* Progress bar */}
          <div className="anim-fade-up-3 w-full max-w-xs mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-black/25">En cours</span>
              <div className="flex gap-1">
                <div className="anim-dot-1 w-1.5 h-1.5 rounded-full bg-[#3ecf4c]" />
                <div className="anim-dot-2 w-1.5 h-1.5 rounded-full bg-[#3ecf4c]" />
                <div className="anim-dot-3 w-1.5 h-1.5 rounded-full bg-[#3ecf4c]" />
              </div>
            </div>
            <div className="relative h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
              <div className="anim-progress h-full rounded-full relative overflow-hidden"
                style={{ width: 0, background: "linear-gradient(90deg, #3ecf4c, #1db42a)" }}>
                <div className="anim-slide absolute inset-0 w-1/3"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="anim-fade-up-4 w-full max-w-xs my-7">
            <div className="h-px bg-black/[0.07]" />
          </div>

          {/* Contact */}
          <div className="anim-fade-up-4 w-full max-w-xs space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-4">Une question urgente ?</p>

            <a href="mailto:contact@lecomax.com"
              className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl border border-black/[0.07] bg-black/[0.02] hover:bg-black/[0.04] transition-all group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #3ecf4c22, #3ecf4c11)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Email</p>
                <p className="text-black text-sm font-bold group-hover:text-[#3ecf4c] transition-colors">contact@lecomax.com</p>
              </div>
              <svg className="ml-auto opacity-20 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>

            <a href="https://wa.me/212600000000"
              className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl border border-black/[0.07] bg-black/[0.02] hover:bg-black/[0.04] transition-all group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #25d36622, #25d36611)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.824L.057 23.321a.75.75 0 00.921.921l5.497-1.466A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.504-5.228-1.384l-.374-.218-3.876 1.034 1.034-3.875-.219-.375A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-black/30">WhatsApp</p>
                <p className="text-black text-sm font-bold group-hover:text-[#25d366] transition-colors">Écrire sur WhatsApp</p>
              </div>
              <svg className="ml-auto opacity-20 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          {/* Admin link */}
          <a href="/admin/settings/" className="anim-fade-up-5 inline-flex items-center gap-1.5 text-black/20 hover:text-black/50 text-[11px] font-medium mt-10 transition-colors">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Accès administration
          </a>
          <p className="text-black/10 text-[11px] mt-2">
            L&apos;ecomax &copy; {new Date().getFullYear()} &middot; Mode, Tech &amp; Sport au Maroc
          </p>
        </div>
      </div>
    </>
  );
}

