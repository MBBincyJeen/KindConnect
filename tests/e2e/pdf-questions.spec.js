const { test, expect } = require("@playwright/test");

test.describe("PDF Q&A", () => {
  test("PDF list page loads", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', "teststudent1");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/pdf/list");
    await expect(page).toHaveURL(/\/pdf\/list/);
  });

  test("PDF upload page loads", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', "teststudent1");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/pdf/upload");
    await expect(page.locator('form')).toBeVisible();
  });
});
