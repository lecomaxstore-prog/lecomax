export async function register() {
  const { applicationEnvironment } = await import("./operations/seo-vercel/lib/environment-target.mjs");
  await applicationEnvironment(process.env);
}
