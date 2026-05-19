/** Ажлын зарын төрөл — tab/filter-т нэг мөр болгоно. */
export type NormalizedJobEmploymentType = "Remote" | "Бүтэн цаг" | "Хагас цаг" | "Гэрээт";

export function normalizeJobEmploymentType(value: string): NormalizedJobEmploymentType {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized.includes("remote") || normalized === "алсаас") {
    return "Remote";
  }

  if (normalized.includes("хагас") || normalized.includes("part")) {
    return "Хагас цаг";
  }

  if (normalized.includes("гэрээт") || normalized.includes("contract") || normalized.includes("freelance")) {
    return "Гэрээт";
  }

  if (
    normalized.includes("бүтэн") ||
    normalized.includes("full") ||
    normalized === "open" ||
    normalized === "нээлттэй"
  ) {
    return "Бүтэн цаг";
  }

  return "Бүтэн цаг";
}
