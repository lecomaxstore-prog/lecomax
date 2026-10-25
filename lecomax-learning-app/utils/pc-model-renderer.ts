// Offline, orthographic 3D geometry. Shared by the iframe and native WebView.
export const pcModelRenderer = String.raw`
const palette={metal:'#839398',dark:'#202c34',pcb:'#204940',gold:'#b79c60',copper:'#c28b61'};
const centers={case:[0,0,0],motherboard:[-.45,-.45,-1],cpu:[-.7,-1.65,-.65],cooler:[-.7,-1.65,.3],ram:[1.08,-1.55,-.45],gpu:[-.2,.75,.1],ssd:[-.4,-.15,-.7],hdd:[1.4,2.65,-.2],psu:[-1.1,2.5,-.2],fans:[2.75,-.8,0],vrm:[-1.7,-1.7,-.7],chipset:[.7,1.45,-.75],battery:[-1.45,1.45,-.75],ports:[-2.5,-1.7,-.6],cables:[1.65,.1,0]};
function renderPC(canvas,options){
 const ctx=canvas.getContext('2d');if(!ctx)return [];
 const width=canvas.clientWidth||640,height=canvas.clientHeight||500,ratio=Math.min(devicePixelRatio||1,2);
 canvas.width=width*ratio;canvas.height=height*ratio;ctx.scale(ratio,ratio);
 const faces=[],only=options.only,angle=options.yaw,tilt=options.pitch;
 function transform(p){const x=p[0]*Math.cos(angle)+p[2]*Math.sin(angle),z=-p[0]*Math.sin(angle)+p[2]*Math.cos(angle);return [x,p[1]*Math.cos(tilt)-z*Math.sin(tilt),p[1]*Math.sin(tilt)+z*Math.cos(tilt)]}
 function shift(id,p){if(only){const c=centers[only];return p.map((v,i)=>v-c[i])}if(options.exploded&&id!=='case'){const c=centers[id];return [p[0]+c[0]*.3,p[1]+c[1]*.17,p[2]+(id==='cpu'?1.6:id==='cooler'?3.2:id==='gpu'?1.5:.5)]}return p}
 function face(id,points,color,normal,label){if(only&&id!==only)return;const n=transform(normal);if(n[2]<=.001)return;
 const add=(points,tiled=false,labelText=label)=>{const vertices=points.map(p=>transform(shift(id,p)));faces.push({id,vertices,color,light:.64+.36*n[2],label:labelText,tiled,depth:vertices.reduce((sum,p)=>sum+p[2],0)/vertices.length})};
 // Smaller coplanar faces sort correctly around raised chips and fan blades.
 if(points.length===4&&!label){const [a,b,,d]=points,u=Math.hypot(...b.map((v,i)=>v-a[i])),v=Math.hypot(...d.map((v,i)=>v-a[i]));if(u*v>.3){const cols=Math.ceil(u/.32),rows=Math.ceil(v/.32),at=(s,t)=>a.map((value,i)=>value+(b[i]-value)*s+(d[i]-value)*t);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)add([at(x/cols,y/rows),at((x+1)/cols,y/rows),at((x+1)/cols,(y+1)/rows),at(x/cols,(y+1)/rows)],true);return}}
 add(points)}
 function box(id,x,y,z,w,h,d,color,label){const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;
 face(id,[[a,c,g],[b,c,g],[b,e,g],[a,e,g]],color,[0,0,1],label);face(id,[[b,c,f],[a,c,f],[a,e,f],[b,e,f]],color,[0,0,-1]);
 face(id,[[b,c,g],[b,c,f],[b,e,f],[b,e,g]],color,[1,0,0]);face(id,[[a,c,f],[a,c,g],[a,e,g],[a,e,f]],color,[-1,0,0]);
 face(id,[[a,c,f],[b,c,f],[b,c,g],[a,c,g]],color,[0,-1,0]);face(id,[[a,e,g],[b,e,g],[b,e,f],[a,e,f]],color,[0,1,0]);}
 function disc(id,x,y,z,r,color,plane='xy'){const points=[];for(let i=0;i<40;i++){const a=i*Math.PI/20;points.push(plane==='yz'?[x,y+Math.cos(a)*r,z+Math.sin(a)*r]:plane==='xz'?[x+Math.cos(a)*r,y,z+Math.sin(a)*r]:[x+Math.cos(a)*r,y+Math.sin(a)*r,z])}face(id,points,color,plane==='yz'?[1,0,0]:plane==='xz'?[0,-1,0]:[0,0,1])}
 function fan(id,x,y,z,r,plane='xy'){
 const point=(u,v,d)=>plane==='yz'?[x+d,y+u,z+v]:plane==='xz'?[x+u,y-d,z+v]:[x+u,y+v,z+d];const normal=plane==='yz'?[1,0,0]:plane==='xz'?[0,-1,0]:[0,0,1];
 disc(id,x,y,z,r,'#677d7c',plane);const inner=point(0,0,.012);disc(id,...inner,r*.91,'#0f1922',plane);
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const verts=[[.21,a],[.84,a+.2],[.83,a+.59],[.36,a+.54]].map(([radius,theta])=>point(Math.cos(theta)*radius*r,Math.sin(theta)*radius*r,.025));face(id,verts,'#52646b',normal)}
 const hub=point(0,0,.04);disc(id,...hub,r*.27,'#8c9b9e',plane);const cap=point(0,0,.052);disc(id,...cap,r*.19,'#273a42',plane);
 }
 function screw(id,x,y,z){disc(id,x,y,z,.055,'#9ba9ad');box(id,x,y,z+.002,.064,.012,.005,'#26363e')}
 // Folded case rails, rear tray and perforated front intake tower.
 box('case',0,0,-1.27,6,7.1,.10,'#34454c');box('case',0,-3.5,0,6,.14,2.7,'#65747a');box('case',0,3.5,0,6,.14,2.7,'#65747a');
 for(const x of [-2.94,2.94]){box('case',x,0,-1.1,.12,7, .3,'#57686f');box('case',x,0,1.2,.12,7,.12,'#78868a')}
 box('case',2.98,0,0,.1,6.9,2.6,'#27373f');
 for(let y=-3.2;y<3.2;y+=.2)box('case',3.04,y,0,.02,.045,2.3,'#0e1e26');
 for(const x of [-2.35,2.35])box('case',x,3.65,0,.7,.22,1.9,'#17262d');
 // Motherboard with copper traces, sockets and component packages.
 box('motherboard',-.45,-.45,-1.07,4.7,5.65,.10,palette.pcb);
 for(let i=0;i<22;i++){const x=-2.55+i*.20;box('motherboard',x,.15,-1.008,.012,4.5,.004,i%3?'#446852':'#8c8752');box('motherboard',-.45,-2.95+i*.24,-1.002,4.2,.012,.005,'#517251')}
 for(let i=0;i<36;i++){const x=-2.4+(i%6)*.22,y=.05+Math.floor(i/6)*.34;box('motherboard',x,y,-.97,.105,.06,.06,i%2?'#b5b19b':'#17252b')}
 for(const x of [-2.6,1.7])for(const y of [-3,2.1])screw('motherboard',x,y,-.94);
 box('motherboard',-.7,-1.65,-.94,1.48,1.48,.10,'#9eaaad');box('motherboard',-.7,-1.65,-.87,1.26,1.26,.05,'#243238');
 for(const y of [.6,1.05,1.75]){box('motherboard',-.6,y,-.87,2.85,.14,.25,'#8e9997');box('motherboard',-.6,y,-.728,2.6,.037,.01,'#101c23')}
 // CPU: substrate, contact rim, metal integrated heat spreader.
 box('cpu',-.7,-1.65,-.78,1.16,1.16,.06,'#24675a');box('cpu',-.7,-1.65,-.70,.98,.98,.10,'#bfc8c9','CPU');
 for(let i=0;i<12;i++)box('cpu',-1.2+i*.09,-1.12,-.74,.035,.07,.012,palette.gold);
 // VRM chokes and capacitor cans visible beside the CPU socket.
 for(let i=0;i<7;i++){box('vrm',-1.83,-2.55+i*.25,-.76,.25,.19,.33,'#7c8580');disc('vrm',-2.17,-2.55+i*.25,-.68,.095,'#bcc4bc');disc('vrm',-2.17,-2.55+i*.25,-.665,.069,'#435355')}
 // Tower heatsink: copper pipes, stacked aluminium fins and a front fan.
 box('cooler',-.7,-1.65,-.51,1.15,1.15,.18,palette.copper);
 for(let i=0;i<4;i++)box('cooler',-1.14+i*.29,-1.65,-.05,.08,1.43,.88,palette.copper);
 for(let i=0;i<19;i++)box('cooler',-.7,-2.40+i*.082,.05,1.5,.025,1.18,i%2?'#a4b4b9':'#788c94');
 box('cooler',-.7,-1.65,.72,1.64,1.64,.16,'#24343c');fan('cooler',-.7,-1.65,.81,.74);
 for(const x of [-1.4,0])for(const y of [-2.35,-.95])screw('cooler',x,y,.82);
 // DIMMs standing perpendicular to the board, with chips and edge contacts.
 for(const x of [.78,1.25]){box('ram',x,-1.7,-.66,.11,2.55,.57,'#276257');for(let i=0;i<8;i++){box('ram',x+.068,-2.75+i*.29,-.58,.035,.19,.27,'#18242c');box('ram',x,-2.75+i*.29,-.97,.12,.12,.05,palette.gold)}box('ram',x,-1.7,-.35,.18,2.55,.11,'#9eaeb0');for(const y of [-3.05,-.35])box('ram',x,y,-.86,.22,.17,.28,'#c1c6bd')}
 // M.2 storage with separate controller, NAND packages and retention screw.
 box('ssd',-.4,-.1,-.84,1.65,.48,.06,'#233e46');for(let i=0;i<3;i++)box('ssd',-.95+i*.47,-.1,-.785,.35,.32,.05,'#111e28');screw('ssd',.36,-.1,-.77);
 // Horizontal discrete GPU, metal bracket, PCB, fin stack and twin underside fans.
 box('gpu',-.35,.65,.05,4.25,.10,1.65,'#244d47');box('gpu',-.35,.98,.05,4.3,.55,1.7,'#35454f');
 for(let i=0;i<34;i++)box('gpu',-2.35+i*.12,.98,.05,.025,.42,1.55,'#819196');
 box('gpu',-.35,1.28,.05,4.32,.09,1.72,'#1e2b36');
 fan('gpu',-1.4,.575,.05,.66,'xz');fan('gpu',.55,.575,.05,.66,'xz');
 box('gpu',-.35,.99,.925,3.6,.35,.04,'#506873','GRAPHICS');box('gpu',-2.55,.98,.05,.08,.95,1.95,'#a0adb2');
 for(let i=0;i<3;i++)box('gpu',-2.60,.98,-.57+i*.50,.035,.20,.35,'#1b2730');
 // Chipset sink, clock battery and rear I/O connector housings.
 box('chipset',.75,1.6,-.78,1.15,.85,.35,'#566d74');for(let i=0;i<9;i++)box('chipset',.26+i*.12,1.6,-.57,.045,.78,.05,'#a1adae');
 disc('battery',-1.7,1.65,-.82,.29,'#202e36');disc('battery',-1.7,1.65,-.79,.25,'#c2caca');box('battery',-1.7,1.65,-.778,.14,.025,.004,'#606f73');box('battery',-1.7,1.65,-.777,.025,.14,.004,'#606f73');
 for(let i=0;i<5;i++){box('ports',-2.52,-2.65+i*.43,-.64,.36,.34,.7,'#a6b1b2');box('ports',-2.52,-2.65+i*.43,-.277,.26,.16,.025,i<3?'#29445e':'#171e27')}
 // Closed PSU and closed optional HDD; internal PSU hazards are not exposed.
 box('psu',-1.22,2.77,-.04,2.75,1.02,2.12,'#293b45','POWER SUPPLY');
 fan('psu',-1.22,2.245,-.04,.83,'xz');for(let i=0;i<8;i++)box('psu',-2.34+i*.30,2.78,1.03,.12,.54,.01,'#101f28');
 box('hdd',1.50,2.75,-.1,1.7,.67,2.1,'#9aa6aa');box('hdd',1.50,2.75,.966,1.55,.54,.015,'#c9d0cc','SATA HDD');
 for(const x of [.80,2.20])for(const y of [2.53,2.97])screw('hdd',x,y,.98);
 fan('fans',3.11,-2.02,0,1.04,'yz');fan('fans',3.11,.40,0,1.04,'yz');
 // Parallel cable bundles: visibly distinct wires and keyed plugs.
 for(let i=0;i<7;i++){box('cables',1.95+i*.045,.05,-.35,.025,3.15,.025,i%3===0?'#bca67b':'#293844');box('cables',.65+i*.02,2.15,.5,2.65,.023,.025,i%3===0?'#bca67b':'#293844')}
 box('cables',1.90,-1.57,-.45,.34,.58,.42,'#29353b');box('cables',1.90,1.78,.2,.44,.28,.53,'#26363e');
 if(!only&&!options.open&&!options.exploded)box('case',0,0,1.34,5.85,6.85,.08,'#3a515b','ACADEMY / PC');
 if(!faces.length)return [];
 const all=faces.flatMap(f=>f.vertices);const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
 const scale=(only?Math.min((width-70)/(maxX-minX),(height-70)/(maxY-minY)):Math.min(width/10.5,height/9.8))*options.zoom;
 const cx=only?(minX+maxX)/2:0,cy=only?(minY+maxY)/2:.2;
 const glow=ctx.createRadialGradient(width*.5,height*.45,0,width*.5,height*.45,width*.65);glow.addColorStop(0,'#293f4d');glow.addColorStop(1,'#0c1b27');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#07121b';ctx.beginPath();ctx.ellipse(width*.5,height*.87,width*.27,height*.035,0,0,Math.PI*2);ctx.fill();
 faces.sort((a,b)=>a.depth-b.depth);
 for(const f of faces){f.points=f.vertices.map(p=>[width/2+(p[0]-cx)*scale,height/2+(p[1]-cy)*scale]);ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();const rgb=f.color.match(/\w\w/g).map(v=>Math.round(parseInt(v,16)*f.light));ctx.fillStyle='rgb('+rgb.join(',')+')';ctx.fill();ctx.lineWidth=f.tiled?.6:.35;ctx.strokeStyle=f.tiled?ctx.fillStyle:'#09182066';ctx.stroke();
 const area=Math.abs(f.points.reduce((sum,p,i)=>{const next=f.points[(i+1)%f.points.length];return sum+p[0]*next[1]-p[1]*next[0]},0))/2;
 if(!only&&f.id===options.selected&&area>scale*scale*.4){ctx.strokeStyle='#edc77d';ctx.lineWidth=1.2;ctx.stroke()}
 if(f.label){const p=f.points.reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4],[0,0]);ctx.save();ctx.clip();ctx.fillStyle='#d9e3e4';ctx.font='600 '+Math.max(7,Math.min(12,scale*.14))+'px system-ui';ctx.textAlign='center';ctx.fillText(f.label,...p);ctx.restore()}}
 return faces;
}
function pcHit(faces,x,y){for(let i=faces.length-1;i>=0;i--){const p=faces[i].points;let inside=false;for(let j=0,k=p.length-1;j<p.length;k=j++){if((p[j][1]>y)!==(p[k][1]>y)&&x<(p[k][0]-p[j][0])*(y-p[j][1])/(p[k][1]-p[j][1])+p[j][0])inside=!inside}if(inside)return faces[i].id}return null}
`;
