import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DAILY_PATH, emptySession, finishSession, nextDailySession, readSessions, gradeSession } from "../app/admin/how-it-was-built/course/daily-path.ts";

test("a day only completes after practice and all correct answers", () => {
  assert.equal(finishSession(emptySession, [1, 0, 1], [1, 0, 1], "2026-09-23"), emptySession);
  const entry = { ...emptySession, practiced: true, note: "The database stores products." };
  assert.equal(finishSession(entry, [1, 2, 1], [1, 0, 1], "2026-09-23").completedOn, undefined);
  assert.equal(finishSession(entry, [1], [1, 0, 1], "2026-09-23").completedOn, undefined);
  const passed = finishSession(entry, [1, 0, 1], [1, 0, 1], "2026-09-23");
  assert.equal(passed.completedOn, "2026-09-23");
  assert.equal(finishSession(passed, [0, 0, 0], [1, 0, 1], "2026-09-24"), passed, "review cannot erase an earned completion");
  assert.equal(passed.note, entry.note);
  assert.equal(gradeSession([], []).passed, false);
});
test("same day celebrates; tomorrow advances; missed days never skip a lesson", () => {
  const progress = { website: finishSession({ ...emptySession, practiced: true }, [1, 0, 1], [1, 0, 1], "2026-09-23") };
  assert.equal(nextDailySession(progress, "2026-09-23"), 0);
  assert.equal(nextDailySession(progress, "2026-09-24"), 1);
  assert.equal(nextDailySession(progress, "2026-10-24"), 1);
  assert.deepEqual(readSessions(JSON.parse(JSON.stringify(progress))), progress);
  assert.equal(nextDailySession({ website: { ...emptySession, practiced: true } }, "2026-09-24"), 0);
});
test("malformed storage cannot fabricate a session without practice and answers", () => {
  assert.deepEqual(readSessions(null), {});
  const result = readSessions({ website: { stage: "invalid", practiced: true, note: 7, answers: [1, 0, 1], completedOn: "2026-02-31" }, secret: {} });
  assert.equal(result.website.stage, "welcome");
  assert.equal(result.website.note, "");
  assert.equal(result.website.completedOn, undefined);
  assert.equal(result.secret, undefined);
});
test("the full beginner to advanced path has translated teaching, exercises and valid tests", () => {
  assert.ok(DAILY_PATH.length > 100);
  assert.equal(new Set(DAILY_PATH.map(item => item.id)).size, DAILY_PATH.length);
  for (const lang of ["fr", "en", "ar"]) for (const item of DAILY_PATH.filter(item => item.moduleId)) {
    const module = JSON.parse(readFileSync(new URL(`../app/admin/how-it-was-built/course/content/${lang}/${item.moduleId}.json`, import.meta.url), "utf8"));
    const lesson = module.lessons.find((lesson: any) => lesson.id === item.lessonId);
    assert.ok(lesson?.sections.length && lesson.exercise.task && lesson.quiz.length, item.id);
    for (const question of lesson.quiz) assert.ok(question.options[question.correctIndex] && question.explanation, item.id);
  }
});
