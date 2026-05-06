"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { JobSeekerPublic } from "@/lib/job-seekers";
import { FreelancerPublishSheet } from "./freelancer-publish-sheet";
import { JobSeekerDetailModal } from "./job-seeker-detail-modal";
import { NavBar } from "./nav-bar";
import styles from "./index-landing.module.css";

const FAVORITE_KEY = "cwork-landing-favorite-job-ids";
const cardMotion = {
  rest: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.012 },
};

type ApiBody = { jobSeekers?: JobSeekerPublic[]; error?: string };
type FreelancersLandingPageProps = {
  currentUser?: SessionUser | null;
};

const demoFreelancers: JobSeekerPublic[] = [
  {
    id: 12001,
    initials: "ТЭ",
    fullName: "Төмөрсүх. Э",
    roleTitle: "Full Stack Developer",
    shortDescription: "React, Next.js, Node.js ашиглан найдвартай web app хөгжүүлдэг.",
    detailDescription: "Full stack хөгжүүлэлт, dashboard, SaaS систем, API integration дээр туршлагатай.",
    skills: ["React", "Next.js", "Node.js", "MongoDB"],
    priceLabel: "$35",
    starsLabel: "★★★★★",
    rating: "4.9",
    reviewsCount: "128",
    accent: "mint",
    badgeLabel: "Шалгарсан",
    badgeTone: "top",
  },
  {
    id: 12002,
    initials: "АБ",
    fullName: "Ариунзаяа. Б",
    roleTitle: "UI/UX Designer",
    shortDescription: "Mobile болон web product-ийн цэвэр, хэрэглэгч төвтэй дизайн гаргана.",
    detailDescription: "Figma, UX research, design system, prototype дээр ажилладаг.",
    skills: ["Figma", "UI Design", "UX Research", "Adobe XD"],
    priceLabel: "$28",
    starsLabel: "★★★★★",
    rating: "4.8",
    reviewsCount: "96",
    accent: "pink",
    badgeLabel: "Шалгарсан",
    badgeTone: "top",
  },
  {
    id: 12003,
    initials: "БЭ",
    fullName: "Бат-Эрдэнэ. М",
    roleTitle: "Mobile Developer",
    shortDescription: "iOS, Android cross-platform app хөгжүүлэлт, publish flow хийдэг.",
    detailDescription: "React Native, Flutter, API integration, app store release дээр ажиллана.",
    skills: ["React Native", "Flutter", "iOS", "Android"],
    priceLabel: "$32",
    starsLabel: "★★★★★",
    rating: "4.9",
    reviewsCount: "74",
    accent: "gold",
    badgeLabel: "Шалгарсан",
    badgeTone: "top",
  },
  {
    id: 12004,
    initials: "ЭЦ",
    fullName: "Энхболд. Ц",
    roleTitle: "WordPress Developer",
    shortDescription: "WordPress, WooCommerce, SEO friendly landing болон e-commerce сайт хийнэ.",
    detailDescription: "Theme customization, plugin setup, WooCommerce store хөгжүүлдэг.",
    skills: ["WordPress", "PHP", "WooCommerce", "SEO"],
    priceLabel: "$20",
    starsLabel: "★★★★★",
    rating: "4.7",
    reviewsCount: "53",
    accent: "lime",
    badgeLabel: null,
    badgeTone: null,
  },
  {
    id: 12005,
    initials: "МД",
    fullName: "Мөнхцэцэг. Д",
    roleTitle: "Video Editor",
    shortDescription: "Social video, ad creative, reels болон brand video засварлана.",
    detailDescription: "Premiere Pro, After Effects, DaVinci Resolve дээр хурдан гүйцэтгэнэ.",
    skills: ["Premiere Pro", "After Effects", "DaVinci", "CapCut"],
    priceLabel: "$25",
    starsLabel: "★★★★★",
    rating: "4.8",
    reviewsCount: "81",
    accent: "pink",
    badgeLabel: null,
    badgeTone: null,
  },
  {
    id: 12006,
    initials: "ОН",
    fullName: "Отгонбаяр. Н",
    roleTitle: "Digital Marketing Expert",
    shortDescription: "Performance marketing, SEO, analytics, paid ads campaign удирдана.",
    detailDescription: "Facebook Ads, Google Ads, SEO, Analytics тайлан гарган ажилладаг.",
    skills: ["Facebook Ads", "Google Ads", "SEO", "Analytics"],
    priceLabel: "$30",
    starsLabel: "★★★★★",
    rating: "4.9",
    reviewsCount: "110",
    accent: "mint",
    badgeLabel: "Шалгарсан",
    badgeTone: "top",
  },
];

function avatarUrl(card: JobSeekerPublic) {
  return card.avatarUrl?.trim() || `https://i.pravatar.cc/240?img=${(card.id % 70) + 1}`;
}

