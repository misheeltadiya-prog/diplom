import { describe, expect, it, afterEach } from "vitest";
import { validateServerEnv } from "@/lib/env";

describe("validateServerEnv", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("flags missing mysql in production-like check", () => {
    delete process.env.MYSQL_HOST;
    delete process.env.DATABASE_URL;
    const issues = validateServerEnv();
    expect(issues.some((i) => i.key === "MYSQL_HOST")).toBe(true);
  });

  it("warns demo login in production", () => {
    process.env.NODE_ENV = "production";
    process.env.MYSQL_HOST = "127.0.0.1";
    process.env.DEMO_LOGIN_ENABLED = "1";
    const issues = validateServerEnv();
    expect(issues.some((i) => i.key === "DEMO_LOGIN_ENABLED")).toBe(true);
  });
});
