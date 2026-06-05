# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/pwa.spec.ts >> PWA Features >> 1. Page has valid manifest link
- Location: apps/web/e2e/pwa.spec.ts:74:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('link[rel="manifest"]')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('link[rel="manifest"]')
    13 × locator resolved to <link rel="manifest" href="/manifest.json"/>
       - unexpected value "hidden"

```

```yaml
- banner:
  - navigation:
    - link "GTO Wizard":
      - /url: /
    - link "Equity":
      - /url: /equity
    - link "PLO4":
      - /url: /plo
    - link "Train":
      - /url: /train
    - link "Analyze":
      - /url: /analyze
    - link "Strategies":
      - /url: /strategies
    - link "Courses":
      - /url: /courses
    - link "Spots":
      - /url: /spots
    - button "Open menu":
      - img
- main:
  - heading "GTO Wizard Clone" [level=1]
  - paragraph: Master optimal poker strategy with cutting-edge GTO analysis tools
  - link "📊 Equity Calculator Calculate equity between hand ranges with board cards":
    - /url: /equity
    - text: 📊
    - heading "Equity Calculator" [level=2]
    - paragraph: Calculate equity between hand ranges with board cards
  - link "🎯 GTO Solver Solve for optimal strategies using game theory":
    - /url: /train
    - text: 🎯
    - heading "GTO Solver" [level=2]
    - paragraph: Solve for optimal strategies using game theory
  - link "🎓 Training Mode Practice and improve your GTO play":
    - /url: /train
    - text: 🎓
    - heading "Training Mode" [level=2]
    - paragraph: Practice and improve your GTO play
  - link "📝 Hand History Analyze your sessions and track progress":
    - /url: /analyze
    - text: 📝
    - heading "Hand History" [level=2]
    - paragraph: Analyze your sessions and track progress
  - link "🏆 ICM Calculator Make better decisions in tournament spots":
    - /url: /icm
    - text: 🏆
    - heading "ICM Calculator" [level=2]
    - paragraph: Make better decisions in tournament spots
