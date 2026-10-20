import { expect, test } from "@playwright/test";
import { captureStep } from "../helpers/journey-helper.ts";

test.describe("Journey: Regional & Local Authority Browse", () => {
  const JOURNEY_ID = "browse-region";
  const JOURNEY_TITLE = "Regional Directory & Authority Exploration";

  test(
    "user explores regions, filters authority establishments, and inspects a business in light and dark mode",
    async ({
      page,
    }, testInfo) => {
      // Step 1: Browse Regions Index Directory
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 1,
          slug: "regions-directory",
          title: "Regions & Local Authorities Directory",
          description:
            "User navigates to '/l/', viewing regional groupings and council authorities across the UK.",
        },
        async () => {
          await page.goto("/l/");
          await expect(page.locator("h2, h1").first()).toBeVisible();
        },
      );

      // Step 2: Select Local Authority Page (Oadby and Wigston)
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 2,
          slug: "local-authority-landing",
          title: "Local Authority Detail Page",
          description:
            "User opens Oadby and Wigston authority directory with search/filter bar and establishment listings.",
        },
        async () => {
          await page.goto("/l/oadby-and-wigston.html");
          await expect(
            page.locator("h1:has-text('Oadby and Wigston')"),
          ).toBeVisible();
          await expect(page.locator("#filter-input")).toBeVisible();
        },
      );

      // Step 3: Filter Establishments by Keyword
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 3,
          slug: "authority-filter-applied",
          title: "Live Filter Applied",
          description:
            "User types 'Aldi' into the live filter input; matching local businesses are displayed.",
        },
        async () => {
          const filterInput = page.locator("#filter-input");
          await filterInput.fill("Aldi");
          // Verify filtered establishment is visible
          const aldiCard = page.locator(
            ".establishment:not(.hidden):has-text('Aldi')",
          );
          await expect(aldiCard.first()).toBeVisible();
        },
      );

      // Step 4: Navigate to Selected Establishment
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 4,
          slug: "authority-establishment-detail",
          title: "Establishment Page from Authority",
          description:
            "User clicks through from the filtered authority list to view the full hygiene score card.",
        },
        async () => {
          await page.goto("/region-east-midlands/aldi-foodstore-ltd-4587");
          await expect(
            page.locator("article.establishment[data-establishment-id='4587']"),
          ).toBeVisible();
        },
      );
    },
  );
});
