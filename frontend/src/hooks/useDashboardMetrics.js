import { useEffect, useState } from "react";
import { getAuthToken } from "../api/apiClient";
import { fetchDashboardMetrics } from "../services/backendDataService";

export function useDashboardMetrics({ currentUser, postedJobs, registeredHouseholds, registeredWorkers }) {
  const [dashboardMetrics, setDashboardMetrics] = useState({
    openJobs: 0,
    verifiedWorkers: 0,
    completedJobs: 0,
    totalAccounts: 0,
    avgRating: null,
  });

  useEffect(() => {
    let cancelled = false;

    function buildLocalMetrics() {
      return {
        openJobs: postedJobs.filter((job) => job.status === "Open").length,
        verifiedWorkers: registeredWorkers.filter((worker) => worker.verification === "Verified").length,
        completedJobs: postedJobs.filter((job) => job.status === "Completed").length,
        totalAccounts: registeredWorkers.length + registeredHouseholds.length,
        avgRating: null,
      };
    }

    async function loadDashboardMetrics() {
      const authToken = getAuthToken();
      if (currentUser?.role !== "admin" || !authToken) {
        if (!cancelled) {
          setDashboardMetrics(buildLocalMetrics());
        }
        return;
      }
      try {
        const data = await fetchDashboardMetrics();
        if (!cancelled) {
          setDashboardMetrics({
            openJobs: data.open_jobs ?? 0,
            verifiedWorkers: data.verified_workers ?? 0,
            completedJobs: data.completed_jobs ?? 0,
            totalAccounts: data.total_accounts ?? 0,
            avgRating: data.avg_rating,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardMetrics(buildLocalMetrics());
        }
      }
    }

    loadDashboardMetrics();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, postedJobs, registeredHouseholds.length, registeredWorkers]);

  return dashboardMetrics;
}
