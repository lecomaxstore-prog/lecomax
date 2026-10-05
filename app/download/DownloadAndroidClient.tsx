"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicAndroidRelease } from "@/lib/app-releases";

function bytes(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value / 1024 / 1024) + " Mo";
}

function releaseDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}

export default function DownloadAndroidClient({ initialRelease }: { initialRelease: PublicAndroidRelease | null }) {
  const [release, setRelease] = useState<PublicAndroidRelease | null>(initialRelease);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(initialRelease ? "" : "Les informations de version sont indisponibles pour le moment.");
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState<"android" | "ios" | "other">("other");

  async function load() {
    setLoading(!release);
    setError("");
    try {
      const response = await fetch("/api/app-releases/android/latest", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Aucune version n’est disponible.");
      setRelease({ ...data, downloadUrl: new URL(data.downloadUrl, window.location.origin).pathname });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Le service de téléchargement est indisponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const agent = navigator.userAgent.toLowerCase();
    setDevice(/android/.test(agent) ? "android" : /iphone|ipad|ipod/.test(agent) ? "ios" : "other");
    void load();
  }, []);

  const formattedDate = useMemo(() => release ? releaseDate(release.releaseDate) : "", [release]);

  function download() {
    if (!release || downloading) return;
    setDownloading(true);
    setError("");
    try {
      const target = new URL(release.downloadUrl, window.location.origin);
      const isLocal =
        ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
        target.origin === window.location.origin;
      if (
        target.origin !== window.location.origin ||
        (target.protocol !== "https:" && !isLocal)
      ) {
        throw new Error("Le lien de téléchargement sécurisé est invalide.");
      }

      // The official endpoint redirects to the signed APK artifact. A browser
      // navigation can follow that redirect, whereas fetch is blocked by the
      // artifact host's cross-origin policy on mobile browsers.
      window.location.assign(target.toString());
      window.setTimeout(() => setDownloading(false), 2500);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Le téléchargement n’a pas pu démarrer.");
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f5f2] text-neutral-950">
      <section className="border-b border-black/10 bg-[#0a0a0a] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_420px] lg:items-center lg:px-10">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#43e06b]">Application officielle L’ecomax</p>
            <h1 className="mt-5 max-w-3xl break-words text-4xl font-black leading-[.96] tracking-[-.055em] sm:text-6xl">
              Votre boutique dans votre poche.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Téléchargez directement la dernière application Android signée de L’ecomax. Rapide, sécurisée et connectée au même catalogue que lecomax.com.
            </p>
            {device === "ios" && (
              <div role="status" className="mt-6 max-w-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                Vous utilisez un iPhone ou un iPad. Les fichiers APK fonctionnent uniquement sur Android et ne peuvent pas être installés sur iOS.
              </div>
            )}
          </div>
          <div className="min-w-0 border border-white/15 bg-white/[.06] p-6 backdrop-blur sm:p-8">
            <div className="flex items-center gap-4">
              <Image src="/icons/premium-v12-192.png" alt="Icône de l’application L’ecomax" width={76} height={76} className="rounded-[20px]" priority />
              <div>
                <p className="text-2xl font-black tracking-tight">L’ecomax</p>
                <p className="mt-1 text-sm text-white/50">Shopping officiel Android</p>
              </div>
            </div>
            {loading ? (
              <div aria-label="Chargement de la version" className="mt-7 space-y-3">
                <div className="h-12 animate-pulse bg-white/10" />
                <div className="h-5 w-2/3 animate-pulse bg-white/10" />
              </div>
            ) : release ? (
              <>
                <a
                  href={release.downloadUrl}
                  onClick={(event) => { event.preventDefault(); download(); }}
                  aria-disabled={downloading}
                  aria-label={`Télécharger L’ecomax ${release.versionName} pour Android`}
                  className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 bg-[#43e06b] px-5 text-sm font-black text-black transition hover:bg-[#65eb84] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 disabled:cursor-wait disabled:opacity-70"
                >
                  <span aria-hidden>↓</span>
                  {downloading ? "PRÉPARATION…" : "TÉLÉCHARGER L’APK ANDROID"}
                </a>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
                  <span>Version {release.versionName}</span>
                  <span>{bytes(release.fileSize)}</span>
                  <span>Android {release.minimumAndroidVersion}+</span>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => void load()} className="mt-7 min-h-12 w-full border border-white/25 px-4 text-sm font-bold hover:border-white">
                RÉESSAYER
              </button>
            )}
            {error && <p role="alert" className="mt-4 text-sm leading-5 text-red-300">{error}</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8 sm:py-16 lg:px-10">
        {release && (
          <section aria-labelledby="release-details" className="grid border border-neutral-200 bg-white md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Version actuelle", release.versionName],
              ["Taille du fichier", bytes(release.fileSize)],
              ["Publication", formattedDate],
              ["Android minimum", release.minimumAndroidVersion],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-neutral-100 p-5 last:border-0 md:border-r xl:border-b-0">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-400">{label}</p>
                <p className="mt-2 text-base font-black">{value}</p>
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="min-w-0 border border-neutral-200 bg-white p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">Installation sécurisée</p>
            <h2 id="installation" className="mt-2 text-3xl font-black tracking-tight">Installer l’application en 7 étapes</h2>
            <ol className="mt-7 grid gap-3">
              {[
                "Téléchargez l’APK uniquement depuis cette page officielle.",
                "Ouvrez le fichier téléchargé depuis votre navigateur.",
                "Android peut demander l’autorisation d’installer des applications inconnues.",
                "Autorisez uniquement le navigateur utilisé pour ce téléchargement.",
                "Confirmez l’installation de L’ecomax.",
                "Désactivez ensuite cette autorisation si vous le souhaitez.",
                "N’installez jamais un APK L’ecomax reçu par message ou depuis un autre site.",
              ].map((step, index) => (
                <li key={step} className="flex gap-4 bg-neutral-50 p-4 text-sm leading-6">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-black text-white">{index + 1}</span>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-8">
            <section className="border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">Authenticité</p>
              <h2 className="mt-2 text-2xl font-black">Vérifiez votre APK</h2>
              <p className="mt-3 text-sm leading-6 text-emerald-950/70">
                Chaque version est signée et vérifiée avant publication. {release ? "Un utilisateur technique peut comparer le SHA-256 du fichier avec celui-ci." : "Les informations de vérification seront affichées lorsqu’une version sera disponible."}
              </p>
              {release && (
                <>
                  <code className="mt-5 block break-all border border-emerald-200 bg-white p-4 text-[11px] leading-5">{release.sha256}</code>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(release.sha256);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1600);
                    }}
                    className="mt-3 min-h-11 text-xs font-black underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    {copied ? "COPIÉ" : "COPIER LE SHA-256"}
                  </button>
                </>
              )}
            </section>
            {release && release.releaseNotes.length > 0 && (
              <section className="border border-neutral-200 bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-black">Nouveautés</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
                  {release.releaseNotes.map((note) => <li key={note} className="flex gap-3"><span className="font-black text-emerald-600">✓</span>{note}</li>)}
                </ul>
              </section>
            )}
          </div>
        </section>

        <section className="border border-neutral-200 bg-white p-6 sm:p-8">
          <h2 className="text-3xl font-black tracking-tight">Questions fréquentes</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              ["Est-ce l’application officielle ?", "Oui. Cette page appartient à lecomax.com et ne distribue que les versions validées par L’ecomax."],
              ["Puis-je l’installer sur iPhone ?", "Non. Apple iOS ne prend pas en charge les fichiers APK. Ce téléchargement est réservé à Android."],
              ["Comment recevoir les mises à jour ?", "L’application vérifie la version officielle et vous avertit lorsqu’une mise à jour est disponible. Elle ne s’installe jamais silencieusement."],
              ["Mes données restent-elles les mêmes ?", "Oui. L’application et le site utilisent votre même compte et les mêmes services sécurisés L’ecomax."],
            ].map(([question, answer]) => (
              <article key={question} className="border-t border-neutral-200 pt-5">
                <h3 className="font-black">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-neutral-300 pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-500">Téléchargez toujours L’ecomax depuis le domaine officiel.</p>
          <Link href="/" className="min-h-11 bg-black px-5 py-3 text-xs font-black text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400">
            RETOUR À LECOMAX.COM
          </Link>
        </div>
      </div>
    </main>
  );
}
