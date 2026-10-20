import { expect, test } from "@playwright/test";
import { captureStep } from "../helpers/journey-helper.ts";

test.describe("Journey: Save to List", () => {
  const JOURNEY_ID = "save-to-list";
  const JOURNEY_TITLE = "Save to List & Custom Lists Management";
  const ESTABLISHMENT_URL = "/region-east-midlands/aldi-foodstore-ltd-4587";
  const LIST_NAME = "Oadby Favorites";

  test(
    "user saves an establishment to a custom list and reviews saved lists in light and dark mode",
    async ({
      page,
    }, testInfo) => {
      // Step 1: Establishment Page Loaded
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 1,
          slug: "establishment-overview",
          title: "Establishment Page Overview",
          description:
            "User navigates to Aldi Foodstore Ltd details page showing official rating badge and address.",
        },
        async () => {
          await page.goto(ESTABLISHMENT_URL);
          await expect(
            page.locator("article.establishment[data-establishment-id='4587']"),
          ).toBeVisible();
          await expect(
            page.locator("h1.name:has-text('Aldi Foodstore Ltd')"),
          ).toBeVisible();
        },
      );

      // Step 2: Hygiene Scores Breakdown
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 2,
          slug: "hygiene-breakdown",
          title: "Hygiene Scores Breakdown",
          description:
            "User reviews detailed criteria scores: food handling, structural cleanliness, and management.",
        },
        async () => {
          const scoresSection = page.locator(".scores, .establishment-scores");
          if ((await scoresSection.count()) > 0) {
            await expect(scoresSection.first()).toBeVisible();
          }
        },
      );

      // Step 3: Open Save Modal Dialog
      const saveButton = page.locator(
        '.establishment-header button:has-text("Save")',
      );
      const dialog = page.locator("dialog[open]");

      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 3,
          slug: "save-dialog-open",
          title: "Save to List Modal Opened",
          description:
            "User clicks 'Save' button in header, opening the accessible dialog to manage lists.",
        },
        async () => {
          await expect(saveButton).toBeVisible({ timeout: 10000 });
          await saveButton.click();
          await expect(dialog).toBeVisible();
        },
      );

      // Step 4: Create New List
      const listNameInput = dialog.locator(
        'input[type="text"][placeholder*="list name"]',
      );
      const createButton = dialog.locator('button:has-text("Create New List")');

      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 4,
          slug: "create-custom-list-input",
          title: "Create Custom List Input",
          description:
            "User enters new list name 'Oadby Favorites' into the list creation input.",
        },
        async () => {
          await expect(listNameInput).toBeVisible();
          await listNameInput.fill(LIST_NAME);
          await expect(createButton).toBeEnabled();
        },
      );

      // Step 5: Confirm List Creation & Verify Selection
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 5,
          slug: "list-created-and-checked",
          title: "List Created & Item Checked",
          description:
            "List is confirmed; checkbox is automatically checked indicating establishment is saved.",
        },
        async () => {
          await createButton.click();
          const listItem = dialog.locator(
            `.saved-list .list-item:has-text("${LIST_NAME}")`,
          );
          await expect(listItem).toBeVisible();
          await expect(listItem.locator('input[type="checkbox"]'))
            .toBeChecked();
        },
      );

      // Step 6: Close Modal Dialog
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 6,
          slug: "dialog-closed",
          title: "Dialog Closed",
          description:
            "User closes modal; the establishment page resumes with state persisted in storage.",
        },
        async () => {
          const closeButton = dialog.locator('button:has-text("Close")');
          await expect(closeButton).toBeVisible();
          await closeButton.click();
          await expect(dialog).not.toBeVisible();
        },
      );

      // Step 7: Navigate to My Lists Page
      await captureStep(
        page,
        testInfo,
        {
          journeyId: JOURNEY_ID,
          journeyTitle: JOURNEY_TITLE,
          stepNumber: 7,
          slug: "my-lists-overview",
          title: "My Lists Overview",
          description:
            "User navigates to '/lists/', viewing their newly created 'Oadby Favorites' list alongside 'Recent'.",
        },
        async () => {
          await page.goto("/lists/");
          await expect(page.locator("h1:has-text('My Lists')")).toBeVisible();
          await expect(
            page.locator(`.user-list:has-text("${LIST_NAME}")`),
          ).toBeVisible();
        },
      );
    },
  );
});
