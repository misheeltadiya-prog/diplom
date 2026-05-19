import { describe, expect, it } from "vitest";
import { parseVoiceCommand, parseVoiceCommandBest } from "@/lib/voice-job-commands";

describe("parseVoiceCommand", () => {
  it("opens first job", () => {
    expect(parseVoiceCommand("эхний зар руу ор").type).toBe("open");
    expect(parseVoiceCommand("ehnii zar").type).toBe("open");
  });

  it("navigates next and previous", () => {
    expect(parseVoiceCommand("дараагийн зар").type).toBe("next");
    expect(parseVoiceCommand("өмнөх").type).toBe("previous");
  });

  it("picks best from alternatives", () => {
    const cmd = parseVoiceCommandBest(["random noise", "daraagiin zar", "hello"]);
    expect(cmd.type).toBe("next");
  });

  it("prefers next over open when both appear in candidates", () => {
    const cmd = parseVoiceCommandBest(["эхний зар", "дараагийн зар руу ор"]);
    expect(cmd.type).toBe("next");
  });

  it("parses daraagiin zar ruu or as next", () => {
    expect(parseVoiceCommand("дараагийн зар руу ор").type).toBe("next");
  });
});
