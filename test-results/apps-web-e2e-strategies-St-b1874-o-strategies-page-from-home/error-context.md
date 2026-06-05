# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/strategies.spec.ts >> Strategies Page Navigation >> can navigate to strategies page from home
- Location: apps/web/e2e/strategies.spec.ts:179:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
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
  127 |   test("4. Stack depth filter works", async ({ page }) => {
  128 |     await strategiesPage.goto();
  129 | 
  130 |     const stackFilter = strategiesPage.getStackFilter();
  131 |     
  132 |     if (await stackFilter.count() > 0) {
  133 |       await expect(stackFilter).toBeVisible();
  134 | 
  135 |       // Select a stack depth
  136 |       const options = await stackFilter.locator("option").all();
  137 |       if (options.length > 1) {
  138 |         await stackFilter.selectOption({ index: 1 });
  139 |         await page.waitForTimeout(300);
  140 |       }
  141 |     }
  142 |   });
  143 | 
  144 |   test("5. Chart type toggle exists", async ({ page }) => {
  145 |     await strategiesPage.goto();
  146 | 
  147 |     const toggle = strategiesPage.getChartTypeToggle();
  148 |     
  149 |     // Should have push or call buttons
  150 |     const hasToggle = await toggle.count() > 0;
  151 |     expect(hasToggle).toBe(true);
  152 |   });
  153 | 
  154 |   test("6. Export button exists", async ({ page }) => {
  155 |     await strategiesPage.goto();
  156 | 
  157 |     const exportButton = strategiesPage.getExportButton();
  158 |     
  159 |     // Export button should be visible if chart is loaded
  160 |     const hasExport = await exportButton.count() > 0;
  161 |     if (hasExport) {
  162 |       await expect(exportButton).toBeVisible();
  163 |     }
  164 |   });
  165 | 
  166 |   test("7. Legend displays hand types", async ({ page }) => {
  167 |     await strategiesPage.goto();
  168 | 
  169 |     // Look for legend information
  170 |     const legendItems = page.locator("text=/Push|Call|Fold|All-in/").first();
  171 |     const hasLegend = await legendItems.count() > 0;
  172 |     
  173 |     // Legend may or may not be present depending on chart state
  174 |     expect(hasLegend || true).toBe(true);
  175 |   });
  176 | });
  177 | 
  178 | test.describe("Strategies Page Navigation", () => {
  179 |   test("can navigate to strategies page from home", async ({ page }) => {
> 180 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  181 | 
  182 |     // Find strategies link
  183 |     const strategiesLink = page.locator("a[href='/strategies']").first();
  184 |     if (await strategiesLink.count() > 0) {
  185 |       await strategiesLink.click();
  186 |       await expect(page).toHaveURL(/\/strategies/);
  187 |     } else {
  188 |       await page.goto("/strategies");
  189 |       await expect(page.locator("body")).toBeVisible();
  190 |     }
  191 |   });
  192 | 
  193 |   test("can navigate from strategies to other pages", async ({ page }) => {
  194 |     await page.goto("/strategies");
  195 | 
  196 |     // Navigate to ICM
  197 |     await page.goto("/icm");
  198 |     await expect(page.locator("body")).toBeVisible();
  199 | 
  200 |     // Navigate to Courses
  201 |     await page.goto("/courses");
  202 |     await expect(page.locator("body")).toBeVisible();
  203 | 
  204 |     // Navigate to Spots
  205 |     await page.goto("/spots");
  206 |     await expect(page.locator("body")).toBeVisible();
  207 |   });
  208 | });
  209 | 
```