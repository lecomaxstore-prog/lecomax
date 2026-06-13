import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const ESCALATION_PATTERNS = [
  /\b(agent|human|person|personne|quelqu[''']un|vrai|réel|live|real)\b/i,
  /\b(agent humain|live agent|parler à quelqu|talk to (a |an )?(human|person|agent))\b/i,
  /\b(مساعدة بشرية|تحدث مع شخص|وكيل|إنسان)\b/i,
  /\b(واحد حقيقي|شخص حقيقي|خدمة بشرية)\b/i,
  /\b(parler à un (humain|agent|conseiller|vendeur))\b/i,
  /\b(quelqu.*humain|un vrai agent)\b/i,
];

function wantsHuman(text: string): boolean {
  return ESCALATION_PATTERNS.some((p) => p.test(text));
}

const STORE_CONTEXT = `You are Eco, the professional AI assistant for L'ecomax — a Moroccan e-commerce store at lecomax.com, based in Sidi Bennour, Morocco.

## ABOUT L'ECOMAX
- Online store: fashion, sportswear, shoes, wireless earphones, Bluetooth speakers, gaming accessories, bags.
- Website: lecomax.com
- Contact: contact@lecomax.com | WhatsApp available
- Working hours: 9h–20h, 7 days a week
- Rated 5/5 on Trustpilot

## DELIVERY & ORDERS
- Delivery fee: 35 MAD anywhere in Morocco (flat rate, no minimum order)
- Payment: Cash on delivery (COD) only — customer pays upon receipt, no prepayment
- Delivery time: 2–5 business days
- Order tracking: lecomax.com/suivre-commande

## RETURNS & GUARANTEES
- Free returns within 30 days — no questions asked
- Returns page: lecomax.com/retours

## LOYALTY PROGRAM (ECOCLUB)
- Members earn points on every purchase and unlock exclusive discounts
- Join at: lecomax.com/ecoclub

## USEFUL LINKS
- Shop all: lecomax.com/boutique
- Men: lecomax.com/homme | Women: lecomax.com/femme
- Shoes: lecomax.com/chaussures | Accessories: lecomax.com/accessoires
- New arrivals: lecomax.com/nouveautes | Promotions: lecomax.com/promotions
- Size guide: lecomax.com/guide-des-tailles
- FAQ / Help: lecomax.com/aide
- Contact us: lecomax.com/nous-contacter
- About: lecomax.com/a-propos

## RESPONSE RULES
1. LANGUAGE: Always reply in the customer's exact language (French / English / Arabic / Darija). Never mix languages.
2. TONE: Professional, warm, concise. Maximum 3 short sentences. Use natural sentences, not bullet lists.
3. ESCALATION: ONLY add [ESCALATE] at the very end if the customer explicitly asks to speak with a human agent. Never add it for product or order questions you can answer yourself.
4. SALES: When relevant, suggest specific products from the catalog with their price and link (lecomax.com/produit/[slug]).
5. ORDERS: You cannot access real-time order data. For order status, direct to lecomax.com/suivre-commande or contact@lecomax.com.
6. STOCK: If asked about stock for a specific product, say you recommend checking the product page directly or contacting support.`;

// Cache products for 5 minutes to avoid hitting Supabase on every message
let cachedProducts: string = "";
let cacheTime = 0;

async function buildSystemPrompt(): Promise<string> {
  const now = Date.now();
  if (cachedProducts && now - cacheTime < 5 * 60 * 1000) {
    return STORE_CONTEXT + cachedProducts;
  }

  const { data: products } = await supabase
    .from("products")
    .select("name, category, brand, price, original_price, description, colors, sizes, tags, active, stock, slug")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(80);

  if (!products || products.length === 0) {
    cachedProducts = "";
    cacheTime = now;
    return STORE_CONTEXT;
  }

  // Group by category
  const byCategory: Record<string, typeof products> = {};
  for (const p of products) {
    const cat = p.category || "autres";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  }

  let catalog = "\n\n## LIVE PRODUCT CATALOG (auto-updated)\n";
  for (const [cat, items] of Object.entries(byCategory)) {
    catalog += `\n### ${cat.toUpperCase()}\n`;
    for (const p of items) {
      const price = p.original_price && p.original_price > p.price
        ? `${p.price} MAD (was ${p.original_price} MAD)`
        : `${p.price} MAD`;
      const colors = Array.isArray(p.colors) && p.colors.length ? ` | Colors: ${p.colors.join(", ")}` : "";
      const sizes = Array.isArray(p.sizes) && p.sizes.length ? ` | Sizes: ${p.sizes.join(", ")}` : "";
      const brand = p.brand ? ` [${p.brand}]` : "";
      const stock = p.stock === 0 ? " ⚠️ OUT OF STOCK" : "";
      const desc = p.description ? ` — ${p.description.slice(0, 120)}` : "";
      catalog += `- ${p.name}${brand} — ${price}${colors}${sizes}${stock}${desc}\n  Link: lecomax.com/produit/${p.slug}\n`;
    }
  }

  cachedProducts = catalog;
  cacheTime = now;
  return STORE_CONTEXT + catalog;
}

/** POST /api/chat/message — visitor sends a message */
export async function POST(req: Request) {
  const { session_id, body } = await req.json();
  if (!session_id || !body?.trim()) {
    return NextResponse.json({ error: "session_id and body required" }, { status: 400 });
  }

  // Load session
  const { data: session, error: sessErr } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", session_id)
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Store visitor message
  await supabase.from("chat_messages").insert({
    session_id,
    direction: "in",
    body: body.trim(),
    sent_by: "visitor",
  });

  // Update last_message on session
  await supabase.from("chat_sessions").update({
    last_message: body.trim(),
    last_at: new Date().toISOString(),
    unread_count: session.unread_count + 1,
  }).eq("id", session_id);

  // If already escalated to agent — just store, admin will reply
  if (session.status === "escalated") {
    return NextResponse.json({ status: "escalated", reply: null });
  }

  // Check if user wants human before calling AI
  if (wantsHuman(body)) {
    await supabase.from("chat_sessions").update({ status: "escalated" }).eq("id", session_id);
    const escalationMsg = detectEscalationResponse(body);
    await supabase.from("chat_messages").insert({
      session_id,
      direction: "out",
      body: escalationMsg,
      sent_by: "ai",
    });
    return NextResponse.json({ status: "escalated", reply: escalationMsg });
  }

  // Get conversation history for context
  const { data: history } = await supabase
    .from("chat_messages")
    .select("direction, body, sent_by")
    .eq("session_id", session_id)
    .order("timestamp", { ascending: true })
    .limit(20);

  const chatHistory: OpenAI.ChatCompletionMessageParam[] = (history || [])
    .filter((m) => m.sent_by !== "agent")
    .slice(-12)
    .map((m) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.body,
    }));

  // Call Groq AI
  let aiReply = "";
  try {
    const systemPrompt = await buildSystemPrompt();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: body.trim() },
      ],
      temperature: 0.65,
      max_tokens: 220,
    });
    aiReply = completion.choices[0]?.message?.content?.trim() || "";
  } catch {
    aiReply = "Je rencontre un problème technique. Un agent va vous aider. [ESCALATE]";
  }

  // Check if AI decided to escalate
  const shouldEscalate = aiReply.includes("[ESCALATE]");
  const cleanReply = aiReply.replace("[ESCALATE]", "").trim();

  // Store AI reply
  await supabase.from("chat_messages").insert({
    session_id,
    direction: "out",
    body: cleanReply,
    sent_by: "ai",
  });

  if (shouldEscalate) {
    await supabase.from("chat_sessions").update({ status: "escalated" }).eq("id", session_id);
  }

  await supabase.from("chat_sessions").update({
    last_message: cleanReply,
    last_at: new Date().toISOString(),
  }).eq("id", session_id);

  return NextResponse.json({
    status: shouldEscalate ? "escalated" : "ai",
    reply: cleanReply,
  });
}

function detectEscalationResponse(text: string): string {
  const lower = text.toLowerCase();
  if (/arabic|عربي|عربية/.test(lower) || /[\u0600-\u06FF]/.test(text)) {
    return "سأقوم بتحويلك الآن إلى أحد وكلائنا البشريين. يرجى الانتظار قليلاً، سيرد عليك قريباً.";
  }
  if (/english|anglais/.test(lower)) {
    return "I'm connecting you to a live agent now. Please wait a moment — someone will be with you shortly.";
  }
  return "Je vous connecte maintenant à un agent. Veuillez patienter un instant, quelqu'un vous répondra bientôt.";
}
