import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { hydrateCommunityPost, type EcomediaPost } from "@/lib/ecomedia";
import PostCard from "@/components/ecomedia/PostCard";
import Link from "next/link";
import { serializeJsonLd } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import GuideArticle from "@/components/ecomedia/GuideArticle";
import { getEcomediaGuide } from "@/lib/ecomedia-guides";

export const dynamic = "force-dynamic";

const SITE_URL = "https://lecomax.com";

const getPost = cache(async (slug: string): Promise<EcomediaPost | null> => {
  try {
    const sb = createServerSupabaseClient();
    const { data } = await sb.from("ecomedia_posts").select("*").eq("slug", slug).eq("is_published", true).single();
    return data ? hydrateCommunityPost(data as EcomediaPost) : null;
  } catch { return null; }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getEcomediaGuide(slug);
  if (guide) {
    const postUrl = `${SITE_URL}/ecomedia/${guide.slug}/`;
    const socialImageUrl = `${SITE_URL}/api/ecomedia/social-image/${guide.slug}/`;
    return {
      title: `${guide.title} | Ecomedia L'ecomax`,
      description: guide.description,
      alternates: { canonical: postUrl },
      openGraph: { title: guide.title, description: guide.description, url: postUrl, siteName: "L'ecomax", locale: "fr_MA", type: "article", publishedTime: guide.publishedAt, modifiedTime: guide.updatedAt, images: [{ url: socialImageUrl, width: 1200, height: 630, alt: guide.title }] },
      twitter: { card: "summary_large_image", title: guide.title, description: guide.description, images: [socialImageUrl] },
    };
  }
  const post = await getPost(slug);
  if (!post) return { title: "Post introuvable | L'ecomax" };
  const postUrl = `${SITE_URL}/ecomedia/${encodeURIComponent(post.slug)}/`;
  const socialImageUrl = `${SITE_URL}/api/ecomedia/social-image/${encodeURIComponent(post.slug)}/`;
  const description = post.content?.slice(0, 155) ?? `Découvrez ce post sur L'ecomax Ecomedia.`;
  const socialImage = {
    url: socialImageUrl,
    secureUrl: socialImageUrl,
    width: 1200,
    height: 630,
    alt: post.title,
    type: "image/png",
  };
  return {
    title: `${post.title} | Ecomedia L'ecomax`,
    description,
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description,
      url: postUrl,
      siteName: "L'ecomax",
      locale: "fr_MA",
      images: [socialImage],
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [socialImageUrl],
    },
  };
}

export default async function EcomediaPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getEcomediaGuide(slug);
  if (guide) return <GuideArticle guide={guide} />;
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
            __html: serializeJsonLd({
              "@context": "https://schema.org",
              "@type": "SocialMediaPosting",
              "headline": post.title,
              "description": post.content,
              "url": `https://lecomax.com/ecomedia/${post.slug}/`,
              "mainEntityOfPage": `https://lecomax.com/ecomedia/${post.slug}/`,
              ...((post.thumbnail_url || post.media_url) ? { "image": post.thumbnail_url || post.media_url } : {}),
              "datePublished": post.created_at,
              "dateModified": post.updated_at,
              "author": { "@type": "Organization", "name": post.author_name || "L'ecomax", "url": "https://lecomax.com" },
              "publisher": { "@type": "Organization", "name": "L'ecomax", "url": "https://lecomax.com" },
              "interactionStatistic": [
                { "@type": "InteractionCounter", "interactionType": "https://schema.org/LikeAction", "userInteractionCount": post.likes_count },
                { "@type": "InteractionCounter", "interactionType": "https://schema.org/CommentAction", "userInteractionCount": post.comments_count }
              ],
            }),
          }}
        />
      </div>
    </main>
  );
}
