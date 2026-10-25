// Hand-authored offline fixtures, not outputs from the revised prompt.
import { readFileSync } from 'node:fs';
const dir=new URL('./fixtures/editorial-quality/',import.meta.url);
export const savedSource=JSON.parse(readFileSync(new URL('source.json',dir),'utf8')).source;
export const savedResults=[0,1].map(i=>JSON.parse(readFileSync(new URL(`result-${i}.json`,dir),'utf8')).content);
export function shoeFixture() {
  const draft=structuredClone(savedResults[0]);
  draft.ar.productDescription='حذاء رياضي رجالي من Baasploa، يجمع بين خفة الوزن والتهوية مع نعل مرن وجيد التهوية. صُمم للاستخدام اليومي في الجري والمشي والتنس، بطابع يومي يناسب هذه الأنشطة. وتصف بيانات المنتج الحذاء بأنه خفيف ويسمح بمرور الهواء.';
  draft.evidence=draft.evidence.filter(e=>e.locale==='fr');
  draft.evidence.push({locale:'ar',claim:'خفة الوزن والتهوية',sourceQuote:'Respirantes et légères'},{locale:'ar',claim:'نعل مرن وجيد التهوية',sourceQuote:'Semelle souple et aérée'});
  return {source:savedSource,draft};
}
export function bottleFixture() {
  return {source:{name:'Gourde Atlas 500 ml',brand:'Atlas',category:'gourdes',description:'Gourde Atlas de 500 ml en acier. Bouchon à vis. Pour emporter de l’eau au quotidien.'},draft:{
    fr:{title:'Gourde Atlas de 500 ml en acier',description:'La gourde Atlas de 500 ml associe un corps en acier à un bouchon à vis, pour emporter votre eau au fil de la journée.',keywords:['gourde Atlas','gourde 500 ml','gourde en acier'],productDescription:'La gourde Atlas présente une capacité de 500 ml et un corps en acier. Son bouchon se ferme en le vissant. Destinée à emporter de l’eau au quotidien, elle réunit ces caractéristiques dans une gourde à bouchon à vis.'},
    ar:{title:'قارورة Atlas من الفولاذ بسعة 500 مل',description:'قارورة Atlas بسعة 500 مل مصنوعة من الفولاذ، مع غطاء لولبي يُغلق باللف، لحمل الماء في الاستخدام اليومي حسب وصف المنتج.',keywords:['قارورة Atlas','قارورة ماء 500 مل','قارورة من الفولاذ'],productDescription:'قارورة ماء من Atlas بسعة 500 مل، مصنوعة من الفولاذ ومزودة بغطاء لولبي يُغلق باللف. هذا المنتج مخصص لحمل الماء في الاستخدام اليومي. وتحدد بياناته سعته ومادته ونوع غطائه، من دون ذكر مدة لحفظ حرارة الماء.'},
    evidence:[{locale:'fr',claim:'500 ml',sourceQuote:'Gourde Atlas de 500 ml en acier.'},{locale:'ar',claim:'500 مل',sourceQuote:'Gourde Atlas de 500 ml en acier.'}]
  }};
}
export function chargerFixture() {
  return {source:{name:'Chargeur Nova N20 USB-C 20 W',brand:'Nova',model:'N20',category:'chargeurs',description:'Chargeur Nova N20 avec port USB-C. Puissance de 20 W. Câble non inclus.'},draft:{
    fr:{title:'Chargeur Nova N20 USB-C de 20 W',description:'Le chargeur Nova N20 possède un port USB-C et une puissance de 20 W. Le câble ne fait pas partie du contenu indiqué.',keywords:['chargeur Nova N20','chargeur USB-C','chargeur 20 W'],productDescription:'Le chargeur Nova N20 est équipé d’un port USB-C et affiche une puissance de 20 W. Le câble est indiqué comme non inclus dans la fiche. Ces informations précisent le port, la puissance et le contenu mentionné pour ce modèle.'},
    ar:{title:'شاحن Nova N20 بمنفذ USB-C وقدرة 20 واط',description:'شاحن Nova N20 مزود بمنفذ USB-C وبقدرة 20 واط. تشير بيانات المنتج إلى أن الكابل غير مرفق، وهي المعلومات المذكورة لهذا الطراز.',keywords:['شاحن Nova N20','شاحن بمنفذ USB-C','شاحن 20 واط'],productDescription:'شاحن Nova N20 مزود بمنفذ USB-C وقدرة معلنة تبلغ 20 واط. الكابل غير مرفق حسب بيانات المنتج. توضح هذه التفاصيل نوع المنفذ والقدرة وما ورد عن الكابل، ولا تتضمن قائمة بالأجهزة المتوافقة مع هذا الطراز.'},
    evidence:[{locale:'fr',claim:'20 W',sourceQuote:'Puissance de 20 W.'},{locale:'ar',claim:'20 واط',sourceQuote:'Puissance de 20 W.'}]
  }};
}
