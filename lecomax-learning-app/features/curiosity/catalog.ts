export type Step = { name: string; detail: string };
export type Discovery = {
  id: string;
  title: string;
  category: string;
  fact: string;
  simple: string;
  deep: string;
  source: string;
  sourceName: string;
  checked: string;
  evidence: 'established' | 'simplified model' | 'research frontier';
  related: string[];
  question: string;
  options: string[];
  correct: number;
  feedback: string;
  steps?: Step[];
  parts?: Step[];
  history?: Step[];
  myth?: string;
  project?: string;
};
const entry = (
  id: string,
  title: string,
  category: string,
  fact: string,
  simple: string,
  deep: string,
  sourceName: string,
  source: string,
  related: string[],
  question: string,
  options: string[],
  correct: number,
  feedback: string,
  extra: Partial<Discovery> = {},
): Discovery => ({
  id,
  title,
  category,
  fact,
  simple,
  deep,
  sourceName,
  source,
  related,
  question,
  options,
  correct,
  feedback,
  checked: '2026-10-16',
  evidence: 'established',
  ...extra,
});
export const catalog: Discovery[] = [
  entry(
    'ai',
    'How does AI learn?',
    'Computing',
    'Many modern AI systems learn statistical patterns by adjusting numerical parameters, rather than receiving a rule for every answer.',
    'Imagine a prediction machine with adjustable knobs. Examples help a training program change the knobs so its predictions improve.',
    'A neural network combines weighted calculations with nonlinear functions. Training uses a loss to measure prediction error; backpropagation computes gradients and an optimizer updates parameters. Good training performance alone does not demonstrate generalization.',
    'Google Machine Learning Crash Course',
    'https://developers.google.com/machine-learning/crash-course/neural-networks',
    ['gpu', 'attention', 'chips', 'brain'],
    'A model memorizes training examples but fails on new ones. What should you check?',
    [
      'Only its training score',
      'Performance on held-out examples',
      'Whether its answers sound confident',
    ],
    1,
    'Held-out examples test generalization. A low training loss can coexist with overfitting.',
    {
      evidence: 'simplified model',
      myth: 'Fluent output proves understanding and accuracy. Reality: a model can generate plausible but false statements.',
      project:
        'Write five training examples and five unseen examples for sorting messages. Explain how you would detect memorization.',
      steps: [
        {
          name: 'Prepare data',
          detail:
            'Collect permitted examples; filter, deduplicate and separate training and evaluation sets. Biased coverage can produce biased behavior.',
        },
        {
          name: 'Represent inputs',
          detail:
            'Text models tokenize text into units and map them to vectors. Tokens are not always whole words; other AI systems use images, audio or numerical features.',
        },
        {
          name: 'Compute predictions',
          detail:
            'A neural network transforms inputs. Many language models use transformer blocks; attention mixes information from available token positions.',
        },
        {
          name: 'Measure loss',
          detail:
            'Compare predictions with training targets. A common language-model objective predicts the next token, but AI objectives vary.',
        },
        {
          name: 'Update parameters',
          detail:
            'Backpropagation calculates gradients. An optimizer makes numerical updates; GPUs and other accelerators speed up parallel matrix arithmetic.',
        },
        {
          name: 'Evaluate and adapt',
          detail:
            'Test unseen examples and failure cases. Fine-tuning adapts behavior; human feedback and other alignment techniques can improve usefulness without guaranteeing truth or safety.',
        },
        {
          name: 'Run inference',
          detail:
            'At use time, a generative language model repeatedly selects a next token. Ordinary inference does not retrain its parameters. Retrieval can supply documents, but requires a separate system.',
        },
        {
          name: 'Monitor limitations',
          detail:
            'Check errors, privacy, bias and changing conditions. This is a simplified language-model journey, not the architecture of every AI system.',
        },
      ],
      parts: [
        {
          name: 'Training data',
          detail:
            'Examples provide the learning signal. Missing cases affect the model, so evaluation needs different examples.',
        },
        {
          name: 'Parameters',
          detail:
            'Numerical weights encode learned transformations; they are not a reliable database of citations.',
        },
        {
          name: 'Accelerator',
          detail:
            'Executes parallel arithmetic on parameters and activations; memory bandwidth also affects performance.',
        },
        {
          name: 'Evaluation set',
          detail: 'Unseen examples expose failures that training loss can hide.',
        },
      ],
    },
  ),
  entry(
    'attention',
    'Attention connects words in context',
    'Computing',
    'Transformer attention combines information from token representations using learned relevance scores.',
    'In “the animal crossed because it was hungry,” context helps connect “it” with the animal.',
    'Queries and keys produce compatibility scores; normalized scores weight value vectors. Multiple heads learn different transformations. Attention is a mathematical operation, not human awareness.',
    'Vaswani and colleagues, 2017',
    'https://arxiv.org/abs/1706.03762',
    ['ai', 'gpu', 'numbers'],
    'What changes when a word appears in a different sentence?',
    [
      'Its contextual representation can change',
      'It always has the same meaning',
      'Attention turns into consciousness',
    ],
    0,
    'Context changes which information contributes to a representation.',
    { evidence: 'simplified model' },
  ),
  entry(
    'gpu',
    'Why parallel work helps computers',
    'Computing',
    'GPUs can perform many similar arithmetic operations concurrently.',
    'Many workers can paint different tiles at once, if the tiles do not depend on each other.',
    'Parallel processors benefit workloads with substantial independent work. Data transfers, memory access and sequential dependencies can limit the speedup.',
    'Arm mobile computing',
    'https://www.arm.com/markets/consumer-technologies/smartphones',
    ['ai', 'chips', 'phone'],
    'Which task best fits parallel execution?',
    [
      'A chain where each result needs the previous one',
      'Independent calculations on many pixels',
      'Waiting for one user to type',
    ],
    1,
    'Independent pixel calculations expose parallel work. Dependencies limit concurrency.',
    { evidence: 'simplified model' },
  ),
  entry(
    'chips',
    'A chip is built layer by layer',
    'Engineering',
    'Microchips are manufactured as carefully aligned patterns on semiconductor wafers.',
    'Think of building a tiny layered city with paths connecting electronic switches.',
    'Fabrication repeats material deposition, patterning and removal. Contamination and misalignment can ruin structures, so fabs control their environments precisely.',
    'ASML: How microchips are made',
    'https://www.asml.com/en/technology/all-about-microchips/how-microchips-are-made',
    ['ai', 'solar', 'numbers'],
    'Why can a dust particle cause a chip to fail?',
    [
      'It can disrupt tiny circuit structures',
      'Dust always conducts perfectly',
      'It changes the software language',
    ],
    0,
    'A particle can obstruct or alter a patterned structure; software cannot repair every physical defect.',
    {
      steps: [
        { name: 'Design', detail: 'Engineers design and verify circuits before manufacturing.' },
        {
          name: 'Prepare wafer',
          detail: 'A polished semiconductor wafer supports the structures.',
        },
        {
          name: 'Build and pattern layers',
          detail:
            'Deposition, lithography and etching build repeated patterns with precise alignment.',
        },
        {
          name: 'Connect and test',
          detail: 'Interconnects link devices; electrical tests identify functioning dies.',
        },
        {
          name: 'Package',
          detail: 'Separated dies receive protection and connections to a circuit board.',
        },
      ],
      project:
        'Draw three transparent layers of a tiny circuit. Explain why alignment marks matter.',
    },
  ),
  entry(
    'phone',
    'Your phone is a team of systems',
    'Engineering',
    'A smartphone combines computing, sensing, communication and power systems.',
    'The processor follows instructions while memory holds active work and storage keeps files.',
    'The operating system schedules applications and controls hardware through drivers. Radios exchange encoded signals with networks; sensors supply measurements. Architecture varies by device.',
    'Arm smartphone platform',
    'https://www.arm.com/markets/consumer-technologies/smartphones',
    ['battery', 'internet', 'chips'],
    'Why can your photos remain after the battery runs out?',
    [
      'All memory is permanent',
      'Nonvolatile storage retains data without power',
      'The display saves them',
    ],
    1,
    'Storage retains files. Working RAM generally needs power.',
    {
      parts: [
        {
          name: 'Processor',
          detail:
            'Runs instructions and coordinates work with memory; specialized units accelerate graphics and other tasks.',
        },
        {
          name: 'RAM',
          detail:
            'Holds active programs and data for quick access; it is distinct from persistent storage.',
        },
        {
          name: 'Storage',
          detail: 'Flash memory retains applications and photos when power is off.',
        },
        {
          name: 'Battery',
          detail: 'Supplies electrical energy through power management circuits to all subsystems.',
        },
        {
          name: 'Display',
          detail:
            'Turns image data into light; touch sensing sends input back to the operating system.',
        },
        {
          name: 'Sensors',
          detail: 'Motion and light sensors measure the environment so software can respond.',
        },
        {
          name: 'Radios',
          detail: 'Wi-Fi and cellular systems encode and decode signals through antennas.',
        },
        {
          name: 'Operating system',
          detail: 'Schedules work, manages permissions and mediates access to devices.',
        },
      ],
    },
  ),
  entry(
    'internet',
    'The internet moves packets',
    'Computing',
    'The web is one service on the internet, not another name for the whole network.',
    'A browser asks a server for resources; networks carry messages between them.',
    'Routers forward IP packets across networks. HTTP defines web requests and responses; HTTPS adds TLS protection. Cloud infrastructure consists of real computing systems and networks.',
    'MDN: HTTP overview',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
    ['dns', 'web', 'phone'],
    'DNS succeeds but a server is unavailable. Will the page necessarily load?',
    [
      'Yes, DNS contains every page',
      'No, resolving a name is only one step',
      'Yes, HTTPS makes servers permanent',
    ],
    1,
    'Knowing an address does not ensure a server can answer.',
    {
      steps: [
        { name: 'Connect', detail: 'Your device joins a network through a local link.' },
        {
          name: 'Resolve a name',
          detail: 'DNS finds address records, often using a cached answer.',
        },
        {
          name: 'Send request',
          detail:
            'Packets travel through routers; HTTPS protects the application exchange with TLS.',
        },
        {
          name: 'Serve resources',
          detail:
            'A server returns a response. The browser may request more resources to render the page.',
        },
      ],
    },
  ),
  entry(
    'dns',
    'Names are not network addresses',
    'Computing',
    'DNS lets software look up records associated with domain names.',
    'A name is easier to remember than a numerical address. A resolver helps find the needed record.',
    'Resolvers can cache answers for their time to live. Without a usable cache, resolution may query a hierarchy of name servers. DNS resolution and fetching a page are separate operations.',
    'Cloudflare DNS learning center',
    'https://www.cloudflare.com/learning/dns/what-is-dns/',
    ['internet', 'web'],
    'Why can a DNS lookup skip some servers?',
    [
      'Every domain has the same IP',
      'A valid cached answer can be reused',
      'DNS never uses servers',
    ],
    1,
    'Caching reuses previously obtained records while their lifetime permits it.',
  ),
  entry(
    'flight',
    'Wings change the motion of air',
    'Physics',
    'Lift, weight, thrust and drag all influence an airplane’s motion.',
    'Wings interact with flowing air. Engines provide thrust, while gravity pulls downward.',
    'Wing geometry and angle to the flow affect pressure and airflow deflection. Lift is perpendicular to the relative airflow. Control surfaces alter forces and moments; too much angle of attack can stall a wing.',
    'NASA: Four forces of flight',
    'https://www.nasa.gov/stem-content/four-forces-of-flight/',
    ['rocket', 'tides'],
    'In steady level flight with constant speed, what is true?',
    [
      'Lift exceeds weight continually',
      'Forces balance overall',
      'Thrust must exceed drag continually',
    ],
    1,
    'Unbalanced forces cause acceleration; steady straight flight requires balanced forces.',
    {
      parts: [
        {
          name: 'Wing',
          detail:
            'Interacts with air to produce aerodynamic forces; shape and angle affect lift and drag.',
        },
        { name: 'Engine', detail: 'Produces thrust, helping overcome drag.' },
        {
          name: 'Control surfaces',
          detail:
            'Elevators, ailerons and rudder alter pitch, roll and yaw through aerodynamic forces.',
        },
      ],
      myth: 'Air above a wing must meet air below at the trailing edge. Reality: there is no equal-transit-time requirement.',
      project:
        'Fold two paper gliders with different wing shapes. Predict and compare glide paths indoors without throwing toward people.',
    },
  ),
  entry(
    'rocket',
    'Rockets do not need air to push against',
    'Space',
    'A rocket gains momentum by expelling propellant in the opposite direction.',
    'A balloon moves when escaping air carries momentum away. Rocket propulsion follows the same conservation principle.',
    'Rockets carry propellant; chemical rockets usually carry oxidizer as well as fuel. They can operate in vacuum. Aerodynamic forces matter in atmosphere but vanish in an ideal vacuum.',
    'NASA Glenn: Rocket forces',
    'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/four-rocket-forces/',
    ['flight', 'earth'],
    'Why can a rocket accelerate in space?',
    [
      'It pushes on surrounding air',
      'Its exhaust carries momentum away',
      'Gravity disappears everywhere',
    ],
    1,
    'Momentum exchange with exhaust provides thrust without surrounding air.',
    {
      myth: 'Space has no gravity. Reality: gravity keeps satellites in orbit.',
      parts: [
        {
          name: 'Propellant tanks',
          detail:
            'Store material expelled by propulsion; chemical designs often separate fuel and oxidizer.',
        },
        { name: 'Engine and nozzle', detail: 'Accelerate exhaust to provide thrust.' },
        {
          name: 'Guidance',
          detail: 'Sensors and control systems help maintain the intended trajectory.',
        },
      ],
    },
  ),
  entry(
    'earth',
    'Earth has a layered interior',
    'Earth',
    'Earth’s solid inner core is surrounded by a liquid outer core.',
    'The planet is not solid rock all the way through. Its layers have different compositions and physical states.',
    'The crust and mantle are mainly silicate material. The core is predominantly metallic. The mantle is mostly solid but deforms over geological time; diagrams exaggerate layer boundaries for clarity.',
    'NASA: Earth facts',
    'https://science.nasa.gov/earth/facts/',
    ['tides', 'rocket'],
    'Which statement corrects a common Earth diagram misconception?',
    [
      'The entire mantle is a liquid ocean',
      'The mantle is mostly solid and can flow slowly',
      'Earth is hollow',
    ],
    1,
    'Solid material can deform over long timescales; “solid” does not mean perfectly rigid.',
    {
      parts: [
        { name: 'Crust', detail: 'Thin outer rocky layer, much thinner than the mantle.' },
        {
          name: 'Mantle',
          detail: 'Mostly solid silicate rock that deforms over geological timescales.',
        },
        {
          name: 'Outer core',
          detail: 'Liquid metal; its motion contributes to the magnetic field.',
        },
        { name: 'Inner core', detail: 'Solid metal under immense pressure.' },
      ],
    },
  ),
  entry(
    'tides',
    'The Moon helps move oceans',
    'Earth',
    'The Moon and Sun contribute to tides through differences in gravitational attraction across Earth.',
    'The pull is not identical everywhere. Ocean basins and coastlines shape the resulting water motion.',
    'Tides are long-period waves. Local geography affects their amplitude and timing, so a simple two-bulge model cannot predict every coastline.',
    'NOAA: Tides',
    'https://www.noaa.gov/education/resource-collections/ocean-coasts/tides',
    ['earth', 'flight'],
    'Why do nearby coasts sometimes have different tide ranges?',
    [
      'The Moon only attracts one beach',
      'Basin and coastline shape affect the response',
      'Tides are only caused by wind',
    ],
    1,
    'The same astronomical forcing interacts with different basin geometry.',
    { evidence: 'simplified model' },
  ),
  entry(
    'solar',
    'Light can produce electrical current',
    'Energy',
    'Photovoltaic cells convert some incoming light energy into electrical energy.',
    'Light transfers energy to charge carriers in a semiconductor; a circuit can use their motion.',
    'Photovoltaic conversion depends on material properties and device design. Not all incoming energy becomes electricity; optical and electrical losses reduce efficiency.',
    'US Department of Energy: PV cells',
    'https://www.energy.gov/cmei/systems/solar-photovoltaic-cell-basics',
    ['chips', 'battery'],
    'Does a solar panel automatically store electricity for night?',
    [
      'Yes, every cell is a battery',
      'No, storage requires another system',
      'Yes, its glass stores current',
    ],
    1,
    'Conversion and storage are different functions. A battery is one storage option.',
    {
      myth: 'Solar panels store sunshine for night. Reality: panels convert light; storage is separate.',
    },
  ),
  entry(
    'battery',
    'A battery separates two paths',
    'Energy',
    'In a lithium-ion cell, ions move internally while electrons travel through an external circuit during discharge.',
    'The chemical system supplies energy to your device. Recharging uses electrical energy to reverse the overall process.',
    'Electrodes exchange lithium ions through an electrolyte. A separator keeps electrodes apart while allowing ionic transport. Chemistry and temperature affect performance and aging.',
    'US Department of Energy: Lithium-ion storage',
    'https://www.energy.gov/sites/default/files/Li-ion.pdf',
    ['phone', 'solar', 'ev'],
    'Why is the separator important?',
    [
      'It helps prevent direct electrode contact',
      'It is the display',
      'It produces unlimited energy',
    ],
    0,
    'Separating electrodes helps prevent an internal short while permitting ions to pass.',
    {
      parts: [
        { name: 'Electrodes', detail: 'Host ions and participate in electrochemical reactions.' },
        {
          name: 'Electrolyte',
          detail: 'Carries ions between electrodes; electrons use the external circuit.',
        },
        { name: 'Separator', detail: 'Keeps electrodes apart while allowing ion transport.' },
      ],
    },
  ),
  entry(
    'ev',
    'Electric vehicles manage heat too',
    'Energy',
    'Vehicle battery systems need thermal management to remain within operating limits.',
    'A battery powers a motor, but the car must also manage energy flow and temperature.',
    'Power electronics control motor current. Regenerative braking can return some kinetic energy to storage; losses prevent complete recovery.',
    'US Department of Energy: Lithium-ion batteries',
    'https://www.energy.gov/node/236467',
    ['battery', 'solar', 'phone'],
    'Can regenerative braking recover all the energy used to accelerate?',
    ['Always', 'No, losses and operating limits remain', 'Only if gravity is absent'],
    1,
    'Conversion losses, drag and system limits mean recovery is incomplete.',
    {
      parts: [
        {
          name: 'Battery pack',
          detail: 'Cells and monitoring electronics supply energy; cooling helps manage heat.',
        },
        { name: 'Inverter', detail: 'Controls electrical power delivered to the traction motor.' },
        {
          name: 'Motor',
          detail:
            'Converts electrical energy into mechanical motion and can generate during braking.',
        },
      ],
    },
  ),
  entry(
    'heart',
    'Your heart coordinates its own rhythm',
    'Humans',
    'Specialized cells initiate electrical signals that coordinate heart contractions.',
    'Timing matters: chambers must fill and contract in a coordinated sequence.',
    'A signal normally starts in the sinoatrial node, passes through the atria and is delayed at the atrioventricular node before activating the ventricles. Valves help prevent backflow.',
    'NIH NHLBI: How the heart beats',
    'https://www.nhlbi.nih.gov/health/heart/heart-beats',
    ['brain', 'dna'],
    'Why is coordinated timing useful?',
    [
      'It allows filling before pumping',
      'It stops all blood movement',
      'It replaces the need for valves',
    ],
    0,
    'Coordinated electrical activity supports efficient filling and pumping.',
    {
      parts: [
        {
          name: 'SA node',
          detail: 'Normally initiates the electrical impulse that sets the rhythm.',
        },
        {
          name: 'AV node',
          detail: 'Delays conduction, supporting ventricular filling before contraction.',
        },
        { name: 'Ventricles', detail: 'Muscular pumping chambers drive blood to lungs and body.' },
        { name: 'Valves', detail: 'Pressure differences open and close them, limiting backflow.' },
      ],
    },
  ),
  entry(
    'brain',
    'Brains learn through changing networks',
    'Humans',
    'Neurons communicate through specialized connections called synapses.',
    'Learning involves changes in how networks respond, not filing every memory in one tiny box.',
    'Neurons use electrical signals and, at many synapses, chemical messengers. Brain functions involve interacting networks; an artificial neural network is not a faithful model of an entire brain.',
    'NIH NINDS: Brain Basics',
    'https://www.ninds.nih.gov/health-information/public-education/brain-basics',
    ['ai', 'heart', 'dna'],
    'Is an artificial neural network a complete copy of a brain?',
    ['Yes, every neuron is simulated', 'No, the analogy is limited', 'Yes, if it generates words'],
    1,
    'Artificial networks use simplified mathematical units and omit much biological complexity.',
    {
      myth: 'We use only 10% of our brains. Reality: many regions contribute to different activities; activity varies with task.',
    },
  ),
  entry(
    'dna',
    'DNA is information carried by chemistry',
    'Humans',
    'The order of DNA bases carries genetic information.',
    'Cells use parts of this information while building and maintaining an organism.',
    'DNA has complementary strands with base pairing. Genes and regulatory sequences influence cellular activity; traits also depend on environment and interactions among many factors.',
    'NHGRI: DNA fact sheet',
    'https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet',
    ['brain', 'heart'],
    'Does one DNA sequence alone determine every aspect of a person?',
    [
      'Yes, environment never matters',
      'No, development also involves environment and complex interactions',
      'Only the number of bases matters',
    ],
    1,
    'Genetic information matters, but simple one-gene explanations cannot describe every trait.',
  ),
  entry(
    'bats',
    'Some animals navigate by listening',
    'Nature',
    'Many bats locate prey and obstacles using echoes from sounds they produce.',
    'A returning echo carries clues about the object that reflected it.',
    'Echo delay provides distance information; spectral and timing differences provide additional cues. Echolocation abilities and calls vary among bat species.',
    'US National Park Service: Echolocation',
    'https://www.nps.gov/subjects/bats/echolocation.htm',
    ['brain', 'flight'],
    'If an echo returns later under similar conditions, what does that suggest?',
    ['A farther reflector', 'A closer reflector', 'Sound has no travel time'],
    0,
    'A longer round trip generally indicates greater distance when sound speed is similar.',
    {
      project:
        'Draw a sound path to a wall and back. If distance doubles, predict how echo travel time changes.',
    },
  ),
  entry(
    'numbers',
    'Tiny switches enabled modern computing',
    'History',
    'Transistors and integrated circuits developed through contributions from many researchers and organizations.',
    'Electronic switching lets circuits represent and transform information.',
    'Binary representation encodes values using two symbols. Physical circuits implement voltage ranges rather than abstract perfect zeros and ones.',
    'Computer History Museum: Silicon Engine',
    'https://www.computerhistory.org/siliconengine/',
    ['chips', 'ai', 'web'],
    'Why is naming just one inventor for modern computers misleading?',
    [
      'Computers have no history',
      'Many advances and contributors built on one another',
      'All computers appeared at once',
    ],
    1,
    'Devices, architectures, manufacturing and software developed through many contributions.',
    {
      history: [
        {
          name: '1947 · Point-contact transistor',
          detail:
            'Bell Labs researchers Bardeen and Brattain demonstrated a transistor; Shockley contributed related transistor theory and later designs.',
        },
        {
          name: '1958–1959 · Integrated circuits',
          detail:
            'Jack Kilby and Robert Noyce developed important integrated-circuit approaches independently.',
        },
        {
          name: 'Then → now',
          detail:
            'Early discrete components gave way to densely integrated devices; modern computing also depends on software and networks.',
        },
      ],
    },
  ),
  entry(
    'quantum',
    'Quantum computers have specialized promise',
    'Frontiers',
    'Quantum information research explores computation using quantum states, with substantial engineering challenges.',
    'A quantum computer is not simply a faster ordinary laptop for every task.',
    'Qubits allow superposition and entanglement. Algorithms exploit interference, but noise and measurement constrain useful computation. Practical advantages depend on the task and implementation.',
    'NIST: Quantum information science',
    'https://www.nist.gov/quantum-information-science',
    ['numbers', 'chips', 'ai'],
    'What is the careful claim about quantum computers?',
    [
      'They speed up every program',
      'Potential advantages are task-dependent',
      'They give every possible answer directly',
    ],
    1,
    'Quantum algorithms can offer advantages for particular problems; they do not automatically accelerate everything.',
    {
      evidence: 'research frontier',
      myth: 'A quantum computer simply reads all possible answers at once. Reality: measurement and algorithm design constrain what can be learned.',
    },
  ),
  entry(
    'web',
    'The Web grew on top of the internet',
    'History',
    'The World Wide Web uses linked resources accessed across the internet.',
    'Web pages are one way to share information over networks that also support other services.',
    'HTTP supports exchanges between clients and servers. A page can reference many resources, and each may require its own exchange. The protocol evolved through collaborative standards work.',
    'MDN: HTTP overview',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
    ['internet', 'dns', 'numbers'],
    'Which distinction is useful?',
    [
      'Web and internet always mean the same thing',
      'The web is an application built on networking infrastructure',
      'Email cannot use the internet',
    ],
    1,
    'The internet supports many applications, including the web.',
    {
      history: [
        { name: 'Early web', detail: 'Linked documents made networked information navigable.' },
        {
          name: 'Modern web',
          detail: 'Browsers run rich applications and exchange many types of resources.',
        },
      ],
    },
  ),
];
catalog.push(
  entry(
    'electricity',
    'How does an electric circuit work?',
    'Physics',
    'An ideal ohmic resistor relates voltage, current and resistance through Ohm’s law.',
    'A closed path lets current flow; resistance limits it.',
    'For an ohmic resistor I = V/R and dissipated power P = VI. Actual parts have temperature dependence and power ratings.',
    'OpenStax: Ohm’s law',
    'https://openstax.org/books/physics/pages/19-1-ohms-law',
    ['battery', 'solar', 'phone'],
    'At fixed voltage, what does doubling resistance do to current?',
    ['Doubles it', 'Halves it', 'Leaves it unchanged'],
    1,
    'Current is voltage divided by resistance, so twice the resistance produces half the current.',
    { evidence: 'simplified model' },
  ),
  entry(
    'engine',
    'How does a four-stroke engine work?',
    'Engineering',
    'A four-stroke cycle takes two crankshaft revolutions.',
    'Intake, compression, power and exhaust repeat to turn fuel energy into mechanical work.',
    'Expanding combustion gases drive the piston during the power stroke. The crank mechanism converts reciprocating motion to rotation; real engines also involve heat losses and detailed valve timing.',
    'US Department of Energy: Engine basics',
    'https://www.energy.gov/cmei/vehicles/articles/internal-combustion-engine-basics',
    ['ev', 'battery', 'flight'],
    'Which stroke uses expanding combustion gases to drive the piston?',
    ['Intake', 'Power', 'Exhaust'],
    1,
    'The power stroke converts some energy from expanding gases into mechanical work; the other strokes prepare and clear the cylinder.',
    { evidence: 'simplified model' },
  ),
);
export const getDiscovery = (id: string) => catalog.find((d) => d.id === id);
export function discoveryContext(id: string) {
  const d = getDiscovery(id);
  return d
    ? {
        id: d.id,
        title: d.title,
        fact: d.fact,
        explanation: d.deep,
        source: d.source,
        checked: d.checked,
        evidence: d.evidence,
        journey: Object.fromEntries((d.steps || []).map((step) => [step.name, step.detail])),
        components: Object.fromEntries((d.parts || []).map((part) => [part.name, part.detail])),
        scope:
          'Source-checked educational summary, not expert peer review. Acknowledge uncertainty. Generated explanations are not published catalog content.',
      }
    : undefined;
}
