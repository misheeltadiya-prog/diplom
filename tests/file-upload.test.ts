import { describe, expect, it } from "vitest";
import { validateImageFile } from "@/lib/file-upload";

describe("validateImageFile", () => {
  it("rejects non-images", () => {
    const file = { type: "application/pdf", size: 1000, name: "x.pdf" } as File;
    expect(validateImageFile(file).valid).toBe(false);
  });

  it("accepts png under 5MB", () => {
    const file = { type: "image/png", size: 1000, name: "a.png" } as File;
    expect(validateImageFile(file).valid).toBe(true);
  });
});
