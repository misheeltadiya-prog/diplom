import { describe, expect, it } from "vitest";
import { normalizeJobEmploymentType } from "@/lib/job-employment-type";

describe("normalizeJobEmploymentType", () => {
  it("normalizes remote variants", () => {
    expect(normalizeJobEmploymentType("remote")).toBe("Remote");
    expect(normalizeJobEmploymentType("Remote")).toBe("Remote");
  });

  it("normalizes schedule labels from job form", () => {
    expect(normalizeJobEmploymentType("Бүтэн цаг")).toBe("Бүтэн цаг");
    expect(normalizeJobEmploymentType("Хагас цаг")).toBe("Хагас цаг");
    expect(normalizeJobEmploymentType("Гэрээт")).toBe("Гэрээт");
  });
});
