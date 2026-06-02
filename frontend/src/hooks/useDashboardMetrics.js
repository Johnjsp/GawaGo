import { useEffect, useState } from "react";
import { getAuthToken } from "../api/apiClient";
import { fetchDashboardMetrics } from "../services/backendDataService";
import { getWorkersNeeded } from "../utils/jobUtils";
import {
  buildBarangayAnalytics,
  buildBarangayHeatMapData,
  buildMonthlyJobRequests,
  buildRatingDistribution,
  buildServiceAnalytics,
  getWorkerRatingValue,
} from "../utils/analyticsUtils";
import { SKILLS } from "../constants/appConstants";

function buildDefaultAnalytics() {
  return {
    summary: {
      totalUsers: 0,
      totalWorkers: 0,
      households: 0,
      totalJobPostings: 0,
      activeJobs: 0,
      activeApplications: 0,
      completedServices: 0,
      cancelledRequests: 0,
      ongoingMatches: 0,
      verifiedUsers: 0,
      verifiedWorkers: 0,
      pendingVerifications: 0,
      rejectedVerifications: 0,
      rejectedWorkers: 0,
      verifiedPercent: 0,
      averageWorkerRating: "No ratings yet",
      ratedWorkerCount: 0,
    },
    monthlyJobRequests: [],
    serviceAnalytics: [],
    geographicAnalytics: {
      barangayDemand: [],
      workerAvailability: [],
    },
    barangayJobAnalytics: [],
    barangayWorkerAnalytics: [],
    heatMapData: [],
    ratingDistribution: [],
    rateTransparency: {
      averageRatesByCategory: [],
      pricingTrends: [],
    },
    serviceRateSummary: [],
  };
}

function buildLocalAnalytics({ postedJobs, registeredHouseholds, registeredWorkers, verificationRequests = [] }) {
  const verifiedWorkers = registeredWorkers.filter((worker) => worker.verification === "Verified").length;
  const workerRatingValues = registeredWorkers.map(getWorkerRatingValue).filter((rating) => rating != null);
  const averageWorkerRating = workerRatingValues.length
    ? (workerRatingValues.reduce((sum, rating) => sum + rating, 0) / workerRatingValues.length).toFixed(2)
    : "No ratings yet";
  const serviceRateSummary = SKILLS.map((skill) => {
    const categoryJobs = postedJobs.filter((job) => job.serviceType === skill);
    const averageRate = categoryJobs.length
      ? categoryJobs.reduce((sum, job) => sum + Number(job.offeredRate || 0), 0) / categoryJobs.length
      : 0;
    return {
      skill,
      count: categoryJobs.length,
      averageRate,
    };
  })
    .filter((item) => item.count)
    .sort((a, b) => b.count - a.count);
  const pricingTrends = buildMonthlyJobRequests(postedJobs).map((item) => {
    const monthJobs = postedJobs.filter((job) => {
      const date = new Date(job?.createdAt || job?.created_at || job?.preferredDate || Date.now());
      return !Number.isNaN(date.getTime()) && date.toLocaleString("en-US", { month: "short" }) === item.month;
    });
    const averageRate = monthJobs.length
      ? monthJobs.reduce((sum, job) => sum + Number(job.offeredRate || 0), 0) / monthJobs.length
      : 0;
    return {
      month: item.month,
      averageRate,
      postings: monthJobs.length,
    };
  });

  const barangayDemand = buildBarangayAnalytics(postedJobs, (job) => job.barangay, "jobs");
  const workerAvailability = buildBarangayAnalytics(registeredWorkers, (worker) => worker.barangay, "workers");

  return {
    summary: {
      totalUsers: registeredWorkers.length + registeredHouseholds.length,
      totalWorkers: registeredWorkers.length,
      households: registeredHouseholds.length,
      totalJobPostings: postedJobs.length,
      activeJobs: postedJobs.filter((job) => job.status === "Open").length,
      activeApplications: postedJobs.reduce(
        (sum, job) =>
          sum +
          (job.applications || []).filter(
            (application) => !["Rejected", "Completed", "Cancelled"].includes(application.status),
          ).length,
        0,
      ),
      completedServices: postedJobs.filter((job) => job.status === "Completed").length,
      cancelledRequests: postedJobs.filter((job) => job.status === "Cancelled").length,
      ongoingMatches: postedJobs.filter((job) =>
        (job.applications || []).some((application) => application.status === "Hired"),
      ).length,
      verifiedUsers: verifiedWorkers,
      verifiedWorkers,
      pendingVerifications: verificationRequests.filter((request) => request.status === "Pending").length,
      rejectedVerifications: verificationRequests.filter((request) => request.status === "Rejected").length,
      rejectedWorkers: registeredWorkers.filter((worker) => worker.verification === "Rejected").length,
      verifiedPercent: registeredWorkers.length ? Math.round((verifiedWorkers / registeredWorkers.length) * 100) : 0,
      averageWorkerRating,
      ratedWorkerCount: workerRatingValues.length,
    },
    monthlyJobRequests: buildMonthlyJobRequests(postedJobs),
    serviceAnalytics: buildServiceAnalytics(postedJobs),
    geographicAnalytics: {
      barangayDemand,
      workerAvailability,
    },
    barangayJobAnalytics: barangayDemand,
    barangayWorkerAnalytics: workerAvailability,
    heatMapData: buildBarangayHeatMapData(postedJobs, registeredWorkers, verificationRequests, "jobs"),
    ratingDistribution: buildRatingDistribution(registeredWorkers),
    rateTransparency: {
      averageRatesByCategory: serviceRateSummary,
      pricingTrends,
    },
    serviceRateSummary: serviceRateSummary.slice(0, 5),
  };
}

export function useDashboardMetrics({ currentUser, postedJobs, registeredHouseholds, registeredWorkers, verificationRequests }) {
  const [dashboardMetrics, setDashboardMetrics] = useState({
    openJobs: 0,
    verifiedWorkers: 0,
    completedJobs: 0,
    totalAccounts: 0,
    avgRating: null,
    analytics: buildDefaultAnalytics(),
  });

  useEffect(() => {
    let cancelled = false;

    function buildLocalMetrics() {
      const openJobSlots = postedJobs
        .filter((job) => job.status === "Open")
        .reduce((total, job) => total + getWorkersNeeded(job), 0);

      return {
        openJobs: openJobSlots,
        verifiedWorkers: registeredWorkers.filter((worker) => worker.verification === "Verified").length,
        completedJobs: postedJobs.filter((job) => job.status === "Completed").length,
        totalAccounts: registeredWorkers.length + registeredHouseholds.length,
        avgRating: null,
        analytics: buildLocalAnalytics({ postedJobs, registeredHouseholds, registeredWorkers, verificationRequests }),
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
            analytics: data.analytics || buildDefaultAnalytics(),
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
  }, [currentUser?.role, postedJobs, registeredHouseholds, registeredWorkers, verificationRequests]);

  return dashboardMetrics;
}
