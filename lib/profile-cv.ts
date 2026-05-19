import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { fixMojibakeMaybe } from "@/lib/text-normalize";

export type CvProfile = {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  headline: string;
  location: string;
  professionalSummary: string;
  coreSkills: string;
  workExperience: string;
  education: string;
  certifications: string;
  languages: string;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  preferredRole: string;
  salaryExpectation: string;
  availability: string;
  achievements: string;
  updatedAt: string | null;
};

type CvRow = {
  user_id: number;
  headline: string | null;
  location: string | null;
  professional_summary: string | null;
  core_skills: string | null;
  work_experience: string | null;
  education: string | null;
  certifications: string | null;
  languages: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  preferred_role: string | null;
  salary_expectation: string | null;
  availability: string | null;
  achievements: string | null;
  updated_at: Date | null;
  full_name: string;
  email: string;
  phone: string;
};

export const CV_COMPLETION_FIELDS = [
  "fullName",
  "email",
  "phone",
  "headline",
  "location",
  "professionalSummary",
  "coreSkills",
  "workExperience",
  "education",
  "languages",
  "portfolioUrl",
  "preferredRole",
  "availability",
] as const;

type CvCompletionField = (typeof CV_COMPLETION_FIELDS)[number];

const EMPTY_CV_VALUES = {
  headline: "",
  location: "",
  professionalSummary: "",
  coreSkills: "",
  workExperience: "",
  education: "",
  certifications: "",
  languages: "",
  portfolioUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  preferredRole: "",
  salaryExpectation: "",
  availability: "",
  achievements: "",
};

async function ensureProfileCvTable() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS profile_cvs (
      user_id BIGINT UNSIGNED NOT NULL,
      headline VARCHAR(180) NOT NULL DEFAULT '',
      location VARCHAR(180) NOT NULL DEFAULT '',
      professional_summary TEXT NOT NULL,
      core_skills TEXT NOT NULL,
      work_experience TEXT NOT NULL,
      education TEXT NOT NULL,
      certifications TEXT NOT NULL,
      languages TEXT NOT NULL,
      portfolio_url VARCHAR(255) NOT NULL DEFAULT '',
      linkedin_url VARCHAR(255) NOT NULL DEFAULT '',
      github_url VARCHAR(255) NOT NULL DEFAULT '',
      preferred_role VARCHAR(180) NOT NULL DEFAULT '',
      salary_expectation VARCHAR(120) NOT NULL DEFAULT '',
      availability VARCHAR(120) NOT NULL DEFAULT '',
      achievements TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id),
      CONSTRAINT profile_cvs_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    )
  `);
}

function toText(value: string | null | undefined) {
  return fixMojibakeMaybe(value).trim();
}

function mapProfile(row: CvRow): CvProfile {
  return {
    userId: row.user_id,
    fullName: fixMojibakeMaybe(row.full_name),
    email: fixMojibakeMaybe(row.email),
    phone: fixMojibakeMaybe(row.phone),
    headline: toText(row.headline),
    location: toText(row.location),
    professionalSummary: toText(row.professional_summary),
    coreSkills: toText(row.core_skills),
    workExperience: toText(row.work_experience),
    education: toText(row.education),
    certifications: toText(row.certifications),
    languages: toText(row.languages),
    portfolioUrl: toText(row.portfolio_url),
    linkedinUrl: toText(row.linkedin_url),
    githubUrl: toText(row.github_url),
    preferredRole: toText(row.preferred_role),
    salaryExpectation: toText(row.salary_expectation),
    availability: toText(row.availability),
    achievements: toText(row.achievements),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

export async function getCvProfileByUserId(userId: number) {
  await ensureProfileCvTable();
  const db = getDb();

  const [rows] = (await db.execute(
    `
      SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        c.headline,
        c.location,
        c.professional_summary,
        c.core_skills,
        c.work_experience,
        c.education,
        c.certifications,
        c.languages,
        c.portfolio_url,
        c.linkedin_url,
        c.github_url,
        c.preferred_role,
        c.salary_expectation,
        c.availability,
        c.achievements,
        c.updated_at
      FROM users u
      LEFT JOIN profile_cvs c ON c.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId],
  )) as [CvRow[], unknown];

  if (rows.length === 0) {
    return null;
  }

  return mapProfile(rows[0]);
}

export async function getCvProfileOrDefault(user: {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
}) {
  const profile = await getCvProfileByUserId(user.id);

  if (profile) {
    return profile;
  }

  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    ...EMPTY_CV_VALUES,
    updatedAt: null,
  } satisfies CvProfile;
}

