import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken, setUnauthorizedHandler } from "./api/apiClient";
import {
  BARANGAYS,
  DEMO_HOUSEHOLD_ACCOUNTS,
  DEMO_VERIFICATION_REQUESTS,
  DEMO_WORKER_ACCOUNTS,
  EMPTY_HOUSEHOLD_FORM,
  EMPTY_HOUSEHOLD_REVIEW_FORM,
  EMPTY_WORKER_FEEDBACK_FORM,
  EMPTY_WORKER_FORM,
  IS_DEMO_MODE,
  PHILIPPINES_MAP_CENTER,
  SKILLS,
  STORAGE_KEYS,
} from "./constants/appConstants";
import {
  formatCurrency,
  formatDateTime,
  formatDistance,
  formatLocation,
  formatRate,
  formatScheduleLabel,
  getDisplayName,
  getDisplayRating,
  getHouseholdPhoto,
  getWorkerPhoto,
  sanitizePhilippinesPhone,
} from "./utils/formatters";
import { getBarangayCenter, getFallbackBarangay } from "./utils/locationUtils";
import {
  buildCoordinateLocation,
  buildMapPreviewUrl,
  buildTayabasLatLngBounds,
  formatCoordinateAddress,
  getNearestBarangayFromCoordinates,
  getSavedHouseholdLocation,
  haversineDistanceKm,
  isValidGmailAddress,
  resolveLocationCoordinates,
  reverseGeocodeCoordinates,
} from "./utils/locationServices";
import {
  dedupeNotifications,
  getApiErrorMessage,
  getWorkerVerificationLabel,
  isNumericIdentifier,
  normalizeBackendApplication,
  normalizeBackendJob,
  normalizeBackendWorker,
  normalizeBackendWorkerPayload,
  normalizeJobRecord,
  normalizeReview,
  normalizeVerificationRequest,
} from "./utils/normalizers";
import {
  buildMatchedWorkersForJob,
  buildWorkerFallbackFromJob,
  createDemoJobPostings,
  createJobRecord,
  findJobApplicationForWorker,
  getHiredWorkerCount,
  getHiringProgressLabel,
  getJobStatusBadgeClass,
  getPendingApplicationCount,
  getWorkerJobMatches,
  getWorkersNeeded,
} from "./utils/jobUtils";
import {
  getHouseholdNotifications,
  getHouseholdReviewReminderNotifications,
  getVerificationNotifications,
} from "./utils/notificationUtils";
import { getHouseholdReviewSummary, getWorkerReviewSummary } from "./utils/reviewUtils";
import {
  ensureDemoVersion,
  getNotificationReadState,
  getStoredCollection,
  mergeDemoRecords,
} from "./utils/storageUtils";
import { readResponseData } from "./utils/apiUtils";
import { loadLeafletAssets } from "./utils/mapAssets";
import { renderBarangayOptions } from "./utils/formOptions";
import "./styles/analytics.css";
import { useGawaGoNavigation } from "./hooks/useGawaGoNavigation";
import { useBackendSync } from "./hooks/useBackendSync";
import { usePasswordReset } from "./hooks/usePasswordReset";
import { useGawaGoFormHandlers } from "./hooks/useGawaGoFormHandlers";
import { useGawaGoActions } from "./hooks/useGawaGoActions";
import { useHouseholdJobLocation } from "./hooks/useHouseholdJobLocation";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import { useBackendPolling } from "./hooks/useBackendPolling";
import { useGawaGoDomEffects } from "./hooks/useGawaGoDomEffects";
import { useGawaGoPersistence } from "./hooks/useGawaGoPersistence";

const AppViews = lazy(() => import("./components/AppViews"));
const ForgotPasswordView = lazy(() => import("./components/ForgotPasswordView"));
const SuperAdminDashboardView = lazy(() => import("./components/SuperAdminDashboardView"));
const WorkerJobDetailView = lazy(() => import("./components/WorkerJobDetailView"));

function ViewLoading() {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-success" role="status" aria-label="Loading" />
      </div>
    </main>
  );
}

