import test from "node:test";
import assert from "node:assert/strict";
import { describeSourceFile, explainSourceLine } from "../lib/source-code-guide.ts";

const explain = (source: string, line = 1, path = "app/example.tsx") => explainSourceLine(path, source.split("\n"), line, "en");

test("explanations refer to actual imported tools and state names", () => {
  const imported = explain('import Link from "next/link";');
  assert.equal(imported.kind, "import");
  assert.match(imported.meaning, /Link.*next\/link/);
  const state = explain('const [cart, setCart] = useState<Product[]>([]);');
  assert.equal(state.kind, "state");
  assert.match(state.meaning, /cart.*setCart/);
  assert.match(state.purpose, /updated cart/);
});

test("common interactive patterns take precedence over generic declarations", () => {
  for (const [source, kind] of [
    ['const response = await fetch("/api/products");', "request"],
    ['return NextResponse.json({ ok: true });', "response"],
    ['<button onClick={() => setOpen(true)}>Open</button>', "event"],
    ['const cards = products.map(product => product.name);', "list"],
    ['return products.filter(product => product.price > 0);', "filter"],
    ['useEffect(() => {', "effect"],
    ['const results = useMemo(() => items, [items]);', "memo"],
    ['const input = useRef<HTMLInputElement>(null);', "ref"],
    ['if (!user) return;', "condition"],
    ['localStorage.setItem("theme", "dark");', "storage"],
    ['export default function ProductCard() {', "function"],
    ['type Product = { price: number };', "type"],
    ['return total;', "return"],
    ['<h1>{title}</h1>', "interface"],
    ['const total = price * quantity;', "variable"],
  ]) assert.equal(explain(source).kind, kind, source);
});

test("comments and strings are not explained as executable calls", () => {
  assert.equal(explain('// useState(0)').kind, "comment");
  assert.equal(explain('/*\nuseState(0)\n*/', 2).kind, "comment");
  assert.equal(explain('const text = "useState(0)";').kind, "variable");
  assert.equal(explain('const message = `\nfetch("/api/private")\n`;', 2).kind, "context");
  assert.equal(explain('const name = "example"; // fetch("/")').kind, "variable");
});

test("unrecognized lines admit the need for context", () => {
  const result = explain('performCustomOperation();');
  assert.equal(result.recognized, false);
  assert.equal(result.kind, "context");
  assert.match(result.meaning, /does not recognize/);
});

test("file format changes the explanation instead of treating documentation as code", () => {
  assert.equal(explain('useState(0)', 1, "docs/guide.md").kind, "document");
  assert.equal(explain('"label": "fetch()"', 1, "data.json").kind, "data");
  assert.equal(explain('padding: 16px;', 1, "app/globals.css").kind, "style");
  assert.equal(explain('SELECT name FROM products;', 1, "supabase/schema.sql").kind, "database");
  assert.match(explain('"dev": "next dev",', 1, "package.json").example, /npm run dev/);
});

test("French, English and Arabic use their own explanation text", () => {
  const source = ['const [count, setCount] = useState(0);'];
  const fr = explainSourceLine("app/test.tsx", source, 1, "fr");
  const en = explainSourceLine("app/test.tsx", source, 1, "en");
  const ar = explainSourceLine("app/test.tsx", source, 1, "ar");
  assert.match(fr.title, /mémoire/);
  assert.match(en.title, /memory/);
  assert.match(ar.title, /ذاكرة/);
  for (const item of [fr, en, ar]) {
    assert.match(item.meaning, /count/);
    assert.ok(item.purpose && item.example);
  }
});

test("line bounds and empty files remain readable", () => {
  assert.equal(explain("const first = 1;\nreturn first;", 999).kind, "return");
  assert.equal(explain("const first = 1;", -10).kind, "variable");
  assert.equal(explain("const first = 1;", Infinity).kind, "variable");
  assert.equal(explainSourceLine("app/empty.ts", [], 1, "en").kind, "space");
});

test("file role differentiates pages, APIs, reusable code, and tests", () => {
  assert.match(describeSourceFile("app/page.tsx", "en"), /website page/);
  assert.match(describeSourceFile("app/api/products/route.ts", "en"), /API entry/);
  assert.match(describeSourceFile("components/ProductCard.tsx", "en"), /reusable interface/);
  assert.match(describeSourceFile("lib/cart.ts", "en"), /shared project tool/);
  assert.match(describeSourceFile("tests/cart.test.ts", "en"), /automated test/);
});
