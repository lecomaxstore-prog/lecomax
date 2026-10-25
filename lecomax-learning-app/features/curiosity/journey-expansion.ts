import type { Journey, JourneyStep, LabKind } from './journeys';
type Topic = {
  id: string;
  title: string;
  related: string[];
  lab: LabKind;
  source: string;
  sourceName: string;
  simple: string;
  deep: string;
  mechanism: string[];
  parts: JourneyStep['parts'];
  steps: {
    id: string;
    title: string;
    mission: string;
    question: string;
    options: string[];
    correct: number;
    feedback: string;
    hint: string;
  }[];
};
const topics: Topic[] = [
  {
    id: 'earth',
    title: 'Earth: turning day into night',
    related: ['tides', 'rocket'],
    lab: 'rotation',
    source: 'https://science.nasa.gov/earth/facts/',
    sourceName: 'NASA: Earth facts',
    simple: 'Earth rotates. A location moves into and out of sunlight, producing day and night.',
    deep: 'This model uses a 24-hour solar day and a point on the equator. It fixes the Sun direction and omits tilt, orbit, atmosphere and seasonal changes. An angle is not a time-zone boundary.',
    mechanism: [
      'Sunlight arrives from one direction',
      'Earth rotates about its axis',
      'A surface point crosses the day/night boundary',
    ],
    parts: [
      { name: 'Axis', detail: 'The imaginary line about which Earth rotates.' },
      { name: 'Surface point', detail: 'The marker follows rotation, not an orbit around Earth.' },
      { name: 'Terminator', detail: 'The boundary between illuminated and unilluminated regions.' },
    ],
    steps: [
      {
        id: 'rotation',
        title: 'Turn the planet',
        mission: 'Advance the clock to 12 hours. Compare the marker with its position at zero.',
        question: 'After half a turn in this model, a point initially facing the Sun is where?',
        options: ['Facing away from the Sun', 'Still at the same orientation', 'Outside Earth'],
        correct: 0,
        feedback:
          'Half a rotation reverses the marker’s orientation relative to the fixed sunlight direction.',
        hint: 'Half of 360 degrees is 180 degrees.',
      },
      {
        id: 'limits',
        title: 'Read the model carefully',
        mission:
          'Compare 6 hours with 18 hours. Both are boundary positions in this equatorial model.',
        question: 'Can this model predict polar daylight in summer?',
        options: [
          'Yes, because it shows a circle',
          'No, it omits Earth’s axial tilt and seasons',
          'Only from the marker color',
        ],
        correct: 1,
        feedback:
          'Polar daylight depends on tilt and orbital position, which are deliberately absent here.',
        hint: 'Check the listed assumptions before making a prediction.',
      },
    ],
  },
  {
    id: 'rocket',
    title: 'Compare gravity across planets',
    related: ['earth', 'flight'],
    lab: 'gravity',
    source: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    sourceName: 'NASA: Planetary fact sheet',
    simple:
      'Mass describes how much matter an object has. Weight is the gravitational force on that mass.',
    deep: 'Weight near a surface is approximately mass × local gravitational acceleration. We use rounded values: Earth 9.8, Mars 3.7 and Jupiter 23.1 m/s². Jupiter’s reference level is not a solid surface to stand on.',
    mechanism: [
      'Choose the same mass',
      'Use each planet’s reference gravity',
      'Calculate force in newtons',
    ],
    parts: [
      {
        name: 'Mass',
        detail: 'Measured in kilograms; it does not change just because the planet changes.',
      },
      {
        name: 'Gravity',
        detail: 'Local gravitational acceleration depends on the planet and reference location.',
      },
      { name: 'Weight', detail: 'A force measured in newtons, not kilograms.' },
    ],
    steps: [
      {
        id: 'weight',
        title: 'Same mass, different weight',
        mission: 'Set the mass to 20 kg and compare the three calculated weights.',
        question:
          'When the same object is moved from Earth to Mars, which quantity remains the same?',
        options: ['Its mass', 'Its weight', 'The planet’s gravity'],
        correct: 0,
        feedback:
          'The object retains its mass; the gravitational force changes with local gravity.',
        hint: 'Separate kilograms from newtons.',
      },
      {
        id: 'comparison',
        title: 'Compare without inventing a surface',
        mission: 'Double the mass from 10 kg to 20 kg and inspect the change in every weight.',
        question: 'In this fixed-gravity model, doubling mass does what to weight?',
        options: ['Halves it', 'Doubles it', 'Leaves it unchanged'],
        correct: 1,
        feedback:
          'W = mg is linear in mass when g is fixed. This does not imply Jupiter has a solid surface.',
        hint: 'Hold g constant in W = mg.',
      },
    ],
  },
  {
    id: 'electricity',
    title: 'Electric circuits: voltage, resistance and current',
    related: ['battery', 'solar', 'phone'],
    lab: 'circuit',
    source: 'https://openstax.org/books/physics/pages/19-1-ohms-law',
    sourceName: 'OpenStax: Ohm’s law',
    simple:
      'A voltage across a resistor drives current through a closed circuit. Larger resistance limits current.',
    deep: 'For an ideal ohmic resistor, I = V/R. Here the source stays at 6 volts and resistance is positive. Resistor power is P = VI. Real components have ratings and temperature dependence.',
    mechanism: [
      'Connect a closed loop',
      'Apply a voltage',
      'Current depends on resistance',
      'Electrical energy becomes heat',
    ],
    parts: [
      { name: 'Voltage source', detail: 'Maintains the idealized 6 V potential difference.' },
      { name: 'Resistor', detail: 'Limits current and dissipates power as heat.' },
      { name: 'Wires', detail: 'Close the loop; their resistance is omitted here.' },
    ],
    steps: [
      {
        id: 'current',
        title: 'Control the current',
        mission: 'Increase resistance from 2 to 4 ohms and compare current.',
        question: 'At fixed voltage, doubling resistance does what to current?',
        options: ['Doubles it', 'Halves it', 'Has no effect'],
        correct: 1,
        feedback: 'I = V/R. With voltage unchanged, twice the resistance gives half the current.',
        hint: 'Put 2R in the denominator.',
      },
      {
        id: 'power',
        title: 'Track the energy transfer',
        mission: 'Set resistance to 6 ohms. Calculate current and power at 6 volts.',
        question: 'At 6 V and 6 ohms, what power does this resistor dissipate?',
        options: ['1 watt', '6 watts', '36 watts'],
        correct: 1,
        feedback: 'Current is 1 ampere, so power is 6 volts × 1 ampere = 6 watts.',
        hint: 'First calculate I, then use P = VI.',
      },
    ],
  },
  {
    id: 'heart',
    title: 'The heart: timing and circulation',
    related: ['brain', 'dna'],
    lab: 'heart',
    source: 'https://www.nhlbi.nih.gov/health/heart/heart-beats',
    sourceName: 'NIH NHLBI: How the heart beats',
    simple:
      'Electrical activity coordinates contractions. Valves help keep blood moving in the intended direction.',
    deep: 'Our arithmetic model fixes stroke volume at an illustrative 70 mL per beat. Output = rate × volume. Real stroke volume changes with filling and other conditions, so increasing rate cannot be assumed to increase output indefinitely.',
    mechanism: [
      'Electrical signal initiates a beat',
      'Chambers contract in sequence',
      'Valves limit backflow',
      'Blood circulates and returns',
    ],
    parts: [
      { name: 'SA node', detail: 'Normally initiates the electrical impulse.' },
      { name: 'AV node', detail: 'Delays conduction before ventricular activation.' },
      { name: 'Valves', detail: 'Open and close with pressure differences, limiting backflow.' },
    ],
    steps: [
      {
        id: 'timing',
        title: 'Coordinate each beat',
        mission:
          'Change rate from 60 to 90 beats per minute. Compare the modeled seconds between beats.',
        question: 'Why does coordinated timing matter?',
        options: [
          'It allows filling and pumping in sequence',
          'It eliminates the need for blood',
          'It means valves never close',
        ],
        correct: 0,
        feedback:
          'Coordinated activation helps chambers fill and then pump. The arithmetic display is not a clinical heart simulator.',
        hint: 'Think about filling before contraction.',
      },
      {
        id: 'output',
        title: 'Interpret a circulation model',
        mission:
          'Compare output at 60 and 120 beats per minute while the model holds stroke volume fixed.',
        question:
          'Can the model prove that doubling a real person’s heart rate always doubles cardiac output?',
        options: [
          'Yes, under every condition',
          'No, stroke volume and physiology can change',
          'Yes, because the drawing is accurate anatomy',
        ],
        correct: 1,
        feedback:
          'The calculation assumes constant stroke volume. Real physiology does not guarantee that assumption.',
        hint: 'Identify which input the model freezes.',
      },
    ],
  },
  {
    id: 'engine',
    title: 'Inside a four-stroke engine',
    related: ['ev', 'battery', 'flight'],
    lab: 'engine',
    source: 'https://www.energy.gov/cmei/vehicles/articles/internal-combustion-engine-basics',
    sourceName: 'US Department of Energy: Engine basics',
    simple: 'A four-stroke piston engine cycles through intake, compression, power and exhaust.',
    deep: 'One cycle takes two crankshaft revolutions. The diagram shows idealized piston travel with a sinusoidal approximation. It omits connecting-rod geometry, real valve timing, pressure, ignition timing and heat losses.',
    mechanism: [
      'Intake: admit a fresh charge',
      'Compression: reduce cylinder volume',
      'Power: expanding gases do work',
      'Exhaust: expel combustion products',
    ],
    parts: [
      {
        name: 'Piston',
        detail: 'Moves within the cylinder and transfers force to the connecting rod.',
      },
      { name: 'Crankshaft', detail: 'Converts reciprocating motion into rotation.' },
      {
        name: 'Valves',
        detail:
          'Control intake and exhaust; actual opening times differ from ideal stroke boundaries.',
      },
    ],
    steps: [
      {
        id: 'strokes',
        title: 'Move through the cycle',
        mission:
          'Advance crank angle through 90, 270, 450 and 630 degrees. Read the stroke labels.',
        question: 'How many crankshaft revolutions make one four-stroke cycle?',
        options: ['One', 'Two', 'Four'],
        correct: 1,
        feedback: 'Four piston strokes span 720 crank degrees, or two full revolutions.',
        hint: 'A full turn is 360 degrees.',
      },
      {
        id: 'power',
        title: 'Identify the useful stroke',
        mission: 'Set the crank angle to 450 degrees and inspect the idealized power stroke.',
        question: 'Which stroke uses expanding combustion gases to drive the piston?',
        options: ['Intake', 'Exhaust', 'Power'],
        correct: 2,
        feedback:
          'During the power stroke, expanding gases exert force on the piston. Other strokes are needed to prepare and clear the cylinder.',
        hint: 'Look for the stage after compression.',
      },
    ],
  },
  {
    id: 'phone',
    title: 'Inside a phone: working memory and storage',
    related: ['chips', 'internet', 'battery'],
    lab: 'memory',
    source: 'https://www.arm.com/markets/consumer-technologies/smartphones',
    sourceName: 'Arm: Smartphone systems',
    simple:
      'A phone combines processors, working memory, persistent storage, radios and sensors. These parts have different jobs.',
    deep: 'This capacity model gives a device 8 GB of working memory and each toy task a fixed 1 GB demand. It calculates demand and shortfall; it does not simulate operating-system scheduling, compression or storage performance.',
    mechanism: [
      'Load instructions and data',
      'Keep active working data in memory',
      'Execute using processors',
      'Keep persistent files in storage',
    ],
    parts: [
      { name: 'Processor', detail: 'Executes instructions and works with memory.' },
      { name: 'RAM', detail: 'Holds active working data; ordinary RAM requires power.' },
      { name: 'Storage', detail: 'Retains files across power loss; it is distinct from RAM.' },
    ],
    steps: [
      {
        id: 'components',
        title: 'Give each component a job',
        mission: 'Increase toy tasks above 8 and observe the memory shortfall.',
        question: 'Which component normally keeps photos when a phone is powered off?',
        options: ['Persistent storage', 'Ordinary working RAM', 'The display pixels'],
        correct: 0,
        feedback:
          'Persistent storage retains files without power. RAM and displays serve different roles.',
        hint: 'Which memory is nonvolatile?',
      },
      {
        id: 'capacity',
        title: 'Explore a capacity limit',
        mission: 'Compare 4 tasks with 10 tasks in the fixed 8 GB example.',
        question:
          'Does a 2 GB memory shortfall in this model tell you exactly how slow a real phone becomes?',
        options: [
          'Yes, exactly two seconds',
          'No, performance depends on the operating system and workload',
          'Yes, the battery must be empty',
        ],
        correct: 1,
        feedback:
          'The model calculates capacity only. It cannot infer latency, scheduling or power consumption.',
        hint: 'A capacity quantity is not a time measurement.',
      },
    ],
  },
];
export const extraJourneys: Journey[] = topics.map((t) => ({
  id: t.id,
  title: t.title,
  related: t.related,
  steps: t.steps.map((s) => ({
    ...s,
    simple: t.simple,
    deep: t.deep,
    mechanism: t.mechanism,
    parts: t.parts,
    lab: t.lab,
    source: t.source,
    sourceName: t.sourceName,
  })),
}));
