import { describe, expect, it } from "vitest";
import {
  buildStructuredJobDescription,
  getSectionsForJobDetail,
  jobCardPreviewFromJob,
  jobDescriptionCardPreview,
  parseStructuredJobDescription,
} from "@/lib/job-description-sections";

const sampleJob = {
  description: "",
  title: "Инженер",
  companyName: "Acme",
  location: "Улаанбаатар",
  employmentType: "Бүтэн цаг",
  salary: "5 сая ₮",
};

describe("job description sections", () => {
  it("round-trips 6 sections", () => {
    const sections = ["a", "b", "c", "d", "e", "f"];
    const raw = buildStructuredJobDescription(sections);
    const parsed = parseStructuredJobDescription(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.map((p) => p.body).join("|")).toBe("a|b|c|d|e|f");
  });

  it("card preview uses first section body", () => {
    const raw = buildStructuredJobDescription(["Хэсэг нэг", ...Array(5).fill("x")]);
    expect(jobDescriptionCardPreview(raw, 10)).toMatch(/^Хэсэг нэг/);
  });

  it("getSectionsForJobDetail yields 6 blocks for plain legacy description", () => {
    const job = { ...sampleJob, description: "Ерөнхий ажлын тайлбар текст." };
    const secs = getSectionsForJobDetail(job);
    expect(secs).toHaveLength(6);
    expect(secs[0].body).toContain("Ерөнхий ажлын тайлбар");
    expect(secs[1].body).toContain("Acme");
  });

  it("jobCardPreviewFromJob uses first section", () => {
    const preview = jobCardPreviewFromJob({ ...sampleJob, description: "Товч тайлбар." }, 80);
    expect(preview).toMatch(/^Товч тайлбар/);
  });
});
