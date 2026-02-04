const YEAR = new Date().getFullYear();
const cartKey = "cart";
const legacyCartKey = "lc_cart_v2";
const API_BASE = "http://localhost:3001";
const form = document.getElementById("checkoutForm");
const totalEl = document.getElementById("checkoutTotal");
const itemsEl = document.getElementById("checkoutItems");
const msgEl = document.getElementById("checkoutMessage");
const successModal = document.getElementById("checkoutSuccess");
const successBtn = document.getElementById("checkoutDone");

if (document.getElementById("year")) {
  document.getElementById("year").textContent = YEAR;
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

function generateOrderId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LEC-${YEAR}-${rand}`;
}

function isValidPhone(value) {
  return /^\+?\d[\d\s()\-]{7,}$/.test(value.trim());
}

function isLikelyNetworkError(err) {
  if (!err) return false;
  const message = String(err.message || err);
  return err.name === "TypeError" || /failed to fetch/i.test(message);
}

async function pingOrderServer() {
  const isLocal = window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isLocal) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    if (!res.ok) throw new Error("offline");
  } catch (err) {
    showMessage("Order service is offline. Please start the order server to place an order.", "error");
  } finally {
    clearTimeout(timeout);
  }
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

pingOrderServer();

if (!items.length) {
  showMessage("Your cart is empty. Please add items before checkout.", "error");
  form.querySelector("button[type='submit']").disabled = true;
  form.querySelector("button[type='submit']").style.opacity = "0.6";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

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

  if (!customer.name || !customer.phone || !customer.address || !customer.city || !customer.postalCode) {
    showMessage("Please fill in all required fields.", "error");
    return;
  }

  if (!isValidPhone(customer.phone)) {
    showMessage("Please enter a valid phone number.", "error");
    return;
  }

  const order = {
    orderId: generateOrderId(),
    date: new Date().toISOString(),
    customer,
    items,
    total
  };

  try {
    const res = await fetch(`${API_BASE}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to place order");
    }

    showSuccess();
    localStorage.removeItem(cartKey);
    window.location.href = "thank-you.html";
  } catch (err) {
    if (isLikelyNetworkError(err)) {
      showMessage("Order service is offline. Please start the order server and try again.", "error");
      return;
    }
    showMessage(err.message || "Order failed. Please try again.", "error");
  }
});

successBtn.addEventListener("click", () => {
  hideSuccess();
  window.location.href = "thank-you.html";
});
