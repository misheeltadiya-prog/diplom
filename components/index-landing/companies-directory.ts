export type CompanyBase = {
  name: string;
  domain: string;
  industry: string;
  city: string;
  /** Registered company profile description from MySQL */
  description?: string;
  isRegistered?: boolean;
  userId?: number;
  /** Saved raw website URL */
  websiteRaw?: string;
  seedJobTitle?: string;
  seedJobDescription?: string;
  seedJobSalary?: string;
  seedJobEmploymentType?: string;
};

/** Бүх компаниуд MySQL `company_profiles`-аас ирнэ — статик seed жагсаалт ашиглахгүй. */
export const companies: CompanyBase[] = [];

export const avatarToneClasses = [
  "companyAvatarToneA",
  "companyAvatarToneB",
  "companyAvatarToneC",
  "companyAvatarToneD",
] as const;

export function companyInitials(name: string) {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "CO";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function companyLogoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?sz=128&domain_url=https://${domain}`;
}

export function findCompanyByName(companyName: string) {
  return companies.find((company) => company.name.toLowerCase() === companyName.toLowerCase()) ?? null;
}
