import { DEFAULT_SHOE_GUIDE, completeShoeGuide } from "@/lib/shoe-size-guide";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

export const revalidate = 300;

export default async function GuideTaillesPage() {
  let shoesSizes = DEFAULT_SHOE_GUIDE;
  try {
    const { data } = await createPublicSupabaseClient(["store-settings"]).from("settings").select("value").eq("key", "size_guide_shoes").maybeSingle();
    if (data) shoesSizes = completeShoeGuide(JSON.parse(data.value));
  } catch { /* Keep the complete default guide available when settings cannot load. */ }

  const clothingSizes = [
    { label: "XS", fr: "34-36", poitrine: "82-86", taille: "62-66" },
    { label: "S",  fr: "36-38", poitrine: "86-90", taille: "66-70" },
    { label: "M",  fr: "38-40", poitrine: "90-94", taille: "70-74" },
    { label: "L",  fr: "40-42", poitrine: "94-98", taille: "74-78" },
    { label: "XL", fr: "42-44", poitrine: "98-104", taille: "78-84" },
    { label: "XXL",fr: "44-46", poitrine: "104-110", taille: "84-90" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Conseils</p>
      <h1 className="h-display text-4xl mt-2 mb-4">Guide des tailles</h1>
      <p className="text-neutral-600 mb-12 max-w-xl">
        Trouvez facilement votre taille grâce à nos tableaux de correspondance.
        En cas de doute entre deux tailles, nous conseillons de prendre la plus grande.
      </p>

      {/* Comment mesurer */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5">Comment se mesurer ?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Pointure", desc: "Mesurez la longueur de votre pied du talon à l'orteil le plus long, en centimètres." },
            { title: "Poitrine", desc: "Mesurez le tour de poitrine à l'endroit le plus fort, le mètre ruban horizontal." },
            { title: "Taille", desc: "Mesurez le tour de taille à l'endroit le plus fin, juste au-dessus du nombril." },
          ].map((tip) => (
            <div key={tip.title} className="bg-neutral-50 rounded-2xl p-5">
              <h3 className="font-semibold mb-2">{tip.title}</h3>
              <p className="text-sm text-neutral-600">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tableau chaussures */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5">Chaussures</h2>
        <p className="mb-4 text-sm text-neutral-500">Demi-pointures incluses. « ≈ » indique une estimation entre les mesures du guide ; « — », une mesure indisponible. La correspondance peut varier selon le modèle.</p>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-sm text-center">
            <thead className="bg-black text-white">
              <tr>
                <th className="py-3 px-4">EU</th>
                <th className="py-3 px-4">US</th>
                <th className="py-3 px-4">UK</th>
                <th className="py-3 px-4">CM</th>
              </tr>
            </thead>
            <tbody>
              {shoesSizes.map((row, i) => (
                <tr key={row.eu} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                  <td className="py-3 px-4 font-semibold">{row.eu}</td>
                  <td className="py-3 px-4">{row.us}</td>
                  <td className="py-3 px-4">{row.uk}</td>
                  <td className="py-3 px-4">{row.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tableau vêtements */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-5">Vêtements</h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-sm text-center">
            <thead className="bg-black text-white">
              <tr>
                <th className="py-3 px-4">Taille</th>
                <th className="py-3 px-4">FR</th>
                <th className="py-3 px-4">Poitrine (cm)</th>
                <th className="py-3 px-4">Taille (cm)</th>
              </tr>
            </thead>
            <tbody>
              {clothingSizes.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                  <td className="py-3 px-4 font-semibold">{row.label}</td>
                  <td className="py-3 px-4">{row.fr}</td>
                  <td className="py-3 px-4">{row.poitrine}</td>
                  <td className="py-3 px-4">{row.taille}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-sm text-neutral-500">
        Les mesures peuvent varier légèrement selon les modèles. Si vous avez des questions,{" "}
        <Link href="/aide/" className="underline text-black">contactez notre support</Link>.
      </p>
    </div>
  );
}
import Link from "next/link";
