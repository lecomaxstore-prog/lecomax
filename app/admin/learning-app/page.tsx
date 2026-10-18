import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LearningAppPage() {
  const configuredUrl = process.env.LEARNING_ANDROID_APK_URL?.trim();
  const version = process.env.LEARNING_ANDROID_VERSION?.trim();
  let apkUrl: string | null = null;
  try {
    const url = new URL(configuredUrl || "");
    const expoArtifact = url.hostname === "artifacts.eascdn.net" || (url.hostname === "expo.dev" && url.pathname.startsWith("/artifacts/eas/"));
    if (url.protocol === "https:" && expoArtifact && !url.username && !url.password && url.pathname.endsWith(".apk")) {
      apkUrl = url.href;
    }
  } catch { /* A download is offered only after a verified APK is configured. */ }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <Link href="/admin/app-releases" className="text-sm underline">Retour aux applications</Link>
      <header className="space-y-3">
        <p className="text-sm font-semibold text-emerald-700">Application de formation Android</p>
        <h1 className="text-3xl font-bold">L’ECOMAX Learn</h1>
        <p className="text-gray-600">Retrouvez vos cours, exercices, notes et votre progression. Une connexion Internet est nécessaire pour vérifier votre accès privé et utiliser le professeur IA.</p>
      </header>
      <section className="space-y-4 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Installation</h2>
        {apkUrl && version && <p className="font-medium text-emerald-800">Version {version}</p>}
        {apkUrl ? (
          <a href={apkUrl} className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white">Télécharger l’APK de formation</a>
        ) : (
          <p role="status" className="rounded-lg bg-amber-50 p-4 text-amber-900">Le téléchargement sera disponible après vérification de la nouvelle compilation Android.</p>
        )}
        <p className="text-sm text-gray-600">Ouvrez le fichier APK sur votre téléphone Android et autorisez son installation lorsque le système vous le demande. Pour conserver votre progression, installez la mise à jour sans désinstaller l’application.</p>
        <p className="text-sm text-gray-600">Cette version ajoute la connexion privée, la mémorisation sécurisée de votre appareil et la gestion des sessions. Après cette installation, les prochaines mises à jour compatibles seront téléchargées via Expo et appliquées lors d’un prochain démarrage.</p>
        <a href="https://expo.dev/accounts/lecomax/projects/lecomax-learn/builds" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm underline">Consulter les compilations Expo (compte lecomax)</a>
      </section>
    </main>
  );
}
