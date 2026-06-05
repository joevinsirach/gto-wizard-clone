# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/spots.spec.ts >> Community Spots Page >> 2. Spots list displays community spots
- Location: apps/web/e2e/spots.spec.ts:110:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/spots", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Community Spots E2E Tests
  5   |  * 
  6   |  * Tests cover:
  7   |  * 1. Page loads without errors at /spots
  8   |  * 2. Spots list displays community strategy spots
  9   |  * 3. Spot filtering by position and board type
  10  |  * 4. Search functionality
  11  |  * 5. Sorting by recent and popular
  12  |  * 6. Spot selection and detail view
  13  |  * 7. Like/unlike functionality
  14  |  * 8. Share new spot button
  15  |  * 9. Strategy heatmap display
  16  |  * 10. Navigation between pages
  17  |  */
  18  | 
  19  | const SPOTS_URL = "/spots";
  20  | 
  21  | export class SpotsPage {
  22  |   readonly page: Page;
  23  | 
  24  |   constructor(page: Page) {
  25  |     this.page = page;
  26  |   }
  27  | 
  28  |   async goto() {
> 29  |     await this.page.goto(SPOTS_URL);
      |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  30  |   }
  31  | 
  32  |   // Spots list
  33  |   getSpotsList() {
  34  |     return this.page.locator("h2:has-text('Shared Strategy Spots')").locator("..");
  35  |   }
  36  | 
  37  |   // Individual spot cards
  38  |   getSpotCards() {
  39  |     return this.page.locator("button:has-text('BTN'), button:has-text('SB'), button:has-text('BB'), button:has-text('CO')").first().locator("..").locator("..");
  40  |   }
  41  | 
  42  |   // Position filter dropdown
  43  |   getPositionFilter() {
  44  |     return this.page.locator("select").first();
  45  |   }
  46  | 
  47  |   // Board type filter dropdown
  48  |   getBoardTypeFilter() {
  49  |     return this.page.locator("select").nth(1);
  50  |   }
  51  | 
  52  |   // Search input
  53  |   getSearchInput() {
  54  |     return this.page.locator("input[placeholder*='Search']");
  55  |   }
  56  | 
  57  |   // Sort dropdown
  58  |   getSortDropdown() {
  59  |     return this.page.locator("select").last();
  60  |   }
  61  | 
  62  |   // Share new spot button
  63  |   getShareButton() {
  64  |     return this.page.locator("button:has-text('Share New Spot')");
  65  |   }
  66  | 
  67  |   // Stats section
  68  |   getStatsSection() {
  69  |     return this.page.locator("text=Total Spots").locator("..");
  70  |   }
  71  | 
  72  |   // Spot detail section
  73  |   getSpotDetail() {
  74  |     return this.page.locator("h3:has-text('BTN vs BB Dry Flop Spot')").locator("..").locator("..");
  75  |   }
  76  | }
  77  | 
  78  | test.describe("Community Spots Page", () => {
  79  |   let spotsPage: SpotsPage;
  80  | 
  81  |   test.beforeEach(async ({ page }) => {
  82  |     spotsPage = new SpotsPage(page);
  83  |   });
  84  | 
  85  |   test("1. Page loads without errors at /spots", async ({ page }) => {
  86  |     const consoleErrors: string[] = [];
  87  |     page.on("console", (msg) => {
  88  |       if (msg.type() === "error") {
  89  |         consoleErrors.push(msg.text());
  90  |       }
  91  |     });
  92  | 
  93  |     await spotsPage.goto();
  94  |     await page.waitForLoadState("networkidle");
  95  | 
  96  |     // Check title
  97  |     await expect(page).toHaveTitle(/GTO|Spots/i);
  98  | 
  99  |     // Verify main heading
  100 |     const heading = page.locator("h1:has-text('Community Spots')");
  101 |     await expect(heading).toBeVisible();
  102 | 
  103 |     // Verify no critical console errors
  104 |     const criticalErrors = consoleErrors.filter(
  105 |       (e) => !e.includes("favicon") && !e.includes("404")
  106 |     );
  107 |     expect(criticalErrors).toHaveLength(0);
  108 |   });
  109 | 
  110 |   test("2. Spots list displays community spots", async ({ page }) => {
  111 |     await spotsPage.goto();
  112 | 
  113 |     const spotsList = spotsPage.getSpotsList();
  114 |     await expect(spotsList).toBeVisible();
  115 | 
  116 |     // Check for spot cards with position badges
  117 |     const positionBadges = page.locator("span:has-text('BTN'), span:has-text('SB'), span:has-text('BB'), span:has-text('CO')");
  118 |     const badgeCount = await positionBadges.count();
  119 |     expect(badgeCount).toBeGreaterThan(0);
  120 |   });
  121 | 
  122 |   test("3. Position filter works correctly", async ({ page }) => {
  123 |     await spotsPage.goto();
  124 | 
  125 |     const positionFilter = spotsPage.getPositionFilter();
  126 |     await expect(positionFilter).toBeVisible();
  127 | 
  128 |     // Select a specific position
  129 |     await positionFilter.selectOption("BTN");
```