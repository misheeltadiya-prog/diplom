"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { landingCategories, type LandingCategoryKey } from "./data";
import { FreelancerPublishSheet } from "./freelancer-publish-sheet";
import { JobsListSection } from "./jobs-list-section";
import { LeadModal } from "./lead-modal";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";
import { Toast } from "./toast";
import styles from "./index-landing.module.css";

const FAVORITE_JOBS_STORAGE_KEY = "cwork-landing-favorite-job-ids";

type IndexLandingPageProps = {
  currentUser?: SessionUser | null;
};

export function IndexLandingPage({ currentUser = null }: IndexLandingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mineOnly = searchParams.get("mine") === "1";
  const appliedJobsOnly = searchParams.get("applied") === "1";
  const [modalMode, setModalMode] = useState<"hire" | "join" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    LandingCategoryKey | "all"
  >("all");
  const [showPostJobComposer, setShowPostJobComposer] = useState(false);
  const [showFreelancerPublish, setShowFreelancerPublish] = useState(false);
  const [visibleJobsCount, setVisibleJobsCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const jobsComposerRef = useRef<HTMLDivElement | null>(null);
  const [favoriteJobIds, setFavoriteJobIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#jobs-content" || hash === "#jobs" || searchParams.get("applied") === "1") {
      const id = window.setTimeout(() => {
        const el =
          document.getElementById("jobs-content") ??
          document.getElementById("jobs");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleMismatch = params.get("loginRoleMismatch");
    if (roleMismatch === "company") {
      showToast(
        "Таны энэ и-мэйл company бүртгэл биш. Ажлын зар оруулахын тулд /register?role=company-оор шинээр бүртгүүлээд тэр дансаар нэвтэрнэ үү.",
      );
      params.delete("loginRoleMismatch");
      const rest = params.toString();
      const path = `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", path);
      return;
    }
    if (roleMismatch === "freelancer") {
      showToast(
        "Таны энэ и-мэйл freelancer бүртгэл биш. /register?role=freelancer-оор шинээр бүртгүүлээд нэвтэрнэ үү.",
      );
      params.delete("loginRoleMismatch");
      const rest = params.toString();
      const path = `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", path);
      return;
    }
    if (params.get("post") === "1") {
      if (currentUser?.role === "freelancer") {
        setShowFreelancerPublish(true);
      } else {
        setShowPostJobComposer(true);
      }
      params.delete("post");
      const rest = params.toString();
      const path = `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", path);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITE_JOBS_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (
        Array.isArray(parsed) &&
        parsed.every((id) => typeof id === "string")
      ) {
        setFavoriteJobIds(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        FAVORITE_JOBS_STORAGE_KEY,
        JSON.stringify(favoriteJobIds),
      );
    } catch {
      // ignore
    }
  }, [favoriteJobIds]);

  function toggleFavoriteJob(id: string) {
    setFavoriteJobIds((prev) =>
      prev.includes(id) ? prev.filter((jobId) => jobId !== id) : [...prev, id],
    );
  }

  function handleSavedJobsNav() {
    setFavoritesOnly((open) => !open);
    window.requestAnimationFrame(() => {
      document
        .getElementById("jobs-content")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const OFFSET_GAP_PX = 85;

    const syncFilterStickyTop = () => {
      const nav = document.querySelector<HTMLElement>(`.${styles.nav}`);
      if (!nav) {
        return;
      }
      const height = Math.round(nav.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        "--jobs-filter-sticky-top",
        `${height + OFFSET_GAP_PX}px`,
      );
    };

    syncFilterStickyTop();
    const raf = window.requestAnimationFrame(() => {
      syncFilterStickyTop();
    });
    window.addEventListener("resize", syncFilterStickyTop);

    let observer: ResizeObserver | undefined;
    const nav = document.querySelector<HTMLElement>(`.${styles.nav}`);
    if (nav && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        syncFilterStickyTop();
      });
      observer.observe(nav);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", syncFilterStickyTop);
      observer?.disconnect();
      document.documentElement.style.removeProperty("--jobs-filter-sticky-top");
    };
  }, []);

  function openModal(mode: "hire" | "join") {
    setSubmitted(false);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSubmitted(false);
  }

  function submitModal() {
    setSubmitted(true);
  }

  useEffect(() => {
    if (!showPostJobComposer || !jobsComposerRef.current) {
      return;
    }

    jobsComposerRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showPostJobComposer]);

  function showToast(message: string) {
    setToastMessage(message);
  }

  function runSearchToast() {
    const selectedCategoryLabel =
      selectedCategory === "all"
        ? "бүх ангилал"
        : (landingCategories.find(
            (category) => category.key === selectedCategory,
          )?.name ?? "сонгосон ангилал");

    if (!searchValue.trim() && selectedCategory === "all") {
      showToast(`${visibleJobsCount} ажлын санал одоогоор харагдаж байна.`);
      return;
    }

    showToast(
      `"${searchValue || selectedCategoryLabel}" хайлтад ${visibleJobsCount} ажлын санал тохирлоо.`,
    );
  }

  return (
    <div className={styles.page}>
      <NavBar
        currentUser={currentUser}
        favoritesViewActive={favoritesOnly}
        onAbout={() => {
          document
            .getElementById("contact")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onCompany={() => {
          router.push("/companies");
        }}
        onFindJob={() => {
          document
            .getElementById("jobs-content")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onFreelancer={() => {
          router.push("/freelancers");
        }}
        onSavedJobsClick={handleSavedJobsNav}
        savedJobCount={favoriteJobIds.length}
        scrolled={isScrolled}
      />

      <JobsListSection
        appliedJobsOnly={appliedJobsOnly}
        composerRef={jobsComposerRef}
        currentUser={currentUser}
        favoriteJobIds={favoriteJobIds}
        favoritesOnly={favoritesOnly}
        mineOnly={mineOnly}
        onComposerClose={() => setShowPostJobComposer(false)}
        onOpenFreelancerPublish={() => setShowFreelancerPublish(true)}
        onOpenJobComposer={() => setShowPostJobComposer(true)}
        onToast={showToast}
        onToggleFavorite={toggleFavoriteJob}
        onVisibleCountChange={setVisibleJobsCount}
        searchValue={searchValue}
        selectedCategory={selectedCategory}
        showComposer={showPostJobComposer}
        onClearLandingFilters={() => {
          setSelectedCategory("all");
          setSearchValue("");
        }}
      />
      <FreelancerPublishSheet
        currentUser={currentUser}
        onClose={() => setShowFreelancerPublish(false)}
        onSaved={() => router.refresh()}
        open={showFreelancerPublish}
      />
      <SiteFooter />
      <LeadModal
        mode={modalMode}
        submitted={submitted}
        onClose={closeModal}
        onSubmit={submitModal}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
