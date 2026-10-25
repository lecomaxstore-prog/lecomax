import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { validateManifest, type ModelManifest } from './vehicle';
import { createLocalCar, type LocalCar, type Opening } from './local-car';
import { loadDetailedCar } from './detailed-car';

export type ViewMode = 'exterior' | 'xray' | 'chassis' | 'engine' | 'interior' | 'isolate' | 'explode';
export const cameras = { reset: [5, 3, 6], front: [0, 1, 7], rear: [0, 1, -7], side: [7, 1, 0], top: [0, 8, 0.01], underside: [0, -7, 0.01] } as const;
type MeshState = { mesh: THREE.Mesh; position: THREE.Vector3; materials: THREE.Material[]; original: THREE.Material | THREE.Material[]; part?: string };

/** One owner for GPU resources, listeners, fetch cancellation, and the render loop. */
export class CarViewer {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private environment: THREE.WebGLRenderTarget;
  private pmrem: THREE.PMREMGenerator;
  private records: MeshState[] = [];
  private root?: THREE.Group;
  private observer: ResizeObserver;
  private abort = new AbortController();
  private disposed = false;
  private frame = 0;
  private until = 0;
  private destination?: { position: THREE.Vector3; target: THREE.Vector3 };
  private labels = new Map<string, HTMLElement>();
  private selected = '';
  private mode: ViewMode = 'exterior';
  private paint = '';
  private pointer?: { x: number; y: number; time: number; multi: boolean };
  private lastTap = { time: 0, id: '' };
  private pointers = new Set<number>();
  private hidden = false;
  private manifest?: ModelManifest;
  private local?: LocalCar;
  private detailed = false;
  private openings: Record<Opening, boolean> = { doors: false, hood: false, trunk: false };
  private floor: THREE.Mesh;
  public available = new Set<string>();
  public paintAvailable = false;

