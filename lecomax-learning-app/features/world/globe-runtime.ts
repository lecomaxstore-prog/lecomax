import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import map from './map.json';
import { inCountry } from './geometry';
const view = document.getElementById('view')!;
const status = document.getElementById('status')!;
const select = document.getElementById('country') as HTMLSelectElement;
const labelRoot = document.getElementById('labels')!;
const button = (id: string) => document.getElementById(id) as HTMLButtonElement;
let selected = '',
  flat = false,
  labels = true,
  borders = true,
  renderer: THREE.WebGLRenderer | undefined,
  controls: OrbitControls | undefined;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#071629');
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 0, 3.3);
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 2048;
textureCanvas.height = 1024;
const ctx = textureCanvas.getContext('2d')!;
const texture = new THREE.CanvasTexture(textureCanvas);
texture.colorSpace = THREE.SRGBColorSpace;
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 40),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0.05 }),
);
scene.add(sphere, new THREE.AmbientLight(0xffffff, 2));
const sun = new THREE.DirectionalLight(0xdaf5ff, 2);
sun.position.set(-3, 3, 5);
scene.add(sun);
const flatCanvas = document.createElement('canvas');
flatCanvas.setAttribute('aria-label', 'Selectable world map');
flatCanvas.width = 1024;
flatCanvas.height = 512;
const flatCtx = flatCanvas.getContext('2d')!;
function paint() {
  ctx.fillStyle = '#103d60';
  ctx.fillRect(0, 0, 2048, 1024);
  for (const c of map) {
    ctx.beginPath();
    for (const poly of c.polygons)
      for (const ring of poly) {
        let prev: number | undefined;
        for (const [lon, lat] of ring) {
          const x = ((lon! + 180) / 360) * 2048,
            y = ((90 - lat!) / 180) * 1024;
          if (prev === undefined || Math.abs(x - prev) > 1024) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          prev = x;
        }
        ctx.closePath();
      }
    ctx.fillStyle = c.id === selected ? '#f6c66e' : '#427d72';
    ctx.fill('evenodd');
    if (borders) {
      ctx.strokeStyle = '#9bc0b0';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }
  texture.needsUpdate = true;
  flatCtx.drawImage(textureCanvas, 0, 0, 1024, 512);
  if (flat && labels) {
    flatCtx.font = '11px sans-serif';
    flatCtx.fillStyle = '#fff';
    for (const c of map.filter(
      (c) =>
        c.id === selected ||
        ['MAR', 'BRA', 'USA', 'CHN', 'AUS', 'IND', 'RUS', 'ZAF'].includes(c.id),
    ))
      flatCtx.fillText(c.name, ((c.lon + 180) / 360) * 1024, ((90 - c.lat) / 180) * 512);
  }
  render();
}
function vector(lon: number, lat: number) {
  const a = ((lon + 180) * Math.PI) / 180,
    b = (lat * Math.PI) / 180;
  return new THREE.Vector3(-Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b));
}
const labelNodes = map
  .filter((c) =>
    ['MAR', 'BRA', 'USA', 'CHN', 'AUS', 'IND', 'RUS', 'ZAF', 'JPN', 'FRA'].includes(c.id),
  )
  .map((c) => {
    const node = document.createElement('span');
    node.textContent = c.name;
    labelRoot.appendChild(node);
    return { c, node };
  });
