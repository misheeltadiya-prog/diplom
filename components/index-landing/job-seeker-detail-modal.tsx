"use client";

import { useEffect } from "react";
import type { JobSeekerPublic } from "@/lib/job-seekers";
import styles from "./index-landing.module.css";

type JobSeekerDetailModalProps = {
  seeker: JobSeekerPublic | null;
  onClose: () => void;
};

const locationPool = [
  "Улаанбаатар",
  "Улаанбаатар / Hybrid",
  "Remote",
  "Remote / Ulaanbaatar",
  "Дархан",
  "Эрдэнэт",
];

function buildContactInfo(seeker: JobSeekerPublic) {
  const phoneTail = String(1000 + (seeker.id % 9000)).padStart(4, "0");
  const slug = seeker.fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return {
    phone: `99${phoneTail}`,
    email: `freelancer${seeker.id}@cwork.local`,
    location: locationPool[seeker.id % locationPool.length],
    facebook: `facebook.com/${slug || `freelancer.${seeker.id}`}`,
    instagram: `@${slug || `freelancer.${seeker.id}`}`,
  };
}

function buildHighlights(seeker: JobSeekerPublic) {
  const years = 2 + (seeker.id % 7);
  const skillSummary = seeker.skills.slice(0, 3).join(", ");
  const projectSummary =
    seeker.skills.length > 0
      ? `${skillSummary} ашигласан бүтээгдэхүүн, кампанит ажил болон захиалгат төслүүд дээр ажиллаж байсан.`
      : `${seeker.roleTitle} чиглэлээр олон төрлийн төсөл дээр ажиллаж байсан.`;

  return [
    {
      title: "Ажлын туршлага",
      text: `${years}+ жил ${seeker.roleTitle.toLowerCase()} чиглэлээр ажиллаж, бие даан болон багийн орчинд үр дүн гаргаж байсан.`,
    },
    {
      title: "Хийж байсан төслүүд",
      text: projectSummary,
    },
    {
      title: "Ажлын чиглэл",
      text: seeker.shortDescription,
    },
  ];
}

export function JobSeekerDetailModal({ seeker, onClose }: JobSeekerDetailModalProps) {
  useEffect(() => {
    if (!seeker) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.classList.add("job-seeker-modal-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("job-seeker-modal-open");
      document.body.style.overflow = previous;
    };
  }, [seeker]);

  if (!seeker) {
    return null;
  }

  const contact = buildContactInfo(seeker);
  const highlights = buildHighlights(seeker);

  return (
    <div
      className={styles.jobSeekerModalOverlay}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.jobSeekerModalPanel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-seeker-modal-title"
      >
        <div className={styles.jobSeekerModalLayout}>
          <div className={styles.jobSeekerModalMain}>
            <div className={styles.jobSeekerModalTop}>
              <div>
                <div className={styles.jobSeekerModalKicker}>Ажил хайгч</div>
                <h2 className={styles.jobSeekerModalTitle} id="job-seeker-modal-title">
                  {seeker.fullName}
                </h2>
                <p className={styles.jobSeekerModalRole}>{seeker.roleTitle}</p>
              </div>
              <button className={styles.jobSeekerModalClose} onClick={onClose} type="button" aria-label="Хаах">
                ×
              </button>
            </div>

            <div className={styles.jobSeekerModalMeta}>
              <div>
                <span className={styles.jobSeekerModalStars}>{seeker.starsLabel}</span>
                <span className={styles.jobSeekerModalRating}>
                  {seeker.rating} <span className={styles.jobSeekerModalReviews}>({seeker.reviewsCount})</span>
                </span>
              </div>
              <div className={styles.jobSeekerModalPrice}>{seeker.priceLabel} / цаг</div>
            </div>

            {seeker.skills.length > 0 ? (
              <div className={styles.jobSeekerModalSection}>
                <div className={styles.jobSeekerModalLabel}>Чадварууд</div>
                <div className={styles.jobSeekerModalSkills}>
                  {seeker.skills.map((skill) => (
                    <span className={styles.jobSeekerModalSkill} key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={styles.jobSeekerModalSection}>
              <div className={styles.jobSeekerModalLabel}>Дэлгэрэнгүй мэдээлэл</div>
              <div className={styles.jobSeekerModalInfoGrid}>
                {highlights.map((item) => (
                  <article className={styles.jobSeekerModalInfoCard} key={item.title}>
                    <h3 className={styles.jobSeekerModalInfoTitle}>{item.title}</h3>
                    <p className={styles.jobSeekerModalInfoText}>{item.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.jobSeekerModalSection}>
              <div className={styles.jobSeekerModalLabel}>Профайл дэлгэрэнгүй</div>
              <p className={styles.jobSeekerModalDetail}>{seeker.detailDescription}</p>
            </div>
          </div>

          <aside className={styles.jobSeekerModalAside}>
            <div className={styles.jobSeekerModalAsideImageWrap}>
              <img
                alt={seeker.fullName}
                className={styles.jobSeekerModalAsideImage}
                src={`https://i.pravatar.cc/500?img=${(seeker.id % 70) + 1}`}
              />
            </div>
            <div className={styles.jobSeekerModalAsideText}>Профайл мэдээлэл</div>
            <div className={styles.jobSeekerModalContactList}>
              <div className={styles.jobSeekerModalContactItem}>
                <span className={styles.jobSeekerModalContactLabel}>Утас</span>
                <span className={styles.jobSeekerModalContactValue}>{contact.phone}</span>
              </div>
              <div className={styles.jobSeekerModalContactItem}>
                <span className={styles.jobSeekerModalContactLabel}>Email</span>
                <span className={styles.jobSeekerModalContactValue}>{contact.email}</span>
              </div>
              <div className={styles.jobSeekerModalContactItem}>
                <span className={styles.jobSeekerModalContactLabel}>Location</span>
                <span className={styles.jobSeekerModalContactValue}>{contact.location}</span>
              </div>
              <div className={styles.jobSeekerModalContactItem}>
                <span className={styles.jobSeekerModalContactLabel}>Facebook</span>
                <span className={styles.jobSeekerModalContactValue}>{contact.facebook}</span>
              </div>
              <div className={styles.jobSeekerModalContactItem}>
                <span className={styles.jobSeekerModalContactLabel}>Instagram</span>
                <span className={styles.jobSeekerModalContactValue}>{contact.instagram}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
