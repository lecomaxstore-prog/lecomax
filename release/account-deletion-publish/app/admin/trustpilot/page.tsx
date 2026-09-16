import Link from "next/link";
export default function TrustpilotAdmin() {
  return <div className="max-w-2xl space-y-4">
    <h1 className="text-2xl font-semibold">Avis Trustpilot</h1>
    <p className="text-sm leading-6 text-neutral-600">Le site affiche les avis directement depuis Trustpilot. La saisie manuelle et la fabrication d&apos;avis sont désactivées.</p>
    <a className="inline-block text-sm underline" href="https://www.trustpilot.com/review/lecomax.com" target="_blank" rel="noopener noreferrer">Consulter Trustpilot</a>
    <p><Link href="/admin/reviews" className="text-sm underline">Modérer les avis produits</Link></p>
  </div>;
}
