import { test, expect } from '@playwright/test';

/**
 * Smoke test for the public marketing surface. Broader flows (signup →
 * onboarding → add learner → reach limit → upgrade → …) are added as the
 * modules land; see docs/development.md for the full e2e coverage plan.
 */
test('homepage renders the Tuvora positioning and primary CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/tutors|tutoring/i);
  await expect(page.getByRole('link', { name: /start free trial/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /pricing/i }).first()).toBeVisible();
});

test('pricing page is reachable', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/pricing/i);
});
