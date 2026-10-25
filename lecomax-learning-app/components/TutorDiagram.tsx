import React, { useState } from 'react';
import Svg, { Line, Polyline, Circle } from 'react-native-svg';
import { Button, Card, Label, Row } from './UI';
import { useSchool } from '../store/School';
import type { TutorReply } from '../utils/tutor-contract';
export function TutorDiagram({ diagram }: { diagram: NonNullable<TutorReply['diagram']> }) {
  const { t } = useSchool();
  const [step, setStep] = useState(0);
  const [slope, setSlope] = useState(diagram.slope);
  const [width, setWidth] = useState(3);
  const sequence = diagram.kind === 'process' || diagram.kind === 'timeline';
  return (
    <Card>
      <Label bold>{diagram.title}</Label>
      {sequence ? (
        <>
          <Label>
            {step + 1} / {diagram.steps.length} · {diagram.steps[step]}
          </Label>
          <Row>
            <Button
              quiet
              disabled={step === 0}
              title={t('Précédent', 'Previous', 'السابق')}
              onPress={() => setStep((s) => s - 1)}
            />
            <Button
              quiet
              disabled={step >= diagram.steps.length - 1}
              title={t('Suivant', 'Next', 'التالي')}
              onPress={() => setStep((s) => s + 1)}
            />
          </Row>
        </>
      ) : (
        <>
          <Svg
            width="100%"
            height={220}
            viewBox="0 0 240 220"
            accessibilityLabel={
              diagram.kind === 'function'
                ? `y = ${slope}x + ${diagram.intercept}`
                : `Right triangle: a=${width}, b=4`
            }
          >
            <Line x1={20} y1={110} x2={220} y2={110} stroke="#7B8A82" />
            <Line x1={120} y1={10} x2={120} y2={210} stroke="#7B8A82" />
            {diagram.kind === 'function' ? (
              <Polyline
                points={Array.from({ length: 101 }, (_, i) => {
                  const x = (i - 50) / 10;
                  return `${120 + x * 20},${110 - (slope * x + diagram.intercept) * 20}`;
                }).join(' ')}
                stroke="#2EAF80"
                strokeWidth={3}
                fill="none"
              />
            ) : (
              <Polyline
                points={`40,180 ${40 + width * 25},180 40,80 40,180`}
                stroke="#2EAF80"
                strokeWidth={3}
                fill="none"
              />
            )}
            <Circle cx={120} cy={110} r={3} fill="#7B8A82" />
          </Svg>
          <Label>
            {diagram.kind === 'function'
              ? `y = ${slope}x + (${diagram.intercept}) · x ∈ [−5, 5]`
              : `a = ${width}, b = 4, c = √(a² + b²) = ${Math.hypot(width, 4).toFixed(2)}`}
          </Label>
          <Row>
            <Button
              quiet
              title="−"
              disabled={diagram.kind === 'function' ? slope <= -5 : width <= 1}
              onPress={() =>
                diagram.kind === 'function' ? setSlope((v) => v - 1) : setWidth((v) => v - 1)
              }
            />
            <Button
              quiet
              title="+"
              disabled={diagram.kind === 'function' ? slope >= 5 : width >= 6}
              onPress={() =>
                diagram.kind === 'function' ? setSlope((v) => v + 1) : setWidth((v) => v + 1)
              }
            />
            <Label>
              {diagram.kind === 'function'
                ? t('Modifier la pente', 'Change slope', 'غيّر الميل')
                : t('Modifier le côté a', 'Change side a', 'غيّر الضلع a')}
            </Label>
          </Row>
        </>
      )}
    </Card>
  );
}
