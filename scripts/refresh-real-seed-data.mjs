import { randomBytes, scryptSync } from "crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const companySeeds = [
  {
    name: "AND Global",
    email: "seed.company1@cwork.local",
    phone: "88100001",
    industry: "Fintech & Venture",
    city: "Ulaanbaatar",
    website: "https://and.global",
    description: "Regional fintech venture builder focused on digital financial products, growth, and partnerships.",
    jobTitle: "Senior Product Designer",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "5.2 ÑÐ°Ñ â‚®",
    jobDescription: "Own mobile onboarding, wallet flows, and partner dashboard UX for a fast-moving fintech product team.",
  },
  {
    name: "Infinite Solutions",
    email: "seed.company2@cwork.local",
    phone: "88100002",
    industry: "Financial Technology",
    city: "Ulaanbaatar",
    website: "https://infinite.mn",
    description: "Enterprise fintech integrator delivering payment, lending, and banking workflow solutions.",
    jobTitle: "Core Banking Integration Engineer",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "4.8 ÑÐ°Ñ â‚®",
    jobDescription: "Build and maintain service integrations between internal banking systems, payment gateways, and partner APIs.",
  },
  {
    name: "Interactive LLC",
    email: "seed.company3@cwork.local",
    phone: "88100003",
    industry: "Enterprise Software",
    city: "Ulaanbaatar",
    website: "https://interactive.mn",
    description: "Large-scale enterprise software vendor serving government, banking, and private-sector operations.",
    jobTitle: "Enterprise Software Project Manager",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "5.5 ÑÐ°Ñ â‚®",
    jobDescription: "Coordinate delivery across analysts, developers, and client stakeholders for multi-team enterprise rollouts.",
  },
  {
    name: "GrapeCity Mongolia",
    email: "seed.company4@cwork.local",
    phone: "88100004",
    industry: "Core Banking Solutions",
    city: "Ulaanbaatar",
    website: "https://grapecity.mn",
    description: "Banking technology provider focused on transaction processing, integration, and reporting platforms.",
    jobTitle: "Banking Systems Business Analyst",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "4.6 ÑÐ°Ñ â‚®",
    jobDescription: "Translate branch, loan, and operations requirements into structured delivery plans for banking software teams.",
  },
  {
    name: "Mongol iD",
    email: "seed.company5@cwork.local",
    phone: "88100005",
    industry: "Digital Identity",
    city: "Ulaanbaatar",
    website: "https://mongol.id",
    description: "Digital identity and trust services company working on secure login, KYC, and citizen-facing products.",
    jobTitle: "Identity Platform Backend Engineer",
    employmentType: "Remote",
    salary: "5.0 ÑÐ°Ñ â‚®",
    jobDescription: "Design secure APIs and verification workflows for digital identity, consent, and authentication products.",
  },
  {
    name: "Smart Logic",
    email: "seed.company6@cwork.local",
    phone: "88100006",
    industry: "ERP & Business Systems",
    city: "Ulaanbaatar",
    website: "https://smartlogic.mn",
    description: "ERP implementation partner supporting accounting, operations, and internal process automation.",
    jobTitle: "ERP Implementation Consultant",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "4.1 ÑÐ°Ñ â‚®",
    jobDescription: "Lead requirements workshops and map client finance and operations workflows into ERP modules.",
  },
  {
    name: "Able Soft",
    email: "seed.company7@cwork.local",
    phone: "88100007",
    industry: "Workflow Platforms",
    city: "Ulaanbaatar",
    website: "https://web.able.mn",
    description: "Business process and workflow software team building practical tools for internal operations and service teams.",
    jobTitle: "Workflow Automation Engineer",
    employmentType: "Remote",
    salary: "3.9 ÑÐ°Ñ â‚®",
    jobDescription: "Create approval, notification, and document workflows that reduce manual operations across client teams.",
  },
  {
    name: "CallPro",
    email: "seed.company8@cwork.local",
    phone: "88100008",
    industry: "Communication Platform",
    city: "Ulaanbaatar",
    website: "https://callpro.mn",
    description: "Contact center and communication platform provider focused on customer support operations and automation.",
    jobTitle: "Customer Support Platform Specialist",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "3.4 ÑÐ°Ñ â‚®",
    jobDescription: "Improve agent workflows, reporting, and platform configuration for contact center operations teams.",
  },
  {
    name: "IT Zone",
    email: "seed.company9@cwork.local",
    phone: "88100009",
    industry: "Enterprise IT",
    city: "Ulaanbaatar",
    website: "https://itzone.mn",
    description: "Enterprise IT services firm delivering infrastructure, cloud, licensing, and business technology support.",
    jobTitle: "Cloud Solutions Architect",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "5.7 ÑÐ°Ñ â‚®",
    jobDescription: "Plan migration paths and reference architectures for enterprise clients moving workloads to modern cloud stacks.",
  },
  {
    name: "Unitel Group",
    email: "seed.company10@cwork.local",
    phone: "88100010",
    industry: "Telecommunications",
    city: "Ulaanbaatar",
    website: "https://unitel.mn",
    description: "Major telecom operator with digital products spanning mobile, data, entertainment, and customer experience.",
    jobTitle: "Data Platform Analyst",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "4.3 ÑÐ°Ñ â‚®",
    jobDescription: "Turn telecom usage and customer behavior data into dashboards and decision-ready reporting for product teams.",
  },
  {
    name: "Mobicom Corporation",
    email: "seed.company11@cwork.local",
    phone: "88100011",
    industry: "Telecommunications",
    city: "Ulaanbaatar",
    website: "https://mobicom.mn",
    description: "Telecommunications and digital services company with nationwide consumer and enterprise offerings.",
    jobTitle: "CRM Product Owner",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "5.1 ÑÐ°Ñ â‚®",
    jobDescription: "Drive roadmap decisions for subscriber communications, retention journeys, and customer operations tooling.",
  },
  {
    name: "Skytel",
    email: "seed.company12@cwork.local",
    phone: "88100012",
    industry: "Telecommunications",
    city: "Ulaanbaatar",
    website: "https://skytel.mn",
    description: "Communications provider supporting network operations, subscriber systems, and digital service delivery.",
    jobTitle: "Network Operations Engineer",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "4.0 ÑÐ°Ñ â‚®",
    jobDescription: "Monitor service health, improve network tooling, and coordinate rapid response for telecom incidents.",
  },
  {
    name: "Datacom LLC",
    email: "seed.company13@cwork.local",
    phone: "88100013",
    industry: "Internet & Domain Services",
    city: "Ulaanbaatar",
    website: "https://datacom.mn",
    description: "Internet, hosting, and domain services company supporting digital infrastructure for businesses in Mongolia.",
    jobTitle: "Platform Reliability Engineer",
    employmentType: "Remote",
    salary: "4.9 ÑÐ°Ñ â‚®",
    jobDescription: "Strengthen uptime, DNS tooling, monitoring, and deployment reliability across shared infrastructure services.",
  },
  {
    name: "Ard Financial Group",
    email: "seed.company14@cwork.local",
    phone: "88100014",
    industry: "Fintech Group",
    city: "Ulaanbaatar",
    website: "https://ardholdings.com",
    description: "Diversified financial group with digital products across payments, investing, lending, and customer experience.",
    jobTitle: "Digital Product Marketing Lead",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "5.0 ÑÐ°Ñ â‚®",
    jobDescription: "Plan acquisition and lifecycle campaigns across multiple financial products with measurable growth targets.",
  },
  {
    name: "LendMN",
    email: "seed.company15@cwork.local",
    phone: "88100015",
    industry: "Digital Lending",
    city: "Ulaanbaatar",
    website: "https://lend.mn",
    description: "Digital lending platform focused on risk, scoring, collections, and fast borrower experiences.",
    jobTitle: "Credit Scoring Data Analyst",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "4.4 ÑÐ°Ñ â‚®",
    jobDescription: "Work with lending, product, and risk teams to improve scorecards and borrower behavior analysis.",
  },
  {
    name: "QPay",
    email: "seed.company16@cwork.local",
    phone: "88100016",
    industry: "Payment Gateway",
    city: "Ulaanbaatar",
    website: "https://qr.qpay.mn",
    description: "High-scale payment gateway supporting merchant payments, QR flows, and transaction integrations.",
    jobTitle: "Payment Integration Engineer",
    employmentType: "Remote",
    salary: "4.7 ÑÐ°Ñ â‚®",
    jobDescription: "Support merchant onboarding and implement stable payment and settlement integrations for partners.",
  },
  {
    name: "HiPay",
    email: "seed.company17@cwork.local",
    phone: "88100017",
    industry: "Payment Technology",
    city: "Ulaanbaatar",
    website: "https://hipay.mn",
    description: "Payment technology company focused on transaction tooling, merchant systems, and operational monitoring.",
    jobTitle: "Fraud Monitoring Analyst",
    employmentType: "Ð‘Ò¯Ñ‚ÑÐ½ Ñ†Ð°Ð³",
    salary: "3.8 ÑÐ°Ñ â‚®",
    jobDescription: "Review payment patterns, build alert logic, and coordinate with operations on transaction risk signals.",
  },
  {
    name: "Erxes Inc",
    email: "seed.company18@cwork.local",
    phone: "88100018",
    industry: "Customer Experience Platform",
    city: "Ulaanbaatar",
    website: "https://erxes.io",
    description: "Customer experience platform team building CRM, engagement, and operations products for modern businesses.",
    jobTitle: "Frontend React Developer",
    employmentType: "Remote",
    salary: "4.6 ÑÐ°Ñ â‚®",
    jobDescription: "Ship polished CRM and inbox experiences with React, TypeScript, and shared design system components.",
  },
  {
    name: "Fibo Cloud",
    email: "seed.company19@cwork.local",
    phone: "88100019",
    industry: "Cloud Infrastructure",
    city: "Ulaanbaatar",
    website: "https://fibo.edu.mn",
    description: "Infrastructure and cloud operations team supporting hosting, deployments, and managed enterprise workloads.",
    jobTitle: "DevOps Engineer",
    employmentType: "Remote",
    salary: "4.8 ÑÐ°Ñ â‚®",
    jobDescription: "Improve CI/CD, environment consistency, and monitoring for production systems running across cloud services.",
  },
  {
    name: "Mezorn LLC",
    email: "seed.company20@cwork.local",
    phone: "88100020",
    industry: "Digital Product Studio",
    city: "Ulaanbaatar",
    website: "https://mezorn.com",
    description: "Product studio creating digital experiences, platforms, and interface systems for ambitious organizations.",
    jobTitle: "Product UI/UX Designer",
    employmentType: "Remote",
    salary: "4.2 ÑÐ°Ñ â‚®",
    jobDescription: "Shape product direction through research, wireframes, and high-fidelity interfaces for new digital launches.",
  },
];

