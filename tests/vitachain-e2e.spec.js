// tests/vitachain-e2e.spec.js
import { test, expect } from '@playwright/test';

test.describe('VitaChain Core Flows', () => {

  test('landing page renders title', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/VitaChain/i);
    await expect(page.locator('#root')).toBeVisible();

    if (errors.length) console.log('Landing page errors:', errors);
    expect(errors).toEqual([]);
  });

  test('AI assistant responds to query', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Mock Gemini API to avoid real network calls and model loading
    await page.route('**/generativelanguage.googleapis.com/**', async route => {
      const resp = {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: { parts: [{ text: 'Mocked response: A rash is a change in skin appearance, often red and itchy. consult a doctor if concerned.' }] }
          }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 }
        })
      };
      await route.fulfill(resp);
    });

    await page.goto('/ai?devBypass=true');

    // Wait for textarea (may take time due to model init)
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 60000 });

    // Check for error boundary
    if (await page.locator('text=Something went wrong').isVisible()) {
      console.log('AI page errors:', errors);
      throw new Error('AI page crashed');
    }

    await textarea.fill('What is a rash?');
    await textarea.press('Enter');

    const response = page.locator('[data-message-role="assistant"]').first();
    await expect(response).toBeVisible({ timeout: 120000 });
    const text = await response.textContent();
    expect(text && text.length > 10).toBeTruthy();

    expect(errors.length).toBe(0);
  });

  test('passport generates QR for pharmacist', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Ensure health data exists
    await page.goto('/health?devBypass=true');
    await expect(page.locator('h1:has-text("My Health Graph")')).toBeVisible({ timeout: 30000 });

    const addBtn = page.locator('button:has-text("Add Condition")');
    if (await addBtn.isVisible({ timeout: 5000 })) {
      await addBtn.click();
      await page.locator('input[name="conditionName"]').fill('Hypertension');
      await page.locator('input[name="diagnosedDate"]').fill('2024-01-01');
      await page.locator('button:has-text("Save Condition")').click();
      await expect(page.getByText('Hypertension').first()).toBeVisible({ timeout: 10000 });
    }

    // Generate passport
    await page.goto('/passport?devBypass=true');
    await expect(page.locator('h1:has-text("Health Passport")')).toBeVisible({ timeout: 30000 });

    // Click the Pharmacist card
    const pharmacistBtn = page.locator('button:has-text("Pharmacist")');
    await expect(pharmacistBtn).toBeVisible({ timeout: 15000 });
    await pharmacistBtn.click();

    // Wait for and click the "Generate QR Code" button
    const generateBtn = page.locator('button:has-text("Generate QR Code")');
    await expect(generateBtn).toBeVisible({ timeout: 30000 });
    await generateBtn.click();

    // Wait for QR code canvas or img
    const qr = page.locator('canvas#qr-code, img.qr-code');
    await expect(qr).toBeVisible({ timeout: 30000 });

    if (errors.length) console.log('Passport page errors:', errors);
    expect(errors).toEqual([]);
  });

  test('health graph creates condition', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/health?devBypass=true');

    // Wait for page header to ensure loaded
    await expect(page.locator('h1:has-text("My Health Graph")')).toBeVisible({ timeout: 30000 });

    const addBtn = page.locator('button:has-text("Add Condition")');
    await expect(addBtn).toBeVisible({ timeout: 30000 });

    await addBtn.click();
    await page.locator('input[name="conditionName"]').fill('Test Condition');
    await page.locator('input[name="diagnosedDate"]').fill('2025-01-01');
    await page.locator('button:has-text("Save Condition")').click();

    await expect(page.getByText('Test Condition').first()).toBeVisible({ timeout: 10000 });

    if (errors.length) console.log('Health graph page errors:', errors);
    expect(errors).toEqual([]);
  });

  test('dashboard shows skeleton then content', async ({ page }) => {
    await page.goto('/dashboard?devBypass=true');
    // Wait for any content beyond skeleton
    const content = page.locator('.glass-card, .stat-card, h1, h2').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('protected routes return 200', async ({ page }) => {
    const routes = [
      '/',
      '/sign-in',
      '/sign-up',
      '/onboarding?devBypass=true',
      '/dashboard?devBypass=true',
      '/health?devBypass=true',
      '/ai?devBypass=true',
      '/nutrition?devBypass=true',
      '/workout?devBypass=true',
      '/sleep?devBypass=true',
      '/medications?devBypass=true',
      '/mental-health?devBypass=true',
      '/passport?devBypass=true',
      '/clinician-view?devBypass=true',
      '/outbreak?devBypass=true',
      '/settings?devBypass=true',
      '/support?devBypass=true',
    ];
    for (const route of routes) {
      const resp = await page.goto(route);
      expect(resp.status()).toBe(200);
    }
  });

  test('API endpoints return 200', async ({ page }) => {
    const base = 'http://localhost:8080';
    let resp = await page.request.post(`${base}/api/search`, { data: { query: 'test', limit: 5 } });
    expect(resp.status()).toBe(200);
    resp = await page.request.get(`${base}/api/impact`);
    expect(resp.status()).toBe(200);
    resp = await page.request.post(`${base}/api/feedback`, { data: { message: 'ok' } });
    expect(resp.status()).toBe(200);
    resp = await page.request.post(`${base}/api/satellite-ingest`, { data: { payload: {} } });
    expect(resp.status()).toBe(200);
  });

});

