import type { TutorProgress, TutorTopic } from "./ai-tutor";

export const TUTOR_LANGUAGES = { ar: "العربية", darija: "الدارجة المغربية", fr: "Français", en: "English" } as const;
export type TutorLanguage = keyof typeof TUTOR_LANGUAGES;
export const isTutorLanguage = (value: unknown): value is TutorLanguage => typeof value === "string" && Object.hasOwn(TUTOR_LANGUAGES, value);

const stages: { title: string; topic: TutorTopic; concepts: string[] }[] = [
  { title: "أساسيات الويب", topic: "foundations", concepts: ["Website, Browser, Client & Server", "Domain & Hosting", "HTTP", "HTML", "CSS & responsive design", "JavaScript in the browser"] },
  { title: "JavaScript", topic: "javascript", concepts: ["Variables", "Arrays & Objects", "Functions", "Conditions & Loops", "Promises & async/await", "fetch & JSON", "Modules"] },
  { title: "React", topic: "react", concepts: ["Components & Props", "State & useState", "Events", "Forms", "Rendering", "Hooks & useEffect", "Reusable components"] },
  { title: "Next.js", topic: "nextjs", concepts: ["App Router & app/", "page.tsx & layout.tsx", "loading.tsx & error.tsx", "Dynamic routes", "Server & Client Components", "Metadata & Images", "Route Handlers"] },
  { title: "الخادم وواجهات API", topic: "api", concepts: ["API, Request & Response", "GET & POST", "PATCH & DELETE", "Validation", "Authentication & Authorization"] },
  { title: "قاعدة البيانات", topic: "database", concepts: ["Tables, Rows & IDs", "Relationships", "SQL & CRUD", "Indexes", "Database security & RLS"] },
  { title: "متجر حقيقي", topic: "commerce", concepts: ["Products, Variants & Categories", "Inventory", "Cart & Checkout", "Orders & Customers", "Payments & Delivery", "Admin dashboard"] },
  { title: "النشر والإنتاج", topic: "deployment", concepts: ["Environment Variables", "Git & GitHub", "Vercel, Deployments & Domains", "Logs & Debugging", "Security", "Performance & SEO"] },
  { title: "هندسة متقدمة", topic: "architecture", concepts: ["Application architecture", "Caching", "Server Actions", "Optimization", "Reusable systems", "Security & scalable structure"] },
];
export const TUTOR_COURSE = stages.map((stage, index) => ({ ...stage, lessons: stage.concepts.map((title, lesson) => ({ id: `${stage.topic}-${lesson + 1}`, title, topic: stage.topic, stage: index + 1 })) }));
export const TUTOR_LESSONS = TUTOR_COURSE.flatMap(stage => stage.lessons);
export type TutorLesson = typeof TUTOR_LESSONS[number];
export function recommendTutorLesson(completed: string[], progress: TutorProgress[]) {
  const remaining = TUTOR_LESSONS.filter(lesson => !completed.includes(lesson.id));
  const review = progress.find(item => item.needs_practice && item.studied_turns > 0);
  return remaining.find(lesson => lesson.topic === review?.topic) ?? remaining[0];
}

/** Select paths only from known source files; arbitrary user paths use the protected source reader. */
export function tutorSourcePaths(text: string, topic: TutorTopic, mode: string): string[] {
  const q = text.toLowerCase();
  const routes: [RegExp, string[]][] = [
    [/checkout|الدفع|إتمام الطلب/, ["app/checkout/page.tsx", "app/api/orders/route.ts"]],
    [/order|طلب|commandes/, ["app/api/orders/route.ts", "app/admin/orders/page.tsx"]],
    [/auth|login|تسجيل الدخول|connexion/, ["lib/admin-access.ts", "middleware.ts"]],
    [/customer|عميل|عملاء|زبون/, ["app/admin/customers/page.tsx"]],
    [/product|منتج|منتجات|produit/, ["app/produit/[slug]/page.tsx", "app/api/products/route.ts", "components/ProductCard.tsx"]],
    [/cart|panier|السلة/, ["app/panier/page.tsx"]],
    [/notif|إشعار|إشعارات/, ["lib/push-notifications.ts"]],
    [/deploy|vercel|نشر|environment|env\b/, ["next.config.js", "vercel.json"]],
    [/image|upload|صور|ملفات/, ["components/ProductCard.tsx"]],
  ];
  const projectQuestion = mode === "project" || /موقعي|مشروعي|متجري|my (project|site|shop)|mon (site|projet)|lecomax|l.écomax/i.test(q);
  if (!projectQuestion) return [];
  const match = routes.find(([pattern]) => pattern.test(q));
  if (match) return match[1];
  const defaults: Partial<Record<TutorTopic, string[]>> = { react: ["components/ProductCard.tsx"], api: ["app/api/products/route.ts"], database: ["lib/supabase-server.ts"], auth: ["lib/admin-access.ts"], deployment: ["next.config.js"], commerce: ["app/checkout/page.tsx"] };
  return defaults[topic] ?? ["app/layout.tsx", "app/page.tsx"];
}

export function tutorSimplificationLevel(messages: { role: string; content: string }[]) {
  const struggles = messages.filter(message => message.role === "user" && /لم أفهم|ما فهمتش|لم افهم|وضح أكثر|شرح أبسط|بطريقة أسهل|simpler|don.t understand|pas compris/i.test(message.content.split("\n\nFollow-up action:")[0])).length;
  return Math.min(6, 1 + struggles);
}
