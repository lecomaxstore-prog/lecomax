// === Trending Products Carousel Logic ===
(function() {
  const track = document.querySelector('.trending__track');
  if (!track) return;
  const cards = Array.from(track.children);
  const leftBtn = document.querySelector('.trending__arrow--left');
  const rightBtn = document.querySelector('.trending__arrow--right');
  const dotsContainer = document.querySelector('.trending__dots');
  let current = 0;
  let cardsPerView = 4;

  function updateCardsPerView() {
    if (window.innerWidth <= 600) cardsPerView = 1;
    else if (window.innerWidth <= 1024) cardsPerView = 2;
    else cardsPerView = 4;
  }
  updateCardsPerView();
  window.addEventListener('resize', () => {
    updateCardsPerView();
    goTo(current, true);
    updateDots();
  });

  function goTo(idx, instant) {
    current = Math.max(0, Math.min(idx, cards.length - cardsPerView));
    const offset = current * (cards[0].offsetWidth + parseInt(getComputedStyle(track).gap));
    track.style.transition = instant ? 'none' : 'transform 0.5s cubic-bezier(.4,1,.6,1)';
    track.style.transform = `translateX(-${offset}px)`;
    updateArrows();
    updateDots();
  }

  function updateArrows() {
    leftBtn.disabled = current === 0;
    rightBtn.disabled = current >= cards.length - cardsPerView;
  }

  // Dots
  function updateDots() {
    dotsContainer.innerHTML = '';
    const total = Math.max(1, cards.length - cardsPerView + 1);
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'trending__dot' + (i === current ? ' trending__dot--active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i+1}`);
      dot.onclick = () => goTo(i);
      dotsContainer.appendChild(dot);
    }
  }

  leftBtn.onclick = () => goTo(current - 1);
  rightBtn.onclick = () => goTo(current + 1);

  // Keyboard navigation
  document.querySelector('.trending').addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') leftBtn.click();
    if (e.key === 'ArrowRight') rightBtn.click();
  });

  // Touch/drag swipe
  let startX = 0, dragging = false;
  track.addEventListener('touchstart', e => {
    dragging = true;
    startX = e.touches[0].clientX;
    track.style.transition = 'none';
  });
  track.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX;
    track.style.transform = `translateX(-${current * (cards[0].offsetWidth + parseInt(getComputedStyle(track).gap)) - dx}px)`;
  });
  track.addEventListener('touchend', e => {
    dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && current < cards.length - cardsPerView) goTo(current + 1);
      else if (dx > 0 && current > 0) goTo(current - 1);
      else goTo(current, false);
    } else {
      goTo(current, false);
    }
  });

  // Init
  goTo(0, true);
  updateDots();
})();
// Lecomax — premium brand-store UI (mega menus + hero slider + category places + product grid + cart)

