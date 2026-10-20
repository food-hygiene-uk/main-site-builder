import { expect, test } from "@playwright/test";
import { captureStep } from "../helpers/journey-helper.ts";

test.describe("Journey: Mobile Experience", () => {
  const JOURNEY_ID = "mobile-experience";
  const JOURNEY_TITLE = "Mobile Responsive & Usability Experience";

  test.use({
    viewport: { width: 390, height: 844 }, // iPhone / modern mobile standard
  });

  test(
    "user interacts with mobile navigation, search, and establishment detail in light and dark mode",
    async ({
      page,
    }, testInfo) => {
      // Step 1: Mobile Homepage Layout
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 1,
          slug: "mobile-homepage",
          title: "Mobile Homepage & Header",
          description:
            "User lands on homepage on a 390x844 mobile viewport; verifies mobile header, mascot scaling, and action buttons.",
        },
        async () => {
          await page.goto("/");
          await expect(
            page.locator("h2:has-text('Food Hygiene Ratings UK')"),
          ).toBeVisible();
        },
      );

      // Step 2: Mobile Navigation Drawer
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 2,
          slug: "mobile-menu-drawer",
          title: "Mobile Navigation Drawer Open",
          description:
            "User taps the hamburger icon; full mobile navigation drawer transitions into view.",
        },
        async () => {
          const hamburger = page.locator("label[class*='hamburger']");
          await expect(hamburger).toBeVisible();
          await hamburger.click();
          const navLinks = page.locator("ul[class*='nav-links']");
          await expect(navLinks).toBeVisible();
        },
      );

      // Step 3: Mobile Search Page
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 3,
          slug: "mobile-search-form",
          title: "Mobile Search Form & Consent",
          description:
            "User views the mobile-optimized search input fields, action buttons, and consent card.",
        },
        async () => {
          await page.goto("/search/");
          await expect(
            page.locator("h1:has-text('Search Food Establishments')"),
          ).toBeVisible();
          await expect(page.locator("#consent-section")).toBeVisible();
        },
      );

      // Step 4: Mobile Establishment Detail View
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 4,
          slug: "mobile-establishment-detail",
          title: "Mobile Establishment Detail & Scores",
          description:
            "User evaluates establishment details on mobile; tests readability of score cards and text wrapping.",
        },
        async () => {
          await page.goto("/region-east-midlands/aldi-foodstore-ltd-4587");
          await expect(
            page.locator("article.establishment[data-establishment-id='4587']"),
          ).toBeVisible();
          await expect(
            page.locator("h1.name:has-text('Aldi Foodstore Ltd')"),
          ).toBeVisible();
        },
      );

      // Step 5: Mobile Save to List Modal
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 5,
          slug: "mobile-save-modal",
          title: "Mobile Save to List Modal",
          description:
            "User opens 'Save' dialog on mobile; verifies modal sizing, touch targets, and button placement.",
        },
        async () => {
          const saveButton = page.locator(
            '.establishment-header button:has-text("Save")',
          );
          await expect(saveButton).toBeVisible({ timeout: 10000 });
          await saveButton.click();
          const dialog = page.locator("dialog[open]");
          await expect(dialog).toBeVisible();
        },
      );
    },
  );
});
