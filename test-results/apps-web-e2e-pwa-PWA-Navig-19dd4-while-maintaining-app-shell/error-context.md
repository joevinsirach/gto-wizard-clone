# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/pwa.spec.ts >> PWA Navigation Flows >> can navigate between pages while maintaining app shell
- Location: apps/web/e2e/pwa.spec.ts:278:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  180 | 
  181 |     const manifestLink = page.locator('link[rel="manifest"]');
  182 |     const href = await manifestLink.getAttribute("href");
  183 |     
  184 |     if (href) {
  185 |       const response = await page.request.get(href.startsWith("http") ? href : `${BASE_URL}${href}`);
  186 |       const manifest = await response.json();
  187 | 
  188 |       // Check for shortcuts
  189 |       if (manifest.shortcuts) {
  190 |         expect(Array.isArray(manifest.shortcuts)).toBe(true);
  191 |         
  192 |         for (const shortcut of manifest.shortcuts) {
  193 |           expect(shortcut.name).toBeTruthy();
  194 |           expect(shortcut.url).toBeTruthy();
  195 |         }
  196 |       }
  197 |     }
  198 |   });
  199 | 
  200 |   test("8. Mobile viewport settings are correct", async ({ page }) => {
  201 |     await pwaPage.goto();
  202 | 
  203 |     const viewport = page.locator('meta[name="viewport"]');
  204 |     const content = await viewport.getAttribute("content");
  205 | 
  206 |     // Should have device-width and maximum-scale settings
  207 |     expect(content).toContain("device-width");
  208 |     expect(content).toContain("maximum-scale=1");
  209 |   });
  210 | 
  211 |   test("9. Apple web app meta tags are present", async ({ page }) => {
  212 |     await pwaPage.goto();
  213 | 
  214 |     // Check for apple-mobile-web-app meta tags
  215 |     const appleMeta = page.locator('meta[name="apple-mobile-web-app-capable"]');
  216 |     if (await appleMeta.count() > 0) {
  217 |       const content = await appleMeta.getAttribute("content");
  218 |       expect(content).toBe("yes");
  219 |     }
  220 | 
  221 |     const appleStatusBar = page.locator('meta[name="apple-mobile-web-app-status-bar-style"]');
  222 |     if (await appleStatusBar.count() > 0) {
  223 |       const content = await appleStatusBar.getAttribute("content");
  224 |       expect(content).toBeTruthy();
  225 |     }
  226 |   });
  227 | 
  228 |   test("10. Icons exist for PWA installation", async ({ page }) => {
  229 |     await pwaPage.goto();
  230 | 
  231 |     const manifestLink = page.locator('link[rel="manifest"]');
  232 |     const href = await manifestLink.getAttribute("href");
  233 |     
  234 |     if (href) {
  235 |       const response = await page.request.get(href.startsWith("http") ? href : `${BASE_URL}${href}`);
  236 |       const manifest = await response.json();
  237 | 
  238 |       // Check that at least one icon is accessible
  239 |       if (manifest.icons && manifest.icons.length > 0) {
  240 |         const firstIcon = manifest.icons[0];
  241 |         const iconUrl = firstIcon.src.startsWith("http") 
  242 |           ? firstIcon.src 
  243 |           : `${BASE_URL}${firstIcon.src}`;
  244 |         
  245 |         const iconResponse = await page.request.get(iconUrl);
  246 |         expect(iconResponse.ok()).toBe(true);
  247 |       }
  248 |     }
  249 |   });
  250 | 
  251 |   test("11. Page works in mobile viewport", async ({ page }) => {
  252 |     // Set mobile viewport
  253 |     await page.setViewportSize({ width: 390, height: 844 });
  254 |     
  255 |     await pwaPage.goto();
  256 | 
  257 |     // Page should still load correctly
  258 |     await expect(page.locator("body")).toBeVisible();
  259 |     
  260 |     // No horizontal overflow (common mobile issue)
  261 |     const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  262 |     const viewportWidth = await page.evaluate(() => window.innerWidth);
  263 |     expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  264 |   });
  265 | 
  266 |   test("12. Service worker registration (if supported)", async ({ page }) => {
  267 |     await pwaPage.goto();
  268 | 
  269 |     // Check service worker support
  270 |     const swStatus = await pwaPage.getServiceWorkerStatus();
  271 |     
  272 |     // Just verify the status is returned without error
  273 |     expect(["registered", "available", "not_supported"]).toContain(swStatus);
  274 |   });
  275 | });
  276 | 
  277 | test.describe("PWA Navigation Flows", () => {
  278 |   test("can navigate between pages while maintaining app shell", async ({ page }) => {
  279 |     // Start at home
> 280 |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  281 |     await page.waitForLoadState("networkidle");
  282 | 
  283 |     // Navigate to ICM
  284 |     await page.goto("/icm");
  285 |     await page.waitForLoadState("networkidle");
  286 |     await expect(page.locator("h1:has-text('ICM Calculator')")).toBeVisible();
  287 | 
  288 |     // Navigate to Spots
  289 |     await page.goto("/spots");
  290 |     await page.waitForLoadState("networkidle");
  291 |     await expect(page.locator("h1:has-text('Community Spots')")).toBeVisible();
  292 | 
  293 |     // Navigate to Courses
  294 |     await page.goto("/courses");
  295 |     await page.waitForLoadState("networkidle");
  296 |     await expect(page.locator("h1:has-text('Pre-Built Courses')")).toBeVisible();
  297 | 
  298 |     // Navigate back to Equity
  299 |     await page.goto("/equity");
  300 |     await page.waitForLoadState("networkidle");
  301 |     await expect(page.locator("h1:has-text('Equity Calculator')")).toBeVisible();
  302 |   });
  303 | });
  304 | 
  305 | test.describe("PWA Installability", () => {
  306 |   test("page meets basic installability criteria", async ({ page }) => {
  307 |     await page.goto("/");
  308 |     await page.waitForLoadState("networkidle");
  309 | 
  310 |     // Check HTTPS (required for PWA install)
  311 |     const url = page.url();
  312 |     // In dev, localhost is allowed; in prod, would need HTTPS
  313 |     expect(url.startsWith("http")).toBe(true);
  314 | 
  315 |     // Check for manifest
  316 |     const manifest = page.locator('link[rel="manifest"]');
  317 |     await expect(manifest).toBeVisible();
  318 | 
  319 |     // Check for service worker registration capability
  320 |     const swSupport = await page.evaluate(() => 'serviceWorker' in navigator);
  321 |     expect(swSupport).toBe(true);
  322 |   });
  323 | });
  324 | 
```