import { type LandingCategory, type LandingCategoryKey } from "./data";

export type JobRecord = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
  createdAt: string;
  createdByName?: string | null;
  createdByUserId?: number | null;
  createdByAvatarUrl?: string | null;
  companyDomain?: string | null;
  applicantCount?: number;
};

export type DisplayJob = JobRecord & {
  source: "database" | "seed";
  categoryKey: LandingCategoryKey;
  tags: string[];
  highlight: string;
  level: string;
  accent: LandingCategory["accent"];
  applicantCount: number;
  searchableText: string;
  salaryScore: number;
};

export type JobForm = {
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  description: string;
};

export type JobBoardTab = "all" | "remote" | "full-time" | "part-time";

export type JobBoardStat = {
  value: string;
  label: string;
};
