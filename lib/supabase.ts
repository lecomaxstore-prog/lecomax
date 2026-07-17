import { createClient } from "@supabase/supabase-js";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Keep public pages renderable in environments where Supabase is intentionally
 * unavailable (for example an isolated preview). Server data loaders already
 * fall back to the local catalogue; this prevents the browser SDK from throwing
 * during module evaluation before those fallbacks can run.
 */
export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);
const url = configuredUrl || "https://unconfigured.invalid";
const key = configuredKey || "unconfigured-anon-key";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  description: string | null;
  images: string[];
  desc_images?: string[];       // legacy alias
  description_images?: string[];
  stock: number;
  active: boolean;
  created_at: string;
  colors?: string[];
  color_stock?: Record<string, number> | null;
};

export type Order = {
  id: string;
  order_number: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    qty: number;
    image: string;
    size?: string;
    color?: string;
  }[];
  total: number;
  payment_method: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  label: string;
  image: string | null;
  image_mobile?: string | null;
  image_position?: string | null;
  image_mobile_position?: string | null;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type Announcement = {
  id: string;
  text: string;
  active: boolean;
  created_at: string;
};

export type Promotion = {
  id: string;
  label: string;
  product_ids: string[];
  discount_percent: number | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type Setting = {
  key: string;
  value: unknown;
  updated_at: string;
};
