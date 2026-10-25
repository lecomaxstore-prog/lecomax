import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {productVideoMedia} from '../mobile/src/lib/product-video.ts';
import {productVideoMedia as webMedia} from '../lib/product-video.ts';
const url='https://player.cloudinary.com/embed/?cloud_name=dbivkjlxr&public_id=gemini_generated_video_54a7c167_hn0xmy';
test('mobile resolves Cloudinary embed URLs identically to the deployed website',()=>{
 for(const value of [url,'https://res.cloudinary.com/demo/video/upload/v123/shoe.mp4','https://example.com/a.mp4?token=x','https://player.cloudinary.com/embed/','javascript:alert(1)'])assert.deepEqual(productVideoMedia(value,'/poster.jpg'),webMedia(value,'/poster.jpg'));
 assert.match(productVideoMedia(url).src,/\/video\/upload\/f_mp4,vc_h264,ac_aac\/.+\.mp4$/);
});
test('Expo player loads real media, pauses off-slide, shows poster/error and retries',()=>{
 const require=createRequire(import.meta.url);let source:any;let plays=0,pauses=0;const player={status:'loading',loop:false,muted:false,play:()=>plays++,pause:()=>pauses++};let status='loading';const states:any[]=[];let cursor=0;const effects:any[]=[];
 const react={useMemo:(fn:any)=>fn(),useEffect:(fn:any)=>effects.push(fn),useState:(initial:any)=>{const id=cursor++;if(!(id in states))states[id]=initial;return [states[id],(v:any)=>states[id]=typeof v==='function'?v(states[id]):v];}};
 const mocks:any={react,expo:{useEvent:()=>({status})},'expo-image':{Image:'Image'},'expo-video':{VideoView:'VideoView',useVideoPlayer:(s:any,setup:any)=>{source=s;setup(player);return player;}},'react-native':{ActivityIndicator:'Spinner',StyleSheet:{create:(v:any)=>v,absoluteFill:{}},Text:'Text',View:'View'},'@/components/animated-pressable':{AnimatedPressable:'Button'},'@/i18n':{useLocale:()=>{},msg:(key:string)=>key},'@/lib/format':{imageUrl:(v:string)=>v},'@/lib/product-video':{productVideoMedia}};
 const module={exports:{} as any};const code=ts.transpileModule(fs.readFileSync('mobile/src/components/product-video.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)((id:string)=>mocks[id]??require(id),module,module.exports);
 const flatten=(n:any):any[]=>n&&typeof n==='object'?[n,...[n.props?.children].flat(Infinity).flatMap(flatten)]:[];
 let retries=0;const render=(active=true)=>{cursor=0;effects.length=0;const nodes=flatten(module.exports.VideoPlayback({active,uri:url,poster:'/fallback.jpg',onRetry:()=>retries++}));effects.forEach(fn=>fn());return nodes;};
 let nodes=render();assert.match(source.uri,/res.cloudinary.com/);assert.equal(player.muted,true);assert.equal(plays,0);assert.ok(nodes.some(n=>n.type==='Spinner'));assert.ok(nodes.some(n=>n.type==='Image'));
 const video=nodes.find(n=>n.type==='VideoView');assert.equal(video.props.nativeControls,false);assert.equal(player.loop,true);assert.equal(video.props.playsInline,true);assert.equal(video.props.contentFit,'cover');assert.equal(nodes.find(n=>n.type==='Image').props.contentFit,'cover');
 status='readyToPlay';nodes=render();assert.equal(plays,1);assert.ok(!nodes.some(n=>n.type==='Image'),'a ready cached video must not remain hidden behind its poster before the first-frame event');video.props.onFirstFrameRender();assert.ok(!render().some(n=>n.type==='Image'));render(false);assert.equal(pauses,1);
 status='error';nodes=render();assert.ok(nodes.some(n=>n.props?.accessibilityRole==='alert'));nodes.find(n=>n.type==='Button').props.onPress();assert.equal(retries,1);
 nodes.find(n=>n.type==='Image').props.onError();assert.equal(render().find(n=>n.type==='Image').props.source.uri,'/fallback.jpg');
 cursor=0;states.length=0;const wrapper=module.exports.ProductVideoPlayer({active:true,uri:url});wrapper.props.onRetry();cursor=0;const retried=module.exports.ProductVideoPlayer({active:true,uri:url});assert.notEqual(wrapper.key,retried.key);
});
