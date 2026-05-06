import { getCurrentUser } from "@/lib/auth";
import { FreelancersLandingPage } from "@/components/index-landing/freelancers-landing-page";

export default async function Freelancers() {
  const currentUser = await getCurrentUser();

  return <FreelancersLandingPage currentUser={currentUser} />;
}
