// Lecomax — premium brand-store UI (mega menus + hero slider + category places + product grid + cart)
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const PRODUCTS = [
  {id:"el1", cat:"electronics", name:"Hybrid ANC Earbuds", price:79, old:99, rating:4.7, emoji:"🎧", desc:"Hybrid ANC. Deep bass. Clear calls."},
  {id:"el2", cat:"electronics", name:"Over‑Ear Headphones", price:89, old:0, rating:4.6, emoji:"🎧", desc:"Comfort fit. Studio sound. Long battery."},
  {id:"el3", cat:"electronics", name:"Fast Charger 65W", price:29, old:39, rating:4.5, emoji:"⚡", desc:"GaN fast charging for phone & laptop."},
  {id:"el4", cat:"electronics", name:"Power Bank 20,000mAh", price:35, old:45, rating:4.4, emoji:"🔋", desc:"High capacity, travel-friendly."},
  {id:"el5", cat:"electronics", name:"Smart Watch AMOLED", price:69, old:89, rating:4.6, emoji:"⌚", desc:"Bright AMOLED. Health tracking. Calls."},

  {id:"cl1", cat:"clothing", name:"Premium Hoodie", price:39, old:49, rating:4.8, emoji:"🧥", desc:"Soft fabric. Modern oversized fit."},
  {id:"cl2", cat:"clothing", name:"Minimal T‑Shirt", price:19, old:0, rating:4.5, emoji:"👕", desc:"Heavy cotton. Clean silhouette."},
  {id:"cl3", cat:"clothing", name:"Denim Jacket", price:55, old:0, rating:4.6, emoji:"🧢", desc:"Classic denim with a modern cut."},
  {id:"cl4", cat:"clothing", name:"Cargo Pants", price:35, old:45, rating:4.4, emoji:"👖", desc:"Utility pockets. Everyday comfort."},

  {id:"sh1", cat:"shoes", name:"Street Sneakers", price:49, old:59, rating:4.7, emoji:"👟", desc:"Cushion sole. All‑day comfort."},
  {id:"sh2", cat:"shoes", name:"Running Shoes", price:59, old:0, rating:4.6, emoji:"🏃", desc:"Lightweight. Responsive foam."},
  {id:"sh3", cat:"shoes", name:"Classic Loafers", price:65, old:0, rating:4.3, emoji:"👞", desc:"Smart casual. Premium look."},
  {id:"sh4", cat:"shoes", name:"Comfort Slides", price:18, old:0, rating:4.2, emoji:"🩴", desc:"Soft and easy for daily wear."},

  {id:"ac1", cat:"accessories", name:"Urban Backpack 22L", price:44, old:0, rating:4.7, emoji:"🎒", desc:"Laptop sleeve + water resistant fabric."},
  {id:"ac2", cat:"accessories", name:"Travel Backpack 30L", price:59, old:69, rating:4.6, emoji:"🎒", desc:"Perfect for trips. Strong zippers."},
  {id:"ac3", cat:"accessories", name:"Sling Bag Mini", price:24, old:0, rating:4.4, emoji:"👜", desc:"Compact daily carry for essentials."},
  {id:"ac4", cat:"accessories", name:"Gym Bag Duffel", price:32, old:0, rating:4.3, emoji:"🧳", desc:"Light, strong, and easy to clean."},
];

const SLIDES = [
  { tab:"electronics", kicker:"New Arrival", title:"Headphones that feel premium.",
    text:"ANC audio, wearables and power accessories—presented with a clean brand-store experience.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/electornic.png",
    tiles:[{emoji:"🎧", name:"ANC Earbuds", meta:"Deep bass", price:"$79"},
           {emoji:"⌚", name:"AMOLED Watch", meta:"Health tracking", price:"$69"},
           {emoji:"⚡", name:"GaN 65W", meta:"Fast charging", price:"$29"},
           {emoji:"🔋", name:"Power 20k", meta:"All day", price:"$35"}]},
  { tab:"clothing", kicker:"Best Seller", title:"Clothing with a clean look.",
    text:"Premium basics—hoodies, tees, and denim with a modern fit and quality feel.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/clothes.png",
    tiles:[{emoji:"🧥", name:"Hoodie", meta:"Oversized", price:"$39"},
           {emoji:"👕", name:"T‑Shirt", meta:"Heavy cotton", price:"$19"},
           {emoji:"👖", name:"Cargo", meta:"Utility", price:"$35"},
           {emoji:"🧢", name:"Denim", meta:"Classic", price:"$55"}]},
  { tab:"shoes", kicker:"Trending", title:"Shoes designed for comfort.",
    text:"Sneakers, runners and loafers—easy browsing, fast add-to-cart.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/shoes.png",
    tiles:[{emoji:"👟", name:"Sneakers", meta:"Cushion", price:"$49"},
           {emoji:"🏃", name:"Running", meta:"Lightweight", price:"$59"},
           {emoji:"👞", name:"Loafers", meta:"Smart", price:"$65"},
           {emoji:"🩴", name:"Slides", meta:"Soft", price:"$18"}]},
  { tab:"accessories", kicker:"Backpacks", title:"Carry your day in style.",
    text:"Urban and travel backpacks with premium materials and practical pockets.",
    image: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/backpack.png",
    tiles:[{emoji:"🎒", name:"Urban 22L", meta:"Laptop sleeve", price:"$44"},
           {emoji:"🎒", name:"Travel 30L", meta:"Water resistant", price:"$59"},
           {emoji:"👜", name:"Sling Mini", meta:"Essentials", price:"$24"},
           {emoji:"🧳", name:"Gym Duffel", meta:"Easy clean", price:"$32"}]},
];

