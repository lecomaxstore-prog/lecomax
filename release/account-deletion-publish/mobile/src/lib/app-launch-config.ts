import { msg } from "@/i18n";
import { localizedContent } from "@/i18n/content";
type SettingRow = { key: string; value: unknown };

export type OnboardingSlideConfig = {
  id: string;
  title: string;
  description: string;
  image?: string;
};

export type AppLaunchConfig = {
  introEnabled: boolean;
  introMessage: string;
  introBackground: string;
  introDurationMs: number;
  introVersion: string;
  onboardingEnabled: boolean;
  onboardingVersion: string;
  slides: OnboardingSlideConfig[];
};

export const FALLBACK_ONBOARDING_SLIDES: OnboardingSlideConfig[] = [
  {
    id: "discover",
    get title() { return msg("appLaunchConfig.allOfLEcomaxInYourPocketUppercase"); },
    get description() { return msg("appLaunchConfig.exploreOurNewArrivalsCollectionsAndOffersWhereverYouAre"); },
  },
  {
    id: "trust",
    get title() { return msg("appLaunchConfig.shopWithConfidenceUppercase"); },
    get description() { return msg("appLaunchConfig.securePaymentTrackedDeliveryAndSupportAtYourService"); },
  },
  {
    id: "offers",
    get title() { return msg("appLaunchConfig.neverMissAnOfferUppercase"); },
    get description() { return msg("appLaunchConfig.saveYourFavoritesAndStayUpToDateWithNewArrivals"); },
  },
];

export const FALLBACK_APP_LAUNCH_CONFIG: AppLaunchConfig = {
  introEnabled: true,
  get introMessage() { return msg("appLaunchConfig.discoverChooseEnjoyUppercase"); },
  introBackground: "#080808",
  introDurationMs: 1_600,
  introVersion: "1",
  onboardingEnabled: true,
  onboardingVersion: "1",
  slides: FALLBACK_ONBOARDING_SLIDES,
};

function cleanText(value: unknown, fallback: string, max: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text.length <= max ? localizedContent(text) : fallback;
}

function safeSlides(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return FALLBACK_ONBOARDING_SLIDES;
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return FALLBACK_ONBOARDING_SLIDES;
    const slides = parsed.slice(0, 6).flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      const fallback =
        FALLBACK_ONBOARDING_SLIDES[index] ??
        FALLBACK_ONBOARDING_SLIDES.at(-1)!;
      const image =
        typeof candidate.image === "string" &&
        /^https:\/\//i.test(candidate.image.trim())
          ? candidate.image.trim().slice(0, 500)
          : undefined;
      return [
        {
          id: cleanText(candidate.id, `slide-${index + 1}`, 40),
          title: cleanText(candidate.title, fallback.title, 80),
          description: cleanText(
            candidate.description,
            fallback.description,
            180,
          ),
          image,
        },
      ];
    });
    return slides.length >= 1 ? slides : FALLBACK_ONBOARDING_SLIDES;
  } catch {
    return FALLBACK_ONBOARDING_SLIDES;
  }
}

export function appLaunchConfigFromSettings(
  rows: SettingRow[] | undefined,
): AppLaunchConfig {
  const settings = Object.fromEntries(
    (rows ?? []).map((item) => [item.key, String(item.value ?? "")]),
  );
  const duration = Number(settings.app_intro_duration_ms);
  return {
    introEnabled: settings.app_intro_enabled !== "false",
    introMessage: cleanText(
      settings.app_intro_message,
      FALLBACK_APP_LAUNCH_CONFIG.introMessage,
      90,
    ),
    introBackground: /^#[0-9a-f]{6}$/i.test(
      settings.app_intro_background ?? "",
    )
      ? settings.app_intro_background
      : FALLBACK_APP_LAUNCH_CONFIG.introBackground,
    introDurationMs: Number.isFinite(duration)
      ? Math.max(800, Math.min(2_500, Math.round(duration)))
      : FALLBACK_APP_LAUNCH_CONFIG.introDurationMs,
    introVersion: cleanText(
      settings.app_intro_version,
      FALLBACK_APP_LAUNCH_CONFIG.introVersion,
      30,
    ),
    onboardingEnabled: settings.app_onboarding_enabled !== "false",
    onboardingVersion: cleanText(
      settings.app_onboarding_version,
      FALLBACK_APP_LAUNCH_CONFIG.onboardingVersion,
      30,
    ),
    slides: safeSlides(settings.app_onboarding_slides),
  };
}
