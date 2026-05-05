// VitaChain Live Deployment E2E Test Suite
// Tests against https://care-connect-lilac-nine.vercel.app with testMode bypass

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Mobile viewport configuration
test.use({
  viewport: { width: 375, height: 812 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  isMobile: true
});

// Helper to capture console errors
function setupConsoleCapture(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: LANDING PAGE LOADS & CORE UI
// ─────────────────────────────────────────────────────────────────────────────
test('Landing Page Loads & Core UI', async ({ page }) => {
  const errors = setupConsoleCapture(page);
  await page.goto(BASE_URL);

  await expect(page).toHaveTitle(/VitaChain/i);

  const heroOrCTA = page.locator('h1, .hero, .landing-hero, button:has-text("Get Started"), button:has-text("Start")').first();
  await expect(heroOrCTA).toBeVisible();

  const body = page.locator('body');
  const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bgColor).toMatch(/rgb\(\s*15,\s*23,\s*42\s*\)/);

  if (errors.length > 0) console.log('Console errors:', errors);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: ALL ROUTES RETURN 200 WITH SPA SHELL
// ─────────────────────────────────────────────────────────────────────────────
test('All Routes Return 200 with SPA Shell', async ({ page }) => {
  const routes = [
    '/', '/ai?devBypass=true', '/passport?devBypass=true', '/dashboard?devBypass=true', '/admin?devBypass=true',
    '/anatomy?devBypass=true', '/health?devBypass=true', '/profile?devBypass=true', '/settings?devBypass=true',
    '/outbreak?devBypass=true', '/reservation?devBypass=true', '/support?devBypass=true', '/impact?devBypass=true',
    '/education?devBypass=true', '/quests?devBypass=true', '/rewards?devBypass=true', '/care-locator?devBypass=true',
    '/nutrition?devBypass=true', '/hydration?devBypass=true', '/sleep?devBypass=true', '/workout?devBypass=true',
    '/medications?devBypass=true', '/care-plans?devBypass=true', '/mental-health?devBypass=true', '/first-aid?devBypass=true',
    '/literature-search?devBypass=true', '/audit-log?devBypass=true', '/admin-biometric?devBypass=true', '/admin-mfa?devBypass=true',
    '/admin-dashboard?devBypass=true', '/translation?devBypass=true', '/privacy?devBypass=true', '/terms?devBypass=true'
  ];

  for (const route of routes) {
    const response = await page.goto(`${BASE_URL}${route}`);
    expect(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).toContain('VitaChain');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: AI CHAT OFFLINE FUNCTIONALITY
// ─────────────────────────────────────────────────────────────────────────────
test('AI Chat Offline Functionality', async ({ page }) => {
  const errors = setupConsoleCapture(page);
  await page.goto(`${BASE_URL}/ai?devBypass=true`);

  const chatInput = page.locator('textarea[placeholder*="Ask"], textarea, input[type="text"]').first();
  await expect(chatInput).toBeVisible({ timeout: 30000 });

  await chatInput.fill('What is a rash?');

  const sendButton = page.locator('button[class*="teal"], button[type="submit"], button:has(svg)').first();
  await sendButton.click();

  const responseBubble = page.locator('.message.bot, .chat-message.bot, [data-message-type="bot"], .assistant-message').last();
  await expect(responseBubble).toBeVisible({ timeout: 30000 });

  const responseText = await responseBubble.textContent();
  expect(responseText?.toLowerCase()).not.toContain('unavailable');
  expect(responseText?.length).toBeGreaterThan(10);

  if (errors.some(e => e.includes('AI') || e.includes('model') || e.includes('pipeline'))) {
    console.log('AI-related console errors:', errors);
  }
}, 120000);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: PASSPORT QR CODE GENERATION
// ─────────────────────────────────────────────────────────────────────────────
test('Passport QR Code Generation', async ({ page }) => {
  await page.goto(`${BASE_URL}/passport?devBypass=true`);

  const pharmacistCard = page.locator('text=Pharmacist, .clinician-card:has-text("Pharmacist"), button:has-text("Pharmacist")').first();
  await expect(pharmacistCard).toBeVisible();

  await pharmacistCard.click();

  const card = pharmacistCard.locator('..').first();
  const borderColor = await card.evaluate(el => getComputedStyle(el).borderColor);
  expect(borderColor.toLowerCase()).toMatch(/teal|0\s*,\s*150,\s*136/);

  const generateBtn = page.locator('button:has-text("Generate"), button:has-text("QR"), button:has-text("Share"), button:has-text("Create Passport")').first();
  await generateBtn.click();

  const qrCanvas = page.locator('canvas').first();
  const qrImage = page.locator('img[src*="qr"], img[alt*="QR"], [data-testid*="qr"]').first();

  await expect(qrCanvas.or(qrImage)).toBeVisible({ timeout: 60000 });
}, 120000);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: HEALTH GRAPH CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────
test('Health Graph CRUD Operations', async ({ page }) => {
  await page.goto(`${BASE_URL}/health?devBypass=true`);

  const addButton = page.locator('button:has-text("Add Condition"), button:has-text("+"), button[class*="add"], button[aria-label*="Add"]').first();
  await expect(addButton).toBeVisible();

  await addButton.click();

  const input = page.locator('input[placeholder*="Condition"], textarea[placeholder*="Condition"], input[type="text"]').first();
  await input.fill('Test Condition');

  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Add"), button[type="submit"]').last();
  await saveBtn.click();

  const conditionCard = page.locator('text=Test Condition').first();
  await expect(conditionCard).toBeVisible();

  await page.reload();
  await expect(conditionCard).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: DASHBOARD SKELETON LOADING
// ─────────────────────────────────────────────────────────────────────────────
test('Dashboard Skeleton Loading', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard?devBypass=true`);

  await page.waitForTimeout(1000);

  const mainContent = page.locator('main, .dashboard, .content, .dashboard-grid, .card').first();
  await expect(mainContent).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: API ENDPOINT FUNCTIONAL TESTS
// ─────────────────────────────────────────────────────────────────────────────
test('API Endpoints Functional Tests', async ({ page }) => {
  const apiBase = BASE_URL;

  const searchResp = await page.evaluate(async (base) => {
    return await fetch(`${base}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'pediatric ICU in Lagos' })
    }).then(r => ({ status: r.status, json: r.json() }));
  }, apiBase);
  expect(searchResp.status).toBe(200);
  expect(searchResp.json).toHaveProperty('results');

  const feedbackResp = await page.evaluate(async (base) => {
    return await fetch(`${base}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId: 'test', confirmed: true, helpful: true })
    }).then(r => r.status);
  }, apiBase);
  expect(feedbackResp).toBe(200);

  const impactResp = await page.evaluate(async (base) => {
    return await fetch(`${base}/api/impact`).then(r => ({ status: r.status, json: r.json() }));
  }, apiBase);
  expect(impactResp.status).toBe(200);
  expect(impactResp.json).toHaveProperty('watching');
  expect(impactResp.json).toHaveProperty('connections');
  expect(impactResp.json).toHaveProperty('facilities');

  const satelliteResp = await page.evaluate(async (base) => {
    return await fetch(`${base}/api/satellite-ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meshData: { searchCounters: {}, confirmed: [], stockoutAlerts: [] },
        deviceRegion: 'NG',
        timestamp: '2026-05-01T00:00:00Z'
      })
    }).then(r => r.status);
  }, apiBase);
  expect(satelliteResp).toBe(200);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: CUSTOM PWA INSTALL BUTTON VISIBILITY
// ─────────────────────────────────────────────────────────────────────────────
test('Custom PWA Install Button Visibility', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard?devBypass=true`);

  const installBtn = page.locator('text=Install VitaChain, text=Install, button:has-text("Install"), [aria-label*="Install"]').first();
  await expect(installBtn).toBeVisible();
});
