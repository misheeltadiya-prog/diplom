import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmployees, getJobPosts } from "@/lib/portal-data";
import { DashboardPage } from "@/components/dashboard-page";

export default async function Dashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [employees, jobs] = await Promise.all([getEmployees(), getJobPosts()]);

  return <DashboardPage currentUser={user} employees={employees} jobs={jobs} />;
}
