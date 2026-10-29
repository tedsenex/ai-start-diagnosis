// 以 iPhone 13 尺寸跑完兩條路線，逐題檢查作答區位置、模擬鍵盤開關、檢查 LINE 預約連結。
// 用法：node tests/walkthrough.mjs
import { chromium, webkit, devices } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const page = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../index.html');
let failed = false;

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  let browser;
  try { browser = await engine.launch(); } catch { console.log(`${name}：未安裝，略過`); continue; }
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], colorScheme: scheme });
    const p = await ctx.newPage();
    const errors = [], problems = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(page);
    for (const route of [0, 1]) {
      if (route === 1) await p.click('#restart');
      await p.locator('.path').nth(route).tap();
      for (let i = 0; i < 150; i++) {
        await p.waitForFunction(() => document.querySelector('#dock-in').children.length > 0 || !document.querySelector('#report').hidden);
        if (await p.locator('#report:not([hidden])').count()) break;
        await p.waitForTimeout(250);
        const st = await p.evaluate(() => {
          const d = document.getElementById('dock').getBoundingClientRect();
          const q = [...document.querySelectorAll('#thread .row')].pop().getBoundingClientRect();
          return { top: Math.round(d.top), bottom: Math.round(d.bottom), vh: innerHeight, qTop: Math.round(q.top) };
        });
        const tall = st.bottom - st.top >= st.vh;
        if ((!tall && (st.bottom > st.vh + 2 || st.top < 0)) || st.qTop > st.top) problems.push({ route, step: i, ...st });
        const dock = p.locator('#dock-in');
        if (await dock.locator('input').count()) {
          await dock.locator('input').fill(i < 2 ? '測試' : '20');
          await p.setViewportSize({ width: 390, height: 420 });            // 鍵盤打開
          await dock.locator('button[type=submit]').tap();
          await p.setViewportSize({ width: 390, height: 664 });            // 鍵盤收起
          continue;
        }
        if (await dock.locator('.lk').count()) { await dock.locator('.lk button').nth(i % 5).tap(); continue; }
        const opts = dock.locator('.opt'); const n = await opts.count();
        if (await dock.locator('.opt[aria-pressed]').count()) {          // 多選題
          await opts.nth(1).tap(); await opts.nth(3).tap(); await dock.locator('.btn').first().tap(); continue;
        }
        await opts.nth(i % n).tap();
      }
      await p.waitForSelector('#report:not([hidden])');
      await p.locator('[data-book]').tap();
      await p.fill('#bk-name', '測試');
      const href = await p.locator('#bk-line').getAttribute('href');
      const okLink = href.startsWith('https://line.me/R/oaMessage/%40402cgabo/?') && decodeURIComponent(href.split('/?')[1]).includes('稱呼：測試');
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      console.log(`${name}/${scheme} 路線${route ? 'B' : 'A'}：報告 OK，LINE 連結 ${okLink ? 'OK' : '錯誤'}，橫向溢出 ${sw > 390 ? '有' : '無'}`);
      if (!okLink || sw > 390) failed = true;
    }
    console.log(`${name}/${scheme}：版面問題 ${problems.length} 個，JS 錯誤 ${errors.length} 個`);
    if (problems.length) console.log(problems.slice(0, 5));
    if (errors.length) console.log(errors);
    if (problems.length || errors.length) failed = true;
    await ctx.close();
  }
  await browser.close();
}
process.exit(failed ? 1 : 0);
