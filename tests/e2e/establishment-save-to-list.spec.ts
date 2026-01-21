import { expect, test } from "@playwright/test";

test.describe("Establishment Page - Save to List Functionality", () => {
  // URL for the establishment page
  const detailPageUrl = "/region-east-midlands/masala-mix-1694348";

  test('should allow saving to a new list named "Oadby"', async ({ page }) => {
    await page.goto(detailPageUrl);

    // Wait for the main establishment article to be visible
    await expect(
      page.locator('article.establishment[data-establishment-id="1694348"]'),
    ).toBeVisible();
    await expect(page.locator('h1.name:has-text("Masala Mix")')).toBeVisible();

    // 1. Click the "Save" button.
    const saveToListButton = page.locator(
      '.establishment-header button:has-text("Save")',
    );
    await expect(saveToListButton).toBeVisible({ timeout: 10000 }); // Wait for dynamic button
    await saveToListButton.click();

    // 2. Wait for the "Manage Lists" dialog to appear.
    const listDialog = page.locator("dialog[open]");
    await expect(listDialog).toBeVisible();

    // 3. Fill in the new list name "Oadby".
    const listNameInput = listDialog.locator(
      'input[type="text"][placeholder*="list name"]',
    );
    await expect(listNameInput).toBeVisible();
    await listNameInput.fill("Oadby");

    // 4. Click the button to confirm creation of the new list (e.g., "Create", "Save List").
    const confirmCreateButton = listDialog.locator(
      'button:has-text("Create New List")',
    );
    await expect(confirmCreateButton).toBeEnabled();
    await confirmCreateButton.click();

    // 5. Wait for Oadby list to be created and visible in the dialog and checked.
    await expect(
      listDialog.locator('.saved-list .list-item:has-text("Oadby")'),
    ).toBeVisible();
    await expect(
      listDialog.locator(
        '.saved-list .list-item:has-text("Oadby") input[type="checkbox"]',
      ),
    ).toBeChecked();

    // 6. Close the dialog.
    const closeDialogButton = listDialog.locator('button:has-text("Close")');
    await expect(closeDialogButton).toBeVisible();
    await closeDialogButton.click();

    // 7. Verify the dialog is no longer visible.
    await expect(listDialog).not.toBeVisible();
  });
});
