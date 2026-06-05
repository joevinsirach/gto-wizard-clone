# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/equity.spec.ts >> Equity Page Navigation >> can navigate to equity page from home
- Location: apps/web/e2e/equity.spec.ts:255:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  156 | 
  157 |     // Verify it got selected (should have green or blue background)
  158 |     const initialSelected = await heroSection.locator(".bg-green-600, .bg-blue-600").count();
  159 |     expect(initialSelected).toBeGreaterThanOrEqual(1);
  160 | 
  161 |     // Shift+click another cell several rows down (to create a range)
  162 |     const targetCell = cells.nth(20);
  163 |     await targetCell.click({ modifiers: ["Shift"] });
  164 | 
  165 |     // After Shift+click, more cells should be selected (range selection)
  166 |     const afterRangeSelected = await heroSection.locator(".bg-green-600, .bg-blue-600").count();
  167 |     expect(afterRangeSelected).toBeGreaterThan(initialSelected);
  168 |   });
  169 | 
  170 |   test("5. Board cards section displays correctly", async ({ page }) => {
  171 |     await equityPage.goto();
  172 | 
  173 |     const boardSection = equityPage.getBoardSection();
  174 |     await expect(boardSection).toBeVisible();
  175 | 
  176 |     // Check for section heading
  177 |     await expect(boardSection.locator("h2:has-text('Board Cards')")).toBeVisible();
  178 | 
  179 |     // Check for placeholder content
  180 |     await expect(boardSection.locator("text=Board Display")).toBeVisible();
  181 |     await expect(boardSection.locator("text=EquityChart Component")).toBeVisible();
  182 |   });
  183 | 
  184 |   test("6. Results section displays correctly", async ({ page }) => {
  185 |     await equityPage.goto();
  186 | 
  187 |     const resultsSection = equityPage.getResultsSection();
  188 |     await expect(resultsSection).toBeVisible();
  189 | 
  190 |     // Check for section heading
  191 |     await expect(resultsSection.locator("h2:has-text('Results')")).toBeVisible();
  192 | 
  193 |     // Check for placeholder content
  194 |     await expect(resultsSection.locator("text=Equity Results Table")).toBeVisible();
  195 |   });
  196 | 
  197 |   test("7. Hero and villain ranges are independent", async ({ page }) => {
  198 |     await equityPage.goto();
  199 | 
  200 |     const heroSection = equityPage.getHeroRangeSection();
  201 |     const villainSection = equityPage.getVillainRangeSection();
  202 | 
  203 |     // Click a cell in hero range
  204 |     const heroCells = equityPage.getRangeSelectorCells(heroSection);
  205 |     const firstHeroCell = heroCells.first();
  206 |     await firstHeroCell.click();
  207 | 
  208 |     // Verify hero cell is now selected
  209 |     const heroCellBg = await firstHeroCell.evaluate((el: HTMLElement) =>
  210 |       window.getComputedStyle(el).backgroundColor
  211 |     );
  212 |     expect(heroCellBg).toMatch(/rgb\(34/); // green-600 or blue-600
  213 | 
  214 |     // Verify villain cell at same position is NOT selected
  215 |     const villainCells = equityPage.getRangeSelectorCells(villainSection);
  216 |     const firstVillainCell = villainCells.first();
  217 |     const villainCellBg = await firstVillainCell.evaluate((el: HTMLElement) =>
  218 |       window.getComputedStyle(el).backgroundColor
  219 |     );
  220 |     expect(villainCellBg).toMatch(/rgb\(55/); // gray-700 (unselected)
  221 |   });
  222 | 
  223 |   test("8. Legend displays all three hand types", async ({ page }) => {
  224 |     await equityPage.goto();
  225 | 
  226 |     const heroSection = equityPage.getHeroRangeSection();
  227 | 
  228 |     // Check for legend items indicating cell types
  229 |     await expect(heroSection.locator("text=Pocket Pairs")).toBeVisible();
  230 |     await expect(heroSection.locator("text=Suited")).toBeVisible();
  231 |     await expect(heroSection.locator("text=Unselected")).toBeVisible();
  232 | 
  233 |     // Check legend colors are displayed
  234 |     await expect(heroSection.locator(".bg-green-600").first()).toBeVisible();
  235 |     await expect(heroSection.locator(".bg-blue-600").first()).toBeVisible();
  236 |     await expect(heroSection.locator(".bg-gray-700").first()).toBeVisible();
  237 |   });
  238 | 
  239 |   test("9. Grid column and row headers display ranks", async ({ page }) => {
  240 |     await equityPage.goto();
  241 | 
  242 |     const heroSection = equityPage.getHeroRangeSection();
  243 |     const grid = heroSection.locator(".inline-grid");
  244 | 
  245 |     // Check for rank headers (A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2)
  246 |     const expectedRanks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  247 | 
  248 |     for (const rank of expectedRanks) {
  249 |       await expect(grid.locator(`text=${rank}`).first()).toBeVisible();
  250 |     }
  251 |   });
  252 | });
  253 | 
  254 | test.describe("Equity Page Navigation", () => {
  255 |   test("can navigate to equity page from home", async ({ page }) => {
> 256 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  257 | 
  258 |     // Find and click equity link in navigation
  259 |     const equityLink = page.locator("a[href='/equity']").first();
  260 |     if (await equityLink.count() > 0) {
  261 |       await equityLink.click();
  262 |       await expect(page).toHaveURL(/\/equity/);
  263 |       await expect(page.locator("h1:has-text('Equity Calculator')")).toBeVisible();
  264 |     } else {
  265 |       // Navigate directly if link not found
  266 |       await page.goto("/equity");
  267 |       await expect(page.locator("h1:has-text('Equity Calculator')")).toBeVisible();
  268 |     }
  269 |   });
  270 | 
  271 |   test("equity page has correct title", async ({ page }) => {
  272 |     await page.goto("/equity");
  273 |     await expect(page).toHaveTitle(/.*GTO.*|.*Equity.*|.*Poker.*/i);
  274 |   });
  275 | });
  276 | 
  277 | test.describe("Equity Calculator API Integration (future)", () => {
  278 |   /**
  279 |    * These tests document expected behavior when the equity calculation
  280 |    * API is integrated with the frontend. They are skipped for now
  281 |    * since the UI is a placeholder.
  282 |    */
  283 | 
  284 |   test.skip("5. Equity calculation runs via API call to /api/v1/equity/calculate", async ({ page }) => {
  285 |     await page.goto("/equity");
  286 | 
  287 |     // This test will be implemented when:
  288 |     // 1. Board card input is added to the page
  289 |     // 2. Calculate button triggers API call
  290 |     // 3. Results are displayed from API response
  291 |   });
  292 | 
  293 |   test.skip("6. Board cards can be entered via input field", async ({ page }) => {
  294 |     await page.goto("/equity");
  295 | 
  296 |     // This test will be implemented when board input is added
  297 |     // Expected: input field accepts card notation like "Kd7h2c"
  298 |   });
  299 | 
  300 |   test.skip("7. Results display after calculation with equity percentages", async ({ page }) => {
  301 |     await page.goto("/equity");
  302 | 
  303 |     // This test will be implemented when:
  304 |     // 1. Selecting hero and villain ranges
  305 |     // 2. Entering board cards
  306 |     // 3. Clicking Calculate button
  307 |     // 4. Results section shows equity percentages
  308 |   });
  309 | });
```