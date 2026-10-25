export const radians=(degrees:number)=>degrees*Math.PI/180;
export function solarDeclination(tilt:number,orbit:number){return Math.asin(Math.sin(radians(tilt))*Math.cos(radians(orbit)));}
export function daylightHours(latitude:number,tilt:number,orbit:number){
  const d=solarDeclination(tilt,orbit), lat=radians(Math.max(-89.999,Math.min(89.999,latitude)));
  const limit=-Math.tan(lat)*Math.tan(d);
  return limit<=-1?24:limit>=1?0:24*Math.acos(limit)/Math.PI;
}
export const layers=[
 {id:'crust',name:'Crust',radius:1,color:'#6eab92',dimensions:'About 5 km under many oceans; continental crust commonly tens of kilometers, locally up to about 70–80 km.',composition:'Silicate rocks: basaltic oceanic crust and more compositionally varied continental crust.',temperature:'Temperature varies strongly with depth and location; a single global range would be misleading.',explanation:'The crust is a thin outer layer. Tectonic plates also include rigid upper mantle, not just crust.',question:'Does a tectonic plate contain only crust?',options:['Yes, only crust','No, crust and rigid upper mantle'],correct:1},
 {id:'mantle',name:'Mantle',radius:.985,color:'#db864a',dimensions:'About 2,900 km thick, below the crust.',composition:'Silicate minerals rich in magnesium and iron.',temperature:'Hotter with depth; temperature estimates depend on pressure, mineral composition and model.',explanation:'Most mantle material is solid rock. It can deform over geological time. It is not a global ocean of magma.',question:'How can a mostly solid mantle move?',options:['Rock deforms slowly over long times','All mantle material is liquid'],correct:0},
 {id:'outer-core',name:'Outer core',radius:.546,color:'#f6bd60',dimensions:'About 2,200–2,260 km thick, from roughly 2,900 to 5,150 km depth.',composition:'Liquid iron-rich alloy, including nickel and lighter elements.',temperature:'Several thousand degrees Celsius; inferred from experiments and geophysical models, not direct thermometer readings.',explanation:'Motion of electrically conducting liquid metal helps sustain Earth’s magnetic field. Seismic shear waves do not pass through this liquid layer.',question:'Which observation supports a liquid outer core?',options:['Trees grow on land','Shear waves do not travel through it'],correct:1},
 {id:'inner-core',name:'Inner core',radius:.191,color:'#fff0b1',dimensions:'Radius about 1,220 km; the center is roughly 6,371 km below the surface.',composition:'Predominantly solid iron-rich alloy.',temperature:'NASA gives a representative estimate near 5,400 °C; the precise temperature remains uncertain.',explanation:'Enormous pressure favors a solid inner core even though it is extremely hot. Solid versus liquid depends on both temperature and pressure.',question:'Why can the inner core remain solid while very hot?',options:['Enormous pressure changes melting behavior','There is no heat at Earth’s center'],correct:0},
];
export const layerSources=['https://pubs.usgs.gov/gip/dynamic/inside.html','https://science.nasa.gov/earth/facts/','https://www.usgs.gov/publications/crust-and-lithospheric-structure-global-crustal-structure'];
export const hotspots=[
 {id:'atlas',name:'Atlas Mountains',lon:-7.5,lat:31.1,topic:'landscapes',text:'Mountain building and erosion both shape this North African landscape. Observe the surrounding dry lowlands.'},
 {id:'amazon',name:'Amazon Basin',lon:-62,lat:-4,topic:'amazon',text:'A connected tropical forest and river system. Explore how plants, water and climate interact.'},
 {id:'ridge',name:'Mid-Atlantic Ridge',lon:-29,lat:0,topic:'plates',text:'A divergent plate boundary runs through the Atlantic. New oceanic crust forms as plates separate.'},
 {id:'hawaii',name:'Hawaiian hotspot',lon:-155.5,lat:19.6,topic:'volcanoes',text:'The Hawaiian island chain records plate motion over a long-lived volcanic hotspot. Not all volcanoes occur at plate boundaries.'},
];
export type LabContext={scene:'earth'|'inside'|'seasons'|'solar';target:string;tilt:number;orbit:number;rotation:number;sunlight:number;latitude:number;level:'beginner'|'intermediate'|'advanced'};
export function readLabContext(value:unknown):LabContext|undefined{
 if(!value||typeof value!=='object')return;const v=value as LabContext;
 if(!['earth','inside','seasons','solar'].includes(v.scene)||typeof v.target!=='string'||!['earth','mercury','venus','mars','jupiter','saturn','uranus','neptune','moon','sun',...layers.map(l=>l.id)].includes(v.target)||!['beginner','intermediate','advanced'].includes(v.level))return;
 if(![v.tilt,v.orbit,v.rotation,v.sunlight,v.latitude].every(Number.isFinite)||v.tilt<0||v.tilt>90||v.orbit<0||v.orbit>360||v.rotation<0||v.rotation>360||v.sunlight<0||v.sunlight>360||Math.abs(v.latitude)>89)return;
 return {scene:v.scene,target:v.target,tilt:v.tilt,orbit:v.orbit,rotation:v.rotation,sunlight:v.sunlight,latitude:v.latitude,level:v.level};
}
