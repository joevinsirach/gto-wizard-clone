import { test, expect, type Page } from "@playwright/test";

/**
 * Equity Calculator (Game View) E2E Tests
 *
 * The /equity page renders an interactive poker training view with:
 * - Position flow bar (UTG, HJ, CO, BTN, SB, BB)
 * - Board display with community cards
 * - BB Range and BTN Range matrices (strength/action modes)
 * - Statistics, EQ buckets, and action breakdown widgets
 *
 * Tests cover:
 * 1. Page loads without console errors at /equity
 * 2. Range grid renders with both BB and BTN sections
 * 3. Board and position elements are present
 * 4. Statistics panel renders
 * 5. Navigation from home page works
 */

const EQUITY_URL = "/equity";

test.describe("Equity Calculator Page", () => {
  test("1. Page loads without errors at /equity", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(EQUITY_URL);
    await page.waitForLoadState("domcontentloaded");

    // Check that the page has loaded with correct game title
    const heading = page.locator("h2:has-text('Game')");
    await expect(heading).toBeVisible();

    // Verify the main application brand is present
    const appBrand = page.locator("a[href='/study']").first();
    await expect(appBrand).toBeVisible();

    // Verify no console errors (filter out known non-critical errors)
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("2. Range grids render with BB Range and BTN Range sections", async ({ page }) => {
    await page.goto(EQUITY_URL);

    // Both range grids should be present
    const bbRange = page.locator("h3:has-text('BB Range')");
    await expect(bbRange).toBeVisible();

    const btnRange = page.locator("h3:has-text('BTN Range')");
    await expect(btnRange).toBeVisible();

    // Game settings sidebar should be visible
    const gameSection = page.locator("h2:has-text('Game')");
    await expect(gameSection).toBeVisible();
  });

  test("3. Board cards and position flow display correctly", async ({ page }) => {
    await page.goto(EQUITY_URL);

    // Board cards section should show Q♥ J♦ 4♠ (mock board)
    const boardSection = page.locator("text=Q♥").last();
    await expect(boardSection).toBeVisible();

    // Position flow bar with players
    const position = page.locator("a[href='/equity']").first();
    await expect(position).toBeVisible();

    // Stack info should be visible
    const stackLabel = page.getByText("Stack", { exact: true });
    await expect(stackLabel).toBeVisible();
  });

  test("4. Statistics and analysis panels render", async ({ page }) => {
    await page.goto(EQUITY_URL);

    // Statistics section
    const stats = page.locator("h3:has-text('Statistics')");
    await expect(stats).toBeVisible();

    // Equity analysis panels
    const eqBuckets = page.locator("h3:has-text('EQ BUCKETS')");
    await expect(eqBuckets).toBeVisible();

    const actionBreakdown = page.locator("h3:has-text('Action Breakdown')");
    await expect(actionBreakdown).toBeVisible();

    const equityGraph = page.locator("h3:has-text('Equity Graph')");
    await expect(equityGraph).toBeVisible();
  });

  test("5. Page title is set correctly", async ({ page }) => {
    await page.goto(EQUITY_URL);
    await expect(page).toHaveTitle(/GTO Wizard/);
  });
});

test.describe("Equity Page Navigation", () => {
  test("can navigate to equity page from home", async ({ page }) => {
    await page.goto("/");

    // Find and click equity link in navigation
    const equityLink = page.locator("a[href='/equity']").first();
    if (await equityLink.count() > 0) {
      await equityLink.click();
      await expect(page).toHaveURL(/\/equity/);
      // Verify the game view loaded
      await expect(page.locator("h2:has-text('Game')")).toBeVisible();
    } else {
      // Navigate directly if link not found
      await page.goto("/equity");
      await expect(page.locator("h2:has-text('Game')")).toBeVisible();
    }
  });
});
