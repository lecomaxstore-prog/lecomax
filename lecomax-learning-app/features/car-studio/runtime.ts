import { model, parts, vehicle, type Language } from './vehicle';
import { CarViewer, cameras, type ViewMode } from './viewer';
import { simulation } from './simulations';
import { detailedCarCredit } from './car-asset';

declare global { interface Window { studioBoot: { language: Language; completed: string[] }; studioModel: string; ReactNativeWebView?: { postMessage: (value: string) => void }; studioActive?: (active: boolean) => void } }
const boot = window.studioBoot || { language: 'en', completed: [] };
const lang = boot.language;
const t = (en: string, fr: string, ar: string) => ({ en, fr, ar })[lang];
const root = document.getElementById('studio')!;
document.documentElement.lang = lang === 'ar' ? 'ary' : lang;
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', value = '') => { const node = document.createElement(tag); node.className = className; node.textContent = value; return node; };
const button = (title: string, action: () => void, className = '') => { const node = element('button', className, title); node.type = 'button'; node.onclick = action; return node; };
const send = (type: string, id: string, correct?: boolean) => { const event = { channel: 'lecomax-car-studio', type, id, correct }; if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(event)); else parent.postMessage(event, '*'); };
let viewer: CarViewer | undefined, cleanupSimulation: (() => void) | undefined, selected = 'engine', level = 'beginner', tour = false, quiz: string | undefined, labels = false, full = false, disposed = false;
const learned = new Set(boot.completed);
const header = element('header');
header.append(element('div', 'eyebrow', 'LECOMAX / ENGINEERING'), element('h1', '', '3D Car Studio'), element('p', 'subtitle', t('Automotive Engineering', 'Ingénierie automobile', 'هندسة الطوموبيلات')));
const vehicleHeader = element('div', 'vehicle-heading'); vehicleHeader.append(element('h2', '', model ? vehicle.name : 'CAR CONCEPT'), element('p', 'muted', model ? vehicle.edition : t('DETAILED 3D / EXTERIOR & COCKPIT', '3D DÉTAILLÉE / EXTÉRIEUR ET COCKPIT', 'ثلاثي الأبعاد واقعي / الخارج والكابينة')));
const specRow = element('div', 'specs'); vehicle.specs.forEach(s => specRow.append(element('span', '', s)));
const workspace = element('section', 'workspace');
const viewport = element('div', 'viewport'); viewport.id = 'vehicle-viewport';
const stage = element('div', 'stage'); const notice = element('div', 'notice'); notice.setAttribute('role', 'status');
const status = element('p'); status.setAttribute('aria-live', 'polite');
notice.append(element('span', 'spinner'), status);
viewport.append(stage, notice);
const tools = element('div', 'toolbar'); tools.setAttribute('aria-label', t('Viewer controls', 'Commandes 3D', 'التحكم ثلاثي الأبعاد'));
const presets = element('div', 'toolbar');
const modeBar = element('div', 'toolbar');
const modes: [ViewMode, string][] = [['exterior', t('Exterior', 'Extérieur', 'الخارج')], ['engine', t('Engine', 'Moteur', 'الموطور')], ['chassis', t('Chassis', 'Châssis', 'الشاسي')], ['interior', t('Interior', 'Habitacle', 'الكابينة')], ['xray', 'X-ray'], ['isolate', t('Isolate', 'Isoler', 'عزل')], ['explode', t('Explode', 'Éclater', 'تفكيك')]];
function rebuildTools() {
  tools.replaceChildren(); presets.replaceChildren(); modeBar.replaceChildren();
  if (!viewer) return;
  tools.append(button(t('Reset', 'Réinitialiser', 'رجّع الكاميرا'), () => { viewer?.resetAssembly(); modeBar.querySelectorAll<HTMLButtonElement>('[data-closed-title]').forEach(control => { control.setAttribute('aria-pressed', 'false'); control.textContent = control.dataset.closedTitle!; }); }),
    button(t('Labels', 'Noms', 'الأسامي'), () => { labels = !labels; viewer?.setLabels(labels ? Object.fromEntries(parts.map(p => [p.id, p.name[lang]])) : null); }),
    button(t('Expand / close', 'Agrandir / fermer', 'كبّر / سدّ'), () => { full = !full; workspace.classList.toggle('expanded', full); }),
  );
  const quality = element('select'); quality.setAttribute('aria-label', t('Rendering quality', 'Qualité du rendu', 'جودة العرض'));
  for (const [value, title] of [['low', t('Battery saver', 'Économie', 'توفير البطارية')], ['high', t('High quality', 'Haute qualité', 'جودة عالية')]]) { const option = element('option', '', title); option.value = value!; quality.append(option); }
  quality.onchange = () => viewer?.quality(quality.value === 'low'); tools.append(quality); viewer.quality(true);
  const cameraNames = { reset: t('Default', 'Défaut', 'العادي'), front: t('Front', 'Avant', 'قدّام'), rear: t('Rear', 'Arrière', 'اللور'), side: t('Side', 'Côté', 'الجنب'), top: t('Top', 'Dessus', 'الفوق'), underside: t('Underside', 'Dessous', 'التحت') };
  (Object.keys(cameras) as (keyof typeof cameras)[]).filter(k => k !== 'reset').forEach(name => presets.append(button(cameraNames[name], () => viewer?.preset(name))));
  modes.filter(([mode]) => mode === 'isolate' || viewer?.supports(mode)).forEach(([mode, title]) => modeBar.append(button(title, () => { if (mode === 'isolate') viewer?.select(selected, false); viewer?.setMode(mode); })));
  if (viewer.isLocal) {
    const cabin = button(t('Enter cockpit', 'Entrer dans le cockpit', 'دخل للكابينة'), () => viewer?.cockpit(), 'primary-action'); cabin.dataset.action = 'cockpit'; modeBar.prepend(cabin);
    for (const [key, title, closeTitle] of [['doors', t('Open doors', 'Ouvrir les portes', 'حلّ البيبان'), t('Close doors', 'Fermer les portes', 'سدّ البيبان')], ['hood', t('Open hood', 'Ouvrir le capot', 'حلّ الكابو'), t('Close hood', 'Fermer le capot', 'سدّ الكابو')], ['trunk', t('Open trunk', 'Ouvrir le coffre', 'حلّ الصندوق'), t('Close trunk', 'Fermer le coffre', 'سدّ الصندوق')]] as const) {
      const control = button(title, () => { viewer?.setMode('exterior'); const open = viewer?.toggleOpening(key); control.setAttribute('aria-pressed', String(open)); control.textContent = open ? closeTitle : title; });
      control.dataset.action = key; control.dataset.closedTitle = title; control.setAttribute('aria-pressed', 'false'); modeBar.append(control);
    }
  }
  if (viewer.paintAvailable) for (const [color, name] of [['#234a80', t('Blue paint', 'Peinture bleue', 'صباغة زرقا')], ['#a3a8af', t('Silver paint', 'Peinture argent', 'صباغة فضية')], ['#24252a', t('Black paint', 'Peinture noire', 'صباغة كحلة')], ['#8f2331', t('Red paint', 'Peinture rouge', 'صباغة حمرا')]]) { const swatch = button(name!, () => viewer?.setPaint(color!), 'swatch'); swatch.style.borderColor = color!; tools.append(swatch); }
}
const retry = button(t('Retry viewer', 'Réessayer le rendu', 'عاود العرض'), () => { void loadViewer(); });
async function loadViewer() {
  viewer?.dispose(); viewer = undefined; viewport.dataset.ready = 'false'; rebuildTools();
  if (disposed) return;
  notice.hidden = false; notice.classList.remove('load-error'); notice.replaceChildren(status); status.textContent = t('Loading vehicle…', 'Chargement du véhicule…', 'تحميل الطوموبيل…');
  let current: CarViewer | undefined;
  try {
    current = new CarViewer(stage, id => { if (quiz) answer(id); else select(id, false); }, message => { status.textContent = message; notice.hidden = false; notice.append(retry); });
    viewer = current;
    if (model) await current.load(model, percent => { status.textContent = t('Loading', 'Chargement', 'تحميل') + (percent === null ? '…' : ` ${percent}%`); });
    else await current.loadDetailed(window.studioModel);
    if (disposed || viewer !== current) return;
    viewport.dataset.ready = 'true'; notice.hidden = true; rebuildTools(); renderPanel();
  } catch (error) {
    if (disposed || viewer !== current) return;
    current?.dispose(); viewer = undefined; notice.classList.add('load-error'); status.textContent = t('Vehicle unavailable. ', 'Véhicule indisponible. ', 'الطوموبيل ما متوفراش. ') + (error instanceof Error ? error.message : ''); notice.append(retry);
  }
}
workspace.append(vehicleHeader, viewport, modeBar, tools, presets, element('p', 'hint', t('Drag to rotate 360° · pinch or scroll to zoom · two fingers / right-drag to pan', 'Glissez pour tourner à 360° · pincez ou défilez pour zoomer · deux doigts / clic droit pour déplacer', 'جرّ باش تدوّر 360° · قرّب صبعين للزوم · جرّ بجوج صبعان للتحريك')));
if (!model) {
  workspace.append(element('p', 'model-note', t('Detailed concept car with an authored interior. Open the doors, explore the cockpit and select parts. BMW lesson references below describe a different vehicle.', 'Concept-car détaillé avec habitacle modélisé. Ouvrez les portes, explorez le cockpit et sélectionnez les pièces. Les références BMW ci-dessous concernent un autre véhicule.', 'سيارة بتفاصيل واقعية وكابينة مصمّمة. حلّ البيبان، دخل للكابينة واختار القطع. دروس BMW لتحت كتهضر على سيارة أخرى.')));
  const credit = element('a', 'creator-credit', detailedCarCredit.attribution); credit.href = detailedCarCredit.source; credit.target = '_blank'; credit.rel = 'noopener noreferrer';
  const license = element('a', 'creator-credit', 'CC BY 4.0 · ' + t('License', 'Licence', 'الرخصة')); license.href = detailedCarCredit.license; license.target = '_blank'; license.rel = 'noopener noreferrer';
  workspace.append(credit, license, element('p', 'hint', t('Adapted for LECOMAX: interactive part grouping, cameras and lighting. Original model and textures retained. No endorsement implied.', 'Adapté pour LECOMAX : sélection des pièces, caméras et éclairage. Modèle et textures conservés. Sans affiliation.', 'تكييف LECOMAX: اختيار القطع والكاميرات والضو. الموديل والتكسطور الأصليين محفوظين. بلا شراكة مع المصمّمين.')));
}
const specifications = element('details', 'specifications'); specifications.append(element('summary', '', t('Competition engineering reference · 2020 EU', 'Référence Competition · 2020 Europe', 'مرجع هندسي Competition · أوروبا 2020')), specRow); workspace.append(specifications);
const learning = element('section', 'learning');
learning.append(element('div', 'eyebrow', t('EXPLORE CAR ANATOMY', 'EXPLORER L’ANATOMIE', 'اكتشف أجزاء الطوموبيل')));
const progress = element('p', 'muted');
function updateProgress() { progress.textContent = `${learned.size} / ${parts.length} ` + t('systems studied on this device', 'systèmes étudiés sur cet appareil', 'أنظمة تقراو فهاد الجهاز'); }
updateProgress(); learning.append(progress);
const learningTools = element('div', 'toolbar');
const levelSelect = element('select'); levelSelect.setAttribute('aria-label', t('Learning level', 'Niveau', 'مستوى التعلّم'));
for (const [id, title] of [['beginner', t('Beginner', 'Débutant', 'مبتدئ')], ['intermediate', t('Intermediate', 'Intermédiaire', 'متوسط')], ['advanced', t('Advanced', 'Avancé', 'متقدّم')]]) { const option = element('option', '', title); option.value = id!; levelSelect.append(option); }
levelSelect.onchange = () => { level = levelSelect.value; renderPanel(); };
const tourButton = button(t('Guided tour', 'Visite guidée', 'جولة موجّهة'), () => { tour = !tour; quiz = undefined; select(parts[0]!.id); tourButton.setAttribute('aria-pressed', String(tour)); });
learningTools.append(levelSelect, tourButton, button(t('Test my knowledge', 'Tester mes connaissances', 'نختبر معلوماتي'), startQuiz));
const anatomy = element('div', 'anatomy'); anatomy.setAttribute('aria-label', t('Vehicle systems', 'Systèmes du véhicule', 'أنظمة الطوموبيل'));
const panel = element('article', 'info'); panel.setAttribute('aria-live', 'polite');
function select(id: string, focus = true) { selected = id; quiz = undefined; viewer?.select(id, focus); renderPanel(); }
function next() { const index = parts.findIndex(p => p.id === selected); if (tour && index === parts.length - 1) { tour = false; tourButton.setAttribute('aria-pressed', 'false'); } select(parts[(index + 1) % parts.length]!.id); }
function startQuiz() {
  tour = false; tourButton.setAttribute('aria-pressed', 'false');
  const candidates = viewer?.available.size ? parts.filter(p => viewer!.available.has(p.id)) : parts;
  const part = candidates[Math.floor(Math.random() * candidates.length)]!; quiz = part.id;
  cleanupSimulation?.(); cleanupSimulation = undefined; viewer?.setLabels(null); viewer?.select('', false); viewer?.setMode('exterior'); labels = false;
  panel.replaceChildren(element('div', 'eyebrow', viewer?.available.size ? t('3D IDENTIFICATION QUIZ', 'QUIZ D’IDENTIFICATION 3D', 'اختبار التعرّف ثلاثي الأبعاد') : t('KNOWLEDGE QUIZ', 'QUIZ DE CONNAISSANCES', 'اختبار المعلومات')), element('h3', '', t('Which system performs this function?', 'Quel système assure cette fonction ?', 'شنو هو النظام اللي كيدير هاد الخدمة؟')), element('p', '', part.function[lang]));
  if (viewer?.available.size) panel.append(element('p', '', t('Tap the matching system on the vehicle.', 'Touchez le système sur le véhicule.', 'ضغط على النظام المناسب فالطوموبيل.')));
  { const choices = element('div', 'toolbar'); parts.forEach(p => choices.append(button(p.name[lang], () => answer(p.id)))); panel.append(choices); }
}
function answer(id: string) {
  if (!quiz) return; const expected = parts.find(p => p.id === quiz)!; const correct = id === quiz;
  send('quiz', expected.id, correct); quiz = undefined;
  panel.replaceChildren(element('h3', '', correct ? t('Correct', 'Bonne réponse', 'صحيح') : t('Keep learning', 'Continuez à apprendre', 'كمّل تتعلّم')), element('p', '', expected.name[lang] + ' — ' + expected.function[lang]), button(t('Review system', 'Revoir le système', 'راجع النظام'), () => select(expected.id)), button(t('Next question', 'Question suivante', 'السؤال الموالي'), startQuiz));
}
function paragraph(title: string, value: string) { const section = element('section'); section.append(element('h4', '', title), element('p', '', value)); return section; }
function renderPanel() {
  cleanupSimulation?.(); cleanupSimulation = undefined;
  const part = parts.find(p => p.id === selected)!;
  anatomy.replaceChildren(); parts.forEach((p, index) => { const item = button(`${String(index + 1).padStart(2, '0')} · ${p.name[lang]}`, () => select(p.id)); item.setAttribute('aria-pressed', String(selected === p.id)); anatomy.append(item); });
  panel.replaceChildren(element('div', 'eyebrow', tour ? `${t('GUIDED TOUR', 'VISITE GUIDÉE', 'جولة موجّهة')} ${parts.indexOf(part) + 1} / ${parts.length}` : t('COMPONENT NOTES', 'FICHE COMPOSANT', 'معلومات على الجزء')), element('h3', '', part.name[lang]));
  panel.append(element('p', 'availability', viewer?.available.has(part.id) ? t('Selectable concept-car component · BMW comparison notes below', 'Pièce du concept-car sélectionnable · comparaison BMW ci-dessous', 'قطعة من السيارة قابلة للاختيار · مقارنة مع BMW لتحت') : t('Learning content · this system is not separately modeled in the concept car', 'Contenu pédagogique · ce système n’est pas modélisé séparément dans le concept-car', 'محتوى تعليمي · هاد النظام ما مصمّمش بوحدو فهاد السيارة')));
  panel.append(paragraph(t('What it does', 'Son rôle', 'شنو كيدير'), part.function[lang]), paragraph(t('Where it is', 'Emplacement', 'فين كاين'), part.location[lang]));
  if (level !== 'beginner') panel.append(paragraph(t('How it works & why it matters', 'Fonctionnement et importance', 'كيفاش كيخدم وعلاش مهم'), part.engineering[lang]));
  const connected = element('section'); connected.append(element('h4', '', t('Connected systems', 'Systèmes connectés', 'الأنظمة المربوطة')));
  const links = element('div', 'toolbar'); part.connections.forEach(id => { const connectedPart = parts.find(p => p.id === id)!; links.append(button(connectedPart.name[lang], () => select(id))); }); connected.append(links); panel.append(connected);
  if (level === 'advanced') panel.append(paragraph(t('Maintenance & symptoms · general education', 'Entretien et symptômes · notions générales', 'الصيانة والأعراض · معلومات عامة'), t('Use the vehicle-specific service schedule. New noises, leaks, vibration, warning messages or changing performance warrant inspection; these symptoms alone do not identify a failed part. This lesson is not a repair procedure.', 'Suivez le programme d’entretien propre au véhicule. Bruits nouveaux, fuites, vibrations, alertes ou variations de performance justifient un contrôle ; ils n’identifient pas seuls une pièce défaillante. Cette leçon n’est pas une procédure de réparation.', 'تبع برنامج الصيانة ديال الطوموبيل. صوت جديد أو تسرّب أو اهتزاز أو إنذار أو تبدّل الأداء خاصو فحص؛ هاد الأعراض بوحدها ما كتحدّدش الجزء الخاسر. هاد الدرس ماشي طريقة للإصلاح.')));
  const actions = element('div', 'toolbar');
  if (level === 'beginner') actions.append(button(t('Learn more', 'En savoir plus', 'نتعلّم كثر'), () => { level = 'intermediate'; levelSelect.value = level; renderPanel(); }));
  actions.append(button(learned.has(part.id) ? t('Studied ✓', 'Étudié ✓', 'تقرا ✓') : t('Mark studied', 'Marquer comme étudié', 'علّم كمقروء'), () => { learned.add(part.id); send('learned', part.id); updateProgress(); renderPanel(); }), button(t('Next component', 'Composant suivant', 'الجزء الموالي'), next));
  panel.append(actions);
  if (part.simulation) {
    const sim = element('section', 'simulation');
    panel.append(element('h4', '', t('Interactive engineering illustration', 'Illustration mécanique interactive', 'رسم هندسي تفاعلي')), element('p', 'muted', t('Simplified principles · not a mechanically accurate BMW simulation', 'Principes simplifiés · pas une simulation mécanique exacte de BMW', 'مبادئ مبسّطة · ماشي محاكاة ميكانيكية دقيقة ديال BMW')), sim);
    cleanupSimulation = simulation(sim, part.simulation, t);
  }
  const reference = element('a', 'source', t('BMW manufacturer reference · June 2020', 'Référence constructeur BMW · juin 2020', 'مرجع BMW · يونيو 2020')); reference.href = vehicle.source; reference.target = '_blank'; reference.rel = 'noopener noreferrer'; panel.append(reference);
}
learning.append(learningTools, anatomy, panel);
root.append(header, workspace, learning, element('footer', 'muted', t('UK / European launch specification. 625 PS is metric horsepower, not SAE hp. Equipment and model-year labels vary by market. Lessons describe principles; geometry availability is reported separately.', 'Spécification de lancement UK / Europe. 625 PS désigne des chevaux métriques, pas SAE. Équipement et millésime varient selon le marché. Les leçons expliquent les principes ; la disponibilité géométrique est indiquée séparément.', 'مواصفات الإطلاق فبريطانيا وأوروبا. 625 PS حصان متري، ماشي SAE. التجهيز وسنة الموديل كيختلفو حسب السوق. الدروس كيوضحو المبادئ، وتوفر الأجزاء فالموديل كيبان بوحدو.')));
renderPanel();
void loadViewer().catch(error => { status.textContent = String(error); notice.append(retry); });
window.studioActive = active => { viewer?.setActive(active); if (!active) { cleanupSimulation?.(); cleanupSimulation = undefined; } else if (!quiz) renderPanel(); };
window.addEventListener('message', event => { if (event.source === parent && event.data?.channel === 'lecomax-car-activity' && typeof event.data.active === 'boolean') window.studioActive?.(event.data.active); });
window.addEventListener('pagehide', () => { disposed = true; viewer?.dispose(); cleanupSimulation?.(); });
