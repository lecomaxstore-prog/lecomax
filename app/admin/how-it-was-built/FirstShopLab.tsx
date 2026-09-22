"use client";

import { useEffect, useState } from "react";
import type { CourseLanguage } from "./course/types";
import { translate } from "./course/journey";

const SYMBOLS = [
  ["<h1>…</h1>", "Une balise ouvre un élément HTML. / ferme ici la balise. h1 est le titre principal.", "A tag opens an HTML element. / closes the tag here. h1 is the main heading.", "الوسم يفتح عنصر HTML. الرمز / يغلق الوسم هنا. h1 هو العنوان الرئيسي."],
  ["=", "Dans const prix = 20, = donne une valeur. Ce n’est pas une question d’égalité.", "In const price = 20, = assigns a value. It does not ask whether values are equal.", "في const price = 20، الرمز = يسند قيمة ولا يسأل عن التساوي."],
  ["\"…\"", "Les guillemets entourent du texte, par exemple \"Bonjour\". 20 est un nombre ; \"20\" est du texte.", "Quotes surround text, such as \"Hello\". 20 is a number; \"20\" is text.", "علامتا التنصيص تحيطان بالنص مثل \"مرحبا\". 20 رقم و\"20\" نص."],
  ["{ }", "Le sens dépend du contexte : objet JavaScript, bloc de fonction, règles CSS, ou expression dans JSX.", "Meaning depends on context: a JavaScript object, a function body, CSS rules, or an expression in JSX.", "المعنى يعتمد على السياق: كائن JavaScript أو جسم دالة أو قواعد CSS أو تعبير JSX."],
  ["( )", "Dans ajouter(2), les parenthèses appellent une fonction avec 2. Elles servent aussi à grouper un calcul.", "In add(2), parentheses call a function with 2. They also group parts of a calculation.", "في add(2)، الأقواس تستدعي دالة بالقيمة 2. وتُستخدم أيضاً لتجميع أجزاء عملية حسابية."],
  ["[ ]", "[10, 20] est un tableau : une liste. prix[0] lit le premier élément, car on commence à zéro.", "[10, 20] is an array: a list. prices[0] reads its first item because indexing starts at zero.", "[10, 20] مصفوفة: قائمة. prices[0] يقرأ العنصر الأول لأن العد يبدأ من الصفر."],
  [".", "produit.prix lit la propriété prix de l’objet produit. En CSS, .carte désigne une classe.", "product.price reads the price property of product. In CSS, .card selects a class.", "product.price يقرأ خاصية السعر من كائن المنتج. في CSS، .card يحدد فئة."],
  [":", "Dans { prix: 20 }, : sépare le nom de sa valeur. En CSS, color: green relie une propriété à sa valeur.", "In { price: 20 }, : separates a name from its value. In CSS, color: green links a property to its value.", "في { price: 20 }، النقطتان تفصلان الاسم عن القيمة. وفي CSS تربطان الخاصية بقيمتها."],
  [";", "Le point-virgule termine une instruction JavaScript ou sépare des déclarations CSS. Il ne remplace pas une virgule dans un objet.", "A semicolon ends a JavaScript statement or separates CSS declarations. It is not an object’s comma.", "الفاصلة المنقوطة تنهي تعليمة JavaScript أو تفصل تصريحات CSS، وليست فاصلة خصائص الكائن."],
  ["=>", "Dans (prix) => prix * 2, la flèche crée une fonction : elle reçoit un prix et renvoie son double.", "In (price) => price * 2, the arrow creates a function: it takes a price and returns twice that value.", "في (price) => price * 2، السهم ينشئ دالة تستقبل سعراً وتعيد ضعفه."],
  ["===", "Vérifie l’égalité stricte. 20 === 20 est vrai ; 20 === \"20\" est faux car les types diffèrent.", "Checks strict equality. 20 === 20 is true; 20 === \"20\" is false because their types differ.", "يتحقق من التساوي الصارم. 20 === 20 صحيحة، و20 === \"20\" خاطئة لاختلاف النوع."],
  ["//", "En JavaScript, le reste de cette ligne est un commentaire pour les humains. En HTML, on utilise <!-- commentaire -->.", "In JavaScript, the rest of this line is a comment for people. In HTML, use <!-- comment -->.", "في JavaScript، باقي السطر تعليق للبشر. في HTML استخدم <!-- comment -->."],
] as const;

