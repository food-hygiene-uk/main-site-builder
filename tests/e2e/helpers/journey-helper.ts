import type { Page, TestInfo } from "@playwright/test";
import { test } from "@playwright/test";
import * as path from "node:path";
import * as fs from "node:fs/promises";

export interface JourneyStepOptions {
  journeyId: string;
  journeyTitle: string;
  stepNumber: number;
  slug: string;
  title: string;
  description: string;
  fullPage?: boolean;
}

export interface StepRecord {
  journeyId: string;
  journeyTitle: string;
  stepNumber: number;
  slug: string;
  title: string;
  description: string;
  lightImage: string;
  darkImage: string;
  viewport: { width: number; height: number };
  isMobile: boolean;
  browser: string;
  timestamp: string;
}

const SCREENSHOTS_ROOT = path.resolve("./test-results/screenshots");
const RECORDS_DIR = path.join(SCREENSHOTS_ROOT, ".records");

/**
 * Executes a journey step action, then captures both Light and Dark mode screenshots,
 * attaches them to the Playwright report, and writes step metadata for the review portal.
 */
export async function captureStep(
  page: Page,
  testInfo: TestInfo,
  options: JourneyStepOptions,
  action?: () => Promise<void>,
): Promise<void> {
  await test.step(`${options.stepNumber}. ${options.title}`, async () => {
    // 1. Run the user step action if provided
    if (action) {
      await action();
    }

    // 2. Wait for DOM and animations to stabilize
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(200);

    const journeyDir = path.join(SCREENSHOTS_ROOT, options.journeyId);
    await fs.mkdir(journeyDir, { recursive: true });
    await fs.mkdir(RECORDS_DIR, { recursive: true });

    const stepPrefix = String(options.stepNumber).padStart(2, "0");
    const lightFilename = `${stepPrefix}-${options.slug}-light.png`;
    const darkFilename = `${stepPrefix}-${options.slug}-dark.png`;

    const lightPath = path.join(journeyDir, lightFilename);
    const darkPath = path.join(journeyDir, darkFilename);

    const fullPage = options.fullPage ?? false;

    // 3. Capture Light Mode
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(150);
    await page.screenshot({ path: lightPath, fullPage });
    await testInfo.attach(`${options.stepNumber}. ${options.title} [Light]`, {
      path: lightPath,
      contentType: "image/png",
    });

    // 4. Capture Dark Mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(150);
    await page.screenshot({ path: darkPath, fullPage });
    await testInfo.attach(`${options.stepNumber}. ${options.title} [Dark]`, {
      path: darkPath,
      contentType: "image/png",
    });

    // 5. Restore default light scheme for subsequent test actions
    await page.emulateMedia({ colorScheme: "light" });

    // 6. Record metadata for gallery generator
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
    const isMobile = viewport.width < 768;

    const record: StepRecord = {
      journeyId: options.journeyId,
      journeyTitle: options.journeyTitle,
      stepNumber: options.stepNumber,
      slug: options.slug,
      title: options.title,
      description: options.description,
      lightImage: `${options.journeyId}/${lightFilename}`,
      darkImage: `${options.journeyId}/${darkFilename}`,
      viewport,
      isMobile,
      browser: testInfo.project.name,
      timestamp: new Date().toISOString(),
    };

    const recordFilename =
      `${options.journeyId}-step-${stepPrefix}-${testInfo.project.name}.json`;
    await fs.writeFile(
      path.join(RECORDS_DIR, recordFilename),
      JSON.stringify(record, null, 2),
      "utf-8",
    );
  });
}
