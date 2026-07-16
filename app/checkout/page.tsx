"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
// PayPal loaded via vanilla SDK (see useEffect below)
import { useCart } from "@/components/CartContext";
import { formatMAD } from "@/lib/products";
import { useSettings } from "@/lib/use-settings";
import { calculateShipping, shippingConfigFromSettings } from "@/lib/shipping-config";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import { PAYPAL_CURRENCY, paypalAmountFromMad } from "@/lib/paypal-money";

type Field = {
  prenom: string; nom: string; email: string; telephone: string;
  adresse: string; ville: string; codePostal: string;
};

const empty: Field = {
  prenom: "", nom: "", email: "", telephone: "",
  adresse: "", ville: "", codePostal: "",
};

type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  zip?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
};

function getEmailError(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "L’adresse e-mail est obligatoire.";
  if (
    email.length > 254 ||
    email.includes("..") ||
    !/^[^\s@.][^\s@]*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/.test(email)
  ) {
    return "Saisissez une adresse e-mail valide, par exemple nom@gmail.com.";
  }
  return undefined;
}

function getPhoneError(value: string): string | undefined {
  const raw = value.trim();
  if (!raw) return "Le numéro de téléphone est obligatoire.";

  let normalized = raw.replace(/[\s().-]/g, "");
  if (normalized.startsWith("+212")) normalized = `0${normalized.slice(4)}`;
  else if (normalized.startsWith("00212")) normalized = `0${normalized.slice(5)}`;
  else if (normalized.startsWith("212")) normalized = `0${normalized.slice(3)}`;

  if (/^0?[67]?\d*$/.test(normalized) && normalized.length < 10) {
    return "Numéro incomplet — saisissez les 10 chiffres.";
  }
  if (!/^0[67]\d{8}$/.test(normalized)) {
    return "Saisissez un numéro marocain valide, par exemple 06 12 34 56 78.";
  }
  return undefined;
}

const ABANDONED_CART_TOKEN_KEY = "lecomax_abandoned_cart_token";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAbandonedCartToken() {
  const stored = localStorage.getItem(ABANDONED_CART_TOKEN_KEY);
  if (stored && UUID_PATTERN.test(stored)) return stored;
  const token = crypto.randomUUID();
  localStorage.setItem(ABANDONED_CART_TOKEN_KEY, token);
  return token;
}

function clearAbandonedCartToken() {
  localStorage.removeItem(ABANDONED_CART_TOKEN_KEY);
}





