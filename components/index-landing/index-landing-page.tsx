"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import {
  FAVORITES_CHANGED_EVENT,
  readFavoriteJobIdsFromStorage,
  toggleFavoriteJobIdInStorage,
} from "@/lib/landing-favorites";
import { landingCategories, type LandingCategoryKey } from "./data";
import { FreelancerPublishSheet } from "./freelancer-publish-sheet";
import { JobsListSection } from "./jobs-list-section";
import { LeadModal, type LeadFormPayload } from "./lead-modal";
import { NavBar } from "./nav-bar";
import { Toast } from "./toast";
import styles from "./index-landing.module.css";

type IndexLandingPageProps = {
  currentUser?: SessionUser | null;
};

export function IndexLandingPage({ currentUser = null }: IndexLandingPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mineOnly = searchParams.get("mine") === "1";
  const appliedJobsOnly = searchParams.get("applied") === "1";
  const openJobIdFromUrl = searchParams.get("job");

  const consumeOpenJobIdFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("job")) return;
    params.delete("job");
    const q = params.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
  }, [router, searchParams, pathname]);
  const [modalMode, setModalMode] = useState<"hire" | "join" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const hash = window.location.hash;
    const applied = searchParams.get("applied") === "1";

    if (applied) {
      const id = window.setTimeout(() => {
        document.getElementById("jobs-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => window.clearTimeout(id);
    }

    if (hash === "#jobs" || hash === "#jobs-content") {
      const id = window.setTimeout(() => {
        document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    setFavoriteJobIds(readFavoriteJobIdsFromStorage());
    const onChange = () => setFavoriteJobIds(readFavoriteJobIdsFromStorage());
    window.addEventListener(FAVORITES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, onChange);
  }, []);

  function toggleFavoriteJob(id: string) {
    setFavoriteJobIds(toggleFavoriteJobIdInStorage(id));
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
    setLeadError(null);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSubmitted(false);
    setLeadError(null);
  }

  async function submitModal(payload: LeadFormPayload) {
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setLeadError(data.error ?? "Илгээхэд алдаа гарлаа.");
        return;
      }
      setSubmitted(true);
    } catch {
      setLeadError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setLeadSubmitting(false);
    }
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
        onAbout={() => {
          document
            .getElementById("contact")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onCompany={() => {
          router.push("/companies");
        }}
        onFindJob={() => {
          document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onFreelancer={() => {
          router.push("/freelancers");
        }}
        scrolled={isScrolled}
        jobPostComposerOpen={showPostJobComposer}
      />

      <JobsListSection
        appliedJobsOnly={appliedJobsOnly}
        composerRef={jobsComposerRef}
        currentUser={currentUser}
        favoriteJobIds={favoriteJobIds}
        favoritesOnly={false}
        mineOnly={mineOnly}
        onComposerClose={() => setShowPostJobComposer(false)}
        onConsumeOpenJobIdFromUrl={consumeOpenJobIdFromUrl}
        onOpenFreelancerPublish={() => setShowFreelancerPublish(true)}
        onOpenJobComposer={() => setShowPostJobComposer(true)}
        onToast={showToast}
        onToggleFavorite={toggleFavoriteJob}
        onVisibleCountChange={setVisibleJobsCount}
        openJobIdFromUrl={openJobIdFromUrl}
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
      <LeadModal
        mode={modalMode}
        submitted={submitted}
        submitting={leadSubmitting}
        error={leadError}
        onClose={closeModal}
        onSubmit={submitModal}
      />
      <Toast message={toastMessage} />
    </div>
  );
}
