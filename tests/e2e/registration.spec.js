const { test, expect } = require("@playwright/test");

test.describe("Registration", () => {
  test("shows the registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveTitle(/KindConnect/);
    await expect(page.locator('form')).toBeVisible();
  });

  test("validates required fields", async ({ page }) => {
    await page.goto("/register");
    await page.click('button[type="submit"]');
    // Should show error or prevent submission
    await expect(page.locator('form')).toBeVisible();
  });

  test("registers a new student", async ({ page }) => {
    await page.goto("/register");

    await page.fill('input[name="username"]', `testuser_${Date.now()}`);
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="fullName"]', "Test Student");
    await page.fill('input[name="aadhaarNumber"]', "234567890123");

    // Select role
    await page.click('[data-role="Student"]');

    // Select gender
    await page.click('[data-gender="Male"]');

    // Select education level
    await page.selectOption('select[name="educationLevel"]', "10th");

    // Fill location
    await page.fill('input[name="location"]', "Mumbai");

    await page.click('button[type="submit"]');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
