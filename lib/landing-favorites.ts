/** Ажлын зарын хадгалалт (localStorage) — NavBar болон хуудсууд ижил түлхүүр ашиглана */

export const FAVORITE_JOBS_STORAGE_KEY = "cwork-landing-favorite-job-ids";

export const FAVORITES_CHANGED_EVENT = "cwork:favorite-jobs-changed";

export function readFavoriteJobIdsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITE_JOBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function writeFavoriteJobIdsToStorage(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITE_JOBS_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function countSavedJobsFromStorage(): number {
  return readFavoriteJobIdsFromStorage().length;
}

export function toggleFavoriteJobIdInStorage(jobId: string): string[] {
  const prev = readFavoriteJobIdsFromStorage();
  const next = prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId];
  writeFavoriteJobIdsToStorage(next);
  return next;
}
