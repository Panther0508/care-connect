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
  // Setup: ensure there is health data
  await page.goto(`${BASE_URL}/health?devBypass=true`, { waitUntil: 'domcontentloaded' });
  await page.locator('button:has-text("Add Condition")').first().click();
  await page.locator('input[name="conditionName"]').fill('Hypertension');
  await page.locator('button:has-text("Save Condition")').last().click();
  await expect(page.locator('text=Hypertension')).toBeVisible({ timeout: 30000 });

  // Navigate to passport and generate QR
  await page.goto(`${BASE_URL}/passport?devBypass=true`, { waitUntil: 'domcontentloaded' });
  const pharmacistCard = page.locator('[data-testid="pharmacist"]').first();
  await expect(pharmacistCard).toBeVisible({ timeout: 30000 });
  await pharmacistCard.click();
  const generateBtn = page.locator('button:has-text("Generate")').first();
  await generateBtn.click();

  // Wait for loading indicator
  const loading = page.locator('text=Generating secure QR...');
  await expect(loading).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'tests/screenshots/passport-online-ai-indicator.png' });
});

test('Upgraded spinner', async ({ page }) => {
  // Setup health data first (same as previous test)
  await page.goto(`${BASE_URL}/health?devBypass=true`, { waitUntil: 'domcontentloaded' });
  await page.locator('button:has-text("Add Condition")').first().click();
  await page.locator('input[name="conditionName"]').fill('Hypertension');
  await page.locator('button:has-text("Save Condition")').last().click();
  await expect(page.locator('text=Hypertension')).toBeVisible({ timeout: 30000 });

  // Navigate to passport and trigger generation
  await page.goto(`${BASE_URL}/passport?devBypass=true`, { waitUntil: 'domcontentloaded' });
  const pharmacistCard = page.locator('[data-testid="pharmacist"]').first();
  await expect(pharmacistCard).toBeVisible({ timeout: 30000 });
  await pharmacistCard.click();
  const generateBtn = page.locator('button:has-text("Generate")').first();
  await generateBtn.click();

  // Wait for custom loading spinner to appear
  const spinner = page.locator('[data-testid="loading-spinner"]');
  await expect(spinner).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: 'tests/screenshots/upgraded-spinner.png' });
});
