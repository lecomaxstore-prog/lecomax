import { getAssistantCatalog, filterByConstraints, rankAssistantProducts } from "./assistant-retrieval";
import type { SearchIntent, RecommendationResult } from "./assistant-types";
import { getGroqClient } from "@/lib/groq-client";
import { loadCommerceConfiguration } from "./commerce-server";
import { shippingConfigFromSettings, shippingSummary } from "./shipping-config";
import { resolveShippingQuote } from "./shipping-zones";

export async function processIntent(intent: SearchIntent, userMessage: string): Promise<{
  recommendations?: RecommendationResult[];
  message?: string;
}> {
  if (intent.intent === "customer_service" || /livraison|shipping|delivery|frais|contact|whatsapp|téléphone|adresse|horaires/i.test(userMessage)) {
    const { settings, zones } = await loadCommerceConfiguration();
    const shipping = shippingConfigFromSettings(settings);
    const city = zones.flatMap(zone => zone.cities ?? []).find(city => userMessage.toLocaleLowerCase().includes(city.toLocaleLowerCase()));
    const specific = city ? resolveShippingQuote(city, 0, zones, shipping) : null;
    return { message: `${specific ? `Livraison à ${city} : ${specific.cost} ${settings.currency}. ${specific.freeThreshold > 0 ? `Offerte dès ${specific.freeThreshold} ${settings.currency}.` : ""} Délai : ${specific.estimatedDays}.` : `${shippingSummary(shipping)} Délai : ${shipping.estimatedDays}. Les tarifs propres à certaines villes sont confirmés dans le panier.`}\nContact : ${settings.store_email}${settings.store_phone ? ` · ${settings.store_phone}` : ""}${settings.business_hours ? ` · ${settings.business_hours}` : ""}.` };
  }
  
  if (intent.needsClarification && intent.clarificationQuestion) {
    return { message: intent.clarificationQuestion };
  }

  if (intent.directResponse) {
    return { message: intent.directResponse };
  }

  if (intent.intent === "search" || intent.intent === "budget_optimizer" || intent.intent === "alternatives") {
    const catalog = await getAssistantCatalog(intent.constraints);
    let filtered = filterByConstraints(catalog, intent.constraints);
    
    if (filtered.length === 0) {
      return { message: "Je suis désolé, mais nous n'avons aucun produit correspondant exactement à ces critères (budget, taille, ou marque). Souhaitez-vous élargir votre recherche ?" };
    }

    const ranked = rankAssistantProducts(filtered, userMessage, intent.constraints);
    const top = ranked.slice(0, 3);
    
    if (top.length > 0) {
      return { 
        recommendations: top,
        message: "Voici les meilleures options basées sur vos critères :"
      };
    }
  }
  
  if (intent.intent === "compare" && intent.targetProductIds && intent.targetProductIds.length > 0) {
    const catalog = await getAssistantCatalog();
    const targets = catalog.filter(p => intent.targetProductIds!.includes(p.slug));
    if (targets.length === 0) {
      return { message: "Je n'ai pas pu trouver les produits à comparer." };
    }
    
    // Use LLM to generate a natural comparison summary
    const client = getGroqClient();
    const compareResponse = await client.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: "Compare these products concisely for a customer in French. Focus on differences." },
        { role: "user", content: JSON.stringify(targets.map(t => ({ name: t.name, price: t.price, description: t.description }))) }
      ]
    });
    
    return { 
      message: compareResponse.choices[0]?.message?.content || "Voici la comparaison.",
      recommendations: targets.map(t => ({ productSlug: t.slug, score: 100, reason: "Comparaison" }))
    };
  }

  if (intent.intent === "human_handoff") {
    return { message: "Je vous mets en relation avec un conseiller humain. [ESCALATE]" };
  }

  return { message: "Je peux vous aider à trouver le produit idéal. Que recherchez-vous exactement ?" };
}
