"use client";

import { useCallback, useEffect, useState } from "react";

export type PlatformStats = {
  openJobs: number;
  companies: number;
  cvs: number;
};

const EMPTY_STATS: PlatformStats = {
  openJobs: 0,
  companies: 0,
  cvs: 0,
};

export function formatPlatformStat(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(EMPTY_STATS);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/platform-stats", { cache: "no-store" });
      const payload = (await response.json()) as Partial<PlatformStats> & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to fetch platform stats.");
      }

      setStats({
        openJobs: Number(payload.openJobs ?? 0),
        companies: Number(payload.companies ?? 0),
        cvs: Number(payload.cvs ?? 0),
      });
    } catch {
      // Keep the last known values if stats cannot be refreshed.
    }
  }, []);

  useEffect(() => {
    void fetchStats();

    const handleFocus = () => {
      void fetchStats();
    };

    const handleStatsChange = () => {
      void fetchStats();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("cwork:platform-stats-changed", handleStatsChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("cwork:platform-stats-changed", handleStatsChange);
    };
  }, [fetchStats]);

  return stats;
}