function parseEnv(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

async function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const raw = await fs.readFile(path.join(root, name), "utf8");
      const parsed = parseEnv(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      /* ignore */
    }
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

await loadEnv();

const seedPassword = (process.argv[2] || "Cwork#2026").trim();
const seedPasswordHash = hashPassword(seedPassword);

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "zeel_platform",
  charset: "utf8mb4",
});

let updatedCompanies = 0;
let updatedFreelancers = 0;
let insertedJobs = 0;

for (const company of companySeeds) {
  const [existingUsers] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [company.email]);
  let userId;
  if (existingUsers.length > 0) {
    userId = Number(existingUsers[0].id);
    await connection.execute(
      "UPDATE users SET full_name = ?, phone = ?, password_hash = ?, role = 'company' WHERE id = ?",
      [company.name, company.phone, seedPasswordHash, userId],
    );
  } else {
    const [result] = await connection.execute(
      "INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, 'company')",
      [company.name, company.phone, company.email, seedPasswordHash],
    );
    userId = Number(result.insertId);
  }

  await connection.execute(
    `INSERT INTO company_profiles (user_id, company_name, industry, website, description, city)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       company_name = VALUES(company_name),
       industry = VALUES(industry),
       website = VALUES(website),
       description = VALUES(description),
       city = VALUES(city)`,
    [userId, company.name, company.industry, company.website, company.description, company.city],
  );

  const [existingJobs] = await connection.execute(
    "SELECT id FROM job_posts WHERE created_by = ? AND title = ? LIMIT 1",
    [userId, company.jobTitle],
  );

  if (existingJobs.length > 0) {
    await connection.execute(
      `UPDATE job_posts
       SET company_name = ?, location = ?, employment_type = ?, salary = ?, description = ?
       WHERE id = ?`,
      [
        company.name,
        company.city,
        company.employmentType,
        company.salary,
        company.jobDescription,
        Number(existingJobs[0].id),
      ],
    );
  } else {
    await connection.execute(
      `INSERT INTO job_posts
        (created_by, title, company_name, location, employment_type, salary, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        company.jobTitle,
        company.name,
        company.city,
        company.employmentType,
        company.salary,
        company.jobDescription,
      ],
    );
    insertedJobs += 1;
  }

  updatedCompanies += 1;
}

const [jobSeekers] = await connection.query(
  `SELECT id, full_name, role_title, short_description, detail_description, skills_json,
          price_label, rating, reviews_count, accent
   FROM job_seeker_profiles
   WHERE is_active = 1
   ORDER BY id ASC`,
);

for (const row of jobSeekers) {
  const seedId = Number(row.id);
  const email = `seed.freelancer${seedId}@cwork.local`;
  const phone = `99${String(100000 + seedId).slice(-6)}`;
  const [existingUsers] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  let userId;

  if (existingUsers.length > 0) {
    userId = Number(existingUsers[0].id);
    await connection.execute(
      "UPDATE users SET full_name = ?, phone = ?, password_hash = ?, role = 'freelancer' WHERE id = ?",
      [String(row.full_name), phone, seedPasswordHash, userId],
    );
  } else {
    const [result] = await connection.execute(
      "INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, 'freelancer')",
      [String(row.full_name), phone, email, seedPasswordHash],
    );
    userId = Number(result.insertId);
  }

  await connection.execute(
    `INSERT INTO freelancer_profiles
      (user_id, role_title, short_description, detail_description, skills_json, price_label, rating, reviews_count, accent, is_active, portfolio_json, listed_on_directory)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '[]', 1)
     ON DUPLICATE KEY UPDATE
      role_title = VALUES(role_title),
      short_description = VALUES(short_description),
      detail_description = VALUES(detail_description),
      skills_json = VALUES(skills_json),
      price_label = VALUES(price_label),
      rating = VALUES(rating),
      reviews_count = VALUES(reviews_count),
      accent = VALUES(accent),
      is_active = 1,
      listed_on_directory = 1`,
    [
      userId,
      String(row.role_title ?? ""),
      String(row.short_description ?? ""),
      String(row.detail_description ?? ""),
      typeof row.skills_json === "string" ? row.skills_json : JSON.stringify(row.skills_json ?? []),
      String(row.price_label ?? ""),
      String(row.rating ?? "5.0"),
      String(row.reviews_count ?? "0"),
      String(row.accent ?? "lime"),
    ],
  );

  try {
    await connection.execute("UPDATE job_seeker_profiles SET linked_user_id = ? WHERE id = ?", [userId, seedId]);
  } catch {
    /* linked_user_id may not exist yet */
  }

  updatedFreelancers += 1;
}

await connection.end();

console.log(
  JSON.stringify(
    {
      ok: true,
      updatedCompanies,
      updatedFreelancers,
      insertedJobs,
      seedPassword,
    },
    null,
    2,
  ),
);
