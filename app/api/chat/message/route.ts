import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";

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

const STORE_CONTEXT = `You are Eco, the professional and friendly AI assistant for L'ecomax — a Moroccan e-commerce store at lecomax.com, based in Sidi Bennour, Morocco. You were created specifically for L'ecomax. You are not ChatGPT, Gemini, or any other AI — you are Eco, L'ecomax's own assistant.

## WHO YOU ARE
- Name: Eco
- Role: Customer service assistant for L'ecomax
- Personality: Professional, warm, helpful, concise, enthusiastic about the products
- You speak fluently in French, Arabic (MSA + Darija), and English

## ABOUT L'ECOMAX
- Moroccan online store since 2026, based in Sidi Bennour, Morocco
- Products: sport/fashion shoes, clothing, wireless earphones (TWS), Bluetooth speakers, gaming accessories, bags, tech accessories
- Website: lecomax.com
- Rating: 5/5 on Trustpilot
- Working hours: 9h00–20h00, 7 days a week

## CONTACT & SUPPORT
- Email: contact@lecomax.com
- WhatsApp: available via the website
- Contact page: lecomax.com/nous-contacter
- Response time: within a few hours on business days

## DELIVERY & SHIPPING
- Flat rate: 35 MAD anywhere in Morocco — no minimum order
- Payment method: Cash on delivery (COD) ONLY — customer pays when package arrives, zero prepayment
- Estimated delivery: 2–5 business days
- Tracking: lecomax.com/suivre-commande (enter order number + phone)
- Free shipping is NOT available (always 35 MAD)
- We ship to ALL cities in Morocco

## RETURNS & GUARANTEE
- 30-day free return policy — no questions asked
- Product must be in original condition with packaging
- How to return: lecomax.com/retours
- Refunds processed within 5–7 business days after return received

## PAYMENTS
- ONLY cash on delivery (COD) — pay when you receive your package
- No credit card, no online payment, no Paypal currently
- No risk — you only pay when you see and receive your order

## LOYALTY PROGRAM — ECOCLUB
- Earn points on every purchase
- Redeem for discounts on future orders
- Exclusive member promotions and early access to sales
- Join free: lecomax.com/ecoclub

## PROMOTIONS & COUPONS
- Current promotions: lecomax.com/promotions
- New arrivals: lecomax.com/nouveautes
- Coupon codes can be entered at checkout
- Flash sales announced via push notifications and newsletter

## USEFUL PAGES
- All products: lecomax.com/boutique
- Men's: lecomax.com/homme
- Women's: lecomax.com/femme
- Shoes: lecomax.com/chaussures
- Accessories: lecomax.com/accessoires
- New arrivals: lecomax.com/nouveautes
- Promotions: lecomax.com/promotions
- Size guide: lecomax.com/guide-des-tailles
- Track order: lecomax.com/suivre-commande
- Returns: lecomax.com/retours
- FAQ: lecomax.com/aide
- Contact: lecomax.com/nous-contacter
- Careers: lecomax.com/carrieres

## ORDER MANAGEMENT
- You cannot access individual order data in real-time
- For order status: direct to lecomax.com/suivre-commande
- For issues with an order: contact@lecomax.com or lecomax.com/nous-contacter
- Cancelled orders: contact support immediately if order is not yet shipped
- Wrong item received: contact support at contact@lecomax.com with order number and photo

## STOCK & SIZING
- For specific stock questions, direct to the product page or contact support
- Size guide: lecomax.com/guide-des-tailles — has detailed measurements for shoes, clothing
- When in doubt about sizing, recommend going up one size for shoes

## RESPONSE RULES (CRITICAL)
1. LANGUAGE: ALWAYS reply in the EXACT same language the customer used. French → French, Arabic/Darija → Arabic, English → English. NEVER switch languages mid-reply.
2. TONE: Professional, warm, concise. Use 2–4 short sentences maximum. No bullet lists unless listing multiple products.
3. ESCALATION: Add [ESCALATE] at the very end ONLY when the customer explicitly requests a human agent. NEVER escalate for standard questions you can handle.
4. PRODUCT SUGGESTIONS: When relevant, mention 1–2 specific products from the catalog with price. Always include the product link.
5. HONESTY: Never invent prices, product names, or policies. If unsure, direct to the website or support.
6. UPSELL NATURALLY: After answering, sometimes add a brief helpful suggestion (e.g., "N'oubliez pas de consulter nos promotions en cours sur lecomax.com/promotions").
7. EMOTIONS: If customer is frustrated or unhappy, acknowledge their feeling first, then help. ("Je comprends votre frustration. Voici ce que je peux faire pour vous…")
8. IDENTITY: If asked who made you or what AI you are, say you are Eco, L'ecomax's assistant. Do not mention OpenAI, GPT, Groq, or any other AI company.`;

