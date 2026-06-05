# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/icm.spec.ts >> ICM Calculator Page >> 7. About ICM section is visible with information
- Location: apps/web/e2e/icm.spec.ts:202:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/icm", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * ICM Calculator E2E Tests
  5   |  * 
  6   |  * Tests cover:
  7   |  * 1. Page loads without errors at /icm
  8   |  * 2. PrizePoolPanel - prize distribution editing
  9   |  * 3. ChipStackPanel - player stack management
  10  |  * 4. ICMResults - equity calculations display
  11  |  * 5. Tournament buy-in and total chips inputs
  12  |  * 6. Navigation between pages
  13  |  */
  14  | 
  15  | const ICM_URL = "/icm";
  16  | 
  17  | export class ICMPage {
  18  |   readonly page: Page;
  19  | 
  20  |   constructor(page: Page) {
  21  |     this.page = page;
  22  |   }
  23  | 
  24  |   async goto() {
> 25  |     await this.page.goto(ICM_URL);
      |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  26  |   }
  27  | 
  28  |   // Prize Pool Panel
  29  |   getPrizePoolSection() {
  30  |     return this.page.locator("h2:has-text('Prize Pool')").locator("..");
  31  |   }
  32  | 
  33  |   // Chip Stack Panel
  34  |   getChipStackSection() {
  35  |     return this.page.locator("h2:has-text('Chip Stacks')").locator("..");
  36  |   }
  37  | 
  38  |   // ICM Results
  39  |   getICMResultsSection() {
  40  |     return this.page.locator("h2:has-text('ICM Results')").first().locator("..");
  41  |   }
  42  | 
  43  |   // Tournament buy-in input
  44  |   getBuyInInput() {
  45  |     return this.page.locator("input[type='number']").first();
  46  |   }
  47  | 
  48  |   // Total chips input
  49  |   getTotalChipsInput() {
  50  |     return this.page.locator("input[type='number']").nth(1);
  51  |   }
  52  | 
  53  |   // Player name inputs
  54  |   getPlayerNameInputs() {
  55  |     return this.page.locator("input[type='text']");
  56  |   }
  57  | 
  58  |   // Player chip inputs
  59  |   getPlayerChipInputs() {
  60  |     return this.page.locator("input[type='number']");
  61  |   }
  62  | 
  63  |   // About ICM section
  64  |   getAboutSection() {
  65  |     return this.page.locator("h2:has-text('About ICM')");
  66  |   }
  67  | }
  68  | 
  69  | test.describe("ICM Calculator Page", () => {
  70  |   let icmPage: ICMPage;
  71  | 
  72  |   test.beforeEach(async ({ page }) => {
  73  |     icmPage = new ICMPage(page);
  74  |   });
  75  | 
  76  |   test("1. Page loads without errors at /icm", async ({ page }) => {
  77  |     const consoleErrors: string[] = [];
  78  |     page.on("console", (msg) => {
  79  |       if (msg.type() === "error") {
  80  |         consoleErrors.push(msg.text());
  81  |       }
  82  |     });
  83  | 
  84  |     await icmPage.goto();
  85  |     await page.waitForLoadState("networkidle");
  86  | 
  87  |     // Check title
  88  |     await expect(page).toHaveTitle(/GTO|ICM/i);
  89  | 
  90  |     // Verify main heading
  91  |     const heading = page.locator("h1:has-text('ICM Calculator')");
  92  |     await expect(heading).toBeVisible();
  93  | 
  94  |     // Verify no critical console errors
  95  |     const criticalErrors = consoleErrors.filter(
  96  |       (e) => !e.includes("favicon") && !e.includes("404")
  97  |     );
  98  |     expect(criticalErrors).toHaveLength(0);
  99  |   });
  100 | 
  101 |   test("2. PrizePoolPanel displays and allows editing", async ({ page }) => {
  102 |     await icmPage.goto();
  103 | 
  104 |     const prizeSection = icmPage.getPrizePoolSection();
  105 |     await expect(prizeSection).toBeVisible();
  106 | 
  107 |     // Verify default prize percentages (50, 30, 20)
  108 |     const percentageTexts = prizeSection.locator("text=/\\d+%/");
  109 |     const count = await percentageTexts.count();
  110 |     expect(count).toBeGreaterThan(0);
  111 | 
  112 |     // Look for editable prize fields
  113 |     const prizeInputs = prizeSection.locator("input[type='number']");
  114 |     const inputCount = await prizeInputs.count();
  115 |     
  116 |     if (inputCount > 0) {
  117 |       // Modify first prize percentage
  118 |       const firstInput = prizeInputs.first();
  119 |       await firstInput.fill("60");
  120 |       await expect(firstInput).toHaveValue("60");
  121 |     }
  122 |   });
  123 | 
  124 |   test("3. ChipStackPanel displays player stacks", async ({ page }) => {
  125 |     await icmPage.goto();
```