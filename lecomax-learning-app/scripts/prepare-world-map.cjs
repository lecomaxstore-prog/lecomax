const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../features/world');
const source = JSON.parse(fs.readFileSync(path.join(root, 'countries.geojson'), 'utf8'));
const countries = source.features.map(({ properties: p, geometry: g }) => ({
  id: p.ADM0_A3,
  name: p.NAME_EN || p.NAME,
  fr: p.NAME_FR,
  ar: p.NAME_AR,
  iso: p.ISO_A2_EH,
  region: p.SUBREGION,
  continent: p.CONTINENT,
  population: p.POP_EST,
  year: p.POP_YEAR,
  lon: p.LABEL_X,
  lat: p.LABEL_Y,
  polygons: (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map((poly) =>
    poly.map((ring) => ring.map((p) => p.map((n) => +n.toFixed(3)))),
  ),
}));
fs.writeFileSync(path.join(root, 'map.json'), JSON.stringify(countries));
console.log(`Prepared ${countries.length} Natural Earth features.`);
