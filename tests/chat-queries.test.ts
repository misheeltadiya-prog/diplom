import { describe, expect, it } from "vitest";
import { chatConversationParams, chatConversationWhere } from "@/lib/chat-queries";

describe("chatConversationWhere", () => {
  it("includes conv id and legacy sender/receiver pairs", () => {
    const w = chatConversationWhere();
    expect(w).toContain("conversation_id = ?");
    expect(w).toContain("sender_id = ?");
    expect(w).toContain("receiver_id = ?");
  });
});

describe("chatConversationParams", () => {
  it("orders params for placeholder expansion", () => {
    expect(chatConversationParams("s1-u2", 9, 1)).toEqual(["s1-u2", 9, 1, 1, 9]);
  });
});
