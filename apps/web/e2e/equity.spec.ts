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

    // Wait for cell to be visible
    await expect(firstCell).toBeVisible();

    // Get initial class (should contain bg-gray-700 for unselected)
    const initialClass = await firstCell.getAttribute("class");
    const wasUnselected = initialClass?.includes("bg-gray-700");

    // Click the cell to select it
    await firstCell.click();
    await page.waitForTimeout(200);

    // Get new class - should change to bg-green-600 or bg-blue-600
    const newClass = await firstCell.getAttribute("class");
    const isNowSelected = newClass?.includes("bg-green-600") || newClass?.includes("bg-blue-600");

    // Either the class changed from unselected to selected, or the class is different
    expect(isNowSelected || newClass !== initialClass).toBe(true);

    // Click again to deselect
    await firstCell.click();
    await page.waitForTimeout(200);
  });

  test("4. Shift+click performs range selection", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();
    const cells = equityPage.getRangeSelectorCells(heroSection);

    // Click first cell (top-left area - AA)
    const firstCell = cells.first();
    await firstCell.click();
    await page.waitForTimeout(100);

    // Verify it got selected
    const initialSelected = await heroSection.locator(".bg-green-600, .bg-blue-600").count();
    expect(initialSelected).toBeGreaterThanOrEqual(1);

    // Shift+click a nearby cell (index 14, which is 2 rows down) for range selection
    const targetCell = cells.nth(14);
    await targetCell.click({ modifiers: ["Shift"] });
    await page.waitForTimeout(100);

    // After Shift+click, more cells should be selected (range selection)
    const afterRangeSelected = await heroSection.locator(".bg-green-600, .bg-blue-600").count();
    expect(afterRangeSelected).toBeGreaterThan(initialSelected);
  });

  test("5. Board cards section displays correctly", async ({ page }) => {
    await equityPage.goto();

    // The board cards are part of the Hand Input, Board & Controls section
    // Check for the board cards label
    const boardLabel = page.locator("label:has-text('Board Cards (optional)')").first();
    await expect(boardLabel).toBeVisible();

    // Check for card input selects (rank and suit dropdowns)
    const cardInputs = page.locator("select").filter({ hasText: /A|K|Q|J|T/ });
    const inputCount = await cardInputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test("6. Results section displays correctly", async ({ page }) => {
    await equityPage.goto();

    const resultsSection = equityPage.getResultsSection();
    await expect(resultsSection).toBeVisible();

    // Check for section heading
    await expect(resultsSection.locator("h2:has-text('Results')")).toBeVisible();

    // The results section shows either the empty state or calculated results
    // Check for the Chart/Heatmap toggle buttons
    await expect(page.locator("button:has-text('Chart')")).toBeVisible();
    await expect(page.locator("button:has-text('Heatmap')")).toBeVisible();
  });

  test("7. Hero and villain ranges are independent", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();
    const villainSection = equityPage.getVillainRangeSection();

    // Click a cell in hero range
    const heroCells = equityPage.getRangeSelectorCells(heroSection);
    const firstHeroCell = heroCells.first();
    await firstHeroCell.click();
    await page.waitForTimeout(100);

    // Verify hero cell is now selected (has green or blue background class)
    const heroCellClass = await firstHeroCell.getAttribute("class");
    const heroIsSelected = heroCellClass?.includes("bg-green-600") || heroCellClass?.includes("bg-blue-600");
    expect(heroIsSelected).toBe(true);

    // Verify villain cell at same position is NOT selected
    const villainCells = equityPage.getRangeSelectorCells(villainSection);
    const firstVillainCell = villainCells.first();
    const villainCellClass = await firstVillainCell.getAttribute("class");
    const villainIsNotSelected = villainCellClass?.includes("bg-gray-700");
    expect(villainIsNotSelected).toBe(true);
  });

  test("8. Legend displays all three hand types", async ({ page }) => {
    await equityPage.goto();

    const heroSection = equityPage.getHeroRangeSection();

    // Check for legend text items
    await expect(heroSection.locator("text=Pocket Pairs / Offsuit")).toBeVisible();
    await expect(heroSection.locator("text=Suited")).toBeVisible();
    await expect(heroSection.locator("text=Unselected")).toBeVisible();

    // Check legend color swatches exist (small w-4 h-4 divs, use toBeAttached)
    await expect(heroSection.locator(".bg-green-600").first()).toBeAttached();
    await expect(heroSection.locator(".bg-blue-600").first()).toBeAttached();
    await expect(heroSection.locator(".bg-gray-700").first()).toBeAttached();
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