// --- Product Image Zoom ---
function enableProductImageZoom() {
  const img = document.getElementById('ppMainImg');
  const lens = document.getElementById('zoomLens');
  if (!img || !lens) return;


  let zoom = 3.5;
  let isZoomed = false;
  let lastCx = 0, lastCy = 0;
  let fadeTimeout = null;

  // Only enable zoom for large screens unless tapped
  function isMobile() {
    return window.innerWidth < 700;
  }

  function moveLens(e) {
    const rect = img.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    let cx = x - rect.left;
    let cy = y - rect.top;
    // Keep lens inside image
    cx = Math.max(lens.offsetWidth/2, Math.min(cx, rect.width - lens.offsetWidth/2));
    cy = Math.max(lens.offsetHeight/2, Math.min(cy, rect.height - lens.offsetHeight/2));
    lastCx = cx;
    lastCy = cy;
    lens.style.left = (cx - lens.offsetWidth / 2) + 'px';
    lens.style.top = (cy - lens.offsetHeight / 2) + 'px';
    img.style.transformOrigin = `${cx}px ${cy}px`;
    // Ultra-sharp lens preview
    lens.style.backgroundImage = `url('${img.src}')`;
    lens.style.backgroundRepeat = 'no-repeat';
    lens.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
    lens.style.backgroundPosition = `-${(cx * zoom) - lens.offsetWidth/2}px -${(cy * zoom) - lens.offsetHeight/2}px`;
    lens.style.imageRendering = 'auto';
  }

  function showZoom(e) {
    if (isMobile() && e.type !== 'touchstart' && e.type !== 'touchmove') return;
    isZoomed = true;
    clearTimeout(fadeTimeout);
    lens.style.opacity = '1';
    lens.style.display = 'block';
    lens.style.transform = 'scale(0.85)';
    setTimeout(() => { lens.style.transform = 'scale(1)'; }, 10);
    img.classList.add('zoomed');
    img.style.transform = `scale(${zoom})`;
    moveLens(e);
  }
  function hideZoom() {
    isZoomed = false;
    lens.style.opacity = '0';
    lens.style.transform = 'scale(0.85)';
    img.classList.remove('zoomed');
    img.style.transform = '';
    fadeTimeout = setTimeout(() => { lens.style.display = 'none'; }, 180);
  }

  // Toggle zoom on click/tap for accessibility
  function toggleZoom(e) {
    if (isZoomed) {
      hideZoom();
    } else {
      showZoom(e);
    }
  }

  // Tooltip for help
  if (!document.getElementById('zoomHelpTip')) {
    const tip = document.createElement('div');
    tip.id = 'zoomHelpTip';
    tip.textContent = 'Hover or tap to zoom';
    tip.style.position = 'absolute';
    tip.style.bottom = '10px';
    tip.style.right = '10px';
    tip.style.background = 'rgba(59,130,246,0.92)';
    tip.style.color = '#fff';
    tip.style.padding = '6px 16px';
    tip.style.borderRadius = '8px';
    tip.style.fontSize = '0.98rem';
    tip.style.zIndex = '20';
    tip.style.opacity = '0.92';
    tip.style.pointerEvents = 'none';
    tip.style.transition = 'opacity 0.3s';
    img.parentElement.appendChild(tip);
    setTimeout(() => { tip.style.opacity = '0'; }, 2600);
    setTimeout(() => { tip.remove(); }, 3400);
  }

  // Mouse events
  img.addEventListener('mousemove', showZoom);
  img.addEventListener('mouseleave', hideZoom);
  img.addEventListener('mousemove', moveLens);
  lens.addEventListener('mousemove', moveLens);
  img.addEventListener('click', toggleZoom);

  // Touch events (mobile)
  img.addEventListener('touchstart', function(e) { e.preventDefault(); showZoom(e); }, {passive: false});
  img.addEventListener('touchmove', function(e) { e.preventDefault(); moveLens(e); }, {passive: false});
  img.addEventListener('touchend', function(e) { e.preventDefault(); hideZoom(); }, {passive: false});
  lens.addEventListener('touchmove', function(e) { e.preventDefault(); moveLens(e); }, {passive: false});
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(enableProductImageZoom, 400); // Wait for product image to render
});
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const TRANSLATIONS = {
  en: {
    support: "Support",
    warranty: "Warranty",
    stores: "Stores",
    search_placeholder: "Search for products, brands and more...",
    products: "Products",
    collections: "Collections",
    newsroom: "Newsroom",
    shopping: "Shopping",
    electronics: "Electronics",
    clothing: "Clothing",
    shoes: "Shoes",
    backpacks: "Backpacks",
    quick_picks: "Quick Picks",
    new_arrivals: "New Arrivals",
    best_sellers: "Best Sellers",
    hot_deals: "Hot Deals",
    cat_headphones: "Headphones & Audio",
    shop_now: "Shop Now",
    orders: "Orders",
    track_order: "Track Order",
    returns: "Returns",
    shipping: "Shipping Info",
    account: "Account",
    signin: "Sign In",
    register: "Register",
    wishlist: "My Wishlist",
    help: "Help",
    faq: "FAQ",
    contact: "Contact Us",
    promo_new: "NEW",
    promo_headline: "Premium picks, clean design.",
    promo_subhead: "Electronics • Clothing • Shoes • Backpacks",
    promo_shipping_title: "Free Shipping",
    promo_shipping_desc: "On selected categories this week.",
    exclusive_stores: "Exclusive Stores",
    limited_offer: "Limited",
    technical_support: "Technical Support",
    fast: "Fast",
    order_summary: "Order Summary",
    copy_whatsapp: "Copy order or connect WhatsApp easily.",
    cart_footer_text: "Checkout copies an order summary. You can connect WhatsApp or backend later.",
    favorites: "Favorites",
    flash_deal: "Flash Deal",
    color: "Color",
    size: "Size",
    add_to_cart_btn: "Add to Cart",
    modal_warranty: "12 Months Warranty",
    modal_shipping: "Free Express Shipping",
    back_home: "Back to Home",
    verified_buyer: "Verified Buyer",
    testimonial_text: "“Looks premium and feels professional.”",
    trending: "Trending Now",
    trending_sub: "Top picks selected for you.",
    products_title: "Products",
    products_sub: "Search, filter, sort — then add to cart.",
    all: "All",
    view_all: "View all",
    fast_delivery: "Fast Delivery",
    official_warranty: "Official Warranty",
    premium_support: "Premium Support",
    subscribe: "Subscribe",
    join_club: "Join the Club",
    join_club_desc: "Get exclusive access to new drops and secret sales.",
    cart: "Cart",
    checkout: "Checkout",
    total: "Total",
    clear_cart: "Clear cart",
    footer_shop: "Shopping",
    footer_support: "Support",
    footer_company: "Company",
    shop_online: "Shop Online",
    help_center: "Help Center",
    auth: "Authentication",
    about: "About",
    terms: "Terms",
    privacy: "Privacy",
    rights: "Lecomax. All rights reserved.",
    visit_store: "Visit Our Store",
    get_directions: "Get Directions",
    email_us: "Email Us",
    enter_email: "Enter your email",
    what_people_say: "What people say",
    clean_experience: "Clean, premium shopping experience."
  },
  fr: {
    support: "Service Client",
    warranty: "Garantie",
    stores: "Nos Magasins",
    search_placeholder: "Rechercher un produit, une marque...",
    products: "Produits",
    collections: "Collections",
    newsroom: "Actualités",
    shopping: "Boutique",
    electronics: "High-Tech",
    clothing: "Mode & Vêtements",
    shoes: "Chaussures",
    backpacks: "Maroquinerie & Sacs",
    quick_picks: "Sélection Rapide",
    new_arrivals: "Nouveautés",
    best_sellers: "Meilleures Ventes",
    hot_deals: "Ventes Flash",
    cat_headphones: "Audio & Casques",
    shop_now: "Découvrir",
    orders: "Mes Commandes",
    track_order: "Suivre ma commande",
    returns: "Retours & Échanges",
    shipping: "Livraison",
    account: "Mon Compte",
    signin: "Se connecter",
    register: "Créer un compte",
    wishlist: "Liste de souhaits",
    help: "Centre d'aide",
    faq: "FAQ",
    contact: "Nous contacter",
    promo_new: "NOUVEAU",
    promo_headline: "Design épuré, qualité premium.",
    promo_subhead: "High-Tech • Mode • Chaussures",
    promo_shipping_title: "Livraison Offerte",
    promo_shipping_desc: "Sur une sélection d'articles.",
    exclusive_stores: "Boutiques Exclusives",
    limited_offer: "Offre Limitée",
    technical_support: "Support Technique",
    fast: "Rapide",
    order_summary: "Récapitulatif",
    copy_whatsapp: "Copiez la commande ou continuez sur WhatsApp.",
    cart_footer_text: "La validation génère un récapitulatif. Finalisation possible via WhatsApp.",
    favorites: "Favoris",
    flash_deal: "Vente Flash",
    color: "Couleur",
    size: "Taille",
    add_to_cart_btn: "Ajouter au panier",
    modal_warranty: "Garantie 12 Mois",
    modal_shipping: "Livraison Express Offerte",
    back_home: "Retour à l'accueil",
    verified_buyer: "Acheteur Vérifié",
    testimonial_text: "“Une finition premium et un rendu professionnel.”",
    trending: "Tendances du moment",
    trending_sub: "Une sélection des meilleurs produits pour vous.",
    products_title: "Nos Produits",
    products_sub: "Recherchez, filtrez et trouvez votre bonheur.",
    all: "Tout",
    view_all: "Tout voir",
    fast_delivery: "Livraison Rapide",
    official_warranty: "Garantie Officielle",
    premium_support: "Service Premium",
    subscribe: "S'inscrire",
    join_club: "Rejoindre le Club",
    join_club_desc: "Accès exclusif aux ventes privées et nouveautés.",
    cart: "Mon Panier",
    checkout: "Commander",
    total: "Total",
    clear_cart: "Vider le panier",
    footer_shop: "Acheter",
    footer_support: "Aide",
    footer_company: "L'Entreprise",
    shop_online: "Boutique en ligne",
    help_center: "Centre d'aide",
    auth: "Espace Client",
    about: "À propos",
    terms: "Conditions Générales",
    privacy: "Confidentialité",
    rights: "Lecomax. Tous droits réservés.",
    visit_store: "Magasins",
    get_directions: "Itinéraire",
    email_us: "Email",
    enter_email: "Votre adresse email",
    what_people_say: "Avis Clients",
    clean_experience: "Une expérience d'achat simple et élégante."
  },
  ar: {
    support: "خدمة العملاء",
    warranty: "الضمان والجودة",
    stores: "فروعنا",
    search_placeholder: "ابحث عن منتج، ماركة، أو فئة...",
    products: "المنتجات",
    collections: "المجموعات",
    newsroom: "آخر الأخبار",
    shopping: "التسوق",
    electronics: "إلكترونيات",
    clothing: "أزياء وملابس",
    shoes: "أحذية",
    backpacks: "حقائب وإكسسوارات",
    quick_picks: "مختارات سريعة",
    new_arrivals: "وصل حديثاً",
    best_sellers: "الأكثر مبيعاً",
    hot_deals: "عروض حصرية",
    cat_headphones: "صوتيات وسماعات",
    shop_now: "تسوق الآن",
    orders: "طلباتي",
    track_order: "تتبع الطلب",
    returns: "سياسة الإرجاع",
    shipping: "الشحن والتوصيل",
    account: "حسابي",
    signin: "تسجيل الدخول",
    register: "إنشاء حساب",
    wishlist: "قائمة الأمنيات",
    help: "المساعدة",
    faq: "الأسئلة الشائعة",
    contact: "اتصل بنا",
    promo_new: "جديد",
    promo_headline: "جودة استثنائية، تصميم عصري.",
    promo_subhead: "إلكترونيات • أزياء • أحذية",
    promo_shipping_title: "شحن مجاني",
    promo_shipping_desc: "على منتجات مختارة لفترة محدودة.",
    exclusive_stores: "متاجرنا الحصرية",
    limited_offer: "عرض محدود",
    technical_support: "الدعم الفني",
    fast: "سريع",
    order_summary: "ملخص الطلب",
    copy_whatsapp: "انسخ الطلب للمتابعة عبر واتساب.",
    cart_footer_text: "الدفع يقوم بنسخ ملخص الطلب. يمكنك إتمام الشراء عبر واتساب.",
    favorites: "المفضلة",
    flash_deal: "عرض خاطف",
    color: "اللون",
    size: "المقاس",
    add_to_cart_btn: "إضافة إلى السلة",
    modal_warranty: "ضمان لمدة 12 شهراً",
    modal_shipping: "شحن سريع ومجاني",
    back_home: "العودة للرئيسية",
    verified_buyer: "عميل موثق",
    testimonial_text: "“تجربة تسوق فاخرة تعكس الاحترافية.”",
    trending: "الأكثر رواجاً",
    trending_sub: "تشكيلة مميزة اخترناها لك.",
    products_title: "كتالوج المنتجات",
    products_sub: "تصفح، ابحث، واختر ما يناسبك.",
    all: "الكل",
    view_all: "عرض الجميع",
    fast_delivery: "توصيل سريع",
    official_warranty: "ضمان معتمد",
    premium_support: "خدمة متميزة",
    subscribe: "اشترك",
    join_club: "انضم إلى النادي",
    join_club_desc: "تمتع بخصومات حصرية وكن أول من يعلم بجديدنا.",
    cart: "سلة التسوق",
    checkout: "إتمام الطلب",
    total: "المجموع",
    clear_cart: "إفراغ السلة",
    footer_shop: "التسوق",
    footer_support: "خدمة العملاء",
    footer_company: "عن الشركة",
    shop_online: "المتجر الإلكتروني",
    help_center: "مركز المساعدة",
    auth: "بوابة العملاء",
    about: "من نحن",
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية",
    rights: "Lecomax. جميع الحقوق محفوظة.",
    visit_store: "زيارة المعرض",
    get_directions: "الموقع على الخريطة",
    email_us: "راسلنا",
    enter_email: "أدخل بريدك الإلكتروني",
    what_people_say: "آراء عملائنا",
    clean_experience: "تجربة تسوق سلسة وعصرية."
  }
};