export function calculateCvCompletion(profile: CvProfile) {
  const completedCount = CV_COMPLETION_FIELDS.filter((field) => {
    const value = profile[field as CvCompletionField];
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  }).length;

  return Math.round((completedCount / CV_COMPLETION_FIELDS.length) * 100);
}

/** CV хадгалахад freelancers жагсаалтын мөр (freelancer_profiles) дээрх талбаруудыг синк хийнэ. */
async function syncFreelancerDirectoryFromCv(userId: number, payload: Omit<CvProfile, "userId" | "updatedAt">) {
  try {
    const db = getDb();
    const [roleRows] = await db.execute(`SELECT role FROM users WHERE id = ? LIMIT 1`, [userId]);
    const role = (roleRows as RowDataPacket[])[0]?.role;
    if (role !== "freelancer") return;

    const [fpRows] = await db.execute(`SELECT user_id FROM freelancer_profiles WHERE user_id = ? LIMIT 1`, [userId]);
    if (!(fpRows as RowDataPacket[])[0]) return;

    const roleTitle = payload.preferredRole?.trim() || payload.headline?.trim() || "";
    const shortDesc = payload.headline?.trim() || "";
    const detail = payload.professionalSummary?.trim() || "";
    const price = payload.salaryExpectation?.trim() || "";
    const skillsArr = payload.coreSkills
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const skillsJson = JSON.stringify(skillsArr);

    const sets: string[] = [];
    const vals: (string | number)[] = [];
    if (roleTitle) {
      sets.push("role_title = ?");
      vals.push(roleTitle);
    }
    if (shortDesc) {
      sets.push("short_description = ?");
      vals.push(shortDesc);
    }
    if (detail) {
      sets.push("detail_description = ?");
      vals.push(detail);
    }
    if (skillsArr.length) {
      sets.push("skills_json = ?");
      vals.push(skillsJson);
    }
    if (price) {
      sets.push("price_label = ?");
      vals.push(price);
    }
    if (!sets.length) return;

    vals.push(userId);
    await db.execute(
      `UPDATE freelancer_profiles SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = ?`,
      vals,
    );
  } catch {
    /* CV хадгалалт амжилттай үлдэнэ */
  }
}

export async function saveCvProfile(
  userId: number,
  payload: Omit<CvProfile, "userId" | "updatedAt">,
) {
  await ensureProfileCvTable();
  const db = getDb();

  await db.execute(
    `
      UPDATE users
      SET
        full_name = ?,
        email = ?,
        phone = ?
      WHERE id = ?
    `,
    [payload.fullName.trim(), payload.email.trim().toLowerCase(), payload.phone.trim(), userId],
  );

  await db.execute(
    `
      INSERT INTO profile_cvs (
        user_id,
        headline,
        location,
        professional_summary,
        core_skills,
        work_experience,
        education,
        certifications,
        languages,
        portfolio_url,
        linkedin_url,
        github_url,
        preferred_role,
        salary_expectation,
        availability,
        achievements
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        headline = VALUES(headline),
        location = VALUES(location),
        professional_summary = VALUES(professional_summary),
        core_skills = VALUES(core_skills),
        work_experience = VALUES(work_experience),
        education = VALUES(education),
        certifications = VALUES(certifications),
        languages = VALUES(languages),
        portfolio_url = VALUES(portfolio_url),
        linkedin_url = VALUES(linkedin_url),
        github_url = VALUES(github_url),
        preferred_role = VALUES(preferred_role),
        salary_expectation = VALUES(salary_expectation),
        availability = VALUES(availability),
        achievements = VALUES(achievements)
    `,
    [
      userId,
      payload.headline.trim(),
      payload.location.trim(),
      payload.professionalSummary.trim(),
      payload.coreSkills.trim(),
      payload.workExperience.trim(),
      payload.education.trim(),
      payload.certifications.trim(),
      payload.languages.trim(),
      payload.portfolioUrl.trim(),
      payload.linkedinUrl.trim(),
      payload.githubUrl.trim(),
      payload.preferredRole.trim(),
      payload.salaryExpectation.trim(),
      payload.availability.trim(),
      payload.achievements.trim(),
    ],
  );

  await syncFreelancerDirectoryFromCv(userId, payload);

  return getCvProfileByUserId(userId);
}

export async function countCvProfiles() {
  await ensureProfileCvTable();
  const db = getDb();
  const [rows] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM profile_cvs");
  const total = rows[0] ? Number((rows[0] as RowDataPacket & { total?: number }).total ?? 0) : 0;
  return Number.isFinite(total) ? total : 0;
}
