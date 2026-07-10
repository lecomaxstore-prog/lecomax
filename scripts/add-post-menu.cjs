const fs = require('fs');
let c = fs.readFileSync('components/ecomedia/PostCard.tsx', 'utf8');

// 1. Add menuOpen state
c = c.replace(
  'const [videoExpanded, setVideoExpanded] = useState(false);',
  'const [videoExpanded, setVideoExpanded] = useState(false);\n  const [menuOpen, setMenuOpen] = useState(false);\n  const menuRef = useRef<HTMLDivElement>(null);'
);

// 2. Add outside click handler before requireAuth
const insertBefore = "function requireAuth(action";
const menuEffect = `// Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  `;
c = c.replace(insertBefore, menuEffect + insertBefore);

// 3. Replace menu button section
// Find the Menu comment and button
const menuStart = c.indexOf('{/* Menu */}');
const menuEnd = c.indexOf('</button>', menuStart) + '</button>'.length;
if (menuStart === -1) { console.log('Menu not found'); process.exit(1); }

const newMenu = `{/* 3-dot post menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 active:scale-90 transition-all">
              <svg width="20" height="4" viewBox="0 0 20 4" fill="currentColor">
                <circle cx="2" cy="2" r="2"/><circle cx="10" cy="2" r="2"/><circle cx="18" cy="2" r="2"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 z-30 bg-white border border-neutral-100 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden w-56">
                <button onClick={() => { setMenuOpen(false); const url = window.location.origin + '/ecomedia/' + post.slug; navigator.clipboard.writeText(url).catch(()=>{}); const t=document.createElement('div'); t.className='fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-4 py-2.5 rounded-full z-50 shadow-lg'; t.textContent='Lien copié !'; document.body.appendChild(t); setTimeout(()=>t.remove(),2000); }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  </div>
                  Copier le lien
                </button>

                <button onClick={() => { setMenuOpen(false); const url = window.location.origin + '/ecomedia/' + post.slug; if (navigator.share) { navigator.share({ title: post.title, url }).catch(()=>{}); } else { navigator.clipboard.writeText(url).catch(()=>{}); } }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </div>
                  Partager
                </button>

                <a href={'/ecomedia/' + post.slug} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </div>
                  Voir le post
                </a>

                {post.product_url && (
                  <a href={post.product_url} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold hover:bg-green-50 transition-colors">
                    <div className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16b277" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    </div>
                    <span className="text-[#16b277] font-semibold">Voir le produit</span>
                  </a>
                )}

                <div className="h-px bg-neutral-100 mx-3" />

                <button onClick={() => { setMenuOpen(false); alert('Signalement envoyé. Merci de nous aider à garder une communauté saine. 🙏'); }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  Signaler ce post
                </button>

                <button onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 text-[13px] font-black text-neutral-500 hover:bg-neutral-50 border-t border-neutral-100 transition-colors">
                  Annuler
                </button>
              </div>
            )}
          </div>`;

c = c.slice(0, menuStart) + newMenu + c.slice(menuEnd);
console.log('Menu replaced, length:', c.length);

fs.writeFileSync('components/ecomedia/PostCard.tsx', c, 'utf8');
console.log('Saved');