export default function FirstShopLab({ lang }: { lang: CourseLanguage }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [symbol, setSymbol] = useState(0);
  const [code, setCode] = useState('<h1>Ma boutique</h1>\n<p>Mon premier produit · 20 €</p>\n<button>Ajouter au panier</button>');
  const [result, setResult] = useState<boolean[] | null>(null);
  const [ready, setReady] = useState(false);
  const [savingFailed, setSavingFailed] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem("lecomax-first-shop-v1"); if (saved) setCode(saved.slice(0, 5000)); }
    catch { setSavingFailed(true); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem("lecomax-first-shop-v1", code); } catch { setSavingFailed(true); }
  }, [code, ready]);
  const tasks = [
    t("Remplace « Ma boutique » par le nom de ta boutique dans h1.", "Replace “Ma boutique” with your own shop name inside h1.", "استبدل « Ma boutique » باسم متجرك داخل h1."),
    t("Dans le paragraphe p, change le prix de 20 à 25 €.", "Inside the p paragraph, change the price from 20 to 25 €.", "داخل الفقرة p، غيّر السعر من 20 إلى 25 €."),
    t("Garde un bouton avec un texte visible.", "Keep a button with visible text.", "احتفظ بزر يحتوي على نص ظاهر."),
  ];
  const verify = () => {
    const doc = new DOMParser().parseFromString(code, "text/html");
    const title = doc.querySelector("h1")?.textContent?.trim();
    setResult([!!title && title !== "Ma boutique", [...doc.querySelectorAll("p")].some(p => /\b25\s*€/.test(p.textContent ?? "")), !!doc.querySelector("button")?.textContent?.trim()]);
  };
  const source = `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>body{font:16px system-ui;padding:20px;color:#17251c;overflow-wrap:anywhere}h1{font-size:28px}button{background:#15803d;color:white;border:0;border-radius:12px;padding:12px 18px;font:inherit}a{pointer-events:none}</style></head><body>${code}</body></html>`;
  return <details className="rounded-3xl border border-violet-200 bg-white p-5 sm:p-7">
    <summary className="min-h-12 cursor-pointer"><span className="text-xl font-black">🧪 {t("Ta première boutique : joue avec le code", "Your first shop: play with code", "متجرك الأول: العب بالكود")}</span><span className="mt-2 block text-sm leading-6 text-neutral-600">{t("Zéro installation. Change quelques mots et regarde le résultat.", "No installation. Change a few words and watch the result.", "بدون تثبيت. غيّر بعض الكلمات وشاهد النتيجة.")}</span></summary>
    <div className="mt-6 space-y-5">
      <p className="rounded-xl bg-violet-50 p-4 text-sm leading-7">{t("HTML décrit ce qui apparaît : h1 est un titre, p un paragraphe, button un bouton. Le texte entre les balises est affiché. Le bouton n’ajoute encore rien : tu lui donneras cette action avec JavaScript plus tard.", "HTML describes what appears: h1 is a heading, p a paragraph, button a button. Text between tags is displayed. The button does not add anything yet: you’ll give it that action with JavaScript later.", "HTML يصف ما يظهر: h1 عنوان وp فقرة وbutton زر. يظهر النص بين الوسوم. الزر لا يضيف شيئًا الآن؛ ستمنحه هذا السلوك بـJavaScript لاحقًا.")}</p>
      <ol className="space-y-2">{tasks.map((task, i) => <li key={i} className="text-sm leading-6"><span className="me-2 font-bold text-violet-700">{result ? result[i] ? "✓" : "↻" : i + 1}.</span>{task}</li>)}</ol>
      <div className="grid gap-4 xl:grid-cols-2"><label className="min-w-0 text-sm font-bold">{t("Ton code HTML", "Your HTML code", "كود HTML الخاص بك")}<textarea dir="ltr" spellCheck={false} value={code} maxLength={5000} onChange={event => { setCode(event.target.value); setResult(null); }} rows={9} className="mt-2 w-full rounded-2xl bg-neutral-950 p-4 font-mono text-sm leading-7 text-emerald-200" /></label><div className="min-w-0"><p className="text-sm font-bold">{t("Résultat en direct", "Live result", "النتيجة المباشرة")}</p><iframe title={t("Aperçu de ta boutique d’entraînement", "Your practice shop preview", "معاينة متجر التدريب")} sandbox="" srcDoc={source} className="mt-2 h-72 w-full rounded-2xl border border-neutral-200 bg-white" /></div></div>
      <button onClick={verify} className="min-h-12 rounded-xl bg-violet-700 px-5 py-3 font-black text-white">{t("Vérifier ma création", "Check my creation", "تحقّق من عملي")}</button>
      {result && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm leading-6">{result.every(Boolean) ? t("Bravo ! Tu as changé le contenu d’une page avec du HTML. Explique maintenant à voix haute le rôle de chaque balise.", "You did it! You changed a page with HTML. Now explain aloud what each tag does.", "أحسنت! غيّرت محتوى صفحة بـHTML. اشرح الآن بصوتك وظيفة كل وسم.") : t("Regarde les étapes marquées ↻. Modifie ton code puis vérifie encore : les essais font partie de l’apprentissage.", "Look at the steps marked ↻. Edit your code and check again: trying is part of learning.", "راجع الخطوات المعلّمة بـ↻. عدّل الكود وتحقّق مجدداً: التجربة جزء من التعلم.")}</p>}
      <p className="text-xs text-neutral-500">{savingFailed ? t("Sauvegarde indisponible : copie ton code pour le garder.", "Saving unavailable: copy your code to keep it.", "الحفظ غير متاح: انسخ الكود للاحتفاظ به.") : t("Ton brouillon reste sur ce navigateur. Cet atelier sert à pratiquer HTML ; les scripts ne s’exécutent pas.", "Your draft stays in this browser. This lab is for practicing HTML; scripts do not run.", "تُحفظ مسودتك في هذا المتصفح. هذا تدريب HTML؛ لا تُنفّذ السكربتات.")}</p>
      <div className="border-t pt-5"><h4 className="font-black">{t("Les signes du code, sans mystère", "Code symbols, explained", "رموز الكود ببساطة")}</h4><div className="mt-3 flex flex-wrap gap-2">{SYMBOLS.map((item, i) => <button aria-pressed={symbol === i} key={item[0]} onClick={() => setSymbol(i)} className={"min-h-11 rounded-xl border px-4 font-mono text-sm font-bold " + (symbol === i ? "border-violet-600 bg-violet-100 text-violet-900" : "border-neutral-200")}>{item[0]}</button>)}</div><p role="status" className="mt-3 rounded-2xl bg-neutral-50 p-4 text-sm leading-7">{SYMBOLS[symbol][lang === "fr" ? 1 : lang === "en" ? 2 : 3]}</p></div>
    </div>
  </details>;
}
