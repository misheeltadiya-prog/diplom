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
