import { expect, test } from "@playwright/test";

test.describe("Site navigation", () => {
  test.describe("Desktop Viewport", () => {
    test.use({
      viewport: { width: 1200, height: 800 },
    });

    test("shows inline navigation and hides the mobile menu button", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='menu-button']");
      await expect(menuButton).toBeHidden();

      const navLinks = page.locator("ul[class*='desktop-links']");
      await expect(navLinks).toBeVisible();

      await expect(navLinks.locator('a[href="/about/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/l/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/search/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/lists/"]')).toBeVisible();
    });

    test("hides the header scrolling down and restores it scrolling up", async ({ page }) => {
      await page.goto("/");

      const header = page.locator("header.site-header");
      await page.mouse.wheel(0, 600);
      await expect(header).toHaveAttribute("data-hidden", "");

      await page.mouse.wheel(0, -200);
      await expect(header).not.toHaveAttribute("data-hidden");
    });
  });

  test.describe("Mobile Viewport", () => {
    test.use({
      viewport: { width: 390, height: 844 },
    });

    test("shows a menu button and starts with the drawer closed", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='menu-button']");
      await expect(menuButton).toBeVisible();
      await expect(menuButton).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("dialog[class*='menu-dialog']")).toBeHidden();
    });

    test("opens the animated drawer and closes it with Escape", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='menu-button']");
      const menuDialog = page.locator("dialog[class*='menu-dialog']");
      await menuDialog.evaluate((dialog) => {
        dialog.addEventListener(
          "transitionrun",
          () => dialog.setAttribute("data-transition-started", ""),
          { once: true },
        );
      });
      await menuButton.click();

      await expect(menuDialog).toBeVisible();
      await expect(menuDialog).toHaveAttribute("data-transition-started", "");
      await expect(menuButton).toHaveAttribute("aria-expanded", "true");
      const navLinks = menuDialog.locator("ul[class*='drawer-links']");
      await expect(navLinks.locator('a[href="/about/"]')).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(menuDialog).toBeHidden();
      await expect(menuButton).toHaveAttribute("aria-expanded", "false");
      await expect(menuButton).toBeFocused();
    });

    test("light-dismisses on backdrop click", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='menu-button']");
      await menuButton.click();

      const menuDialog = page.locator("dialog[class*='menu-dialog']");
      await expect(menuDialog).toBeVisible();

      await page.mouse.click(10, 10);
      await expect(menuDialog).toBeHidden();
    });

    test("prevents the page from scrolling while the drawer is open", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='menu-button']");
      await menuButton.click();
      await expect(page.locator("dialog[class*='menu-dialog']")).toBeVisible();

      // Measure the initial vertical position of the main content relative to the viewport
      const main = page.locator("footer");
      const initialY = (await main.boundingBox())?.y;

      await page.mouse.move(10, 400);
      await page.mouse.wheel(0, 600);

      // Verify the element hasn't shifted vertically
      await expect
        .poll(async () => (await main.boundingBox())?.y)
        .toBe(initialY);
    });
  });

  test.describe("No-JavaScript Support", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });

    test("keeps navigation available without JavaScript", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='menu-button']");
      await expect(menuButton).toBeHidden();
      const navLinks = page.locator("ul[class*='desktop-links']");
      await expect(navLinks).toBeVisible();
      await expect(navLinks.locator('a[href="/about/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/l/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/search/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/lists/"]')).toBeVisible();
    });
  });
});
