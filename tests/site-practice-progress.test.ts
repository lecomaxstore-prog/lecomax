import test from "node:test";
import assert from "node:assert/strict";
import { readPracticeProgress, missionComplete } from "../lib/site-practice-progress.ts";

test("invalid stored data restores a usable starting point", () => {
  for (const raw of [null, [], "bad", { active: "unknown", steps: { local: "all" }, notes: null, passed: true }]) {
    const progress = readPracticeProgress(raw);
    assert.equal(progress.active, "local");
    assert.deepEqual(progress.steps.local, []);
    assert.equal(missionComplete(progress, "local"), false);
  }
});

test("saved progress resumes the chosen mission and bounds untrusted fields", () => {
  const progress = readPracticeProgress({ active: "api", steps: { api: [0, 0, 1, 2, 3, -1, 0.5, "1"] }, notes: { api: "a".repeat(3000) }, passed: ["api", "api", "unknown"] });
  assert.equal(progress.active, "api");
  assert.deepEqual(progress.steps.api, [0, 1, 2]);
  assert.equal(progress.notes.api.length, 2000);
  assert.deepEqual(progress.passed, ["api"]);
});

test("completion needs both practice and a correct quiz answer", () => {
  const progress = readPracticeProgress({ steps: { local: [0, 1, 2], vercel: [0, 1, 2] }, passed: ["api", "vercel"] });
  assert.equal(missionComplete(progress, "local"), false);
  assert.equal(missionComplete(progress, "api"), false);
  assert.equal(missionComplete(progress, "vercel"), false);
  progress.steps.vercel.push(3);
  assert.equal(missionComplete(progress, "vercel"), true);
  progress.steps.vercel.pop();
  assert.equal(missionComplete(progress, "vercel"), false);
});

test("notes and completed missions survive a save and restore", () => {
  const progress = readPracticeProgress({ active: "github", steps: { github: [0, 1, 2] }, notes: { github: "Commit محلي، push يرسل." }, passed: ["github"] });
  const restored = readPracticeProgress(JSON.parse(JSON.stringify(progress)));
  assert.deepEqual(restored, progress);
  assert.equal(missionComplete(restored, "github"), true);
});
