export type AssistantRole = "user" | "assistant" | "system" | "tool";
export type AssistantPlatform = "web" | "mobile_app" | "admin";

export type AssistantSession = {
  id: string;
  user_id?: string | null;
  platform: AssistantPlatform;
  context_data: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type AssistantMessage = {
  id: string;
  session_id: string;
  role: AssistantRole;
  content: string;
  structured_data?: Record<string, any> | null;
  created_at: string;
};

// ─── Intent Schemas ──────────────────────────────────────

export type SearchIntent = {
  intent: "search" | "compare" | "budget_optimizer" | "gift_finder" | "bundle" | "alternatives" | "general_chat" | "customer_service" | "human_handoff";
  constraints?: {
    category?: string;
    subCategory?: string;
    budgetMax?: number;
    budgetMin?: number;
    preferredBrands?: string[];
    excludedBrands?: string[];
    colors?: string[];
    sizes?: string[];
    gender?: "homme" | "femme" | "unisexe" | "enfant";
    priorities?: string[];
    useCase?: string;
  };
  targetProductIds?: string[];
  needsClarification: boolean;
  clarificationQuestion?: string;
  directResponse?: string;
};

export type RecommendationResult = {
  productSlug: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  score: number;
  reason: string;
  label?: "Best Match" | "Best Value" | "Most Comfortable" | "Premium Choice" | "Budget Choice" | "Alternative";
};
