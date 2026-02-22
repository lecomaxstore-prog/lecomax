// === Trending Products Carousel Logic ===
(function() {
  const trendingRoot = document.querySelector('.trending');
  const track = document.querySelector('.trending__track');
  if (!track || !trendingRoot) return;
  const cards = Array.from(track.children);
  const leftBtn = document.querySelector('.trending__arrow--left');
  const rightBtn = document.querySelector('.trending__arrow--right');
  const dotsContainer = document.querySelector('.trending__dots');
  if (!leftBtn || !rightBtn || !dotsContainer || cards.length === 0) return;
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
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
      dot.onclick = () => goTo(i);
      dotsContainer.appendChild(dot);
    }
  }

  leftBtn.onclick = () => goTo(current - 1);
  rightBtn.onclick = () => goTo(current + 1);

  // Keyboard navigation
  trendingRoot.addEventListener('keydown', e => {
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

// === Hero Slider (Full-Width Banners) ===
(function() {
  const slider = document.querySelector('.slider');
  const track = document.getElementById('sliderTrack');
  const dots = document.getElementById('sliderDots');
  if (!slider || !track || !dots) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const slides = Array.from(track.children);
  if (slides.length <= 1) return;

  let index = 0;
  let autoTimer = null;
  const autoDelay = 5200;
  const swipeThreshold = 0.15; // 15% of slider width
  let isDragging = false;
  let startX = 0;
  let currentX = 0;

  function renderDots() {
    dots.innerHTML = slides
      .map((_, i) => `<button class="dotBtn${i === index ? ' is-active' : ''}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>`)
      .join('');
    dots.querySelectorAll('[data-slide]').forEach(btn => {
      btn.addEventListener('click', () => {
        index = Number(btn.dataset.slide);
        goTo(index, true);
      });
    });
  }

  function updateDots() {
    dots.querySelectorAll('.dotBtn').forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
    });
  }

  function goTo(i, userInitiated) {
    index = (i + slides.length) % slides.length;
    track.style.transition = 'transform .7s cubic-bezier(.2,.8,.2,1)';
    track.style.transform = `translateX(-${index * 100}%)`;
    updateDots();
    if (userInitiated) restartAuto();
  }

  function startAuto() {
    if (prefersReducedMotion) return;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      goTo(index + 1, false);
    }, autoDelay);
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function restartAuto() {
    stopAuto();
    startAuto();
  }

  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);

  slider.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    currentX = startX;
    track.style.transition = 'none';
    slider.setPointerCapture(e.pointerId);
    stopAuto();
  });

  slider.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    currentX = e.clientX;
    const dx = currentX - startX;
    const offsetPct = (dx / slider.clientWidth) * 100;
    track.style.transform = `translateX(${-(index * 100) + offsetPct}%)`;
  });

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    if (typeof e.pointerId === 'number' && slider.hasPointerCapture(e.pointerId)) {
      slider.releasePointerCapture(e.pointerId);
    }
    const dx = e.clientX - startX;
    const travel = Math.abs(dx) / slider.clientWidth;
    if (travel > swipeThreshold) {
      index = dx < 0 ? index + 1 : index - 1;
    }
    goTo(index, false);
    startAuto();
  }

  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1, true);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(index + 1, true);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  renderDots();
  goTo(0, false);
  startAuto();
})();
// Lecomax — premium brand-store UI (mega menus + hero slider + category places + product grid + cart)

