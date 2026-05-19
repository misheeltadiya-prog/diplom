import { describe, expect, it } from "vitest";
import { buildJobVoiceSpeechMn } from "@/lib/voice-job-speech";

describe("buildJobVoiceSpeechMn", () => {
  const job = {
    title: "Frontend хөгжүүлэгч",
    companyName: "Tech MN",
    location: "Улаанбаатар",
    employmentType: "Бүтэн цаг",
    salary: "2 500 000 ₮",
    description: "",
  };

  it("includes company, title, duties and requirements labels", () => {
    const text = buildJobVoiceSpeechMn(job, 0, 3, true);
    expect(text).toContain("Компани: Tech MN");
    expect(text).toContain("Албан тушаал: Frontend");
    expect(text).toContain("Хийж гүйцэтгэх үүрэг");
    expect(text).toContain("Тавигдах шаардлага");
  });
});
