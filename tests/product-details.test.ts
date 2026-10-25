import test from "node:test";
import assert from "node:assert/strict";
import { productDetailsFromTags } from "../mobile/src/lib/product-details.ts";

test("admin detail rows preserve wording, order and colons in values", () => {
  assert.deepEqual(productDetailsFromTags([
    "running", "__guide:shoes", "__detail:État:Très bon état",
    "__detail:Couleur:Violet : corail", "__detail:Matière:Mesh",
  ]), [
    { key: "État", value: "Très bon état" },
    { key: "Couleur", value: "Violet : corail" },
    { key: "Matière", value: "Mesh" },
  ]);
});

test("missing and incomplete details do not invent product specifications", () => {
  assert.deepEqual(productDetailsFromTags(), []);
  assert.deepEqual(productDetailsFromTags(null), []);
  assert.deepEqual(productDetailsFromTags(["__detail:broken", "__detail::value", "__detail:Key:  "]), []);
});
