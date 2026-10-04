import test from "node:test";
import assert from "node:assert/strict";
import { attachSourceInspector, type SourceSelection } from "../lib/site-source-inspector.ts";
import { learningDestination } from "../lib/site-learning.ts";

function preview() {
  const listeners = new Map<string, (event: Event) => void>();
  const selected: SourceSelection[] = [];
  const opened: string[] = [];
  const doc = {
    baseURI: "http://localhost:3000/",
    createElement: () => ({ textContent: "", remove() {} }),
    head: { appendChild() {} }, documentElement: { removeAttribute() {} },
    addEventListener: (type: string, listener: (event: Event) => void) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  } as unknown as Document;
  const detach = attachSourceInspector(doc, "app/page.tsx", value => selected.push(value), href => {
    if (!learningDestination(href)) return false;
    opened.push(href); return true;
  });
  function target(href?: string) {
    // The marker is on the surrounding header, but the actual click is on
    // an icon nested inside a link. Link detection must use the event target.
    const region = { tagName: "HEADER", textContent: "Shop", getAttribute: (name: string) => name === "data-source-file" ? "components/Header.tsx" : null };
    const control = { getAttribute: (name: string) => name === "href" ? href : null,
      closest: (selector: string) => selector === "[data-source-file]" ? region : null };
    return { closest: (selector: string) => selector === "a[href]" ? (href === undefined ? null : control)
      : selector === "button, a, input, select, textarea" ? control : null };
  }
  function click(element: ReturnType<typeof target>, detail = 1, type = "click", pointerType = "mouse") {
    let blocked = 0;
    listeners.get(type)?.({ type, target: element, detail, pointerType,
      preventDefault() { blocked++; }, stopImmediatePropagation() { blocked++; } } as unknown as Event);
    assert.equal(blocked, 2, "Normal storefront actions must remain intercepted");
  }
  return { target, click, selected, opened, detach, listeners };
}

test("single pointer click opens its code after the double-click interval", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const ui = preview();
  ui.click(ui.target("/boutique"));
  assert.equal(ui.selected.length, 0);
  context.mock.timers.tick(400);
  assert.equal(ui.selected.length, 1);
  assert.equal(ui.selected[0].href, "/boutique");
  assert.deepEqual(ui.opened, []);
  ui.detach();
});

test("double-click and double-tap open a supported page once without opening a lesson", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  for (const pointerType of ["mouse", "touch"]) {
    const ui = preview();
    const link = ui.target("/produit/veste");
    ui.click(link, 1, "click", pointerType);
    context.mock.timers.tick(100);
    ui.click(link, pointerType === "touch" ? 1 : 2, "click", pointerType);
    ui.click(link, 2, "dblclick", pointerType);
    context.mock.timers.tick(500);
    assert.deepEqual(ui.opened, ["/produit/veste"]);
    assert.equal(ui.selected.length, 0);
    ui.detach();
  }
});

test("keyboard clicks and action buttons still explain code without triggering actions", () => {
  const ui = preview();
  ui.click(ui.target("/boutique"), 0);
  ui.click(ui.target());
  assert.equal(ui.selected.length, 2);
  assert.deepEqual(ui.opened, []);
  ui.detach();
});

test("external, API and admin destinations cannot be opened with a double tap", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const ui = preview();
  for (const href of ["https://example.com", "/api/orders", "/admin/settings"]) {
    const link = ui.target(href);
    ui.click(link); ui.click(link, 2);
  }
  assert.deepEqual(ui.opened, []);
  assert.equal(ui.selected.length, 3);
  ui.detach();
});

test("changing preview cancels a pending lesson and removes event handlers", context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const ui = preview();
  ui.click(ui.target("/boutique"));
  ui.detach();
  context.mock.timers.tick(500);
  assert.equal(ui.selected.length, 0);
  assert.equal(ui.listeners.size, 0);
});
