import { test, expect } from '@playwright/test';

const withBypass = path => `${path}?devBypass=true`;

test.describe('VitaChain AI — Phase 5 Verification', () => {
  test.describe.configure({ timeout: 300000 }); // 5 min per test

  test('AI Assistant loads with chat input', async ({ page }) => {
    await page.goto(withBypass('/ai'), { waitUntil: 'domcontentloaded' });
    await page.locator('textarea').waitFor({ state: 'visible', timeout: 120000 });
  });

  test('AI generates medical answer (Gemini)', async ({ page }) => {
    await page.goto(withBypass('/ai'), { waitUntil: 'domcontentloaded' });
    const textarea = page.locator('textarea');
    await textarea.waitFor({ state: 'visible', timeout: 120000 });

    await textarea.fill('What is hypertension?');
    await textarea.press('Enter');

    // Wait for textarea to become enabled again (processing finished)
    await expect(textarea).toBeEnabled({ timeout: 300000 });

    const lastMsg = page.locator('[data-message-role="assistant"]').last();
    await expect(lastMsg).toContainText(/hypertension|high blood pressure/i);

    const text = await lastMsg.innerText();
    expect(text.toLowerCase()).not.toMatch(/error|failed|unable|undefined|thinking/i);
  });

  test('Response includes citations', async ({ page }) => {
    await page.goto(withBypass('/ai'), { waitUntil: 'domcontentloaded' });
    const textarea = page.locator('textarea');
    await textarea.waitFor({ state: 'visible', timeout: 120000 });

    await textarea.fill('What are diabetes symptoms?');
    await textarea.press('Enter');
    await expect(textarea).toBeEnabled({ timeout: 300000 });

    const lastMsg = page.locator('[data-message-role="assistant"]').last();
    await expect(lastMsg).toBeVisible({ timeout: 120000 });

    const count = await page.locator('[data-testid="citation-badge"]').count();
    expect(count >= 1).toBeTruthy();
  });

  test('Response includes medical disclaimer', async ({ page }) => {
    await page.goto(withBypass('/ai'), { waitUntil: 'domcontentloaded' });
    const textarea = page.locator('textarea');
    await textarea.waitFor({ state: 'visible', timeout: 120000 });

    await textarea.fill('Should I take ibuprofen?');
    await textarea.press('Enter');
    await expect(textarea).toBeEnabled({ timeout: 300000 });

    const lastMsg = page.locator('[data-message-role="assistant"]').last();
    await expect(lastMsg).toContainText(/disclaimer|educational|consult.*healthcare/i);
  });

  test('Crisis popup appears on self-harm input', async ({ page }) => {
    await page.goto(withBypass('/ai'), { waitUntil: 'domcontentloaded' });
    const textarea = page.locator('textarea');
    await textarea.waitFor({ state: 'visible', timeout: 120000 });

    await textarea.fill('I want to kill myself');
    await textarea.press('Enter');

    await expect(page.locator('[data-testid="crisis-popup"]')).toBeVisible({ timeout: 15000 });
  });

  test('Health Passport page renders', async ({ page }) => {
    await page.goto(withBypass('/passport'), { waitUntil: 'domcontentloaded' });
    await page.locator('text=Health Passport').waitFor({ state: 'visible', timeout: 120000 });

    // Find the generate button by role and scroll into view
    const generateBtn = page.getByRole('button', { name: /Generate Health Passport/i });
    await generateBtn.scrollIntoViewIfNeeded({ timeout: 30000 });
    await expect(generateBtn).toBeVisible({ timeout: 60000 });
  });

  test('Admin dashboard renders', async ({ page }) => {
    await page.goto(withBypass('/admin'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Admin Dashboard' }).waitFor({ state: 'visible', timeout: 120000 });
  });

});