function Input({
  label, name, value, error, type = "text", placeholder, icon, onChange, onBlur,
}: {
  label: string; name: keyof Field; value: string; error?: string;
  type?: string; placeholder?: string; icon?: React.ReactNode;
  onChange: (k: keyof Field, v: string) => void;
  onBlur?: (k: keyof Field, v: string) => void;
}) {
  const required = label.trim().endsWith("*");
  const cleanLabel = label.replace(/\s*\*\s*$/, "");
  const autoComplete: Partial<Record<keyof Field, string>> = {
    prenom: "given-name",
    nom: "family-name",
    email: "email",
    telephone: "tel",
    adresse: "street-address",
    ville: "address-level2",
    codePostal: "postal-code",
  };
  const canShowSuccess = !!value && !error &&
    (name !== "email" || !getEmailError(value)) &&
    (name !== "telephone" || !getPhoneError(value));
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`checkout-${name}`} className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-600">
        {cleanLabel}{required && <span className="ml-1 text-[#27bd3b]">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-6 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={`checkout-${name}`}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete[name]}
          inputMode={name === "telephone" ? "tel" : name === "codePostal" ? "numeric" : undefined}
          maxLength={name === "telephone" ? 20 : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `checkout-${name}-error` : undefined}
          required={required}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur?.(name, value)}
          className={`w-full ${icon ? "pl-11" : "pl-4"} ${canShowSuccess ? "pr-11" : "pr-4"} h-12 rounded-xl text-[13px] font-medium border outline-none transition-all duration-200 placeholder:text-neutral-300
            ${error
              ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-neutral-200 bg-neutral-50/70 hover:border-neutral-300 hover:bg-white focus:border-[#3ecf4c] focus:bg-white focus:ring-4 focus:ring-[#3ecf4c]/10"
            }`}
        />
        {canShowSuccess && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[#27bd3b] pointer-events-none">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>
          </span>
        )}
        {error && (
          <p id={`checkout-${name}-error`} className="mt-1.5 text-[10px] text-red-500 font-semibold flex items-center gap-1" data-field-error="true">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

const MOROCCAN_CITIES = [
  "Casablanca","Rabat","Fès","Marrakech","Agadir","Tanger","Meknès","Oujda","Kénitra","Tétouan",
  "Safi","El Jadida","Béni Mellal","Nador","Taza","Settat","Berrechid","Khémisset","Inzegane",
  "Khouribga","Guelmim","Berkane","Taourirt","Bouznika","Mohammedia","Salé","Témara","Laâyoune",
  "Dakhla","Essaouira","Tiznit","Taroudant","Ouarzazate","Errachidia","Ifrane","Azrou","Khénifra",
  "Fquih Ben Salah","Sidi Bennour","El Kelâa des Sraghna","Youssoufia","Sidi Kacem","Larache",
  "Fnideq","Martil","Chefchaouen","Al Hoceïma","Imzouren","Asilah","Moulay Idriss Zerhoun",
  "Midelt","Rich","Tinghir","Zagora","Tan-Tan","Assa","Smara","Boujdour","Sidi Ifni","Akhfenir",
  "Azilal","Demnat","Kalaat Mgouna","Kelâa des Mgouna","Tahanaout","Ait Ourir","Amizmiz",
  "Chichaoua","Benguerir","Rehamna","Mechraa Bel Ksiri","Souk el Arbaa","Sidi Slimane",
  "Lqliaa","Biougra","Aourir","Oulad Teima","Aït Melloul","Drarga","Dcheira El Jihadia",
];

function CityInput({ value, error, onChange }: { value: string; error?: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = value.trim().length >= 2
    ? MOROCCAN_CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <label htmlFor="checkout-ville" className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-600">Ville <span className="text-[#27bd3b]">*</span></label>
      <div className="relative">
        <div className="absolute left-4 top-6 -translate-y-1/2 text-neutral-400 pointer-events-none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <input
          id="checkout-ville"
          name="ville"
          type="text"
          value={value}
          placeholder="Ex: Casablanca"
          autoComplete="address-level2"
          required
          aria-invalid={!!error}
          aria-describedby={error ? "checkout-ville-error" : undefined}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={`w-full pl-11 pr-4 h-12 rounded-xl text-[13px] font-medium border outline-none transition-all duration-200 placeholder:text-neutral-300 ${
            error ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-neutral-200 bg-neutral-50/70 hover:border-neutral-300 hover:bg-white focus:border-[#3ecf4c] focus:bg-white focus:ring-4 focus:ring-[#3ecf4c]/10"
          }`}
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 top-full left-0 right-0 mt-2 rounded-xl bg-white border border-neutral-200 shadow-[0_16px_40px_rgba(0,0,0,0.14)] overflow-hidden">
            {suggestions.map(city => (
              <li
                key={city}
                onMouseDown={e => { e.preventDefault(); onChange(city); setOpen(false); }}
                className="px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f0fdf4] hover:text-[#16a34a] transition-colors flex items-center gap-2.5"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3ecf4c] shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {city}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p id="checkout-ville-error" className="mt-1 text-[10px] text-red-500 font-semibold flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ step, title, subtitle, icon, children }: { step: number; title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_14px_42px_rgba(15,23,42,0.09)]">
      <div className="relative flex items-center gap-3.5 border-b border-neutral-100 bg-gradient-to-r from-emerald-50/70 via-white to-white px-5 py-4 sm:px-6 sm:py-5">
        <div className="absolute inset-y-0 left-0 w-1 bg-[#3ecf4c]" />
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-[12px] shadow-sm" style={{ background: "#3ecf4c", color: "#071108" }}>
          {step}
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-[13px] sm:text-[14px] uppercase tracking-[0.1em] text-neutral-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-neutral-400">{subtitle}</p>}
        </div>
        <div className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 shadow-sm">{icon}</div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function PaymentErrorDialog({
  open,
  onClose,
  onRetry,
  onUseDelivery,
}: {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  onUseDelivery: () => void;
}) {
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    retryButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-3 backdrop-blur-[3px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes lecomax-dialog-in {
          from { opacity: 0; transform: translateY(16px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="paypal-error-title"
        aria-describedby="paypal-error-description"
        className="w-full max-w-[470px] overflow-hidden rounded-[24px] border border-white/15 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.32)] animate-[lecomax-dialog-in_.22s_ease-out]"
      >
        <div className="relative overflow-hidden bg-[#07110a] px-6 pb-7 pt-6 text-white sm:px-8">
          <div className="absolute -right-14 -top-20 h-44 w-44 rounded-full bg-[#3ecf4c]/15 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#75e584]">L&apos;ecomax · Paiement sécurisé</p>
              <h2 id="paypal-error-title" className="mt-3 max-w-[330px] text-[24px] font-black leading-[1.1] tracking-[-0.03em] sm:text-[28px]">
                Le paiement n&apos;a pas abouti
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3ecf4c]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100" aria-hidden="true">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>
            </span>
            <div>
              <p id="paypal-error-description" className="text-[14px] font-semibold leading-6 text-neutral-800">
                Nous n&apos;avons pas pu confirmer votre paiement PayPal.
              </p>
              <p className="mt-1 text-[12px] leading-5 text-neutral-500">
                Vérifiez votre compte PayPal avant une nouvelle tentative, ou choisissez le paiement à la livraison.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2.5">
            <button
              ref={retryButtonRef}
              type="button"
              onClick={onRetry}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0070ba] px-5 text-[12px] font-black uppercase tracking-[0.08em] text-white shadow-[0_8px_22px_rgba(0,112,186,0.22)] transition hover:bg-[#005ea6] focus:outline-none focus:ring-4 focus:ring-[#0070ba]/20 active:scale-[0.99]"
            >
              Réessayer avec PayPal
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6v6h-6M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5"/></svg>
            </button>
            <button
              type="button"
              onClick={onUseDelivery}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-[12px] font-black uppercase tracking-[0.08em] text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-4 focus:ring-neutral-100 active:scale-[0.99]"
            >
              Choisir le paiement à la livraison
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 border-t border-neutral-100 pt-5 text-[11px] font-medium text-neutral-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
            Besoin d&apos;aide ? <a href="mailto:contact@lecomax.com" className="font-bold text-neutral-700 underline decoration-neutral-300 underline-offset-2 hover:text-black">contact@lecomax.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clear } = useCart();
  const [form, setForm] = useState<Field>(empty);
  const [errors, setErrors] = useState<Partial<Field>>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [accountDetailsLoaded, setAccountDetailsLoaded] = useState(false);
  const [payment, setPayment] = useState<"livraison" | "paypal">("livraison");
  const [paypalStatus, setPaypalStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [paypalRetry, setPaypalRetry] = useState(0);
  const [paypalError, setPaypalError] = useState("");
  const [paypalFailureOpen, setPaypalFailureOpen] = useState(false);
  const [paypalServerReady, setPaypalServerReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{
    id: string;
    code: string;
    type: string;
    value: number;
    discount: number;
    excludedItemsCount: number;
    excludedSubtotal: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  // EcoClub loyalty discount
  const [loyaltyTier, setLoyaltyTier] = useState<"Bronze" | "Silver" | "Gold">("Bronze");
  const [loyaltyDiscountPct, setLoyaltyDiscountPct] = useState(0); // 0, 30, or 50
  const siteSettings = useSettings();

  // (stepper is static, no scroll logic needed)

  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);
  // Always-fresh ref for PayPal callbacks (prevents stale closure bug)
  const paypalDataRef = useRef({ form, items, grandTotal: 0, shipping: 0, couponApplied, discount: 0 });
  // Track if error originated from form validation (not from PayPal itself)
  const paypalFormErrorRef = useRef(false);

  const applySavedAddress = (address: SavedAddress) => {
    const fullNameParts = address.fullName.trim().split(/\s+/).filter(Boolean);
    setSelectedAddressId(address.id);
    setAddressMode("saved");
    setForm((current) => ({
      ...current,
      prenom: fullNameParts[0] || current.prenom,
      nom: fullNameParts.slice(1).join(" ") || current.nom,
      telephone: address.phone || current.telephone,
      adresse: [address.line1, address.line2].filter(Boolean).join(", "),
      ville: address.city,
      codePostal: address.zip || "",
    }));
    setErrors((current) => ({
      ...current,
      prenom: undefined,
      nom: undefined,
      telephone: undefined,
      adresse: undefined,
      ville: undefined,
      codePostal: undefined,
    }));
  };

  const chooseNewAddress = () => {
    setSelectedAddressId(null);
    setAddressMode("new");
    setForm((current) => ({ ...current, adresse: "", ville: "", codePostal: "" }));
    setErrors((current) => ({ ...current, adresse: undefined, ville: undefined, codePostal: undefined }));
  };

  // Signed-in customers get their profile and default delivery address prefilled.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        setAccountDetailsLoaded(true);
        return;
      }

      const metadata = session.user.user_metadata ?? {};
      const profileName = String(metadata.full_name || metadata.name || "").trim();
      const profileParts = profileName.split(/\s+/).filter(Boolean);
      const addresses = Array.isArray(metadata.addresses)
        ? (metadata.addresses as SavedAddress[]).filter((address) =>
            address && typeof address.id === "string" && typeof address.fullName === "string" &&
            typeof address.line1 === "string" && typeof address.city === "string" &&
            (!address.country || (typeof address.country === "string" && address.country.toLowerCase() === "maroc"))
          )
        : [];

      setSavedAddresses(addresses);
      setForm((current) => ({
        ...current,
        prenom: current.prenom || metadata.prenom || profileParts[0] || "",
        nom: current.nom || metadata.nom || profileParts.slice(1).join(" ") || "",
        email: current.email || session.user.email || "",
        telephone: current.telephone || metadata.phone || "",
      }));

      const preferred = addresses.find((address) => address.isDefault) ?? addresses[0];
      if (preferred) applySavedAddress(preferred);
      setAccountDetailsLoaded(true);
    }).catch(() => setAccountDetailsLoaded(true));
    return () => { active = false; };
  // The profile should hydrate once when checkout opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire begin_checkout once when user lands on checkout with items
  useEffect(() => {
    if (items.length === 0) return;
    trackBeginCheckout(
      items.map((i) => ({
        item_id: i.slug,
        item_name: i.name,
        item_category: "",
        price: i.price,
        quantity: i.quantity,
        item_variant: [i.color, i.size].filter(Boolean).join(" / ") || undefined,
      })),
      total
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track abandoned cart — save when phone or email is entered
  useEffect(() => {
    if (items.length === 0) return;
    const phone = form.telephone && !getPhoneError(form.telephone) ? form.telephone.trim() : null;
    const email = form.email && !getEmailError(form.email) ? form.email.trim().toLowerCase() : null;
    if (!phone && !email) return;
    const t = setTimeout(() => {
      fetch("/api/abandoned-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          cart_token: getAbandonedCartToken(),
          phone,
          name: (form.prenom || form.nom) ? `${form.prenom} ${form.nom}`.trim() : null,
          email,
          items: items.map((i) => ({ slug: i.slug, name: i.name, quantity: i.quantity, price: i.price, size: i.size, color: i.color })),
        }),
      }).then(async (response) => {
        if (!response.ok) console.warn("Abandoned cart tracking failed:", await response.json().catch(() => ({})));
      }).catch((error) => console.warn("Abandoned cart tracking unavailable:", error));
    }, 900);
    return () => clearTimeout(t);
  }, [form.telephone, form.email, form.prenom, form.nom, items]);

  // Fetch EcoClub tier to apply automatic loyalty discount
  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const email = session?.user?.email;
        if (!email) return;
        import("@/lib/customer-api").then(({ customerApiFetch }) => customerApiFetch(`/api/points?email=${encodeURIComponent(email)}`))
          .then(r => r.json())
          .then(d => {
            if (d.tier === "Silver") { setLoyaltyTier("Silver"); setLoyaltyDiscountPct(30); }
            else if (d.tier === "Gold") { setLoyaltyTier("Gold"); setLoyaltyDiscountPct(50); }
          })
          .catch(() => {});
      });
    });
  }, []);

  const shippingConfig = shippingConfigFromSettings(siteSettings);
  const defaultFreeAbove = shippingConfig.freeThreshold;
  const isSidiBennour = form.ville.trim().toLowerCase().replace(/[-\s]/g, "") === "sidibennour";
  const shipping = isSidiBennour ? 0 : calculateShipping(total, shippingConfig);
  const couponDiscount = couponApplied?.discount ?? 0;
  const effectiveLoyaltyDiscountPct = siteSettings.enable_ecoclub === "false" ? 0 : loyaltyDiscountPct;
  // Loyalty discount applies on subtotal (after coupon); Silver 30%, Gold 50%
  const loyaltyDiscountAmount = effectiveLoyaltyDiscountPct > 0 ? Math.round(((total - couponDiscount) * effectiveLoyaltyDiscountPct) / 100) : 0;
  const discount = couponDiscount + loyaltyDiscountAmount;
  const grandTotal = Math.max(0, total + shipping - discount);
  const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId) ?? null;

  // Keep paypalDataRef in sync with latest state so PayPal callbacks are never stale
  paypalDataRef.current = { form, items, grandTotal, shipping, couponApplied, discount };

  // Load vanilla PayPal SDK and render buttons when PayPal selected
  useEffect(() => {
    fetch("/api/paypal/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setPaypalServerReady(data.enabled === true))
      .catch(() => setPaypalServerReady(false));
  }, []);

  useEffect(() => {
    if (payment !== "paypal") return;
    const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
    let active = true;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;
    setPaypalStatus("loading");
    setPaypalError("");

    const failLoading = (message: string) => {
      if (!active) return;
      paypalRendered.current = false;
      setPaypalStatus("error");
      setPaypalError(message);
    };

    if (paypalServerReady === null) {
      setPaypalStatus("loading");
      return () => { active = false; };
    }
    if (!PAYPAL_CLIENT_ID || !paypalServerReady) {
      failLoading("PayPal n'est pas configuré. Choisissez le paiement à la livraison.");
      return () => { active = false; };
    }

    const renderButtons = () => {
      const container = paypalContainerRef.current;
      if (!container || paypalRendered.current) return;
      if (!(window as any).paypal) return;
      paypalRendered.current = true;
      container.innerHTML = "";
      const buttons = (window as any).paypal.Buttons({
        style: { layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 48 },
        createOrder: (_data: unknown, actions: any) => {
          // Use ref to get latest form data (avoids stale closure)
          const { form: f, grandTotal: gt, items: its } = paypalDataRef.current;
          const errs = validate(f);
          if (Object.keys(errs).length) {
            setErrors(errs);
            // Scroll to first error
            setTimeout(() => {
              const firstErr = document.querySelector("[data-field-error]") as HTMLElement;
              if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
            paypalFormErrorRef.current = true;
            return Promise.reject(new Error("Form invalid"));
          }
          paypalFormErrorRef.current = false;
          const usdAmount = paypalAmountFromMad(gt);
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [{ amount: { currency_code: PAYPAL_CURRENCY, value: usdAmount }, description: `L'ecomax — ${its.map((i: any) => i.name.slice(0,30)).join(", ").slice(0, 127)}` }],
          });
        },
        onApprove: async (_data: unknown, actions: any) => {
          setLoading(true);
          const details = await actions.order.capture();
          const captureId = details.purchase_units?.[0]?.payments?.captures?.[0]?.id;
          if (!details.id || !captureId) throw new Error("PayPal n'a pas retourné les identifiants du paiement.");
          // Use ref to get latest values at the moment of capture
          const { form: f, items: its, grandTotal: gt, shipping: sh, couponApplied: ca, discount: disc } = paypalDataRef.current;
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer: { name: `${f.prenom} ${f.nom}`, phone: f.telephone, email: f.email, city: f.ville, address: `${f.adresse}${f.codePostal ? ", " + f.codePostal : ""}` },
              items: its.map((i: any) => ({ slug: i.slug, name: i.name, price: i.price, qty: i.quantity, image: i.image ?? "", size: i.size ?? "", color: i.color ?? "" })),
               total: gt, shipping: sh, coupon_id: ca?.id ?? null, discount: disc,
               payment_provider: "paypal",
               paypal_order_id: details.id,
               paypal_capture_id: captureId,
               abandoned_cart_token: localStorage.getItem(ABANDONED_CART_TOKEN_KEY),
             }),
          });
          const data = await res.json();
          if (!res.ok) {
            console.error("Order API error after PayPal capture:", data.error);
            throw new Error(data.error || "La commande n'a pas pu être enregistrée après le paiement PayPal.");
          }
          clearAbandonedCartToken();
          clear();
          router.push("/merci");
        },
        onError: (err: unknown) => {
          console.error("PayPal error:", err);
          setLoading(false);
          // If this was triggered by our own form validation rejection, don't show PayPal error
          if (paypalFormErrorRef.current) {
            paypalFormErrorRef.current = false;
            return;
          }
          setPaypalFailureOpen(true);
        },
        onCancel: () => {
          // User closed the PayPal popup — silent, no error message
          setLoading(false);
        },
      });
      if (typeof buttons.isEligible === "function" && !buttons.isEligible()) {
        failLoading("PayPal n'est pas disponible sur ce navigateur. Réessayez ou choisissez le paiement à la livraison.");
        return;
      }
      Promise.resolve(buttons.render(container))
        .then(() => { if (active) setPaypalStatus("ready"); })
        .catch(() => failLoading("Le bouton PayPal n'a pas pu être chargé. Vérifiez votre connexion puis réessayez."));
    };

    // If SDK already loaded, render immediately
    if ((window as any).paypal) {
      renderButtons();
      return () => { active = false; };
    }

    // Otherwise inject script tag
    const existing = document.getElementById("paypal-sdk");
    // A script left by a failed/aborted attempt will never fire `load` again.
    // Remove it so retrying always starts from a known state.
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.onload = () => {
      if (loadTimer) clearTimeout(loadTimer);
      renderButtons();
    };
    script.onerror = () => {
      if (loadTimer) clearTimeout(loadTimer);
      failLoading("Impossible de contacter PayPal. Désactivez le bloqueur de contenu pour cette page puis réessayez.");
    };
    document.head.appendChild(script);
    loadTimer = setTimeout(() => {
      if (active && !(window as any).paypal) {
        script.remove();
        failLoading("Le chargement de PayPal prend trop de temps. Vérifiez votre connexion puis réessayez.");
      }
    }, 15_000);

    return () => {
      active = false;
      if (loadTimer) clearTimeout(loadTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, paypalRetry, paypalServerReady]);

  // Reset rendered flag when payment changes away from paypal
  useEffect(() => {
    if (payment !== "paypal") {
      paypalRendered.current = false;
      setPaypalStatus("idle");
      setPaypalError("");
    }
  }, [payment]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);
    const res = await fetch("/api/coupons/validate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: couponCode.trim(),
        items: items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) setCouponError(data.error ?? "Code invalide");
    else setCouponApplied({
      ...data,
      excludedItemsCount: data.excluded_items_count ?? 0,
      excludedSubtotal: data.excluded_subtotal ?? 0,
    });
  };

  const set = (k: keyof Field, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((current) => ({
      ...current,
      [k]: k === "email" && current.email
        ? getEmailError(v)
        : k === "telephone" && v.trim()
          ? getPhoneError(v)
          : undefined,
    }));
  };

  const validateField = (k: keyof Field, value: string) => {
    if (k === "email") {
      setErrors((current) => ({ ...current, email: getEmailError(value) }));
    } else if (k === "telephone") {
      setErrors((current) => ({ ...current, telephone: getPhoneError(value) }));
    }
  };

  const validate = (f: Field = form): Partial<Field> => {
    const e: Partial<Field> = {};
    if (!f.prenom.trim()) e.prenom = "Requis";
    if (!f.nom.trim()) e.nom = "Requis";
    const emailError = getEmailError(f.email);
    if (emailError) e.email = emailError;
    const phoneError = getPhoneError(f.telephone);
    if (phoneError) e.telephone = phoneError;
    if (!f.adresse.trim()) e.adresse = "Requis";
    if (!f.ville.trim()) e.ville = "Requis";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payment === "paypal") return; // PayPal uses its own button flow
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: `${form.prenom} ${form.nom}`,
            phone: form.telephone,
            email: form.email,
            city: form.ville,
            address: `${form.adresse}${form.codePostal ? ", " + form.codePostal : ""}`,
          },
          items: items.map((i) => ({
            slug: i.slug,
            name: i.name,
            price: i.price,
            qty: i.quantity,
            image: i.image ?? "",
            size: i.size ?? "",
            color: i.color ?? "",
          })),
          total: grandTotal,
          shipping,
          coupon_id: couponApplied?.id ?? null,
          discount,
           payment_provider: "cod",
           abandoned_cart_token: localStorage.getItem(ABANDONED_CART_TOKEN_KEY),
         }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Order API error:", data.error);
        setLoading(false);
        return;
      }

      const number = data.order_number;
      localStorage.setItem(
        "lecomax_last_order",
        JSON.stringify({ number, items, total: grandTotal, shipping, customer: form, payment, date: new Date().toISOString() })
      );

      // Fire GA4 purchase conversion event
      trackPurchase({
        transactionId: number,
        value: grandTotal,
        shipping,
        items: items.map((i) => ({
          item_id: i.slug,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
          item_variant: [i.color, i.size].filter(Boolean).join(" / ") || undefined,
        })),
      });

      clearAbandonedCartToken();
      clear();
      router.push("/merci");
    } catch (err) {
      console.error("Order submission failed:", err);
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-neutral-400 text-sm mb-6">Votre panier est vide.</p>
        <Link href="/" className="inline-block bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-wide rounded-full hover:bg-neutral-800 transition-colors">
          Continuer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <PaymentErrorDialog
        open={paypalFailureOpen}
        onClose={() => setPaypalFailureOpen(false)}
        onRetry={() => {
          setPaypalFailureOpen(false);
          paypalRendered.current = false;
          if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
          setPaypalRetry((retry) => retry + 1);
        }}
        onUseDelivery={() => {
          setPaypalFailureOpen(false);
          setPayment("livraison");
          setPaypalStatus("idle");
          setPaypalError("");
        }}
      />
      {/* ── Stepper bar ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        {/* Breadcrumb row */}
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/panier" className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-400 hover:text-black transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Panier
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "#3ecf4c" }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Paiement sécurisé
          </div>
        </div>

        {/* Stepper — same style as /panier */}
        <div className="max-w-3xl mx-auto px-4 pb-4 flex items-center justify-center gap-0">
          <style>{`
            @keyframes checkoutPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(62,207,76,0.5); }
              50%       { box-shadow: 0 0 0 10px rgba(62,207,76,0); }
            }
            @keyframes checkoutBounce {
              0%, 100% { transform: translateY(0); }
              40%      { transform: translateY(-4px); }
              60%      { transform: translateY(-2px); }
            }
            @keyframes checkoutShine {
              0%   { transform: translateX(-100%) skewX(-20deg); opacity: 0; }
              40%  { opacity: 0.6; }
              100% { transform: translateX(250%) skewX(-20deg); opacity: 0; }
            }
            .checkout-step-active {
              animation: checkoutPulse 2s ease-in-out infinite, checkoutBounce 2.4s ease-in-out infinite;
            }
            .checkout-step-active-shine::after {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
              border-radius: 9999px;
              animation: checkoutShine 2.2s ease-in-out infinite;
            }
          `}</style>
          {[
            { n: 1, label: "PANIER", done: true,   active: false },
            { n: 2, label: "PAIEMENT", done: false, active: true  },
            { n: 3, label: "CONFIRMATION", done: false, active: false },
          ].map((step, idx) => (
            <div key={step.n} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black border-2 transition-all overflow-hidden ${
                    step.active
                      ? "border-[#3ecf4c] text-black checkout-step-active checkout-step-active-shine"
                      : step.done
                      ? "border-[#3ecf4c] text-black"
                      : "bg-white border-neutral-200 text-neutral-400"
                  }`}
                  style={step.active || step.done ? { background: "#3ecf4c" } : {}}
                >
                  {step.done
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : step.n}
                </div>
                <span className={`text-[10px] tracking-[0.15em] font-black ${step.active ? "text-[#3ecf4c]" : step.done ? "text-[#3ecf4c]" : "text-neutral-300"}`}>
                  {step.label}
                </span>
              </div>
              {idx < 2 && (
                <div className="w-16 md:w-28 h-[2px] bg-neutral-100 mx-2 mb-5 relative overflow-hidden">
                  {step.done && (
                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #3ecf4c, #6bdd6b)" }} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* ── Left: Form ── */}
          <div className="flex flex-col gap-4">

            {/* Section 1 */}
            <Section step={1} title="Vos coordonnées" subtitle="Pour vous contacter au sujet de votre commande" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                <Input label="Prénom *" name="prenom" value={form.prenom} error={errors.prenom} onChange={set} placeholder="Mohammed"
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
                <Input label="Nom *" name="nom" value={form.nom} error={errors.nom} onChange={set} placeholder="El Idrissi" />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5">
                <Input label="Adresse email *" name="email" value={form.email} error={errors.email} type="email" onChange={set} onBlur={validateField} placeholder="exemple@gmail.com"
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />
                <Input label="Téléphone *" name="telephone" value={form.telephone} error={errors.telephone} type="tel" onChange={set} onBlur={validateField} placeholder="06 12 34 56 78"
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.39 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>} />
              </div>
            </Section>

            {/* Section 2 */}
            <Section step={2} title="Adresse de livraison" subtitle="Indiquez précisément où recevoir votre colis" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            }>
              {!accountDetailsLoaded ? (
                <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-5 text-neutral-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-[#3ecf4c]" />
                  <span className="text-[11px] font-bold">Recherche de vos adresses enregistrées…</span>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {savedAddresses.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black text-neutral-900">Quelle adresse souhaitez-vous utiliser ?</p>
                          <p className="mt-0.5 text-[10px] text-neutral-400">Votre adresse par défaut est présélectionnée.</p>
                        </div>
                        <Link href="/compte/adresses" className="shrink-0 text-[9px] font-black uppercase tracking-wider text-neutral-400 hover:text-black">Gérer</Link>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {savedAddresses.map((address) => {
                          const selected = addressMode === "saved" && selectedAddressId === address.id;
                          return (
                            <button
                              key={address.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => applySavedAddress(address)}
                              className={`relative rounded-xl border-2 p-4 text-left transition-all ${selected ? "border-[#3ecf4c] bg-emerald-50/60 shadow-[0_8px_22px_rgba(62,207,76,0.10)]" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                            >
                              <div className="mb-2 flex items-center gap-2 pr-6">
                                <span className="font-black text-[11px] uppercase tracking-wider text-neutral-900">{address.label || "Adresse"}</span>
                                {address.isDefault && <span className="rounded-full bg-black px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">Par défaut</span>}
                              </div>
                              <p className="text-[11px] font-semibold text-neutral-700">{address.fullName}</p>
                              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.zip ? `${address.zip} ` : ""}{address.city}</p>
                              <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? "border-[#3ecf4c] bg-[#3ecf4c] text-black" : "border-neutral-300 text-transparent"}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6"/></svg>
                              </span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          aria-pressed={addressMode === "new"}
                          onClick={chooseNewAddress}
                          className={`flex min-h-[116px] items-center gap-3 rounded-xl border-2 border-dashed p-4 text-left transition-all ${addressMode === "new" ? "border-black bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg></span>
                          <span><strong className="block text-[11px] font-black text-neutral-900">Utiliser une nouvelle adresse</strong><span className="mt-1 block text-[10px] leading-relaxed text-neutral-400">Saisir une autre destination pour cette commande</span></span>
                        </button>
                      </div>
                    </div>
                  )}

                  {addressMode === "saved" && selectedAddress ? (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3ecf4c] text-black"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6"/></svg></span>
                      <div><p className="text-[11px] font-black text-emerald-900">Adresse renseignée automatiquement</p><p className="mt-0.5 text-[10px] leading-relaxed text-emerald-700">Votre colis sera livré à l&apos;adresse « {selectedAddress.label || "enregistrée"} ».</p></div>
                    </div>
                  ) : (
                    <>
                      <Input label="Adresse complète *" name="adresse" value={form.adresse} error={errors.adresse} onChange={set} placeholder="Rue, numéro, quartier…"
                        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <CityInput value={form.ville} error={errors.ville} onChange={v => set("ville", v)} />
                        <Input label="Code postal" name="codePostal" value={form.codePostal} onChange={set} placeholder="24350" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-600 block mb-2">Pays</label>
                        <div className="flex h-12 items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 px-4">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base shadow-sm">🇲🇦</span>
                          <span className="text-[13px] font-bold text-neutral-700">Maroc</span>
                          <span className="ml-auto rounded-full bg-neutral-200/70 px-2.5 py-1 text-[9px] text-neutral-500 uppercase tracking-wider font-black">Livraison nationale</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Section>

            {/* Section 3 */}
            <Section step={3} title="Mode de paiement" subtitle="Choisissez votre option de règlement" icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            }>
              <div className="flex flex-col gap-3">
                {/* Cash on delivery */}
                <button
                  type="button"
                  onClick={() => setPayment("livraison")}
                  className={`group relative flex items-center gap-4 rounded-xl p-4 border-2 text-left transition-all duration-150 ${
                    payment === "livraison"
                      ? "border-[#3ecf4c] text-black"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                  style={payment === "livraison" ? { background: "#f0fdf4" } : {}}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    payment === "livraison" ? "bg-[#3ecf4c]/15" : "bg-neutral-100"
                  }`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={payment === "livraison" ? "#16a34a" : "#555"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[13px] text-black">Paiement à la livraison</p>
                    <p className={`text-[12px] mt-0.5 ${
                      payment === "livraison" ? "text-neutral-500" : "text-neutral-400"
                    }`}>Payez en espèces à la réception</p>
                    {payment === "livraison" && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold" style={{ color: "#16a34a" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Sélectionné
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 rounded-full transition-all ${
                    payment === "livraison" ? "border-[#3ecf4c]" : "border-neutral-300"
                  }`}>
                    {payment === "livraison" && <span className="w-2 h-2 rounded-full" style={{ background: "#3ecf4c" }} />}
                  </div>
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => setPayment("paypal")}
                  className={`group relative flex items-center gap-4 rounded-xl p-4 border-2 text-left transition-all duration-150 ${
                    payment === "paypal"
                      ? "border-[#0070ba]"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                  style={payment === "paypal" ? { background: "#f0f7ff" } : {}}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    payment === "paypal" ? "bg-[#0070ba]/10" : "bg-neutral-100"
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 46" width="22" height="28">
                      <path fill="#253B80" d="M9.12 40.43l.72-4.56-1.6-.04H1.46L6.79 1.77A.43.43 0 0 1 7.22 1.4h12.9c4.28 0 7.23.89 8.77 2.65.72.82 1.18 1.68 1.4 2.63.23.99.24 2.18.01 3.63l-.02.1v.93l.72.41c.6.33 1.09.72 1.47 1.11.62.7 1.02 1.6 1.19 2.66.17 1.09.12 2.39-.17 3.86-.33 1.69-.86 3.16-1.58 4.37a8.98 8.98 0 0 1-2.51 2.83c-.95.7-2.09 1.22-3.37 1.57-1.25.34-2.67.51-4.23.51H21.3a3.03 3.03 0 0 0-2.99 2.56l-.07.41-1.46 9.27-.07.34a.43.43 0 0 1-.43.37H9.12z"/>
                      <path fill="#179BD7" d="M31.68 10.54a12.35 12.35 0 0 0-.13.76c-1.7 8.72-7.51 11.74-14.93 11.74H12.8c-.9 0-1.67.66-1.81 1.55L8.89 36.88l-.55 3.48a.97.97 0 0 0 .96 1.12h6.7c.79 0 1.47-.58 1.59-1.36l.07-.34 1.26-8.01.08-.44c.13-.78.8-1.36 1.59-1.36h1c6.5 0 11.59-2.64 13.07-10.27.62-3.19.3-5.85-1.8-7.73a6.44 6.44 0 0 0-1.18-.43z"/>
                      <path fill="#222D65" d="M29.95 9.82a16.93 16.93 0 0 0-1.65-.37 21.03 21.03 0 0 0-3.33-.25H14.63a1.61 1.61 0 0 0-1.59 1.36L11 22.55l-.06.4a1.84 1.84 0 0 1 1.81-1.55h3.79c7.42 0 13.23-3.02 14.93-11.74.05-.25.09-.5.13-.76a9.16 9.16 0 0 0-1.65-.08z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[13px] text-black">PayPal</p>
                    <p className={`text-[12px] mt-0.5 ${payment === "paypal" ? "text-neutral-500" : "text-neutral-400"}`}>Payer en ligne via votre compte PayPal</p>
                    {payment === "paypal" && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-[#0070ba]">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Sélectionné
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 rounded-full transition-all ${payment === "paypal" ? "border-[#0070ba]" : "border-neutral-300"}`}>
                    {payment === "paypal" && <span className="w-2 h-2 rounded-full bg-[#0070ba]" />}
                  </div>
                </button>

                {/* PayPal Buttons — shown when PayPal is selected */}
                {payment === "paypal" && (
                  <div className="rounded-xl border border-[#0070ba]/20 bg-gradient-to-b from-[#f7fbff] to-white p-4 shadow-[0_8px_24px_rgba(0,112,186,0.08)]" aria-live="polite">
                    <div className="mb-3 flex items-center justify-center gap-2 text-center">
                      {paypalStatus === "loading" && (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0070ba]/25 border-t-[#0070ba]" aria-hidden="true" />
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#36546b]">Connexion sécurisée à PayPal…</p>
                        </>
                      )}
                      {paypalStatus === "ready" && (
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100" aria-hidden="true">✓</span>
                          PayPal est prêt — vérifiez vos coordonnées puis payez
                        </p>
                      )}
                    </div>

                    <div ref={paypalContainerRef} id="paypal-button-container" className={paypalStatus === "ready" ? "min-h-[48px]" : "min-h-0"} />

                    {paypalStatus === "loading" && (
                      <div className="h-12 animate-pulse rounded-lg bg-[#0070ba]/10" aria-hidden="true" />
                    )}

                    {paypalStatus === "error" && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                        <p className="text-[12px] font-semibold leading-relaxed text-red-700">{paypalError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            paypalRendered.current = false;
                            if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = "";
                            setPaypalRetry((retry) => retry + 1);
                          }}
                          className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-[#0070ba] px-5 text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-[#005ea6]"
                        >
                          Réessayer PayPal
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Trust banner */}
                <div className="mt-1 border border-neutral-100 overflow-hidden">
                  <div className="bg-neutral-50 px-4 py-2.5 flex items-center justify-center gap-1.5 border-b border-neutral-100">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Commande 100% sécurisée</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-neutral-100">
                    {[
                      { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, label: "Livraison 2–5j" },
                      { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, label: "Paiement sûr" },
                      { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>, label: "Retours 30j" },
                    ].map((b) => (
                      <div key={b.label} className="flex flex-col items-center gap-2 py-3.5 bg-white">
                        <span className="text-neutral-600">{b.icon}</span>
                        <span className="text-[10px] font-bold text-neutral-500 text-center leading-tight">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Submit (mobile) — only for COD */}
            {payment === "livraison" && (
            <button
              type="submit"
              disabled={loading}
              className="lg:hidden w-full py-4 font-black uppercase text-sm tracking-[0.1em] hover:opacity-90 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
              style={{ background: "#000", color: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Traitement…</>
              ) : (
                <>Confirmer ma commande <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              )}
            </button>
            )}
          </div>

          {/* ── Right: Order summary ── */}
          <aside className="lg:sticky lg:top-[88px]">
            <div className="bg-white border border-neutral-200" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>

              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-[13px] uppercase tracking-[0.1em]">Votre commande</h3>
                  <span className="text-[10px] font-black text-neutral-500 bg-neutral-100 px-2.5 py-1">
                    {items.reduce((s, i) => s + i.quantity, 0)} article{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Items */}
              <ul className="divide-y divide-neutral-50 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.slug + item.size} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="relative w-14 h-16 overflow-visible bg-neutral-100 shrink-0 border border-neutral-100">
                      <div className="w-full h-full overflow-hidden">
                        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-800 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Taille : {item.size}</p>
                    </div>
                    <span className="text-[13px] font-black shrink-0">{formatMAD(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>



              {/* Totals */}
              <div className="px-5 py-4 space-y-2.5 border-t border-neutral-100 bg-neutral-50/60">
                {siteSettings.enable_coupons !== "false" && (
                  <div className="pb-3 mb-3 border-b border-neutral-200">
                    <label htmlFor="checkout-coupon" className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Code promo</label>
                    <div className="flex gap-2">
                      <input
                        id="checkout-coupon"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        placeholder="VOTRE CODE"
                        className="min-w-0 flex-1 border border-neutral-200 bg-white px-3 py-2.5 text-xs font-bold uppercase outline-none focus:border-black"
                      />
                      <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="bg-black text-white px-4 py-2.5 text-[10px] font-black uppercase disabled:opacity-50">
                        {couponLoading ? "..." : "Appliquer"}
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] font-medium leading-relaxed text-neutral-400">
                      Non cumulable avec les promotions déjà appliquées aux produits.
                    </p>
                    {couponError && <p className="mt-2 text-[11px] font-semibold text-red-600">{couponError}</p>}
                    {couponApplied && (
                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <p className="text-[11px] font-bold text-emerald-700">✓ {couponApplied.code} appliqué : − {formatMAD(couponApplied.discount)}</p>
                        {couponApplied.excludedItemsCount > 0 && (
                          <p className="mt-1 text-[10px] font-semibold leading-relaxed text-amber-700">
                            Les articles déjà en promotion ({formatMAD(couponApplied.excludedSubtotal)}) ne bénéficient pas du code.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Sous-total</span>
                  <span className="font-semibold text-black">{formatMAD(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Livraison</span>
                  <span className={`font-semibold ${shipping === 0 ? "text-emerald-600" : "text-black"}`}>
                    {shipping === 0 ? "Gratuite 🎉" : formatMAD(shipping)}
                  </span>
                </div>
                {shipping > 0 && defaultFreeAbove > 0 && (
                  <p className="text-[10px] text-neutral-400 bg-neutral-100 px-3 py-2">
                    Livraison <strong>gratuite</strong> dès <strong>{defaultFreeAbove} MAD</strong> d&apos;achats
                  </p>
                )}

                {siteSettings.enable_coupons !== "false" && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-semibold">Code {couponApplied?.code}</span>
                    <span className="font-black">− {formatMAD(couponDiscount)}</span>
                  </div>
                )}

                {effectiveLoyaltyDiscountPct > 0 && loyaltyDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-semibold flex items-center gap-1.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      EcoClub {loyaltyTier} ({effectiveLoyaltyDiscountPct}%)
                    </span>
                    <span className="font-black">− {formatMAD(loyaltyDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[16px] pt-2 border-t border-neutral-200">
                  <span>Total TTC</span>
                  <span style={{ color: "#3ecf4c" }}>{formatMAD(grandTotal)}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 pt-3">
                <button
                  type="submit"
                  disabled={loading || payment === "paypal"}
                  className={`hidden lg:flex w-full py-4 font-black uppercase text-sm tracking-[0.1em] hover:opacity-90 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 items-center justify-center gap-2.5 ${
                    payment === "paypal" ? "opacity-0 pointer-events-none" : ""
                  }`}
                  style={{ background: "#000", color: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,0.18)" }}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Traitement…</>
                  ) : (
                    <>Confirmer ma commande <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  )}
                </button>
                <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-neutral-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    SSL sécurisé
                  </span>
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  <span>Livraison 2–5j</span>
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  <span>Retours 30j</span>
                </div>
              </div>
            </div>

            {/* Reassurance note */}
            <p className="mt-3 text-center text-[11px] text-neutral-400 leading-relaxed px-2">
              En confirmant, vous acceptez nos <Link href="/conditions-utilisation" target="_blank" className="underline hover:text-black transition-colors">conditions générales</Link>. Paiement à la livraison — aucune carte requise.
            </p>
          </aside>
        </div>
      </form>
    </div>
  );
}
