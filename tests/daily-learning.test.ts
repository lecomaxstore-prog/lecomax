import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { DAILY_LESSONS, dailyText } from "../app/admin/how-it-was-built/course/daily-lessons.ts";
import { readDailyProgress, recordDailyAttempt, resumeDailyLesson } from "../app/admin/how-it-was-built/course/daily-progress.ts";
import { DAILY_TESTS, DAILY_TEST_VERSION, gradeDailyTest } from "../app/admin/how-it-was-built/course/daily-tests.ts";

const blank = { note: "My notes", practiced: true, compared: false };
const correctAnswers = (id: string) => DAILY_TESTS[id].map(question => question.correctIndex);
const pass = (id: string, date: string) => recordDailyAttempt(id, blank, correctAnswers(id), date)!;

test("every daily lesson has a real project file and complete content in all three languages", async () => {
  assert.equal(DAILY_LESSONS.length, 14);
  assert.equal(new Set(DAILY_LESSONS.map(lesson => lesson.id)).size, 14);
  for (const lesson of DAILY_LESSONS) {
    await access(lesson.file);
    for (const field of ["title", "idea", "example", "task", "question", "answer"] as const) {
      for (const lang of ["fr", "en", "ar"] as const) {
        assert.ok(dailyText(lang, lesson[field]).trim().length > 8, `${lesson.id}/${lang}/${field}`);
      }
    }
  }
});

test("resume celebrates today's lesson, advances tomorrow, and does not skip missed lessons", () => {
  const ids = ["website", "files", "html"];
  const progress = readDailyProgress({ website: pass("website", "2026-09-23"), html: pass("html", "2026-09-21") }, ids);
  assert.equal(resumeDailyLesson(progress, ids, "2026-09-23"), 0);
  assert.equal(resumeDailyLesson(progress, ids, "2026-09-24"), 1);
  assert.equal(resumeDailyLesson(progress, ids, "2026-10-10"), 1);
  assert.equal(resumeDailyLesson({}, ids, "2026-09-23"), 0);
});

test("saved notes survive reload and malformed or unrelated storage is ignored", () => {
  const input = { a: { note: "The server checks permission", practiced: true, compared: true, completedOn: "2026-09-23" }, unknown: { note: "ignore" }, b: { note: 12, practiced: "true", completedOn: 4 } };
  const saved = readDailyProgress(JSON.parse(JSON.stringify(input)), ["a", "b"]);
  assert.equal(saved.a.note, input.a.note);
  assert.equal(saved.a.practiced, true);
  assert.equal(saved.a.completedOn, undefined);
  assert.equal(saved.a.readOn, "2026-09-23");
  assert.deepEqual(saved.b, { note: "", practiced: false, compared: false });
  assert.equal(saved.unknown, undefined);
  assert.deepEqual(readDailyProgress(null, ["a"]), {});
  assert.deepEqual(readDailyProgress([], ["a"]), {});
  assert.equal(readDailyProgress({ a: { note: "x".repeat(2000) } }, ["a"]).a.note.length, 1500);
});

test("a completed course stays reviewable", () => {
  const ids = ["website", "files"];
  const saved = readDailyProgress({ website: pass("website", "2026-09-20"), files: pass("files", "2026-09-21") }, ids);
  assert.equal(resumeDailyLesson(saved, ids, "2026-09-23"), 1);
});

test("each daily lesson has three translated questions, distinct choices and explanations", () => {
  assert.deepEqual(Object.keys(DAILY_TESTS).sort(), DAILY_LESSONS.map(lesson => lesson.id).sort());
  for (const lesson of DAILY_LESSONS) {
    const questions = DAILY_TESTS[lesson.id];
    assert.equal(questions.length, 3);
    for (const question of questions) {
      assert.equal(question.options.length, 3);
      assert.ok(question.correctIndex >= 0 && question.correctIndex < 3);
      for (const lang of ["fr", "en", "ar"] as const) {
        assert.ok(dailyText(lang, question.question).length > 10);
        assert.ok(dailyText(lang, question.explanation).length > 10);
        assert.equal(new Set(question.options.map(option => dailyText(lang, option))).size, 3);
      }
    }
  }
});

test("all answers must be correct and valid; incomplete or malformed submissions never pass", () => {
  for (const id of Object.keys(DAILY_TESTS)) {
    const answers = correctAnswers(id);
    assert.deepEqual(gradeDailyTest(id, answers), { score: 3, total: 3, percent: 100, passed: true, correct: [true, true, true] });
    answers[1] = (answers[1] + 1) % 3;
    assert.equal(gradeDailyTest(id, answers)?.passed, false);
    assert.equal(gradeDailyTest(id, answers)?.score, 2);
  }
  for (const answers of [undefined, null, [], [0, 1], [0, 1, 2, 0], ["0", 1, 2], [0, -1, 2], [0, 3, 2], [0, 1.5, 2], Array(3)]) assert.equal(gradeDailyTest("website", answers), null);
  for (const id of ["missing", "__proto__", "toString"]) assert.equal(gradeDailyTest(id, [0, 1, 2]), null);
});

test("a failed test cannot complete a lesson; a successful retry stores score evidence and attempts", () => {
  const wrong = correctAnswers("website").map(answer => (answer + 1) % 3);
  const first = recordDailyAttempt("website", blank, wrong, "2026-09-23")!;
  assert.equal(first.completedOn, undefined);
  assert.equal(first.assessment?.attempts, 1);
  const second = recordDailyAttempt("website", first, correctAnswers("website"), "2026-09-24")!;
  assert.equal(second.completedOn, "2026-09-24");
  assert.equal(second.assessment?.attempts, 2);
  assert.equal(second.note, blank.note);
  const restored = readDailyProgress(JSON.parse(JSON.stringify({ website: second })), ["website"]);
  assert.equal(restored.website.completedOn, "2026-09-24");
  assert.equal(restored.website.assessment?.attempts, 2);
  assert.equal(recordDailyAttempt("website", { ...blank, practiced: false }, correctAnswers("website"), "2026-09-24"), null);
});

test("legacy completions and stale or fabricated scores cannot count as validated", () => {
  const previous = { ...blank, completedOn: "2026-09-23" };
  const legacy = readDailyProgress({ website: previous }, ["website"]).website;
  assert.equal(legacy.completedOn, undefined);
  assert.equal(legacy.readOn, "2026-09-23");
  assert.equal(legacy.note, blank.note);
  for (const assessment of [
    { version: DAILY_TEST_VERSION + 1, answers: correctAnswers("website"), attempts: 1, submittedOn: "2026-09-23" },
    { version: DAILY_TEST_VERSION, answers: [0, 0, 0], score: 100, passed: true, attempts: 1, submittedOn: "2026-09-23" },
    { version: DAILY_TEST_VERSION, answers: correctAnswers("website"), attempts: "1", submittedOn: "2026-09-23" },
  ]) assert.equal(readDailyProgress({ website: { ...previous, assessment } }, ["website"]).website.completedOn, undefined);
});
