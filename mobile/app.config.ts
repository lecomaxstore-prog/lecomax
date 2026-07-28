import fs from "node:fs";
import path from "node:path";
import baseConfig from "./app.base.json";

function readRootPublicEnvironment() {
  const filename = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(filename)) return {};
  const allowed = new Set(["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
  return Object.fromEntries(
    fs.readFileSync(filename, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^["']|["']$/g, "")];
      })
      .filter(([key]) => allowed.has(key)),
  );
}

const local = readRootPublicEnvironment();
const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || local.NEXT_PUBLIC_SITE_URL || "https://lecomax.com";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || local.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const productionBuild = process.env.EAS_BUILD_PROFILE?.startsWith("production") === true;

if (productionBuild) {
  if (!apiUrl.startsWith("https://")) throw new Error("Production API URL must use HTTPS.");
  if (!supabaseUrl?.startsWith("https://") || !supabaseAnonKey) {
    throw new Error("Production Supabase public client configuration is missing.");
  }
}

export default {
  ...baseConfig.expo,
  plugins: [
    ...(baseConfig.expo.plugins ?? []),
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 26,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          usesCleartextTraffic: false,
        },
      },
    ],
    "expo-video",
  ],
  extra: {
    apiUrl,
    supabaseUrl,
    supabaseAnonKey,
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
        "298c2ed9-078f-4c41-b46f-282c17e1e532",
    },
  },
};
