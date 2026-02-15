const YEAR = new Date().getFullYear();
const cartKey = "cart";
const legacyCartKey = "lc_cart_v2";
const ORDER_ENDPOINT = "https://lecomax.com/order.php";
const form = document.getElementById("checkoutForm");
const totalEl = document.getElementById("checkoutTotal");
const itemsEl = document.getElementById("checkoutItems");
const msgEl = document.getElementById("checkoutMessage");
const successModal = document.getElementById("checkoutSuccess");
const successBtn = document.getElementById("checkoutDone");
const submitBtn = form ? form.querySelector("button[type='submit']") : null;
const checkoutStartedAt = Date.now();
let lastSubmitAttemptAt = 0;
let isSubmitting = false;

if (document.getElementById("year")) {
  document.getElementById("year").textContent = YEAR;
}

function getLang() {
  return document.documentElement.lang || 'en';
}

const CHECKOUT_MESSAGES = {
  en: {
    fill_required: "Please fill in all required fields.",
    invalid_phone: "Please enter a valid phone number.",
    captcha_required: "Please complete the security check.",
    order_unavailable: "Order service is unavailable. Please try again later.",
    order_failed: "Order failed. Please try again.",
    wait_before_retry: "Please wait a few seconds before trying again.",
    suspicious_submission: "Submission blocked for security reasons. Please try again.",
    thank_you_url: "thank-you.html"
  },
  ar: {
    fill_required: "يرجى ملء جميع الحقول المطلوبة.",
    invalid_phone: "يرجى إدخال رقم هاتف صحيح.",
    captcha_required: "يرجى إكمال التحقق الأمني.",
    order_unavailable: "خدمة الطلب غير متوفرة. يرجى المحاولة لاحقاً.",
    order_failed: "فشل الطلب. يرجى المحاولة مرة أخرى.",
    wait_before_retry: "يرجى الانتظار بضع ثوانٍ قبل إعادة المحاولة.",
    suspicious_submission: "تم حظر الإرسال لأسباب أمنية. يرجى المحاولة مرة أخرى.",
    thank_you_url: "thank-you-ar.html"
  },
  fr: {
    fill_required: "Veuillez remplir tous les champs obligatoires.",
    invalid_phone: "Veuillez entrer un numéro de téléphone valide.",
    captcha_required: "Veuillez compléter la vérification de sécurité.",
    order_unavailable: "Le service de commande est indisponible. Veuillez réessayer plus tard.",
    order_failed: "La commande a échoué. Veuillez réessayer.",
    wait_before_retry: "Veuillez attendre quelques secondes avant de réessayer.",
    suspicious_submission: "Envoi bloqué pour des raisons de sécurité. Veuillez réessayer.",
    thank_you_url: "thank-you-fr.html"
  }
};

function getMsg(key) {
  const lang = getLang();
  return (CHECKOUT_MESSAGES[lang] || CHECKOUT_MESSAGES.en)[key];
}

function showMessage(text, type = "info") {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.classList.remove("is-error", "is-success");
  msgEl.classList.add(type === "error" ? "is-error" : "is-success");
  msgEl.style.display = "block";
}

function clearMessage() {
  if (!msgEl) return;
  msgEl.textContent = "";
  msgEl.classList.remove("is-error", "is-success");
  msgEl.style.display = "none";
}

function parseCartKey(key) {
  const parts = String(key).split("__");
  const id = parts.shift();
  const size = parts.length ? parts.join("__") : "";
  return { id, size };
}

function getCartItems() {
  const direct = JSON.parse(localStorage.getItem(cartKey) || "[]");
  const safeDirect = Array.isArray(direct) ? direct : [];

  const mappedDirect = safeDirect.map(item => {
    const p = typeof PRODUCTS !== "undefined" ? PRODUCTS.find(x => x.id === item.id) : null;
    return {
      id: item.id,
      title: item.title || (p ? p.name : ""),
      price: Number(item.price) || (p ? Number(p.price) : 0),
      qty: Number(item.qty) || 1,
      image: item.image || (p && p.images && p.images[0] ? p.images[0] : ""),
      color: item.color || "",
      size: item.size || ""
    };
  }).filter(item => item.id && item.title && item.price > 0);

  if (mappedDirect.length) return mappedDirect;

  const legacy = JSON.parse(localStorage.getItem(legacyCartKey) || "{}");
  const entries = Object.entries(legacy);
  if (!entries.length) return [];

  return entries.map(([key, qty]) => {
    const { id, size } = parseCartKey(key);
    const p = typeof PRODUCTS !== "undefined" ? PRODUCTS.find(x => x.id === id) : null;
    return {
      id,
      title: p ? p.name : id,
      price: p ? Number(p.price) : 0,
      qty: Number(qty) || 1,
      image: p && p.images && p.images[0] ? p.images[0] : "",
      color: "",
      size
    };
  }).filter(item => item.title && item.price > 0);
}

