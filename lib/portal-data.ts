import { getDb } from "@/lib/db";
import { listJobs } from "@/lib/jobs-store";

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
    fullName: row.full_name,
    roleTitle: row.role_title,
    email: row.email,
    phone: row.phone,
    skills: row.skills,
    bio: row.bio,
    createdAt: row.created_at.toISOString(),
    createdByName: row.created_by_name,
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
  } catch {
    return [];
  }
}
