/**
 * Job salary strings (MN): "2.000.000", "3 сая ₮", "500k", ranges, etc.
 */
export function parseSalaryAmount(rawSalary: string): number {
  const raw = rawSalary.trim();
  if (!raw) {
    return 0;
  }

  const normalized = raw.toLowerCase().replace(/\s+/g, " ");

  const sayMatch = normalized.match(/([\d.,]+)\s*сая/);
  if (sayMatch) {
    const base = parseNumericToken(sayMatch[1]);
    return Number.isFinite(base) ? base * 1_000_000 : 0;
  }

  const kMatch = normalized.match(/([\d.,]+)\s*k\b/);
  if (kMatch) {
    const base = parseNumericToken(kMatch[1]);
    return Number.isFinite(base) ? base * 1_000 : 0;
  }

  const tokens = raw.match(/[\d][\d.,]*/g) ?? [];
  const values = tokens.map(parseNumericToken).filter((n) => Number.isFinite(n) && n > 0);
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseNumericToken(token: string): number {
  let s = token.trim().replace(/\s/g, "");
  if (!s) {
    return NaN;
  }

  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) {
    return Number(s.replace(/[.,]/g, ""));
  }

  const dotParts = s.split(".");
  if (dotParts.length > 2 && dotParts.every((part) => /^\d+$/.test(part))) {
    return Number(s.replace(/\./g, ""));
  }

  const commaParts = s.split(",");
  if (commaParts.length > 2 && commaParts.every((part) => /^\d+$/.test(part))) {
    return Number(s.replace(/,/g, ""));
  }

  if (commaParts.length === 2 && commaParts[1].length <= 2) {
    return Number(`${commaParts[0].replace(/\./g, "")}.${commaParts[1]}`);
  }

  if (dotParts.length === 2 && dotParts[1].length <= 2) {
    return Number(s);
  }

  s = s.replace(/,/g, "");
  if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length > 2) {
      return Number(parts.join(""));
    }
  }

  const parsed = Number(s);
  return Number.isFinite(parsed) ? parsed : NaN;
}
