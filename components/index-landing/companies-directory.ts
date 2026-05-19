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
  /** Custom banner from `company_profiles.banner_url` */
  bannerUrl?: string;
  /** Custom logo from `company_profiles.logo_url` */
  logoUrl?: string;
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

/** Google favicon — Clearbit logo API их орчинд DNS/хүртээмжгүй. */
export function companyFaviconUrl(domain: string) {
  const host = domain.trim().replace(/^https?:\/\//i, "").split("/")[0] ?? "";
  if (!host || host === "example.com") return "";
  return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(`https://${host}`)}`;
}

/** @deprecated Clearbit ашиглахгүй — favicon л буцаана */
export function companyLogoUrl(domain: string) {
  return companyFaviconUrl(domain);
}

function isGeneratedPlaceholderAsset(url: string) {
  return /\/uploads\/companies\/\d+\/(logo|banner)\.svg$/i.test(url);
}

/** DB / татсан logo — Clearbit / favicon fallback */
export function resolveCompanyLogoSrc(company: Pick<CompanyBase, "logoUrl" | "userId" | "domain">) {
  const custom = company.logoUrl?.trim();
  if (custom && !isGeneratedPlaceholderAsset(custom)) return custom;

  const domain = company.domain?.trim();
  if (domain && domain !== "example.com") {
    return companyFaviconUrl(domain);
  }

  return "";
}

export function resolveCompanyBannerSrc(company: Pick<CompanyBase, "bannerUrl" | "userId" | "domain">) {
  const custom = company.bannerUrl?.trim();
  if (custom && !isGeneratedPlaceholderAsset(custom)) return custom;

  const domain = company.domain?.trim();
  if (domain && domain !== "example.com") {
    return `https://image.thum.io/get/width/1600/crop/760/noanimate/https://${domain}`;
  }

  return "";
}

type JobCompanyMedia = {
  companyName: string;
  companyDomain?: string | null;
  companyLogoUrl?: string | null;
  companyProfileUserId?: number | null;
  createdByUserId?: number | null;
};

export function resolveJobCompanyLogo(
  job: JobCompanyMedia,
  company?: Pick<CompanyBase, "logoUrl" | "userId" | "domain"> | null,
) {
  return resolveCompanyLogoSrc({
    logoUrl: job.companyLogoUrl ?? company?.logoUrl,
    userId: job.companyProfileUserId ?? company?.userId ?? job.createdByUserId ?? undefined,
    domain: job.companyDomain?.trim() || company?.domain || "",
  });
}

export function resolveJobCompanyBanner(
  job: JobCompanyMedia & { companyBannerUrl?: string | null },
  company?: Pick<CompanyBase, "bannerUrl" | "userId" | "domain"> | null,
) {
  return resolveCompanyBannerSrc({
    bannerUrl: job.companyBannerUrl ?? company?.bannerUrl,
    userId: job.companyProfileUserId ?? company?.userId ?? job.createdByUserId ?? undefined,
    domain: job.companyDomain?.trim() || company?.domain || "",
  });
}

export function findCompanyByName(companyName: string) {
  return companies.find((company) => company.name.toLowerCase() === companyName.toLowerCase()) ?? null;
}
