import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { CompaniesPage } from "@/components/index-landing/companies-page";
import { getMergedCompaniesForDirectory } from "@/lib/company-directory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Companies() {
  const currentUser = await getCurrentUser();
  const directoryCompanies = await getMergedCompaniesForDirectory();

  return (
    <Suspense fallback={null}>
      <CompaniesPage currentUser={currentUser} directoryCompanies={directoryCompanies} />
    </Suspense>
  );
}
