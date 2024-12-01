import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

async function loginAsAdmin(page: Page) {
  await page.context().addCookies([
    {
      name: "session",
      value: "admin@example.com",
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function generateQRCode(
  page: Page,
  tableNumber: string,
  type: "menu" | "feedback"
) {
  await page.fill('input[name="tableNumber"]', tableNumber);
  await page.selectOption('select[name="type"]', type);
  await page.click('button:has-text("Generate QR Code")');

  // Wait for QR code container to be visible
  await page.waitForSelector(
    `[data-testid="qr-container-${type}-${tableNumber}"]`,
    {
      state: "visible",
      timeout: 10000,
    }
  );
}

test.describe("Admin QR Generation Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/generate`, { waitUntil: "networkidle" });
    await page.waitForSelector('input[name="tableNumber"]', {
      state: "visible",
      timeout: 10000,
    });
  });

  test("should show form elements", async ({ page }) => {
    // Check if form elements are present
    await expect(page.locator('input[name="tableNumber"]')).toBeVisible();
    await expect(page.locator('select[name="type"]')).toBeVisible();
    await expect(
      page.locator('button:has-text("Generate QR Code")')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="dark-mode-toggle"]')
    ).toBeVisible();
  });

  test("should generate menu QR code", async ({ page }) => {
    await generateQRCode(page, "42", "menu");

    // Check if QR code is generated
    const container = page.locator(`[data-testid="qr-container-menu-42"]`);
    await expect(container).toBeVisible();
    await expect(container.getByText("Table 42")).toBeVisible();
    await expect(container.getByText("Menu QR Code")).toBeVisible();
    await expect(container.getByText("Download")).toBeVisible();
  });

  test("should generate feedback QR code", async ({ page }) => {
    await generateQRCode(page, "42", "feedback");

    // Check if QR code is generated
    const container = page.locator(`[data-testid="qr-container-feedback-42"]`);
    await expect(container).toBeVisible();
    await expect(container.getByText("Table 42")).toBeVisible();
    await expect(container.getByText("Feedback QR Code")).toBeVisible();
    await expect(container.getByText("Download")).toBeVisible();
  });

  test("should allow generating multiple QR codes", async ({ page }) => {
    // Generate first QR code
    await generateQRCode(page, "1", "menu");
    const firstContainer = page.locator('[data-testid="qr-container-menu-1"]');
    await expect(firstContainer.getByText("Table 1")).toBeVisible();
    await expect(firstContainer.getByText("Menu QR Code")).toBeVisible();

    // Generate second QR code
    await generateQRCode(page, "2", "feedback");
    const secondContainer = page.locator(
      '[data-testid="qr-container-feedback-2"]'
    );
    await expect(secondContainer.getByText("Table 2")).toBeVisible();
    await expect(secondContainer.getByText("Feedback QR Code")).toBeVisible();

    // Both QR codes should still be visible
    await expect(firstContainer).toBeVisible();
    await expect(secondContainer).toBeVisible();
  });

  test("should validate table number input", async ({ page }) => {
    // Try to submit without table number
    await page.click('button:has-text("Generate QR Code")');

    // No QR code should be generated
    await expect(page.locator('[data-testid^="qr-container-"]')).toHaveCount(0);
  });

  test("should generate correct QR code URLs", async ({ page }) => {
    await generateQRCode(page, "42", "menu");

    // Get the QR code value from the data-value attribute
    const qrValue = await page
      .locator("#qr-menu-42")
      .getAttribute("data-value");
    expect(qrValue).toBe(`${BASE_URL}/menu?table=42`);

    // Generate feedback QR code and check its URL
    await generateQRCode(page, "43", "feedback");
    const feedbackQrValue = await page
      .locator("#qr-feedback-43")
      .getAttribute("data-value");
    expect(feedbackQrValue).toBe(`${BASE_URL}/feedback?table=43`);
  });

  test("should redirect non-admin users to home page", async ({ page }) => {
    // Clear cookies to simulate non-admin user
    await page.context().clearCookies();

    // Try to access admin page
    await page.goto(`${BASE_URL}/admin/generate`, {
      waitUntil: "domcontentloaded",
    });

    // Wait for navigation to complete and verify redirect
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test("should handle mobile viewport", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if form is still usable
    await generateQRCode(page, "42", "menu");

    // Verify QR code is generated and visible
    const container = page.locator(`[data-testid="qr-container-menu-42"]`);
    await expect(container).toBeVisible();
    await expect(container.getByText("Table 42")).toBeVisible();
    await expect(container.getByText("Menu QR Code")).toBeVisible();
    await expect(container.getByText("Download")).toBeVisible();
  });

  test("should preserve generated QR codes after form reset", async ({
    page,
  }) => {
    // Generate first QR code
    await generateQRCode(page, "1", "menu");
    const firstContainer = page.locator('[data-testid="qr-container-menu-1"]');
    await expect(firstContainer.getByText("Table 1")).toBeVisible();
    await expect(firstContainer.getByText("Menu QR Code")).toBeVisible();

    // Generate second QR code
    await generateQRCode(page, "2", "menu");
    const secondContainer = page.locator('[data-testid="qr-container-menu-2"]');
    await expect(secondContainer.getByText("Table 2")).toBeVisible();
    await expect(secondContainer.getByText("Menu QR Code")).toBeVisible();

    // Both QR codes should still be visible
    await expect(firstContainer).toBeVisible();
    await expect(secondContainer).toBeVisible();

    // Form should be reset
    await expect(page.locator('input[name="tableNumber"]')).toHaveValue("");
  });

  test("should handle dark mode", async ({ page }) => {
    // Toggle dark mode
    await page.click('[data-testid="dark-mode-toggle"]');

    // Check if dark mode is applied
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Generate QR code and verify visibility
    await generateQRCode(page, "42", "menu");
    const container = page.locator(`[data-testid="qr-container-menu-42"]`);
    await expect(container).toBeVisible();
    await expect(container.getByText("Table 42")).toBeVisible();
    await expect(container.getByText("Menu QR Code")).toBeVisible();
    await expect(container.getByText("Download")).toBeVisible();
  });
});
