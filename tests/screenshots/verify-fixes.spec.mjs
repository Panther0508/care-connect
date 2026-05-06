import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.use({
  viewport: { width: 375, height: 812 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  isMobile: true,
});

test('Landing page after fix', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/VitaChain/i);
  await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'tests/screenshots/landing-after-fix.png', fullPage: true });
});

test('Settings tabs after fix', async ({ page }) => {
  await page.goto(`${BASE_URL}/settings?devBypass=true`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button:has-text("Profile")')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'tests/screenshots/settings-tabs-after-fix.png', fullPage: true });
});

test('Profile editing after fix', async ({ page }) => {
  await page.goto(`${BASE_URL}/settings?devBypass=true`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'tests/screenshots/profile-editing-after-fix.png' });
});

test('Passport online AI indicator', async ({ page }) => {
  await page.goto(`${BASE_URL}/passport?devBypass=true`, { waitUntil: 'domcontentloaded' });
  // Wait for loading state to appear (may be brief)
  const loading = page.locator('text=Generating secure QR...');
  await expect(loading).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tests/screenshots/passport-online-ai-indicator.png' });
});

test('Upgraded spinner', async ({ page }) => {
  await page.goto(`${BASE_URL}/ai?devBypass=true`, { waitUntil: 'domcontentloaded' });
  // Wait for the custom loading spinner to appear (may be brief)
  const spinner = page.locator('[data-testid="loading-spinner"]');
  await expect(spinner).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'tests/screenshots/upgraded-spinner.png' });
});
