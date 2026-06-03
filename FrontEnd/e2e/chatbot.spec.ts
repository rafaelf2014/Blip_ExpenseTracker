import { test, expect } from '@playwright/test';

const TEST_USER = 'testuser_playwright';
const TEST_PASS = 'testpass123';

test.describe('Chatbot — financial assistant', () => {

    test.beforeAll(async ({ browser }) => {
        // Register the test user once (silent fail if already exists)
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/');
        // Page starts in Register mode by default
        await page.fill('input[type="text"]',     TEST_USER);
        await page.fill('input[type="password"]', TEST_PASS);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        await ctx.close();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Page always starts in Register mode — switch to Login mode
        await page.locator('.auth-toggle-btn').click();
        await expect(page.locator('button[type="submit"]')).toHaveText('Login');
        // Fill and submit
        await page.fill('input[type="text"]',     TEST_USER);
        await page.fill('input[type="password"]', TEST_PASS);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10_000 });
    });

    test('chatbot FAB is visible on dashboard', async ({ page }) => {
        await expect(page.locator('.fab-button')).toBeVisible();
    });

    test('chatbot is hidden on login page', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.fab-button')).not.toBeVisible();
    });

    test('chatbot opens and shows welcome message', async ({ page }) => {
        await page.click('.fab-button');
        await expect(page.locator('.ai-chat-window.open')).toBeVisible();
        await expect(page.locator('.message-bubble').first()).toContainText('assistente financeiro');
    });

    test('chatbot closes when X is clicked', async ({ page }) => {
        await page.click('.fab-button');
        await page.click('.close-btn');
        await expect(page.locator('.ai-chat-window.open')).not.toBeVisible();
    });

    test('send button disabled when input is empty', async ({ page }) => {
        await page.click('.fab-button');
        await expect(page.locator('.action-btn.send')).toBeDisabled();
    });

    test('send button enables when text is typed', async ({ page }) => {
        await page.click('.fab-button');
        await page.locator('.chat-footer input').fill('test query');
        await expect(page.locator('.action-btn.send')).toBeEnabled();
    });

    test('chatbot responds to UNKNOWN intent', async ({ page }) => {
        await page.click('.fab-button');
        const input = page.locator('.chat-footer input');
        await input.fill('Hello there!');
        await input.press('Enter');
        await expect(page.locator('.message-row.bot .message-bubble').last())
            .toContainText('perceb', { timeout: 10_000 });
    });

    test('chatbot responds to a TOTAL query', async ({ page }) => {
        await page.click('.fab-button');
        const input = page.locator('.chat-footer input');
        await input.fill('How much did I spend in total?');
        await input.press('Enter');
        await expect(page.locator('.message-row.bot .message-bubble').last())
            .toContainText(/€|não encontrei/i, { timeout: 10_000 });
    });

    test('chatbot is visible on transactions page', async ({ page }) => {
        await page.goto('/transactions');
        await expect(page.locator('.fab-button')).toBeVisible();
    });

    test('LLM is not loading on login page', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.ai-fab-container')).not.toBeVisible();
    });
});
