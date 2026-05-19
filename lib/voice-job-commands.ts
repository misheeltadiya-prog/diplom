export type VoiceJobCommand =
  | { type: "open"; index: number }
  | { type: "next" }
  | { type: "previous" }
  | { type: "repeat" }
  | { type: "stop" }
  | { type: "close" }
  | { type: "unknown" };

const VOICE_ORDINALS: Array<{ index: number; words: string[] }> = [
  { index: 0, words: ["эхний", "эхлээд", "нэгдүгээр", "нэг дэх", "нэг", "1", "first", "ehnii", "ehni", "ehleed"] },
  { index: 1, words: ["хоёр дахь", "хоёрдох", "хоёрдугаар", "хоёр", "2", "second", "hoyor", "hoyrdoh"] },
  { index: 2, words: ["гурав дахь", "гуравдугаар", "гурав", "3", "third", "gurav", "gurwan"] },
  { index: 3, words: ["дөрөв дэх", "дөрөвдүгээр", "дөрөв", "4", "fourth", "duruv", "dorov", "dorow"] },
  { index: 4, words: ["тав дахь", "тавдугаар", "тав", "5", "fifth", "tav"] },
  { index: 5, words: ["зургаа дахь", "зургаадугаар", "зургаа", "6", "sixth", "zurgaa"] },
  { index: 6, words: ["долоо дахь", "долдугаар", "долоо", "7", "seventh", "doloo"] },
  { index: 7, words: ["найм дахь", "наймдугаар", "найм", "8", "eighth", "naim"] },
  { index: 8, words: ["ес дэх", "есдүгээр", "ес", "9", "ninth", "yos", "es"] },
  { index: 9, words: ["арав дахь", "аравдугаар", "арав", "10", "tenth", "arav"] },
];

export function normalizeVoiceText(raw: string) {
  return raw
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[.,!?;:()[\]{}"'«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasWord(command: string, pattern: RegExp) {
  return pattern.test(` ${command} `);
}

export function extractVoiceOrdinal(command: string): number | null {
  for (const ordinal of VOICE_ORDINALS) {
    if (ordinal.words.some((word) => {
      const w = normalizeVoiceText(word);
      return w && (command === w || command.includes(` ${w} `) || command.startsWith(`${w} `) || command.endsWith(` ${w}`));
    })) {
      return ordinal.index;
    }
  }
  return null;
}

export function parseVoiceCommand(raw: string): VoiceJobCommand {
  const command = normalizeVoiceText(raw);
  if (!command) return { type: "unknown" };

  if (hasWord(command, /(?:^|\s)(зогсоо|зогсо|болих|унтраа|унтра|stop|pause)(?:\s|$)/)) {
    return { type: "stop" };
  }

  if (hasWord(command, /(?:^|\s)(хаах|хаа|хах|гарах|буцах|close|exit|esc)(?:\s|$)/)) {
    return { type: "close" };
  }

  if (
    hasWord(command, /(?:^|\s)(дараагийн|дараах|дараа|дараагы|дараагийнх|next|daraa|daraagiin|daraah|daraagiinh)(?:\s|$)/) ||
    command === "daraa" ||
    /дараагийн\s+зар/.test(command) ||
    /daraagiin\s+zar/.test(command)
  ) {
    return { type: "next" };
  }

  if (hasWord(command, /(?:^|\s)(өмнөх|өмнө|умнх|умну|previous|prev|umnuh|omnoh|butsa)(?:\s|$)/)) {
    return { type: "previous" };
  }

  if (hasWord(command, /(?:^|\s)(дахин|дахиад|давта|repeat)(?:\s|$)/)) {
    const index = extractVoiceOrdinal(command);
    return index === null ? { type: "repeat" } : { type: "open", index };
  }

  if (hasWord(command, /(?:^|\s)(унш|унша|дэлгэрэнгүй|delgerengui|unsh|read)(?:\s|$)/)) {
    const index = extractVoiceOrdinal(command);
    return index === null ? { type: "repeat" } : { type: "open", index };
  }

  const index = extractVoiceOrdinal(command);
  if (index !== null) {
    if (hasWord(command, /(?:^|\s)(зар|ажил|job|zar|ajil|нээ|нээгээд|ор|орно|open|nee|luu|ruu|руу)(?:\s|$)/)) {
      return { type: "open", index };
    }
    if (command.length <= 32) {
      return { type: "open", index };
    }
  }

  if (hasWord(command, /(?:^|\s)(нээ|нээгээд|open|эхлэ|ehle)(?:\s|$)/) && index === null) {
    return { type: "open", index: 0 };
  }

  return { type: "unknown" };
}

function voiceCommandPriority(type: VoiceJobCommand["type"]): number {
  switch (type) {
    case "next":
    case "previous":
      return 100;
    case "stop":
    case "close":
      return 90;
    case "repeat":
      return 80;
    case "open":
      return 40;
    default:
      return 0;
  }
}

/** Олон transcript / хувилбараас хамгийн сайн команд сонгоно */
export function parseVoiceCommandBest(candidates: string[]): VoiceJobCommand {
  const cleaned = candidates.map((c) => c.trim()).filter(Boolean);
  if (cleaned.length === 0) return { type: "unknown" };

  let best: VoiceJobCommand = { type: "unknown" };
  let bestScore = -1;

  for (const raw of cleaned) {
    const cmd = parseVoiceCommand(raw);
    if (cmd.type === "unknown") continue;
    const score = voiceCommandPriority(cmd.type) + raw.length;
    if (score > bestScore) {
      bestScore = score;
      best = cmd;
    }
  }

  return bestScore >= 0 ? best : parseVoiceCommand(cleaned[0]);
}

export const VOICE_COMMAND_HINTS = [
  "эхний зар руу ор",
  "дараагийн зар",
  "өмнөх зар",
  "дахин унш",
  "зогсоо",
  "хаах",
] as const;
