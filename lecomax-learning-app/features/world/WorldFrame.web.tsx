import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useFocusEffect} from 'expo-router';
import type {WorldFrameProps} from './WorldFrame';
export default function WorldFrame({html,title,onEvent}:WorldFrameProps){
 const ref=useRef<HTMLIFrameElement>(null);const focused=useRef(true),visible=useRef(true);const [height,setHeight]=useState(1100);
 const eventRef=useRef(onEvent);useEffect(()=>{eventRef.current=onEvent;},[onEvent]);
 const activity=useCallback(()=>ref.current?.contentWindow?.postMessage({channel:'world-control',action:'active',active:focused.current&&visible.current&&!document.hidden},'*'),[]);
 useFocusEffect(useCallback(()=>{focused.current=true;activity();return()=>{focused.current=false;activity();};},[activity]));
 useEffect(()=>{const frame=ref.current;const receive=(e:MessageEvent)=>{if(e.source!==frame?.contentWindow||e.data?.channel!=='world')return;const m=e.data;if(m.type==='resize'&&Number.isFinite(m.height))setHeight(Math.max(500,Math.min(2400,m.height)));else eventRef.current(m);};const observer=new IntersectionObserver(entries=>{visible.current=!!entries[0]?.isIntersecting;activity();});if(frame)observer.observe(frame);window.addEventListener('message',receive);document.addEventListener('visibilitychange',activity);return()=>{observer.disconnect();window.removeEventListener('message',receive);document.removeEventListener('visibilitychange',activity);frame?.contentWindow?.postMessage({channel:'world-control',action:'dispose'},'*');};},[activity]);
 return <iframe ref={ref} title={title} srcDoc={html} sandbox="allow-scripts" onLoad={activity} style={{width:'100%',height,border:0,borderRadius:20,background:'#050f20'}}/>;
}
