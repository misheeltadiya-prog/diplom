export type { AiSearchTarget } from "./types";
import type { AiSearchTarget } from "./types";

const FREELANCER_HINTS =
  /freelancer|фриланс|мэргэжилтэн|talent|гүйцэтгэгч|хүн\s*хай|хүмүүс\s*хай|freelance\s*хүн/i;
const JOB_HINTS = /ажил|ажлын\s*зар|зар\s*хай|job\s*post|vacancy|анкет|байршил/i;

export function resolveSearchTarget(prompt: string, requested?: string | null): AiSearchTarget {
  const r = requested?.trim().toLowerCase();
  if (r === "jobs" || r === "freelancers" || r === "both") return r;
  const p = prompt.toLowerCase();
  const wantsFreelancer = FREELANCER_HINTS.test(p);
  const wantsJob = JOB_HINTS.test(p);
  if (wantsFreelancer && wantsJob) return "both";
  if (wantsFreelancer) return "freelancers";
  if (wantsJob) return "jobs";
  return "both";
}
