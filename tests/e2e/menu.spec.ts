import { expect, test } from "@playwright/test";

test.describe("Site navigation", () => {
  test.describe("Desktop Viewport", () => {
    test.use({
      viewport: { width: 1200, height: 800 },
    });

    test("shows inline navigation and hides the mobile menu button", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='hamburger']");
      await expect(menuButton).toBeHidden();

      const navLinks = page.locator("ul[class*='nav-links']");
      await expect(navLinks).toBeVisible();

      await expect(navLinks.locator('a[href="/about/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/l/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/search/"]')).toBeVisible();
      await expect(navLinks.locator('a[href="/lists/"]')).toBeVisible();
    });

    test("the header wrapper is sticky so it stays in view on scroll", async ({ page }) => {
      await page.goto("/");

      const wrapper = page.locator(".site-header-wrapper");
      await expect(wrapper).toBeVisible();

      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(400);

      const wrapperBox = await wrapper.boundingBox();
      expect(wrapperBox?.y).toBeGreaterThanOrEqual(0);
      expect(wrapperBox?.y).toBeLessThan(10);
    });
  });

  test.describe("Mobile Viewport", () => {
    test.use({
      viewport: { width: 390, height: 844 },
    });

    test("shows a menu button and starts with the drawer closed", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='hamburger']");
      await expect(menuButton).toBeVisible();

      const siteMenu = page.locator("ul[class*='nav-links']");
      await expect(siteMenu).toBeHidden();
    });

    test("opens the animated drawer and closes it with Escape", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='hamburger']");
      const siteMenu = page.locator("ul[class*='nav-links']");

      await siteMenu.evaluate((el) => {
        el.addEventListener(
          "transitionrun",
          () => el.setAttribute("data-transition-started", ""),
          { once: true },
        );
      });

      await menuButton.click();

      await expect(siteMenu).toBeVisible();
      await expect(siteMenu).toHaveAttribute("data-transition-started", "");

      await expect(siteMenu.locator('a[href="/about/"]')).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(siteMenu).toBeHidden();
      await expect(menuButton).toBeFocused();
    });

    test("light-dismisses on backdrop click", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='hamburger']");
      await menuButton.click();

      const siteMenu = page.locator("ul[class*='nav-links']");
      await expect(siteMenu).toBeVisible();

      await page.mouse.click(10, 10);
      await expect(siteMenu).toBeHidden();
    });

    test("prevents the page from scrolling while the drawer is open", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "not supported in Safari/WebKit");

      await page.goto("/");

      const menuButton = page.locator("button[class*='hamburger']");
      await menuButton.click();
      await expect(
        page.locator("ul[class*='nav-links']"),
      ).toBeVisible();

      const footer = page.locator("footer");
      const initialY = (await footer.boundingBox())?.y;

      await page.mouse.move(10, 400);
      await page.mouse.wheel(0, 600);

      await expect
        .poll(async () => (await footer.boundingBox())?.y)
        .toBe(initialY);
    });
  });

  test.describe("No-JavaScript Support", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });

    test("keeps navigation accessible without JavaScript via the Popover API", async ({ page }) => {
      await page.goto("/");

      const menuButton = page.locator("button[class*='hamburger']");
      await expect(menuButton).toBeVisible();

      await menuButton.click();
      const siteMenu = page.locator("ul[class*='nav-links']");
      await expect(siteMenu).toBeVisible();
      await expect(siteMenu.locator('a[href="/about/"]')).toBeVisible();
      await expect(siteMenu.locator('a[href="/l/"]')).toBeVisible();
      await expect(siteMenu.locator('a[href="/search/"]')).toBeVisible();
      await expect(siteMenu.locator('a[href="/lists/"]')).toBeVisible();
    });
  });
});
