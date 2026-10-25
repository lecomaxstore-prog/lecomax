import type { Planet, Topic, Question, Country } from './types';
import map from './map.json';
export const reviewedAt = '2026-10-16';
export const countries = map as Country[];
export const mapSource = 'https://www.naturalearthdata.com/about/terms-of-use/';
const nasa = 'https://science.nasa.gov/';
const usgs = 'https://pubs.usgs.gov/gip/dynamic/';
export const planetSource = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/';
export const planets: Planet[] = [
  [
    'mercury',
    4879,
    3.7,
    167,
    57.9,
    1407.6,
    88,
    'A very thin exosphere, not a substantial atmosphere.',
    '#b6ada6',
  ],
  [
    'venus',
    12104,
    8.9,
    464,
    108.2,
    -5832.5,
    224.7,
    'Dense carbon dioxide with sulfuric-acid clouds.',
    '#dfbe83',
  ],
  ['earth', 12756, 9.8, 15, 149.6, 23.9, 365.2, 'Mostly nitrogen and oxygen.', '#5caee8'],
  ['mars', 6792, 3.7, -65, 228, 24.6, 687, 'Thin atmosphere, mostly carbon dioxide.', '#d78359'],
  [
    'jupiter',
    142984,
    23.1,
    -110,
    778.5,
    9.9,
    4331,
    'Mostly hydrogen and helium; no solid surface.',
    '#d9af88',
  ],
  [
    'saturn',
    120536,
    9,
    -140,
    1432,
    10.7,
    10747,
    'Mostly hydrogen and helium; no solid surface.',
    '#e3ca93',
  ],
  [
    'uranus',
    51118,
    8.7,
    -195,
    2867,
    -17.2,
    30589,
    'Hydrogen, helium and methane above an ice-rich interior.',
    '#83d1db',
  ],
  [
    'neptune',
    49528,
    11,
    -200,
    4515,
    16.1,
    59800,
    'Hydrogen, helium and methane above an ice-rich interior.',
    '#5274dd',
  ],
].map((v) => ({
  id: v[0],
  diameter: v[1],
  gravity: v[2],
  temperature: v[3],
  distance: v[4],
  rotation: v[5],
  orbit: v[6],
  atmosphere: v[7],
  color: v[8],
})) as Planet[];
const q = (
  id: string,
  prompt: string,
  options: string[],
  correct: number,
  explanation: string,
  level: 1 | 2 = 1,
): Question => ({ id, prompt, options, correct, explanation, level });
export const earth: Topic = {
  id: 'earth',
  title: 'Earth · our living planet',
  category: 'Earth',
  color: '#50b8d7',
  diagram: 'layers',
  intro:
    'Investigate a planet as a connected system. By the end, distinguish its layers, explain day and night, and use evidence to challenge a common misconception about seasons.',
  sections: [
    {
      title: '1 · Start with an observation',
      text: 'At noon, sunlight reaches your location from high in the sky. Hours later it is dark. Predict: did the Sun go out, did Earth stop moving, or did your location turn away from sunlight? Rotate the globe and trace a place around the sphere. A complete turn relative to the Sun takes about 24 hours; an orbit takes about one year. Rotation and revolution describe different motions.',
    },
    {
      title: '2 · A rocky surface hides different materials',
      text: 'Earth has a thin rocky crust, a much thicker mantle, and a metal-rich core. Most mantle rock is solid, but it can deform slowly over geological time. The outer core is liquid; the inner core is solid under immense pressure. Tap the cross-section layers. Their drawn thicknesses are simplified. Do not mistake the mantle for a global ocean of magma.',
    },
    {
      title: '3 · How can we know what is inside?',
      text: 'We cannot drill to the core. Earthquake waves travel through the planet and change speed or direction in different materials. Shear waves do not pass through liquids. Scientists combine these signals with laboratory experiments and other observations to infer an interior model. A scientific diagram is a model supported by evidence, not a photograph of a cut-open Earth.',
    },
    {
      title: '4 · Land, water and air interact',
      text: 'Sunlight supplies energy that evaporates water. Water vapor can condense into clouds and return as rain or snow. Flowing water transports material across land. Mountains affect winds and rainfall; oceans store and redistribute heat. A forest depends on soil, water, air and organisms working together. Changing one part of this system can affect others.',
    },
    {
      title: '5 · Test the seasons explanation',
      text: 'Use the seasons activity next. Earth’s axis is tilted about 23.4 degrees from the perpendicular to its orbital plane. A hemisphere tilted toward the Sun receives more direct sunlight and longer days. The hemispheres therefore have opposite seasons. A distance-only explanation cannot account for summer in one hemisphere and winter in the other at the same time.',
    },
    {
      title: '6 · Apply what you learned',
      text: 'Imagine explaining Earth to a visitor. Identify the liquid layer, separate a day from a year, and explain why June has different seasons in Morocco and Australia. Answer the checks below, then revisit any explanation you misunderstood. Correct answers are practice evidence; later recall and explanation in your own words are needed for durable understanding.',
    },
  ],
  questions: [
    q(
      'earth-day',
      'What mainly causes day and night?',
      ['Earth rotates', 'Earth orbits once each day', 'The Sun switches off'],
      0,
      'A location rotates into and out of sunlight. An orbit around the Sun takes about a year.',
    ),
    q(
      'earth-core',
      'Which layer is liquid?',
      ['Inner core', 'Outer core', 'Entire mantle'],
      1,
      'The outer core is liquid metal. The inner core is solid and most mantle material is solid.',
    ),
    q(
      'earth-evidence',
      'Why do seismic waves help us study Earth’s interior?',
      [
        'They photograph the core',
        'Their paths and speeds depend on materials',
        'They only travel on the surface',
      ],
      1,
      'Wave behavior reveals properties of material that cannot be observed directly.',
      2,
    ),
  ],
  sources: [
    nasa + 'earth/facts/',
    usgs + 'inside.html',
    'https://www.usgs.gov/faqs/are-tectonic-plates-floating-magma',
    'https://spaceplace.nasa.gov/seasons/en/',
  ],
};
function topic(
  id: string,
  title: string,
  category: Topic['category'],
  intro: string,
  text: string,
  prompt: string,
  correct: string,
  wrong: string[],
  source: string,
  diagram?: Topic['diagram'],
): Topic {
  return {
    id,
    title,
    category,
    intro,
    sections: [{ title: 'Observe · explain · apply', text }],
    questions: [q(id + '-check', prompt, [wrong[0]!, correct, ...wrong.slice(1)], 1, text, 2)],
    sources: [source],
    diagram,
  };
}
const planetNotes: Record<string, string> = {
  mercury:
    'Mercury has a heavily cratered surface. With almost no atmosphere to redistribute heat, daytime and nighttime temperatures differ enormously. A short year does not imply a short solar day.',
  venus:
    'Venus rotates in the opposite direction to most planets. Its dense atmosphere traps heat strongly, so being farther from the Sun than Mercury does not make its surface cooler.',
  mars: 'Iron-bearing minerals have oxidized in Martian rocks and dust, giving the planet its reddish appearance. Ancient channels and mineral evidence indicate that liquid water existed in its past. This is not evidence that people can breathe there.',
  jupiter:
    'Jupiter is a gas giant. Cloud bands and storms are features of its atmosphere, not markings on a rocky surface. Spacecraft measurements help us infer its interior.',
  saturn:
    'Saturn’s rings consist of many separate particles, mostly water ice with rocky material. They are not a single solid disk. All four giant planets have rings.',
  uranus:
    'Uranus spins with an unusually large axial tilt, almost on its side. Its blue-green color is associated with methane absorbing red light in its atmosphere.',
  neptune:
    'Neptune is the farthest of the eight planets from the Sun. It receives little sunlight but still has powerful atmospheric winds. Distance alone does not explain every atmospheric process.',
};
const spaceTopics = planets
  .filter((p) => p.id !== 'earth')
  .map((p) =>
    topic(
      p.id,
      p.id.charAt(0).toUpperCase() + p.id.slice(1),
      'Space',
      p.atmosphere,
      planetNotes[p.id]!,
      `Which description fits ${p.id}?`,
      p.atmosphere,
      ['A breathable atmosphere identical to Earth’s.', 'A star powered by fusion.'],
      nasa + p.id + '/facts/',
    ),
  );
