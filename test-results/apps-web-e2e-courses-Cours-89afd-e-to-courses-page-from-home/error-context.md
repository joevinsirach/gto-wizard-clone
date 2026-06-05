# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/courses.spec.ts >> Courses Page Navigation >> can navigate to courses page from home
- Location: apps/web/e2e/courses.spec.ts:277:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  178 | 
  179 |       // Look for either Start Course or Continue Course button
  180 |       const startButton = page.locator("button:has-text('Start Course')");
  181 |       const continueButton = page.locator("button:has-text('Continue Course')");
  182 | 
  183 |       const hasButton = (await startButton.count() > 0) || (await continueButton.count() > 0);
  184 |       expect(hasButton).toBe(true);
  185 |     }
  186 |   });
  187 | 
  188 |   test("8. Quick stats section displays", async ({ page }) => {
  189 |     await coursesPage.goto();
  190 | 
  191 |     // Look for Quick Stats section
  192 |     const quickStats = page.locator("h4:has-text('Quick Stats')");
  193 |     await expect(quickStats).toBeVisible();
  194 | 
  195 |     // Check for stat items
  196 |     const coursesStarted = page.locator("text=Courses Started");
  197 |     await expect(coursesStarted).toBeVisible();
  198 | 
  199 |     const lessonsCompleted = page.locator("text=Lessons Completed");
  200 |     await expect(lessonsCompleted).toBeVisible();
  201 | 
  202 |     const timeSpent = page.locator("text=Time Spent");
  203 |     await expect(timeSpent).toBeVisible();
  204 |   });
  205 | 
  206 |   test("9. Stats summary cards show totals", async ({ page }) => {
  207 |     await coursesPage.goto();
  208 | 
  209 |     // Look for Available Courses stat card
  210 |     const availableCourses = page.locator("text=Available Courses").first();
  211 |     await expect(availableCourses).toBeVisible();
  212 | 
  213 |     // Look for Total Lessons stat card
  214 |     const totalLessons = page.locator("text=Total Lessons").first();
  215 |     await expect(totalLessons).toBeVisible();
  216 | 
  217 |     // Look for Total Content stat card
  218 |     const totalContent = page.locator("text=Total Content").first();
  219 |     await expect(totalContent).toBeVisible();
  220 | 
  221 |     // Look for Overall Progress stat card
  222 |     const overallProgress = page.locator("text=Overall Progress").first();
  223 |     await expect(overallProgress).toBeVisible();
  224 |   });
  225 | 
  226 |   test("10. Continue Training button navigates to train page", async ({ page }) => {
  227 |     await coursesPage.goto();
  228 | 
  229 |     const continueButton = coursesPage.getContinueButton();
  230 |     
  231 |     // Button should exist
  232 |     if (await continueButton.count() > 0) {
  233 |       await expect(continueButton).toBeVisible();
  234 |       
  235 |       // It's a link to /train
  236 |       const trainLink = page.locator("a[href='/train']").first();
  237 |       if (await trainLink.count() > 0) {
  238 |         await expect(trainLink).toBeVisible();
  239 |       }
  240 |     }
  241 |   });
  242 | 
  243 |   test("11. Filters can be combined", async ({ page }) => {
  244 |     await coursesPage.goto();
  245 | 
  246 |     const difficultyFilter = coursesPage.getDifficultyFilter();
  247 |     const categoryFilter = coursesPage.getCategoryFilter();
  248 | 
  249 |     // Apply both filters
  250 |     await difficultyFilter.selectOption("beginner");
  251 |     await categoryFilter.selectOption("preflop");
  252 | 
  253 |     await page.waitForTimeout(300);
  254 | 
  255 |     // Page should still display properly
  256 |     const heading = coursesPage.getCourseListHeading();
  257 |     await expect(heading).toBeVisible();
  258 |   });
  259 | 
  260 |   test("12. Course difficulty badges display correctly", async ({ page }) => {
  261 |     await coursesPage.goto();
  262 | 
  263 |     // Look for difficulty badges
  264 |     const beginnerBadges = page.locator("text=/beginner/i");
  265 |     const intermediateBadges = page.locator("text=/intermediate/i");
  266 |     const advancedBadges = page.locator("text=/advanced/i");
  267 | 
  268 |     const hasAnyBadge = (await beginnerBadges.count() > 0) ||
  269 |                         (await intermediateBadges.count() > 0) ||
  270 |                         (await advancedBadges.count() > 0);
  271 | 
  272 |     expect(hasAnyBadge).toBe(true);
  273 |   });
  274 | });
  275 | 
  276 | test.describe("Courses Page Navigation", () => {
  277 |   test("can navigate to courses page from home", async ({ page }) => {
> 278 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  279 | 
  280 |     // Find courses link
  281 |     const coursesLink = page.locator("a[href='/courses']").first();
  282 |     if (await coursesLink.count() > 0) {
  283 |       await coursesLink.click();
  284 |       await expect(page).toHaveURL(/\/courses/);
  285 |       await expect(page.locator("h1:has-text('Pre-Built Courses')")).toBeVisible();
  286 |     } else {
  287 |       await page.goto("/courses");
  288 |       await expect(page.locator("h1:has-text('Pre-Built Courses')")).toBeVisible();
  289 |     }
  290 |   });
  291 | });
  292 | 
```