import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suppression du compte | L'ecomax",
  description: "Demandez la suppression de votre compte L'ecomax et des données personnelles associées.",
  alternates: { canonical: "/suppression-compte/" },
};

const deletionEmail = `mailto:contact@lecomax.com?subject=${encodeURIComponent("Suppression de mon compte L'ecomax")}&body=${encodeURIComponent("Bonjour,\n\nJe souhaite supprimer mon compte L'ecomax et les données personnelles associées.\n\nAdresse email du compte : \n\nMerci de me confirmer le traitement de ma demande.")}`;

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
      <p className="mb-3 text-sm font-semibold text-neutral-500">L&apos;ecomax · Confidentialité</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Supprimer mon compte L&apos;ecomax</h1>
      <p className="mt-5 leading-7 text-neutral-600">
        Vous pouvez demander la suppression de votre compte et des données personnelles associées,
        sans vous connecter ni réinstaller l&apos;application.
      </p>

      <section aria-labelledby="request" className="mt-8 rounded-2xl border border-neutral-200 p-6 sm:p-8">
        <h2 id="request" className="text-xl font-semibold">Comment envoyer votre demande</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-neutral-700">
          <li>Envoyez un email à <a className="underline" href={deletionEmail}>contact@lecomax.com</a> depuis l&apos;adresse utilisée pour votre compte.</li>
          <li>Indiquez « Suppression de mon compte L&apos;ecomax » dans l&apos;objet et demandez la suppression du compte et de ses données.</li>
          <li>Notre équipe vérifie la demande et vous confirme son traitement par email. Si vous n&apos;avez plus accès à votre adresse, contactez-nous pour vérifier votre identité.</li>
        </ol>
        <p className="mt-4 text-sm text-neutral-600">Ne communiquez jamais votre mot de passe ni vos coordonnées bancaires.</p>
        <a href={deletionEmail} className="mt-6 inline-block rounded-xl bg-neutral-950 px-6 py-3 font-semibold text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
          Demander la suppression par email
        </a>
        <p className="mt-3 text-sm text-neutral-500">Ce bouton ouvre votre messagerie. Vous devez envoyer l&apos;email pour soumettre la demande. Vous pouvez aussi écrire directement à contact@lecomax.com.</p>
      </section>

      <section aria-labelledby="data" className="mt-10">
        <h2 id="data" className="text-xl font-semibold">Données supprimées et données conservées</h2>
        <p className="mt-4 leading-7 text-neutral-600">La suppression porte sur votre compte de connexion, votre profil client, vos adresses enregistrées et les données personnelles associées qui ne doivent plus être conservées. Une fois le compte supprimé, vous ne pouvez plus vous y connecter.</p>
        <p className="mt-4 leading-7 text-neutral-600">Conformément à notre politique de confidentialité, les données de transaction nécessaires à la comptabilité et à la facturation sont conservées pendant 10 ans. Cette conservation ne maintient pas votre compte actif. Nous vous précisons lors du traitement les éventuelles données conservées et le motif de leur conservation.</p>
        <p className="mt-4 leading-7 text-neutral-600">La demande est traitée par notre équipe : cliquer sur le bouton ou envoyer l&apos;email ne supprime pas immédiatement le compte.</p>
      </section>

      <div className="mt-10 border-t border-neutral-200 pt-6">
        <Link href="/politique-confidentialite/" className="font-medium underline underline-offset-4">Consulter la politique de confidentialité</Link>
      </div>
    </main>
  );
}