export const topics: Topic[] = [
  earth,
  topic(
    'seasons',
    'Earth’s motion & seasons',
    'Earth',
    'Separate rotation, revolution, tilt and time zones.',
    'The tilted axis keeps nearly the same direction through an orbit. In June the north receives longer daylight; in December the south does. Rotation causes day and night. Time zones organize civil clocks, and their political boundaries do not form perfectly straight longitude strips.',
    'Why are seasons opposite in the two hemispheres?',
    'Earth’s tilt changes sunlight angle and day length',
    ['The Sun becomes colder in the south', 'Earth stops rotating in winter'],
    'https://spaceplace.nasa.gov/seasons/en/',
    'seasons',
  ),
  topic(
    'continents',
    'Seven continents, one connected world',
    'Earth',
    'Locate Africa, Antarctica, Asia, Europe, North America, South America and Australia.',
    'The seven-continent model is a convention used in many schools; other models group land differently. Europe and Asia share a continuous landmass. The Pacific, Atlantic, Indian, Southern and Arctic oceans connect into one global ocean. Use the map to compare Morocco in Africa with Brazil in South America.',
    'Which pair shares a continuous landmass?',
    'Europe and Asia',
    ['Antarctica and Africa', 'Australia and South America'],
    'https://www.nationalgeographic.org/encyclopedia/continent/',
  ),
  topic(
    'landscapes',
    'Mountains, rivers & changing landscapes',
    'Earth',
    'Investigate deserts, forests, lakes and islands.',
    'Mountains can grow through tectonic processes and are worn down by weathering and erosion. Rivers carry water and sediment downhill. Lakes store inland water; islands are surrounded by water. Deserts are defined by low precipitation, not by heat: Antarctica is a polar desert. Forests depend on climate, soils and disturbance.',
    'Can a desert be cold?',
    'Yes: low precipitation defines a desert',
    ['No: every desert is hot', 'Only if it has sand dunes'],
    'https://www.usgs.gov/special-topics/water-science-school/science/water-cycle',
  ),
  topic(
    'plates',
    'Earthquakes & moving plates',
    'Science',
    'Explore convergent, divergent and transform boundaries.',
    'Tectonic plates contain crust and rigid upper mantle. At divergent boundaries they separate; at convergent boundaries they approach; at transform boundaries they slide past. Stress can accumulate on locked faults. Sudden slip releases seismic waves. A diagram exaggerates movement: real plate motion is usually measured in centimeters per year.',
    'What releases energy in most tectonic earthquakes?',
    'Sudden slip along a fault',
    ['A daily change in weather', 'Ocean tides stopping'],
    'https://www.usgs.gov/programs/earthquake-hazards/science-earthquakes',
    'plates',
  ),
  topic(
    'volcanoes',
    'How volcanoes erupt',
    'Science',
    'Follow magma from depth to the surface.',
    'Magma forms where rock partially melts. Rising magma and expanding gases can feed eruptions; magma at the surface is called lava. Volcanoes occur at some plate boundaries and at hotspots. Not every earthquake causes an eruption and not every eruption is explosive.',
    'What is magma called when it reaches the surface?',
    'Lava',
    ['Outer core', 'A tectonic plate'],
    'https://pubs.usgs.gov/gip/volc/tectonics.html',
    'plates',
  ),
  topic(
    'weather',
    'Weather, hurricanes & ocean currents',
    'Science',
    'Distinguish a weather event from a climate pattern.',
    'Weather is the short-term state of the atmosphere; climate describes longer-term patterns. Uneven heating, moisture and rotation shape circulation. Tropical cyclones draw energy from warm ocean water under suitable atmospheric conditions. Winds, density differences and rotation help drive ocean currents. A tsunami is usually caused by displacement of water, often by an undersea earthquake, not by hurricane winds.',
    'Which is a climate statement?',
    'A region typically has dry summers',
    ['It rained at noon today', 'Tomorrow may be windy'],
    'https://oceanservice.noaa.gov/facts/weather_climate.html',
  ),
  ...spaceTopics,
  topic(
    'sun',
    'The Sun',
    'Space',
    'Meet the star that powers our planetary system.',
    'The Sun is a star: fusion in its core converts hydrogen into helium and releases energy. Its gravity holds the solar system together. Planets shine mainly by reflecting sunlight. Never look directly at the Sun without appropriate solar-viewing protection.',
    'Why does the Sun emit so much energy?',
    'Nuclear fusion in its core',
    ['It reflects light from Earth', 'It burns wood'],
    'https://science.nasa.gov/sun/facts/',
  ),
  topic(
    'moon',
    'Earth’s Moon',
    'Space',
    'Explore phases without confusing them with eclipses.',
    'Half of the Moon is normally sunlit. Its phases change as our viewing geometry changes over its orbit. The Moon rotates once per orbit, keeping nearly the same face toward Earth. Lunar gravity contributes to tides; the Sun also contributes.',
    'What causes the ordinary lunar phases?',
    'Changing views of the sunlit half',
    ['Earth’s shadow every night', 'The Moon producing different amounts of light'],
    'https://science.nasa.gov/moon/facts/',
  ),
  topic(
    'small-bodies',
    'Dwarf planets, asteroids & comets',
    'Space',
    'Compare smaller members of the solar system.',
    'Dwarf planets such as Pluto orbit the Sun and are rounded by gravity but have not cleared their orbital neighborhoods. Asteroids are generally rocky or metallic. Comets contain volatile ices that can release gas and dust near the Sun. A comet’s tails are shaped by radiation and the solar wind, not simply dragged behind like smoke.',
    'Which object can develop gas and dust tails near the Sun?',
    'A comet',
    ['A continent', 'A tectonic plate'],
    'https://science.nasa.gov/solar-system/',
  ),
  topic(
    'stars',
    'Stars & nebulae',
    'Space',
    'Connect clouds of gas to stellar life cycles.',
    'Stars can form in cold, dense regions of gas and dust. Gravity pulls material together; sufficiently hot, dense cores can sustain fusion. Nebulae are clouds of gas and dust, some associated with forming stars and others with dying stars. Not every nebula is a star nursery.',
    'What is a nebula?',
    'A cloud of gas and dust',
    ['A solid planet', 'A type of ocean'],
    'https://science.nasa.gov/universe/stars/',
  ),
  topic(
    'galaxies',
    'Galaxies & the Milky Way',
    'Space',
    'Place our solar system in a much larger structure.',
    'A galaxy contains stars, gas, dust and dark matter bound by gravity. Our solar system belongs to the Milky Way, a barred spiral galaxy. The Sun is one star among its vast stellar population. A light-year measures distance, not time.',
    'What does a light-year measure?',
    'Distance',
    ['The age of a planet', 'A star’s temperature'],
    'https://science.nasa.gov/universe/galaxies/',
  ),
  topic(
    'black-holes',
    'Black holes & the observable universe',
    'Space',
    'Learn what evidence can and cannot tell us.',
    'A black hole has a boundary called an event horizon beyond which light cannot escape outward. It does not suck in everything in the universe. We infer black holes from effects on matter and light. The observable universe is the region from which light has had time to reach us; it need not be the whole universe.',
    'Is the observable universe necessarily the entire universe?',
    'No: it is limited by what can be observed',
    ['Yes: everything beyond it is known to be empty', 'Yes: telescopes see infinitely far'],
    'https://science.nasa.gov/universe/black-holes/',
  ),
  topic(
    'amazon',
    'Explore the Amazon rainforest',
    'Nature',
    'Trace energy through a forest ecosystem.',
    'Plants use sunlight to make sugars. Herbivores eat plants, predators eat other animals, and decomposers recycle nutrients. Rainforest layers offer different habitats for insects, birds and mammals. Deforestation can fragment habitat and disrupt water cycling. Protecting connected habitat helps more than a single charismatic species.',
    'Where does most energy entering this food web originate?',
    'Sunlight captured by plants',
    ['Predators making energy from nothing', 'The soil producing sunlight'],
    'https://science.nasa.gov/kids/earth/mission-biomes/biorainforest/',
  ),
  topic(
    'deep-ocean',
    'Discover life in the deep ocean',
    'Nature',
    'Investigate life beyond sunlight.',
    'Sunlight does not reach most of the deep ocean. Many organisms rely on organic matter sinking from above. At hydrothermal vents, microbes can use chemical energy to make organic material, supporting local food webs. Deep-ocean organisms face high pressure, and many habitats recover slowly from disturbance.',
    'What supports a hydrothermal-vent food web?',
    'Chemical energy used by microbes',
    ['Sunlight reaching every seafloor', 'Coral plants growing in total darkness'],
    'https://oceanservice.noaa.gov/facts/vents.html',
  ),
  topic(
    'habitats',
    'Animals, plants & habitats',
    'Nature',
    'Compare polar, desert, forest and marine adaptations.',
    'Polar bears are adapted to Arctic marine environments; penguins are native to the Southern Hemisphere. Desert plants can conserve water with specialized leaves or stems. Birds, insects and mammals occupy diverse habitats: there is no single habitat shared by every member of a group. Climate and habitat loss can threaten species; conservation status must be checked for each species and date.',
    'Which pairing is appropriate?',
    'Polar bear — Arctic sea ice',
    ['Polar bear — Antarctic penguin colony', 'All insects — deep ocean'],
    'https://www.fisheries.noaa.gov/species-directory',
  ),
  topic(
    'green-turtle',
    'Green turtle · coastal grazer',
    'Nature',
    'Connect a marine reptile to seagrass habitats.',
    'Adult green turtles feed mainly on seagrass and algae. They breathe air and must reach the surface. Females nest on land, so conservation must protect feeding grounds and beaches. Fishing bycatch, habitat degradation and vessel strikes are threats. NOAA lists different populations as threatened or endangered under the US Endangered Species Act; status is population-specific.',
    'Which habitat pair matters to a green turtle?',
    'Marine feeding areas and nesting beaches',
    ['Only deep ocean trenches', 'Only freshwater lakes'],
    'https://www.fisheries.noaa.gov/species/green-turtle',
  ),
  topic(
    'blue-whale',
    'Blue whale · ocean giant',
    'Nature',
    'Distinguish a marine mammal from a fish.',
    'Blue whales are mammals that breathe air and feed mainly on tiny crustaceans called krill, filtered through baleen. Their large size does not make them predators of large fish. Ship strikes and entanglement threaten recovery from historical commercial whaling. NOAA lists the blue whale as endangered under the US Endangered Species Act.',
    'What does a blue whale mainly filter from seawater?',
    'Krill',
    ['Seagrass', 'Large sharks'],
    'https://www.fisheries.noaa.gov/species/blue-whale',
  ),
  topic(
    'pollinators',
    'Insects & flowering plants',
    'Nature',
    'Investigate a partnership rather than a one-way service.',
    'Many insects visit flowers for nectar or pollen. During visits, pollen can move between flowers and enable reproduction. Not all plants need insect pollination: grasses commonly use wind. Diverse native flowering plants, fewer harmful pesticide exposures and suitable nesting habitat can support pollinators.',
    'Which action can support local pollinating insects?',
    'Provide diverse native flowering plants and nesting habitat',
    ['Remove every flowering plant', 'Assume all insects are pests'],
    'https://www.fws.gov/initiative/pollinators',
  ),
  topic(
    'birds',
    'Birds · feathers, flight & migration',
    'Nature',
    'Classify animals using features, not a single behavior.',
    'All living birds have feathers, but not all birds fly. Penguins use modified wings underwater; many other birds migrate between seasonal habitats. Migration can connect conservation problems across countries. Protecting breeding sites alone may not protect wintering grounds or stopover sites.',
    'Does every bird fly through the air?',
    'No: penguins are flightless birds',
    ['Yes, by definition', 'No: penguins are fish'],
    'https://www.fws.gov/program/migratory-birds',
  ),
  topic(
    'desert-life',
    'Desert & polar environments',
    'Nature',
    'Compare different solutions to scarce water and energy.',
    'Deserts receive little precipitation. Some desert mammals avoid daytime heat by being active at night, while many plants reduce water loss or store water. Polar environments have strongly seasonal light. Sea ice is habitat, not simply frozen scenery. A trait useful in one environment can become a disadvantage when conditions change.',
    'Why might a desert mammal be active at night?',
    'To avoid intense daytime heat',
    ['Because all deserts are dark', 'Because mammals do not need water'],
    'https://science.nasa.gov/kids/earth/mission-biomes/biodesert/',
  ),
  topic(
    'history',
    'Human history & civilizations',
    'History',
    'Learn to ask what a historical source can establish.',
    'Settlements, trade routes, languages and technologies change over time. Archaeological objects, buildings and written records provide different kinds of evidence. Fez’s medina preserves a long history of urban craft, learning and exchange. A monument cannot tell every person’s story: compare sources and distinguish documented events from legends.',
    'What strengthens a historical explanation?',
    'Comparing independent sources and their limits',
    ['Treating every legend as a dated fact', 'Using only one unexplained image'],
    'https://whc.unesco.org/en/list/170/',
  ),
];
export function getTopic(id: string) {
  return topics.find((t) => t.id === id);
}
export const countryDetails: Record<
  string,
  {
    capital: string;
    languages: string;
    area: string;
    climate: string;
    culture: string;
    places: string;
    sources: string[];
  }
