import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DAILY_TESTS } from "../app/admin/how-it-was-built/course/daily-tests.ts";

export async function checkDailySession({ client, evaluate, waitFor, setViewport, baseUrl, root }) {
  const run = expression => evaluate(client, expression);
  const wait = (expression, label) => waitFor(client, expression, label);
  const click = selector => run(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const write = selector => run(`(() => { const field = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(field, 'I traced the input, predicted the output, compared the result and corrected my example.'); field.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const shot = async name => {
    await mkdir(path.join(root, ".source-library"), { recursive: true });
    const image = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(path.join(root, ".source-library", name + ".png"), Buffer.from(image.data, "base64"));
  };
  await setViewport(client, 390, 844);
  await client.send("Page.navigate", { url: `${baseUrl}/admin/how-it-was-built/` });
  await wait("Boolean(document.querySelector('[data-session-start]'))", "one daily start button");
  await click('button[aria-label="English"]');
  await wait("document.querySelector('[data-session-start]').textContent.includes('Start')", "English daily session");
  await shot("daily-session-welcome");
  await click("[data-session-start]");
  await wait("Boolean(document.querySelector('[data-session-practice]'))", "short explanation");
  await client.send("Page.reload");
  await wait("Boolean(document.querySelector('[data-session-practice]'))", "lesson step restored after reload");
  await click('button[aria-label="English"]');
  // Keep the browser test isolated from the reminder database.
  await run(`(() => { const original = window.fetch; window.fetch = (url, options) => String(url).includes('/api/admin/learning-completion') ? Promise.resolve(new Response('{}', { status: 200 })) : original(url, options); })()`);
  await write("#workbook-recall");
  await wait("!document.querySelector('[data-session-practice]').disabled", "written preparation enables workshop");
  await click("[data-session-practice]");
  await wait("Boolean(document.querySelector('[data-session-test]'))", "practice step");
  assert(await run("document.querySelector('[data-session-test]').disabled"), "Quiz must wait for practice.");
  for (const field of ["guided", "challenge", "reflection"]) await write(`#workbook-${field}`);
  await wait("!document.querySelector('[data-session-practiced]').disabled", "completed workbook enables practice confirmation");
  await click("[data-session-practiced]");
  await click("[data-session-test]");
  const answers = async choices => {
    for (let index = 0; index < choices.length; index++) {
      await wait(`Boolean(document.querySelector('input[name="session-question-${index}"]'))`, `question ${index + 1}`);
      await run(`document.querySelectorAll('input[name="session-question-${index}"]')[${choices[index]}].click()`);
      await run(`Array.from(document.querySelectorAll('[data-daily-session] button')).find(button => /Next question|See my result/.test(button.textContent)).click()`);
    }
  };
  await answers([0, 0, 0]);
  await wait("document.querySelector('[data-daily-session]').textContent.includes('Let’s work through')", "failed test explanations");
  assert(await run("!JSON.parse(localStorage.getItem('lecomax-daily-sessions-v2')).website.completedOn"), "Failed test completed the day.");
  await run("Array.from(document.querySelectorAll('[data-daily-session] button')).find(button => button.textContent === 'Try the test again').click()");
  await answers(DAILY_TESTS.website.map(question => question.correctIndex));
  await wait("Boolean(document.querySelector('[data-session-success]'))", "see you tomorrow success screen");
  await shot("daily-session-success");
  await client.send("Page.reload");
  await wait("Boolean(document.querySelector('[data-session-success]'))", "same-day success persists");
  await run(`(() => { const progress = JSON.parse(localStorage.getItem('lecomax-daily-sessions-v2')); progress.website.completedOn = '2020-01-01'; localStorage.setItem('lecomax-daily-sessions-v2', JSON.stringify(progress)); })()`);
  await client.send("Page.reload");
  await wait("Boolean(document.querySelector('[data-session-start]'))", "next day starts next lesson");
  assert(await run("document.querySelector('[data-daily-session]').textContent.includes('JOUR 2') || document.querySelector('[data-daily-session]').textContent.includes('DAY 2')"), "Next day did not select lesson two.");
  // Move past the foundation in this disposable profile and verify the real advanced content loads.
  const core = Object.fromEntries(Object.entries(DAILY_TESTS).map(([id, questions]) => [id, { stage: "quiz", practiced: true, note: "", answers: questions.map(question => question.correctIndex), completedOn: "2020-01-01" }]));
  await run(`localStorage.setItem('lecomax-daily-sessions-v2', ${JSON.stringify(JSON.stringify(core))})`);
  await client.send("Page.reload");
  await wait("Boolean(document.querySelector('[data-session-start]'))", "advanced course loads automatically");
  assert(await run("document.querySelector('[data-daily-session]').textContent.includes('15')"), "Advanced daily course did not start.");
  await click('button[aria-label="العربية"]');
  await wait("document.querySelector('[data-daily-session]')?.dir === 'rtl' && Boolean(document.querySelector('[data-session-start]'))", "Arabic advanced content");
  assert(await run("document.querySelector('[data-daily-session]').scrollWidth <= document.querySelector('[data-daily-session]').clientWidth + 2"), "Arabic session overflows on mobile.");
  await click("[data-session-start]");
  await wait("document.querySelector('[data-daily-session]').textContent.includes('الجزء')", "advanced lesson teaching sections");
  await shot("daily-session-arabic");
  await setViewport(client, 1440, 1000);
  assert(await run("document.querySelector('[data-daily-session]').scrollWidth <= document.querySelector('[data-daily-session]').clientWidth + 2"), "Desktop session overflows.");
  console.log("Daily session passed: guided steps, reload, practice gate, failed quiz, retry, success, next day, advanced pathway, Arabic and responsive layout.");
}
