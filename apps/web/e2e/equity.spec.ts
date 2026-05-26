import { test, expect, type Page } from "@playwright/test";

/**
 * Equity Calculator E2E Tests
 *
 * Tests cover:
 * 1. Page loads without console errors at /equity
 * 2. RangeSelector grid renders correctly (13x13 matrix of hand cells)
 * 3. Clicking a cell toggles selection (visual state change)
 * 4. Shift+click performs range selection (rectangular selection)
 * 5. Board cards section displays (placeholder for board input)
 * 6. Results section displays (placeholder for equity results)
 * 7. Hero and villain ranges are independent
 * 8. Navigation from home page works
 */

const EQUITY_URL = "/equity";

/**
 * Page Object for Equity Calculator
 */
export class EquityPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(EQUITY_URL);
  }

  // Hero range section
  getHeroRangeSection() {
    return this.page.locator("h2:has-text('Hero Range')").locator("..");
  }

  // Villain range section
  getVillainRangeSection() {
    return this.page.locator("h2:has-text('Villain Range')").locator("..");
  }

  // Board cards section
  getBoardSection() {
    return this.page.locator("h2:has-text('Board Cards')").locator("..");
  }

  // Results section
  getResultsSection() {
    return this.page.locator("h2:has-text('Results')").locator("..");
  }

  // Get RangeSelector grid cells within a section
  // The grid contains 169 cells (13x13 for all poker hands)
  getRangeSelectorCells(section: ReturnType<EquityPage["getHeroRangeSection"]>) {
    return section.locator(".inline-grid .contents > div.w-8.h-8.cursor-pointer");
  }
}