  constructor(private host: HTMLElement, private onSelect: (id: string) => void, private status: (message: string) => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D vehicle. Drag to orbit, pinch to zoom, two fingers to pan.');
    this.renderer.domElement.style.touchAction = 'none';
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.15;
    this.controls.maxDistance = 20;
    this.controls.touches.ONE = THREE.TOUCH.ROTATE;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    this.camera.position.fromArray(cameras.reset);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = this.pmrem.fromScene(room, 0.04);
    room.dispose();
    this.scene.environment = this.environment.texture;
    this.scene.add(new THREE.HemisphereLight(0xc7e5ff, 0x303341, 2));
    const key = new THREE.DirectionalLight(0xffffff, 4); key.position.set(3, 5, 4); this.scene.add(key);
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .1, far: 18 });
    key.shadow.bias = -.001;
    this.floor = new THREE.Mesh(new THREE.CircleGeometry(5, 80), new THREE.ShadowMaterial({ opacity: .28 }));
    this.floor.rotation.x = -Math.PI / 2; this.floor.position.y = -.735; this.floor.receiveShadow = true; this.scene.add(this.floor);
    this.controls.addEventListener('change', this.wake);
    this.controls.addEventListener('start', this.cancelFlight);
    this.renderer.domElement.addEventListener('pointerdown', this.down);
    this.renderer.domElement.addEventListener('pointerup', this.up);
    this.renderer.domElement.addEventListener('pointercancel', this.cancelPointer);
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLost);
    this.observer = new ResizeObserver(this.resize); this.observer.observe(host);
    document.addEventListener('visibilitychange', this.visibility);
    this.resize();
  }
  private cancelFlight = () => { this.destination = undefined; };
  private contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(this.frame); this.frame = 0; this.hidden = true; this.status('Graphics context lost. Retry the viewer.'); };
  private visibility = () => this.setActive(!document.hidden);
  setActive(active: boolean) { this.hidden = !active; if (this.hidden) { cancelAnimationFrame(this.frame); this.frame = 0; } else this.wake(); }
  private resize = () => {
    if (this.disposed) return;
    const { width, height } = this.host.getBoundingClientRect();
    this.camera.aspect = Math.max(width, 1) / Math.max(height, 1); this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height); this.wake();
  };
  private wake = () => { this.until = performance.now() + 800; if (!this.frame && !this.hidden && !this.disposed) this.frame = requestAnimationFrame(this.render); };
  private render = () => {
    this.frame = 0;
    if (this.disposed || this.hidden) return;
    if (this.destination) {
      this.camera.position.lerp(this.destination.position, 0.12); this.controls.target.lerp(this.destination.target, 0.12);
      if (this.camera.position.distanceTo(this.destination.position) < 0.005 && this.controls.target.distanceTo(this.destination.target) < 0.005) this.destination = undefined;
    }
    let moving = false;
    if (this.local) for (const name of ['doors', 'hood', 'trunk'] as Opening[]) for (const hinge of this.local.hinges[name]) {
      const target = this.openings[name] ? hinge.angle : 0;
      const delta = target - hinge.group.rotation[hinge.axis];
      if (Math.abs(delta) > .001) { hinge.group.rotation[hinge.axis] += delta * .14; moving = true; }
      else hinge.group.rotation[hinge.axis] = target;
    }
    this.controls.update(); this.renderer.render(this.scene, this.camera);
    for (const [id, label] of this.labels) {
      const bounds = this.bounds(id); const point = bounds.getCenter(new THREE.Vector3()).project(this.camera);
      const visible = this.records.some(r => r.part === id && r.mesh.visible);
      label.hidden = !visible || point.z > 1 || point.z < -1 || Math.abs(point.x) > 1 || Math.abs(point.y) > 1;
      label.style.left = `${(point.x + 1) * 50}%`; label.style.top = `${(1 - point.y) * 50}%`;
    }
    if (moving || this.destination || performance.now() < this.until) this.frame = requestAnimationFrame(this.render);
  };
  private down = (e: PointerEvent) => {
    this.pointers.add(e.pointerId);
    if (this.pointers.size > 1 && this.pointer) this.pointer.multi = true;
    else this.pointer = { x: e.clientX, y: e.clientY, time: performance.now(), multi: false };
  };
  private cancelPointer = (e: PointerEvent) => { this.pointers.delete(e.pointerId); this.pointer = undefined; };
  private up = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    const start = this.pointer;
    if (!start || start.multi || Math.hypot(start.x - e.clientX, start.y - e.clientY) > 8 || performance.now() - start.time > 550) return;
    this.pointer = undefined;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), this.camera);
    // Include visible unmapped surfaces as occluders: never select hidden internals through opaque bodywork.
    const hits = ray.intersectObjects(this.records.filter(r => r.mesh.visible && !(this.mode === 'xray' && r.part === 'body')).map(r => r.mesh), false);
    const hit = hits[0]; const id = this.records.find(r => r.mesh === hit?.object)?.part;
    if (!id) return;
    this.onSelect(id); this.select(id, false);
    if (this.lastTap.id === id && performance.now() - this.lastTap.time < 350) this.focus(id);
    this.lastTap = { id, time: performance.now() };
  };
  loadLocal() {
    this.local = createLocalCar(); this.root = this.local.root;
    this.root.position.y = -.73;
    this.registerLocal();
  }
  async loadDetailed(base64: string) {
    const assembly = await loadDetailedCar(base64);
    if (this.disposed) { this.disposeTree(assembly.root); return; }
    this.local = assembly; this.root = assembly.root; this.detailed = true;
    const bounds = new THREE.Box3().setFromObject(this.root);
    this.root.position.sub(bounds.getCenter(new THREE.Vector3()));
    this.floor.position.y = -bounds.getSize(new THREE.Vector3()).y / 2 - .01;
    this.registerLocal();
  }
  private registerLocal() {
    if (!this.root) return;
    this.root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const original = object.material;
      const materials = (Array.isArray(original) ? original : [original]).map(m => m.clone());
      object.material = Array.isArray(original) ? materials : materials[0]!;
      const part = object.userData.part as string;
      this.available.add(part);
      this.records.push({ mesh: object, position: object.position.clone(), materials, original, part });
    });
    this.paintAvailable = true; this.scene.add(this.root); this.preset('reset');
  }
  toggleOpening(name: Opening) {
    if (!this.local) return false;
    this.openings[name] = !this.openings[name]; this.wake(); return this.openings[name];
  }
  resetAssembly() {
    this.openings = { doors: false, hood: false, trunk: false };
    this.selected = ''; this.mode = 'exterior'; this.apply(); this.preset('reset');
  }
  cockpit() {
    this.mode = 'exterior'; this.selected = ''; this.apply();
    this.camera.fov = 75; this.camera.updateProjectionMatrix();
    const steering = this.root?.getObjectByName('InteriorSteeringWheel01_surface');
    if (this.detailed && steering) {
      const wheel = new THREE.Box3().setFromObject(steering).getCenter(new THREE.Vector3());
      this.destination = { position: wheel.clone().add(new THREE.Vector3(0, .27, -.60)), target: wheel.clone().add(new THREE.Vector3(-.12, .08, .55)) };
    } else this.destination = { position: new THREE.Vector3(-.42, .46, .02), target: new THREE.Vector3(.03, .23, .66) };
    this.wake();
  }
  get isLocal() { return !!this.local; }
  async load(manifest: ModelManifest, progress: (percent: number | null) => void) {
    validateManifest(manifest); this.manifest = manifest;
    const timeout = setTimeout(() => this.abort.abort(), 45000);
    try {
      const response = await fetch(manifest.url, { signal: this.abort.signal, cache: 'force-cache', credentials: 'omit' });
      if (!response.ok) throw Error(`Model download failed (${response.status}).`);
      const total = Number(response.headers.get('content-length'));
      if (total > 32 * 1024 * 1024) throw Error('Model exceeds the 32 MB mobile budget.');
      const reader = response.body?.getReader(); let buffer: ArrayBuffer;
      if (reader) {
        const chunks: Uint8Array[] = []; let size = 0;
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          size += value.length; if (size > 32 * 1024 * 1024) { await reader.cancel(); throw Error('Model exceeds the mobile budget.'); }
          chunks.push(value); progress(total ? Math.min(99, Math.round(size / total * 100)) : null);
        }
        const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; } buffer = bytes.buffer;
      } else { buffer = await response.arrayBuffer(); if (buffer.byteLength > 32 * 1024 * 1024) throw Error('Model exceeds the mobile budget.'); }
      // Only self-contained GLB: no hidden network requests to unreviewed texture/buffer hosts.
      const header = new DataView(buffer);
      if (buffer.byteLength < 20 || header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2) throw Error('Expected a self-contained GLB 2.0 asset.');
      const jsonLength = header.getUint32(12, true);
      const metadata = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
      if ([...(metadata.buffers || []), ...(metadata.images || [])].some((entry: { uri?: string }) => entry.uri)) throw Error('External GLB resources are not supported. Embed all textures and buffers.');
      const gltf = await new GLTFLoader().parseAsync(buffer, '');
      if (this.disposed) { this.disposeTree(gltf.scene); return; }
      this.root = gltf.scene;
      let triangles = 0;
      const names = new Map<string, number>();
      this.root.traverse(object => { if (object instanceof THREE.Mesh) { triangles += (object.geometry.index?.count ?? object.geometry.attributes.position?.count ?? 0) / 3; names.set(object.name, (names.get(object.name) || 0) + 1); } });
      if (triangles > 300000) throw Error('Model exceeds the 300,000 triangle budget.');
      for (const name of Object.values(manifest.meshes).flat()) if (names.get(name) !== 1) throw Error(`Mapped mesh missing or ambiguous: ${name}`);
      this.root.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const original = object.material;
        const materials = (Array.isArray(original) ? original : [original]).map(m => m.clone());
        object.material = Array.isArray(original) ? materials : materials[0]!;
        const part = Object.entries(manifest.meshes).find(([, meshes]) => meshes.includes(object.name))?.[0];
        if (part) this.available.add(part);
        this.records.push({ mesh: object, position: object.position.clone(), materials, original, part });
      });
      this.paintAvailable = this.records.some(r => r.materials.some(m => manifest.paintMaterials.includes(m.name) && m instanceof THREE.MeshStandardMaterial));
      // Contract uses metres, +Y up, +Z forward. Translate only; never distort the asset.
      const bounds = new THREE.Box3().setFromObject(this.root); const center = bounds.getCenter(new THREE.Vector3());
      if (bounds.isEmpty() || bounds.getSize(new THREE.Vector3()).length() > 15) throw Error('Invalid model bounds or units. Export in metres.');
      this.root.position.sub(center); this.scene.add(this.root); progress(100); this.preset('reset');
    } finally { clearTimeout(timeout); }
  }
  supports(mode: ViewMode) {
    if (!this.root) return false;
    if (mode === 'xray') return this.available.has('body') && this.available.size > 1;
    if (mode === 'engine' || mode === 'interior') return this.available.has(mode);
    if (mode === 'chassis') return this.available.has('suspension') || this.available.has('differential');
    if (mode === 'explode') return this.available.size > 1;
    if (mode === 'isolate') return this.available.has(this.selected);
    return true;
  }
  setMode(mode: ViewMode) {
    if (!this.supports(mode)) return;
    this.mode = mode; this.apply();
    if (mode === 'engine' || mode === 'interior') this.focus(mode);
    else if (mode !== 'isolate') this.preset('reset');
  }
  select(id: string, focus = true) {
    this.selected = id;
    if (focus && this.available.has(id)) this.mode = id === 'body' || id === 'wheels' ? 'exterior' : id === 'interior' ? 'interior' : 'xray';
    this.apply(); if (focus && this.available.has(id)) this.focus(id);
  }
  setPaint(color: string) { if (/^#[0-9a-f]{6}$/i.test(color)) { this.paint = color; this.apply(); } }
  private apply() {
    this.records.forEach(record => record.mesh.position.copy(record.position));
    this.root?.updateWorldMatrix(true, true);
    const offsets = new Map([...this.available].map(id => [id, this.bounds(id).getCenter(new THREE.Vector3()).normalize().multiplyScalar(0.65)]));
    for (const record of this.records) {
      const { mesh, part, materials, original, position } = record;
      mesh.position.copy(position);
      mesh.visible = this.mode === 'isolate' ? part === this.selected : this.mode === 'engine' ? part === 'engine' : this.mode === 'interior' ? part === 'interior' : this.mode === 'chassis' ? !!part && ['suspension', 'differential', 'brakes', 'wheels', 'steering'].includes(part) : true;
      if (this.mode === 'explode' && part) {
        // Shared world-space displacement preserves each system's relative geometry.
        const direction = offsets.get(part)!;
        const parent = mesh.parent!; parent.updateWorldMatrix(true, false);
        const local = parent.worldToLocal(direction.clone()).sub(parent.worldToLocal(new THREE.Vector3())); mesh.position.add(local);
      }
      const originals = Array.isArray(original) ? original : [original];
      materials.forEach((material, index) => {
        material.copy(originals[index]!);
        if (material instanceof THREE.MeshStandardMaterial) {
          if (this.paint && (this.manifest?.paintMaterials.includes(material.name) || (this.local && (material.name === 'local-paint' || material.name === 'Paint 1 Carmine')))) material.color.set(this.paint);
          if (part === this.selected) { material.emissive.set('#258dcb'); material.emissiveIntensity = 0.4; }
        }
        if (this.mode === 'xray' && part === 'body') { material.transparent = true; material.opacity = 0.14; material.depthWrite = false; }
        material.needsUpdate = true;
      });
    }
    this.wake();
  }
  private bounds(id: string) { const box = new THREE.Box3(); this.records.filter(r => r.part === id).forEach(r => box.expandByObject(r.mesh)); return box; }
  focus(id: string) {
    this.camera.fov = 42; this.camera.updateProjectionMatrix();
    const box = this.bounds(id); if (box.isEmpty()) return;
    const target = box.getCenter(new THREE.Vector3()); const size = Math.max(box.getSize(new THREE.Vector3()).length(), 0.5);
    this.destination = { target, position: target.clone().add(this.camera.position.clone().sub(this.controls.target).normalize().multiplyScalar(size * 1.4)) }; this.wake();
  }
  preset(name: keyof typeof cameras) {
    this.camera.fov = 42; this.camera.updateProjectionMatrix();
    this.floor.visible = name !== 'underside';
    const position = new THREE.Vector3().fromArray(cameras[name]);
    // Keep the whole sedan in frame in narrow embedded/mobile viewports.
    if (this.detailed && name === 'reset') position.y = 2.3;
    position.multiplyScalar(this.detailed ? Math.max(.75, .76 / Math.max(.3, this.camera.aspect)) : Math.max(.95, .90 / Math.max(.3, this.camera.aspect)));
    this.destination = { target: new THREE.Vector3(), position }; this.wake();
  }
  quality(low: boolean) { this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 2)); this.resize(); }
  setLabels(names: Record<string, string> | null) {
    this.labels.forEach(label => label.remove()); this.labels.clear();
    if (names) for (const id of this.available) {
      const label = document.createElement('button'); label.className = 'mesh-label'; label.textContent = names[id] || id; label.onclick = () => { this.select(id); this.onSelect(id); }; this.host.append(label); this.labels.set(id, label);
    }
    this.wake();
  }
  private disposeTree(root: THREE.Object3D) {
    const textures = new Set<THREE.Texture>(); const materials = new Set<THREE.Material>(); const geometry = new Set<THREE.BufferGeometry>();
    root.traverse(object => { if (object instanceof THREE.Mesh) { geometry.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); } });
    this.records.forEach(r => (Array.isArray(r.original) ? r.original : [r.original]).forEach(m => materials.add(m)));
    materials.forEach(material => { Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }); material.dispose(); });
    textures.forEach(texture => { const image = texture.source?.data; if (typeof image?.close === 'function') image.close(); texture.dispose(); }); geometry.forEach(g => g.dispose());
  }
  dispose() {
    this.disposed = true; this.abort.abort(); cancelAnimationFrame(this.frame); this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.visibility); this.controls.dispose();
    this.renderer.domElement.removeEventListener('pointerdown', this.down); this.renderer.domElement.removeEventListener('pointerup', this.up); this.renderer.domElement.removeEventListener('pointercancel', this.cancelPointer); this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLost);
    if (this.root) this.disposeTree(this.root); this.floor.geometry.dispose(); (this.floor.material as THREE.Material).dispose();
    this.scene.traverse(object => { if (object instanceof THREE.DirectionalLight) object.shadow.dispose(); });
    this.labels.forEach(label => label.remove()); this.environment.dispose(); this.pmrem.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove(); this.records = [];
  }
}
