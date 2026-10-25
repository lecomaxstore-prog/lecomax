/** Creator-hosted geometry: use the official embed/API, never extract or redistribute model files. */
export const hostedVehicle = {
  id: '2673357ae2364ecbac334ce2a2b74ceb',
  title: 'BMW M5 F90 2021',
  author: 'SQUIR3D',
  url: 'https://sketchfab.com/3d-models/bmw-m5-f90-2021-2673357ae2364ecbac334ce2a2b74ceb',
  authorUrl: 'https://sketchfab.com/SQUIR3D',
};
type Camera = { position: number[]; target: number[] };
type Channel = { color?: number[]; factor?: number; enable?: boolean; texture?: unknown };
type Material = { name: string; stateSetID: number; channels: Record<string, Channel> };
type ViewerAPI = {
  start: () => void; stop: () => void;
  addEventListener: (event: string, callback: (value?: { material?: Material }) => void) => void;
  getCameraLookAt: (callback: (error: unknown, camera: Camera) => void) => void;
  setCameraLookAt: (position: number[], target: number[], duration: number, callback?: (error: unknown) => void) => void;
  getMaterialList: (callback: (error: unknown, materials: Material[]) => void) => void;
  setMaterial: (material: Material, callback?: (error: unknown) => void) => void;
};
type Client = { init: (id: string, options: Record<string, unknown>) => void };
declare global { interface Window { Sketchfab?: new (version: string, frame: HTMLIFrameElement) => Client } }
let sdk: Promise<void> | undefined;
function loadSDK() {
  if (window.Sketchfab) return Promise.resolve();
  if (sdk) return sdk;
  sdk = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => { clearTimeout(timer); script.remove(); sdk = undefined; reject(Error('3D service unreachable')); };
    const timer = setTimeout(fail, 20000);
    script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.async = true;
    script.onload = () => { clearTimeout(timer); if (window.Sketchfab) resolve(); else fail(); };
    script.onerror = fail;
    document.head.append(script);
  });
  return sdk;
}
export class HostedCarViewer {
  private frame = document.createElement('iframe');
  private api?: ViewerAPI;
  private camera?: Camera;
  private paint?: Material;
  private disposed = false;
  private timer?: ReturnType<typeof setTimeout>;
  private cancelLoad?: () => void;
  private observer: IntersectionObserver;
  private visible = true;
  private active = true;
  ready = false;
  paintAvailable = false;
  constructor(private host: HTMLElement) {
    this.frame.className = 'hosted-car';
    this.frame.title = `${hostedVehicle.title} — interactive 3D by ${hostedVehicle.author}`;
    this.frame.allow = 'autoplay; fullscreen; xr-spatial-tracking';
    this.frame.allowFullscreen = true;
    this.frame.referrerPolicy = 'strict-origin-when-cross-origin';
    host.append(this.frame);
    this.observer = new IntersectionObserver(entries => { this.visible = !!entries[0]?.isIntersecting; this.updateActivity(); });
    this.observer.observe(host);
    document.addEventListener('visibilitychange', this.updateActivity);
  }
  async load() {
    await loadSDK();
    if (this.disposed) return;
    return new Promise<void>((resolve, reject) => {
      const fail = () => { clearTimeout(this.timer); this.cancelLoad = undefined; reject(Error('3D service unavailable')); };
      this.cancelLoad = () => { clearTimeout(this.timer); resolve(); };
      this.timer = setTimeout(fail, 90000);
      const client = new window.Sketchfab!('1.12.1', this.frame);
      client.init(hostedVehicle.id, {
        autostart: 1, camera: 0, dnt: 1, max_texture_size: 1024, preload: 0,
        success: (api: ViewerAPI) => {
          if (this.disposed) return;
          this.api = api;
          api.addEventListener('viewerready', () => {
            if (this.disposed) return;
            api.getCameraLookAt((error, camera) => {
              if (this.disposed) return;
              if (error || !camera?.position || !camera?.target) { fail(); return; }
              this.camera = camera;
              api.getMaterialList((materialError, materials) => {
                if (this.disposed) return;
                // Exact creator material inspected via the public API; never recolor glass/trim/tyres.
                this.paint = !materialError ? materials.find(m => m.name === 'body') : undefined;
                this.paintAvailable = !!this.paint && ['AlbedoPBR', 'DiffusePBR', 'DiffuseColor'].some(key => this.paint!.channels[key]?.enable && !this.paint!.channels[key]?.texture);
                clearTimeout(this.timer); this.cancelLoad = undefined;
                this.ready = true; this.reset(); this.updateActivity(); resolve();
              });
            });
          });
          api.start();
        }, error: fail,
      });
    });
  }
  reset() {
    if (!this.camera || !this.api) return;
    const { position, target } = this.camera;
    // Creator's default is closely cropped. Pull back without changing the actual car geometry.
    const aspect = this.host.clientWidth / Math.max(1, this.host.clientHeight);
    const scale = Math.max(1.5, Math.min(2.5, 1.5 / aspect));
    this.api.setCameraLookAt(position.map((n, i) => target[i]! + (n - target[i]!) * scale), target, 0.6);
  }
  setPaint(hex: string) {
    if (!this.paintAvailable || !this.paint || !/^#[0-9a-f]{6}$/i.test(hex)) return;
    const material: Material = JSON.parse(JSON.stringify(this.paint));
    const rgb = [1, 3, 5].map(offset => { const value = parseInt(hex.slice(offset, offset + 2), 16) / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
    for (const key of ['AlbedoPBR', 'DiffusePBR', 'DiffuseColor']) {
      const channel = material.channels[key];
      if (channel?.enable && !channel.texture) { channel.color = rgb; channel.factor = 1; }
    }
    this.api?.setMaterial(material);
  }
  setActive(active: boolean) { this.active = active; this.updateActivity(); }
  private updateActivity = () => { if (!this.ready || this.disposed) return; if (this.active && this.visible && !document.hidden) this.api?.start(); else this.api?.stop(); };
  dispose() {
    this.disposed = true; this.cancelLoad?.(); clearTimeout(this.timer);
    this.observer.disconnect(); document.removeEventListener('visibilitychange', this.updateActivity);
    this.api?.stop(); this.frame.remove(); this.api = undefined;
  }
}