function App() {
  if (IS_DEMO_MODE) {
    ensureDemoVersion();
  }
  const isAdminPortalPath =
    typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "") === "/admin";
  const [view, setView] = useState(isAdminPortalPath ? "login" : "home");
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    role: isAdminPortalPath ? "admin" : "",
  });
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email");
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: "",
    token: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [registeredWorkers, setRegisteredWorkers] = useState(() =>
    IS_DEMO_MODE ? mergeDemoRecords(getStoredCollection(STORAGE_KEYS.workers, []), DEMO_WORKER_ACCOUNTS) : [],
  );
  const [registeredHouseholds, setRegisteredHouseholds] = useState(() =>
    IS_DEMO_MODE ? mergeDemoRecords(getStoredCollection(STORAGE_KEYS.households, []), DEMO_HOUSEHOLD_ACCOUNTS) : [],
  );
  const [verificationRequests, setVerificationRequests] = useState(() =>
    IS_DEMO_MODE
      ? mergeDemoRecords(getStoredCollection(STORAGE_KEYS.verificationRequests, []), DEMO_VERIFICATION_REQUESTS, "id")
      : [],
  );
  const [postedJobs, setPostedJobs] = useState(() =>
    IS_DEMO_MODE
      ? mergeDemoRecords(
          getStoredCollection(STORAGE_KEYS.jobs, []).map(normalizeJobRecord),
          createDemoJobPostings(),
          "id",
        )
      : [],
  );
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [selectedVerificationRequestId, setSelectedVerificationRequestId] = useState(null);
  const [adminSection, setAdminSection] = useState("verification");
  const [superAdminSection, setSuperAdminSection] = useState("verification");
  const [heatMapMetric, setHeatMapMetric] = useState("jobs");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [notificationReads, setNotificationReads] = useState(() => getNotificationReadState());
  const [workerForm, setWorkerForm] = useState(EMPTY_WORKER_FORM);
  const [householdForm, setHouseholdForm] = useState(EMPTY_HOUSEHOLD_FORM);
  const [householdProfileForm, setHouseholdProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    barangay: "",
    streetAddress: "",
    profilePhotoFile: null,
    profilePhotoName: "",
    profilePhotoPreview: "",
  });
  const [householdJobForm, setHouseholdJobForm] = useState({
    jobTitle: "",
    serviceType: "",
    customServiceType: "",
    scheduleType: "One - Time",
    preferredDate: "",
    preferredTime: "",
    description: "",
    barangay: "",
    streetAddress: "",
    offeredRate: "0.00",
    rateType: "Per Day",
    workersNeeded: "1",
  });
  const [householdJobImages, setHouseholdJobImages] = useState([]);
  const [workerProfileForm, setWorkerProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    barangay: "",
    streetAddress: "",
    latitude: null,
    longitude: null,
    locationLabel: "",
    locationSource: "",
    locationWarning: "",
    locationAccuracy: "",
    bio: "",
    hourlyRate: "0.00",
    dailyRate: "0.00",
    yearsExperience: "0",
    skills: [],
    availability: true,
    availabilityWindows: [],
    profilePhotoFile: null,
    profilePhotoPreview: "",
  });
  const [verificationForm, setVerificationForm] = useState({
    primaryIdName: "",
    primaryIdFile: null,
    secondaryDocName: "",
    secondaryDocFile: null,
    notes: "",
    primaryIdPreview: "",
    secondaryDocPreview: "",
  });
  const [householdReviewForm, setHouseholdReviewForm] = useState(EMPTY_HOUSEHOLD_REVIEW_FORM);
  const [workerFeedbackForm, setWorkerFeedbackForm] = useState(EMPTY_WORKER_FEEDBACK_FORM);
  const [adminLoginForm, setAdminLoginForm] = useState({
    username: "",
    password: "",
  });
  const [matchedWorkersByJob, setMatchedWorkersByJob] = useState({});
  const [householdJobCoordinates, setHouseholdJobCoordinates] = useState(null);
  const [householdJobLocationPreview, setHouseholdJobLocationPreview] = useState(null);
  const [householdJobMapMode, setHouseholdJobMapMode] = useState("preview");
  const householdJobMapRef = useRef(null);
  const householdJobMapViewRef = useRef({
    center: [PHILIPPINES_MAP_CENTER.latitude, PHILIPPINES_MAP_CENTER.longitude],
    zoom: 6,
    touched: false,
  });
  const householdJobBarangaySyncRef = useRef(0);
  const { handleForgotPasswordChange, handleForgotPasswordEmailSubmit, handleResetPassword, handleVerifyResetToken } =
    usePasswordReset({
      forgotPasswordForm,
      setForgotPasswordError,
      setForgotPasswordForm,
      setForgotPasswordLoading,
      setForgotPasswordNotice,
      setForgotPasswordStep,
    });
  useEffect(() => {
    if (!IS_DEMO_MODE) {
      return;
    }
    setRegisteredWorkers((prev) => mergeDemoRecords(prev, DEMO_WORKER_ACCOUNTS));
    setRegisteredHouseholds((prev) => mergeDemoRecords(prev, DEMO_HOUSEHOLD_ACCOUNTS));
    setVerificationRequests((prev) => mergeDemoRecords(prev, DEMO_VERIFICATION_REQUESTS, "id"));
    setPostedJobs((prev) => mergeDemoRecords(prev.map(normalizeJobRecord), createDemoJobPostings(), "id"));
  }, []);
  const backendCurrentWorker = normalizeBackendWorker(currentUser);
  const localCurrentWorker = registeredWorkers.find((item) => item.username === currentUser?.username) || null;
  const currentWorkerRequestFromProfile = normalizeVerificationRequest(currentUser?.profile?.verification_request);
  const currentWorkerVerificationRequest =
    verificationRequests.find((item) => item.workerUsername === currentUser?.username) ||
    currentWorkerRequestFromProfile ||
    localCurrentWorker?.verificationSubmission ||
    backendCurrentWorker?.verificationSubmission ||
    null;
  const currentWorkerVerificationLabel = currentWorkerVerificationRequest?.status
    ? getWorkerVerificationLabel(currentWorkerVerificationRequest.status)
    : getWorkerVerificationLabel(
        currentUser?.profile?.verification_status ||
          backendCurrentWorker?.verification ||
          localCurrentWorker?.verification,
      );
  const currentWorkerBase =
    currentUser?.role === "worker"
      ? backendCurrentWorker
        ? {
            ...localCurrentWorker,
            ...backendCurrentWorker,
            verificationNotifications: [
              ...(localCurrentWorker?.verificationNotifications || []),
              ...(backendCurrentWorker?.verificationNotifications || []),
            ],
            applicationNotifications: [
              ...(localCurrentWorker?.applicationNotifications || []),
              ...(backendCurrentWorker?.applicationNotifications || []),
            ],
            receivedReviews:
              localCurrentWorker?.receivedReviews?.length
                ? localCurrentWorker.receivedReviews
                : backendCurrentWorker.receivedReviews || [],
            givenFeedback:
              localCurrentWorker?.givenFeedback?.length
                ? localCurrentWorker.givenFeedback
                : backendCurrentWorker.givenFeedback || [],
          }
        : localCurrentWorker || null
      : null;
  const currentWorker = currentWorkerBase
    ? {
        ...currentWorkerBase,
        verification: currentWorkerVerificationLabel,
        verificationSubmission: currentWorkerVerificationRequest,
      }
    : null;
  const currentHousehold = registeredHouseholds.find((item) => item.username === currentUser?.username);
  const householdJobs = postedJobs.filter((item) => item.householdUsername === currentUser?.username);
  const selectedJob =
    householdJobs.find((item) => String(item.id) === String(selectedJobId)) ||
    householdJobs[0] ||
    postedJobs[0] ||
    null;
  const selectedMatchedWorkers = selectedJob
    ? matchedWorkersByJob[selectedJob.id] || buildMatchedWorkersForJob(selectedJob, registeredWorkers)
    : [];
  const selectedJobApplications = selectedJob?.applications || [];
  const selectedWorkerIdentity =
    selectedWorkerId && typeof selectedWorkerId === "object" ? selectedWorkerId : null;
  const normalizeLookupValue = (value) => String(value ?? "").trim().toLowerCase();
  const valuesMatch = (selectedValues, candidateValues) => {
    const normalizedSelectedValues = selectedValues.map(normalizeLookupValue).filter(Boolean);
    const normalizedCandidateValues = candidateValues.map(normalizeLookupValue).filter(Boolean);
    return normalizedSelectedValues.some((value) => normalizedCandidateValues.includes(value));
  };
  const selectedIdentityUsernameValues = selectedWorkerIdentity
    ? [selectedWorkerIdentity.username, selectedWorkerIdentity.workerUsername]
    : [];
  const selectedIdentityIdValues = selectedWorkerIdentity
    ? [
        selectedWorkerIdentity.id,
        selectedWorkerIdentity.workerId,
        selectedWorkerIdentity.userId,
        selectedWorkerIdentity.user_id,
      ]
    : [];
  const selectedIdentityProfileValues = selectedWorkerIdentity ? [selectedWorkerIdentity.profileId] : [];
  const selectedIdentityNameValues = selectedWorkerIdentity
    ? [selectedWorkerIdentity.displayName, selectedWorkerIdentity.workerName]
    : [];
  const selectedWorkerToken = selectedWorkerIdentity ? "" : normalizeLookupValue(selectedWorkerId);
  const workerMatchesSelectedToken = (worker) => {
    if (!worker) {
      return false;
    }
    if (selectedWorkerIdentity) {
      const workerUsernameValues = [worker.username, worker.workerUsername];
      if (
        selectedIdentityUsernameValues.some((value) => normalizeLookupValue(value)) &&
        workerUsernameValues.some((value) => normalizeLookupValue(value))
      ) {
        return valuesMatch(selectedIdentityUsernameValues, workerUsernameValues);
      }
      const workerNameValues = [
        worker.displayName,
        worker.workerName,
        getDisplayName(worker.firstName, worker.lastName, worker.username),
      ];
      if (
        selectedIdentityNameValues.some((value) => normalizeLookupValue(value)) &&
        workerNameValues.some((value) => normalizeLookupValue(value)) &&
        !valuesMatch(selectedIdentityNameValues, workerNameValues)
      ) {
        return false;
      }
      const workerIdValues = [worker.id, worker.workerId, worker.userId, worker.user_id];
      if (valuesMatch(selectedIdentityIdValues, workerIdValues)) {
        return true;
      }
      if (valuesMatch(selectedIdentityProfileValues, [worker.profileId])) {
        return true;
      }
      const hasSpecificIdentity =
        selectedIdentityUsernameValues.some((value) => normalizeLookupValue(value)) ||
        selectedIdentityIdValues.some((value) => normalizeLookupValue(value)) ||
        selectedIdentityProfileValues.some((value) => normalizeLookupValue(value));
      if (hasSpecificIdentity) {
        return false;
      }
      return valuesMatch(selectedIdentityNameValues, workerNameValues);
    }
    if (!selectedWorkerToken) {
      return false;
    }
    return [
      worker.id,
      worker.workerId,
      worker.userId,
      worker.user_id,
      worker.profileId,
      worker.username,
      worker.workerUsername,
      getDisplayName(worker.firstName, worker.lastName, worker.username),
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .some((value) => String(value).trim().toLowerCase() === selectedWorkerToken);
  };
  const applicationMatchesSelectedToken = (application) => {
    if (!application) {
      return false;
    }
    if (selectedWorkerIdentity) {
      const applicationUsernameValues = [application.workerUsername];
      if (
        selectedIdentityUsernameValues.some((value) => normalizeLookupValue(value)) &&
        applicationUsernameValues.some((value) => normalizeLookupValue(value))
      ) {
        return valuesMatch(selectedIdentityUsernameValues, applicationUsernameValues);
      }
      if (
        selectedIdentityNameValues.some((value) => normalizeLookupValue(value)) &&
        application.workerName &&
        !valuesMatch(selectedIdentityNameValues, [application.workerName])
      ) {
        return false;
      }
      if (valuesMatch(selectedIdentityIdValues, [application.workerId, application.worker_id])) {
        return true;
      }
      const hasSpecificIdentity =
        selectedIdentityUsernameValues.some((value) => normalizeLookupValue(value)) ||
        selectedIdentityIdValues.some((value) => normalizeLookupValue(value));
      if (hasSpecificIdentity) {
        return false;
      }
      return valuesMatch(selectedIdentityNameValues, [application.workerName]);
    }
    if (!selectedWorkerToken) {
      return false;
    }
    return [application.workerId, application.worker_id, application.workerUsername, application.workerName]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .some((value) => String(value).trim().toLowerCase() === selectedWorkerToken);
  };
  const selectedWorkerApplication =
    selectedJobApplications.find((application) => applicationMatchesSelectedToken(application)) || null;
  const matchedSelectedWorker =
    selectedMatchedWorkers.find((worker) => workerMatchesSelectedToken(worker)) ||
    selectedMatchedWorkers.find(
      (worker) =>
        selectedWorkerApplication &&
        (worker.username === selectedWorkerApplication.workerUsername ||
          worker.workerUsername === selectedWorkerApplication.workerUsername ||
          getDisplayName(worker.firstName, worker.lastName, worker.username) === selectedWorkerApplication.workerName ||
          String(worker.id) === String(selectedWorkerApplication.workerId) ||
          String(worker.workerId) === String(selectedWorkerApplication.workerId)),
    ) ||
    null;
  const registeredSelectedWorker =
    registeredWorkers.find((worker) => workerMatchesSelectedToken(worker)) ||
    registeredWorkers.find(
      (worker) =>
        selectedWorkerApplication &&
        (worker.username === selectedWorkerApplication.workerUsername ||
          worker.workerUsername === selectedWorkerApplication.workerUsername ||
          getDisplayName(worker.firstName, worker.lastName, worker.username) === selectedWorkerApplication.workerName ||
          String(worker.id) === String(selectedWorkerApplication.workerId) ||
          String(worker.workerId) === String(selectedWorkerApplication.workerId)),
    ) ||
    null;
  const selectedWorker = matchedSelectedWorker
    ? {
        ...registeredSelectedWorker,
        ...matchedSelectedWorker,
      }
    : registeredSelectedWorker || buildWorkerFallbackFromJob(selectedJob, selectedWorkerIdentity || selectedWorkerId);
  const selectedWorkerPhoto = getWorkerPhoto(selectedWorker);
  const selectedVerificationRequest =
    verificationRequests.find((item) => item.id === selectedVerificationRequestId) || verificationRequests[0] || null;
  const workerVisibleJobs = getWorkerJobMatches(currentWorker, postedJobs);
  const workerMatchedJobs = workerVisibleJobs.filter((job) => job.matchesSkill);
  const workerMiniPhoto = getWorkerPhoto(currentWorker);
  const householdNotifications = dedupeNotifications([
    ...getHouseholdNotifications(householdJobs, registeredWorkers),
    ...getHouseholdReviewReminderNotifications(householdJobs, registeredWorkers, currentHousehold),
    ...backendNotifications.filter(
      (item) =>
        item.notificationType === "application" ||
        item.notificationType === "completion" ||
        item.title === "New feedback received",
    ),
  ]);
  const verificationNotifications = getVerificationNotifications(verificationRequests, registeredWorkers);
  const workerNotifications = dedupeNotifications([
    ...backendNotifications.filter((item) => item.notificationType !== "application"),
    ...(currentWorker?.verificationNotifications || []),
    ...(currentWorker?.applicationNotifications || []),
  ]);
  const householdNotificationsWithReadState = householdNotifications.map((item) => ({
    ...item,
    unread: item.unread !== false && !notificationReads[item.id],
  }));
  const workerNotificationsWithReadState = workerNotifications.map((item) => ({
    ...item,
    unread: item.unread !== false && !notificationReads[item.id],
  }));
  const workerApplications = currentWorker
    ? postedJobs.flatMap((job) =>
        (job.applications || [])
          .filter(
            (application) =>
              String(application.workerId) === String(currentWorker.id) ||
              application.workerUsername === currentWorker.username,
          )
          .map((application) => ({
            ...job,
            appliedAt: application.appliedAt,
            updatedAt: application.updatedAt,
            applicationStatus: application.status,
            applicationId: application.id,
          })),
      )
    : [];
  const selectedWorkerJob =
    selectedJobId == null ? null : postedJobs.find((item) => String(item.id) === String(selectedJobId));
  const selectedWorkerApplicationJob =
    selectedJobId == null ? null : workerApplications.find((item) => String(item.id) === String(selectedJobId));
  const selectedWorkerVisibleJob =
    selectedJobId == null ? null : workerVisibleJobs.find((item) => String(item.id) === String(selectedJobId));
  const currentWorkerJobDetail =
    selectedWorkerApplicationJob ||
    (selectedWorkerVisibleJob && selectedWorkerJob
      ? {
          ...selectedWorkerVisibleJob,
          applications: selectedWorkerJob.applications || [],
        }
      : null) ||
    selectedWorkerJob ||
    workerVisibleJobs[0] ||
    null;
  const currentWorkerJobHousehold = currentWorkerJobDetail
    ? registeredHouseholds.find((item) => item.username === currentWorkerJobDetail.householdUsername)
    : null;
  useEffect(() => {
    if (view !== "worker-job-detail" || currentUser?.role !== "worker" || !selectedJobId || !getAuthToken()) {
      return;
    }
    let cancelled = false;
    async function refreshSelectedWorkerJob() {
      try {
        const response = await apiRequest(`jobs/${selectedJobId}/`, {
          auth: true,
          suppressUnauthorized: true,
        });
        const data = await readResponseData(response);
        if (!response.ok || cancelled) {
          return;
        }
        const normalizedJob = normalizeBackendJob(data);
        if (!normalizedJob) {
          return;
        }
        setPostedJobs((prev) =>
          prev.map((job) =>
            String(job.id) === String(normalizedJob.id) ? normalizedJob : job,
          ),
        );
      } catch (error) {
        return;
      }
    }
    refreshSelectedWorkerJob();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, selectedJobId, view]);
  const adminVisibleWorkers = registeredWorkers.filter((worker) => Boolean(worker.verificationSubmission));
  const pendingVerificationRequests = verificationRequests.filter(
    (item) => item.status === "Pending" || item.status === "Under Review",
  );
  const approvedVerificationRequests = verificationRequests.filter((item) => item.status === "Approved");
  const rejectedVerificationRequests = verificationRequests.filter((item) => item.status === "Rejected");
  const householdUnreadCount = householdNotificationsWithReadState.filter((item) => item.unread).length;
  const workerUnreadCount = workerNotificationsWithReadState.filter((item) => item.unread).length;
  const workerApplicationUnreadCount = workerApplications.filter((job) => {
    const notificationId = `worker-application-${job.applicationId}`;
    return ["Hired", "Rejected"].includes(job.applicationStatus) && !notificationReads[notificationId];
  }).length;
  const {
    mergeBackendWorkerIntoState,
    refreshVerificationStateFromBackend,
    refreshJobsFromBackend,
    refreshProfilesFromBackend,
    refreshRecommendedWorkers,
    refreshNotificationsFromBackend,
    refreshReviewsFromBackend,
  } = useBackendSync({
    currentUser,
    registeredWorkers,
    selectedWorker,
    setBackendNotifications,
    setCurrentUser,
    setMatchedWorkersByJob,
    setPostedJobs,
    setRegisteredHouseholds,
    setRegisteredWorkers,
    setSelectedJobId,
    setSelectedVerificationRequestId,
    setSelectedWorkerId,
    setVerificationRequests,
    setView,
  });
  const dashboardMetrics = useDashboardMetrics({
    currentUser,
    postedJobs,
    registeredHouseholds,
    registeredWorkers,
    verificationRequests,
  });
  useBackendPolling({
    currentUser,
    currentWorkerVerificationLabel,
    currentWorkerVerificationRequest,
    refreshJobsFromBackend,
    refreshNotificationsFromBackend,
    refreshProfilesFromBackend,
    refreshRecommendedWorkers,
    refreshReviewsFromBackend,
    refreshVerificationStateFromBackend,
    registeredWorkers,
    selectedJob,
    selectedWorker,
    setBackendNotifications,
    setCurrentUser,
  });
  useGawaGoPersistence({
    isDemoMode: IS_DEMO_MODE,
    notificationReads,
    postedJobs,
    registeredHouseholds,
    registeredWorkers,
    verificationRequests,
  });
  const {
    goBack,
    goHome,
    handleLogout,
    markAllNotificationsRead,
    markAllWorkerApplicationsRead,
    markAllWorkerNotificationsRead,
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
  } = useGawaGoNavigation({
    backendNotifications,
    currentHousehold,
    currentUser,
    currentWorker,
    householdNotificationsWithReadState,
    refreshNotificationsFromBackend,
    selectedJob,
    setAdminSection,
    setCurrentUser,
    setForgotPasswordError,
    setForgotPasswordForm,
    setForgotPasswordNotice,
    setForgotPasswordStep,
    setHouseholdForm,
    setHouseholdJobCoordinates,
    setHouseholdJobForm,
    setHouseholdJobLocationPreview,
    setHouseholdProfileForm,
    setLoginForm,
    setNotificationReads,
    setSelectedJobId,
    setSelectedVerificationRequestId,
    setSelectedWorkerId,
    setView,
    setWorkerForm,
    setWorkerProfileForm,
    workerApplications,
    workerNotificationsWithReadState,
  });
  const { captureHouseholdJobLocation, placeHouseholdJobPin, syncHouseholdJobBarangayLocation } =
    useHouseholdJobLocation({
      buildCoordinateLocation,
      buildMapPreviewUrl,
      formatCoordinateAddress,
      formatLocation,
      getBarangayCenter,
      getFallbackBarangay,
      getNearestBarangayFromCoordinates,
      householdJobBarangaySyncRef,
      householdJobForm,
      householdJobMapViewRef,
      resolveLocationCoordinates,
      reverseGeocodeCoordinates,
      setHouseholdJobCoordinates,
      setHouseholdJobForm,
      setHouseholdJobLocationPreview,
      setHouseholdJobMapMode,
    });
  const {
    handleApplyToJob,
    handleHireWorker,
    handleWorkerRequestCompletion,
    handleWorkerHireDecision,
    handleRejectApplication,
    handleLoginSubmit,
    handleWorkerRegisterSubmit,
    handleHouseholdRegisterSubmit,
    handleWorkerProfileSave,
    handleVerificationSubmit,
    handleHouseholdProfileSave,
    handleCancelJob,
    handleConfirmJobCompleted,
    handleHouseholdReviewSubmit,
    handleWorkerFeedbackSubmit,
    handleWorkerFeedbackForReviewSubmit,
    handleHouseholdJobSubmit,
    handleAdminApproveVerification,
    handleAdminRejectVerification,
  } = useGawaGoActions({
    EMPTY_HOUSEHOLD_FORM,
    EMPTY_HOUSEHOLD_REVIEW_FORM,
    EMPTY_WORKER_FEEDBACK_FORM,
    EMPTY_WORKER_FORM,
    apiRequest,
    clearAuthToken,
    createJobRecord,
    currentHousehold,
    currentUser,
    currentWorker,
    findJobApplicationForWorker,
    formatLocation,
    formatScheduleLabel,
    getApiErrorMessage,
    getAuthToken,
    getDisplayName,
    getHiredWorkerCount,
    getSavedHouseholdLocation,
    getWorkersNeeded,
    householdForm,
    householdJobCoordinates,
    householdJobForm,
    householdJobImages,
    householdJobLocationPreview,
    householdProfileForm,
    householdReviewForm,
    isNumericIdentifier,
    isValidGmailAddress,
    loginForm,
    mergeBackendWorkerIntoState,
    normalizeBackendApplication,
    normalizeBackendJob,
    normalizeBackendWorkerPayload,
    normalizeReview,
    normalizeVerificationRequest,
    postedJobs,
    readResponseData,
    refreshJobsFromBackend,
    refreshNotificationsFromBackend,
    refreshRecommendedWorkers,
    refreshReviewsFromBackend,
    refreshVerificationStateFromBackend,
    registeredHouseholds,
    registeredWorkers,
    resolveLocationCoordinates,
    selectedJob,
    selectedJobId,
    selectedWorker,
    setAuthToken,
    setCurrentUser,
    setHouseholdForm,
    setHouseholdJobCoordinates,
    setHouseholdJobForm,
    setHouseholdJobImages,
    setHouseholdJobLocationPreview,
    setHouseholdReviewForm,
    setLoginForm,
    setPostedJobs,
    setRegisteredHouseholds,
    setRegisteredWorkers,
    setSelectedJobId,
    setSelectedVerificationRequestId,
    setVerificationRequests,
    setView,
    setWorkerFeedbackForm,
    setWorkerForm,
    verificationForm,
    verificationRequests,
    workerFeedbackForm,
    workerForm,
    workerProfileForm,
  });
  const {
    handleHouseholdChange,
    handleHouseholdJobChange,
    handleHouseholdProfileChange,
    handleLoginChange,
    handleVerificationChange,
    handleWorkerChange,
    handleWorkerProfileChange,
    toggleSkill,
    toggleWorkerProfileSkill,
  } = useGawaGoFormHandlers({
    setHouseholdForm,
    setHouseholdJobCoordinates,
    setHouseholdJobForm,
    setHouseholdJobLocationPreview,
    setHouseholdProfileForm,
    setLoginForm,
    setVerificationForm,
    setWorkerForm,
    setWorkerProfileForm,
    syncHouseholdJobBarangayLocation,
  });
  useGawaGoDomEffects({
    clearAuthToken,
    currentHousehold,
    currentUser,
    getSavedHouseholdLocation,
    householdJobs,
    selectedJobId,
    selectedVerificationRequestId,
    setCurrentUser,
    setHouseholdJobForm,
    setLoginForm,
    setSelectedJobId,
    setSelectedVerificationRequestId,
    setSelectedWorkerId,
    setUnauthorizedHandler,
    setView,
    verificationRequests,
    view,
  });
  if (view === "worker-job-detail") {
    return (
      <Suspense fallback={<ViewLoading />}>
        <WorkerJobDetailView
          currentUser={currentUser}
          currentWorker={currentWorker}
          currentWorkerJobDetail={currentWorkerJobDetail}
          currentWorkerJobHousehold={currentWorkerJobHousehold}
          handleApplyToJob={handleApplyToJob}
          handleLogout={handleLogout}
          handleWorkerHireDecision={handleWorkerHireDecision}
          handleWorkerRequestCompletion={handleWorkerRequestCompletion}
          openWorkerApplications={openWorkerApplications}
          openWorkerDashboard={openWorkerDashboard}
          openWorkerFindJobs={openWorkerFindJobs}
          openWorkerGetVerified={openWorkerGetVerified}
          openWorkerNotifications={openWorkerNotifications}
          openWorkerProfile={openWorkerProfile}
          workerApplicationUnreadCount={workerApplicationUnreadCount}
          workerMiniPhoto={workerMiniPhoto}
        />
      </Suspense>
    );
  }
  if (view === "superadmin-dashboard") {
    return (
      <Suspense fallback={<ViewLoading />}>
        <SuperAdminDashboardView
          currentUser={currentUser}
          dashboardMetrics={dashboardMetrics}
          handleAdminApproveVerification={handleAdminApproveVerification}
          handleAdminRejectVerification={handleAdminRejectVerification}
          handleLogout={handleLogout}
          heatMapMetric={heatMapMetric}
          openFilePreview={openFilePreview}
          openVerificationRequest={openVerificationRequest}
          pendingVerificationRequests={pendingVerificationRequests}
          postedJobs={postedJobs}
          registeredHouseholds={registeredHouseholds}
          registeredWorkers={registeredWorkers}
          rejectedVerificationRequests={rejectedVerificationRequests}
          selectedVerificationRequest={selectedVerificationRequest}
          setHeatMapMetric={setHeatMapMetric}
          setSuperAdminSection={setSuperAdminSection}
          superAdminSection={superAdminSection}
          verificationRequests={verificationRequests}
        />
      </Suspense>
    );
  }
  if (view === "forgot-password") {
    return (
      <Suspense fallback={<ViewLoading />}>
        <ForgotPasswordView
          form={forgotPasswordForm}
          step={forgotPasswordStep}
          notice={forgotPasswordNotice}
          error={forgotPasswordError}
          loading={forgotPasswordLoading}
          onChange={handleForgotPasswordChange}
          onEmailSubmit={handleForgotPasswordEmailSubmit}
          onVerifyToken={handleVerifyResetToken}
          onResetPassword={handleResetPassword}
          onOpenLogin={openLogin}
          onOpenForgotPassword={openForgotPassword}
        />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<ViewLoading />}>
      <AppViews
      SKILLS={SKILLS}
      adminSection={adminSection}
      adminVisibleWorkers={adminVisibleWorkers}
      approvedVerificationRequests={approvedVerificationRequests}
      buildMatchedWorkersForJob={buildMatchedWorkersForJob}
      currentHousehold={currentHousehold}
      currentUser={currentUser}
      currentWorker={currentWorker}
      dashboardMetrics={dashboardMetrics}
      isAdminPortalPath={isAdminPortalPath}
      formatCurrency={formatCurrency}
      formatDateTime={formatDateTime}
      formatDistance={formatDistance}
      formatLocation={formatLocation}
      formatRate={formatRate}
      formatScheduleLabel={formatScheduleLabel}
      getDisplayName={getDisplayName}
      getJobStatusBadgeClass={getJobStatusBadgeClass}
      goBack={goBack}
      handleAdminApproveVerification={handleAdminApproveVerification}
      handleAdminRejectVerification={handleAdminRejectVerification}
      handleApplyToJob={handleApplyToJob}
      handleCancelJob={handleCancelJob}
      handleConfirmJobCompleted={handleConfirmJobCompleted}
      handleHireWorker={handleHireWorker}
      handleWorkerRequestCompletion={handleWorkerRequestCompletion}
      handleHouseholdChange={handleHouseholdChange}
      handleHouseholdJobChange={handleHouseholdJobChange}
      handleHouseholdJobSubmit={handleHouseholdJobSubmit}
      handleHouseholdProfileChange={handleHouseholdProfileChange}
      handleHouseholdProfileSave={handleHouseholdProfileSave}
      handleHouseholdRegisterSubmit={handleHouseholdRegisterSubmit}
      handleHouseholdReviewSubmit={handleHouseholdReviewSubmit}
      handleLoginChange={handleLoginChange}
      handleLoginSubmit={handleLoginSubmit}
      handleLogout={handleLogout}
      handleRejectApplication={handleRejectApplication}
      handleVerificationChange={handleVerificationChange}
      handleVerificationSubmit={handleVerificationSubmit}
      handleWorkerChange={handleWorkerChange}
      handleWorkerProfileChange={handleWorkerProfileChange}
      handleWorkerProfileSave={handleWorkerProfileSave}
      handleWorkerFeedbackForReviewSubmit={handleWorkerFeedbackForReviewSubmit}
      handleWorkerRegisterSubmit={handleWorkerRegisterSubmit}
      householdForm={householdForm}
      householdJobCoordinates={householdJobCoordinates}
      householdJobForm={householdJobForm}
      householdJobImages={{ files: householdJobImages, onChange: setHouseholdJobImages }}
      householdJobLocationPreview={householdJobLocationPreview}
      householdJobMapMode={householdJobMapMode}
      householdJobMapRef={householdJobMapRef}
      householdJobMapViewRef={householdJobMapViewRef}
      householdJobs={householdJobs}
      householdNotificationsWithReadState={householdNotificationsWithReadState}
      householdProfileForm={householdProfileForm}
      householdReviewForm={householdReviewForm}
      householdUnreadCount={householdUnreadCount}
      loginForm={loginForm}
      markAllNotificationsRead={markAllNotificationsRead}
      markNotificationRead={markNotificationRead}
      openAdminDashboard={openAdminDashboard}
      openAdminWorkersHistory={openAdminWorkersHistory}
      openFilePreview={openFilePreview}
      openForgotPassword={openForgotPassword}
      openHouseholdDashboard={openHouseholdDashboard}
      openHouseholdFeedbackAll={openHouseholdFeedbackAll}
      openHouseholdJobDetail={openHouseholdJobDetail}
      openHouseholdMyJobs={openHouseholdMyJobs}
      openHouseholdNotificationWorker={openHouseholdNotificationWorker}
      openHouseholdNotifications={openHouseholdNotifications}
      openHouseholdPostJob={openHouseholdPostJob}
      openHouseholdProfile={openHouseholdProfile}
      openHouseholdRegister={openHouseholdRegister}
      openHouseholdReviewsAll={openHouseholdReviewsAll}
      openLogin={openLogin}
      openMatchedWorkerProfile={openMatchedWorkerProfile}
      openVerificationRequest={openVerificationRequest}
      openWorkerApplications={openWorkerApplications}
      openWorkerDashboard={openWorkerDashboard}
      openWorkerFindJobs={openWorkerFindJobs}
      openWorkerGetVerified={openWorkerGetVerified}
      openWorkerJobDetail={openWorkerJobDetail}
      openWorkerNotifications={openWorkerNotifications}
      openWorkerProfile={openWorkerProfile}
      openWorkerRegister={openWorkerRegister}
      pendingVerificationRequests={pendingVerificationRequests}
      registeredHouseholds={registeredHouseholds}
      registeredWorkers={registeredWorkers}
      rejectedVerificationRequests={rejectedVerificationRequests}
      renderBarangayOptions={renderBarangayOptions}
      captureHouseholdJobLocation={captureHouseholdJobLocation}
      loadLeafletAssets={loadLeafletAssets}
      placeHouseholdJobPin={placeHouseholdJobPin}
      selectedJob={selectedJob}
      selectedMatchedWorkers={selectedMatchedWorkers}
      selectedVerificationRequest={selectedVerificationRequest}
      selectedVerificationRequestId={selectedVerificationRequestId}
      selectedWorker={selectedWorker}
      selectedWorkerPhoto={selectedWorkerPhoto}
      setHouseholdReviewForm={setHouseholdReviewForm}
      setHouseholdJobMapMode={setHouseholdJobMapMode}
      setSelectedJobId={setSelectedJobId}
      setSelectedWorkerId={setSelectedWorkerId}
      setWorkerForm={setWorkerForm}
      setWorkerProfileForm={setWorkerProfileForm}
      toggleSkill={toggleSkill}
      toggleWorkerProfileSkill={toggleWorkerProfileSkill}
      verificationForm={verificationForm}
      verificationRequests={verificationRequests}
      view={view}
      workerApplicationUnreadCount={workerApplicationUnreadCount}
      workerApplications={workerApplications}
      workerForm={workerForm}
      workerMatchedJobs={workerMatchedJobs}
      workerMiniPhoto={workerMiniPhoto}
      workerNotificationsWithReadState={workerNotificationsWithReadState}
      workerProfileForm={workerProfileForm}
      workerUnreadCount={workerUnreadCount}
      workerVisibleJobs={workerVisibleJobs}
      />
    </Suspense>
  );
}
export default App;
