(function () {
  const STORAGE_KEY = "lecomax_cookie_consent_v1";

  function runGlobalEnhancements() {
    enforceSafeExternalLinks();
    enhanceImages();
    improveInputHints();
    preventDoubleSubmit();
  }

  function enforceSafeExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (anchor) {
      const rel = (anchor.getAttribute("rel") || "").toLowerCase();
      const parts = rel.split(/\s+/).filter(Boolean);
      if (!parts.includes("noopener")) parts.push("noopener");
      if (!parts.includes("noreferrer")) parts.push("noreferrer");
      anchor.setAttribute("rel", parts.join(" "));
    });
  }

  function enhanceImages() {
    const isLikelyAboveFold = function (img) {
      const rect = img.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight * 1.2;
    };

    document.querySelectorAll("img").forEach(function (img) {
      if (!img.hasAttribute("decoding")) {
        img.setAttribute("decoding", "async");
      }
      if (!img.hasAttribute("loading") && !isLikelyAboveFold(img)) {
        img.setAttribute("loading", "lazy");
      }
    });
  }

  function improveInputHints() {
    document.querySelectorAll('input[type="tel"]').forEach(function (input) {
      if (!input.hasAttribute("inputmode")) input.setAttribute("inputmode", "tel");
      if (!input.hasAttribute("autocomplete")) input.setAttribute("autocomplete", "tel");
    });
    document.querySelectorAll('input[type="email"]').forEach(function (input) {
      if (!input.hasAttribute("autocomplete")) input.setAttribute("autocomplete", "email");
    });
    document.querySelectorAll('input[name*="name" i], input[id*="name" i]').forEach(function (input) {
      if (!input.hasAttribute("autocomplete")) input.setAttribute("autocomplete", "name");
    });
  }

  function preventDoubleSubmit() {
    document.querySelectorAll("form").forEach(function (form) {
      if (form.dataset.doubleSubmitBound === "1") return;
      form.dataset.doubleSubmitBound = "1";

      form.addEventListener("submit", function () {
        const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitButtons.forEach(function (btn) {
          if (btn.disabled) return;
          btn.dataset.originalDisabled = "0";
          btn.disabled = true;
          if (btn.tagName === "BUTTON") {
            btn.dataset.originalText = btn.textContent || "";
            btn.textContent = "Please wait...";
          }
        });
        form.setAttribute("aria-busy", "true");

        window.setTimeout(function () {
          submitButtons.forEach(function (btn) {
            if (btn.dataset.originalDisabled === "0") {
              btn.disabled = false;
              if (btn.tagName === "BUTTON" && typeof btn.dataset.originalText === "string") {
                btn.textContent = btn.dataset.originalText;
              }
            }
          });
          form.removeAttribute("aria-busy");
        }, 8000);
      }, { passive: true });
    });
  }

  function ensureStyles() {
    if (document.getElementById("lcCookieConsentStyles")) return;
    const style = document.createElement("style");
    style.id = "lcCookieConsentStyles";
    style.textContent = `
      .lc-cookie-consent {
        position: fixed;
        left: 20px;
        right: 20px;
        bottom: 20px;
        z-index: 1200;
        background: #ffffff;
        border: 1px solid rgba(15, 23, 42, 0.1);
        border-radius: 14px;
        box-shadow: 0 20px 50px -20px rgba(15, 23, 42, 0.4);
        padding: 14px;
        display: none;
      }
      .lc-cookie-consent.is-open { display: block; }
      .lc-cookie-consent__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .lc-cookie-consent__text {
        color: #334155;
        font-size: 0.92rem;
        line-height: 1.5;
        max-width: 740px;
      }
      .lc-cookie-consent__text a {
        color: #0f172a;
        font-weight: 700;
        text-decoration: underline;
      }
      .lc-cookie-consent__actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .lc-cookie-btn {
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        height: 40px;
        padding: 0 14px;
        font-weight: 700;
        cursor: pointer;
        background: #fff;
        color: #0f172a;
        transition: all .2s ease;
      }
      .lc-cookie-btn:hover { transform: translateY(-1px); }
      .lc-cookie-btn--accept {
        background: #0f172a;
        color: #fff;
        border-color: #0f172a;
      }
      @media (max-width: 700px) {
        .lc-cookie-consent {
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 16px 16px 0 0;
          border-left: 0;
          border-right: 0;
          border-bottom: 0;
          padding: 20px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
        }
        .lc-cookie-consent__inner {
          display: block; /* Stack vertically */
          text-align: center;
        }
        .lc-cookie-consent__text {
          margin-bottom: 16px;
          font-size: 0.85rem;
        }
        .lc-cookie-consent__actions {
          width: 100%;
          justify-content: stretch;
          gap: 12px;
        }
        .lc-cookie-btn {
          flex: 1;
          height: 48px; /* Larger touch target */
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureMarkup() {
    if (document.getElementById("lcCookieConsent")) return;
    const wrapper = document.createElement("div");
    wrapper.id = "lcCookieConsent";
    wrapper.className = "lc-cookie-consent";
    wrapper.setAttribute("role", "dialog");
    wrapper.setAttribute("aria-live", "polite");
    wrapper.setAttribute("aria-label", "Cookie consent");
    wrapper.innerHTML = `
      <div class="lc-cookie-consent__inner">
        <div class="lc-cookie-consent__text">
          We use cookies to improve site performance, analytics, and your shopping experience.
          You can accept or reject optional cookies. See our
          <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.
        </div>
        <div class="lc-cookie-consent__actions">
          <button type="button" class="lc-cookie-btn" id="lcCookieReject">Reject</button>
          <button type="button" class="lc-cookie-btn lc-cookie-btn--accept" id="lcCookieAccept">Accept</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);
  }

  function setConsent(granted) {
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: granted ? "granted" : "denied",
        analytics_storage: granted ? "granted" : "denied",
        ad_user_data: granted ? "granted" : "denied",
        ad_personalization: granted ? "granted" : "denied"
      });
    }
  }

  function openBanner() {
    const banner = document.getElementById("lcCookieConsent");
    if (banner) banner.classList.add("is-open");
  }

  function closeBanner() {
    const banner = document.getElementById("lcCookieConsent");
    if (banner) banner.classList.remove("is-open");
  }

  function init() {
    runGlobalEnhancements();
    ensureStyles();
    ensureMarkup();

    const acceptBtn = document.getElementById("lcCookieAccept");
    const rejectBtn = document.getElementById("lcCookieReject");
    if (!acceptBtn || !rejectBtn) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted") {
      setConsent(true);
    } else if (stored === "rejected") {
      setConsent(false);
    } else {
      openBanner();
    }

    acceptBtn.addEventListener("click", function () {
      localStorage.setItem(STORAGE_KEY, "accepted");
      setConsent(true);
      closeBanner();
    });

    rejectBtn.addEventListener("click", function () {
      localStorage.setItem(STORAGE_KEY, "rejected");
      setConsent(false);
      closeBanner();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