// --- Product Image Zoom ---
function enableProductImageZoom() {
  const viewer = document.getElementById('imageViewer');
  if (viewer) return;

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
  // Product page uses modal viewer navigation on image click.
});
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const TRANSLATIONS = {
  en: {
    welcome_title: "Welcome to Lecomax",
    language_select: "Please select your preferred language",
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
    accessories: "Backpacks",
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
    hero_statement_title: "Graceful & Powerful",
    hero_statement_subtitle: "Discover the new standard of premium electronics and fashion.",
    hero_statement_cta: "Explore Collection",
    promo_shipping_title: "Free Shipping",
    promo_shipping_desc: "Free shipping on all products.",
    exclusive_stores: "Exclusive Stores",
    limited_offer: "Limited",
    technical_support: "Technical Support",
    fast: "Fast",
    order_summary: "Order Summary",
    copy_whatsapp: "Share your order instantly on WhatsApp.",
    cart_footer_text: "Secure checkout with instant order summary and WhatsApp confirmation option.",
    favorites: "Favorites",
    flash_deal: "Flash Deal",
    color: "Color",
    size: "Size",
    add_to_cart_btn: "Add to Cart",
    modal_warranty: "12 Months Warranty",
    modal_shipping: "Free Express Shipping",
    back_home: "Back to Home",
    verified_buyer: "Verified Buyer",
    quote_sarah: "“Fast delivery & great packaging.”",
    quote_karim: "“The categories make it super easy to shop.”",
    quote_omar: "“Looks premium and feels professional.”",
    trending: "Trending Now",
    trending_sub: "Top picks selected for you.",
    products_title: "Products",
    products_sub: "Search, filter, sort — then add to cart.",
    all: "All",
    view_all: "View all",
    quality: "QUALITY",
    best_prices: "BEST PRICES",
    fast_delivery: "FAST DELIVERY",
    official_warranty: "QUALITY",
    premium_support: "24/7 SUPPORT",
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
    clean_experience: "Clean, premium shopping experience.",
    choose_color: "Choose color:",
    choose_size: "Choose size:",
    wearables: "Wearables",
    power: "Power",
    gaming: "Gaming",
    feature_fast_desc: "",
    feature_warranty_desc: "",
    feature_support_desc: "",
    curated_collections: "Curated Collections",
    badge_top: "Top",
    badge_new: "New",
    badge_best: "Best",
    badge_hot: "Hot",
    cat_audio_desc: "ANC • Bass • Clear calls",
    cat_clothing_desc: "Premium basics • Streetwear",
    cat_shoes_desc: "Sneakers • Running • Classic",
    cat_backpacks_desc: "Daily carry • Travel ready",
    shop_electronics: "Shop Electronics",
    shop_clothing: "Shop Clothing",
    shop_shoes: "Shop Shoes",
    shop_backpacks: "Shop Backpacks",
    search_products_placeholder: "Search products...",
    filter_price_all: "All Prices",
    filter_price_under_200: "Under 200 MAD",
    filter_price_200_500: "200-500 MAD",
    filter_price_500_1000: "500-1000 MAD",
    filter_price_1000_plus: "Over 1000 MAD",
    filter_rating_all: "All Ratings",
    filter_rating_4_plus: "4+ Stars",
    filter_rating_4_5_plus: "4.5+ Stars",
    filter_rating_5: "5 Stars",
    sort_featured: "Featured",
    sort_price_low_high: "Price: Low to High",
    sort_price_high_low: "Price: High to Low",
    sort_rating_top: "Top Rated",
    sort_name_az: "Name: A-Z",
    sort_newest: "Newest",
    in_stock_only: "In-stock only",
    max_price: "Max Price",
    reset_filters: "Reset Filters",
    active_filters: "Active Filters",
    clear_all_filters: "Clear all",
    filter_search: "Search",
    filter_sort: "Sort",
    copy_filter_link: "Copy Filter Link",
    filters_link_copied: "Filter link copied",
    p_milano_jacket: "Men's Casual Faux Fur Jacket",
    p_casual_base_jacket: "Autumn Men's Casual Hoodie Baseball Jacket",
    p_hooded_jacket: "Men's Fashion Hooded Embroidered Warm Jacket",
    p_gaming_controller: "Interactive Screen Wireless Gaming Controller",
    p_running_shoes: "Baasploa Men's Lightweight Running Shoes",
    p_wireless_gaming_controller_v2: "Interactive Screen Wireless Gaming Controller",
    p_baasploa_running_shoes: "Baasploa Men's Lightweight Running Shoes",
    p_genai1: "Genai Wireless Earbuds",
    p_backpack_vacuum: "Vacuum Travel Backpack",
    p_casual_jacket_autumn: "Autumn Men's Casual Hoodie Baseball Jacket",
    p_hooded_warm_jacket_rust: "Men's Fashion Hooded Embroidered Warm Jacket",
    p_mens_casual_summer_sport_suit: "Men's Casual Summer Sport Suit",
    p_mens_crossbody_bag: "Men's Crossbody Bag",
    p_waterproof_waist_bag: "Waterproof Mobile Waist Bag",
    all_products: "All Products",
    careers: "Careers",
    live_agent: "Live Agent",
    notification_someone: "Someone in",
    notification_bought: "bought",
    notification_verified: "Verified Purchase",
    footer_desc: "Elevate your everyday with curated premium essentials. Experience the perfect blend of modern style and uncompromising quality, delivered directly to you.",
    address_city_country: "Sidi Bennour, Morocco",
    add_to_cart_caps: "ADD TO CART",
    btn_add: "Add",
    sold_out: "Sold Out",
    select_size: "Select Size"
  },
  fr: {
    welcome_title: "Bienvenue sur Lecomax",
    language_select: "Veuillez sélectionner votre langue préférée",
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
    accessories: "Maroquinerie & Sacs",
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
    hero_statement_title: "Gracieux & Puissant",
    hero_statement_subtitle: "Découvrez la nouvelle norme de l'électronique premium et de la mode.",
    hero_statement_cta: "Explorer la collection",
    promo_shipping_title: "Livraison Offerte",
    promo_shipping_desc: "Livraison gratuite sur tous les produits.",
    exclusive_stores: "Boutiques Exclusives",
    limited_offer: "Offre Limitée",
    technical_support: "Support Technique",
    fast: "Rapide",
    order_summary: "Récapitulatif",
    copy_whatsapp: "Partagez votre commande instantanément sur WhatsApp.",
    cart_footer_text: "Paiement sécurisé avec récapitulatif instantané et confirmation via WhatsApp.",
    favorites: "Favoris",
    flash_deal: "Vente Flash",
    color: "Couleur",
    size: "Taille",
    add_to_cart_btn: "Ajouter au panier",
    modal_warranty: "Garantie 12 Mois",
    modal_shipping: "Livraison Express Offerte",
    back_home: "Retour à l'accueil",
    verified_buyer: "Acheteur Vérifié",
    quote_sarah: "“Livraison rapide et emballage soigné.”",
    quote_karim: "“Les catégories rendent les achats très faciles.”",
    quote_omar: "“Une finition premium et un rendu professionnel.”",
    trending: "Tendances du moment",
    trending_sub: "Une sélection des meilleurs produits pour vous.",
    products_title: "Nos Produits",
    products_sub: "Recherchez, filtrez et trouvez votre bonheur.",
    all: "Tout",
    view_all: "Tout voir",
    quality: "QUALITÉ",
    best_prices: "MEILLEURS PRIX",
    fast_delivery: "LIVRAISON RAPIDE",
    official_warranty: "GARANTIE OFFICIELLE",
    premium_support: "SUPPORT 24/7",
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
    clean_experience: "Une expérience d'achat simple et élégante.",
    choose_color: "Choisir la couleur :",
    choose_size: "Choisir la taille :",
    wearables: "Objets Connectés",
    power: "Énergie & Charge",
    gaming: "Gaming",
    feature_fast_desc: "",
    feature_warranty_desc: "",
    feature_support_desc: "",
    curated_collections: "Collections Exclusives",
    badge_top: "Top",
    badge_new: "Nouveau",
    badge_best: "Meilleur",
    badge_hot: "Hot",
    cat_audio_desc: "ANC • Basses • Appels clairs",
    cat_clothing_desc: "Basiques Premium • Streetwear",
    cat_shoes_desc: "Baskets • Running • Classique",
    cat_backpacks_desc: "Quotidien • Voyage",
    shop_electronics: "Voir High-Tech",
    shop_clothing: "Voir Mode",
    shop_shoes: "Voir Chaussures",
    shop_backpacks: "Voir Sacs",
    search_products_placeholder: "Rechercher des produits...",
    filter_price_all: "Tous les prix",
    filter_price_under_200: "Moins de 200 MAD",
    filter_price_200_500: "200-500 MAD",
    filter_price_500_1000: "500-1000 MAD",
    filter_price_1000_plus: "Plus de 1000 MAD",
    filter_rating_all: "Tous les avis",
    filter_rating_4_plus: "4+ Étoiles",
    filter_rating_4_5_plus: "4.5+ Étoiles",
    filter_rating_5: "5 Étoiles",
    sort_featured: "Recommandés",
    sort_price_low_high: "Prix : croissant",
    sort_price_high_low: "Prix : décroissant",
    sort_rating_top: "Mieux notés",
    sort_name_az: "Nom : A-Z",
    sort_newest: "Nouveautés",
    in_stock_only: "En stock uniquement",
    max_price: "Prix max",
    reset_filters: "Réinitialiser",
    active_filters: "Filtres actifs",
    clear_all_filters: "Tout effacer",
    filter_search: "Recherche",
    filter_sort: "Tri",
    copy_filter_link: "Copier le lien filtre",
    filters_link_copied: "Lien des filtres copié",
    p_milano_jacket: "Veste Fausse Fourrure Casual Homme",
    p_casual_base_jacket: "Veste Baseball à Capuche Automne Homme",
    p_hooded_jacket: "Veste Chaude Brodée à Capuche Homme",
    p_gaming_controller: "Manette Sans Fil Écran Interactif",
    p_running_shoes: "Chaussures Running Légères Baasploa",
    p_wireless_gaming_controller_v2: "Manette de Jeu Sans Fil avec Écran Interactif",
    p_baasploa_running_shoes: "Chaussures de Running Légères Baasploa Homme",
    p_genai1: "Écouteurs Sans Fil Genai",
    p_backpack_vacuum: "Sac à Dos Voyage Compression Sous Vide",
    p_casual_jacket_autumn: "Veste Baseball à Capuche Automne Homme",
    p_hooded_warm_jacket_rust: "Veste Chaude Brodée à Capuche Homme",
    p_mens_casual_summer_sport_suit: "Ensemble Sport Été Décontracté Homme",
    p_mens_crossbody_bag: "Sac Bandoulière Homme",
    p_waterproof_waist_bag: "Banane Étanche Multifonction",
    all_products: "Tous les produits",
    careers: "Carrières",
    live_agent: "Agent en direct",
    notification_someone: "Quelqu'un à",
    notification_bought: "a acheté",
    notification_verified: "Achat Vérifié",
    footer_desc: "Élevez votre quotidien avec des essentiels haut de gamme. Découvrez le mélange parfait de style moderne et de qualité sans compromis, livré directement chez vous.",
    address_city_country: "Sidi Bennour, Maroc",
    add_to_cart_caps: "AJOUTER AU PANIER",
    btn_add: "Ajouter",
    sold_out: "Épuisé",
    select_size: "Choisir la taille"
  },
  ar: {
    welcome_title: "مرحباً بكم في Lecomax",
    language_select: "يرجى اختيار لغتكم المفضلة",
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
    accessories: "حقائب وإكسسوارات",
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
    hero_statement_title: "أناقة وقوة",
    hero_statement_subtitle: "اكتشف المعيار الجديد للإلكترونيات والأزياء الراقية.",
    hero_statement_cta: "استكشف المجموعة",
    promo_shipping_title: "شحن مجاني",
    promo_shipping_desc: "توصيل مجاني على جميع المنتجات.",
    exclusive_stores: "متاجرنا الحصرية",
    limited_offer: "عرض محدود",
    technical_support: "الدعم الفني",
    fast: "سريع",
    order_summary: "ملخص الطلب",
    copy_whatsapp: "شارك طلبك فوراً عبر واتساب.",
    cart_footer_text: "دفع آمن مع ملخص طلب فوري وخيار التأكيد عبر واتساب.",
    favorites: "المفضلة",
    flash_deal: "عرض خاطف",
    color: "اللون",
    size: "المقاس",
    add_to_cart_btn: "إضافة إلى السلة",
    modal_warranty: "ضمان لمدة 12 شهراً",
    modal_shipping: "شحن سريع ومجاني",
    back_home: "العودة للرئيسية",
    verified_buyer: "عميل موثق",
    quote_sarah: "“توصيل سريع وتغليف رائع.”",
    quote_karim: "“فئات المنتجات تجعل التسوق سهلاً للغاية.”",
    quote_omar: "“تجربة تسوق فاخرة تعكس الاحترافية.”",
    trending: "الأكثر رواجاً",
    trending_sub: "تشكيلة مميزة اخترناها لك.",
    products_title: "كتالوج المنتجات",
    products_sub: "تصفح، ابحث، واختر ما يناسبك.",
    all: "الكل",
    view_all: "عرض الجميع",
    quality: "جودة عالية",
    best_prices: "أفضل الأسعار",
    fast_delivery: "توصيل سريع",
    official_warranty: "ضمان رسمي",
    premium_support: "دعم على مدار الساعة",
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
    clean_experience: "تجربة تسوق سلسة وعصرية.",
    choose_color: "اختر اللون:",
    choose_size: "اختر المقاس:",
    wearables: "أجهزة قابلة للارتداء",
    power: "شواحن وطاقة",
    gaming: "ألعاب الفيديو",
    feature_fast_desc: "",
    feature_warranty_desc: "",
    feature_support_desc: "",
    curated_collections: "مجموعات مختارة",
    badge_top: "قمة",
    badge_new: "جديد",
    badge_best: "الأفضل",
    badge_hot: "رائج",
    cat_audio_desc: "عزل ضوضاء • صوت قوي • مكالمات واضحة",
    cat_clothing_desc: "أساسيات فاخرة • أزياء عصرية",
    cat_shoes_desc: "أحذية رياضية • ركض • كلاسيك",
    cat_backpacks_desc: "للاستخدام اليومي • للسفر",
    shop_electronics: "تسوق الإلكترونيات",
    shop_clothing: "تسوق الملابس",
    shop_shoes: "تسوق الأحذية",
    shop_backpacks: "تسوق الحقائب",
    search_products_placeholder: "البحث عن المنتجات...",
    filter_price_all: "كل الأسعار",
    filter_price_under_200: "أقل من 200 درهم",
    filter_price_200_500: "200-500 درهم",
    filter_price_500_1000: "500-1000 درهم",
    filter_price_1000_plus: "أكثر من 1000 درهم",
    filter_rating_all: "كل التقييمات",
    filter_rating_4_plus: "+4 نجوم",
    filter_rating_4_5_plus: "+4.5 نجوم",
    filter_rating_5: "5 نجوم",
    sort_featured: "مميز",
    sort_price_low_high: "السعر: من الأقل للأعلى",
    sort_price_high_low: "السعر: من الأعلى للأقل",
    sort_rating_top: "الأعلى تقييماً",
    sort_name_az: "الاسم: أ-ي",
    sort_newest: "الأحدث",
    in_stock_only: "المتوفر فقط",
    max_price: "أقصى سعر",
    reset_filters: "إعادة الضبط",
    active_filters: "الفلاتر النشطة",
    clear_all_filters: "مسح الكل",
    filter_search: "بحث",
    filter_sort: "الترتيب",
    copy_filter_link: "نسخ رابط الفلاتر",
    filters_link_copied: "تم نسخ رابط الفلاتر",
    p_milano_jacket: "جاكيت فرو صناعي كاجوال للرجال",
    p_casual_base_jacket: "جاكيت بيسبول بقلنسوة خريفي للرجال",
    p_hooded_jacket: "جاكيت دافئ مطرز بقلنسوة للرجال",
    p_gaming_controller: "وحدة تحكم ألعاب لاسلكية بشاشة تفاعلية",
    p_running_shoes: "أحذية ركض خفيفة الوزن للرجال من Baasploa",
    p_wireless_gaming_controller_v2: "وحدة تحكم ألعاب لاسلكية بشاشة تفاعلية",
    p_baasploa_running_shoes: "أحذية ركض خفيفة للرجال من باسبلوا",
    p_genai1: "سماعات أذن لاسلكية Genai",
    p_backpack_vacuum: "حقيبة ظهر للسفر مع ضغط تفريغ الهواء",
    p_casual_jacket_autumn: "جاكيت بيسبول خريفي بقلنسوة للرجال",
    p_hooded_warm_jacket_rust: "جاكيت دافئ مطرز بقلنسوة للرجال",
    p_mens_casual_summer_sport_suit: "بدلة رياضية صيفية كاجوال للرجال",
    p_mens_crossbody_bag: "حقيبة كتف للرجال مضادة للسرقة",
    p_waterproof_waist_bag: "حقيبة خصر مقاومة للماء",
    all_products: "كل المنتجات",
    careers: "وظائف",
    live_agent: "وكيل مباشر",
    notification_someone: "شخص في",
    notification_bought: "اشترى",
    notification_verified: "شراء موثق",
    footer_desc: "ارتقِ بيومك مع أساسيات متميزة ومختارة. استمتع بالمزيج المثالي بين الأسلوب العصري والجودة التي لا تقبل المساومة، وتصلك مباشرةً.",
    address_city_country: "سيدي بنور، المغرب",
    add_to_cart_caps: "إضافة إلى السلة",
    btn_add: "إضافة",
    sold_out: "نفذت الكمية",
    select_size: "اختر المقاس"
  }
};

