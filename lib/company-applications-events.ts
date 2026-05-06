/** window дээр сонсогч — компанийн pending өргөдлийн тоо шинэчлэх (nav profile тэмдэгт) */
export const COMPANY_PENDING_APPLICATIONS_EVENT = "cwork-company-pending-applications-changed";

export function dispatchCompanyPendingApplicationsChanged() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(COMPANY_PENDING_APPLICATIONS_EVENT));
}
