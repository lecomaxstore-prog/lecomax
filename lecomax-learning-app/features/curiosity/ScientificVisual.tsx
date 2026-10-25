import React from 'react';
import Svg, { Circle, Line, Path, Rect, Text as T } from 'react-native-svg';
import { useSchool } from '../../store/School';
import type { LabKind } from './journeys';
export function ScientificVisual({ kind, value }: { kind: LabKind; value: number }) {
  const { colors: c } = useSchool();
  if (
    ![
      'rotation',
      'gravity',
      'circuit',
      'heart',
      'engine',
      'memory',
      'strata',
      'echo',
      'lever',
      'solution',
      'population',
      'lift',
    ].includes(kind)
  )
    return null;
  const text = (x: number, y: number, label: string) => (
    <T x={x} y={y} fill={c.text} fontSize={14} textAnchor="middle">
      {label}
    </T>
  );
  return (
    <Svg
      width="100%"
      height={220}
      viewBox="0 0 540 220"
      accessibilityLabel={`${kind} conceptual diagram; values and assumptions are in the accompanying text`}
    >
      {kind === 'strata' && (
        <>
          {[1, 2, 3, 4].map((layer) => (
            <React.Fragment key={layer}>
              <Rect
                x={60}
                y={20 + (layer - 1) * 42}
                width={420}
                height={38}
                fill={layer === value ? c.accent : c.soft}
                stroke={c.text}
              />
              {text(
                270,
                45 + (layer - 1) * 42,
                `Layer ${layer}${layer === value ? ' • selected' : ''}`,
              )}
            </React.Fragment>
          ))}
          {text(270, 212, 'Top = younger · bottom = older · undisturbed model')}
        </>
      )}
      {kind === 'echo' && (
        <>
          <Circle cx={50} cy={100} r={15} fill={c.accent} />
          <Rect x={100 + value * 3.5} y={40} width={12} height={120} fill={c.text} />
          <Line x1={70} y1={80} x2={100 + value * 3.5} y2={80} stroke={c.accent} strokeWidth={3} />
          <Line
            x1={100 + value * 3.5}
            y1={120}
            x2={70}
            y2={120}
            stroke={c.accent}
            strokeWidth={3}
          />
          {text(270, 195, `Out + back = ${value * 2} metres`)}
        </>
      )}
      {kind === 'lever' && (
        <>
          <Path d="M330 130 L350 165 L310 165 Z" fill={c.accent} />
          <Line x1={330 - value * 50} y1={125} x2={380} y2={125} stroke={c.text} strokeWidth={5} />
          <Rect x={365} y={85} width={30} height={35} fill={c.accent} />
          <Line
            x1={330 - value * 50}
            y1={60}
            x2={330 - value * 50}
            y2={120}
            stroke={c.accent}
            strokeWidth={4}
          />
          {text(270, 205, `${value} m effort arm · 1 m load arm`)}
        </>
      )}
      {['solution', 'population', 'lift'].includes(kind) && (
        <>
          <Rect x={180} y={30} width={180} height={150} fill={c.soft} stroke={c.text} />
          <Rect
            x={180}
            y={
              180 -
              (kind === 'solution'
                ? 1 / value
                : kind === 'population'
                  ? value / 100
                  : (value * value) / 2500) *
                150
            }
            width={180}
            height={
              (kind === 'solution'
                ? 1 / value
                : kind === 'population'
                  ? value / 100
                  : (value * value) / 2500) * 150
            }
            fill={c.accent}
          />
          {text(
            270,
            210,
            kind === 'solution'
              ? 'Concentration relative to 2 mol/L'
              : kind === 'population'
                ? 'Population relative to capacity 100'
                : 'Lift relative to 2500 N',
          )}
        </>
      )}
      {kind === 'rotation' && (
        <>
          <Circle cx={45} cy={100} r={25} fill="#e9b957" />
          {[70, 100, 130].map((y) => (
            <Line key={y} x1={80} y1={y} x2={180} y2={y} stroke="#e9b957" strokeWidth={2} />
          ))}
          <Circle cx={280} cy={100} r={75} fill={c.primary} stroke={c.accent} />
          <Path d="M280 25 A75 75 0 0 0 280 175 Z" fill={c.soft} />
          <Circle
            cx={280 - 70 * Math.cos((value * Math.PI) / 12)}
            cy={100 + 70 * Math.sin((value * Math.PI) / 12)}
            r={7}
            fill="#e9b957"
            stroke={c.text}
          />
          {text(280, 207, 'View along axis · equatorial marker')}
        </>
      )}
      {kind === 'gravity' && (
        <>
          {[9.8, 3.7, 23.1].map((g, i) => (
            <Rect
              key={g}
              x={90 + i * 160}
              y={180 - (value * g) / 16}
              width={55}
              height={(value * g) / 16}
              fill={c.accent}
              rx={5}
            />
          ))}
          {text(117, 205, 'Earth')}
          {text(277, 205, 'Mars')}
          {text(437, 205, 'Jupiter')}
          {text(270, 22, 'Bar height = weight, not planet size')}
        </>
      )}
      {kind === 'circuit' && (
        <>
          <Path
            d="M70 105 V60 H210 M330 60 H470 V175 H70 V125"
            fill="none"
            stroke={c.accent}
            strokeWidth={3}
          />
          <Line x1={45} y1={105} x2={95} y2={105} stroke={c.text} strokeWidth={3} />
          <Line x1={55} y1={125} x2={85} y2={125} stroke={c.text} strokeWidth={3} />
          <Path
            d="M210 60 l10 -12 l20 24 l20 -24 l20 24 l20 -24 l20 24 l10 -12"
            fill="none"
            stroke={c.text}
            strokeWidth={3}
          />
          {text(270, 30, `${value} ohm resistor`)}
          {text(125, 120, '6 V')}
          {text(270, 210, 'Closed loop · ideal DC circuit')}
        </>
      )}
      {kind === 'engine' && (
        <>
          <Path d="M200 30 V170 H340 V30" fill="none" stroke={c.accent} strokeWidth={3} />
          <Rect
            x={205}
            y={45 + (1 - Math.cos((value * Math.PI) / 180)) * 35}
            width={130}
            height={20}
            fill={c.accent}
          />
          <Line
            x1={270}
            y1={65 + (1 - Math.cos((value * Math.PI) / 180)) * 35}
            x2={270 + 15 * Math.sin((value * Math.PI) / 180)}
            y2={180 + 15 * Math.cos((value * Math.PI) / 180)}
            stroke={c.text}
            strokeWidth={4}
          />
          <Circle cx={270} cy={180} r={19} fill="none" stroke={c.accent} />
          {text(110, 90, 'Piston')}
          {text(420, 170, 'Crank')}
          {text(270, 218, 'Conceptual motion · not engineering geometry')}
        </>
      )}
      {kind === 'heart' && (
        <>
          {['Right heart', 'Lungs', 'Left heart', 'Body'].map((name, i) => (
            <React.Fragment key={name}>
              <Rect
                x={15 + i * 133}
                y={65}
                width={112}
                height={65}
                rx={15}
                fill={c.soft}
                stroke={c.accent}
              />
              <T x={71 + i * 133} y={103} textAnchor="middle" fontSize={14} fill={c.text}>
                {name}
              </T>
            </React.Fragment>
          ))}
          {[135, 268, 401].map((x) => (
            <T key={x} x={x} y={103} fill={c.accent}>
              →
            </T>
          ))}
          <Path d="M470 140 V170 H70 V140" fill="none" stroke={c.accent} strokeWidth={2} />
          {text(270, 210, 'Return to right heart · flow, not anatomy')}
        </>
      )}
      {kind === 'memory' && (
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <Rect
              key={i}
              x={36 + (i % 6) * 80}
              y={35 + Math.floor(i / 6) * 80}
              width={60}
              height={55}
              rx={8}
              fill={i < value ? (i < 8 ? c.accent : '#c27836') : c.soft}
              stroke={c.text}
            />
          ))}
          {text(270, 210, '1 GB per tile · orange exceeds 8 GB')}
        </>
      )}
    </Svg>
  );
}
