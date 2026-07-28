import type { Metadata } from "next";
import DownloadAndroidClient from "./DownloadAndroidClient";

export const metadata: Metadata = {
  title: "Télécharger l’application Android officielle | L’ecomax",
  description: "Téléchargez la dernière version sécurisée de l’application Android L’ecomax depuis le site officiel.",
  alternates: { canonical: "https://lecomax.com/download" },
};

export default function DownloadPage() {
  return <DownloadAndroidClient />;
}
