import { normalizeJobEmploymentType } from "@/lib/job-employment-type";

export type JobTabCounts = {
  all: number;
  remote: number;
  fullTime: number;
  partTime: number;
  contract: number;
};

export const EMPTY_JOB_TAB_COUNTS: JobTabCounts = {
  all: 0,
  remote: 0,
  fullTime: 0,
  partTime: 0,
  contract: 0,
};

/** Database-ийн заруудаас tab bar-ийн тоог (ажлын төрлөөр) тооцно. */
export function computeJobTabCounts(jobs: { employmentType: string }[]): JobTabCounts {
  const counts: JobTabCounts = { ...EMPTY_JOB_TAB_COUNTS };

  for (const job of jobs) {
    counts.all += 1;
    const schedule = normalizeJobEmploymentType(job.employmentType);
    if (schedule === "Remote") {
      counts.remote += 1;
    } else if (schedule === "Хагас цаг") {
      counts.partTime += 1;
    } else if (schedule === "Гэрээт") {
      counts.contract += 1;
    } else {
      counts.fullTime += 1;
    }
  }

  return counts;
}
