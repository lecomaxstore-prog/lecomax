import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { sensitiveRateLimit } from "@/lib/sensitive-rate-limit";
import { supabase } from "@/lib/supabase";
import { extractIntent } from "@/lib/assistant-intent";
import { processIntent } from "@/lib/assistant-tools";
import type { AssistantMessage } from "@/lib/assistant-types";

export async function POST(request: NextRequest) {
  const limited = await sensitiveRateLimit(request, "assistant");
  if (limited) return limited;
  try {
    const body = await readJsonLimited(request, 64 * 1024);
    const { sessionId, messages, platform = "web" } = body as {
      sessionId?: string;
      messages: { role: "user" | "assistant"; content: string; recommendations?: any[] }[];
      platform: "web" | "mobile_app";
    };

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30 ||
      messages.some(message => !message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || !message.content.trim() || message.content.length > 4000) ||
      messages[messages.length - 1].role !== "user" ||
      !["web", "mobile_app"].includes(platform) ||
      (sessionId !== undefined && (typeof sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(sessionId)))) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // 1. Session Management
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // Create new session
      const { data: sessionData, error: sessionError } = await supabase
        .from("assistant_sessions")
        .insert([{ platform, context_data: {} }])
        .select("id")
        .single();
        
      if (!sessionError && sessionData) {
        currentSessionId = sessionData.id;
      }
    }

    const latestMessage = messages[messages.length - 1];

    // Log user message asynchronously
    if (currentSessionId) {
      void supabase.from("assistant_messages").insert([{
        session_id: currentSessionId,
        role: "user",
        content: latestMessage.content
      }]);
    }

    // 2. Intent Extraction
    let currentContext = {};
    if (currentSessionId) {
      const { data } = await supabase.from("assistant_sessions").select("context_data").eq("id", currentSessionId).single();
      if (data && data.context_data) currentContext = data.context_data;
    }
    
    const intent = await extractIntent(messages, currentContext);

    // 3. Process Intent (Tools / Retrieval)
    const result = await processIntent(intent, latestMessage.content);

    // Update context in session asynchronously
    if (currentSessionId && intent.constraints) {
      void supabase.from("assistant_sessions")
        .update({ context_data: intent.constraints })
        .eq("id", currentSessionId);
    }

    // Log AI response asynchronously
    if (currentSessionId) {
      void supabase.from("assistant_messages").insert([{
        session_id: currentSessionId,
        role: "assistant",
        content: result.message || "Voici les recommandations.",
        structured_data: { recommendations: result.recommendations, intent: intent.intent }
      }]);
    }

    return NextResponse.json({
      sessionId: currentSessionId,
      message: result.message,
      recommendations: result.recommendations,
      intent: intent.intent
    });

  } catch (error) {
    console.error("Assistant API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
