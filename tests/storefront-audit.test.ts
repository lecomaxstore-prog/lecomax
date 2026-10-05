import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { selectedInventory, preorderSnapshot } from "../mobile/src/lib/purchasability.ts";
import { colorPricesFromTags } from "../mobile/src/lib/product-variant-pricing.ts";
const require = createRequire(import.meta.url);
const ts = require("typescript");
function compile(file: string, globals: Record<string, unknown>) {
  const exports: Record<string, any> = {};
  runInNewContext(ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, ...globals });
  return exports;
}

test("checkout storage survives blocked access, quota errors and cleanup", () => {
  const values = new Map<string, string>();
  let blocked = false;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (blocked) throw Error("quota"); values.set(key, value); },
    removeItem: (key: string) => { if (blocked) throw Error("denied"); values.delete(key); },
  };
  const window = { get localStorage() { return storage; }, get sessionStorage() { if (blocked) throw Error("denied"); return storage; } };
  const { safeLocalStorage: local, safeSessionStorage: session } = compile("lib/browser-storage.ts", { window });
  local.setItem("order", "old");
  blocked = true;
  local.setItem("order", "confirmed");
  assert.equal(local.getItem("order"), "confirmed");
  session.setItem("request", "stable-retry-key");
  assert.equal(session.getItem("request"), "stable-retry-key");
  local.removeItem("order");
  assert.equal(local.getItem("order"), null);
  session.removeItem("request");
  assert.equal(session.getItem("request"), null);
});

function cartHarness(initial: unknown[] = []) {
  const state: any[] = [], effects: (() => void)[] = [];
  let cursor = 0, first = true, value: any;
  let respond: (value: unknown) => void = () => {};
  const data = new Map([["lecomax_cart_v2", JSON.stringify(initial)]]);
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
  const hooks = {
    createContext: () => ({ Provider: "provider" }),
    useState: (initial: unknown) => { const n = cursor++; if (!(n in state)) state[n] = initial; return [state[n], (next: any) => { state[n] = typeof next === "function" ? next(state[n]) : next; }]; },
    useRef: (initial: unknown) => { const n = cursor++; if (!(n in state)) state[n] = { current: initial }; return state[n]; },
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useEffect: (fn: () => void) => { effects.push(fn); },
  };
  const module = compile("components/CartContext.tsx", {
    window: { setInterval: () => 1, clearInterval() {}, addEventListener() {}, removeEventListener() {} },
    document: { addEventListener() {}, removeEventListener() {} },
    fetch: () => new Promise(resolve => { respond = rows => resolve({ ok: true, json: async () => rows }); }),
    require(name: string) {
      if (name === "react") return hooks;
      if (name === "react/jsx-runtime") return require(name);
      if (name === "@/lib/preorder") return { selectedInventory, preorderSnapshot };
      if (name === "@/lib/browser-storage") return { safeLocalStorage: storage };
      if (name === "@/lib/product-variant-image") return { resolveProductVariantImage: (v: any) => v.fallback };
      if (name === "@/lib/product-variant-pricing") return { colorPricesFromTags };
      if (name === "@/lib/preorder-copy") return { preorderCopy: { fr: { changed: "Inventory changed" } } };
      throw Error(name);
    },
  });
  function render() { cursor = 0; effects.length = 0; value = module.CartProvider({ children: null }).props.value; first = false; }
  render(); effects.forEach(effect => effect()); render();
  return { get value() { return value; }, render, effects, respond: (rows: unknown) => respond(rows), data };
}
const product = { slug: "test-variant", name: "Variant", image: "/test.jpg", gallery: [], price: 100,
  stock: 4, colors: ["Blue", "Red"], sizes: ["M"], color_stock: { Blue: 1, Red: 3 },
  colorPrices: { Blue: { price: 120 } }, tags: ['__vstock:["Blue",{"M":1}]', '__vstock:["Red",{"M":3}]'] };

test("cart enforces selected variant limits, updates price, and prevents rapid duplicate lines", () => {
  const ui = cartHarness();
  ui.value.add(product, "M", 1, "Blue");
  ui.value.add(product, "M", 1, "Blue");
  ui.render();
  assert.equal(ui.value.items.length, 1);
  assert.equal(ui.value.items[0].quantity, 1);
  assert.equal(ui.value.items[0].price, 120);
  ui.value.setQty(product.slug, "M", "Blue", 20); ui.render();
  assert.equal(ui.value.items[0].quantity, 1);
  ui.value.add(product, "XL", 1, "Blue");
  ui.value.add({ ...product, stock: 0 }, "M", 1, "Red");
  ui.value.add(product, "M", NaN, "Red"); ui.render();
  assert.equal(ui.value.items.length, 1);
  ui.value.add({ ...product, stock: 0, preorder_enabled: true }, "M", 30, "Red"); ui.render();
  assert.equal(ui.value.items[1].quantity, 20);
  assert.equal(ui.value.items[1].fulfillment_type, "PREORDER");
});

