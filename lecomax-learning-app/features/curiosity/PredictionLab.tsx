import { useState } from 'react';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Button, Card, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';

export function PredictionLab() {
  const { colors } = useSchool();
  const [weight, setWeight] = useState(1);
  const [prediction, setPrediction] = useState<string>();
  const [tested, setTested] = useState(false);
  const output = weight * 2;
  return (
    <Card>
      <Label bold size={23}>
        Experiment · one adjustable weight
      </Label>
      <Label>
        A tiny mathematical model predicts y = weight × input. Training example: input 2, target 6.
        Predict the effect of increasing the weight by 1.
      </Label>
      <Svg
        width="100%"
        height={155}
        viewBox="0 0 500 155"
        accessibilityLabel="Input 2 passes through an adjustable weight to produce the prediction"
      >
        <Line x1={80} y1={65} x2={420} y2={65} stroke={colors.accent} strokeWidth={3} />
        {[
          { x: 80, label: 'Input', value: '2' },
          { x: 250, label: 'Weight', value: String(weight) },
          { x: 420, label: 'Output', value: String(output) },
        ].map((n) => (
          <Circle
            key={n.x}
            cx={n.x}
            cy={65}
            r={42}
            fill={colors.card}
            stroke={colors.accent}
            strokeWidth={2}
          />
        ))}
        {[
          { x: 80, label: 'Input', value: '2' },
          { x: 250, label: 'Weight', value: String(weight) },
          { x: 420, label: 'Output', value: String(output) },
        ].map((n) => (
          <SvgText key={n.x} x={n.x} y={72} textAnchor="middle" fill={colors.text} fontSize={23}>
            {n.value}
          </SvgText>
        ))}
        <SvgText x={80} y={132} textAnchor="middle" fill={colors.text}>
          Input
        </SvgText>
        <SvgText x={250} y={132} textAnchor="middle" fill={colors.text}>
          Weight
        </SvgText>
        <SvgText x={420} y={132} textAnchor="middle" fill={colors.text}>
          Prediction
        </SvgText>
      </Svg>
      <Label>
        Input: 2 · Weight: {weight} · Prediction: {output} · Squared error: {(6 - output) ** 2}
      </Label>
      <Row>
        {['Output rises by 1', 'Output rises by 2', 'Output stays the same'].map((x) => (
          <Button
            key={x}
            quiet
            selected={prediction === x}
            title={x}
            onPress={() => {
              setPrediction(x);
              setTested(false);
            }}
          />
        ))}
      </Row>
      <Row>
        <Button
          title="Test: increase weight"
          disabled={!prediction || weight >= 5}
          onPress={() => {
            setWeight(weight + 1);
            setTested(true);
          }}
        />
        <Button
          quiet
          title="Decrease weight"
          disabled={weight <= 0}
          onPress={() => {
            setWeight(weight - 1);
            setTested(false);
          }}
        />
        <Button
          quiet
          title="Reset experiment"
          onPress={() => {
            setWeight(1);
            setPrediction(undefined);
            setTested(false);
          }}
        />
      </Row>
      {tested && (
        <Label accessibilityLiveRegion="polite">
          {prediction === 'Output rises by 2' ? 'Correct. ' : 'Try the multiplication: '}Each weight
          increase of 1 adds 2 to the output. The target is reached at weight 3; increasing beyond
          that raises the error again.
        </Label>
      )}
      <Label muted>
        This hand-controlled linear model illustrates a parameter and loss. It is not a trained
        neural network. Real training updates many parameters and must test unseen examples.
      </Label>
    </Card>
  );
}
