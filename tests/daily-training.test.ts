import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DAILY_LESSONS, dailyText } from "../app/admin/how-it-was-built/course/daily-lessons.ts";
import { DAILY_CODE, findDailyExcerpt } from "../app/admin/how-it-was-built/course/daily-code.ts";
import { recordTrainingDay, readDailyProgress, resumeDailyLesson } from "../app/admin/how-it-was-built/course/daily-progress.ts";

const entry = { note: "My own explanation", practiced: true, compared: false };

test("daily attendance survives reload, deduplicates, and can be undone without losing notes", () => {
  const first = recordTrainingDay(entry, "2026-09-23", true);
  const again = recordTrainingDay(first, "2026-09-23", true);
  const nextDay = recordTrainingDay(again, "2026-09-24", true);
  const restored = readDailyProgress(JSON.parse(JSON.stringify({ website: nextDay })), ["website"]).website;
  assert.deepEqual(restored.trainedDays, ["2026-09-23", "2026-09-24"]);
  const undone = recordTrainingDay(restored, "2026-09-24", false);
  assert.deepEqual(undone.trainedDays, ["2026-09-23"]);
  assert.equal(undone.note, entry.note);
  assert.equal(undone.practiced, true);
  assert.equal(undone.completedOn, undefined, "attendance does not fabricate a quiz pass");
  assert.equal(first.trainedDays?.length, 1, "existing entries are not mutated");
});

test("returning tomorrow advances to the next untrained lesson without requiring a quiz", () => {
  const progress = { website: recordTrainingDay(entry, "2026-09-23", true) };
  assert.equal(resumeDailyLesson(progress, ["website", "files", "html"], "2026-09-23"), 0);
  assert.equal(resumeDailyLesson(progress, ["website", "files", "html"], "2026-09-24"), 1);
  assert.equal(resumeDailyLesson(progress, ["website", "files", "html"], "2026-10-24"), 1);
});

test("malformed attendance is ignored and invalid calendar dates are rejected", () => {
  for (const date of ["wrong", "2026-02-31", "2026-13-01"]) assert.equal(recordTrainingDay(entry, date, true), entry);
  const restored = readDailyProgress({ website: { ...entry, trainedDays: [null, {}, "2026-02-31", "2026-09-23", "2026-09-23"] } }, ["website"]);
  assert.deepEqual(restored.website.trainedDays, ["2026-09-23"]);
});

test("all lessons locate short excerpts in real source with translated why and consequence explanations", () => {
  assert.deepEqual(Object.keys(DAILY_CODE).sort(), DAILY_LESSONS.map(lesson => lesson.id).sort());
  for (const lesson of DAILY_LESSONS) {
    const guide = DAILY_CODE[lesson.id];
    const source = readFileSync(lesson.file, "utf8");
    const excerpt = findDailyExcerpt(source, guide);
    assert.ok(excerpt, `${lesson.id}: anchor missing in ${lesson.file}`);
    assert.ok(excerpt.lines.length > 0 && excerpt.lines.length <= 8);
    assert.equal(excerpt.lines.join("\n"), source.split(/\r?\n/).slice(excerpt.start - 1, excerpt.start - 1 + guide.count).join("\n"));
    for (const lang of ["fr", "en", "ar"] as const) {
      assert.ok(dailyText(lang, guide.why).length > 40);
      assert.ok(dailyText(lang, guide.without).length > 40);
      for (const [, definition] of guide.vocabulary) assert.ok(dailyText(lang, definition).length > 10);
    }
  }
});

test("source changes never silently show an unrelated excerpt", () => {
  assert.equal(findDailyExcerpt("unrelated code", DAILY_CODE.website), null);
});
