# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/icm.spec.ts >> ICM Page Navigation >> can navigate to ICM page from home
- Location: apps/web/e2e/icm.spec.ts:231:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  132 |     const playerCount = await playerNames.count();
  133 |     expect(playerCount).toBeGreaterThanOrEqual(4);
  134 | 
  135 |     // Verify chip amounts are displayed
  136 |     const chipTexts = stackSection.locator("text=/\\d{3,}/");
  137 |     const chipCount = await chipTexts.count();
  138 |     expect(chipCount).toBeGreaterThan(0);
  139 |   });
  140 | 
  141 |   test("4. ICMResults section displays calculations", async ({ page }) => {
  142 |     await icmPage.goto();
  143 | 
  144 |     const resultsSection = icmPage.getICMResultsSection();
  145 |     
  146 |     // Wait for results to potentially render
  147 |     await page.waitForTimeout(500);
  148 | 
  149 |     // Verify results section exists
  150 |     await expect(resultsSection).toBeVisible();
  151 | 
  152 |     // Look for equity values (percentages or currency)
  153 |     const equityElements = resultsSection.locator("text=/\\d+\\.?\\d*%/");
  154 |     const hasEquity = await equityElements.count() > 0;
  155 | 
  156 |     // Also check for dollar values
  157 |     const dollarValues = resultsSection.locator("text=/\\$[\\d,]+/");
  158 |     const hasDollarValues = await dollarValues.count() > 0;
  159 | 
  160 |     // At least one type of result should be visible
  161 |     expect(hasEquity || hasDollarValues || (await resultsSection.textContent()).length > 0).toBe(true);
  162 |   });
  163 | 
  164 |   test("5. Tournament buy-in input is functional", async ({ page }) => {
  165 |     await icmPage.goto();
  166 | 
  167 |     const buyInInput = icmPage.getBuyInInput();
  168 |     
  169 |     // Check default value
  170 |     await expect(buyInInput).toHaveValue("1000");
  171 | 
  172 |     // Change value
  173 |     await buyInInput.fill("5000");
  174 |     await expect(buyInInput).toHaveValue("5000");
  175 | 
  176 |     // Verify page still works after change
  177 |     await page.waitForTimeout(300);
  178 |     await expect(page.locator("h1:has-text('ICM Calculator')")).toBeVisible();
  179 |   });
  180 | 
  181 |   test("6. Player chip amounts can be edited", async ({ page }) => {
  182 |     await icmPage.goto();
  183 | 
  184 |     const stackSection = icmPage.getChipStackSection();
  185 |     
  186 |     // Find chip inputs in the stack section
  187 |     const chipInputs = stackSection.locator("input[type='number']");
  188 |     const chipInputCount = await chipInputs.count();
  189 | 
  190 |     if (chipInputCount > 0) {
  191 |       const firstChipInput = chipInputs.first();
  192 |       const initialValue = await firstChipInput.inputValue();
  193 |       
  194 |       // Modify the value
  195 |       const newValue = String(parseInt(initialValue) + 1000);
  196 |       await firstChipInput.fill(newValue);
  197 |       
  198 |       await expect(firstChipInput).toHaveValue(newValue);
  199 |     }
  200 |   });
  201 | 
  202 |   test("7. About ICM section is visible with information", async ({ page }) => {
  203 |     await icmPage.goto();
  204 | 
  205 |     const aboutSection = icmPage.getAboutSection();
  206 |     await expect(aboutSection).toBeVisible();
  207 | 
  208 |     // Check for ICM explanation content
  209 |     const aboutContent = page.locator("h3:has-text('What is ICM?')");
  210 |     await expect(aboutContent).toBeVisible();
  211 | 
  212 |     // Check for Why use ICM section
  213 |     const whyICM = page.locator("h3:has-text('Why use ICM?')");
  214 |     await expect(whyICM).toBeVisible();
  215 |   });
  216 | 
  217 |   test("8. Quick settings section exists", async ({ page }) => {
  218 |     await icmPage.goto();
  219 | 
  220 |     // Look for tournament buy-in label
  221 |     const buyInLabel = page.locator("text=/Tournament Buy-in/i");
  222 |     await expect(buyInLabel).toBeVisible();
  223 | 
  224 |     // Look for total chips label
  225 |     const totalChipsLabel = page.locator("text=/Total Chips/i");
  226 |     await expect(totalChipsLabel).toBeVisible();
  227 |   });
  228 | });
  229 | 
  230 | test.describe("ICM Page Navigation", () => {
  231 |   test("can navigate to ICM page from home", async ({ page }) => {
> 232 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  233 | 
  234 |     // Find and click ICM link in navigation
  235 |     const icmLink = page.locator("a[href='/icm']").first();
  236 |     if (await icmLink.count() > 0) {
  237 |       await icmLink.click();
  238 |       await expect(page).toHaveURL(/\/icm/);
  239 | 
  240 |       await expect(page.locator("h1:has-text('ICM Calculator')")).toBeVisible();
  241 |     } else {
  242 |       // Navigate directly
  243 |       await page.goto("/icm");
  244 |       await expect(page.locator("h1:has-text('ICM Calculator')")).toBeVisible();
  245 |     }
  246 |   });
  247 | });
  248 | 
```