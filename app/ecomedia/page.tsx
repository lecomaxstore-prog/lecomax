import type { Metadata } from "next";
import EcomediaFeed from "@/components/ecomedia/EcomediaFeed";
import { hydrateCommunityPost, type EcomediaPost } from "@/lib/ecomedia";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ecomedia | L'ecomax",
  description: "Découvrez les nouveautés, offres exclusives, vidéos et actualités produits de L'ecomax — Mode, Tech & Sport.",
  openGraph: {
    title: "Ecomedia | L'ecomax",
    description: "La communauté L'ecomax — offres, nouveautés, vidéos et plus encore.",
    type: "website",
    url: "https://lecomax.com/ecomedia/",
    siteName: "L'ecomax",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "https://lecomax.com/ecomedia/" },
};

async function getInitialPosts(): Promise<EcomediaPost[]> {
  try {
    const sb = createServerSupabaseClient();
    const { data } = await sb
      .from("ecomedia_posts")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(9);
    return ((data ?? []) as EcomediaPost[]).map(hydrateCommunityPost);
  } catch { return []; }
}

export default async function EcomediaPage() {
  const initialPosts = await getInitialPosts();

  return (
    <>
      <h1 className="sr-only">Ecomedia — Actualités et communauté L&apos;ecomax</h1>
      {/* Feed (layout.tsx provides the header) */}
      <EcomediaFeed initialPosts={initialPosts} />
    </>
  );
}
