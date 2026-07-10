import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { EcomediaPost } from "@/lib/ecomedia";
import PostCard from "@/components/ecomedia/PostCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getPost(slug: string): Promise<EcomediaPost | null> {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await sb.from("ecomedia_posts").select("*").eq("slug", slug).eq("is_published", true).single();
    return data as EcomediaPost ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post introuvable | L'ecomax" };
  return {
    title: `${post.title} | Ecomedia L'ecomax`,
    description: post.content?.slice(0, 155) ?? `Découvrez ce post sur L'ecomax Ecomedia.`,
    openGraph: {
      title: post.title,
      description: post.content?.slice(0, 155) ?? "",
      images: post.media_url ? [{ url: post.media_url }] : [],
      type: "article",
    },
  };
}

export default async function EcomediaPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-xl mx-auto px-4 py-4">
        {/* Back */}
        <div className="mb-4">
          <Link href="/ecomedia" className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Retour à Ecomedia
          </Link>
        </div>

        {/* Post */}
        <PostCard post={post} priority />

        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SocialMediaPosting",
              "headline": post.title,
              "description": post.content,
              "datePublished": post.created_at,
              "author": { "@type": "Organization", "name": "L'ecomax" },
            }),
          }}
        />
      </div>
    </main>
  );
}
