import { describe, expect, it } from "vitest";
import { createSignedOAuthState, parseSignedOAuthState } from "@/lib/oauth-state-signed";

describe("oauth-state-signed", () => {
  it("round-trips payload", () => {
    const state = createSignedOAuthState({
      intentRole: "freelancer",
      returnTo: "login",
      next: "/jobs",
    });
    const parsed = parseSignedOAuthState(state);
    expect(parsed?.intentRole).toBe("freelancer");
    expect(parsed?.returnTo).toBe("login");
    expect(parsed?.next).toBe("/jobs");
  });

  it("rejects tampered state", () => {
    const state = createSignedOAuthState({ returnTo: "login" });
    const bad = `${state}x`;
    expect(parseSignedOAuthState(bad)).toBeNull();
  });
});
