# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/equity.spec.ts >> Equity Calculator Page >> 6. Results section displays correctly
- Location: apps/web/e2e/equity.spec.ts:184:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/equity", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Equity Calculator E2E Tests
  5   |  *
  6   |  * Tests cover:
  7   |  * 1. Page loads without console errors at /equity
  8   |  * 2. RangeSelector grid renders correctly (13x13 matrix of hand cells)
  9   |  * 3. Clicking a cell toggles selection (visual state change)
  10  |  * 4. Shift+click performs range selection (rectangular selection)
  11  |  * 5. Board cards section displays (placeholder for board input)
  12  |  * 6. Results section displays (placeholder for equity results)
  13  |  * 7. Hero and villain ranges are independent
  14  |  * 8. Navigation from home page works
  15  |  */
  16  | 
  17  | const EQUITY_URL = "/equity";
  18  | 
  19  | /**
  20  |  * Page Object for Equity Calculator
  21  |  */
  22  | export class EquityPage {
  23  |   readonly page: Page;
  24  | 
  25  |   constructor(page: Page) {
  26  |     this.page = page;
  27  |   }
  28  | 
  29  |   async goto() {
> 30  |     await this.page.goto(EQUITY_URL);
      |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  31  |   }
  32  | 
  33  |   // Hero range section
  34  |   getHeroRangeSection() {
  35  |     return this.page.locator("h2:has-text('Hero Range')").locator("..");
  36  |   }
  37  | 
  38  |   // Villain range section
  39  |   getVillainRangeSection() {
  40  |     return this.page.locator("h2:has-text('Villain Range')").locator("..");
  41  |   }
  42  | 
  43  |   // Board cards section
  44  |   getBoardSection() {
  45  |     return this.page.locator("h2:has-text('Board Cards')").locator("..");
  46  |   }
  47  | 
  48  |   // Results section
  49  |   getResultsSection() {
  50  |     return this.page.locator("h2:has-text('Results')").locator("..");
  51  |   }
  52  | 
  53  |   // Get RangeSelector grid cells within a section
  54  |   // The grid contains 169 cells (13x13 for all poker hands)
  55  |   getRangeSelectorCells(section: ReturnType<EquityPage["getHeroRangeSection"]>) {
  56  |     return section.locator(".inline-grid .contents > div.w-8.h-8.cursor-pointer");
  57  |   }
  58  | }
  59  | 
  60  | test.describe("Equity Calculator Page", () => {
  61  |   let equityPage: EquityPage;
  62  | 
  63  |   test.beforeEach(async ({ page }) => {
  64  |     equityPage = new EquityPage(page);
  65  |   });
  66  | 
  67  |   test("1. Page loads without errors at /equity", async ({ page }) => {
  68  |     const consoleErrors: string[] = [];
  69  |     page.on("console", (msg) => {
  70  |       if (msg.type() === "error") {
  71  |         consoleErrors.push(msg.text());
  72  |       }
  73  |     });
  74  | 
  75  |     await equityPage.goto();
  76  | 
  77  |     // Wait for page to be fully loaded
  78  |     await page.waitForLoadState("networkidle");
  79  | 
  80  |     // Check that the page has loaded with correct heading
  81  |     const heading = page.locator("h1:has-text('Equity Calculator')");
  82  |     await expect(heading).toBeVisible();
  83  | 
  84  |     // Verify no console errors (filter out known non-critical errors)
  85  |     const criticalErrors = consoleErrors.filter(
  86  |       (e) => !e.includes("favicon") && !e.includes("404")
  87  |     );
  88  |     expect(criticalErrors).toHaveLength(0);
  89  |   });
  90  | 
  91  |   test("2. RangeSelector grid renders correctly (13x13 matrix)", async ({ page }) => {
  92  |     await equityPage.goto();
  93  | 
  94  |     const heroSection = equityPage.getHeroRangeSection();
  95  |     await expect(heroSection).toBeVisible();
  96  | 
  97  |     // Check that the RangeSelector grid is rendered
  98  |     const inlineGrid = heroSection.locator(".inline-grid");
  99  |     await expect(inlineGrid).toBeVisible();
  100 | 
  101 |     // The grid should have 169 clickable cells (13x13)
  102 |     const cells = equityPage.getRangeSelectorCells(heroSection);
  103 |     const cellCount = await cells.count();
  104 |     expect(cellCount).toBe(169);
  105 | 
  106 |     // Verify villain range also has a grid with 169 cells
  107 |     const villainSection = equityPage.getVillainRangeSection();
  108 |     const villainCells = equityPage.getRangeSelectorCells(villainSection);
  109 |     expect(await villainCells.count()).toBe(169);
  110 |   });
  111 | 
  112 |   test("3. Clicking a cell toggles selection state", async ({ page }) => {
  113 |     await equityPage.goto();
  114 | 
  115 |     const heroSection = equityPage.getHeroRangeSection();
  116 | 
  117 |     // Find cells in the grid
  118 |     const cells = equityPage.getRangeSelectorCells(heroSection);
  119 |     const firstCell = cells.first();
  120 | 
  121 |     // Get initial background color
  122 |     const initialBg = await firstCell.evaluate((el: HTMLElement) =>
  123 |       window.getComputedStyle(el).backgroundColor
  124 |     );
  125 | 
  126 |     // Click the cell to select it
  127 |     await firstCell.click();
  128 | 
  129 |     // Get new background color - should be different (selected state)
  130 |     const newBg = await firstCell.evaluate((el: HTMLElement) =>
```