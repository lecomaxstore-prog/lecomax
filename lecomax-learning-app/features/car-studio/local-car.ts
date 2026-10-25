import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Original, locally generated teaching assembly. Not BMW CAD or a repair reference.
 * Metres; +Z forward. Every visible component is assigned to a learning system. */
export type Opening = 'doors' | 'hood' | 'trunk';
export type LocalCar = { root: T.Group; hinges: Record<Opening, { group: T.Object3D; axis: 'x' | 'y' | 'z'; angle: number }[]> };
export function createLocalCar(): LocalCar {
  const root = new T.Group(); root.name = 'LECOMAX original sports sedan';
  const hinges: LocalCar['hinges'] = { doors: [], hood: [], trunk: [] };
  const material = (color: string, metalness = 0, roughness = .5) => new T.MeshStandardMaterial({ color, metalness, roughness });
  const paint = new T.MeshPhysicalMaterial({ color: '#244e75', metalness: .72, roughness: .24, clearcoat: 1, clearcoatRoughness: .15 }); paint.name = 'local-paint';
  const rubber = material('#14171b', 0, .94), black = material('#172027', .25, .38), leather = material('#a46941', 0, .8);
  const chrome = material('#c0cbd4', .9, .22), alloy = material('#737f87', .78, .34), dark = material('#283038', .7, .47);
  const glass = new T.MeshPhysicalMaterial({ color: '#789da9', metalness: .05, roughness: .08, transparent: true, opacity: .25, depthWrite: false, side: T.DoubleSide });
  const white = material('#d7f4ff'); white.emissive.set('#a9dcff'); white.emissiveIntensity = 2;
  const red = material('#a90c24'); red.emissive.set('#ff1634'); red.emissiveIntensity = 1.1;
  const brake = material('#bd8836', .65, .35);
  let serial = 0;
  function mesh(g: T.BufferGeometry, m: T.Material, x: number, y: number, z: number, part = 'body', parent: T.Object3D = root, name = part) {
    const o = new T.Mesh(g, m); o.name = `${name}_${serial++}`; o.position.set(x, y, z); o.userData.part = part; o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  }
  function box(w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material, part = 'body', parent: T.Object3D = root, r = .025) {
    return mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)), m, x, y, z, part, parent);
  }
  function tube(points: number[][], radius: number, m: T.Material, part: string, parent: T.Object3D = root) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(p[0], p[1], p[2])));
    return mesh(new T.TubeGeometry(curve, Math.max(10, points.length * 5), radius, 8, false), m, 0, 0, 0, part, parent);
  }
  function panel(points: number[][], m: T.Material, parent: T.Object3D = root, part = 'body') {
    const vertices: number[] = []; for (let i = 1; i < points.length - 1; i++) vertices.push(...points[0]!, ...points[i]!, ...points[i + 1]!);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.computeVertexNormals();
    const mat = m.clone(); mat.side = T.DoubleSide; return mesh(g, mat, 0, 0, 0, part, parent);
  }
  function cylinder(r: number, length: number, x: number, y: number, z: number, m: T.Material, part: string, axis: 'x' | 'y' | 'z' = 'y') {
    const o = mesh(new T.CylinderGeometry(r, r, length, 32), m, x, y, z, part); if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2; return o;
  }
  // Floor, sills, bulkheads and individual front/rear quarter panels.
  box(1.65, .12, 4.45, 0, .27, 0, dark);
  for (const s of [-1, 1]) {
    box(.13, .18, 2.16, s * .93, .42, -.03, paint);
    for (const z of [-1.47, 1.47]) {
      const shape = new T.Shape();
      shape.moveTo(-.71, -.19); shape.lineTo(-.71, .44); shape.quadraticCurveTo(0, .6, .71, .44); shape.lineTo(.71, -.19); shape.lineTo(.43, -.19);
      shape.absarc(0, 0, .43, 0, Math.PI, false); shape.lineTo(-.71, -.19);
      const quarter = mesh(new T.ExtrudeGeometry(shape, { depth: .08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .015, bevelThickness: .015 }), paint, s * .91, .39, z);
      quarter.rotation.y = s * Math.PI / 2;
      const arch = mesh(new T.TorusGeometry(.427, .018, 6, 40, Math.PI), black, s * 1.002, .39, z); arch.rotation.y = Math.PI / 2;
    }
    box(.22, .37, .37, s * .82, .60, 2.21, paint);
    box(.22, .36, .34, s * .82, .58, -2.20, paint);
  }
  // Nose, diffuser, grille slats and distinct light signatures.
  box(1.84, .24, .22, 0, .40, 2.34, paint, 'body', root, .06);
  box(1.76, .13, .13, 0, .28, 2.41, black);
  box(1.40, .20, .06, 0, .56, 2.47, black);
  for (let i = -10; i <= 10; i++) box(.023, .16, .036, i * .06, .56, 2.505, chrome);
  for (const s of [-1, 1]) {
    box(.59, .115, .14, s * .59, .78, 2.31, black);
    for (const x of [.39, .67]) {
      tube([[s * (x - .09), .80, 2.394], [s * (x - .09), .75, 2.402], [s * (x + .09), .75, 2.395]], .012, white, 'electrical');
    }
    box(.47, .10, .09, s * .65, .78, -2.34, red, 'electrical');
    box(.15, .16, .28, s * .62, .32, -2.38, black, 'exhaust');
    for (const x of [.56, .72]) { cylinder(.058, .20, s * x, .34, -2.48, chrome, 'exhaust', 'z'); cylinder(.044, .205, s * x, .34, -2.485, black, 'exhaust', 'z'); }
  }
  box(1.8, .22, .18, 0, .48, -2.34, paint);
  box(1.6, .12, .16, 0, .29, -2.39, black);
  for (let i = -3; i <= 3; i++) box(.018, .12, .24, i * .19, .29, -2.39, dark);
  box(.43, .12, .025, 0, .51, -2.445, chrome);
  // Opening bonnet and boot lid, each with an actual hinge and separate geometry.
  const hood = new T.Group(); hood.position.set(0, .91, .75); root.add(hood); hinges.hood.push({ group: hood, axis: 'x', angle: -1.05 });
  box(1.74, .09, 1.48, 0, -.025, .77, paint, 'body', hood, .04);
  for (const s of [-1, 1]) tube([[s * .46, .027, .1], [s * .50, .032, .75], [s * .63, .018, 1.40]], .009, paint, 'body', hood);
  const trunk = new T.Group(); trunk.position.set(0, .94, -1.40); root.add(trunk); hinges.trunk.push({ group: trunk, axis: 'x', angle: .95 });
  box(1.73, .09, .89, 0, 0, -.45, paint, 'body', trunk); box(1.62, .04, .10, 0, .075, -.84, black, 'body', trunk);
  box(1.50, .09, .79, 0, .51, -1.80, black, 'interior');
  // Cabin roof, transparent front/rear glass, pillars and four hinged doors.
  box(1.47, .075, 1.62, 0, 1.43, -.24, paint, 'body', root, .035);
  panel([[-.85,.94,.81],[.85,.94,.81],[.70,1.40,.53],[-.70,1.40,.53]], glass);
  panel([[-.70,1.40,-1.03],[.70,1.40,-1.03],[.86,.96,-1.51],[-.86,.96,-1.51]], glass);
  for (const s of [-1, 1]) {
    tube([[s*.87,.90,.87],[s*.72,1.43,.51],[s*.72,1.45,-1.02],[s*.89,.93,-1.51]], .035, paint, 'body');
    tube([[s*.91,.90,-.36],[s*.73,1.43,-.36]], .038, black, 'body');
    for (const front of [true, false]) {
      const pivotZ = front ? .76 : -.39; const length = front ? 1.10 : .94;
      const door = new T.Group(); door.position.set(s * .91, .91, pivotZ); root.add(door); hinges.doors.push({ group: door, axis: 'y', angle: -s * 1.05 });
      box(.065, .43, length, 0, -.22, -length/2, paint, 'body', door);
      box(.05, .20, length*.87, -s*.043, -.22, -length/2, leather, 'interior', door);
      box(.045, .045, .23, s*.048, -.09, -length*.80, chrome, 'body', door);
      box(.09, .065, .38, -s*.08, -.16, -length*.56, black, 'interior', door);
      const topFront = front ? -.23 : -.01; const topBack = front ? -length : -length*.66;
      panel([[0,.04,-.015],[0,.04,-length+.025],[-s*.19,.48,topBack],[-s*.19,.48,topFront]], glass, door);
      tube([[0,.045,-.01],[-s*.19,.49,topFront],[-s*.19,.49,topBack],[0,.045,-length+.01]], .014, chrome, 'body', door);
      if (front) {
        box(.20, .10, .24, s*.14, .05, -.08, paint, 'body', door);
        box(.16, .07, .015, s*.15, .06, -.207, chrome, 'body', door);
      }
    }
  }
  // Four wheels: toroidal tyres, machined rims, split spokes, lug bolts, discs, calipers.
  for (const x of [-.97, .97]) for (const z of [-1.47, 1.47]) {
    const sign = Math.sign(x), y = .39;
    const tyre = mesh(new T.TorusGeometry(.291, .097, 12, 56), rubber, x, y, z, 'wheels'); tyre.rotation.y = Math.PI / 2; tyre.scale.z = 1.40;
    for (const offset of [-.075, .075]) { const line = mesh(new T.TorusGeometry(.304, .012, 5, 48), dark, x + offset, y, z, 'wheels'); line.rotation.y = Math.PI/2; }
    cylinder(.254, .20, x, y, z, black, 'wheels', 'x');
    const rim = mesh(new T.TorusGeometry(.249, .018, 8, 48), chrome, x + sign*.11, y, z, 'wheels'); rim.rotation.y = Math.PI/2;
    cylinder(.205, .022, x + sign*.065, y, z, alloy, 'brakes', 'x');
    for (let i=0;i<18;i++) { const a=i*Math.PI*2/18; cylinder(.008,.025,x+sign*.08,y+Math.cos(a)*.173,z+Math.sin(a)*.173,black,'brakes','x'); }
    for (let i=0;i<5;i++) for (const shift of [-.065,.065]) {
      const a = i*Math.PI*2/5+shift;
      const spoke = box(.025,.23,.027,x+sign*.125,y+Math.cos(a)*.13,z+Math.sin(a)*.13,chrome,'wheels'); spoke.rotation.x = a;
    }
    cylinder(.068,.032,x+sign*.14,y,z,alloy,'wheels','x');
    for (let i=0;i<5;i++) { const a=i*Math.PI*2/5; cylinder(.011,.035,x+sign*.16,y+Math.cos(a)*.044,z+Math.sin(a)*.044,chrome,'wheels','x'); }
    box(.065,.19,.085,x+sign*.083,y+.02,z+.16,brake,'brakes');
    cylinder(.045,.34,x*.76,.64,z,chrome,'suspension');
    const spring: number[][]=[]; for(let i=0;i<=100;i++){const a=i/100*Math.PI*14; spring.push([x*.76+Math.cos(a)*.083,.49+i/100*.30,z+Math.sin(a)*.083]);}
    tube(spring,.012,brake,'suspension');
    tube([[x,.39,z],[x*.45,.29,z-.2],[x*.22,.33,z]],.03,alloy,'suspension');
    tube([[x,.39,z],[x*.50,.30,z+.18]],.024,alloy,'suspension');
    cylinder(.028,1.62,0,.36,z,dark,'differential','x');
  }
  // Generic longitudinal V8 assembly: crankcase, two banks, eight cylinder heads,
  // intake plenums, twin turbo housings, belts and individually routed pipes.
  box(.57,.27,.70,0,.48,1.29,alloy,'engine');
  for (const s of [-1,1]) {
    const bank=box(.24,.30,.72,s*.22,.68,1.28,dark,'engine'); bank.rotation.z=-s*.42;
    const cover=box(.22,.065,.75,s*.26,.83,1.28,black,'engine'); cover.rotation.z=-s*.42;
    for(let i=0;i<4;i++) {
      const z=1.01+i*.18; const head=cylinder(.078,.24,s*.21,.64,z,alloy,'engine'); head.rotation.z=-s*.42;
      box(.16,.012,.018,s*.26,.875,z,chrome,'engine');
      tube([[s*.34,.63,z],[s*.46,.56,z],[s*.39,.37,1.05]],.024,chrome,'exhaust');
    }
    const turbo=mesh(new T.TorusGeometry(.085,.036,10,24),alloy,s*.115,.87,1.35,'engine'); turbo.rotation.x=Math.PI/2;
    tube([[s*.13,.87,1.35],[s*.45,.90,1.62],[s*.62,.68,1.78]],.04,black,'engine');
    box(.28,.15,.31,s*.65,.69,1.8,black,'engine');
    tube([[s*.39,.39,1.10],[s*.22,.23,.6],[s*.24,.23,-1.43],[s*.58,.34,-2.36]],.035,chrome,'exhaust');
    box(.28,.13,.49,s*.40,.25,-1.83,alloy,'exhaust');
  }
  cylinder(.10,.075,0,.56,1.70,black,'engine','z');
  box(.43,.31,.74,0,.36,.57,alloy,'transmission');
  for(let i=0;i<7;i++) box(.46,.025,.04,0,.51,.25+i*.085,dark,'transmission');
  cylinder(.043,1.90,0,.30,-.48,chrome,'differential','z');
  box(.32,.25,.29,0,.35,-1.47,dark,'differential');
  box(1.24,.42,.075,0,.61,2.09,dark,'cooling');
  for(let i=0;i<20;i++) box(1.19,.008,.015,0,.42+i*.02,2.135,alloy,'cooling');
  tube([[.54,.78,2.07],[.59,.80,1.85],[.36,.69,1.6]],.028,black,'cooling');
  box(.29,.19,.24,-.65,.65,.97,black,'electrical');
  box(.04,.035,.045,-.73,.77,1.01,red,'electrical'); box(.04,.035,.045,-.56,.77,1.01,chrome,'electrical');
  tube([[-.73,.78,1.01],[-.69,.85,1.15],[-.46,.81,1.1]],.009,red,'electrical');
  cylinder(.04,1.37,0,.41,1.47,alloy,'steering','x');
  tube([[-.43,.93,.46],[-.40,.65,.75],[-.24,.42,1.47]],.024,alloy,'steering');
  // Cabin: shaped seats, bolsters, headrests, belts, consoles and instrument panel.
  box(1.58,.075,2.1,0,.40,-.35,black,'interior');
  for(const z of [.03,-.87]) for(const x of [-.44,.44]) {
    box(.53,.14,.52,x,.56,z,leather,'interior',root,.06);
    const back=box(.51,.53,.15,x,.88,z-.24,leather,'interior',root,.05); back.rotation.x=-.12;
    box(.30,.18,.12,x,1.20,z-.29,leather,'interior');
    for(const s of [-1,1]) { box(.075,.18,.44,x+s*.235,.62,z,leather,'interior'); const bolster=box(.065,.43,.17,x+s*.235,.88,z-.20,leather,'interior'); bolster.rotation.x=-.12; }
    for(let i=0;i<5;i++) { box(.32,.007,.012,x,.637,z-.14+i*.064,dark,'interior'); box(.32,.014,.006,x,.74+i*.063,z-.158, dark,'interior'); }
    tube([[x+Math.sign(x)*.26,.53,z+.12],[x+Math.sign(x)*.25,1.17,z-.29]],.014,black,'interior');
    box(.04,.06,.045,x-Math.sign(x)*.29,.63,z,red,'interior');
  }
  box(1.55,.23,.36,0,.90,.52,black,'interior',root,.06);
  box(1.39,.025,.035,0,.89,.325,chrome,'interior');
  box(.28,.20,1.3,0,.55,-.10,black,'interior'); box(.26,.11,.38,0,.71,-.35,leather,'interior');
  for(const z of [-.02,.18]) { const cup=mesh(new T.TorusGeometry(.052,.01,8,24),chrome,0,.665,z,'interior'); cup.rotation.x=Math.PI/2; cylinder(.042,.012,0,.66,z,black,'interior'); }
  box(.048,.13,.045,0,.74,.34,chrome,'interior'); box(.07,.055,.065,0,.81,.34,black,'interior');
  const wheel=mesh(new T.TorusGeometry(.155,.018,10,40),black,-.44,1.02,.26,'interior'); wheel.rotation.x=-.35;
  box(.12,.055,.045,-.44,1.02,.26,black,'interior');
  for(const s of [-1,1]) tube([[-.44,1.02,.26],[-.44+s*.13,1.04,.26]],.011,chrome,'interior');
  tube([[-.44,1.02,.26],[-.44,.88,.21]],.017,black,'interior');
  // Original dashboard graphics, rendered into a bundled procedural texture.
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=192;
  const ctx=canvas.getContext('2d')!; ctx.fillStyle='#07121e'; ctx.fillRect(0,0,512,192);
  ctx.strokeStyle='#51c9ec'; ctx.lineWidth=7;
  for(const x of [100,410]) { ctx.beginPath(); ctx.arc(x,98,68,.8,5.5); ctx.stroke(); }
  ctx.fillStyle='#e6f7ff'; ctx.font='bold 42px sans-serif'; ctx.fillText('0',87,116);ctx.fillText('P',397,116);
  ctx.font='16px sans-serif';ctx.fillText('LECOMAX',204,58);ctx.fillStyle='#73d1f0';ctx.fillText('STUDIO',218,91);ctx.fillText('km/h',80,145);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const screen=new T.MeshStandardMaterial({map:texture,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:.7,roughness:.4});
  box(.39,.16,.026,-.44,1.04,.40,screen,'interior'); box(.34,.18,.027,.08,1.09,.49,screen,'interior');
  for(const x of [-.66,-.22,.34,.62]) { box(.16,.055,.014,x,.925,.332,dark,'interior'); for(let i=0;i<3;i++) box(.13,.004,.014,x,.91+i*.012,.320,chrome,'interior'); }
  for(const x of [-.12,.12]) cylinder(.023,.03,x,.81,.34,chrome,'interior','z');
  // Clearance below the bonnet; the engine remains visible when opened or cut away.
  root.traverse(o => { if (o instanceof T.Mesh && o.userData.part === 'engine') o.position.y -= .065; });
  return { root, hinges };
}
