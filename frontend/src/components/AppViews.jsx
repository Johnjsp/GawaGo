import React, { useEffect, useMemo, useState } from "react";
import { SidebarIcon } from "./DashboardLayout";
import HomeView from "./HomeView";
import HouseholdJobMapPanel from "./HouseholdJobMapPanel";
import JobImageUpload from "./JobImageUpload";
import LocationDistanceMap from "./LocationDistanceMap";
import WorkerLocationPicker from "./WorkerLocationPicker";
import { haversineDistanceKm } from "../utils/locationServices";
import { getBarangayCenter } from "../utils/locationUtils";
import { getHiringProgressLabel, getPendingApplicationCount, getWorkersNeeded } from "../utils/jobUtils";
export default function AppViews({
  SKILLS,
  adminSection,
  adminVisibleWorkers,
  approvedVerificationRequests,
  buildMatchedWorkersForJob,
  currentHousehold,
  currentUser,
  currentWorker,
  dashboardMetrics,
  formatCurrency,
  formatDateTime,
  formatDistance,
  formatLocation,
  formatRate,
  formatScheduleLabel,
  getDisplayName,
  getJobStatusBadgeClass,
  goBack,
  handleAdminApproveVerification,
  handleAdminRejectVerification,
  handleApplyToJob,
  handleCancelJob,
  handleConfirmJobCompleted,
  handleHireWorker,
  handleWorkerHireDecision,
  handleWorkerRequestCompletion,
  handleHouseholdChange,
  handleHouseholdJobChange,
  handleHouseholdJobSubmit,
  handleHouseholdProfileChange,
  handleHouseholdProfileSave,
  handleHouseholdRegisterSubmit,
  handleHouseholdReviewSubmit,
  handleLoginChange,
  handleLoginSubmit,
  handleLogout,
  handleRejectApplication,
  handleVerificationChange,
  handleVerificationSubmit,
  handleWorkerChange,
  handleWorkerFeedbackForReviewSubmit,
  handleWorkerProfileChange,
  handleWorkerProfileSave,
  handleWorkerRegisterSubmit,
  householdForm,
  householdJobCoordinates,
  householdJobForm,
  householdJobImages,
  householdJobLocationPreview,
  householdJobMapMode,
  householdJobMapRef,
  householdJobMapViewRef,
  householdJobs,
  householdNotificationsWithReadState,
  householdProfileForm,
  householdReviewForm,
  householdUnreadCount,
  isAdminPortalPath,
  loginForm,
  markAllNotificationsRead,
  markNotificationRead,
  openAdminDashboard,
  openAdminWorkersHistory,
  openFilePreview,
  openForgotPassword,
  openHouseholdDashboard,
  openHouseholdFeedbackAll,
  openHouseholdJobDetail,
  openHouseholdMyJobs,
  openHouseholdNotificationWorker,
  openHouseholdNotifications,
  openHouseholdPostJob,
  openHouseholdProfile,
  openHouseholdRegister,
  openHouseholdReviewsAll,
  openLogin,
  openMatchedWorkerProfile,
  openVerificationRequest,
  openWorkerApplications,
  openWorkerDashboard,
  openWorkerFindJobs,
  openWorkerGetVerified,
  openWorkerJobDetail,
  openWorkerNotifications,
  openWorkerProfile,
  openWorkerRegister,
  pendingVerificationRequests,
  registeredHouseholds,
  registeredWorkers,
  rejectedVerificationRequests,
  renderBarangayOptions,
  captureHouseholdJobLocation,
  loadLeafletAssets,
  placeHouseholdJobPin,
  selectedJob,
  selectedMatchedWorkers,
  selectedVerificationRequest,
  selectedVerificationRequestId,
  selectedWorker,
  selectedWorkerPhoto,
  setHouseholdReviewForm,
  setHouseholdJobMapMode,
  setSelectedJobId,
  setSelectedWorkerId,
  setWorkerForm,
  setWorkerProfileForm,
  toggleSkill,
  toggleWorkerProfileSkill,
  verificationForm,
  verificationRequests,
  view,
  workerApplicationUnreadCount,
  workerApplications,
  workerForm,
  workerMatchedJobs,
  workerMiniPhoto,
  workerNotificationsWithReadState,
  workerProfileForm,
  workerUnreadCount,
  workerVisibleJobs,
}) {
  const [householdFeedbackDateFilter, setHouseholdFeedbackDateFilter] = useState("");
  const [householdJobStatusFilter, setHouseholdJobStatusFilter] = useState("All");
  const [householdNotificationDateFilter, setHouseholdNotificationDateFilter] = useState("");
  const [householdReviewDateFilter, setHouseholdReviewDateFilter] = useState("");
  const [householdReviewRatingFilter, setHouseholdReviewRatingFilter] = useState("");
  const [workerFeedbackDateFilter, setWorkerFeedbackDateFilter] = useState("");
  const [workerHouseholdReplyDrafts, setWorkerHouseholdReplyDrafts] = useState({});
  const [workerRatingDateFilter, setWorkerRatingDateFilter] = useState("");
  const [workerProfilePanel, setWorkerProfilePanel] = useState("profile");
  const [workerJobTypeFilter, setWorkerJobTypeFilter] = useState("All Types");
  const [workerBarangayFilter, setWorkerBarangayFilter] = useState("");
  const [workerMarketSearch, setWorkerMarketSearch] = useState("");
  const [householdNotificationPreview, setHouseholdNotificationPreview] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const addWorkerAvailabilityWindow = () => {
    setWorkerProfileForm((prev) => ({
      ...prev,
      availabilityWindows: [
        ...(prev.availabilityWindows || []),
        {
          id: `availability-${Date.now()}`,
          date: "",
          startTime: "08:00",
          endTime: "17:00",
          isAvailable: true,
        },
      ],
    }));
  };
  const updateWorkerAvailabilityWindow = (windowId, field, value) => {
    setWorkerProfileForm((prev) => ({
      ...prev,
      availabilityWindows: (prev.availabilityWindows || []).map((window) =>
        window.id === windowId ? { ...window, [field]: value } : window,
      ),
    }));
  };
  const removeWorkerAvailabilityWindow = (windowId) => {
    setWorkerProfileForm((prev) => ({
      ...prev,
      availabilityWindows: (prev.availabilityWindows || []).filter((window) => window.id !== windowId),
    }));
  };
  const [workerProfileEditing, setWorkerProfileEditing] = useState(false);
  const [workerPhotoModalOpen, setWorkerPhotoModalOpen] = useState(false);
  const [householdDashboardDetailJobId, setHouseholdDashboardDetailJobId] = useState(null);
  const [householdDashboardReviewOpen, setHouseholdDashboardReviewOpen] = useState(false);
  const [householdProfileEditing, setHouseholdProfileEditing] = useState(false);
  const [selectedWorkerRouteDistanceKm, setSelectedWorkerRouteDistanceKm] = useState(null);
  const navIcon = (name) => <SidebarIcon name={name} />;
  const getDistancePoint = (record) => {
    const latitude = record?.latitude ?? null;
    const longitude = record?.longitude ?? null;
    if (
      latitude !== null &&
      longitude !== null &&
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
    ) {
      return {
        latitude,
        longitude,
      };
    }
    return getBarangayCenter(record?.barangay || "");
  };
  const getWorkerJobDistanceLabel = (job) => {
    if (!currentWorker || !job) {
      return "";
    }
    const household = registeredHouseholds.find((item) => item.username === job.householdUsername);
    const workerPoint = getDistancePoint(currentWorker);
    const jobPoint = getDistancePoint({
      barangay: household?.barangay || job.barangay,
      latitude: job.latitude ?? household?.latitude ?? null,
      longitude: job.longitude ?? household?.longitude ?? null,
    });
    return formatDistance(
      haversineDistanceKm(workerPoint.latitude, workerPoint.longitude, jobPoint.latitude, jobPoint.longitude),
    );
  };
  const currentWorkerIsVerified = String(currentWorker?.verification || "").toLowerCase() === "verified";
  const workerPendingHireRequests = workerApplications.filter((job) => job.applicationStatus === "Hire Request");
  const workerGeneralNotifications = workerNotificationsWithReadState.filter(
    (item) => item.notificationType !== "hiring",
  );
  const selectedWorkerApplication =
    selectedJob && selectedWorker
      ? (selectedJob.applications || []).find(
          (item) =>
            String(item.workerId) === String(selectedWorker.id) ||
            item.workerUsername === selectedWorker.username,
        )
      : null;
  const selectedJobVisibleApplications = (selectedJob?.applications || []).filter(
    (application) => application.status !== "Rejected" && application.status !== "Closed",
  );
  const selectedJobApplicantWorkers = selectedJobVisibleApplications.map((application) => {
    const existingWorker = registeredWorkers.find(
      (worker) =>
        String(worker.id) === String(application.workerId) ||
        worker.username === application.workerUsername,
    );
    return {
      ...(existingWorker || {}),
      id: existingWorker?.id || application.workerId,
      username: existingWorker?.username || application.workerUsername,
      firstName: existingWorker?.firstName || application.workerName || "",
      lastName: existingWorker?.lastName || "",
      skills: existingWorker?.skills || [],
      verification: existingWorker?.verification || "Not Yet Verified",
      dailyRate: existingWorker?.dailyRate || "0.00",
      avatar: existingWorker?.avatar || (application.workerName || application.workerUsername || "W").slice(0, 1).toUpperCase(),
      applicationStatus: application.status,
      appliedAt: application.appliedAt,
    };
  });
  const selectedJobApplicantKeys = new Set(
    selectedJobVisibleApplications.flatMap((application) =>
      [application.workerId, application.workerUsername]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value)),
    ),
  );
  const selectedSuggestedWorkers = selectedMatchedWorkers.filter(
    (worker) =>
      !selectedJobApplicantKeys.has(String(worker.id)) &&
      !selectedJobApplicantKeys.has(String(worker.workerId)) &&
      !selectedJobApplicantKeys.has(String(worker.username)),
  );
  const canRejectSelectedWorkerApplication =
    selectedWorkerApplication && !["Hire Request", "Hired", "Rejected"].includes(selectedWorkerApplication.status);
  const selectedWorkerHireButtonLabel =
    selectedWorkerApplication?.status === "Pending"
      ? "Hire Worker"
      : selectedWorkerApplication?.status === "Hired"
        ? "Already Hired"
        : selectedWorkerApplication?.status === "Hire Request"
          ? "Hire Request Sent"
          : "Send Hire Request";
  const selectedWorkerHireButtonDisabled = ["Hired", "Hire Request", "Completed"].includes(
    selectedWorkerApplication?.status,
  );
  const selectedWorkerVerificationRequest =
    selectedWorker
      ? verificationRequests.find((item) => item.id === selectedWorker.verificationRequestId) ||
        verificationRequests.find((item) => item.workerId === selectedWorker.id) ||
        selectedWorker.verificationSubmission ||
        null
      : null;
  const householdWorkerFeedback = currentHousehold?.receivedFeedback || [];
  const householdSubmittedReviews = currentHousehold?.givenFeedback || [];
  const workerHouseholdReviews = currentWorker?.receivedReviews || [];
  const workerHouseholdFeedback = workerHouseholdReviews.filter((review) => review.feedback || review.comment);
  const workerHouseholdRatings = workerHouseholdReviews.filter((review) => review.rating != null);
  const workerRatingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: workerHouseholdRatings.filter((review) => Number(review.rating) === rating).length,
  }));
  const workerTotalReviews = workerHouseholdRatings.length;
  const workerRatingTotal = workerHouseholdRatings.reduce((total, review) => total + Number(review.rating || 0), 0);
  const workerAverageRating = workerTotalReviews > 0 ? workerRatingTotal / workerTotalReviews : null;
  const workerFiveStarRate =
    workerTotalReviews > 0
      ? Math.round(((workerRatingCounts.find((item) => item.rating === 5)?.count || 0) / workerTotalReviews) * 100)
      : 0;
  useEffect(() => {
    if (view !== "worker-profile" && workerProfilePanel !== "profile") {
      setWorkerProfilePanel("profile");
    }
  }, [view, workerProfilePanel]);
  useEffect(() => {
    if (view === "worker-profile" && workerProfilePanel === "ratings") {
      setWorkerProfilePanel("feedback");
    }
  }, [view, workerProfilePanel]);
  useEffect(() => {
    if (householdJobStatusFilter === "Cancelled") {
      setHouseholdJobStatusFilter("All");
    }
  }, [householdJobStatusFilter]);
  useEffect(() => {
    if (view !== "household-profile" && householdProfileEditing) {
      setHouseholdProfileEditing(false);
    }
  }, [householdProfileEditing, view]);
  useEffect(() => {
    if (view !== "worker-profile" && workerProfileEditing) {
      setWorkerProfileEditing(false);
    }
  }, [view, workerProfileEditing]);
  useEffect(() => {
    setSelectedWorkerRouteDistanceKm(null);
  }, [selectedJob?.id, selectedWorker?.id, selectedWorker?.username]);
  useEffect(() => {
    document.body.classList.toggle("gawago-mobile-menu-open", mobileMenuOpen);
    return () => document.body.classList.remove("gawago-mobile-menu-open");
  }, [mobileMenuOpen]);
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [view]);
  useEffect(() => {
    if (view !== "household-notifications" && householdNotificationPreview) {
      setHouseholdNotificationPreview(null);
    }
  }, [householdNotificationPreview, view]);
  useEffect(() => {
    const handleMobileSidebarClick = (event) => {
      const sidebarHead = event.target.closest(".worker-sidebar-head");
      const sidebarAction = event.target.closest(".worker-nav-item, .worker-sidebar-logout");
      if (!window.matchMedia("(max-width: 767px)").matches) {
        return;
      }
      if (sidebarHead) {
        sidebarHead.closest(".worker-sidebar")?.classList.toggle("mobile-menu-open");
        return;
      }
      if (sidebarAction) {
        sidebarAction.closest(".worker-sidebar")?.classList.remove("mobile-menu-open");
      }
    };
    document.addEventListener("click", handleMobileSidebarClick);
    return () => document.removeEventListener("click", handleMobileSidebarClick);
  }, []);
  const submitWorkerProfileForm = (event) => {
    if (!workerProfileEditing) {
      event.preventDefault();
      setWorkerProfileEditing(true);
      return;
    }
    const result = handleWorkerProfileSave(event);
    Promise.resolve(result).then(() => setWorkerProfileEditing(false));
    return result;
  };
  const workerMarketCategories = useMemo(() => {
    return SKILLS.filter((serviceType) => serviceType !== "Other").map((serviceType) => {
      const categoryJobs = workerVisibleJobs.filter((job) => job.serviceType === serviceType);
      const matchesWorkerSkills = (currentWorker?.skills || []).includes(serviceType);
      return {
        serviceType,
        openJobs: categoryJobs.reduce((total, job) => total + getWorkersNeeded(job), 0),
        matchesWorkerSkills,
      };
    });
  }, [SKILLS, currentWorker, workerVisibleJobs]);
  const filteredWorkerMarketCategories = useMemo(() => {
    const searchTerm = workerMarketSearch.trim().toLowerCase();
    if (!searchTerm) {
      return workerMarketCategories;
    }
    return workerMarketCategories.filter((category) => category.serviceType.toLowerCase().includes(searchTerm));
  }, [workerMarketCategories, workerMarketSearch]);
  const filteredWorkerVisibleJobs = useMemo(() => {
    return workerVisibleJobs.filter((job) => {
      const matchesJobType = workerJobTypeFilter === "All Types" || job.serviceType === workerJobTypeFilter;
      const matchesBarangay =
        !workerBarangayFilter.trim() ||
        String(job.barangay || "")
          .toLowerCase()
          .includes(workerBarangayFilter.trim().toLowerCase());
      return matchesJobType && matchesBarangay;
    });
  }, [workerBarangayFilter, workerJobTypeFilter, workerVisibleJobs]);
  const openWorkerFindJobsForCategory = (serviceType) => {
    setWorkerJobTypeFilter(serviceType);
    setWorkerBarangayFilter("");
    openWorkerFindJobs();
  };
  const openAllWorkerFindJobs = () => {
    setWorkerJobTypeFilter("All Types");
    setWorkerBarangayFilter("");
    openWorkerFindJobs();
  };
  const filteredHouseholdNotifications = useMemo(() => {
    if (!householdNotificationDateFilter) {
      return householdNotificationsWithReadState;
    }
    return householdNotificationsWithReadState.filter((notification) => {
      const notificationDate = new Date(notification.date || notification.createdAt || "");
      if (Number.isNaN(notificationDate.getTime())) {
        return false;
      }
      return notificationDate.toISOString().slice(0, 10) === householdNotificationDateFilter;
    });
  }, [householdNotificationDateFilter, householdNotificationsWithReadState]);
  const getHouseholdNotificationWorker = (notification) => {
    if (!notification?.workerId) {
      return null;
    }
    return registeredWorkers.find((worker) => String(worker.id) === String(notification.workerId)) || null;
  };
  const getHouseholdNotificationJob = (notification) => {
    if (!notification?.jobId) {
      return null;
    }
    return householdJobs.find((job) => String(job.id) === String(notification.jobId)) || null;
  };
  const openHouseholdNotificationPreview = (notification) => {
    markNotificationRead(notification.id);
    setHouseholdNotificationPreview(notification);
  };
  const closeHouseholdNotificationPreview = () => {
    setHouseholdNotificationPreview(null);
  };
  const openHouseholdNotificationPreviewDetails = () => {
    if (!householdNotificationPreview) {
      return;
    }
    const worker = getHouseholdNotificationWorker(householdNotificationPreview);
    closeHouseholdNotificationPreview();
    if (worker) {
      openMatchedWorkerProfile(worker, householdNotificationPreview.jobId);
      return;
    }
    if (householdNotificationPreview.jobId) {
      openHouseholdJobDetail(householdNotificationPreview.jobId);
    }
  };
  const filteredHouseholdWorkerFeedback = useMemo(() => {
    if (!householdFeedbackDateFilter) {
      return householdWorkerFeedback;
    }
    return householdWorkerFeedback.filter((review) => {
      const reviewDate = new Date(review.createdAt || review.date || "");
      if (Number.isNaN(reviewDate.getTime())) {
        return false;
      }
      return reviewDate.toISOString().slice(0, 10) === householdFeedbackDateFilter;
    });
  }, [householdFeedbackDateFilter, householdWorkerFeedback]);
  const filteredHouseholdSubmittedReviews = useMemo(() => {
    return householdSubmittedReviews.filter((review) => {
      if (householdReviewDateFilter) {
        const reviewDate = new Date(review.createdAt || review.date || "");
        if (Number.isNaN(reviewDate.getTime()) || reviewDate.toISOString().slice(0, 10) !== householdReviewDateFilter) {
          return false;
        }
      }
      if (householdReviewRatingFilter) {
        return String(review.rating || "") === householdReviewRatingFilter;
      }
      return true;
    });
  }, [householdReviewDateFilter, householdReviewRatingFilter, householdSubmittedReviews]);
  const filteredWorkerHouseholdFeedback = useMemo(() => {
    if (!workerFeedbackDateFilter) {
      return workerHouseholdReviews;
    }
    return workerHouseholdReviews.filter((review) => {
      const reviewDate = new Date(review.createdAt || review.date || "");
      if (Number.isNaN(reviewDate.getTime())) {
        return false;
      }
      return reviewDate.toISOString().slice(0, 10) === workerFeedbackDateFilter;
    });
  }, [workerFeedbackDateFilter, workerHouseholdReviews]);
  const filteredWorkerHouseholdRatings = useMemo(() => {
    if (!workerRatingDateFilter) {
      return workerHouseholdRatings;
    }
    return workerHouseholdRatings.filter((review) => {
      const reviewDate = new Date(review.createdAt || review.date || "");
      if (Number.isNaN(reviewDate.getTime())) {
        return false;
      }
      return reviewDate.toISOString().slice(0, 10) === workerRatingDateFilter;
    });
  }, [workerHouseholdRatings, workerRatingDateFilter]);
  const hasSentHouseholdFeedbackForReview = (review) =>
    (currentWorker?.givenFeedback || []).some((feedback) => {
      const sameHousehold =
        (feedback.targetUsername && review.authorUsername && feedback.targetUsername === review.authorUsername) ||
        (feedback.targetName && review.authorName && feedback.targetName === review.authorName);
      const sameJob = !review.jobTitle || !feedback.jobTitle || feedback.jobTitle === review.jobTitle;
      return sameHousehold && sameJob;
    });
  const submitHouseholdFeedbackReply = (event, review) => {
    event.preventDefault();
    const draftKey = review.id || `${review.authorUsername}-${review.createdAt}`;
    const draft = workerHouseholdReplyDrafts[draftKey] || { feedback: "", rating: "5" };
    const feedback = typeof draft === "string" ? draft : draft.feedback;
    const rating = typeof draft === "string" ? "5" : draft.rating;
    handleWorkerFeedbackForReviewSubmit(review, feedback, rating);
    setWorkerHouseholdReplyDrafts((prev) => ({
      ...prev,
      [draftKey]: { feedback: "", rating: "5" },
    }));
  };
  const renderWorkerApplicationAction = (job) => {
    const isCompleted = job.status === "Completed" || job.applicationStatus === "Completed";
    const isWaitingForHousehold = job.status === "Waiting for Household Confirmation";
    const isHired = job.applicationStatus === "Hired";

    if (job.applicationStatus === "Hire Request") {
      return (
        <div className="worker-application-actions">
          <button
            className="btn btn-success btn-sm"
            type="button"
            onClick={() => handleWorkerHireDecision(job.applicationId, "accept")}
          >
            Accept
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            type="button"
            onClick={() => handleWorkerHireDecision(job.applicationId, "reject")}
          >
            Reject
          </button>
        </div>
      );
    }

    if (isCompleted) {
      return (
        <button className="btn btn-outline-success btn-sm" type="button" onClick={() => openWorkerJobDetail(job.id)}>
          Completed Work
        </button>
      );
    }

    if (isWaitingForHousehold) {
      return <span className="worker-application-status-note">Waiting for household</span>;
    }

    if (isHired) {
      return (
        <button
          className="btn btn-success btn-sm"
          type="button"
          onClick={() => handleWorkerRequestCompletion(job.id, "I have completed the service today.")}
        >
          Complete
        </button>
      );
    }

    return <span className="worker-application-status-note">None</span>;
  };
  const getWorkerApplicationDisplayStatus = (job) => {
    if (job.status === "Completed" || job.applicationStatus === "Completed") {
      return "Completed";
    }
    if (job.status === "Waiting for Household Confirmation") {
      return "Waiting for Household Confirmation";
    }
    if (job.applicationStatus === "Hired") {
      return "In Progress";
    }
    return job.applicationStatus || "Pending";
  };
  const selectedWorkerJobPoint = getDistancePoint({
    barangay: selectedJob?.barangay || currentHousehold?.barangay,
    latitude: selectedJob?.latitude ?? currentHousehold?.latitude ?? null,
    longitude: selectedJob?.longitude ?? currentHousehold?.longitude ?? null,
  });
  const selectedWorkerPoint = selectedWorker
    ? getDistancePoint({
        barangay: selectedWorker.barangay,
        latitude: selectedWorker.latitude ?? null,
        longitude: selectedWorker.longitude ?? null,
      })
    : null;
  const selectedWorkerJobLatitude = selectedWorkerJobPoint?.latitude ?? null;
  const selectedWorkerJobLongitude = selectedWorkerJobPoint?.longitude ?? null;
  const selectedWorkerCalculatedDistanceKm = selectedWorker
    ? haversineDistanceKm(
        selectedWorkerJobLatitude,
        selectedWorkerJobLongitude,
        selectedWorkerPoint?.latitude ?? null,
        selectedWorkerPoint?.longitude ?? null,
      )
    : null;
  const selectedWorkerDistanceKm = selectedWorkerCalculatedDistanceKm ?? selectedWorker?.distanceKm ?? null;
  const selectedWorkerReviews = selectedWorker?.receivedReviews || [];
  const selectedWorkerRatings = selectedWorkerReviews.filter((review) => review.rating != null);
  const selectedWorkerRatingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: selectedWorkerRatings.filter((review) => Number(review.rating) === rating).length,
  }));
  const selectedWorkerTotalReviews = selectedWorkerRatings.length;
  const selectedWorkerRatingTotal = selectedWorkerRatings.reduce((total, review) => total + Number(review.rating || 0), 0);
  const selectedWorkerAverageRating =
    selectedWorkerTotalReviews > 0 ? selectedWorkerRatingTotal / selectedWorkerTotalReviews : null;
  const selectedWorkerFiveStarRate =
    selectedWorkerTotalReviews > 0
      ? Math.round(
          ((selectedWorkerRatingCounts.find((item) => item.rating === 5)?.count || 0) / selectedWorkerTotalReviews) *
            100,
        )
      : 0;
  const householdDashboardDetailJob =
    householdJobs.find((job) => String(job.id) === String(householdDashboardDetailJobId)) || null;
  function getAssignedWorkerForJob(job) {
    if (!job) {
      return null;
    }
    const acceptedApplication =
      (job.applications || []).find((application) => ["Completed", "Hired"].includes(application.status)) ||
      (job.applications || []).find((application) => application.status !== "Rejected") ||
      null;
    const matchedWorker =
      acceptedApplication &&
      registeredWorkers.find(
        (worker) =>
          String(worker.id) === String(acceptedApplication.workerId) ||
          worker.username === acceptedApplication.workerUsername ||
          getDisplayName(worker.firstName, worker.lastName, worker.username) === acceptedApplication.workerName,
      );
    if (matchedWorker) {
      return matchedWorker;
    }
    const matchedWorkerId = (job.matchedWorkerIds || [])[0];
    return registeredWorkers.find((worker) => String(worker.id) === String(matchedWorkerId)) || null;
  }
  const householdDashboardDetailWorker = getAssignedWorkerForJob(householdDashboardDetailJob);
  const selectedJobAssignedWorker = getAssignedWorkerForJob(selectedJob);
  function getHouseholdReviewForJobWorker(job, worker) {
    if (!job || !worker) {
      return null;
    }
    const workerNames = [
      worker.username,
      worker.workerUsername,
      getDisplayName(worker.firstName, worker.lastName, worker.username),
    ].filter(Boolean);
    const jobTitles = [job.jobTitle, job.serviceType].filter(Boolean);
    return (
      (currentHousehold?.givenFeedback || []).find((review) => {
        const sameWorker =
          workerNames.includes(review.targetUsername) ||
          workerNames.includes(review.targetName) ||
          workerNames.includes(review.target);
        const sameJob = !review.jobTitle || jobTitles.includes(review.jobTitle);
        return sameWorker && sameJob && review.rating != null;
      }) || null
    );
  }
  const activeHouseholdJobs = useMemo(
    () =>
      householdJobs.filter((job) => {
        if (job.status === "Cancelled") {
          return false;
        }
        if (job.status !== "Completed") {
          return true;
        }
        return !getHouseholdReviewForJobWorker(job, getAssignedWorkerForJob(job));
      }),
    [currentHousehold?.givenFeedback, householdJobs, registeredWorkers],
  );
  const pendingHouseholdReviewJobs = useMemo(
    () =>
      householdJobs.filter((job) => {
        if (job.status !== "Completed") {
          return false;
        }
        const assignedWorker = getAssignedWorkerForJob(job);
        return assignedWorker && !getHouseholdReviewForJobWorker(job, assignedWorker);
      }),
    [currentHousehold?.givenFeedback, householdJobs, registeredWorkers],
  );
  const filteredHouseholdJobs = useMemo(() => {
    if (householdJobStatusFilter === "All") {
      return activeHouseholdJobs;
    }
    return activeHouseholdJobs.filter(
      (job) => String(job.status || "").toLowerCase() === householdJobStatusFilter.toLowerCase(),
    );
  }, [activeHouseholdJobs, householdJobStatusFilter]);
  const selectedJobWorkerReview = getHouseholdReviewForJobWorker(selectedJob, selectedJobAssignedWorker);
  const householdDashboardWorkerReview = getHouseholdReviewForJobWorker(
    householdDashboardDetailJob,
    householdDashboardDetailWorker,
  );
  const shouldShowSelectedJobReviewForm =
    selectedJob?.status === "Completed" && selectedJobAssignedWorker && !selectedJobWorkerReview;
  const shouldShowDashboardReviewForm =
    householdDashboardDetailJob?.status === "Completed" &&
    householdDashboardDetailWorker &&
    !householdDashboardWorkerReview;
  const renderHouseholdStarRatingInput = (labelId) => {
    const selectedRating = Number(householdReviewForm.rating || 0);

    return (
      <div className="household-dashboard-star-rating" id={labelId} role="radiogroup" aria-label="Rate worker">
        {[1, 2, 3, 4, 5].map((ratingValue) => (
          <button
            aria-checked={selectedRating === ratingValue}
            aria-label={`${ratingValue} star${ratingValue > 1 ? "s" : ""}`}
            className={`household-dashboard-star-button ${selectedRating >= ratingValue ? "selected" : ""}`}
            key={ratingValue}
            onClick={() => setHouseholdReviewForm((prev) => ({ ...prev, rating: String(ratingValue) }))}
            role="radio"
            type="button"
          />
        ))}
        <span>{selectedRating ? `${selectedRating}/5` : "Select rating"}</span>
      </div>
    );
  };
  const openHouseholdDashboardJobPanel = (job) => {
    const worker = getAssignedWorkerForJob(job);
    setHouseholdDashboardDetailJobId(job.id);
    setHouseholdDashboardReviewOpen(false);
    setSelectedJobId(job.id);
    setSelectedWorkerId(
      worker
        ? worker.id
        : {
            workerId: (job.applications || [])[0]?.workerId,
            workerUsername: (job.applications || [])[0]?.workerUsername,
            workerName: (job.applications || [])[0]?.workerName,
          },
    );
  };
  const closeHouseholdDashboardJobPanel = () => {
    setHouseholdDashboardDetailJobId(null);
    setHouseholdDashboardReviewOpen(false);
  };
  const openHouseholdDashboardReviewsFromJob = () => {
    closeHouseholdDashboardJobPanel();
    openHouseholdProfile();
  };
  const openReviewFormForWorker = (worker) => {
    if (worker) {
      setSelectedWorkerId(worker);
    }
    setHouseholdDashboardReviewOpen(true);
  };
  const confirmSelectedJobCompleted = () => {
    if (!selectedJob) {
      return;
    }
    openReviewFormForWorker(selectedJobAssignedWorker);
    handleConfirmJobCompleted(selectedJob.id);
  };
  const confirmDashboardJobCompleted = () => {
    if (!householdDashboardDetailJob) {
      return;
    }
    openReviewFormForWorker(householdDashboardDetailWorker);
    handleConfirmJobCompleted(householdDashboardDetailJob.id);
  };
  const handleHouseholdProfileEditSubmit = (event) => {
    if (!householdProfileEditing) {
      event.preventDefault();
      setHouseholdProfileEditing(true);
      return;
    }
    handleHouseholdProfileSave(event);
    setHouseholdProfileEditing(false);
  };

  return (
    <div className="app-shell">
      {!["home", "login", "register-worker", "register-household"].includes(view) && (
        <>
          <div className="mobile-sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
          <header className="mobile-dashboard-topbar">
            <button
              type="button"
              className={`mobile-burger-button ${mobileMenuOpen ? "open" : ""}`}
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
            <span className="mobile-dashboard-title">GawaGo</span>
          </header>
        </>
      )}
      <main>
        {(view === "home" || view === "login") && (
          <HomeView
            dashboardMetrics={dashboardMetrics}
            isAdminPortal={isAdminPortalPath}
            initialShowLogin={view === "login"}
            loginForm={loginForm}
            onLoginChange={handleLoginChange}
            onLoginSubmit={handleLoginSubmit}
            onOpenForgotPassword={openForgotPassword}
            onOpenHouseholdRegister={openHouseholdRegister}
            onOpenWorkerRegister={openWorkerRegister}
          />
        )}
        {view === "register-worker" && (
          <section className="login-section py-5">
            <div className="container login-page-wrap">
              <div className="login-shell shadow-sm">
                <div className="login-topbar d-flex align-items-center px-3">
                  <span className="badge rounded-pill text-bg-light text-primary me-2">GG</span>
                  <span className="small fw-semibold">GawaGo Community Platform</span>
                </div>
                <div className="register-card mx-auto my-4">
                  <div className="register-card-head">
                    <h2 className="h5 mb-0">Register as Worker</h2>
                  </div>
                  <form className="p-3 p-md-4" onSubmit={handleWorkerRegisterSubmit}>
                    <div className="register-form-intro">
                      <h3>Register as Worker</h3>
                      <p>Set up your worker profile to start applying for jobs near you.</p>
                    </div>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="register-section-label">Personal Information</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          className="form-control"
                          placeholder="Juan"
                          value={workerForm.firstName}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          className="form-control"
                          placeholder="dela Cruz"
                          value={workerForm.lastName}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Username</label>
                        <input
                          type="text"
                          name="username"
                          className="form-control"
                          placeholder="juandc"
                          value={workerForm.username}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="juan@email.com"
                          value={workerForm.email}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-12">
                        <div className="register-section-label">Contact & Location</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number</label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <input
                            type="tel"
                            name="phone"
                            className="form-control"
                            placeholder="9XXXXXXXXX"
                            inputMode="numeric"
                            maxLength={10}
                            value={workerForm.phone}
                            onChange={handleWorkerChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Barangay</label>
                        <select
                          name="barangay"
                          className="form-select"
                          value={workerForm.barangay}
                          onChange={handleWorkerChange}
                        >
                          <option value="">--- Select Barangay ---</option>
                          {renderBarangayOptions()}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Street / House No.</label>
                        <input
                          type="text"
                          name="streetAddress"
                          className="form-control"
                          placeholder="e.g. 45 Mabini St."
                          value={workerForm.streetAddress}
                          onChange={handleWorkerChange}
                        />
                        <p className="form-text mb-0">Location coverage: Tayabas City, Quezon only.</p>
                      </div>
                      <div className="col-12">
                        <WorkerLocationPicker
                          form={workerForm}
                          setForm={setWorkerForm}
                          loadLeafletAssets={loadLeafletAssets}
                        />
                      </div>
                      <div className="col-12">
                        <div className="register-section-label">Worker Profile</div>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Bio / About Me</label>
                        <textarea
                          name="bio"
                          className="form-control"
                          rows="3"
                          placeholder="Tell households about yourself and your experience..."
                          value={workerForm.bio}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Hourly Rate (PHP)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="hourlyRate"
                          className="form-control"
                          placeholder="0.00"
                          value={workerForm.hourlyRate}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Daily Rate (PHP)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="dailyRate"
                          className="form-control"
                          placeholder="0.00"
                          value={workerForm.dailyRate}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          name="yearsExperience"
                          className="form-control"
                          placeholder="0"
                          value={workerForm.yearsExperience}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-12">
                        <div className="register-section-label">Skills <span>(select all that apply)</span></div>
                        <div className="skills-grid">
                          {SKILLS.map((skill) => (
                            <label key={skill} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={workerForm.skills.includes(skill)}
                                onChange={() => toggleSkill(skill)}
                              />
                              <span className="form-check-label">{skill}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {workerForm.skills.includes("Other") && (
                        <div className="col-12">
                          <label className="form-label fw-semibold">Other skill</label>
                          <input
                            type="text"
                            name="customSkill"
                            className="form-control"
                            placeholder="Enter your other skill"
                            value={workerForm.customSkill}
                            onChange={handleWorkerChange}
                          />
                        </div>
                      )}
                      <div className="col-12">
                        <div className="register-section-label">Security</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Password</label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          placeholder="••••••••"
                          value={workerForm.password}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className="form-control"
                          placeholder="••••••••"
                          value={workerForm.confirmPassword}
                          onChange={handleWorkerChange}
                        />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary w-100">
                          {" "}
                          Create Worker Account{" "}
                        </button>
                      </div>
                    </div>
                  </form>
                  <div className="login-card-foot text-center p-3">
                    <p className="small mb-0">
                      {" "}
                      Already have an account?
                      <button type="button" className="btn btn-link btn-sm align-baseline p-0" onClick={openLogin}>
                        {" "}
                        Login here{" "}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {view === "register-household" && (
          <section className="login-section py-5">
            <div className="container login-page-wrap">
              <div className="login-shell shadow-sm">
                <div className="login-topbar d-flex align-items-center px-3">
                  <span className="badge rounded-pill text-bg-light text-primary me-2">GG</span>
                  <span className="small fw-semibold">GawaGo Community Platform</span>
                </div>
                <div className="register-card register-card-sm mx-auto my-4">
                  <div className="register-card-head">
                    <h2 className="h5 mb-0">Register as Household</h2>
                  </div>
                  <form className="p-3 p-md-4" onSubmit={handleHouseholdRegisterSubmit}>
                    <div className="register-form-intro">
                      <h3>Register as Household</h3>
                      <p>Create your account to start finding trusted workers near you.</p>
                    </div>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="register-section-label">Personal Information</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          className="form-control"
                          placeholder="Juan"
                          value={householdForm.firstName}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          className="form-control"
                          placeholder="dela Cruz"
                          value={householdForm.lastName}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Username</label>
                        <input
                          type="text"
                          name="username"
                          className="form-control"
                          placeholder="juandc"
                          value={householdForm.username}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="juan@email.com"
                          value={householdForm.email}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-12">
                        <div className="register-section-label">Contact & Location</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number</label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <input
                            type="tel"
                            name="phone"
                            className="form-control"
                            placeholder="9XXXXXXXXX"
                            inputMode="numeric"
                            maxLength={10}
                            value={householdForm.phone}
                            onChange={handleHouseholdChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Barangay</label>
                        <select
                          name="barangay"
                          className="form-select"
                          value={householdForm.barangay}
                          onChange={handleHouseholdChange}
                        >
                          <option value="">--- Select Barangay ---</option>
                          {renderBarangayOptions()}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Street / House No.</label>
                        <input
                          type="text"
                          name="streetAddress"
                          className="form-control"
                          placeholder="e.g. 45 Mabini St."
                          value={householdForm.streetAddress}
                          onChange={handleHouseholdChange}
                        />
                        <p className="form-text mb-0">Location coverage: Tayabas City, Quezon only.</p>
                      </div>
                      <div className="col-12">
                        <div className="register-section-label">Security</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Password</label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          placeholder="••••••••"
                          value={householdForm.password}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className="form-control"
                          placeholder="••••••••"
                          value={householdForm.confirmPassword}
                          onChange={handleHouseholdChange}
                        />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary w-100">
                          {" "}
                          Create Household Account{" "}
                        </button>
                      </div>
                    </div>
                  </form>
                  <div className="login-card-foot text-center p-3">
                    <p className="small mb-0">
                      {" "}
                      Already have an account?
                      <button type="button" className="btn btn-link btn-sm align-baseline p-0" onClick={openLogin}>
                        {" "}
                        Login here{" "}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {view === "worker-dashboard" && (
          <section className="worker-dashboard worker-dashboard-home">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item active">{navIcon("dashboard")}
                    <span>Dashboard</span></button>
                  <button className="worker-nav-item" onClick={openAllWorkerFindJobs}>
                    {navIcon("search")}
                    <span>Find Jobs</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    {navIcon("applications")}
                    <span>My Applications</span>
                    {workerApplicationUnreadCount > 0 && (
                      <span className="nav-count-badge">{workerApplicationUnreadCount}</span>
                    )}
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    {navIcon("verified")}
                    <span>Get Verified</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                    {workerUnreadCount > 0 && <span className="nav-count-badge">{workerUnreadCount}</span>}
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <div className="worker-dashboard-welcome-strip">
                  Welcome, {currentUser?.displayName || "Worker"}
                </div>

                <div className="worker-dashboard-stats">
                  <div className="metric-card">
                    <p className="metric-label mb-1">Open Jobs</p>
                    <p className="metric-value mb-0">{workerVisibleJobs.length}</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-label mb-1">Skill Matches</p>
                    <p className="metric-value mb-0">{workerMatchedJobs.length}</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-label mb-1">Your Rating</p>
                    <p className="metric-value worker-rating-value mb-0">{currentWorker?.rating || "No ratings yet"}</p>
                  </div>
                  <div className="metric-card">
                    <p className="metric-label mb-1">Verification</p>
                    <span
                      className={`badge ${currentWorker?.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}`}
                    >
                      {currentWorker?.verification || "Pending"}
                    </span>
                  </div>
                </div>

                <section className="worker-market-panel">
                  <div className="worker-market-head">
                    <h2>Job Market Overview</h2>
                    <input
                      className="form-control worker-market-search"
                      type="search"
                      placeholder="Search work category..."
                      value={workerMarketSearch}
                      onChange={(event) => setWorkerMarketSearch(event.target.value)}
                    />
                  </div>
                  <div className="worker-market-grid">
                    {filteredWorkerMarketCategories.length > 0 ? (
                      filteredWorkerMarketCategories.map((category) => (
                      <article
                        className={`worker-market-card ${category.matchesWorkerSkills ? "worker-market-card-match" : ""}`}
                        key={category.serviceType}
                      >
                        <div>
                          <h3>{category.serviceType}</h3>
                          <p>{category.openJobs} open jobs</p>
                        </div>
                        <div className="worker-market-card-actions">
                          <span className={`badge ${category.matchesWorkerSkills ? "text-bg-primary" : "text-bg-light"}`}>
                            {category.matchesWorkerSkills ? "Matches your skills" : "Available market"}
                          </span>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            type="button"
                            onClick={() => openWorkerFindJobsForCategory(category.serviceType)}
                          >
                            View All
                          </button>
                        </div>
                      </article>
                      ))
                    ) : (
                      <article className="worker-market-card worker-market-empty">
                        <div>
                          <h3>No categories found</h3>
                          <p>Try searching another work category.</p>
                        </div>
                      </article>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </section>
        )}
        {view === "worker-find-jobs" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item active">{navIcon("search")}
                    <span>Find Jobs</span></button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    {navIcon("applications")}
                    <span>My Applications</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    {navIcon("verified")}
                    <span>Get Verified</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                    {workerUnreadCount > 0 && <span className="nav-count-badge">{workerUnreadCount}</span>}
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">
                    {" "}
                    Available Jobs <span className="badge text-bg-primary">{filteredWorkerVisibleJobs.length}</span>
                  </h1>
                </div>
                <div className="jobs-filter-panel mt-3">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold mb-1">Filter by Job Type</label>
                      <select
                        className="form-select"
                        value={workerJobTypeFilter}
                        onChange={(event) => setWorkerJobTypeFilter(event.target.value)}
                      >
                        <option>All Types</option>
                        {workerMarketCategories.map((category) => (
                          <option key={category.serviceType}>{category.serviceType}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold mb-1">Barangay</label>
                      <input
                        className="form-control"
                        placeholder="e.g. Poblacion"
                        value={workerBarangayFilter}
                        onChange={(event) => setWorkerBarangayFilter(event.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100" type="button">
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
                <p className="small text-primary fw-semibold mt-3 mb-2">Jobs matching your skills appear first</p>
                <div className="row g-3">
                  {filteredWorkerVisibleJobs.length > 0 ? (
                    filteredWorkerVisibleJobs.map((job) => (
                      <div className="col-lg-6" key={job.id}>
                        <article className="job-card">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h2 className="h5 mb-1">{job.jobTitle || job.serviceType}</h2>
                              <p className="text-muted mb-1">{job.description || "No description provided."}</p>
                            </div>
                            <span className={`badge ${job.matchesSkill ? "text-bg-primary" : "text-bg-secondary"}`}>
                              {job.matchesSkill ? "Matches Your Skills" : "Suggested"}
                            </span>
                          </div>
                          <p className="mb-1">{formatLocation(job.barangay, job.streetAddress)}</p>
                          <p className="mb-1">{formatDateTime(job.preferredDate, job.preferredTime)}</p>
                          <p className="mb-1 text-primary">{formatRate(job.offeredRate, job.rateType)}</p>
                          <p className="mb-3">{job.householdName || "Household"}</p>
                          <div className="worker-job-distance-badge mb-3">{getWorkerJobDistanceLabel(job)}</div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-secondary btn-sm flex-fill"
                              type="button"
                              onClick={() => openWorkerJobDetail(job.id)}
                            >
                              {" "}
                              View Details{" "}
                            </button>
                            {currentWorkerIsVerified && (
                              <button
                                className="btn btn-primary btn-sm flex-fill"
                                type="button"
                                onClick={() => handleApplyToJob(job.id)}
                              >
                                {" "}
                                Apply Now{" "}
                              </button>
                            )}
                          </div>
                          {!currentWorkerIsVerified && (
                            <div className="alert alert-warning mt-3 mb-0 py-2 small">
                              Locked until verified: you can browse jobs, but applications are unavailable until admin
                              approval.
                            </div>
                          )}
                        </article>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className="profile-card">
                        <div className="p-4 text-center text-muted">
                          {" "}
                          {workerJobTypeFilter === "All Types"
                            ? "Wala pang household job posts na available ngayon."
                            : `Wala pang household job posts para sa ${workerJobTypeFilter}.`}{" "}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "worker-profile" && workerProfilePanel === "feedback" && (
          <section className="worker-dashboard household-feedback-all-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openAllWorkerFindJobs}>
                    {navIcon("search")}
                    <span>Find Jobs</span>
                  </button>
                  <button className="worker-nav-item active" onClick={() => setWorkerProfilePanel("profile")}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    {navIcon("applications")}
                    <span>My Applications</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    {navIcon("verified")}
                    <span>Get Verified</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <main className="household-feedback-all-container">
                  <section className="household-feedback-hero">
                    <div>
                      <h1>All Feedback & Ratings by Households</h1>
                      <p>Household ratings and comments about your completed services.</p>
                    </div>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => setWorkerProfilePanel("profile")}
                    >
                      Back
                    </button>
                  </section>

                  <section className="household-feedback-list-panel" aria-label="All household feedback and ratings">
                    <div className="household-feedback-filter">
                      <label className="form-label mb-0" htmlFor="worker-feedback-date">
                        Filter Date
                      </label>
                      <input
                        id="worker-feedback-date"
                        type="date"
                        className="form-control"
                        value={workerFeedbackDateFilter}
                        onChange={(event) => setWorkerFeedbackDateFilter(event.target.value)}
                      />
                      {workerFeedbackDateFilter && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={() => setWorkerFeedbackDateFilter("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="household-feedback-list">
                      {filteredWorkerHouseholdFeedback.length > 0 ? (
                        filteredWorkerHouseholdFeedback.map((review, index) => {
                          const authorName = review.authorName || review.author || "Household";
                          const initial = authorName.slice(0, 1).toUpperCase() || "H";
                          const draftKey = review.id || `${review.authorUsername}-${review.createdAt}`;
                          const replySent = hasSentHouseholdFeedbackForReview(review);
                          return (
                            <article className="household-feedback-item" key={review.id || `${review.createdAt}-${index}`}>
                              <div className="household-feedback-avatar">{initial}</div>
                              <div className="household-feedback-copy">
                                <div className="household-review-title-row">
                                  <h2>{authorName}</h2>
                                  {review.rating != null && <strong>{review.rating}/5</strong>}
                                </div>
                                <p>{review.feedback || review.comment || "No comment provided."}</p>
                                <small>{review.createdAt || review.date || "Recently"}</small>
                                {replySent ? (
                                  <p className="small text-muted mb-0 mt-2">Anonymous feedback already sent to household.</p>
                                ) : (
                                  <form
                                    className="d-grid gap-2 mt-3"
                                    onSubmit={(event) => submitHouseholdFeedbackReply(event, review)}
                                  >
                                    <label className="form-label fw-semibold mb-0" htmlFor={`worker-rating-${draftKey}`}>
                                      Rate household
                                    </label>
                                    <select
                                      className="form-select"
                                      id={`worker-rating-${draftKey}`}
                                      value={
                                        typeof workerHouseholdReplyDrafts[draftKey] === "object"
                                          ? workerHouseholdReplyDrafts[draftKey]?.rating || "5"
                                          : "5"
                                      }
                                      onChange={(event) =>
                                        setWorkerHouseholdReplyDrafts((prev) => ({
                                          ...prev,
                                          [draftKey]: {
                                            ...(typeof prev[draftKey] === "object" ? prev[draftKey] : { feedback: prev[draftKey] || "" }),
                                            rating: event.target.value,
                                          },
                                        }))
                                      }
                                    >
                                      <option value="5">5 stars</option>
                                      <option value="4">4 stars</option>
                                      <option value="3">3 stars</option>
                                      <option value="2">2 stars</option>
                                      <option value="1">1 star</option>
                                    </select>
                                    <label className="form-label fw-semibold mb-0" htmlFor={`worker-reply-${draftKey}`}>
                                      Send feedback to household
                                    </label>
                                    <textarea
                                      className="form-control"
                                      id={`worker-reply-${draftKey}`}
                                      rows="3"
                                      placeholder="Write feedback for the household..."
                                      value={
                                        typeof workerHouseholdReplyDrafts[draftKey] === "object"
                                          ? workerHouseholdReplyDrafts[draftKey]?.feedback || ""
                                          : workerHouseholdReplyDrafts[draftKey] || ""
                                      }
                                      onChange={(event) =>
                                        setWorkerHouseholdReplyDrafts((prev) => ({
                                          ...prev,
                                          [draftKey]: {
                                            ...(typeof prev[draftKey] === "object" ? prev[draftKey] : { rating: "5" }),
                                            feedback: event.target.value,
                                          },
                                        }))
                                      }
                                    />
                                    <button className="btn btn-primary btn-sm justify-self-start" type="submit">
                                      Send Feedback
                                    </button>
                                  </form>
                                )}
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <article className="household-feedback-empty">
                          <h2>No feedback or ratings found</h2>
                          <p>
                            {workerFeedbackDateFilter
                              ? "No household feedback or ratings match the selected date."
                              : "No household feedback or ratings have been submitted for this worker yet."}
                          </p>
                        </article>
                      )}
                    </div>
                  </section>
                </main>
              </div>
            </div>
          </section>
        )}
        {view === "worker-profile" && workerProfilePanel === "ratings" && (
          <section className="worker-dashboard household-feedback-all-page household-reviews-all-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openAllWorkerFindJobs}>
                    {navIcon("search")}
                    <span>Find Jobs</span>
                  </button>
                  <button className="worker-nav-item active" onClick={() => setWorkerProfilePanel("profile")}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    {navIcon("applications")}
                    <span>My Applications</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    {navIcon("verified")}
                    <span>Get Verified</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <main className="household-feedback-all-container">
                  <section className="household-feedback-hero">
                    <div>
                      <h1>All Ratings by Households</h1>
                      <p>Rating history from households after completed jobs.</p>
                    </div>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => setWorkerProfilePanel("profile")}
                    >
                      Back
                    </button>
                  </section>

                  <section className="household-feedback-list-panel" aria-label="All household ratings">
                    <div className="household-feedback-filter">
                      <label className="form-label mb-0" htmlFor="worker-rating-date">
                        Filter Date
                      </label>
                      <input
                        id="worker-rating-date"
                        type="date"
                        className="form-control"
                        value={workerRatingDateFilter}
                        onChange={(event) => setWorkerRatingDateFilter(event.target.value)}
                      />
                      {workerRatingDateFilter && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={() => setWorkerRatingDateFilter("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="household-feedback-list">
                      {filteredWorkerHouseholdRatings.length > 0 ? (
                        filteredWorkerHouseholdRatings.map((review, index) => {
                          const authorName = review.authorName || review.author || "Household";
                          const initial = authorName.slice(0, 1).toUpperCase() || "H";
                          return (
                            <article className="household-feedback-item" key={review.id || `${review.createdAt}-${index}`}>
                              <div className="household-feedback-avatar">{initial}</div>
                              <div className="household-feedback-copy">
                                <div className="household-review-title-row">
                                  <h2>{authorName}</h2>
                                  <strong>{review.rating != null ? `${review.rating}/5` : "No rating"}</strong>
                                </div>
                                <p>{review.feedback || review.comment || "No comment provided."}</p>
                                <small>{review.createdAt || review.date || "Recently"}</small>
                                <details className="household-feedback-more">
                                  <summary>View more</summary>
                                  <p>This rating came from a household after a completed service.</p>
                                </details>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <article className="household-feedback-empty">
                          <h2>No ratings found</h2>
                          <p>
                            {workerRatingDateFilter
                              ? "No household ratings match the selected date."
                              : "No household ratings have been submitted for this worker yet."}
                          </p>
                        </article>
                      )}
                    </div>
                  </section>
                </main>
              </div>
            </div>
          </section>
        )}
        {view === "worker-profile" && workerProfilePanel === "profile" && (
          <section className="worker-dashboard profile-page household-profile-page worker-profile-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openAllWorkerFindJobs}>
                    {navIcon("search")}
                    <span>Find Jobs</span>
                  </button>
                  <button className="worker-nav-item active">{navIcon("profile")}
                    <span>My Profile</span></button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    {navIcon("applications")}
                    <span>My Applications</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    {navIcon("verified")}
                    <span>Get Verified</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <div className="row g-3">
                  <div className="col-lg-4">
                    <div className="profile-card">
                      <div className="profile-card-head">My Profile</div>
                      <div className="p-4 text-center">
                        {workerMiniPhoto ? (
                          <button
                            className="profile-photo-preview-trigger"
                            type="button"
                            onClick={() => setWorkerPhotoModalOpen(true)}
                            aria-label="View profile photo"
                          >
                            <img src={workerMiniPhoto} alt="Worker profile" className="profile-photo-large mb-2" />
                          </button>
                        ) : (
                          <div className="profile-avatar mb-2">
                            {(workerProfileForm.firstName || "W").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <h2 className="h5 mb-1">
                          {getDisplayName(
                            workerProfileForm.firstName,
                            workerProfileForm.lastName,
                            workerProfileForm.username,
                          )}
                        </h2>
                        <p className="text-muted mb-2">@{workerProfileForm.username || "worker"}</p>
                        <span className="badge text-bg-primary">Worker</span>
                      </div>
                      <div className="px-4 pb-4">
                        <p className="mb-1 small">
                          <strong>Barangay:</strong>
                          {workerProfileForm.barangay || "Not set"}
                        </p>
                        <p className="mb-1 small">
                          <strong>Phone:</strong>
                          {workerProfileForm.phone || "Not set"}
                        </p>
                        <p className="mb-2 small">
                          <strong>Email:</strong>
                          {workerProfileForm.email || "Not set"}
                        </p>
                        <hr className="my-2" />
                        <p className="mb-1 small">
                          <strong>Verification:</strong>
                          <span
                            className={`badge ${currentWorker?.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}`}
                          >
                            {currentWorker?.verification || "Pending"}
                          </span>
                        </p>
                        <p className="mb-1 small">
                          <strong>Rating:</strong> {currentWorker?.rating || "No ratings yet"}
                        </p>
                        <p className="mb-1 small">
                          <strong>Jobs Done:</strong> {currentWorker?.reviewsDone || 0}
                        </p>
                        <p className="mb-1 small">
                          <strong>Hourly Rate:</strong> PHP {workerProfileForm.hourlyRate || "0.00"}
                        </p>
                        <p className="mb-2 small">
                          <strong>Daily Rate:</strong> PHP {workerProfileForm.dailyRate || "0.00"}
                        </p>
                        <div className="d-flex gap-1 flex-wrap">
                          {(workerProfileForm.skills || []).length === 0 ? (
                            <span className="badge text-bg-secondary">No skills selected yet</span>
                          ) : (
                            workerProfileForm.skills.map((skill) => (
                              <span key={skill} className="badge text-bg-primary">
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="profile-card">
                      <div className="profile-card-head">Edit Profile Information</div>
                      <form className="p-3" onSubmit={submitWorkerProfileForm}>
                        <fieldset disabled={!workerProfileEditing} className="worker-profile-edit-fieldset">
                          <h3 className="h6 fw-bold mb-2">Profile Photo</h3>
                          <div className="mb-3">
                            <input
                              type="file"
                              className="form-control"
                              name="profilePhoto"
                              accept="image/*"
                              onChange={handleWorkerProfileChange}
                            />
                            <p className="form-text mb-0">Accepted: JPG, PNG. Clear face photo recommended.</p>
                          </div>
                          <h3 className="h6 fw-bold mb-2">Personal Information</h3>
                          <div className="row g-2 mb-3">
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">First Name</label>
                              <input
                                name="firstName"
                                className="form-control"
                                value={workerProfileForm.firstName}
                                onChange={handleWorkerProfileChange}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">Last Name</label>
                              <input
                                name="lastName"
                                className="form-control"
                                value={workerProfileForm.lastName}
                                onChange={handleWorkerProfileChange}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">Email</label>
                              <input
                                type="email"
                                name="email"
                                className="form-control"
                                value={workerProfileForm.email}
                                onChange={handleWorkerProfileChange}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">Phone Number</label>
                              <input
                                name="phone"
                                className="form-control"
                                value={workerProfileForm.phone}
                                onChange={handleWorkerProfileChange}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">Barangay</label>
                              <select
                                name="barangay"
                                className="form-select"
                                value={workerProfileForm.barangay}
                                onChange={handleWorkerProfileChange}
                              >
                                <option value="">---Select Barangay---</option>
                                {renderBarangayOptions()}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">Street / House No.</label>
                              <input
                                name="streetAddress"
                                className="form-control"
                                value={workerProfileForm.streetAddress}
                                onChange={handleWorkerProfileChange}
                              />
                            </div>
                            <div className="col-12">
                              <WorkerLocationPicker
                                form={workerProfileForm}
                                setForm={setWorkerProfileForm}
                                loadLeafletAssets={loadLeafletAssets}
                                compact
                              />
                            </div>
                          </div>
                          <h3 className="h6 fw-bold mb-2">Worker Information</h3>
                          <div className="mb-2">
                            <label className="form-label small fw-semibold mb-1">Bio / About Me</label>
                            <textarea
                              name="bio"
                              className="form-control"
                              rows="3"
                              value={workerProfileForm.bio}
                              onChange={handleWorkerProfileChange}
                            />
                          </div>
                          <div className="row g-2 mb-3">
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">Hourly Rate (PHP)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="hourlyRate"
                                className="form-control"
                                value={workerProfileForm.hourlyRate}
                                onChange={handleWorkerProfileChange}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold mb-1">Daily Rate (PHP)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="dailyRate"
                                className="form-control"
                                value={workerProfileForm.dailyRate}
                                onChange={handleWorkerProfileChange}
                              />
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-2">
                              <label className="form-label fw-semibold mb-0">Availability Windows</label>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                type="button"
                                disabled={!workerProfileEditing}
                                onClick={addWorkerAvailabilityWindow}
                              >
                                Add Window
                              </button>
                            </div>
                            {(workerProfileForm.availabilityWindows || []).length > 0 ? (
                              <div className="worker-availability-list">
                                {(workerProfileForm.availabilityWindows || []).map((window) => (
                                  <div className="worker-availability-row" key={window.id}>
                                    <input
                                      type="date"
                                      className="form-control"
                                      value={window.date}
                                      disabled={!workerProfileEditing}
                                      onChange={(event) => updateWorkerAvailabilityWindow(window.id, "date", event.target.value)}
                                    />
                                    <input
                                      type="time"
                                      className="form-control"
                                      value={String(window.startTime || "").slice(0, 5)}
                                      disabled={!workerProfileEditing}
                                      onChange={(event) => updateWorkerAvailabilityWindow(window.id, "startTime", event.target.value)}
                                    />
                                    <input
                                      type="time"
                                      className="form-control"
                                      value={String(window.endTime || "").slice(0, 5)}
                                      disabled={!workerProfileEditing}
                                      onChange={(event) => updateWorkerAvailabilityWindow(window.id, "endTime", event.target.value)}
                                    />
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      type="button"
                                      disabled={!workerProfileEditing}
                                      onClick={() => removeWorkerAvailabilityWindow(window.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="small text-muted mb-0">Add available dates and times so households can match with you.</p>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              {" "}
                              Skills <span className="fw-normal text-muted">(Select all that apply)</span>
                            </label>
                            <div className="skills-grid">
                              {SKILLS.map((skill) => (
                                <label key={skill} className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={workerProfileForm.skills.includes(skill)}
                                    onChange={() => toggleWorkerProfileSkill(skill)}
                                  />
                                  <span className="form-check-label">{skill}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </fieldset>
                        <div className="d-flex justify-content-end">
                          <button
                            className="btn btn-primary"
                            type={workerProfileEditing ? "submit" : "button"}
                            onClick={(event) => {
                              if (!workerProfileEditing) {
                                event.preventDefault();
                                setWorkerProfileEditing(true);
                              }
                            }}
                          >
                            {" "}
                            {workerProfileEditing ? "Save Changes" : "Edit Profile"}{" "}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                {workerPhotoModalOpen && workerMiniPhoto && (
                  <div
                    className="profile-photo-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Profile photo preview"
                    onClick={() => setWorkerPhotoModalOpen(false)}
                  >
                    <button
                      className="profile-photo-modal-close"
                      type="button"
                      onClick={() => setWorkerPhotoModalOpen(false)}
                      aria-label="Close profile photo preview"
                    >
                      Close
                    </button>
                    <img
                      src={workerMiniPhoto}
                      alt="Worker profile enlarged"
                      className="profile-photo-modal-image"
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                )}
                <section className="profile-footer worker-rating-summary" aria-labelledby="worker-profile-feedback-title">
                  <header className="worker-rating-header">
                    <h2 id="worker-profile-feedback-title">☆ Feedback & Rating</h2>
                    <span>From households</span>
                  </header>
                  <div className="worker-rating-body">
                    <div className="worker-rating-overview">
                      <div className="worker-rating-score">
                        <strong>{workerAverageRating != null ? workerAverageRating.toFixed(1) : "No ratings yet"}</strong>
                        {workerAverageRating != null && <span className="worker-rating-stars">★★★★★</span>}
                        <small>
                          {workerTotalReviews} {workerTotalReviews === 1 ? "review" : "reviews"}
                        </small>
                      </div>
                      <div className="worker-rating-bars" aria-label="Rating distribution">
                        {workerRatingCounts.map(({ rating, count }) => {
                          const percentage = workerTotalReviews > 0 ? (count / workerTotalReviews) * 100 : 0;
                          return (
                            <div className="worker-rating-bar-row" key={rating}>
                              <span>{rating}★</span>
                              <div className="worker-rating-track">
                                <div className="worker-rating-fill" style={{ width: `${percentage}%` }} />
                              </div>
                              <strong>{count}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="worker-rating-stats">
                      <div>
                        <strong>{workerTotalReviews}</strong>
                        <span>Total reviews</span>
                      </div>
                      <div>
                        <strong>{workerAverageRating != null ? workerAverageRating.toFixed(1) : "--"}</strong>
                        <span>Average rating</span>
                      </div>
                      <div>
                        <strong>{workerTotalReviews > 0 ? `${workerFiveStarRate}%` : "--"}</strong>
                        <span>5-star rate</span>
                      </div>
                    </div>

                    <div className="worker-recent-reviews-head">
                      <h3>Recent reviews</h3>
                      <button type="button" onClick={() => setWorkerProfilePanel("feedback")}>
                        View all →
                      </button>
                    </div>

                    <div className="worker-recent-reviews">
                      {workerHouseholdReviews.slice(0, 2).length > 0 ? (
                        workerHouseholdReviews.slice(0, 2).map((review) => {
                          const author = review.authorName || review.author || "Household";
                          const initials = author
                            .split(" ")
                            .map((part) => part.slice(0, 1))
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();
                          return (
                            <article className="worker-recent-review" key={review.id || `${author}-${review.createdAt}`}>
                              <div className="worker-review-avatar">{initials || "HH"}</div>
                              <div className="worker-review-copy">
                                <div className="worker-review-title-row">
                                  <div>
                                    <strong>{author}</strong>
                                    <small>{formatDateTime(review.createdAt || review.date || "") || "Recently"}</small>
                                  </div>
                                  {review.rating != null && (
                                    <span className="worker-review-rating">★★★★★ {Number(review.rating).toFixed(1)}</span>
                                  )}
                                </div>
                                <p>{review.feedback || review.comment || "No comment provided."}</p>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <article className="worker-recent-review worker-recent-review-empty">
                          <p>No household feedback or ratings yet.</p>
                        </article>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        )}
        {view === "worker-applications" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openAllWorkerFindJobs}>
                    {navIcon("search")}
                    <span>Find Jobs</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item active">
                    {navIcon("applications")}
                    <span>My Applications</span>
                    {workerApplicationUnreadCount > 0 && (
                      <span className="nav-count-badge">{workerApplicationUnreadCount}</span>
                    )}
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    {navIcon("verified")}
                    <span>Get Verified</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">My Applications</h1>
                </div>
                <div className="applications-filter mt-3">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <select className="form-select">
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100">Filter</button>
                    </div>
                  </div>
                </div>
                <div className="card border-0 shadow-sm mt-3">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Job</th>
                          <th>Household</th>
                          <th>Distance</th>
                          <th>Rate</th>
                          <th>Status</th>
                          <th>Applied</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workerApplications.length > 0 ? (
                          workerApplications.map((job) => (
                            <tr key={`${job.id}-${job.appliedAt}`}>
                              <td>{job.jobTitle || job.serviceType}</td>
                              <td>{job.householdName || "Household"}</td>
                              <td>{formatLocation(job.barangay, job.streetAddress)}</td>
                              <td>{formatRate(job.offeredRate, job.rateType)}</td>
                              <td>{getWorkerApplicationDisplayStatus(job)}</td>
                              <td>{job.appliedAt}</td>
                              <td>{renderWorkerApplicationAction(job)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center text-muted py-4">
                              {" "}
                              No applications yet.{" "}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {view === "worker-get-verified" && (
          <section className="worker-dashboard worker-get-verified-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openAllWorkerFindJobs}>
                    {navIcon("search")}
                    <span>Find Jobs</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    {navIcon("applications")}
                    <span>My Applications</span>
                    {workerApplicationUnreadCount > 0 && (
                      <span className="nav-count-badge">{workerApplicationUnreadCount}</span>
                    )}
                  </button>
                  <button className="worker-nav-item active">{navIcon("verified")}
                    <span>Get Verified</span></button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                {currentWorker?.verification === "Verified" ? (
                  <div className="verification-wrap verification-approved-wrap">
                    <div className="verification-card verification-approved-card">
                      <div className="verification-card-head">Get Verified</div>
                      <div className="verification-approved-body">
                        <section className="verification-approved-banner">
                          <h2>You're already verified</h2>
                          <p>Your verification is already approved by the admin, so the details below are now read-only.</p>
                        </section>

                        <div className="verification-approved-grid">
                          <article className="verification-approved-box">
                            <p className="verification-approved-label">Primary ID</p>
                            <p className="verification-approved-value">
                              {currentWorker.verificationSubmission?.primaryIdName || "Primary ID"}
                            </p>
                            {currentWorker.verificationSubmission?.primaryIdPreview ? (
                              <button
                                type="button"
                                className="verification-file-button"
                                onClick={() => openFilePreview(currentWorker.verificationSubmission.primaryIdPreview)}
                              >
                                View Primary ID
                              </button>
                            ) : (
                              <span className="verification-file-button disabled">Primary ID</span>
                            )}
                          </article>

                          <article className="verification-approved-box">
                            <p className="verification-approved-label">Supporting Documents</p>
                            <p className="verification-approved-value">
                              {currentWorker.verificationSubmission?.secondaryDocName || "Supporting document"}
                            </p>
                            {currentWorker.verificationSubmission?.secondaryDocPreview ? (
                              <button
                                type="button"
                                className="verification-file-button"
                                onClick={() => openFilePreview(currentWorker.verificationSubmission.secondaryDocPreview)}
                              >
                                View Supporting Document
                              </button>
                            ) : (
                              <span className="verification-file-button disabled">Supporting Document</span>
                            )}
                          </article>
                        </div>

                        <section className="verification-approved-box verification-approved-note">
                          <p className="verification-approved-label">Admin Note</p>
                          <p className="verification-approved-value mb-0">
                            {currentWorker.verificationSubmission?.reviewNote ||
                              (currentWorker.verificationReviewedBy
                                ? `Verified by ${currentWorker.verificationReviewedBy} on ${currentWorker.verificationReviewedAt}.`
                                : "Verified by admin.")}
                          </p>
                        </section>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="verification-wrap">
                    <div className="verification-card">
                      <div className="verification-card-head">Submit Verification Documents</div>
                      <form className="p-3 p-md-4" onSubmit={handleVerificationSubmit}>
                        <div className="verification-note mb-3">
                          <p className="mb-0 small">
                            <strong>Why get verified?</strong> Verified workers appear higher in smart matching and help
                            households trust your profile faster.{" "}
                          </p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Primary ID Document</label>
                          <input
                            type="file"
                            className="form-control"
                            name="primaryId"
                            onChange={handleVerificationChange}
                          />
                          <p className="form-text mb-0"> Accepted: Government-issued ID (SSS, GSIS, Passport, etc.) </p>
                          {verificationForm.primaryIdName && (
                            <p className="small text-muted mt-1 mb-0">Selected: {verificationForm.primaryIdName}</p>
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Supporting Document</label>
                          <input
                            type="file"
                            className="form-control"
                            name="secondaryDoc"
                            onChange={handleVerificationChange}
                          />
                          <p className="form-text mb-0">
                            {" "}
                            Accepted: Barangay clearance, NBI clearance, certificate of employment, etc.{" "}
                          </p>
                          {verificationForm.secondaryDocName && (
                            <p className="small text-muted mt-1 mb-0">Selected: {verificationForm.secondaryDocName}</p>
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Additional Notes (Optional)</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            name="notes"
                            placeholder="Add any notes about your submitted documents..."
                            value={verificationForm.notes}
                            onChange={handleVerificationChange}
                          />
                        </div>
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary">
                            {" "}
                            Submit Documents{" "}
                          </button>
                          <button type="button" className="btn btn-outline-secondary" onClick={openWorkerDashboard}>
                            {" "}
                            Cancel{" "}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {view === "worker-notifications" && (
          <section className="worker-dashboard worker-notifications-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openAllWorkerFindJobs}>
                    {navIcon("search")}
                    <span>Find Jobs</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    {navIcon("applications")}
                    <span>My Applications</span>
                    {workerApplicationUnreadCount > 0 && (
                      <span className="nav-count-badge">{workerApplicationUnreadCount}</span>
                    )}
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>
                    {navIcon("verified")}
                    <span>Get Verified</span>
                  </button>
                  <button className="worker-nav-item active">{navIcon("notifications")}
                    <span>Notifications</span></button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <div className="worker-notifications-header">
                  <h1>Notifications</h1>
                  <button
                    className="btn btn-outline-secondary worker-mark-read-button"
                    type="button"
                    onClick={() => markAllNotificationsRead(workerNotificationsWithReadState)}
                  >
                    {" "}
                    Mark All as Read{" "}
                  </button>
                </div>
                {currentWorker?.verification !== "Verified" && (
                  <div className="alert alert-warning mt-3 mb-0 py-2">
                    Your account is not verified yet. Please complete verification to become eligible for hiring and
                    priority matching.
                  </div>
                )}
                <div className="worker-notifications-list">
                  {workerPendingHireRequests.map((job) => (
                    <article
                      className="notification-card worker-hire-request-card unread"
                      key={`hire-request-${job.applicationId}`}
                    >
                      <div className="worker-hire-request-head">
                        <div>
                          <p className="small text-muted mb-1">{job.updatedAt || job.appliedAt || "Recently"}</p>
                          <h2 className="h6 mb-1">Hire request</h2>
                          <p className="mb-0">
                            {job.householdName || "A household"} wants to hire you for{" "}
                            <strong>{job.jobTitle || job.serviceType}</strong>.
                          </p>
                        </div>
                        <span className="badge text-bg-warning">Needs your response</span>
                      </div>
                      <div className="worker-hire-request-details">
                        <div>
                          <span>Job type</span>
                          <strong>{job.serviceType || "Service"}</strong>
                        </div>
                        <div>
                          <span>Schedule</span>
                          <strong>{formatDateTime(job.preferredDate, job.preferredTime) || job.scheduleType || "Not set"}</strong>
                        </div>
                        <div>
                          <span>Location</span>
                          <strong>{formatLocation(job.barangay, job.streetAddress) || "Not set"}</strong>
                        </div>
                        <div>
                          <span>Distance</span>
                          <strong>{getWorkerJobDistanceLabel(job) || "Not available"}</strong>
                        </div>
                        <div>
                          <span>Rate</span>
                          <strong>{formatRate(job.offeredRate, job.rateType)}</strong>
                        </div>
                        <div>
                          <span>Household</span>
                          <strong>{job.householdName || job.householdUsername || "Household"}</strong>
                        </div>
                      </div>
                      {job.description && (
                        <div className="worker-hire-request-description">
                          <span>Description</span>
                          <p>{job.description}</p>
                        </div>
                      )}
                      <div className="worker-hire-request-actions">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={() => openWorkerJobDetail(job.id)}
                        >
                          View Full Details
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          type="button"
                          onClick={() => handleWorkerHireDecision(job.applicationId, "accept")}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          type="button"
                          onClick={() => handleWorkerHireDecision(job.applicationId, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  ))}
                  {workerGeneralNotifications.map((item) => (
                    <article
                      className={`notification-card ${item.unread ? "unread" : ""}`}
                      key={item.id}
                    >
                      <p className="small text-muted mb-1">{item.date}</p>
                      <h2 className="h6 mb-1">{item.title}</h2>
                      <p className="mb-0">{item.message}</p>
                    </article>
                  ))}
                  {workerPendingHireRequests.length === 0 && workerGeneralNotifications.length === 0 && (
                    <article className="notification-card">
                      <h2 className="h6 mb-1">No notifications yet</h2>
                      <p className="mb-0 text-muted">Hire requests and job updates will appear here.</p>
                    </article>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        {view === "admin-dashboard" && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">Admin Panel</p>
                </div>
                <nav className="worker-nav">
                  <button
                    className={`worker-nav-item ${adminSection === "verification" ? "active" : ""}`}
                    onClick={openAdminDashboard}
                  >
                    {navIcon("verification")}
                    <span>Verification Queue</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button
                    className={`worker-nav-item ${adminSection === "history" ? "active" : ""}`}
                    onClick={openAdminWorkersHistory}
                  >
                    {navIcon("history")}
                    <span>Workers History</span>
                  </button>
                </nav>
              </aside>
              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">
                    {adminSection === "history" ? "Workers History" : "Verification Dashboard"}
                  </h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    <span className="badge text-bg-dark">Admin</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goBack}>
                      {" "}
                      Back{" "}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>
                      {" "}
                      Log Out{" "}
                    </button>
                  </div>
                </div>
                {adminSection === "verification" ? (
                  <React.Fragment>
                    <div className="row g-3 mt-1">
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Pending</p>
                          <p className="metric-value mb-0">{pendingVerificationRequests.length}</p>
                        </div>
                      </div>
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Under Review</p>
                          <p className="metric-value mb-0">
                            {verificationRequests.filter((item) => item.status === "Under Review").length}
                          </p>
                        </div>
                      </div>
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Approved</p>
                          <p className="metric-value mb-0">{approvedVerificationRequests.length}</p>
                        </div>
                      </div>
                      <div className="col-md-6 col-xl-3">
                        <div className="metric-card">
                          <p className="metric-label mb-1">Rejected</p>
                          <p className="metric-value mb-0">{rejectedVerificationRequests.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="card border-0 shadow-sm mt-4">
                      <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <h2 className="h6 mb-0 fw-bold">Worker Verification Requests</h2>
                        <span className="small text-muted">{verificationRequests.length} total</span>
                      </div>
                      {selectedVerificationRequest && (
                        <div className="p-3 border-bottom bg-light">
                          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                            <div>
                              <h3 className="h6 mb-1">{selectedVerificationRequest.workerName}</h3>
                              <p className="small text-muted mb-0">@{selectedVerificationRequest.workerUsername}</p>
                            </div>
                            <span
                              className={`badge ${selectedVerificationRequest.status === "Approved" ? "text-bg-success" : selectedVerificationRequest.status === "Rejected" ? "text-bg-danger" : "text-bg-warning"}`}
                            >
                              {selectedVerificationRequest.status}
                            </span>
                          </div>
                          <div className="row g-2 mt-2">
                            {selectedVerificationRequest.primaryIdPreview && (
                              <div className="col-md-6">
                                <div className="verification-note h-100">
                                  <p className="small fw-semibold mb-2">Primary ID</p>
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => openFilePreview(selectedVerificationRequest.primaryIdPreview)}
                                  >
                                    Open Primary ID
                                  </button>
                                </div>
                              </div>
                            )}
                            {selectedVerificationRequest.secondaryDocPreview && (
                              <div className="col-md-6">
                                <div className="verification-note h-100">
                                  <p className="small fw-semibold mb-2">Supporting Document</p>
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => openFilePreview(selectedVerificationRequest.secondaryDocPreview)}
                                  >
                                    Open Supporting Document
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="p-3 d-grid gap-3">
                        {verificationRequests.length > 0 ? (
                          verificationRequests.map((request) => (
                            <article
                              className={`verification-admin-card ${selectedVerificationRequestId === request.id ? "selected" : ""}`}
                              key={request.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openVerificationRequest(request.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  openVerificationRequest(request.id);
                                }
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                <div>
                                  <h3 className="h6 mb-1">{request.workerName}</h3>
                                  <p className="small text-muted mb-1">@{request.workerUsername}</p>
                                  <p className="small mb-1">
                                    <strong>Status:</strong>
                                    {request.status}
                                  </p>
                                  <p className="small mb-1">
                                    <strong>Submitted:</strong>
                                    {request.submittedAt}
                                  </p>
                                  {request.reviewedAt && (
                                    <p className="small mb-1">
                                      <strong>Reviewed:</strong>
                                      {request.reviewedAt}
                                    </p>
                                  )}
                                  {request.reviewNote && (
                                    <p className="small mb-0">
                                      <strong>Admin Note:</strong>
                                      {request.reviewNote}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`badge ${request.status === "Approved" ? "text-bg-success" : request.status === "Rejected" ? "text-bg-danger" : "text-bg-warning"}`}
                                >
                                  {request.status}
                                </span>
                              </div>
                              <div className="row g-2 mt-2">
                                <div className="col-md-4">
                                  <div className="verification-note h-100">
                                    <p className="small fw-semibold mb-1">Primary ID</p>
                                    <p className="mb-0 small">{request.primaryIdName}</p>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="verification-note h-100">
                                    <p className="small fw-semibold mb-1">Supporting Doc</p>
                                    <p className="mb-0 small">{request.secondaryDocName}</p>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="verification-note h-100">
                                    <p className="small fw-semibold mb-1">Notes</p>
                                    <p className="mb-0 small">{request.notes || "No additional notes provided."}</p>
                                  </div>
                                </div>
                              </div>
                              {request.status === "Pending" || request.status === "Under Review" ? (
                                <div className="d-flex gap-2 mt-3 flex-wrap">
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleAdminApproveVerification(request.id)}
                                  >
                                    {" "}
                                    Approve{" "}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleAdminRejectVerification(request.id)}
                                  >
                                    {" "}
                                    Reject{" "}
                                  </button>
                                </div>
                              ) : null}
                            </article>
                          ))
                        ) : (
                          <div className="text-center text-muted py-4">No verification requests yet.</div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ) : (
                  <div className="card border-0 shadow-sm mt-4">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                      <h2 className="h6 mb-0 fw-bold">Workers History</h2>
                      <span className="small text-muted">Verified and submitted workers</span>
                    </div>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Worker</th>
                            <th>Verification</th>
                            <th>Submitted</th>
                            <th>Reviewed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminVisibleWorkers.length > 0 ? (
                            adminVisibleWorkers.map((worker) => (
                              <tr key={worker.id}>
                                <td>{getDisplayName(worker.firstName, worker.lastName, worker.username)}</td>
                                <td>
                                  <span
                                    className={`badge ${worker.verification === "Verified" ? "text-bg-success" : worker.verification === "Under Review" ? "text-bg-warning" : "text-bg-secondary"}`}
                                  >
                                    {worker.verification || "Not Yet Verified"}
                                  </span>
                                </td>
                                <td>{worker.verificationSubmission?.submittedAt || "None"}</td>
                                <td>{worker.verificationReviewedBy || "None"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-4">
                                {" "}
                                No verified or registered workers to display.{" "}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {view === "household-post-job" && (
          <section className="worker-dashboard household-post-job-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item active">{navIcon("post-job")}
                    <span>Post a Job</span></button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <div className="profile-card household-post-job-card">
                  <h1 className="household-post-job-title">Post a New Job</h1>
                  <form className="p-3 p-md-4 household-job-form-shell" onSubmit={handleHouseholdJobSubmit}>
                    <div className="row g-3 household-job-fields">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Job Title</label>
                        <input
                          type="text"
                          name="jobTitle"
                          className="form-control"
                          placeholder="e.g. House Cleaning - 3 Bedroom"
                          value={householdJobForm.jobTitle}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Service Type</label>
                        <select
                          name="serviceType"
                          className="form-select"
                          value={householdJobForm.serviceType}
                          onChange={handleHouseholdJobChange}
                        >
                          <option value="">---Select Service---</option>
                          {SKILLS.map((skill) => (
                            <option key={skill} value={skill}>
                              {skill}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Schedule Type</label>
                        <select
                          name="scheduleType"
                          className="form-select"
                          value={householdJobForm.scheduleType}
                          onChange={handleHouseholdJobChange}
                        >
                          <option>One - Time</option>
                          <option>Part-Time</option>
                          <option>Full-Time</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Preferred Date</label>
                        <input
                          type="date"
                          name="preferredDate"
                          className="form-control"
                          value={householdJobForm.preferredDate}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Preferred Time</label>
                        <input
                          type="time"
                          name="preferredTime"
                          className="form-control"
                          value={householdJobForm.preferredTime}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Job Description</label>
                        <textarea
                          name="description"
                          className="form-control"
                          rows="3"
                          placeholder="Describe the job in detail..."
                          value={householdJobForm.description}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Barangay</label>
                        <select
                          name="barangay"
                          className="form-select"
                          value={householdJobForm.barangay}
                          onChange={handleHouseholdJobChange}
                        >
                          <option value="">---Select Barangay---</option>
                          {renderBarangayOptions()}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Street / House No.</label>
                        <input
                          type="text"
                          name="streetAddress"
                          className="form-control"
                          value={householdJobForm.streetAddress}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Workers Needed</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          name="workersNeeded"
                          className="form-control"
                          value={householdJobForm.workersNeeded}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Offered Rate</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          name="offeredRate"
                          className="form-control"
                          value={householdJobForm.offeredRate}
                          onChange={handleHouseholdJobChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Rate Type</label>
                        <select
                          name="rateType"
                          className="form-select"
                          value={householdJobForm.rateType}
                          onChange={handleHouseholdJobChange}
                        >
                          <option>Per Day</option>
                          <option>Per Hour</option>
                          <option>Fixed Rate</option>
                        </select>
                      </div>
                    </div>
                    <HouseholdJobMapPanel
                      captureHouseholdJobLocation={captureHouseholdJobLocation}
                      householdJobCoordinates={householdJobCoordinates}
                      householdJobLocationPreview={householdJobLocationPreview}
                      householdJobMapMode={householdJobMapMode}
                      householdJobMapRef={householdJobMapRef}
                      householdJobMapViewRef={householdJobMapViewRef}
                      loadLeafletAssets={loadLeafletAssets}
                      placeHouseholdJobPin={placeHouseholdJobPin}
                      setHouseholdJobMapMode={setHouseholdJobMapMode}
                    />
                    <div className="household-reference-images">
                      <label className="form-label fw-semibold">Reference Images</label>
                      <JobImageUpload maxImages={5} maxFileSize={5 * 1024 * 1024} onImagesChange={householdJobImages.onChange} />
                    </div>
                    <div className="household-post-actions">
                      <button type="submit" className="btn btn-primary">
                        Post Job
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={openHouseholdDashboard}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}
        {view === "household-profile" && (
          <section className="worker-dashboard profile-page household-profile-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item active">{navIcon("profile")}
                    <span>My Profile</span></button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <main className="profile-container" aria-labelledby="household-profile-title">
                  <h1 className="household-profile-page-title">My Profile Household</h1>
                  <div className="profile-row">
                  <section className="profile-column" aria-labelledby="household-profile-title">
                    <div className="profile-card profile-summary-card">
                      <header className="profile-card-header" id="household-profile-title">My Profile</header>
                      <div className="profile-summary-body text-center">
                        {householdProfileForm.profilePhotoPreview ? (
                          <img
                            src={householdProfileForm.profilePhotoPreview}
                            alt="Household profile"
                            className="profile-photo-large mb-2"
                          />
                        ) : (
                          <div className="profile-avatar mb-2">
                            {(householdProfileForm.firstName || "H").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <h2 className="h5 mb-1">
                          {getDisplayName(
                            householdProfileForm.firstName,
                            householdProfileForm.lastName,
                            householdProfileForm.username,
                          )}
                        </h2>
                        <p className="text-muted mb-2">@{householdProfileForm.username || "household"}</p>
                        <span className="badge text-bg-primary">Household</span>
                      </div>
                      <div className="profile-summary-list">
                        <p><strong>Account Type:</strong> Household</p>
                        <p><strong>Barangay:</strong> {householdProfileForm.barangay || "Not set"}</p>
                        <p><strong>Phone Number:</strong> {householdProfileForm.phone || "Not set"}</p>
                        <p><strong>Email:</strong> {householdProfileForm.email || "Not set"}</p>
                      </div>
                    </div>
                  </section>
                  <section className="profile-edit-card" aria-labelledby="household-edit-profile-title">
                    <header className="profile-card-header" id="household-edit-profile-title">Edit Profile Information</header>
                      <form className="profile-edit-form" onSubmit={handleHouseholdProfileEditSubmit}>
                        <div className="profile-form-field profile-form-field-full">
                          <label className="form-label fw-semibold" htmlFor="household-profile-photo">Profile Photo</label>
                          <input
                            id="household-profile-photo"
                            type="file"
                            className="form-control"
                            name="profilePhoto"
                            accept="image/*"
                            disabled={!householdProfileEditing}
                            onChange={handleHouseholdProfileChange}
                          />
                          <p className="form-text mb-0">Accepted: JPG, PNG. Use a clear profile photo.</p>
                          {householdProfileForm.profilePhotoPreview && (
                            <img
                              src={householdProfileForm.profilePhotoPreview}
                              alt="Household profile preview"
                              className="img-fluid rounded border mt-2"
                            />
                          )}
                        </div>
                        <div className="profile-form-grid">
                          <div className="profile-form-field">
                            <label className="form-label fw-semibold" htmlFor="household-first-name">First Name</label>
                            <input
                              id="household-first-name"
                              type="text"
                              name="firstName"
                              className="form-control"
                              value={householdProfileForm.firstName}
                              disabled={!householdProfileEditing}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="profile-form-field">
                            <label className="form-label fw-semibold" htmlFor="household-last-name">Last Name</label>
                            <input
                              id="household-last-name"
                              type="text"
                              name="lastName"
                              className="form-control"
                              value={householdProfileForm.lastName}
                              disabled={!householdProfileEditing}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="profile-form-field">
                            <label className="form-label fw-semibold" htmlFor="household-username">Username</label>
                            <input
                              id="household-username"
                              type="text"
                              name="username"
                              className="form-control"
                              value={householdProfileForm.username}
                              disabled
                            />
                          </div>
                          <div className="profile-form-field">
                            <label className="form-label fw-semibold" htmlFor="household-email">Email</label>
                            <input
                              id="household-email"
                              type="email"
                              name="email"
                              className="form-control"
                              value={householdProfileForm.email}
                              disabled={!householdProfileEditing}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="profile-form-field">
                            <label className="form-label fw-semibold" htmlFor="household-phone">Phone Number</label>
                            <input
                              id="household-phone"
                              type="text"
                              name="phone"
                              className="form-control"
                              value={householdProfileForm.phone}
                              disabled={!householdProfileEditing}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                          <div className="profile-form-field">
                            <label className="form-label fw-semibold" htmlFor="household-barangay">Barangay</label>
                            <select
                              id="household-barangay"
                              name="barangay"
                              className="form-select"
                              value={householdProfileForm.barangay}
                              disabled={!householdProfileEditing}
                              onChange={handleHouseholdProfileChange}
                            >
                              <option value="">---Select Barangay---</option>
                              {renderBarangayOptions()}
                            </select>
                          </div>
                          <div className="profile-form-field profile-form-field-full">
                            <label className="form-label fw-semibold" htmlFor="household-street">Street / House No.</label>
                            <input
                              id="household-street"
                              type="text"
                              name="streetAddress"
                              className="form-control"
                              value={householdProfileForm.streetAddress}
                              disabled={!householdProfileEditing}
                              onChange={handleHouseholdProfileChange}
                            />
                          </div>
                        </div>
                        <div className="profile-form-actions">
                          <button className="btn btn-primary profile-save-button" type="submit">
                            {householdProfileEditing ? "Save Changes" : "Edit Profile"}
                          </button>
                        </div>
                      </form>
                  </section>
                  </div>
                <section className="profile-footer" aria-labelledby="household-profile-feedback-title">
                  <h2 className="household-profile-feedback-title" id="household-profile-feedback-title">Feedback & Rating</h2>
                  <div className="profile-feedback-grid">
                    <article className="profile-feedback-card">
                      <header className="profile-card-header feedback-header">
                        <span>Feedback from Workers</span>
                        <button
                          type="button"
                          className="btn btn-light btn-sm rounded-pill"
                          onClick={openHouseholdFeedbackAll}
                        >
                          View All
                        </button>
                      </header>
                      <div className="p-3 d-grid gap-2">
                        {(currentHousehold?.receivedFeedback || []).slice(0, 2).length > 0 ? (
                          (currentHousehold?.receivedFeedback || []).slice(0, 2).map((review) => (
                            <div className="review-item" key={review.id || `${review.authorName}-${review.createdAt}`}>
                              <div className="d-flex justify-content-between gap-2">
                                <div>
                                  <p className="mb-1 fw-semibold">Anonymous Worker</p>
                                  <p className="mb-1 small text-muted">{review.feedback || review.comment || "No comment provided."}</p>
                                  <p className="mb-0 small text-muted">{review.createdAt || review.date || "Recently"}</p>
                                </div>
                                <strong>{review.rating != null ? `${review.rating}/5` : "Feedback"}</strong>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="review-item">
                            <p className="mb-0 text-muted">No worker feedback yet.</p>
                          </div>
                        )}
                      </div>
                    </article>
                    <article className="profile-feedback-card">
                      <header className="profile-card-header feedback-header">
                        <span>Reviews You Submitted</span>
                        <button
                          type="button"
                          className="btn btn-light btn-sm rounded-pill"
                          onClick={openHouseholdReviewsAll}
                        >
                          View All
                        </button>
                      </header>
                      <div className="p-3 d-grid gap-2">
                        {(currentHousehold?.givenFeedback || []).slice(0, 2).length > 0 ? (
                          (currentHousehold?.givenFeedback || []).slice(0, 2).map((review) => (
                            <div className="review-item" key={review.id || `${review.targetName}-${review.createdAt}`}>
                              <div className="d-flex justify-content-between gap-2">
                                <div>
                                  <p className="mb-1 fw-semibold">{review.targetName || review.target || "Worker"}</p>
                                  <p className="mb-1 small text-muted">{review.feedback || review.comment || "No comment provided."}</p>
                                  <p className="mb-0 small text-muted">{review.createdAt || review.date || "Recently"}</p>
                                </div>
                                <strong>{review.rating != null ? `${review.rating}/5` : "Feedback"}</strong>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="review-item">
                            <p className="mb-0 text-muted">No submitted reviews yet.</p>
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                </section>
                </main>
              </div>
            </div>
          </section>
        )}
        {view === "household-feedback-all" && (
          <section className="worker-dashboard household-feedback-all-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item active" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <main className="household-feedback-all-container">
                  <p className="household-feedback-eyebrow">View all Feedback Household</p>
                  <section className="household-feedback-hero">
                    <div>
                      <h1>All Feedback by Workers</h1>
                      <p>Feedback from workers are hidden anonymously.</p>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openHouseholdProfile}>
                      Back
                    </button>
                  </section>

                  <section className="household-feedback-list-panel" aria-label="All worker feedback">
                    <div className="household-feedback-filter">
                      <label className="form-label mb-0" htmlFor="household-feedback-date">
                        Filter Date
                      </label>
                      <input
                        id="household-feedback-date"
                        type="date"
                        className="form-control"
                        value={householdFeedbackDateFilter}
                        onChange={(event) => setHouseholdFeedbackDateFilter(event.target.value)}
                      />
                      {householdFeedbackDateFilter && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={() => setHouseholdFeedbackDateFilter("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="household-feedback-list">
                      {filteredHouseholdWorkerFeedback.length > 0 ? (
                        filteredHouseholdWorkerFeedback.map((review, index) => (
                          <article className="household-feedback-item" key={review.id || `${review.createdAt}-${index}`}>
                            <div className="household-feedback-avatar">A</div>
                            <div className="household-feedback-copy">
                              <div className="household-review-title-row">
                                <h2>Anonymous Worker</h2>
                                {review.rating != null && <strong>{review.rating}/5</strong>}
                              </div>
                              <p>{review.feedback || review.comment || "No comment provided."}</p>
                              <small>{review.createdAt || review.date || "Recently"}</small>
                              <details className="household-feedback-more">
                                <summary>View more</summary>
                                <p>
                                  This feedback was submitted by a worker after a household interaction. Worker identity is
                                  hidden to keep feedback fair and private.
                                </p>
                              </details>
                            </div>
                          </article>
                        ))
                      ) : (
                        <article className="household-feedback-empty">
                          <h2>No feedback found</h2>
                          <p>
                            {householdFeedbackDateFilter
                              ? "No worker feedback matches the selected date."
                              : "No worker feedback has been submitted for this household yet."}
                          </p>
                        </article>
                      )}
                    </div>
                  </section>
                </main>
              </div>
            </div>
          </section>
        )}
        {view === "household-reviews-all" && (
          <section className="worker-dashboard household-feedback-all-page household-reviews-all-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item active" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <main className="household-feedback-all-container">
                  <p className="household-feedback-eyebrow">View all Reviews Household</p>
                  <section className="household-feedback-hero">
                    <div>
                      <h1>All Reviews you Submitted</h1>
                      <p>Review history for workers you rated through GawaGo.</p>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openHouseholdProfile}>
                      Back
                    </button>
                  </section>

                  <section className="household-feedback-list-panel" aria-label="All submitted reviews">
                    <div className="household-feedback-filter household-reviews-filter">
                      <label className="form-label mb-0" htmlFor="household-review-date">
                        Filter Date
                      </label>
                      <input
                        id="household-review-date"
                        type="date"
                        className="form-control"
                        value={householdReviewDateFilter}
                        onChange={(event) => setHouseholdReviewDateFilter(event.target.value)}
                      />
                      <label className="form-label mb-0" htmlFor="household-review-rating">
                        Rating
                      </label>
                      <select
                        id="household-review-rating"
                        className="form-select"
                        value={householdReviewRatingFilter}
                        onChange={(event) => setHouseholdReviewRatingFilter(event.target.value)}
                      >
                        <option value="">All ratings</option>
                        <option value="5">5 stars</option>
                        <option value="4">4 stars</option>
                        <option value="3">3 stars</option>
                        <option value="2">2 stars</option>
                        <option value="1">1 star</option>
                      </select>
                      {(householdReviewDateFilter || householdReviewRatingFilter) && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={() => {
                            setHouseholdReviewDateFilter("");
                            setHouseholdReviewRatingFilter("");
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="household-feedback-list">
                      {filteredHouseholdSubmittedReviews.length > 0 ? (
                        filteredHouseholdSubmittedReviews.map((review, index) => {
                          const targetName = review.targetName || review.target || "Worker";
                          const initial = targetName.slice(0, 1).toUpperCase() || "W";
                          return (
                            <article className="household-feedback-item" key={review.id || `${review.createdAt}-${index}`}>
                              <div className="household-feedback-avatar">{initial}</div>
                              <div className="household-feedback-copy">
                                <div className="household-review-title-row">
                                  <h2>{targetName}</h2>
                                  <strong>{review.rating != null ? `${review.rating}/5` : "No rating"}</strong>
                                </div>
                                <p>{review.feedback || review.comment || "No comment provided."}</p>
                                <small>{review.createdAt || review.date || "Recently"}</small>
                                <details className="household-feedback-more">
                                  <summary>View more</summary>
                                  <p>
                                    This is the review you submitted for {targetName}. It remains visible in your review
                                    history for transparency and follow-up reference.
                                  </p>
                                </details>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <article className="household-feedback-empty">
                          <h2>No reviews found</h2>
                          <p>
                            {householdReviewDateFilter || householdReviewRatingFilter
                              ? "No submitted reviews match the selected filters."
                              : "You have not submitted any worker reviews yet."}
                          </p>
                        </article>
                      )}
                    </div>
                  </section>
                </main>
              </div>
            </div>
          </section>
        )}
        {view === "household-my-jobs" && (
          <section className="worker-dashboard household-my-jobs-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item active">{navIcon("jobs")}
                    <span>My Jobs</span></button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <h1 className="household-my-jobs-title">My Jobs</h1>
                {!activeHouseholdJobs.length && (
                  <div className="profile-card mt-3">
                    <div className="p-4 text-center">
                      <h2 className="h5 mb-2">No active jobs</h2>
                      <p className="text-muted mb-3">
                        {" "}
                        Completed and cancelled jobs are available in your dashboard recent jobs.{" "}
                      </p>
                      <button className="btn btn-primary" onClick={openHouseholdPostJob}>
                        {" "}
                        Post a New Job{" "}
                      </button>
                    </div>
                  </div>
                )}
                {activeHouseholdJobs.length > 0 && (
                  <div className="household-my-jobs-panel mt-3">
                    <div className="household-my-jobs-filters">
                      {[
                        ["All", "All Jobs"],
                        ["Open", "Open"],
                        ["Completed", "Completed"],
                      ].map(([status, label]) => (
                        <button
                          type="button"
                          className={`household-job-filter ${householdJobStatusFilter === status ? "active" : ""}`}
                          key={status}
                          onClick={() => setHouseholdJobStatusFilter(status)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="my-jobs-list">
                      {filteredHouseholdJobs.length > 0 ? (
                        filteredHouseholdJobs.map((job) => {
                          const isCompletedJob = String(job.status || "").toLowerCase() === "completed";
                          return (
                            <article
                              key={job.id}
                              className={`job-summary-card ${selectedJob?.id === job.id ? "active" : ""}`}
                            >
                              <span className={`badge ${getJobStatusBadgeClass(job.status)}`}>{job.status}</span>
                              <h2 className="job-summary-title">{job.jobTitle || job.serviceType}</h2>
                              <dl className="job-summary-meta">
                                <div>
                                  <dt>Offer Rate:</dt>
                                  <dd>{formatRate(job.offeredRate, job.rateType)}</dd>
                                </div>
                                <div>
                                  <dt>Schedule:</dt>
                                  <dd>{formatDateTime(job.preferredDate, job.preferredTime)}</dd>
                                </div>
                                <div>
                                  <dt>Applicants:</dt>
                                  <dd>{(job.applications || []).length}</dd>
                                </div>
                              </dl>
                              {!isCompletedJob && (
                                <button
                                  type="button"
                                  className="btn btn-primary job-summary-action"
                                  onClick={() => openHouseholdJobDetail(job.id)}
                                >
                                  View Details
                                </button>
                              )}
                              {selectedJob?.id === job.id && (
                                <div className="alert alert-info mt-3 mb-0 py-2">
                                  Hiring progress: {getHiringProgressLabel(job)} worker(s) hired. Pending applications:{" "}
                                  {getPendingApplicationCount(job)}.
                                </div>
                              )}
                            </article>
                          );
                        })
                      ) : (
                        <article className="household-my-jobs-empty">
                          <h2>No {householdJobStatusFilter.toLowerCase()} jobs found</h2>
                          <p className="mb-0">There are no active jobs under this status.</p>
                        </article>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {view === "household-job-detail" && selectedJob && (
          <section className="worker-dashboard household-job-detail-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <h1 className="household-detail-page-title mb-3">Job Details</h1>

                <section className="household-detail-panel profile-card p-3 p-md-4">
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <h2 className="household-detail-job-title">{selectedJob.jobTitle || selectedJob.serviceType}</h2>
                    <span className={`badge ${getJobStatusBadgeClass(selectedJob.status)}`}>{selectedJob.status}</span>
                  </div>
                  <div className="household-detail-grid row g-3 mt-1">
                    <div className="col-md-4">
                    <div className="household-detail-info-card h-100">
                      <p>Service Type</p>
                      <strong>{selectedJob.serviceType}</strong>
                    </div>
                    </div>
                    <div className="col-md-4">
                    <div className="household-detail-info-card h-100">
                      <p>Location</p>
                      <strong>{formatLocation(selectedJob.barangay, selectedJob.streetAddress)}</strong>
                    </div>
                    </div>
                    <div className="col-md-4">
                    <div className="household-detail-info-card h-100">
                      <p>Offered Rate</p>
                      <strong>{formatRate(selectedJob.offeredRate, selectedJob.rateType)}</strong>
                    </div>
                    </div>
                    <div className="col-md-4">
                    <div className="household-detail-info-card h-100">
                      <p>Schedule</p>
                      <strong>{formatDateTime(selectedJob.preferredDate, selectedJob.preferredTime)}</strong>
                    </div>
                    </div>
                    <div className="col-md-4">
                    <div className="household-detail-info-card h-100">
                      <p>Workers Needed</p>
                      <strong>{selectedJob.workersNeeded || selectedJob.workerSlots || 1} worker(s)</strong>
                    </div>
                    </div>
                    <div className="col-md-4">
                    <div className="household-detail-info-card h-100">
                      <p>Hiring Status</p>
                      <strong>
                        {(selectedJob.applications || []).filter((application) => application.status === "Hired").length}/
                        {selectedJob.workersNeeded || selectedJob.workerSlots || 1} Hired
                      </strong>
                    </div>
                    </div>
                  </div>
                  {selectedJob.status !== "Cancelled" && (
                    <button
                      className="btn btn-outline-danger household-detail-cancel"
                      type="button"
                      onClick={() => handleCancelJob(selectedJob.id)}
                    >
                      Cancel Job
                    </button>
                  )}
                </section>

                <section className="household-detail-panel profile-card p-3 p-md-4 mt-3">
                  <div className="profile-card-head">Completion & Review</div>
                  <div className="p-3 d-grid gap-3">
                    <div className="household-dashboard-job-summary">
                      <h3>{selectedJob.jobTitle || selectedJob.serviceType}</h3>
                      <div className="household-dashboard-job-meta">
                        <span>
                          <strong>Worker</strong>
                          {selectedJobAssignedWorker
                            ? getDisplayName(
                                selectedJobAssignedWorker.firstName,
                                selectedJobAssignedWorker.lastName,
                                selectedJobAssignedWorker.username,
                              )
                            : (selectedJob.applications || [])[0]?.workerName || "No worker selected"}
                        </span>
                        <span>
                          <strong>Status</strong>
                          {selectedJob.status}
                        </span>
                        {selectedJobWorkerReview && (
                          <span>
                            <strong>Review</strong>
                            {selectedJobWorkerReview.rating}/5 submitted
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="household-dashboard-completion-notice">
                      {selectedJobWorkerReview
                        ? "This completed job has already been reviewed."
                        : selectedJob.status === "Completed"
                          ? "Job is completed. Submit your final worker review once."
                          : selectedJobAssignedWorker
                            ? "Review the completed work, then confirm completion."
                            : "No worker is assigned yet, so completion controls are not available."}
                    </div>
                    {selectedJob.status !== "Completed" && (
                      <div className="household-dashboard-completion-actions">
                        <button
                          className={`btn ${!selectedJobAssignedWorker ? "btn-secondary" : "btn-success"}`}
                          type="button"
                          disabled={!selectedJobAssignedWorker}
                          onClick={confirmSelectedJobCompleted}
                        >
                          Confirm Completed
                        </button>
                      </div>
                    )}
                    {selectedJobWorkerReview && (
                      <div className="alert alert-success mb-0">
                        Review completed. You rated this worker {selectedJobWorkerReview.rating}/5.
                      </div>
                    )}
                    {(householdDashboardReviewOpen || shouldShowSelectedJobReviewForm) && !selectedJobWorkerReview && (
                      <form className="household-dashboard-review-form" onSubmit={handleHouseholdReviewSubmit}>
                        <label className="form-label fw-semibold" htmlFor="household-detail-rating-stars">Rating</label>
                        {renderHouseholdStarRatingInput("household-detail-rating-stars")}
                        <label className="form-label fw-semibold">Feedback for worker</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Write feedback about the worker..."
                          value={householdReviewForm.feedback}
                          onChange={(event) =>
                            setHouseholdReviewForm((prev) => ({ ...prev, feedback: event.target.value }))
                          }
                        />
                        <div className="household-dashboard-form-actions">
                          <button className="btn btn-success" type="submit">
                            Done
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={openHouseholdMyJobs}
                          >
                            Close
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </section>

                <section className="household-detail-panel profile-card p-3 p-md-4 mt-3">
                  <h2 className="household-detail-section-title">Applicants</h2>
                  <p className="small text-muted mb-3">Workers who submitted an application for this job.</p>
                  <div className="household-applicant-list d-grid gap-3">
                    {selectedJobApplicantWorkers.length > 0 ? (
                      selectedJobApplicantWorkers.map((worker) => {
                        const workerProfileKey =
                          [
                            worker.username ?? worker.workerUsername,
                            worker.id ?? worker.workerId ?? worker.userId ?? worker.user_id ?? worker.profileId,
                            getDisplayName(worker.firstName, worker.lastName, worker.username),
                          ]
                            .filter((value) => value !== null && value !== undefined && value !== "")
                            .join(":") || "applicant-worker";
                        return (
                          <button
                            type="button"
                            className="household-applicant-card d-flex align-items-center gap-3"
                            key={workerProfileKey}
                            onClick={() => openMatchedWorkerProfile(worker, selectedJob.id)}
                          >
                            <div className="profile-avatar match-avatar">
                              {(worker.avatar || worker.firstName || worker.username || "W").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="household-applicant-main">
                              <p className="fw-semibold mb-1">
                                {getDisplayName(worker.firstName, worker.lastName, worker.username)}
                              </p>
                              <div className="d-flex gap-2 flex-wrap">
                                <span className="badge text-bg-primary">{worker.applicationStatus || "Pending"}</span>
                                {(worker.skills || []).slice(0, 2).map((skill) => (
                                  <span className="badge text-bg-light border text-dark" key={`${worker.id}-${skill}`}>
                                    {skill}
                                  </span>
                                ))}
                                <span
                                  className={`badge ${worker.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}`}
                                >
                                  {worker.verification || "Not Yet Verified"}
                                </span>
                                {worker.availableAtRequestedTime === false && (
                                  <span className="badge text-bg-light border text-dark">Availability not set</span>
                                )}
                                <span className="badge text-bg-light border text-dark">
                                  {formatCurrency(worker.dailyRate)}/day
                                </span>
                              </div>
                            </div>
                            <span className="household-applicant-distance ms-auto">
                              {worker.distanceLabel ||
                                formatDistance(worker.distanceKm, worker.distanceLabel) ||
                                "Distance unavailable"}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="household-applicant-empty">No worker applications yet.</div>
                    )}
                  </div>
                </section>

                <section className="household-detail-panel profile-card p-3 p-md-4 mt-3">
                  <h2 className="household-detail-section-title">Smart Matched Workers</h2>
                  <p className="small text-muted mb-3">
                    Suggested workers ranked by skill, availability, verification, and distance.
                  </p>
                  <div className="household-applicant-list d-grid gap-3">
                    {selectedSuggestedWorkers.length > 0 ? (
                      selectedSuggestedWorkers.map((worker) => {
                        const workerProfileKey =
                          [
                            worker.username ?? worker.workerUsername,
                            worker.id ?? worker.workerId ?? worker.userId ?? worker.user_id ?? worker.profileId,
                            getDisplayName(worker.firstName, worker.lastName, worker.username),
                          ]
                            .filter((value) => value !== null && value !== undefined && value !== "")
                            .join(":") || "matched-worker";
                        return (
                          <button
                            type="button"
                            className="household-applicant-card d-flex align-items-center gap-3"
                            key={workerProfileKey}
                            onClick={() => openMatchedWorkerProfile(worker, selectedJob.id)}
                          >
                            <div className="profile-avatar match-avatar">
                              {(worker.avatar || worker.firstName || worker.username || "W").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="household-applicant-main">
                              <p className="fw-semibold mb-1">
                                {getDisplayName(worker.firstName, worker.lastName, worker.username)}
                              </p>
                              <div className="d-flex gap-2 flex-wrap">
                                {(worker.skills || []).slice(0, 2).map((skill) => (
                                  <span className="badge text-bg-primary" key={`${worker.id}-${skill}`}>
                                    {skill}
                                  </span>
                                ))}
                                <span
                                  className={`badge ${worker.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}`}
                                >
                                  {worker.verification || "Not Yet Verified"}
                                </span>
                                <span className="badge text-bg-light border text-dark">
                                  {formatCurrency(worker.dailyRate)}/day
                                </span>
                              </div>
                            </div>
                            <span className="household-applicant-distance ms-auto">
                              {worker.distanceLabel ||
                                formatDistance(worker.distanceKm, worker.distanceLabel) ||
                                "Distance unavailable"}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="household-applicant-empty">No smart matched workers yet.</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </section>
        )}
        {view === "household-worker-profile" && !selectedWorker && (
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </button>
                </nav>
              </aside>
              <div className="worker-content">
                <div className="profile-card p-4">
                  <div className="profile-card-head">Worker Profile</div>
                  <div className="p-3">
                    <p className="mb-3 text-muted">
                      Worker profile is not available yet. Please go back to the job details and try again.
                    </p>
                    <button className="btn btn-outline-secondary" type="button" onClick={openHouseholdMyJobs}>
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {view === "household-worker-profile" && selectedWorker && (
          <section className="worker-dashboard household-smart-match-profile">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </button>
                </nav>
              </aside>
              <div className="worker-content">
                <div className="row g-3">
                  <div className="col-lg-4">
                    <div className="profile-card">
                      <div className="p-3 text-center">
                        {selectedWorkerPhoto ? (
                          <img
                            className="profile-photo-large mb-2"
                            src={selectedWorkerPhoto}
                            alt={`${getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username)} profile`}
                          />
                        ) : (
                          <div className="profile-avatar mb-2">
                            {(selectedWorker.avatar || selectedWorker.firstName || "W").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <h2 className="h5 mb-1">
                          {getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username)}
                        </h2>
                        <p className="small text-muted mb-2">
                          {formatLocation(selectedWorker.barangay, selectedWorker.streetAddress)}
                        </p>
                        <span
                          className={`badge ${selectedWorker.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}`}
                        >
                          {selectedWorker.verification || "Not Yet Verified"}
                        </span>
                      </div>
                      <div className="px-3 pb-3">
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Rating</span>
                          <strong>{selectedWorker.rating || "No ratings yet"}</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Jobs Done</span>
                          <strong>{selectedWorker.reviewsDone || 0}</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Experience</span>
                          <strong>{selectedWorker.yearsExperience || 0} yr(s)</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Status</span>
                          <strong>{selectedWorker.status || "Available"}</strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Distance</span>
                          <strong>
                            {selectedWorker.distanceLabel ||
                              formatDistance(selectedWorker.distanceKm, selectedWorker.distanceLabel) ||
                              "Distance unavailable"}
                          </strong>
                        </p>
                        <p className="mb-1 small d-flex justify-content-between">
                          <span>Hourly Rate</span>
                          <strong>{formatCurrency(selectedWorker.hourlyRate)}</strong>
                        </p>
                        <p className="mb-3 small d-flex justify-content-between">
                          <span>Daily Rate</span>
                          <strong>{formatCurrency(selectedWorker.dailyRate)}</strong>
                        </p>
                        <button
                          className="btn btn-primary w-100 mb-2"
                          type="button"
                          disabled={selectedWorkerHireButtonDisabled}
                          onClick={handleHireWorker}
                        >
                          {selectedWorkerHireButtonLabel}
                        </button>
                        {canRejectSelectedWorkerApplication && (
                          <button
                            className="btn btn-outline-danger w-100 mb-2"
                            type="button"
                            onClick={() => handleRejectApplication(selectedWorker.id, selectedJob.id)}
                          >
                            Reject Application
                          </button>
                        )}
                        <button className="btn btn-outline-secondary w-100" type="button" onClick={openHouseholdMyJobs}>
                          {" "}
                          Go Back{" "}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="profile-card mb-3">
                      <div className="profile-card-head">About</div>
                      <div className="p-3">
                        <p className="mb-0">{selectedWorker.bio || "No description provided yet."}</p>
                      </div>
                    </div>
                    <div className="profile-card mb-3" data-distance-location-map="true">
                      <div className="profile-card-head d-flex justify-content-between align-items-center gap-3">
                        <span>Distance & Location</span>
                        <span className="badge text-bg-light">
                          {formatDistance(selectedWorkerRouteDistanceKm ?? selectedWorkerDistanceKm)}
                        </span>
                      </div>
                      <div className="p-3">
                        <LocationDistanceMap
                          userLatitude={selectedWorkerJobLatitude}
                          userLongitude={selectedWorkerJobLongitude}
                          targetLatitude={selectedWorkerPoint?.latitude ?? null}
                          targetLongitude={selectedWorkerPoint?.longitude ?? null}
                          userLocation={formatLocation(
                            currentHousehold?.barangay || selectedJob?.barangay,
                            currentHousehold?.streetAddress || selectedJob?.streetAddress,
                          )}
                          targetLocation={formatLocation(selectedWorker.barangay, selectedWorker.streetAddress)}
                          distanceKm={selectedWorkerDistanceKm}
                          formatDistanceFn={formatDistance}
                          onRouteDistanceChange={setSelectedWorkerRouteDistanceKm}
                        />
                      </div>
                    </div>
                    {selectedWorkerVerificationRequest && (
                      <div className="profile-card mb-3">
                        <div className="profile-card-head">Verification Details</div>
                        <div className="p-3">
                          <div className="d-grid gap-2">
                            {[
                              ["Status", selectedWorkerVerificationRequest.status || selectedWorker.verification || "Pending"],
                              ["Primary ID", selectedWorkerVerificationRequest.primaryIdName],
                              ["Secondary Document", selectedWorkerVerificationRequest.secondaryDocName],
                              ["Submitted", selectedWorkerVerificationRequest.submittedAt],
                              ["Reviewed", selectedWorkerVerificationRequest.reviewedAt],
                              ["Worker Notes", selectedWorkerVerificationRequest.notes],
                              ["Admin Note", selectedWorkerVerificationRequest.reviewNote],
                            ]
                              .filter(([, value]) => value)
                              .map(([label, value]) => (
                                <p className="mb-0 small d-flex justify-content-between gap-3" key={label}>
                                  <span className="text-muted">{label}</span>
                                  <strong className="text-end">{value || "Not provided"}</strong>
                                </p>
                              ))}
                          </div>
                          {(selectedWorkerVerificationRequest.primaryIdPreview ||
                            selectedWorkerVerificationRequest.secondaryDocPreview) && (
                            <div className="d-flex flex-wrap gap-2 mt-3">
                              {selectedWorkerVerificationRequest.primaryIdPreview && (
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  type="button"
                                  onClick={() => openFilePreview(selectedWorkerVerificationRequest.primaryIdPreview)}
                                >
                                  View Primary ID
                                </button>
                              )}
                              {selectedWorkerVerificationRequest.secondaryDocPreview && (
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  type="button"
                                  onClick={() => openFilePreview(selectedWorkerVerificationRequest.secondaryDocPreview)}
                                >
                                  View Secondary Document
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="profile-card mb-3">
                      <div className="profile-card-head">Skills & Expertise</div>
                      <div className="p-3 d-flex gap-2 flex-wrap">
                        {(selectedWorker.skills || []).map((skill) => (
                          <span className="badge text-bg-primary" key={`${selectedWorker.id}-${skill}`}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <section className="smart-match-feedback-section profile-footer worker-rating-summary" aria-labelledby="smart-match-feedback-title">
                  <header className="worker-rating-header">
                    <h2 id="smart-match-feedback-title">☆ Feedback & Rating</h2>
                    <span>From households</span>
                  </header>
                  <div className="worker-rating-body">
                    <div className="worker-rating-overview">
                      <div className="worker-rating-score">
                        <strong>
                          {selectedWorkerAverageRating != null ? selectedWorkerAverageRating.toFixed(1) : "No ratings yet"}
                        </strong>
                        {selectedWorkerAverageRating != null && <span className="worker-rating-stars">★★★★★</span>}
                        <small>
                          {selectedWorkerTotalReviews} {selectedWorkerTotalReviews === 1 ? "review" : "reviews"}
                        </small>
                      </div>
                      <div className="worker-rating-bars" aria-label="Rating distribution">
                        {selectedWorkerRatingCounts.map(({ rating, count }) => {
                          const percentage = selectedWorkerTotalReviews > 0 ? (count / selectedWorkerTotalReviews) * 100 : 0;
                          return (
                            <div className="worker-rating-bar-row" key={rating}>
                              <span>{rating}★</span>
                              <div className="worker-rating-track">
                                <div className="worker-rating-fill" style={{ width: `${percentage}%` }} />
                              </div>
                              <strong>{count}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="worker-rating-stats">
                      <div>
                        <strong>{selectedWorkerTotalReviews}</strong>
                        <span>Total reviews</span>
                      </div>
                      <div>
                        <strong>{selectedWorkerAverageRating != null ? selectedWorkerAverageRating.toFixed(1) : "--"}</strong>
                        <span>Average rating</span>
                      </div>
                      <div>
                        <strong>{selectedWorkerTotalReviews > 0 ? `${selectedWorkerFiveStarRate}%` : "--"}</strong>
                        <span>5-star rate</span>
                      </div>
                    </div>

                    <div className="worker-recent-reviews-head">
                      <h3>Recent reviews</h3>
                    </div>

                    <div className="worker-recent-reviews">
                      {selectedWorkerReviews.slice(0, 2).length > 0 ? (
                        selectedWorkerReviews.slice(0, 2).map((review) => {
                          const author = review.authorName || review.author || "Household";
                          const initials = author
                            .split(" ")
                            .map((part) => part.slice(0, 1))
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();
                          return (
                            <article className="worker-recent-review" key={review.id || `${author}-${review.createdAt}`}>
                              <div className="worker-review-avatar">{initials || "HH"}</div>
                              <div className="worker-review-copy">
                                <div className="worker-review-title-row">
                                  <div>
                                    <strong>{author}</strong>
                                    <small>{formatDateTime(review.createdAt || review.date || "") || "Recently"}</small>
                                  </div>
                                  {review.rating != null && (
                                    <span className="worker-review-rating">★★★★★ {Number(review.rating).toFixed(1)}</span>
                                  )}
                                </div>
                                <p>{review.feedback || review.comment || "No comment provided."}</p>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <article className="worker-recent-review worker-recent-review-empty">
                          <p>No household feedback or ratings yet.</p>
                        </article>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        )}
        {view === "household-notifications" && (
          <section className="worker-dashboard household-notifications-page">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item active" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="worker-content">
                <main className="household-notifications-container">
                  <h1 className="household-notifications-title">
                    Notifications
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </h1>

                  <section className="household-notifications-panel">
                    <div className="household-notifications-toolbar">
                      <div className="household-notifications-filter">
                        <label className="form-label mb-0" htmlFor="household-notification-date">
                          Filter Date
                        </label>
                        <input
                          id="household-notification-date"
                          type="date"
                          className="form-control"
                          value={householdNotificationDateFilter}
                          onChange={(event) => setHouseholdNotificationDateFilter(event.target.value)}
                        />
                        {householdNotificationDateFilter && (
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            type="button"
                            onClick={() => setHouseholdNotificationDateFilter("")}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <button
                        className="btn btn-outline-secondary household-notifications-read-button"
                        type="button"
                        onClick={() => markAllNotificationsRead(householdNotificationsWithReadState)}
                      >
                        Mark all as Read
                      </button>
                    </div>

                    <div className="household-notifications-list">
                      {filteredHouseholdNotifications.length > 0 ? (
                        filteredHouseholdNotifications.map((item) => (
                          <article
                            className={`notification-card household-notification-item household-notification-clickable ${item.unread ? "unread" : ""}`}
                            key={item.id}
                            onClick={() => openHouseholdNotificationPreview(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openHouseholdNotificationPreview(item);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div>
                              <p className="small text-muted mb-1">{item.date}</p>
                              <h2 className="h6 mb-1">{item.title}</h2>
                              <p className="mb-0">{item.message}</p>
                            </div>
                          </article>
                        ))
                      ) : (
                        <article className="notification-card household-notification-item household-notification-empty">
                          <div>
                            <h2 className="h6 mb-1">No notifications found</h2>
                            <p className="mb-0">
                              {householdNotificationDateFilter
                                ? "No household notifications match the selected date."
                                : "There are no applications or updates for this household account yet."}
                            </p>
                          </div>
                        </article>
                      )}
                    </div>
                  </section>
                  {householdNotificationPreview &&
                    (() => {
                      const previewWorker = getHouseholdNotificationWorker(householdNotificationPreview);
                      const previewJob = getHouseholdNotificationJob(householdNotificationPreview);
                      return (
                        <div className="household-notification-modal-backdrop" role="presentation">
                          <section
                            aria-labelledby="household-notification-preview-title"
                            aria-modal="true"
                            className="household-notification-modal"
                            role="dialog"
                          >
                            <div className="household-notification-modal-head">
                              <div>
                                <p className="household-notification-modal-kicker">Notification Details</p>
                                <h2 id="household-notification-preview-title">
                                  {householdNotificationPreview.title || "Notification"}
                                </h2>
                              </div>
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                type="button"
                                onClick={closeHouseholdNotificationPreview}
                              >
                                Close
                              </button>
                            </div>
                            <div className="household-notification-modal-body">
                              <p className="household-notification-message">{householdNotificationPreview.message}</p>
                              {previewWorker ? (
                                <div className="household-notification-worker-preview">
                                  <div className="profile-avatar match-avatar">
                                    {(previewWorker.avatar || previewWorker.firstName || previewWorker.username || "W")
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <h3>{getDisplayName(previewWorker.firstName, previewWorker.lastName, previewWorker.username)}</h3>
                                    <p>{previewWorker.bio || "Worker profile summary is available in full details."}</p>
                                    <div className="household-notification-worker-facts">
                                      <span>{previewWorker.verification || "Not Yet Verified"}</span>
                                      <span>{previewWorker.rating || "No ratings yet"}</span>
                                      <span>{formatCurrency(previewWorker.dailyRate)}/day</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="household-notification-worker-preview empty">
                                  <p className="mb-0">No worker profile is attached to this notification.</p>
                                </div>
                              )}
                              <dl className="household-notification-job-preview">
                                <div>
                                  <dt>Job</dt>
                                  <dd>{previewJob?.jobTitle || previewJob?.serviceType || "Not available"}</dd>
                                </div>
                                <div>
                                  <dt>Location</dt>
                                  <dd>
                                    {previewJob
                                      ? formatLocation(previewJob.barangay, previewJob.streetAddress)
                                      : "Not available"}
                                  </dd>
                                </div>
                                <div>
                                  <dt>Rate</dt>
                                  <dd>{previewJob ? formatRate(previewJob.offeredRate, previewJob.rateType) : "Not available"}</dd>
                                </div>
                                <div>
                                  <dt>Date</dt>
                                  <dd>{householdNotificationPreview.date || "Recently"}</dd>
                                </div>
                              </dl>
                            </div>
                            <div className="household-notification-modal-actions">
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={closeHouseholdNotificationPreview}
                              >
                                Close
                              </button>
                              <button
                                className="btn btn-primary"
                                type="button"
                                onClick={openHouseholdNotificationPreviewDetails}
                              >
                                View Details
                              </button>
                            </div>
                          </section>
                        </div>
                      );
                    })()}
                </main>
              </div>
            </div>
          </section>
        )}
        {view === "household-dashboard" && (
          <section className="worker-dashboard household-dashboard-wireframe">
            <div className="household-dashboard-shell">
              <aside className="worker-sidebar household-dashboard-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item active" onClick={openHouseholdDashboard}>
                    {navIcon("dashboard")}
                    <span>Dashboard</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdPostJob}>
                    {navIcon("post-job")}
                    <span>Post a Job</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdMyJobs}>
                    {navIcon("jobs")}
                    <span>My Jobs</span>
                  </button>
                  <span className="worker-nav-section">Account</span>
                  <button className="worker-nav-item" onClick={openHouseholdProfile}>
                    {navIcon("profile")}
                    <span>My Profile</span>
                  </button>
                  <button className="worker-nav-item" onClick={openHouseholdNotifications}>
                    {navIcon("notifications")}
                    <span>Notifications</span>
                    {householdUnreadCount > 0 && <span className="nav-count-badge">{householdUnreadCount}</span>}
                  </button>
                </nav>
                <div className="worker-sidebar-footer">
                  <button className="worker-sidebar-logout" type="button" onClick={handleLogout}>
                    {navIcon("logout")}
                    <span>Log Out</span>
                  </button>
                </div>
              </aside>
              <div className="household-dashboard-main">
                <div className="household-dashboard-welcome">
                  Welcome, {currentUser?.displayName || "Household"}
                </div>

                <div className="household-dashboard-stats">
                  <div className="household-dashboard-stat">
                    <p>In Progress</p>
                    <strong>
                      {
                        householdJobs.filter((job) =>
                          ["Already found a worker", "In Progress", "Waiting for Household Confirmation"].includes(
                            job.status,
                          ),
                        ).length
                      }
                    </strong>
                  </div>
                  <div className="household-dashboard-stat">
                    <p>Cancelled Jobs</p>
                    <strong>{householdJobs.filter((job) => job.status === "Cancelled").length}</strong>
                  </div>
                  <div className="household-dashboard-stat">
                    <p>Completed</p>
                    <strong>{householdJobs.filter((job) => job.status === "Completed").length}</strong>
                  </div>
                </div>

                {pendingHouseholdReviewJobs.length > 0 && (
                  <section className="household-dashboard-review-reminder" aria-live="polite">
                    <div>
                      <strong>
                        {pendingHouseholdReviewJobs.length === 1
                          ? "Review reminder"
                          : `${pendingHouseholdReviewJobs.length} review reminders`}
                      </strong>
                      <p>
                        {pendingHouseholdReviewJobs.length === 1
                          ? `${pendingHouseholdReviewJobs[0].serviceType} service is completed and waiting for your feedback.`
                          : "Some completed services are waiting for household feedback."}
                      </p>
                    </div>
                  </section>
                )}

                <section className="household-dashboard-table-card">
                    <div className="household-dashboard-table-head">
                      <h2>Recent Post Jobs</h2>
                    </div>
                    <div className="household-dashboard-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Barangay</th>
                            <th>Rate</th>
                            <th>Status</th>
                            <th>Applications</th>
                          </tr>
                        </thead>
                        <tbody>
                          {householdJobs.length > 0 ? (
                            householdJobs.map((job) => (
                              <tr
                                key={job.id}
                                className="household-dashboard-job-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => openHouseholdDashboardJobPanel(job)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    openHouseholdDashboardJobPanel(job);
                                  }
                                }}
                              >
                                <td>{job.serviceType}</td>
                                <td>{job.barangay || "Not set"}</td>
                                <td>{formatRate(job.offeredRate, job.rateType)}</td>
                                <td>
                                  <span className={`badge ${getJobStatusBadgeClass(job.status)}`}>{job.status}</span>
                                </td>
                                <td>{buildMatchedWorkersForJob(job, registeredWorkers).length}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-4">
                                No posted jobs yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                </section>
                {householdDashboardDetailJob && (
                  <section
                    className={`household-dashboard-detail-tab ${
                      householdDashboardDetailJob.status === "Cancelled"
                        ? "cancelled"
                        : householdDashboardDetailJob.status === "Completed"
                          ? "completed"
                      : ""
                    }`}
                  >
                    <div className="household-dashboard-completion-box household-dashboard-review-window">
                      <div className="household-review-window-header">
                        <div>
                          <p className="household-review-window-kicker">Service Review</p>
                          <h2>{householdDashboardDetailJob.jobTitle || householdDashboardDetailJob.serviceType}</h2>
                        </div>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={closeHouseholdDashboardJobPanel}
                        >
                          Close
                        </button>
                      </div>
                      <div className="household-review-window-body">
                        <aside className="household-dashboard-worker-panel household-review-worker-card">
                          <div className="household-dashboard-worker-avatar">
                            {String(
                              householdDashboardDetailWorker
                                ? getDisplayName(
                                    householdDashboardDetailWorker.firstName,
                                    householdDashboardDetailWorker.lastName,
                                    householdDashboardDetailWorker.username,
                                  )
                                : (householdDashboardDetailJob.applications || [])[0]?.workerName || "W",
                            )
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <h3>
                              {householdDashboardDetailWorker
                                ? getDisplayName(
                                    householdDashboardDetailWorker.firstName,
                                    householdDashboardDetailWorker.lastName,
                                    householdDashboardDetailWorker.username,
                                  )
                                : (householdDashboardDetailJob.applications || [])[0]?.workerName || "No worker selected"}
                            </h3>
                            <p>
                              {householdDashboardDetailWorker?.bio ||
                                "Worker profile summary for this selected household job."}
                            </p>
                          </div>
                          <div className="household-dashboard-worker-facts">
                            <div>
                              <strong>Verification</strong>
                              <span>{householdDashboardDetailWorker?.verification || "Not available"}</span>
                            </div>
                            <div>
                              <strong>Rating</strong>
                              <span>{householdDashboardDetailWorker?.rating || "No ratings yet"}</span>
                            </div>
                            <div>
                              <strong>Skills</strong>
                              <span>{(householdDashboardDetailWorker?.skills || [householdDashboardDetailJob.serviceType]).join(", ")}</span>
                            </div>
                            <div>
                              <strong>Location</strong>
                              <span>
                                {formatLocation(
                                  householdDashboardDetailWorker?.barangay || householdDashboardDetailJob.barangay,
                                  householdDashboardDetailWorker?.streetAddress || "",
                                )}
                              </span>
                            </div>
                            <div>
                              <strong>Worker Rate</strong>
                              <span>
                                {householdDashboardDetailWorker
                                  ? formatRate(
                                      householdDashboardDetailWorker.dailyRate || householdDashboardDetailJob.offeredRate,
                                      householdDashboardDetailJob.rateType,
                                    )
                                  : formatRate(householdDashboardDetailJob.offeredRate, householdDashboardDetailJob.rateType)}
                              </span>
                            </div>
                          </div>
                        </aside>
                        <div className="household-dashboard-completion-panel household-review-main-panel">
                          <div className="household-dashboard-job-summary">
                            <h3>Job Details</h3>
                            <div className="household-dashboard-job-meta">
                              <span>
                                <strong>Service</strong>
                                {householdDashboardDetailJob.serviceType}
                              </span>
                              <span>
                                <strong>Rate</strong>
                                {formatRate(householdDashboardDetailJob.offeredRate, householdDashboardDetailJob.rateType)}
                              </span>
                              <span>
                                <strong>Schedule</strong>
                                {formatDateTime(householdDashboardDetailJob.preferredDate, householdDashboardDetailJob.preferredTime)}
                              </span>
                              <span>
                                <strong>Status</strong>
                                {householdDashboardDetailJob.status}
                              </span>
                            </div>
                          </div>
                          <div className="household-review-action-card">
                            <div className="household-dashboard-completion-notice">
                              {householdDashboardDetailJob.status === "Cancelled"
                                ? "This is the previous job post you cancelled. Worker profile details are hidden because no completed service happened."
                                : householdDashboardDetailJob.status === "Completed"
                                  ? "Job is completed. You can review the worker profile and your submitted rating here."
                                  : householdDashboardDetailWorker
                                    ? "Review the completed work, then confirm completion."
                                    : "No worker is assigned yet, so completion controls are not available."}
                            </div>
                            <ol className="household-dashboard-completion-steps">
                              <li className="done">
                                <span>1</span>
                                <p>
                                  <strong>Worker hired</strong>
                                  Job started after household accepted the worker.
                                </p>
                              </li>
                              <li className={householdDashboardDetailWorker ? "done" : ""}>
                                <span>2</span>
                                <p>
                                  <strong>Worker requests completion</strong>
                                  Worker marks service as done.
                                </p>
                              </li>
                              <li className={householdDashboardDetailJob.status === "Completed" ? "done" : "active"}>
                                <span>3</span>
                                <p>
                                  <strong>Confirm completed</strong>
                                  Household confirms completion.
                                </p>
                              </li>
                              <li className={householdDashboardDetailJob.status === "Completed" ? "active" : ""}>
                                <span>4</span>
                                <p>
                                  <strong>Rate worker</strong>
                                  Household submits rating and feedback.
                                </p>
                              </li>
                            </ol>
                            {householdDashboardDetailJob.status !== "Completed" && (
                              <div className="household-dashboard-completion-actions">
                                <button
                                  className={`btn ${!householdDashboardDetailWorker ? "btn-secondary" : "btn-success"}`}
                                  type="button"
                                  disabled={!householdDashboardDetailWorker}
                                  onClick={confirmDashboardJobCompleted}
                                >
                                  Confirm Completed
                                </button>
                              </div>
                            )}
                            {householdDashboardWorkerReview && (
                              <div className="alert alert-success mb-0 household-dashboard-review-complete">
                                <span>Review completed. You rated this worker {householdDashboardWorkerReview.rating}/5.</span>
                              </div>
                            )}
                            {(householdDashboardReviewOpen || shouldShowDashboardReviewForm) && !householdDashboardWorkerReview && (
                              <form
                                className="household-dashboard-review-form"
                                id="household-dashboard-review-form"
                                onSubmit={handleHouseholdReviewSubmit}
                              >
                                <label className="form-label fw-semibold" htmlFor="household-dashboard-rating-stars">
                                  Rating
                                </label>
                                {renderHouseholdStarRatingInput("household-dashboard-rating-stars")}
                                <div className="household-dashboard-star-rating household-dashboard-rating-preview-hidden" aria-label="Rating preview">
                                  {[1, 2, 3, 4, 5].map((ratingValue) => {
                                    const selectedRating = Number(householdReviewForm.rating || 0);
                                    const isFull = selectedRating >= ratingValue;
                                    const isHalf = selectedRating >= ratingValue - 0.5 && selectedRating < ratingValue;
                                    return (
                                      <span
                                        className={`household-dashboard-star-shell ${
                                          isFull ? "selected" : isHalf ? "half-selected" : ""
                                        }`}
                                        key={ratingValue}
                                      >
                                        <span className="household-dashboard-star-base">★</span>
                                        <span className="household-dashboard-star-fill">★</span>
                                      </span>
                                    );
                                  })}
                                  <span>{Number(householdReviewForm.rating || 0).toFixed(1)} / 5</span>
                                </div>
                                <label className="form-label fw-semibold">Feedback for worker</label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  placeholder="Write feedback about the worker..."
                                  value={householdReviewForm.feedback}
                                  onChange={(event) =>
                                    setHouseholdReviewForm((prev) => ({ ...prev, feedback: event.target.value }))
                                  }
                                />
                              </form>
                            )}
                            <div className="household-dashboard-modal-actions">
                              <button
                                className="btn btn-success"
                                form={
                                  (householdDashboardReviewOpen || shouldShowDashboardReviewForm) &&
                                  !householdDashboardWorkerReview
                                    ? "household-dashboard-review-form"
                                    : undefined
                                }
                                type={
                                  (householdDashboardReviewOpen || shouldShowDashboardReviewForm) &&
                                  !householdDashboardWorkerReview
                                    ? "submit"
                                    : "button"
                                }
                                onClick={
                                  (householdDashboardReviewOpen || shouldShowDashboardReviewForm) &&
                                  !householdDashboardWorkerReview
                                    ? undefined
                                    : closeHouseholdDashboardJobPanel
                                }
                              >
                                Done
                              </button>
                              {householdDashboardDetailJob.status === "Completed" && (
                                <button
                                  className="btn btn-primary"
                                  type="button"
                                  onClick={openHouseholdDashboardReviewsFromJob}
                                >
                                  View all Reviews
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
