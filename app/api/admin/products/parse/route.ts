import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";
import { readJsonLimited } from "@/lib/request-body";
import { extractProductWithAI } from "@/lib/product-paste-ai";
import { openAIErrorCode } from "@/lib/openai-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const blocked = await protectAdminMutation(req, { key: "ai:product-paste", limit: 10 });
  if (blocked) return blocked;
  const input = await readJsonLimited(req, 100_000).catch(() => null);
  if (!input || typeof input.text !== "string" || input.text.trim().length < 10 || input.text.length > 20_000) {
    return NextResponse.json({ error: "Collez entre 10 et 20 000 caractères d’informations produit." }, { status: 400 });
  }
  try {
    return NextResponse.json(await extractProductWithAI(input.text.trim()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = openAIErrorCode(error);
    const provider = error as { status?: number; code?: string };
    const message = code === "AI_CONFIGURATION_REQUIRED" ? "Configurez la clé OpenAI sur le serveur."
      : code === "AI_BILLING_REQUIRED" ? "Le crédit API OpenAI est épuisé. Vérifiez la facturation."
      : provider.status === 404 || provider.code === "model_not_found" ? "GPT-6.1 Sol n’est pas accessible avec ce compte API. Vérifiez l’accès au modèle."
      : "L’analyse GPT-6.1 Sol est indisponible. Réessayez ou utilisez la détection sans IA.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
