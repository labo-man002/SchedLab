// Optional integration check: requires Playwright and a Chromium installation.
// Start the documented Python server first; no package dependency is added.
// node tests/browser-smoke.cjs (BASE_URL / CHROMIUM_PATH may override defaults).
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const failures = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', (error) => failures.push(error.message));
    const base = process.env.BASE_URL || 'http://127.0.0.1:8000/';
    await page.goto(base);
    const state = () => page.evaluate(() => window.SchedLabDemo.getState());
    const text = (selector) => page.locator(selector).innerText();
    const row = (id) => page.locator('#lifecycle-rows tr').filter({ has: page.locator('th', { hasText: `${id} ·` }) });
    const initial = await state();
    assert.equal(initial.metrics.free, 16);
    assert.equal(initial.metrics.largest, 2);
    assert.equal(initial.queued[0].size, 4);
    await page.locator('#lifecycle-panel summary').press('Enter');
    assert.equal(await page.locator('#lifecycle-rows tr').count(), 12);
    assert.match(await row('J09').innerText(), /not started.*Submitted T\+00.*at least 0 ticks/s);
    assert.match(await row('J01').innerText(), /initial resident.*Unknown before T\+00/s);
    await page.locator('#step-btn').press('Enter');
    assert.equal((await state()).queued.length, 4);
    assert.match(await row('J09').innerText(), /at least 1 tick as of T\+01/);
    await page.locator('#policy').selectOption('backfill');
    assert.equal((await state()).queued.length, 4, 'policy selection must not dispatch');
    await page.locator('#reset-btn').press('Enter');
    await page.locator('#step-btn').press('Enter');
    assert.equal((await state()).queued.length, 1);
    assert.match(await row('J10').innerText(), /Running.*Started T\+01.*1 tick \(observed\)/s);
    await page.locator('#step-btn').press('Enter');
    await page.locator('#step-btn').press('Enter');
    assert.match(await row('J10').innerText(), /Completed.*Finished T\+03/s);
    const beforeReplay = await state();
    await page.locator('#compare-btn').press('Enter');
    assert.deepEqual(await state(), beforeReplay);
    assert.equal(await page.locator('.comparison-table tbody tr').count(), 5);
    await page.locator('.trace-values summary').first().press('Enter');
    assert.equal(await page.locator('.trace-values').first().locator('li').count(), 8);
    assert.match(await page.locator('.trace-values').first().innerText(), /T\+1:.*32 slots occupied/);
    const comparison = await text('#comparison-results');
    await page.locator('#step-btn').press('Enter');
    assert.equal(await text('#comparison-results'), comparison, 'live ticks must not change replay');
    assert.match(await row('J01').innerText(), /Completed · initial resident.*Finished T\+04/s);
    console.log('PASS initial state, FIFO/backfill, lifecycle, independent replay');

    // Stable focus, keyboard activation, visible inspection, auto-run reset and silence.
    await page.locator('.slot').first().focus();
    await page.keyboard.press('Space');
    assert.match(await text('#slot-detail'), /Rack A \/ slot 01/);
    await page.evaluate(() => window.SchedLabDemo.advanceTicks(1));
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('slot')), true);
    await page.locator('#play-btn').press('Enter');
    const announcement = await text('#run-status');
    await page.waitForTimeout(950);
    assert.equal(await text('#run-status'), announcement, 'automatic ticks must not flood status');
    await page.locator('#reset-btn').press('Enter');
    const reset = await state();
    assert.equal(reset.time, 0);
    assert.equal(reset.policy, 'backfill');
    assert.deepEqual(reset.running, initial.running);
    assert.deepEqual(reset.queued, initial.queued);
    assert.equal(reset.completed.length, 0);
    assert.equal(await page.locator('#play-btn').getAttribute('aria-pressed'), 'false');
    await page.waitForTimeout(1000);
    assert.equal((await state()).time, 0, 'reset must cancel the timer');
    assert.equal(await page.locator('#lifecycle-rows tr').count(), 12);
    assert.match(await row('J09').innerText(), /at least 0 ticks/);
    console.log('PASS inspection, stable focus, quiet auto-run and exact reset');

    // Native keyboard path, lesson answer and focus after hiding the lesson.
    await page.locator('#lesson-restart').press('Enter');
    await page.locator('#lesson-action').press('Enter');
    await page.locator('#lesson-action').press('Enter');
    await page.locator('#check-answer').press('Enter');
    assert.match(await text('#lesson-feedback'), /Choose one/);
    await page.locator('input[value="contiguous"]').focus();
    await page.keyboard.press('Space');
    await page.locator('#check-answer').press('Enter');
    assert.match(await text('#lesson-feedback'), /Exactly/);
    await page.locator('#lesson-action').press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'lab-mode');
    await page.locator('#learn-mode').press('Enter');
    await page.locator('#job-size').focus();
    await page.keyboard.press('Home');
    await page.locator('#job-duration').focus();
    await page.keyboard.press('Home');
    await page.locator('#job-form button').press('Enter');
    assert.equal((await state()).queued.at(-1).size, 1);
    await page.locator('#placement').selectOption('tight');
    const custom = await state();
    // Deliberately force the documented fallback to make it reproducible.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }));
    await page.locator('#share-btn').press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'share-link');
    const url = await page.locator('#share-link').inputValue();
    assert.equal(new URL(url).searchParams.get('v'), '1');
    const shared = await browser.newPage();
    await shared.goto(url);
    const loaded = await shared.evaluate(() => window.SchedLabDemo.getState());
    assert.equal(loaded.time, 0);
    assert.equal(loaded.policy, custom.policy);
    assert.equal(loaded.placement, 'tight');
    assert.equal(loaded.queued.length, 4);
    assert.ok(!loaded.queued.some((job) => job.name.startsWith('Custom')));
    await shared.close();
    console.log('PASS lesson/quiz, job form, mode focus and v=1 share fallback/roundtrip');

    // Tab reaches every essential control without a trap. Focus appearance is checked.
    await page.locator('#lesson-restart').press('Enter');
    await page.locator('#lesson-action').press('Enter');
    await page.locator('#lesson-action').press('Enter');
    await page.locator('#learn-mode').focus();
    const reached = new Set();
    for (let i = 0; i < 85; i += 1) {
      const active = await page.evaluate(() => ({
        id: document.activeElement.id,
        outline: getComputedStyle(document.activeElement).outlineStyle,
        width: getComputedStyle(document.activeElement).outlineWidth,
      }));
      if (active.id) reached.add(active.id);
      if (['step-btn', 'job-size', 'check-answer'].includes(active.id)) {
        assert.equal(active.outline, 'solid');
        assert.notEqual(active.width, '0px');
      }
      await page.keyboard.press('Tab');
    }
    for (const id of ['learn-mode','lab-mode','scenario','step-btn','play-btn','reset-btn','share-btn','policy','placement','job-size','job-duration','lesson-action','lesson-restart','check-answer','comparison-horizon','compare-btn']) {
      assert.ok(reached.has(id), `Tab path missed ${id}`);
    }
    console.log('PASS tab traversal and visible focus');

    await page.locator('#compare-btn').press('Enter');
    for (const width of [1280, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      const layout = await page.evaluate(() => ({ width: innerWidth, x:scrollX, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth && !el.closest('.table-scroll')).map(el => ({tag:el.tagName, id:el.id, cls:el.className, right:el.getBoundingClientRect().right})) }));
      assert.ok(layout.scroll <= layout.width, `page overflow at ${width}: ${JSON.stringify(layout)}`);
      if (width <= 375) {
        const scroll = page.locator('.table-scroll');
        await scroll.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(150);
        assert.ok(await scroll.evaluate((el) => el.scrollLeft > 0));
      }
      await page.screenshot({ path: `/tmp/schedlab-sprint01-${width}.png`, fullPage: true });
      console.log(`PASS viewport ${width}, open lifecycle and comparison`);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    assert.equal(await page.locator('.slot').first().evaluate((el) => getComputedStyle(el).transitionDuration), '0s');
    const touch = await browser.newPage({ viewport: { width: 320, height: 900 }, hasTouch: true, isMobile: true });
    await touch.goto(base);
    await touch.locator('.slot').first().tap();
    assert.match(await touch.locator('#slot-detail').innerText(), /Rack A \/ slot 01/);
    await touch.close();
    console.log('PASS emulated touch slot inspection at 320px');
    assert.deepEqual(failures, [], 'browser must have no uncaught application errors');
    console.log('PASS reduced motion and no uncaught browser errors');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
