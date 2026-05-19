"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { FreelancerMatchScore } from "@/lib/ai/types";
import { FreelancerAvatar } from "@/components/freelancer-avatar";
import landing from "@/components/index-landing/index-landing.module.css";
import local from "@/components/jobs/ai-matched-job-card.module.css";

export type AiMatchedFreelancerCardProps = {
  freelancer: {
    id: number;
    fullName: string;
    roleTitle: string;
    shortDescription: string;
    skills: string[];
    priceLabel: string;
    rating: string;
    avatarUrl?: string | null;
  };
  match: FreelancerMatchScore;
  confidenceLabel: string;
  index: number;
  detailHref?: string;
};

function clip(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function AiMatchedFreelancerCard({
  freelancer,
  match,
  confidenceLabel,
  index,
  detailHref = "/freelancers#freelancer-board",
}: AiMatchedFreelancerCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.24) }}
      className={`${landing.jobCardNew} ${local.aiMatchCard}`}
    >
      <motion.div
        className={landing.freelanceResultCard}
        style={{
          display: "flex",
          gap: "0.85rem",
          alignItems: "flex-start",
          border: "none",
          boxShadow: "none",
          padding: 0,
        }}
      >
        <FreelancerAvatar
          fullName={freelancer.fullName}
          avatarUrl={freelancer.avatarUrl}
          size={56}
          className={landing.freelanceAvatarPlaceholder}
          imgClassName={local.aiMatchAvatarImg}
        />
        <div className={landing.freelanceCardInfo} style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>{freelancer.fullName}</h3>
          <p style={{ margin: "0.2rem 0 0", fontWeight: 700, color: "#6d28d9" }}>{freelancer.roleTitle}</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#52525b" }}>
            {clip(freelancer.shortDescription, 140)}
          </p>
          <div className={landing.jobCardNewBadges} style={{ marginTop: "0.5rem" }}>
            <span className={landing.jobCardNewTag}>{match.percentage}% таарал</span>
            <span className={landing.jobCardNewBadgeType}>{confidenceLabel}</span>
            {match.breakdown.titleHits > 0 ? (
              <span className={landing.jobCardNewBadgeType}>Нэр: {match.breakdown.titleHits}</span>
            ) : null}
            {match.breakdown.skillHits > 0 ? (
              <span className={landing.jobCardNewBadgeType}>Skill: {match.breakdown.skillHits}</span>
            ) : null}
          </div>
          {freelancer.skills.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
              {freelancer.skills.slice(0, 6).map((s) => (
                <span key={s} className={landing.jobCardNewBadgeType}>
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          <div
            style={{
              marginTop: "0.65rem",
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{freelancer.priceLabel}</span>
            <span style={{ fontSize: "0.85rem", color: "#71717a" }}>★ {freelancer.rating}</span>
            <Link href={detailHref} className={`${landing.jobCardNewApply} ${local.aiMatchApplyLink}`}>
              Профайл харах
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}
