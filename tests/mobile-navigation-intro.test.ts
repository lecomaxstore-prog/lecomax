import assert from "node:assert/strict";
import test from "node:test";
import {
  isHomepagePath,
  safeParentPath,
} from "../mobile/src/lib/navigation-policy.ts";
import {
  appLaunchConfigFromSettings,
  FALLBACK_APP_LAUNCH_CONFIG,
} from "../mobile/src/lib/app-launch-config.ts";
import { redirectSystemPath } from "../mobile/src/app/+native-intent.ts";
import { validateAppIntroSettings } from "../lib/app-intro-settings.ts";

test("child routes without history resolve to safe parents", () => {
  assert.equal(
    safeParentPath("/product/chaussure", { origin: "search" }),
    "/search",
  );
  assert.equal(
    safeParentPath("/product/chaussure", { origin: "wishlist" }),
    "/wishlist",
  );
  assert.equal(
    safeParentPath("/product/chaussure", { parentCategory: "femme" }),
    "/catalog?category=femme",
  );
  assert.equal(safeParentPath("/checkout"), "/cart");
  assert.equal(safeParentPath("/orders"), "/account");
});

test("the homepage is identified as the protected navigation root", () => {
  assert.equal(isHomepagePath("/"), true);
  assert.equal(isHomepagePath("/(tabs)"), true);
  assert.equal(isHomepagePath("/product/test"), false);
  assert.equal(isHomepagePath("/cart"), false);
});

test("website deep links are rewritten to native application routes", () => {
  assert.equal(
    redirectSystemPath({
      path: "https://lecomax.com/produit/sneaker-noire",
      initial: true,
    }),
    "/product/sneaker-noire",
  );
  assert.equal(
    redirectSystemPath({
      path: "https://lecomax.com/suivre-commande",
      initial: true,
    }),
    "/orders",
  );
});

test("launch configuration is bounded and falls back offline", () => {
  const config = appLaunchConfigFromSettings([
    { key: "app_intro_duration_ms", value: "99999" },
    { key: "app_intro_background", value: "javascript:red" },
    { key: "app_onboarding_slides", value: "not-json" },
  ]);
  assert.equal(config.introDurationMs, 2500);
  assert.equal(
    config.introBackground,
    FALLBACK_APP_LAUNCH_CONFIG.introBackground,
  );
  assert.equal(config.slides.length, 3);
});

test("admin intro validation rejects unsafe or excessive remote content", () => {
  assert.match(
    validateAppIntroSettings({ app_intro_duration_ms: "9000" }) ?? "",
    /durée/i,
  );
  assert.match(
    validateAppIntroSettings({
      app_onboarding_slides: JSON.stringify([
        {
          title: "Titre",
          description: "Description",
          image: "javascript:alert(1)",
        },
      ]),
    }) ?? "",
    /invalide/i,
  );
  assert.equal(
    validateAppIntroSettings({
      app_intro_enabled: "true",
      app_intro_duration_ms: "1600",
      app_intro_background: "#080808",
      app_intro_message: "DÉCOUVREZ. CHOISISSEZ. PROFITEZ.",
    }),
    null,
  );
});
