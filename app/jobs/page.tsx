import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { IndexLandingPage } from "@/components/index-landing/index-landing-page";

export default async function JobsPage() {
  const currentUser = await getCurrentUser();

  return (
    <Suspense fallback={null}>
      <IndexLandingPage currentUser={currentUser} />
    </Suspense>
  );
}