function setLanguage(lang, save = true) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === 'ar';
  const HERO_IMAGES = {
    en: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/Hero%20Section%20lecomax.png",
    fr: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/hero%20section%20photo%20frensh%20version.png",
    ar: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/hero%20section%20photo%20arabic%20version.png"
  };
  
  // Update Direction
  document.documentElement.lang = lang;
  if (isArabic) {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.classList.add('rtl-active');
  } else {
    document.documentElement.removeAttribute('dir');
    document.documentElement.classList.remove('rtl-active');
  }

  // Update Live Agent links
  document.querySelectorAll('a[href*="customer-service"]').forEach(link => {
      if (lang === 'ar') link.href = 'customer-service-ar.html';
      else if (lang === 'fr') link.href = 'customer-service-fr.html';
      else link.href = 'customer-service.html';
  });

  // Update Checkout links in cart drawer etc.
  // Note: Most checkout transitions happen via JS (checkoutBtn), but if there are hardcoded links:
  $$('a[href*="checkout.html"]').forEach(link => {
       if (lang === 'ar') link.href = 'checkout-ar.html';
       else if (lang === 'fr') link.href = 'checkout-fr.html';
       else link.href = 'checkout.html';
  });

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

  // Update Hero Image by language
  const heroImage = document.querySelector('.hero-featured-image img');
  if (heroImage) {
    const heroSrc = HERO_IMAGES[lang] || HERO_IMAGES.en;
    if (heroImage.src !== heroSrc) {
      heroImage.src = heroSrc;
    }
  }

  // Save preference
  if (save) {
    localStorage.setItem('lecomax_lang', lang);
  }
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Global modal selection
window.selectInitialLang = function(lang) {
  setLanguage(lang, true);
  sessionStorage.setItem('lecomax_multilang_session', 'true');
  const modal = document.getElementById('language-modal');
  if(modal) {
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 500);
    syncOverlayLock();
  }
};

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
function getFakeReviews(productId, cat, lang='en', avgRating=4.8){
  const names = {
      en: ["Yassine", "Othman", "Hamza", "Sofiane", "Ilyas", "Mehdi", "Anas", "Walid", "Amine", "Karim", "Omar", "Badr", "Hassan", "Youssef", "Taha", "Saad"],
      fr: ["Yassine", "Othman", "Hamza", "Sofiane", "Ilyas", "Mehdi", "Anas", "Walid", "Amine", "Karim", "Omar", "Badr", "Hassan", "Youssef", "Taha", "Saad"],
      ar: ["ياسين", "عثمان", "حمزة", "سفيان", "إلياس", "مهدي", "أنس", "وليد", "أمين", "كريم", "عمر", "بدر", "حسن", "يوسف", "طه", "سعد"]
  };
  
  const tags = {
      en: ["Fast delivery", "Great quality", "Worth it", "Looks premium", "Perfect fit", "Super sound", "Very comfortable", "Good packaging", "Highly recommended", "Excellent service", "Just as described", "Amazing value"],
      fr: ["Livraison rapide", "Super qualité", "Vaut le coup", "Aspect premium", "Coupe parfaite", "Super son", "Très confortable", "Bon emballage", "Hautement recommandé", "Service excellent", "Conforme à la description", "Rapport qualité prix top"],
      ar: ["توصيل سريع", "جودة ممتازة", "يستحق الشراء", "مظهر فاخر", "مقاس مثالي", "صوت رائع", "مريح جداً", "تغليف جيد", "أنصح به بشدة", "خدمة ممتازة", "مطابق للوصف", "قيمة رائعة"]
  };

  const texts = {
    en: {
        electronics: [
          "Sound is clean and the bass is surprisingly strong. Battery is solid for daily use.",
          "Pairs quickly and calls are clear. The case feels premium for this price.",
          "Comfortable in the ear and stable. I use it every day for the gym.",
          "For the price, it's excellent. Noise isolation is good and volume is strong.",
          "Honestly better than my expensive ones. Connects instantly with my phone.",
          "The build quality is impressive, feels very durable and sleek.",
          "Microphone quality is great for calls, everyone hears me clearly.",
          "Game changer for my commute, blocks out noise effectively.",
		  "Good headphones but the charging cable was a bit short.",
		  "Decent sound quality, good for the price point.",
		  "Works well but sometimes connection toggles.",
		  "Not bad, fits my ears okay."
        ],
        clothing: [
          "Nice fabric and clean stitching. Fits well and looks expensive.",
          "Very comfortable and the size is accurate. Looks great in real life.",
          "Quality is better than expected. Perfect for daily wear.",
          "Great style and finishing. I will order another color.",
          "The material is soft and breathable, really enjoying wearing this.",
          "Was skeptical about the size but it fits perfectly. Very happy.",
          "Wash after wash it keeps its shape. High quality confirmed.",
          "Modern cut and feels very premium. Getting compliments on it.",
		  "Fabric is okay, but size runs a little small.",
		  "Good looking shirt, but wrinkles easily.",
		  "Material is decent, nothing too special but good value.",
		  "Fits okay, maybe order a size up next time."
        ],
        shoes: [
          "Very comfortable and lightweight. Looks great with casual outfits.",
          "Good grip and solid build. Great value for money.",
          "The design is clean and premium. Fits perfectly.",
          "Comfort level is excellent. I can wear it for hours.",
          "Sole is very supportive, my feet don't hurt anymore.",
          "Looks even better in person than in the photos. Very sleek.",
          "True to size and very airy, feet stay cool.",
          "Sturdy construction but surprisingly light on the foot.",
		  "Shoes look good but took a few days to break in.",
		  "Comfortable enough for walking, but maybe not running.",
		  "Decent pair of sneakers for the price.",
		  "Good style, sizing is slightly tight."
        ],
        accessories: [
          "Strong materials and a clean design. Perfect for everyday use.",
          "Looks premium and the zippers feel smooth. Very practical.",
          "Great size and comfortable to carry. Quality is top.",
          "Really stylish and well made. I recommend it.",
          "Fits all my essentials without looking bulky. Smart design.",
          "The texture of the material feels very high-end.",
          "Durable and handle seems strong. Expecting this to last.",
          "Minimalist design but very functional. Love it.",
		  "Useful item, but zipper can be a bit stiff.",
		  "Looks nice, holds what I need.",
		  "Good bag for the price, simple design.",
		  "Functional and sturdy enough for daily use."
        ]
    },
    fr: {
        electronics: [
          "Le son est net et les basses étonnamment puissantes. La batterie tient bien pour un usage quotidien.",
          "S'appaire rapidement et les appels sont clairs. Le boîtier fait premium pour ce prix.",
          "Confortable dans l'oreille et stable. Je l'utilise tous les jours pour le sport.",
          "Pour le prix, c'est excellent. L'isolation phonique est bonne et le volume puissant.",
          "Honnêtement meilleurs que mes écouteurs chers. Connexion instantanée avec mon téléphone.",
          "La qualité de fabrication est impressionnante, semble très durable.",
          "La qualité du micro est top pour les appels, on m'entend clairement.",
          "Change la donne pour mes trajets, bloque bien le bruit.",
		  "Bons écouteurs mais le câble est un peu court.",
		  "Qualité sonore correcte, bien pour le prix.",
		  "Marche bien mais parfois la connexion saute.",
		  "Pas mal, tient bien dans mes oreilles."
        ],
        clothing: [
          "Joli tissu et coutures propres. Taille bien et a l'air cher.",
          "Très confortable et la taille est précise. Rend super bien en vrai.",
          "La qualité est meilleure que prévu. Parfait pour tous les jours.",
          "Super style et finitions. Je vais commander une autre couleur.",
          "La matière est douce et respirante, vraiment agréable à porter.",
          "J'étais sceptique sur la taille mais ça tombe parfaitement. Très content.",
          "Lavage après lavage, ça garde sa forme. Qualité confirmée.",
          "Coupe moderne et sensation très premium. Je reçois des compliments.",
		  "Tissu correct, mais taille un peu petit.",
		  "Belle chemise, mais se froisse facilement.",
		  "Matière décente, rien de spécial mais bon rapport qualité prix.",
		  "Taille ok, peut-être prendre une taille au-dessus."
        ],
        shoes: [
          "Très confortable et léger. Super avec des tenues décontractées.",
          "Bonne adhérence et construction solide. Excellent rapport qualité/prix.",
          "Le design est épuré et premium. Taille parfaitement.",
          "Le niveau de confort est excellent. Je peux les porter pendant des heures.",
          "La semelle soutient bien, je n'ai plus mal aux pieds.",
          "Rend encore mieux en vrai que sur les photos. Très élégant.",
          "Fidèle à la taille et très aéré, les pieds restent au frais.",
          "Construction robuste mais étonnamment légère au pied.",
		  "Chaussures jolies mais il faut les faire quelques jours.",
		  "Assez confortables pour marcher, moins pour courir.",
		  "Paire correcte pour le prix.",
		  "Bon style, un peu serré au début."
        ],
        accessories: [
          "Matériaux solides et design épuré. Parfait pour un usage quotidien.",
          "Aspect premium et les fermetures éclair sont fluides. Très pratique.",
          "Super taille et confortable à porter. La qualité est top.",
          "Vraiment stylé et bien fait. Je le recommande.",
          "Contient tous mes essentiels sans faire encombrant. Design malin.",
          "La texture du matériau fait très haut de gamme.",
          "Durable et la poignée semble solide. Je m'attends à ce que ça dure.",
          "Design minimaliste mais très fonctionnel. J'adore.",
		  "Article utile, mais la fermeture est un peu dure.",
		  "Sympa, contient ce qu'il faut.",
		  "Bon sac pour le prix, design simple.",
		  "Fonctionnel et assez solide."
        ]
    },
    ar: {
        electronics: [
          "الصوت نقي والباس قوي بشكل مدهش. البطارية ممتازة للاستخدام اليومي.",
          "يقترن بسرعة والمكالمات واضحة. العلبة تبدو فاخرة بالنسبة لهذا السعر.",
          "مريح في الأذن وثابت. أستخدمه كل يوم في الجيم.",
          "بالنسبة للسعر، ممتاز. عزل الضوضاء جيد ومستوى الصوت قوي.",
          "بصراحة أفضل من سماعاتي الغالية. تتصل بسرعة بالهاتف.",
          "جودة التصنيع مبهرة، تبدو قوية وأنيقة جداً.",
          "جودة الميكروفون رائعة للمكالمات، الكل يسمعني بوضوح.",
          "غيرت تجربتي في المواصلات، تعزل الضجيج بشكل فعال.",
		  "سماعات جيدة لكن كابل الشحن قصير قليلاً.",
		  "جودة صوت مقبولة، جيدة بالنسبة للسعر.",
		  "تعمل بشكل جيد لكن أحياناً الاتصال يتقطع.",
		  "ليست سيئة، تناسب أذني جيداً."
        ],
        clothing: [
          "قماش جميل وخياطة نظيفة. المقاس مناسب ويبدو باهظ الثمن.",
          "مريح جداً والمقاس دقيق. يبدو رائعاً في الواقع.",
          "الجودة أفضل من المتوقع. مثالي للارتداء اليومي.",
          "تصميم وتشطيب رائع. سأطلب لوناً آخر.",
          "الخامة ناعمة وتسمح بالتنفس، ممتعة جداً في اللبس.",
          "كنت متردداً بخصوص المقاس لكنه جاء ممتازاً. سعيد جداً.",
          "بعد الغسيل يحافظ على شكله. جودة عالية مؤكدة.",
          "قصة عصرية وملمس فاخر. أتلقى إعجاباً عليها.",
		  "القماش مقبول، لكن المقاس صغير قليلاً.",
		  "قميص جميل، لكن يتجعد بسهولة.",
		  "الخامة عادية، ليست مميزة جداً لكنها قيمة جيدة.",
		  "المقاس مقبول، ربما أطلب أكبر المرة القادمة."
        ],
        shoes: [
          "مريح جداً وخفيف الوزن. يبدو رائعاً مع الملابس الكاجوال.",
          "ثبات جيد وبناء قوي. قيمة ممتازة مقابل المال.",
          "التصميم نظيف وفخم. يناسب تماماً.",
          "مستوى الراحة ممتاز. يمكنني ارتداؤه لساعات.",
          "النعل يدعم القدم بشكل جيد، لم أعد أشعر بألم.",
          "يبدو في الواقع أفضل من الصور. أنيق جداً.",
          "المقاس مضبوط وجيد التهوية، القدم تبقى باردة.",
          "بناء متين ولكنه خفيف بشكل مفاجئ على القدم.",
		  "الأحذية تبدو جيدة لكن تحتاج وقت لتصبح مريحة.",
		  "مريحة للمشي، لكن ربما ليست للجري.",
		  "زوج جيد من الأحذية بالنسبة للسعر.",
		  "ستايل جيد، المقاس ضيق قليلاً."
        ],
        accessories: [
          "مواد قوية وتصميم نظيف. مثالي للاستخدام اليومي.",
          "يبدو فاخراً والسحابات تعمل بسلاسة. عملي جداً.",
          "حجم ممتاز ومريح للحمل. الجودة عالية.",
          "أنيق حقاً ومصنوع بإتقان. أنصح به.",
          "يتسع لكل أغراضي دون أن يبدو ضخماً. تصميم ذكي.",
          "ملمس الخامة يوحي بالفخامة العالية.",
          "متين والمقبض يبدو قوياً. أتوقع أن يدوم طويلاً.",
          "تصميم بسيط ولكنه عملي جداً. أحببته.",
		  "غرض مفيد، لكن السحاب صلب قليلاً.",
		  "شكل جميل، يحمل ما أحتاجه.",
		  "حقيبة جيدة للسعر، تصميم بسيط.",
		  "عملية وقوية بما يكفي للاستخدام اليومي."
        ]
    }
  };

  const currentNames = names[lang] || names.en;
  const currentTags = tags[lang] || tags.en;
  const currentTexts = texts[lang] || texts.en;

  const rnd = pseudoRand(hashStr(productId));
  const list = [];
  // Randomly generate between 4 and 8 reviews for variation
  const count = 4 + Math.floor(rnd() * 5);
  
  // Use passed avgRating or default high
  const avg = (typeof avgRating !== 'undefined') ? avgRating : 4.8;
  
  for(let i=0;i<count;i++){
    let rating;
    let rVal = rnd(); // 0..1
    
    // Logic: 
    // If average is high (4.7+), mostly 5s (85%), some 4s (15%).
    // If average is mid (4.5), mixed 5s (60%), 4s (30%), 3s (10%).
    
    if (avg >= 4.7) {
        rating = (rVal > 0.15) ? 5 : 4; 
    } else if (avg >= 4.0) {
        if(rVal > 0.40) rating = 5;
        else if(rVal > 0.15) rating = 4;
        else rating = 3;
    } else {
        if(rVal > 0.60) rating = 5;
        else if(rVal > 0.30) rating = 4;
        else if(rVal > 0.10) rating = 3;
        else rating = 2;
    }

    const name = currentNames[Math.floor(rnd()*currentNames.length)];
    const tag = currentTags[Math.floor(rnd()*currentTags.length)];
    const tarr = currentTexts[cat] || currentTexts.electronics;
    const text = tarr[Math.floor(rnd()*tarr.length)];
    const daysAgo = 2 + Math.floor(rnd()*120);
    const d = new Date(Date.now() - daysAgo*24*3600*1000);
    const date = d.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"2-digit"});

    list.push({name, rating, tag, text, date});
  }
  return list;
}
function saveVariant(productId, data){
  try{ localStorage.setItem("lc_variant_"+productId, JSON.stringify(data)); }catch(e){}
}
function loadVariant(productId){
  try{ return JSON.parse(localStorage.getItem("lc_variant_"+productId)||"null"); }catch(e){ return null; }
}

