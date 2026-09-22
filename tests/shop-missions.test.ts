import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { SHOP_MISSIONS, readMissionProgress } from "../app/admin/how-it-was-built/course/shop-missions.ts";

test("restored workshop progress ignores corrupt values, unknown IDs and duplicates", () => {
  assert.deepEqual(readMissionProgress(null), []);
  assert.deepEqual(readMissionProgress({ done: ["page"] }), []);
  assert.deepEqual(readMissionProgress(["page", "page", null, 4, "unknown", "state"]), ["page", "state"]);
});

test("every workshop leads to an existing course and offers a valid TSX example", () => {
  const manifest = JSON.parse(readFileSync(new URL("../app/admin/how-it-was-built/course/generated/manifest.json", import.meta.url), "utf8"));
  for (const mission of SHOP_MISSIONS) {
    assert.ok(manifest.modules.some((item: { id: string }) => item.id === mission.moduleId), mission.id);
    const code = mission.before + (mission.after ? mission.options[mission.answer] : "") + mission.after;
    const result = ts.transpileModule(code, { fileName: "example.tsx", reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022 } });
    assert.deepEqual(result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error), [], mission.id);
    assert.equal(mission.explanations.length, mission.options.length);
    for (const localized of [mission.title, mission.idea, mission.task, mission.transfer, ...mission.explanations]) {
      assert.equal(localized.length, 3);
      assert.ok(localized.every(text => text.trim().length > 0), mission.id);
    }
  }
});
