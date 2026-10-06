-- Stable lesson IDs: append new lessons rather than renumbering published content.
insert into public.learning_tips(id,topic,level,difficulty,title,content,code,remember,source_path) values
('1','Next.js','1','beginner','📘 لماذا نستخدم Next.js؟','متجرنا يحتاج صفحات وروابط وكودًا يعمل على Server. Next.js يجمع هذه الأجزاء حول React. نستخدمه حتى لا نبني كل الأدوات من الصفر.

تذكر: Next.js ينظّم تطبيق React كاملًا.','','Next.js ينظّم تطبيق React كاملًا.','app/page.tsx'),
('2','Next.js','1','beginner','🧩 افهم هذا المثال: Next.js','هذا المسار يحتوي الصفحة الرئيسية لمتجر L''ECOMAX. Next.js يعرف دوره من اسمه ومكانه.

app/page.tsx

تذكر: Next.js ينظّم تطبيق React كاملًا.','app/page.tsx','Next.js ينظّم تطبيق React كاملًا.','app/page.tsx'),
('3','Next.js','1','beginner','⚠️ انتبه عند استخدام Next.js','لا تبدأ بحفظ كل الملفات. افتح الصفحة الرئيسية أولًا واربط ما تراه بالملف الذي يعرضه.

تذكر: Next.js ينظّم تطبيق React كاملًا.','','Next.js ينظّم تطبيق React كاملًا.','app/page.tsx'),
('4','Project structure','2','beginner','📘 أين أبحث عن الكود؟','عندما نريد تعديل المتجر نحتاج معرفة مكان كل جزء. app للصفحات، components للأجزاء التي نعيد استخدامها، وpublic للصور والملفات العامة.

تذكر: مكان الملف يساعدك على معرفة وظيفته.','','مكان الملف يساعدك على معرفة وظيفته.','app/layout.tsx'),
('5','Project structure','2','beginner','🧩 افهم هذا المثال: Project structure','الصورة داخل public تظهر عبر /images/logo.png. لا نكتب public داخل رابط الصورة.

public/images/logo.png

تذكر: مكان الملف يساعدك على معرفة وظيفته.','public/images/logo.png','مكان الملف يساعدك على معرفة وظيفته.','app/layout.tsx'),
('6','Project structure','2','beginner','⚠️ انتبه عند استخدام Project structure','لا تضع كلمات السر في public. كل ملف هناك يمكن للزائر طلبه عبر رابطه.

تذكر: مكان الملف يساعدك على معرفة وظيفته.','','مكان الملف يساعدك على معرفة وظيفته.','app/layout.tsx'),
('7','App Router','3','beginner','📘 كيف يصل الزائر إلى صفحة؟','نحتاج تنظيم روابط المتجر. App Router يستخدم المجلدات داخل app لبناء Routes. المجلد الذي يحتوي page.tsx يعطي الزائر صفحة.

تذكر: المجلد يحدد المسار وpage.tsx يعرض الصفحة.','','المجلد يحدد المسار وpage.tsx يعرض الصفحة.','app/boutique/page.tsx'),
('8','App Router','3','beginner','🧩 افهم هذا المثال: App Router','هذا الملف يعرض صفحة /boutique في متجرنا. اسم المجلد جزء من الرابط.

app/boutique/page.tsx

تذكر: المجلد يحدد المسار وpage.tsx يعرض الصفحة.','app/boutique/page.tsx','المجلد يحدد المسار وpage.tsx يعرض الصفحة.','app/boutique/page.tsx'),
('9','App Router','3','beginner','❓ سؤال صغير: App Router','لدينا app/boutique/page.tsx. ما الرابط؟
A: /boutique
B: /page/boutique
C: /app/boutique

فكر قليلًا ثم افتح المعلومة لترى الإجابة.','','A — /boutique. المجلد داخل app يحدد المسار.','app/boutique/page.tsx'),
('10','page.tsx','4','beginner','📘 ما دور page.tsx؟','نحتاج نقطة يبدأ منها عرض كل صفحة. page.tsx يحدد محتوى Route واحد، مثل صفحة السلة التي يفتحها العميل قبل الشراء.

تذكر: page.tsx هو مدخل عرض الصفحة.','','page.tsx هو مدخل عرض الصفحة.','app/panier/page.tsx'),
('11','page.tsx','4','beginner','🧩 افهم هذا المثال: page.tsx','الدالة تعيد عنوانًا يظهر في الصفحة. export default يجعل Next.js يعرف ما الذي يجب عرضه.

export default function Page() { return <h1>Cart</h1>; }

تذكر: page.tsx هو مدخل عرض الصفحة.','export default function Page() { return <h1>Cart</h1>; }','page.tsx هو مدخل عرض الصفحة.','app/panier/page.tsx'),
('12','page.tsx','4','beginner','⚠️ انتبه عند استخدام page.tsx','اسم الصفحة مهم: cart.tsx داخل app/panier لا ينشئ صفحة /panier. الاسم المطلوب هو page.tsx.

تذكر: page.tsx هو مدخل عرض الصفحة.','','page.tsx هو مدخل عرض الصفحة.','app/panier/page.tsx'),
('13','layout.tsx','5','beginner','📘 لماذا نستخدم layout؟','نريد أن يظهر نفس الإطار حول صفحات كثيرة. layout.tsx يضع عناصر مشتركة حول الصفحة، مثل Header وFooter، بدل تكرارها في كل ملف.

تذكر: layout هو الإطار وchildren هو المحتوى داخله.','','layout هو الإطار وchildren هو المحتوى داخله.','app/layout.tsx'),
('14','layout.tsx','5','beginner','🧩 افهم هذا المثال: layout.tsx','children هو محتوى الصفحة الموجودة داخل هذا layout. مكانه هنا يجعل الصفحة تظهر داخل main.

return <main>{children}</main>;

تذكر: layout هو الإطار وchildren هو المحتوى داخله.','return <main>{children}</main>;','layout هو الإطار وchildren هو المحتوى داخله.','app/layout.tsx'),
('15','layout.tsx','5','beginner','⚠️ انتبه عند استخدام layout.tsx','إذا نسيت children فقد يظهر الإطار دون الصفحة. عند غياب المحتوى افحص موضع children أولًا.

تذكر: layout هو الإطار وchildren هو المحتوى داخله.','','layout هو الإطار وchildren هو المحتوى داخله.','app/layout.tsx'),
('16','React Components','6','beginner','📘 ما هو Component؟','بطاقة المنتج تتكرر كثيرًا. نجعلها Component: دالة تصف جزءًا من الواجهة، ثم نستخدمها في أكثر من مكان.

تذكر: Component يقسم الواجهة إلى أجزاء مفهومة.','','Component يقسم الواجهة إلى أجزاء مفهومة.','components/ProductCard.tsx'),
('17','React Components','6','beginner','🧩 افهم هذا المثال: React Components','ProductPrice يعرض جزءًا صغيرًا فقط: السعر. يمكن وضعه داخل بطاقة أو صفحة منتج.

function ProductPrice() { return <span>199 MAD</span>; }

تذكر: Component يقسم الواجهة إلى أجزاء مفهومة.','function ProductPrice() { return <span>199 MAD</span>; }','Component يقسم الواجهة إلى أجزاء مفهومة.','components/ProductCard.tsx'),
('18','React Components','6','beginner','⚠️ انتبه عند استخدام React Components','ابدأ اسم Component بحرف كبير مثل ProductPrice. الاسم الصغير قد يُفهم كعنصر HTML عادي.

تذكر: Component يقسم الواجهة إلى أجزاء مفهومة.','','Component يقسم الواجهة إلى أجزاء مفهومة.','components/ProductCard.tsx'),
('19','Props','7','beginner','📘 كيف نعطي Component معلومات؟','نريد نفس بطاقة المنتج لأسعار مختلفة. Props هي المعلومات التي نمررها إلى Component من الجزء الذي يستخدمه.

تذكر: Props تنقل المعلومات إلى Component.','','Props تنقل المعلومات إلى Component.','components/ProductCard.tsx'),
('20','Props','7','beginner','🧩 افهم هذا المثال: Props','نمرر الرقم 199 باسم price. يستطيع ProductPrice قراءة هذه القيمة وعرضها.

<ProductPrice price={199} />

تذكر: Props تنقل المعلومات إلى Component.','<ProductPrice price={199} />','Props تنقل المعلومات إلى Component.','components/ProductCard.tsx'),
('21','Props','7','beginner','⚠️ انتبه عند استخدام Props','لا تغيّر Props داخل Component. إذا تغير سعر المنتج، مرّر القيمة الجديدة من الجزء المسؤول عنه.

تذكر: Props تنقل المعلومات إلى Component.','','Props تنقل المعلومات إلى Component.','components/ProductCard.tsx'),
('22','State','8','beginner','📘 لماذا نحتاج State؟','عدد المنتجات في السلة يتغير عند الضغط. State تحفظ قيمة وتخبر React بإعادة عرض الواجهة عند تحديثها. useState أداة لإنشاء هذه القيمة داخل Component تفاعلي.

تذكر: State تتغير فتتحدث الواجهة.','','State تتغير فتتحدث الواجهة.','app/panier/page.tsx'),
('23','State','8','beginner','🧩 افهم هذا المثال: State','quantity تبدأ بالعدد 1. setQuantity هي الدالة التي نستخدمها لتحديث العدد وإعادة العرض.

const [quantity, setQuantity] = useState(1);

تذكر: State تتغير فتتحدث الواجهة.','const [quantity, setQuantity] = useState(1);','State تتغير فتتحدث الواجهة.','app/panier/page.tsx'),
('24','State','8','beginner','❓ سؤال صغير: State','نريد تحديث عدد المنتجات في الواجهة. ماذا نستخدم؟
A: quantity = 2
B: setQuantity(2)

فكر قليلًا ثم افتح المعلومة لترى الإجابة.','','B — setQuantity(2). تحديث State يطلب من React إعادة العرض.','app/panier/page.tsx'),
('25','Server Components','9','beginner','📘 لماذا يعمل جزء من الصفحة على Server؟','بعض الأجزاء تحتاج فقط عرض معلومات، دون ضغط أو كتابة. في App Router تكون الصفحات وlayouts من نوع Server Component افتراضيًا. هذا يقلل الكود المطلوب في Browser.

تذكر: ابدأ على Server عندما لا تحتاج تفاعلًا.','','ابدأ على Server عندما لا تحتاج تفاعلًا.','app/boutique/page.tsx'),
('26','Server Components','9','beginner','🧩 افهم هذا المثال: Server Components','هذه الصفحة تعرض عنوانًا فقط. لا تحتاج أن تصبح Client Component لكي تظهر للمستخدم.

export default function Page() { return <h1>Products</h1>; }

تذكر: ابدأ على Server عندما لا تحتاج تفاعلًا.','export default function Page() { return <h1>Products</h1>; }','ابدأ على Server عندما لا تحتاج تفاعلًا.','app/boutique/page.tsx'),
('27','Server Components','9','beginner','⚠️ انتبه عند استخدام Server Components','Server Component لا يستخدم window؛ فهذا اسم يخص Browser. افصل الجزء الذي يحتاج Browser عن بقية الصفحة.

تذكر: ابدأ على Server عندما لا تحتاج تفاعلًا.','','ابدأ على Server عندما لا تحتاج تفاعلًا.','app/boutique/page.tsx'),
('28','Client Components','10','beginner','📘 متى أكتب use client؟','زر زيادة كمية السلة يحتاج onClick وState. نضع use client أعلى الملف ليكون مدخلًا لجزء تفاعلي. نستخدمه عندما يحتاج Component أدوات Browser أو React Hooks مثل useState.

تذكر: Client Component يسمح بالتفاعل داخل Browser.','','Client Component يسمح بالتفاعل داخل Browser.','app/panier/page.tsx'),
('29','Client Components','10','beginner','🧩 افهم هذا المثال: Client Components','هذا السطر يأتي قبل imports في ملف Component التفاعلي. بعدها يمكن استخدام useState وonClick.

"use client";

تذكر: Client Component يسمح بالتفاعل داخل Browser.','"use client";','Client Component يسمح بالتفاعل داخل Browser.','app/panier/page.tsx'),
('30','Client Components','10','beginner','⚠️ انتبه عند استخدام Client Components','لا تجعل كل الصفحة Client لمجرد وجود زر. يمكن أن يبقى الجزء الكبير على Server ويكون الزر وحده Client.

تذكر: Client Component يسمح بالتفاعل داخل Browser.','','Client Component يسمح بالتفاعل داخل Browser.','app/panier/page.tsx'),
('31','Routing','11','beginner','📘 كيف ننتقل داخل المتجر؟','نريد الانتقال من منتج إلى السلة بسهولة. Link من Next.js ينظم الانتقال بين صفحات الموقع وقد يجهز الصفحة التالية مسبقًا.

تذكر: Link يربط صفحات المتجر.','','Link يربط صفحات المتجر.','components/Header.tsx'),
('32','Routing','11','beginner','🧩 افهم هذا المثال: Routing','href يحدد الوجهة. هنا الضغط يفتح /panier دون كتابة منطق الانتقال يدويًا.

<Link href="/panier">Cart</Link>

تذكر: Link يربط صفحات المتجر.','<Link href="/panier">Cart</Link>','Link يربط صفحات المتجر.','components/Header.tsx'),
('33','Routing','11','beginner','⚠️ انتبه عند استخدام Routing','لا تستخدم button لكل رابط. Link مناسب للانتقال، وbutton مناسب لفعل مثل إضافة منتج للسلة.

تذكر: Link يربط صفحات المتجر.','','Link يربط صفحات المتجر.','components/Header.tsx'),
('34','Dynamic Routes','12','beginner','📘 صفحة واحدة لمنتجات كثيرة','لكل منتج رابط مختلف، لكن شكل الصفحة متشابه. Dynamic Route يستخدم جزءًا متغيرًا مثل [slug] بدل إنشاء ملف لكل منتج.

تذكر: [slug] يلتقط الجزء المتغير من الرابط.','','[slug] يلتقط الجزء المتغير من الرابط.','app/produit/[slug]/page.tsx'),
('35','Dynamic Routes','12','beginner','🧩 افهم هذا المثال: Dynamic Routes','يمكن لهذا الملف خدمة /produit/shoes و/produit/bag. slug هو الجزء الذي يختلف بين الرابطين.

app/produit/[slug]/page.tsx

تذكر: [slug] يلتقط الجزء المتغير من الرابط.','app/produit/[slug]/page.tsx','[slug] يلتقط الجزء المتغير من الرابط.','app/produit/[slug]/page.tsx'),
('36','Dynamic Routes','12','beginner','⚠️ انتبه عند استخدام Dynamic Routes','لا تفترض أن كل slug يشير لمنتج موجود. يجب أن تتعامل الصفحة أيضًا مع منتج غير موجود.

تذكر: [slug] يلتقط الجزء المتغير من الرابط.','','[slug] يلتقط الجزء المتغير من الرابط.','app/produit/[slug]/page.tsx'),
('37','Data Fetching','13','intermediate','📘 لماذا نجلب البيانات؟','سعر المنتج قد يتغير. بدل كتابة السعر دائمًا داخل الصفحة، نجلب معلومات المنتج من المصدر ثم نعرضها. fetch أداة لإرسال طلب إلى عنوان.

تذكر: جلب البيانات يربط الصفحة بمعلومات المتجر.','','جلب البيانات يربط الصفحة بمعلومات المتجر.','app/api/products/route.ts'),
('38','Data Fetching','13','intermediate','🧩 افهم هذا المثال: Data Fetching','هذا المثال داخل Browser يطلب قائمة المنتجات من موقعنا. الطلب وحده لا يعني أن البيانات وصلت بالفعل.

fetch(''/api/products'')

تذكر: جلب البيانات يربط الصفحة بمعلومات المتجر.','fetch(''/api/products'')','جلب البيانات يربط الصفحة بمعلومات المتجر.','app/api/products/route.ts'),
('39','Data Fetching','13','intermediate','⚠️ انتبه عند استخدام Data Fetching','لا تبدأ طلبًا جديدًا داخل كل عملية عرض Client Component. استخدم مكانًا مخصصًا للجلب حتى لا تتكرر الطلبات دون حاجة.

تذكر: جلب البيانات يربط الصفحة بمعلومات المتجر.','','جلب البيانات يربط الصفحة بمعلومات المتجر.','app/api/products/route.ts'),
('40','async/await','14','intermediate','📘 لماذا ننتظر البيانات؟','جلب المنتج يستغرق وقتًا. await ينتظر نتيجة عملية غير فورية، وasync يسمح لنا بكتابة await داخل الدالة.

تذكر: await ينتظر نتيجة نحتاجها.','','await ينتظر نتيجة نحتاجها.','app/produit/[slug]/page.tsx'),
('41','async/await','14','intermediate','🧩 افهم هذا المثال: async/await','نفترض أن getProduct دالة لجلب المنتج. هذا السطر ينتظر نتيجتها قبل متابعة الكود الذي يحتاج product.

const product = await getProduct(id);

تذكر: await ينتظر نتيجة نحتاجها.','const product = await getProduct(id);','await ينتظر نتيجة نحتاجها.','app/produit/[slug]/page.tsx'),
('42','async/await','14','intermediate','⚠️ انتبه عند استخدام async/await','انتظار الطلب لا يعني نجاحه. قد يفشل الاتصال؛ لذلك نحتاج أيضًا معالجة الخطأ بدل ترك الصفحة عالقة.

تذكر: await ينتظر نتيجة نحتاجها.','','await ينتظر نتيجة نحتاجها.','app/produit/[slug]/page.tsx'),
('43','APIs','15','intermediate','📘 ما هي API؟','الواجهة تحتاج طريقة تطلب بها معلومات أو تنفذ فعلًا. API هي نقطة تواصل لها مدخلات ونتيجة واضحة، مثل طلب قائمة المنتجات.

تذكر: API عقد واضح بين طالب المعلومة ومصدرها.','','API عقد واضح بين طالب المعلومة ومصدرها.','app/api/products/route.ts'),
('44','APIs','15','intermediate','🧩 افهم هذا المثال: APIs','GET يعني طلب قراءة. هذا العنوان يتيح للواجهة طلب المنتجات بدل الوصول المباشر إلى أسرار Database.

GET /api/products

تذكر: API عقد واضح بين طالب المعلومة ومصدرها.','GET /api/products','API عقد واضح بين طالب المعلومة ومصدرها.','app/api/products/route.ts'),
('45','APIs','15','intermediate','⚠️ انتبه عند استخدام APIs','رد API ليس دائمًا نجاحًا. افحص response.ok قبل اعتبار النتيجة بيانات صالحة للعرض.

تذكر: API عقد واضح بين طالب المعلومة ومصدرها.','','API عقد واضح بين طالب المعلومة ومصدرها.','app/api/products/route.ts'),
('46','Route Handlers','16','intermediate','📘 أين نكتب API في Next.js؟','نحتاج كودًا يستقبل طلب API على Server. نكتب route.ts داخل app، ونصدّر دالة باسم طريقة الطلب مثل GET أو POST.

تذكر: route.ts يعالج الطلب وpage.tsx يعرض الصفحة.','','route.ts يعالج الطلب وpage.tsx يعرض الصفحة.','app/api/products/route.ts'),
('47','Route Handlers','16','intermediate','🧩 افهم هذا المثال: Route Handlers','هذا المثال يعيد JSON فيه stock يساوي 5. الواجهة تقرأ النتيجة لتعرف الكمية.

export async function GET() { return Response.json({ stock: 5 }); }

تذكر: route.ts يعالج الطلب وpage.tsx يعرض الصفحة.','export async function GET() { return Response.json({ stock: 5 }); }','route.ts يعالج الطلب وpage.tsx يعرض الصفحة.','app/api/products/route.ts'),
('48','Route Handlers','16','intermediate','❓ سؤال صغير: Route Handlers','أي ملف يعالج طلب API؟
A: page.tsx
B: route.ts

فكر قليلًا ثم افتح المعلومة لترى الإجابة.','','B — route.ts. أما page.tsx فيعرض صفحة.','app/api/products/route.ts'),
('49','Forms','17','intermediate','📘 لماذا نستخدم form؟','Checkout يحتاج جمع الاسم والعنوان. form يجمع حقولًا مرتبطة في عملية إرسال واحدة، ويعمل أيضًا مع لوحة المفاتيح.

تذكر: كل حقل مرسل يحتاج اسمًا واضحًا.','','كل حقل مرسل يحتاج اسمًا واضحًا.','app/checkout/page.tsx'),
('50','Forms','17','intermediate','🧩 افهم هذا المثال: Forms','name يحدد اسم القيمة عند جمع بيانات form. required يطلب من Browser التحقق أن الحقل ليس فارغًا.

<input name="customerName" required />

تذكر: كل حقل مرسل يحتاج اسمًا واضحًا.','<input name="customerName" required />','كل حقل مرسل يحتاج اسمًا واضحًا.','app/checkout/page.tsx'),
('51','Forms','17','intermediate','⚠️ انتبه عند استخدام Forms','required في Browser يساعد المستخدم فقط. يجب أن يتحقق Server من الاسم والعنوان أيضًا لأن الطلب يمكن إرساله دون الواجهة.

تذكر: كل حقل مرسل يحتاج اسمًا واضحًا.','','كل حقل مرسل يحتاج اسمًا واضحًا.','app/checkout/page.tsx'),
('52','Server Actions','18','intermediate','📘 فعل يعمل على Server','عند حفظ تعديل منتج نحتاج كودًا يعمل على Server. Server Action دالة يمكن ربطها بواجهة أو form لتنفيذ هذا الفعل دون كتابة Route Handler منفصل لكل حالة.

تذكر: Server Action ينفذ فعلًا على Server.','','Server Action ينفذ فعلًا على Server.','app/admin/products/page.tsx'),
('53','Server Actions','18','intermediate','🧩 افهم هذا المثال: Server Actions','هذا التوجيه يحدد كود Server Action بحسب موضعه. يستقبل الفعل بيانات form ويتحقق منها قبل الحفظ.

"use server";

تذكر: Server Action ينفذ فعلًا على Server.','"use server";','Server Action ينفذ فعلًا على Server.','app/admin/products/page.tsx'),
('54','Server Actions','18','intermediate','⚠️ انتبه عند استخدام Server Actions','use server لا يغني عن التحقق من صلاحية المستخدم. تحقق أن صاحب الطلب يحق له تعديل المنتج داخل الفعل نفسه.

تذكر: Server Action ينفذ فعلًا على Server.','','Server Action ينفذ فعلًا على Server.','app/admin/products/page.tsx'),
('55','Database','19','intermediate','📘 أين تبقى الطلبات محفوظة؟','State تضيع عند إغلاق الصفحة. Database تحفظ المنتجات والطلبات حتى نرجع إليها لاحقًا. مشروعنا يستخدم Supabase مع PostgreSQL.

تذكر: Database تحفظ المعلومات بعد انتهاء الزيارة.','','Database تحفظ المعلومات بعد انتهاء الزيارة.','lib/db-server.ts'),
('56','Database','19','intermediate','🧩 افهم هذا المثال: Database','هذا مثال SQL يقرأ معرف الطلب ومجموعه من جدول orders. هو قراءة فقط، وليس تعديلًا للطلبات.

select id, total from orders;

تذكر: Database تحفظ المعلومات بعد انتهاء الزيارة.','select id, total from orders;','Database تحفظ المعلومات بعد انتهاء الزيارة.','lib/db-server.ts'),
('57','Database','19','intermediate','⚠️ انتبه عند استخدام Database','لا تعتمد على ذاكرة Server وحدها لحفظ الطلبات. قد يعاد تشغيله؛ البيانات المهمة تحتاج تخزينًا دائمًا.

تذكر: Database تحفظ المعلومات بعد انتهاء الزيارة.','','Database تحفظ المعلومات بعد انتهاء الزيارة.','lib/db-server.ts'),
('58','Authentication','20','intermediate','📘 من يستخدم هذه الصفحة؟','لوحة الإدارة تحتاج معرفة هوية المستخدم. Authentication يتحقق من هويته؛ وبعدها نفحص ما يُسمح له بفعله.

تذكر: الهوية أولًا ثم صلاحية الفعل.','','الهوية أولًا ثم صلاحية الفعل.','lib/admin-access.ts'),
('59','Authentication','20','intermediate','🧩 افهم هذا المثال: Authentication','في مشروعنا تعطي هذه الدالة معلومات الوصول للإدارة أو null. بعدها يجب فحص الصلاحية المطلوبة.

const access = await getAdminAccess(request);

تذكر: الهوية أولًا ثم صلاحية الفعل.','const access = await getAdminAccess(request);','الهوية أولًا ثم صلاحية الفعل.','lib/admin-access.ts'),
('60','Authentication','20','intermediate','⚠️ انتبه عند استخدام Authentication','إخفاء زر حذف المنتج لا يحمي API. يجب أن يرفض Server طلب الحذف إذا لم تكن لدى المستخدم الصلاحية.

تذكر: الهوية أولًا ثم صلاحية الفعل.','','الهوية أولًا ثم صلاحية الفعل.','lib/admin-access.ts'),
('61','Environment Variables','21','intermediate','📘 أين نضع الإعدادات الخاصة؟','نحتاج إعدادات تختلف بين جهازنا وProduction. Environment Variables تخزن هذه القيم خارج كود الصفحة، مثل عنوان Database ومفاتيح Server.

تذكر: المفتاح الخاص يبقى على Server.','','المفتاح الخاص يبقى على Server.','lib/supabase-server.ts'),
('62','Environment Variables','21','intermediate','🧩 افهم هذا المثال: Environment Variables','هذا مثال لمفتاح خاص يستخدمه Server فقط. لا نرسله إلى Client Component أو داخل رد API.

process.env.SUPABASE_SERVICE_ROLE_KEY

تذكر: المفتاح الخاص يبقى على Server.','process.env.SUPABASE_SERVICE_ROLE_KEY','المفتاح الخاص يبقى على Server.','lib/supabase-server.ts'),
('63','Environment Variables','21','intermediate','❓ سؤال صغير: Environment Variables','هل نضع مفتاح Database السري في NEXT_PUBLIC_SECRET؟
A: نعم
B: لا

فكر قليلًا ثم افتح المعلومة لترى الإجابة.','','B — لا. بداية NEXT_PUBLIC_ قد تكشف القيمة لـ Browser.','lib/supabase-server.ts'),
('64','loading.tsx','22','intermediate','📘 ماذا يرى العميل أثناء الانتظار؟','صفحة المنتجات قد تنتظر البيانات. loading.tsx يعطي Next.js واجهة انتظار للجزء الذي لم يجهز بدل مساحة فارغة.

تذكر: واجهة الانتظار تشرح أن العمل مستمر.','','واجهة الانتظار تشرح أن العمل مستمر.','app/boutique/page.tsx'),
('65','loading.tsx','22','intermediate','🧩 افهم هذا المثال: loading.tsx','ضع المثال في loading.tsx داخل Route مناسب. يمكن استبدال النص لاحقًا ببطاقات مؤقتة تشبه المنتجات.

export default function Loading() { return <p>Loading products…</p>; }

تذكر: واجهة الانتظار تشرح أن العمل مستمر.','export default function Loading() { return <p>Loading products…</p>; }','واجهة الانتظار تشرح أن العمل مستمر.','app/boutique/page.tsx'),
('66','loading.tsx','22','intermediate','⚠️ انتبه عند استخدام loading.tsx','لا تعرض سعرًا وهميًا كأنه حقيقي أثناء التحميل. استخدم شكل انتظار واضحًا حتى لا يسيء العميل فهمه.

تذكر: واجهة الانتظار تشرح أن العمل مستمر.','','واجهة الانتظار تشرح أن العمل مستمر.','app/boutique/page.tsx'),
('67','error.tsx','23','intermediate','📘 كيف نساعد المستخدم بعد الخطأ؟','قد يفشل تحميل المنتجات. error.tsx يعرض واجهة بديلة للأخطاء التي يلتقطها في Route بدل انهيار الجزء كله. هذا الملف يكون Client Component.

تذكر: رسالة الخطأ الجيدة تعطي خطوة تالية.','','رسالة الخطأ الجيدة تعطي خطوة تالية.','lib/public-error.ts'),
('68','error.tsx','23','intermediate','🧩 افهم هذا المثال: error.tsx','reset محاولة لإعادة عرض الجزء المتعطل داخل error.tsx. يفيد بعد مشكلة مؤقتة، لكنه لا يصلح خطأ الكود نفسه.

<button onClick={() => reset()}>Try again</button>

تذكر: رسالة الخطأ الجيدة تعطي خطوة تالية.','<button onClick={() => reset()}>Try again</button>','رسالة الخطأ الجيدة تعطي خطوة تالية.','lib/public-error.ts'),
('69','error.tsx','23','intermediate','⚠️ انتبه عند استخدام error.tsx','لا تعرض أسرار Server أو تفاصيل Database للمستخدم. اعرض رسالة مفهومة واحتفظ بتفاصيل التشخيص في سجلات آمنة.

تذكر: رسالة الخطأ الجيدة تعطي خطوة تالية.','','رسالة الخطأ الجيدة تعطي خطوة تالية.','lib/public-error.ts'),
('70','Metadata and SEO','24','intermediate','📘 كيف يعرف محرك البحث الصفحة؟','كل منتج يحتاج عنوانًا يصفه. Metadata توفر معلومات عن الصفحة مثل title وdescription ليستطيع Browser ومحرك البحث فهمها.

تذكر: عنوان محدد يساعد الزائر على معرفة الصفحة.','','عنوان محدد يساعد الزائر على معرفة الصفحة.','app/produit/[slug]/page.tsx'),
('71','Metadata and SEO','24','intermediate','🧩 افهم هذا المثال: Metadata and SEO','هذا مثال عنوان ثابت لصفحة. للمنتج المتغير يمكن استخدام generateMetadata لبناء عنوان من بياناته.

export const metadata = { title: "L’ECOMAX | Boutique" };

تذكر: عنوان محدد يساعد الزائر على معرفة الصفحة.','export const metadata = { title: "L’ECOMAX | Boutique" };','عنوان محدد يساعد الزائر على معرفة الصفحة.','app/produit/[slug]/page.tsx'),
('72','Metadata and SEO','24','intermediate','⚠️ انتبه عند استخدام Metadata and SEO','لا تستخدم نفس وصف المنتج لكل المنتجات. اجعل العنوان والوصف يعبران عن محتوى الصفحة الحقيقي.

تذكر: عنوان محدد يساعد الزائر على معرفة الصفحة.','','عنوان محدد يساعد الزائر على معرفة الصفحة.','app/produit/[slug]/page.tsx'),
('73','Images and Fonts','25','intermediate','📘 لماذا نحدد حجم الصورة؟','العميل لا يحب أن تقفز الأزرار عند وصول الصور. next/image يساعد في تحسين الصور، وتحديد الأبعاد يحجز مساحة لها قبل ظهورها.

تذكر: صورة محسنة ومساحة ثابتة تعطي صفحة أهدأ.','','صورة محسنة ومساحة ثابتة تعطي صفحة أهدأ.','app/layout.tsx'),
('74','Images and Fonts','25','intermediate','🧩 افهم هذا المثال: Images and Fonts','الأبعاد تحجز مساحة للصورة. alt يصف محتواها لمن لا يراها. المثال يحتاج صورة موجودة بهذا المسار.

<Image src="/images/product.jpg" alt="Black shoes" width={400} height={400} />

تذكر: صورة محسنة ومساحة ثابتة تعطي صفحة أهدأ.','<Image src="/images/product.jpg" alt="Black shoes" width={400} height={400} />','صورة محسنة ومساحة ثابتة تعطي صفحة أهدأ.','app/layout.tsx'),
('75','Images and Fonts','25','intermediate','⚠️ انتبه عند استخدام Images and Fonts','لا تحمّل كل الخطوط والأوزان الممكنة. اختر ما تستخدمه فقط؛ next/font يساعد في تنظيم تحميل الخطوط.

تذكر: صورة محسنة ومساحة ثابتة تعطي صفحة أهدأ.','','صورة محسنة ومساحة ثابتة تعطي صفحة أهدأ.','app/layout.tsx'),
('76','Middleware','26','advanced','📘 ماذا يحدث قبل الوصول للصفحة؟','أحيانًا نحتاج تحويل الزائر قبل عرض الصفحة. في Next.js 15 يمر Middleware على الطلبات المطابقة ليقرر المتابعة أو التحويل، مثل إرسال غير المسجل إلى تسجيل الدخول.

تذكر: Middleware يوجه الطلب قبل الصفحة.','','Middleware يوجه الطلب قبل الصفحة.','middleware.ts'),
('77','Middleware','26','advanced','🧩 افهم هذا المثال: Middleware','هذا المثال يرسل الزائر إلى /admin. يجب استخدامه في الحالة المناسبة فقط حتى لا يدخل الموقع في تحويلات متكررة.

return NextResponse.redirect(new URL("/admin", request.url));

تذكر: Middleware يوجه الطلب قبل الصفحة.','return NextResponse.redirect(new URL("/admin", request.url));','Middleware يوجه الطلب قبل الصفحة.','middleware.ts'),
('78','Middleware','26','advanced','⚠️ انتبه عند استخدام Middleware','التحويل في Middleware لا يكفي لحماية البيانات. افحص الهوية والصلاحية أيضًا داخل API التي تقرأ البيانات أو تعدلها.

تذكر: Middleware يوجه الطلب قبل الصفحة.','','Middleware يوجه الطلب قبل الصفحة.','middleware.ts'),
('79','Caching','27','advanced','📘 لماذا نحفظ نتيجة مؤقتًا؟','إذا طلبنا نفس قائمة الفئات كثيرًا، يمكن أن يقلل Cache تكرار العمل. نعيد استخدام نتيجة سابقة عندما يناسبنا أن تكون قديمة قليلًا.

تذكر: Cache أسرع لكنه يحتاج قرارًا عن حداثة البيانات.','','Cache أسرع لكنه يحتاج قرارًا عن حداثة البيانات.','lib/supabase-server.ts'),
('80','Caching','27','advanced','🧩 افهم هذا المثال: Caching','في Next.js على Server يطلب هذا استخدام Data Cache لهذا الطلب. لا تستخدمه تلقائيًا لكل بيانات المتجر.

fetch(categoryUrl, { cache: ''force-cache'' })

تذكر: Cache أسرع لكنه يحتاج قرارًا عن حداثة البيانات.','fetch(categoryUrl, { cache: ''force-cache'' })','Cache أسرع لكنه يحتاج قرارًا عن حداثة البيانات.','lib/supabase-server.ts'),
('81','Caching','27','advanced','⚠️ انتبه عند استخدام Caching','في Next.js 15 لا تفترض أن كل fetch محفوظ افتراضيًا. اختر سياسة واضحة، ولا تضع بيانات العملاء الخاصة في Cache عام.

تذكر: Cache أسرع لكنه يحتاج قرارًا عن حداثة البيانات.','','Cache أسرع لكنه يحتاج قرارًا عن حداثة البيانات.','lib/supabase-server.ts'),
('82','Revalidation','28','advanced','📘 كيف نجدد Cache؟','بعد تعديل منتج لا نريد بقاء السعر القديم في الصفحة. Revalidation تخبر Next.js أن البيانات المحفوظة تحتاج تحديثًا.

تذكر: احفظ التغيير ثم جدد ما يعتمد عليه.','','احفظ التغيير ثم جدد ما يعتمد عليه.','lib/storefront-refresh.ts'),
('83','Revalidation','28','advanced','🧩 افهم هذا المثال: Revalidation','هذا مثال داخل كود Server بعد نجاح التعديل. يستهدف المسار الذي يحتاج التجديد؛ لا يستبدل عملية حفظ المنتج في Database.

revalidatePath(''/boutique'');

تذكر: احفظ التغيير ثم جدد ما يعتمد عليه.','revalidatePath(''/boutique'');','احفظ التغيير ثم جدد ما يعتمد عليه.','lib/storefront-refresh.ts'),
('84','Revalidation','28','advanced','⚠️ انتبه عند استخدام Revalidation','لا تجدد الموقع كله مع كل تعديل صغير. اختر المسار أو tag المرتبط بالمعلومة التي تغيرت.

تذكر: احفظ التغيير ثم جدد ما يعتمد عليه.','','احفظ التغيير ثم جدد ما يعتمد عليه.','lib/storefront-refresh.ts'),
('85','Security','29','advanced','📘 من يقرر السعر النهائي؟','يمكن للمستخدم تعديل طلب Browser. لذلك يجب على Server قراءة السعر الحقيقي وحساب مجموع الطلب قبل الدفع، بدل الثقة بالمجموع القادم من السلة.

تذكر: Server يتحقق من المال والصلاحيات.','','Server يتحقق من المال والصلاحيات.','app/api/orders/route.ts'),
('86','Security','29','advanced','🧩 افهم هذا المثال: Security','ينفع هذا الحساب عندما product جاء من مصدر موثوق وquantity تم التحقق منها على Server. قيم Browser وحدها لا تكفي.

const total = product.price * quantity;

تذكر: Server يتحقق من المال والصلاحيات.','const total = product.price * quantity;','Server يتحقق من المال والصلاحيات.','app/api/orders/route.ts'),
('87','Security','29','advanced','❓ سؤال صغير: Security','من يتحقق من السعر النهائي للطلب؟
A: Browser فقط
B: Server

فكر قليلًا ثم افتح المعلومة لترى الإجابة.','','B — Server. لا نثق بالسعر الذي يرسله Browser وحده.','app/api/orders/route.ts'),
('88','Performance','30','advanced','📘 هل ننتظر طلبين بلا حاجة؟','إذا كانت الفئات والمنتجات مستقلتين، يمكن طلبهما معًا. Promise.all ينتظر اكتمال العمليتين بدل إنهاء واحدة ثم بدء الأخرى.

تذكر: شغل العمل المستقل معًا عندما يفيد.','','شغل العمل المستقل معًا عندما يفيد.','app/boutique/page.tsx'),
('89','Performance','30','advanced','🧩 افهم هذا المثال: Performance','هذا مثال لدالتين مستقلتين. النتيجة الأولى للمنتجات والثانية للفئات، بنفس ترتيب الوعود داخل القائمة.

const [products, categories] = await Promise.all([getProducts(), getCategories()]);

تذكر: شغل العمل المستقل معًا عندما يفيد.','const [products, categories] = await Promise.all([getProducts(), getCategories()]);','شغل العمل المستقل معًا عندما يفيد.','app/boutique/page.tsx'),
('90','Performance','30','advanced','⚠️ انتبه عند استخدام Performance','لا تشغل طلبًا يحتاج نتيجة طلب آخر بالتوازي معه. افحص العلاقة بين البيانات قبل استخدام Promise.all.

تذكر: شغل العمل المستقل معًا عندما يفيد.','','شغل العمل المستقل معًا عندما يفيد.','app/boutique/page.tsx'),
('91','Deployment','31','advanced','📘 كيف يصبح الموقع جاهزًا للنشر؟','localhost مكان التطوير على جهازك. Deployment ينقل نسخة مبنية إلى بيئة يستطيع الزوار الوصول إليها. نفحص البناء قبل النشر لنكتشف أخطاء قد لا تظهر أثناء التطوير.

تذكر: جرّب البناء ثم جرّب تدفق المستخدم.','','جرّب البناء ثم جرّب تدفق المستخدم.','scripts/next-build.mjs'),
('92','Deployment','31','advanced','🧩 افهم هذا المثال: Deployment','هذا الأمر يبني نسخة Production ويتحقق من أجزاء مهمة في المشروع. نجاحه خطوة مطلوبة قبل نشر التغيير.

npm run build

تذكر: جرّب البناء ثم جرّب تدفق المستخدم.','npm run build','جرّب البناء ثم جرّب تدفق المستخدم.','scripts/next-build.mjs'),
('93','Deployment','31','advanced','⚠️ انتبه عند استخدام Deployment','نجاح build لا يثبت أن الدفع أو Database يعملان. اختبر الميزات التي تحتاج خدمات خارجية في البيئة المقصودة.

تذكر: جرّب البناء ثم جرّب تدفق المستخدم.','','جرّب البناء ثم جرّب تدفق المستخدم.','scripts/next-build.mjs'),
('94','Vercel','32','advanced','📘 لماذا تختلف Preview عن Production؟','نحتاج تجربة التغيير قبل عرضه للعملاء. Vercel يتيح Preview للتجربة وProduction للموقع المنشور. لكل بيئة إعداداتها التي يجب التحقق منها.

تذكر: تحقق من إعدادات البيئة التي تنشر إليها.','','تحقق من إعدادات البيئة التي تنشر إليها.','vercel.json'),
('95','Vercel','32','advanced','🧩 افهم هذا المثال: Vercel','هذا الملف في مشروعنا يحتوي إعدادات مهام Cron. Cron يستدعي API وفق جدول على Server، حتى لو صفحة التعلم مغلقة.

vercel.json

تذكر: تحقق من إعدادات البيئة التي تنشر إليها.','vercel.json','تحقق من إعدادات البيئة التي تنشر إليها.','vercel.json'),
('96','Vercel','32','advanced','⚠️ انتبه عند استخدام Vercel','لا تتوقع تشغيل Vercel Cron تلقائيًا في localhost أو Preview. يحتاج Production وجدولًا تدعمه خطة الاستضافة.

تذكر: تحقق من إعدادات البيئة التي تنشر إليها.','','تحقق من إعدادات البيئة التي تنشر إليها.','vercel.json'),
('97','E-commerce architecture','33','advanced','📘 لماذا نفصل الطلب عن الدفع؟','إنشاء Order ومحاولة Payment حدثان مرتبطان لكنهما ليسا الشيء نفسه. فصل حالتهما يساعدنا على فهم طلب لم يكتمل دفعه وإعادة المحاولة دون إنشاء طلب مكرر.

تذكر: حالة الطلب وحالة الدفع تصفان شيئين مختلفين.','','حالة الطلب وحالة الدفع تصفان شيئين مختلفين.','app/api/paypal/webhook/route.ts'),
('98','E-commerce architecture','33','advanced','🧩 افهم هذا المثال: E-commerce architecture','هذا مثال مبسط للحالتين: الطلب موجود لكن الدفع غير مكتمل. الأسماء الفعلية تعتمد على تصميم Database.

{ orderStatus: ''pending'', paymentStatus: ''unpaid'' }

تذكر: حالة الطلب وحالة الدفع تصفان شيئين مختلفين.','{ orderStatus: ''pending'', paymentStatus: ''unpaid'' }','حالة الطلب وحالة الدفع تصفان شيئين مختلفين.','app/api/paypal/webhook/route.ts'),
('99','E-commerce architecture','33','advanced','⚠️ انتبه عند استخدام E-commerce architecture','لا تعتبر العودة من صفحة الدفع دليلًا كافيًا على نجاحه. تحقق على Server من النتيجة الموثوقة لمزود الدفع.

تذكر: حالة الطلب وحالة الدفع تصفان شيئين مختلفين.','','حالة الطلب وحالة الدفع تصفان شيئين مختلفين.','app/api/paypal/webhook/route.ts'),
('100','Advanced Next.js','34','advanced','📘 متى نفصل الجزء البطيء؟','إذا كانت مراجعات المنتج بطيئة فلا نريد تأخير كل التفاصيل. Suspense يتيح عرض بديل للجزء الذي ينتظر بينما يظهر المحتوى الجاهز، مع مصدر بيانات يدعم Suspense.

تذكر: افصل الانتظار حتى يظهر المحتوى الجاهز مبكرًا.','','افصل الانتظار حتى يظهر المحتوى الجاهز مبكرًا.','app/produit/[slug]/page.tsx'),
('101','Advanced Next.js','34','advanced','🧩 افهم هذا المثال: Advanced Next.js','هذا مثال يحيط بالمراجعات فقط. يستخدم عادة مع Component ينتظر بيانات على Server، وليس أي fetch عادي داخل useEffect.

<Suspense fallback={<p>Loading reviews…</p>}><Reviews /></Suspense>

تذكر: افصل الانتظار حتى يظهر المحتوى الجاهز مبكرًا.','<Suspense fallback={<p>Loading reviews…</p>}><Reviews /></Suspense>','افصل الانتظار حتى يظهر المحتوى الجاهز مبكرًا.','app/produit/[slug]/page.tsx'),
('102','Advanced Next.js','34','advanced','⚠️ انتبه عند استخدام Advanced Next.js','لا تضف تعقيدًا لمجرد أنه متقدم. قِس المشكلة أولًا، ثم اختر أبسط تغيير يجعل تجربة العميل أفضل.

تذكر: افصل الانتظار حتى يظهر المحتوى الجاهز مبكرًا.','','افصل الانتظار حتى يظهر المحتوى الجاهز مبكرًا.','app/produit/[slug]/page.tsx')
on conflict (id) do update set topic=excluded.topic, level=excluded.level, difficulty=excluded.difficulty, title=excluded.title, content=excluded.content, code=excluded.code, remember=excluded.remember, source_path=excluded.source_path;
