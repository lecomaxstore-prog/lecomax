export default function GuideTaillesPage() {
  const shoesSizes = [
    { eu: "38", us: "6", uk: "5", cm: "24.0" },
    { eu: "39", us: "6.5", uk: "5.5", cm: "24.5" },
    { eu: "40", us: "7", uk: "6", cm: "25.0" },
    { eu: "41", us: "7.5", uk: "6.5", cm: "25.5" },
    { eu: "42", us: "8.5", uk: "7.5", cm: "26.5" },
    { eu: "43", us: "9.5", uk: "8.5", cm: "27.5" },
    { eu: "44", us: "10", uk: "9", cm: "28.0" },
    { eu: "45", us: "11", uk: "10", cm: "29.0" },
    { eu: "46", us: "12", uk: "11", cm: "30.0" },
  ];

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
