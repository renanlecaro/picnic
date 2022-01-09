const { test, expect } = require("@playwright/test");

test("basic test", async ({ page }) => {
  await page.goto("http://localhost:4444/");
  const title = page.locator("title");
  await expect(title).toHaveText(
    "Picnic: privacy first collaborative text editor."
  );
});
