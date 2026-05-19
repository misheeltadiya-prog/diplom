/** Ажлын зарын хадгалалт (localStorage) — NavBar болон хуудсууд ижил түлхүүр ашиглана */

export const FAVORITE_JOBS_STORAGE_KEY = "cwork-landing-favorite-job-ids";

export function countSavedJobsFromStorage(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(FAVORITE_JOBS_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return 0;
    return parsed.filter((id): id is string => typeof id === "string").length;
  } catch {
    return 0;
  }
}
