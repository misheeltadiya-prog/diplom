import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { FreelancersLandingPage } from "@/components/index-landing/freelancers-landing-page";

export default async function Freelancers() {
  const currentUser = await getCurrentUser();
  if (currentUser?.role === "client") {
    redirect("/jobs");
  }

  return <FreelancersLandingPage currentUser={currentUser} />;
}
