import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.BROWSER_BASE_URL || 'http://localhost:5173';
const password = process.env.DEMO_PASSWORD;
assert.ok(password, 'Set DEMO_PASSWORD to the value used when seeding the local database.');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, channel: process.env.CHROME_PATH ? undefined : 'chrome' });
const errors = [];
try {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1300, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  async function login(role) {
    await page.goto(base + '/login');
    await page.getByLabel('Email').fill(`demo-${role}@fictional.example`);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
    await page.getByText('Total policies', { exact: true }).waitFor();
  }
  async function logout() {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.getByRole('heading', { name: 'Sign in', exact: true }).waitFor();
  }
  await page.goto(base + '/policies');
  await page.waitForURL('**/login');
  await login('admin');
  assert.equal(await page.locator('canvas').count(), 4);
  await page.getByRole('link', { name: 'Customers', exact: true }).click();
  await page.getByRole('searchbox').fill('Rowan');
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('link', { name: 'Fictional Rowan Customer' }).waitFor();
  await page.getByRole('link', { name: 'Fictional Juniper Customer' }).waitFor({ state: 'detached' });
  await page.getByText('Page 1 of 1 · 1 records', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Reports' }).click();
  const [pdf] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PDF report' }).click(),
  ]);
  assert.match(pdf.suggestedFilename(), /^insurance-report-\d{4}-\d{2}\.pdf$/);
  await logout();

  await login('agent');
  await page.getByRole('link', { name: 'Assigned Claims' }).click();
  await page.getByRole('link', { name: 'View claim' }).first().click();
  await page.getByRole('heading', { name: /Vehicle claim/ }).waitFor();
  await page.goto(base + '/reports');
  await page.waitForURL(base + '/');
  await logout();

  await login('customer');
  await page.getByRole('link', { name: 'My Documents' }).click();
  await page.getByLabel('File').setInputFiles({
    name: 'browser-smoke.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jSuoAAAAASUVORK5CYII=', 'base64'),
  });
  await page.getByRole('button', { name: 'Upload document' }).click();
  const row = page.getByRole('row').filter({ hasText: 'browser-smoke.png' }).first();
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await page.getByRole('img', { name: 'browser-smoke.png' }).waitFor();
  await row.getByRole('button', { name: 'Delete', exact: true }).click();
  await row.waitFor({ state: 'detached' });
  await page.getByRole('link', { name: 'Premium Payments' }).click();
  await page.getByText('Simulated payments only.', { exact: false }).waitFor();
  await page.getByRole('link', { name: 'My Policies' }).click();
  await page.getByRole('link', { name: 'POL-DEMO-ROWAN' }).waitFor();
  await page.reload();
  await page.getByRole('link', { name: 'POL-DEMO-ROWAN' }).waitFor();
  await logout();
  assert.deepEqual(errors, []);
  console.log('Browser smoke passed for admin, agent and customer.');
} finally {
  await browser.close();
}