function applyPsychologicalPriceMAD(rawPrice){
  const parsed = Math.floor(Number(rawPrice));
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  if (parsed % 10 === 9) return parsed;
  return Math.max(1, parsed - 1);
}

function applyPsychologicalPricingToProducts(products){
  if (!Array.isArray(products)) return;

  products.forEach((product) => {
    if (!product || typeof product !== "object") return;

    if (typeof product.price !== "undefined") {
      product.price = applyPsychologicalPriceMAD(product.price);
    }

    if (typeof product.old !== "undefined" && Number(product.old) > 0) {
      product.old = applyPsychologicalPriceMAD(product.old);
    }

    if (Array.isArray(product.colors)) {
      product.colors.forEach((color) => {
        if (color && typeof color.price !== "undefined") {
          color.price = applyPsychologicalPriceMAD(color.price);
        }
      });
    }
  });
}

window.applyPsychologicalPriceMAD = applyPsychologicalPriceMAD;

const PRODUCTS = [
  {
    id: "wireless_gaming_controller_v2",
    cat: "electronics",
    name: "Interactive Screen Wireless Gaming Controller",
    name_fr: "Manette de Jeu Sans Fil avec Écran Interactif",
    name_ar: "وحدة تحكم ألعاب لاسلكية بشاشة تفاعلية",
    price: 600,
    old: 0,
    rating: 5.0,
    emoji: "🎮",
    video: "https://goods-vod.kwcdn.com/goods-video/0aebee3d158c144c141ed5725db238e6a0325743.f30.mp4",
    desc: "Experience precision gaming with Hall Effect sticks and triggers that eliminate drift. This controller features an interactive screen, RGB lighting, and remappable buttons. Compatible with iOS, Switch, PC, Android, and Steam Deck. Includes an 1800mAh battery and charging dock. Note: Not Compatible with Xbox and PS5.",
    desc_fr: "Découvrez le jeu de précision avec des sticks et gâchettes à effet Hall qui éliminent le drift. Cette manette dispose d'un écran interactif, d'un éclairage RVB et de boutons remappables. Compatible avec iOS, Switch, PC, Android et Steam Deck. Inclut une batterie de 1800mAh et une station de charge. Remarque : Non compatible avec Xbox et PS5.",
    desc_ar: "استمتع بتجربة ألعاب دقيقة مع أذرع ومحفزات تأثير القاعة التي تقضي على الانحراف. تحتوي وحدة التحكم هذه على شاشة تفاعلية وإضاءة RGB وأزرار قابلة لإعادة التعيين. متوافق مع iOS و Switch و PC و Android و Steam Deck. تتضمن بطارية 1800 مللي أمبير وقاعدة شحن. ملاحظة: غير متوافق مع Xbox و PS5.",
    specs: {
        "General": {
            "Brand": "FIEHDUW",
            "Special Features": "Wireless",
            "Wireless Property": "wireless",
            "Components": "Contain Electronic Components/Motherboard"
        }
    },
    images: [
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/WirelessGamingController/1.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/WirelessGamingController/2.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/WirelessGamingController/3.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/WirelessGamingController/4.avif",
        "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/WirelessGamingController/5.avif"
    ],
    colors: [
         { name: "Black", hex: "#000000", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/WirelessGamingController/1.avif", sizes: [], disabledSizes: [] }
    ]
  },
  {
    id: "baasploa_running_shoes",
    cat: "shoes",
    name: "Baasploa Men's Lightweight Running Shoes",
    name_fr: "Chaussures de Running Légères Baasploa pour Homme",
    name_ar: "أحذية ركض خفيفة للرجال من باسبلوا",
    price: 250,
    old: 0,
    rating: 4.8,
    emoji: "👟",
    video: "https://goods-vod.kwcdn.com/goods-video/49ac0ebc85263ad26cc2bb9bd78ca2e8a291fd73.f30.mp4",
    desc: "Baasploa Men's lightweight running shoes, mesh shoes with lace-up style, outdoor sports tennis shoes, lightweight and breathable, suitable for daily wear.",
    desc_fr: "Chaussures de running légères pour hommes Baasploa, en maille avec laçage, chaussures de tennis pour sports de plein air, légères et respirantes, adaptées à un usage quotidien.",
    desc_ar: "أحذية ركض خفيفة للرجال من باسبلوا، أحذية شبكية برباط، أحذية تنس للرياضات الخارجية، خفيفة وقابلة للتنفس، مناسبة للاستخدام اليومي.",
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
    name_fr: "Écouteurs Sans Fil Genai",
    name_ar: "سماعات أذن لاسلكية Genai",
    price: 150, 
    old: 0, 
    rating: 5.0, 
    emoji: "🎧",
    desc: "Noise Cancellation for Calls, Dual Microphones, Automatic Pairing, Quick And Precise Connectivity, Long Standby Time of 5.4 Hours.",
    desc_fr: "Annulation du bruit pour les appels, double microphone, appairage automatique, connectivité rapide et précise, longue durée de veille de 5,4 heures.",
    desc_ar: "إلغاء ضوضاء للمكالمات، ميكروفون مزدوج، اقتران تلقائي، اتصال سريع ودقيق، وقت استعداد طويل يصل إلى 5.4 ساعات.",
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
    name_fr: "Sac à Dos de Voyage à Compression Sous Vide",
    name_ar: "حقيبة ظهر للسفر مع ضغط تفريغ الهواء",
    price: 1200,
    old: 1500,
    rating: 4.9,
    emoji: "🎒",
    desc: "Travel Backpack Vacuum Compression Laptop Backpack 43.18 cm Extended Large Capacity School Backpack Hiking Business Backpack.",
    desc_fr: "Sac à dos de voyage avec compression sous vide pour ordinateur portable 43,18 cm, grande capacité étendue, sac à dos scolaire, randonnée, affaires.",
    desc_ar: "حقيبة ظهر للسفر مع ضغط تفريغ الهواء للابتوب 43.18 سم، سعة كبيرة ممتدة، حقيبة مدرسية، للمشي لمسافات طويلة والأعمال.",
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
    id: "barcur_tr90_sunglasses",
    cat: "accessories",
    name: "BARCUR Design TR90 Sunglasses Men Polarized Light Weight Sports Sun Glasses Women Eyewear Accessory Oculos UVAB Protection",
    name_fr: "Lunettes de soleil BARCUR TR90 polarisees, legeres, sport, protection UVAB",
    name_ar: "نظارات شمس BARCUR TR90 مستقطبة وخفيفة للحماية من UVAB",
    price: 129,
    old: 0,
    rating: 4.8,
    emoji: "🕶️",
    video: "https://video.aliexpress-media.com/play/u/ae_sg_item/2215188288148/p/1/e/6/t/10301/1100193499213.mp4?from=chrome&definition=h265",
    desc: "Polarized TR90 sunglasses with UVAB protection, lightweight frame for daily and sport use.",
    desc_fr: "Lunettes TR90 polarisees avec protection UVAB, monture legere pour usage quotidien et sport.",
    desc_ar: "نظارات شمس TR90 مستقطبة مع حماية UVAB، إطار خفيف للاستخدام اليومي والرياضة.",
    images: [
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/BARCURDesignTR90/blue%20gray%201.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/BARCURDesignTR90/red%20gray%202.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/BARCURDesignTR90/3.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/BARCURDesignTR90/4.avif",
      "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/BARCURDesignTR90/5.avif"
    ],
    colors: [
      { name: "Blue Gray", hex: "#6b7c8a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/BARCURDesignTR90/blue%20gray%201.avif" },
      { name: "Red Gray", hex: "#8b5a5a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/BARCURDesignTR90/red%20gray%202.avif" }
    ]
  },
  {
    id: "casual_jacket_autumn",
    cat: "clothing",
    name: "Autumn Men's Casual Hoodie Baseball Jacket",
    name_fr: "Veste de Baseball à Capuche Décontractée pour Homme - Automne",
    name_ar: "جاكيت بيسبول بقلنسوة كاجوال خريفي للرجال",
    price: 350,
    old: 0,
    rating: 4.8,
    emoji: "🧥",
    desc: "Stylish embroidery and color blocking for a trendy youth look. Sizes available: XL, XXL.",
    desc_fr: "Broderie élégante et blocs de couleurs pour un look jeune et tendance. Tailles disponibles : XL, XXL.",
    desc_ar: "تطريز أنيق وتصميم ألوان متعددة لمظهر شبابي عصري. المقاسات المتوفرة: XL, XXL.",
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
      { name: "Black", hex: "#0b0b0b", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/1%20black%20.jpeg", soldOut: true },
      { name: "Rust", hex: "#b4532a", img: "https://raw.githubusercontent.com/lecomaxstore-prog/lecomax/refs/heads/main/images/casualjacket/1%20rust%20.jpeg", soldOut: true }
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
    name_fr: "Veste Chaude à Capuche Brodée Mode Homme",
    name_ar: "جاكيت دافئ بقلنسوة مطرز وعصري للرجال",
    price: 550,
    old: 0,
    rating: 4.8,
    emoji: "🧥",
    desc: "Non-stretch, long sleeve, single breasted jacket for daily and casual wear. Size available: XXL.",
    desc_fr: "Non extensible, manches longues, veste à simple boutonnage pour un usage quotidien et décontracté. Taille disponible : XXL.",
    desc_ar: "غير قابل للتمدد، أكمام طويلة، جاكيت بصدر واحد للاستخدام اليومي والكاجوال. المقاس المتوفر: XXL.",
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
    name_fr: "Ensemble Sport Été Décontracté Homme Grande Taille Style Coréen",
    name_ar: "بدلة رياضية صيفية كاجوال للرجال مقاس كبير نمط كوري",
    price: 130,
    old: 0,
    rating: 4.5,
    emoji: "🏃",
    desc: "Stay cool and comfortable with this trendy Korean-style summer sport suit. Loose-fit, breathable, and quick-drying, perfect for running and fitness.",
    desc_fr: "Restez au frais et à l'aise avec cet ensemble de sport d'été de style coréen tendance. Coupe ample, respirant et séchage rapide, parfait pour la course et le fitness.",
    desc_ar: "ابق باردًا ومرتاحًا مع هذه البدلة الرياضية الصيفية العصرية على الطراز الكوري. قصة واسعة، قابلة للتنفس، وسريعة الجفاف، مثالية للركض واللياقة البدنية.",
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
    name_fr: "Sac Bandoulière pour Homme",
    name_ar: "حقيبة كتف للرجال",
    price: 150,
    old: 0,
    rating: 4.8,
    emoji: "🎒",
    desc: "Multi-Functional, Large Capacity, Lightweight Anti-Theft Password Lock Shoulder Bag. Breathable, Durable, Adjustable Strap. Suitable for Daily Commute, Hiking, Camping, And More.",
    desc_fr: "Multifonctionnel, grande capacité, sac à bandoulière léger avec verrouillage par mot de passe antivol. Respirant, durable, sangle réglable. Convient pour les trajets quotidiens, la randonnée, le camping, et plus encore.",
    desc_ar: "متعددة الوظائف، سعة كبيرة، حقيبة كتف خفيفة الوزن مع قفل كلمة مرور ضد السرقة. قابلة للتنفس، متينة، حزام قابل للتعديل. مناسبة للتنقل اليومي، المشي لمسافات طويلة، التخييم، والمزيد.",
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
    name_fr: "Sac Banane Étanche pour Mobile",
    name_ar: "حقيبة خصر مقاومة للماء للجوال",
    price: 91,
    old: 0,
    rating: 4.7,
    emoji: "👜",
    desc: "Multifunctional Large Capacity Fanny Pack Anti Splash Wear-resistant Construction Site.",
    desc_fr: "Sac banane multifonctionnel grande capacité, anti-éclaboussures, résistant à l'usure, idéal pour les chantiers.",
    desc_ar: "حقيبة خصر متعددة الوظائف بسعة كبيرة، مضادة للرذاذ، مقاومة للاهتراء، مثالية لمواقع العمل.",
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
    name_fr: "Veste en Fausse Fourrure Décontractée Homme avec Imprimé \"MILANO ITALIA\"",
    name_ar: "جاكيت فرو صناعي كاجوال للرجال مع طباعة \"MILANO ITALIA\"",
    price: 550,
    old: 0,
    rating: 4.8,
    emoji: "🧥",
    video: "https://goods-vod.kwcdn.com/goods-video/0fa0e2ee3a36c58fed983d037dd1e5804f269eb6gs2CV.f30.mp4",
    desc: "Lightweight Hooded Outdoor Coat, Regular Fit, Pockets Included, Fabric, Perfect for Casual Wear.",
    desc_fr: "Manteau d'extérieur à capuche léger, coupe régulière, poches incluses, tissu, parfait pour une tenue décontractée.",
    desc_ar: "معطف خارجي بقلنسوة خفيف الوزن، قصة عادية، جيوب متضمنة، قماش، مثالي للارتداء اليومي.",
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
        "XL": true,
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

applyPsychologicalPricingToProducts(PRODUCTS);

const SLIDES = [
  { tab:"electronics", kicker:"New Arrival", title:"Headphones that feel premium.",
    text:"ANC audio, wearables and power accessories—presented with a clean brand-store experience.",
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
    showToast("Success! 40 MAD discount applied to all products.");
    
  } else {
    showToast("Invalid code. Try 'STYLE30' or 'LECOMAX26'.");
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
  maxPrice: Infinity,
  onlyInStock: false,
  cart: load("lc_cart_v2", {}), 
  favs: load("lc_favs_v2", []), 
  slideIndex:0, 
  heroTab:"electronics" 
};

const persistedFilters = load("lc_shop_filters_v1", {});
if (persistedFilters && typeof persistedFilters === "object") {
  state.filter = persistedFilters.filter || state.filter;
  state.sort = persistedFilters.sort || state.sort;
  state.q = persistedFilters.q || "";
  state.priceRange = persistedFilters.priceRange || state.priceRange;
  state.ratingFilter = persistedFilters.ratingFilter || state.ratingFilter;
  state.onlyInStock = !!persistedFilters.onlyInStock;
  state.maxPrice = Number.isFinite(Number(persistedFilters.maxPrice))
    ? Number(persistedFilters.maxPrice)
    : state.maxPrice;
}

function saveFilterPrefs(){
  save("lc_shop_filters_v1", {
    filter: state.filter,
    sort: state.sort,
    q: state.q,
    priceRange: state.priceRange,
    ratingFilter: state.ratingFilter,
    maxPrice: Number.isFinite(state.maxPrice) ? state.maxPrice : null,
    onlyInStock: !!state.onlyInStock
  });
  syncFiltersToUrl();
}

function syncFiltersToUrl(){
  if (!window.history || !window.URLSearchParams) return;
  const params = new URLSearchParams(window.location.search);

  const setParam = (key, value, fallback) => {
    if (value === undefined || value === null || value === "" || value === fallback) params.delete(key);
    else params.set(key, String(value));
  };

  setParam("cat", state.filter, "all");
  setParam("sort", state.sort, "featured");
  setParam("q", state.q, "");
  setParam("price", state.priceRange, "all");
  setParam("rating", state.ratingFilter, "all");
  setParam("stock", state.onlyInStock ? "1" : "", "");
  setParam("max", Number.isFinite(state.maxPrice) ? Math.round(state.maxPrice) : "", "");

  try {
    const view = localStorage.getItem("lc_shop_view_v1") || "grid";
    setParam("view", view, "grid");
  } catch (e) {}

  const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash || ""}`;
  window.history.replaceState({}, "", next);
}

function applyFiltersFromUrl(){
  if (!window.URLSearchParams) return;
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) return;

  const cat = params.get("cat");
  if (cat) state.filter = cat;

  const sort = params.get("sort");
  if (sort) state.sort = sort;

  const q = params.get("q");
  if (q !== null) state.q = q;

  const price = params.get("price");
  if (price) state.priceRange = price;

  const rating = params.get("rating");
  if (rating) state.ratingFilter = rating;

  const stock = params.get("stock");
  state.onlyInStock = stock === "1" || stock === "true";

  const max = Number(params.get("max"));
  if (Number.isFinite(max) && max > 0) state.maxPrice = max;

  try {
    const view = params.get("view");
    if (view === "grid" || view === "list") localStorage.setItem("lc_shop_view_v1", view);
  } catch (e) {}
}

applyFiltersFromUrl();

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

function ensureLanguageModal() {
  let modal = document.getElementById('language-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'language-modal';
  modal.className = 'lang-modal';
  modal.innerHTML = `
    <div class="lang-modal__content">
      <div class="lang-modal__header">
        <h2 class="lang-modal__title">Welcome • Bienvenue • مرحبا</h2>
        <p class="lang-modal__subtitle" data-i18n="language_select">Please select your preferred language<br>Veuillez choisir votre langue préférée<br>يرجى اختيار لغتكم المفضلة</p>
      </div>
      <div class="lang-modal__grid">
        <button class="lang-card" onclick="selectInitialLang('en')">
          <div class="lang-card__content">
            <img class="lang-card__flag" src="https://flagcdn.com/w80/us.png" alt="US" loading="lazy">
            <span class="lang-card__name">English</span>
          </div>
          <span class="lang-card__code">US</span>
        </button>
        <button class="lang-card" onclick="selectInitialLang('fr')">
          <div class="lang-card__content">
            <img class="lang-card__flag" src="https://flagcdn.com/w80/fr.png" alt="FR" loading="lazy">
            <span class="lang-card__name">Français</span>
          </div>
          <span class="lang-card__code">FR</span>
        </button>
        <button class="lang-card" onclick="selectInitialLang('ar')">
           <div class="lang-card__content">
            <img class="lang-card__flag" src="https://flagcdn.com/w80/ma.png" alt="MA" loading="lazy">
            <span class="lang-card__name">العربية</span>
          </div>
          <span class="lang-card__code">MA</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function init(){
  const yearEl = $("#year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Initialize Language
  const savedLang = localStorage.getItem('lecomax_lang');
  
  // Ensure modal exists
  let modal = document.getElementById('language-modal');
  if (!modal) {
     modal = ensureLanguageModal();
  }

  // Set language from saved preference or default to english
  if(savedLang) {
    setLanguage(savedLang);
  } else {
    setLanguage('en', false);
  }

  // Check if we already asked in this session
  const sessionAsked = sessionStorage.getItem('lecomax_multilang_session');

  if(sessionAsked) {
    if(modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        syncOverlayLock();
    }
  } else {
    // Show modal
    if(modal) {
       modal.style.display = 'flex'; 
       setTimeout(() => {
         modal.classList.add('show');
         syncOverlayLock();
       }, 50);
    }
  }
  
  
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

  const closeMobileNav = () => {
    const nav = $(".nav");
    const burger = $("#burger");
    if (nav) nav.classList.remove("open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-nav-open");
  };

  const closeMobileSearch = () => {
    const search = $(".search-container");
    const toggle = $("#toggleSearch");
    if (search) search.classList.remove("show");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-search-open");
  };

  if($("#burger")) {
      $("#burger").setAttribute("aria-expanded", "false");
      $("#burger").addEventListener("click", () => {
        const nav = $(".nav");
        if(!nav) return;

        const willOpen = !nav.classList.contains("open");
        nav.classList.toggle("open", willOpen);
        $("#burger").setAttribute("aria-expanded", willOpen ? "true" : "false");
        document.body.classList.toggle("mobile-nav-open", willOpen);
        if (willOpen) closeMobileSearch();
      });

      // Close nav when clicking any link inside it
      $$(".nav a").forEach(link => {
          link.addEventListener("click", () => {
              const nav = $(".nav");
              if (nav && nav.classList.contains("open")) {
                  closeMobileNav();
              }
          });
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

  if($("#sort")) $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; saveFilterPrefs(); renderGrid(); });
  
  // New filter event listeners
  if($("#productSearch")) $("#productSearch").addEventListener("input", (e) => { 
    state.q = e.target.value.trim(); 
    saveFilterPrefs();
    renderGrid(); 
  });
  if($("#priceRange")) $("#priceRange").addEventListener("change", (e) => { 
    state.priceRange = e.target.value; 
    saveFilterPrefs();
    renderGrid(); 
  });
  if($("#ratingFilter")) $("#ratingFilter").addEventListener("change", (e) => { 
    state.ratingFilter = e.target.value; 
    saveFilterPrefs();
    renderGrid(); 
  });

  const sortSelect = $("#sort");
  if (sortSelect) sortSelect.value = state.sort;

  if($("#priceRange")) $("#priceRange").value = state.priceRange;
  if($("#ratingFilter")) $("#ratingFilter").value = state.ratingFilter;
  if($("#productSearch")) {
    $("#productSearch").value = state.q;
    if($("#clearSearch")) $("#clearSearch").style.display = state.q ? "block" : "none";
  }
  $$("[data-filter-btn]").forEach(x => x.classList.toggle("is-active", x.dataset.filterBtn === state.filter));

  const stockToggle = $("#onlyInStock");
  if(stockToggle) {
    stockToggle.checked = !!state.onlyInStock;
    stockToggle.addEventListener("change", (e) => {
      state.onlyInStock = !!e.target.checked;
      saveFilterPrefs();
      renderGrid();
    });
  }

  const maxPriceInput = $("#maxPriceRange");
  const maxPriceValue = $("#maxPriceValue");
  if(maxPriceInput) {
    const catalogMax = Math.max(...PRODUCTS.map(p => Number(p.price) || 0), 0);
    const roundedMax = Math.max(100, Math.ceil(catalogMax / 50) * 50);
    maxPriceInput.max = String(roundedMax);

    if(!Number.isFinite(state.maxPrice) || state.maxPrice > roundedMax) {
      state.maxPrice = roundedMax;
    }

    maxPriceInput.value = String(state.maxPrice);

    const updateMaxPriceLabel = () => {
      if(maxPriceValue) maxPriceValue.textContent = `${Math.round(Number(maxPriceInput.value) || roundedMax)} MAD`;
    };

    updateMaxPriceLabel();
    maxPriceInput.addEventListener("input", updateMaxPriceLabel);
    maxPriceInput.addEventListener("change", () => {
      state.maxPrice = Number(maxPriceInput.value) || roundedMax;
      saveFilterPrefs();
      renderGrid();
    });
  }

  syncFilterControlsFromState();

  if($("#resetFilters")) $("#resetFilters").addEventListener("click", resetAllFilters);

  if($("#searchBtn")) $("#searchBtn").addEventListener("click", () => {
    const searchInput = $("#productSearch");
    if(searchInput) {
      state.q = searchInput.value.trim();
      saveFilterPrefs();
      renderGrid();
    }
  });
  if($("#clearSearch")) $("#clearSearch").addEventListener("click", () => {
    const searchInput = $("#productSearch");
    if(searchInput) {
      searchInput.value = "";
      state.q = "";
      saveFilterPrefs();
      renderGrid();
    }
  });

  if($("#copyFilterLink")) $("#copyFilterLink").addEventListener("click", async () => {
    syncFiltersToUrl();
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      const lang = localStorage.getItem('lecomax_lang') || 'en';
      const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
      showToast(t.filters_link_copied || "Filter link copied");
    } catch (e) {
      showToast(url);
    }
  });

  const activeChipsWrap = $("#activeFilterChips");
  if(activeChipsWrap) {
    activeChipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-chip-remove]");
      if(!btn) return;

      const key = btn.dataset.chipRemove;
      if(key === "all") {
        resetAllFilters();
        return;
      }

      if(key === "filter") state.filter = "all";
      if(key === "q") state.q = "";
      if(key === "priceRange") state.priceRange = "all";
      if(key === "ratingFilter") state.ratingFilter = "all";
      if(key === "onlyInStock") state.onlyInStock = false;
      if(key === "sort") state.sort = "featured";
      if(key === "maxPrice") {
        const maxInput = $("#maxPriceRange");
        state.maxPrice = maxInput ? (Number(maxInput.max) || 2000) : Infinity;
      }

      syncFilterControlsFromState();
      saveFilterPrefs();
      renderGrid();
    });
  }
  // Show/hide clear button based on input
  if($("#productSearch")) $("#productSearch").addEventListener("input", (e) => {
    const clearBtn = $("#clearSearch");
    if(clearBtn) {
      clearBtn.style.display = e.target.value.trim() ? "block" : "none";
    }
  });
  
  // View toggle (persisted)
  const storedShopView = (function(){
    try { return localStorage.getItem("lc_shop_view_v1") || "grid"; }
    catch (e) { return "grid"; }
  })();

  const applyShopView = (view) => {
    const safeView = view === "list" ? "list" : "grid";
    $$(".view-btn").forEach(b => b.classList.toggle("is-active", b.dataset.view === safeView));
    const grid = $("#grid");
    if(grid) grid.classList.toggle("list-view", safeView === "list");
    try { localStorage.setItem("lc_shop_view_v1", safeView); } catch (e) {}
  };

  applyShopView(storedShopView);
  $$(".view-btn").forEach(btn => btn.addEventListener("click", () => {
    applyShopView(btn.dataset.view);
  }));

  if($("#openCart")) $("#openCart").addEventListener("click", () => openDrawer(true));
  if($("#openFav")) $("#openFav").addEventListener("click", () => openFavDrawer(true));
  
  if($("#toggleSearch")) $("#toggleSearch").addEventListener("click", () => {
    const search = $(".search-container");
    if(search) {
        const willShow = !search.classList.contains("show");
        search.classList.toggle("show", willShow);
        $("#toggleSearch").setAttribute("aria-expanded", willShow ? "true" : "false");
        document.body.classList.toggle("mobile-search-open", willShow);

        if(willShow) {
           closeMobileNav();
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
          closeMobileSearch();
      }

      const inMobileNav = e.target.closest(".nav") || e.target.closest("#burger");
      if (!inMobileNav) closeMobileNav();
      
      const inLang = e.target.closest("#langBtn") || e.target.closest("#langMenu");
      if (!inLang && $("#langMenu") && $("#langBtn")) { $("#langMenu").classList.remove("show"); $("#langBtn").setAttribute("aria-expanded","false"); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAll();
      closeMobileSearch();
      closeMobileNav();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileSearch();
      closeMobileNav();
    }
  });

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
      syncStaticTrendingPrices();

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
  syncFilterControlsFromState();
  saveFilterPrefs();
  renderGrid();
}

function syncFilterControlsFromState(){
  if($("#sort")) $("#sort").value = state.sort;
  if($("#priceRange")) $("#priceRange").value = state.priceRange;
  if($("#ratingFilter")) $("#ratingFilter").value = state.ratingFilter;

  const searchInput = $("#productSearch");
  const clearBtn = $("#clearSearch");
  if(searchInput) searchInput.value = state.q || "";
  if(clearBtn) clearBtn.style.display = (state.q || "").trim() ? "block" : "none";

  const stockToggle = $("#onlyInStock");
  if(stockToggle) stockToggle.checked = !!state.onlyInStock;

  const maxInput = $("#maxPriceRange");
  const maxValue = $("#maxPriceValue");
  if(maxInput){
    const fullMax = Number(maxInput.max) || 2000;
    const safeMax = Number.isFinite(state.maxPrice) ? Math.min(state.maxPrice, fullMax) : fullMax;
    maxInput.value = String(Math.round(safeMax));
    if(maxValue) maxValue.textContent = `${Math.round(safeMax)} MAD`;
  }

  $$("[data-filter-btn]").forEach(x => x.classList.toggle("is-active", x.dataset.filterBtn === state.filter));
}

function resetAllFilters(){
  state.filter = "all";
  state.sort = "featured";
  state.q = "";
  state.priceRange = "all";
  state.ratingFilter = "all";
  state.onlyInStock = false;

  const maxInput = $("#maxPriceRange");
  if(maxInput) state.maxPrice = Number(maxInput.max) || 2000;
  else state.maxPrice = Infinity;

  syncFilterControlsFromState();
  saveFilterPrefs();
  renderGrid();
}

function getActiveFilterChips(){
  const lang = localStorage.getItem('lecomax_lang') || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const chips = [];

  if(state.filter !== "all") chips.push({ key: "filter", label: label(state.filter) });
  if((state.q || "").trim()) chips.push({ key: "q", label: `${t.filter_search || "Search"}: ${state.q}` });

  const priceSelect = $("#priceRange");
  if(state.priceRange !== "all") {
    const optionText = priceSelect?.selectedOptions?.[0]?.textContent?.trim() || state.priceRange;
    chips.push({ key: "priceRange", label: optionText });
  }

  const ratingSelect = $("#ratingFilter");
  if(state.ratingFilter !== "all") {
    const optionText = ratingSelect?.selectedOptions?.[0]?.textContent?.trim() || state.ratingFilter;
    chips.push({ key: "ratingFilter", label: optionText });
  }

  if(state.onlyInStock) chips.push({ key: "onlyInStock", label: t.in_stock_only || "In-stock only" });

  const maxInput = $("#maxPriceRange");
  const fullMax = Number(maxInput?.max) || 2000;
  if(Number.isFinite(state.maxPrice) && Math.round(state.maxPrice) < fullMax) {
    chips.push({ key: "maxPrice", label: `${t.max_price || "Max Price"}: ${Math.round(state.maxPrice)} MAD` });
  }

  const sortSelect = $("#sort");
  if(state.sort !== "featured") {
    const sortText = sortSelect?.selectedOptions?.[0]?.textContent?.trim() || state.sort;
    chips.push({ key: "sort", label: `${t.filter_sort || "Sort"}: ${sortText}` });
  }

  return chips;
}

function renderActiveFilterChips(){
  const wrap = $("#activeFilterChips");
  if(!wrap) return;

  const chips = getActiveFilterChips();
  if(!chips.length){
    wrap.classList.remove("is-visible");
    wrap.innerHTML = "";
    return;
  }

  const lang = localStorage.getItem('lecomax_lang') || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const heading = `<span class="chip-pill">${escapeHtml(t.active_filters || "Active Filters")}</span>`;
  const items = chips.map(chip => `
    <span class="chip-pill">
      ${escapeHtml(chip.label)}
      <button type="button" class="chip-pill__remove" data-chip-remove="${chip.key}" aria-label="Remove filter">✕</button>
    </span>
  `).join("");
  const clear = `<button type="button" class="chip-pill--clear" data-chip-remove="all">${escapeHtml(t.clear_all_filters || t.reset_filters || "Clear all")}</button>`;

  wrap.classList.add("is-visible");
  wrap.innerHTML = `${heading}${items}${clear}`;
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
  
  // Performance Optimization: If HTML already contains the slide (Server-Side/Static Rendered), 
  // don't overwrite it to prevent video reload/flicker.
  if (track.children.length > 0 && SLIDES.length === 1) {
     const dots = $("#sliderDots");
     if(dots) dots.style.display = 'none';
     return;
  }

  track.innerHTML = SLIDES.map(s => {
    const isMedia = s.image || s.video;
    return `
    <div class="slide" ${isMedia ? `style="background: transparent; padding: 0; display: flex; flex-direction: column; gap: 24px; border: none; align-items: center;"` : ''}>
    ${s.video
      ? `<video src="${s.video}" autoplay loop muted playsinline preload="auto"></video>
            <div>
              <a href="#products" class="hero-cta" data-i18n="shop_now">
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

  if (Number.isFinite(state.maxPrice)) {
    list = list.filter(p => p.price <= state.maxPrice);
  }

  if (state.onlyInStock) {
    list = list.filter(isProductInStock);
  }
  
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

function isProductInStock(product){
  if (!product || !Array.isArray(product.colors) || !product.colors.length) return true;
  return product.colors.some(color => !color.soldOut);
}


// renderGrid handled later by getCardHTML helper integration consistency

/* Quick Shop Logic */
window.qsState = { id: null, color: null, size: null, images: [], imageIndex: 0 };

window.openQuickShop = function(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  
  // Initial State: First available color, null size
  qsState.id = id;
  qsState.color = (p.colors && p.colors.length) 
                  ? (p.colors.find(c => !c.soldOut) || p.colors[0]) 
                  : null;
  qsState.size = null; 
  qsState.images = p.images || [];
  qsState.imageIndex = 0;
  
  renderQuickShop();
  
  $("#modal").classList.add("show");
  $("#modal").setAttribute("aria-hidden","false");
  syncOverlayLock();
};

window.setQsColor = function(name) {
  const p = PRODUCTS.find(x => x.id === qsState.id);
  if(!p) return;
  const c = p.colors.find(x => x.name === name);
  if(c) {
     qsState.color = c;
     qsState.size = null; 
     qsState.imageIndex = 0;
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
  
  // Image URL
  const imgSrc = color ? color.img : (qsState.images[qsState.imageIndex] || null);

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
                     title="${s} ${!available ? '(Sold Out)' : ''}">
                     ${s}
                  </button>
               `}).join('')}
            </div>
        </div>
      `;
  }
  
  // Translations
  const lang = localStorage.getItem('lecomax_lang') || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const pName = t["p_" + p.id] || p.name;
  const isRtl = document.documentElement.dir === 'rtl';
  const isSoldOut = !isProductInStock(p);

  // Details HTML separate
  const detailsHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <div class="qs-cat">${label(p.cat)}</div>
            <div class="qs-rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                <span>${p.rating}</span>
            </div>
          </div>
          
          <h2 class="qs-title">${escapeHtml(pName)}</h2>
          
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
             <button id="qsAddBtn" class="qs-btn" ${ isSoldOut ? 'disabled' : ((availableSizes.length && !size) ? 'disabled' : '') }>
                ${ isSoldOut 
                    ? (t.sold_out || 'Sold Out')
                    : ((availableSizes.length && !size) 
                        ? (t.select_size || 'Select Size') 
                        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-${isRtl?'left':'right'}:6px"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> ${t.add_to_cart_btn || 'Add to Cart'}`) }
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
             ${escapeHtml((lang === 'fr' && p.desc_fr) ? p.desc_fr : (lang === 'ar' && p.desc_ar) ? p.desc_ar : p.desc)}
          </div>
  `;

  // Partial Update Logic
  const modalBody = $("#modalBody");
  const existingQS = modalBody.querySelector('.qs-grid');
  const existingTitle = modalBody.querySelector('.qs-title');
  const isSameProduct = existingQS && existingTitle && existingTitle.textContent === p.name;


  if (isSameProduct) {
     // Update Details
     const dp = modalBody.querySelector('.qs-details');
     if(dp) dp.innerHTML = detailsHtml;

     // Smooth Image Update
     const imgContainer = modalBody.querySelector('.qs-image');
     const currentImg = imgContainer ? imgContainer.querySelector('img') : null;
     
     if(imgSrc) {
       if(!currentImg) {
          if(imgContainer) imgContainer.innerHTML = `<img src="${imgSrc}" style="width:100%; height:100%; object-fit:contain; transition: opacity 0.4s ease;">`;
       } else if(currentImg.src !== imgSrc && !currentImg.src.endsWith(imgSrc)) {
           // Transition
           currentImg.style.transition = 'opacity 0.4s ease'; 
           currentImg.style.opacity = '0';
           setTimeout(() => {
                currentImg.src = imgSrc;
                currentImg.style.opacity = '1';
           }, 200);
       }
     } else {
        if(imgContainer) imgContainer.innerHTML = `<div style="font-size:4rem">${p.emoji}</div>`;
     }

  } else {
     // Full Render
     const hasMultipleImages = qsState.images.length > 1;
     const arrowsHtml = hasMultipleImages ? `
  <button class="qs-arrow left" onclick="qsPrevImage()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
  </button>
  <button class="qs-arrow right" onclick="qsNextImage()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
  </button>
` : '';
     const imgHtml = imgSrc 
       ? `<img src="${imgSrc}" style="width:100%; height:100%; object-fit:contain; transition: opacity 0.4s ease;">`
       : `<div style="font-size:4rem">${p.emoji}</div>`;

     modalBody.innerHTML = `
        <div class="qs-grid">
           <div class="qs-image">
              ${imgHtml}${arrowsHtml}
           </div>
           <div class="qs-details">
              ${detailsHtml}
           </div>
        </div>
     `;
  }
  
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

function qsNextImage() {
  if (!qsState.images || qsState.images.length <= 1) return;
  qsState.imageIndex = (qsState.imageIndex + 1) % qsState.images.length;
  updateQSImage();
}

function qsPrevImage() {
  if (!qsState.images || qsState.images.length <= 1) return;
  qsState.imageIndex = (qsState.imageIndex - 1 + qsState.images.length) % qsState.images.length;
  updateQSImage();
}

function updateQSImage() {
  const img = modalBody.querySelector('.qs-image img');
  if (img && qsState.images[qsState.imageIndex]) {
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = qsState.images[qsState.imageIndex];
      img.style.opacity = '1';
    }, 200);
  }
}

function openDrawer(show){
  const d = $("#drawer");
  if(d) {
    d.classList.toggle("show", show);
    d.setAttribute("aria-hidden", String(!show));
    syncOverlayLock();
  }
}

function syncOverlayLock(){
  const hasOverlay = !!(
    $("#drawer.show") ||
    $("#favDrawer.show") ||
    $("#modal.show") ||
    $("#productModal.is-open") ||
    $("#language-modal.show")
  );
  document.body.classList.toggle("overlay-open", hasOverlay);
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
  syncOverlayLock();
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
    syncOverlayLock();
  }
}

function renderFavs(){
  const wrap = $("#favItems");
  if(!wrap) return;
  
  const list = state.favs.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  
  if (!list.length){
    wrap.innerHTML = `
      <div class="favEmpty" role="status" aria-live="polite" style="margin:auto 0; min-height:55%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:28px 18px; border:1px dashed rgba(15,23,42,0.12); border-radius:20px; background:linear-gradient(180deg, rgba(248,250,252,0.9), rgba(255,255,255,0.96));">
        <div class="favEmpty__icon" aria-hidden="true" style="width:68px; height:68px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-size:1.9rem; color:rgba(15,23,42,0.22); background:rgba(15,23,42,0.04); margin-bottom:14px;">❤</div>
        <p class="favEmpty__title" style="margin:0; font-size:1.65rem; font-weight:800; letter-spacing:-0.02em; color:var(--text);">No favorites yet.</p>
        <p class="favEmpty__text" style="margin:10px 0 0; max-width:30ch; color:var(--muted); line-height:1.6;">Tap the heart on any product to save it here.</p>
        <button onclick="closeAll()" class="btn btn--ghost btn--small favEmpty__btn" style="margin-top:18px; min-height:44px; padding:0 18px; border-radius:999px; font-weight:700;">Discover Products</button>
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
  if (!entries.length) {
    showToast("Your cart is empty.");
    return;
  }
  
  const lang = localStorage.getItem('lecomax_lang') || 'en';
  let target = 'checkout.html';
  if(lang === 'ar') target = 'checkout-ar.html';
  else if(lang === 'fr') target = 'checkout-fr.html';

  window.location.href = target;
}

function openSuccessModal() {
  showToast("Order placed. Your summary is copied—send it on WhatsApp to complete purchase.");
  // const m = document.getElementById("successModal");
  // if(m) m.classList.add("active");
}
window.closeSuccessModal = function() {
  // const m = document.getElementById("successModal");
  // if(m) m.classList.remove("active");
}

function label(cat){
  const lang = localStorage.getItem('lecomax_lang') || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  if (cat === "electronics") return t.electronics;
  if (cat === "clothing") return t.clothing;
  if (cat === "shoes") return t.shoes;
  if (cat === "accessories") return t.backpacks;
  return t.all;
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
    // Translation Setup
    const lang = localStorage.getItem('lecomax_lang') || 'en';
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const pName = t["p_" + p.id] || p.name;
    const isSoldOut = !isProductInStock(p);
    const addBtnText = isSoldOut ? (t["sold_out"] || "Sold Out") : (t["btn_add"] || "Add");

    // 1. Calculate Prices with optional Global Discount
    let finalPrice = p.price;
    let displayOld = p.old;
    let badgeHTML = "";

    if (globalDiscount > 0) {
        finalPrice = Math.max(0, p.price - globalDiscount);
        displayOld = p.price; 
        badgeHTML = `<div class="card-badge card-badge--sale" style="background:#22c55e">PROMO</div>`;
    } else {
        // Normal state
        const hasSale = !!(p.old && p.old > p.price);
        const discount = hasSale ? Math.round(((p.old - p.price)/p.old)*100) : 0;
        const isNew = (hashStr(p.id) % 3) === 0;
        
        if(isSoldOut) badgeHTML = `<div class="card-badge card-badge--soldout" style="background:#ef4444">Sold Out</div>`;
        else if(hasSale) badgeHTML = `<div class="card-badge card-badge--sale">-${discount}%</div>`;
        else if(isNew) badgeHTML = `<div class="card-badge card-badge--new">New</div>`;
    }

    // Determine initial image
    let initImg = p.emoji;
    if(p.images && p.images.length > 0) {
       initImg = `<img src="${p.images[0]}" alt="${escapeHtml(pName)}" class="card-main-img" id="img-${p.id}" style="width:100%; height:100%; object-fit:contain; padding:12px; transition: opacity 0.2s">`;
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

         <h3 class="card__title">${escapeHtml(pName)}</h3>
     
        <div class="card__bottom">
            <div class="card__actions">
               <button class="btn-add-cart" onclick="event.stopPropagation(); ${isSoldOut ? '' : `openQuickShop('${p.id}')`}" ${isSoldOut ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  <span>${addBtnText}</span>
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
  renderActiveFilterChips();

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

function extractMadNumber(text) {
  const match = String(text || "").match(/\d+/);
  return match ? Number(match[0]) : NaN;
}

function syncStaticTrendingPrices() {
  const cards = $$(".trending__card[data-id]");
  if (!cards.length) return;

  cards.forEach((card) => {
    const product = PRODUCTS.find((p) => p.id === card.dataset.id);
    const newEl = card.querySelector(".trending__price-new");
    const oldEl = card.querySelector(".trending__price-old");

    if (newEl) {
      const nextPrice = product
        ? product.price
        : applyPsychologicalPriceMAD(extractMadNumber(newEl.textContent));
      if (Number.isFinite(nextPrice) && nextPrice > 0) {
        newEl.textContent = `${nextPrice} MAD`;
      }
    }

    if (oldEl) {
      const fallbackOld = extractMadNumber(oldEl.textContent);
      const baseOld = product && product.old > 0 ? product.old : fallbackOld;
      const adjustedOld = applyPsychologicalPriceMAD(baseOld);
      const currentNew = newEl ? extractMadNumber(newEl.textContent) : NaN;

      if (Number.isFinite(adjustedOld) && adjustedOld > 0 && (!Number.isFinite(currentNew) || adjustedOld > currentNew)) {
        oldEl.textContent = `${adjustedOld} MAD`;
        oldEl.style.display = "";
      } else {
        oldEl.style.display = "none";
      }
    }
  });
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

  // Translation
  const lang = localStorage.getItem('lecomax_lang') || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const pName = t["p_" + p.id] || p.name;

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
  $("#pmTitle").textContent = pName;
  $("#pmDesc").textContent = p.desc || "Premium quality product designed for your lifestyle. Durable materials, modern aesthetic, and built to last.";
  
  // Image Handling
  const imgBox = $("#pmImage");
  imgBox.innerHTML = ""; // Clear previous content (text or img)
  imgBox.style.transform = ""; // Reset transform

  if (p.images && p.images.length > 0) {
      // Main Image
      imgBox.innerHTML = `<img src="${p.images[0]}" alt="${escapeHtml(pName)}" style="width:100%; height:100%; object-fit:contain; border-radius:12px; display:block;">`;
      
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
  syncOverlayLock();
}


/* Legacy modal override removed to allow full page navigation */


/* Back to Top Logic */
function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  let hideTimer = null;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('show');
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        btn.classList.remove('show');
      }, 700);
    } else {
      if (hideTimer) clearTimeout(hideTimer);
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

function applyImageOptimizations(root = document) {
  const images = root.querySelectorAll ? root.querySelectorAll('img') : [];
  images.forEach((img, index) => {
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
    if (!img.hasAttribute('loading')) {
      const isPriorityImage = !!img.closest('.slider, .hero, .heroBanner, .product-hero');
      img.setAttribute('loading', isPriorityImage && index < 2 ? 'eager' : 'lazy');
    }
  });

  const firstVisual = root.querySelector
    ? root.querySelector('.slider img, .hero img, .heroBanner img, .product-hero img, .trending__img')
    : null;
  if (firstVisual && !firstVisual.hasAttribute('fetchpriority')) {
    firstVisual.setAttribute('fetchpriority', 'high');
  }
}

function secureExternalLinks() {
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = (link.getAttribute('rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!rel.includes('noopener')) rel.push('noopener');
    if (!rel.includes('noreferrer')) rel.push('noreferrer');
    link.setAttribute('rel', rel.join(' '));
  });
}

function setupDynamicEnhancements() {
  if (window.__lecomaxEnhancementsReady) return;
  window.__lecomaxEnhancementsReady = true;

  applyImageOptimizations(document);
  secureExternalLinks();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches && node.matches('img')) {
          applyImageOptimizations(node.parentElement || document);
        } else if (node.querySelector) {
          applyImageOptimizations(node);
        }
      }
    }
    secureExternalLinks();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupDynamicEnhancements();
    setupBackToTop();
    setupSearchSuggestions();
    setupExtensions();
  });
} else {
  setupDynamicEnhancements();
  setupBackToTop();
  setupSearchSuggestions();
  setupExtensions();
}

function setupExtensions() {
  // 1. WhatsApp Float removed

  // 2. Social Proof Toast
  if(!document.querySelector('.sales-notification')) {
    const notif = document.createElement('div');
    notif.className = 'sales-notification';
    notif.innerHTML = `
      <button class="sales-notification-close" onclick="this.parentElement.classList.remove('active')">&times;</button>
      <img src="" class="sales-img" alt="" loading="lazy" decoding="async">
      <div class="sales-notification-content">
        <div class="sales-notification-title">
           <span data-i18n="notification_someone">Someone in</span> 
           <span class="sales-city">Casablanca</span> 
           <span data-i18n="notification_bought">bought</span>
        </div>
        <div class="sales-notification-name">Product Name</div>
        <div class="sales-time">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
           <span data-i18n="notification_verified">Verified Purchase</span>
        </div>
      </div>
    `;
    document.body.appendChild(notif);

    const cities = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fes", "Kenitra"];
    const cityTranslations = {
        "Casablanca": { ar: "الدار البيضاء", fr: "Casablanca" },
        "Rabat": { ar: "الرباط", fr: "Rabat" },
        "Marrakech": { ar: "مراكش", fr: "Marrakech" },
        "Tanger": { ar: "طنجة", fr: "Tanger" },
        "Agadir": { ar: "أكادير", fr: "Agadir" },
        "Fes": { ar: "فاس", fr: "Fès" },
        "Kenitra": { ar: "القنيطرة", fr: "Kénitra" }
    };
    
    function showNotification() {
      const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      if(!p) return;
      
      const rawCity = cities[Math.floor(Math.random() * cities.length)];
      const lang = document.documentElement.lang || 'en';
      let displayCity = rawCity;

      if (lang === 'ar' && cityTranslations[rawCity] && cityTranslations[rawCity].ar) {
          displayCity = cityTranslations[rawCity].ar;
      } else if (lang === 'fr' && cityTranslations[rawCity] && cityTranslations[rawCity].fr) {
          displayCity = cityTranslations[rawCity].fr;
      }

      const el = document.querySelector('.sales-notification');
      const img = (p.images && p.images.length) ? p.images[0] : '';
      
      // Get translated product name if available
      const t = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]) ? TRANSLATIONS[lang] : (typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS.en : {});
      const pName = (t && t["p_" + p.id]) ? t["p_" + p.id] : p.name;

      el.querySelector('.sales-img').src = img;
      el.querySelector('.sales-img').alt = pName;
      el.querySelector('.sales-city').textContent = displayCity;
      el.querySelector('.sales-notification-name').textContent = pName;
      
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
          <img src="${img}" class="suggestion-img" alt="${p.name}" loading="lazy" decoding="async">
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

// Hero video loading enhancement
(function() {
  const heroVideo = document.querySelector('.hero-video');
  const slide = document.querySelector('.slide--hero-video');
  const playBtn = document.querySelector('.hero-video__play-btn');
  
  if (heroVideo && slide && playBtn) {
    slide.classList.add('loading');
    
    // Function to update play button visibility
    function updatePlayButton() {
      if (heroVideo.paused || heroVideo.ended || window.innerWidth <= 768) {
        playBtn.classList.add('show');
      } else {
        playBtn.classList.remove('show');
      }
    }
    
    // Play button click handler
    playBtn.addEventListener('click', () => {
      heroVideo.play().catch(() => {
        // Autoplay failed, user interaction required
      });
    });
    
    // Video event listeners
    heroVideo.addEventListener('loadeddata', () => {
      heroVideo.classList.add('loaded');
      slide.classList.remove('loading');
      updatePlayButton();
    });
    
    heroVideo.addEventListener('play', updatePlayButton);
    heroVideo.addEventListener('pause', updatePlayButton);
    heroVideo.addEventListener('ended', updatePlayButton);
    
    // Handle autoplay failure
    heroVideo.addEventListener('loadstart', () => {
      // If autoplay fails, show play button
      setTimeout(() => {
        if (heroVideo.paused && !heroVideo.error) {
          updatePlayButton();
        }
      }, 1000);
    });
    
    // Error handling
    heroVideo.addEventListener('error', () => {
      heroVideo.style.display = 'none';
      slide.classList.remove('loading');
      playBtn.style.display = 'none';
    });
    
    // Initial check
    updatePlayButton();
    
    // Update on resize
    window.addEventListener('resize', updatePlayButton);
  }
})();