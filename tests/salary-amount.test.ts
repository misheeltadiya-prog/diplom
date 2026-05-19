import { describe, expect, it } from "vitest";
import { parseSalaryAmount } from "@/lib/salary-amount";

describe("parseSalaryAmount", () => {
  it("parses dot-separated thousands (MN)", () => {
    expect(parseSalaryAmount("2.000.000")).toBe(2_000_000);
    expect(parseSalaryAmount("1.500.000 ₮")).toBe(1_500_000);
  });

  it("parses comma-separated thousands", () => {
    expect(parseSalaryAmount("2,000,000")).toBe(2_000_000);
  });

  it("parses сая and k suffixes", () => {
    expect(parseSalaryAmount("3 сая")).toBe(3_000_000);
    expect(parseSalaryAmount("500k")).toBe(500_000);
  });

  it("returns 0 for non-numeric text", () => {
    expect(parseSalaryAmount("Тохирно")).toBe(0);
    expect(parseSalaryAmount("")).toBe(0);
  });

  it("averages salary ranges", () => {
    expect(parseSalaryAmount("2.000.000 - 3.000.000")).toBe(2_500_000);
  });
});
