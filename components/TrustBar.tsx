"use client";

export default function TrustBar() {
  return (
    <div className="bg-neutral-950 border-b border-neutral-800">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-0 sm:gap-0">

          {/* Paiement à la livraison */}
          <div className="flex items-center gap-3 px-6 sm:px-10 py-4 sm:py-5 flex-1 justify-center group">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#3ecf4c]/20 rounded-full blur-md group-hover:bg-[#3ecf4c]/30 transition-all" />
              <div className="relative w-9 h-9 rounded-full bg-[#3ecf4c]/10 border border-[#3ecf4c]/20 flex items-center justify-center text-[#3ecf4c] group-hover:border-[#3ecf4c]/50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="22" height="18" rx="2" />
                  <path d="M1 9h22" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-black text-[11px] sm:text-[12px] uppercase tracking-widest text-white leading-tight">
                Paiement à la livraison
              </p>
              <p className="text-[10px] text-[#3ecf4c]/70 leading-tight mt-0.5 font-semibold">
                100% sécurisé
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-neutral-800 shrink-0" />

          {/* Support 7j/7 */}
          <div className="flex items-center gap-3 px-6 sm:px-10 py-4 sm:py-5 flex-1 justify-center group">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#3ecf4c]/20 rounded-full blur-md group-hover:bg-[#3ecf4c]/30 transition-all" />
              <div className="relative w-9 h-9 rounded-full bg-[#3ecf4c]/10 border border-[#3ecf4c]/20 flex items-center justify-center text-[#3ecf4c] group-hover:border-[#3ecf4c]/50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-black text-[11px] sm:text-[12px] uppercase tracking-widest text-white leading-tight">
                Support 7j/7
              </p>
              <p className="text-[10px] text-[#3ecf4c]/70 leading-tight mt-0.5 font-semibold">
                Via WhatsApp
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
