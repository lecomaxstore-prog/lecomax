import type { Part } from './vehicle';
/** Deliberately schematic: these are principles, not S63 geometry, timing or gear ratios. */
export function simulation(host: HTMLElement, kind: NonNullable<Part['simulation']>, text: (en: string, fr: string, ar: string) => string) {
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 300; canvas.style.width = '100%'; canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', text('Simplified mechanical principle diagram', 'Schéma mécanique simplifié', 'رسم مبسّط للمبدأ الميكانيكي'));
  const caption = document.createElement('p'); caption.setAttribute('aria-live', 'polite');
  const controls = document.createElement('div'); controls.className = 'toolbar';
  const play = document.createElement('button'); play.textContent = text('Play / Pause', 'Lecture / Pause', 'شغّل / حبّس');
  const label = document.createElement('label'); label.textContent = text('Cycle / input', 'Cycle / commande', 'الدورة / التحكم');
  const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = '720'; slider.value = '0'; slider.setAttribute('aria-label', label.textContent); label.append(slider);
  controls.append(play, label); host.append(canvas, caption, controls);
  const ctx = canvas.getContext('2d')!;
  let phase = 0, playing = false, frame = 0, last = 0, visible = true, previousCaption = '';
  const line = (x: number, y: number, endX: number, endY: number, color = '#8fd6ff', width = 5) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke(); };
  const circle = (x: number, y: number, radius: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, 2 * Math.PI); ctx.fill(); };
  const title = (value: string) => { ctx.fillStyle = '#eef5ff'; ctx.font = '17px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(value, 320, 28); };
  const setCaption = (value: string) => { if (value !== previousCaption) { caption.textContent = value; previousCaption = value; } };
  const draw = () => {
    ctx.clearRect(0, 0, 640, 300); ctx.fillStyle = '#101e30'; ctx.fillRect(0, 0, 640, 300);
    const angle = phase / 180 * Math.PI;
    if (kind === 'engine') {
      const stroke = Math.min(3, Math.floor(phase / 180));
      const names = [text('Intake: inlet valve open', 'Admission : soupape ouverte', 'الدخول: صمام الدخول محلول'), text('Compression: valves closed', 'Compression : soupapes fermées', 'الضغط: الصمامات مسدودين'), text('Power: expansion, valves closed', 'Détente : soupapes fermées', 'القوة: التمدد والصمامات مسدودين'), text('Exhaust: exhaust valve open', 'Échappement : soupape ouverte', 'العادم: صمام الخروج محلول')];
      title(text('Four-stroke principle · one cylinder', 'Principe quatre temps · un cylindre', 'مبدأ أربع أشواط · سلندر واحد'));
      const crank = { x: 320 + Math.sin(angle) * 38, y: 233 - Math.cos(angle) * 38 };
      const pistonY = crank.y - Math.sqrt(110 * 110 - (crank.x - 320) ** 2);
      ctx.strokeStyle = '#8595a8'; ctx.lineWidth = 5; ctx.strokeRect(270, 65, 100, 128);
      ctx.fillStyle = stroke === 2 ? '#ee895244' : '#5aabcf33'; ctx.fillRect(275, 70, 90, Math.max(1, pistonY - 70));
      circle(320, 233, 43, '#30485c'); line(320, 233, crank.x, crank.y, '#b6c7da', 8); line(crank.x, crank.y, 320, pistonY, '#e0e7f2', 8);
      ctx.fillStyle = '#81cfff'; ctx.fillRect(275, pistonY - 8, 90, 16);
      line(282, stroke === 0 ? 78 : 65, 305, stroke === 0 ? 78 : 65, '#7df0ca'); line(335, stroke === 3 ? 78 : 65, 358, stroke === 3 ? 78 : 65, '#ff956c');
      setCaption(names[stroke]! + ' · ' + text('720° per cycle. Simplified valve timing, no BMW firing order. Turbo: exhaust turbine → shaft → intake compressor.', '720° par cycle. Calage simplifié, sans ordre d’allumage BMW. Turbo : turbine → arbre → compresseur.', '720 درجة فالدورة. توقيت مبسّط، ماشي ترتيب إشعال BMW. التوربو: توربين العادم ← محور ← ضاغط الدخول.'));
    } else if (kind === 'suspension') {
      const wheelY = 222 - Math.sin(angle) * 35;
      title(text('Spring stores energy · damper dissipates it', 'Ressort : stockage · amortisseur : dissipation', 'الريسور كيخزن الطاقة والأمورطيسور كيبدّدها'));
      line(190, 65, 450, 65, '#d8e4f1', 12); circle(320, wheelY, 35, '#667b90');
      const points = 12, height = wheelY - 110;
      for (let i = 0; i < points; i++) line(270 + (i % 2 ? 18 : -18), 75 + i * height / points, 270 + (i % 2 ? -18 : 18), 75 + (i + 1) * height / points);
      line(360, 75, 360, wheelY - 20, '#faaf77', 10); line(240, wheelY - 35, 380, wheelY - 35);
      setCaption(text('Move the input to compress and release the spring. Prescribed motion; this is not a calibrated damping model.', 'Déplacez la commande pour comprimer le ressort. Mouvement imposé, pas un modèle d’amortissement calibré.', 'حرّك التحكم باش تضغط الريسور. الحركة مفروضة، ماشي نموذج تخميد مضبوط.'));
    } else if (kind === 'brakes') {
      title(text('Disc & caliper · friction becomes heat', 'Disque et étrier · friction et chaleur', 'الديسك والكاليپي · الاحتكاك كيعطي سخونية'));
      const pressure = phase / 720; circle(320, 158, 92, '#53677d'); circle(320, 158, 25, '#182536');
      for (let i = 0; i < 8; i++) { const a = angle + i * Math.PI / 4; line(320 + Math.cos(a) * 38, 158 + Math.sin(a) * 38, 320 + Math.cos(a) * 78, 158 + Math.sin(a) * 78, '#a3b8cb', 3); }
      ctx.fillStyle = `rgb(230,${Math.round(160 - pressure * 80)},75)`; ctx.fillRect(398 - pressure * 18, 120, 28, 75);
      setCaption(text('Input represents clamp force. Greater clamp force increases frictional torque; this animation does not predict stopping distance.', 'La commande représente le serrage. Plus de serrage augmente le couple de friction ; aucune distance d’arrêt n’est calculée.', 'التحكم كيمثّل قوة الشد. الشد الأكثر كيزيد عزم الاحتكاك؛ الرسم ما كيحسبش مسافة الوقوف.'));
    } else {
      const gear = Math.min(8, 1 + Math.floor(phase / 90));
      title(kind === 'transmission' ? text('Illustrative ratio · input → output', 'Rapport illustratif · entrée → sortie', 'نسبة توضيحية · الدخول ← الخروج') : text('Engine → gearbox → axles → wheels', 'Moteur → boîte → essieux → roues', 'موطور ← سرعات ← محاور ← رويدات'));
      if (kind === 'transmission') {
        const ratio = 4 / gear;
        circle(220, 150, 65, '#314f6c'); circle(410, 150, 65, '#3a6372'); line(285, 150, 345, 150);
        line(220, 150, 220 + Math.sin(angle) * 55, 150 - Math.cos(angle) * 55, '#e3edfa'); line(410, 150, 410 + Math.sin(angle / ratio) * 55, 150 - Math.cos(angle / ratio) * 55, '#90edc7');
        setCaption(text('Illustrative gear ', 'Rapport illustratif ', 'سرعة توضيحية ') + gear + text(' · ratios are not BMW specifications. Ideal output torque = input torque × ratio.', ' · ce ne sont pas les rapports BMW. Couple idéal de sortie = couple d’entrée × rapport.', ' · هادو ماشي نسب BMW. عزم الخروج المثالي = عزم الدخول × النسبة.'));
      } else {
        line(320, 65, 320, 235); line(210, 105, 430, 105); line(210, 235, 430, 235);
        for (const x of [210, 430]) for (const y of [105, 235]) { circle(x, y, 26, '#4e6b84'); const a = angle * (x === 210 ? 0.8 : 1.2); line(x, y, x + Math.sin(a) * 20, y + Math.cos(a) * 20, '#aff5d6'); }
        circle(320, 65 + (phase % 180) / 180 * 170, 9, '#f6b66c');
        setCaption(text('Inner and outer wheels turn at different speeds in a bend. Animation uses arbitrary speeds, not the M xDrive control algorithm.', 'En virage, les roues intérieure et extérieure tournent à des vitesses différentes. Vitesses arbitraires, pas l’algorithme M xDrive.', 'فالمنعرج الرويدة الداخلية والخارجية كيدورو بسرعات مختلفة. السرعات توضيحية، ماشي خوارزمية M xDrive.'));
      }
    }
  };
  const tick = (now: number) => { frame = 0; if (!playing || !visible || document.hidden) return; phase = (phase + Math.min(now - last, 50) * 0.07) % 720; last = now; slider.value = String(Math.round(phase)); draw(); frame = requestAnimationFrame(tick); };
  const resume = () => { cancelAnimationFrame(frame); if (playing && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); } };
  play.onclick = () => { playing = !playing; play.setAttribute('aria-pressed', String(playing)); resume(); };
  slider.oninput = () => { playing = false; play.setAttribute('aria-pressed', 'false'); cancelAnimationFrame(frame); phase = Number(slider.value); draw(); };
  const observer = new IntersectionObserver(entries => { visible = !!entries[0]?.isIntersecting; resume(); }); observer.observe(canvas);
  document.addEventListener('visibilitychange', resume); draw();
  return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', resume); host.replaceChildren(); };
}
