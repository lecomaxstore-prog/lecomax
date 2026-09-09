import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSize, sizeGuideRows, usesClothingSizes } from "../mobile/src/lib/size-guide.ts";

test("letter sizes use clothing tables while numeric shoe sizes keep shoe tables", () => {
  assert.equal(usesClothingSizes(["S", "M", "L"]), true);
  assert.equal(usesClothingSizes([" xs ", "2XL"]), true);
  assert.equal(usesClothingSizes(["38", "39", "40"]), false);
});

test("selected M matches the clothing label, not a shoe conversion", () => {
  const rows = sizeGuideRows({
    clothing: [{ label: "M", fr: "38-40", poitrine: "90-94", taille: "70-74" }],
    shoes: [{ eu: "40", us: "7", uk: "6", cm: "25" }],
  }, true, [" m "]);
  assert.equal(rows.length, 1);
  assert.equal(normalizeSize(rows[0].size), normalizeSize(" m "));
  assert.deepEqual(rows[0].values, ["38-40", "90-94", "70-74"]);
});

test("sizes absent from merchant measurements remain visible without invented measurements", () => {
  assert.deepEqual(sizeGuideRows({ clothing: [] }, true, ["3XL"]), [
    { size: "3XL", values: ["—", "—", "—"] },
  ]);
});