- contentinfo: © 2026 GTO Wizard. Built for poker excellence.
- alert
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * PWA (Progressive Web App) E2E Tests
  5   |  * 
  6   |  * Tests cover:
  7   |  * 1. Service worker registration
  8   |  * 2. Web app manifest presence and validity
  9   |  * 3. Installability requirements
  10  |  * 4. Offline functionality (when service worker caches content)
  11  |  * 5. App shortcuts (manifest shortcuts)
  12  |  * 6. Theme colors and display modes
  13  |  * 7. Mobile viewport handling
  14  |  */
  15  | 
  16  | const BASE_URL = "http://localhost:3000";
  17  | 
  18  | export class PWAPage {
  19  |   readonly page: Page;
  20  | 
  21  |   constructor(page: Page) {
  22  |     this.page = page;
  23  |   }
  24  | 
  25  |   async goto(path: string = "/") {
  26  |     await this.page.goto(`${BASE_URL}${path}`);
  27  |   }
  28  | 
  29  |   // Get service worker status
  30  |   async getServiceWorkerStatus(): Promise<string> {
  31  |     return await this.page.evaluate(async () => {
  32  |       if ('serviceWorker' in navigator) {
  33  |         const registrations = await navigator.serviceWorker.getRegistrations();
  34  |         if (registrations.length > 0) {
  35  |           return 'registered';
  36  |         }
  37  |         return 'available';
  38  |       }
  39  |       return 'not_supported';
  40  |     });
  41  |   }
  42  | 
  43  |   // Check if app is installable
  44  |   async isInstallable(): Promise<boolean> {
  45  |     return await this.page.evaluate(async () => {
  46  |       if ('BeforeInstallPromptEvent' in window) {
  47  |         return true;
  48  |       }
  49  |       return false;
  50  |     });
  51  |   }
  52  | 
  53  |   // Get manifest data
  54  |   async getManifest(): Promise<any> {
  55  |     const links = await this.page.locator('link[rel="manifest"]').evaluateAll(
  56  |       (els) => els.map((el) => el.href)
  57  |     );
  58  |     
  59  |     if (links.length > 0) {
  60  |       const response = await fetch(links[0]);
  61  |       return await response.json();
  62  |     }
  63  |     return null;
  64  |   }
  65  | }
  66  | 
  67  | test.describe("PWA Features", () => {
  68  |   let pwaPage: PWAPage;
  69  | 
  70  |   test.beforeEach(async ({ page }) => {
  71  |     pwaPage = new PWAPage(page);
  72  |   });
  73  | 
  74  |   test("1. Page has valid manifest link", async ({ page }) => {
  75  |     await pwaPage.goto();
  76  | 
  77  |     // Check for manifest link in head
  78  |     const manifestLink = page.locator('link[rel="manifest"]');
> 79  |     await expect(manifestLink).toBeVisible();
      |                                ^ Error: expect(locator).toBeVisible() failed
  80  | 
  81  |     // Verify href points to manifest.json
  82  |     const href = await manifestLink.getAttribute("href");
  83  |     expect(href).toContain("manifest.json");
  84  |   });
  85  | 
  86  |   test("2. Manifest contains required PWA fields", async ({ page }) => {
  87  |     await pwaPage.goto();
  88  | 
  89  |     // Get manifest
  90  |     const manifestLink = page.locator('link[rel="manifest"]');
  91  |     const href = await manifestLink.getAttribute("href");
  92  |     
  93  |     if (href) {
  94  |       const response = await page.request.get(href.startsWith("http") ? href : `${BASE_URL}${href}`);
  95  |       const manifest = await response.json();
  96  | 
  97  |       // Required fields for PWA
  98  |       expect(manifest.name).toBeTruthy();
  99  |       expect(manifest.short_name).toBeTruthy();
  100 |       expect(manifest.start_url).toBeTruthy();
  101 |       expect(manifest.display).toBeTruthy();
  102 |       expect(manifest.icons).toBeTruthy();
  103 |       expect(Array.isArray(manifest.icons)).toBe(true);
  104 |       expect(manifest.icons.length).toBeGreaterThan(0);
  105 |     }
  106 |   });
  107 | 
  108 |   test("3. Manifest icons are properly defined", async ({ page }) => {
  109 |     await pwaPage.goto();
  110 | 
  111 |     const manifestLink = page.locator('link[rel="manifest"]');
  112 |     const href = await manifestLink.getAttribute("href");
  113 |     
  114 |     if (href) {
  115 |       const response = await page.request.get(href.startsWith("http") ? href : `${BASE_URL}${href}`);
  116 |       const manifest = await response.json();
  117 | 
  118 |       // Check icon structure
  119 |       for (const icon of manifest.icons) {
  120 |         expect(icon.src).toBeTruthy();
  121 |         expect(icon.sizes).toBeTruthy();
  122 |         expect(icon.type).toBeTruthy();
  123 |       }
  124 | 
  125 |       // Should have at least one 192x192 and one 512x512 icon
  126 |       const has192 = manifest.icons.some((icon: any) => icon.sizes.includes("192"));
  127 |       const has512 = manifest.icons.some((icon: any) => icon.sizes.includes("512"));
  128 |       expect(has192 || has512).toBe(true);
  129 |     }
  130 |   });
  131 | 
  132 |   test("4. Theme color meta tag is set correctly", async ({ page }) => {
  133 |     await pwaPage.goto();
  134 | 
  135 |     // Check for theme-color meta tag
  136 |     const themeColor = page.locator('meta[name="theme-color"]');
  137 |     
  138 |     if (await themeColor.count() > 0) {
  139 |       const content = await themeColor.getAttribute("content");
  140 |       expect(content).toBeTruthy();
  141 |     }
  142 | 
  143 |     // Also check viewport meta
  144 |     const viewport = page.locator('meta[name="viewport"]');
  145 |     await expect(viewport).toBeVisible();
  146 |   });
  147 | 
  148 |   test("5. Display mode is set to standalone", async ({ page }) => {
  149 |     await pwaPage.goto();
  150 | 
  151 |     const manifestLink = page.locator('link[rel="manifest"]');
  152 |     const href = await manifestLink.getAttribute("href");
  153 |     
  154 |     if (href) {
  155 |       const response = await page.request.get(href.startsWith("http") ? href : `${BASE_URL}${href}`);
  156 |       const manifest = await response.json();
  157 | 
  158 |       // Should be standalone for PWA experience
  159 |       expect(manifest.display).toBe("standalone");
  160 |     }
  161 |   });
  162 | 
  163 |   test("6. Start URL leads to homepage", async ({ page }) => {
  164 |     await pwaPage.goto();
  165 | 
  166 |     const manifestLink = page.locator('link[rel="manifest"]');
  167 |     const href = await manifestLink.getAttribute("href");
  168 |     
  169 |     if (href) {
  170 |       const response = await page.request.get(href.startsWith("http") ? href : `${BASE_URL}${href}`);
  171 |       const manifest = await response.json();
  172 | 
  173 |       // Start URL should be root
  174 |       expect(manifest.start_url).toBe("/");
  175 |     }
  176 |   });
  177 | 
  178 |   test("7. App shortcuts are defined in manifest", async ({ page }) => {
  179 |     await pwaPage.goto();
```