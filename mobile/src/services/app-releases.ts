import { z } from "zod";
import { apiRequestValidated } from "@/lib/api-client";

const androidReleaseSchema = z.object({
  platform: z.literal("android"),
  versionName: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  versionCode: z.number().int().positive(),
  downloadUrl: z.string().url(),
  fileSize: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  minimumAndroidVersion: z.string().min(1).max(20),
  releaseDate: z.string().datetime(),
  required: z.boolean(),
  releaseNotes: z.array(z.string().min(1).max(300)).max(20),
});

export function getLatestAndroidRelease() {
  return apiRequestValidated("/api/app-releases/android/latest", androidReleaseSchema, {
    timeoutMs: 8_000,
    retries: 1,
  });
}
