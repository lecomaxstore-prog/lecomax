// ─── Ecomedia Types ──────────────────────────────────────────────────────────

export type PostType =
  | "image"
  | "video_upload"
  | "video_url"
  | "text"
  | "product"
  | "promotion";

export interface EcomediaPost {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  type: PostType;
  media_url: string | null;
  thumbnail_url: string | null;
  images: string[] | null;
  video_url: string | null;
  product_url: string | null;
  cta_text: string | null;
  is_published: boolean;
  is_featured: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author_id?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  is_client_post?: boolean;
  moderation_status?: "pending" | "approved";
}

export interface EcomediaComment {
  id: string;
  post_id: string;
  name: string;
  email: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
  user_id?: string | null;
  parent_id?: string | null;
  replies?: EcomediaComment[];
}

export interface EcomediaLike {
  id: string;
  post_id: string;
  visitor_id: string;
  created_at: string;
}

export const ECOMEDIA_COMMUNITY_AUTHOR_PREFIX = "__ECOMEDIA_MEMBER__:";

export function encodeCommunityAuthor(author: { id: string; name: string; avatar: string | null }): string {
  return ECOMEDIA_COMMUNITY_AUTHOR_PREFIX + encodeURIComponent(JSON.stringify(author));
}

export function hydrateCommunityPost(post: EcomediaPost): EcomediaPost {
  if (!post.cta_text?.startsWith(ECOMEDIA_COMMUNITY_AUTHOR_PREFIX)) return post;
  try {
    const author = JSON.parse(decodeURIComponent(post.cta_text.slice(ECOMEDIA_COMMUNITY_AUTHOR_PREFIX.length))) as { id?: string; name?: string; avatar?: string | null };
    return { ...post, cta_text: null, author_id: author.id ?? null, author_name: author.name ?? "Membre", author_avatar: author.avatar ?? null, is_client_post: true };
  } catch { return post; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a URL-safe slug from a title */
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) +
    "-" +
    Date.now().toString(36)
  );
}

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Extract TikTok video ID */
export function extractTikTokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  return m ? m[1] : null;
}

/** Detect video type from URL */
export function detectVideoSource(url: string): "youtube" | "tiktok" | "direct" | null {
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return "direct";
  return null;
}

/** Get or create a visitor ID stored in localStorage */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("ecomedia_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ecomedia_visitor_id", id);
  }
  return id;
}

/** Format relative time in French */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Type display label */
export const POST_TYPE_LABELS: Record<PostType, string> = {
  image: "Photo",
  video_upload: "Vidéo",
  video_url: "Vidéo",
  text: "Publication",
  product: "Produit",
  promotion: "Offre",
};

export const POST_TYPE_COLORS: Record<PostType, string> = {
  image: "bg-blue-100 text-blue-700",
  video_upload: "bg-purple-100 text-purple-700",
  video_url: "bg-pink-100 text-pink-700",
  text: "bg-gray-100 text-gray-700",
  product: "bg-green-100 text-green-700",
  promotion: "bg-red-100 text-red-700",
};

/** Simple XSS-safe text sanitizer */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
