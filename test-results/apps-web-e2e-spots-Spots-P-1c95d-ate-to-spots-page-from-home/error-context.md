# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/spots.spec.ts >> Spots Page Navigation >> can navigate to spots page from home
- Location: apps/web/e2e/spots.spec.ts:305:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  206 |       // Check for spot detail elements
  207 |       const detailSection = spotsPage.getSpotDetail();
  208 |       // Either the detail shows or the placeholder shows
  209 |       const hasDetail = (await detailSection.count() > 0) || (await page.locator("text=Select a spot to view details").count() > 0);
  210 |       expect(hasDetail).toBe(true);
  211 |     }
  212 |   });
  213 | 
  214 |   test("8. Like button toggles correctly", async ({ page }) => {
  215 |     await spotsPage.goto();
  216 | 
  217 |     // Find a like button
  218 |     const likeButtons = page.locator("button:has-text('❤️')");
  219 |     const likeCount = await likeButtons.count();
  220 | 
  221 |     if (likeCount > 0) {
  222 |       // Get initial like count
  223 |       const likeText = await likeButtons.first().textContent();
  224 |       const initialLikes = parseInt(likeText?.replace(/\D/g, "") || "0");
  225 | 
  226 |       // Click like button
  227 |       await likeButtons.first().click();
  228 |       await page.waitForTimeout(300);
  229 | 
  230 |       // Verify like count changed
  231 |       const newLikeText = await likeButtons.first().textContent();
  232 |       const newLikes = parseInt(newLikeText?.replace(/\D/g, "") || "0");
  233 |       
  234 |       // Either count changed or stayed same (if already liked)
  235 |       expect(newLikes >= 0).toBe(true);
  236 |     }
  237 |   });
  238 | 
  239 |   test("9. Share New Spot button exists", async ({ page }) => {
  240 |     await spotsPage.goto();
  241 | 
  242 |     const shareButton = spotsPage.getShareButton();
  243 |     await expect(shareButton).toBeVisible();
  244 | 
  245 |     // Button should be clickable
  246 |     await expect(shareButton).toBeEnabled();
  247 |   });
  248 | 
  249 |   test("10. Stats bar shows correct information", async ({ page }) => {
  250 |     await spotsPage.goto();
  251 | 
  252 |     // Check for Total Spots stat
  253 |     const totalSpotsStat = page.locator("text=Total Spots").first();
  254 |     await expect(totalSpotsStat).toBeVisible();
  255 | 
  256 |     // Check for Total Likes stat
  257 |     const totalLikesStat = page.locator("text=Total Likes").first();
  258 |     await expect(totalLikesStat).toBeVisible();
  259 | 
  260 |     // Check for Contributors stat
  261 |     const contributorsStat = page.locator("text=Contributors").first();
  262 |     await expect(contributorsStat).toBeVisible();
  263 |   });
  264 | 
  265 |   test("11. Strategy heatmap renders for selected spot", async ({ page }) => {
  266 |     await spotsPage.goto();
  267 | 
  268 |     // Select a spot to see heatmap
  269 |     const spotCard = page.locator("button:has-text('BTN vs BB')").first();
  270 |     
  271 |     if (await spotCard.count() > 0) {
  272 |       await spotCard.click();
  273 |       await page.waitForTimeout(500);
  274 | 
  275 |       // Look for heatmap or strategy section
  276 |       const heatmapSection = page.locator("h4:has-text('Strategy Heatmap')");
  277 |       const hasHeatmap = await heatmapSection.count() > 0;
  278 |       
  279 |       if (hasHeatmap) {
  280 |         await expect(heatmapSection).toBeVisible();
  281 |       }
  282 |     }
  283 |   });
  284 | 
  285 |   test("12. Practice this spot button exists", async ({ page }) => {
  286 |     await spotsPage.goto();
  287 | 
  288 |     // Select a spot first
  289 |     const spotCard = page.locator("button:has-text('BTN vs BB')").first();
  290 |     
  291 |     if (await spotCard.count() > 0) {
  292 |       await spotCard.click();
  293 |       await page.waitForTimeout(300);
  294 | 
  295 |       // Look for Practice button
  296 |       const practiceButton = page.locator("button:has-text('Practice This Spot')");
  297 |       if (await practiceButton.count() > 0) {
  298 |         await expect(practiceButton).toBeVisible();
  299 |       }
  300 |     }
  301 |   });
  302 | });
  303 | 
  304 | test.describe("Spots Page Navigation", () => {
  305 |   test("can navigate to spots page from home", async ({ page }) => {
> 306 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  307 | 
  308 |     // Find spots link
  309 |     const spotsLink = page.locator("a[href='/spots']").first();
  310 |     if (await spotsLink.count() > 0) {
  311 |       await spotsLink.click();
  312 |       await expect(page).toHaveURL(/\/spots/);
  313 |       await expect(page.locator("h1:has-text('Community Spots')")).toBeVisible();
  314 |     } else {
  315 |       await page.goto("/spots");
  316 |       await expect(page.locator("h1:has-text('Community Spots')")).toBeVisible();
  317 |     }
  318 |   });
  319 | });
  320 | 
```