import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { LocalCar } from './local-car';

/** Reviewed bundled asset. Separate transform anchors keep child parts visible
 * when their parent mesh is hidden by a cutaway or isolation view. */
export async function loadDetailedCar(base64: string): Promise<LocalCar> {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer, '');
  const root = gltf.scene;
  const prepared = new Set<THREE.Material>();
  function convert(parent: THREE.Object3D, inherited = '') {
    for (const object of [...parent.children]) {
      const name = object.name || inherited;
      if (object instanceof THREE.Mesh) {
        const anchor = new THREE.Group(); anchor.name = object.name;
        anchor.position.copy(object.position); anchor.quaternion.copy(object.quaternion); anchor.scale.copy(object.scale);
        parent.add(anchor);
        for (const child of [...object.children]) anchor.add(child);
        anchor.add(object); object.position.set(0, 0, 0); object.quaternion.identity(); object.scale.set(1, 1, 1);
        object.name = `${name}_surface`;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const materialNames = materials.map(m => m.name).join(' ');
        object.userData.part = /Brake(Pad|Disc)/.test(name) ? 'brakes'
          : /Wheel|Tire|Rim|Axles/.test(name + inherited) ? 'wheels'
            : name === 'Engine' ? 'engine'
              : /^Interior/.test(name) ? 'interior'
                : /Headlight|Taillight|Turnsignal/.test(name) ? 'electrical' : 'body';
        object.userData.glass = /Glass/.test(materialNames);
        object.castShadow = !object.userData.glass; object.receiveShadow = true;
        // Preserve authored materials, textures, AO and clearcoat.
        for (const m of materials) if (m instanceof THREE.MeshStandardMaterial) {
          if (prepared.has(m)) continue;
          prepared.add(m);
          m.envMapIntensity = 1;
          if (m.name.startsWith('Paint 1')) m.normalScale.multiplyScalar(.25);
          // The app uses an alpha showroom background. Conventional transparent
          // glazing avoids a white transmission buffer inside the embedded frame.
          if (m.name === 'Glass' && m instanceof THREE.MeshPhysicalMaterial) {
            m.transmission = 0; m.transparent = true; m.opacity = .20;
            m.depthWrite = false; m.envMapIntensity = .3; m.roughness = .08;
          }
        }
        for (const child of [...anchor.children]) if (child !== object) convertChild(anchor, child, name);
      } else convert(object, name);
    }
  }
  function convertChild(parent: THREE.Object3D, child: THREE.Object3D, inherited: string) {
    const temporary = new THREE.Group(); parent.remove(child); temporary.add(child);
    convert(temporary, inherited); for (const converted of [...temporary.children]) parent.add(converted);
  }
  convert(root);
  const hinges: LocalCar['hinges'] = { doors: [], hood: [], trunk: [] };
  for (const [name, category, axis, angle] of [
    ['BodyDoorRColor1', 'doors', 'z', 1.05], ['BodyDoorLColor1', 'doors', 'z', -1.05],
    ['BodyHood', 'hood', 'x', 1.05], ['BodyRearPanelsColor1', 'trunk', 'x', -.85],
  ] as const) {
    const group = root.getObjectByName(name);
    if (!group) throw Error(`Bundled vehicle is missing ${name}`);
    hinges[category].push({ group, axis, angle });
  }
  return { root, hinges };
}
