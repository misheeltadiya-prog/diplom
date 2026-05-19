import { describe, expect, it } from "vitest";
import { appOriginFromRequest } from "@/lib/stripe-server";

describe("appOriginFromRequest", () => {
  it("prefers request origin when env port differs on same host (Grafana vs Next)", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    const req = new Request("http://localhost:3001/api/stripe/checkout", { method: "POST" });
    expect(appOriginFromRequest(req)).toBe("http://localhost:3001");

    process.env.NEXT_PUBLIC_APP_URL = prev;
  });

  it("uses env when ports match", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";

    const req = new Request("http://localhost:3001/api/stripe/checkout", { method: "POST" });
    expect(appOriginFromRequest(req)).toBe("http://localhost:3001");

    process.env.NEXT_PUBLIC_APP_URL = prev;
  });
});
