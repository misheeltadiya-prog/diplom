import { getCurrentUser } from "@/lib/auth";
import { CompaniesPage } from "@/components/index-landing/companies-page";
import { getMergedCompaniesForDirectory } from "@/lib/company-directory";

export default async function Companies() {
  const currentUser = await getCurrentUser();
  const directoryCompanies = await getMergedCompaniesForDirectory();

  return <CompaniesPage currentUser={currentUser} directoryCompanies={directoryCompanies} />;
}
