import { NextResponse } from "next/server";

const BUSINESS_UNIT_ID = "6a2c5605a30ac9aadd7fc293";
const API_KEY = process.env.TRUSTPILOT_API_KEY;

export const revalidate = 3600; // cache 1 hour

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json({ reviews: [], total: 0, score: 0, source: "none" });
    }

    // Fetch 5-star reviews
    const url = new URL(`https://api.trustpilot.com/v1/business-units/${BUSINESS_UNIT_ID}/reviews`);
    url.searchParams.set("apikey", API_KEY);
    url.searchParams.set("stars", "5");
    url.searchParams.set("orderBy", "createdat.desc");
    url.searchParams.set("perPage", "9");

    // Also fetch summary
    const summaryUrl = new URL(`https://api.trustpilot.com/v1/business-units/${BUSINESS_UNIT_ID}`);
    summaryUrl.searchParams.set("apikey", API_KEY);

    const [reviewsRes, summaryRes] = await Promise.all([
      fetch(url.toString(), { next: { revalidate: 3600 } }),
      fetch(summaryUrl.toString(), { next: { revalidate: 3600 } }),
    ]);

    if (!reviewsRes.ok) {
      console.error("Trustpilot reviews API error:", reviewsRes.status, await reviewsRes.text());
      return NextResponse.json({ reviews: [], total: 0, score: 0, source: "api_error" });
    }

    const reviewsData = await reviewsRes.json();
    const summaryData = summaryRes.ok ? await summaryRes.json() : null;

    const reviews = (reviewsData.reviews ?? []).map((r: {
      id: string;
      consumer: { displayName: string };
      title: string;
      text: string;
      stars: number;
      createdAt: string;
    }) => ({
      id: r.id,
      name: r.consumer?.displayName ?? "Client",
      title: r.title ?? "",
      text: r.text ?? "",
      rating: r.stars,
      date: r.createdAt,
      url: `https://www.trustpilot.com/review/lecomax.com`,
    }));

    return NextResponse.json({
      reviews,
      total: summaryData?.numberOfReviews ?? reviewsData.totalReviews ?? 0,
      score: summaryData?.trustScore ?? 0,
      source: "trustpilot",
    });
  } catch (err) {
    console.error("Trustpilot fetch error:", err);
    return NextResponse.json({ reviews: [], total: 0, score: 0, source: "error" });
  }
}
