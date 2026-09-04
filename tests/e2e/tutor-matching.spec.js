const { test, expect } = require("@playwright/test");

test.describe("Tutor Matching", () => {
  test("dashboard loads after login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', "teststudent1");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("add task page is accessible for students", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', "teststudent1");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/add-task");
    await expect(page.locator('form')).toBeVisible();
  });

  test("offer help page loads for teachers", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="username"]', "chatteacher");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.goto("/offer-help");
    await expect(page.locator("text=Browse")).toBeVisible();
  });
});
