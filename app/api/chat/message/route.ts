import { ownsChat } from "@/lib/chat-ownership";
import { readJsonLimited } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateSupportReply, type AIMessage } from "@/lib/openai-server";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";
import { getStoreAssistantContext } from "@/lib/store-assistant-context";


import { checkChatSession } from "@/lib/chat-session-server";
import { pendingChatQuestion } from "@/lib/chat-lifecycle";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const CLOSING_PATTERNS = [
  /\b(?:annuler|terminer|stopper)\s+(?:(?:le|la|cette|ma)\s+)?(?:chat|conversation|discussion)\b/i,
  /\b(?:cancel|end)\s+(?:(?:the|this|my)\s+)?(?:chat|conversation)\b/i,
  /\b(au revoir|bonne journ[ée]e|bonne soir[ée]e|c['’]est tout|merci c['’]est tout|vous pouvez fermer|ferme[rz]? (le |la )?(chat|conversation))\b/i,
  /\b(goodbye|bye|that['’]?s all|all good|you can close|close (the )?(chat|conversation))\b/i,
  /(شكرا.*(?:هذا كل شيء|وداعا)|هذا كل شيء|يمكنك إغلاق|أغلق المحادثة|بسلامة|سلام)/i,
];

function wantsToClose(text: string): boolean {
  return CLOSING_PATTERNS.some((pattern) => pattern.test(text));
}

function closingResponse(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return "شكراً لتواصلك مع L'ecomax. سعدنا بخدمتك، ونتمنى لك يوماً سعيداً. يمكنك بدء محادثة جديدة في أي وقت.";
  if (/\b(goodbye|bye|that['’]?s all|all good|close)\b/i.test(text)) return "Thank you for contacting L'ecomax. It was a pleasure helping you. Have a wonderful day, and feel free to start a new conversation anytime.";
  return "Merci d'avoir contacté L'ecomax. Ce fut un plaisir de vous aider. Nous vous souhaitons une excellente journée, et restons disponibles à tout moment.";
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
- Working hours: use the current store facts below

## CONTACT & SUPPORT
- Email: use the current store facts below
- WhatsApp: available via the website
- Contact page: lecomax.com/nous-contacter
- Response time: within a few hours on business days

## DELIVERY & SHIPPING
- Shipping rates are loaded from the live store configuration below
- Payment methods: use the current store facts below
- Estimated delivery: use the current store facts below
- Tracking: lecomax.com/suivre-commande (enter order number + phone)
- Never invent a shipping price or free-shipping threshold
- We ship to ALL cities in Morocco

## RETURNS & GUARANTEE
- 30-day free return policy — no questions asked
- Product must be in original condition with packaging
- How to return: lecomax.com/retours
- Refunds processed within 5–7 business days after return received

## PAYMENTS
- Use only currently enabled payment methods from the store facts below.

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
- For issues with an order: the configured support email or lecomax.com/nous-contacter
- Cancelled orders: contact support immediately if order is not yet shipped
- Wrong item received: contact support at the configured support email with order number and photo

## STOCK & SIZING
- For specific stock questions, direct to the product page or contact support
- Size guide: lecomax.com/guide-des-tailles — has detailed measurements for shoes, clothing
- When in doubt about sizing, recommend going up one size for shoes

## RESPONSE RULES (CRITICAL)
1. LANGUAGE: ALWAYS reply in the EXACT same language the customer used. French → French, Arabic/Darija → Arabic, English → English. NEVER switch languages mid-reply.
2. TONE: Professional, warm, natural and concise. Prefer short paragraphs. Use bullets only when they make the answer easier to scan.
3. ESCALATION: Add [ESCALATE] at the very end ONLY when the customer explicitly requests a human agent. NEVER escalate for standard questions you can handle.
4. PRODUCT SUGGESTIONS: When relevant, mention 1–2 specific products from the catalog with price. Always include the product link.
5. HONESTY: Never invent prices, product names, or policies. If unsure, direct to the website or support.
6. UPSELL NATURALLY: After answering, sometimes add a brief helpful suggestion (e.g., "N'oubliez pas de consulter nos promotions en cours sur lecomax.com/promotions").
7. EMOTIONS: If customer is frustrated or unhappy, acknowledge their feeling first, then help. ("Je comprends votre frustration. Voici ce que je peux faire pour vous…")
8. IDENTITY: If asked who made you or what AI you are, say you are Eco, L'ecomax's assistant. Do not mention OpenAI, GPT, Groq, or any other AI company.
9. GENERAL QUESTIONS: Answer any safe, reasonable question helpfully, even when it is not directly about the store. Do not force a sales pitch into unrelated answers.
10. SMART CONVERSATION: Use the full conversation context, resolve references such as "it" or "that product", and never repeat a canned greeting in an active conversation.
11. CLARIFICATION: When essential information is missing, ask one precise follow-up question instead of guessing.
12. ACTIONS: Clearly distinguish what you know from what requires access to a customer's account or order. Give the exact next step when you cannot perform an account action yourself.
13. COMPLETION: When the customer's issue has clearly been solved and they explicitly indicate they are finished, append [RESOLVE] at the very end. Never use [RESOLVE] while a question, complaint, order problem, or promised action remains open.
14. ANSWER QUALITY: Start with the direct answer. Do not repeat the customer's question, do not use filler, and do not claim an action was completed unless a tool or the customer confirms it. For broad questions, give a useful concise answer and then offer one relevant next step.`;

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
  const businessContext = await getStoreAssistantContext();
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

  const shippingSection = `\n\n${businessContext}\n`;
  return STORE_CONTEXT + shippingSection + kbSection + cachedProducts;
}

/** POST /api/chat/message — visitor sends a message */
export async function POST(req: Request) {
  const payload = await readJsonLimited(req);
  const session_id = payload.session_id as string | undefined;
  if (!(await ownsChat(req, supabase, session_id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const aiTakeover = payload.ai_takeover === true;
  let messageBody = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!session_id || (!messageBody && !aiTakeover)) {
    return NextResponse.json({ error: "session_id and body required" }, { status: 400 });
  }
  if (messageBody.length > 2000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  // Load session
  const { data: session, error: sessErr } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", session_id)
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const lifecycle = await checkChatSession(supabase, session);
  if (lifecycle.status === "resolved") {
    return NextResponse.json({ error: "session_closed", status: "resolved", expired: lifecycle.expired }, { status: 409 });
  }

  if (aiTakeover) {
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("body, sent_by, timestamp")
      .eq("session_id", session_id)
      .order("timestamp", { ascending: false })
      .limit(30);
    const pendingMessage = pendingChatQuestion(recentMessages || []);
    const waitedFiveMinutes = pendingMessage?.sent_by === "visitor" &&
      Date.now() - new Date(pendingMessage.timestamp).getTime() >= 5 * 60 * 1000;

    if (session.status !== "escalated" || !waitedFiveMinutes) {
      return NextResponse.json({ error: "takeover_not_ready" }, { status: 409 });
    }

    messageBody = pendingMessage.body;
    const { data: claimedSession } = await supabase
      .from("chat_sessions")
      .update({ status: "ai", last_at: new Date().toISOString() })
      .eq("id", session_id)
      .eq("status", "escalated")
      .select("id")
      .maybeSingle();
    if (!claimedSession) {
      return NextResponse.json({ error: "takeover_already_handled" }, { status: 409 });
    }
  } else {
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

    const { data: active, error: activityError } = await supabase.from("chat_sessions")
      .update({ last_at: new Date().toISOString() }).eq("id", session_id).neq("status", "resolved").select("id").maybeSingle();
    if (activityError) return NextResponse.json({ error: "Session unavailable" }, { status: 503 });
    if (!active) return NextResponse.json({ error: "session_closed", status: "resolved" }, { status: 409 });
    const { error: messageError } = await supabase.from("chat_messages").insert({
      session_id,
      direction: "in",
      body: messageBody,
      sent_by: "visitor",
    });
    if (messageError) return NextResponse.json({ error: "Message not saved" }, { status: 503 });

    await supabase.from("chat_sessions").update({
      last_message: messageBody,
      last_at: new Date().toISOString(),
      unread_count: session.unread_count + 1,
    }).eq("id", session_id);
  }

  // If already escalated to agent — just store, admin will reply
  // A clear goodbye completes both AI and live-agent conversations gracefully.
  if (!aiTakeover && wantsToClose(messageBody)) {
    const reply = closingResponse(messageBody);
    await supabase.from("chat_messages").insert({ session_id, direction: "out", body: reply, sent_by: "ai" });
    await supabase.from("chat_sessions").update({
      status: "resolved",
      last_message: reply,
      last_at: new Date().toISOString(),
      unread_count: 0,
    }).eq("id", session_id);
    return NextResponse.json({ status: "resolved", reply, resolved: true });
  }

  if (session.status === "escalated" && !aiTakeover) {
    await broadcastAdminPushNotification({
      eventKey: `chat-message:${session_id}:${Date.now()}`,
      title: "Nouveau message dans le Live Chat",
      body: messageBody.replace(/\s+/g, " ").slice(0, 140),
      url: "/admin/messages/",
      tag: `admin-chat-${session_id}`,
      requireInteraction: true,
    }).catch((error) => console.error("Admin chat push failed:", error));
    return NextResponse.json({ status: "escalated", reply: null });
  }

  // Check if user wants human before calling AI
  if (!aiTakeover && wantsHuman(messageBody)) {
    await supabase.from("chat_sessions").update({ status: "escalated" }).eq("id", session_id).neq("status", "resolved");
    const escalationMsg = detectEscalationResponse(messageBody);
    await supabase.from("chat_messages").insert({
      session_id,
      direction: "out",
      body: escalationMsg,
      sent_by: "ai",
    });
    await broadcastAdminPushNotification({
      eventKey: `chat-escalation:${session_id}`,
      title: "Un client demande un conseiller",
      body: messageBody.replace(/\s+/g, " ").slice(0, 140),
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
    .order("timestamp", { ascending: false })
    .limit(16);

  const chatHistory: AIMessage[] = (history || [])
    .slice().reverse()
    .filter((m) => m.body !== "__AI_RESUMED__" && m.body !== "__AGENT_JOINED__")
    .slice(-16)
    .map((m) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.body,
    }));

  // Generate on the server with OpenAI; preserve customer support on provider outages.
  let aiReply = "";
  try {
    const systemPrompt = await buildSystemPrompt();
    aiReply = await generateSupportReply({
      instructions: systemPrompt + (aiTakeover ? "\nNo human agent replied within five minutes. Resume as Eco, answer the latest pending question using the conversation context, and do not escalate this response." : ""),
      messages: chatHistory, maxOutputTokens: 650,
    });
  } catch {
    aiReply = aiTakeover
      ? "Je reprends la conversation. Je rencontre momentanément une difficulté pour générer la réponse complète ; vous pouvez reformuler votre question et je vous répondrai immédiatement."
      : "Je rencontre un problème technique. Un agent va vous aider. [ESCALATE]";
  }

  // Check if AI decided to escalate
  const shouldEscalate = !aiTakeover && aiReply.includes("[ESCALATE]");
  const shouldResolve = !shouldEscalate && !aiTakeover && aiReply.includes("[RESOLVE]");
  const cleanReply = aiReply.replaceAll("[ESCALATE]", "").replaceAll("[RESOLVE]", "").trim()
    || "Je veux vous répondre correctement. Pouvez-vous reformuler votre demande en une phrase ?";

  if (aiTakeover) {
    await supabase.from("chat_messages").insert({
      session_id,
      direction: "out",
      body: "__AI_RESUMED__",
      sent_by: "ai",
    });
  }

  // Store AI reply
  const { data: currentSession } = await supabase.from("chat_sessions").select("status").eq("id", session_id).single();
  if (currentSession?.status === "resolved") {
    return NextResponse.json({ status: "resolved", reply: null });
  }
  await supabase.from("chat_messages").insert({
    session_id,
    direction: "out",
    body: cleanReply,
    sent_by: "ai",
  });

  if (shouldEscalate) {
    await supabase.from("chat_sessions").update({ status: "escalated" }).eq("id", session_id).neq("status", "resolved");
    await broadcastAdminPushNotification({
      eventKey: `chat-ai-escalation:${session_id}`,
      title: "Live Chat · Intervention requise",
      body: messageBody.replace(/\s+/g, " ").slice(0, 140),
      url: "/admin/messages/",
      tag: `admin-chat-${session_id}`,
      requireInteraction: true,
    }).catch((error) => console.error("Admin AI escalation push failed:", error));
  }

  await supabase.from("chat_sessions").update({
    ...(shouldResolve ? { status: "resolved", unread_count: 0 } : {}),
    last_message: cleanReply,
    last_at: new Date().toISOString(),
  }).eq("id", session_id);

  return NextResponse.json({
    status: shouldEscalate ? "escalated" : shouldResolve ? "resolved" : "ai",
    reply: cleanReply,
    ai_takeover: aiTakeover,
    resolved: shouldResolve,
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
