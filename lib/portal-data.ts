import { getDb } from "@/lib/db";
import { listJobs } from "@/lib/jobs-store";
import { fixMojibakeMaybe } from "@/lib/text-normalize";

export type EmployeeRecord = {
  id: number;
  fullName: string;
  roleTitle: string;
  email: string;
  phone: string;
  skills: string;
  bio: string;
  createdAt: string;
  createdByName: string | null;
};

export type JobRecord = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
  createdAt: string;
  createdByName: string | null;
  createdByUserId: number | null;
};

type EmployeeRow = {
  id: number;
  full_name: string;
  role_title: string;
  email: string;
  phone: string;
  skills: string;
  bio: string;
  created_at: Date;
  created_by_name: string | null;
};

function mapEmployee(row: EmployeeRow): EmployeeRecord {
  return {
    id: row.id,
    fullName: fixMojibakeMaybe(row.full_name),
    roleTitle: fixMojibakeMaybe(row.role_title),
    email: fixMojibakeMaybe(row.email),
    phone: fixMojibakeMaybe(row.phone),
    skills: fixMojibakeMaybe(row.skills),
    bio: fixMojibakeMaybe(row.bio),
    createdAt: row.created_at.toISOString(),
    createdByName: row.created_by_name ? fixMojibakeMaybe(row.created_by_name) : null,
  };
}

export async function getEmployees() {
  try {
    const db = getDb();
    const [rows] = (await db.query(
      `
        SELECT
          e.id,
          e.full_name,
          e.role_title,
          e.email,
          e.phone,
          e.skills,
          e.bio,
          e.created_at,
          u.full_name AS created_by_name
        FROM employees e
        LEFT JOIN users u ON u.id = e.created_by
        ORDER BY e.created_at DESC
      `,
    )) as [EmployeeRow[], unknown];

    return rows.map(mapEmployee);
  } catch {
    return [];
  }
}

export async function getJobPosts() {
  try {
    return await listJobs();
  } catch (error) {
    console.error("[getJobPosts] listJobs failed:", error);
    return [];
  }
}
