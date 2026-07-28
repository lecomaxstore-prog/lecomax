export const APP_INTRO_SETTING_DEFAULTS = {
  app_intro_enabled: "true",
  app_intro_message: "DÉCOUVREZ. CHOISISSEZ. PROFITEZ.",
  app_intro_background: "#080808",
  app_intro_duration_ms: "1600",
  app_intro_version: "1",
  app_onboarding_slides: JSON.stringify([
    {
      id: "discover",
      title: "TOUT L’ECOMAX, DANS VOTRE POCHE",
      description:
        "Découvrez nos nouveautés, collections et offres où que vous soyez.",
      image: "",
    },
    {
      id: "trust",
      title: "ACHETEZ EN TOUTE CONFIANCE",
      description:
        "Paiement sécurisé, livraison suivie et assistance à votre service.",
      image: "",
    },
    {
      id: "offers",
      title: "NE MANQUEZ AUCUNE OFFRE",
      description:
        "Enregistrez vos favoris et recevez nos nouveautés.",
      image: "",
    },
  ]),
} as const;

export const APP_INTRO_SETTING_KEYS = Object.keys(
  APP_INTRO_SETTING_DEFAULTS,
);

export function validateAppIntroSettings(values: Record<string, unknown>) {
  if (
    "app_intro_enabled" in values &&
    !["true", "false", true, false].includes(
      values.app_intro_enabled as string | boolean,
    )
  ) {
    return "L’activation de l’intro est invalide.";
  }
  if (
    "app_intro_message" in values &&
    (typeof values.app_intro_message !== "string" ||
      !values.app_intro_message.trim() ||
      values.app_intro_message.length > 90)
  ) {
    return "Le message de l’intro doit contenir entre 1 et 90 caractères.";
  }
  if (
    "app_intro_background" in values &&
    !/^#[0-9a-f]{6}$/i.test(String(values.app_intro_background))
  ) {
    return "La couleur de l’intro doit utiliser le format #RRGGBB.";
  }
  if ("app_intro_duration_ms" in values) {
    const duration = Number(values.app_intro_duration_ms);
    if (!Number.isFinite(duration) || duration < 800 || duration > 2500) {
      return "La durée de l’intro doit être comprise entre 800 et 2500 ms.";
    }
  }
  if (
    "app_intro_version" in values &&
    (typeof values.app_intro_version !== "string" ||
      !values.app_intro_version.trim() ||
      values.app_intro_version.length > 30)
  ) {
    return "La version de l’intro est invalide.";
  }
  if ("app_onboarding_slides" in values) {
    try {
      const slides = JSON.parse(String(values.app_onboarding_slides));
      if (!Array.isArray(slides) || slides.length < 1 || slides.length > 6) {
        return "L’onboarding doit contenir entre 1 et 6 écrans.";
      }
      for (const slide of slides) {
        if (
          !slide ||
          typeof slide !== "object" ||
          typeof slide.title !== "string" ||
          !slide.title.trim() ||
          slide.title.length > 80 ||
          typeof slide.description !== "string" ||
          !slide.description.trim() ||
          slide.description.length > 180 ||
          (slide.image &&
            (typeof slide.image !== "string" ||
              slide.image.length > 500 ||
              !/^https:\/\//i.test(slide.image)))
        ) {
          return "Le contenu des écrans d’onboarding est invalide.";
        }
      }
    } catch {
      return "La configuration de l’onboarding n’est pas un JSON valide.";
    }
  }
  return null;
}
