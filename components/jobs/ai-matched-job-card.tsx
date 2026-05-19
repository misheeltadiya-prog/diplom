"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgePercent } from "lucide-react";
import type { JobMatchScore } from "@/lib/ai/types";
import { avatarToneClasses, companyInitials } from "@/components/index-landing/companies-directory";
import landing from "@/components/index-landing/index-landing.module.css";
import local from "./ai-matched-job-card.module.css";

export type AiMatchedJobCardProps = {
  job: {
    id: string;
    title: string;
    description: string;
    companyName: string;
    location: string;
    employmentType: string;
    salary: string;
  };
  derived: { category: string; level: string; workType: string };
  match: JobMatchScore;
  confidenceLabel: string;
  index: number;
  /** Дэлгэрэнгүй — `/jobs?job=...` */
  detailHref?: string;
};

function clip(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M12 20s6-4.5 6-9a6 6 0 1 0-12 0c0 4.5 6 9 6 9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="2.1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function AiMatchedJobCard({
  job,
  derived,
  match,
  confidenceLabel,
  index,
  detailHref = "/jobs#jobs",
}: AiMatchedJobCardProps) {
  const toneKey = avatarToneClasses[(Math.abs(job.companyName.length) + job.id.length) % avatarToneClasses.length];
  const toneClass = landing[toneKey] ?? "";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.24) }}
      className={`${landing.jobCardNew} ${local.aiMatchCard}`}
    >
      <div className={landing.jobCardNewTop}>
        <div className={landing.jobCardNewLogoWrap}>
          <span className={`${landing.jobCompanyAvatar} ${toneClass}`}>
            <span className={landing.jobCompanyAvatarInitials} style={{ display: "inline-flex" }}>
              {companyInitials(job.companyName)}
            </span>
          </span>
          <div className={landing.jobCardNewCompanyInfo}>
            <span className={landing.jobCardNewCompanyName}>{job.companyName}</span>
            <div className={landing.jobCardNewBadges}>
              <span className={landing.jobCardNewBadgeType}>{job.employmentType}</span>
              <span className={landing.jobCardNewTag}>{match.percentage}% таарал</span>
              <span className={landing.jobCardNewTag}>{confidenceLabel}</span>
            </div>
          </div>
        </div>
        <div className={landing.jobCardNewTopActions} aria-hidden>
          <span
            className={landing.jobCardNewTag}
            style={{ opacity: 0.85, fontSize: "0.7rem" }}
            title="AI тааруулга"
          >
            AI
          </span>
        </div>
      </div>

      <h3 className={landing.jobCardNewTitle} id={`ai-job-card-title-${job.id}`}>
        {job.title}
      </h3>

      <div className={landing.jobCardNewLocation}>
        <LocationIcon />
        <span>{job.location}</span>
        {job.location.toLowerCase() !== "remote" ? (
          <>
            <span className={landing.jobCardNewLocationDot}>·</span>
            <span>Remote</span>
          </>
        ) : null}
      </div>

      <p className={landing.jobCardNewDesc}>{clip(job.description, 260)}</p>

      {match.matchedSkills.length > 0 || derived.category || derived.level || derived.workType ? (
        <div className={landing.jobCardNewTags}>
          {match.matchedSkills.slice(0, 6).map((s, i) => (
            <span key={`${s}-${i}`} className={landing.jobCardNewTag}>
              {s}
            </span>
          ))}
          {derived.category ? <span className={landing.jobCardNewTag}>{derived.category}</span> : null}
          {derived.level ? <span className={landing.jobCardNewTag}>{derived.level}</span> : null}
          {derived.workType ? <span className={landing.jobCardNewTag}>{derived.workType}</span> : null}
        </div>
      ) : null}

      <div className={landing.jobCardNewFooter}>
        <div className={landing.jobCardNewSalary}>{job.salary}</div>
        <div className={landing.jobCardNewApplicants}>
          <BadgePercent aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          <span>{match.matchedSkills.length} ур чадвар</span>
        </div>
        <Link href={detailHref} className={`${landing.jobCardNewApplyBtn} ${local.aiMatchApplyLink}`}>
          Дэлгэрэнгүй
        </Link>
      </div>
    </motion.article>
  );
}
