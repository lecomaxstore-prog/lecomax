// Representative chip families for the generated educational laptop illustration.
const w = (en: string, fr: string, ar: string) => ({ en, fr, ar });
export const laptopChipTopics = [
  {
    id: 'cpu',
    name: w('CPU · Intel Core example', 'CPU · exemple Intel Core', 'CPU · مثال Intel Core'),
    detail: w('The CPU executes program instructions. This generated illustration uses an Intel Core-style laptop processor as an example, not an identified model. Reveal the cooler to see its exposed silicon die and soldered package.', 'Le CPU exécute les instructions. Cette illustration générée prend un processeur portable de type Intel Core comme exemple, sans identifier un modèle précis. Retirez le refroidissement pour voir le die en silicium et le boîtier soudé.', 'CPU كينفذ تعليمات البرامج. هاد الصورة المولّدة كتستعمل معالج محمول من نوع Intel Core كمثال، ماشي موديل محدد. حيّد التبريد باش تشوف السيليكون والشريحة الملحومة.'),
    anatomy: w('Exposed silicon die · package substrate · tiny capacitors · soldered connections', 'Die en silicium · substrat · petits condensateurs · connexions soudées', 'سيليكون مكشوف · قاعدة الشريحة · مكثفات صغيرة · توصيلات ملحومة'),
    example: w('The CPU handles program logic. The illustrated laptop package is soldered, unlike a replaceable desktop processor in a socket.', 'Le CPU traite la logique des programmes. Le boîtier illustré est soudé, contrairement à un processeur de bureau remplaçable sur socket.', 'CPU كيعالج منطق البرامج. الشريحة فهاد المثال ملحومة، ماشي بحال المعالج المكتبي اللي كيتركب فالمقبس.'),
  },
  {
    id: 'gpu',
    name: w('GPU · NVIDIA example', 'GPU · exemple NVIDIA', 'GPU · مثال NVIDIA'),
    detail: w('This generated illustration uses a discrete NVIDIA-style laptop GPU beside video memory. The chip is soldered beneath the shared cooler. It is an example, not a verified GPU model. Some laptops instead have graphics integrated into the CPU.', 'Cette illustration générée montre un exemple de GPU portable dédié de type NVIDIA, avec sa mémoire vidéo. La puce est soudée sous le refroidisseur commun. Aucun modèle précis n’est identifié. Certains portables intègrent les graphismes au CPU.', 'هاد الصورة المولّدة كتبيّن مثال GPU مستقل من نوع NVIDIA وحداه ذاكرة الفيديو. الشريحة ملحومة تحت التبريد المشترك، وماشي موديل مؤكد. بعض المحمولات عندها الرسوميات مدمجة فالمعالج.'),
    anatomy: w('Graphics silicon die · package substrate · nearby VRAM · soldered connections', 'Die graphique · substrat · VRAM voisine · connexions soudées', 'سيليكون الرسوميات · قاعدة الشريحة · ذاكرة VRAM حداها · توصيلات ملحومة'),
    example: w('The GPU draws game frames and accelerates supported video effects. A laptop GPU package is much smaller than a complete desktop graphics card.', 'Le GPU dessine les images des jeux et accélère certains effets vidéo. Sa puce est bien plus petite qu’une carte graphique de bureau complète.', 'GPU كيرسم صور الألعاب وكيسرّع مؤثرات الفيديو المدعومة. شريحة المحمول أصغر بزاف من كارت الشاشة المكتبي كامل.'),
  },
];