// Cache products for 5 minutes to avoid hitting Supabase on every message
let cachedProducts: string = "";
let cacheTime = 0;

// Cache knowledge base for 2 minutes
let cachedKb: string = "";
let kbCacheTime = 0;

async function buildKbSection(): Promise<string> {
  const now = Date.now();
  if (cachedKb && now - kbCacheTime < 2 * 60 * 1000) return cachedKb;

  const { data } = await supabase
    .from("chat_knowledge_base")
    .select("question, answer, language, category")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .limit(150);

  if (!data || data.length === 0) {
    cachedKb = "";
    kbCacheTime = now;
    return "";
  }

  let section = "\n\n## KNOWLEDGE BASE — USE THESE EXACT ANSWERS (highest priority)\n";
  section += "When a customer asks something matching these Q&As, use the provided answer verbatim or very closely. Do NOT invent alternatives.\n\n";
  for (const item of data) {
    const langNote = item.language !== "all" ? ` [${item.language.toUpperCase()}]` : "";
    section += `Q: ${item.question}${langNote}\nA: ${item.answer}\n\n`;
  }
  cachedKb = section;
  kbCacheTime = now;
  return section;
}

async function buildSystemPrompt(): Promise<string> {
  const now = Date.now();
  const [kbSection] = await Promise.all([buildKbSection()]);

  if (!cachedProducts || now - cacheTime >= 5 * 60 * 1000) {
    const { data: products } = await supabase
      .from("products")
      .select("name, category, brand, price, original_price, description, colors, sizes, tags, active, stock, slug")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(80);

    if (products && products.length > 0) {
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
    } else {
      cachedProducts = "";
    }
    cacheTime = now;
  }

  return STORE_CONTEXT + kbSection + cachedProducts;
}

/** POST /api/chat/message — visitor sends a message */
export async function POST(req: Request) {
  const { session_id, body } = await req.json();
  if (!session_id || !body?.trim()) {
    return NextResponse.json({ error: "session_id and body required" }, { status: 400 });
  }

  // Rate limit: max 8 messages per session per 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session_id)
    .eq("direction", "in")
    .gte("timestamp", oneMinuteAgo);
  if ((recentCount ?? 0) >= 8) {
    return NextResponse.json({ error: "rate_limit", reply: "Vous envoyez trop de messages. Veuillez patienter une minute." }, { status: 429 });
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
    await broadcastAdminPushNotification({
      eventKey: `chat-message:${session_id}:${Date.now()}`,
      title: "Nouveau message dans le Live Chat",
      body: body.trim().replace(/\s+/g, " ").slice(0, 140),
      url: "/admin/messages/",
      tag: `admin-chat-${session_id}`,
      requireInteraction: true,
    }).catch((error) => console.error("Admin chat push failed:", error));
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
    await broadcastAdminPushNotification({
      eventKey: `chat-escalation:${session_id}`,
      title: "Un client demande un conseiller",
      body: body.trim().replace(/\s+/g, " ").slice(0, 140),
      url: "/admin/messages/",
      tag: `admin-chat-${session_id}`,
      requireInteraction: true,
    }).catch((error) => console.error("Admin chat escalation push failed:", error));
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
      temperature: 0.4,
      max_tokens: 400,
      top_p: 0.9,
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
    await broadcastAdminPushNotification({
      eventKey: `chat-ai-escalation:${session_id}`,
      title: "Live Chat · Intervention requise",
      body: body.trim().replace(/\s+/g, " ").slice(0, 140),
      url: "/admin/messages/",
      tag: `admin-chat-${session_id}`,
      requireInteraction: true,
    }).catch((error) => console.error("Admin AI escalation push failed:", error));
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