test.describe('Data & Mesh', () => {

  test('clinician scan populates patient health graph', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const p1 = await ctx1.newPage();
    await p1.goto('/clinician-view?devBypass=true');
    const vc = {
      patientDID: 'did:test:123',
      conditions: [{ name: 'Hypertension', diagnosedDate: '2024-01-01' }],
      medications: [{ name: 'Lisinopril', dose: '10mg', frequency: 'daily' }],
      summary: 'Test'
    };
    await p1.evaluate((data) => {
      if (window.handleVCScan) window.handleVCScan(data);
      else window.dispatchEvent(new CustomEvent('vc-scanned', { detail: data }));
    }, vc);
    await p1.waitForTimeout(1000);

    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto('/health?devBypass=true');
    await expect(p2.getByText('Hypertension').first()).toBeVisible({ timeout: 10000 });
    await expect(p2.getByText('Lisinopril').first()).toBeVisible();
  });

  test('broadcast channel mesh syncs search counters', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const p1 = await ctx1.newPage();
    await p1.goto('/?devBypass=true');
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto('/?devBypass=true');

    // Set up listener on page2 BEFORE sending message
    let received = false;
    await p2.exposeFunction('meshMsg', (d) => { if (d?.type === 'search') received = true; });
    await p2.evaluate(() => {
      const bc = new BroadcastChannel('vitachain-mesh');
      // Keep reference to prevent garbage collection
      window.__test_bc = bc;
      bc.onmessage = (e) => { if (window.meshMsg) window.meshMsg(e.data); };
    });

    // Now send from page1
    await p1.evaluate(() => {
      const bc = new BroadcastChannel('vitachain-mesh');
      bc.postMessage({ type: 'search', termHash: 'fever-test', timestamp: Date.now() });
    });

    await p2.waitForTimeout(1000);
    expect(received).toBe(true);
  });

  test('satellite snitch triggers upload after 8 days', async ({ page }) => {
    await page.goto('/?devBypass=true');
    // Wait for mesh/offline data initialization to complete
    await page.waitForFunction(() => localStorage.getItem('vitachain_offline_loaded') === 'true');

    await page.evaluate(() => {
      localStorage.setItem('lastSatelliteSync', String(Date.now() - 9 * 24 * 60 * 60 * 1000));
    });
    let uploaded = false;
    page.on('response', r => {
      if (r.url().includes('/api/satellite-ingest') && r.status() === 200) uploaded = true;
    });
    await page.evaluate(async () => {
      if (window.satelliteSnitch) await window.satelliteSnitch.forceUpload();
      else window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(3000);
    expect(uploaded).toBe(true);
  });

  test('outbreak detector fires alert', async ({ page }) => {
    await page.goto('/?devBypass=true');
    await page.evaluate(async () => {
      const bc = new BroadcastChannel('vitachain-mesh');
      for (let i = 0; i < 6; i++) {
        bc.postMessage({ type: 'search', termHash: 'fever-outbreak', timestamp: Date.now() });
        await new Promise(r => setTimeout(r, 100));
      }
    });
    const alert = page.locator('[data-outbreak-alert]');
    await expect(alert).toBeVisible({ timeout: 10000 });
  });

});
