import { test, expect, Page } from "@playwright/test";

async function openMobileMenu(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.click('button[aria-label="Toggle menu"]');
    await page.waitForSelector('[data-testid="mobile-menu"]', {
      state: "visible",
    });
  }
}

async function navigateToCart(page: Page, isMobile: boolean) {
  if (isMobile) {
    await openMobileMenu(page, isMobile);
    await page.waitForSelector('[data-testid="mobile-menu-item"]', {
      state: "visible",
    });
    await page
      .getByTestId("mobile-menu-item")
      .filter({ hasText: "Cart" })
      .click();
  } else {
    await page.click('a[href="/cart"]');
  }
}

async function toggleDarkMode(page: Page, isMobile: boolean) {
  if (isMobile) {
    await openMobileMenu(page, isMobile);
    await page.waitForSelector('[data-testid="mobile-menu-item"]', {
      state: "visible",
    });
    await page
      .getByTestId("mobile-menu-item")
      .filter({ hasText: /Light Mode|Dark Mode/ })
      .click();
  } else {
    await page.click('button[aria-label="Toggle dark mode"]');
  }
}

test.describe("Menu Page", () => {
  test.beforeEach(async ({ page }) => {
    // Go to menu page before each test
    await page.goto("/menu");
    // Wait for the menu items to load
    await page.waitForSelector('button:has-text("Add to Cart")');
  });

  test("should display menu items and allow category filtering", async ({
    page,
  }) => {
    // Check if menu items are displayed
    await expect(
      page.getByRole("heading", { name: "Cappuccino" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Green Tea" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Croissant" })
    ).toBeVisible();

    // Test category filtering
    await page.click('button[aria-label="Filter by coffee"]');
    await expect(
      page.getByRole("heading", { name: "Cappuccino" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Green Tea" })
    ).not.toBeVisible();

    await page.click('button[aria-label="Filter by tea"]');
    await expect(
      page.getByRole("heading", { name: "Green Tea" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cappuccino" })
    ).not.toBeVisible();
  });

  test("should handle dark mode toggle", async ({ page, isMobile }) => {
    await toggleDarkMode(page, isMobile);
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("should add items to cart", async ({ page, isMobile }) => {
    // Add Cappuccino to cart
    await page.click('button[aria-label="Add Cappuccino to cart"]');
    await navigateToCart(page, isMobile);

    // Verify item is in cart
    await expect(
      page.getByRole("heading", { name: "Cappuccino" })
    ).toBeVisible();
    await expect(
      page
        .getByRole("heading", { name: "Cappuccino" })
        .locator("..")
        .locator("p")
    ).toHaveText("$4.99");
  });
});

test.describe("Cart Page", () => {
  test("should handle cart operations", async ({ page, isMobile }) => {
    // Add item to cart first
    await page.goto("/menu");
    await page.click('button[aria-label="Add Cappuccino to cart"]');
    await navigateToCart(page, isMobile);

    // Test quantity adjustment
    await page.click('button[aria-label="Increase quantity of Cappuccino"]');
    await expect(page.locator("text=2")).toBeVisible();

    // Test item removal
    await page.click('button[aria-label="Remove Cappuccino from cart"]');
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });
});

test.describe("Checkout Flow", () => {
  test("should complete checkout process", async ({ page, isMobile }) => {
    // Add item to cart first
    await page.goto("/menu");
    await page.click('button[aria-label="Add Cappuccino to cart"]');
    await navigateToCart(page, isMobile);
    await page.click("text=Proceed to Checkout");

    // Fill checkout form
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="phone"]', "1234567890");
    await page.fill('input[name="tableNumber"]', "42");
    await page.fill('textarea[name="specialInstructions"]', "No sugar please");

    // Submit order
    await page.click("text=Place Order");

    // Wait for navigation and check confirmation
    await page.waitForURL("**/order-confirmation");
    await expect(page.getByText("Order Confirmed!")).toBeVisible();
  });
});
