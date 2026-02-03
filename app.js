// Lecomax — premium brand-store UI (mega menus + hero slider + category places + product grid + cart)
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);


/* ===== PRO helpers: deterministic random + reviews + stars ===== */
function hashStr(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h>>>0);
}
function pseudoRand(seed){
  // mulberry32
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function starIcons(rating){
  const full = Math.floor(rating);
  const half = (rating - full) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const star = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>';
  const halfStar = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77V2z"/><path d="M12 18.77L5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2v16.77z" fill="rgba(255,255,255,.25)"/></svg>';
  const emptyStar = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>';
  return `<span class="stars">${star.repeat(full)}${half?halfStar:""}${emptyStar.repeat(empty)}</span>`;
}
function getFakeReviews(productId, cat){
  const names = ["Yassine","Sara","Othman","Imane","Hamza","Aya","Sofiane","Nora","Ilyas","Kawtar","Hind","Mehdi","Salma","Anas","Rania","Walid"];
  const tags = ["Fast delivery","Great quality","Worth it","Looks premium","Perfect fit","Super sound","Very comfortable","Good packaging"];
  const texts = {
    electronics: [
      "Sound is clean and the bass is surprisingly strong. Battery is solid for daily use.",
      "Pairs quickly and calls are clear. The case feels premium for this price.",
      "Comfortable in the ear and stable. I use it every day for the gym.",
      "For the price, it's excellent. Noise isolation is good and volume is strong."
    ],
    clothing: [
      "Nice fabric and clean stitching. Fits well and looks expensive.",
      "Very comfortable and the size is accurate. Looks great in real life.",
      "Quality is better than expected. Perfect for daily wear.",
      "Great style and finishing. I will order another color."
    ],
    shoes: [
      "Very comfortable and lightweight. Looks great with casual outfits.",
      "Good grip and solid build. Great value for money.",
      "The design is clean and premium. Fits perfectly.",
      "Comfort level is excellent. I can wear it for hours."
    ],
    accessories: [
      "Strong materials and a clean design. Perfect for everyday use.",
      "Looks premium and the zippers feel smooth. Very practical.",
      "Great size and comfortable to carry. Quality is top.",
      "Really stylish and well made. I recommend it."
    ]
  };
  const rnd = pseudoRand(hashStr(productId));
  const list = [];
  for(let i=0;i<11;i++){
    const rating = 4 + Math.round(rnd()*10)/10; // 4.0 - 5.0
    const name = names[Math.floor(rnd()*names.length)];
    const tag = tags[Math.floor(rnd()*tags.length)];
    const tarr = texts[cat] || texts.electronics;
    const text = tarr[Math.floor(rnd()*tarr.length)];
    const daysAgo = 2 + Math.floor(rnd()*120);
    const d = new Date(Date.now() - daysAgo*24*3600*1000);
    const date = d.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"2-digit"});
    list.push({name, rating: Math.min(5, Math.max(4, rating)), tag, text, date});
  }
  return list;
}
function saveVariant(productId, data){
  try{ localStorage.setItem("lc_variant_"+productId, JSON.stringify(data)); }catch(e){}
}
function loadVariant(productId){
  try{ return JSON.parse(localStorage.getItem("lc_variant_"+productId)||"null"); }catch(e){ return null; }
}

