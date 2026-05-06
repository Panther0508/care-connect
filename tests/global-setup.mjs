import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

export default async function globalSetup(config: FullConfig) {
  // Ensure vitachain DB is initialized
  const userDataDir = path.resolve('.playwright-user-data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
  });
  
  // Navigate to app to trigger service worker registration and model preload
  const page = context.pages()[0] || await context.newPage();
  await page.goto(config.projects[0].use.baseURL);
  
  // Wait for app to be ready
  await page.waitForLoadState('networkidle');
  
  // Close context
  await context.close();
}
