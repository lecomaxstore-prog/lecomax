import React,{useCallback} from 'react';
import html from '../../data/world-runtime.json';
import WorldFrame from './WorldFrame';
export type GlobeProps={onSelect:(id:string)=>void;onEvidence?:(choice:number)=>void};
export default function Globe({onSelect,onEvidence}:GlobeProps){const receive=useCallback((m:Record<string,unknown>)=>{if(m.type==='evidence'&&m.id==='earth-day'&&Number.isInteger(m.choice))onEvidence?.(m.choice as number);else if(!m.type&&typeof m.id==='string')onSelect(m.id);},[onSelect,onEvidence]);return <WorldFrame html={html} title="Interactive Earth globe" onEvent={receive}/>;}
