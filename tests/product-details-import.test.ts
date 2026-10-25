import test from "node:test";
import assert from "node:assert/strict";
import { parseDetailsPaste, mergeImportedDetails, validateImportedDetails } from "../lib/product-details-import.ts";

test("imports ChatGPT markdown bullets, tables and JSON", () => {
  assert.deepEqual(parseDetailsPaste("- **Matière :** coton\n- Coupe : droite"), [{ key: "Matière", value: "coton" }, { key: "Coupe", value: "droite" }]);
  assert.deepEqual(parseDetailsPaste("| Caractéristique | Valeur |\n| --- | --- |\n| Entretien | Lavage à 30 °C |"), [{ key: "Entretien", value: "Lavage à 30 °C" }]);
  assert.deepEqual(parseDetailsPaste('```json\n{"Origine":"Maroc"}\n```'), [{ key: "Origine", value: "Maroc" }]);
});
test("updates matching labels and preserves unrelated existing details without mutation", () => {
  const existing = [{ key: "Matière", value: "laine" }, { key: "Origine", value: "Maroc" }];
  assert.deepEqual(mergeImportedDetails(existing, [{ key: "matiere", value: "coton" }]), [{ key: "matiere", value: "coton" }, existing[1]]);
  assert.equal(existing[0].value, "laine");
});
test("rejects invalid, oversized and unsafe details", () => {
  for (const input of [null, [{ key: "A:B", value: "c" }], [{ key: "Matière", value: "<script>x</script>" }], Array(41).fill({ key: "a", value: "b" })]) assert.throws(() => validateImportedDetails(input));
  assert.throws(() => parseDetailsPaste("a".repeat(20001)));
  assert.throws(() => parseDetailsPaste("Texte sans détail structuré"));
});
