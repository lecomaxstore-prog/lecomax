import { ImageResponse } from "next/og";

type SocialPost = {
  title: string;
  media_url: string | null;
  thumbnail_url: string | null;
};

async function getSocialPost(slug: string): Promise<SocialPost | null> {
  try {
    const query = new URLSearchParams({
      slug: `eq.${slug}`,
      is_published: "eq.true",
      select: "title,media_url,thumbnail_url",
      limit: "1",
    });
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ecomedia_posts?${query}`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        next: { revalidate: 300 },
      }
    );
    if (!response.ok) return null;
    const posts = (await response.json()) as SocialPost[];
    return posts[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getSocialPost(slug);
  const photo = post?.thumbnail_url || post?.media_url;
  const title = post?.title || "Ecomedia L'ecomax";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#090c0a",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {photo ? (
          <>
            <img
              src={photo}
              alt=""
              width="1200"
              height="630"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.28 }}
            />
            <div style={{ position: "absolute", inset: 0, display: "flex", background: "rgba(0,0,0,.38)" }} />
            <img
              src={photo}
              alt={title}
              width="1000"
              height="548"
              style={{ position: "absolute", left: 100, top: 41, width: 1000, height: 548, objectFit: "contain" }}
            />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", background: "radial-gradient(circle at center, rgba(62,207,76,.3), transparent 65%)" }} />
        )}

        <div
          style={{
            position: "absolute",
            left: 42,
            top: 36,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: 999,
            background: "rgba(7,10,8,.88)",
            border: "1px solid rgba(62,207,76,.55)",
            boxShadow: "0 12px 35px rgba(0,0,0,.28)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 17, background: "#3ecf4c", color: "#071008", fontSize: 16, fontWeight: 900 }}>LM</div>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 800 }}>L&apos;ecomax · Ecomedia</div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 42,
            right: 42,
            bottom: 34,
            display: "flex",
            alignItems: "center",
            padding: "16px 22px",
            borderRadius: 18,
            background: "rgba(7,10,8,.9)",
            border: "1px solid rgba(255,255,255,.16)",
            boxShadow: "0 18px 45px rgba(0,0,0,.4)",
          }}
        >
          <div style={{ display: "flex", flex: 1, fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>{title.slice(0, 90)}</div>
          <div style={{ display: "flex", marginLeft: 28, color: "#3ecf4c", fontSize: 16, fontWeight: 800 }}>VOIR LE POST →</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400" },
    }
  );
}
