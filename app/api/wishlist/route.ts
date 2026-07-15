import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";
import { products as catalogProducts, type CardProduct } from "@/lib/products";

const MAX_WISHLIST_ITEMS = 100;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type AdminClient = NonNullable<ReturnType<typeof getAdminClient>>;

function normalizeSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((slug): slug is string => typeof slug === "string")
    .map((slug) => slug.trim())
    .filter((slug) => slug.length > 0 && slug.length <= 160))]
    .slice(0, MAX_WISHLIST_ITEMS);
}

async function getAuthoritativeUser(supabase: AdminClient, userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  return error ? null : data.user;
}

async function existingProductSlugs(supabase: AdminClient, slugs: string[]): Promise<Set<string>> {
  const existing = new Set(catalogProducts.map((product) => product.slug));
  if (slugs.length > 0) {
    const { data } = await supabase.from("products").select("slug").in("slug", slugs);
    for (const product of data ?? []) existing.add(String(product.slug));
  }
  return new Set(slugs.filter((slug) => existing.has(slug)));
}

async function wishlistProducts(supabase: AdminClient, slugs: string[]): Promise<CardProduct[]> {
  if (slugs.length === 0) return [];
  const bySlug = new Map<string, CardProduct>();
  for (const product of catalogProducts) {
    if (!slugs.includes(product.slug)) continue;
    bySlug.set(product.slug, {
      slug: product.slug,
      name: product.name,
      category: product.category,
      subCategory: product.subCategory,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      colors: product.colors,
      sizes: product.sizes,
      badge: product.badge,
    });
  }

  const { data } = await supabase
    .from("products")
    .select("slug,name,category,price,original_price,images,colors,sizes,featured")
    .in("slug", slugs);
  for (const product of data ?? []) {
    const images = Array.isArray(product.images) ? product.images.filter((image): image is string => typeof image === "string" && !!image) : [];
    bySlug.set(String(product.slug), {
      slug: String(product.slug),
      name: String(product.name),
      category: String(product.category ?? ""),
      price: Number(product.price),
      oldPrice: product.original_price == null ? undefined : Number(product.original_price),
      image: images[0] ?? "/images/placeholder.png",
      colors: Array.isArray(product.colors) ? product.colors.map(String) : [],
      sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : [],
      badge: product.featured ? "Nouveau" : undefined,
    });
  }
  return slugs.map((slug) => bySlug.get(slug)).filter((product): product is CardProduct => !!product);
}

export async function GET(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service de favoris indisponible" }, { status: 503 });
  const tokenUser = await getCustomerUser(req);
  if (!tokenUser) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const user = await getAuthoritativeUser(supabase, tokenUser.id);
  if (!user) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const slugs = normalizeSlugs(user.user_metadata?.wishlist);
  return NextResponse.json({ slugs, products: await wishlistProducts(supabase, slugs) }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service de favoris indisponible" }, { status: 503 });
  const tokenUser = await getCustomerUser(req);
  if (!tokenUser) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const user = await getAuthoritativeUser(supabase, tokenUser.id);
  if (!user) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  let body: { action?: "save" | "remove" | "replace"; slug?: unknown; slugs?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requête JSON invalide" }, { status: 400 });
  }
  if (!body.action || !["save", "remove", "replace"].includes(body.action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const current = normalizeSlugs(user.user_metadata?.wishlist);
  let next: string[];
  if (body.action === "replace") {
    const requested = normalizeSlugs(body.slugs);
    const existing = await existingProductSlugs(supabase, requested);
    next = requested.filter((slug) => existing.has(slug));
  } else {
    const slug = typeof body.slug === "string" ? body.slug.trim().slice(0, 160) : "";
    if (!slug) return NextResponse.json({ error: "Produit requis" }, { status: 400 });
    if (body.action === "save") {
      const existing = await existingProductSlugs(supabase, [slug]);
      if (!existing.has(slug)) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
      next = normalizeSlugs([slug, ...current]);
    } else {
      next = current.filter((item) => item !== slug);
    }
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...(user.user_metadata ?? {}), wishlist: next },
  });
  if (error) {
    console.error("Wishlist update failed:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour les favoris" }, { status: 500 });
  }
  return NextResponse.json({ slugs: next, saved: body.slug ? next.includes(String(body.slug)) : undefined });
}
