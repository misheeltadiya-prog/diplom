export type CompanyBase = {
  name: string;
  domain: string;
  industry: string;
  city: string;
};

export const companies: CompanyBase[] = [
  { name: "AND Global", domain: "and.global", industry: "Fintech & Venture", city: "Ulaanbaatar" },
  { name: "Infinite Solutions", domain: "infinite.mn", industry: "Financial Technology", city: "Ulaanbaatar" },
  { name: "Interactive LLC", domain: "interactive.mn", industry: "Enterprise Software", city: "Ulaanbaatar" },
  { name: "GrapeCity Mongolia", domain: "grapecity.mn", industry: "Core Banking Solutions", city: "Ulaanbaatar" },
  { name: "Mongol iD", domain: "mongol.id", industry: "Digital Identity", city: "Ulaanbaatar" },
  { name: "Smart Logic", domain: "smartlogic.mn", industry: "ERP & Business Systems", city: "Ulaanbaatar" },
  { name: "Able Soft", domain: "web.able.mn", industry: "Workflow Platforms", city: "Ulaanbaatar" },
  { name: "CallPro", domain: "callpro.mn", industry: "Communication Platform", city: "Ulaanbaatar" },
  { name: "IT Zone", domain: "itzone.mn", industry: "Enterprise IT", city: "Ulaanbaatar" },
  { name: "Unitel Group", domain: "unitel.mn", industry: "Telecommunications", city: "Ulaanbaatar" },
  { name: "Mobicom Corporation", domain: "mobicom.mn", industry: "Telecommunications", city: "Ulaanbaatar" },
  { name: "Skytel", domain: "skytel.mn", industry: "Telecommunications", city: "Ulaanbaatar" },
  { name: "Datacom LLC", domain: "datacom.mn", industry: "Internet & Domain Services", city: "Ulaanbaatar" },
  { name: "Ard Financial Group", domain: "ardholdings.com", industry: "Fintech Group", city: "Ulaanbaatar" },
  { name: "LendMN", domain: "lend.mn", industry: "Digital Lending", city: "Ulaanbaatar" },
  { name: "QPay", domain: "qr.qpay.mn", industry: "Payment Gateway", city: "Ulaanbaatar" },
  { name: "HiPay", domain: "hipay.mn", industry: "Payment Technology", city: "Ulaanbaatar" },
  { name: "Erxes Inc", domain: "erxes.io", industry: "Customer Experience Platform", city: "Ulaanbaatar" },
  { name: "Fibo Cloud", domain: "fibo.edu.mn", industry: "Cloud Infrastructure", city: "Ulaanbaatar" },
  { name: "Mezorn LLC", domain: "mezorn.com", industry: "Digital Product Studio", city: "Ulaanbaatar" },
];

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

