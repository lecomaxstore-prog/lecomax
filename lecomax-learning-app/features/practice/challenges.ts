export type Copy = readonly [string, string, string];
export type Challenge = {
  id: string; language: 'JavaScript' | 'Python' | 'SQL'; title: Copy; concept: Copy;
  lesson: Copy; code: string; question: Copy; options: readonly string[]; answer: number;
  hint: Copy; explanation: Copy; task: Copy;
};
export const challenges: readonly Challenge[] = [
  {
    id: 'js-values', language: 'JavaScript', title: ['Valeurs et types', 'Values and types', 'القيم والأنواع'], concept: ['Conversion', 'Type conversion', 'تحويل الأنواع'],
    lesson: ['Avec +, une chaîne peut transformer une addition en concaténation. Vérifie le type avant de calculer.', 'With +, a string can turn addition into concatenation. Check the type before calculating.', 'مع + قد يحوّل النص عملية الجمع إلى دمج نصوص. تحقّق من النوع قبل الحساب.'],
    code: 'const price = "10";\nconsole.log(price + 2);\nconsole.log(Number(price) + 2);', question: ['Quelles sont les deux sorties ?', 'What are the two outputs?', 'ما النتيجتان؟'], options: ['12 / 12', '102 / 12', '102 / 102'], answer: 1,
    hint: ['La première ligne garde price comme texte.', 'The first line keeps price as text.', 'السطر الأول يبقي price نصًا.'],
    explanation: ['"10" + 2 produit le texte "102". Number("10") produit le nombre 10, donc le second calcul donne 12.', '"10" + 2 produces the string "102". Number("10") produces the number 10, so the second calculation is 12.', 'ينتج عن "10" + 2 النص "102". تحوّل Number("10") القيمة إلى العدد 10، لذلك تعطي العملية الثانية 12.'],
    task: ['Remplace "10" par "5". Prédis les deux résultats avant de tester.', 'Replace "10" with "5". Predict both results before testing.', 'استبدل "10" بـ "5" وتوقّع النتيجتين قبل التجربة.'],
  },
  {
    id: 'js-map', language: 'JavaScript', title: ['Transformer une liste', 'Transform a list', 'تحويل قائمة'], concept: ['Tableaux', 'Arrays', 'المصفوفات'],
    lesson: ['map crée un nouveau tableau avec le résultat de chaque appel. Ici, les nombres du tableau original restent inchangés.', 'map creates a new array from each callback result. Here, the numbers in the original array stay unchanged.', 'تنشئ map مصفوفة جديدة من نتائج الدالة. هنا تبقى الأعداد في المصفوفة الأصلية دون تغيير.'],
    code: 'const scores = [2, 4, 6];\nconst doubled = scores.map(n => n * 2);\nconsole.log(scores[1], doubled[1]);', question: ['Que voit-on dans la console ?', 'What appears in the console?', 'ماذا يظهر في وحدة التحكم؟'], options: ['8 8', '2 4', '4 8'], answer: 2,
    hint: ['Les indices commencent à zéro. L’indice 1 désigne le deuxième élément.', 'Indexes start at zero. Index 1 is the second item.', 'تبدأ الفهارس من الصفر. الفهرس 1 يشير إلى العنصر الثاني.'],
    explanation: ['scores[1] vaut 4. map multiplie cette valeur par 2 dans doubled, où doubled[1] vaut 8.', 'scores[1] is 4. map doubles that value in doubled, where doubled[1] is 8.', 'قيمة scores[1] هي 4. تضاعف map تلك القيمة في doubled، فتكون doubled[1] مساوية لـ 8.'],
    task: ['Transforme les nombres avec n + 1. Quel tableau obtiens-tu ?', 'Transform the numbers with n + 1. What array do you get?', 'حوّل الأعداد باستخدام n + 1. ما المصفوفة الناتجة؟'],
  },
  {
    id: 'js-return', language: 'JavaScript', title: ['Renvoyer une valeur', 'Return a value', 'إرجاع قيمة'], concept: ['Fonctions', 'Functions', 'الدوال'],
    lesson: ['Afficher et renvoyer sont deux actions différentes. return fournit une valeur au code qui appelle la fonction.', 'Logging and returning are different actions. return supplies a value to the code calling the function.', 'الطباعة والإرجاع عمليتان مختلفتان. توفّر return قيمة للكود الذي يستدعي الدالة.'],
    code: 'function double(n) {\n  n * 2;\n}\nconsole.log(double(3));', question: ['Quelle valeur est affichée ?', 'Which value is printed?', 'ما القيمة المطبوعة؟'], options: ['6', 'undefined', '3'], answer: 1,
    hint: ['Cherche une instruction return dans la fonction.', 'Look for a return statement in the function.', 'ابحث عن تعليمة return في الدالة.'],
    explanation: ['Le calcul est effectué mais son résultat n’est pas renvoyé. Une fonction JavaScript sans return explicite renvoie undefined.', 'The calculation happens but its result is not returned. A JavaScript function without an explicit return returns undefined.', 'تُنفّذ العملية الحسابية لكن نتيجتها لا تُرجع. تعيد دالة JavaScript دون return صريحة القيمة undefined.'],
    task: ['Ajoute return, puis essaie double(5).', 'Add return, then try double(5).', 'أضف return ثم جرّب double(5).'],
  },
  {
    id: 'py-range', language: 'Python', title: ['Suivre une boucle', 'Trace a loop', 'تتبّع حلقة'], concept: ['Boucles', 'Loops', 'الحلقات'],
    lesson: ['range(start, stop) inclut start mais exclut stop. Suis chaque valeur pour comprendre une boucle.', 'range(start, stop) includes start but excludes stop. Trace each value to understand a loop.', 'تشمل range(start, stop) البداية وتستبعد النهاية. تتبّع كل قيمة لفهم الحلقة.'],
    code: 'total = 0\nfor n in range(1, 4):\n    total += n\nprint(total)', question: ['Quelle est la valeur finale de total ?', 'What is the final value of total?', 'ما القيمة النهائية لـ total؟'], options: ['10', '4', '6'], answer: 2,
    hint: ['Écris les nombres parcourus : 1, 2, …', 'Write out the visited numbers: 1, 2, …', 'اكتب الأعداد التي تمر بها الحلقة: 1، 2، …'],
    explanation: ['La boucle additionne 1, 2 et 3 : 0 + 1 + 2 + 3 = 6. La borne 4 est exclue.', 'The loop adds 1, 2, and 3: 0 + 1 + 2 + 3 = 6. The endpoint 4 is excluded.', 'تجمع الحلقة 1 و2 و3: النتيجة 0 + 1 + 2 + 3 = 6. العدد 4 غير مشمول.'],
    task: ['Change la borne de fin en 5. Calcule le résultat à la main.', 'Change the endpoint to 5. Calculate the result by hand.', 'غيّر النهاية إلى 5 واحسب النتيجة يدويًا.'],
  },
  {
    id: 'py-alias', language: 'Python', title: ['Deux noms, une liste', 'Two names, one list', 'اسمان وقائمة واحدة'], concept: ['Références', 'References', 'المراجع'],
    lesson: ['Affecter une liste à un second nom ne la copie pas. Les deux noms peuvent désigner le même objet.', 'Assigning a list to a second name does not copy it. Both names can refer to the same object.', 'إسناد قائمة إلى اسم ثانٍ لا ينسخها. قد يشير الاسمان إلى الكائن نفسه.'],
    code: 'items = [1, 2]\nother = items\nother.append(3)\nprint(len(items))', question: ['Quelle longueur est affichée ?', 'Which length is printed?', 'ما الطول المطبوع؟'], options: ['3', '2', '1'], answer: 0,
    hint: ['Aucune copie n’a été créée.', 'No copy was created.', 'لم تُنشأ نسخة جديدة.'],
    explanation: ['other et items désignent la même liste. append ajoute 3 à cette liste, dont la longueur devient 3.', 'other and items refer to the same list. append adds 3 to that list, making its length 3.', 'يشير other وitems إلى القائمة نفسها. تضيف append العدد 3 إليها، فيصبح طولها 3.'],
    task: ['Essaie other = items.copy() avant append. Quelle longueur attendrais-tu pour items ?', 'Try other = items.copy() before append. What length would you expect for items?', 'جرّب other = items.copy() قبل append. ما الطول المتوقع لـ items؟'],
  },
  {
    id: 'py-condition', language: 'Python', title: ['Choisir une branche', 'Choose a branch', 'اختيار فرع'], concept: ['Conditions', 'Conditions', 'الشروط'],
    lesson: ['Une chaîne if / elif / else exécute seulement la première branche dont la condition est vraie.', 'An if / elif / else chain runs only the first branch whose condition is true.', 'تنفّذ سلسلة if / elif / else أول فرع يتحقق شرطه فقط.'],
    code: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")', question: ['Quelle lettre est affichée ?', 'Which letter is printed?', 'ما الحرف المطبوع؟'], options: ['A', 'B', 'C'], answer: 1,
    hint: ['Vérifie les conditions du haut vers le bas.', 'Check the conditions from top to bottom.', 'افحص الشروط من الأعلى إلى الأسفل.'],
    explanation: ['85 est inférieur à 90, mais supérieur ou égal à 80. La branche elif affiche B et else est ignoré.', '85 is below 90 but at least 80. The elif branch prints B and else is skipped.', '85 أصغر من 90 لكنه أكبر من أو يساوي 80. يطبع فرع elif الحرف B ويُتجاهل else.'],
    task: ['Teste mentalement les limites : 79, 80, 89 et 90.', 'Mentally test the boundaries: 79, 80, 89, and 90.', 'اختبر الحدود ذهنيًا: 79 و80 و89 و90.'],
  },
  {
    id: 'sql-filter', language: 'SQL', title: ['Filtrer des lignes', 'Filter rows', 'تصفية الصفوف'], concept: ['WHERE', 'WHERE', 'WHERE'],
    lesson: ['WHERE conserve seulement les lignes qui satisfont la condition. ORDER BY précise l’ordre du résultat.', 'WHERE keeps only rows satisfying the condition. ORDER BY specifies the result order.', 'تحتفظ WHERE بالصفوف التي تحقق الشرط فقط. وتحدد ORDER BY ترتيب النتيجة.'],
    code: '-- products: (name, price)\n-- (Pen, 2), (Book, 12), (Bag, 20)\nSELECT name FROM products\nWHERE price >= 12\nORDER BY price ASC;', question: ['Quels noms sont renvoyés, dans cet ordre ?', 'Which names are returned, in order?', 'ما الأسماء الناتجة بالترتيب؟'], options: ['Bag, Book', 'Book, Bag', 'Pen, Book, Bag'], answer: 1,
    hint: ['>= inclut la valeur 12. ASC va du plus petit au plus grand.', '>= includes 12. ASC goes from smallest to largest.', 'تشمل >= القيمة 12. وترتّب ASC من الأصغر إلى الأكبر.'],
    explanation: ['Pen est exclu. Book (12) précède Bag (20) grâce au tri croissant.', 'Pen is excluded. Book (12) comes before Bag (20) because of ascending order.', 'يُستبعد Pen. يأتي Book بسعر 12 قبل Bag بسعر 20 بسبب الترتيب التصاعدي.'],
    task: ['Remplace >= par >. Quel produit disparaît ?', 'Replace >= with >. Which product disappears?', 'استبدل >= بـ >. ما المنتج الذي يختفي؟'],
  },
  {
    id: 'sql-count', language: 'SQL', title: ['Compter avec NULL', 'Count with NULL', 'العدّ مع NULL'], concept: ['Agrégation', 'Aggregation', 'التجميع'],
    lesson: ['COUNT(*) compte les lignes. COUNT(colonne) compte uniquement les valeurs non NULL de cette colonne.', 'COUNT(*) counts rows. COUNT(column) counts only non-NULL values in that column.', 'تعدّ COUNT(*) الصفوف. أما COUNT(column) فتعدّ القيم غير NULL في ذلك العمود فقط.'],
    code: '-- users: (id, nickname)\n-- (1, Ava), (2, NULL), (3, Sam)\nSELECT COUNT(*), COUNT(nickname)\nFROM users;', question: ['Quels nombres sont renvoyés ?', 'Which numbers are returned?', 'ما العددان الناتجان؟'], options: ['3, 3', '2, 2', '3, 2'], answer: 2,
    hint: ['NULL représente ici une valeur absente.', 'NULL represents a missing value here.', 'تمثّل NULL هنا قيمة مفقودة.'],
    explanation: ['Il y a trois lignes, mais seulement deux surnoms non NULL. Le résultat est donc 3, 2.', 'There are three rows but only two non-NULL nicknames. The result is therefore 3, 2.', 'هناك ثلاثة صفوف لكن لقبين فقط غير NULL. لذلك تكون النتيجة 3، 2.'],
    task: ['Remplace NULL par un surnom. Quels comptes changent ?', 'Replace NULL with a nickname. Which counts change?', 'استبدل NULL بلقب. أيّ العددين يتغيّر؟'],
  },
  {
    id: 'sql-groups', language: 'SQL', title: ['Regrouper et additionner', 'Group and sum', 'التجميع والجمع'], concept: ['GROUP BY', 'GROUP BY', 'GROUP BY'],
    lesson: ['GROUP BY rassemble les lignes partageant une valeur. SUM calcule ensuite un total par groupe.', 'GROUP BY collects rows sharing a value. SUM then calculates a total per group.', 'تجمع GROUP BY الصفوف التي تتشارك قيمة. ثم تحسب SUM مجموعًا لكل مجموعة.'],
    code: '-- sales: (category, amount)\n-- (Books, 10), (Games, 20), (Books, 5)\nSELECT category, SUM(amount)\nFROM sales\nGROUP BY category\nORDER BY category;', question: ['Quel est le total du groupe Books ?', 'What is the total for Books?', 'ما مجموع مجموعة Books؟'], options: ['15', '35', '10'], answer: 0,
    hint: ['Additionne seulement les lignes de catégorie Books.', 'Add only the rows in the Books category.', 'اجمع صفوف فئة Books فقط.'],
    explanation: ['Les deux lignes Books contiennent 10 et 5. Leur total est 15. Games forme un groupe séparé avec 20.', 'The two Books rows contain 10 and 5, totaling 15. Games forms a separate group with 20.', 'يحتوي صفّا Books على 10 و5 ومجموعهما 15. وتشكل Games مجموعة منفصلة بمجموع 20.'],
    task: ['Ajoute une vente Books de 7. Prédis le nouveau total.', 'Add a Books sale of 7. Predict the new total.', 'أضف عملية بيع Books بقيمة 7 وتوقّع المجموع الجديد.'],
  },
];