test("cart hydration ignores corrupt records without dropping valid saved items", () => {
  const ui = cartHarness([null, { slug: "invalid" }, { ...product, size: "M", color: "Blue", quantity: 2 }]);
  assert.equal(ui.value.items.length, 1);
  assert.equal(ui.value.items[0].slug, product.slug);
});

test("inventory refresh cannot remove a product added after the request started", async () => {
  const ui=cartHarness();
  ui.value.add(product,"M",1,"Blue");ui.render();
  ui.effects.at(-1)!();
  ui.value.add({...product,slug:"second-product"},"M",1,"Red");ui.render();
  ui.respond([product]);
  for(let i=0;i<8;i++)await Promise.resolve();
  ui.render();
  assert.equal(ui.value.items.length,2);
  assert.equal(ui.value.items[1].slug,"second-product");
});

test("Ecomedia rejects malformed authenticated submissions before touching the database", async () => {
  for (const file of ["posts", "comments"]) {
    const route = compile(`app/api/ecomedia/${file}/route.ts`, {
      process: { env: {} },
      require(name: string) {
        if (name === "next/server") return { NextResponse: { json: (body: unknown, init: {status?:number} = {}) => ({body,status:init.status ?? 200}) } };
        if (name === "@supabase/supabase-js") return { createClient: () => ({ from: () => { throw Error("Malformed input reached database"); } }) };
        if (name === "@/lib/ecomedia-auth") return { getEcomediaUser: async () => ({id:"member"}) };
        if (name === "@/lib/request-body") return { readJsonLimited: (req: {json:()=>unknown}) => req.json() };
        return {};
      },
    });
    const malformed = [null, {content:42}, {content:{bad:true}}, {postId:"post",content:"valid",mediaUrl:42,parentId:42}];
    if (file === "comments") malformed.push({postId:4,content:"valid"} as any);
    for (const body of malformed) {
      const response = await route.POST({json:async()=>body});
      assert.equal(response.status,400,`${file}: ${JSON.stringify(body)}`);
    }
  }
});

test("wishlist ignores late account responses after signout and blocks rapid duplicate saves", async () => {
  const state: any[] = [], effects: (()=>void)[] = [];
  let cursor=0, first=true, value:any, authChange:any, finishHydrate:any;
  let reads=0, writes=0;
  const hooks={
    createContext:()=>({Provider:"provider"}),
    useState:(initial:unknown)=>{const n=cursor++; if(!(n in state))state[n]=initial; return [state[n],(v:any)=>{state[n]=typeof v==='function'?v(state[n]):v;}];},
    useRef:(initial:unknown)=>{const n=cursor++; if(!(n in state))state[n]={current:initial};return state[n];},
    useEffect:(fn:()=>void)=>{if(first)effects.push(fn);}, useMemo:(fn:()=>unknown)=>fn(), useCallback:(fn:unknown)=>fn,
  };
  const module=compile('components/WishlistContext.tsx',{
    setTimeout:(fn:()=>void)=>fn(),
    require(name:string){
      if(name==='react')return hooks;
      if(name==='react/jsx-runtime')return require(name);
      if(name==='@/lib/supabase')return {supabase:{auth:{getSession:async()=>({data:{session:{}}}),onAuthStateChange:(fn:any)=>{authChange=fn;return {data:{subscription:{unsubscribe(){}}}};}}}};
      if(name==='@/lib/browser-storage')return {safeLocalStorage:{getItem:()=>null,setItem(){},removeItem(){}}};
      if(name==='@/lib/collect')return {collectEvent(){}};
      if(name==='@/lib/customer-api')return {customerApiFetch:(_url:string,init?:unknown)=>{if(init){writes++;return Promise.resolve({ok:true,json:async()=>({slugs:[]})});}reads++;return new Promise(resolve=>{finishHydrate=()=>resolve({ok:true,json:async()=>({slugs:['account-only']})});});}};
      throw Error(name);
    },
  });
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  function render(){cursor=0;value=module.WishlistProvider({children:null}).props.value;first=false;}
  render();effects.forEach(fn=>fn());await flush();
  assert.equal(reads,1);
  authChange('SIGNED_OUT',null);await flush();finishHydrate();await flush();render();
  assert.equal(value.authenticated,false);assert.equal(value.slugs.size,0);
  authChange('SIGNED_IN',{});await flush();finishHydrate();await flush();render();
  const one=value.toggle('new-favorite');const two=value.toggle('new-favorite');await Promise.all([one,two]);render();
  assert.equal(writes,1);assert.equal(value.slugs.has('new-favorite'),true);
});