> = {
  MAR: {
    capital: 'Rabat',
    languages: 'Arabic and Amazigh (official); Moroccan Darija is widely spoken.',
    area: '446,550 km² excluding Western Sahara; territorial definitions differ across sources.',
    climate:
      'Atlantic and Mediterranean coastal influences, mountain climates in the Atlas, and dry interior environments.',
    culture:
      'Amazigh and Arab traditions are central to Morocco’s diverse cultural heritage. Fez is known for historic scholarship, urban crafts and its medina.',
    places: 'Medina of Fez, Atlas Mountains, historic Marrakech.',
    sources: [
      'https://data.un.org/legacy/en/iso/ma.html',
      'https://whc.unesco.org/en/list/170/',
      'https://www.visitmorocco.com/en/useful-information/language',
    ],
  },
  BRA: {
    capital: 'Brasília',
    languages: 'Portuguese (official), alongside many Indigenous languages.',
    area: '8,515,767 km² (UN country profile).',
    climate:
      'Equatorial rainforest, tropical savanna and subtropical environments occur in different regions.',
    culture:
      'Brazil’s history includes Indigenous societies, Portuguese colonization, slavery and subsequent social change. Contemporary traditions reflect many communities.',
    places: 'Amazon Basin, Brasília, Iguaçu Falls.',
    sources: ['https://data.un.org/legacy/en/iso/br.html', 'https://whc.unesco.org/en/list/445/'],
  },
};
export function countryQuestions(c: Country): Question[] {
  return [
    q(
      c.id + '-region',
      `Which region contains ${c.name}?`,
      [c.region, 'On the Moon', 'On Mars'],
      0,
      `${c.name} is classified in ${c.region} in the bundled Natural Earth dataset.`,
    ),
    ...(countryDetails[c.id]
      ? [
          q(
            c.id + '-capital',
            `What is the capital of ${c.name}?`,
            ['Casablanca', countryDetails[c.id]!.capital, 'Tokyo'],
            1,
            `The capital is ${countryDetails[c.id]!.capital}. A country's largest city need not be its capital.`,
          ),
        ]
      : []),
  ];
}
export const missions = [
  {
    id: 'continents',
    title: 'Discover the seven continents',
    goal: 'Use a continent model and compare two regions.',
    topics: ['continents', 'country:MAR', 'country:BRA'],
  },
  {
    id: 'morocco',
    title: 'Find Morocco on the globe',
    goal: 'Select Morocco on the map, then identify its region and capital.',
    topics: ['country:MAR'],
    map: 'MAR',
  },
  {
    id: 'ocean',
    title: 'Explore the depths of the ocean',
    goal: 'Explain a food web that can operate without sunlight.',
    topics: ['deep-ocean'],
  },
  {
    id: 'mars',
    title: 'Journey to Mars',
    goal: 'Compare a rocky planet with Earth.',
    topics: ['earth', 'mars'],
  },
  {
    id: 'volcanoes',
    title: 'Discover how volcanoes erupt',
    goal: 'Connect moving plates, magma and lava.',
    topics: ['plates', 'volcanoes'],
  },
  {
    id: 'seasons',
    title: 'Learn why seasons change',
    goal: 'Use tilt to explain opposite hemispheric seasons.',
    topics: ['earth', 'seasons'],
  },
  {
    id: 'solar',
    title: 'Explore the Solar System',
    goal: 'Distinguish the eight planets, our star and smaller bodies.',
    topics: ['sun', ...planets.map((p) => p.id), 'moon', 'small-bodies'],
  },
  {
    id: 'history',
    title: 'Travel through human history',
    goal: 'Use sources to examine a place and its heritage.',
    topics: ['history', 'country:MAR'],
  },
  {
    id: 'amazon',
    title: 'Explore the Amazon rainforest',
    goal: 'Trace energy through an ecosystem and locate Brazil.',
    topics: ['amazon', 'country:BRA'],
  },
];
export function questionsFor(id: string) {
  return id.startsWith('country:')
    ? countryQuestions(countries.find((c) => c.id === id.slice(8))!)
    : getTopic(id)?.questions || [];
}
export function titleFor(id: string) {
  return id.startsWith('country:')
    ? countries.find((c) => c.id === id.slice(8))?.name || id
    : getTopic(id)?.title || id;
}
export function tutorWorldContext(id: string) {
  const t = getTopic(id);
  const c = countries.find((c) => 'country:' + c.id === id);
  return t
    ? {
        topic: t.title,
        reviewedAt,
        material: t.sections,
        sources: t.sources,
        rule: 'Use this reviewed material. Label uncertainty and speculation. Do not invent live observations. Adapt to the learner and requested language.',
      }
    : c
      ? {
          topic: c.name,
          reviewedAt,
          region: c.region,
          population: c.population,
          populationYear: c.year,
          details: countryDetails[c.id],
          source: mapSource,
          rule: 'Historical estimates, not live data. Do not invent missing country information.',
        }
      : undefined;
}
