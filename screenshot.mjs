import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ 
  headless: true,
  args: ['--window-size=1440,900']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3100', { waitUntil: 'networkidle0' });

const outDir = '/Users/dezmon/.openclaw/media/outbound';

// 1. Dialer idle
await page.screenshot({ path: `${outDir}/cm-1-dialer-idle.png`, fullPage: false });
console.log('1. Dialer idle ✓');

// Helper to click sidebar button by title
async function clickNav(title) {
  await page.evaluate((t) => {
    document.querySelectorAll(`button[title="${t}"]`)[0]?.click();
  }, title);
  await new Promise(r => setTimeout(r, 500));
}

// 2. Click "Demo: jump to live call" to see connected state
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const demo = buttons.find(b => b.textContent.includes('Demo: jump to live call'));
  if (demo) demo.click();
});
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: `${outDir}/cm-2-connected.png`, fullPage: false });
console.log('2. Connected call state ✓');

// 3. Courses page
await clickNav('Courses');
await page.screenshot({ path: `${outDir}/cm-3-courses.png`, fullPage: false });
console.log('3. Courses ✓');

// 4. Click first course row to see detail
await page.evaluate(() => {
  const rows = document.querySelectorAll('[style*="cursor: pointer"]');
  // Find a course row (has course name)
  for (const row of rows) {
    if (row.textContent.includes('Riverside')) {
      row.click();
      break;
    }
  }
});
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: `${outDir}/cm-4-course-detail.png`, fullPage: false });
console.log('4. Course detail ✓');

// 5. Campaigns
await clickNav('Campaigns');
await page.screenshot({ path: `${outDir}/cm-5-campaigns.png`, fullPage: false });
console.log('5. Campaigns ✓');

// 6. Call Library
await clickNav('Calls');
await page.screenshot({ path: `${outDir}/cm-6-calls.png`, fullPage: false });
console.log('6. Call library ✓');

await browser.close();
console.log('\nAll screenshots saved!');
