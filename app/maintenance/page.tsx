export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="L'ecomax" width={40} height={40} className="rounded-xl" />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3ecf4c" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>

        <h1 className="text-white font-black text-2xl mb-3">Site en maintenance</h1>
        <p className="text-white/40 text-[15px] leading-relaxed mb-8">
          Nous effectuons des améliorations pour vous offrir une meilleure expérience. Revenez bientôt !
        </p>

        {/* Contact */}
        <div className="border border-white/10 rounded-2xl px-5 py-4 text-left">
          <p className="text-white/25 text-[11px] uppercase tracking-widest font-bold mb-2">Une question urgente ?</p>
          <a href="mailto:contact@lecomax.com" className="text-[#3ecf4c] text-sm font-semibold hover:underline">
            contact@lecomax.com
          </a>
        </div>

        <p className="text-white/15 text-[11px] mt-8">L&apos;ecomax &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