function mergeFreelancers(apiList: JobSeekerPublic[]) {
  const seen = new Set<number>();
  return [...demoFreelancers, ...apiList].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function FreelancersLandingPage({ currentUser = null }: FreelancersLandingPageProps) {
  const router = useRouter();
  const [apiList, setApiList] = useState<JobSeekerPublic[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<JobSeekerPublic | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [savedCount, setSavedCount] = useState(12);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Бүгд");
  const [sortMode, setSortMode] = useState("Холбогдох");
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);

  const allFreelancers = useMemo(() => mergeFreelancers(apiList), [apiList]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFreelancers.filter((item) => {
      const categoryOk = category === "Бүгд" || item.roleTitle.toLowerCase().includes(category.toLowerCase());
      const text = [item.fullName, item.roleTitle, item.shortDescription, ...item.skills].join(" ").toLowerCase();
      return categoryOk && (!q || text.includes(q));
    });
  }, [allFreelancers, category, query]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    if (sortMode === "Үнэлгээ") return items.sort((a, b) => Number(b.rating) - Number(a.rating));
    if (sortMode === "Төсөл") return items.sort((a, b) => Number(b.reviewsCount) - Number(a.reviewsCount));
    return items;
  }, [filtered, sortMode]);

  const loadJobSeekers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/job-seekers", { cache: "no-store" });
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
    try {
      const raw = localStorage.getItem(FAVORITE_KEY);
      const parsed = raw ? JSON.parse(raw) as unknown : null;
      if (Array.isArray(parsed)) setSavedCount(Math.max(12, parsed.length));
    } catch {
      setSavedCount(12);
    }
    void loadJobSeekers();
  }, [loadJobSeekers]);

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
        favoritesViewActive={false}
        onAbout={() => router.push("/#reviews")}
        onCompany={() => router.push("/companies")}
        onFindJob={() => router.push("/jobs#jobs-content")}
        onFreelancer={() => router.push("/freelancers")}
        onSavedJobsClick={() => router.push("/jobs#jobs-content")}
        savedJobCount={savedCount}
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
            <div className={styles.freelanceHeroButtons}>
              <a href="#freelancer-board">
                <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M16.5 16.5L21 21" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
                Freelancer хайх
              </a>
              {currentUser?.role === "freelancer" ? (
                <button onClick={() => setPublishSheetOpen(true)} type="button">
                  <span>+</span> Ажил оруулах
                </button>
              ) : (
                <Link href="/register"><span>+</span> Ажил оруулах</Link>
              )}
            </div>
            <div className={styles.freelanceHeroSearch}>
              <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="React developer, UI/UX designer, marketing expert..." />
              <select aria-label="Төлбөрийн төрөл">
                <option>Төсөв / цаг</option>
                <option>Төсөл</option>
              </select>
              <button type="button">Хайх</button>
            </div>
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

        <section className={styles.freelanceTrustStrip} aria-label="Platform benefits">
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
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Ангилал">
              <option>Бүгд</option>
              <option>Developer</option>
              <option>Designer</option>
              <option>Mobile</option>
              <option>Marketing</option>
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Юу хайж байна вэ? Жишээ: React developer, UI/UX designer..." />
            <select aria-label="Төлбөр">
              <option>Төсөв / цаг</option>
              <option>Төсөл</option>
            </select>
            <button type="button">Хайх 🔍</button>
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
              <div className={styles.freelancePurpleCta}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/puujin.png" alt="" aria-hidden="true" />
                <h3>Таны төсөл - бидний зорилго</h3>
                <p>Чанартай мэргэжилтнүүдтэй хамт амжилттай хэрэгжүүлээрэй.</p>
                <Link href="/jobs?post=1">Эхлээд төсөл оруулах →</Link>
              </div>
            </aside>

            <div className={styles.freelanceResultsArea}>
              <div className={styles.freelanceResultsHead}>
                <h2>Хайлтын үр дүн (128)</h2>
                <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} aria-label="Эрэмбэлэх">
                  <option>Холбогдох</option>
                  <option>Үнэлгээ</option>
                  <option>Төсөл</option>
                </select>
              </div>

              {loadError ? <p className={styles.freelanceLoadHint}>{loadError}</p> : null}
              {loading ? <p className={styles.freelanceLoadHint}>Ачаалж байна...</p> : null}

              <div className={styles.freelanceCardGrid}>
                {sorted.slice(0, 6).map((card) => (
                  <motion.article
                    className={styles.freelanceResultCard}
                    key={card.id}
                    variants={cardMotion}
                    initial="rest"
                    whileHover="hover"
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  >
                    <button className={styles.freelanceHeart} type="button" aria-label="Хадгалах">♡</button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl(card)} alt={card.fullName} />
                    <div className={styles.freelanceCardInfo}>
                      <h3>{card.fullName} <span>✹</span></h3>
                      <p>{card.roleTitle}</p>
                      <strong>⭐ {card.rating} ({card.reviewsCount})</strong>
                      <div className={styles.freelanceSkillTags}>
                        {card.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
                      </div>
                    </div>
                    <div className={styles.freelanceCardStats}>
                      <span>▧ {card.reviewsCount} төсөл</span>
                      <span>◎ {Number(card.rating) >= 4.8 ? "98%" : "95%"} амжилт</span>
                      <span>◷ {Number(card.id) % 2 ? "5" : "15"} мин хариу</span>
                    </div>
                    <div className={styles.freelanceCardActions}>
                      <strong>{card.priceLabel}<small> /цаг</small></strong>
                      <button onClick={() => setActive(card)} type="button">Дэлгэрэнгүй</button>
                      <button type="button">Хөлслөх</button>
                    </div>
                  </motion.article>
                ))}
              </div>

              <div className={styles.freelanceEmptyPanel}>
                <div>⌕</div>
                <section>
                  <h3>Таны шүүлтэд тохирох фрийланансер олдсонгүй.</h3>
                  <p>Шүүлтээ өөрчлөх эсвэл ерөнхий хайлт хийж дахин оролдоно уу.</p>
                  <button onClick={() => { setQuery(""); setCategory("Бүгд"); }} type="button">Шүүлт цэвэрлэх</button>
                  <a href="#freelancer-board">Илүү өргөн хайх</a>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>

      <JobSeekerDetailModal currentUser={currentUser} onClose={() => setActive(null)} seeker={active} />
      <FreelancerPublishSheet
        currentUser={currentUser}
        onClose={() => setPublishSheetOpen(false)}
        onSaved={() => void loadJobSeekers()}
        open={publishSheetOpen}
      />
    </div>
  );
}
