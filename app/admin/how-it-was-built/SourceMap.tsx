"use client";
import type { SourceConnections, SourceConnection } from "@/lib/source-connections";
import { describeSourceFile } from "@/lib/source-code-guide";
import type { CourseLanguage } from "./course/types";
import { translate } from "./course/journey";
import styles from "./SiteExplorer.module.css";

export default function SourceMap({ path, connections, lang, onOpen, onLine }: {
  path: string; connections?: SourceConnections; lang: CourseLanguage;
  onOpen: (path: string, line?: number) => void; onLine: (line: number) => void;
}) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const groups: { kind: SourceConnection["kind"]; title: string; explanation: string }[] = [
    { kind: "parent", title: t("Qui utilise ce fichier ?", "What uses this file?", "من يستخدم هذا الملف؟"), explanation: t("Ces fichiers l’importent. Les images et les données peuvent être transmises par leurs paramètres : ouvre-les pour vérifier.", "These files import it. Images and data may be passed through their parameters: open them to check.", "تستورد هذه الملفات الملف الحالي. قد تمرر الصور والبيانات عبر المعاملات؛ افتحها للتحقق.") },
    { kind: "api", title: t("Les demandes au serveur", "Requests to the server", "الطلبات إلى الخادم"), explanation: t("Une adresse /api reçoit une demande. Ouvre son fichier pour voir comment elle répond.", "An /api address receives a request. Open its file to see how it responds.", "يتلقى عنوان /api طلبًا. افتح ملفه لترى كيف يجيب.") },
    { kind: "table", title: t("Les données en base", "Database data", "البيانات في القاعدة"), explanation: t("Ces noms apparaissent dans des appels de base de données. Une table contient des lignes, par exemple des produits. Ce ne sont pas des fichiers du projet.", "These names appear in database calls. A table holds rows, such as products. These are not project files.", "تظهر هذه الأسماء في استدعاءات قاعدة البيانات. يحوي الجدول صفوفًا مثل المنتجات وهي ليست ملفات المشروع.") },
    { kind: "bucket", title: t("Les fichiers dans Supabase Storage", "Files in Supabase Storage", "الملفات في Supabase Storage"), explanation: t("Un bucket est un espace pour des fichiers, comme les photos. Le code ci-dessous mentionne son nom, sans lire son contenu.", "A bucket holds files such as photos. The code references its name; this view does not read its contents.", "تحفظ الحاوية ملفات كالصور. يشير الكود إلى اسمها ولا تقرأ هذه الواجهة محتواها.") },
    { kind: "browser", title: t("Ce navigateur garde aussi des informations", "This browser also keeps information", "يحفظ هذا المتصفح معلومات أيضًا"), explanation: t("localStorage reste après fermeture ; sessionStorage dure pour la session de cet onglet. Ces clés ne désignent pas une base Supabase.", "localStorage survives closing; sessionStorage lasts for this tab’s session. These keys are not a Supabase database.", "يبقى localStorage بعد الإغلاق ويستمر sessionStorage لجلسة هذا التبويب. هذه المفاتيح ليست قاعدة Supabase.") },
    { kind: "import", title: t("Les autres fichiers utilisés", "Other files used here", "الملفات الأخرى المستخدمة"), explanation: t("Un import réutilise du code. Ouvre un fichier pour suivre la suite de l’explication.", "An import reuses code. Open a file to follow the explanation further.", "يعيد الاستيراد استخدام الكود. افتح ملفًا لمتابعة الشرح.") },
  ];
  return <div className={styles.sourceMap}>
    <section className={styles.fileCard}>
      <h3>{t("Où est ce fichier ?", "Where is this file?", "أين يوجد هذا الملف؟")}</h3>
      <code dir="ltr">{path}</code>
      <p>{describeSourceFile(path, lang)}</p>
      <details className={styles.fileHelp}><summary>{t("Comprendre ce chemin", "Understand this path", "افهم هذا المسار")}</summary><p>{t("Ce chemin est relatif à la racine du projet. GitHub conserve le code ; Vercel construit le site. Le lecteur montre la copie de code de cette version du site.", "This path starts at the project root. GitHub keeps the code; Vercel builds the site. This reader shows the source snapshot for this site version.", "يبدأ المسار من جذر المشروع. يحفظ GitHub الكود ويبني Vercel الموقع. يعرض القارئ نسخة الكود الخاصة بإصدار الموقع هذا.")}</p></details>
    </section>
    <p className={styles.evidenceNote}>{t("Repères trouvés dans tout ce fichier. Ils ne prouvent pas que chaque appel sert à l’élément touché. Touche « Voir la ligne » pour vérifier le code.", "References found across this file. They do not prove that every call serves the tapped element. Tap “View line” to check the code.", "مراجع موجودة في الملف كله. لا تثبت أن كل استدعاء يخدم العنصر المحدد. اضغط «عرض السطر» للتحقق من الكود.")}</p>
    {!connections?.items.length && <p>{t("Aucune connexion reconnue automatiquement ici. Les données peuvent venir d’un composant parent ou d’un chemin calculé : lis les paramètres et les imports du fichier.", "No connections were automatically recognized here. Data may come from a parent component or a computed path: inspect the file’s parameters and imports.", "لم تُتعرف اتصالات تلقائيًا هنا. قد تأتي البيانات من مكون أب أو مسار محسوب؛ افحص معاملات الملف واستيراداته.")}</p>}
    {groups.map(group => {
      const items = connections?.items.filter(item => item.kind === group.kind) ?? [];
      if (!items.length) return null;
      return <details key={group.kind} className={styles.connectionGroup} data-connection-kind={group.kind}><summary>{group.title}<span>{items.length}</span></summary><p>{group.explanation}</p><ul>{items.map(item => <li key={`${item.kind}:${item.name}`}>
        <code dir="ltr">{item.target ?? item.name}</code>
        {item.target && <p>{describeSourceFile(item.target, lang)}</p>}
        <div className={styles.evidenceActions}><button type="button" onClick={() => item.origin ? onOpen(item.origin, item.line) : onLine(item.line)}>{t("Voir la ligne", "View line", "عرض السطر")} {item.line}</button>{item.target && <button type="button" onClick={() => onOpen(item.target!)}>{t("Comprendre ce fichier →", "Understand this file →", "افهم هذا الملف ←")}</button>}</div>
      </li>)}</ul></details>;
    })}
    {connections?.truncated && <p>{t("Liste limitée aux 36 premiers repères. Le fichier complet reste accessible.", "Showing the first 36 references. The full file remains available.", "تُعرض أول 36 مرجعًا. يبقى الملف الكامل متاحًا.")}</p>}
  </div>;
}
