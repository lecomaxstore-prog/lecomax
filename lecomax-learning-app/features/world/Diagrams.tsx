import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText, Ellipse, G } from 'react-native-svg';
import { Button, Card, Label, Row } from '../../components/UI';
export function Diagram({ kind }: { kind: 'layers' | 'seasons' | 'plates' }) {
  const [index, setIndex] = useState(0);
  const names =
    kind === 'layers'
      ? ['Crust', 'Mantle', 'Outer core', 'Inner core']
      : kind === 'seasons'
        ? ['June solstice', 'December solstice', 'Equinox']
        : ['Divergent', 'Convergent', 'Transform'];
  const notes =
    kind === 'layers'
      ? [
          'A thin rocky outer skin. Together with rigid upper mantle it forms the lithosphere.',
          'Mostly solid rock that deforms slowly over geological time.',
          'Liquid metal; its motion helps generate Earth’s magnetic field.',
          'Solid metal under immense pressure.',
        ]
      : kind === 'seasons'
        ? [
            'North tilts toward the Sun: northern summer and southern winter.',
            'South tilts toward the Sun: southern summer and northern winter.',
            'Neither hemisphere tilts toward the Sun; day and night are approximately equal.',
          ]
        : [
            'Plates move apart. Magma can rise and form new crust.',
            'Plates move toward each other. One may subduct, or continents may collide and thicken.',
            'Plates slide past one another. Locked sections can accumulate stress and suddenly slip.',
          ];
  return (
    <Card>
      <Label bold>Interactive investigation</Label>
      <Row>
        {names.map((n, i) => (
          <Button key={n} title={n} selected={index === i} quiet onPress={() => setIndex(i)} />
        ))}
      </Row>
      <View accessible accessibilityLabel={notes[index]}>
        <Svg width="100%" height={230} viewBox="0 0 500 230">
          {kind === 'layers' ? (
            <G>
              {[105, 95, 56, 29].map((r, i) => (
                <Circle
                  key={r}
                  cx={250}
                  cy={115}
                  r={r}
                  fill={['#4b977b', '#dd854b', '#f6bc64', '#fff1ab'][i]}
                  stroke={index === i ? '#325fba' : '#302c37'}
                  strokeWidth={index === i ? 5 : 1}
                />
              ))}
              <SvgText x={15} y={25} fill="#77899b" fontSize={13}>
                Schematic cross-section · not to scale
              </SvgText>
            </G>
          ) : kind === 'seasons' ? (
            <G>
              <Circle cx={250} cy={110} r={35} fill="#f9c75f" />
              <SvgText x={238} y={115} fill="#302c37">
                Sun
              </SvgText>
              <Ellipse
                cx={250}
                cy={110}
                rx={180}
                ry={75}
                stroke="#77899b"
                strokeDasharray="5 5"
                fill="none"
              />
              <G
                transform={`translate(${index === 0 ? 420 : index === 1 ? 80 : 250},${index === 2 ? 35 : 110})`}
              >
                <Circle r={25} fill="#3895bd" />
                <Line x1={-15} y1={-36} x2={15} y2={36} stroke="#9dc5d9" strokeWidth={3} />
                <SvgText x={-24} y={-38} fill="#77899b">
                  N
                </SvgText>
              </G>
              <SvgText x={15} y={215} fill="#77899b" fontSize={12}>
                Fixed tilt direction · sizes and distances simplified
              </SvgText>
            </G>
          ) : (
            <G>
              <Rect x={20} y={90} width={205} height={45} fill="#64aa96" />
              <Rect x={275} y={90} width={205} height={45} fill="#d69a66" />
              <SvgText x={100} y={75} fill="#77899b" fontSize={35}>
                {index === 0 ? '←' : index === 1 ? '→' : '↑'}
              </SvgText>
              <SvgText x={355} y={75} fill="#77899b" fontSize={35}>
                {index === 0 ? '→' : index === 1 ? '←' : '↓'}
              </SvgText>
              <SvgText x={35} y={185} fill="#77899b" fontSize={14}>
                {index === 2
                  ? 'View from above · sliding boundary'
                  : 'Simplified plate motion · not to scale or speed'}
              </SvgText>
            </G>
          )}
        </Svg>
      </View>
      <Label>{notes[index]}</Label>
      <Label muted>
        Predict what changes before selecting another state. Explain the result in your own words,
        then test it in the questions.
      </Label>
    </Card>
  );
}
export function PlanetModel({
  color,
  size = 140,
  rings = false,
}: {
  color: string;
  size?: number;
  rings?: boolean;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      accessibilityLabel="Stylized planetary illustration, not a photograph"
    >
      <Circle cx={90} cy={90} r={62} fill={color} />
      {[60, 85, 110].map((y) => (
        <Ellipse
          key={y}
          cx={90}
          cy={y}
          rx={Math.sqrt(62 ** 2 - (y - 90) ** 2)}
          ry={5}
          fill="#ffffff"
          opacity={0.14}
        />
      ))}
      <Ellipse cx={115} cy={90} rx={37} ry={59} fill="#08152b" opacity={0.23} />
      {rings && (
        <Ellipse
          cx={90}
          cy={90}
          rx={87}
          ry={20}
          stroke="#d4bc8b"
          strokeWidth={9}
          fill="none"
          rotation={-20}
          origin="90,90"
        />
      )}
    </Svg>
  );
}

