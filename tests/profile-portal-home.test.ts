import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exitProfileToPortal, getPortalHomeHref } from "@/lib/profile-portal-home";

describe("getPortalHomeHref", () => {
  it("routes freelancers to /freelancers", () => {
    expect(getPortalHomeHref("freelancer")).toBe("/freelancers");
  });

  it("routes companies to /freelancers", () => {
    expect(getPortalHomeHref("company")).toBe("/freelancers");
  });
});

describe("exitProfileToPortal", () => {
  const replace = vi.fn();

  beforeEach(() => {
    replace.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("replaces nested profile routes after stepping back in history", () => {
    const go = vi.fn();
    vi.stubGlobal("window", {
      history: { go },
      location: { origin: "http://localhost:3001" },
      setTimeout: (fn: () => void) => {
        fn();
        return 0;
      },
    });
    vi.stubGlobal("document", {
      referrer: "http://localhost:3001/profile",
    });

    exitProfileToPortal({ replace }, "/profile/settings", "/freelancers");

    expect(go).toHaveBeenCalledWith(-1);
    expect(replace).toHaveBeenCalledWith("/freelancers");

    vi.unstubAllGlobals();
  });

  it("upgrade page exits with replace only (not back to Stripe)", () => {
    const go = vi.fn();
    vi.stubGlobal("window", {
      history: { go },
      location: { origin: "http://localhost:3001" },
      setTimeout: (fn: () => void) => {
        fn();
        return 0;
      },
    });
    vi.stubGlobal("document", {
      referrer: "https://checkout.stripe.com/c/pay/cs_test_xxx",
    });

    exitProfileToPortal({ replace }, "/profile/upgrade", "/freelancers");

    expect(go).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/freelancers");

    vi.unstubAllGlobals();
  });

  it("replaces top-level profile route directly", () => {
    exitProfileToPortal({ replace }, "/profile", "/freelancers");
    expect(replace).toHaveBeenCalledWith("/freelancers");
  });
});