const state = { 
  filter:"all", 
  sort:"featured", 
  q:"", 
  cart: load("lc_cart_v2", {}), 
  favs: [], 
  slideIndex:0, 
  heroTab:"electronics" 
};

function toggleFav(id, btn){
  const idx = state.favs.indexOf(id);
  if(idx > -1) state.favs.splice(idx,1);
  else state.favs.push(id);
  
  // Re-render button icon only
  const svg = btn.querySelector("svg");
  if(state.favs.includes(id)) {
    svg.setAttribute("fill", "currentColor");
    btn.style.color = "#ef4444";
  } else {
    svg.setAttribute("fill", "none");
    btn.style.color = "var(--muted)";
  }
}

init();

function init(){
  $("#year").textContent = new Date().getFullYear();

  const langBtn = $("#langBtn");
  const langMenu = $("#langMenu");
  langBtn.addEventListener("click", () => {
    const show = !langMenu.classList.contains("show");
    langMenu.classList.toggle("show", show);
    langBtn.setAttribute("aria-expanded", String(show));
  });
  $$("#langMenu .dropdown__item").forEach(btn => btn.addEventListener("click", () => {
    const textSpan = langBtn.querySelector(".chip__text");
    if(textSpan) textSpan.textContent = btn.dataset.lang;
    else langBtn.innerText = btn.dataset.lang; // Fallback
    
    langMenu.classList.remove("show");
    langBtn.setAttribute("aria-expanded","false");
  }));

  setupMegaMenus();

  $("#burger").addEventListener("click", () => {
    const nav = $(".nav");
    const isOpen = nav.classList.contains("open"); 
    
    if (isOpen) {
      nav.style.display = "none";
      nav.classList.remove("open");
    } else {
      nav.style.display = "flex";
      // Styles are now handled by CSS .nav class in media query
      // Clearing inline styles that might interfere with CSS
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

  $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); });

  $$("[data-jump-filter]").forEach(a => a.addEventListener("click", () => setFilter(a.dataset.jumpFilter)));
  $$("[data-filter-btn]").forEach(b => b.addEventListener("click", () => setFilter(b.dataset.filterBtn)));

  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });

  $("#openCart").addEventListener("click", () => openDrawer(true));
  $("#clearCart").addEventListener("click", () => { state.cart = {}; save(); renderCart(); });
  $("#checkout").addEventListener("click", () => checkout());

  document.addEventListener("click", (e) => { if (e.target.closest("[data-close='1']")) closeAll(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

  $$("[data-hero-tab]").forEach(btn => btn.addEventListener("click", () => {
    $$("[data-hero-tab]").forEach(x => x.classList.remove("is-active"));
    btn.classList.add("is-active");
    state.heroTab = btn.dataset.heroTab;
    const idx = SLIDES.findIndex(s => s.tab === state.heroTab);
    state.slideIndex = idx >= 0 ? idx : 0;
    updateSlider();
    resetAutoPlay();
  }));

  $("#prevSlide").addEventListener("click", () => {
    state.slideIndex = (state.slideIndex - 1 + SLIDES.length) % SLIDES.length;
    updateSlider();
    resetAutoPlay();
  });
  $("#nextSlide").addEventListener("click", () => {
    state.slideIndex = (state.slideIndex + 1) % SLIDES.length;
    updateSlider();
    resetAutoPlay();
  });

  countUp();
  initSlider();
  updateSlider();
  renderGrid();
  renderCart();

  startAutoPlay();
  startProductTicker(); // Start the product scroll

  document.addEventListener("click", (e) => {
    const inLang = e.target.closest("#langBtn") || e.target.closest("#langMenu");
    if (!inLang) { $("#langMenu").classList.remove("show"); $("#langBtn").setAttribute("aria-expanded","false"); }
  });
}

function startProductTicker() {
  const grid = $("#grid");
  let scrollSpeed = 0.5; // pixel per tick
  let isHovered = false;

  grid.addEventListener("mouseenter", () => isHovered = true);
  grid.addEventListener("mouseleave", () => isHovered = false);
  grid.addEventListener("touchstart", () => isHovered = true);
  grid.addEventListener("touchend", () => setTimeout(() => isHovered = false, 2000));

  function step() {
    if (!isHovered && grid.scrollWidth > grid.clientWidth) {
      if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 1) {
        grid.scrollLeft = 0; // Loop back instantly or smooth? Smooth might be jarring.
        // For smoother endless loop, we'd need to clone nodes.
        // For "Simple" ticker:
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

function renderGrid(){
  const grid = $("#grid");
  const list = getList();
  if (!list.length){ grid.innerHTML = `<div class="muted">No results. Try another search.</div>`; return; }

  grid.innerHTML = list.map(p => `
    <article class="card">
      <div class="card__img">${p.emoji}</div>
      <div class="card__body">
        <div class="card__top">
          <span class="tag">${label(p.cat)}</span>
          <div style="display:flex; gap:8px;">
            <button class="fav-btn" onclick="toggleFav('${p.id}', this)" aria-label="Like">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${state.favs.includes(p.id)? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <span class="rating">⭐ ${p.rating.toFixed(1)}</span>
          </div>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">
          <strong>$${p.price}</strong>
          ${p.old ? `<s>$${p.old}</s>` : ``}
        </div>
        <div class="card__actions">
          <button class="btn btn--ghost w100" data-view="${p.id}">Details</button>
          <button class="btn btn--primary w100" data-add="${p.id}">Add</button>
        </div>
      </div>
    </article>
  `).join("");

  $$("[data-add]").forEach(b => b.addEventListener("click", () => addToCart(b.dataset.add)));
  $$("[data-view]").forEach(b => b.addEventListener("click", () => openModal(b.dataset.view)));
}

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
          <strong style="font-size:1.25rem">$${p.price}</strong>
          ${p.old ? `<s>$${p.old}</s>` : ``}
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
  $("#drawer").classList.toggle("show", show);
  $("#drawer").setAttri
  showToast("Added to cart! 🛒");
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
  $("#modal").classList.remove("show");
  $("#modal").setAttribute("aria-hidden","true");
  const pm = $("#productModal");
  if(pm) {
    pm.classList.remove("is-open");
    pm.setAttribute("aria-hidden", "true");
  }
  openDrawer(false);
}

function addToCart(id){
  state.cart[id] = (state.cart[id] || 0) + 1;
  save(); renderCart(); openDrawer(true);
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
          <strong style="font-size:1.1rem">$${p.price * qty}</strong>
        </div>
      </div>
    `;
  }).join("");

  $("#total").textContent = `$${total}`;
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
    lines.push(`${p.name} × ${qty} = $${sum}`);
  }
  lines.push("--------------------");
  lines.push(`Total: $${total}`);

  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    alert("Order copied ✅ Paste it in WhatsApp or send to your team.");
    state.cart = {};
    save();
    renderCart();
    closeAll();
  });
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
  const sl = $("#slideLeft");
  const sr = $("#slideRight");
  if(sl && sr){
    sl.addEventListener("click", () => $("#grid").scrollBy({left: -360, behavior: 'smooth'}));
    sr.addEventListener("click", () => $("#grid").scrollBy({left: 360, behavior: 'smooth'}));
  }
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

function openProductModal(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;

  modalState.id = id;
  modalState.qty = 1;
  $("#pmQty").textContent = "1";

  // Populate
  $("#pmTitle").textContent = p.name;
  $("#pmDesc").textContent = p.desc || "Premium quality product designed for your lifestyle. Durable materials, modern aesthetic, and built to last.";
  
  // Image (Emoji or logic to find image)
  $("#pmImage").textContent = p.emoji; 
  $("#pmImage").style.transform = "scale(0.8)"; 
  setTimeout(() => $("#pmImage").style.transform = "scale(1)", 50);

  // Price
  $("#pmPrice").textContent = `$${p.price}`;
  $("#pmBtnPrice").textContent = `$${p.price}`;
  
  if(p.old > 0){
    $("#pmOldPrice").textContent = `$${p.old}`;
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

