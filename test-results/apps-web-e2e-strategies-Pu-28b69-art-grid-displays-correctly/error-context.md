# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/strategies.spec.ts >> Push/Fold Charts Page >> 2. Chart grid displays correctly
- Location: apps/web/e2e/strategies.spec.ts:94:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/strategies", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Push/Fold Charts E2E Tests
  5   |  * 
  6   |  * Tests cover:
  7   |  * 1. Page loads without errors at /strategies
  8   |  * 2. Chart displays with grid structure
  9   |  * 3. Position filter works
  10  |  * 4. Stack depth filter works
  11  |  * 5. Chart type toggle (push vs call)
  12  |  * 6. Export button exists
  13  |  * 7. Navigation between pages
  14  |  */
  15  | 
  16  | const STRATEGIES_URL = "/strategies";
  17  | 
  18  | export class StrategiesPage {
  19  |   readonly page: Page;
  20  | 
  21  |   constructor(page: Page) {
  22  |     this.page = page;
  23  |   }
  24  | 
  25  |   async goto() {
> 26  |     await this.page.goto(STRATEGIES_URL);
      |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  27  |   }
  28  | 
  29  |   // Position filter
  30  |   getPositionFilter() {
  31  |     return this.page.locator("select").first();
  32  |   }
  33  | 
  34  |   // Stack depth filter
  35  |   getStackFilter() {
  36  |     return this.page.locator("select").nth(1);
  37  |   }
  38  | 
  39  |   // Chart type toggle
  40  |   getChartTypeToggle() {
  41  |     return this.page.locator("button:has-text('Push'), button:has-text('Call')").first();
  42  |   }
  43  | 
  44  |   // Chart grid
  45  |   getChartGrid() {
  46  |     return this.page.locator(".inline-grid, table, [class*='grid']").first();
  47  |   }
  48  | 
  49  |   // Export button
  50  |   getExportButton() {
  51  |     return this.page.locator("button:has-text('Export'), button:has-text('Download')").first();
  52  |   }
  53  | 
  54  |   // Chart section heading
  55  |   getChartSection() {
  56  |     return this.page.locator("h2:has-text('Push'), h2:has-text('Charts'), h2:has-text('Strategy')").first().locator("..");
  57  |   }
  58  | }
  59  | 
  60  | test.describe("Push/Fold Charts Page", () => {
  61  |   let strategiesPage: StrategiesPage;
  62  | 
  63  |   test.beforeEach(async ({ page }) => {
  64  |     strategiesPage = new StrategiesPage(page);
  65  |   });
  66  | 
  67  |   test("1. Page loads without errors at /strategies", async ({ page }) => {
  68  |     const consoleErrors: string[] = [];
  69  |     page.on("console", (msg) => {
  70  |       if (msg.type() === "error") {
  71  |         consoleErrors.push(msg.text());
  72  |       }
  73  |     });
  74  | 
  75  |     await strategiesPage.goto();
  76  |     await page.waitForLoadState("networkidle");
  77  | 
  78  |     // Check title
  79  |     await expect(page).toHaveTitle(/GTO|Strategy|Push|Fold/i);
  80  | 
  81  |     // Verify main heading or content loaded
  82  |     const heading = page.locator("h1:has-text('Push'), h1:has-text('Strategy'), h1:has-text('Charts')").first();
  83  |     if (await heading.count() > 0) {
  84  |       await expect(heading).toBeVisible();
  85  |     }
  86  | 
  87  |     // Verify no critical console errors
  88  |     const criticalErrors = consoleErrors.filter(
  89  |       (e) => !e.includes("favicon") && !e.includes("404")
  90  |     );
  91  |     expect(criticalErrors).toHaveLength(0);
  92  |   });
  93  | 
  94  |   test("2. Chart grid displays correctly", async ({ page }) => {
  95  |     await strategiesPage.goto();
  96  | 
  97  |     // Wait for chart to render
  98  |     await page.waitForTimeout(500);
  99  | 
  100 |     // Check for chart grid, table, or visual chart elements
  101 |     const chartGrid = strategiesPage.getChartGrid();
  102 |     
  103 |     // Chart should exist or be in loading state
  104 |     const hasChart = (await chartGrid.count() > 0) || 
  105 |                      (await page.locator("text=Loading").count() > 0) ||
  106 |                      (await page.locator("text=No chart").count() > 0);
  107 |     expect(hasChart).toBe(true);
  108 |   });
  109 | 
  110 |   test("3. Position filter works", async ({ page }) => {
  111 |     await strategiesPage.goto();
  112 | 
  113 |     const positionFilter = strategiesPage.getPositionFilter();
  114 |     
  115 |     if (await positionFilter.count() > 0) {
  116 |       await expect(positionFilter).toBeVisible();
  117 | 
  118 |       // Select a position
  119 |       const options = await positionFilter.locator("option").all();
  120 |       if (options.length > 1) {
  121 |         await positionFilter.selectOption({ index: 1 });
  122 |         await page.waitForTimeout(300);
  123 |       }
  124 |     }
  125 |   });
  126 | 
```