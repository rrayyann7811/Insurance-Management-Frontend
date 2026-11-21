import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { chromium } from 'playwright-core';

const base = process.env.BROWSER_BASE_URL || 'http://localhost:5173';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Use a loopback application backed by a disposable database.');
const password = process.env.DEMO_PASSWORD;
assert.ok(password, 'Set DEMO_PASSWORD to the value used when seeding the local database.');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, channel: process.env.CHROME_PATH ? undefined : 'chrome' });
const errors = [];
const screenshotDir = process.env.BROWSER_SCREENSHOT_DIR;
try {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1300, height: 900 } });
  const capture = async (name, fullPage = true) => {
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, name), fullPage });
  };
  page.on('pageerror', error => errors.push(error.message));
  async function reviewDashboard(role) {
    for (const width of [1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${role} dashboard overflows at ${width}px`);
      await capture(`${role}-${width}.png`, width === 1440 || width === 390);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  async function login(role, email = `demo-${role}@fictional.example`) {
    await page.goto(base + '/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
    await page.locator('.metrics').waitFor();
  }
  async function logout() {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.getByRole('heading', { name: 'Sign in', exact: true }).waitFor();
  }
  const visit = async (link, heading = link) => {
    await page.getByRole('link', { name: link, exact: true }).click();
    await page.getByRole('heading', { name: heading, exact: true }).waitFor();
  };
  const rowWith = value => page.getByRole('row').filter({ hasText: value });
  const policyName = `Browser Vehicle ${randomUUID().slice(0, 8)}`;
  const customerName = `Browser Customer ${randomUUID().slice(0, 8)}`;
  const customerEmail = `${randomUUID()}@example.test`;
  const date = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const metric = label => page.locator('.metric, .summary-strip > div')
    .filter({ has: page.getByText(label, { exact: true }) }).locator('strong, dd');
  const count = async label => Number((await metric(label).innerText()).replace(/[^0-9.]/g, ''));
  await page.goto(base + '/policies');
  await page.waitForURL('**/login');
  await page.getByRole('button', { name: 'Show password' }).click();
  assert.equal(await page.getByLabel('Password').getAttribute('type'), 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await capture('sign-in-desktop.png');
  await login('admin');
  await page.getByRole('img', { name: /^Monthly premium collections/ }).waitFor();
  assert.equal(await page.locator('canvas').count(), 4);
  await reviewDashboard('admin');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Workspace navigation' }).waitFor();
  await capture('mobile-navigation.png', false);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Workspace navigation' }).waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('button', { name: 'Menu', exact: true }).evaluate(button => document.activeElement === button), true);
  await page.setViewportSize({ width: 1440, height: 900 });
  // Suppress activity in the response to exercise sparse portfolios without changing records.
  const dashboardUrl = '**/api/reports/dashboard';
  for (const empty of [true, false]) {
    await page.route(dashboardUrl, async route => {
      const response = await route.fetch();
      const data = await response.json();
      const zeroCounts = counts => Object.fromEntries(Object.keys(counts).map(status => [status, 0]));
      await route.fulfill({ response, json: {
        ...data, customers: 0, byClaim: zeroCounts(data.byClaim), collections: '0',
        expiring: [], monthly: [], payments: zeroCounts(data.payments),
        ...(empty && { policies: 0, byPolicy: zeroCounts(data.byPolicy) }),
      } });
    });
    await page.reload();
    if (empty) {
      await page.getByText('Analytics will appear as records are added').waitFor();
      assert.equal(await page.locator('canvas').count(), 0);
      await capture('admin-empty-desktop.png');
    } else {
      await page.getByRole('img', { name: /^Policies by status/ }).waitFor();
      assert.equal(await page.locator('canvas').count(), 1);
      await page.getByText('No claims awaiting review').waitFor();
    }
    await page.unroute(dashboardUrl);
  }
  await page.reload();
  await page.locator('.metrics').waitFor();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  const before = { policies: await count('Total policies'), approvals: await count('Approved claims'),
    collections: await count('Simulated premium collections') };
  await page.getByRole('link', { name: 'Add customer', exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.id === 'register-customer');
  await visit('Policies');
  await visit('Claims');
  await page.getByRole('heading', { name: 'Claims', exact: true }).waitFor();
  await visit('Premiums', 'Premium payments');
  await visit('Documents');
  await visit('Agents');
  await page.getByRole('heading', { name: 'Agent accounts' }).waitFor();
  await visit('Settings');
  await page.getByLabel('Organization name').waitFor();
  await page.getByRole('link', { name: 'Customers', exact: true }).click();
  await page.getByRole('searchbox').fill('fictional-customer-who-does-not-exist');
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByText('No records found.').waitFor();
  await page.getByRole('searchbox').fill('Rowan');
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('link', { name: 'Fictional Rowan Customer' }).waitFor();
  await page.getByRole('link', { name: 'Fictional Juniper Customer' }).waitFor({ state: 'detached' });
  await page.getByText('Page 1 of 1 · 1 records', { exact: true }).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Previous' }).isDisabled());
  assert.ok(await page.getByRole('button', { name: 'Next' }).isDisabled());
  await capture('customers-desktop.png');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const customerTable = page.getByRole('region', { name: 'Records by name' });
  assert.ok(await customerTable.evaluate(element => element.scrollWidth > element.clientWidth));
  await capture('customers-mobile.png');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('link', { name: 'Reports' }).click();
  const [pdf] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PDF report' }).click(),
  ]);
  const reportBytes = await readFile(await pdf.path());
  assert.match(pdf.suggestedFilename(), /^insurance-report-\d{4}-\d{2}\.pdf$/);
  await logout();

  await login('agent');
  await page.getByText('Assigned customers', { exact: true }).waitFor();
  await page.getByRole('link', { name: /Vehicle claim/ }).first().waitFor();
  await reviewDashboard('agent');
  await page.getByRole('link', { name: 'Assigned Claims', exact: true }).click();
  await rowWith('POL-DEMO-ROWAN').getByRole('link', { name: 'View claim' }).first().click();
  await page.getByRole('heading', { name: /Vehicle claim/ }).waitFor();
  await page.goto(base + '/reports');
  await page.waitForURL(base + '/');
  await logout();

  await login('customer');
  await page.getByRole('link', { name: /Vehicle claim/ }).waitFor();
  await reviewDashboard('customer');
  await page.getByRole('link', { name: 'My Documents' }).click();
  await page.getByLabel('File', { exact: true }).setInputFiles({
    name: 'browser-smoke.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWOQsIyXsIxngFAAEjICwSf+s+gAAAAASUVORK5CYII=', 'base64'),
  });
  await page.getByRole('button', { name: 'Upload document' }).click();
  const row = page.getByRole('row').filter({ hasText: 'browser-smoke.png' }).first();
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await page.getByRole('img', { name: 'browser-smoke.png' }).waitFor();
  page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: 'Delete', exact: true }).click();
  await row.waitFor({ state: 'detached' });
  await page.getByLabel('File', { exact: true }).setInputFiles({ name: 'browser-preview.pdf', mimeType: 'application/pdf', buffer: reportBytes });
  await page.getByRole('button', { name: 'Upload document' }).click();
  const pdfRow = page.getByRole('row').filter({ hasText: 'browser-preview.pdf' }).first();
  await pdfRow.getByRole('button', { name: 'View', exact: true }).click();
  const canvas = page.getByRole('img', { name: 'PDF page 1' });
  await canvas.waitFor({ state: 'visible' });
  assert.ok(await canvas.evaluate(element => {
    const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
    return pixels.some((value, index) => index % 4 === 0 && value < 200);
  }), 'PDF text must render to the canvas');
  page.once('dialog', dialog => dialog.accept());
  await pdfRow.getByRole('button', { name: 'Delete', exact: true }).click();
  await pdfRow.waitFor({ state: 'detached' });
  await page.getByRole('link', { name: 'Premium Payments' }).click();
  await page.getByText('Simulated payments only.', { exact: false }).waitFor();
  await page.getByRole('link', { name: 'My Policies' }).click();
  await page.getByRole('link', { name: 'POL-DEMO-ROWAN' }).waitFor();
  await page.reload();
  await page.getByRole('link', { name: 'POL-DEMO-ROWAN' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.getByRole('link', { name: 'My Policies' }).isVisible(), false);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'My Claims' }).click();
  await page.getByRole('heading', { name: 'My claims' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await logout();
  await page.setViewportSize({ width: 1300, height: 900 });
  await page.goto(base + '/register');
  await capture('registration-desktop.png');
  await page.getByLabel('Full name').fill(customerName);
  await page.getByLabel('Email').fill(customerEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await page.getByText('No claims submitted', { exact: true }).waitFor();
  await page.getByText('No documents uploaded', { exact: true }).waitFor();
  await capture('customer-empty-desktop.png');
  await logout();
  await login('customer', customerEmail);
  await visit('Profile', 'My profile');
  await page.getByLabel('Phone').fill('000-000-0000');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('status').filter({ hasText: 'Changes saved.' }).waitFor();
  await page.waitForFunction(() => document.querySelector('input[name="phone"]')?.defaultValue === '000-000-0000');
  await page.route('**/api/auth/me', route => route.abort());
  await page.reload();
  await page.getByRole('button', { name: 'Retry session' }).waitFor();
  assert.ok(await page.evaluate(() => sessionStorage.getItem('insurance-token')));
  await page.unroute('**/api/auth/me');
  await page.getByRole('button', { name: 'Retry session' }).click();
  await page.getByRole('heading', { name: 'My profile' }).waitFor();
  await page.evaluate(() => sessionStorage.setItem('insurance-token', 'invalid-test-token'));
  await page.reload();
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('insurance-token')), null);

  await login('admin');
  await visit('Customers');
  await page.getByRole('searchbox').fill(customerEmail);
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('link', { name: customerName }).click();
  const customerUrl = page.url();
  await page.locator('select[name="agentId"]').selectOption({ label: 'Fictional Finch Agent' });
  const customerAssigned = page.waitForResponse(response => response.url().endsWith('/assign') && response.ok());
  await page.getByRole('button', { name: 'Assign agent' }).click();
  await customerAssigned;
  await logout();

  await login('agent');
  await visit('Profile');
  await page.getByLabel('Name', { exact: true }).waitFor();
  await visit('Documents');
  await visit('Customers');
  await page.getByRole('searchbox').fill(customerEmail);
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('link', { name: customerName }).waitFor();
  await visit('Policies');
  await page.locator('select[name="customerId"]').selectOption({ label: customerName });
  await page.getByLabel('Policy type').fill(policyName);
  await page.getByLabel('Coverage (INR)').fill('5000');
  await page.getByLabel('Premium (INR)').fill('234');
  await page.getByLabel('Start date').fill(date(-1));
  await page.getByLabel('Expiry date').fill(date(20));
  await page.getByRole('button', { name: 'Create policy' }).click();
  const policyRow = rowWith(policyName);
  const policyNumber = await policyRow.getByRole('link').innerText();
  const policyUrl = await policyRow.getByRole('link').getAttribute('href');
  await logout();

  await login('customer', customerEmail);
  await visit('My Policies', 'My policies');
  await page.getByRole('link', { name: policyNumber }).click();
  await page.getByRole('heading', { name: policyNumber }).waitFor();
  await visit('Premium Payments', 'Premium payments');
  const paymentRow = rowWith(policyNumber);
  await paymentRow.getByRole('button', { name: 'Confirm simulated payment' }).click();
  await paymentRow.getByText('paid', { exact: true }).waitFor();
  await visit('My Claims', 'My claims');
  await page.locator('select[name="policyId"]').selectOption({ label: `${policyName} · ${policyNumber}` });
  await page.getByLabel('Amount (INR)').fill('125');
  await page.getByLabel('Incident date').fill(date(0));
  await page.getByLabel('Description').fill('Fictional browser test claim damage.');
  await page.getByRole('button', { name: 'Submit claim' }).click();
  await rowWith(policyNumber).getByRole('link', { name: 'View claim' }).click();
  const claimUrl = page.url();
  await page.getByLabel('File', { exact: true }).setInputFiles({ name: 'claim-attachment.pdf', mimeType: 'application/pdf', buffer: reportBytes });
  await page.getByRole('button', { name: 'Upload document' }).click();
  await rowWith('claim-attachment.pdf').waitFor();
  await logout();

  await login('customer-two');
  await page.goto(base + policyUrl);
  await page.getByRole('alert').filter({ hasText: 'Record not found' }).waitFor();
  await page.goto(claimUrl);
  await page.getByRole('alert').filter({ hasText: 'Record not found' }).waitFor();
  await logout();

  await login('admin');
  await page.goto(claimUrl);
  await page.locator('select[name="agentId"]').selectOption({ label: 'Fictional Finch Agent' });
  const assigned = page.waitForResponse(response => response.url().endsWith('/assign') && response.ok());
  await page.getByRole('button', { name: 'Assign agent' }).click();
  await assigned;
  await logout();

  await login('agent');
  await page.goto(claimUrl);
  await rowWith('claim-attachment.pdf').getByRole('button', { name: 'Verify' }).click();
  await rowWith('claim-attachment.pdf').getByText(/Verified /).waitFor();
  await page.getByLabel('Review notes').fill('Supporting document checked.');
  await page.getByRole('button', { name: 'Save review' }).click();
  await page.locator('select[name="status"]').selectOption('APPROVED');
  page.once('dialog', dialog => dialog.accept());
  await page.getByLabel('Review notes').fill('Fictional claim approved.');
  await page.getByRole('button', { name: 'Save review' }).click();
  await page.getByText('approved', { exact: true }).waitFor();
  await logout();

  await login('customer', customerEmail);
  await page.goto(claimUrl);
  await page.getByText('approved', { exact: true }).waitFor();
  await logout();
  await login('admin');
  assert.equal(await count('Total policies'), before.policies + 1);
  assert.equal(await count('Approved claims'), before.approvals + 1);
  assert.equal(await count('Simulated premium collections'), before.collections + 234);
  const summaryResponse = page.waitForResponse(response => response.url().includes('/reports/monthly?') && response.ok());
  await visit('Reports', 'Monthly business report');
  const summary = await (await summaryResponse).json();
  const finalReport = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  const finalDownload = await finalReport;
  assert.match(finalDownload.suggestedFilename(), /\.pdf$/);
  const report = getDocument({
    data: new Uint8Array(await readFile(await finalDownload.path())),
    standardFontDataUrl: fileURLToPath(new URL('../node_modules/pdfjs-dist/standard_fonts/', import.meta.url)),
  });
  try {
    const reportPage = await (await report.promise).getPage(1);
    const reportText = (await reportPage.getTextContent()).items.map(item => item.str).join(' ');
    assert.ok(reportText.includes(`Monthly business report | ${summary.month}`));
    assert.ok(reportText.includes(`Policies issued: ${summary.policies}`));
    assert.ok(reportText.includes(`Simulated premiums collected: INR ${summary.collections}`));
  } finally {
    await report.destroy();
  }
  await page.goto(customerUrl);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Archive customer' }).click();
  await page.getByText(/^Archived \d{4}/).waitFor();
  assert.ok(await page.getByRole('link', { name: policyNumber, exact: true }).count());
  await logout();
  await page.getByLabel('Email').fill(customerEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Email or password is incorrect.' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Browser smoke passed for admin, agent and customer, including mobile navigation.');
} finally {
  await browser.close();
}
