# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web/e2e/pwa.spec.ts >> PWA Features >> 4. Theme color meta tag is set correctly
- Location: apps/web/e2e/pwa.spec.ts:132:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('meta[name="viewport"]')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('meta[name="viewport"]')
    13 × locator resolved to <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no"/>
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
  79  |     await expect(manifestLink).toBeVisible();
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
> 145 |     await expect(viewport).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
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
```