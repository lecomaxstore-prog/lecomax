import ts from "typescript";

export type SourceConnection = {
  kind: "import" | "parent" | "api" | "table" | "bucket" | "browser";
  name: string;
  line: number;
  target?: string;
  origin?: string;
};
export type SourceConnections = {
  items: SourceConnection[];
  attributes: { name: string; expression: string; line: number }[];
  truncated: boolean;
};
type SourceFile = { path: string; content: string };

/** Static evidence only: no evaluation, requests, filesystem reads or inferred data flow. */
export function inspectSourceConnections(file: SourceFile, files: SourceFile[], selectedLine = 1): SourceConnections {
  const known = new Set(files.map(item => item.path));
  const result: SourceConnections = { items: [], attributes: [], truncated: false };
  if (!/\.[cm]?[jt]sx?$/.test(file.path)) return result;
  const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, file.path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const literal = (node?: ts.Node) => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
  const resolve = (specifier: string, from = file.path) => {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return;
    const parts = (specifier.startsWith("@/") ? specifier.slice(2) : from.slice(0, from.lastIndexOf("/") + 1) + specifier).split("/");
    const normalized: string[] = [];
    for (const part of parts) { if (part === "..") normalized.pop(); else if (part && part !== ".") normalized.push(part); }
    const base = normalized.join("/");
    return [base, ...[".ts", ".tsx", ".js", ".jsx", ".css", "/index.ts", "/index.tsx"].map(extension => base + extension)].find(path => known.has(path));
  };
  const add = (kind: SourceConnection["kind"], name: string, node: ts.Node, target?: string) => {
    if (result.items.some(item => item.kind === kind && item.name === name && item.target === target)) return;
    if (result.items.length >= 36) { result.truncated = true; return; }
    result.items.push({ kind, name: name.slice(0, 180), line: lineOf(node), ...(target ? { target } : {}) });
  };
  const inspectImport = (value: string | undefined, node: ts.Node) => {
    if (!value) return;
    const target = resolve(value);
    if (target) add("import", value, node, target);
  };
  const inspectFetch = (arg: ts.Expression | undefined, node: ts.Node) => {
    const text = literal(arg) ?? (arg && ts.isTemplateExpression(arg) ? [arg.head.text, ...arg.templateSpans.map(span => span.literal.text)].join("{…}") : "");
    if (text.startsWith("/api/")) {
      const address = text.split(/[?#]/)[0];
      const target = `app${address}/route.ts`;
      add("api", address, node, known.has(target) ? target : undefined);
    }
    // A REST URL is a table reference, not proof that the selected element uses it.
    const table = /\/rest\/v1\/([a-zA-Z_][\w]*)(?:[?#/]|$)/.exec(text)?.[1];
    if (table) add("table", table, node);
  };
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) inspectImport(literal(node.moduleSpecifier), node);
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) inspectImport(literal(node.arguments[0]), node);
      if (ts.isIdentifier(node.expression) && node.expression.text === "fetch") inspectFetch(node.arguments[0], node);
      if (ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text;
        const receiver = node.expression.expression.getText(source);
        const value = literal(node.arguments[0]);
        if (value && /^(?:getItem|setItem|removeItem)$/.test(method) && /^(?:window\.)?(?:localStorage|sessionStorage)$/.test(receiver)) add("browser", `${receiver.replace("window.", "")}: ${value}`, node);
        if (value && method === "from" && /^(?:supabase|sb|client)(?:\.(?:storage))?$/.test(receiver)) add(receiver.endsWith(".storage") ? "bucket" : "table", value, node);
      }
    }
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && lineOf(node) === selectedLine && result.attributes.length === 0) {
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr) || !attr.initializer) continue;
        const name = attr.name.getText(source);
        if (!["src", "href", "onClick", "onChange", "onSubmit", "className", "alt", "value"].includes(name)) continue;
        result.attributes.push({ name, expression: attr.initializer.getText(source).slice(0, 240), line: lineOf(attr) });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  // Show actual importing files so the learner can inspect parent props too.
  const stem = file.path.split("/").pop()!.replace(/\.[^.]+$/, "");
  let parentCount = 0;
  for (const candidate of files) {
    if (candidate.path === file.path || !/^(?:app|components|lib)\//.test(candidate.path) || !/\.[jt]sx?$/.test(candidate.path) || !candidate.content.includes(stem)) continue;
    const parent = ts.createSourceFile(candidate.path, candidate.content, ts.ScriptTarget.Latest, true, candidate.path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    let reference: ts.Node | undefined;
    function find(node: ts.Node) {
      const specifier = ts.isImportDeclaration(node) ? literal(node.moduleSpecifier) : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? literal(node.arguments[0]) : undefined;
      if (specifier && resolve(specifier, candidate.path) === file.path) reference ??= node;
      if (!reference) ts.forEachChild(node, find);
    }
    find(parent);
    if (reference) {
      if (parentCount >= 6 || result.items.length >= 36) { result.truncated = true; break; }
      result.items.push({ kind: "parent", name: candidate.path, target: candidate.path, origin: candidate.path, line: parent.getLineAndCharacterOfPosition(reference.getStart(parent)).line + 1 });
      parentCount++;
    }
  }
  return result;
}
