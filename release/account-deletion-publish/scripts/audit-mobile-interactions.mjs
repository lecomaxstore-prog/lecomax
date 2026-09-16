import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const mobileSource = path.join(root, "mobile", "src");
const interactive = new Set([
  "Pressable",
  "AnimatedPressable",
  "TouchableOpacity",
  "TouchableHighlight",
  "Button",
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else if (entry.name.endsWith(".tsx")) files.push(target);
  }
  return files;
}

function tagName(node) {
  return node.tagName?.getText() ?? "";
}

function attributes(node) {
  return new Set(
    (node.attributes?.properties ?? [])
      .filter(ts.isJsxAttribute)
      .map((attribute) => attribute.name.getText()),
  );
}

function position(source, node) {
  const point = source.getLineAndCharacterOfPosition(node.getStart(source));
  return { line: point.line + 1, column: point.character + 1 };
}

const findings = [];
const metrics = {
  screens: 0,
  components: 0,
  interactiveControls: 0,
  textInputs: 0,
};

for (const filename of await walk(mobileSource)) {
  const relative = path.relative(root, filename).split(path.sep).join("/");
  const content = await readFile(filename, "utf8");
  const source = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  if (relative.includes("/src/app/")) metrics.screens += 1;
  if (relative.includes("/src/components/")) metrics.components += 1;

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = tagName(node);
      const props = attributes(node);
      const location = position(source, node);
      if (interactive.has(tag)) {
        metrics.interactiveControls += 1;
        if (!props.has("onPress") && !props.has("href")) {
          findings.push({
            severity: "error",
            rule: "control-has-action",
            file: relative,
            ...location,
            tag,
          });
        }
        if (!props.has("accessibilityLabel") && !props.has("aria-label")) {
          findings.push({
            severity: "warning",
            rule: "control-has-accessible-label",
            file: relative,
            ...location,
            tag,
          });
        }
      }
      if (tag === "TextInput") {
        metrics.textInputs += 1;
        if (!props.has("accessibilityLabel") && !props.has("aria-label")) {
          findings.push({
            severity: "warning",
            rule: "input-has-accessible-label",
            file: relative,
            ...location,
            tag,
          });
        }
      }
      if (
        props.has("accessibilityRole") &&
        content.slice(node.getStart(), node.getEnd()).includes('"switch"')
      ) {
        if (!props.has("accessibilityState")) {
          findings.push({
            severity: "error",
            rule: "switch-exposes-state",
            file: relative,
            ...location,
            tag,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const errors = findings.filter(
  (finding) => finding.severity === "error",
).length;
const warnings = findings.length - errors;
console.log(
  JSON.stringify(
    {
      ok: errors === 0,
      metrics,
      errors,
      warnings,
      findings,
    },
    null,
    2,
  ),
);
if (errors) process.exitCode = 1;