const PRODUCTS = [
  {
    id: "genai1", 
    cat: "electronics", 
    name: "Genai Wireless Earbuds", 
    price: 149, 
    old: 250, 
    rating: 5.0, 
    emoji: "🎧",
    desc: "Noise Cancellation for Calls, Dual Microphones, Automatic Pairing, Quick And Precise Connectivity, Long Standby Time of 5.4 Hours.",
    specs: {
      "General": {
        "Product Type": "Wireless Bluetooth Earbuds",
        "Brand": "GENAI",
        "Model": "TV Series",
        "Origin": "Guangdong, China",
        "Material": "Plastic",
        "Color Options": "Black, White"
      },
      "Features": {
        "Noise Control Mode": "Noise Cancellation",
        "Headphone Features": "Lightweight, Comfortable Fit",
        "Control Type": "Touch Control",
        "Ear Cup Style": "Semi-open-back",
        "Microphone Type": "Condenser Microphone",
        "Headphone Jack": "No Jack"
      },
      "Compatibility": {
        "Compatible Devices": "Smartphones, Tablets, Bluetooth-enabled devices",
        "Operating Systems": "Android, iOS"
      },
      "Connectivity": {
        "Wireless Technology": "Bluetooth",
        "Control Method": "Touch",
        "Wireless Property": "Fully Wireless",
        "Connection Stability": "Stable and Fast Pairing"
      },
      "Power": {
        "Battery Properties": "Rechargeable Battery",
        "Battery Type": "Lithium Battery-Polymer",
        "Charging Port": "Type-C Port",
        "Fast Charging Support": "No",
        "Charger Included": "No",
        "Maximum Rated Power": "15W",
        "Minimum Rated Power": "1W",
        "Power Mode": "USB Charging",
        "Operating Voltage": "≤36V",
        "Charging Case": "Yes"
      },
      "Others": {
        "Cable Feature": "Without Cable",
        "Age Range": "Adult",
        "Recommended Scenario": "Exercising, Daily Use, Calls, Music",
        "Voltage": "See Product Details"
      },
      "Dimensions": {
        "Product Size": "Compact Design",
        "Weight": "Lightweight and Portable"
      }
    },
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/genai/genai/black.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/genai/genai/white%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/genai/genai/info%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/genai/genai/ergonomic%20design.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/genai/genai/diaphragm%20unit.jpeg"
    ],
    colors: [
      {name: "Black", hex: "#000000", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/genai/genai/black.jpeg"},
      {name: "White", hex: "#ffffff", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/genai/genai/white%20.jpeg"}
    ]
  },
  {
    id: "backpack_vacuum",
    cat: "accessories",
    name: "Vacuum Travel Backpack",
    price: 1199,
    old: 1500,
    rating: 4.9,
    emoji: "🎒",
    desc: "Travel Backpack Vacuum Compression Laptop Backpack 43.18 cm Extended Large Capacity School Backpack Hiking Business Backpack.",
    specs: {
      "General": {
          "Product Type": "Backpack",
          "Style": "Sports / Casual",
          "Gender": "Unisex",
          "Color": "Black",
          "Theme": "None"
      },
      "Material & Design": {
          "Material": "Oxford Fabric",
          "Lining Material": "Polyester",
          "Pattern": "Solid Color",
          "Pattern Style": "No Pattern",
          "Printing Type": "No Printing",
          "Embellishment": "None",
          "Edge Paint": "No"
      },
      "Features": {
          "Closure Type": "Zipper",
          "Strap Type": "Adjustable Shoulder Straps",
          "Feature": "Adjustable Strap",
          "Compartments": "Multiple Compartments",
          "Laptop Compartment": "Yes (Up to 17-inch Laptop)",
          "Water Resistance": "Splash Resistant",
          "Comfort": "Lightweight & Comfortable for Daily Use"
      },
      "Usage": {
          "Recommended Use": "Daily commute, Travel, School / University, Work, Sports & Outdoor",
          "Age Range": "Adult"
      },
      "Care Instructions": {
          "Operation Instruction": "Do Not Wash",
          "Cleaning Method": "Wipe with Dry or Slightly Damp Cloth"
      },
      "Others": {
          "Cable Feature": "Without Cable"
      },
      "Dimensions": {
          "Height": "49 cm (19.3 inches)",
          "Laptop Compatibility": "Fits up to 17-inch Laptop",
          "Capacity": "Large Capacity",
          "Weight": "Lightweight Design"
      }
    },
    images: [
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/1.jpeg",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/2.jpeg",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/3.jpeg",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/4.jpeg",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/5.jpeg",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/6.jpeg"
    ],
    colors: [
        { name: "Black", hex: "#1a1a1a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/1.jpeg" },
        { name: "Gray", hex: "#808080", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/backpack/2.jpeg" }
    ]
  }
];

const SLIDES = [
  { tab:"electronics", kicker:"New Arrival", title:"Headphones that feel premium.",
    text:"ANC audio, wearables and power accessories—presented with a clean brand-store experience.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/electornic.png",
    tiles:[{emoji:"🎧", name:"ANC Earbuds", meta:"Deep bass", price:"79 DH"},
           {emoji:"⌚", name:"AMOLED Watch", meta:"Health tracking", price:"69 DH"},
           {emoji:"⚡", name:"GaN 65W", meta:"Fast charging", price:"29 DH"},
           {emoji:"🔋", name:"Power 20k", meta:"All day", price:"35 DH"}]},
  { tab:"clothing", kicker:"Best Seller", title:"Clothing with a clean look.",
    text:"Premium basics—hoodies, tees, and denim with a modern fit and quality feel.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/clothes.png",
    tiles:[{emoji:"🧥", name:"Hoodie", meta:"Oversized", price:"39 DH"},
           {emoji:"👕", name:"T‑Shirt", meta:"Heavy cotton", price:"19 DH"},
           {emoji:"👖", name:"Cargo", meta:"Utility", price:"35 DH"},
           {emoji:"🧢", name:"Denim", meta:"Classic", price:"55 DH"}]},
  { tab:"shoes", kicker:"Trending", title:"Shoes designed for comfort.",
    text:"Sneakers, runners and loafers—easy browsing, fast add-to-cart.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/shoes.png",
    tiles:[{emoji:"👟", name:"Sneakers", meta:"Cushion", price:"49 DH"},
           {emoji:"🏃", name:"Running", meta:"Lightweight", price:"59 DH"},
           {emoji:"👞", name:"Loafers", meta:"Smart", price:"65 DH"},
           {emoji:"🩴", name:"Slides", meta:"Soft", price:"18 DH"}]},
  { tab:"accessories", kicker:"Backpacks", title:"Carry your day in style.",
    text:"Urban and travel backpacks with premium materials and practical pockets.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/backpack.png",
    tiles:[{emoji:"🎒", name:"Urban 22L", meta:"Laptop sleeve", price:"44 DH"},
           {emoji:"🎒", name:"Travel 30L", meta:"Water resistant", price:"59 DH"},
           {emoji:"👜", name:"Sling Mini", meta:"Essentials", price:"24 DH"},
           {emoji:"🧳", name:"Gym Duffel", meta:"Easy clean", price:"32 DH"}]},
];

const state = { 
  filter:"all", 
  sort:"featured", 
  q:"", 
  cart: load("lc_cart_v2", {}), 
  favs: load("lc_favs_v2", []), 
  slideIndex:0, 
  heroTab:"electronics" 
};

function toggleFav(id, btn){
  const idx = state.favs.indexOf(id);
  const wasAdded = idx === -1;
  
  if(idx > -1) state.favs.splice(idx,1);
  else state.favs.push(id);
  
  saveFavs(); // Persist changes

  // Re-render button icon only
  const svg = btn.querySelector("svg");
  if(svg) {
      if(state.favs.includes(id)) {
        svg.setAttribute("fill", "currentColor");
        btn.style.color = "#ef4444";
        // Pop animation
        btn.style.transform = "scale(1.2)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
      } else {
        svg.setAttribute("fill", "none");
        btn.style.color = "var(--muted)";
      }
  }
  
  // Optional: Update global view if open?
  // renderFavs(); // Only if drawer is open? renderFavs checks state.favs anyway.
  
  if(wasAdded) showToast("Added to Favorites ❤️");
  
  // Update Header Dot if exists
  updateFavBadge();
}

function updateFavBadge() {
    const btn = $("#openFav");
    if(!btn) return;
    // Add or remove a small dot indicator
    let dot = btn.querySelector(".badge-dot");
    if(state.favs.length > 0) {
        if(!dot) {
            dot = document.createElement("span");
            dot.className = "badge-dot";
            // Style locally or add to css
            dot.style.cssText = "position:absolute; top:8px; right:8px; width:8px; height:8px; background:#ef4444; border-radius:50%; border:2px solid #fff;";
            btn.appendChild(dot);
        }
    } else {
        if(dot) dot.remove();
    }
}


init();

function init(){
  const yearEl = $("#year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const langBtn = $("#langBtn");
  const langMenu = $("#langMenu");
  if(langBtn && langMenu){
      langBtn.addEventListener("click", () => {
        const show = !langMenu.classList.contains("show");
        langMenu.classList.toggle("show", show);
        langBtn.setAttribute("aria-expanded", String(show));
      });
      $$("#langMenu .dropdown__item").forEach(btn => btn.addEventListener("click", () => {
        const textSpan = langBtn.querySelector(".chip__text");
        if(textSpan) textSpan.textContent = btn.dataset.lang;
        else langBtn.innerText = btn.dataset.lang; 
        
        langMenu.classList.remove("show");
        langBtn.setAttribute("aria-expanded","false");
      }));
  }

  setupMegaMenus();

  if($("#burger")) {
      $("#burger").addEventListener("click", () => {
        const nav = $(".nav");
        if(!nav) return;
        const isOpen = nav.classList.contains("open"); 
        
        if (isOpen) {
          nav.style.display = "none";
          nav.classList.remove("open");
        } else {
          nav.style.display = "flex";
          nav.style.flexDirection = ""; 
          nav.style.alignItems = "";
          nav.style.gap = "";
          nav.style.position = "";
          nav.style.top = "";
          nav.style.left = "";
          nav.style.width = "";
          nav.style.padding = "";
          nav.style.border = "";
          nav.style.borderRadius = "";
          nav.style.background = "";
          nav.style.backdropFilter = "";
          
          nav.classList.add("open");
        }
      });
  }

  if($("#q")) $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });

  // View toggle (grid / row)
  const vg = $("#viewGrid");
  const vr = $("#viewRow");
  const gridEl = $("#grid");
  const savedView = (function(){ try{return localStorage.getItem("lc_view")||"grid";}catch(e){return "grid";} })();
  setView(savedView);
  if(vg && vr){
    vg.addEventListener("click", () => setView("grid"));
    vr.addEventListener("click", () => setView("row"));
  }
  function setView(mode){
    if(!gridEl) return;
    try{ localStorage.setItem("lc_view", mode); }catch(e){}
    if(vg) vg.classList.toggle("is-active", mode==="grid");
    if(vr) vr.classList.toggle("is-active", mode==="row");
    gridEl.classList.toggle("is-row", mode==="row");
  }

  if($("[data-jump-filter]")) $$("[data-jump-filter]").forEach(a => a.addEventListener("click", () => setFilter(a.dataset.jumpFilter)));
  if($("[data-filter-btn]")) $$("[data-filter-btn]").forEach(b => b.addEventListener("click", () => setFilter(b.dataset.filterBtn)));

  if($("#sort")) $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });

  if($("#openCart")) $("#openCart").addEventListener("click", () => openDrawer(true));
  if($("#openFav")) $("#openFav").addEventListener("click", () => openFavDrawer(true));
  
  if($("#toggleSearch")) $("#toggleSearch").addEventListener("click", () => {
    const search = $(".search-container");
    if(search) {
        const isShow = search.classList.toggle("show");
        if(isShow) {
           const inp = search.querySelector("input");
           if(inp) {
             inp.value = ""; 
             setTimeout(() => inp.focus(), 150); 
           }
        }
    }
  });

  if($("#clearCart")) $("#clearCart").addEventListener("click", () => { state.cart = {}; save(); renderCart(); });
  if($("#checkout")) $("#checkout").addEventListener("click", () => checkout());

  document.addEventListener("click", (e) => { 
      if (e.target.closest("[data-close='1']")) closeAll(); 
      
      const inSearch = e.target.closest(".search-container") || e.target.closest("#toggleSearch");
      if (!inSearch) {
          const s = $(".search-container");
          if(s && s.classList.contains("show")) s.classList.remove("show");
      }
      
      const inLang = e.target.closest("#langBtn") || e.target.closest("#langMenu");
      if (!inLang && $("#langMenu") && $("#langBtn")) { $("#langMenu").classList.remove("show"); $("#langBtn").setAttribute("aria-expanded","false"); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

  if($("#grid")) {
      $$("[data-hero-tab]").forEach(btn => btn.addEventListener("click", () => {
        $$("[data-hero-tab]").forEach(x => x.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.heroTab = btn.dataset.heroTab;
        const idx = SLIDES.findIndex(s => s.tab === state.heroTab);
        state.slideIndex = idx >= 0 ? idx : 0;
        updateSlider();
        resetAutoPlay();
      }));

      if($("#prevSlide")) $("#prevSlide").addEventListener("click", () => {
        state.slideIndex = (state.slideIndex - 1 + SLIDES.length) % SLIDES.length;
        updateSlider();
        resetAutoPlay();
      });
      if($("#nextSlide")) $("#nextSlide").addEventListener("click", () => {
        state.slideIndex = (state.slideIndex + 1) % SLIDES.length;
        updateSlider();
        resetAutoPlay();
      });

      countUp();
      initSlider();
      updateSlider();
      renderGrid();
      renderTrending(); // New
  }
  
  renderCart();
  updateFavBadge(); // Ensure badge is correct on load

  // startProductTicker(); // Optional: Auto-scroll textual ticker style if desired. 
  // Disabling auto-ticker for now to let manual buttons work cleanly without fighting.
  // If you want auto-scroll, uncomment it, but ensure it pauses on wrapper hover.

  document.addEventListener("click", (e) => {
    const inLang = e.target.closest("#langBtn") || e.target.closest("#langMenu");
    if (!inLang) { $("#langMenu").classList.remove("show"); $("#langBtn").setAttribute("aria-expanded","false"); }
  });
}



function startProductTicker() {
  const grid = $("#grid");
  const wrapper = $(".grid-wrapper") || grid; // Use wrapper if exists
  let scrollSpeed = 0.5; 
  let isHovered = false;

  wrapper.addEventListener("mouseenter", () => isHovered = true);
  wrapper.addEventListener("mouseleave", () => isHovered = false);
  wrapper.addEventListener("touchstart", () => isHovered = true);
  wrapper.addEventListener("touchend", () => setTimeout(() => isHovered = false, 2000));

  function step() {
    if (!isHovered && grid.scrollWidth > grid.clientWidth) {
      if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 1) {
        grid.scrollLeft = 0; 
      } else {
        grid.scrollLeft += scrollSpeed;
      }
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

let autoPlayInterval;
function startAutoPlay() {
  clearInterval(autoPlayInterval);
  autoPlayInterval = setInterval(() => {
    state.slideIndex = (state.slideIndex + 1) % SLIDES.length;
    updateSlider();
  }, 6000);
}
function resetAutoPlay() {
  startAutoPlay();
}

function setFilter(f){
  state.filter = f;
  $$("[data-filter-btn]").forEach(x => x.classList.toggle("is-active", x.dataset.filterBtn === f));
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
  renderGrid();
}

function setupMegaMenus(){
  const groups = $$("[data-mega]");
  groups.forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const key = btn.dataset.mega;
    const panel = document.getElementById(`mega-${key}`);
    const open = panel.classList.contains("show");
    $$(".mega").forEach(m => m.classList.remove("show"));
    groups.forEach(b => b.setAttribute("aria-expanded","false"));
    panel.classList.toggle("show", !open);
    btn.setAttribute("aria-expanded", String(!open));
  }));

  document.addEventListener("click", (e) => {
    if (e.target.closest(".nav__group")) return;
    $$(".mega").forEach(m => m.classList.remove("show"));
    groups.forEach(b => b.setAttribute("aria-expanded","false"));
  });

  $$("[data-filter]").forEach(a => a.addEventListener("click", () => {
    setFilter(a.dataset.filter);
    $$(".mega").forEach(m => m.classList.remove("show"));
    groups.forEach(b => b.setAttribute("aria-expanded","false"));
  }));

  // Modal Triggers
  document.addEventListener("click", (e) => {
    const viewBtn = e.target.closest("[data-view]");
    if(viewBtn) {
      openProductModal(viewBtn.dataset.view);
    }
  });

  initModalLogic();
}

function initSlider(){
  const track = $("#sliderTrack");
  track.innerHTML = SLIDES.map(s => `
    <div class="slide" ${s.image ? `style="background: transparent; padding: 0; display: block; border: none;"` : ''}>
    ${s.image 
       ? `<div style="position:relative; width:100%; height:100%">
            <img src="${s.image}" alt="${escapeHtml(s.title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);" />
            <button class="slide__overlay-btn" onclick="setFilter('${s.tab}')">
              ${s.tab === 'accessories' ? 'Backpacks' : s.tab.charAt(0).toUpperCase() + s.tab.slice(1)} <span style="margin-left:6px">→</span>
            </button>
          </div>`
       : `<div class="slide__content-wrapper" style="display:grid; grid-template-columns: 1.1fr .9fr; gap:24px; align-items:center; width: 100%; height: 100%;">
            <div>
              <span class="slide__kicker">${escapeHtml(s.kicker)}</span>
              <h1>${escapeHtml(s.title)}</h1>
              <p>${escapeHtml(s.text)}</p>
              <div class="slide__cta">
                <a class="btn btn--primary" href="#products">Shop Now</a>
                <a class="btn btn--ghost" href="#collections">Explore</a>
              </div>
            </div>
            <div class="visual brandGlow">
              <div class="visual__stack">
                <div class="visual__row">${s.tiles.slice(0,2).map(tile).join("")}</div>
                <div class="visual__row">${s.tiles.slice(2).map(tile).join("")}</div>
              </div>
            </div>
          </div>`
    }
    </div>
  `).join("");

  const dots = $("#sliderDots");
  dots.innerHTML = SLIDES.map((_, i) => `<button class="dotBtn ${i===state.slideIndex?'is-active':''}" data-dot="${i}" aria-label="Slide ${i+1}"></button>`).join("");
  
  $$("#sliderDots [data-dot]").forEach(b => b.addEventListener("click", () => {
    state.slideIndex = Number(b.dataset.dot);
    updateSlider();
    resetAutoPlay();
  }));
}

function updateSlider(){
  const track = $("#sliderTrack");
  track.style.transform = `translateX(-${state.slideIndex * 100}%)`;
  
  $$(".dotBtn").forEach((b, i) => b.classList.toggle("is-active", i === state.slideIndex));

  const activeTab = SLIDES[state.slideIndex]?.tab || "electronics";
  state.heroTab = activeTab;
  $$("[data-hero-tab]").forEach(x => x.classList.toggle("is-active", x.dataset.heroTab === activeTab));
}

function tile(t){
  return `
    <div class="tile">
      <div>
        <div class="tile__emoji">${t.emoji}</div>
        <div class="tile__name">${escapeHtml(t.name)}</div>
        <div class="tile__meta">${escapeHtml(t.meta)}</div>
      </div>
      <div class="tile__price">${escapeHtml(t.price)}</div>
    </div>
  `;
}

function getList(){
  let list = [...PRODUCTS];
  if (state.filter !== "all") list = list.filter(p => p.cat === state.filter);
  if (state.q) list = list.filter(p => (p.name + " " + p.desc).toLowerCase().includes(state.q));

  switch (state.sort){
    case "price_asc": list.sort((a,b)=>a.price-b.price); break;
    case "price_desc": list.sort((a,b)=>b.price-a.price); break;
    case "rating_desc": list.sort((a,b)=>b.rating-a.rating); break;
    default: list.sort((a,b)=> (b.rating-a.rating) || ((b.old>0)-(a.old>0)));
  }
  return list;
}


// renderGrid handled later by getCardHTML helper integration consistency

function openModal(id){
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  $("#modalBody").innerHTML = `
    <div style="display:grid;grid-template-columns: 1fr 1.2fr;gap:14px;align-items:start">
      <div class="card__img" style="height:240px;border-radius:18px">${p.emoji}</div>
      <div>
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">
          <div style="font-weight:900;font-size:1.2rem">${escapeHtml(p.name)}</div>
          <span class="tag">${label(p.cat)}</span>
        </div>
        <div class="muted" style="margin-top:10px;line-height:1.8">${escapeHtml(p.desc)}</div>
        <div class="price" style="margin-top:12px">
          <strong style="font-size:1.25rem">${p.price} DH</strong>
          ${p.old ? `<s>${p.old} DH</s>` : ``}
          <span class="rating" style="margin-left:auto">⭐ ${p.rating.toFixed(1)}</span>
        </div>
        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn--primary" id="modalAdd">Add to cart</button>
          <button class="btn btn--ghost" data-close="1">Close</button>
        </div>
      </div>
    </div>
  `;
  $("#modalAdd").addEventListener("click", () => addToCart(id));
  $("#modal").classList.add("show");
  $("#modal").setAttribute("aria-hidden","false");
}

function openDrawer(show){
  const d = $("#drawer");
  if(d) {
    d.classList.toggle("show", show);
    d.setAttribute("aria-hidden", String(!show));
  }
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  
  // Trigger reflow for transition
  void t.offsetWidth; 
  t.classList.add("show");
  
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, 2500);
}

function closeAll(){
  const m = $("#modal");
  if(m) {
    m.classList.remove("show");
    m.setAttribute("aria-hidden","true");
  }
  const pm = $("#productModal");
  if(pm) {
    pm.classList.remove("is-open");
    pm.setAttribute("aria-hidden", "true");
  }
  openDrawer(false);
  openFavDrawer(false);
}

function addToCart(id, qty = 1){
  state.cart[id] = (state.cart[id] || 0) + qty;
  save(); renderCart(); openDrawer(true);
}
function openFavDrawer(show){
  const fd = $("#favDrawer");
  if(fd) {
    fd.classList.toggle("show", show);
    fd.setAttribute("aria-hidden", String(!show));
    if(show) renderFavs();
  }
}

function renderFavs(){
  const wrap = $("#favItems");
  if(!wrap) return;
  
  const list = state.favs.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  
  if (!list.length){
    wrap.innerHTML = `
      <div class="muted" style="text-align:center; padding:40px; display:flex; flex-direction:column; align-items:center;">
        <div style="font-size:3rem; opacity:0.1; margin-bottom:10px; filter:grayscale(1)">❤️</div>
        <p>No favorites yet.</p>
        <button onclick="closeAll()" class="btn btn--ghost btn--small" style="margin-top:10px">Discover Products</button>
      </div>`;
    return;
  }
  
  wrap.innerHTML = list.map(p => `
    <div class="cartItem" style="margin-bottom:12px">
      <div class="cartItem__top">
        <div style="display:flex; gap:12px; align-items:center;">
           <img src="${p.images && p.images[0] ? p.images[0] : ''}" style="width:48px; height:48px; object-fit:contain; border-radius:8px; background:#fff; padding:4px; border:1px solid #eee;" onerror="this.style.display='none'">
           <div>
              <div class="cartItem__name">${escapeHtml(p.name)}</div>
              <div class="muted tiny">${label(p.cat)}</div>
           </div>
        </div>
        <button class="iconbtn" onclick="removeFav('${p.id}')" title="Remove" style="width:28px; height:28px; border:none; background:transparent; opacity:0.5;">✕</button>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:8px; border-top:1px dashed rgba(0,0,0,0.05)">
         <strong style="font-size:0.95rem">${p.price} DH</strong>
         <button class="btn btn--primary btn--small" style="font-size:0.8rem; padding:6px 14px;" onclick="addToCart('${p.id}'); showToast('Moved to Cart'); removeFav('${p.id}'); closeAll(); openDrawer(true);">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

// Global helper access for the inline onclicks
window.removeFav = function(id) {
    state.favs = state.favs.filter(x => x !== id);
    saveFavs();
    renderFavs();
    renderGrid(); // update heart icons on grid
    updateFavBadge();
}

function changeQty(id, delta){
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id]; else state.cart[id] = next;
  save(); renderCart();
}

function renderCart(){
  const wrap = $("#cartItems");
  const entries = Object.entries(state.cart);
  const count = entries.reduce((a, [,q]) => a + q, 0);
  $("#cartCount").textContent = count;

  if (!entries.length){
    wrap.innerHTML = `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0.6; gap:16px; min-height: 200px;">
        <div style="font-size:3rem; filter:grayscale(1)">🛒</div>
        <div style="font-size:1.1rem; font-weight:500">Your bag is empty</div>
        <button onclick="closeAll()" class="btn btn--ghost" style="font-size:0.9rem">Start Shopping</button>
      </div>
    `;
    $("#total").textContent = "$0";
    $("#checkout").disabled = true;
    $("#checkout").style.opacity = "0.5";
    $("#checkout").style.cursor = "not-allowed";
    return;
  }
  
  $("#checkout").disabled = false;
  $("#checkout").style.opacity = "1";
  $("#checkout").style.cursor = "pointer";

  let total = 0;
  wrap.innerHTML = entries.map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return "";
    total += p.price * qty;
    return `
      <div class="cartItem">
        <div class="cartItem__top">
          <div>
            <div class="cartItem__name">${escapeHtml(p.name)}</div>
            <div class="muted tiny" style="margin-top:4px">${label(p.cat)}</div>
          </div>
          <button class="iconbtn" data-del="${id}" aria-label="Remove" style="width:32px; height:32px; border:none; background:transparent; opacity:0.5;">✕</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:8px">
          <div class="qty">
            <button data-dec="${id}">−</button>
            <span>${qty}</span>
            <button data-inc="${id}">+</button>
          </div>
          <strong style="font-size:1.1rem">${p.price * qty} DH</strong>
        </div>
      </div>
    `;
  }).join("");

  $("#total").textContent = `${total} DH`;
  $$("[data-del]").forEach(b => b.addEventListener("click", () => { delete state.cart[b.dataset.del]; save(); renderCart(); }));
  $$("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
  $$("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, +1)));
}

function checkout(){
  const entries = Object.entries(state.cart);
  if (!entries.length) return alert("Cart is empty.");

  const lines = ["Order — Lecomax", "--------------------"];
  let total = 0;
  for (const [id, qty] of entries){
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) continue;
    const sum = p.price * qty;
    total += sum;
    lines.push(`${p.name} × ${qty} = ${sum} DH`);
  }
  lines.push("--------------------");
  lines.push(`Total: ${total} DH`);

  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    // alert("Order copied ✅ Paste it in WhatsApp or send to your team.");
    openSuccessModal();
    state.cart = {};
    save();
    renderCart();
    closeAll();
  });
}

function openSuccessModal() {
  alert("Order Placed!\nYour order has been copied. Send it via WhatsApp to complete the purchase.");
  // const m = document.getElementById("successModal");
  // if(m) m.classList.add("active");
}
window.closeSuccessModal = function() {
  // const m = document.getElementById("successModal");
  // if(m) m.classList.remove("active");
}

function label(cat){
  if (cat === "electronics") return "Electronics";
  if (cat === "clothing") return "Clothing";
  if (cat === "shoes") return "Shoes";
  if (cat === "accessories") return "Backpacks";
  return "All";
}
function escapeHtml(str){
  return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function load(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function save(){ localStorage.setItem("lc_cart_v2", JSON.stringify(state.cart)); }
function saveFavs(){ localStorage.setItem("lc_favs_v2", JSON.stringify(state.favs)); }

function countUp(){
  const els = $$("[data-count]");
  els.forEach(el => {
    const target = Number(el.dataset.count || "0");
    let start = 0;
    const steps = 30;
    const inc = target / steps;
    let i = 0;
    const t = setInterval(() => {
      i++; start += inc;
      el.textContent = String(Math.round(start));
      if (i >= steps){ el.textContent = String(target); clearInterval(t); }
    }, 30);
  });
}

// --- Product Modal Logic ---
/* 
   Deprecated in favor of Full Page view, but kept for legacy reference or alternative use.
   Now openProductPage() handles the main detail view.
*/
function openProductModal(id){
// ...
}

let modalState = {
  id: null,
  qty: 1
};

function initModalLogic(){
  const pm = $("#productModal");
  if(!pm) return; // safety

  // Qty
  $("#pmQtyMinus").addEventListener("click", () => updateModalQty(-1));
  $("#pmQtyPlus").addEventListener("click", () => updateModalQty(1));

  // Add to Cart
  $("#pmAddBtn").addEventListener("click", () => {
    if(!modalState.id) return;
    state.cart[modalState.id] = (state.cart[modalState.id] || 0) + modalState.qty;
    save(); renderCart(); 
    closeAll();
    openDrawer(true);
    showToast("Added to cart! 🛒");
  });

  // Variants Visual
  $$(".p-size").forEach(b => b.addEventListener("click", () => {
    $$(".p-size").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
  }));
  $$(".p-color").forEach(b => b.addEventListener("click", () => {
    $$(".p-color").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
  }));

  // Slider Nav
  // Moved to initGridNav()
  // const sl = $("#slideLeft");
  // const sr = $("#slideRight");
  // if(sl && sr){
  //   sl.addEventListener("click", () => $("#grid").scrollBy({left: -360, behavior: 'smooth'}));
  //   sr.addEventListener("click", () => $("#grid").scrollBy({left: 360, behavior: 'smooth'}));
  // }
}

function updateModalQty(delta){
  let next = modalState.qty + delta;
  if(next < 1) next = 1;
  modalState.qty = next;
  $("#pmQty").textContent = next;
  updateModalPrice();
}

function updateModalPrice(){
  const p = PRODUCTS.find(x => x.id === modalState.id);
  if(!p) return;
  const total = p.price * modalState.qty;
  $("#pmBtnPrice").textContent = `$${total}`;
}

// Helper for modal image switching
window.changeModalImage = function(btn, src) {
  const img = $("#pmImage img");
  if(img) img.src = src;
  $$(".thumb-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
};

// Start Card Slider Logic
window.startCardSlide = function(id) {
    const el = document.querySelector(`[data-images][onmouseenter*="${id}"]`);
    if(!el) return;
    const images = JSON.parse(el.dataset.images.replaceAll('&quot;', '"'));
    if(images.length < 2) return;
    
    let idx = Number(el.dataset.idx || 0);
    const imgTag = el.querySelector("img");
    
    // Clear existing
    if(el.sliderInterval) clearInterval(el.sliderInterval);
    
    el.sliderInterval = setInterval(() => {
        idx = (idx + 1) % images.length;
        el.dataset.idx = idx;
        if(imgTag) {
            imgTag.style.opacity = "0.7";
            setTimeout(() => {
                imgTag.src = images[idx];
                imgTag.style.opacity = "1";
            }, 150);
        }
    }, 1500); // 1.5s interval
};

window.stopCardSlide = function(id) {
    const el = document.querySelector(`[data-images][onmouseenter*="${id}"]`);
    if(el && el.sliderInterval) {
        clearInterval(el.sliderInterval);
        delete el.sliderInterval;
        // Reset to first image?
        // const images = JSON.parse(el.dataset.images.replaceAll('&quot;', '"'));
        // el.dataset.idx = 0;
        // const imgTag = el.querySelector("img");
        // if(imgTag && images.length) imgTag.src = images[0];
    }
};

window.changeCardImage = function(id, src) {
   // User selected a color, update image and stop slider to keep it fixed
   const el = document.querySelector(`[data-images][onmouseenter*="${id}"]`);
   if(el) {
       if(el.sliderInterval) clearInterval(el.sliderInterval);
       const img = el.querySelector("img");
       if(img) img.src = src;
       // We might want to disable slider after manual selection?
       el.onmouseenter = null; // Disable auto slide
   }
};

// Full Page View Logic
window.openProductPage = function(id) {
     window.location.href = `product.html?id=${id}`;
};

window.closeProductPage = function() {
    // Deprecated in favor of separate page
    window.location.href = "index.html";
};


window.selectPageColor = function(btn, src) {
   if(src && src !== 'undefined') document.getElementById('ppMainImg').src = src;
   const p = btn.closest(".variant-options");
   if(p) p.querySelectorAll(".p-color").forEach(b => b.classList.remove("selected"));
   btn.classList.add("selected");
};

// Helper for modal color switching
window.selectModalColor = function(btn, src, name) {
  if(src && src !== 'undefined') {
      const img = $("#pmImage img");
      if(img) img.src = src;
      // Also update active thumb if it matches
      $$(".thumb-btn").forEach(b => {
         const tImg = b.querySelector("img");
         if(tImg && tImg.src === src) {
             $$(".thumb-btn").forEach(x => x.classList.remove("active"));
             b.classList.add("active");
         }
      });
  }
  $$(".p-color").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
};

// Start Card Slider Logic
// ... (Already defined above, but we need to ensure renderGrid calls are wired up correctly)

function openProductModal(id){
// ... (keeping existing modal logic separate just in case, but openProductPage is the new main entry)
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;
  // ...
  openProductPage(id); // Redirect modal calls to page view? Or keep both?
  // Let's keep modal as 'old' way or just let renderGrid use openProductPage
}
// Helper to generate a single Premium Card HTML
function getCardHTML(p) {
    const hasSale = !!(p.old && p.old > p.price);
    const discount = hasSale ? Math.round(((p.old - p.price) / p.old) * 100) : 0;
    const isNew = (hashStr(p.id) % 3) === 0; // consistent random "new"

    let badge = "";
    if (hasSale) badge = `<div class="card-badge card-badge--sale">-${discount}%</div>`;
    else if (isNew) badge = `<div class="card-badge card-badge--new">New</div>`;

    // Determine initial image
    let initImg = p.emoji;
    if (p.images && p.images.length > 0) {
      initImg = `<img src="${p.images[0]}" alt="${escapeHtml(p.name)}" class="card-main-img" id="img-${p.id}">`;
    }

    // Auto-scroll images logic (data attributes)
    const imgArray = p.images ? JSON.stringify(p.images).replaceAll('"', "&quot;") : "[]";

    // Colors - Visual Dots
    let colorDots = "";
    if (p.colors && p.colors.length > 0) {
      colorDots = `<div class="card__color-dots" aria-label="Available colors">
        ${p.colors
          .map(
            (c) =>
              `<button class="color-dot" type="button" onclick="event.stopPropagation(); changeCardImage('${p.id}', '${c.img}')" style="background:${c.hex}" title="${escapeHtml(c.name)}" aria-label="${escapeHtml(c.name)}"></button>`
          )
          .join("")}
      </div>`;
    }

    return `
    <article class="card" role="button" tabindex="0" onclick="openProductPage('${p.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); openProductPage('${p.id}')}">
      <div class="card__img" onmouseenter="startCardSlide('${p.id}')" onmouseleave="stopCardSlide('${p.id}')" data-images="${imgArray}" data-idx="0">
        ${badge}
        ${initImg}
        <div class="card__overlay-fav">
            <button class="fav-btn" type="button" onclick="event.stopPropagation(); toggleFav('${p.id}', this)" aria-label="Add to Wishlist" style="${state.favs.includes(p.id) ? "color:#ef4444" : ""}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${state.favs.includes(p.id) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
        </div>
        ${colorDots}
      </div>

      <div class="card__body">
        <div class="card__top">
          <div>
            <h3 class="card__title">${escapeHtml(p.name)}</h3>
            <div class="card__meta">${label(p.cat)} • ⭐ ${p.rating.toFixed(1)}</div>
          </div>
        </div>

        <div class="card__bottom">
          <div class="card__price">
            ${p.price} DH
            ${p.old ? `<s>${p.old} DH</s>` : ``}
          </div>
          <button class="btn btn--primary btn--small" type="button" onclick="event.stopPropagation(); addToCart('${p.id}'); showToast('Added to Cart')">
            Add
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderGrid(){
  const grid = $("#grid");
  const list = getList();
  const rc = $("#resultCount");
  if(rc) rc.textContent = `${list.length} item${list.length===1?"":"s"}`;

  if (!list.length){ 
    grid.innerHTML = `<div class="muted" style="grid-column:1/-1; text-align:center; padding:40px;">No results found. Try adjusting your filters.</div>`; 
    return; 
  }
  grid.innerHTML = list.map(getCardHTML).join("");
}

function renderTrending() {
    const el = $("#trendingList");
    if(!el) return;
    // Pick top 5 rated
    const list = [...PRODUCTS].sort((a,b) => b.rating - a.rating).slice(0, 5);
    el.innerHTML = list.map(getCardHTML).join("");
}

function openModal(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;

  modalState.id = id;
  modalState.qty = 1;
  $("#pmQty").textContent = "1";

  // Populate
  $("#pmTitle").textContent = p.name;
  $("#pmDesc").textContent = p.desc || "Premium quality product designed for your lifestyle. Durable materials, modern aesthetic, and built to last.";
  
  // Image Handling
  const imgBox = $("#pmImage");
  imgBox.innerHTML = ""; // Clear previous content (text or img)
  imgBox.style.transform = ""; // Reset transform

  if (p.images && p.images.length > 0) {
      // Main Image
      imgBox.innerHTML = `<img src="${p.images[0]}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:contain; border-radius:12px; display:block;">`;
      
      // Thumbs
      const thumbs = $(".product-view__thumbs");
      if(thumbs) {
          thumbs.innerHTML = p.images.map((src, i) => `
              <button class="thumb-btn ${i===0?'active':''}" onclick="changeModalImage(this, '${src}')" style="width:50px;height:50px;border:1px solid transparent;border-radius:8px;padding:0;overflow:hidden;cursor:pointer;transition:border-color 0.2s">
                 <img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;">
              </button>
          `).join("");
      }
  } else {
      // Fallback to Emoji
      imgBox.textContent = p.emoji; 
      imgBox.style.display = "flex";
      imgBox.style.alignItems = "center";
      imgBox.style.justifyContent = "center";
      imgBox.style.fontSize = "8rem"; // Ensure large emoji
      imgBox.style.transform = "scale(0.8)"; 
      setTimeout(() => imgBox.style.transform = "scale(1)", 50);
      
      const thumbs = $(".product-view__thumbs");
      if(thumbs) thumbs.innerHTML = "";
  }

  // Color Variants
  const colorOpts = $(".color-options");
  if (colorOpts) {
      if (p.colors && p.colors.length > 0) {
          colorOpts.innerHTML = p.colors.map((c, i) => `
             <button class="p-color ${i===0?'selected':''}" style="--c:${c.hex}" onclick="selectModalColor(this, '${c.img}', '${c.name}')" title="${c.name}"></button>
          `).join("");
      } else {
          // Default colors if none specified or keep existing HTML? 
          // Resetting to default dummy colors so we don't show custom colors from prev product
           colorOpts.innerHTML = `
            <button class="p-color selected" style="--c:#111"></button>
            <button class="p-color" style="--c:#555"></button>
            <button class="p-color" style="--c:#888"></button>
           `;
      }
  }

  // Price
  $("#pmPrice").textContent = `${p.price} DH`;
  $("#pmBtnPrice").textContent = `${p.price} DH`;
  
  if(p.old > 0){
    $("#pmOldPrice").textContent = `${p.old} DH`;
    $("#pmOldPrice").style.display = "inline";
    $("#pmDiscount").style.display = "inline-flex";
    const off = Math.round(((p.old - p.price) / p.old) * 100);
    $("#pmDiscount").textContent = `-${off}%`;
    $("#pmBadge").style.display = "block";
    $("#pmBadge").textContent = "Flash Deal";
    $("#pmBadge").style.background = "#ef4444";
  } else {
    $("#pmOldPrice").style.display = "none";
    $("#pmDiscount").style.display = "none";
    $("#pmBadge").style.display = "none";
  }

  // Rating
  $("#pmReviews").textContent = `(${Math.floor(Math.random() * 200 + 50)} reviews)`;

  // Open
  $("#productModal").classList.add("is-open");
  $("#productModal").setAttribute("aria-hidden", "false");
}


/* Legacy modal override removed to allow full page navigation */


/* Back to Top Logic */
function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupBackToTop);
} else {
  setupBackToTop();
}

