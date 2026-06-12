import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "d724dd3eb875908a4448cca481e61afd";
const SITE_URL = "https://lecomax.com";

// POST /api/indexnow — ping Bing with a list of updated URLs
// Body: { urls: string[] }
export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls required" }, { status: 400 });
    }

    const payload = {
      host: "lecomax.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(0, 10000), // IndexNow max per request
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ status: res.status, ok: res.ok });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
