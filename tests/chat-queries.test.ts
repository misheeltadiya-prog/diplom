import { describe, expect, it } from "vitest";
import {
  chatConversationParams,
  chatConversationParamsMulti,
  chatConversationWhere,
  chatConversationWhereMulti,
} from "@/lib/chat-queries";

describe("chatConversationWhere", () => {
  it("includes conv id and legacy sender/receiver pairs", () => {
    const w = chatConversationWhere();
    expect(w).toContain("conversation_id = ?");
    expect(w).toContain("sender_id = ?");
    expect(w).toContain("receiver_id = ?");
  });
});

describe("chatConversationWhereMulti", () => {
  it("uses IN for several conversation ids", () => {
    const w = chatConversationWhereMulti(["u1-u2", "s9-u1"]);
    expect(w).toContain("conversation_id IN (?, ?)");
  });
});

describe("chatConversationParams", () => {
  it("orders params for placeholder expansion", () => {
    expect(chatConversationParams("s1-u2", 9, 1)).toEqual(["s1-u2", 9, 1, 1, 9]);
  });
});

describe("chatConversationParamsMulti", () => {
  it("expands conv id list then legacy quad", () => {
    expect(chatConversationParamsMulti(["a", "b"], 9, 1)).toEqual(["a", "b", 9, 1, 1, 9]);
  });
});
