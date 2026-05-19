import { CWorkMarketingSite } from "@/components/cwork-marketing-site";
import { getMergedCompaniesForDirectory } from "@/lib/company-directory";

export default async function Home() {
  const companies = await getMergedCompaniesForDirectory();
  const marqueeCompanies = companies.map((c) => ({
    name: c.name,
    domain: c.domain,
    userId: c.userId,
    logoUrl: c.logoUrl,
  }));
  return <CWorkMarketingSite marqueeCompanies={marqueeCompanies} />;
}
