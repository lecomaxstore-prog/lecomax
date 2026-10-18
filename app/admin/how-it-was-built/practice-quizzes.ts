import type { Text } from "./learning/types";
export const practiceQuizzes: { question: Text; options: Text[]; correct: number; explanation: Text }[] = [
  {
    question: ["Tu fermes le serveur avec Ctrl+C. Que se passe-t-il ?", "You stop the server with Ctrl+C. What happens?", "أوقفت الخادم بـ Ctrl+C. ماذا يحدث؟"],
    options: [["Le site local s’arrête, mes fichiers restent.", "The local site stops; my files remain.", "يتوقف الموقع المحلي وتبقى ملفاتي."], ["Mon site sur Vercel est supprimé.", "My Vercel site is deleted.", "يُحذف موقعي من Vercel."], ["Mes modifications sont envoyées sur GitHub.", "My changes are sent to GitHub.", "تُرسل تغييراتي إلى GitHub."]],
    correct: 0,
    explanation: ["Le serveur est un programme en cours d’exécution. L’arrêter ne supprime pas les fichiers et ne publie rien. npm.cmd run dev le relance.", "The server is a running program. Stopping it does not delete files or publish anything. npm.cmd run dev starts it again.", "الخادم برنامج يعمل. إيقافه لا يحذف الملفات ولا ينشر شيئا. أعد تشغيله بـ npm.cmd run dev."],
  },
  {
    question: ["Où reste la clé Supabase service role ?", "Where does the Supabase service role key belong?", "أين يبقى مفتاح Supabase service role؟"],
    options: [["Dans CategoryTiles.tsx, visible au navigateur.", "In CategoryTiles.tsx, visible to the browser.", "في CategoryTiles.tsx ظاهرا للمتصفح."], ["Dans la configuration privée du serveur.", "In private server configuration.", "في إعدادات الخادم الخاصة."], ["Dans un commit GitHub.", "In a GitHub commit.", "في commit على GitHub."]],
    correct: 1,
    explanation: ["Le navigateur appelle /api/categories. La route du serveur utilise la clé privée pour lire Supabase et renvoie les données, pas la clé.", "The browser calls /api/categories. The server route uses the private key to read Supabase and returns data, not the key.", "المتصفح يطلب /api/categories. مسار الخادم يستعمل المفتاح الخاص لقراءة Supabase ويرجع البيانات دون المفتاح."],
  },
  {
    question: ["Tu as créé un commit local. Est-il déjà sur GitHub ?", "You created a local commit. Is it already on GitHub?", "أنشأت commit محليا. هل وصل إلى GitHub؟"],
    options: [["Oui, enregistrer un fichier suffit.", "Yes, saving a file is enough.", "نعم، حفظ الملف يكفي."], ["Oui, commit publie automatiquement le site.", "Yes, commit automatically publishes the site.", "نعم، commit ينشر الموقع تلقائيا."], ["Non, il faut encore envoyer la branche avec push.", "No, you still need to push the branch.", "لا، يجب إرسال الفرع بـ push."]],
    correct: 2,
    explanation: ["Enregistrer change un fichier. Commit crée un point d’historique local. Push envoie ces commits au dépôt distant de la branche choisie.", "Save changes a file. Commit creates a local history checkpoint. Push sends those commits to the remote repository on the chosen branch.", "الحفظ يغيّر الملف. commit ينشئ نقطة في التاريخ المحلي. push يرسلها إلى المستودع البعيد في الفرع المختار."],
  },
  {
    question: ["Tu viens de changer une variable dans Vercel. Que faire ensuite ?", "You changed a variable in Vercel. What comes next?", "غيّرت متغيرا في Vercel. ما الخطوة التالية؟"],
    options: [["Créer un nouveau déploiement et vérifier le résultat.", "Create a new deployment and check the result.", "أنشئ نشرا جديدا وتحقق من النتيجة."], ["Coller la clé dans le code de la page.", "Paste the key into the page code.", "ضع المفتاح في كود الصفحة."], ["Supprimer le dépôt GitHub.", "Delete the GitHub repository.", "احذف مستودع GitHub."]],
    correct: 0,
    explanation: ["Les nouvelles variables s’appliquent à un nouveau déploiement. Vérifie aussi le bon environnement : Preview ou Production.", "New variables apply to a new deployment. Also check the right environment: Preview or Production.", "المتغيرات الجديدة تُطبق على نشر جديد. تحقق أيضا من البيئة الصحيحة: Preview أو Production."],
  },
];
