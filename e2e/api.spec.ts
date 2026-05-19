import { test, expect } from "@playwright/test";

test.describe("health & public API", () => {
  test("health returns database status", async ({ request }) => {
    const res = await request.get("/api/health");
    const data = await res.json();
    expect(data).toHaveProperty("database");
    expect(data).toHaveProperty("env");
  });

  test("leads POST validates required fields", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: { kind: "hire" },
    });
    expect(res.status()).toBe(400);
  });

  test("leads POST accepts valid payload", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: {
        kind: "join",
        fullName: "E2E Test",
        phone: "99001122",
        email: "e2e-test@cwork.local",
        message: "Playwright automated test lead",
      },
    });
    const data = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(data.ok).toBe(true);
  });

  test("reviews GET requires freelancerId", async ({ request }) => {
    const res = await request.get("/api/reviews");
    expect(res.status()).toBe(400);
  });

  test("banner upload requires auth", async ({ request }) => {
    const res = await request.post("/api/company-profile/banner");
    expect(res.status()).toBe(401);
  });

  test("escrow requires auth", async ({ request }) => {
    const res = await request.get("/api/escrow");
    expect(res.status()).toBe(401);
  });

  test("qpay invoice requires auth", async ({ request }) => {
    const res = await request.post("/api/payments/qpay/invoice", {
      data: { amountMnt: 1000 },
    });
    expect(res.status()).toBe(401);
  });
});
