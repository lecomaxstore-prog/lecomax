import type { LabKind } from './journeys';
export const labSpec: Record<
  LabKind,
  { label: string; min: number; max: number; initial: number; increment: number; unit: string }
> = {
  lever: { label: 'Effort arm', min: 1, max: 5, initial: 1, increment: 1, unit: ' m' },
  lift: { label: 'Air speed', min: 10, max: 50, initial: 10, increment: 10, unit: ' m/s' },
  solution: { label: 'Solution volume', min: 1, max: 5, initial: 1, increment: 1, unit: ' L' },
  population: { label: 'Population size', min: 10, max: 100, initial: 10, increment: 10, unit: '' },
  strata: { label: 'Layer from top', min: 1, max: 4, initial: 1, increment: 1, unit: '' },
  echo: { label: 'Wall distance', min: 10, max: 100, initial: 10, increment: 10, unit: ' m' },
  rotation: { label: 'Elapsed solar hours', min: 0, max: 24, initial: 0, increment: 3, unit: ' h' },
  gravity: { label: 'Mass', min: 10, max: 100, initial: 10, increment: 10, unit: ' kg' },
  circuit: { label: 'Resistance', min: 1, max: 12, initial: 2, increment: 1, unit: ' ohm' },
  heart: { label: 'Heart rate', min: 40, max: 140, initial: 60, increment: 10, unit: ' beats/min' },
  engine: { label: 'Crank angle', min: 0, max: 720, initial: 0, increment: 90, unit: ' degrees' },
  memory: { label: 'Toy tasks', min: 1, max: 12, initial: 4, increment: 1, unit: '' },
  threshold: { label: 'Decision threshold', min: 0, max: 10, initial: 5, increment: 1, unit: '' },
  neuron: { label: 'Weight', min: -3, max: 3, initial: 1, increment: 1, unit: '' },
  data: {
    label: 'Class A in 100 examples',
    min: 10,
    max: 90,
    initial: 50,
    increment: 10,
    unit: '%',
  },
  parallel: { label: 'Parallel workers', min: 1, max: 8, initial: 1, increment: 1, unit: '' },
  training: { label: 'Optimizer updates', min: 0, max: 8, initial: 0, increment: 1, unit: '' },
  attention: { label: 'Second token score', min: -3, max: 3, initial: 0, increment: 1, unit: '' },
  generation: { label: 'Temperature', min: 0.5, max: 2, initial: 1, increment: 0.5, unit: '' },
  evaluation: { label: 'Group A share', min: 10, max: 90, initial: 50, increment: 10, unit: '%' },
};
export function softmax(scores: number[], temperature = 1) {
  const max = Math.max(...scores);
  const e = scores.map((s) => Math.exp((s - max) / temperature));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / sum);
}
export function labResult(
  kind: LabKind,
  v: number,
): { nodes: { name: string; value: number }[]; explanation: string; limitation: string } {
  switch (kind) {
    case 'lever':
      return {
        nodes: [
          { name: 'Load N', value: 100 },
          { name: 'Effort arm m', value: v },
          { name: 'Effort N', value: 100 / v },
        ],
        explanation: `Balance: effort × ${v} m = 100 N × 1 m. Required effort = ${(100 / v).toFixed(2)} N.`,
        limitation:
          'Ideal rigid, massless lever; perpendicular forces, no friction. Lower force requires greater movement, not free energy.',
      };
    case 'lift':
      return {
        nodes: [
          { name: 'Air speed m/s', value: v },
          { name: 'Dynamic pressure Pa', value: 0.5 * v * v },
          { name: 'Lift N', value: v * v },
        ],
        explanation: `L = 0.5 × density 1 kg/m³ × ${v}² × area 2 m² × coefficient 1 = ${v * v} N.`,
        limitation:
          'Illustrative fixed density, area and lift coefficient. No stall, drag or flight dynamics; this cannot predict safe flight.',
      };
    case 'solution':
      return {
        nodes: [
          { name: 'Solute mol', value: 2 },
          { name: 'Solution L', value: v },
          { name: 'Molarity mol/L', value: 2 / v },
        ],
        explanation: `Concentration = 2 mol / ${v} L = ${(2 / v).toFixed(2)} mol/L.`,
        limitation:
          'Dissolved solute amount stays fixed; volume is final solution volume. No reaction, saturation or volume mixing is simulated.',
      };
    case 'population':
      return {
        nodes: [
          { name: 'Population N', value: v },
          { name: 'Capacity K', value: 100 },
          { name: 'Growth per time unit', value: 0.2 * v * (1 - v / 100) },
        ],
        explanation: `Instantaneous growth = 0.2 × ${v} × (1 − ${v}/100) = ${(0.2 * v * (1 - v / 100)).toFixed(2)}.`,
        limitation:
          'Hypothetical continuous logistic model with fixed capacity and growth rate. Fractional rates are not fractional animals; no species forecast.',
      };
    case 'strata':
      return {
        nodes: [
          { name: 'Selected layer', value: v },
          { name: 'Younger layers above', value: v - 1 },
          { name: 'Older layers below', value: 4 - v },
        ],
        explanation: `Layer ${v} of four undisturbed deposits: ${v - 1} younger above and ${4 - v} older below.`,
        limitation:
          'Invented deposit sequence, not an excavated site. Intrusions and reworked objects can disrupt inference; depth does not give a calendar date.',
      };
    case 'echo':
      return {
        nodes: [
          { name: 'Wall distance m', value: v },
          { name: 'Round trip m', value: 2 * v },
          { name: 'Echo delay s', value: (2 * v) / 343 },
        ],
        explanation: `Sound travels out and back: time = ${2 * v} m / 343 m/s = ${((2 * v) / 343).toFixed(3)} s.`,
        limitation:
          'Stationary wall and listener, still air near 20°C, constant 343 m/s. No absorption, wind or multiple reflections.',
      };
    case 'rotation':
      return {
        nodes: [
          { name: 'Elapsed hours', value: v },
          { name: 'Angle degrees', value: v * 15 },
          { name: 'Sun-facing cosine', value: Math.cos((v * Math.PI) / 12) },
        ],
        explanation: `${v} solar hours correspond to ${v * 15} degrees in this 24-hour equatorial model.`,
        limitation:
          'Fixed Sun direction; no tilt, seasons, orbital motion or atmospheric effects. Boundary positions are simplified.',
      };
    case 'gravity':
      return {
        nodes: [
          { name: 'Earth weight N', value: v * 9.8 },
          { name: 'Mars weight N', value: v * 3.7 },
          { name: 'Jupiter weight N', value: v * 23.1 },
        ],
        explanation: `The same ${v} kg mass has different weights: W = m × g.`,
        limitation:
          'Rounded reference gravitational accelerations. Jupiter has no solid surface; this is not a landing simulation.',
      };
    case 'circuit':
      return {
        nodes: [
          { name: 'Voltage V', value: 6 },
          { name: 'Current A', value: 6 / v },
          { name: 'Power W', value: 36 / v },
        ],
        explanation: `I = 6 / ${v} = ${(6 / v).toFixed(3)} A; P = 6 × I = ${(36 / v).toFixed(3)} W.`,
        limitation:
          'Ideal 6 V source, closed loop and ohmic resistor. Wire resistance, heating effects and component limits are omitted.',
      };
    case 'heart':
      return {
        nodes: [
          { name: 'Rate beats/min', value: v },
          { name: 'Interval seconds', value: 60 / v },
          { name: 'Output L/min', value: (v * 70) / 1000 },
        ],
        explanation: `With illustrative fixed 70 mL/beat, output = ${v} × 70 / 1000 = ${(v * 0.07).toFixed(2)} L/min.`,
        limitation:
          'Arithmetic teaching model, not physiology prediction or medical advice. Real stroke volume changes with conditions.',
      };
    case 'engine': {
      const angle = v % 720;
      return {
        nodes: [
          { name: 'Crank degrees', value: v },
          { name: 'Stroke number', value: Math.floor(angle / 180) + 1 },
          { name: 'Piston travel %', value: (1 - Math.cos((v * Math.PI) / 180)) * 50 },
        ],
        explanation: `Idealized stroke: ${['Intake', 'Compression', 'Power', 'Exhaust'][Math.floor(angle / 180)]}. One cycle = 720 degrees.`,
        limitation:
          'Sinusoidal piston travel approximation, not engineering geometry. Real valve, ignition and connecting-rod timing are omitted.',
      };
    }
    case 'memory':
      return {
        nodes: [
          { name: 'Demand GB', value: v },
          { name: 'Capacity GB', value: 8 },
          { name: 'Shortfall GB', value: Math.max(0, v - 8) },
        ],
        explanation: `${v} tasks × 1 GB each against 8 GB capacity: ${Math.max(0, v - 8)} GB shortfall.`,
        limitation:
          'Invented equal-size tasks. No OS, latency, memory compression or swap behavior is simulated.',
      };
    case 'threshold':
      return {
        nodes: [
          { name: 'Score', value: 6 },
          { name: 'Threshold', value: v },
          { name: 'Spam decision (1=yes)', value: 6 >= v ? 1 : 0 },
        ],
        explanation: `Score 6 ${6 >= v ? '>=' : '<'} threshold ${v}: ${6 >= v ? 'mark as spam' : 'do not mark as spam'}.`,
        limitation:
          'An invented classifier score, not a real spam detector. Moving its threshold does not train a model.',
      };
    case 'neuron':
      return {
        nodes: [
          { name: 'Input', value: 2 },
          { name: 'Weighted sum', value: 2 * v + 1 },
          { name: 'ReLU output', value: Math.max(0, 2 * v + 1) },
        ],
        explanation: `z = 2 × ${v} + 1 = ${2 * v + 1}; output = max(0, z).`,
        limitation:
          'One mathematical neuron with a fixed bias; no biological anatomy or trained network is simulated.',
      };
    case 'data':
      return {
        nodes: [
          { name: 'Class A count', value: v },
          { name: 'Class B count', value: 100 - v },
          { name: 'Majority baseline %', value: Math.max(v, 100 - v) },
        ],
        explanation: `Always guessing the majority gives ${Math.max(v, 100 - v)}% on this invented dataset, while missing every minority case.`,
        limitation:
          'A baseline calculation, not measured model performance. Dataset balance alone does not ensure fairness.',
      };
    case 'parallel':
      return {
        nodes: [
          { name: 'Tasks', value: 16 },
          { name: 'Workers', value: v },
          { name: 'Ideal rounds', value: Math.ceil(16 / v) },
        ],
        explanation: `16 equal independent tasks require ceil(16 / ${v}) = ${Math.ceil(16 / v)} rounds.`,
        limitation:
          'No memory, scheduling or transfer cost. This is not a GPU benchmark or hardware speed prediction.',
      };
    case 'training': {
      let w = 0;
      for (let i = 0; i < v; i++) w -= 0.1 * 4 * (2 * w - 6);
      return {
        nodes: [
          { name: 'Weight', value: w },
          { name: 'Prediction', value: 2 * w },
          { name: 'Squared error', value: (2 * w - 6) ** 2 },
        ],
        explanation: `After ${v} updates: w = ${w.toFixed(5)}, prediction = ${(2 * w).toFixed(5)}. Target is 6.`,
        limitation:
          'Exact gradient descent on one synthetic scalar example. It does not train an LLM or measure generalization.',
      };
    }
    case 'attention': {
      const p = softmax([0, v]);
      return {
        nodes: [
          { name: 'Token A weight', value: p[0]! },
          { name: 'Token B weight', value: p[1]! },
          { name: 'Mixed value', value: p[0]! * 2 + p[1]! * 8 },
        ],
        explanation: `Softmax(0, ${v}) mixes values 2 and 8. Weights sum to 1.`,
        limitation:
          'Two invented scalar scores and values. This omits learned projections, multiple heads and positional information.',
      };
    }
    case 'generation': {
      const p = softmax([2, 1, 0], v);
      return {
        nodes: p.map((value, i) => ({
          name: ['“cat” probability', '“dog” probability', '“bird” probability'][i]!,
          value,
        })),
        explanation: `Softmax([2,1,0] / ${v}). Higher temperature flattens this synthetic distribution.`,
        limitation:
          'Invented next-token scores; not outputs or probabilities from ChatGPT. No live AI request occurs.',
      };
    }
    case 'evaluation':
      return {
        nodes: [
          { name: 'Group A accuracy %', value: 90 },
          { name: 'Group B accuracy %', value: 40 },
          { name: 'Overall accuracy %', value: (v * 90 + (100 - v) * 40) / 100 },
        ],
        explanation: `Overall = ${v}% × 90% + ${100 - v}% × 40%. Neither group accuracy changed.`,
        limitation:
          'Invented evaluation groups; no claim about any real model or demographic group.',
      };
  }
}
