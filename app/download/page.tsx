import { latestAndroidRelease } from "@/lib/app-release-server";
import { publicRelease } from "@/lib/app-releases";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import DownloadAndroidClient from "./DownloadAndroidClient";

export const metadata: Metadata = {
  title: "Télécharger l’application Android officielle | L’ecomax",
  description: "Téléchargez la dernière version sécurisée de l’application Android L’ecomax depuis le site officiel.",
  alternates: { canonical: "https://lecomax.com/download" },
};

export default async function DownloadPage() {
  const row = await latestAndroidRelease().catch(() => null);
  return <DownloadAndroidClient initialRelease={row ? publicRelease(row, "") : null} />;
}
