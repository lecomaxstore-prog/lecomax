import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(file: string, overrides: Record<string, unknown>): any {
  const filename = path.resolve(file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  const require = (id: string): any => {
    if (id in overrides) return overrides[id];
    if (id === "server-only") return {};
    if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), id + ".ts"), overrides);
    return nativeRequire(id);
  };
  new Function("require", "module", "exports", "fetch", compiled)(require, module, module.exports, overrides.fetch ?? fetch);
  return module.exports;
}
import * as parser from '../lib/product-paste.ts';
test('paste preview only applies selected fields and editing clears stale preview', () => {
  const states: any[] = []; let cursor = 0; const patches: unknown[] = [];
  const ref = { current: null };
  const react = { useEffect: () => {}, useRef: () => ref, useState: (initial: any) => {
    const id = cursor++; if (!(id in states)) states[id] = initial;
    return [states[id], (value: any) => { states[id] = typeof value === 'function' ? value(states[id]) : value; }];
  } };
  const Component = load('components/admin/ProductPasteImport.tsx', { react, '@/lib/product-paste': parser }).default;
  const flatten = (root: any): any[] => root && typeof root === 'object' ? [root, ...[root.props?.children].flat(Infinity).flatMap(flatten)] : [];
  const render = () => { cursor = 0; return flatten(Component({ onApply: (patch: unknown) => patches.push(patch) })); };
  let nodes = render();
  nodes.find(n => n.type === 'textarea').props.onChange({ target: { value: 'Nom : Sac\nPrix : 249 MAD\nStock : 3' } });
  nodes = render(); nodes.filter(n => n.type === 'button')[1].props.onClick();
  assert.equal(patches.length,0);
  nodes=render(); const checkboxes=nodes.filter(n => n.type==='input' && n.props.type==='checkbox');
  assert.equal(checkboxes.length,3); checkboxes[1].props.onChange({ target: { checked:false } });
  nodes=render(); nodes.filter(n => n.type==='button').at(-1).props.onClick();
  assert.deepEqual(patches,[{name:'Sac',stock:'3'}]);
  nodes=render(); nodes.filter(n=>n.type==='button')[1].props.onClick();
  nodes=render(); assert.equal(nodes.filter(n=>n.type==='input').length,3);
  nodes.find(n=>n.type==='textarea').props.onChange({target:{value:'Nom : Nouveau'}});
  assert.equal(render().filter(n=>n.type==='input').length,0);
});
test('AI preview waits for explicit apply and ignores results after text is edited', async () => {
  const states:any[]=[];let cursor=0;const ref={current:null};const patches:unknown[]=[];
  let resolveResponse:(value:Response)=>void=()=>{};
  const react={useEffect:()=>{},useRef:()=>ref,useState:(initial:any)=>{const id=cursor++;if(!(id in states))states[id]=initial;return [states[id],(value:any)=>{states[id]=typeof value==='function'?value(states[id]):value;}];}};
  const Component=load('components/admin/ProductPasteImport.tsx',{react,'@/lib/product-paste':parser,fetch:()=>new Promise<Response>(resolve=>{resolveResponse=resolve;})}).default;
  const flatten=(root:any):any[]=>root&&typeof root==='object'?[root,...[root.props?.children].flat(Infinity).flatMap(flatten)]:[];
  const render=()=>{cursor=0;return flatten(Component({onApply:(patch:unknown)=>patches.push(patch)}));};
  render().find(n=>n.type==='textarea').props.onChange({target:{value:'Un sac vendu 249 MAD.'}});
  let pending=render().find(n=>n.type==='button').props.onClick();
  resolveResponse(Response.json({fields:{price:'249'},warnings:[],model:'gpt-6.1-sol'}));await pending;
  assert.equal(patches.length,0);
  render().filter(n=>n.type==='button').at(-1).props.onClick();assert.deepEqual(patches,[{price:'249'}]);
  pending=render().find(n=>n.type==='button').props.onClick();
  render().find(n=>n.type==='textarea').props.onChange({target:{value:'Autre produit sans prix.'}});
  resolveResponse(Response.json({fields:{price:'249'},warnings:[]}));await pending;
  assert.equal(render().filter(n=>n.type==='input').length,0);
  assert.equal(patches.length,1);
});