function setLanguage(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  // Update Direction
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Update Text Content
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) {
      if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
        el.placeholder = t[key];
      } else {
        // Preserve icons if they exist as first child
        const icon = el.querySelector('svg');
        if (icon) {
          el.childNodes.forEach(node => {
             if (node.nodeType === 3 && node.textContent.trim().length > 0) {
                 node.textContent = " " + t[key];
             }
          });
        } else {
          el.innerText = t[key];
        }
      }
    }
  });

  // Update Filters
  $$('.pillBtn').forEach(btn => {
     const key = btn.dataset.filterBtn;
     if (t[key]) {
        // keep svg
        const svg = btn.querySelector('svg');
        btn.innerHTML = '';
        if(svg) btn.appendChild(svg);
        btn.appendChild(document.createTextNode(" " + t[key]));
     }
  });

  // Save preference
  localStorage.setItem('lecomax_lang', lang);
}

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
  const names = ["Yassine","Othman","Hamza","Sofiane","Ilyas","Mehdi","Anas","Walid"];
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
  for(let i=0;i<1;i++){
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
    id: "baasploa_running_shoes",
    cat: "shoes",
    name: "Baasploa Men's Lightweight Running Shoes",
    price: 250,
    old: 0,
    rating: 4.8,
    emoji: "👟",
    video: "https://goods-vod.kwcdn.com/goods-video/49ac0ebc85263ad26cc2bb9bd78ca2e8a291fd73.f30.mp4",
    desc: "Baasploa Men's lightweight running shoes, mesh shoes with lace-up style, outdoor sports tennis shoes, lightweight and breathable, suitable for daily wear.",
    specs: {
        "General": {
            "Brand": "BAASPLOA",
            "Applicable People": "Adult, Male",
            "Style": "Sports",
            "Pattern": "Stripes",
            "Support Type": "Stabilizing",
            "Pronation": "Normal",
            "Special Features": "Breathable"
        },
        "Material": {
             "Upper Material": "Fabric",
             "Sole Material": "MD, TPR",
             "Insole Material": "PU",
             "Inner Material": "Fabric",
             "Closure Type": "Lace" 
        },
        "Season & Usage": {
            "Season": "Spring/Summer/Fall",
            "All-season": "Summer",
            "Occasion": "Daily & Casual, Running & Work Out, Sports, Going Out, Festive"
        }
    },
    images: [
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/black%201.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/light%20gray%201.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/white%201.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/blue%201.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/army%20green%201.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/black%202.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/black%203%3D4.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/light%20gray%202.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/light%20gray%203.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/yellow%201.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/dark%20gray%201.avif"
    ],
    colors: [
        { name: "Black", hex: "#000000", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/black%201.avif", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"], disabledSizes: ["39", "40", "41", "42", "43", "44", "45", "46"] },
        { name: "Light Grey", hex: "#d3d3d3", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/light%20gray%201.avif", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"], disabledSizes: ["39", "40", "41", "42", "43", "45", "46"] },
        { name: "White", hex: "#ffffff", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/white%201.avif", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"], disabledSizes: ["39", "40", "41", "42", "43", "44", "45", "46"] },
        { name: "Blue", hex: "#0000ff", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/blue%201.avif", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"], disabledSizes: ["39", "40", "41", "42", "43", "45", "46"] },
        { name: "Army Green", hex: "#4b5320", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/army%20green%201.avif", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"], disabledSizes: ["39", "40", "41", "42", "43", "45", "46"] },
        { name: "Yellow", hex: "#FFD700", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/yellow%201.avif", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"], disabledSizes: ["39", "40", "41", "42", "43", "44", "46"] },
        { name: "Dark Gray", hex: "#555555", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Baasploashoes/dark%20gray%201.avif", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"], disabledSizes: ["39", "40", "41", "42", "43", "44", "45", "46"] }
    ]
  },
  {
    id: "genai1", 
    cat: "electronics", 
    name: "Genai Wireless Earbuds", 
    price: 150, 
    old: 0, 
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
            "Recommended Scenario": "Exercising, Daily Use, Calls, Music"
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
    price: 1200,
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
  },
  {
    id: "casual_jacket_autumn",
    cat: "clothing",
    name: "Autumn Men's Casual Hoodie Baseball Jacket",
    price: 350,
    old: 0,
    rating: 4.8,
    emoji: "🧥",
    desc: "Stylish embroidery and color blocking for a trendy youth look. Sizes available: XL, XXL.",
    specs: {
      "General": {
        "Product Type": "Hoodie Baseball Jacket",
        "Style": "Casual",
        "Gender": "Men",
        "Season": "Autumn",
        "Color Options": "Black, Rust"
      },
      "Material & Build": {
        "Material": "Polyester",
        "Composition": "100% Polyester",
        "Lining Ingredients": "100% Polyester",
        "Lining": "Polyester Fiber (polyester)",
        "Weaving Method": "Woven",
        "Fabric": "Slight Stretch",
        "Sheer": "No"
      },
      "Design": {
        "Length": "Short Length",
        "Sleeve Length": "Long Sleeve",
        "Sleeve Type": "Regular Sleeve",
        "Details": "Pocket",
        "Pattern": "Alphabets",
        "Collar Style": "Hooded",
        "Fit Type": "Loose",
        "Style": "Preppy",
        "Type": "Workwear Jacket"
      },
      "Closure & Placket": {
        "Closure Type": "Zipper",
        "Placket Type": "Placket",
        "Placket": "Zipper"
      },
      "Sizes": {
        "Available Sizes": "XL, XXL"
      },
      "Care & Use": {
        "Operation Instruction": "Machine wash or professional dry clean",
        "Occasion": "Daily & Casual",
        "Applicable People": "Men",
        "Style source": "Stock"
      }
    },
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/1%20black%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/2%20black%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/3%20black.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/4%20black%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/5%20black%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/1%20rust%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/2%20rust.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/3%20rust%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/4%20rust%20.jpeg"
    ],
    colors: [
      { name: "Black", hex: "#0b0b0b", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/1%20black%20.jpeg" },
      { name: "Rust", hex: "#b4532a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/1%20rust%20.jpeg" }
    ],
    sizesAvailability: {
      "XL": false,
      "XXL": true
    }
  },
  {
    id: "hooded_warm_jacket_rust",
    cat: "clothing",
    name: "Men's Fashion Hooded Embroidered Warm Jacket",
    price: 550,
    old: 0,
    rating: 4.8,
    emoji: "🧥",
    desc: "Non-stretch, long sleeve, single breasted jacket for daily and casual wear. Size available: XXL.",
    specs: {
      "General": {
        "Product Type": "Hooded Embroidered Warm Jacket",
        "Style": "Casual",
        "Gender": "Men",
        "Color Options": "Rust",
        "Origin": "Fujian, China"
      },
      "Material & Build": {
        "Material": "Polyester",
        "Composition": "100% Polyester",
        "Other Material": "Polyester",
        "Lining Ingredients": "100% Polyester",
        "Filler": "Polyester Fiber (polyester)",
        "Weaving Method": "Woven",
        "Fabric": "Non-Stretch",
        "Sheer": "No"
      },
      "Design": {
        "Length": "Regular",
        "Sleeve Length": "Long Sleeve",
        "Sleeve Type": "Regular Sleeve",
        "Details": "Zipper",
        "Pattern": "Alphabets",
        "Collar Style": "Hooded",
        "Fit Type": "Loose",
        "Style": "Fashion",
        "Occasion": "Daily & Casual"
      },
      "Closure & Placket": {
        "Placket Type": "Placket",
        "Placket": "Single Breasted"
      },
      "Care & Use": {
        "Operation Instruction": "Hand wash, do not dry clean",
        "Applicable People": "Men"
      },
      "Sizes": {
        "Available Sizes": "XXL"
      }
    },
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/1%20rust%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/2%20rust.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/3%20rust%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/4%20rust%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/5%20rust%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/6%20rust.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/7%20rust%20.jpeg",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/8%20rust%20.jpeg"
    ],
    colors: [
      { name: "Rust", hex: "#b4532a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Fashion%20Hooded%20Embroidered%20Warm%20Jacket/1%20rust%20.jpeg" }
    ],
    sizesAvailability: {
      "XXL": true
    }
  },
  {
    id: "mens_casual_summer_sport_suit",
    cat: "clothing",
    name: "Men's Casual Summer Sport Suit Large Size Trendy Korean Style Loose-Fit Running Fitness Breathable Quick-Dry Tracksuit",
    price: 130,
    old: 0,
    rating: 4.7,
    emoji: "🏃",
    desc: "Stay cool and comfortable with this trendy Korean-style summer sport suit. Loose-fit, breathable, and quick-drying, perfect for running and fitness.",
    specs: {
        "General": {
            "Product Type": "Sport Suit",
            "Style": "Casual / Sport",
            "Gender": "Men",
            "Season": "Summer",
            "Fit Type": "Loose-Fit"
        },
        "Features": {
            "Breathable": "Yes",
            "Quick-Dry": "Yes",
            "Occasion": "Running, Fitness, Daily Wear"
        }
    },
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Summer%20Sport/white.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Summer%20Sport/black.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Summer%20Sport/3.jfif"
    ],
    colors: [
      { name: "White", hex: "#ffffff", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Summer%20Sport/white.jfif" },
      { name: "Black", hex: "#000000", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Summer%20Sport/black.jfif" }
    ]
  },
  {
    id: "mens_crossbody_bag",
    cat: "accessories",
    name: "Men's Crossbody Bag",
    price: 150,
    old: 0,
    rating: 4.8,
    emoji: "🎒",
    desc: "Multi-Functional, Large Capacity, Lightweight Anti-Theft Password Lock Shoulder Bag. Breathable, Durable, Adjustable Strap. Suitable for Daily Commute, Hiking, Camping, And More.",
    specs: {
      "General": {
        "Product Type": "Crossbody Bag",
        "Gender": "Men",
        "Style": "Casual / Sport",
        "Usage": "Daily Commute, Hiking, Camping",
        "Features": "Anti-Theft Password Lock, Large Capacity, Breathable, Durable"
      },
      "Dimensions": {
        "Size": "Standard",
        "Strap": "Adjustable"
      }
    },
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/1%20bag.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/2%20bag.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/3%20bag.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/4%20bag.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/5%20bag.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/6%20bag.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/7%20bag.jfif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/8%20bag.jfif"
    ],
    colors: [
      { name: "Black and Golden", hex: "#1a1a1a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/Men'S%20Crossbody%20Bag/1%20bag.jfif" }
    ]
  },
  {
    id: "waterproof_waist_bag",
    cat: "accessories",
    name: "Waterproof Mobile Waist Bag",
    price: 95,
    old: 0,
    rating: 4.7,
    emoji: "👜",
    desc: "Multifunctional Large Capacity Fanny Pack Anti Splash Wear-resistant Construction Site.",
    specs: {
      "General": {
          "Brand": "CEXIKA",
          "Model": "Mobile Waist Bag for Men Women",
          "Item Type": "Waist packs",
          "Style": "Casual",
          "Gender": "Unisex",
          "Safe": "High-concerned chemical: None"
      },
      "Material & Design": {
          "Main Material": "Oxford",
          "Composition": "Polyester",
          "Pattern Type": "Solid",
          "Shape": "Pillow"
      },
      "Dimensions & Origin": {
          "Item Length": "33cm",
          "Origin": "Mainland China",
          "Province": "Guangdong"
      }
    },
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/1%20banana.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/2%20banana.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/3%20banana.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/4%20banana.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/5%20banana.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/6%20banana.avif"
    ],
    colors: [
      { name: "Black", hex: "#1a1a1a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/1%20banana.avif" },
      { name: "Gray", hex: "#808080", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/bananabag/2%20banana.avif" }
    ]
  },
  {
    id: "milano_jacket",
    cat: "clothing",
    name: "Men's Casual Faux Fur Jacket with \"MILANO ITALIA\" Print",
    price: 550,
    old: 0,
    rating: 4.8,
    emoji: "🧥",
    video: "https://goods-vod.kwcdn.com/goods-video/0fa0e2ee3a36c58fed983d037dd1e5804f269eb6gs2CV.f30.mp4",
    desc: "Lightweight Hooded Outdoor Coat, Regular Fit, Pockets Included, Fabric, Perfect for Casual Wear.",
    specs: {
        "Product Details": {
            "Material": "Polyester",
            "Composition": "100% Polyester",
            "Details": "Pocket",
            "Collar Style": "Hooded",
            "Pattern": "Solid color",
            "Sheer": "No",
            "Fabric": "Slight Stretch",
            "Filler": "Polyester Fiber (polyester)",
            "Fit Type": "Regular",
            "Weaving Method": "Woven",
            "Style": "Casual",
            "Item ID": "NB4543728",
            "Origin": "Fujian,China"
        },
        "Sizes": {
            "Available Sizes": "M, L, XL, XXL, 3XL"
        },
        "Care Instructions": {
            "Operation Instruction": "Machine wash or professional dry clean"
        }
    },
    sizesAvailability: {
        "M": false,
        "L": false,
        "XL": false,
        "XXL": true,
        "3XL": false
    },
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/milano%20jacket%20black%201.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/black%202.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/black%203.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/black%204.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/black%205.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/khaki%201.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/kahki%202.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/khaki3.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/khaki4.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/khaki5.avif"
    ],
    colors: [
      { name: "Black", hex: "#000000", price: 550, img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/milano%20jacket%20black%201.avif" },
      { name: "Khaki", hex: "#C3B091", price: 579, img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/milanojacket/khaki%201.avif" }
    ]
  }
];

