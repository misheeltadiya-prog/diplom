import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { IndexLandingPage } from "@/components/index-landing/index-landing-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JobsPage() {
  const currentUser = await getCurrentUser();

  return (
    <Suspense fallback={null}>
      <IndexLandingPage currentUser={currentUser} />
    </Suspense>
  );
}
