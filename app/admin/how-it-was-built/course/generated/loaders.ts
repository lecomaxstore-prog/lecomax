import type { CourseIndex, CourseLanguage, CourseModule } from "../types";

type LoadedJson = { default: CourseModule };
type Loader = () => Promise<LoadedJson>;

const loaders: Record<CourseLanguage, Record<string, Loader>> = {
  fr: {
    "module-00-learning-tools": () => import("../content/fr/module-00-learning-tools.json") as Promise<LoadedJson>,
    "module-01-internet-web": () => import("../content/fr/module-01-internet-web.json") as Promise<LoadedJson>,
    "module-02-git-github": () => import("../content/fr/module-02-git-github.json") as Promise<LoadedJson>,
    "module-03-html-accessibility": () => import("../content/fr/module-03-html-accessibility.json") as Promise<LoadedJson>,
    "module-04-css": () => import("../content/fr/module-04-css.json") as Promise<LoadedJson>,
    "module-05-responsive-tailwind": () => import("../content/fr/module-05-responsive-tailwind.json") as Promise<LoadedJson>,
    "module-06-javascript-foundations": () => import("../content/fr/module-06-javascript-foundations.json") as Promise<LoadedJson>,
    "module-07-js-data-problem-solving": () => import("../content/fr/module-07-js-data-problem-solving.json") as Promise<LoadedJson>,
    "module-08-dom-forms-storage": () => import("../content/fr/module-08-dom-forms-storage.json") as Promise<LoadedJson>,
    "async-fetch-errors": () => import("../content/fr/async-fetch-errors.json") as Promise<LoadedJson>,
    "typescript-contracts": () => import("../content/fr/typescript-contracts.json") as Promise<LoadedJson>,
    "react-fundamentals": () => import("../content/fr/react-fundamentals.json") as Promise<LoadedJson>,
    "react-state-forms-hooks": () => import("../content/fr/react-state-forms-hooks.json") as Promise<LoadedJson>,
    "nextjs-app-router": () => import("../content/fr/nextjs-app-router.json") as Promise<LoadedJson>,
    "nextjs-server-data": () => import("../content/fr/nextjs-server-data.json") as Promise<LoadedJson>,
    "sql-data-modeling": () => import("../content/fr/sql-data-modeling.json") as Promise<LoadedJson>,
    "supabase-platform": () => import("../content/fr/supabase-platform.json") as Promise<LoadedJson>,
    "ecommerce-architecture": () => import("../content/fr/ecommerce-architecture.json") as Promise<LoadedJson>,
    "authentication-security-privacy": () => import("../content/fr/authentication-security-privacy.json") as Promise<LoadedJson>,
    "quality-engineering": () => import("../content/fr/quality-engineering.json") as Promise<LoadedJson>,
    "web-quality": () => import("../content/fr/web-quality.json") as Promise<LoadedJson>,
    "email-systems": () => import("../content/fr/email-systems.json") as Promise<LoadedJson>,
    "paypal-payments": () => import("../content/fr/paypal-payments.json") as Promise<LoadedJson>,
    "notifications": () => import("../content/fr/notifications.json") as Promise<LoadedJson>,
    "openai-integration": () => import("../content/fr/openai-integration.json") as Promise<LoadedJson>,
    "analytics-growth": () => import("../content/fr/analytics-growth.json") as Promise<LoadedJson>,
    "deployment-operations": () => import("../content/fr/deployment-operations.json") as Promise<LoadedJson>,
    "final-store-capstone": () => import("../content/fr/final-store-capstone.json") as Promise<LoadedJson>,
  },
  en: {
    "module-00-learning-tools": () => import("../content/en/module-00-learning-tools.json") as Promise<LoadedJson>,
    "module-01-internet-web": () => import("../content/en/module-01-internet-web.json") as Promise<LoadedJson>,
    "module-02-git-github": () => import("../content/en/module-02-git-github.json") as Promise<LoadedJson>,
    "module-03-html-accessibility": () => import("../content/en/module-03-html-accessibility.json") as Promise<LoadedJson>,
    "module-04-css": () => import("../content/en/module-04-css.json") as Promise<LoadedJson>,
    "module-05-responsive-tailwind": () => import("../content/en/module-05-responsive-tailwind.json") as Promise<LoadedJson>,
    "module-06-javascript-foundations": () => import("../content/en/module-06-javascript-foundations.json") as Promise<LoadedJson>,
    "module-07-js-data-problem-solving": () => import("../content/en/module-07-js-data-problem-solving.json") as Promise<LoadedJson>,
    "module-08-dom-forms-storage": () => import("../content/en/module-08-dom-forms-storage.json") as Promise<LoadedJson>,
    "async-fetch-errors": () => import("../content/en/async-fetch-errors.json") as Promise<LoadedJson>,
    "typescript-contracts": () => import("../content/en/typescript-contracts.json") as Promise<LoadedJson>,
    "react-fundamentals": () => import("../content/en/react-fundamentals.json") as Promise<LoadedJson>,
    "react-state-forms-hooks": () => import("../content/en/react-state-forms-hooks.json") as Promise<LoadedJson>,
    "nextjs-app-router": () => import("../content/en/nextjs-app-router.json") as Promise<LoadedJson>,
    "nextjs-server-data": () => import("../content/en/nextjs-server-data.json") as Promise<LoadedJson>,
    "sql-data-modeling": () => import("../content/en/sql-data-modeling.json") as Promise<LoadedJson>,
    "supabase-platform": () => import("../content/en/supabase-platform.json") as Promise<LoadedJson>,
    "ecommerce-architecture": () => import("../content/en/ecommerce-architecture.json") as Promise<LoadedJson>,
    "authentication-security-privacy": () => import("../content/en/authentication-security-privacy.json") as Promise<LoadedJson>,
    "quality-engineering": () => import("../content/en/quality-engineering.json") as Promise<LoadedJson>,
    "web-quality": () => import("../content/en/web-quality.json") as Promise<LoadedJson>,
    "email-systems": () => import("../content/en/email-systems.json") as Promise<LoadedJson>,
    "paypal-payments": () => import("../content/en/paypal-payments.json") as Promise<LoadedJson>,
    "notifications": () => import("../content/en/notifications.json") as Promise<LoadedJson>,
    "openai-integration": () => import("../content/en/openai-integration.json") as Promise<LoadedJson>,
    "analytics-growth": () => import("../content/en/analytics-growth.json") as Promise<LoadedJson>,
    "deployment-operations": () => import("../content/en/deployment-operations.json") as Promise<LoadedJson>,
    "final-store-capstone": () => import("../content/en/final-store-capstone.json") as Promise<LoadedJson>,
  },
  ar: {
    "module-00-learning-tools": () => import("../content/ar/module-00-learning-tools.json") as Promise<LoadedJson>,
    "module-01-internet-web": () => import("../content/ar/module-01-internet-web.json") as Promise<LoadedJson>,
    "module-02-git-github": () => import("../content/ar/module-02-git-github.json") as Promise<LoadedJson>,
    "module-03-html-accessibility": () => import("../content/ar/module-03-html-accessibility.json") as Promise<LoadedJson>,
    "module-04-css": () => import("../content/ar/module-04-css.json") as Promise<LoadedJson>,
    "module-05-responsive-tailwind": () => import("../content/ar/module-05-responsive-tailwind.json") as Promise<LoadedJson>,
    "module-06-javascript-foundations": () => import("../content/ar/module-06-javascript-foundations.json") as Promise<LoadedJson>,
    "module-07-js-data-problem-solving": () => import("../content/ar/module-07-js-data-problem-solving.json") as Promise<LoadedJson>,
    "module-08-dom-forms-storage": () => import("../content/ar/module-08-dom-forms-storage.json") as Promise<LoadedJson>,
    "async-fetch-errors": () => import("../content/ar/async-fetch-errors.json") as Promise<LoadedJson>,
    "typescript-contracts": () => import("../content/ar/typescript-contracts.json") as Promise<LoadedJson>,
    "react-fundamentals": () => import("../content/ar/react-fundamentals.json") as Promise<LoadedJson>,
    "react-state-forms-hooks": () => import("../content/ar/react-state-forms-hooks.json") as Promise<LoadedJson>,
    "nextjs-app-router": () => import("../content/ar/nextjs-app-router.json") as Promise<LoadedJson>,
    "nextjs-server-data": () => import("../content/ar/nextjs-server-data.json") as Promise<LoadedJson>,
    "sql-data-modeling": () => import("../content/ar/sql-data-modeling.json") as Promise<LoadedJson>,
    "supabase-platform": () => import("../content/ar/supabase-platform.json") as Promise<LoadedJson>,
    "ecommerce-architecture": () => import("../content/ar/ecommerce-architecture.json") as Promise<LoadedJson>,
    "authentication-security-privacy": () => import("../content/ar/authentication-security-privacy.json") as Promise<LoadedJson>,
    "quality-engineering": () => import("../content/ar/quality-engineering.json") as Promise<LoadedJson>,
    "web-quality": () => import("../content/ar/web-quality.json") as Promise<LoadedJson>,
    "email-systems": () => import("../content/ar/email-systems.json") as Promise<LoadedJson>,
    "paypal-payments": () => import("../content/ar/paypal-payments.json") as Promise<LoadedJson>,
    "notifications": () => import("../content/ar/notifications.json") as Promise<LoadedJson>,
    "openai-integration": () => import("../content/ar/openai-integration.json") as Promise<LoadedJson>,
    "analytics-growth": () => import("../content/ar/analytics-growth.json") as Promise<LoadedJson>,
    "deployment-operations": () => import("../content/ar/deployment-operations.json") as Promise<LoadedJson>,
    "final-store-capstone": () => import("../content/ar/final-store-capstone.json") as Promise<LoadedJson>,
  },
};

const indexLoaders: Record<CourseLanguage, () => Promise<{ default: CourseIndex }>> = {
  fr: () => import("../content/index/fr.json") as Promise<{ default: CourseIndex }>,
  en: () => import("../content/index/en.json") as Promise<{ default: CourseIndex }>,
  ar: () => import("../content/index/ar.json") as Promise<{ default: CourseIndex }>,
};

export async function loadCourseModule(lang: CourseLanguage, moduleId: string): Promise<CourseModule> {
  const loader = loaders[lang]?.[moduleId];
  if (!loader) throw new Error("Unknown course module: " + lang + "/" + moduleId);
  const loaded = await loader();
  return loaded.default;
}

export async function loadCourseIndex(lang: CourseLanguage): Promise<CourseIndex> {
  const loaded = await indexLoaders[lang]();
  return loaded.default;
}