function renderSummary(items) {
  let total = 0;
  if (!items.length) {
    itemsEl.innerHTML = "<div class='muted'>Your cart is empty.</div>";
    totalEl.textContent = "0 MAD";
    return 0;
  }

  itemsEl.innerHTML = items.map(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    return `
      <div class="checkout-item">
        <div class="checkout-item__left">
          <div class="checkout-item__thumb">
            ${item.image ? `<img src="${item.image}" alt="${item.title}">` : ""}
          </div>
          <div class="checkout-item__meta">
            <div class="checkout-item__name">${item.title}</div>
            <div class="checkout-item__sub">${item.color ? `Color: ${item.color}` : ""}${item.size ? `${item.color ? " • " : ""}Size: ${item.size}` : ""}</div>
          </div>
        </div>
        <div class="checkout-item__price">${subtotal} MAD</div>
      </div>
    `;
  }).join("");

  totalEl.textContent = `${total} MAD`;
  return total;
}

function isValidPhone(value) {
  return /^\+?\d[\d\s()\-]{7,}$/.test(value.trim());
}

function isLikelyNetworkError(err) {
  if (!err) return false;
  const message = String(err.message || err);
  return err.name === "TypeError" || /failed to fetch/i.test(message);
}

function getTurnstileToken() {
  if (!form) return "";
  const tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
  return tokenInput ? tokenInput.value.trim() : "";
}

function showSuccess() {
  successModal.classList.add("is-open");
  successModal.setAttribute("aria-hidden", "false");
}

function hideSuccess() {
  successModal.classList.remove("is-open");
  successModal.setAttribute("aria-hidden", "true");
}

const items = getCartItems();
const total = renderSummary(items);

if (!items.length) {
  showMessage("Your cart is empty. Please add items before checkout.", "error");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.6";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const now = Date.now();
  if (isSubmitting) {
    return;
  }
  if (now - lastSubmitAttemptAt < 5000) {
    showMessage(getMsg("wait_before_retry"), "error");
    return;
  }
  if (now - checkoutStartedAt < 1500) {
    showMessage(getMsg("suspicious_submission"), "error");
    return;
  }
  lastSubmitAttemptAt = now;

  if (!items.length) {
    showMessage("Your cart is empty. Please add items before checkout.", "error");
    return;
  }

  const customer = {
    name: form.fullName.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    city: form.city.value.trim(),
    postalCode: form.postalCode.value.trim()
  };
  const honeypot = form.website ? form.website.value.trim() : "";

  if (!customer.name || !customer.phone || !customer.address || !customer.city || !customer.postalCode) {
    showMessage(getMsg("fill_required"), "error");
    return;
  }

  if (!isValidPhone(customer.phone)) {
    showMessage(getMsg("invalid_phone"), "error");
    return;
  }

  const turnstileToken = getTurnstileToken();
  if (!turnstileToken) {
    showMessage(getMsg("captcha_required"), "error");
    return;
  }

  const order = {
    fullName: customer.name,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    cartItems: items,
    total,
    website: honeypot,
    turnstileToken,
    formStartedAt: checkoutStartedAt,
    submittedAt: now
  };

  try {
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.65";
      submitBtn.style.cursor = "not-allowed";
    }

    const res = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.message || "Failed to place order");
    }

    showSuccess();
    localStorage.removeItem(cartKey);
    window.location.href = getMsg("thank_you_url");
  } catch (err) {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      const widget = document.getElementById("turnstileWidget");
      if (widget) window.turnstile.reset(widget);
    }
    if (isLikelyNetworkError(err)) {
      showMessage(getMsg("order_unavailable"), "error");
      return;
    }
    showMessage(err.message || getMsg("order_failed"), "error");
  } finally {
    isSubmitting = false;
    if (submitBtn && items.length) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
    }
  }
});

successBtn.addEventListener("click", () => {
  hideSuccess();
  window.location.href = getMsg("thank_you_url");
});
