import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";
import { submitIndexNow } from "@/lib/product-discovery";

// POST /api/indexnow — ping Bing with a list of updated URLs
// Body: { urls: string[] }
export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "indexnow:submit", limit: 30 });
  if (blocked) return blocked;

  try {
    const { urls } = await readJsonLimited(req);
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls required" }, { status: 400 });
    }

    const result = await submitIndexNow(urls);
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