export function NatureIllustration({ id }: { id: string }) {
  const marine = ['green-turtle', 'blue-whale', 'deep-ocean'].includes(id);
  return (
    <Svg
      width="100%"
      height={180}
      viewBox="0 0 460 180"
      accessibilityLabel={
        marine
          ? 'Stylized marine habitat illustration'
          : 'Stylized forest and pollinator habitat illustration'
      }
    >
      <Rect width={460} height={180} rx={18} fill={marine ? '#10344d' : '#153e36'} />
      {marine ? (
        <G>
          {[30, 65, 105].map((y) => (
            <Path
              key={y}
              d={`M0 ${y} Q60 ${y - 15} 120 ${y} T240 ${y} T360 ${y} T480 ${y}`}
              stroke="#518a9b"
              fill="none"
              opacity={0.4}
            />
          ))}
          {id === 'green-turtle' ? (
            <G>
              <Ellipse cx={220} cy={90} rx={65} ry={42} fill="#8aa777" />
              <Ellipse cx={296} cy={88} rx={21} ry={15} fill="#a8bd86" />
              <Path
                d="M185 60 Q150 15 140 35 L175 85 M185 115 Q145 155 145 135 L175 95 M255 60 Q290 15 300 35 L265 85 M255 115 Q295 155 295 135 L265 95"
                fill="#759c78"
              />
              <Path
                d="M190 65 L220 50 L250 65 L250 105 L220 130 L190 105 Z M190 65 L250 105 M250 65 L190 105"
                fill="none"
                stroke="#3d6c5e"
                strokeWidth={3}
              />
              <Circle cx={302} cy={83} r={3} fill="#173b3b" />
            </G>
          ) : (
            <G>
              <Path
                d="M80 100 Q90 45 205 65 Q285 65 320 105 L350 80 L365 65 L365 110 L330 125 Q230 160 135 135 Q90 130 80 100Z"
                fill="#8ab8c7"
              />
              <Path d="M165 112 Q195 160 240 150 L215 110" fill="#5a96ab" />
              <Circle cx={105} cy={98} r={4} fill="#173c50" />
            </G>
          )}
        </G>
      ) : (
        <G>
          <Circle cx={380} cy={42} r={22} fill="#f4cf75" />
          {[60, 120, 325].map((x, i) => (
            <G key={x}>
              <Rect x={x - 5} y={65 + i * 8} width={10} height={85} fill="#a18a65" />
              <Path
                d={`M${x} 25 L${x - 40} 105 L${x + 40} 105 Z`}
                fill={i === 1 ? '#68a47b' : '#397a63'}
              />
            </G>
          ))}
          <Line x1={225} y1={160} x2={225} y2={105} stroke="#99bd78" strokeWidth={5} />
          {[0, 72, 144, 216, 288].map((a) => (
            <Ellipse
              key={a}
              cx={225}
              cy={94}
              rx={9}
              ry={18}
              fill="#eab0a0"
              rotation={a}
              origin="225,110"
            />
          ))}
          <Circle cx={225} cy={110} r={10} fill="#eec968" />
          <Ellipse cx={265} cy={60} rx={19} ry={10} fill="#f1d78d" />
          <Ellipse cx={265} cy={48} rx={12} ry={10} fill="#b7dcce" />
          <Line x1={264} y1={51} x2={264} y2={70} stroke="#604e37" strokeWidth={5} />
          <Path
            d="M10 165 Q150 140 260 163 T460 155"
            stroke="#91b27d"
            strokeWidth={3}
            fill="none"
          />
        </G>
      )}
      <SvgText x={14} y={171} fill="#d3e7e3" fontSize={10}>
        L’ECOMAX illustration · simplified, not anatomical or to scale
      </SvgText>
    </Svg>
  );
}
