// Uses a disposable browser profile; never touches the user's browser data.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /Unexpected text node|Text strings must/.test(message.text())) errors.push(message.text());
    });
    await page.goto('http://localhost:8083');
    await page.getByText('خطوتك التالية', { exact: true }).waitFor({ timeout: 60000 });
    await page.screenshot({ path: 'artifacts/mobile-home-390.png' });
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
      assert.equal(await page.getByRole('tab').count(), 5);
    }
    await page.getByRole('button', { name: 'الإعدادات', exact: true }).click();
    await page.getByText('English', { exact: true }).click();
    await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
    await page.goto('http://localhost:8083');
    await page.getByText('YOUR NEXT STEP', { exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'artifacts/mobile-home-en-390.png' });
    await page.getByRole('button', { name: 'Open website courses', exact: true }).click();
    await page.getByRole('heading', { name: 'How my site was built', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Explore', exact: true }).first().click();
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click();
    const original = require('../../app/admin/how-it-was-built/course/content/en/module-00-learning-tools.json').lessons[0];
    for (const section of original.sections) {
      assert.equal(await page.getByRole('heading', { name: section.title, exact: true }).count(), 1);
    }
    await page.getByText(original.expectedResult, { exact: true }).first().waitFor({ state: 'attached' });
    await page.goto('http://localhost:8083/more');
    await page.getByText('My courses', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'View curriculum', exact: true }).count(), 8);
    await page.screenshot({ path: 'artifacts/mobile-course-library.png' });
    await page.getByRole('button', { name: 'My tools', exact: true }).click();
    await page.getByRole('button', { name: 'Bookmarks', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Courses', exact: true }).click();
    await page.getByRole('button', { name: 'View curriculum', exact: true }).last().click();
    await page.getByRole('heading', { name: 'Build an IPTV application', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Open lessons', exact: true }).nth(6).click();
    assert.equal(await page.getByRole('button', { name: 'Open lesson', exact: true }).count(), 10);
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click();
    await page.getByRole('heading', { name: 'Set up the video project', exact: true }).waitFor();
    await page.goto('http://localhost:8083/course/python');
    await page.getByText('By the end of this path', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Open lessons', exact: true }).count(), 4);
    await page.getByRole('button', { name: 'Open lessons', exact: true }).nth(2).click();
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click();
    await page.getByRole('heading', { name: 'Functions and contracts', exact: true }).waitFor();
    await page.getByRole('button', { name: '4 Quiz', exact: true }).click();
    await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
    await page.getByRole('heading', { name: 'Collections and efficient lookup', exact: true }).waitFor();
    assert.match(page.url(), /course=python/);
    await page.goto('http://localhost:8083/lesson/python-mastery-capstone?course=python');
    await page.getByRole('heading', { name: 'Capstone: inventory report', exact: true }).waitFor();
    await page.getByRole('button', { name: '4 Quiz', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Next lesson', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Back to curriculum', exact: true }).click();
    await page.getByRole('heading', { name: 'Learn Python', exact: true }).waitFor();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Python curriculum overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'artifacts/python-curriculum.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: Arabic and English home; 320/390/768px layouts; original website lessons; expanded Python curriculum, scoped next lesson, and final-lesson boundary.');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
