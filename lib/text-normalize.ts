/** Fix common mojibake where UTF-8 was decoded as latin1 (e.g. "Ð…Ñ…"). */
export function fixMojibake(value: string): string {
  if (!value) return value;
  // Heuristic: only attempt conversion when it looks like latin1-decoded UTF-8.
  if (!/[ÐÑÃÂ]/.test(value)) return value;
  try {
    // Some systems decode bytes as Windows-1252 (turning 0x91 into ‘ etc).
    // Map common CP1252 punctuation back into their byte values before decoding.
    const cp1252ToByte: Record<string, number> = {
      "€": 0x80,
      "‚": 0x82,
      "ƒ": 0x83,
      "„": 0x84,
      "…": 0x85,
      "†": 0x86,
      "‡": 0x87,
      "ˆ": 0x88,
      "‰": 0x89,
      "Š": 0x8a,
      "‹": 0x8b,
      "Œ": 0x8c,
      "Ž": 0x8e,
      "‘": 0x91,
      "’": 0x92,
      "“": 0x93,
      "”": 0x94,
      "•": 0x95,
      "–": 0x96,
      "—": 0x97,
      "˜": 0x98,
      "™": 0x99,
      "š": 0x9a,
      "›": 0x9b,
      "œ": 0x9c,
      "ž": 0x9e,
      "Ÿ": 0x9f,
    };

    const normalized = value.replace(
      /[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g,
      (ch) => String.fromCharCode(cp1252ToByte[ch] ?? ch.charCodeAt(0)),
    );

    // Node runtime: Buffer available in server routes / server components.
    return Buffer.from(normalized, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

export function fixMojibakeMaybe(value: string | null | undefined): string {
  return fixMojibake(String(value ?? ""));
}

