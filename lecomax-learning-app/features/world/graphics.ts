import * as THREE from 'three';
export const earthImage=new Image();
earthImage.src=(window as unknown as {worldAssets:{earth:string}}).worldAssets.earth;
export function geoVector(lon:number,lat:number,radius=1){const a=(lon+180)*Math.PI/180,b=lat*Math.PI/180;return new THREE.Vector3(-Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)).multiplyScalar(radius);}
export function createEarth(invalidate:()=>void){
 const group=new THREE.Group();const texture=new THREE.Texture(earthImage);texture.colorSpace=THREE.SRGBColorSpace;
 const loaded=()=>{texture.needsUpdate=true;invalidate();};if(earthImage.complete)loaded();else earthImage.addEventListener('load',loaded,{once:true});
 const surface=new THREE.Mesh(new THREE.SphereGeometry(1,64,40),new THREE.MeshPhongMaterial({map:texture,color:0xffffff,specular:0x33475a,shininess:12}));group.add(surface);
 const cloudCanvas=document.createElement('canvas');cloudCanvas.width=1024;cloudCanvas.height=512;const ctx=cloudCanvas.getContext('2d')!;
 // Deterministic illustrative cloud wisps, not satellite observations or weather data.
 for(let i=0;i<110;i++){const x=(Math.sin(i*91.13)*.5+.5)*1024,y=(Math.sin(i*17.72)*.5+.5)*512;const gradient=ctx.createRadialGradient(x,y,0,x,y,24);gradient.addColorStop(0,'rgba(255,255,255,.38)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(x,y,42,12,Math.sin(i)*.6,0,Math.PI*2);ctx.fill();}
 const cloudTexture=new THREE.CanvasTexture(cloudCanvas);
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.009,48,32),new THREE.MeshPhongMaterial({map:cloudTexture,transparent:true,opacity:.7,depthWrite:false}));group.add(clouds);clouds.visible=false;
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.035,48,32),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;void main(){float glow=pow(max(0.0,1.0-abs(dot(normalize(n),normalize(v)))),3.0);gl_FragColor=vec4(.16,.48,.95,glow*.5);}'}));group.add(atmosphere);
 return {group,surface,clouds,atmosphere,texture};
}
export function addStars(scene:THREE.Scene){const points=[];for(let i=0;i<450;i++){const a=i*2.39996,y=1-2*(i+.5)/450,r=Math.sqrt(1-y*y);points.push(60*r*Math.cos(a),60*y,60*r*Math.sin(a));}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0xb5cce7,size:.09,sizeAttenuation:true})));}
export function disposeScene(scene:THREE.Scene){const textures=new Set<THREE.Texture>();scene.traverse(object=>{const mesh=object as THREE.Mesh;mesh.geometry?.dispose();const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const material of materials){if(!material)continue;for(const value of Object.values(material))if(value instanceof THREE.Texture)textures.add(value);material.dispose();}});textures.forEach(texture=>texture.dispose());scene.clear();}
export function makeLoop(draw:(delta:number)=>void,animating:()=>boolean){
 let handle=0,last=0,active=true,disposed=false,frames=0,slow=0;
 function tick(now:number){handle=0;if(!active||disposed)return;const elapsed=last?now-last:0;if(elapsed&&elapsed<32){handle=requestAnimationFrame(tick);return;}const dt=Math.min(elapsed/1000,.1);last=now;draw(dt);frames++;if(elapsed>65)slow++;if(animating())handle=requestAnimationFrame(tick);else last=0;}
 const request=()=>{if(active&&!disposed&&!handle)handle=requestAnimationFrame(tick);};
 return {request,setActive(value:boolean){active=value&&!document.hidden;if(!active){cancelAnimationFrame(handle);handle=0;last=0;}else request();},dispose(){disposed=true;cancelAnimationFrame(handle);handle=0;},stats:()=>({frames,slow,active,disposed})};
}
