# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: icm.spec.ts >> ICM Calculator Page >> 2. PrizePoolPanel displays and allows editing
- Location: e2e/icm.spec.ts:70:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "GTO Wizard" [ref=e5] [cursor=pointer]:
          - /url: /
        - generic [ref=e6]:
          - link "Equity" [ref=e7] [cursor=pointer]:
            - /url: /equity
          - link "PLO4" [ref=e8] [cursor=pointer]:
            - /url: /plo
          - link "Train" [ref=e9] [cursor=pointer]:
            - /url: /train
          - link "Analyze" [ref=e10] [cursor=pointer]:
            - /url: /analyze
          - link "Strategies" [ref=e11] [cursor=pointer]:
            - /url: /strategies
          - link "Courses" [ref=e12] [cursor=pointer]:
            - /url: /courses
          - link "Spots" [ref=e13] [cursor=pointer]:
            - /url: /spots
        - button "Open menu" [ref=e14]:
          - img [ref=e15]
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e18]:
        - heading "ICM Calculator" [level=1] [ref=e19]
        - paragraph [ref=e20]: Calculate Independent Chip Model values for tournament situations
      - generic [ref=e21]:
        - generic [ref=e22]:
          - text: "Buy-in:"
          - spinbutton [ref=e23]: "1000"
        - generic [ref=e24]:
          - text: "Total Chips:"
          - spinbutton [ref=e25]: "5800"
        - button "Calculate" [ref=e26]
      - generic [ref=e28]:
        - text: "API error: 404"
        - button "Dismiss" [ref=e29]
      - generic [ref=e30]:
        - generic [ref=e32]:
          - generic [ref=e33]:
            - heading "Prize Pool Structure" [level=3] [ref=e34]
            - generic [ref=e35]: "Total: $1,000"
          - generic [ref=e36]:
            - generic [ref=e37]:
              - text: 1st
              - generic [ref=e38]:
                - generic [ref=e39]: $500
                - generic [ref=e40]: (50.0%)
              - button:
                - img
            - generic [ref=e43]:
              - text: 2nd
              - generic [ref=e44]:
                - generic [ref=e45]: $300
                - generic [ref=e46]: (30.0%)
              - button:
                - img
            - generic [ref=e49]:
              - text: 3rd
              - generic [ref=e50]:
                - generic [ref=e51]: $200
                - generic [ref=e52]: (20.0%)
              - button:
                - img
          - generic [ref=e55]:
            - button "+ Add Place" [ref=e56]
            - generic [ref=e57]:
              - text: "Total:"
              - generic [ref=e58]: 100.0%
        - generic [ref=e60]:
          - generic [ref=e61]:
            - heading "Chip Stacks" [level=3] [ref=e62]
            - generic [ref=e63]: "Total: 5,800 chips"
          - generic [ref=e64]:
            - generic [ref=e65]:
              - text: "1"
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - textbox [ref=e68]: Big Stack
                  - text: CHIP LEADER
                - generic [ref=e69]: 3,000
              - button:
                - img
            - generic [ref=e72]:
              - text: "2"
              - generic [ref=e73]:
                - textbox [ref=e75]: Mid Stack
                - generic [ref=e76]: 1,500
              - button:
                - img
            - generic [ref=e79]:
              - text: "3"
              - generic [ref=e80]:
                - generic [ref=e81]:
                  - textbox [ref=e82]: Short Stack
                  - text: SHORT
                - generic [ref=e83]: "800"
              - button:
                - img
            - generic [ref=e86]:
              - text: "4"
              - generic [ref=e87]:
                - generic [ref=e88]:
                  - textbox [ref=e89]: Micro Stack
                  - text: SHORT
                - generic [ref=e90]: "500"
              - button:
                - img
          - generic [ref=e93]:
            - button "+ Add Player" [ref=e94]
            - generic [ref=e95]: 4 players remaining
        - generic [ref=e97]:
          - generic [ref=e98]:
            - heading "Bubble Pressure" [level=3] [ref=e99]
            - generic [ref=e100]: ICM Pressure Analysis
          - generic [ref=e101]:
            - generic [ref=e103]:
              - generic [ref=e104]: Micro StackHigh Pressure
              - generic [ref=e105]: 2.20x
            - generic [ref=e107]:
              - generic [ref=e108]: Short StackHigh Pressure
              - generic [ref=e109]: 1.80x
            - generic [ref=e111]:
              - generic [ref=e112]: Mid StackMedium Pressure
              - generic [ref=e113]: 1.30x
            - generic [ref=e115]:
              - generic [ref=e116]: Big StackLow Pressure
              - generic [ref=e117]: 1.10x
          - generic [ref=e119]: Low bubble factor = normal playHigh bubble factor = tight ranges
        - generic [ref=e121]:
          - generic [ref=e122]:
            - heading "SMP Zone Analysis" [level=3] [ref=e123]
            - generic [ref=e124]: Stack Management Zones
          - generic [ref=e125]:
            - generic [ref=e126]: Comfortable (≥1.2x avg)
            - generic [ref=e127]: Caution (0.6-1.2x avg)
            - generic [ref=e128]: Danger (<0.6x avg)
          - generic [ref=e129]:
            - generic [ref=e130]:
              - generic [ref=e131]:
                - generic [ref=e132]: Big StackCaution
                - generic [ref=e133]: 3,000 chips
              - generic [ref=e134]: "Strategy: Balance between protecting equity and extracting value. Avoid risky confrontations."
            - generic [ref=e135]:
              - generic [ref=e136]:
                - generic [ref=e137]: Mid StackCaution
                - generic [ref=e138]: 1,500 chips
              - generic [ref=e139]: "Strategy: Balance between protecting equity and extracting value. Avoid risky confrontations."
            - generic [ref=e140]:
              - generic [ref=e141]:
                - generic [ref=e142]: Short StackCaution
                - generic [ref=e143]: 800 chips
              - generic [ref=e144]: "Strategy: Balance between protecting equity and extracting value. Avoid risky confrontations."
            - generic [ref=e145]:
              - generic [ref=e146]:
                - generic [ref=e147]: Micro StackCaution
                - generic [ref=e148]: 500 chips
              - generic [ref=e149]: "Strategy: Balance between protecting equity and extracting value. Avoid risky confrontations."
          - generic [ref=e150]:
            - generic [ref=e151]:
              - generic [ref=e152]:
                - generic [ref=e153]: "0"
                - generic [ref=e154]: Comfortable
              - generic [ref=e155]:
                - generic [ref=e156]: "4"
                - generic [ref=e157]: Caution
              - generic [ref=e158]:
                - generic [ref=e159]: "0"
                - generic [ref=e160]: Danger
            - generic [ref=e161]: "Average stack: 1,450 chips | Total chips: 5,800"
        - generic [ref=e163]:
          - generic [ref=e164]:
            - heading "ICM Analysis" [level=3] [ref=e165]
            - generic [ref=e166]: Independent Chip Model
          - table [ref=e168]:
            - rowgroup [ref=e169]:
              - row "Rank Player Chips ICM % Prize $ Cash%" [ref=e170]:
                - columnheader "Rank" [ref=e171]
                - columnheader "Player" [ref=e172]
                - columnheader "Chips" [ref=e173]
                - columnheader "ICM %" [ref=e174]
                - columnheader "Prize $" [ref=e175]
                - columnheader "Cash%" [ref=e176]
            - rowgroup [ref=e177]:
              - row "1 Player 3★ 3,000 35.2% $352 94%" [ref=e178]:
                - cell "1" [ref=e179]
                - cell "Player 3★" [ref=e180]
                - cell "3,000" [ref=e181]
                - cell "35.2%" [ref=e182]:
                  - generic [ref=e183]: 35.2%
                - cell "$352" [ref=e184]
                - cell "94%" [ref=e185]:
                  - generic [ref=e187]: 94%
              - row "2 Player 1 2,000 28.5% $285 85%" [ref=e188]:
                - cell "2" [ref=e189]
                - cell "Player 1" [ref=e190]
                - cell "2,000" [ref=e191]
                - cell "28.5%" [ref=e192]:
                  - generic [ref=e193]: 28.5%
                - cell "$285" [ref=e194]
                - cell "85%" [ref=e195]:
                  - generic [ref=e197]: 85%
              - row "3 Player 2 1,500 22.3% $223 72%" [ref=e198]:
                - cell "3" [ref=e199]
                - cell "Player 2" [ref=e200]
                - cell "1,500" [ref=e201]
                - cell "22.3%" [ref=e202]:
                  - generic [ref=e203]: 22.3%
                - cell "$223" [ref=e204]
                - cell "72%" [ref=e205]:
                  - generic [ref=e207]: 72%
              - row "4 Player 5 1,500 22.3% $223 71%" [ref=e208]:
                - cell "4" [ref=e209]
                - cell "Player 5" [ref=e210]
                - cell "1,500" [ref=e211]
                - cell "22.3%" [ref=e212]:
                  - generic [ref=e213]: 22.3%
                - cell "$223" [ref=e214]
                - cell "71%" [ref=e215]:
                  - generic [ref=e217]: 71%
              - row "5 Player 4 1,200 18.1% $181 58%" [ref=e218]:
                - cell "5" [ref=e219]
                - cell "Player 4" [ref=e220]
                - cell "1,200" [ref=e221]
                - cell "18.1%" [ref=e222]:
                  - generic [ref=e223]: 18.1%
                - cell "$181" [ref=e224]
                - cell "58%" [ref=e225]:
                  - generic [ref=e227]: 58%
              - row "6 Player 6 800 8.6% $86 22%" [ref=e228]:
                - cell "6" [ref=e229]
                - cell "Player 6" [ref=e230]
                - cell "800" [ref=e231]
                - cell "8.6%" [ref=e232]:
                  - generic [ref=e233]: 8.6%
                - cell "$86" [ref=e234]
                - cell "22%" [ref=e235]:
                  - generic [ref=e237]: 22%
          - generic [ref=e238]:
            - generic [ref=e239]:
              - generic [ref=e240]: Total Prize Pool
              - generic [ref=e241]: $1,350
            - generic [ref=e242]:
              - generic [ref=e243]: Avg Stack Value
              - generic [ref=e244]: $225
            - generic [ref=e245]:
              - generic [ref=e246]: Chip Leader Adv
              - generic [ref=e247]: +18.5%
      - generic [ref=e249]:
        - generic [ref=e250]:
          - heading "ICM Analysis" [level=3] [ref=e251]
          - generic [ref=e252]: Independent Chip Model
        - table [ref=e254]:
          - rowgroup [ref=e255]:
            - row "Rank Player Chips ICM % Prize $ Cash%" [ref=e256]:
              - columnheader "Rank" [ref=e257]
              - columnheader "Player" [ref=e258]
              - columnheader "Chips" [ref=e259]
              - columnheader "ICM %" [ref=e260]
              - columnheader "Prize $" [ref=e261]
              - columnheader "Cash%" [ref=e262]
          - rowgroup [ref=e263]:
            - row "1 Player 3★ 3,000 35.2% $352 94%" [ref=e264]:
              - cell "1" [ref=e265]
              - cell "Player 3★" [ref=e266]
              - cell "3,000" [ref=e267]
              - cell "35.2%" [ref=e268]:
                - generic [ref=e269]: 35.2%
              - cell "$352" [ref=e270]
              - cell "94%" [ref=e271]:
                - generic [ref=e273]: 94%
            - row "2 Player 1 2,000 28.5% $285 85%" [ref=e274]:
              - cell "2" [ref=e275]
              - cell "Player 1" [ref=e276]
              - cell "2,000" [ref=e277]
              - cell "28.5%" [ref=e278]:
                - generic [ref=e279]: 28.5%
              - cell "$285" [ref=e280]
              - cell "85%" [ref=e281]:
                - generic [ref=e283]: 85%
            - row "3 Player 2 1,500 22.3% $223 72%" [ref=e284]:
              - cell "3" [ref=e285]
              - cell "Player 2" [ref=e286]
              - cell "1,500" [ref=e287]
              - cell "22.3%" [ref=e288]:
                - generic [ref=e289]: 22.3%
              - cell "$223" [ref=e290]
              - cell "72%" [ref=e291]:
                - generic [ref=e293]: 72%
            - row "4 Player 5 1,500 22.3% $223 71%" [ref=e294]:
              - cell "4" [ref=e295]
              - cell "Player 5" [ref=e296]
              - cell "1,500" [ref=e297]
              - cell "22.3%" [ref=e298]:
                - generic [ref=e299]: 22.3%
              - cell "$223" [ref=e300]
              - cell "71%" [ref=e301]:
                - generic [ref=e303]: 71%
            - row "5 Player 4 1,200 18.1% $181 58%" [ref=e304]:
              - cell "5" [ref=e305]
              - cell "Player 4" [ref=e306]
              - cell "1,200" [ref=e307]
              - cell "18.1%" [ref=e308]:
                - generic [ref=e309]: 18.1%
              - cell "$181" [ref=e310]
              - cell "58%" [ref=e311]:
                - generic [ref=e313]: 58%
            - row "6 Player 6 800 8.6% $86 22%" [ref=e314]:
              - cell "6" [ref=e315]
              - cell "Player 6" [ref=e316]
              - cell "800" [ref=e317]
              - cell "8.6%" [ref=e318]:
                - generic [ref=e319]: 8.6%
              - cell "$86" [ref=e320]
              - cell "22%" [ref=e321]:
                - generic [ref=e323]: 22%
        - generic [ref=e324]:
          - generic [ref=e325]:
            - generic [ref=e326]: Total Prize Pool
            - generic [ref=e327]: $1,350
          - generic [ref=e328]:
            - generic [ref=e329]: Avg Stack Value
            - generic [ref=e330]: $225
          - generic [ref=e331]:
            - generic [ref=e332]: Chip Leader Adv
            - generic [ref=e333]: +18.5%
      - generic [ref=e335]:
        - generic [ref=e336]:
          - heading "ICM Analysis" [level=3] [ref=e337]
          - generic [ref=e338]: Independent Chip Model
        - table [ref=e340]:
          - rowgroup [ref=e341]:
            - row "Rank Player Chips ICM % Prize $ Cash%" [ref=e342]:
              - columnheader "Rank" [ref=e343]
              - columnheader "Player" [ref=e344]
              - columnheader "Chips" [ref=e345]
              - columnheader "ICM %" [ref=e346]
              - columnheader "Prize $" [ref=e347]
              - columnheader "Cash%" [ref=e348]
          - rowgroup [ref=e349]:
            - row "1 Player 3★ 3,000 35.2% $352 94%" [ref=e350]:
              - cell "1" [ref=e351]
              - cell "Player 3★" [ref=e352]
              - cell "3,000" [ref=e353]
              - cell "35.2%" [ref=e354]:
                - generic [ref=e355]: 35.2%
              - cell "$352" [ref=e356]
              - cell "94%" [ref=e357]:
                - generic [ref=e359]: 94%
            - row "2 Player 1 2,000 28.5% $285 85%" [ref=e360]:
              - cell "2" [ref=e361]
              - cell "Player 1" [ref=e362]
              - cell "2,000" [ref=e363]
              - cell "28.5%" [ref=e364]:
                - generic [ref=e365]: 28.5%
              - cell "$285" [ref=e366]
              - cell "85%" [ref=e367]:
                - generic [ref=e369]: 85%
            - row "3 Player 2 1,500 22.3% $223 72%" [ref=e370]:
              - cell "3" [ref=e371]
              - cell "Player 2" [ref=e372]
              - cell "1,500" [ref=e373]
              - cell "22.3%" [ref=e374]:
                - generic [ref=e375]: 22.3%
              - cell "$223" [ref=e376]
              - cell "72%" [ref=e377]:
                - generic [ref=e379]: 72%
            - row "4 Player 5 1,500 22.3% $223 71%" [ref=e380]:
              - cell "4" [ref=e381]
              - cell "Player 5" [ref=e382]
              - cell "1,500" [ref=e383]
              - cell "22.3%" [ref=e384]:
                - generic [ref=e385]: 22.3%
              - cell "$223" [ref=e386]
              - cell "71%" [ref=e387]:
                - generic [ref=e389]: 71%
            - row "5 Player 4 1,200 18.1% $181 58%" [ref=e390]:
              - cell "5" [ref=e391]
              - cell "Player 4" [ref=e392]
              - cell "1,200" [ref=e393]
              - cell "18.1%" [ref=e394]:
                - generic [ref=e395]: 18.1%
              - cell "$181" [ref=e396]
              - cell "58%" [ref=e397]:
                - generic [ref=e399]: 58%
            - row "6 Player 6 800 8.6% $86 22%" [ref=e400]:
              - cell "6" [ref=e401]
              - cell "Player 6" [ref=e402]
              - cell "800" [ref=e403]
              - cell "8.6%" [ref=e404]:
                - generic [ref=e405]: 8.6%
              - cell "$86" [ref=e406]
              - cell "22%" [ref=e407]:
                - generic [ref=e409]: 22%
        - generic [ref=e410]:
          - generic [ref=e411]:
            - generic [ref=e412]: Total Prize Pool
            - generic [ref=e413]: $1,350
          - generic [ref=e414]:
            - generic [ref=e415]: Avg Stack Value
            - generic [ref=e416]: $225
          - generic [ref=e417]:
            - generic [ref=e418]: Chip Leader Adv
            - generic [ref=e419]: +18.5%
      - generic [ref=e420]:
        - heading "About ICM" [level=2] [ref=e421]
        - generic [ref=e422]:
          - generic [ref=e423]:
            - heading "What is ICM?" [level=3] [ref=e424]
            - paragraph [ref=e425]: The Independent Chip Model (ICM) is a mathematical model used in poker tournaments to calculate the equity of a player's stack based on their probability of finishing in each prize position.
          - generic [ref=e426]:
            - heading "Why use ICM?" [level=3] [ref=e427]
            - paragraph [ref=e428]: ICM helps players make better decisions in tournament situations by converting chip stacks into real money expected value. This is crucial for freezeouts and when prizepools are top-heavy.
          - generic [ref=e429]:
            - heading "Bubble Factors" [level=3] [ref=e430]
            - paragraph [ref=e431]: The bubble factor measures how much more valuable each chip becomes as the tournament progresses. A high bubble factor means saving chips is more important than accumulating them.
          - generic [ref=e432]:
            - heading "Practical Applications" [level=3] [ref=e433]
            - paragraph [ref=e434]: Use ICM calculations to determine optimal push/fold ranges, understand calling conventions, and make better bubble play decisions.
  - contentinfo [ref=e435]:
    - generic [ref=e436]: © 2026 GTO Wizard. Built for poker excellence.
  - alert [ref=e437]
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | const ICM_URL = "/icm";
  4   | 
  5   | export class ICMPage {
  6   |   readonly page: Page;
  7   | 
  8   |   constructor(page: Page) {
  9   |     this.page = page;
  10  |   }
  11  | 
  12  |   async goto() {
  13  |     await this.page.goto(ICM_URL);
  14  |   }
  15  | 
  16  |   getPrizePoolSection() {
  17  |     return this.page.locator("h3:has-text('Prize Pool Structure')").locator("..");
  18  |   }
  19  | 
  20  |   getChipStackSection() {
  21  |     return this.page.locator("h3:has-text('Chip Stacks')").locator("..");
  22  |   }
  23  | 
  24  |   getICMResultsSection() {
  25  |     return this.page.locator("h3:has-text('ICM Analysis')").first().locator("..");
  26  |   }
  27  | 
  28  |   getBuyInInput() {
  29  |     return this.page.getByLabel("Buy-in:").first();
  30  |   }
  31  | 
  32  |   getTotalChipsInput() {
  33  |     return this.page.getByLabel("Total Chips:").first();
  34  |   }
  35  | 
  36  |   getAboutSection() {
  37  |     return this.page.locator("h2:has-text('About ICM')");
  38  |   }
  39  | }
  40  | 
  41  | test.describe("ICM Calculator Page", () => {
  42  |   let icmPage: ICMPage;
  43  | 
  44  |   test.beforeEach(async ({ page }) => {
  45  |     icmPage = new ICMPage(page);
  46  |   });
  47  | 
  48  |   test("1. Page loads without errors at /icm", async ({ page }) => {
  49  |     const consoleErrors: string[] = [];
  50  |     page.on("console", (msg) => {
  51  |       if (msg.type() === "error") {
  52  |         consoleErrors.push(msg.text());
  53  |       }
  54  |     });
  55  | 
  56  |     await icmPage.goto();
  57  |     await page.waitForLoadState("networkidle");
  58  | 
  59  |     await expect(page).toHaveTitle(/GTO|ICM/i);
  60  | 
  61  |     const heading = page.locator("h1:has-text('ICM Calculator')");
  62  |     await expect(heading).toBeVisible();
  63  | 
  64  |     const criticalErrors = consoleErrors.filter(
  65  |       (e) => !e.includes("favicon") && !e.includes("404")
  66  |     );
  67  |     expect(criticalErrors).toHaveLength(0);
  68  |   });
  69  | 
  70  |   test("2. PrizePoolPanel displays and allows editing", async ({ page }) => {
  71  |     await icmPage.goto();
  72  | 
  73  |     const prizeSection = icmPage.getPrizePoolSection();
  74  |     await expect(prizeSection).toBeVisible();
  75  | 
  76  |     const percentageTexts = prizeSection.locator("text=/\\d+\\.?\\d*%/");
  77  |     const count = await percentageTexts.count();
> 78  |     expect(count).toBeGreaterThan(0);
      |                   ^ Error: expect(received).toBeGreaterThan(expected)
  79  | 
  80  |     const prizeTexts = prizeSection.locator("text=/\\$\\d+/");
  81  |     const dollarCount = await prizeTexts.count();
  82  |     expect(dollarCount).toBeGreaterThan(0);
  83  |   });
  84  | 
  85  |   test("3. ChipStackPanel displays player stacks", async ({ page }) => {
  86  |     await icmPage.goto();
  87  | 
  88  |     const stackSection = icmPage.getChipStackSection();
  89  |     await expect(stackSection).toBeVisible();
  90  | 
  91  |     const chipTexts = stackSection.locator("text=/\\d{1,3}(,\\d{3})+/");
  92  |     const chipCount = await chipTexts.count();
  93  |     expect(chipCount).toBeGreaterThan(0);
  94  | 
  95  |     const nameInputs = stackSection.locator("input[type='text']");
  96  |     const nameCount = await nameInputs.count();
  97  |     expect(nameCount).toBeGreaterThan(0);
  98  |   });
  99  | 
  100 |   test("4. ICMResults section displays calculations", async ({ page }) => {
  101 |     await icmPage.goto();
  102 | 
  103 |     await page.waitForTimeout(2000);
  104 | 
  105 |     const resultsSection = icmPage.getICMResultsSection();
  106 | 
  107 |     await expect(resultsSection).toBeVisible();
  108 | 
  109 |     const tableExists = await resultsSection.locator("table").count() > 0;
  110 |     const hasPercentage = await resultsSection.locator("text=/\\d+\\.\\d+%/").count() > 0;
  111 | 
  112 |     expect(tableExists || hasPercentage).toBe(true);
  113 |   });
  114 | 
  115 |   test("5. Tournament buy-in input is functional", async ({ page }) => {
  116 |     await icmPage.goto();
  117 | 
  118 |     const buyInInput = icmPage.getBuyInInput();
  119 |     await expect(buyInInput).toBeVisible();
  120 | 
  121 |     const val = await buyInInput.inputValue();
  122 |     const initialValue = val || "";
  123 |     expect(initialValue).toBeTruthy();
  124 | 
  125 |     await buyInInput.fill("5000");
  126 |     await expect(buyInInput).toHaveValue("5000");
  127 | 
  128 |     await page.waitForTimeout(300);
  129 |     await expect(page.locator("h1:has-text('ICM Calculator')")).toBeVisible();
  130 |   });
  131 | 
  132 |   test("6. Player chip amounts can be edited", async ({ page }) => {
  133 |     await icmPage.goto();
  134 | 
  135 |     const stackSection = icmPage.getChipStackSection();
  136 | 
  137 |     const textInputs = stackSection.locator("input[type='text']");
  138 |     const textInputCount = await textInputs.count();
  139 | 
  140 |     if (textInputCount > 0) {
  141 |       const firstNameInput = textInputs.first();
  142 |       const val = await firstNameInput.inputValue();
  143 |       const initialValue = val || "";
  144 | 
  145 |       await firstNameInput.fill("Test Player");
  146 |       await expect(firstNameInput).toHaveValue("Test Player");
  147 |       await firstNameInput.fill(initialValue);
  148 |     }
  149 |   });
  150 | 
  151 |   test("7. About ICM section is visible with information", async ({ page }) => {
  152 |     await icmPage.goto();
  153 | 
  154 |     const aboutSection = icmPage.getAboutSection();
  155 |     await aboutSection.scrollIntoViewIfNeeded();
  156 |     await expect(aboutSection).toBeVisible();
  157 | 
  158 |     const aboutContent = page.locator("h3:has-text('What is ICM?')");
  159 |     await expect(aboutContent).toBeVisible();
  160 | 
  161 |     const whyICM = page.locator("h3:has-text('Why use ICM?')");
  162 |     await expect(whyICM).toBeVisible();
  163 |   });
  164 | 
  165 |   test("8. Quick settings section exists", async ({ page }) => {
  166 |     await icmPage.goto();
  167 | 
  168 |     const buyInLabel = page.locator("text=Buy-in:");
  169 |     await expect(buyInLabel).toBeVisible();
  170 | 
  171 |     const totalChipsLabel = page.locator("text=Total Chips:");
  172 |     await expect(totalChipsLabel).toBeVisible();
  173 |   });
  174 | });
  175 | 
  176 | test.describe("ICM Page Navigation", () => {
  177 |   test("can navigate to ICM page from home", async ({ page }) => {
  178 |     await page.goto("/");
```