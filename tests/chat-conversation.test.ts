import { describe, expect, it } from "vitest";
import { chatConversationId, parseConversationId } from "@/lib/chat-conversation";

describe("chatConversationId", () => {
  it("builds stable thread id", () => {
    expect(chatConversationId(12, 5)).toBe("s12-u5");
  });

  it("parses thread id", () => {
    expect(parseConversationId("s12-u5")).toEqual({ seekerId: 12, clientUserId: 5 });
    expect(parseConversationId("bad")).toBeNull();
  });
});
