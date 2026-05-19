import { describe, expect, it } from "vitest";
import {
  allDmConversationIds,
  chatConversationId,
  parseConversationId,
  peerChatConversationId,
} from "@/lib/chat-conversation";
import { REGISTERED_FREELANCER_SEEKER_ID_OFFSET } from "@/lib/job-seekers";

describe("chatConversationId", () => {
  it("builds stable thread id", () => {
    expect(chatConversationId(12, 5)).toBe("s12-u5");
  });

  it("parses thread id", () => {
    expect(parseConversationId("s12-u5")).toEqual({ seekerId: 12, clientUserId: 5 });
    expect(parseConversationId("bad")).toBeNull();
  });
});

describe("peerChatConversationId", () => {
  it("is symmetric", () => {
    expect(peerChatConversationId(5, 12)).toBe("u5-u12");
    expect(peerChatConversationId(12, 5)).toBe("u5-u12");
  });
});

describe("allDmConversationIds", () => {
  it("merges legacy asym ids for two freelancers", () => {
    const offset = REGISTERED_FREELANCER_SEEKER_ID_OFFSET;
    const u1 = 5;
    const u2 = 12;
    const card2 = offset + u2;
    const card1 = offset + u1;
    const ids = allDmConversationIds({
      seekerProfileId: card2,
      currentUserId: u1,
      linkedFreelancerUserId: u2,
      otherUserId: null,
    });
    expect(ids).toContain(`u${u1}-u${u2}`);
    expect(ids).toContain(`s${card2}-u${u1}`);
    expect(ids).toContain(`s${card1}-u${u2}`);
  });
});