function render() {
  if (!flat && renderer) {
    renderer.render(scene, camera);
    for (const { c, node } of labelNodes) {
      const v = vector(c.lon, c.lat),
        front = v.dot(camera.position.clone().sub(v)) > 0;
      const p = v.project(camera);
      node.style.display = labels && front ? 'block' : 'none';
      node.style.left = ((p.x + 1) * view.clientWidth) / 2 + 'px';
      node.style.top = ((-p.y + 1) * view.clientHeight) / 2 + 'px';
    }
  }
}
function resize() {
  view.style.height = flat ? `${view.clientWidth / 2}px` : '330px';
  if (renderer) {
    renderer.setSize(view.clientWidth, view.clientHeight);
    camera.aspect = view.clientWidth / view.clientHeight;
    camera.updateProjectionMatrix();
  }
  render();
}
function setMode(useFlat: boolean) {
  flat = useFlat;
  view.style.maxWidth = flat ? '660px' : 'none';
  view.style.margin = 'auto';
  flatCanvas.style.display = flat ? 'block' : 'none';
  if (renderer) renderer.domElement.style.display = flat ? 'none' : 'block';
  labelRoot.style.display = flat ? 'none' : 'block';
  button('mode').textContent = flat ? 'Use 3D globe' : 'Use 2D map';
  button('in').disabled = flat;
  button('out').disabled = flat;
  resize();
  paint();
}
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  view.prepend(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 1.35;
  controls.maxDistance = 5;
  controls.addEventListener('change', render);
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    setMode(true);
    status.textContent = '3D unavailable. Continue with the interactive 2D map.';
  });
} catch {
  flat = true;
}
view.prepend(flatCanvas);
new ResizeObserver(resize).observe(view);
function choose(id: string, focus = false) {
  const c = map.find((c) => c.id === id);
  if (!c) return;
  selected = id;
  button('open').disabled = false;
  select.value = id;
  if (focus) {
    camera.position.copy(vector(c.lon, c.lat).multiplyScalar(2.5));
    camera.lookAt(0, 0, 0);
    controls?.update();
  }
  status.textContent = c.name + ' · ' + c.region + ' · Select “Explore selected” to learn.';
  paint();
}
function emit() {
  if (!selected) return;
  const msg = { channel: 'world', id: selected };
  const bridge = (
    window as unknown as { ReactNativeWebView?: { postMessage: (s: string) => void } }
  ).ReactNativeWebView;
  if (bridge) bridge.postMessage(JSON.stringify(msg));
  else parent.postMessage(msg, '*');
}
for (const c of [...map].sort((a, b) => a.name.localeCompare(b.name))) {
  const option = document.createElement('option');
  option.value = c.id;
  option.textContent = c.name;
  select.appendChild(option);
}
select.addEventListener('change', () => choose(select.value, true));
button('open').onclick = emit;
button('open').disabled = true;
button('mode').onclick = () => {
  if (!renderer) {
    status.textContent = 'This device cannot initialize 3D. The 2D map remains available.';
    return;
  }
  setMode(!flat);
};
button('reset').onclick = () => {
  selected = '';
  button('open').disabled = true;
  select.value = '';
  camera.position.set(0, 0, 3.3);
  camera.lookAt(0, 0, 0);
  controls?.update();
  paint();
};
const zoom = (factor: number) => {
  camera.position.setLength(Math.max(1.35, Math.min(5, camera.position.length() * factor)));
  controls?.update();
  render();
};
button('in').onclick = () => zoom(0.85);
button('out').onclick = () => zoom(1.15);
button('label').onclick = () => {
  labels = !labels;
  button('label').textContent = 'Labels: ' + (labels ? 'on' : 'off');
  paint();
};
button('layer').onclick = () => {
  borders = !borders;
  button('layer').textContent = 'Borders: ' + (borders ? 'on' : 'off');
  paint();
};
view.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(e.key)) return;
  e.preventDefault();
  if (e.key === '+') zoom(0.85);
  else if (e.key === '-') zoom(1.15);
  else {
    const axis =
      e.key.includes('Left') || e.key.includes('Right')
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    camera.position.applyAxisAngle(
      axis,
      e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? 0.15 : -0.15,
    );
    camera.lookAt(0, 0, 0);
    controls?.update();
    render();
  }
});
let down: { x: number; y: number } | undefined;
let multiple = false;
const pointers = new Set<number>();
view.addEventListener('pointerdown', (e) => {
  pointers.add(e.pointerId);
  multiple = pointers.size > 1;
  if (pointers.size === 1) down = { x: e.clientX, y: e.clientY };
});
view.addEventListener('pointercancel', (e) => {
  pointers.delete(e.pointerId);
  down = undefined;
});
view.addEventListener('pointerup', (e) => {
  pointers.delete(e.pointerId);
  if (!down || multiple || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) {
    if (!pointers.size) {
      down = undefined;
      multiple = false;
    }
    return;
  }
  down = undefined;
  const r = view.getBoundingClientRect();
  let lon: number, lat: number;
  if (flat) {
    lon = ((e.clientX - r.left) / r.width) * 360 - 180;
    lat = 90 - ((e.clientY - r.top) / r.height) * 180;
  } else {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      camera,
    );
    const hit = ray.intersectObject(sphere)[0];
    if (!hit?.uv) return;
    lon = hit.uv.x * 360 - 180;
    lat = hit.uv.y * 180 - 90;
  }
  const c = map.find((c) => inCountry(lon, lat, c.polygons));
  if (c) {
    choose(c.id);
    emit();
  }
});
resize();
setMode(flat);
