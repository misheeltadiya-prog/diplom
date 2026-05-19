import { describe, expect, it } from "vitest";
import { computeJobTabCounts } from "@/lib/job-tab-counts";

describe("computeJobTabCounts", () => {
  it("counts by normalized employment type from database rows", () => {
    const counts = computeJobTabCounts([
      { employmentType: "Remote" },
      { employmentType: "Бүтэн цаг" },
      { employmentType: "Бүтэн цаг" },
      { employmentType: "Хагас цаг" },
      { employmentType: "Гэрээт" },
    ]);

    expect(counts).toEqual({
      all: 5,
      remote: 1,
      fullTime: 2,
      partTime: 1,
      contract: 1,
    });
  });
});