const SLIDES = [
  { tab:"electronics", kicker:"New Arrival", title:"Headphones that feel premium.",
    text:"ANC audio, wearables and power accessories—presented with a clean brand-store experience.",
    video: "https://www.dropbox.com/scl/fi/gg7ijijb9luakbe10s7ea/1770537466857.mp4?rlkey=0u4z2iv8pahppocuakddiqdqe&e=1&st=dt8cv1fw&raw=1",
    tiles:[]}
];

let globalDiscount = 0; // Discount State

function applyPromoCode() {
  const input = document.getElementById('promoInput');
  const btn = document.querySelector('.code-apply-btn');
  
  if(!input) return;
  const val = input.value.trim().toUpperCase();
  
  if(val === 'STYLE30' || val === 'LECOMAX26') {
    globalDiscount = 40;
    renderGrid(); // Re-render to show new prices
    
    // UI Feedback
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      APPLIED!
    `;
    btn.style.background = "#22c55e";
    btn.style.color = "#fff";
    input.setAttribute("disabled", "true");
    
    // Notification
    alert("Success! 40 MAD discount applied to all products.");
    
  } else {
    alert("Invalid Code. Please try 'STYLE30' or 'LECOMAX26'.");
    input.value = "";
    input.focus();
  }
}

window.activateGift = function() {
  globalDiscount = 40;
  renderGrid();
  
  const btn = document.querySelector('.listing-promo__btn');
  if(btn) {
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Offer Activated!
      `;
      btn.style.pointerEvents = 'none';
      btn.style.background = '#22c55e';
      btn.style.color = '#fff';
      if(window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
  
  // Show toast if available, else standard alert
  const msg = "Success! 40 MAD discount applied to all products.";
  if(window.showToast) window.showToast(msg);
  else alert(msg);
};

const state = { 
  filter:"all", 
  sort:"featured", 
  q:"", 
  priceRange:"all",
  ratingFilter:"all",
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

  // Initialize Language
  const savedLang = localStorage.getItem('lecomax_lang') || 'en';
  setLanguage(savedLang);
  
  const langBtn = $("#langBtn");
  const langMenu = $("#langMenu");
  if(langBtn && langMenu){
      // Set initial button text
      const initialText = savedLang === 'fr' ? 'Français' : savedLang === 'ar' ? 'العربية' : 'English';
      const textSpan = langBtn.querySelector(".chip__text");
      if(textSpan) textSpan.textContent = initialText;

      langBtn.addEventListener("click", () => {
        const show = !langMenu.classList.contains("show");
        langMenu.classList.toggle("show", show);
        langBtn.setAttribute("aria-expanded", String(show));
      });
      $$("#langMenu .dropdown__item").forEach(btn => btn.addEventListener("click", () => {
        const textSpan = langBtn.querySelector(".chip__text");
        if(textSpan) textSpan.textContent = btn.dataset.lang;
        else langBtn.innerText = btn.dataset.lang; 
        
        const langMap = { "English": "en", "Français": "fr", "العربية": "ar" };
        const selectedLang = langMap[btn.dataset.lang] || "en";
        setLanguage(selectedLang);
        
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
  
  // New filter event listeners
  if($("#productSearch")) $("#productSearch").addEventListener("input", (e) => { 
    state.q = e.target.value.trim(); 
    renderGrid(); 
  });
  if($("#priceRange")) $("#priceRange").addEventListener("change", (e) => { 
    state.priceRange = e.target.value; 
    renderGrid(); 
  });
  if($("#ratingFilter")) $("#ratingFilter").addEventListener("change", (e) => { 
    state.ratingFilter = e.target.value; 
    renderGrid(); 
  });
  if($("#searchBtn")) $("#searchBtn").addEventListener("click", () => {
    const searchInput = $("#productSearch");
    if(searchInput) {
      state.q = searchInput.value.trim();
      renderGrid();
    }
  });
  if($("#clearSearch")) $("#clearSearch").addEventListener("click", () => {
    const searchInput = $("#productSearch");
    if(searchInput) {
      searchInput.value = "";
      state.q = "";
      renderGrid();
    }
  });
  // Show/hide clear button based on input
  if($("#productSearch")) $("#productSearch").addEventListener("input", (e) => {
    const clearBtn = $("#clearSearch");
    if(clearBtn) {
      clearBtn.style.display = e.target.value.trim() ? "block" : "none";
    }
  });
  
  // View toggle
  $$(".view-btn").forEach(btn => btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    $$(".view-btn").forEach(b => b.classList.toggle("is-active", b.dataset.view === view));
    const grid = $("#grid");
    if(grid) {
      grid.classList.toggle("list-view", view === "list");
    }
  }));

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

      countUp();

      // Render products first so the page never looks empty even if the slider fails to load.
      renderGrid();
      renderTrending(); // New

      // Slider is optional (network image issues shouldn't break the whole page)
      try{
        initSlider();
        updateSlider();
        if(typeof resetAutoPlay === "function") resetAutoPlay();
      }catch(err){
        console.warn("Slider init failed:", err);
      }
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
    if(!panel) return;
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
  if(!track) return;
  track.innerHTML = SLIDES.map(s => {
    const isMedia = s.image || s.video;
    return `
    <div class="slide" ${isMedia ? `style="background: transparent; padding: 0; display: flex; flex-direction: column; gap: 24px; border: none; align-items: center;"` : ''}>
    ${s.video
       ? `<video src="${s.video}" autoplay loop muted playsinline></video>
            <div>
              <a href="#products" class="hero-cta">
                Shop Now
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>`
       : s.image 
       ? `<div style="position:relative; width:100%; height:100%">
            <img src="${s.image}" alt="${escapeHtml(s.title)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; border-radius: 26px; box-shadow: 0 18px 55px rgba(0,0,0,0.45);" />
            <!-- Overlay button removed -->
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
  `}).join("");

  // Remove dots since there's only one slide now
  const dots = $("#sliderDots");
  if(dots) dots.style.display = 'none';
}

function updateSlider(){
  const track = $("#sliderTrack");
  if(!track) return;
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
  if (state.q) list = list.filter(p => (p.name + " " + p.desc).toLowerCase().includes(state.q.toLowerCase()));
  
  // Price range filter
  if (state.priceRange !== "all") {
    const [min, max] = state.priceRange.includes("+") 
      ? [parseInt(state.priceRange), Infinity]
      : state.priceRange.split("-").map(Number);
    list = list.filter(p => p.price >= min && (max === Infinity || p.price <= max));
  }
  
  // Rating filter
  if (state.ratingFilter !== "all") {
    const minRating = parseFloat(state.ratingFilter.replace("+", ""));
    list = list.filter(p => p.rating >= minRating);
  }

  switch (state.sort){
    case "price_asc": list.sort((a,b)=>a.price-b.price); break;
    case "price_desc": list.sort((a,b)=>b.price-a.price); break;
    case "rating_desc": list.sort((a,b)=>b.rating-a.rating); break;
    case "name_asc": list.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "newest": list.sort((a,b)=>b.id.localeCompare(a.id)); break; // Assuming newer IDs are lexicographically larger
    default: list.sort((a,b)=> (b.rating-a.rating) || ((b.old>0)-(a.old>0)));
  }
  return list;
}


// renderGrid handled later by getCardHTML helper integration consistency

/* Quick Shop Logic */
window.qsState = { id: null, color: null, size: null };

window.openQuickShop = function(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  
  // Initial State: First available color, null size
  qsState.id = id;
  qsState.color = (p.colors && p.colors.length) 
                  ? (p.colors.find(c => !c.soldOut) || p.colors[0]) 
                  : null;
  qsState.size = null; 
  
  renderQuickShop();
  
  $("#modal").classList.add("show");
  $("#modal").setAttribute("aria-hidden","false");
};

window.setQsColor = function(name) {
  const p = PRODUCTS.find(x => x.id === qsState.id);
  if(!p) return;
  const c = p.colors.find(x => x.name === name);
  if(c) {
     qsState.color = c;
     qsState.size = null; 
     renderQuickShop();
  }
};

window.setQsSize = function(size) {
  qsState.size = size;
  renderQuickShop();
};

function renderQuickShop() {
  const p = PRODUCTS.find(x => x.id === qsState.id);
  if(!p) return;
  
  const color = qsState.color;
  const size = qsState.size;
  
  // Image
  const imgSrc = color ? color.img : (p.images ? p.images[0] : null);
  const imgHtml = imgSrc 
    ? `<img src="${imgSrc}" style="width:100%; height:100%; object-fit:contain;">`
    : `<div style="font-size:4rem">${p.emoji}</div>`;

  // Colors
  let colorHtml = "";
  if (p.colors && p.colors.length) {
      colorHtml = `
        <div style="margin-bottom:20px">
            <span class="qs-label" data-i18n="color">Color: <span>${color ? color.name : ''}</span></span>
            <div class="qs-colors">
               ${p.colors.map(c => {
                  const isSoldOut = c.soldOut;
                  return `
                  <button class="qs-color-btn ${(color && color.name === c.name) ? 'selected' : ''} ${isSoldOut ? 'sold-out' : ''}" 
                     onclick="${isSoldOut ? '' : `setQsColor('${escapeHtml(c.name)}')`}" 
                     style="background:${c.hex}; ${isSoldOut ? 'opacity:0.4; cursor:not-allowed; position:relative;' : ''}" 
                     title="${escapeHtml(c.name)}${isSoldOut ? ' (Sold Out)' : ''}">
                     ${isSoldOut ? '<span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; text-shadow:0 0 2px #000;">✕</span>' : ''}
                  </button>
               `}).join('')}
            </div>
        </div>
      `;
  }

  // Sizes logic
  let availableSizes = [];
  let disabledSizes = []; 
  
  if (color) {
      if (color.sizes) availableSizes = color.sizes;
      if (color.disabledSizes) disabledSizes = color.disabledSizes;
  } else if (p.sizes) {
      availableSizes = p.sizes; // fallback
  }

  // Fallback to global sizes if no color sizes
  if ((!availableSizes || availableSizes.length === 0) && p.specs && p.specs["Sizes"] && p.specs["Sizes"]["Available Sizes"]) {
      const sizeStr = p.specs["Sizes"]["Available Sizes"];
      availableSizes = sizeStr ? sizeStr.split(",").map(s => s.trim()).filter(Boolean) : [];
  }
  
  let sizeHtml = "";
  if(availableSizes && availableSizes.length > 0) {
      sizeHtml = `
        <div style="margin-bottom:24px">
             <span class="qs-label" data-i18n="size">Size: <span>${size || 'Select size'}</span></span>
            <div class="qs-sizes">
               ${availableSizes.map(s => {
                  const globalAvailable = (p.sizesAvailability || {})[s] !== false;
                  const localAvailable = !disabledSizes.includes(s);
                  const available = globalAvailable && localAvailable;

                  return `
                  <button onclick="${available ? `setQsSize('${s}')` : ''}" 
                     class="qs-size-btn ${size === s ? 'selected' : ''} ${!available ? 'disabled' : ''}"
                     ${!available ? 'disabled' : ''}
                     title="${s} ${!available ? '(Sold Out)' : ''}"
                     style="${!available ? 'opacity:0.5; position:relative; overflow:hidden;' : ''}">
                     ${s}
                     ${!available ? '<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center;"><div style="width:100%; height:1px; background:#999; transform:rotate(-45deg);"></div></div>' : ''}
                  </button>
               `}).join('')}
            </div>
        </div>
      `;
  }
  
  // Translations
  const t = TRANSLATIONS[localStorage.getItem('lecomax_lang') || 'en'] || TRANSLATIONS.en;
  const isRtl = document.documentElement.dir === 'rtl';

  $("#modalBody").innerHTML = `
    <div class="qs-grid">
       <div class="qs-image">
          ${imgHtml}
       </div>
       <div class="qs-details">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <div class="qs-cat">${label(p.cat)}</div>
            <div class="qs-rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                <span>${p.rating}</span>
            </div>
          </div>
          
          <h2 class="qs-title">${escapeHtml(p.name)}</h2>
          
          <div class="qs-price-row">
             <div class="qs-price">
                ${p.price}<small>MAD</small>
             </div>
             ${p.old ? `<span class="qs-old-price">${p.old} MAD</span>` : ''}
             ${p.old ? `<span class="qs-discount">-${Math.round((p.old - p.price)/p.old * 100)}%</span>` : ''}
          </div>

          ${colorHtml}
          ${sizeHtml}
          
          <div class="qs-actions">
             <button id="qsAddBtn" class="qs-btn btn--primary" style="box-shadow:0 10px 20px -5px var(--accent-glow)" ${ (availableSizes.length && !size) ? 'disabled' : '' }>
                ${ (availableSizes.length && !size) 
                    ? 'Select Size' 
                    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-${isRtl?'left':'right'}:6px"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> ${t.add_to_cart_btn || 'Add to Cart'}` }
             </button>
          </div>
          
          <div class="qs-trust">
              <div class="trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Secure Payment</span>
              </div>
              <div class="trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  <span>Fast Delivery</span>
              </div>
          </div>
          
          <div class="qs-desc">
             ${escapeHtml(p.desc)}
          </div>
       </div>
    </div>
  `;
  
  const btn = $("#qsAddBtn");
  if(btn && !btn.disabled) {
     btn.onclick = () => {
        // Validation just in case
        if (availableSizes.length && !size) return;
        
        const finalSize = size ? (color ? `${color.name} / ${size}` : size) : (color ? color.name : null);
        addToCart(qsState.id, 1, finalSize);
        closeAll();
        showToast("Added to Cart");
     };
  }
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

function getCartKey(id, size){
  return size ? `${id}__${size}` : id;
}

function parseCartKey(key){
  const parts = String(key).split("__");
  const id = parts.shift();
  const size = parts.length ? parts.join("__") : null;
  return { id, size };
}

function addToCart(id, qty = 1, size = null){
  const key = getCartKey(id, size);
  state.cart[key] = (state.cart[key] || 0) + qty;
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
         <strong style="font-size:0.95rem">${p.price} MAD</strong>
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

function changeQty(key, delta){
  const next = (state.cart[key] || 0) + delta;
  if (next <= 0) delete state.cart[key]; else state.cart[key] = next;
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
  wrap.innerHTML = entries.map(([key, qty]) => {
    const { id, size } = parseCartKey(key);
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return "";
    total += p.price * qty;
    return `
      <div class="cartItem">
        <div class="cartItem__top">
          <div class="cartItem__left">
            <div class="cartItem__thumb">
              ${p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${escapeHtml(p.name)}">` : ""}
            </div>
            <div class="cartItem__meta">
              <div class="cartItem__name">${escapeHtml(p.name)}</div>
              <div class="cartItem__sub">${label(p.cat)}${size ? ` • Size: ${size}` : ""}</div>
            </div>
          </div>
          <button class="cartItem__remove" data-del="${key}" aria-label="Remove">✕</button>
        </div>
        <div class="cartItem__bottom">
          <div class="qty">
            <button data-dec="${key}">−</button>
            <span>${qty}</span>
            <button data-inc="${key}">+</button>
          </div>
          <div class="cartItem__price">${p.price * qty} MAD</div>
        </div>
      </div>
    `;
  }).join("");

  $("#total").textContent = `${total} MAD`;
  $$("[data-del]").forEach(b => b.addEventListener("click", () => { delete state.cart[b.dataset.del]; save(); renderCart(); }));
  $$("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
  $$("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, +1)));
}

function checkout(){
  const entries = Object.entries(state.cart);
  if (!entries.length) return alert("Cart is empty.");
  window.location.href = "checkout.html";
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
  
  // Use stored current price or fallback to product base price
  // But wait, if we switch products, modalState.currentPrice needs reset. 
  // We handle that in openModal.
  const price = modalState.currentPrice || p.price; 
  
  const total = price * modalState.qty;
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

window.selectCardColor = function(e, btn, id, src) {
  if(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  // Add active class for visual feedback
  if(btn) {
    const p = btn.closest(".card__color-dots");
    if(p) p.querySelectorAll(".color-dot").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  // Prefer the closest card image to avoid selector mismatches
  let img = null;
  let imgWrap = null;
  if(btn) {
    const card = btn.closest(".card");
    if(card) {
      imgWrap = card.querySelector(".card__img");
      img = card.querySelector(".card__img .card-main-img");
    }
  }

  if(!imgWrap) imgWrap = document.getElementById(`card-img-${id}`);
  if(!img && imgWrap) img = imgWrap.querySelector(".card-main-img");
  if(!img) img = document.getElementById(`img-${id}`);

  if(imgWrap && imgWrap.sliderInterval) clearInterval(imgWrap.sliderInterval);
  if(img) img.src = src;
  if(imgWrap) imgWrap.onmouseenter = null; // Disable auto slide

  return false;
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
    // 1. Calculate Prices with optional Global Discount
    let finalPrice = p.price;
    let displayOld = p.old;
    let badgeHTML = "";

    if (globalDiscount > 0) {
        finalPrice = Math.max(0, p.price - globalDiscount);
        displayOld = p.price; 
        badgeHTML = `<div class="badge badge--sale" style="background:#22c55e">PROMO</div>`;
    } else {
        // Normal state
        const hasSale = !!(p.old && p.old > p.price);
        const discount = hasSale ? Math.round(((p.old - p.price)/p.old)*100) : 0;
        const isNew = (hashStr(p.id) % 3) === 0;
        
        if(hasSale) badgeHTML = `<div class="badge badge--sale">-${discount}%</div>`;
        else if(isNew) badgeHTML = `<div class="badge badge--new">New</div>`;
    }

    // Determine initial image
    let initImg = p.emoji;
    if(p.images && p.images.length > 0) {
       initImg = `<img src="${p.images[0]}" alt="${escapeHtml(p.name)}" class="card-main-img" id="img-${p.id}" style="width:100%; height:100%; object-fit:contain; padding:12px; transition: opacity 0.2s">`;
    }
    
    // Auto-scroll images logic (data attributes)
    const imgArray = p.images ? JSON.stringify(p.images).replaceAll('"', '&quot;') : "[]";

    return `
    <article class="card" onclick="openProductPage('${p.id}')" style="cursor:pointer">
      <div class="card__img" id="card-img-${p.id}" onmouseenter="startCardSlide('${p.id}')" onmouseleave="stopCardSlide('${p.id}')" data-images="${imgArray}" data-idx="0">
        ${badgeHTML}
        ${initImg}
        <div class="card__overlay-fav">
            <button class="fav-btn" onclick="event.stopPropagation(); toggleFav('${p.id}', this)" aria-label="Add to Wishlist" style="${state.favs.includes(p.id)? 'color:#ef4444' : ''}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${state.favs.includes(p.id)? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
        </div>
      </div>
      <div class="card__body">
         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
             <span class="card__category">${label(p.cat)}</span>
             <div class="card__rating-box">
                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                ${p.rating.toFixed(1)}
             </div>
         </div>

         <h3 class="card__title">${escapeHtml(p.name)}</h3>
     
        <div class="card__bottom">
            <div class="card__actions">
               <button class="btn-add-cart" onclick="event.stopPropagation(); openQuickShop('${p.id}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  <span>Add</span>
               </button>
               <button class="btn-icon-soft" onclick="event.stopPropagation(); openProductPage('${p.id}')" title="Quick View">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
               </button>
            </div>
            <div class="card__price">
                <div>${finalPrice} <span style="font-size:0.75em; font-weight:600; color:#64748b">MAD</span></div>
                ${displayOld ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:500; text-decoration:line-through;">${displayOld} MAD</div>` : ``}
            </div>
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
    
    // Explicitly show Milano Jacket + one other jacket
    const milano = PRODUCTS.find(p => p.id === "milano_jacket");
    const otherJackets = PRODUCTS.filter(p => p.name.toLowerCase().includes("jacket") && p.id !== "milano_jacket");
    
    let list = [];
    if(milano) list.push(milano);
    if(otherJackets.length > 0) list.push(otherJackets[0]); 
    
    // Fallback if not enough jackets
    if(list.length < 2) {
        list = PRODUCTS.slice(0, 2);
    }
    
    el.innerHTML = list.map(getCardHTML).join("");
}


window.selectModalColor = function(btn, src, name, price) {
  // Update visual
  $$(".p-color").forEach(x => x.classList.remove("selected"));
  if(btn) btn.classList.add("selected");
  
  // Update image
  const imgBox = $("#pmImage");
  const img = imgBox ? imgBox.querySelector("img") : null;
  if(img) img.src = src;
  
  // Scroll to image so user sees the change
  if(imgBox) {
      // Small timeout to allow UI to update if needed, though mostly synchronous
      setTimeout(() => {
        imgBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 10);
  }
  
  // Update Price
  if(price) {
      modalState.currentPrice = price;
      $("#pmPrice").textContent = `${price} MAD`;
      updateModalPrice(); 
  }
};

function openModal(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;

  modalState.id = id;
  modalState.qty = 1;
  $("#pmQty").textContent = "1";

  // Initial Price (handle color specific prices)
  let initPrice = p.price;
  if(p.colors && p.colors.length > 0 && p.colors[0].price) {
      initPrice = p.colors[0].price;
  }
  modalState.currentPrice = initPrice;

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
             <button class="p-color ${i===0?'selected':''}" style="--c:${c.hex}" 
               onclick="selectModalColor(this, '${c.img}', '${c.name}', ${c.price || p.price})" 
               title="${c.name}"></button>
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
  $("#pmPrice").textContent = `${initPrice} MAD`;
  updateModalPrice(); // Just in case, though qty is 1

  if(p.old > 0){
    $("#pmOldPrice").textContent = `${p.old} MAD`;
    $("#pmOldPrice").style.display = "inline";
    $("#pmDiscount").style.display = "inline-flex";
    const off = Math.round(((p.old - initPrice) / p.old) * 100);
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
  document.addEventListener('DOMContentLoaded', () => {
    setupBackToTop();
    setupSearchSuggestions();
    setupExtensions();
  });
} else {
  setupBackToTop();
  setupSearchSuggestions();
  setupExtensions();
}

function setupExtensions() {
  // 1. WhatsApp Float
  if(!document.querySelector('.whatsapp-float')) {
    const wa = document.createElement('a');
    wa.href = "https://wa.me/212600000000"; // Replace with real number
    wa.className = "whatsapp-float";
    wa.target = "_blank";
    wa.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
    document.body.appendChild(wa);
  }

  // 2. Social Proof Toast
  if(!document.querySelector('.sales-notification')) {
    const notif = document.createElement('div');
    notif.className = 'sales-notification';
    notif.innerHTML = `
      <img src="" class="sales-img" alt="">
      <button class="sales-notification-close" onclick="this.parentElement.classList.remove('active')">&times;</button>
      <div class="sales-notification-content">
        <div class="sales-notification-title">Someone in <span class="sales-city">Casablanca</span> bought</div>
        <div class="sales-notification-name">Product Name</div>
        <div class="sales-time">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
           Verified Purchase
        </div>
      </div>
    `;
    document.body.appendChild(notif);

    const cities = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fes", "Kenitra"];
    
    function showNotification() {
      const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      if(!p) return;
      
      const city = cities[Math.floor(Math.random() * cities.length)];
      const el = document.querySelector('.sales-notification');
      const img = (p.images && p.images.length) ? p.images[0] : '';
      
      el.querySelector('.sales-img').src = img;
      el.querySelector('.sales-city').textContent = city;
      el.querySelector('.sales-notification-name').textContent = p.name;
      
      el.classList.add('active');
      
      // Hide after 5s
      setTimeout(() => {
        el.classList.remove('active');
      }, 5000);
    }
    
    // Initial delay then loop
    setTimeout(() => {
        showNotification();
        setInterval(showNotification, 25000 + Math.random() * 10000); 
    }, 4000);
  }
}

function setupSearchSuggestions() {
  const input = document.getElementById('q');
  if (!input) return;
  
  const box = input.closest('.searchbox');
  let list = document.querySelector('.suggestion-list');
  
  if (!list) {
    list = document.createElement('div');
    list.className = 'suggestion-list';
    box.appendChild(list);
  }

  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (term.length < 2) {
      list.classList.remove('active');
      return;
    }

    const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(term));
    
    if (matches.length > 0) {
      list.innerHTML = matches.map(p => {
         const img = (p.images && p.images.length) ? p.images[0] : '';
         return `
        <a href="product.html?id=${p.id}" class="suggestion-item">
          <img src="${img}" class="suggestion-img" alt="${p.name}">
          <div class="suggestion-info">
            <div class="suggestion-name">${p.name}</div>
            <div class="suggestion-price">${p.price} MAD</div>
          </div>
        </a>
      `}).join('');
      list.classList.add('active');
    } else {
      list.innerHTML = `<div style="padding:12px; text-align:center; color:var(--muted); font-size:0.9rem;">No results found</div>`;
      list.classList.add('active');
    }
  });

  // Hide when clicking outside
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target)) {
      list.classList.remove('active');
    }
  });
}

// === Quick Shop Trigger for Trending Items ===
document.addEventListener('click', function(e) {
  // Check if click is on .trending__add-btn or inside it
  const btn = e.target.closest('.trending__add-btn');
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    
    // Try to find product ID from card
    const card = btn.closest('.trending__card');
    if (card && card.dataset.id) {
       if(window.openQuickShop) {
           window.openQuickShop(card.dataset.id);
       } else {
           console.error("openQuickShop not defined");
       }
    } else {
        // Fallback: Try to find by title matching
        const titleEl = card.querySelector('.trending__title-product');
        if(titleEl) {
            const title = titleEl.textContent.trim();
            const p = PRODUCTS.find(x => x.name === title);
            if(p && window.openQuickShop) {
                window.openQuickShop(p.id);
            }
        }
    }
  }
});