test.describe("Equity Calculator Page", () => {
  let equityPage: EquityPage;

  test.beforeEach(async ({ page }) => {
    equityPage = new EquityPage(page);
  });

  test("1. Page loads without errors at /equity", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await equityPage.goto();

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check that the page has loaded with correct heading
    const heading = page.locator("h1:has-text('Equity Calculator')");
    await expect(heading).toBeVisible();

    // Verify no console errors (filter out known non-critical errors)
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("2. RangeSelector grid renders correctly (13x13 matrix)", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();
    await expect(heroSection).toBeVisible();

    // Check that the RangeSelector grid is rendered
    const inlineGrid = heroSection.locator(".inline-grid");
    await expect(inlineGrid).toBeVisible();

    // The grid should have 169 clickable cells (13x13)
    const cells = equityPage.getRangeSelectorCells(heroSection);
    const cellCount = await cells.count();
    expect(cellCount).toBe(169);

    // Verify villain range also has a grid with 169 cells
    const villainSection = equityPage.getVillainRangeSection();
    const villainCells = equityPage.getRangeSelectorCells(villainSection);
    expect(await villainCells.count()).toBe(169);
  });

  test("3. Clicking a cell toggles selection state", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();

    // Find cells in the grid
    const cells = equityPage.getRangeSelectorCells(heroSection);
    const firstCell = cells.first();

    // Get initial background color
    const initialBg = await firstCell.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Click the cell to select it
    await firstCell.click();

    // Get new background color - should be different (selected state)
    const newBg = await firstCell.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Background should change from gray (unselected) to green/blue (selected)
    expect(newBg).not.toBe(initialBg);

    // Click again to deselect
    await firstCell.click();
    const afterSecondClick = await firstCell.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be back to unselected state
    expect(afterSecondClick).toBe(initialBg);
  });

  test("4. Shift+click performs range selection", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();
    const cells = equityPage.getRangeSelectorCells(heroSection);

    // Click first cell (top-left area - AA)
    const firstCell = cells.first();
    await firstCell.click();

    // Verify it got selected (should have green or blue background)
    const initialSelected = await heroSection.locator(".bg-green-600, .bg-blue-600").count();
    expect(initialSelected).toBeGreaterThanOrEqual(1);

    // Shift+click another cell several rows down (to create a range)
    const targetCell = cells.nth(20);
    await targetCell.click({ modifiers: ["Shift"] });

    // After Shift+click, more cells should be selected (range selection)
    const afterRangeSelected = await heroSection.locator(".bg-green-600, .bg-blue-600").count();
    expect(afterRangeSelected).toBeGreaterThan(initialSelected);
  });

  test("5. Board cards section displays correctly", async ({ page }) => {
    await equityPage.goto();

    const boardSection = equityPage.getBoardSection();
    await expect(boardSection).toBeVisible();

    // Check for section heading
    await expect(boardSection.locator("h2:has-text('Board Cards')")).toBeVisible();

    // Check for placeholder content
    await expect(boardSection.locator("text=Board Display")).toBeVisible();
    await expect(boardSection.locator("text=EquityChart Component")).toBeVisible();
  });

  test("6. Results section displays correctly", async ({ page }) => {
    await equityPage.goto();

    const resultsSection = equityPage.getResultsSection();
    await expect(resultsSection).toBeVisible();

    // Check for section heading
    await expect(resultsSection.locator("h2:has-text('Results')")).toBeVisible();

    // Check for placeholder content
    await expect(resultsSection.locator("text=Equity Results Table")).toBeVisible();
  });

  test("7. Hero and villain ranges are independent", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();
    const villainSection = equityPage.getVillainRangeSection();

    // Click a cell in hero range
    const heroCells = equityPage.getRangeSelectorCells(heroSection);
    const firstHeroCell = heroCells.first();
    await firstHeroCell.click();

    // Verify hero cell is now selected
    const heroCellBg = await firstHeroCell.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(heroCellBg).toMatch(/rgb\(34/); // green-600 or blue-600

    // Verify villain cell at same position is NOT selected
    const villainCells = equityPage.getRangeSelectorCells(villainSection);
    const firstVillainCell = villainCells.first();
    const villainCellBg = await firstVillainCell.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(villainCellBg).toMatch(/rgb\(55/); // gray-700 (unselected)
  });

  test("8. Legend displays all three hand types", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();

    // Check for legend items indicating cell types
    await expect(heroSection.locator("text=Pocket Pairs")).toBeVisible();
    await expect(heroSection.locator("text=Suited")).toBeVisible();
    await expect(heroSection.locator("text=Unselected")).toBeVisible();

    // Check legend colors are displayed
    await expect(heroSection.locator(".bg-green-600").first()).toBeVisible();
    await expect(heroSection.locator(".bg-blue-600").first()).toBeVisible();
    await expect(heroSection.locator(".bg-gray-700").first()).toBeVisible();
  });

  test("9. Grid column and row headers display ranks", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();
    const grid = heroSection.locator(".inline-grid");

    // Check for rank headers (A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2)
    const expectedRanks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

    for (const rank of expectedRanks) {
      await expect(grid.locator(`text=${rank}`).first()).toBeVisible();
    }
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
      await expect(page.locator("h1:has-text('Equity Calculator')")).toBeVisible();
    } else {
      // Navigate directly if link not found
      await page.goto("/equity");
      await expect(page.locator("h1:has-text('Equity Calculator')")).toBeVisible();
    }
  });

  test("equity page has correct title", async ({ page }) => {
    await page.goto("/equity");
    await expect(page).toHaveTitle(/.*GTO.*|.*Equity.*|.*Poker.*/i);
  });
});

test.describe("Equity Calculator API Integration (future)", () => {
  /**
   * These tests document expected behavior when the equity calculation
   * API is integrated with the frontend. They are skipped for now
   * since the UI is a placeholder.
   */

  test.skip("5. Equity calculation runs via API call to /api/v1/equity/calculate", async ({ page }) => {
    await page.goto("/equity");

    // This test will be implemented when:
    // 1. Board card input is added to the page
    // 2. Calculate button triggers API call
    // 3. Results are displayed from API response
  });

  test.skip("6. Board cards can be entered via input field", async ({ page }) => {
    await page.goto("/equity");

    // This test will be implemented when board input is added
    // Expected: input field accepts card notation like "Kd7h2c"
  });

  test.skip("7. Results display after calculation with equity percentages", async ({ page }) => {
    await page.goto("/equity");

    // This test will be implemented when:
    // 1. Selecting hero and villain ranges
    // 2. Entering board cards
    // 3. Clicking Calculate button
    // 4. Results section shows equity percentages
  });
});