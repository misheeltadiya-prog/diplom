import { describe, expect, it } from "vitest";
import { postLoginPath } from "@/lib/post-login-redirect";

describe("postLoginPath", () => {
  it("prefers safe internal next", () => {
    expect(postLoginPath("freelancer", { next: "/profile" })).toBe("/profile");
  });

  it("rejects unsafe next", () => {
    expect(postLoginPath("freelancer", { next: "https://evil.com" })).toBe("/freelancers");
  });

  it("new oauth freelancer goes to publish", () => {
    expect(postLoginPath("freelancer", { isNewOAuthUser: true })).toBe("/freelancers?publish=1");
  });
});
