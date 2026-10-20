import { expect, test } from "@playwright/test";
import { captureStep } from "../helpers/journey-helper.ts";

test.describe("Journey: Search & Discovery", () => {
  const JOURNEY_ID = "search-and-discovery";
  const JOURNEY_TITLE = "Search & Discovery Journey";

  test(
    "customer discovers and views establishment details in light and dark mode",
    async ({
      page,
    }, testInfo) => {
      // Deterministic route mocking for client-side search requests
      await page.route("**/api.ratings.food.gov.uk/**", async (route) => {
        const url = route.request().url();
        if (url.includes("/BusinessTypes")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              businessTypes: [
                {
                  BusinessTypeId: 1,
                  BusinessTypeName: "Restaurant/Cafe/Canteen",
                },
                {
                  BusinessTypeId: 7844,
                  BusinessTypeName: "Supermarket/Hypermarket",
                },
              ],
            }),
          });
        } else if (url.includes("/Ratings")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ratings: [
                { ratingKeyName: "5", ratingName: "5 - Very Good" },
                { ratingKeyName: "4", ratingName: "4 - Good" },
              ],
            }),
          });
        } else if (url.includes("/Authorities")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              authorities: [
                { LocalAuthorityId: 180, Name: "Leicester City" },
                { LocalAuthorityId: 181, Name: "Oadby and Wigston" },
              ],
            }),
          });
        } else if (url.includes("/Establishments")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              establishments: [
                {
                  FHRSID: 4587,
                  BusinessName: "Aldi Foodstore Ltd",
                  RatingValue: "5",
                  RatingDate: "2023-08-15",
                  BusinessType: "Supermarket/Hypermarket",
                  AddressLine1: "Harborough Road",
                  PostCode: "LE2 4LA",
                  SchemeType: "FHRS",
                  RatingKey: "fhrs_5_en-gb",
                  Scores: {
                    Hygiene: 5,
                    Structural: 5,
                    ConfidenceInManagement: 5,
                  },
                },
              ],
              meta: { totalCount: 1 },
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({}),
          });
        }
      });

      // Step 1: Homepage Visit
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 1,
          slug: "homepage-overview",
          title: "Homepage Hero & Navigation",
          description:
            "User lands on homepage, viewing hero callout, search links, and mascot.",
        },
        async () => {
          await page.goto("/");
          await expect(
            page.locator("h2:has-text('Food Hygiene Ratings UK')"),
          ).toBeVisible();
        },
      );

      // Step 2: Navigate to Search Page
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 2,
          slug: "search-page-initial",
          title: "Search Form & External API Consent",
          description:
            "User navigates to Search page, viewing search form and data consent notice.",
        },
        async () => {
          await page.goto("/search/");
          await expect(
            page.locator("h1:has-text('Search Food Establishments')"),
          ).toBeVisible();
          await expect(page.locator("#consent-section")).toBeVisible();
        },
      );

      // Step 3: Consent Toggle Activated
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 3,
          slug: "consent-enabled",
          title: "Consent Activated",
          description:
            "User opts into external queries via the slider switch, unlocking search capabilities.",
        },
        async () => {
          const toggleSlider = page.locator(".toggle-slider");
          await toggleSlider.click();
          const consentCheckbox = page.locator("#consent-toggle");
          await expect(consentCheckbox).toBeChecked();
        },
      );

      // Step 4: Perform Search Query
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 4,
          slug: "search-results-rendered",
          title: "Search Results Rendered",
          description:
            "User enters 'Aldi' in the search field and submits query; matching results are displayed.",
        },
        async () => {
          await page.fill("#name", "Aldi");
          await page.click("button[type='submit']");
          // Wait for results container to render establishment items
          await expect(page.locator("#results")).toBeVisible({
            timeout: 10000,
          });
        },
      );

      // Step 5: Navigate to Establishment Details Page
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 5,
          slug: "establishment-detail",
          title: "Establishment Detail Page",
          description:
            "User inspects full hygiene score breakdown and business information.",
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
    },
  );
});
