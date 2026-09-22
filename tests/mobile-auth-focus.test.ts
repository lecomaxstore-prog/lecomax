import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.createSourceFile("auth.tsx", readFileSync(new URL(
  "../mobile/src/app/auth.tsx", import.meta.url,
), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const inputs: ts.JsxSelfClosingElement[] = [];
let scroll: ts.JsxOpeningElement;
function visit(node: ts.Node) {
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "TextInput") inputs.push(node);
  if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === "ScrollView") scroll = node;
  ts.forEachChild(node, visit);
}
visit(source);
function prop(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement, name: string) {
  const attribute = node.attributes.properties.find((item) =>
    ts.isJsxAttribute(item) && item.name.getText(source) === name,
  ) as ts.JsxAttribute | undefined;
  const value = attribute?.initializer;
  return value && ts.isJsxExpression(value) ? value.expression?.getText(source) : value?.getText(source);
}
const fields = ["firstName", "lastName", "email", "password", "confirmPassword"];

test("all five auth inputs retain their native parent when focus styling changes", () => {
  assert.equal(inputs.length, fields.length);
  for (const [index, input] of inputs.entries()) {
    const parent = input.parent;
    assert.ok(ts.isJsxElement(parent));
    // Focus adds shadowColor/elevation: Fabric otherwise changes this View's
    // FormsStackingContext trait and reparents its native TextInput children.
    assert.equal(prop(parent.openingElement, "collapsable"), "false", fields[index]);
    assert.match(prop(parent.openingElement, "style")!, /styles\.inputShellFocused/);
    assert.equal(prop(input, "autoFocus"), undefined);
    for (let ancestor: ts.Node | undefined = input; ancestor; ancestor = ancestor.parent) {
      const opening = ts.isJsxElement(ancestor) ? ancestor.openingElement : ancestor;
      if (ts.isJsxOpeningElement(opening) || ts.isJsxSelfClosingElement(opening)) {
        assert.equal(prop(opening, "key"), undefined, "No state-dependent subtree keys");
      }
    }
  }
});

test("Next explicitly focuses the following field without submitting or blurring", () => {
  for (const [index, input] of inputs.slice(0, 4).entries()) {
    const calls: string[] = [];
    const context: Record<string, unknown> = { mode: "signup", submit: () => calls.push("submit") };
    for (const name of fields.slice(1)) context[`${name}Ref`] = { current: { focus: () => calls.push(name) } };
    const behavior = vm.runInNewContext(`(${prop(input, "submitBehavior")})`, context);
    assert.equal(behavior, "submit");
    const next = vm.runInNewContext(`(${prop(input, "onSubmitEditing")})`, context);
    assert.deepEqual(calls, [], "Rendering must not move focus");
    next();
    assert.deepEqual(calls, [fields[index + 1]]);
    assert.equal(prop(inputs[index + 1], "ref"), `${fields[index + 1]}Ref`);
  }
});

test("final Done submits only when invoked and scrolling keeps the keyboard", () => {
  let submissions = 0;
  const done = vm.runInNewContext(`(${prop(inputs[4], "onSubmitEditing")})`, {
    submit: () => { submissions++; },
  });
  assert.equal(submissions, 0);
  done();
  assert.equal(submissions, 1);
  assert.equal(prop(inputs[4], "submitBehavior"), '"blurAndSubmit"');
  assert.equal(prop(scroll, "keyboardShouldPersistTaps"), '"handled"');
  assert.equal(prop(scroll, "keyboardDismissMode"), '"none"');
  assert.equal(prop(scroll, "removeClippedSubviews"), "false");
});
