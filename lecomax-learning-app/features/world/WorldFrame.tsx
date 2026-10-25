import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AppState,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {WebView} from 'react-native-webview';
export type WorldFrameProps={html:string;title:string;onEvent:(event:Record<string,unknown>)=>void};
export default function WorldFrame({html,title,onEvent}:WorldFrameProps){
 const ref=useRef<WebView>(null);const focused=useRef(true);const [height,setHeight]=useState(1100);
 const activity=useCallback(()=>{ref.current?.injectJavaScript(`window.worldActive?.(${focused.current&&AppState.currentState==='active'});true;`);},[]);
 useFocusEffect(useCallback(()=>{focused.current=true;activity();return()=>{focused.current=false;activity();};},[activity]));
 useEffect(()=>{const sub=AppState.addEventListener('change',activity);return()=>sub.remove();},[activity]);
 return <View style={{height,backgroundColor:'#050f20',borderRadius:20,overflow:'hidden'}}><WebView ref={ref} source={{html}} style={{flex:1}} accessibilityLabel={title} originWhitelist={['about:blank']} onShouldStartLoadWithRequest={r=>r.url==='about:blank'} startInLoadingState renderLoading={()=><ActivityIndicator accessibilityLabel="Loading science scene"/>} onLoadEnd={activity} onMessage={e=>{try{if(e.nativeEvent.data.length>20000)return;const m=JSON.parse(e.nativeEvent.data);if(m.channel!=='world')return;if(m.type==='resize'&&Number.isFinite(m.height))setHeight(Math.max(500,Math.min(2400,m.height)));else onEvent(m);}catch{/* Ignore malformed frame messages. */}}} onContentProcessDidTerminate={()=>ref.current?.reload()} onRenderProcessGone={()=>ref.current?.reload()}/></View>;
}
