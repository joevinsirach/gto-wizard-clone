# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/courses.spec.ts >> Courses Page >> 6. Progress bars display correctly
- Location: apps/web/e2e/courses.spec.ts:156:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/courses", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Courses E2E Tests
  5   |  * 
  6   |  * Tests cover:
  7   |  * 1. Page loads without errors at /courses
  8   |  * 2. Course list displays with correct information
  9   |  * 3. Difficulty filter works
  10  |  * 4. Category filter works
  11  |  * 5. Course selection shows detail view
  12  |  * 6. Progress bars display correctly
  13  |  * 7. Continue/Start course buttons
  14  |  * 8. Quick stats section
  15  |  * 9. Navigation between pages
  16  |  */
  17  | 
  18  | const COURSES_URL = "/courses";
  19  | 
  20  | export class CoursesPage {
  21  |   readonly page: Page;
  22  | 
  23  |   constructor(page: Page) {
  24  |     this.page = page;
  25  |   }
  26  | 
  27  |   async goto() {
> 28  |     await this.page.goto(COURSES_URL);
      |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  29  |   }
  30  | 
  31  |   // Course list heading
  32  |   getCourseListHeading() {
  33  |     return this.page.locator("h2:has-text('Available Courses')");
  34  |   }
  35  | 
  36  |   // Difficulty filter
  37  |   getDifficultyFilter() {
  38  |     return this.page.locator("select").first();
  39  |   }
  40  | 
  41  |   // Category filter
  42  |   getCategoryFilter() {
  43  |     return this.page.locator("select").nth(1);
  44  |   }
  45  | 
  46  |   // Course cards
  47  |   getCourseCards() {
  48  |     return this.page.locator("button:has-text('Preflop'), button:has-text('Preflop Fundamentals')");
  49  |   }
  50  | 
  51  |   // Continue Training button
  52  |   getContinueButton() {
  53  |     return this.page.locator("a:has-text('Continue Training'), button:has-text('Continue Training')");
  54  |   }
  55  | 
  56  |   // Stats cards
  57  |   getStatsCards() {
  58  |     return this.page.locator("text=Available Courses").locator("..").locator("..").locator("..");
  59  |   }
  60  | }
  61  | 
  62  | test.describe("Courses Page", () => {
  63  |   let coursesPage: CoursesPage;
  64  | 
  65  |   test.beforeEach(async ({ page }) => {
  66  |     coursesPage = new CoursesPage(page);
  67  |   });
  68  | 
  69  |   test("1. Page loads without errors at /courses", async ({ page }) => {
  70  |     const consoleErrors: string[] = [];
  71  |     page.on("console", (msg) => {
  72  |       if (msg.type() === "error") {
  73  |         consoleErrors.push(msg.text());
  74  |       }
  75  |     });
  76  | 
  77  |     await coursesPage.goto();
  78  |     await page.waitForLoadState("networkidle");
  79  | 
  80  |     // Check title
  81  |     await expect(page).toHaveTitle(/GTO|Courses/i);
  82  | 
  83  |     // Verify main heading
  84  |     const heading = page.locator("h1:has-text('Pre-Built Courses')");
  85  |     await expect(heading).toBeVisible();
  86  | 
  87  |     // Verify no critical console errors
  88  |     const criticalErrors = consoleErrors.filter(
  89  |       (e) => !e.includes("favicon") && !e.includes("404")
  90  |     );
  91  |     expect(criticalErrors).toHaveLength(0);
  92  |   });
  93  | 
  94  |   test("2. Course list displays available courses", async ({ page }) => {
  95  |     await coursesPage.goto();
  96  | 
  97  |     const courseListHeading = coursesPage.getCourseListHeading();
  98  |     await expect(courseListHeading).toBeVisible();
  99  | 
  100 |     // Check for course cards
  101 |     const courseCards = page.locator("h3");
  102 |     const cardCount = await courseCards.count();
  103 |     expect(cardCount).toBeGreaterThan(0);
  104 |   });
  105 | 
  106 |   test("3. Difficulty filter works", async ({ page }) => {
  107 |     await coursesPage.goto();
  108 | 
  109 |     const difficultyFilter = coursesPage.getDifficultyFilter();
  110 |     await expect(difficultyFilter).toBeVisible();
  111 | 
  112 |     // Select intermediate
  113 |     await difficultyFilter.selectOption("intermediate");
  114 |     await page.waitForTimeout(300);
  115 | 
  116 |     // Verify courses are still displayed
  117 |     const heading = coursesPage.getCourseListHeading();
  118 |     await expect(heading).toBeVisible();
  119 |   });
  120 | 
  121 |   test("4. Category filter works", async ({ page }) => {
  122 |     await coursesPage.goto();
  123 | 
  124 |     const categoryFilter = coursesPage.getCategoryFilter();
  125 |     await expect(categoryFilter).toBeVisible();
  126 | 
  127 |     // Select ICM category
  128 |     await categoryFilter.selectOption("icm");
```