// Self-contained canvas renderer, embedded in both the web and native phone lab.
export const phoneModelRenderer = String.raw`
function project(v){let x=v[0]*Math.cos(yaw)+v[2]*Math.sin(yaw),z=-v[0]*Math.sin(yaw)+v[2]*Math.cos(yaw);const y=v[1]*Math.cos(pitch)-z*Math.sin(pitch);z=v[1]*Math.sin(pitch)+z*Math.cos(pitch);const scale=Math.min(canvas.clientWidth/(exploded&&group==='hardware'?6.8:3.9),canvas.clientHeight/6.9)*11/(11-z);return [canvas.clientWidth/2+(x+(exploded&&group==='hardware'?1.4:0))*scale,canvas.clientHeight/2+y*scale,z]}
function face(id,vertices,color,normal,text){const nz=(-normal[0]*Math.sin(yaw)+normal[2]*Math.cos(yaw))*Math.cos(pitch)+normal[1]*Math.sin(pitch);if(nz<=0)return;const points=vertices.map(project);faces.push({id,points,depth:vertices.reduce((s,p)=>s+p[2],0)/vertices.length*Math.cos(yaw)*Math.cos(pitch),color,shade:.68+.32*nz,text})}
function outline(x,y,w,h,r){const points=[];r=Math.min(r,w/2,h/2);[[x+w/2-r,y-h/2+r,-Math.PI/2],[x+w/2-r,y+h/2-r,0],[x-w/2+r,y+h/2-r,Math.PI/2],[x-w/2+r,y-h/2+r,Math.PI]].forEach(([cx,cy,a])=>{for(let j=0;j<=8;j++){const angle=a+j*Math.PI/16;points.push([cx+Math.cos(angle)*r,cy+Math.sin(angle)*r])}});return points}
function part(id,x,y,z,w,h,d,color,r=.08,text){const points=outline(x,y,w,h,r);face(id,points.map(p=>[...p,z+d/2]),color,[0,0,1],text);face(id,[...points].reverse().map(p=>[...p,z-d/2]),color,[0,0,-1]);for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len>.0001)face(id,[[...a,z-d/2],[...b,z-d/2],[...b,z+d/2],[...a,z+d/2]],color,[dy/len,-dx/len,0])}}
function disk(id,x,y,z,r,color,back=false){const points=[];for(let i=0;i<48;i++){const a=i*Math.PI/24;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z])}face(id,points,color,[0,0,back?-1:1])}
function lens(x,y,z,back=false){const step=back?-.008:.008;disk('camera',x,y,z,.27,'#a6b0b5',back);disk('camera',x,y,z+step,.228,'#101b26',back);disk('camera',x,y,z+step*2,.169,'#284953',back);disk('camera',x,y,z+step*3,.112,'#081423',back);disk('camera',x-.05,y-.055,z+step*4,.043,'#719fac',back);disk('camera',x+.055,y+.065,z+step*4,.02,'#687cab',back)}
function draw(){if(!ctx||canvas.hidden)return;const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=canvas.clientWidth*ratio;canvas.height=canvas.clientHeight*ratio;ctx.scale(ratio,ratio);ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);faces=[];const open=(exploded||coverOpen)&&group==='hardware';
// The complete outer enclosure remains opaque; hidden internal faces are never drawn through glass.
part('display',0,0,0,2.65,5.5,.23,'#aab7bd',.34);
part('display',0,0,-.13,2.56,5.41,.025,'#344a53',.31);
part('camera',-.57,-1.8,-.19,1.22,1.37,.14,'#536772',.26);
lens(-.83,-2.12,-.27,true);lens(-.83,-1.51,-.27,true);lens(-.27,-1.81,-.27,true);disk('camera',-.27,-2.21,-.28,.095,'#e8dfbe',true);
part('sensors',1.35,-.62,0,.045,.63,.105,'#bdc8cb',.02);part('audio',-1.35,-.93,0,.045,.42,.105,'#bdc8cb',.02);part('audio',-1.35,-.36,0,.045,.42,.105,'#bdc8cb',.02);
part('port',0,2.74,.01,.49,.065,.13,'#142630',.025);
for(let i=0;i<5;i++){part('audio',.55+i*.105,2.73,.055,.045,.04,.075,'#182731',.016);part('audio',-.55-i*.105,2.73,.055,.045,.04,.075,'#182731',.016)}
let sx=0,sy=0,sz=.145;
if(open){
// Layered graphite chassis, olive PCB, machined shields and copper interconnects.
part('display',0,0,.14,2.51,5.35,.035,'#111c23',.27);
part('chip',.78,-.30,.18,.79,3.64,.045,'#334c3d',.08);
part('chip',0,-1.43,.18,2.25,.31,.04,'#334c3d',.04);
part('chip',0,1.91,.18,2.24,.20,.04,'#334c3d',.04);
// Fine circuit tracks and solder pads remain attached to their learning target.
for(let i=0;i<9;i++){
part('chip',.48+i*.073,-1.13,.209,.013,.38,.003,'#9a9460',.004);
part('chip',.48+i*.073,1.44,.209,.013,.48,.003,'#8c8555',.004);
}
for(let i=0;i<12;i++){
part('chip',.55+(i%3)*.20,-1.49+Math.floor(i/3)*.12,.23,.095,.052,.025,i%2?'#c0b68c':'#797f72',.008);
}
// Battery pouch with folded seams, printed markings and a flex connector.
part('battery',-.39,.59,.23,1.48,2.91,.10,'#101820',.10);
part('battery',-.39,.59,.287,1.38,2.80,.013,'#333b42',.07);
part('battery',-.39,.59,.299,1.29,2.66,.005,'#262f36',.06);
for(let i=0;i<5;i++)part('battery',-.39,-.72+i*.018,.306,1.22,.006,.002,'#687178',.002);
part('battery',-.39,.22,.309,1.12,.25,.001,'#262f36',.01,'Li-ion');
part('battery',-.39,.56,.309,1.12,.18,.001,'#262f36',.01,'RECHARGEABLE');
part('battery',-.39,.80,.309,1.12,.18,.001,'#262f36',.01,'3.85 V');
for(let i=0;i<7;i++)part('battery',-.39,1.13+i*.055,.309,.85-(i%3)*.10,.013,.001,'#636d74',.002);
part('battery',-.39,1.65,.309,.70,.14,.001,'#262f36',.01,'+    Li-ion    ?');
part('battery',.16,1.97,.24,.20,.43,.028,'#ac773c',.025);
for(let i=0;i<4;i++)part('battery',.10+i*.035,1.97,.257,.012,.34,.003,'#d4ac6a',.002);
// Processor shield with inset die, perimeter contacts and laser-style markings.
part('chip',.82,-.65,.25,.65,1.13,.14,'#869593',.045);
part('chip',.82,-.65,.326,.56,.99,.008,'#b8c0b8',.025);
part('chip',.82,-.67,.335,.43,.50,.010,'#313b40',.025,'SoC');
for(let i=0;i<7;i++){
part('chip',.465,-1.06+i*.14,.28,.075,.043,.02,'#c7b16e',.005);
part('chip',1.175,-1.06+i*.14,.28,.055,.043,.02,'#c7b16e',.005);
}
part('ram',.82,.24,.26,.64,.47,.12,'#19262b',.035);
part('ram',.82,.24,.326,.54,.37,.007,'#34444c',.025,'RAM');
part('storage',.82,.94,.26,.64,.54,.12,'#1d232d',.035);
part('storage',.82,.94,.326,.54,.44,.007,'#3e4450',.025,'FLASH');
for(let i=0;i<5;i++)for(const cy of [.24,.94]){
part(cy===.24?'ram':'storage',.49+i*.14,cy-.27,.26,.06,.07,.02,'#c4b182',.004);
}
// Individually mounted camera modules and multi-layer optical glass.
part('camera',-.58,-1.86,.22,1.22,1.13,.12,'#101c24',.14);
part('camera',-.85,-2.03,.29,.61,.61,.07,'#687478',.08);
part('camera',-.30,-1.65,.29,.61,.61,.07,'#687478',.08);
lens(-.85,-2.03,.335);lens(-.3,-1.65,.335);
part('sensors',.76,-1.97,.24,.61,.42,.08,'#8a9491',.05);
part('sensors',.76,-1.97,.287,.49,.30,.012,'#263439',.04);
disk('sensors',.64,-1.97,.300,.074,'#172129');disk('sensors',.87,-1.97,.300,.053,'#a79b77');
part('radio',0,-2.49,.22,2.16,.12,.07,'#a68c55',.025);
for(let i=0;i<6;i++)part('radio',-.88+i*.35,-2.49,.26,.22,.025,.002,'#ddc68f',.004);
// Speaker grille, haptic module and recessed USB connector.
part('audio',0,2.19,.22,1.8,.37,.09,'#182329',.06);
for(let i=0;i<18;i++)part('audio',-.77+i*.09,2.19,.273,.027,.22,.006,'#546069',.01);
part('port',0,2.49,.25,.57,.17,.1,'#a7b1b2',.04);
part('port',0,2.49,.307,.44,.085,.008,'#101d25',.035);
for(let i=0;i<7;i++)part('port',-.14+i*.047,2.49,.313,.019,.03,.001,'#c5ad79',.002);
// Captive screws and a slim gasket frame provide recognizable construction detail.
for(const y of [-2.36,-1.15,1.76,2.47])for(const x of [-1.17,1.17]){
disk('display',x,y,.29,.041,'#9ba7aa');
part('display',x,y,.294,.044,.008,.002,'#35414a',.002);
}
sx=-2.95;sy=-.05;sz=.8;
}
if(!coverOpen||group!=='hardware'){
// A continuous black bezel and glass surface, rather than a wireframe stack.
part('display',sx,sy,sz,2.52,5.35,.05,'#09141d',.31);
part('display',sx,sy,sz+.031,2.36,5.15,.006,'#163c60',.26);
// Layered wallpaper shapes are contained inside the glass perimeter.
part('display',sx,sy+.44,sz+.038,2.27,3.86,.002,'#285981',.23);
part('display',sx+.16,sy+.94,sz+.042,1.91,2.83,.002,'#397e93',.42);
part('display',sx+.33,sy+1.41,sz+.046,1.42,1.88,.002,'#62a6a6',.5);
part('sensors',sx,sy-2.23,sz+.055,.77,.21,.01,'#050c12',.105);
disk('camera',sx+.23,sy-2.23,sz+.064,.045,'#253b4a');
part('display',sx,sy-1.47,sz+.052,1.6,.45,.001,'#28577c',.06,'09:41');
// Touch targets are real app-like icons and keep their topic IDs for hit testing.
const apps=group==='software'?[['os','#7b96b8','OS'],['apps','#5fba97','APP'],['permissions','#d2ac61','KEY'],['updates','#9585bf','UP']]:[['camera','#90a7ad','CAM'],['audio','#e4937d','SND'],['radio','#61a899','NET'],['storage','#928cc0','FILE']];
apps.forEach((a,i)=>part(a[0],sx+(i%2? .52:-.52),sy-.4+Math.floor(i/2)*.9,sz+.066,.65,.65,.012,a[1],.15,a[2]));
part('display',sx,sy+2.23,sz+.057,1.87,.38,.006,'#548b99',.16);
part('display',sx,sy+2.45,sz+.065,.73,.045,.005,'#d4e6ea',.022);
face(null,[[sx-1.06,sy-2.02,sz+.082],[sx-.88,sy-2.21,sz+.082],[sx+.58,sy+2.03,sz+.082],[sx+.31,sy+2.12,sz+.082]],'rgba(255,255,255,.065)',[0,0,1]);
}
faces.sort((a,b)=>a.depth-b.depth);const area=f=>Math.abs(f.points.reduce((sum,p,i)=>{const q=f.points[(i+1)%f.points.length];return sum+p[0]*q[1]-q[0]*p[1]},0));const selectedFace=selected==='display'||selected==='os'?null:faces.filter(f=>f.id===selected).reduce((best,f)=>!best||area(f)>area(best)?f:best,null);faces.forEach(f=>{ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.fillStyle='rgba(0,0,0,'+(1-f.shade)+')';ctx.fill();ctx.strokeStyle='rgba(215,238,245,.055)';ctx.lineWidth=.5;ctx.stroke();if(f===selectedFace){ctx.strokeStyle='rgba(238,201,129,.85)';ctx.lineWidth=1.2;ctx.stroke()}if(f.text){const center=f.points.reduce((a,p)=>[a[0]+p[0]/f.points.length,a[1]+p[1]/f.points.length],[0,0]);ctx.fillStyle='#edf5f6';ctx.font=(f.text==='09:41'?'600 22px':'600 9px')+' system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(f.text,center[0],center[1])}});
}
`;
