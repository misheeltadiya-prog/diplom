"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { JobSeekerPublic } from "@/lib/job-seekers";
import { FreelancerPublishSheet } from "./freelancer-publish-sheet";
import { JobSeekerDetailModal } from "./job-seeker-detail-modal";
import { FreelancerAvatar } from "@/components/freelancer-avatar";
import { NavBar } from "./nav-bar";
import styles from "./index-landing.module.css";
const cardMotion = {
  rest: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.012 },
};

type ApiBody = { jobSeekers?: JobSeekerPublic[]; error?: string };
type FreelancersLandingPageProps = {
  currentUser?: SessionUser | null;
};

export function FreelancersLandingPage({ currentUser = null }: FreelancersLandingPageProps) {
  const router = useRouter();
  const [apiList, setApiList] = useState<JobSeekerPublic[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<JobSeekerPublic | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Бүгд");
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);

  const sorted = useMemo(() => [...apiList], [apiList]);

  const loadJobSeekers = useCallback(async (searchQuery: string, searchCategory: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (searchCategory && searchCategory !== "Бүгд") params.set("category", searchCategory);
      const qs = params.toString();
      const res = await fetch(qs ? `/api/job-seekers?${qs}` : "/api/job-seekers", { cache: "no-store" });
      const body = (await res.json()) as ApiBody;
      setApiList(body.jobSeekers ?? []);
      setLoadError(res.ok ? null : (body.error ?? `HTTP ${res.status}`));
    } catch (e) {
      setApiList([]);
      setLoadError(e instanceof Error ? e.message : "Өгөгдөл ачаалахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayMs = query.trim() ? 320 : 0;
    const id = window.setTimeout(() => {
      void loadJobSeekers(query, category);
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [query, category, loadJobSeekers]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("publish") !== "1") return;
    setPublishSheetOpen(true);
    params.delete("publish");
    const rest = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
  }, []);

  return (
    <div className={styles.freelanceTargetPage}>
      <NavBar
        currentUser={currentUser}
        onAbout={() => router.push("/#reviews")}
        onCompany={() => router.push("/companies")}
        onFindJob={() => router.push("/jobs")}
        onFreelancer={() => router.push("/freelancers")}
        scrolled={isScrolled}
      />

      <main>
        <section className={styles.freelanceHeroExact}>
          <div className={styles.freelanceHeroContent}>
            <p className={styles.freelanceHeroKicker}>C-WORK TALENT</p>
            <h1>
              Шилдэг<br />
              freelancer-ууд<br />
              <span>нэг дор.</span>
            </h1>
            <p className={styles.freelanceHeroText}>
              Бид танд хамгийн шилдэг, баталгаатай freelancer-уудыг олон боломжийг нэг дороос олж авахад тусална.
            </p>
          </div>

          <div className={styles.freelanceHeroVisual}>
            {[
              ["✦", "Шалгарсан freelancer", "Шалгарсан, туршлагатай freelancer-ууд таныг хүлээж байна."],
              ["ϟ", "Шууд холбогдох", "Төслөө хурдан байршуулж, шууд санал аваарай."],
              ["⬟", "Найдвартай хамтын ажиллагаа", "100% хамгаалалттай төлбөр, аюулгүй, найдвартай систем."],
            ].map((item, index) => (
              <article className={styles.freelanceFloatCard} key={item[1]} style={{ ["--tilt" as string]: `${index === 0 ? -2 : index === 1 ? 2 : 1}deg` }}>
                <span>{item[0]}</span>
                <div>
                  <h3>{item[1]}</h3>
                  <p>{item[2]}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.freelanceTrustStrip}>
          {[
            ["♙", "Мянга+ шалгарсан freelancer", "Таны төсөлд тохирох мэргэжилтэн"],
            ["◷", "Хурдан хариу, шуурхай үйлчилгээ", "Дундаж хариу өгөх хугацаа 5 минут"],
            ["▣", "100% хамгаалалттай төлбөр", "Таны мөнгө найдвартай, хамгаалагдсан"],
            ["☏", "24/7 дэмжлэг", "Асуудал гарвал бид үргэлж тусална"],
          ].map((item) => (
            <article key={item[1]}>
              <span>{item[0]}</span>
              <div>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
              </div>
            </article>
          ))}
        </section>

        <section className={styles.freelanceBoardSection} id="freelancer-board">
  
          <motion.div
            className={styles.freelanceSearchPanel}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Бүгд</option>
              <option>Developer</option>
              <option>Designer</option>
              <option>Mobile</option>
              <option>Marketing</option>
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Юу хайж байна вэ? Жишээ: React developer, UI/UX designer..."
            />
            <button className={styles.freelanceSearchSubmit} onClick={() => void loadJobSeekers(query, category)} type="button">
              Хайх
            </button>
          </motion.div>

          <motion.div
            className={styles.freelanceTrendBox}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.42, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <strong>🔥 Тренд хайлт:</strong>
            {["Next.js", "UI/UX Design", "Mobile App", "WordPress", "Video Editing"].map((trend) => (
              <button key={trend} onClick={() => setQuery(trend)} type="button">{trend}</button>
            ))}
          </motion.div>

          <div className={styles.freelanceBoardLayout}>
            <aside className={styles.freelanceSidePanel}>
              {[
                ["🛡", "Шалгарсан мэргэжилтнүүд", "Баталгаатай, найдвартай"],
                ["★", "Өндөр үнэлгээтэй", "Шилдэг гүйцэтгэлтэй"],
                ["ϟ", "Хурдан шуурхай", "Түргэн хугацаанд"],
                ["☏", "24/7 дэмжлэг", "Асуудал гарахад бэлэн"],
                ["●", "100% найдвартай", "Төлбөрийн систем болон хамгаалалт"],
                ["⚡", "Төлөвлөгөөнөөс хамаарах эрх", "BASIC / STANDARD / PREMIUM боломжууд"],
                ["✉", "Мессеж, мэдэгдэл", "Өргөдөл, санал, мэдэгдлийг нэг дор"],
                ["📊", "Аналитик самбар", "Хандалт, товшилт, өргөдлийн тоо"],
                ["🤖", "AI туслагч", "Matching, CV screening (tier-ээр)"],
              ].map((item) => (
                <motion.article
                  key={item[1]}
                  whileHover={{ x: 4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                >
                  <span>{item[0]}</span>
                  <div>
                    <h3>{item[1]}</h3>
                    <p>{item[2]}</p>
                  </div>
                </motion.article>
              ))}
            </aside>

            <div className={styles.freelanceResultsArea}>
              <div className={styles.freelanceResultsHead}>
                <h2>Хайлтын үр дүн ({sorted.length})</h2>
                {currentUser?.role === "freelancer" ? (
                  <div className={styles.freelanceResultsHeadActions}>
                    <button
                      className={styles.freelancePostListingBtn}
                      onClick={() => setPublishSheetOpen(true)}
                      type="button"
                    >
                      Зар оруулах
                    </button>
                  </div>
                ) : null}
              </div>

              {loadError ? <p className={styles.freelanceLoadHint}>{loadError}</p> : null}
              {loading ? <p className={styles.freelanceLoadHint}>Ачаалж байна...</p> : null}

              <div className={styles.freelanceCardGrid}>
                {sorted.map((card) => (
                  <motion.article
                    className={styles.freelanceResultCard}
                    key={card.id}
                    variants={cardMotion}
                    initial="rest"
                    whileHover="hover"
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  >
                    <FreelancerAvatar fullName={card.fullName} avatarUrl={card.avatarUrl} size={72} />
                    <div className={styles.freelanceCardInfo}>
                      <h3>
                        {card.fullName} <span>✹</span>
                      </h3>
                      <p>{card.roleTitle}</p>
                      <strong>
                        ⭐ {card.rating} ({card.reviewsCount})
                      </strong>
                    </div>
                    <div className={styles.freelanceSkillTags}>
                      {card.skills.slice(0, 2).map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                      {card.skills.length > 2 ? <span>+{card.skills.length - 2}</span> : null}
                    </div>
                    <div className={styles.freelanceCardStats}>
                      <span>▧ {card.reviewsCount} төсөл</span>
                      <span>◎ {Number(card.rating) >= 4.8 ? "98%" : "95%"} амжилт</span>
                      <span>◷ {Number(card.id) % 2 ? "5" : "15"} мин хариу</span>
                    </div>
                    <div className={styles.freelanceCardActions}>
                      <strong>{card.priceLabel}</strong>
                    </div>
                    <button className={styles.freelanceDetailButton} onClick={() => setActive(card)} type="button">
                      Дэлгэрэнгүй
                    </button>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <JobSeekerDetailModal currentUser={currentUser} onClose={() => setActive(null)} seeker={active} />
      <FreelancerPublishSheet
        currentUser={currentUser}
        onClose={() => setPublishSheetOpen(false)}
        onSaved={() => void loadJobSeekers(query, category)}
        open={publishSheetOpen}
      />
    </div>
  );
}
