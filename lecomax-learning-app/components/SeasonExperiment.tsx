import { useState } from 'react';
import { useSchool } from '../store/School';
import { daylightHours } from '../features/world/science';
import { Button, Card, Field, Label, Row } from './UI';

export function SeasonExperiment() {
  const { state, update, t } = useSchool();
  const [latitude, setLatitude] = useState(45);
  const [tilt, setTilt] = useState(23.4);
  const [orbit, setOrbit] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [revealed, setRevealed] = useState(false);
  const hours = daylightHours(latitude, tilt, orbit);
  const change = (fn: () => void) => { fn(); setRevealed(false); setPrediction(''); };
  return <Card>
    <Label bold>{t('Expérience sur les saisons', 'Seasons experiment', 'تجربة الفصول')}</Label>
    <Label>{t('Modèle géométrique idéal : pas une prévision météo. Position 0 = orientation estivale du nord ; 180 = opposée.', 'Idealized geometric model, not a weather forecast. Position 0 = northern summer orientation; 180 = opposite.', 'نموذج هندسي مبسط وليس توقعاً للطقس. الموضع 0 باتجاه الصيف الشمالي و180 هو المقابل.')}</Label>
    <Label>Latitude: {latitude}° · Tilt: {tilt}° · Orbit: {orbit}°</Label>
    <Row>{[45, -45].map(n => <Button key={n} quiet selected={latitude === n} title={`Latitude ${n}°`} onPress={() => change(() => setLatitude(n))} />)}</Row>
    <Row>{[23.4, 0].map(n => <Button key={n} quiet selected={tilt === n} title={`Tilt ${n}°`} onPress={() => change(() => setTilt(n))} />)}</Row>
    <Row>{[0, 180].map(n => <Button key={n} quiet selected={orbit === n} title={`Orbit ${n}°`} onPress={() => change(() => setOrbit(n))} />)}</Row>
    <Field multiline value={prediction} editable={!revealed} placeholder={t('Prédiction et raison avant de révéler', 'Prediction and reason before revealing', 'التوقع وسببه قبل الكشف')} onChangeText={setPrediction} />
    <Button disabled={!prediction.trim() || revealed} title={t('Révéler et enregistrer cet essai', 'Reveal and record this trial', 'اكشف النتيجة وسجل المحاولة')} onPress={() => {
      setRevealed(true);
      const line = `Model trial: latitude=${latitude}, tilt=${tilt}, orbit=${orbit}. Prediction: ${prediction.trim()}. Calculated daylight=${hours.toFixed(2)} h. This is a model output, not an observed sunrise.`;
      update(p => ({ ...p, drafts: { ...p.drafts, 'science-seasons-capstone': [p.drafts['science-seasons-capstone'], line].filter(Boolean).join('\n') } }));
    }} />
    {revealed && <Label accessibilityLiveRegion="polite">{t('Durée du jour calculée : ', 'Calculated daylight: ', 'مدة النهار المحسوبة: ')}{hours.toFixed(2)} h</Label>}
    <Label muted>{t('Les essais sont ajoutés au brouillon de la leçon. Comparez-les et rédigez votre conclusion ; aucun essai ne valide automatiquement le cours.', 'Trials append to your lesson draft. Compare them and write a conclusion; running a trial does not automatically complete the course.', 'تضاف المحاولات إلى مسودة الدرس. قارنها واكتب استنتاجك؛ تشغيل التجربة لا يكمل المقرر تلقائياً.')}</Label>
    {!!state.drafts['science-seasons-capstone'] && <Label>{state.drafts['science-seasons-capstone']}</Label>}
  </Card>;
}
