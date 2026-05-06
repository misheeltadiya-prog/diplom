import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("home loads marketing shell", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login page has email field", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

test.describe("chat API (no session)", () => {
  test("stream returns 401 without cookie", async ({ request }) => {
    const res = await request.get("/api/chat/1/stream");
    expect(res.status()).toBe(401);
  });

  test("messages GET returns 401 without cookie", async ({ request }) => {
    const res = await request.get("/api/chat/1");
    expect(res.status()).toBe(401);
  });
});
