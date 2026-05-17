import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiRequest, clearAuthToken, getApiBaseUrl, getAuthToken, setAuthToken, setUnauthorizedHandler } from "./api/apiClient";
import LocationDistanceMap from "./components/LocationDistanceMap";
import "./styles/analytics.css";
const SKILLS = ["House Cleaning", "Cooking", "Laundry", "Childcare", "Elder Care", "Gardening", "Electrical Work", "Plumbing", "Carpentry", "Painting", "Aircon Repair/Cleaning", "Welding", "Driving", "Other"];
const BARANGAYS = ["Alitao", "Alupay", "Anos", "Ayaas", "Baguio", "Banilad", "Calumpang", "Camaysa", "Dapdap", "Gibanga", "Ibas", "Ilasan Ilaya", "Ilasan Ibaba", "Isabang", "Ipilan", "Katigan Kanluran", "Katigan Silangan", "Lalo", "Lakawan", "Lita", "Mateuna", "Mayowe", "Opias", "Palale Ilaya", "Palale Kanluran", "Palale Ibaba", "Palale Silangan", "Tamlong", "Talolong", "Tongko", "Wakas"];
const STORAGE_KEYS = { workers: "gawago-registered-workers", households: "gawago-registered-households", jobs: "gawago-posted-jobs", verificationRequests: "gawago-verification-requests", notificationReads: "gawago-notification-reads" };
const SUPER_ADMIN_ACCOUNT = { username: "superadmin", password: "superadmin123", displayName: "Super Admin" };
const DEMO_DATA_VERSION = "v17";
const DEMO_VERSION_KEY = "gawago-demo-data-version";
const API_BASE_URL = getApiBaseUrl();
const ACCOUNTS_API_BASE_URL = `${API_BASE_URL}/accounts`;
const EMPTY_WORKER_FORM = { firstName: "", lastName: "", username: "", email: "", phone: "", barangay: "", streetAddress: "", bio: "", hourlyRate: "0.00", dailyRate: "0.00", yearsExperience: "0", password: "", confirmPassword: "", skills: [], customSkill: "" };
const EMPTY_HOUSEHOLD_FORM = { firstName: "", lastName: "", username: "", email: "", phone: "", barangay: "", streetAddress: "", password: "", confirmPassword: "" };
const EMPTY_HOUSEHOLD_REVIEW_FORM = { rating: "5", feedback: "", jobId: "" };
const EMPTY_WORKER_FEEDBACK_FORM = { feedback: "", jobId: "" };
const GMAIL_ADDRESS_PATTERN = /^[A-Z0-9._%+-]+@gmail\.com$/i;
const OPENROUTESERVICE_API_KEY = import.meta.env.VITE_OPENROUTESERVICE_API_KEY || "";
const OPENROUTESERVICE_SEARCH_URL = import.meta.env.VITE_OPENROUTESERVICE_SEARCH_URL || "https://api.openrouteservice.org/geocode/search";
const OPENROUTESERVICE_REVERSE_URL = import.meta.env.VITE_OPENROUTESERVICE_REVERSE_URL || "https://api.openrouteservice.org/geocode/reverse";
const PHILIPPINES_MAP_CENTER = { latitude: 12.8797, longitude: 121.774 };
const PHILIPPINES_MAP_BOUNDS = {
  south: 4.5,
  west: 116.87,
  north: 21.3,
  east: 126.65,
};
const TAYABAS_CITY_CENTER = { latitude: 13.956, longitude: 121.592 };
const TAYABAS_MAP_BOUNDS = {
  south: 13.905,
  west: 121.535,
  north: 14.005,
  east: 121.635,
};
const ANALYTICS_CHART_COLORS = ["#667eea", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#4f2ea4"];
const ANALYTICS_SERVICE_CATEGORIES = ["House Cleaning", "Plumbing", "Electrical Work", "Laundry", "Childcare"];
const SHARED_DEMO_PASSWORD = "GawaGo123";
const DEMO_LOCATIONS = [
  ["Alitao", 14.053732435726491, 121.53367247279074],
  ["Alupay", 14.058062231209304, 121.60894317598026],
  ["Anos", 13.99232619250926, 121.5687256763307],
  ["Ayaas", 14.033228404082344, 121.61280358513223],
  ["Baguio", 14.021320928095191, 121.58003973115441],
  ["Banilad", 14.04366598567965, 121.60287713844916],
  ["Calumpang", 13.976661577650393, 121.55620698162966],
  ["Camaysa", 14.061311651286287, 121.55211748652624],
  ["Dapdap", 14.059836954143305, 121.56928155311572],
  ["Gibanga", 14.02426437684045, 121.52448299373229],
];
const NUMBER_WORDS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const DEMO_HOUSEHOLD_ACCOUNTS = DEMO_LOCATIONS.map(([barangay, latitude, longitude], index) => ({
  id: `demo-household-${index + 1}`,
  username: `Household ${index + 1}`,
  password: SHARED_DEMO_PASSWORD,
  firstName: "Household",
  lastName: NUMBER_WORDS[index],
  email: `household${index + 1}@gmail.com`,
  phone: `91700000${String(index + 1).padStart(2, "0")}`,
  barangay,
  streetAddress: `Demo Street ${index + 1}`,
  latitude,
  longitude,
}));
const DEMO_WORKER_TEMPLATES = [
  { skills: ["House Cleaning", "Laundry"], hourlyRate: "120.00", dailyRate: "650.00", yearsExperience: "3", verification: "Verified", rating: "4.90", reviewsDone: 3 },
  { skills: ["Plumbing", "Carpentry"], hourlyRate: "180.00", dailyRate: "900.00", yearsExperience: "5", verification: "Verified", rating: "4.50", reviewsDone: 2 },
  { skills: ["Electrical Work", "Aircon Repair/Cleaning"], hourlyRate: "200.00", dailyRate: "1000.00", yearsExperience: "4", verification: "Under Review", rating: "4.00", reviewsDone: 1 },
  { skills: ["Childcare", "Cooking"], hourlyRate: "130.00", dailyRate: "700.00", yearsExperience: "2", verification: "Rejected", rating: "3.00", reviewsDone: 1 },
  { skills: ["Laundry", "House Cleaning", "Cooking"], hourlyRate: "110.00", dailyRate: "600.00", yearsExperience: "1", verification: "Not Yet Verified", rating: "No ratings yet", reviewsDone: 0 },
  { skills: ["Gardening", "House Cleaning"], hourlyRate: "115.00", dailyRate: "620.00", yearsExperience: "2", verification: "Verified", rating: "4.70", reviewsDone: 2 },
  { skills: ["Painting", "Carpentry"], hourlyRate: "170.00", dailyRate: "850.00", yearsExperience: "6", verification: "Verified", rating: "4.80", reviewsDone: 4 },
  { skills: ["Elder Care", "Cooking"], hourlyRate: "150.00", dailyRate: "780.00", yearsExperience: "4", verification: "Under Review", rating: "4.20", reviewsDone: 1 },
  { skills: ["Welding", "Electrical Work"], hourlyRate: "220.00", dailyRate: "1200.00", yearsExperience: "7", verification: "Verified", rating: "4.60", reviewsDone: 3 },
  { skills: ["Driving", "Other"], hourlyRate: "160.00", dailyRate: "800.00", yearsExperience: "3", verification: "Not Yet Verified", rating: "No ratings yet", reviewsDone: 0 },
];
const DEMO_WORKER_ACCOUNTS = DEMO_LOCATIONS.map(([barangay, latitude, longitude], index) => {
  const template = DEMO_WORKER_TEMPLATES[index];
  return {
    id: `demo-worker-${index + 1}`,
    username: `Worker${index + 1}`,
    password: SHARED_DEMO_PASSWORD,
    firstName: "Worker",
    lastName: NUMBER_WORDS[index],
    email: `worker${index + 1}@gmail.com`,
    phone: `91800000${String(index + 1).padStart(2, "0")}`,
    barangay,
    streetAddress: `Worker Street ${index + 1}`,
    bio: `Demo profile for Worker ${NUMBER_WORDS[index]}.`,
    ...template,
    status: "Available",
    distanceKm: "0.00",
    latitude,
    longitude,
    avatar: "W",
    receivedReviews: template.reviewsDone > 0 ? [{ id: `demo-review-${index + 1}`, rating: Number.parseFloat(template.rating), feedback: "Demo review for analytics.", createdAt: "Recently" }] : [],
    givenFeedback: [],
    verificationNotifications: [],
    applicationNotifications: [],
  };
});
const DEMO_VERIFICATION_REQUESTS = [
  { id: "demo-verification-3", workerId: "demo-worker-3", workerUsername: "Worker3", workerName: "Worker Three", submittedAt: "Recently", reviewedAt: "", reviewedBy: "", status: "Pending", primaryIdName: "UMID", secondaryDocName: "Barangay Clearance", notes: "Awaiting admin review." },
  { id: "demo-verification-4", workerId: "demo-worker-4", workerUsername: "Worker4", workerName: "Worker Four", submittedAt: "Recently", reviewedAt: "Recently", reviewedBy: "Super Admin", status: "Rejected", primaryIdName: "Driver License", secondaryDocName: "NBI Clearance", notes: "Document image needs resubmission.", reviewNote: "Please upload clearer documents." },
];
const DEMO_ACCOUNT_PASSWORDS = Object.fromEntries([...DEMO_HOUSEHOLD_ACCOUNTS, ...DEMO_WORKER_ACCOUNTS].map((account) => [account.username, account.password]));
const BARANGAY_CENTERS = {
  Alitao: { latitude: 14.053732435726491, longitude: 121.53367247279074 },
  Alupay: { latitude: 14.058062231209304, longitude: 121.60894317598026 },
  Anos: { latitude: 13.99232619250926, longitude: 121.5687256763307 },
  Ayaas: { latitude: 14.033228404082344, longitude: 121.61280358513223 },
  Baguio: { latitude: 14.021320928095191, longitude: 121.58003973115441 },
  Banilad: { latitude: 14.04366598567965, longitude: 121.60287713844916 },
  Calumpang: { latitude: 13.976661577650393, longitude: 121.55620698162966 },
  Camaysa: { latitude: 14.061311651286287, longitude: 121.55211748652624 },
  Dapdap: { latitude: 14.059836954143305, longitude: 121.56928155311572 },
  Gibanga: { latitude: 14.02426437684045, longitude: 121.52448299373229 },
  Ibas: { latitude: 14.056263954528147, longitude: 121.5858639459556 },
  "Ilasan Ilaya": { latitude: 14.076395444822706, longitude: 121.62660976250517 },
  "Ilasan Ibaba": { latitude: 14.076395444822706, longitude: 121.62660976250517 },
  Isabang: { latitude: 13.962274547948905, longitude: 121.56328409695064 },
  Ipilan: { latitude: 14.033357570914804, longitude: 121.56833532099283 },
  "Katigan Kanluran": { latitude: 14.046025691828351, longitude: 121.6202812396619 },
  "Katigan Silangan": { latitude: 14.060227861113688, longitude: 121.62154538337464 },
  Lalo: { latitude: 14.050261202405046, longitude: 121.55717481490423 },
  Lakawan: { latitude: 14.009582881492914, longitude: 121.62560074991586 },
  Lita: { latitude: 14.017699813459267, longitude: 121.59813443683436 },
  Mateuna: { latitude: 14.023782235513432, longitude: 121.6406 },
  Mayowe: { latitude: 13.97392868959356, longitude: 121.5783335732242 },
  Opias: { latitude: 14.036073743242486, longitude: 121.59254781007984 },
  "Palale Ilaya": { latitude: 14.054262032583141, longitude: 121.6530714222272 },
  "Palale Kanluran": { latitude: 14.041216405063171, longitude: 121.6540020663721 },
  "Palale Ibaba": { latitude: 14.061429877540817, longitude: 121.70714387691235 },
  "Palale Silangan": { latitude: 14.089421743230861, longitude: 121.68915654043055 },
  Tamlong: { latitude: 14.069116148209835, longitude: 121.60191813524901 },
  Talolong: { latitude: 14.077712524215334, longitude: 121.61401135611793 },
  Tongko: { latitude: 13.987459902846487, longitude: 121.60973707319776 },
  Wakas: { latitude: 14.006911431929879, longitude: 121.60872288744254 },
};
let leafletAssetsPromise = null;
let tayabasBarangayCentersPromise = null;
async function readResponseData(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) {
    return null;
  }
  const rawBody = await response.text();
  if (!rawBody) {
    return null;
  }
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      return { detail: rawBody };
    }
  }
  return { detail: rawBody };
}
function isValidGmailAddress(email) {
  return GMAIL_ADDRESS_PATTERN.test(String(email || "").trim());
}
function clearDemoStorage() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.clear();
  window.localStorage.removeItem(STORAGE_KEYS.workers);
  window.localStorage.removeItem(STORAGE_KEYS.households);
  window.localStorage.removeItem(STORAGE_KEYS.jobs);
  window.localStorage.removeItem(STORAGE_KEYS.verificationRequests);
  window.localStorage.removeItem(STORAGE_KEYS.notificationReads);
  window.localStorage.setItem(DEMO_VERSION_KEY, DEMO_DATA_VERSION);
}
function ensureDemoVersion() {
  if (typeof window === "undefined") {
    return;
  }
  const savedVersion = window.localStorage.getItem(DEMO_VERSION_KEY);
  if (savedVersion !== DEMO_DATA_VERSION) {
    clearDemoStorage();
  }
}
const STATUS_PRIORITY = { Pending: 1, "Under Review": 2, Approved: 3, Rejected: 4 };
function getStoredCollection(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) {
    return fallback;
  }
  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch (error) {
    return fallback;
  }
}
function mergeDemoRecords(records, demoRecords, key = "username") {
  const currentRecords = Array.isArray(records) ? records : [];
  const existingKeys = new Set(currentRecords.map((record) => String(record?.[key] || "").toLowerCase()));
  const missingDemoRecords = demoRecords.filter((record) => !existingKeys.has(String(record?.[key] || "").toLowerCase()));
  return [...missingDemoRecords, ...currentRecords];
}
function getStoredObject(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) {
    return fallback;
  }
  try {
    const parsedValue = JSON.parse(storedValue);
    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch (error) {
    return fallback;
  }
}
function getNotificationReadState() {
  return getStoredObject(STORAGE_KEYS.notificationReads, {});
}
function getDisplayName(firstName, lastName, username) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  return fullName || username || "User";
}
function formatCurrency(amount) {
  const value = Number(amount || 0);
  return `PHP ${value.toFixed(2)}`;
}
function formatRate(amount, rateType) {
  return `${formatCurrency(amount)} / ${rateType || "Per Day"}`;
}
function formatAnalyticsMonth(date) {
  return date.toLocaleString("en-US", { month: "short" });
}
function getAnalyticsJobDate(job) {
  const parsedDate = new Date(job?.createdAt || job?.created_at || job?.preferredDate || Date.now());
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}
function buildMonthlyJobRequests(jobs) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = formatAnalyticsMonth(date);
    const year = date.getFullYear();
    return {
      month,
      requests: jobs.filter((job) => {
        const jobDate = getAnalyticsJobDate(job);
        return jobDate.getMonth() === date.getMonth() && jobDate.getFullYear() === year;
      }).length,
    };
  });
}
function buildServiceAnalytics(jobs) {
  const categories = Array.from(new Set([...ANALYTICS_SERVICE_CATEGORIES, ...jobs.map((job) => job.serviceType).filter(Boolean)]));
  return categories.map((service) => ({
    service: service.replace("House ", ""),
    requests: jobs.filter((job) => job.serviceType === service).length,
  })).filter((item) => item.requests > 0 || ANALYTICS_SERVICE_CATEGORIES.some((service) => service.replace("House ", "") === item.service)).slice(0, 7);
}
function buildBarangayAnalytics(records, accessor, valueKey) {
  return BARANGAYS.map((barangay) => ({
    barangay,
    [valueKey]: records.filter((record) => normalizeBarangayName(accessor(record)) === barangay).length,
  })).filter((item) => item[valueKey] > 0).sort((a, b) => b[valueKey] - a[valueKey]).slice(0, 8);
}
function buildBarangayHeatMapData(jobs, workers, verificationRequests, metric) {
  return BARANGAYS.map((barangay) => {
    const normalizedBarangay = normalizeBarangayName(barangay);
    const barangayJobs = jobs.filter((job) => normalizeBarangayName(job.barangay) === normalizedBarangay);
    const barangayWorkers = workers.filter((worker) => normalizeBarangayName(worker.barangay) === normalizedBarangay);
    const value = metric === "workers"
      ? barangayWorkers.length
      : metric === "completed"
        ? barangayJobs.filter((job) => job.status === "Completed").length
        : metric === "verification"
          ? verificationRequests.filter((request) => {
              const worker = workers.find((item) => item.username === request.workerUsername || String(item.id) === String(request.workerId));
              return ["Pending", "Under Review"].includes(request.status) && normalizeBarangayName(worker?.barangay) === normalizedBarangay;
            }).length
          : barangayJobs.length;
    return {
      barangay,
      value,
      jobs: barangayJobs.length,
      workers: barangayWorkers.length,
      completed: barangayJobs.filter((job) => job.status === "Completed").length,
      pendingVerifications: verificationRequests.filter((request) => {
        const worker = workers.find((item) => item.username === request.workerUsername || String(item.id) === String(request.workerId));
        return ["Pending", "Under Review"].includes(request.status) && normalizeBarangayName(worker?.barangay) === normalizedBarangay;
      }).length,
      ...getBarangayCenter(barangay),
    };
  }).filter((item) => item.latitude && item.longitude);
}
function getWorkerRatingValue(worker) {
  const directRating = Number(worker?.averageRating ?? worker?.average_rating);
  if (Number.isFinite(directRating) && directRating > 0) {
    return directRating;
  }
  const ratingText = Number.parseFloat(String(worker?.rating || "").replace(/[^0-9.]/g, ""));
  if (Number.isFinite(ratingText) && ratingText > 0) {
    return ratingText;
  }
  const reviews = worker?.receivedReviews || [];
  const reviewRatings = reviews.map((review) => Number(review.rating)).filter((rating) => Number.isFinite(rating) && rating > 0);
  if (!reviewRatings.length) {
    return null;
  }
  return reviewRatings.reduce((sum, rating) => sum + rating, 0) / reviewRatings.length;
}
function buildRatingDistribution(workers) {
  const ratings = workers.map(getWorkerRatingValue).filter((rating) => rating != null);
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars: `${stars} star${stars > 1 ? "s" : ""}`,
    count: ratings.filter((rating) => Math.round(rating) === stars).length,
  }));
}
function isImagePreviewUrl(url) {
  return /^blob:/i.test(String(url || "")) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(String(url || "").split("?")[0]);
}
function formatScheduleLabel(scheduleType) {
  return (scheduleType || "").replace(" - ", "-");
}
function formatDateTime(dateValue, timeValue) {
  if (!dateValue) {
    return "Schedule not set";
  }
  const parsedDate = /* @__PURE__ */ new Date(`${dateValue}T${timeValue || "00:00"}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Schedule not set";
  }
  return parsedDate.toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function formatLocation(barangay, streetAddress) {
  return [barangay, streetAddress].filter(Boolean).join(", ") || "Location not set";
}
function buildTayabasLocationQuery(barangay, streetAddress) {
  return [streetAddress, barangay, "Tayabas City", "Quezon", "Philippines"].filter(Boolean).join(", ");
}
function normalizeBarangayName(value) {
  const normalized = String(value || "").trim().replace(/^barangay\s+/i, "");
  if (!normalized) {
    return "";
  }
  return BARANGAYS.find((barangay) => barangay.toLowerCase() === normalized.toLowerCase()) || normalized;
}
function findTayabasBarangayFromText(value) {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) {
    return "";
  }
  return BARANGAYS.find((barangay) => {
    const escapedBarangay = barangay.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-z])(?:barangay\\s+)?${escapedBarangay}(?:$|[^a-z])`, "i").test(normalized);
  }) || "";
}
function getFallbackBarangay(value = "") {
  const matchedBarangay = findTayabasBarangayFromText(value) || BARANGAYS.find((barangay) => barangay.toLowerCase() === String(value || "").trim().replace(/^barangay\s+/i, "").toLowerCase());
  return matchedBarangay || "Poblacion";
}
function getBarangayCenter(barangay) {
  const resolvedBarangay = getFallbackBarangay(barangay);
  return {
    barangay: resolvedBarangay,
    ...(BARANGAY_CENTERS[resolvedBarangay] || TAYABAS_CITY_CENTER),
  };
}
function formatCoordinateAddress(latitude, longitude) {
  const lat = Number(Number(latitude).toFixed(5));
  const lon = Number(Number(longitude).toFixed(5));
  return `Tayabas City coordinates ${lat}, ${lon}`;
}
function isGenericAddressPart(part) {
  return /^(barangay\s+)?(tayabas|tayabas city|quezon|philippines|poblacion)$/i.test(String(part || "").trim());
}
function splitFullName(fullName, fallbackUsername = "") {
  const normalized = String(fullName || "").trim();
  if (!normalized) {
    return { firstName: "", lastName: "", displayName: fallbackUsername || "User" };
  }
  const parts = normalized.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
    displayName: normalized,
  };
}
function parseLocationLabel(locationLabel) {
  const parts = String(locationLabel || "").split(",").map((part) => part.trim()).filter(Boolean);
  const barangayIndex = parts.findIndex((part) => BARANGAYS.some((barangay) => barangay.toLowerCase() === part.replace(/^barangay\s+/i, "").trim().toLowerCase()));
  if (barangayIndex >= 0) {
    const barangay = normalizeBarangayName(parts[barangayIndex]);
    const streetParts = parts.filter((_, index) => index !== barangayIndex).filter((part) => !/^(tayabas|tayabas city|quezon|philippines)$/i.test(part));
    return {
      barangay,
      streetAddress: streetParts.join(", "),
    };
  }
  return {
    barangay: normalizeBarangayName(parts[0] || ""),
    streetAddress: parts.slice(1).join(", "),
  };
}
function getSavedHouseholdLocation(currentHousehold, currentUser) {
  const profileLocation = parseLocationLabel(currentUser?.profile?.location_label || currentUser?.profile?.locationLabel || "");
  return {
    barangay: normalizeBarangayName(currentHousehold?.barangay || currentUser?.barangay || profileLocation.barangay || ""),
    streetAddress: currentHousehold?.streetAddress || currentUser?.streetAddress || profileLocation.streetAddress || "",
  };
}
function formatDistance(distanceKm, fallbackLabel = "") {
  if (distanceKm === null || distanceKm === undefined || distanceKm === "") {
    return fallbackLabel || "Distance not available";
  }
  const numericDistance = Number(distanceKm);
  if (Number.isFinite(numericDistance) && numericDistance >= 0) {
    if (numericDistance < 1) {
      return `${Math.max(1, Math.round(numericDistance * 1000))} meters away`;
    }
    return `${numericDistance.toFixed(1)} km away`;
  }
  return fallbackLabel || "Distance not available";
}
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const firstLatitude = Number(lat1);
  const firstLongitude = Number(lon1);
  const secondLatitude = Number(lat2);
  const secondLongitude = Number(lon2);
  if (![firstLatitude, firstLongitude, secondLatitude, secondLongitude].every(Number.isFinite)) {
    return null;
  }
  const earthRadiusKm = 6371;
  const toRadians = (value) => value * Math.PI / 180;
  const deltaLatitude = toRadians(secondLatitude - firstLatitude);
  const deltaLongitude = toRadians(secondLongitude - firstLongitude);
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(toRadians(firstLatitude)) * Math.cos(toRadians(secondLatitude)) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}
function buildMapPreviewUrl(latitude, longitude) {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  if (!Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) {
    return "";
  }
  const latOffset = 0.008;
  const lonOffset = 0.008;
  const left = encodeURIComponent((numericLongitude - lonOffset).toFixed(6));
  const bottom = encodeURIComponent((numericLatitude - latOffset).toFixed(6));
  const right = encodeURIComponent((numericLongitude + lonOffset).toFixed(6));
  const top = encodeURIComponent((numericLatitude + latOffset).toFixed(6));
  const marker = `${encodeURIComponent(numericLatitude.toFixed(6))}%2C${encodeURIComponent(numericLongitude.toFixed(6))}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${marker}`;
}
function buildTayabasMapPreviewUrl() {
  const left = encodeURIComponent(TAYABAS_MAP_BOUNDS.west.toFixed(6));
  const bottom = encodeURIComponent(TAYABAS_MAP_BOUNDS.south.toFixed(6));
  const right = encodeURIComponent(TAYABAS_MAP_BOUNDS.east.toFixed(6));
  const top = encodeURIComponent(TAYABAS_MAP_BOUNDS.north.toFixed(6));
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik`;
}
function buildPhilippinesMapPreviewUrl() {
  const left = encodeURIComponent(PHILIPPINES_MAP_BOUNDS.west.toFixed(6));
  const bottom = encodeURIComponent(PHILIPPINES_MAP_BOUNDS.south.toFixed(6));
  const right = encodeURIComponent(PHILIPPINES_MAP_BOUNDS.east.toFixed(6));
  const top = encodeURIComponent(PHILIPPINES_MAP_BOUNDS.north.toFixed(6));
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik`;
}
function getOpenRouteServiceHeaders() {
  return OPENROUTESERVICE_API_KEY ? {
    Authorization: OPENROUTESERVICE_API_KEY,
    Accept: "application/json, application/geo+json",
  } : {
    Accept: "application/json, application/geo+json",
  };
}
async function loadLeafletAssets() {
  if (typeof window === "undefined") {
    return null;
  }
  if (window.L) {
    return window.L;
  }
  if (!leafletAssetsPromise) {
    leafletAssetsPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet-runtime="true"]')) {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        stylesheet.dataset.leafletRuntime = "true";
        document.head.appendChild(stylesheet);
      }
      const existingScript = document.querySelector('script[data-leaflet-runtime="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.L), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Unable to load Leaflet map assets.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.dataset.leafletRuntime = "true";
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Unable to load Leaflet map assets."));
      document.body.appendChild(script);
    });
  }
  return leafletAssetsPromise;
}
function normalizeGeocodedAddress(address = {}, fallbackBarangay = "", fallbackStreetAddress = "") {
  const labelParts = String(address.label || "").split(",").map((part) => part.trim()).filter(Boolean);
  const addressParts = [
    address.neighbourhood,
    address.borough,
    address.suburb,
    address.quarter,
    address.locality,
    address.county,
    ...labelParts,
    fallbackBarangay,
  ];
  const barangay = normalizeBarangayName(addressParts.map(findTayabasBarangayFromText).find(Boolean) || fallbackBarangay || "");
  const streetFromFields = [address.house_number, address.street || address.name || address.road].filter(Boolean).join(" ").trim();
  const streetFromLabel = labelParts.find((part) => part !== barangay && !findTayabasBarangayFromText(part) && !isGenericAddressPart(part));
  const streetAddress = streetFromFields || streetFromLabel || fallbackStreetAddress || "";
  return {
    barangay,
    streetAddress,
    locationLabel: formatLocation(barangay, streetAddress),
  };
}
function buildCoordinateLocation(latitude, longitude, fallbackBarangay = "", fallbackStreetAddress = "", source = "device", warning = "") {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  const resolvedLatitude = Number((Number.isFinite(numericLatitude) ? numericLatitude : PHILIPPINES_MAP_CENTER.latitude).toFixed(7));
  const resolvedLongitude = Number((Number.isFinite(numericLongitude) ? numericLongitude : PHILIPPINES_MAP_CENTER.longitude).toFixed(7));
  const barangay = getFallbackBarangay(fallbackBarangay);
  const streetAddress = fallbackStreetAddress || formatCoordinateAddress(resolvedLatitude, resolvedLongitude);
  return {
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
    barangay,
    streetAddress,
    locationLabel: formatLocation(barangay, streetAddress),
    mapUrl: buildMapPreviewUrl(resolvedLatitude, resolvedLongitude),
    source,
    warning,
  };
}
function buildTayabasOnlyLocation(latitude, longitude, fallbackBarangay = "", fallbackStreetAddress = "", source = "address", warning = "") {
  const selectedBarangay = getFallbackBarangay(fallbackBarangay);
  const boundedPoint = isWithinTayabasBounds(latitude, longitude)
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : getBarangayCenter(selectedBarangay || "Poblacion");
  return buildCoordinateLocation(
    boundedPoint.latitude,
    boundedPoint.longitude,
    selectedBarangay || getFallbackBarangay("Poblacion"),
    fallbackStreetAddress || `Barangay ${selectedBarangay || "Poblacion"}, Tayabas City`,
    source,
    warning || "Location is limited to Tayabas City for GawaGo job matching.",
  );
}
async function fetchBarangayCenter(barangay) {
  if (!OPENROUTESERVICE_API_KEY) {
    return null;
  }
  try {
    const query = buildTayabasLocationQuery(barangay, "");
    const response = await fetch(
      `${OPENROUTESERVICE_SEARCH_URL}?text=${encodeURIComponent(query)}&boundary.country=PH&focus.point.lon=${encodeURIComponent(TAYABAS_CITY_CENTER.longitude)}&focus.point.lat=${encodeURIComponent(TAYABAS_CITY_CENTER.latitude)}&size=1&layers=locality,neighbourhood,address`,
      { method: "GET", headers: getOpenRouteServiceHeaders() },
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const feature = Array.isArray(data?.features) ? data.features[0] : null;
    const coordinates = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
    const latitude = Number(Number(coordinates[1]).toFixed(7));
    const longitude = Number(Number(coordinates[0]).toFixed(7));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    return { barangay, latitude, longitude };
  } catch (error) {
    return null;
  }
}
async function getTayabasBarangayCenters() {
  if (!tayabasBarangayCentersPromise) {
    tayabasBarangayCentersPromise = Promise.resolve(BARANGAYS.map(getBarangayCenter));
  }
  return tayabasBarangayCentersPromise;
}
async function getNearestBarangayFromCoordinates(latitude, longitude) {
  const centers = await getTayabasBarangayCenters();
  let nearest = null;
  centers.forEach((center) => {
    const distanceKm = haversineDistanceKm(latitude, longitude, center.latitude, center.longitude);
    if (distanceKm == null) {
      return;
    }
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { barangay: center.barangay, distanceKm };
    }
  });
  return nearest?.barangay || "";
}
function getCurrentCoordinates() {
  if (typeof window === "undefined" || !window.navigator?.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    window.navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: Number(position.coords.latitude.toFixed(7)),
        longitude: Number(position.coords.longitude.toFixed(7)),
        accuracy: Number(position.coords.accuracy || 0),
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
async function reverseGeocodeCoordinates(latitude, longitude, fallbackBarangay = "", fallbackStreetAddress = "") {
  const coordinateStreetAddress = formatCoordinateAddress(latitude, longitude);
  if (!OPENROUTESERVICE_API_KEY) {
    return buildCoordinateLocation(latitude, longitude, await getNearestBarangayFromCoordinates(latitude, longitude), coordinateStreetAddress, "device", "Reverse geocoding is unavailable right now, so the form used the map coordinates as the job address.");
  }
  let data = null;
  try {
    const response = await fetch(
      `${OPENROUTESERVICE_REVERSE_URL}?point.lon=${encodeURIComponent(longitude)}&point.lat=${encodeURIComponent(latitude)}&size=1&layers=address,street,locality,neighbourhood`,
      { method: "GET", headers: getOpenRouteServiceHeaders() },
    );
    if (!response.ok) {
      return buildCoordinateLocation(latitude, longitude, await getNearestBarangayFromCoordinates(latitude, longitude), coordinateStreetAddress, "device", "Reverse geocoding could not find a precise address, so the form used the map coordinates.");
    }
    data = await response.json();
  } catch (error) {
    return buildCoordinateLocation(latitude, longitude, await getNearestBarangayFromCoordinates(latitude, longitude), coordinateStreetAddress, "device", "Reverse geocoding could not be reached, so the form used the map coordinates.");
  }
  const feature = Array.isArray(data?.features) ? data.features[0] : null;
  if (!feature) {
    return buildCoordinateLocation(latitude, longitude, await getNearestBarangayFromCoordinates(latitude, longitude), coordinateStreetAddress, "device", "Reverse geocoding could not find a precise address, so the form used the map coordinates.");
  }
  const coordinates = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
  const properties = feature?.properties || {};
  const normalized = normalizeGeocodedAddress({
    label: properties.label,
    neighbourhood: properties.neighbourhood,
    borough: properties.borough,
    suburb: properties.suburb,
    quarter: properties.quarter,
    locality: properties.locality,
    county: properties.county,
    house_number: properties.housenumber,
    street: properties.street,
    name: properties.name,
  }, "", coordinateStreetAddress);
  const resolvedLatitude = Number(Number(coordinates[1] ?? latitude).toFixed(7));
  const resolvedLongitude = Number(Number(coordinates[0] ?? longitude).toFixed(7));
  const textBarangay = findTayabasBarangayFromText(normalized.barangay || properties.label || "");
  const nearestBarangay = textBarangay ? "" : await getNearestBarangayFromCoordinates(resolvedLatitude, resolvedLongitude);
  const barangay = getFallbackBarangay(textBarangay || nearestBarangay || normalized.barangay || properties.label);
  const streetAddress = normalized.streetAddress || formatCoordinateAddress(resolvedLatitude, resolvedLongitude);
  return {
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
    barangay,
    streetAddress,
    locationLabel: properties.label || formatLocation(barangay, streetAddress),
    mapUrl: buildMapPreviewUrl(resolvedLatitude, resolvedLongitude),
    source: "device",
  };
}
async function geocodeAddressLocation(barangay, streetAddress) {
  if (!OPENROUTESERVICE_API_KEY) {
    return null;
  }
  const query = buildTayabasLocationQuery(barangay, streetAddress);
  if (!query) {
    return null;
  }
  const response = await fetch(
    `${OPENROUTESERVICE_SEARCH_URL}?text=${encodeURIComponent(query)}&boundary.country=PH&focus.point.lon=${encodeURIComponent(TAYABAS_CITY_CENTER.longitude)}&focus.point.lat=${encodeURIComponent(TAYABAS_CITY_CENTER.latitude)}&size=1&layers=address,street,locality,neighbourhood`,
    { method: "GET", headers: getOpenRouteServiceHeaders() },
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  const feature = Array.isArray(data?.features) ? data.features[0] : null;
  if (!feature) {
    return null;
  }
  const coordinates = Array.isArray(feature.geometry?.coordinates) ? feature.geometry.coordinates : [];
  const properties = feature.properties || {};
  const normalized = normalizeGeocodedAddress({
    label: properties.label,
    neighbourhood: properties.neighbourhood,
    borough: properties.borough,
    suburb: properties.suburb,
    quarter: properties.quarter,
    locality: properties.locality,
    county: properties.county,
    house_number: properties.housenumber,
    street: properties.street,
    name: properties.name,
  }, barangay, streetAddress);
  const resolvedLatitude = Number(Number(coordinates[1]).toFixed(7));
  const resolvedLongitude = Number(Number(coordinates[0]).toFixed(7));
  if (!Number.isFinite(resolvedLatitude) || !Number.isFinite(resolvedLongitude)) {
    return null;
  }
  return {
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
    barangay: getFallbackBarangay(normalized.barangay || properties.label || barangay),
    streetAddress: normalized.streetAddress || streetAddress,
    locationLabel: properties.label || normalized.locationLabel || query,
    mapUrl: buildMapPreviewUrl(resolvedLatitude, resolvedLongitude),
    source: "address",
  };
}
async function resolveLocationCoordinates(barangay, streetAddress, preferCurrentLocation = false) {
  const addressResult = await geocodeAddressLocation(barangay, streetAddress);
  if (preferCurrentLocation) {
    const browserCoordinates = await getCurrentCoordinates();
    if (browserCoordinates) {
      const reverseResult = await reverseGeocodeCoordinates(browserCoordinates.latitude, browserCoordinates.longitude, barangay, streetAddress);
      if (reverseResult && addressResult) {
        const deviationKm = haversineDistanceKm(reverseResult.latitude, reverseResult.longitude, addressResult.latitude, addressResult.longitude);
        if (deviationKm != null && deviationKm > 1.2 && browserCoordinates.accuracy > 60) {
          return {
            ...reverseResult,
            source: "device",
            warning: `Device location differed from the entered address by ${deviationKm.toFixed(1)} km, so the shared location was used and the address fields were auto-filled from that pin.`,
            accuracy: browserCoordinates.accuracy,
          };
        }
      }
      if (reverseResult) {
        return {
          ...reverseResult,
          accuracy: browserCoordinates.accuracy,
        };
      }
      if (addressResult) {
        return {
          ...addressResult,
          source: "address",
          warning: "Browser geolocation was not precise enough, so the address-based map point was used instead.",
          accuracy: browserCoordinates.accuracy,
        };
      }
      return {
        ...buildCoordinateLocation(browserCoordinates.latitude, browserCoordinates.longitude, "", streetAddress, "device", "We captured your current location and used the coordinates as the approximate address."),
        accuracy: browserCoordinates.accuracy,
      };
    }
  }
  return addressResult;
}
function getWorkerPhoto(worker) {
  return worker?.profilePhotoPreview || worker?.verificationSubmission?.primaryIdPreview || "";
}
function getHouseholdPhoto(household) {
  return household?.profilePhotoPreview || "";
}
function getDisplayRating(ratingCount, averageRating) {
  if (!ratingCount || averageRating == null) {
    return "No ratings yet";
  }
  return `${Number(averageRating).toFixed(2)} / 5`;
}
function normalizeReview(review) {
  return {
    id: review.id || `review-${Date.now()}`,
    authorRole: review.authorRole,
    authorName: review.authorName || "User",
    targetName: review.targetName || "User",
    rating: review.rating ?? null,
    feedback: review.feedback || "",
    jobTitle: review.jobTitle || "",
    createdAt: review.createdAt || new Date().toLocaleString("en-PH"),
  };
}
function capitalizeVerificationStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "verified") {
    return "Approved";
  }
  if (normalized === "rejected") {
    return "Rejected";
  }
  if (normalized === "pending") {
    return "Pending";
  }
  return "Under Review";
}
function getWorkerVerificationLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "verified") {
    return "Verified";
  }
  if (normalized === "rejected") {
    return "Rejected";
  }
  if (normalized === "pending" || normalized === "under review") {
    return "Under Review";
  }
  return "Not Yet Verified";
}
function normalizeVerificationRequest(request) {
  if (!request) {
    return null;
  }
  const source = request.verification_request || request;
  const workerId = source.worker ?? source.workerId ?? source.worker_id ?? null;
  const workerUsername = source.worker_username || source.workerUsername || "";
  return {
    id: source.id,
    workerId,
    workerUsername,
    workerName: source.worker_name || source.workerName || workerUsername || "Worker",
    primaryIdName: source.primary_id_name || source.primaryIdName || "",
    secondaryDocName: source.secondary_doc_name || source.secondaryDocName || "",
    primaryIdPreview: source.primary_id_preview || source.primaryIdPreview || "",
    secondaryDocPreview: source.secondary_doc_preview || source.secondaryDocPreview || "",
    notes: source.notes || "",
    status: capitalizeVerificationStatus(source.status),
    submittedAt: source.submitted_at || source.submittedAt || "",
    reviewedAt: source.reviewed_at || source.reviewedAt || "",
    reviewedBy: source.reviewed_by || source.reviewedBy || "",
    reviewNote: source.review_note || source.reviewNote || "",
  };
}
function normalizeBackendWorker(currentUser) {
  if (!currentUser || currentUser.role !== "worker" || !currentUser.profile) {
    return null;
  }
  const profile = currentUser.profile;
  const locationParts = parseLocationLabel(profile.location_label);
  return {
    id: currentUser.id || currentUser.username,
    username: currentUser.username,
    firstName: currentUser.first_name || currentUser.firstName || "",
    lastName: currentUser.last_name || currentUser.lastName || "",
    email: currentUser.email || "",
    phone: profile.phone || currentUser.phone || "",
    barangay: currentUser.barangay || locationParts.barangay || "",
    streetAddress: currentUser.streetAddress || locationParts.streetAddress || "",
    bio: profile.bio || currentUser.bio || "",
    hourlyRate: profile.hourly_rate || currentUser.hourlyRate || "0.00",
    dailyRate: profile.daily_rate || currentUser.dailyRate || "0.00",
    yearsExperience: profile.years_experience ?? currentUser.yearsExperience ?? "0",
    skills: profile.skills || currentUser.skills || [],
    verification: profile.verification_status === "verified" ? "Verified" : profile.verification_status === "pending" ? "Under Review" : profile.verification_status === "rejected" ? "Rejected" : "Not Yet Verified",
    rating: profile.display_rating || "No ratings yet",
    reviewsDone: profile.rating_count || 0,
    status: "Available",
    distanceKm: "0.00",
    latitude: profile.latitude ?? currentUser.latitude ?? null,
    longitude: profile.longitude ?? currentUser.longitude ?? null,
    avatar: (currentUser.displayName || currentUser.username || "W").slice(0, 1).toUpperCase(),
    receivedReviews: [],
    givenFeedback: [],
    verificationNotifications: [],
    applicationNotifications: [],
    verificationRequestId: profile.verification_request?.id || null,
    verificationSubmission: normalizeVerificationRequest(profile.verification_request),
  };
}
function normalizeBackendWorkerPayload(payload) {
  if (!payload) {
    return null;
  }
  const userPart = payload.user || payload;
  const profilePart = payload.profile || payload.worker_profile || null;
  return normalizeBackendWorker({
    id: userPart.id || userPart.user_id || userPart.username,
    role: profilePart?.role || userPart.role || "worker",
    username: userPart.username || "",
    email: userPart.email || "",
    first_name: userPart.first_name || "",
    last_name: userPart.last_name || "",
    displayName: userPart.display_name || userPart.full_name || userPart.username || "",
    profile: profilePart,
    is_staff: Boolean(userPart.is_staff),
  });
}
function normalizeProfileRecord(profile) {
  if (!profile) {
    return null;
  }
  const { firstName, lastName, displayName } = splitFullName(profile.full_name, profile.username);
  const locationParts = parseLocationLabel(profile.location_label);
  return {
    id: profile.user_id || profile.userId || profile.user || profile.id || profile.username,
    profileId: profile.id || null,
    username: profile.username || "",
    firstName,
    lastName,
    displayName,
    email: profile.email || "",
    phone: profile.phone || "",
    barangay: locationParts.barangay,
    streetAddress: locationParts.streetAddress,
    bio: profile.bio || "",
    skills: profile.skills || [],
    hourlyRate: profile.hourly_rate || "0.00",
    dailyRate: profile.daily_rate || "0.00",
    yearsExperience: profile.years_experience ?? "0",
    verification: getWorkerVerificationLabel(profile.verification_status),
    rating: profile.display_rating || "No ratings yet",
    reviewsDone: profile.rating_count || 0,
    latitude: profile.latitude,
    longitude: profile.longitude,
    role: profile.role || profile.user_type || "worker",
  };
}
function getApiErrorMessage(data, fallback) {
  if (!data) {
    return fallback;
  }
  if (typeof data === "string") {
    return data || fallback;
  }
  if (data.detail) {
    return data.detail;
  }
  const fieldError = Object.values(data)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .find(Boolean);
  if (fieldError) {
    return String(fieldError);
  }
  return fallback;
}
function isJobOpenForApplications(job) {
  return job?.status === "Open" && getHiredWorkerCount(job) < getWorkersNeeded(job);
}
function normalizeJobRecord(job) {
  if (job?.status === "Found a worker" || job?.status === "Already found a worker" || job?.cancellationReason === "Worker hired") {
    return { ...job, status: "Already found a worker", cancellationReason: "" };
  }
  return job;
}
function normalizeJobStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "assigned" || normalized === "found a worker" || normalized === "already found a worker") {
    return "Already found a worker";
  }
  if (normalized === "completed") {
    return "Completed";
  }
  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }
  return "Open";
}
function normalizeJobApplicationStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "hired") {
    return "Hired";
  }
  if (normalized === "rejected") {
    return "Rejected";
  }
  if (normalized === "closed") {
    return "Closed";
  }
  return "Pending";
}
function normalizeBackendApplication(application) {
  if (!application) {
    return null;
  }
  return {
    id: application.id,
    workerId: application.worker ?? application.worker_id ?? null,
    workerUsername: application.worker_username || application.workerUsername || "",
    workerName: application.worker_name || application.workerName || application.worker_username || "Worker",
    status: normalizeJobApplicationStatus(application.status),
    appliedAt: application.applied_at || application.appliedAt || "",
    updatedAt: application.updated_at || application.updatedAt || "",
    note: application.note || "",
  };
}
function normalizeBackendJob(job) {
  if (!job) {
    return null;
  }
  const applications = (job.applications || []).map(normalizeBackendApplication).filter(Boolean);
  const hiredApplications = applications.filter((application) => application.status === "Hired");
  const parsedLocation = parseLocationLabel(job.location_label || job.locationLabel || job.barangay || "");
  return normalizeJobRecord({
    id: job.id,
    householdUsername: job.household_username || job.householdUsername || "",
    householdName: job.household_name || job.householdName || job.household_username || "Household",
    jobTitle: job.title || job.job_title || job.required_skill || job.jobType || "",
    serviceType: job.required_skill || job.job_type || job.jobType || job.title || "",
    scheduleType: job.schedule || "One - Time",
    preferredDate: job.preferred_date || "",
    preferredTime: job.preferred_time || "",
    description: job.description || "",
    barangay: parsedLocation.barangay || job.barangay || "",
    streetAddress: job.street_address || parsedLocation.streetAddress || "",
    latitude: job.latitude ?? job.job_latitude ?? null,
    longitude: job.longitude ?? job.job_longitude ?? null,
    offeredRate: String(job.service_rate ?? "0.00"),
    rateType: "Per Day",
    workersNeeded: Number(job.worker_slots || 1),
    status: normalizeJobStatus(job.status),
    matchedWorkerIds: hiredApplications.map((application) => application.workerId).filter(Boolean),
    selectedWorkerId: hiredApplications[0]?.workerId || null,
    selectedWorkerName: hiredApplications[0]?.workerName || "",
    hiredAt: hiredApplications[0]?.appliedAt || "",
    applications,
    createdAt: job.created_at || job.createdAt || new Date().toISOString(),
  });
}
function normalizeBackendNotification(notification) {
  if (!notification) {
    return null;
  }
  return {
    id: `backend-notification-${notification.id}`,
    backendId: notification.id,
    notificationType: notification.notification_type || notification.notificationType || "analytics",
    title: notification.title || "Notification",
    message: notification.message || "",
    date: notification.created_at || notification.createdAt || "Recently",
    unread: !notification.is_read,
  };
}
function normalizeBackendReview(review) {
  if (!review) {
    return null;
  }
  return normalizeReview({
    id: review.id,
    authorRole: review.author_role || review.authorRole || "",
    authorName: review.author_name || review.authorName || review.author_username || "User",
    targetName: review.target_name || review.targetName || review.target_username || "User",
    rating: review.rating ?? null,
    feedback: review.feedback || "",
    jobTitle: review.job_title || review.jobTitle || "",
    createdAt: review.created_at || review.createdAt || new Date().toLocaleString("en-PH"),
  });
}
function dedupeNotifications(notifications) {
  const seenKeys = new Set();
  return notifications.filter((notification) => {
    const key = notification.backendId || `${notification.notificationType || "generic"}-${notification.title}-${notification.message}`;
    if (seenKeys.has(key)) {
      return false;
    }
    seenKeys.add(key);
    return true;
  });
}
function isNumericIdentifier(value) {
  if (value == null || value === "") {
    return false;
  }
  return /^\d+$/.test(String(value));
}
function findJobApplicationForWorker(job, worker) {
  if (!job || !worker) {
    return null;
  }
  return (job.applications || []).find((application) => {
    const matchesWorkerId = application.workerId != null && String(application.workerId) === String(worker.id);
    const matchesWorkerUsername = application.workerUsername && worker.username && application.workerUsername === worker.username;
    return matchesWorkerId || matchesWorkerUsername;
  }) || null;
}
function getJobStatusBadgeClass(status) {
  if (status === "Cancelled") {
    return "gg-status-badge gg-status-cancelled";
  }
  if (status === "Already found a worker") {
    return "gg-status-badge gg-status-filled";
  }
  return "gg-status-badge gg-status-open";
}
function getWorkersNeeded(job) {
  const workersNeeded = Number(job?.workersNeeded || job?.workerSlots || 1);
  return Number.isFinite(workersNeeded) && workersNeeded > 0 ? workersNeeded : 1;
}
function getHiredWorkerCount(job) {
  return (job?.applications || []).filter((application) => application.status === "Hired").length;
}
function getPendingApplicationCount(job) {
  return (job?.applications || []).filter((application) => application.status === "Pending").length;
}
function getHiringProgressLabel(job) {
  return `${getHiredWorkerCount(job)}/${getWorkersNeeded(job)}`;
}
function sanitizePhilippinesPhone(value) {
  return String(value || "").replace(/[^0-9]/g, "").replace(/^0+/, "").slice(0, 10);
}
function renderBarangayOptions() {
  return BARANGAYS.map((barangay) => /* @__PURE__ */ React.createElement("option", { key: barangay, value: barangay }, "       ", barangay, "     "));
}
function buildMatchedWorkersForJob(job, workers) {
  const applicantIds = (job.applications || []).filter((application) => application.status !== "Rejected").map((application) => application.workerId);
  const matchedWorkerIds = [...new Set([...(job.matchedWorkerIds || []), ...applicantIds])];
  return matchedWorkerIds.map((workerId) => workers.find((worker) => String(worker.id) === String(workerId))).filter(Boolean);
}
function buildWorkerFallbackFromJob(job, selectedWorkerId) {
  if (!job || selectedWorkerId == null) {
    return null;
  }
  const application = (job.applications || []).find((item) => String(item.workerId) === String(selectedWorkerId));
  if (!application) {
    return null;
  }
  return {
    id: application.workerId ?? selectedWorkerId,
    username: application.workerUsername || `worker-${selectedWorkerId}`,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    barangay: "",
    streetAddress: "",
    bio: "",
    hourlyRate: "0.00",
    dailyRate: "0.00",
    yearsExperience: "0",
    skills: [],
    verification: "Not Yet Verified",
    rating: "No ratings yet",
    reviewsDone: 0,
    status: application.status === "Hired" ? "Hired" : "Available",
    distanceKm: "0.00",
    avatar: (application.workerName || application.workerUsername || "W").slice(0, 1).toUpperCase(),
    receivedReviews: [],
    givenFeedback: [],
    verificationNotifications: [],
    applicationNotifications: [],
  };
}
function getWorkerJobMatches(worker, jobs) {
  if (!worker) {
    return [];
  }
  const workerSkills = worker.skills || [];
  return jobs.filter(isJobOpenForApplications).map((job) => {
    const matchesSkill = workerSkills.includes(job.serviceType);
    return { ...job, matchesSkill };
  }).sort((firstJob, secondJob) => {
    if (firstJob.matchesSkill === secondJob.matchesSkill) {
      return new Date(secondJob.createdAt).getTime() - new Date(firstJob.createdAt).getTime();
    }
    return firstJob.matchesSkill ? -1 : 1;
  });
}
function createJobRecord(jobForm, currentHousehold, jobId) {
  return { id: jobId, householdUsername: currentHousehold?.username || "", householdName: getDisplayName(currentHousehold?.firstName, currentHousehold?.lastName, currentHousehold?.username), jobTitle: jobForm.jobTitle.trim() || jobForm.serviceType, serviceType: jobForm.serviceType, scheduleType: jobForm.scheduleType, preferredDate: jobForm.preferredDate, preferredTime: jobForm.preferredTime, description: jobForm.description.trim(), barangay: jobForm.barangay.trim(), streetAddress: jobForm.streetAddress.trim(), latitude: jobForm.latitude ?? null, longitude: jobForm.longitude ?? null, offeredRate: String(jobForm.offeredRate), rateType: jobForm.rateType, workersNeeded: getWorkersNeeded(jobForm), status: "Open", matchedWorkerIds: [], applications: [], createdAt: (/* @__PURE__ */ new Date()).toISOString() };
}
function getDemoCreatedAt(monthOffset, day = 8) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthOffset);
  date.setDate(day);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}
function createDemoJobPostings() {
  const location = (index) => {
    const [barangay, latitude, longitude] = DEMO_LOCATIONS[index - 1];
    return { barangay, streetAddress: `Demo Street ${index}`, latitude, longitude };
  };
  return [
    { id: "demo-job-1", householdUsername: "Household 1", householdName: "Household One", jobTitle: "House Cleaning Help", serviceType: "House Cleaning", scheduleType: "One-Time", preferredDate: "2026-05-18", preferredTime: "09:00", description: "General house cleaning for a small family home.", ...location(1), offeredRate: "700.00", rateType: "Per Day", workersNeeded: "1", status: "Open", matchedWorkerIds: ["demo-worker-1", "demo-worker-5"], applications: [{ id: "demo-app-1", workerId: "demo-worker-1", workerUsername: "Worker1", workerName: "Worker One", status: "Pending", appliedAt: "Recently" }], createdAt: getDemoCreatedAt(0, 3) },
    { id: "demo-job-2", householdUsername: "Household 2", householdName: "Household Two", jobTitle: "Kitchen Plumbing Repair", serviceType: "Plumbing", scheduleType: "One-Time", preferredDate: "2026-05-20", preferredTime: "13:00", description: "Fix leaking kitchen sink.", ...location(2), offeredRate: "950.00", rateType: "Fixed Rate", workersNeeded: "1", status: "Completed", matchedWorkerIds: ["demo-worker-2"], applications: [{ id: "demo-app-2", workerId: "demo-worker-2", workerUsername: "Worker2", workerName: "Worker Two", status: "Completed", appliedAt: "Recently" }], createdAt: getDemoCreatedAt(1, 5) },
    { id: "demo-job-3", householdUsername: "Household 3", householdName: "Household Three", jobTitle: "Electrical Outlet Check", serviceType: "Electrical Work", scheduleType: "One-Time", preferredDate: "2026-04-12", preferredTime: "10:00", description: "Inspect and repair two electrical outlets.", ...location(3), offeredRate: "1200.00", rateType: "Fixed Rate", workersNeeded: "1", status: "Completed", matchedWorkerIds: ["demo-worker-3"], applications: [{ id: "demo-app-3", workerId: "demo-worker-3", workerUsername: "Worker3", workerName: "Worker Three", status: "Completed", appliedAt: "Recently" }], createdAt: getDemoCreatedAt(2, 9) },
    { id: "demo-job-4", householdUsername: "Household 4", householdName: "Household Four", jobTitle: "Laundry Assistance", serviceType: "Laundry", scheduleType: "Part-Time", preferredDate: "2026-03-22", preferredTime: "08:00", description: "Weekly laundry help.", ...location(4), offeredRate: "500.00", rateType: "Per Day", workersNeeded: "1", status: "Cancelled", matchedWorkerIds: ["demo-worker-5"], applications: [], createdAt: getDemoCreatedAt(3, 12) },
    { id: "demo-job-5", householdUsername: "Household 5", householdName: "Household Five", jobTitle: "Childcare Support", serviceType: "Childcare", scheduleType: "Part-Time", preferredDate: "2026-02-15", preferredTime: "14:00", description: "Afternoon childcare support.", ...location(5), offeredRate: "750.00", rateType: "Per Day", workersNeeded: "1", status: "Open", matchedWorkerIds: ["demo-worker-4"], applications: [{ id: "demo-app-5", workerId: "demo-worker-4", workerUsername: "Worker4", workerName: "Worker Four", status: "Pending", appliedAt: "Recently" }], createdAt: getDemoCreatedAt(4, 15) },
    { id: "demo-job-6", householdUsername: "Household 1", householdName: "Household One", jobTitle: "Cooking Support", serviceType: "Cooking", scheduleType: "One-Time", preferredDate: "2026-01-28", preferredTime: "16:00", description: "Meal preparation for family gathering.", ...location(1), offeredRate: "650.00", rateType: "Per Day", workersNeeded: "1", status: "Completed", matchedWorkerIds: ["demo-worker-5"], applications: [{ id: "demo-app-6", workerId: "demo-worker-5", workerUsername: "Worker5", workerName: "Worker Five", status: "Completed", appliedAt: "Recently" }], createdAt: getDemoCreatedAt(5, 18) },
  ];
}
function getWorkerReviewSummary(worker) {
  const reviews = worker?.receivedReviews || [];
  const ratedReviews = reviews.filter((review) => review.rating != null);
  const total = ratedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return { reviews, averageRating: ratedReviews.length ? total / ratedReviews.length : null, ratingCount: ratedReviews.length };
}
function getHouseholdReviewSummary(household) {
  return { reviews: household?.receivedFeedback || [] };
}
function getHouseholdNotifications(jobs, workers) {
  return jobs.flatMap((job) => (job.applications || []).map((application) => {
    const worker = workers.find((item) => item.id === application.workerId);
    return { id: `application-${job.id}-${application.workerId}-${application.appliedAt}`, title: "New worker application", message: `${getDisplayName(worker?.firstName, worker?.lastName, worker?.username)} applied to "${job.jobTitle || job.serviceType}".`, date: application.appliedAt || "Recently", workerId: application.workerId, jobId: job.id };
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
function getVerificationNotifications(requests, workers) {
  return requests.map((request) => {
    const worker = workers.find((item) => item.id === request.workerId);
    return { id: `verification-${request.id}`, title: `Verification ${request.status}`, message: `${getDisplayName(worker?.firstName, worker?.lastName, worker?.username)}'s documents are ${request.status.toLowerCase()}.`, date: request.submittedAt || request.reviewedAt || "Recently" };
  }).sort((a, b) => (STATUS_PRIORITY[a.title.split(" ").pop()] || 0) - (STATUS_PRIORITY[b.title.split(" ").pop()] || 0));
}
function buildTayabasLatLngBounds(L) {
  return L.latLngBounds(
    [TAYABAS_MAP_BOUNDS.south, TAYABAS_MAP_BOUNDS.west],
    [TAYABAS_MAP_BOUNDS.north, TAYABAS_MAP_BOUNDS.east],
  );
}
function isWithinTayabasBounds(latitude, longitude) {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  return Number.isFinite(numericLatitude)
    && Number.isFinite(numericLongitude)
    && numericLatitude >= TAYABAS_MAP_BOUNDS.south
    && numericLatitude <= TAYABAS_MAP_BOUNDS.north
    && numericLongitude >= TAYABAS_MAP_BOUNDS.west
    && numericLongitude <= TAYABAS_MAP_BOUNDS.east;
}
function clampToTayabasBounds(latitude, longitude) {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  return {
    latitude: Math.min(Math.max(Number.isFinite(numericLatitude) ? numericLatitude : TAYABAS_CITY_CENTER.latitude, TAYABAS_MAP_BOUNDS.south), TAYABAS_MAP_BOUNDS.north),
    longitude: Math.min(Math.max(Number.isFinite(numericLongitude) ? numericLongitude : TAYABAS_CITY_CENTER.longitude, TAYABAS_MAP_BOUNDS.west), TAYABAS_MAP_BOUNDS.east),
  };
}
function getHeatMapColor(value, maxValue) {
  if (!value) {
    return "#c8d3e8";
  }
  const intensity = maxValue ? value / maxValue : 0;
  if (intensity >= 0.75) {
    return "#dc3545";
  }
  if (intensity >= 0.5) {
    return "#fd7e14";
  }
  if (intensity >= 0.25) {
    return "#ffc107";
  }
  return "#20c997";
}
function SuperAdminHeatMap({ data, metricLabel }) {
  const mapNodeRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapViewRef = useRef({ center: [PHILIPPINES_MAP_CENTER.latitude, PHILIPPINES_MAP_CENTER.longitude], zoom: 6, touched: false });
  const [mapStatus, setMapStatus] = useState("loading");
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const rankedData = useMemo(() => [...data].filter((item) => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 5), [data]);

  useEffect(() => {
    let cancelled = false;
    async function renderMap() {
      if (!mapNodeRef.current) {
        return;
      }
      setMapStatus("loading");
      try {
        const L = await loadLeafletAssets();
        if (cancelled || !L) {
          return;
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        const map = L.map(mapNodeRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          tap: false,
        }).setView(mapViewRef.current.center, mapViewRef.current.zoom);
        mapInstanceRef.current = map;
        map.dragging.enable();
        map.touchZoom.enable();
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        const heatPoints = [];
        data.forEach((item) => {
          const color = getHeatMapColor(item.value, maxValue);
          const radius = item.value > 0 ? 350 + (item.value / maxValue) * 1400 : 180;
          const point = [item.latitude, item.longitude];
          if (item.value > 0) {
            heatPoints.push(point);
          }
          L.circle(point, {
            radius,
            color,
            fillColor: color,
            fillOpacity: item.value > 0 ? 0.42 : 0.12,
            weight: item.value > 0 ? 2 : 1,
          }).addTo(map).bindPopup(`
            <strong>${item.barangay}</strong><br />
            ${metricLabel}: ${item.value}<br />
            Jobs: ${item.jobs}<br />
            Workers: ${item.workers}<br />
            Pending verifications: ${item.pendingVerifications}
          `);
        });
        if (!mapViewRef.current.touched && heatPoints.length > 0) {
          map.fitBounds(L.latLngBounds(heatPoints).pad(0.28));
        }
        map.on("moveend zoomend", () => {
          const center = map.getCenter();
          mapViewRef.current = { center: [center.lat, center.lng], zoom: map.getZoom(), touched: true };
        });
        setMapStatus("ready");
      } catch (error) {
        if (!cancelled) {
          setMapStatus("fallback");
        }
      }
    }
    renderMap();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data, maxValue, metricLabel]);

  return (
    <div className="analytics-heatmap-layout">
      <div className="analytics-heatmap-map" ref={mapNodeRef}>
        {mapStatus !== "ready" && (
          <div className="analytics-heatmap-fallback">
            {mapStatus === "fallback" ? "Map tiles unavailable. Showing barangay ranking beside the map." : "Loading heat map..."}
          </div>
        )}
      </div>
      <div className="analytics-heatmap-side">
        <div className="analytics-heatmap-legend">
          <span><i className="heat-low" /> Low</span>
          <span><i className="heat-mid" /> Medium</span>
          <span><i className="heat-high" /> High</span>
        </div>
        <div className="analytics-heatmap-ranking">
          {rankedData.length > 0 ? rankedData.map((item) => (
            <div className="analytics-heatmap-rank" key={item.barangay}>
              <span>{item.barangay}</span>
              <strong>{item.value}</strong>
            </div>
          )) : (
            <p className="small text-muted mb-0">No barangay data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
function App() {
  ensureDemoVersion();
  const [dashboardMetrics, setDashboardMetrics] = useState({ openJobs: 0, verifiedWorkers: 0, completedJobs: 0, totalAccounts: 0, avgRating: null });
  const [view, setView] = useState("home");
  const [loginForm, setLoginForm] = useState({ username: "", password: "", role: "worker" });
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email");
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: "", token: "", newPassword: "", confirmPassword: "" });
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [registeredWorkers, setRegisteredWorkers] = useState(() => mergeDemoRecords(getStoredCollection(STORAGE_KEYS.workers, []), DEMO_WORKER_ACCOUNTS));
  const [registeredHouseholds, setRegisteredHouseholds] = useState(() => mergeDemoRecords(getStoredCollection(STORAGE_KEYS.households, []), DEMO_HOUSEHOLD_ACCOUNTS));
  const [verificationRequests, setVerificationRequests] = useState(() => mergeDemoRecords(getStoredCollection(STORAGE_KEYS.verificationRequests, []), DEMO_VERIFICATION_REQUESTS, "id"));
  const [postedJobs, setPostedJobs] = useState(() => mergeDemoRecords(getStoredCollection(STORAGE_KEYS.jobs, []).map(normalizeJobRecord), createDemoJobPostings(), "id"));
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
  const [householdProfileForm, setHouseholdProfileForm] = useState({ firstName: "", lastName: "", username: "", email: "", phone: "", barangay: "", streetAddress: "", profilePhotoName: "", profilePhotoPreview: "" });
  const [householdJobForm, setHouseholdJobForm] = useState({ jobTitle: "", serviceType: "", scheduleType: "One - Time", preferredDate: "", preferredTime: "", description: "", barangay: "", streetAddress: "", offeredRate: "0.00", rateType: "Per Day", workersNeeded: "1" });
  const [workerProfileForm, setWorkerProfileForm] = useState({ firstName: "", lastName: "", username: "", email: "", phone: "", barangay: "", streetAddress: "", bio: "", hourlyRate: "0.00", dailyRate: "0.00", yearsExperience: "0", skills: [], availability: true, profilePhotoPreview: "" });
  const [verificationForm, setVerificationForm] = useState({ primaryIdName: "", secondaryDocName: "", notes: "", primaryIdPreview: "", secondaryDocPreview: "" });
  const [householdReviewForm, setHouseholdReviewForm] = useState(EMPTY_HOUSEHOLD_REVIEW_FORM);
  const [workerFeedbackForm, setWorkerFeedbackForm] = useState(EMPTY_WORKER_FEEDBACK_FORM);
  const [adminLoginForm, setAdminLoginForm] = useState({ username: "", password: "" });
  const [matchedWorkersByJob, setMatchedWorkersByJob] = useState({});
  const [householdJobCoordinates, setHouseholdJobCoordinates] = useState(null);
  const [householdJobLocationPreview, setHouseholdJobLocationPreview] = useState(null);
  const [householdJobMapMode, setHouseholdJobMapMode] = useState("preview");
  const householdJobMapRef = useRef(null);
  const householdJobMapViewRef = useRef({ center: [PHILIPPINES_MAP_CENTER.latitude, PHILIPPINES_MAP_CENTER.longitude], zoom: 6, touched: false });
  const householdJobMapContainerIdRef = useRef(`household-job-map-${Math.random().toString(36).slice(2)}`);
  const householdJobBarangaySyncRef = useRef(0);
  useEffect(() => {
    setRegisteredWorkers((prev) => mergeDemoRecords(prev, DEMO_WORKER_ACCOUNTS));
    setRegisteredHouseholds((prev) => mergeDemoRecords(prev, DEMO_HOUSEHOLD_ACCOUNTS));
    setVerificationRequests((prev) => mergeDemoRecords(prev, DEMO_VERIFICATION_REQUESTS, "id"));
    setPostedJobs((prev) => mergeDemoRecords(prev.map(normalizeJobRecord), createDemoJobPostings(), "id"));
  }, []);
  const backendCurrentWorker = normalizeBackendWorker(currentUser);
  const localCurrentWorker = registeredWorkers.find((item) => item.username === currentUser?.username) || null;
  const currentWorkerRequestFromProfile = normalizeVerificationRequest(currentUser?.profile?.verification_request);
  const currentWorkerVerificationRequest = verificationRequests.find((item) => item.workerUsername === currentUser?.username) || currentWorkerRequestFromProfile || localCurrentWorker?.verificationSubmission || backendCurrentWorker?.verificationSubmission || null;
  const currentWorkerVerificationLabel = currentWorkerVerificationRequest?.status ? getWorkerVerificationLabel(currentWorkerVerificationRequest.status) : getWorkerVerificationLabel(currentUser?.profile?.verification_status || backendCurrentWorker?.verification || localCurrentWorker?.verification);
  const currentWorkerBase = backendCurrentWorker ? {
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
    receivedReviews: backendCurrentWorker.receivedReviews || localCurrentWorker?.receivedReviews || [],
    givenFeedback: backendCurrentWorker.givenFeedback || localCurrentWorker?.givenFeedback || [],
  } : localCurrentWorker || null;
  const currentWorker = currentWorkerBase ? {
    ...currentWorkerBase,
    verification: currentWorkerVerificationLabel,
    verificationSubmission: currentWorkerVerificationRequest,
  } : null;
  const currentHousehold = registeredHouseholds.find((item) => item.username === currentUser?.username);
  const householdJobs = postedJobs.filter((item) => item.householdUsername === currentUser?.username);
  const selectedJob = householdJobs.find((item) => item.id === selectedJobId) || householdJobs[0] || postedJobs[0] || null;
  const selectedMatchedWorkers = selectedJob ? matchedWorkersByJob[selectedJob.id] || buildMatchedWorkersForJob(selectedJob, registeredWorkers) : [];
  const matchedSelectedWorker = selectedMatchedWorkers.find((worker) => String(worker.id) === String(selectedWorkerId)) || selectedMatchedWorkers.find((worker) => {
    const matchingApplication = (selectedJob?.applications || []).find((application) => String(application.workerId) === String(selectedWorkerId));
    return matchingApplication && worker.username === matchingApplication.workerUsername;
  }) || null;
  const registeredSelectedWorker = registeredWorkers.find((worker) => String(worker.id) === String(selectedWorkerId)) || registeredWorkers.find((worker) => {
    const matchingApplication = (selectedJob?.applications || []).find((application) => String(application.workerId) === String(selectedWorkerId));
    return matchingApplication && worker.username === matchingApplication.workerUsername;
  }) || null;
  const selectedWorker = matchedSelectedWorker ? { ...registeredSelectedWorker, ...matchedSelectedWorker } : registeredSelectedWorker || buildWorkerFallbackFromJob(selectedJob, selectedWorkerId);
  const selectedWorkerPhoto = getWorkerPhoto(selectedWorker);
  const selectedVerificationRequest = verificationRequests.find((item) => item.id === selectedVerificationRequestId) || verificationRequests[0] || null;
  const workerVisibleJobs = getWorkerJobMatches(currentWorker, postedJobs);
  const workerMatchedJobs = workerVisibleJobs.filter((job) => job.matchesSkill);
  const workerMiniPhoto = getWorkerPhoto(currentWorker);
  const householdNotifications = dedupeNotifications([
    ...getHouseholdNotifications(householdJobs, registeredWorkers),
    ...backendNotifications.filter((item) => item.notificationType === "application"),
  ]);
  const verificationNotifications = getVerificationNotifications(verificationRequests, registeredWorkers);
  const workerNotifications = dedupeNotifications([
    ...backendNotifications.filter((item) => item.notificationType !== "application"),
    ...(currentWorker?.verificationNotifications || []),
    ...(currentWorker?.applicationNotifications || []),
  ]);
  const householdNotificationsWithReadState = householdNotifications.map((item) => ({ ...item, unread: item.unread !== false && !notificationReads[item.id] }));
  const workerNotificationsWithReadState = workerNotifications.map((item) => ({ ...item, unread: item.unread !== false && !notificationReads[item.id] }));
  const workerApplications = currentWorker ? postedJobs.flatMap((job) => (job.applications || []).filter((application) => String(application.workerId) === String(currentWorker.id) || application.workerUsername === currentWorker.username).map((application) => ({ ...job, appliedAt: application.appliedAt, applicationStatus: application.status, applicationId: application.id }))) : [];
  const selectedWorkerJob = selectedJobId == null ? null : postedJobs.find((item) => String(item.id) === String(selectedJobId));
  const currentWorkerJobDetail = workerVisibleJobs.find((item) => String(item.id) === String(selectedJobId)) || selectedWorkerJob || workerVisibleJobs[0] || null;
  const currentWorkerJobHousehold = currentWorkerJobDetail ? registeredHouseholds.find((item) => item.username === currentWorkerJobDetail.householdUsername) : null;
  const adminVisibleWorkers = registeredWorkers.filter((worker) => Boolean(worker.verificationSubmission));
  const pendingVerificationRequests = verificationRequests.filter((item) => item.status === "Pending" || item.status === "Under Review");
  const approvedVerificationRequests = verificationRequests.filter((item) => item.status === "Approved");
  const rejectedVerificationRequests = verificationRequests.filter((item) => item.status === "Rejected");
  const householdUnreadCount = householdNotificationsWithReadState.filter((item) => item.unread).length;
  const workerUnreadCount = workerNotificationsWithReadState.filter((item) => item.unread).length;
  const workerApplicationUnreadCount = workerApplications.filter((job) => {
    const notificationId = `worker-application-${job.applicationId}`;
    return ["Hired", "Rejected"].includes(job.applicationStatus) && !notificationReads[notificationId];
  }).length;
  useEffect(() => {
    if (!currentUser?.username) {
      return;
    }
    refreshProfilesFromBackend();
  }, [currentUser?.username]);
  useEffect(() => {
    if (currentUser?.role !== "household" || !selectedJob?.id) {
      return;
    }
    refreshRecommendedWorkers(selectedJob.id);
  }, [currentUser?.role, selectedJob?.id, registeredWorkers.length]);
  useEffect(() => {
    if (currentUser?.role !== "worker" || !currentWorkerVerificationLabel) {
      return;
    }
    const normalizedProfileStatus = currentWorkerVerificationLabel === "Verified" ? "verified" : currentWorkerVerificationLabel === "Rejected" ? "rejected" : currentWorkerVerificationLabel === "Under Review" ? "pending" : "unverified";
    if (currentUser?.profile?.verification_status === normalizedProfileStatus) {
      return;
    }
    setCurrentUser((prev) => {
      if (!prev || prev.role !== "worker") {
        return prev;
      }
      return {
        ...prev,
        profile: {
          ...(prev.profile || {}),
          verification_status: normalizedProfileStatus,
          verification_request: currentWorkerVerificationRequest || prev.profile?.verification_request || null,
        },
      };
    });
  }, [currentUser?.role, currentUser?.profile?.verification_status, currentWorkerVerificationLabel, currentWorkerVerificationRequest]);
  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    async function syncVerificationState() {
      if (!currentUser?.username) {
        return;
      }
      if (!cancelled) {
        await refreshVerificationStateFromBackend();
      }
    }
    syncVerificationState();
    if (currentUser?.username) {
      intervalId = window.setInterval(syncVerificationState, currentUser.role === "worker" ? 3000 : 5000);
    }
    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    currentUser?.username,
    currentUser?.role,
    currentUser?.profile?.verification_status,
    currentUser?.profile?.verification_request?.id,
    currentUser?.profile?.verification_request?.reviewed_at,
    currentUser?.profile?.verification_request?.status,
  ]);
  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    async function syncJobs() {
      if (cancelled) {
        return;
      }
      await refreshJobsFromBackend();
    }
    syncJobs();
    intervalId = window.setInterval(syncJobs, currentUser?.username ? 5000 : 10000);
    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [currentUser?.username, currentUser?.role]);
  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    async function syncBackendActivity() {
      if (cancelled) {
        return;
      }
      if (!currentUser?.username) {
        setBackendNotifications([]);
        return;
      }
      await refreshNotificationsFromBackend();
      await refreshReviewsFromBackend();
    }
    syncBackendActivity();
    if (currentUser?.username) {
      intervalId = window.setInterval(syncBackendActivity, 5000);
    }
    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [currentUser?.username, currentUser?.role, selectedWorker?.username]);
  useEffect(() => {
    let cancelled = false;
    async function loadDashboardMetrics() {
      const authToken = getAuthToken();
      if (currentUser?.role !== "admin" || !authToken) {
        if (!cancelled) {
          setDashboardMetrics({
            openJobs: postedJobs.filter((job) => job.status === "Open").length,
            verifiedWorkers: registeredWorkers.filter((worker) => worker.verification === "Verified").length,
            completedJobs: postedJobs.filter((job) => job.status === "Completed").length,
            totalAccounts: registeredWorkers.length + registeredHouseholds.length,
            avgRating: null,
          });
        }
        return;
      }
      try {
        const response = await apiRequest("analytics/dashboard-metrics/", {
          auth: true,
          suppressUnauthorized: true,
        });
        if (!response.ok) {
          throw new Error("Failed to load dashboard metrics");
        }
        const data = await readResponseData(response);
        if (!cancelled) {
          setDashboardMetrics({ openJobs: data.open_jobs ?? 0, verifiedWorkers: data.verified_workers ?? 0, completedJobs: data.completed_jobs ?? 0, totalAccounts: data.total_accounts ?? 0, avgRating: data.avg_rating });
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardMetrics({ openJobs: postedJobs.filter((job) => job.status === "Open").length, verifiedWorkers: registeredWorkers.filter((worker) => worker.verification === "Verified").length, completedJobs: postedJobs.filter((job) => job.status === "Completed").length, totalAccounts: registeredWorkers.length + registeredHouseholds.length, avgRating: null });
        }
      }
    }
    loadDashboardMetrics();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.role, postedJobs, registeredHouseholds.length, registeredWorkers.length]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.workers, JSON.stringify(registeredWorkers));
  }, [registeredWorkers]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.households, JSON.stringify(registeredHouseholds));
  }, [registeredHouseholds]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.verificationRequests, JSON.stringify(verificationRequests));
  }, [verificationRequests]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(postedJobs));
  }, [postedJobs]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.notificationReads, JSON.stringify(notificationReads));
  }, [notificationReads]);
  useEffect(() => {
    if (verificationRequests.length === 0) {
      setSelectedVerificationRequestId(null);
      return;
    }
    if (!verificationRequests.some((item) => item.id === selectedVerificationRequestId)) {
      setSelectedVerificationRequestId(verificationRequests[0].id);
    }
  }, [verificationRequests, selectedVerificationRequestId]);
  useEffect(() => {
    if (!householdJobs.length) {
      setSelectedJobId(null);
      return;
    }
    if (!householdJobs.some((item) => item.id === selectedJobId)) {
      setSelectedJobId(householdJobs[0].id);
    }
  }, [householdJobs, selectedJobId]);
  useEffect(() => {
    if (view !== "household-post-job") {
      return;
    }
    const savedLocation = getSavedHouseholdLocation(currentHousehold, currentUser);
    if (!savedLocation.barangay && !savedLocation.streetAddress) {
      return;
    }
    setHouseholdJobForm((prev) => {
      if (prev.barangay && prev.streetAddress) {
        return prev;
      }
      return {
        ...prev,
        barangay: prev.barangay || savedLocation.barangay,
        streetAddress: prev.streetAddress || savedLocation.streetAddress,
      };
    });
  }, [view, currentHousehold?.barangay, currentHousehold?.streetAddress, currentUser?.profile?.location_label, currentUser?.profile?.locationLabel]);
  useEffect(() => {
    if (view !== "household-post-job") {
      return;
    }
    const form = document.querySelector(".profile-card form.p-3.p-md-4");
    const fieldRow = form?.querySelector(".row.g-3");
    form?.classList.add("household-job-form-shell");
    fieldRow?.classList.add("household-job-fields");
    return () => {
      form?.classList.remove("household-job-form-shell");
      fieldRow?.classList.remove("household-job-fields");
    };
  }, [view]);
  useEffect(() => {
    if (view !== "household-post-job") {
      return;
    }
    const offeredRateInput = document.querySelector('input[name="offeredRate"]');
    const offeredRateWrap = offeredRateInput?.closest(".col-md-6");
    const existingWorkersNeededInput = document.querySelector('input[name="workersNeeded"]');
    if (!offeredRateWrap || existingWorkersNeededInput) {
      return;
    }
    const fieldWrap = document.createElement("div");
    fieldWrap.className = "col-md-6";
    fieldWrap.dataset.dynamicField = "workers-needed";
    const label = document.createElement("label");
    label.className = "form-label fw-semibold";
    label.textContent = "Workers Needed";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.name = "workersNeeded";
    input.className = "form-control";
    input.value = householdJobForm.workersNeeded || "1";
    const helpText = document.createElement("p");
    helpText.className = "form-text mb-0";
    helpText.textContent = "How many workers will be hired for this job.";
    const handleInput = (event) => {
      setHouseholdJobForm((prev) => ({ ...prev, workersNeeded: event.target.value }));
    };
    input.addEventListener("input", handleInput);
    fieldWrap.append(label, input, helpText);
    offeredRateWrap.before(fieldWrap);
    return () => {
      input.removeEventListener("input", handleInput);
      fieldWrap.remove();
    };
  }, [view]);
  useEffect(() => {
    if (view !== "household-post-job") {
      return;
    }
    const streetInput = document.querySelector('input[name="streetAddress"]');
    const streetWrap = streetInput?.closest(".col-md-6");
    if (!streetWrap || streetWrap.parentElement?.querySelector("[data-location-capture-wrap]")) {
      return;
    }
    const buttonWrap = document.createElement("div");
    buttonWrap.className = "col-12";
    buttonWrap.dataset.locationCaptureWrap = "true";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary btn-sm household-location-trigger";
    button.textContent = householdJobCoordinates?.latitude != null && householdJobCoordinates?.longitude != null ? "Location Ready" : "Use My Current Location";

    const manualButton = document.createElement("button");
    manualButton.type = "button";
    manualButton.className = `btn btn-outline-secondary btn-sm ${householdJobMapMode === "manual" ? "active" : ""}`;
    manualButton.textContent = householdJobMapMode === "manual" ? "Click the Map to Pin" : "Pin on Map Manually";

    const actions = document.createElement("div");
    actions.className = "d-flex gap-2 flex-wrap";

    const helper = document.createElement("p");
    helper.className = "form-text mb-0 household-location-helper";
    helper.textContent = householdJobMapMode === "manual" ? "Manual pin mode is active. Click on the map to place the exact job location and auto-fill the address." : householdJobCoordinates?.latitude != null && householdJobCoordinates?.longitude != null ? `Current coordinates saved for this job: ${householdJobCoordinates.latitude}, ${householdJobCoordinates.longitude}` : "Capture your current browser location or estimate from the barangay and street so smart matching can calculate worker distance correctly.";

    const handleClick = async () => {
      await captureHouseholdJobLocation();
    };
    const handleManualClick = () => {
      setHouseholdJobMapMode((prev) => prev === "manual" ? "preview" : "manual");
    };

    button.addEventListener("click", handleClick);
    manualButton.addEventListener("click", handleManualClick);
    actions.append(button, manualButton);
    buttonWrap.append(actions, helper);
    streetWrap.parentElement.append(buttonWrap);

    return () => {
      button.removeEventListener("click", handleClick);
      manualButton.removeEventListener("click", handleManualClick);
      buttonWrap.remove();
    };
  }, [view, householdJobCoordinates?.latitude, householdJobCoordinates?.longitude, householdJobMapMode]);
  useEffect(() => {
    if (view !== "household-post-job") {
      return;
    }
    const form = document.querySelector(".profile-card form.p-3.p-md-4");
    if (!form) {
      return;
    }
    const existingPanel = form.querySelector("[data-location-preview-panel]");
    if (existingPanel) {
      existingPanel.remove();
    }
    const previewWrap = document.createElement("div");
    previewWrap.className = "col-12 household-job-map-panel";
    previewWrap.dataset.locationPreviewPanel = "true";

    const card = document.createElement("div");
    card.className = "household-job-map-card";

    const heading = document.createElement("p");
    heading.className = "household-job-map-eyebrow mb-2";
    heading.textContent = householdJobLocationPreview?.source === "device" ? "Current Location Preview" : householdJobLocationPreview?.source === "address" ? "Address-based Preview" : householdJobLocationPreview?.source === "manual" ? "Manual Pin Preview" : "Philippines Map Preview";

    const title = document.createElement("h3");
    title.className = "household-job-map-title mb-2";
    title.textContent = householdJobLocationPreview?.mapUrl ? "Check the saved job pin before posting" : householdJobMapMode === "manual" ? "Manual pin mode is active" : "The map opens on the Philippines, then drops a pin after location capture";

    const address = document.createElement("p");
    address.className = "small text-muted mb-2";
    address.textContent = householdJobLocationPreview?.locationLabel || "Use your current location or complete the address fields to place the job on the map.";

    const coords = document.createElement("p");
    coords.className = "small mb-2 household-job-map-coords";
    coords.textContent = householdJobLocationPreview?.latitude != null && householdJobLocationPreview?.longitude != null ? `Latitude: ${householdJobLocationPreview.latitude}, Longitude: ${householdJobLocationPreview.longitude}` : "No confirmed map pin yet.";

    const accuracy = document.createElement("p");
    accuracy.className = "small mb-3 household-job-map-accuracy";
    accuracy.textContent = householdJobLocationPreview?.accuracy ? `Reported device accuracy: about ${Math.round(householdJobLocationPreview.accuracy)} meters` : householdJobMapMode === "manual" ? "Click or drag anywhere in the Philippines map to set the exact job location, then review the auto-filled address fields." : "Map opens at the Philippines by default and adds a pin after you confirm location.";

    const mapWrap = document.createElement("div");
    mapWrap.className = "household-job-map-frame";
    const mapNode = document.createElement("div");
    mapNode.id = householdJobMapContainerIdRef.current;
    mapNode.className = "household-job-map-canvas";
    mapWrap.append(mapNode);

    const warning = document.createElement("p");
    warning.className = "small mb-2 household-job-map-warning";
    warning.textContent = householdJobLocationPreview?.warning || "";
    if (!householdJobLocationPreview?.warning) {
      warning.style.display = "none";
    }

    const note = document.createElement("p");
    note.className = "small text-muted mt-2 mb-0";
    note.textContent = "Geocoding uses OpenRouteService, while the visual map preview is rendered with OpenStreetMap.";

    card.append(heading, title, address, coords, accuracy, mapWrap, warning, note);
    previewWrap.append(card);
    form.append(previewWrap);

    let cancelled = false;

    (async () => {
      try {
        const L = await loadLeafletAssets();
        if (cancelled || !L) {
          return;
        }
        if (householdJobMapRef.current) {
          householdJobMapRef.current.remove();
          householdJobMapRef.current = null;
        }
        const mapInstance = L.map(mapNode, {
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          tap: false,
        });
        householdJobMapRef.current = mapInstance;
        mapInstance.dragging.enable();
        mapInstance.touchZoom.enable();
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapInstance);
        if (householdJobMapMode === "manual") {
          mapNode.classList.add("manual-pin-active");
        }
        let marker = null;
        const syncMarker = async (latitude, longitude, source = "manual") => {
          if (marker) {
            marker.remove();
          }
          marker = L.marker([latitude, longitude], { draggable: true }).addTo(mapInstance);
          marker.dragging?.enable();
          marker.on("dragend", async () => {
            const draggedPoint = marker.getLatLng();
            try {
              const nextLocation = await placeHouseholdJobPin(draggedPoint.lat, draggedPoint.lng, "manual", false);
              if (nextLocation?.latitude != null && nextLocation?.longitude != null) {
                marker.setLatLng([nextLocation.latitude, nextLocation.longitude]);
              }
            } catch (error) {
              window.alert("We could not update the dragged pin yet. Please try again.");
            }
          });
        };
        if (householdJobLocationPreview?.latitude != null && householdJobLocationPreview?.longitude != null) {
          if (householdJobMapViewRef.current.touched) {
            mapInstance.setView(householdJobMapViewRef.current.center, householdJobMapViewRef.current.zoom);
          } else {
            mapInstance.setView([householdJobLocationPreview.latitude, householdJobLocationPreview.longitude], 15);
          }
          await syncMarker(householdJobLocationPreview.latitude, householdJobLocationPreview.longitude, householdJobLocationPreview.source || "manual");
        } else {
          mapInstance.setView(householdJobMapViewRef.current.center, householdJobMapViewRef.current.zoom);
        }
        mapInstance.on("moveend zoomend", () => {
          const center = mapInstance.getCenter();
          householdJobMapViewRef.current = { center: [center.lat, center.lng], zoom: mapInstance.getZoom(), touched: true };
        });
        mapInstance.on("click", async (event) => {
          if (householdJobMapMode !== "manual") {
            return;
          }
          try {
            const nextLocation = await placeHouseholdJobPin(event.latlng.lat, event.latlng.lng, "manual", true);
            await syncMarker(nextLocation.latitude, nextLocation.longitude, "manual");
          } catch (error) {
            window.alert("We could not use that pin yet. Please try another nearby spot.");
          }
        });
      } catch (error) {
        if (!cancelled) {
          warning.style.display = "";
          warning.textContent = "Interactive map could not be loaded right now. You can still use current location or typed address.";
        }
      }
    })();

    return () => {
      cancelled = true;
      if (householdJobMapRef.current) {
        householdJobMapRef.current.remove();
        householdJobMapRef.current = null;
      }
      previewWrap.remove();
    };
  }, [view, householdJobLocationPreview?.mapUrl, householdJobLocationPreview?.latitude, householdJobLocationPreview?.longitude, householdJobLocationPreview?.locationLabel, householdJobLocationPreview?.source, householdJobLocationPreview?.warning, householdJobLocationPreview?.accuracy, householdJobMapMode]);
  useEffect(() => {
    if (view !== "household-my-jobs" || !selectedJob) {
      return;
    }
    const firstJobCard = document.querySelector(".my-jobs-card");
    if (!firstJobCard || firstJobCard.querySelector("[data-hiring-progress-panel]")) {
      return;
    }
    const progressPanel = document.createElement("div");
    progressPanel.dataset.hiringProgressPanel = "true";
    progressPanel.className = "alert alert-info mx-3 mt-3 mb-0 py-2";
    progressPanel.textContent = `Hiring progress: ${getHiringProgressLabel(selectedJob)} worker(s) hired. Pending applications: ${getPendingApplicationCount(selectedJob)}.`;
    firstJobCard.append(progressPanel);
    return () => progressPanel.remove();
  }, [view, selectedJob]);
  useEffect(() => {
    if (view !== "household-worker-profile" || !selectedJob || !selectedWorker) {
      return;
    }
    const application = (selectedJob.applications || []).find((item) => item.workerId === selectedWorker.id);
    const hireButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Hire This Worker"));
    if (!hireButton || hireButton.parentElement?.querySelector("[data-reject-application-button]")) {
      return;
    }
    if (!application || ["Hired", "Rejected"].includes(application.status)) {
      return;
    }
    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.className = "btn btn-outline-danger w-100 mb-2";
    rejectButton.dataset.rejectApplicationButton = "true";
    rejectButton.textContent = "Reject Application";
    const handleClick = () => handleRejectApplication(selectedWorker.id, selectedJob.id);
    rejectButton.addEventListener("click", handleClick);
    hireButton.after(rejectButton);
    return () => {
      rejectButton.removeEventListener("click", handleClick);
      rejectButton.remove();
    };
  }, [view, selectedJob, selectedWorker]);
  useEffect(() => {
    if (view !== "household-worker-profile" || !selectedJob || !selectedWorker) {
      return;
    }
    const targetColumn = document.querySelector(".worker-content .row.g-3 .col-lg-8");
    if (!targetColumn || targetColumn.querySelector("[data-distance-location-map]")) {
      return;
    }
    const household = currentHousehold || registeredHouseholds.find((item) => item.username === selectedJob.householdUsername);
    const jobLatitude = selectedJob.latitude ?? household?.latitude ?? null;
    const jobLongitude = selectedJob.longitude ?? household?.longitude ?? null;
    const workerLatitude = selectedWorker.latitude ?? null;
    const workerLongitude = selectedWorker.longitude ?? null;
    const distanceKm = haversineDistanceKm(jobLatitude, jobLongitude, workerLatitude, workerLongitude);
    const panel = document.createElement("div");
    panel.className = "profile-card mb-3";
    panel.dataset.distanceLocationMap = "true";
    const head = document.createElement("div");
    head.className = "profile-card-head";
    head.textContent = "Distance & Location";
    const body = document.createElement("div");
    body.className = "p-3";
    panel.append(head, body);
    const skillsCard = Array.from(targetColumn.querySelectorAll(".profile-card")).find((card) => card.textContent.includes("Skills & Expertise"));
    if (skillsCard?.nextSibling) {
      targetColumn.insertBefore(panel, skillsCard.nextSibling);
    } else {
      targetColumn.append(panel);
    }
    const root = createRoot(body);
    root.render(React.createElement(LocationDistanceMap, {
      userLatitude: jobLatitude,
      userLongitude: jobLongitude,
      targetLatitude: workerLatitude,
      targetLongitude: workerLongitude,
      userLocation: formatLocation(household?.barangay || selectedJob.barangay, household?.streetAddress || selectedJob.streetAddress),
      targetLocation: formatLocation(selectedWorker.barangay, selectedWorker.streetAddress),
      distanceKm,
      formatDistanceFn: formatDistance,
    }));
    return () => {
      root.unmount();
      panel.remove();
    };
  }, [view, selectedJob, selectedWorker, currentHousehold, registeredHouseholds]);
  useEffect(() => {
    if (view !== "worker-job-detail" || !currentWorkerJobDetail) {
      return;
    }
    const applyButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Apply Now"));
    const targetCard = applyButton?.closest(".profile-card") || applyButton?.parentElement;
    if (!targetCard || targetCard.querySelector("[data-household-profile-preview]")) {
      return;
    }
    const household = currentWorkerJobHousehold;
    const householdName = getDisplayName(household?.firstName, household?.lastName, currentWorkerJobDetail.householdName || currentWorkerJobDetail.householdUsername);
    const photoUrl = getHouseholdPhoto(household);
    const panel = document.createElement("div");
    panel.className = "household-profile-preview";
    panel.dataset.householdProfilePreview = "true";
    const header = document.createElement("p");
    header.className = "small text-muted mb-2";
    header.textContent = "Household Profile";
    const body = document.createElement("div");
    body.className = "d-flex align-items-center gap-3";
    let avatar;
    if (photoUrl) {
      avatar = document.createElement("img");
      avatar.src = photoUrl;
      avatar.alt = `${householdName} profile`;
      avatar.className = "household-profile-photo";
    } else {
      avatar = document.createElement("div");
      avatar.className = "household-profile-fallback";
      avatar.textContent = (householdName || "H").slice(0, 1).toUpperCase();
    }
    const details = document.createElement("div");
    details.className = "flex-grow-1";
    const name = document.createElement("p");
    name.className = "mb-1 fw-semibold";
    name.textContent = householdName || "Household";
    const location = document.createElement("p");
    location.className = "mb-1 small text-muted";
    location.textContent = formatLocation(household?.barangay || currentWorkerJobDetail.barangay, household?.streetAddress || currentWorkerJobDetail.streetAddress);
    const contact = document.createElement("p");
    contact.className = "mb-0 small text-muted";
    contact.textContent = [household?.phone ? `+63${household.phone}` : "", household?.email || ""].filter(Boolean).join(" | ") || "Contact details not provided";
    details.append(name, location, contact);
    body.append(avatar, details);
    panel.append(header, body);
    applyButton.parentElement?.before(panel);
    return () => panel.remove();
  }, [view, currentWorkerJobDetail, currentWorkerJobHousehold]);
  useEffect(() => {
    if (view !== "worker-job-detail" || !currentWorkerJobDetail || !currentWorker) {
      return;
    }
    const workerContent = document.querySelector(".worker-content");
    if (!workerContent || workerContent.querySelector("[data-worker-job-distance-map]")) {
      return;
    }
    const jobLatitude = currentWorkerJobDetail.latitude ?? currentWorkerJobHousehold?.latitude ?? null;
    const jobLongitude = currentWorkerJobDetail.longitude ?? currentWorkerJobHousehold?.longitude ?? null;
    const workerLatitude = currentWorker.latitude ?? null;
    const workerLongitude = currentWorker.longitude ?? null;
    const distanceKm = haversineDistanceKm(workerLatitude, workerLongitude, jobLatitude, jobLongitude);
    const panel = document.createElement("div");
    panel.className = "profile-card mt-3";
    panel.dataset.workerJobDistanceMap = "true";
    const head = document.createElement("div");
    head.className = "profile-card-head";
    head.textContent = "Distance & Location";
    const body = document.createElement("div");
    body.className = "p-3";
    panel.append(head, body);
    const firstCard = workerContent.querySelector(".profile-card");
    if (firstCard?.nextSibling) {
      workerContent.insertBefore(panel, firstCard.nextSibling);
    } else {
      workerContent.append(panel);
    }
    const root = createRoot(body);
    root.render(React.createElement(LocationDistanceMap, {
      userLatitude: workerLatitude,
      userLongitude: workerLongitude,
      targetLatitude: jobLatitude,
      targetLongitude: jobLongitude,
      userLocation: formatLocation(currentWorker.barangay, currentWorker.streetAddress),
      targetLocation: formatLocation(currentWorkerJobHousehold?.barangay || currentWorkerJobDetail.barangay, currentWorkerJobHousehold?.streetAddress || currentWorkerJobDetail.streetAddress),
      distanceKm,
      formatDistanceFn: formatDistance,
    }));
    return () => {
      root.unmount();
      panel.remove();
    };
  }, [view, currentWorkerJobDetail, currentWorkerJobHousehold, currentWorker]);
  useEffect(() => {
    if (view !== "worker-job-detail" || !currentWorkerJobDetail) {
      return;
    }
    const applyButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Apply Now"));
    if (!applyButton) {
      return;
    }
    const parent = applyButton.parentElement;
    if (!parent) {
      return;
    }
    const existingNotice = parent.querySelector("[data-worker-apply-lock]");
    if (currentWorker?.verification === "Verified") {
      applyButton.disabled = false;
      if (existingNotice) existingNotice.remove();
      return;
    }
    applyButton.disabled = true;
    if (!existingNotice) {
      const notice = document.createElement("div");
      notice.dataset.workerApplyLock = "true";
      notice.className = "alert alert-warning mt-3 mb-0 py-2";
      notice.textContent = "You cannot apply yet. Please complete your verification first to unlock job applications.";
      parent.appendChild(notice);
    }
  }, [view, currentWorkerJobDetail, currentWorker?.verification]);
  useEffect(() => {
    if (view !== "worker-find-jobs") {
      return;
    }
    const getDistancePoint = (record) => {
      const latitude = record?.latitude ?? null;
      const longitude = record?.longitude ?? null;
      if (latitude !== null && longitude !== null && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
        return { latitude, longitude };
      }
      return getBarangayCenter(record?.barangay || "");
    };
    const actionCards = Array.from(document.querySelectorAll("button")).filter((button) => button.textContent.includes("View Details") || button.textContent.includes("Apply Now")).map((button) => button.closest(".profile-card") || button.parentElement).filter(Boolean);
    [...new Set(actionCards)].forEach((card, index) => {
      if (card.querySelector("[data-worker-job-distance]")) {
        return;
      }
      const job = workerVisibleJobs[index];
      if (!job || !currentWorker) {
        return;
      }
      const household = registeredHouseholds.find((item) => item.username === job.householdUsername);
      const workerPoint = getDistancePoint(currentWorker);
      const jobPoint = getDistancePoint({
        barangay: household?.barangay || job.barangay,
        latitude: job.latitude ?? household?.latitude ?? null,
        longitude: job.longitude ?? household?.longitude ?? null,
      });
      const distanceKm = haversineDistanceKm(workerPoint.latitude, workerPoint.longitude, jobPoint.latitude, jobPoint.longitude);
      const badge = document.createElement("div");
      badge.dataset.workerJobDistance = "true";
      badge.className = "worker-job-distance-badge";
      badge.textContent = formatDistance(distanceKm);
      card.appendChild(badge);
    });
    const applyButtons = Array.from(document.querySelectorAll("button")).filter((button) => button.textContent.includes("Apply Now"));
    applyButtons.forEach((button) => {
      const card = button.closest(".profile-card") || button.parentElement;
      if (!card) {
        return;
      }
      const existingBadge = card.querySelector("[data-apply-lock-badge]");
      if (currentWorker?.verification === "Verified") {
        button.style.display = "";
        button.disabled = false;
        if (existingBadge) existingBadge.remove();
        return;
      }
      button.style.display = "none";
      if (!existingBadge) {
        const badge = document.createElement("div");
        badge.dataset.applyLockBadge = "true";
        badge.className = "alert alert-warning mt-3 mb-0 py-2 small";
        badge.textContent = "Locked until verified: you can browse jobs, but applications are unavailable until admin approval.";
        card.appendChild(badge);
      }
    });
  }, [view, currentWorker, currentWorker?.verification, workerVisibleJobs, registeredHouseholds]);
  useEffect(() => {
    if (view !== "household-worker-profile" || !selectedWorker) {
      return;
    }
    const targetColumn = document.querySelector(".worker-content .row .col-lg-8");
    if (!targetColumn || targetColumn.querySelector("[data-household-verification-panel]")) {
      return;
    }
    const request = verificationRequests.find((item) => item.id === selectedWorker.verificationRequestId) || verificationRequests.find((item) => item.workerId === selectedWorker.id) || selectedWorker.verificationSubmission;
    if (!request) {
      return;
    }
    const panel = document.createElement("div");
    panel.dataset.householdVerificationPanel = "true";
    panel.className = "profile-card mb-3";
    const head = document.createElement("div");
    head.className = "profile-card-head";
    head.textContent = "Verification Details";
    const body = document.createElement("div");
    body.className = "p-3";
    const list = document.createElement("div");
    list.className = "d-grid gap-2";
    const addDetail = (label, value) => {
      const row = document.createElement("p");
      row.className = "mb-0 small d-flex justify-content-between gap-3";
      const labelNode = document.createElement("span");
      labelNode.className = "text-muted";
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.className = "text-end";
      valueNode.textContent = value || "Not provided";
      row.append(labelNode, valueNode);
      list.appendChild(row);
    };
    addDetail("Status", request.status || selectedWorker.verification || "Pending");
    addDetail("Primary ID", request.primaryIdName);
    addDetail("Secondary Document", request.secondaryDocName);
    addDetail("Submitted", request.submittedAt);
    if (request.reviewedAt) {
      addDetail("Reviewed", request.reviewedAt);
    }
    if (request.notes) {
      addDetail("Worker Notes", request.notes);
    }
    if (request.reviewNote) {
      addDetail("Admin Note", request.reviewNote);
    }
    body.appendChild(list);
    const previewRow = document.createElement("div");
    previewRow.className = "d-flex flex-wrap gap-2 mt-3";
    [
      { label: "View Primary ID", url: request.primaryIdPreview },
      { label: "View Secondary Document", url: request.secondaryDocPreview },
    ].forEach((item) => {
      if (!item.url) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-outline-secondary btn-sm";
      button.textContent = item.label;
      button.addEventListener("click", () => openFilePreview(item.url));
      previewRow.appendChild(button);
    });
    if (previewRow.children.length) {
      body.appendChild(previewRow);
    }
    panel.append(head, body);
    const cards = targetColumn.querySelectorAll(".profile-card");
    const reviewsCard = Array.from(cards).find((card) => card.textContent.includes("Reviews & Ratings"));
    targetColumn.insertBefore(panel, reviewsCard || null);
    return () => panel.remove();
  }, [view, selectedWorker, verificationRequests]);
  useEffect(() => {
    if (!["worker-profile", "household-profile", "household-worker-profile"].includes(view)) {
      return;
    }
    const content = document.querySelector(".worker-content");
    if (!content || content.querySelector("[data-review-summary-panel]")) {
      return;
    }
    const panel = document.createElement("div");
    panel.dataset.reviewSummaryPanel = "true";
    panel.className = "profile-card mt-3";
    const head = document.createElement("div");
    head.className = "profile-card-head";
    head.textContent = view === "worker-profile" ? "Latest Reviews" : "Feedback & Ratings";
    const body = document.createElement("div");
    body.className = "p-3 d-grid gap-3";
    const sourceReviews = view === "worker-profile" ? currentWorker?.receivedReviews || [] : view === "household-profile" ? currentHousehold?.receivedFeedback || [] : selectedWorker?.receivedReviews || [];
    const submittedReviews = view === "worker-profile" ? currentWorker?.givenFeedback || [] : view === "household-profile" ? currentHousehold?.givenFeedback || [] : selectedWorker?.givenFeedback || [];
    const renderSection = (title, items) => {
      const section = document.createElement("div");
      const label = document.createElement("p");
      label.className = "small fw-semibold text-muted mb-2";
      label.textContent = title;
      section.appendChild(label);
      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "mb-0 text-muted";
        empty.textContent = "No entries yet.";
        section.appendChild(empty);
        return section;
      }
      items.slice(0, 4).forEach((review) => {
        const item = document.createElement("div");
        item.className = "review-item";
        item.innerHTML = `
          <div class="d-flex justify-content-between gap-3">
            <div>
              <p class="mb-1 fw-semibold">${review.authorName || review.author || "User"}</p>
              <p class="mb-1 small text-muted">${review.feedback || review.comment || ""}</p>
              <p class="mb-0 small text-muted">${review.createdAt || review.date || "Recently"}</p>
            </div>
            <strong>${review.rating != null ? `${review.rating}/5` : "Feedback"}</strong>
          </div>`;
        section.appendChild(item);
      });
      return section;
    };
    body.appendChild(renderSection(view === "worker-profile" ? "Received from households" : "Received from workers", sourceReviews));
    body.appendChild(renderSection(view === "worker-profile" ? "Feedback you submitted" : "Reviews you submitted", submittedReviews));
    const form = document.createElement("form");
    form.className = "border-top pt-3";
    const formTitle = document.createElement("p");
    formTitle.className = "fw-semibold mb-2";
    formTitle.textContent = view === "worker-profile" ? "Send feedback to the household" : view === "household-worker-profile" ? "Rate this worker" : "Your review history";
    form.appendChild(formTitle);
    if (view === "worker-profile" && currentWorkerJobHousehold) {
      const textarea = document.createElement("textarea");
      textarea.className = "form-control mb-2";
      textarea.rows = 3;
      textarea.placeholder = "Write feedback for the household...";
      textarea.value = workerFeedbackForm.feedback;
      textarea.addEventListener("input", (event) => setWorkerFeedbackForm({ feedback: event.target.value, jobId: currentWorkerJobDetail?.id || "" }));
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "btn btn-primary btn-sm";
      submit.textContent = "Submit Feedback";
      form.append(textarea, submit);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        handleWorkerFeedbackSubmit(event);
      });
    } else if (view === "household-worker-profile" && selectedWorker) {
      const select = document.createElement("select");
      select.className = "form-select mb-2";
      Array.from({ length: 5 }, (_, index) => String(index + 1)).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = `${value} star${value === "1" ? "" : "s"}`;
        if (value === householdReviewForm.rating) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      select.addEventListener("change", (event) => setHouseholdReviewForm((prev) => ({ ...prev, rating: event.target.value, jobId: selectedJob?.id || "" })));
      const textarea = document.createElement("textarea");
      textarea.className = "form-control mb-2";
      textarea.rows = 3;
      textarea.placeholder = "Write a rating note for the worker...";
      textarea.value = householdReviewForm.feedback;
      textarea.addEventListener("input", (event) => setHouseholdReviewForm((prev) => ({ ...prev, feedback: event.target.value, jobId: selectedJob?.id || "" })));
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "btn btn-primary btn-sm";
      submit.textContent = "Submit Rating";
      form.append(select, textarea, submit);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        handleHouseholdReviewSubmit(event);
      });
    } else {
      const note = document.createElement("p");
      note.className = "mb-0 text-muted";
      note.textContent = "Open a worker profile to rate them, or view a worker profile to send household feedback.";
      form.appendChild(note);
    }
    body.appendChild(form);
    panel.append(head, body);
    content.appendChild(panel);
    return () => panel.remove();
  }, [view, currentWorker, currentHousehold, selectedWorker, currentWorkerJobHousehold, currentWorkerJobDetail, workerFeedbackForm.feedback, householdReviewForm.feedback, householdReviewForm.rating]);
  useEffect(() => {
    if (view !== "worker-notifications" || !currentWorker) {
      return;
    }
    const existingAlert = document.querySelector("[data-verification-alert]");
    if (currentWorker.verification === "Verified") {
      if (existingAlert) {
        existingAlert.remove();
      }
      return;
    }
    const badgeRow = document.querySelector(".worker-topbar");
    if (!badgeRow || badgeRow.querySelector("[data-verification-alert]")) {
      return;
    }
    const alert = document.createElement("div");
    alert.dataset.verificationAlert = "true";
    alert.className = "alert alert-warning mt-3 mb-0 py-2";
    alert.textContent = "Your account is not verified yet. Please complete verification to become eligible for hiring and priority matching.";
    badgeRow.parentElement?.insertBefore(alert, badgeRow.nextSibling);
    return () => alert.remove();
  }, [view, currentWorker]);
  useEffect(() => {
    document.querySelectorAll("[data-sidebar-logout]").forEach((node) => node.remove());
    document.querySelectorAll(".worker-topbar .btn.btn-outline-secondary.btn-sm").forEach((button) => {
      button.style.display = "";
    });
  }, [view, currentUser]);
  function goHome() {
    setView("home");
  }
  function goBack() {
    if (currentUser?.role === "admin") {
      setView("admin-dashboard");
      return;
    }
    if (currentUser?.role === "household") {
      setView("household-dashboard");
      return;
    }
    if (currentUser?.role === "worker") {
      setView("worker-dashboard");
      return;
    }
    setView("home");
  }
  function handleLogout() {
    clearAuthToken();
    setCurrentUser(null);
    setSelectedWorkerId(null);
    setSelectedJobId(null);
    setLoginForm({ username: "", password: "", role: "worker" });
    setView("home");
  }
  function openLogin() {
    setForgotPasswordStep("email");
    setForgotPasswordNotice("");
    setForgotPasswordError("");
    setView("login");
  }
  function openForgotPassword() {
    setForgotPasswordStep("email");
    setForgotPasswordNotice("");
    setForgotPasswordError("");
    setForgotPasswordForm({ email: "", token: "", newPassword: "", confirmPassword: "" });
    setView("forgot-password");
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthToken();
      setCurrentUser(null);
      setSelectedWorkerId(null);
      setSelectedJobId(null);
      setLoginForm({ username: "", password: "", role: "worker" });
      setView("login");
    });
    return () => setUnauthorizedHandler(null);
  }, []);
  function openWorkerRegister() {
    setWorkerForm(EMPTY_WORKER_FORM);
    setView("register-worker");
  }
  function openHouseholdRegister() {
    setHouseholdForm(EMPTY_HOUSEHOLD_FORM);
    setView("register-household");
  }
  function openWorkerDashboard() {
    setView("worker-dashboard");
  }
  function openWorkerFindJobs() {
    setView("worker-find-jobs");
  }
  function openWorkerApplications() {
    markAllWorkerApplicationsRead();
    markAllWorkerNotificationsRead();
    setView("worker-applications");
  }
  function openWorkerProfile() {
    if (currentWorker) {
      setWorkerProfileForm({ firstName: currentWorker.firstName || "", lastName: currentWorker.lastName || "", username: currentWorker.username || "", email: currentWorker.email || "", phone: currentWorker.phone || "", barangay: currentWorker.barangay || "", streetAddress: currentWorker.streetAddress || "", bio: currentWorker.bio || "", hourlyRate: currentWorker.hourlyRate || "0.00", dailyRate: currentWorker.dailyRate || "0.00", yearsExperience: currentWorker.yearsExperience || "0", skills: currentWorker.skills || [], availability: true, profilePhotoPreview: currentWorker.profilePhotoPreview || currentWorker.verificationSubmission?.primaryIdPreview || "" });
    }
    setView("worker-profile");
  }
  function openWorkerGetVerified() {
    setView("worker-get-verified");
  }
  function openWorkerNotifications() {
    markAllNotificationsRead(workerNotificationsWithReadState);
    setView("worker-notifications");
  }
  function openAdminDashboard() {
    setAdminSection("verification");
    setView("admin-dashboard");
  }
  function openAdminWorkersHistory() {
    setAdminSection("history");
    setView("admin-dashboard");
  }
  function mergeBackendWorkerIntoState(backendWorker) {
    if (!backendWorker) {
      return;
    }
    setRegisteredWorkers((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === backendWorker.id || item.username?.toLowerCase() === backendWorker.username?.toLowerCase());
      if (existingIndex < 0) {
        return [backendWorker, ...prev];
      }
      return prev.map((item, index) => (index === existingIndex ? { ...item, ...backendWorker, password: item.password || backendWorker.password || "" } : item));
    });
  }
  async function refreshVerificationStateFromBackend() {
    if (!currentUser?.username) {
      return;
    }
    try {
      const requestsResponse = await apiRequest("common/verification-requests/", {
        auth: false,
        suppressUnauthorized: true,
      });
      if (requestsResponse.ok) {
        const requestsData = await readResponseData(requestsResponse);
        const records = Array.isArray(requestsData) ? requestsData : requestsData?.results || [];
        const normalizedRequests = records.map(normalizeVerificationRequest).filter(Boolean);
        setVerificationRequests(normalizedRequests);
        setSelectedVerificationRequestId((prevSelectedId) => {
          if (normalizedRequests.some((item) => item.id === prevSelectedId)) {
            return prevSelectedId;
          }
          if (currentUser.role === "worker") {
            return normalizedRequests.find((item) => item.workerUsername === currentUser.username)?.id || normalizedRequests[0]?.id || null;
          }
          return normalizedRequests[0]?.id || null;
        });
        if (currentUser.role === "worker") {
          const matchingRequest = normalizedRequests.find((item) => item.workerUsername === currentUser.username);
          if (!getAuthToken() && matchingRequest) {
            const nextVerificationStatus = matchingRequest.status === "Approved" ? "approved" : matchingRequest.status === "Rejected" ? "rejected" : "pending";
            setCurrentUser((prev) => (prev ? { ...prev, profile: { ...(prev.profile || {}), verification_status: nextVerificationStatus, verification_request: matchingRequest } } : prev));
          }
          if (matchingRequest) {
            const nextVerificationLabel = matchingRequest.status === "Approved" ? "Verified" : matchingRequest.status === "Rejected" ? "Rejected" : "Under Review";
            setRegisteredWorkers((prev) => prev.map((worker) => worker.username === currentUser.username ? {
              ...worker,
              verification: nextVerificationLabel,
              verificationRequestId: matchingRequest.id,
              verificationSubmission: matchingRequest,
              verificationReviewedAt: matchingRequest.reviewedAt || worker.verificationReviewedAt || "",
              verificationReviewedBy: matchingRequest.reviewedBy || worker.verificationReviewedBy || "",
              verificationRejectionNote: matchingRequest.reviewNote || worker.verificationRejectionNote || "",
            } : worker));
          } else {
            setRegisteredWorkers((prev) => prev.map((worker) => worker.username === currentUser.username ? {
              ...worker,
              verificationSubmission: null,
              verificationRequestId: null,
            } : worker));
          }
        }
      }
      if (currentUser.role === "worker" && getAuthToken()) {
        const profileResponse = await apiRequest("accounts/me/", {
          auth: true,
          suppressUnauthorized: true,
        });
        if (profileResponse.ok) {
          const profileData = await readResponseData(profileResponse);
          const refreshedUser = {
            id: profileData?.user?.id || currentUser.id || currentUser.username,
            role: currentUser.role,
            username: profileData?.user?.username || currentUser.username,
            email: profileData?.user?.email || currentUser.email || "",
            first_name: profileData?.user?.first_name || currentUser.first_name || "",
            last_name: profileData?.user?.last_name || currentUser.last_name || "",
            displayName: profileData?.user?.first_name || profileData?.user?.last_name ? getDisplayName(profileData?.user?.first_name || "", profileData?.user?.last_name || "", profileData?.user?.username || currentUser.username) : (currentUser.displayName || currentUser.username),
            profile: profileData?.profile || currentUser.profile || null,
            is_staff: Boolean(currentUser.is_staff),
          };
          setCurrentUser((prev) => (prev ? { ...prev, ...refreshedUser } : prev));
          mergeBackendWorkerIntoState(normalizeBackendWorker(refreshedUser));
        }
      }
    } catch (error) {
      return;
    }
  }
  async function refreshJobsFromBackend() {
    try {
      const response = await apiRequest("jobs/", {
        auth: false,
        suppressUnauthorized: true,
      });
      if (!response.ok) {
        return;
      }
      const data = await readResponseData(response);
      const records = Array.isArray(data) ? data : data?.results || [];
      const normalizedJobs = records.map(normalizeBackendJob).filter(Boolean);
      setPostedJobs(normalizedJobs);
      if (normalizedJobs.length === 0) {
        setMatchedWorkersByJob({});
      }
    } catch (error) {
      return;
    }
  }
  async function refreshProfilesFromBackend() {
    try {
      const response = await apiRequest("accounts/profiles/", {
        auth: false,
        suppressUnauthorized: true,
      });
      if (!response.ok) {
        return;
      }
      const data = await readResponseData(response);
      const records = Array.isArray(data) ? data : data?.results || [];
      const normalizedProfiles = records.map(normalizeProfileRecord).filter(Boolean);
      const workerProfiles = normalizedProfiles.filter((profile) => profile.role === "worker");
      const householdProfiles = normalizedProfiles.filter((profile) => profile.role === "household");
      setRegisteredWorkers((prev) => workerProfiles.map((workerProfile) => {
        const existing = prev.find((item) => item.username?.toLowerCase() === workerProfile.username?.toLowerCase() || String(item.id) === String(workerProfile.id));
        return {
          ...existing,
          ...workerProfile,
          verificationSubmission: existing?.verificationSubmission || null,
          verificationNotifications: existing?.verificationNotifications || [],
          applicationNotifications: existing?.applicationNotifications || [],
          receivedReviews: existing?.receivedReviews || [],
          givenFeedback: existing?.givenFeedback || [],
          avatar: existing?.avatar || (workerProfile.firstName || workerProfile.username || "W").slice(0, 1).toUpperCase(),
          bio: workerProfile.bio || existing?.bio || "",
          phone: workerProfile.phone || existing?.phone || "",
          yearsExperience: workerProfile.yearsExperience ?? existing?.yearsExperience ?? "0",
          status: existing?.status || "Available",
          distanceKm: existing?.distanceKm || "0.00",
          distanceLabel: existing?.distanceLabel || "",
        };
      }));
      setRegisteredHouseholds((prev) => householdProfiles.map((householdProfile) => {
        const existing = prev.find((item) => item.username?.toLowerCase() === householdProfile.username?.toLowerCase() || String(item.id) === String(householdProfile.id));
        return {
          ...existing,
          ...householdProfile,
          avatar: existing?.avatar || (householdProfile.firstName || householdProfile.username || "H").slice(0, 1).toUpperCase(),
          phone: householdProfile.phone || existing?.phone || "",
          receivedFeedback: existing?.receivedFeedback || [],
          givenFeedback: existing?.givenFeedback || [],
        };
      }));
      if (currentUser?.role && currentUser.role !== "admin") {
        const userStillExists = normalizedProfiles.some((profile) => profile.username === currentUser.username);
        if (!userStillExists) {
          clearAuthToken();
          setCurrentUser(null);
          setSelectedJobId(null);
          setSelectedWorkerId(null);
          setMatchedWorkersByJob({});
          setView("login");
          window.alert("Your account data was removed from the backend, so the local session has been cleared.");
        }
      }
    } catch (error) {
      return;
    }
  }
  async function refreshRecommendedWorkers(jobId) {
    if (!jobId) {
      return;
    }
    try {
      const response = await apiRequest(`matching/recommended-workers/?job_id=${encodeURIComponent(jobId)}`, {
        auth: false,
        suppressUnauthorized: true,
      });
      if (response.status === 404) {
        setMatchedWorkersByJob((prev) => ({ ...prev, [jobId]: [] }));
        return;
      }
      if (!response.ok) {
        return;
      }
      const data = await readResponseData(response);
      const results = Array.isArray(data?.results) ? data.results : [];
      setMatchedWorkersByJob((prev) => ({
        ...prev,
        [jobId]: results.map((result) => {
          const existingWorker = registeredWorkers.find((worker) => String(worker.id) === String(result.worker_id) || worker.username === result.worker_username);
          const distanceLabel = formatDistance(result.distance_km, result.distance_label);
          return {
            ...existingWorker,
            id: existingWorker?.id || result.worker_id,
            username: existingWorker?.username || result.worker_username,
            firstName: existingWorker?.firstName || "",
            lastName: existingWorker?.lastName || "",
            skills: result.skills || existingWorker?.skills || [],
            verification: getWorkerVerificationLabel(result.verification_status),
            rating: result.rating_label || existingWorker?.rating || "No ratings yet",
            reviewsDone: existingWorker?.reviewsDone || 0,
            hourlyRate: existingWorker?.hourlyRate || "0.00",
            dailyRate: existingWorker?.dailyRate || "0.00",
            status: existingWorker?.status || "Available",
            avatar: existingWorker?.avatar || (result.worker_username || "W").slice(0, 1).toUpperCase(),
            distanceKm: result.distance_km !== null && result.distance_km !== undefined && result.distance_km !== "" && Number.isFinite(Number(result.distance_km)) ? Number(result.distance_km).toFixed(1) : "",
            distanceLabel,
            matchScore: result.match_score,
          };
        }),
      }));
    } catch (error) {
      return;
    }
  }
  async function refreshNotificationsFromBackend() {
    if (!currentUser?.username) {
      setBackendNotifications([]);
      return;
    }
    try {
      const response = await apiRequest(`notifications/?username=${encodeURIComponent(currentUser.username)}`, {
        auth: false,
        suppressUnauthorized: true,
      });
      if (!response.ok) {
        return;
      }
      const data = await readResponseData(response);
      const records = Array.isArray(data) ? data : data?.results || [];
      setBackendNotifications(records.map(normalizeBackendNotification).filter(Boolean));
    } catch (error) {
      return;
    }
  }
  async function refreshReviewsFromBackend() {
    if (!currentUser?.username) {
      return;
    }
    try {
      const requests = [
        apiRequest(`reviews/?username=${encodeURIComponent(currentUser.username)}`, { auth: false, suppressUnauthorized: true }),
        apiRequest(`reviews/?author_username=${encodeURIComponent(currentUser.username)}`, { auth: false, suppressUnauthorized: true }),
      ];
      if (currentUser.role === "household" && selectedWorker?.username) {
        requests.push(apiRequest(`reviews/?username=${encodeURIComponent(selectedWorker.username)}`, { auth: false, suppressUnauthorized: true }));
      }
      const responses = await Promise.all(requests);
      const payloads = await Promise.all(responses.map(async (response) => {
        if (!response.ok) {
          return [];
        }
        const data = await readResponseData(response);
        const records = Array.isArray(data) ? data : data?.results || [];
        return records.map(normalizeBackendReview).filter(Boolean);
      }));
      const receivedReviews = payloads[0] || [];
      const authoredReviews = payloads[1] || [];
      if (currentUser.role === "worker") {
        setRegisteredWorkers((prev) => prev.map((worker) => worker.username === currentUser.username ? { ...worker, receivedReviews, givenFeedback: authoredReviews } : worker));
      }
      if (currentUser.role === "household") {
        setRegisteredHouseholds((prev) => prev.map((household) => household.username === currentUser.username ? { ...household, receivedFeedback: receivedReviews, givenFeedback: authoredReviews } : household));
        if (selectedWorker?.username) {
          const selectedWorkerReviews = payloads[2] || [];
          setRegisteredWorkers((prev) => prev.map((worker) => worker.username === selectedWorker.username ? { ...worker, receivedReviews: selectedWorkerReviews } : worker));
        }
      }
    } catch (error) {
      return;
    }
  }
  function openHouseholdDashboard() {
    setView("household-dashboard");
  }
  function openHouseholdPostJob() {
    const savedLocation = getSavedHouseholdLocation(currentHousehold, currentUser);
    setHouseholdJobForm((prev) => ({ ...prev, barangay: savedLocation.barangay, streetAddress: savedLocation.streetAddress }));
    setHouseholdJobCoordinates(null);
    setHouseholdJobLocationPreview(null);
    setView("household-post-job");
  }
  function openHouseholdProfile() {
    if (currentHousehold) {
      setHouseholdProfileForm({ firstName: currentHousehold.firstName || "", lastName: currentHousehold.lastName || "", username: currentHousehold.username || "", email: currentHousehold.email || "", phone: currentHousehold.phone || "", barangay: currentHousehold.barangay || "", streetAddress: currentHousehold.streetAddress || "", profilePhotoName: currentHousehold.profilePhotoName || "", profilePhotoPreview: currentHousehold.profilePhotoPreview || "" });
    }
    setView("household-profile");
  }
  function openHouseholdMyJobs() {
    setView("household-my-jobs");
  }
  function openHouseholdNotifications() {
    markAllNotificationsRead(householdNotificationsWithReadState);
    setView("household-notifications");
  }
  function openHouseholdJobDetail(jobId) {
    setSelectedJobId(jobId);
    setSelectedWorkerId(null);
    setView("household-my-jobs");
  }
  function openWorkerJobDetail(jobId) {
    setSelectedJobId(jobId);
    setSelectedWorkerId(null);
    setView("worker-job-detail");
  }
  function openVerificationRequest(requestId) {
    setSelectedVerificationRequestId(requestId);
  }
  function markNotificationRead(notificationId) {
    if (!notificationId) return;
    setNotificationReads((prev) => prev[notificationId] ? prev : { ...prev, [notificationId]: true });
    const backendNotification = backendNotifications.find((item) => item.id === notificationId);
    if (backendNotification?.backendId && currentUser?.username) {
      apiRequest(`notifications/${backendNotification.backendId}/read/`, {
        method: "PATCH",
        auth: false,
        suppressUnauthorized: true,
        body: { username: currentUser.username },
      }).then(async (response) => {
        if (response.ok) {
          await refreshNotificationsFromBackend();
        }
      }).catch(() => {
        return;
      });
    }
  }
  function markAllNotificationsRead(notifications) {
    setNotificationReads((prev) => {
      const nextState = { ...prev };
      let changed = false;
      notifications.forEach((notification) => {
        if (!nextState[notification.id]) {
          nextState[notification.id] = true;
          changed = true;
        }
      });
      return changed ? nextState : prev;
    });
    notifications.forEach((notification) => {
      if (notification.backendId && currentUser?.username) {
        apiRequest(`notifications/${notification.backendId}/read/`, {
          method: "PATCH",
          auth: false,
          suppressUnauthorized: true,
          body: { username: currentUser.username },
        }).catch(() => {
          return;
        });
      }
    });
  }
  function markAllWorkerNotificationsRead() {
    markAllNotificationsRead(workerNotificationsWithReadState);
  }
  function markAllWorkerApplicationsRead() {
    if (!workerApplications.length) {
      return;
    }
    setNotificationReads((prev) => {
      const nextState = { ...prev };
      let changed = false;
      workerApplications.forEach((job) => {
        if (!["Hired", "Rejected"].includes(job.applicationStatus)) {
          return;
        }
        const notificationId = `worker-application-${job.applicationId}`;
        if (!nextState[notificationId]) {
          nextState[notificationId] = true;
          changed = true;
        }
      });
      return changed ? nextState : prev;
    });
  }
  function openFilePreview(fileUrl) {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }
  async function captureHouseholdJobLocation(showSuccessMessage = true) {
    const resolvedLocation = await resolveLocationCoordinates(householdJobForm.barangay, householdJobForm.streetAddress, true);
    if (!resolvedLocation) {
      window.alert("We could not detect or estimate your location yet. Please allow browser location access or complete the barangay and street fields first.");
      return null;
    }
    setHouseholdJobCoordinates({ latitude: resolvedLocation.latitude, longitude: resolvedLocation.longitude });
    setHouseholdJobLocationPreview(resolvedLocation);
    setHouseholdJobForm((prev) => ({
      ...prev,
      barangay: getFallbackBarangay(resolvedLocation.barangay || prev.barangay),
      streetAddress: resolvedLocation.streetAddress || formatCoordinateAddress(resolvedLocation.latitude, resolvedLocation.longitude),
    }));
    if (showSuccessMessage) {
      if (resolvedLocation.warning) {
        window.alert(resolvedLocation.warning);
      } else {
        window.alert(resolvedLocation.source === "device" ? "Current location captured successfully. You can now post the job." : "We estimated your location from the address fields and loaded the map preview.");
      }
    }
    return resolvedLocation;
  }
  async function placeHouseholdJobPin(latitude, longitude, source = "manual", showSuccessMessage = false) {
    const reverseResult = await reverseGeocodeCoordinates(latitude, longitude, householdJobForm.barangay, householdJobForm.streetAddress);
    const fallbackLocation = buildCoordinateLocation(latitude, longitude, await getNearestBarangayFromCoordinates(latitude, longitude), formatCoordinateAddress(latitude, longitude), source);
    const resolvedBarangay = getFallbackBarangay(reverseResult?.barangay || fallbackLocation.barangay);
    const resolvedLatitude = reverseResult?.latitude ?? fallbackLocation.latitude;
    const resolvedLongitude = reverseResult?.longitude ?? fallbackLocation.longitude;
    const resolvedStreetAddress = reverseResult?.streetAddress || fallbackLocation.streetAddress || formatCoordinateAddress(resolvedLatitude, resolvedLongitude);
    const resolvedLocation = {
      latitude: Number(Number(resolvedLatitude).toFixed(7)),
      longitude: Number(Number(resolvedLongitude).toFixed(7)),
      barangay: resolvedBarangay,
      streetAddress: resolvedStreetAddress,
      locationLabel: reverseResult?.locationLabel || formatLocation(resolvedBarangay, resolvedStreetAddress),
      mapUrl: buildMapPreviewUrl(resolvedLatitude, resolvedLongitude),
      source,
      warning: source === "manual" ? "Manual pin placed. Review the auto-filled address before posting." : reverseResult?.warning || "",
    };
    setHouseholdJobCoordinates({ latitude: resolvedLocation.latitude, longitude: resolvedLocation.longitude });
    setHouseholdJobLocationPreview(resolvedLocation);
    setHouseholdJobForm((prev) => ({
      ...prev,
      barangay: getFallbackBarangay(resolvedLocation.barangay || prev.barangay),
      streetAddress: resolvedLocation.streetAddress || formatCoordinateAddress(resolvedLocation.latitude, resolvedLocation.longitude),
    }));
    if (source !== "manual") {
      setHouseholdJobMapMode("preview");
    }
    if (showSuccessMessage) {
      window.alert(source === "manual" ? "Manual pin saved. Barangay and street fields were updated automatically." : "Location updated.");
    }
    return resolvedLocation;
  }
  async function syncHouseholdJobBarangayLocation(barangay) {
    const selectedBarangay = getFallbackBarangay(barangay);
    if (!selectedBarangay) {
      return null;
    }
    const syncId = householdJobBarangaySyncRef.current + 1;
    householdJobBarangaySyncRef.current = syncId;
    const barangayCenter = getBarangayCenter(selectedBarangay);
    const fallbackLocation = buildCoordinateLocation(barangayCenter.latitude, barangayCenter.longitude, selectedBarangay, `Barangay ${selectedBarangay}, Tayabas City`, "address");
    setHouseholdJobCoordinates({ latitude: fallbackLocation.latitude, longitude: fallbackLocation.longitude });
    setHouseholdJobLocationPreview(fallbackLocation);
    setHouseholdJobMapMode("preview");
    setHouseholdJobForm((prev) => ({
      ...prev,
      barangay: selectedBarangay,
      streetAddress: fallbackLocation.streetAddress,
    }));
    let resolvedLocation = null;
    try {
      resolvedLocation = await geocodeAddressLocation(selectedBarangay, "");
    } catch (error) {
      resolvedLocation = null;
    }
    if (!resolvedLocation || householdJobBarangaySyncRef.current !== syncId) {
      return fallbackLocation;
    }
    const nextLocation = resolvedLocation ? {
      ...resolvedLocation,
      barangay: selectedBarangay,
      streetAddress: resolvedLocation.streetAddress || `Barangay ${selectedBarangay}, Tayabas City`,
      locationLabel: resolvedLocation.locationLabel || formatLocation(selectedBarangay, resolvedLocation.streetAddress || `Barangay ${selectedBarangay}, Tayabas City`),
      source: "address",
    } : fallbackLocation;
    setHouseholdJobCoordinates({ latitude: nextLocation.latitude, longitude: nextLocation.longitude });
    setHouseholdJobLocationPreview(nextLocation);
    setHouseholdJobMapMode("preview");
    setHouseholdJobForm((prev) => ({
      ...prev,
      barangay: selectedBarangay,
      streetAddress: nextLocation.streetAddress || `Barangay ${selectedBarangay}, Tayabas City`,
    }));
    return nextLocation;
  }
  function handleApplyToJob(jobId) {
    if (!currentWorker) {
      window.alert("Please login as a worker first.");
      return;
    }
    if (currentWorker.verification !== "Verified") {
      window.alert("Please complete verification before applying to jobs.");
      return;
    }
    const job = postedJobs.find((item) => item.id === jobId);
    if (!job) {
      window.alert("Job not found.");
      return;
    }
    if (!isJobOpenForApplications(job)) {
      window.alert("This job is already closed.");
      return;
    }
    const alreadyApplied = (job.applications || []).some((application2) => application2.workerId === currentWorker.id);
    if (alreadyApplied) {
      window.alert("You already applied for this job.");
      return;
    }
    (async () => {
      try {
        const response = await apiRequest(`jobs/${jobId}/apply/`, {
          method: "POST",
          auth: false,
          body: { worker_username: currentWorker.username, worker_role: "worker", note: "" },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to apply for this job."));
        }
        const appliedAt = data?.applied_at || (/* @__PURE__ */ new Date()).toLocaleString("en-PH");
        const application = {
          id: data?.id || `application-${job.id}-${currentWorker.id}-${Date.now()}`,
          workerId: data?.worker || currentWorker.id,
          workerName: data?.worker_name || getDisplayName(currentWorker.firstName, currentWorker.lastName, currentWorker.username),
          workerUsername: data?.worker_username || currentWorker.username,
          appliedAt,
          status: "Pending",
        };
        setPostedJobs((prev) => prev.map((item) => item.id === jobId ? { ...item, applications: [...item.applications || [], application] } : item));
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert("Application sent to the household.");
        setView("worker-applications");
      } catch (error) {
        const appliedAt = (/* @__PURE__ */ new Date()).toLocaleString("en-PH");
        const application = { id: `application-${job.id}-${currentWorker.id}-${Date.now()}`, workerId: currentWorker.id, workerName: getDisplayName(currentWorker.firstName, currentWorker.lastName, currentWorker.username), workerUsername: currentWorker.username, appliedAt, status: "Pending" };
        setPostedJobs((prev) => prev.map((item) => item.id === jobId ? { ...item, applications: [...item.applications || [], application] } : item));
        window.alert(error.message || "Application sent locally.");
        setView("worker-applications");
      }
    })();
  }
  function openHouseholdNotificationWorker(notification) {
    if (!notification?.workerId) return;
    markNotificationRead(notification.id);
    openMatchedWorkerProfile(notification.workerId, notification.jobId);
  }
  function openMatchedWorkerProfile(workerId, jobId = selectedJob?.id) {
    setSelectedWorkerId(workerId);
    if (jobId) {
      setSelectedJobId(jobId);
    }
    setView("household-worker-profile");
  }
  function handleHireWorker() {
    if (!currentHousehold) {
      window.alert("Please login as a household first.");
      return;
    }
    if (!selectedWorker) {
      window.alert("Worker profile not found.");
      return;
    }
    if (selectedWorker.verification !== "Verified") {
      window.alert("This worker must be verified before they can be hired.");
      return;
    }
    if (!selectedJob) {
      window.alert("Please select a job first.");
      return;
    }
    if (getHiredWorkerCount(selectedJob) >= getWorkersNeeded(selectedJob)) {
      window.alert("This job already has enough hired workers.");
      return;
    }
    const existingApplication = findJobApplicationForWorker(selectedJob, selectedWorker);
    if (existingApplication?.status === "Hired") {
      window.alert("This worker is already hired for this job.");
      return;
    }
    (async () => {
      const hiredAt = (/* @__PURE__ */ new Date()).toLocaleString("en-PH");
      const applicationRecord = existingApplication ? { ...existingApplication, status: "Hired", hiredAt } : { id: `application-${selectedJob.id}-${selectedWorker.id}-${Date.now()}`, workerId: selectedWorker.id, workerName: getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username), workerUsername: selectedWorker.username, appliedAt: hiredAt, hiredAt, status: "Hired" };
      const applicationStatusTargetId = isNumericIdentifier(existingApplication?.id) ? existingApplication.id : selectedJob.id;
      try {
        const response = await apiRequest(`jobs/applications/${applicationStatusTargetId}/status/`, {
          method: "PATCH",
          auth: false,
          body: { household_username: currentHousehold.username, status: "hired", job_id: selectedJob.id, worker_username: selectedWorker.username, worker_role: "worker" },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to hire worker."));
        }
        const normalizedApplication = normalizeBackendApplication(data);
        setPostedJobs((prev) => prev.map((job) => {
          if (job.id !== selectedJob.id) {
            return job;
          }
          const nextApplication = normalizedApplication || applicationRecord;
          const applications = existingApplication ? (job.applications || []).map((application) => {
            const matchesWorkerId = application.workerId != null && String(application.workerId) === String(selectedWorker.id);
            const matchesWorkerUsername = application.workerUsername && selectedWorker.username && application.workerUsername === selectedWorker.username;
            return matchesWorkerId || matchesWorkerUsername ? nextApplication : application;
          }) : [...job.applications || [], nextApplication];
          const nextJob = { ...job, cancellationReason: "", selectedWorkerId: selectedWorker.id, selectedWorkerName: getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username), hiredAt, applications };
          const isFilled = getHiredWorkerCount(nextJob) >= getWorkersNeeded(nextJob);
          return { ...nextJob, status: isFilled ? "Already found a worker" : "Open", applications: isFilled ? applications.map((application) => application.status === "Pending" ? { ...application, status: "Closed" } : application) : applications };
        }));
        setRegisteredWorkers((prev) => prev.map((worker) => worker.id === selectedWorker.id ? { ...worker, status: "Hired", hiredBy: currentHousehold.username, hiredJobId: selectedJob.id, applicationNotifications: [...worker.applicationNotifications || [], { id: `hired-${selectedJob.id}-${selectedWorker.id}-${Date.now()}`, title: "You were hired", message: `${getDisplayName(currentHousehold.firstName, currentHousehold.lastName, currentHousehold.username)} hired you for ${selectedJob.jobTitle || selectedJob.serviceType}.`, date: hiredAt, unread: true }] } : worker));
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert(`${getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username)} has been hired for ${selectedJob.jobTitle || selectedJob.serviceType}.`);
        setView("household-my-jobs");
      } catch (error) {
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert(error.message || "Unable to hire worker.");
      }
    })();
  }
  function handleRejectApplication(workerId = selectedWorker?.id, jobId = selectedJob?.id) {
    const job = postedJobs.find((item) => item.id === jobId);
    const worker = registeredWorkers.find((item) => String(item.id) === String(workerId)) || selectedWorker || null;
    if (!job || !worker) {
      window.alert("Application not found.");
      return;
    }
    const existingApplication = findJobApplicationForWorker(job, worker);
    if (!existingApplication) {
      window.alert("Only workers who applied to this job can be rejected.");
      return;
    }
    if (existingApplication.status === "Hired") {
      window.alert("This worker is already hired and cannot be rejected from this application.");
      return;
    }
    (async () => {
      const rejectedAt = (/* @__PURE__ */ new Date()).toLocaleString("en-PH");
      const message = `Thank you for applying to ${job.jobTitle || job.serviceType}. The household chose another applicant for now, but you can still apply to other open jobs.`;
      const applicationStatusTargetId = isNumericIdentifier(existingApplication?.id) ? existingApplication.id : job.id;
      try {
        const response = await apiRequest(`jobs/applications/${applicationStatusTargetId}/status/`, {
          method: "PATCH",
          auth: false,
          body: { household_username: currentHousehold?.username || currentUser?.username || "", status: "rejected", job_id: job.id, worker_username: worker.username, worker_role: "worker" },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to reject application."));
        }
        const normalizedApplication = normalizeBackendApplication(data);
        setPostedJobs((prev) => prev.map((item) => item.id === jobId ? {
          ...item,
          applications: (item.applications || []).map((application) => {
            const matchesWorkerId = application.workerId != null && String(application.workerId) === String(worker.id);
            const matchesWorkerUsername = application.workerUsername && worker.username && application.workerUsername === worker.username;
            return matchesWorkerId || matchesWorkerUsername ? { ...(normalizedApplication || application), status: "Rejected", rejectedAt, rejectionMessage: message } : application;
          }),
        } : item));
        setRegisteredWorkers((prev) => prev.map((item) => item.id === workerId ? { ...item, applicationNotifications: [...item.applicationNotifications || [], { id: `rejected-${jobId}-${workerId}-${Date.now()}`, title: "Application update", message, date: rejectedAt, unread: true }] } : item));
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert(message);
        setView("household-my-jobs");
      } catch (error) {
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert(error.message || "Unable to reject application.");
      }
    })();
  }
  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  }
  function handleForgotPasswordChange(event) {
    const { name, value } = event.target;
    setForgotPasswordForm((prev) => ({ ...prev, [name]: value }));
  }
  async function handleForgotPasswordEmailSubmit(event) {
    event.preventDefault();
    const email = forgotPasswordForm.email.trim();
    if (!isValidGmailAddress(email)) {
      setForgotPasswordError("Please enter a valid Gmail address.");
      return;
    }
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    setForgotPasswordNotice("");
    try {
      const response = await apiRequest("accounts/forgot-password/", {
        method: "POST",
        auth: false,
        body: { email },
      });
      const data = await readResponseData(response);
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to send reset code.");
      }
      setForgotPasswordStep("verify");
      setForgotPasswordNotice(data?.detail || "Reset code sent to your email.");
    } catch (error) {
      setForgotPasswordError(error.message || "Unable to send reset code.");
    } finally {
      setForgotPasswordLoading(false);
    }
  }
  async function handleVerifyResetToken(event) {
    event.preventDefault();
    const email = forgotPasswordForm.email.trim();
    const token = forgotPasswordForm.token.trim();
    if (!email || !token) {
      setForgotPasswordError("Please enter the email and reset code.");
      return;
    }
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    setForgotPasswordNotice("");
    try {
      const response = await apiRequest("accounts/verify-reset-token/", {
        method: "POST",
        auth: false,
        body: { email, token },
      });
      const data = await readResponseData(response);
      if (!response.ok) {
        throw new Error(data?.detail || "Invalid reset code.");
      }
      setForgotPasswordStep("reset");
      setForgotPasswordNotice(data?.detail || "Code verified.");
    } catch (error) {
      setForgotPasswordError(error.message || "Invalid reset code.");
    } finally {
      setForgotPasswordLoading(false);
    }
  }
  async function handleResetPassword(event) {
    event.preventDefault();
    const { email, token, newPassword, confirmPassword } = forgotPasswordForm;
    if (!newPassword || newPassword.length < 8) {
      setForgotPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotPasswordError("Passwords do not match.");
      return;
    }
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    setForgotPasswordNotice("");
    try {
      const response = await apiRequest("accounts/reset-password/", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), token: token.trim(), new_password: newPassword },
      });
      const data = await readResponseData(response);
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to reset password.");
      }
      setForgotPasswordNotice(data?.detail || "Password reset successful.");
      setForgotPasswordStep("done");
    } catch (error) {
      setForgotPasswordError(error.message || "Unable to reset password.");
    } finally {
      setForgotPasswordLoading(false);
    }
  }
  function handleWorkerChange(event) {
    const { name, value } = event.target;
    if (name === "phone") {
      setWorkerForm((prev) => ({ ...prev, phone: sanitizePhilippinesPhone(value) }));
      return;
    }
    if (name === "customSkill") {
      setWorkerForm((prev) => ({ ...prev, customSkill: value }));
      return;
    }
    setWorkerForm((prev) => ({ ...prev, [name]: value }));
  }
  function handleHouseholdChange(event) {
    const { name, value } = event.target;
    if (name === "phone") {
      setHouseholdForm((prev) => ({ ...prev, phone: sanitizePhilippinesPhone(value) }));
      return;
    }
    setHouseholdForm((prev) => ({ ...prev, [name]: value }));
  }
  function handleHouseholdProfileChange(event) {
    const { name, value, files } = event.target;
    if (name === "profilePhoto") {
      const file = files?.[0];
      setHouseholdProfileForm((prev) => ({ ...prev, profilePhotoName: file?.name || "", profilePhotoPreview: file ? URL.createObjectURL(file) : "" }));
      return;
    }
    setHouseholdProfileForm((prev) => ({ ...prev, [name]: value }));
  }
  function handleHouseholdJobChange(event) {
    const { name, value } = event.target;
    if (name === "barangay") {
      setHouseholdJobForm((prev) => ({ ...prev, barangay: value, streetAddress: value ? `Barangay ${value}, Tayabas City` : prev.streetAddress }));
      if (value) {
        syncHouseholdJobBarangayLocation(value);
      } else {
        setHouseholdJobCoordinates(null);
        setHouseholdJobLocationPreview(null);
      }
      return;
    }
    if (name === "streetAddress") {
      setHouseholdJobCoordinates(null);
      setHouseholdJobLocationPreview(null);
    }
    setHouseholdJobForm((prev) => ({ ...prev, [name]: value }));
  }
  function handleWorkerProfileChange(event) {
    const { name, value, type, checked, files } = event.target;
    if (name === "profilePhoto") {
      const file = files?.[0];
      setWorkerProfileForm((prev) => ({ ...prev, profilePhotoPreview: file ? URL.createObjectURL(file) : "" }));
      return;
    }
    setWorkerProfileForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }
  function handleVerificationChange(event) {
    const { name, value, files } = event.target;
    if (name === "primaryId") {
      const file = files?.[0];
      setVerificationForm((prev) => ({ ...prev, primaryIdName: file?.name || "", primaryIdPreview: file ? URL.createObjectURL(file) : "" }));
      return;
    }
    if (name === "secondaryDoc") {
      const file = files?.[0];
      setVerificationForm((prev) => ({ ...prev, secondaryDocName: file?.name || "", secondaryDocPreview: file ? URL.createObjectURL(file) : "" }));
      return;
    }
    setVerificationForm((prev) => ({ ...prev, [name]: value }));
  }
  function toggleSkill(skill) {
    setWorkerForm((prev) => {
      const exists = prev.skills.includes(skill);
      return { ...prev, skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill] };
    });
  }
  function toggleWorkerProfileSkill(skill) {
    setWorkerProfileForm((prev) => {
      const exists = prev.skills.includes(skill);
      return { ...prev, skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill] };
    });
  }
  function handleLoginSubmit(event) {
    event.preventDefault();
    const username = loginForm.username.trim();
    const demoPassword = loginForm.password.trim();
    const normalizedUsername = username.toLowerCase();
    const isSuperAdminLogin = normalizedUsername === SUPER_ADMIN_ACCOUNT.username && demoPassword === SUPER_ADMIN_ACCOUNT.password;
    if (!username || !loginForm.password) {
      window.alert("Please enter your username and password.");
      return;
    }
    if (isSuperAdminLogin) {
      clearAuthToken();
      setCurrentUser({ role: "admin", username: SUPER_ADMIN_ACCOUNT.username, displayName: SUPER_ADMIN_ACCOUNT.displayName, isSuperAdmin: true });
      setSuperAdminSection("verification");
      setView("superadmin-dashboard");
      return;
    }
    (async () => {
      try {
        const response = await apiRequest("accounts/login/", {
          method: "POST",
          auth: false,
          body: { username, password: loginForm.password },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(data?.detail || "Login failed.");
        }
        setAuthToken(data?.access || "");
        const resolvedRole = data?.role || loginForm.role || "worker";
        setCurrentUser({
          id: data?.id || data?.user_id || username,
          role: resolvedRole,
          username: data?.username || username,
          email: data?.email || "",
          first_name: data?.profile?.username ? "" : "",
          last_name: "",
          displayName: data?.display_name || data?.username || username,
          profile: data?.profile || null,
          is_staff: Boolean(data?.is_staff),
        });
        const backendWorker = normalizeBackendWorkerPayload({
          user: {
            id: data?.id || data?.user_id || username,
            username: data?.username || username,
            email: data?.email || "",
            first_name: data?.profile?.full_name ? "" : "",
            last_name: "",
            display_name: data?.display_name || data?.username || username,
            is_staff: Boolean(data?.is_staff),
          },
          profile: data?.profile || null,
        });
        if (backendWorker) {
          mergeBackendWorkerIntoState(backendWorker);
        }
        setView(resolvedRole === "superadmin" ? "superadmin-dashboard" : resolvedRole === "admin" ? "admin-dashboard" : resolvedRole === "household" ? "household-dashboard" : "worker-dashboard");
      } catch (error) {
        if (loginForm.role === "worker") {
          const worker = registeredWorkers.find((item) => item.username.toLowerCase() === username.toLowerCase());
          if (!worker || worker.password !== loginForm.password) {
            window.alert(error.message || "Worker account not found. Please register first.");
            return;
          }
          clearAuthToken();
          setCurrentUser({ role: "worker", username: worker.username, displayName: getDisplayName(worker.firstName, worker.lastName, worker.username) });
          setView("worker-dashboard");
          return;
        }
        const household = registeredHouseholds.find((item) => item.username.toLowerCase() === username.toLowerCase());
        if (!household || household.password !== loginForm.password) {
          window.alert(error.message || "Household account not found. Please register first.");
          return;
        }
        clearAuthToken();
        setCurrentUser({ role: "household", username: household.username, displayName: getDisplayName(household.firstName, household.lastName, household.username) });
        setView("household-dashboard");
      }
    })();
  }
  function handleWorkerRegisterSubmit(event) {
    event.preventDefault();
    const requiredFields = [workerForm.firstName, workerForm.lastName, workerForm.username, workerForm.email, workerForm.phone, workerForm.barangay, workerForm.streetAddress, workerForm.password, workerForm.confirmPassword];
    if (requiredFields.some((field) => !String(field || "").trim())) {
      window.alert("Please complete all required fields.");
      return;
    }
    if (!isValidGmailAddress(workerForm.email)) {
      window.alert("Please enter a complete Gmail address, for example example@gmail.com.");
      return;
    }
    if (workerForm.password.length < 8) {
      window.alert("Password must be at least 8 characters long.");
      return;
    }
    if (workerForm.password !== workerForm.confirmPassword) {
      window.alert("Worker passwords do not match.");
      return;
    }
    const usernameTaken = registeredWorkers.some((item) => item.username.toLowerCase() === workerForm.username.trim().toLowerCase());
    if (usernameTaken) {
      window.alert("Username already exists for a worker account.");
      return;
    }
    (async () => {
      try {
        const resolvedLocation = await resolveLocationCoordinates(workerForm.barangay, workerForm.streetAddress, false);
        const response = await apiRequest("accounts/register/", {
          method: "POST",
          auth: false,
          body: {
            username: workerForm.username.trim(),
            email: workerForm.email.trim(),
            password: workerForm.password,
            first_name: workerForm.firstName.trim(),
            last_name: workerForm.lastName.trim(),
            role: "worker",
            phone: workerForm.phone.trim(),
            bio: workerForm.bio.trim(),
            years_experience: Number(workerForm.yearsExperience || 0),
            skills: Array.from(new Set([...workerForm.skills || [], ...(workerForm.customSkill.trim() ? [workerForm.customSkill.trim()] : [])])),
            hourly_rate: workerForm.hourlyRate,
            daily_rate: workerForm.dailyRate,
            location_label: resolvedLocation?.locationLabel || formatLocation(workerForm.barangay, workerForm.streetAddress),
            latitude: resolvedLocation?.latitude ?? null,
            longitude: resolvedLocation?.longitude ?? null,
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to create worker account."));
        }
        const backendWorker = normalizeBackendWorkerPayload({ user: data?.user, profile: data?.profile });
        const workerAccount = {
          ...workerForm,
          skills: Array.from(new Set([...workerForm.skills || [], ...(workerForm.customSkill.trim() ? [workerForm.customSkill.trim()] : [])])),
          id: Date.now(),
          username: workerForm.username.trim(),
          verification: "Not Yet Verified",
          rating: "No ratings yet",
          reviewsDone: 0,
          status: "Available",
          distanceKm: "0.00",
          latitude: resolvedLocation?.latitude ?? null,
          longitude: resolvedLocation?.longitude ?? null,
          avatar: (workerForm.firstName || workerForm.username || "W").slice(0, 1).toUpperCase(),
          receivedReviews: [],
          givenFeedback: [],
          verificationNotifications: [],
          applicationNotifications: [],
        };
        setRegisteredWorkers((prev) => [backendWorker || workerAccount, ...prev.filter((item) => item.username?.toLowerCase() !== workerAccount.username.toLowerCase())]);
        setWorkerForm(EMPTY_WORKER_FORM);
        setLoginForm({ username: "", password: "", role: "worker" });
        setView("login");
        window.alert(data?.detail || "Worker account created. You can now login.");
      } catch (error) {
        window.alert(error.message || "Unable to create worker account.");
      }
    })();
  }
  function handleHouseholdRegisterSubmit(event) {
    event.preventDefault();
    const requiredFields = [householdForm.firstName, householdForm.lastName, householdForm.username, householdForm.email, householdForm.phone, householdForm.barangay, householdForm.streetAddress, householdForm.password, householdForm.confirmPassword];
    if (requiredFields.some((field) => !String(field || "").trim())) {
      window.alert("Please complete all required fields.");
      return;
    }
    if (!isValidGmailAddress(householdForm.email)) {
      window.alert("Please enter a complete Gmail address, for example example@gmail.com.");
      return;
    }
    if (householdForm.password.length < 8) {
      window.alert("Password must be at least 8 characters long.");
      return;
    }
    if (householdForm.password !== householdForm.confirmPassword) {
      window.alert("Household passwords do not match.");
      return;
    }
    const usernameTaken = registeredHouseholds.some((item) => item.username.toLowerCase() === householdForm.username.trim().toLowerCase());
    if (usernameTaken) {
      window.alert("Username already exists for a household account.");
      return;
    }
    (async () => {
      try {
        const resolvedLocation = await resolveLocationCoordinates(householdForm.barangay, householdForm.streetAddress, false);
        const response = await apiRequest("accounts/register/", {
          method: "POST",
          auth: false,
          body: {
            username: householdForm.username.trim(),
            email: householdForm.email.trim(),
            password: householdForm.password,
            first_name: householdForm.firstName.trim(),
            last_name: householdForm.lastName.trim(),
            role: "household",
            phone: householdForm.phone.trim(),
            location_label: resolvedLocation?.locationLabel || formatLocation(householdForm.barangay, householdForm.streetAddress),
            latitude: resolvedLocation?.latitude ?? null,
            longitude: resolvedLocation?.longitude ?? null,
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to create household account."));
        }
        const householdAccount = {
          ...householdForm,
          id: Date.now(),
          username: householdForm.username.trim(),
          latitude: resolvedLocation?.latitude ?? null,
          longitude: resolvedLocation?.longitude ?? null,
        };
        setRegisteredHouseholds((prev) => [...prev, householdAccount]);
        setHouseholdForm(EMPTY_HOUSEHOLD_FORM);
        setLoginForm({ username: "", password: "", role: "household" });
        setView("login");
        window.alert(data?.detail || "Household account created. You can now login.");
      } catch (error) {
        window.alert(error.message || "Unable to create household account.");
      }
    })();
  }
  function handleWorkerProfileSave(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "worker") {
      window.alert("No worker account is currently logged in.");
      return;
    }
    (async () => {
      const resolvedLocation = await resolveLocationCoordinates(workerProfileForm.barangay, workerProfileForm.streetAddress, false);
      const nextWorkerPatch = {
        firstName: workerProfileForm.firstName,
        lastName: workerProfileForm.lastName,
        email: workerProfileForm.email,
        phone: workerProfileForm.phone,
        barangay: workerProfileForm.barangay,
        streetAddress: workerProfileForm.streetAddress,
        bio: workerProfileForm.bio,
        hourlyRate: workerProfileForm.hourlyRate,
        dailyRate: workerProfileForm.dailyRate,
        yearsExperience: workerProfileForm.yearsExperience,
        skills: workerProfileForm.skills,
        latitude: resolvedLocation?.latitude ?? currentWorker?.latitude ?? null,
        longitude: resolvedLocation?.longitude ?? currentWorker?.longitude ?? null,
      };
      try {
        if (getAuthToken()) {
          const response = await apiRequest("accounts/me/", {
            method: "PATCH",
            auth: true,
            body: {
              first_name: workerProfileForm.firstName,
              last_name: workerProfileForm.lastName,
              email: workerProfileForm.email,
              phone: workerProfileForm.phone,
              bio: workerProfileForm.bio,
              years_experience: Number(workerProfileForm.yearsExperience || 0),
              role: "worker",
              skills: workerProfileForm.skills,
              hourly_rate: workerProfileForm.hourlyRate,
              daily_rate: workerProfileForm.dailyRate,
              location_label: resolvedLocation?.locationLabel || formatLocation(workerProfileForm.barangay, workerProfileForm.streetAddress),
              latitude: nextWorkerPatch.latitude,
              longitude: nextWorkerPatch.longitude,
            },
          });
          const data = await readResponseData(response);
          if (!response.ok) {
            throw new Error(getApiErrorMessage(data, "Unable to update worker profile."));
          }
          const backendWorker = normalizeBackendWorkerPayload({ user: data?.user || { username: currentUser.username, email: workerProfileForm.email, first_name: workerProfileForm.firstName, last_name: workerProfileForm.lastName }, profile: data?.profile });
          if (backendWorker) {
            mergeBackendWorkerIntoState({ ...backendWorker, profilePhotoPreview: workerProfileForm.profilePhotoPreview || backendWorker.profilePhotoPreview || "" });
          }
        }
        setRegisteredWorkers((prev) => prev.map((item) => {
          if (item.username !== currentUser.username) {
            return item;
          }
          return { ...item, ...nextWorkerPatch, profilePhotoPreview: workerProfileForm.profilePhotoPreview || item.profilePhotoPreview || "", receivedReviews: item.receivedReviews || [], givenFeedback: item.givenFeedback || [] };
        }));
        setCurrentUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            displayName: getDisplayName(workerProfileForm.firstName, workerProfileForm.lastName, workerProfileForm.username),
            profile: prev.profile ? {
              ...prev.profile,
              phone: workerProfileForm.phone,
              bio: workerProfileForm.bio,
              years_experience: Number(workerProfileForm.yearsExperience || 0),
              skills: workerProfileForm.skills,
              hourly_rate: workerProfileForm.hourlyRate,
              daily_rate: workerProfileForm.dailyRate,
              location_label: resolvedLocation?.locationLabel || formatLocation(workerProfileForm.barangay, workerProfileForm.streetAddress),
              latitude: nextWorkerPatch.latitude,
              longitude: nextWorkerPatch.longitude,
            } : prev.profile,
          };
        });
        window.alert("Worker profile updated.");
      } catch (error) {
        window.alert(error.message || "Unable to update worker profile.");
      }
    })();
  }
  function handleVerificationSubmit(event) {
    event.preventDefault();
    if (!verificationForm.primaryIdName || !verificationForm.secondaryDocName) {
      window.alert("Please upload both required verification documents.");
      return;
    }
    const worker = currentWorker;
    if (!worker) {
      window.alert("Please login as a worker first.");
      return;
    }
    (async () => {
      const requestRecord = {
        worker_username: worker.username,
        primary_id_name: verificationForm.primaryIdName,
        secondary_doc_name: verificationForm.secondaryDocName,
        primary_id_preview: verificationForm.primaryIdPreview,
        secondary_doc_preview: verificationForm.secondaryDocPreview,
        notes: verificationForm.notes,
      };
      try {
        const response = await apiRequest("common/verification-requests/", {
          method: "POST",
          auth: false,
          body: requestRecord,
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to submit verification request."));
        }
        const normalizedRequest = normalizeVerificationRequest(data.verification_request || data);
        const backendWorker = normalizeBackendWorkerPayload(data.worker);
        setVerificationRequests((prev) => {
          const existingIndex = prev.findIndex((item) => item.workerUsername === worker.username && item.status !== "Rejected");
          if (existingIndex >= 0) {
            return prev.map((item, index) => (index === existingIndex ? normalizedRequest : item));
          }
          return [normalizedRequest, ...prev];
        });
        if (backendWorker) {
          mergeBackendWorkerIntoState({
            ...backendWorker,
            verification: "Under Review",
            verificationRequestId: normalizedRequest.id,
            verificationSubmission: normalizedRequest,
            verificationNotifications: [{ id: `submission-${normalizedRequest.id}`, title: "Verification Submitted", message: "Your documents were sent to the admin for review.", date: normalizedRequest.submittedAt || (new Date()).toLocaleString("en-PH"), unread: true }],
          });
        } else {
          setRegisteredWorkers((prev) => prev.map((item) => item.username === worker.username ? { ...item, verification: "Under Review", verificationRequestId: normalizedRequest.id, verificationSubmission: normalizedRequest, verificationNotifications: [{ id: `submission-${normalizedRequest.id}`, title: "Verification Submitted", message: "Your documents were sent to the admin for review.", date: normalizedRequest.submittedAt || (new Date()).toLocaleString("en-PH"), unread: true }] } : item));
        }
        setCurrentUser((prev) => prev ? { ...prev, profile: data?.worker?.profile || (prev.profile ? { ...prev.profile, verification_status: "pending", verification_request: normalizedRequest } : prev.profile) } : prev);
        await refreshVerificationStateFromBackend();
        window.alert("Verification request submitted. Status is now Under Review.");
      } catch (error) {
        window.alert(error.message || "Verification documents submitted. Please wait for admin review.");
      }
    })();
  }
  function handleHouseholdProfileSave(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "household") {
      window.alert("No household account is currently logged in.");
      return;
    }
    setRegisteredHouseholds((prev) => prev.map((item) => {
      if (item.username !== currentUser.username) {
        return item;
      }
      return { ...item, firstName: householdProfileForm.firstName, lastName: householdProfileForm.lastName, email: householdProfileForm.email, phone: householdProfileForm.phone, barangay: householdProfileForm.barangay, streetAddress: householdProfileForm.streetAddress, profilePhotoName: householdProfileForm.profilePhotoName || item.profilePhotoName || "", profilePhotoPreview: householdProfileForm.profilePhotoPreview || item.profilePhotoPreview || "", receivedFeedback: item.receivedFeedback || [] };
    }));
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        barangay: householdProfileForm.barangay,
        streetAddress: householdProfileForm.streetAddress,
        displayName: getDisplayName(householdProfileForm.firstName, householdProfileForm.lastName, householdProfileForm.username),
        profile: prev.profile ? { ...prev.profile, location_label: formatLocation(householdProfileForm.barangay, householdProfileForm.streetAddress) } : prev.profile,
      };
    });
    setPostedJobs((prev) => prev.map((job) => {
      if (job.householdUsername !== currentUser.username) {
        return job;
      }
      return { ...job, householdName: getDisplayName(householdProfileForm.firstName, householdProfileForm.lastName, householdProfileForm.username) };
    }));
    window.alert("Household profile updated.");
  }
  function handleCancelJob(jobId) {
    const job = postedJobs.find((item) => item.id === jobId);
    if (!job) {
      return;
    }
    (async () => {
      try {
        const response = await apiRequest(`jobs/${jobId}/`, {
          method: "PATCH",
          auth: false,
          body: { household_username: currentHousehold?.username || currentUser?.username || "", status: "cancelled" },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to cancel job."));
        }
        const normalizedJob = normalizeBackendJob(data);
        if (normalizedJob) {
          setPostedJobs((prev) => prev.map((item) => item.id === normalizedJob.id ? normalizedJob : item));
        }
        await refreshJobsFromBackend();
      } catch (error) {
        setPostedJobs((prev) => prev.filter((jobRecord) => jobRecord.id !== jobId));
      } finally {
        if (selectedJobId === jobId) {
          setSelectedJobId(null);
        }
      }
    })();
  }
  function handleHouseholdReviewSubmit(event) {
    event.preventDefault();
    if (!currentHousehold || !selectedWorker) {
      window.alert("Select a worker first.");
      return;
    }
    const review = normalizeReview({
      id: `review-${Date.now()}`,
      authorRole: "household",
      authorName: getDisplayName(currentHousehold.firstName, currentHousehold.lastName, currentHousehold.username),
      targetName: getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username),
      rating: Number(householdReviewForm.rating),
      feedback: householdReviewForm.feedback.trim(),
      jobTitle: selectedJob?.jobTitle || selectedJob?.serviceType || "",
      createdAt: new Date().toLocaleString("en-PH"),
    });
    (async () => {
      try {
        const response = await apiRequest("reviews/", {
          method: "POST",
          auth: false,
          body: {
            author_username: currentHousehold.username,
            target_username: selectedWorker.username,
            job_title: selectedJob?.jobTitle || selectedJob?.serviceType || "",
            rating: Number(householdReviewForm.rating),
            feedback: householdReviewForm.feedback.trim(),
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to submit review."));
        }
        setHouseholdReviewForm(EMPTY_HOUSEHOLD_REVIEW_FORM);
        await refreshReviewsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert("Review submitted for the worker.");
      } catch (error) {
        setRegisteredWorkers((prev) => prev.map((worker) => worker.id === selectedWorker.id ? { ...worker, receivedReviews: [...worker.receivedReviews || [], review], rating: review.rating || worker.rating, reviewsDone: (worker.reviewsDone || 0) + 1 } : worker));
        setRegisteredHouseholds((prev) => prev.map((household) => household.username === currentUser.username ? { ...household, givenFeedback: [...household.givenFeedback || [], review] } : household));
        setHouseholdReviewForm(EMPTY_HOUSEHOLD_REVIEW_FORM);
        window.alert(error.message || "Review submitted locally.");
      }
    })();
  }
  function handleWorkerFeedbackSubmit(event) {
    event.preventDefault();
    if (!currentWorker || !selectedJob) {
      window.alert("Select a completed job first.");
      return;
    }
    const household = registeredHouseholds.find((item) => item.username === selectedJob.householdUsername);
    if (!household) {
      window.alert("Household profile not found.");
      return;
    }
    const review = normalizeReview({
      id: `feedback-${Date.now()}`,
      authorRole: "worker",
      authorName: getDisplayName(currentWorker.firstName, currentWorker.lastName, currentWorker.username),
      targetName: getDisplayName(household.firstName, household.lastName, household.username),
      rating: null,
      feedback: workerFeedbackForm.feedback.trim(),
      jobTitle: selectedJob?.jobTitle || selectedJob?.serviceType || "",
      createdAt: new Date().toLocaleString("en-PH"),
    });
    (async () => {
      try {
        const response = await apiRequest("reviews/", {
          method: "POST",
          auth: false,
          body: {
            author_username: currentWorker.username,
            target_username: household.username,
            job_title: selectedJob?.jobTitle || selectedJob?.serviceType || "",
            feedback: workerFeedbackForm.feedback.trim(),
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to submit feedback."));
        }
        setWorkerFeedbackForm(EMPTY_WORKER_FEEDBACK_FORM);
        await refreshReviewsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert("Feedback submitted for the household.");
      } catch (error) {
        setRegisteredHouseholds((prev) => prev.map((item) => item.username === household.username ? { ...item, receivedFeedback: [...item.receivedFeedback || [], review] } : item));
        setRegisteredWorkers((prev) => prev.map((worker) => worker.id === currentWorker.id ? { ...worker, givenFeedback: [...worker.givenFeedback || [], review] } : worker));
        setWorkerFeedbackForm(EMPTY_WORKER_FEEDBACK_FORM);
        window.alert(error.message || "Feedback submitted locally.");
      }
    })();
  }
  function handleHouseholdJobSubmit(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "household") {
      window.alert("Please login as a household account first.");
      return;
    }
    if (!householdJobForm.serviceType || !householdJobForm.preferredDate || !householdJobForm.preferredTime || getWorkersNeeded(householdJobForm) < 1) {
      window.alert("Please complete the service type, preferred date, preferred time, and number of workers needed.");
      return;
    }
    (async () => {
      const resolvedLocation = householdJobLocationPreview || await resolveLocationCoordinates(householdJobForm.barangay, householdJobForm.streetAddress, true);
      const scheduledLabel = `${formatScheduleLabel(householdJobForm.scheduleType)}${householdJobForm.preferredDate ? ` on ${householdJobForm.preferredDate}` : ""}${householdJobForm.preferredTime ? ` at ${householdJobForm.preferredTime}` : ""}`;
      const resolvedLatitude = resolvedLocation?.latitude ?? householdJobCoordinates?.latitude ?? currentUser?.profile?.latitude ?? currentHousehold?.latitude ?? null;
      const resolvedLongitude = resolvedLocation?.longitude ?? householdJobCoordinates?.longitude ?? currentUser?.profile?.longitude ?? currentHousehold?.longitude ?? null;
      if (resolvedLatitude == null || resolvedLongitude == null) {
        window.alert("Location is required before posting a job. Click 'Use My Current Location' or complete the barangay and street fields so we can estimate the map location first.");
        return;
      }
      if (resolvedLocation) {
        setHouseholdJobLocationPreview(resolvedLocation);
        setHouseholdJobCoordinates({ latitude: resolvedLatitude, longitude: resolvedLongitude });
      }
      const payload = {
        household_username: currentHousehold?.username || currentUser.username,
        title: householdJobForm.jobTitle.trim() || householdJobForm.serviceType,
        job_type: householdJobForm.serviceType,
        required_skill: householdJobForm.serviceType,
        schedule: scheduledLabel,
        description: householdJobForm.description.trim(),
        location_label: resolvedLocation?.locationLabel || formatLocation(householdJobForm.barangay.trim(), householdJobForm.streetAddress.trim()),
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        service_rate: householdJobForm.offeredRate,
        worker_slots: getWorkersNeeded(householdJobForm),
      };
      try {
        const response = await apiRequest("jobs/", {
          method: "POST",
          auth: false,
          body: payload,
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to post job."));
        }
        const normalizedJob = normalizeBackendJob(data);
        if (normalizedJob) {
          setPostedJobs((prev) => [normalizedJob, ...prev.filter((job) => job.id !== normalizedJob.id)]);
          setSelectedJobId(normalizedJob.id);
          await refreshRecommendedWorkers(normalizedJob.id);
        }
        await refreshJobsFromBackend();
        window.alert("Job posted successfully.");
      } catch (error) {
        const newJob = createJobRecord({ ...householdJobForm, latitude: resolvedLatitude, longitude: resolvedLongitude }, currentHousehold, Date.now());
        setPostedJobs((prev) => [newJob, ...prev]);
        setSelectedJobId(newJob.id);
        window.alert(error.message || "Job posted locally.");
      } finally {
        const savedLocation = getSavedHouseholdLocation(currentHousehold, currentUser);
        setHouseholdJobCoordinates(null);
        setHouseholdJobLocationPreview(null);
        setHouseholdJobForm({ jobTitle: "", serviceType: "", scheduleType: "One - Time", preferredDate: "", preferredTime: "", description: "", barangay: savedLocation.barangay, streetAddress: savedLocation.streetAddress, offeredRate: "0.00", rateType: "Per Day", workersNeeded: "1" });
        setView("household-my-jobs");
      }
    })();
  }
  function handleAdminApproveVerification(requestId) {
    const request = verificationRequests.find((item) => item.id === requestId);
    if (!request) return;
    (async () => {
      try {
        const response = await apiRequest(`common/verification-requests/${requestId}/review/`, {
          method: "POST",
          auth: false,
          body: { action: "approve", reviewed_by: currentUser?.displayName || "Super Admin" },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to approve verification request."));
        }
        const normalizedRequest = normalizeVerificationRequest(data.verification_request || data);
        const reviewedAt = normalizedRequest.reviewedAt || (/* @__PURE__ */ new Date()).toLocaleString("en-PH");
        const backendWorker = normalizeBackendWorkerPayload(data.worker);
        setVerificationRequests((prev) => prev.map((item) => item.id === requestId ? normalizedRequest : item));
        if (backendWorker) {
          mergeBackendWorkerIntoState({ ...backendWorker, verification: "Verified", verificationReviewedAt: reviewedAt, verificationReviewedBy: currentUser?.displayName || "Admin", profilePhotoPreview: normalizedRequest.primaryIdPreview || backendWorker.profilePhotoPreview || "", verificationNotifications: [{ id: `approved-${normalizedRequest.id}`, title: "Verified", message: "Your worker account has been verified by the admin.", date: reviewedAt, unread: true }] });
        } else {
          setRegisteredWorkers((prev) => prev.map((worker) => worker.id === normalizedRequest.workerId ? { ...worker, verification: "Verified", verificationReviewedAt: reviewedAt, verificationReviewedBy: currentUser?.displayName || "Admin", profilePhotoPreview: normalizedRequest.primaryIdPreview || worker.profilePhotoPreview || "", verificationNotifications: [{ id: `approved-${normalizedRequest.id}`, title: "Verified", message: "Your worker account has been verified by the admin.", date: reviewedAt, unread: true }] } : worker));
        }
        await refreshVerificationStateFromBackend();
        await refreshNotificationsFromBackend();
        window.alert("Verification approved. Worker is now Verified.");
        setSelectedVerificationRequestId(requestId);
        setView(currentUser?.isSuperAdmin ? "superadmin-dashboard" : "admin-dashboard");
      } catch (error) {
        window.alert(error.message || `Verified ${request.workerName}.`);
        setSelectedVerificationRequestId(requestId);
        setView(currentUser?.isSuperAdmin ? "superadmin-dashboard" : "admin-dashboard");
      }
    })();
  }
  function handleAdminRejectVerification(requestId) {
    const request = verificationRequests.find((item) => item.id === requestId);
    if (!request) return;
    const reviewNote = window.prompt("Enter rejection note:", "Please resubmit clearer documents.") || "Rejected by admin.";
    (async () => {
      try {
        const response = await apiRequest(`common/verification-requests/${requestId}/review/`, {
          method: "POST",
          auth: false,
          body: { action: "reject", review_note: reviewNote, reviewed_by: currentUser?.displayName || "Super Admin" },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to reject verification request."));
        }
        const normalizedRequest = normalizeVerificationRequest(data.verification_request || data);
        const reviewedAt = normalizedRequest.reviewedAt || (/* @__PURE__ */ new Date()).toLocaleString("en-PH");
        const backendWorker = normalizeBackendWorkerPayload(data.worker);
        setVerificationRequests((prev) => prev.map((item) => item.id === requestId ? normalizedRequest : item));
        if (backendWorker) {
          mergeBackendWorkerIntoState({ ...backendWorker, verification: "Rejected", verificationReviewedAt: reviewedAt, verificationReviewedBy: currentUser?.displayName || "Admin", verificationRejectionNote: reviewNote, profilePhotoPreview: backendWorker.profilePhotoPreview || "", verificationNotifications: [{ id: `rejected-${normalizedRequest.id}`, title: "Verification Rejected", message: reviewNote, date: reviewedAt, unread: true }] });
        } else {
          setRegisteredWorkers((prev) => prev.map((worker) => worker.id === normalizedRequest.workerId ? { ...worker, verification: "Rejected", verificationReviewedAt: reviewedAt, verificationReviewedBy: currentUser?.displayName || "Admin", verificationRejectionNote: reviewNote, profilePhotoPreview: worker.profilePhotoPreview || "", verificationNotifications: [{ id: `rejected-${normalizedRequest.id}`, title: "Verification Rejected", message: reviewNote, date: reviewedAt, unread: true }] } : worker));
        }
        await refreshVerificationStateFromBackend();
        await refreshNotificationsFromBackend();
        window.alert("Verification rejected. Please check admin review notes.");
        setSelectedVerificationRequestId(requestId);
        setView(currentUser?.isSuperAdmin ? "superadmin-dashboard" : "admin-dashboard");
      } catch (error) {
        window.alert(error.message || `Rejected ${request.workerName}.`);
        setSelectedVerificationRequestId(requestId);
        setView(currentUser?.isSuperAdmin ? "superadmin-dashboard" : "admin-dashboard");
      }
    })();
  }
  function renderSuperAdminDashboard() {
    const totalApplications = postedJobs.reduce((sum, job) => sum + (job.applications || []).length, 0);
    const activeApplications = postedJobs.reduce((sum, job) => sum + (job.applications || []).filter((application) => !["Rejected", "Completed", "Cancelled"].includes(application.status)).length, 0);
    const ongoingMatches = postedJobs.filter((job) => (job.applications || []).some((application) => application.status === "Hired")).length;
    const cancelledRequests = postedJobs.filter((job) => job.status === "Cancelled").length;
    const completedServices = postedJobs.filter((job) => job.status === "Completed").length;
    const verifiedWorkers = registeredWorkers.filter((worker) => worker.verification === "Verified").length;
    const totalUsers = registeredWorkers.length + registeredHouseholds.length;
    const verifiedPercent = registeredWorkers.length ? Math.round((verifiedWorkers / registeredWorkers.length) * 100) : 0;
    const barangayDemand = BARANGAYS.map((barangay) => ({
      barangay,
      jobs: postedJobs.filter((job) => job.barangay === barangay).length,
      workers: registeredWorkers.filter((worker) => worker.barangay === barangay).length,
    })).filter((item) => item.jobs || item.workers).sort((a, b) => b.jobs - a.jobs).slice(0, 6);
    const jobCategories = SKILLS.map((skill) => {
      const categoryJobs = postedJobs.filter((job) => job.serviceType === skill);
      const averageRate = categoryJobs.length ? categoryJobs.reduce((sum, job) => sum + Number(job.offeredRate || 0), 0) / categoryJobs.length : 0;
      return { skill, count: categoryJobs.length, averageRate };
    }).filter((item) => item.count).sort((a, b) => b.count - a.count).slice(0, 5);
    const activeJobs = postedJobs.filter((job) => job.status === "Open").length;
    const monthlyJobRequests = buildMonthlyJobRequests(postedJobs);
    const jobStatusAnalytics = [
      { name: "Completed", value: completedServices },
      { name: "Cancelled", value: cancelledRequests },
    ];
    const serviceAnalytics = buildServiceAnalytics(postedJobs);
    const barangayJobAnalytics = buildBarangayAnalytics(postedJobs, (job) => job.barangay, "jobs");
    const barangayWorkerAnalytics = buildBarangayAnalytics(registeredWorkers, (worker) => worker.barangay, "workers");
    const workerRatingValues = registeredWorkers.map(getWorkerRatingValue).filter((rating) => rating != null);
    const averageWorkerRating = workerRatingValues.length ? (workerRatingValues.reduce((sum, rating) => sum + rating, 0) / workerRatingValues.length).toFixed(2) : "No ratings yet";
    const ratingDistribution = buildRatingDistribution(registeredWorkers);
    const rejectedWorkerVerifications = registeredWorkers.filter((worker) => worker.verification === "Rejected").length;
    const verificationAnalytics = [
      { name: "Verified", value: verifiedWorkers },
      { name: "Pending", value: pendingVerificationRequests.length },
      { name: "Rejected", value: Math.max(rejectedVerificationRequests.length, rejectedWorkerVerifications) },
    ];
    const heatMapOptions = [
      { id: "jobs", label: "Job Demand" },
      { id: "workers", label: "Worker Availability" },
      { id: "completed", label: "Completed Services" },
      { id: "verification", label: "Pending Verifications" },
    ];
    const selectedHeatMapOption = heatMapOptions.find((option) => option.id === heatMapMetric) || heatMapOptions[0];
    const heatMapData = buildBarangayHeatMapData(postedJobs, registeredWorkers, verificationRequests, selectedHeatMapOption.id);
    const recentAuditLogs = [
      ...verificationRequests.slice(0, 6).map((request) => ({
        id: `verification-${request.id}`,
        timestamp: request.reviewedAt || request.submittedAt || "Recently",
        admin: request.reviewedBy || currentUser?.displayName || "Super Admin",
        action: `${request.status} verification`,
        target: request.workerName || request.workerUsername,
        status: request.status,
      })),
      { id: "system-login", timestamp: "Current session", admin: currentUser?.displayName || "Super Admin", action: "superadmin_login", target: "GawaGo frontend", status: "Success" },
    ];
    const tabs = [
      { id: "verification", label: "Verification Queue" },
      { id: "analytics", label: "Analytics" },
      { id: "adminmgmt", label: "Admin Management" },
      { id: "audit", label: "Audit Logs" },
    ];
    const renderStatusBadge = (status) => {
      const badgeClass = status === "Approved" || status === "Success" ? "text-bg-success" : status === "Rejected" ? "text-bg-danger" : "text-bg-warning";
      return <span className={`badge ${badgeClass}`}>{status}</span>;
    };
    return (
      <div className="app-shell">
        <header className="gawago-header sticky-top">
          <nav className="container navbar navbar-expand-lg py-3 gawago-header-inner">
            <span className="navbar-brand fw-bold text-decoration-none p-0 gawago-brand">GawaGo</span>
          </nav>
        </header>
        <main>
          <section className="worker-dashboard superadmin-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">SuperAdmin Panel</p>
                </div>
                <nav className="worker-nav">
                  {tabs.map((tab) => (
                    <button key={tab.id} type="button" className={`worker-nav-item ${superAdminSection === tab.id ? "active" : ""}`} onClick={() => setSuperAdminSection(tab.id)}>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </aside>
              <div className="worker-content">
                <div className="worker-topbar">
                  <div>
                    <h1 className="h4 mb-1">SuperAdmin Dashboard</h1>
                    <p className="small text-muted mb-0">Full system control, analytics monitoring, and worker verification.</p>
                  </div>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    <span className="small fw-semibold">{currentUser?.displayName || "Super Admin"}</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>Log Out</button>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6 col-xl">
                    <div className="metric-card superadmin-stat-danger">
                      <p className="metric-label mb-1">Pending Verifications</p>
                      <p className="metric-value mb-0">{pendingVerificationRequests.length}</p>
                      <p className="small text-muted mb-0">Queue needing admin review</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl">
                    <div className="metric-card superadmin-stat-success">
                      <p className="metric-label mb-1">Verified Workers</p>
                      <p className="metric-value mb-0">{verifiedWorkers}</p>
                      <p className="small text-muted mb-0">{verifiedPercent}% of worker accounts</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl">
                    <div className="metric-card superadmin-stat-danger">
                      <p className="metric-label mb-1">Rejected Workers</p>
                      <p className="metric-value mb-0">{Math.max(rejectedVerificationRequests.length, rejectedWorkerVerifications)}</p>
                      <p className="small text-muted mb-0">Verification requests rejected</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-xl">
                    <div className="metric-card superadmin-stat-warning">
                      <p className="metric-label mb-1">Total Users</p>
                      <p className="metric-value mb-0">{totalUsers}</p>
                      <p className="small text-muted mb-0">{registeredHouseholds.length} households, {registeredWorkers.length} workers</p>
                    </div>
                  </div>
                </div>

                <div className="superadmin-tabs mt-3">
                  {tabs.map((tab) => (
                    <button key={tab.id} type="button" className={`superadmin-tab ${superAdminSection === tab.id ? "active" : ""}`} onClick={() => setSuperAdminSection(tab.id)}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {superAdminSection === "verification" && (
                  <div className="profile-card mt-3">
                    <div className="profile-card-head d-flex justify-content-between align-items-center gap-3 flex-wrap">
                      <span>Worker Verification Queue</span>
                      <span className="small text-muted">{verificationRequests.length} total requests</span>
                    </div>
                    {selectedVerificationRequest && (
                      <div className="verification-detail-panel p-3 border-bottom">
                        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                          <div>
                            <h3 className="h6 mb-1">{selectedVerificationRequest.workerName}</h3>
                            <p className="small text-muted mb-0">@{selectedVerificationRequest.workerUsername}</p>
                          </div>
                          {renderStatusBadge(selectedVerificationRequest.status)}
                        </div>
                        <div className="row g-3 mt-1">
                          <div className="col-lg-4">
                            <div className="verification-note h-100">
                              <p className="small text-muted mb-1">Submitted</p>
                              <p className="mb-2 fw-semibold">{selectedVerificationRequest.submittedAt || "Recently"}</p>
                              <p className="small text-muted mb-1">Worker Notes</p>
                              <p className="mb-2">{selectedVerificationRequest.notes || "No notes submitted."}</p>
                              <p className="small text-muted mb-1">Admin Note</p>
                              <p className="mb-0">{selectedVerificationRequest.reviewNote || "No admin note yet."}</p>
                            </div>
                          </div>
                          {[
                            { label: "Primary ID", name: selectedVerificationRequest.primaryIdName, preview: selectedVerificationRequest.primaryIdPreview },
                            { label: "Supporting Document", name: selectedVerificationRequest.secondaryDocName, preview: selectedVerificationRequest.secondaryDocPreview },
                          ].map((documentItem) => (
                            <div className="col-lg-4" key={documentItem.label}>
                              <div className="verification-document-card h-100">
                                <p className="small text-muted mb-1">{documentItem.label}</p>
                                <p className="fw-semibold mb-2">{documentItem.name || "No file name"}</p>
                                {documentItem.preview ? (
                                  isImagePreviewUrl(documentItem.preview) ? (
                                    <button type="button" className="verification-document-preview" onClick={() => openFilePreview(documentItem.preview)}>
                                      <img src={documentItem.preview} alt={`${documentItem.label} preview`} />
                                    </button>
                                  ) : (
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => openFilePreview(documentItem.preview)}>
                                      Open Document
                                    </button>
                                  )
                                ) : (
                                  <p className="small text-muted mb-0">Preview file is not stored for this backend record.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {!["Approved", "Rejected"].includes(selectedVerificationRequest.status) && (
                          <div className="d-flex gap-2 mt-3 flex-wrap">
                            <button className="btn btn-success btn-sm" type="button" onClick={() => handleAdminApproveVerification(selectedVerificationRequest.id)}>Approve</button>
                            <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => handleAdminRejectVerification(selectedVerificationRequest.id)}>Reject</button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Worker</th>
                            <th>Submitted</th>
                            <th>Documents</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verificationRequests.length > 0 ? verificationRequests.map((request) => (
                            <tr key={request.id}>
                              <td>
                                <strong>{request.workerName}</strong>
                                <br />
                                <span className="small text-muted">@{request.workerUsername}</span>
                              </td>
                              <td>{request.submittedAt || "Recently"}</td>
                              <td>
                                <button className="badge text-bg-light border text-dark me-1 verification-doc-chip" type="button" onClick={() => {
                                  openVerificationRequest(request.id);
                                  if (request.primaryIdPreview) openFilePreview(request.primaryIdPreview);
                                }}>{request.primaryIdName || "Primary ID"}</button>
                                <button className="badge text-bg-light border text-dark verification-doc-chip" type="button" onClick={() => {
                                  openVerificationRequest(request.id);
                                  if (request.secondaryDocPreview) openFilePreview(request.secondaryDocPreview);
                                }}>{request.secondaryDocName || "Supporting Doc"}</button>
                              </td>
                              <td>{renderStatusBadge(request.status)}</td>
                              <td>
                                <div className="d-flex gap-2 flex-wrap">
                                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => openVerificationRequest(request.id)}>Review</button>
                                  {!["Approved", "Rejected"].includes(request.status) && (
                                    <>
                                      <button className="btn btn-success btn-sm" type="button" onClick={() => handleAdminApproveVerification(request.id)}>Approve</button>
                                      <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => handleAdminRejectVerification(request.id)}>Reject</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-4">No verification requests yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {superAdminSection === "analytics" && (
                  <>
                    <div className="superadmin-analytics mt-3">
                      <div className="analytics-section-head">
                        <div>
                          <h2 className="h5 mb-1">Data Analytics</h2>
                          <p className="small text-muted mb-0">System-wide employment, service, barangay, rating, and verification metrics.</p>
                        </div>
                        <span className="badge text-bg-light border text-dark">Backend-ready</span>
                      </div>

                      <div className="profile-card analytics-card">
                        <div className="profile-card-head d-flex justify-content-between align-items-center gap-3 flex-wrap">
                          <span>Demo Backend Accounts</span>
                          <span className="small text-muted">Seeded in Django database</span>
                        </div>
                        <div className="table-responsive">
                          <table className="table align-middle mb-0 analytics-table">
                            <thead><tr><th>Type</th><th>Name</th><th>Username</th><th>Password</th><th>Barangay</th><th>Status</th></tr></thead>
                            <tbody>
                              {[...registeredHouseholds.filter((account) => DEMO_ACCOUNT_PASSWORDS[account.username]).map((account) => ({ ...account, type: "Household", statusLabel: "Active" })), ...registeredWorkers.filter((account) => DEMO_ACCOUNT_PASSWORDS[account.username]).map((account) => ({ ...account, type: "Worker", statusLabel: account.verification || "Pending" }))].map((account) => (
                                <tr key={`${account.type}-${account.username}`}>
                                  <td><span className={`badge ${account.type === "Worker" ? "text-bg-primary" : "text-bg-info"}`}>{account.type}</span></td>
                                  <td>{getDisplayName(account.firstName, account.lastName, account.username)}</td>
                                  <td><strong>{account.username}</strong></td>
                                  <td><code>{DEMO_ACCOUNT_PASSWORDS[account.username]}</code></td>
                                  <td>{account.barangay || "Not set"}</td>
                                  <td>{account.statusLabel}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-md-6 col-xl-2"><div className="metric-card analytics-summary-card"><p className="metric-label mb-1">Total Users</p><p className="metric-value mb-0">{totalUsers}</p></div></div>
                        <div className="col-md-6 col-xl-2"><div className="metric-card analytics-summary-card"><p className="metric-label mb-1">Total Workers</p><p className="metric-value mb-0">{registeredWorkers.length}</p></div></div>
                        <div className="col-md-6 col-xl-2"><div className="metric-card analytics-summary-card"><p className="metric-label mb-1">Households</p><p className="metric-value mb-0">{registeredHouseholds.length}</p></div></div>
                        <div className="col-md-6 col-xl-2"><div className="metric-card analytics-summary-card"><p className="metric-label mb-1">Active Jobs</p><p className="metric-value mb-0">{activeJobs}</p></div></div>
                        <div className="col-md-6 col-xl-2"><div className="metric-card analytics-summary-card"><p className="metric-label mb-1">Completed Jobs</p><p className="metric-value mb-0">{completedServices}</p></div></div>
                        <div className="col-md-6 col-xl-2"><div className="metric-card analytics-summary-card"><p className="metric-label mb-1">Pending Verifications</p><p className="metric-value mb-0">{pendingVerificationRequests.length}</p></div></div>
                      </div>

                      <div className="profile-card analytics-card">
                        <div className="profile-card-head analytics-heatmap-head">
                          <span>Barangay Heat Map</span>
                          <div className="btn-group btn-group-sm analytics-heatmap-tabs" role="group" aria-label="Heat map metric">
                            {heatMapOptions.map((option) => (
                              <button key={option.id} type="button" className={`btn ${heatMapMetric === option.id ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setHeatMapMetric(option.id)}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <SuperAdminHeatMap data={heatMapData} metricLabel={selectedHeatMapOption.label} />
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-xl-8">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Monthly Job Requests</div>
                            <div className="analytics-chart-wrap">
                              <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={monthlyJobRequests} margin={{ top: 16, right: 18, left: 0, bottom: 4 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ff" />
                                  <XAxis dataKey="month" tick={{ fill: "#5f6b7b", fontSize: 12 }} />
                                  <YAxis allowDecimals={false} tick={{ fill: "#5f6b7b", fontSize: 12 }} />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="requests" stroke="#667eea" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-4">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Completed vs Cancelled</div>
                            <div className="analytics-chart-wrap">
                              <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                  <Pie data={jobStatusAnalytics} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
                                    {jobStatusAnalytics.map((entry, index) => <Cell key={entry.name} fill={ANALYTICS_CHART_COLORS[index + 1]} />)}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-xl-7">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Most Requested Services</div>
                            <div className="analytics-chart-wrap">
                              <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={serviceAnalytics} margin={{ top: 16, right: 18, left: 0, bottom: 4 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ff" />
                                  <XAxis dataKey="service" tick={{ fill: "#5f6b7b", fontSize: 12 }} />
                                  <YAxis allowDecimals={false} tick={{ fill: "#5f6b7b", fontSize: 12 }} />
                                  <Tooltip />
                                  <Bar dataKey="requests" radius={[8, 8, 0, 0]}>
                                    {serviceAnalytics.map((entry, index) => <Cell key={entry.service} fill={ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length]} />)}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-5">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Verification Analytics</div>
                            <div className="analytics-chart-wrap">
                              <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={verificationAnalytics} layout="vertical" margin={{ top: 16, right: 24, left: 12, bottom: 4 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ff" />
                                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#5f6b7b", fontSize: 12 }} />
                                  <YAxis type="category" dataKey="name" tick={{ fill: "#5f6b7b", fontSize: 12 }} width={72} />
                                  <Tooltip />
                                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                    {verificationAnalytics.map((entry, index) => <Cell key={entry.name} fill={ANALYTICS_CHART_COLORS[index]} />)}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-xl-6">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Barangays with High Job Demand</div>
                            <div className="table-responsive">
                              <table className="table align-middle mb-0 analytics-table">
                                <thead><tr><th>Barangay</th><th>Job Requests</th><th>Demand</th></tr></thead>
                                <tbody>
                                  {barangayJobAnalytics.length > 0 ? barangayJobAnalytics.map((item) => (
                                    <tr key={item.barangay}><td>{item.barangay}</td><td>{item.jobs}</td><td><div className="analytics-meter"><span style={{ width: `${Math.max(8, (item.jobs / Math.max(...barangayJobAnalytics.map((row) => row.jobs), 1)) * 100)}%` }} /></div></td></tr>
                                  )) : <tr><td colSpan="3" className="text-center text-muted py-4">No barangay job data yet.</td></tr>}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-6">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Barangays with Worker Availability</div>
                            <div className="table-responsive">
                              <table className="table align-middle mb-0 analytics-table">
                                <thead><tr><th>Barangay</th><th>Workers</th><th>Availability</th></tr></thead>
                                <tbody>
                                  {barangayWorkerAnalytics.length > 0 ? barangayWorkerAnalytics.map((item) => (
                                    <tr key={item.barangay}><td>{item.barangay}</td><td>{item.workers}</td><td><div className="analytics-meter availability"><span style={{ width: `${Math.max(8, (item.workers / Math.max(...barangayWorkerAnalytics.map((row) => row.workers), 1)) * 100)}%` }} /></div></td></tr>
                                  )) : <tr><td colSpan="3" className="text-center text-muted py-4">No barangay worker data yet.</td></tr>}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-xl-4">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Average Worker Rating</div>
                            <div className="analytics-rating-summary">
                              <p className="analytics-rating-value mb-1">{averageWorkerRating}</p>
                              <p className="small text-muted mb-0">{workerRatingValues.length} rated worker profile(s)</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-4">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Rating Distribution</div>
                            <div className="analytics-chart-wrap compact">
                              <ResponsiveContainer width="100%" height={230}>
                                <BarChart data={ratingDistribution} margin={{ top: 16, right: 18, left: 0, bottom: 4 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ff" />
                                  <XAxis dataKey="stars" tick={{ fill: "#5f6b7b", fontSize: 12 }} />
                                  <YAxis allowDecimals={false} tick={{ fill: "#5f6b7b", fontSize: 12 }} />
                                  <Tooltip />
                                  <Bar dataKey="count" fill="#ffc107" radius={[8, 8, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-4">
                          <div className="profile-card analytics-card h-100">
                            <div className="profile-card-head">Service Rate Transparency</div>
                            <div className="table-responsive">
                              <table className="table align-middle mb-0 analytics-table">
                                <thead><tr><th>Category</th><th>Posts</th><th>Average Rate</th></tr></thead>
                                <tbody>
                                  {jobCategories.length > 0 ? jobCategories.map((item) => (
                                    <tr key={item.skill}><td>{item.skill}</td><td>{item.count}</td><td>{formatCurrency(item.averageRate)}</td></tr>
                                  )) : <tr><td colSpan="3" className="text-center text-muted py-4">No rate data yet.</td></tr>}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {superAdminSection === "adminmgmt" && (
                  <div className="profile-card mt-3">
                    <div className="profile-card-head d-flex justify-content-between align-items-center gap-3 flex-wrap">
                      <span>Registered Admins</span>
                      <button className="btn btn-primary btn-sm" type="button">Add Admin</button>
                    </div>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead><tr><th>Admin Name</th><th>Username</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                          <tr><td><strong>Super Admin</strong></td><td>superadmin</td><td>Full System Control</td><td><span className="badge text-bg-dark">Owner</span></td><td><button className="btn btn-outline-secondary btn-sm" type="button">Manage</button></td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {superAdminSection === "audit" && (
                  <div className="profile-card mt-3">
                    <div className="profile-card-head">Audit Logs</div>
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Target</th><th>Status</th></tr></thead>
                        <tbody>
                          {recentAuditLogs.map((log) => (
                            <tr key={log.id}><td>{log.timestamp}</td><td>{log.admin}</td><td>{log.action}</td><td>{log.target}</td><td>{renderStatusBadge(log.status)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }
  function renderWorkerJobDetailView() {
    const job = currentWorkerJobDetail;
    const household = currentWorkerJobHousehold;
    const householdName = getDisplayName(household?.firstName, household?.lastName, job?.householdName || job?.householdUsername || "Household");
    const householdPhoto = getHouseholdPhoto(household);
    const alreadyApplied = job && currentWorker ? (job.applications || []).some((application) => String(application.workerId) === String(currentWorker.id) || application.workerUsername === currentWorker.username) : false;
    const jobLatitude = job?.latitude ?? household?.latitude ?? null;
    const jobLongitude = job?.longitude ?? household?.longitude ?? null;
    const workerLatitude = currentWorker?.latitude ?? null;
    const workerLongitude = currentWorker?.longitude ?? null;
    const jobDistanceKm = haversineDistanceKm(workerLatitude, workerLongitude, jobLatitude, jobLongitude);
    return (
      <div className="app-shell">
        <header className="gawago-header sticky-top">
          <nav className="container navbar navbar-expand-lg py-3 gawago-header-inner">
            <span className="navbar-brand fw-bold text-decoration-none p-0 gawago-brand">GawaGo</span>
          </nav>
        </header>
        <main>
          <section className="worker-dashboard">
            <div className="worker-layout">
              <aside className="worker-sidebar">
                <div className="worker-sidebar-head">
                  <div className="worker-logo">GG</div>
                  <p className="worker-brand mb-0">GawaGo Community Platform</p>
                </div>
                <nav className="worker-nav">
                  <button className="worker-nav-item" onClick={openWorkerDashboard}>Dashboard</button>
                  <button className="worker-nav-item active" onClick={openWorkerFindJobs}>Find Jobs</button>
                  <button className="worker-nav-item" onClick={openWorkerProfile}>My Profile</button>
                  <button className="worker-nav-item" onClick={openWorkerApplications}>
                    My Applications
                    {workerApplicationUnreadCount > 0 && <span className="nav-count-badge">{workerApplicationUnreadCount}</span>}
                  </button>
                  <button className="worker-nav-item" onClick={openWorkerGetVerified}>Get Verified</button>
                  <button className="worker-nav-item" onClick={openWorkerNotifications}>Notifications</button>
                </nav>
              </aside>
              <div className="worker-content">
                <div className="worker-topbar">
                  <h1 className="h4 mb-0">Job Details</h1>
                  <div className="worker-user-meta d-flex align-items-center gap-2">
                    {workerMiniPhoto ? (
                      <img src={workerMiniPhoto} alt="Worker profile" className="worker-mini-avatar" />
                    ) : (
                      <span className="worker-mini-avatar worker-mini-fallback">{(currentUser?.displayName || "W").slice(0, 1).toUpperCase()}</span>
                    )}
                    <span className="badge text-bg-primary">Worker</span>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openWorkerFindJobs}>Back</button>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleLogout}>Log Out</button>
                  </div>
                </div>
                {!job ? (
                  <div className="profile-card mt-3">
                    <div className="profile-card-head">Job not found</div>
                    <div className="p-3">
                      <p className="mb-3 text-muted">This job is no longer available or could not be loaded.</p>
                      <button className="btn btn-primary" type="button" onClick={openWorkerFindJobs}>Back to Find Jobs</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="profile-card mt-3">
                      <div className="profile-card-head d-flex justify-content-between align-items-center gap-3 flex-wrap">
                        <span>{job.jobTitle || job.serviceType}</span>
                        <span className={`badge ${getJobStatusBadgeClass(job.status)}`}>{job.status || "Open"}</span>
                      </div>
                      <div className="p-3">
                        <div className="row g-3">
                          <div className="col-lg-8">
                            <div className="d-grid gap-2">
                              <p className="mb-0 d-flex justify-content-between gap-3"><span className="text-muted">Service</span><strong>{job.serviceType}</strong></p>
                              <p className="mb-0 d-flex justify-content-between gap-3"><span className="text-muted">Schedule</span><strong>{job.scheduleType || "Not set"}</strong></p>
                              <p className="mb-0 d-flex justify-content-between gap-3"><span className="text-muted">Date</span><strong>{job.preferredDate || "Not set"}</strong></p>
                              <p className="mb-0 d-flex justify-content-between gap-3"><span className="text-muted">Time</span><strong>{job.preferredTime || "Not set"}</strong></p>
                              <p className="mb-0 d-flex justify-content-between gap-3"><span className="text-muted">Needed</span><strong>{getHiringProgressLabel(job)} hired</strong></p>
                              <p className="mb-0 d-flex justify-content-between gap-3"><span className="text-muted">Rate</span><strong>{formatRate(job.offeredRate, job.rateType)}</strong></p>
                              <p className="mb-0 d-flex justify-content-between gap-3"><span className="text-muted">Location</span><strong className="text-end">{formatLocation(household?.barangay || job.barangay, household?.streetAddress || job.streetAddress)}</strong></p>
                            </div>
                          </div>
                          <div className="col-lg-4">
                            <div className="household-profile-preview h-100" data-household-profile-preview="true">
                              <p className="small text-muted mb-2">Household Profile</p>
                              <div className="d-flex align-items-center gap-3">
                                {householdPhoto ? (
                                  <img src={householdPhoto} alt={`${householdName} profile`} className="household-profile-photo" />
                                ) : (
                                  <div className="household-profile-fallback">{(householdName || "H").slice(0, 1).toUpperCase()}</div>
                                )}
                                <div className="flex-grow-1">
                                  <p className="mb-1 fw-semibold">{householdName}</p>
                                  <p className="mb-1 small text-muted">{formatLocation(household?.barangay || job.barangay, household?.streetAddress || job.streetAddress)}</p>
                                  <p className="mb-0 small text-muted">{[household?.phone ? `+63${household.phone}` : "", household?.email || ""].filter(Boolean).join(" | ") || "Contact details not provided"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="small text-muted fw-semibold mb-1">Description</p>
                          <p className="mb-0">{job.description || "No description provided."}</p>
                        </div>
                        <div className="d-flex gap-2 flex-wrap mt-3">
                          <button className="btn btn-primary" type="button" disabled={alreadyApplied} onClick={() => handleApplyToJob(job.id)}>
                            {alreadyApplied ? "Already Applied" : "Apply Now"}
                          </button>
                          <button className="btn btn-outline-secondary" type="button" onClick={openWorkerFindJobs}>Back to Find Jobs</button>
                        </div>
                      </div>
                    </div>
                    <div className="profile-card mt-3" data-worker-job-distance-map="true">
                      <div className="profile-card-head">Distance & Location</div>
                      <div className="p-3">
                        <LocationDistanceMap
                          userLatitude={workerLatitude}
                          userLongitude={workerLongitude}
                          targetLatitude={jobLatitude}
                          targetLongitude={jobLongitude}
                          userLocation={formatLocation(currentWorker?.barangay, currentWorker?.streetAddress)}
                          targetLocation={formatLocation(household?.barangay || job.barangay, household?.streetAddress || job.streetAddress)}
                          distanceKm={jobDistanceKm}
                          formatDistanceFn={formatDistance}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }
  if (view === "worker-job-detail") {
    return renderWorkerJobDetailView();
  }
  if (view === "superadmin-dashboard") {
    return renderSuperAdminDashboard();
  }
  if (view === "forgot-password") {
    return /* @__PURE__ */ React.createElement("div", { className: "app-shell" }, "       ", /* @__PURE__ */ React.createElement("section", { className: "login-section py-5" }, "         ", /* @__PURE__ */ React.createElement("div", { className: "container login-page-wrap" }, "           ", /* @__PURE__ */ React.createElement("div", { className: "login-shell shadow-sm" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "login-topbar d-flex align-items-center px-3" }, "               ", /* @__PURE__ */ React.createElement("span", { className: "badge rounded-pill text-bg-light text-primary me-2" }, "GG"), "               ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, "Password Reset"), "             "), "             ", /* @__PURE__ */ React.createElement("div", { className: "login-card mx-auto" }, "               ", /* @__PURE__ */ React.createElement("div", { className: "login-card-head text-center" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "login-avatar" }, "GG"), "                 ", /* @__PURE__ */ React.createElement("h2", { className: "h6 fw-bold mb-1" }, "Reset your password"), "                 ", /* @__PURE__ */ React.createElement("p", { className: "small text-white-50 mb-0" }, "We will send a reset code to your Gmail address."), "               "), "               ", /* @__PURE__ */ React.createElement("div", { className: "p-3 p-md-4" }, "                 ", forgotPasswordNotice ? /* @__PURE__ */ React.createElement("div", { className: "alert alert-info py-2" }, forgotPasswordNotice) : null, "                 ", forgotPasswordError ? /* @__PURE__ */ React.createElement("div", { className: "alert alert-danger py-2" }, forgotPasswordError) : null, "                 ", forgotPasswordStep === "email" && /* @__PURE__ */ React.createElement("form", { onSubmit: handleForgotPasswordEmailSubmit }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                     ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold", htmlFor: "reset-email" }, "Email address"), "                     ", /* @__PURE__ */ React.createElement("input", { id: "reset-email", name: "email", type: "email", className: "form-control", value: forgotPasswordForm.email, onChange: handleForgotPasswordChange, placeholder: "Enter your Gmail address" }), "                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary w-100", type: "submit", disabled: forgotPasswordLoading }, forgotPasswordLoading ? "Sending..." : "Send OTP"), "                 "), "                 ", forgotPasswordStep === "verify" && /* @__PURE__ */ React.createElement("form", { onSubmit: handleVerifyResetToken }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                     ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold", htmlFor: "reset-token" }, "OTP / Reset Code"), "                     ", /* @__PURE__ */ React.createElement("input", { id: "reset-token", name: "token", type: "text", className: "form-control", value: forgotPasswordForm.token, onChange: handleForgotPasswordChange, placeholder: "Enter the 6-digit code" }), "                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary w-100", type: "submit", disabled: forgotPasswordLoading }, forgotPasswordLoading ? "Verifying..." : "Verify Code"), "                 "), "                 ", forgotPasswordStep === "reset" && /* @__PURE__ */ React.createElement("form", { onSubmit: handleResetPassword }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                     ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold", htmlFor: "new-password" }, "New Password"), "                     ", /* @__PURE__ */ React.createElement("input", { id: "new-password", name: "newPassword", type: "password", className: "form-control", value: forgotPasswordForm.newPassword, onChange: handleForgotPasswordChange }), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                     ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold", htmlFor: "confirm-password" }, "Confirm Password"), "                     ", /* @__PURE__ */ React.createElement("input", { id: "confirm-password", name: "confirmPassword", type: "password", className: "form-control", value: forgotPasswordForm.confirmPassword, onChange: handleForgotPasswordChange }), "                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary w-100", type: "submit", disabled: forgotPasswordLoading }, forgotPasswordLoading ? "Resetting..." : "Reset Password"), "                 "), "                 ", forgotPasswordStep === "done" && /* @__PURE__ */ React.createElement("div", { className: "d-grid gap-2" }, "                   ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-success", onClick: openLogin }, "Back to Login"), "                   ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-secondary", onClick: openForgotPassword }, "Send another code"), "                 "), "                 ", /* @__PURE__ */ React.createElement("div", { className: "mt-3 text-center" }, "                   ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm text-decoration-none p-0", onClick: openLogin }, "Return to login"), "                 "), "               "), "             "), "           "), "         "), "       "), "     ");
  }
  return /* @__PURE__ */ React.createElement("div", { className: "app-shell" }, "       ", /* @__PURE__ */ React.createElement("header", { className: "gawago-header sticky-top" }, "         ", /* @__PURE__ */ React.createElement("nav", { className: "container navbar navbar-expand-lg py-3 gawago-header-inner" }, "           ", /* @__PURE__ */ React.createElement("span", { className: "navbar-brand fw-bold text-decoration-none p-0 gawago-brand" }, "             GawaGo           "), "           ", view === "home" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-light btn-sm ms-auto gawago-signin", onClick: openLogin }, "               Sign In             "), "         "), "       "), "        ", /* @__PURE__ */ React.createElement("main", null, "         ", view === "home" && /* @__PURE__ */ React.createElement(React.Fragment, null, "             ", /* @__PURE__ */ React.createElement("section", { className: "hero-section hero-dark hero-fullscreen" }, "               ", /* @__PURE__ */ React.createElement("div", { className: "hero-orb hero-orb-1", "aria-hidden": "true" }), "               ", /* @__PURE__ */ React.createElement("div", { className: "hero-orb hero-orb-2", "aria-hidden": "true" }), "               ", /* @__PURE__ */ React.createElement("div", { className: "container py-5 py-lg-6 position-relative hero-inner" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "row align-items-center g-4" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-7 hero-copy" }, "                     ", /* @__PURE__ */ React.createElement("p", { className: "text-uppercase small fw-semibold hero-kicker mb-2" }, "Tayabas City"), "                     ", /* @__PURE__ */ React.createElement("h1", { className: "display-5 fw-bold mb-3 hero-title" }, "Find trusted helpers and skilled workers near you."), "                     ", /* @__PURE__ */ React.createElement("p", { className: "lead hero-subtitle mb-4" }, "                       GawaGo connects households and workers with smart matching, transparent rates, and a fair                       reputation system.                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2 flex-wrap" }, "                       ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-lg hero-primary-btn" }, "Post a Job"), "                       ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-light btn-lg hero-secondary-btn" }, "Find Work"), "                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-5" }, "                    ", /* @__PURE__ */ React.createElement("div", { className: "hero-snapshot hero-snapshot-alt" }, "                      ", /* @__PURE__ */ React.createElement("div", { className: "hero-snapshot-orb" }), "                      ", /* @__PURE__ */ React.createElement("div", { className: "hero-snapshot-card" }, "                        ", /* @__PURE__ */ React.createElement("span", { className: "hero-snapshot-badge" }, "Open jobs live"), "                        ", /* @__PURE__ */ React.createElement("p", { className: "hero-snapshot-label mb-1" }, "Open Jobs"), "                        ", /* @__PURE__ */ React.createElement("p", { className: "hero-snapshot-value mb-2" }, dashboardMetrics.openJobs), "                        ", /* @__PURE__ */ React.createElement("p", { className: "hero-snapshot-note mb-0" }, "Jobs waiting for workers to apply"), "                      "), "                    "), "                  "), "                 "), "               "), "             "), "            "), "          ", view === "login" && /* @__PURE__ */ React.createElement("section", { className: "login-section py-5" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "container login-page-wrap" }, "               ", /* @__PURE__ */ React.createElement("div", { className: "login-shell shadow-sm" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "login-topbar d-flex align-items-center px-3" }, "                   ", /* @__PURE__ */ React.createElement("span", { className: "badge rounded-pill text-bg-light text-primary me-2" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, "GawaGo Community Login Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("div", { className: "login-card mx-auto" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "login-card-head text-center" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "login-avatar" }, "GG"), "                     ", /* @__PURE__ */ React.createElement("h2", { className: "h6 fw-bold mb-1" }, "GawaGo Community Login Platform"), "                     ", /* @__PURE__ */ React.createElement("p", { className: "small text-white-50 mb-0" }, "Connect workers and households in your community"), "                   "), "                   ", /* @__PURE__ */ React.createElement("form", { className: "p-3 p-md-4", onSubmit: handleLoginSubmit }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                       ", /* @__PURE__ */ React.createElement("label", { htmlFor: "username", className: "form-label fw-semibold" }, "                         Username                       "), "                       ", /* @__PURE__ */ React.createElement("input", { id: "username", name: "username", type: "text", className: "form-control", placeholder: "Enter your username", value: loginForm.username, onChange: handleLoginChange }), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, "                       ", /* @__PURE__ */ React.createElement("label", { htmlFor: "password", className: "form-label fw-semibold" }, "                         Password                       "), "                       ", /* @__PURE__ */ React.createElement("input", { id: "password", name: "password", type: "password", className: "form-control", placeholder: "Enter your password", value: loginForm.password, onChange: handleLoginChange }), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, "                       ", /* @__PURE__ */ React.createElement("label", { htmlFor: "role", className: "form-label fw-semibold" }, "                         Login As                       "), "                       ", /* @__PURE__ */ React.createElement("select", { id: "role", name: "role", className: "form-select", value: loginForm.role, onChange: handleLoginChange }, "                         ", /* @__PURE__ */ React.createElement("option", { value: "worker" }, "Worker"), "                         ", /* @__PURE__ */ React.createElement("option", { value: "household" }, "Household"), "                       "), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "text-end mb-3" }, "                       ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm text-decoration-none p-0", onClick: openForgotPassword }, "                         Forgot your password?                       "), "                     "), "                     ", /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary w-100" }, "                       Login                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "login-card-foot text-center p-3 p-md-4" }, "                     ", /* @__PURE__ */ React.createElement("p", { className: "small mb-2" }, "New here? Register as:"), "                     ", /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-center gap-2 flex-wrap" }, "                       ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-success btn-sm", onClick: openHouseholdRegister }, "                         Household                       "), "                       ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-primary btn-sm", onClick: openWorkerRegister }, "                         Worker                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "register-worker" && /* @__PURE__ */ React.createElement("section", { className: "login-section py-5" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "container login-page-wrap" }, "               ", /* @__PURE__ */ React.createElement("h1", { className: "h3 mb-3" }, "Register as Worker"), "               ", /* @__PURE__ */ React.createElement("div", { className: "login-shell shadow-sm" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "login-topbar d-flex align-items-center px-3" }, "                   ", /* @__PURE__ */ React.createElement("span", { className: "badge rounded-pill text-bg-light text-primary me-2" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, "GawaGo Community Platform"), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "register-card mx-auto my-4" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "register-card-head" }, "                     ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-0" }, "Register as Worker"), "                   "), "                    ", /* @__PURE__ */ React.createElement("form", { className: "p-3 p-md-4", onSubmit: handleWorkerRegisterSubmit }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "First Name"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "firstName", className: "form-control", value: workerForm.firstName, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Last Name"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "lastName", className: "form-control", value: workerForm.lastName, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Username"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "username", className: "form-control", value: workerForm.username, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Email"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "email", name: "email", className: "form-control", value: workerForm.email, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Phone Number"), "                         ", /* @__PURE__ */ React.createElement("div", { className: "input-group" }, "                           ", /* @__PURE__ */ React.createElement("span", { className: "input-group-text" }, "+63"), "                           ", /* @__PURE__ */ React.createElement("input", { type: "tel", name: "phone", className: "form-control", placeholder: "9XXXXXXXXX", inputMode: "numeric", maxLength: 10, value: workerForm.phone, onChange: handleWorkerChange }), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Barangay"), "                         ", /* @__PURE__ */ React.createElement("select", { name: "barangay", className: "form-select", value: workerForm.barangay, onChange: handleWorkerChange }, "                           ", /* @__PURE__ */ React.createElement("option", { value: "" }, "---Select Barangay---"), "                           ", renderBarangayOptions(), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Street / House No"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "streetAddress", className: "form-control", placeholder: "e.g. 45 Mabini St.", value: workerForm.streetAddress, onChange: handleWorkerChange }), "                         ", /* @__PURE__ */ React.createElement("p", { className: "form-text mb-0" }, "Location coverage: Tayabas City, Quezon only."), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Bio / About me"), "                         ", /* @__PURE__ */ React.createElement("textarea", { name: "bio", className: "form-control", rows: "3", placeholder: "Tell households about yourself and your experience...", value: workerForm.bio, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Hourly Rate (PHP)"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", step: "0.01", name: "hourlyRate", className: "form-control", value: workerForm.hourlyRate, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Daily Rate (PHP)"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", step: "0.01", name: "dailyRate", className: "form-control", value: workerForm.dailyRate, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Years of Experience"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", name: "yearsExperience", className: "form-control", value: workerForm.yearsExperience, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "                           Skills ", /* @__PURE__ */ React.createElement("span", { className: "fw-normal text-muted" }, "(Select all that apply)"), "                         "), "                         ", /* @__PURE__ */ React.createElement("div", { className: "skills-grid" }, "                           ", SKILLS.map((skill) => /* @__PURE__ */ React.createElement("label", { key: skill, className: "form-check" }, "                               ", /* @__PURE__ */ React.createElement("input", { type: "checkbox", className: "form-check-input", checked: workerForm.skills.includes(skill), onChange: () => toggleSkill(skill) }), "                               ", /* @__PURE__ */ React.createElement("span", { className: "form-check-label" }, skill), "                             ")), "                         "), "                       "), "                       ", workerForm.skills.includes("Other") && /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                           ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Other skill"), "                           ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "customSkill", className: "form-control", placeholder: "Enter your other skill", value: workerForm.customSkill, onChange: handleWorkerChange }), "                         "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Password"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "password", name: "password", className: "form-control", value: workerForm.password, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Confirm Password"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "password", name: "confirmPassword", className: "form-control", value: workerForm.confirmPassword, onChange: handleWorkerChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary w-100" }, "                           Create Worker Account                         "), "                       "), "                     "), "                   "), "                    ", /* @__PURE__ */ React.createElement("div", { className: "login-card-foot text-center p-3" }, "                     ", /* @__PURE__ */ React.createElement("p", { className: "small mb-0" }, "                       Already have an account?", " ", "                       ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm align-baseline p-0", onClick: openLogin }, "                         Login here                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "register-household" && /* @__PURE__ */ React.createElement("section", { className: "login-section py-5" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "container login-page-wrap" }, "               ", /* @__PURE__ */ React.createElement("h1", { className: "h3 mb-3" }, "Register as Household"), "               ", /* @__PURE__ */ React.createElement("div", { className: "login-shell shadow-sm" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "login-topbar d-flex align-items-center px-3" }, "                   ", /* @__PURE__ */ React.createElement("span", { className: "badge rounded-pill text-bg-light text-primary me-2" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, "GawaGo Community Platform"), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "register-card register-card-sm mx-auto my-4" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "register-card-head" }, "                     ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-0" }, "Register as Household"), "                   "), "                    ", /* @__PURE__ */ React.createElement("form", { className: "p-3 p-md-4", onSubmit: handleHouseholdRegisterSubmit }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "First Name"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "firstName", className: "form-control", value: householdForm.firstName, onChange: handleHouseholdChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Last Name"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "lastName", className: "form-control", value: householdForm.lastName, onChange: handleHouseholdChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Username"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "username", className: "form-control", value: householdForm.username, onChange: handleHouseholdChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Email"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "email", name: "email", className: "form-control", value: householdForm.email, onChange: handleHouseholdChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Phone Number"), "                         ", /* @__PURE__ */ React.createElement("div", { className: "input-group" }, "                           ", /* @__PURE__ */ React.createElement("span", { className: "input-group-text" }, "+63"), "                           ", /* @__PURE__ */ React.createElement("input", { type: "tel", name: "phone", className: "form-control", placeholder: "9XXXXXXXXX", inputMode: "numeric", maxLength: 10, value: householdForm.phone, onChange: handleHouseholdChange }), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Barangay"), "                         ", /* @__PURE__ */ React.createElement("select", { name: "barangay", className: "form-select", value: householdForm.barangay, onChange: handleHouseholdChange }, "                           ", /* @__PURE__ */ React.createElement("option", { value: "" }, "---Select Barangay---"), "                           ", renderBarangayOptions(), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Street / House No"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "streetAddress", className: "form-control", placeholder: "e.g. 45 Mabini St.", value: householdForm.streetAddress, onChange: handleHouseholdChange }), "                         ", /* @__PURE__ */ React.createElement("p", { className: "form-text mb-0" }, "Location coverage: Tayabas City, Quezon only."), "                       "), "                       ", workerForm.skills.includes("Other") && /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                           ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Other skill"), "                           ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "customSkill", className: "form-control", placeholder: "Enter your other skill", value: workerForm.customSkill, onChange: handleWorkerChange }), "                         "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Password"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "password", name: "password", className: "form-control", value: householdForm.password, onChange: handleHouseholdChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Confirm Password"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "password", name: "confirmPassword", className: "form-control", value: householdForm.confirmPassword, onChange: handleHouseholdChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary w-100" }, "                           Create Household Account                         "), "                       "), "                     "), "                   "), "                    ", /* @__PURE__ */ React.createElement("div", { className: "login-card-foot text-center p-3" }, "                     ", /* @__PURE__ */ React.createElement("p", { className: "small mb-0" }, "                       Already have an account?", " ", "                       ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm align-baseline p-0", onClick: openLogin }, "                         Login here                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "worker-dashboard" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "Dashboard"), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerFindJobs }, "                     Find Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerApplications }, "                     My Applications                     ", workerApplicationUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, workerApplicationUnreadCount), "                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerGetVerified }, "                     Get Verified                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerNotifications }, "                     Notifications                     ", workerUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, workerUnreadCount), "                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "Welcome, ", currentUser?.displayName || "Worker", "!"), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", workerMiniPhoto ? /* @__PURE__ */ React.createElement("img", { src: workerMiniPhoto, alt: "Worker profile", className: "worker-mini-avatar" }) : /* @__PURE__ */ React.createElement("span", { className: "worker-mini-avatar worker-mini-fallback" }, "                         ", (currentUser?.displayName || "W").slice(0, 1).toUpperCase(), "                       "), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Worker"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "row g-3 mt-1" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Open Jobs"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, workerVisibleJobs.length), "                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Skill Matches"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, workerMatchedJobs.length), "                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Your Rating"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, currentWorker?.rating || "No ratings yet"), "                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Verification"), "                       ", /* @__PURE__ */ React.createElement("span", { className: `badge ${currentWorker?.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}` }, "                         ", currentWorker?.verification || "Pending", "                       "), "                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2 flex-wrap mt-3" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: openWorkerFindJobs }, "                     Find Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", onClick: openWorkerApplications }, "                     My Applications                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", onClick: openWorkerProfile }, "                     Update Profile                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "card border-0 shadow-sm mt-4" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "card-header bg-white d-flex justify-content-between align-items-center" }, "                     ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-0 fw-bold" }, "Latest Household Job Posts"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", onClick: openWorkerFindJobs }, "                       View All                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "p-3" }, "                     ", workerVisibleJobs.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                         ", workerVisibleJobs.slice(0, 3).map((job) => /* @__PURE__ */ React.createElement("div", { className: "col-lg-4", key: job.id }, "                             ", /* @__PURE__ */ React.createElement("article", { className: "job-card" }, "                               ", /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-between align-items-start gap-2" }, "                                 ", /* @__PURE__ */ React.createElement("div", null, "                                   ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-1" }, job.jobTitle || job.serviceType), "                                   ", /* @__PURE__ */ React.createElement("p", { className: "text-muted mb-1" }, job.description || "No description provided."), "                                 "), "                                 ", /* @__PURE__ */ React.createElement("span", { className: `badge ${job.matchesSkill ? "text-bg-primary" : "text-bg-secondary"}` }, "                                   ", job.matchesSkill ? "Matches Your Skills" : "Suggested", "                                 "), "                               "), "                               ", /* @__PURE__ */ React.createElement("p", { className: "mb-1" }, formatLocation(job.barangay, job.streetAddress)), "                               ", /* @__PURE__ */ React.createElement("p", { className: "mb-1" }, formatDateTime(job.preferredDate, job.preferredTime)), "                               ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 text-primary" }, formatRate(job.offeredRate, job.rateType)), "                               ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, job.householdName || "Household"), "                             "), "                           ")), "                       ") : /* @__PURE__ */ React.createElement("p", { className: "mb-0 text-muted" }, "Wala pang posted jobs mula sa households."), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "card border-0 shadow-sm mt-4" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "card-header bg-white d-flex justify-content-between align-items-center" }, "                     ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-0 fw-bold" }, "Recent Applications"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm" }, "View All"), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "table-responsive" }, "                     ", /* @__PURE__ */ React.createElement("table", { className: "table align-middle mb-0" }, "                       ", /* @__PURE__ */ React.createElement("thead", null, "                         ", /* @__PURE__ */ React.createElement("tr", null, "                           ", /* @__PURE__ */ React.createElement("th", null, "Type"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Household"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Distance"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Status"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Applied"), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("tbody", null, "                         ", /* @__PURE__ */ React.createElement("tr", null, "                           ", /* @__PURE__ */ React.createElement("td", { colSpan: "5", className: "text-center text-muted py-4" }, "                             No applications yet.                           "), "                         "), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "worker-find-jobs" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "Find Jobs"), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerApplications }, "                     My Applications                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerGetVerified }, "                     Get Verified                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerNotifications }, "                     Notifications                     ", workerUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, workerUnreadCount), "                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "                     Available Jobs ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, workerVisibleJobs.length), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", workerMiniPhoto ? /* @__PURE__ */ React.createElement("img", { src: workerMiniPhoto, alt: "Worker profile", className: "worker-mini-avatar" }) : /* @__PURE__ */ React.createElement("span", { className: "worker-mini-avatar worker-mini-fallback" }, "                         ", (currentUser?.displayName || "W").slice(0, 1).toUpperCase(), "                       "), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Worker"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "jobs-filter-panel mt-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "row g-2 align-items-end" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                       ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold mb-1" }, "Filter by Job Type"), "                       ", /* @__PURE__ */ React.createElement("select", { className: "form-select" }, "                         ", /* @__PURE__ */ React.createElement("option", null, "All Types"), "                         ", /* @__PURE__ */ React.createElement("option", null, "House Cleaning"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Cooking"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Laundry"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Gardening"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Plumbing"), "                       "), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                       ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold mb-1" }, "Barangay"), "                       ", /* @__PURE__ */ React.createElement("input", { className: "form-control", placeholder: "e.g. Poblacion" }), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "col-md-2" }, "                       ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary w-100" }, "Filter"), "                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("p", { className: "small text-primary fw-semibold mt-3 mb-2" }, "Jobs matching your skills appear first"), "                  ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                   ", workerVisibleJobs.length > 0 ? workerVisibleJobs.map((job) => /* @__PURE__ */ React.createElement("div", { className: "col-lg-6", key: job.id }, "                         ", /* @__PURE__ */ React.createElement("article", { className: "job-card" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-between align-items-start" }, "                             ", /* @__PURE__ */ React.createElement("div", null, "                               ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-1" }, job.jobTitle || job.serviceType), "                               ", /* @__PURE__ */ React.createElement("p", { className: "text-muted mb-1" }, job.description || "No description provided."), "                             "), "                             ", /* @__PURE__ */ React.createElement("span", { className: `badge ${job.matchesSkill ? "text-bg-primary" : "text-bg-secondary"}` }, "                               ", job.matchesSkill ? "Matches Your Skills" : "Suggested", "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-1" }, formatLocation(job.barangay, job.streetAddress)), "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-1" }, formatDateTime(job.preferredDate, job.preferredTime)), "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 text-primary" }, formatRate(job.offeredRate, job.rateType)), "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-3" }, job.householdName || "Household"), "                           ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2" }, "                             ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm flex-fill", type: "button", onClick: () => openWorkerJobDetail(job.id) }, "                               View Details                             "), "                             ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm flex-fill", type: "button", onClick: () => handleApplyToJob(job.id) }, "                               Apply Now                             "), "                           "), "                         "), "                       ")) : /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "p-4 text-center text-muted" }, "                           Wala pang household job posts na available ngayon.                         "), "                       "), "                     "), "                 "), "               "), "             "), "           "), "          ", view === "worker-job-detail" && currentWorkerJobDetail && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active", onClick: openWorkerFindJobs }, "                     Find Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerApplications }, "                     My Applications                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerGetVerified }, "                     Get Verified                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerNotifications }, "                     Notifications                     ", workerUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, workerUnreadCount), "                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "Job Details"), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", workerMiniPhoto ? /* @__PURE__ */ React.createElement("img", { src: workerMiniPhoto, alt: "Worker profile", className: "worker-mini-avatar" }) : /* @__PURE__ */ React.createElement("span", { className: "worker-mini-avatar worker-mini-fallback" }, "                         ", (currentUser?.displayName || "W").slice(0, 1).toUpperCase(), "                       "), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Worker"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: openWorkerFindJobs }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "row g-3 mt-1" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-5" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card h-100" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Household Information"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-4" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "d-flex align-items-center gap-3 mb-3" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "profile-avatar" }, "                             ", (currentWorkerJobDetail.householdName || "H").slice(0, 1).toUpperCase(), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", null, "                             ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-1" }, currentWorkerJobDetail.householdName || "Household"), "                             ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 text-muted" }, "                               ", currentWorkerJobDetail.householdUsername ? `@${currentWorkerJobDetail.householdUsername}` : "Household account", "                             "), "                           "), "                         "), "                          ", /* @__PURE__ */ React.createElement("p", { className: "mb-2 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Location"), "                           ", /* @__PURE__ */ React.createElement("strong", null, formatLocation(currentWorkerJobDetail.barangay, currentWorkerJobDetail.streetAddress)), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-2 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Job Type"), "                           ", /* @__PURE__ */ React.createElement("strong", null, currentWorkerJobDetail.serviceType || "N/A"), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-2 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Schedule"), "                           ", /* @__PURE__ */ React.createElement("strong", null, formatScheduleLabel(currentWorkerJobDetail.scheduleType)), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-2 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Date & Time"), "                           ", /* @__PURE__ */ React.createElement("strong", null, formatDateTime(currentWorkerJobDetail.preferredDate, currentWorkerJobDetail.preferredTime)), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Offered Rate"), "                           ", /* @__PURE__ */ React.createElement("strong", null, formatRate(currentWorkerJobDetail.offeredRate, currentWorkerJobDetail.rateType)), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, "                           ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary w-100", type: "button", onClick: () => handleApplyToJob(currentWorkerJobDetail.id) }, "                             Apply Now                           "), "                         "), "                       "), "                     "), "                   "), "                    ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-7" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card mb-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Job Description"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3" }, "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, currentWorkerJobDetail.description || "No description provided."), "                       "), "                     "), "                      ", /* @__PURE__ */ React.createElement("div", { className: "profile-card mb-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Job Summary"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3 d-grid gap-2" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "verification-note" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Title"), "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, currentWorkerJobDetail.jobTitle || currentWorkerJobDetail.serviceType), "                         "), "                         ", /* @__PURE__ */ React.createElement("div", { className: "verification-note" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Service Type"), "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, currentWorkerJobDetail.serviceType), "                         "), "                         ", /* @__PURE__ */ React.createElement("div", { className: "verification-note" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Status"), "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, currentWorkerJobDetail.status), "                         "), "                       "), "                     "), "                      ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Household Note"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3" }, "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, "                           This job was posted by the household account. Review the details above before applying.                         "), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "worker-profile" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerFindJobs }, "                     Find Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "My Profile"), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerApplications }, "                     My Applications                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerGetVerified }, "                     Get Verified                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerNotifications }, "                     Notifications                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-4" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "My Profile"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3 text-center" }, "                         ", workerMiniPhoto ? /* @__PURE__ */ React.createElement("img", { src: workerMiniPhoto, alt: "Worker profile", className: "profile-photo-large mb-2" }) : /* @__PURE__ */ React.createElement("div", { className: "profile-avatar mb-2" }, "                             ", (workerProfileForm.firstName || "W").slice(0, 1).toUpperCase(), "                           "), "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-1" }, "                           ", getDisplayName(workerProfileForm.firstName, workerProfileForm.lastName, workerProfileForm.username), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "text-muted mb-2" }, "@", workerProfileForm.username || "worker"), "                         ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Worker"), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "px-3 pb-3" }, "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Barangay:"), " ", workerProfileForm.barangay || "Not set", "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Phone:"), " ", workerProfileForm.phone || "Not set", "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-2 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Email:"), " ", workerProfileForm.email || "Not set", "                         "), "                         ", /* @__PURE__ */ React.createElement("hr", { className: "my-2" }), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Verification:"), " ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-warning" }, "Pending"), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Rating:"), " 5.00                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Jobs Done:"), " 3                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Hourly Rate:"), " PHP ", workerProfileForm.hourlyRate || "0.00", "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-2 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Daily Rate:"), " PHP ", workerProfileForm.dailyRate || "0.00", "                         "), "                         ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-1 flex-wrap" }, "                           ", (workerProfileForm.skills || []).length === 0 ? /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-secondary" }, "No skills selected yet") : workerProfileForm.skills.map((skill) => /* @__PURE__ */ React.createElement("span", { key: skill, className: "badge text-bg-primary" }, "                                 ", skill, "                               ")), "                         "), "                       "), "                     "), "                   "), "                    ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-8" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Edit Profile Information"), "                       ", /* @__PURE__ */ React.createElement("form", { className: "p-3", onSubmit: handleWorkerProfileSave }, "                         ", /* @__PURE__ */ React.createElement("h3", { className: "h6 fw-bold mb-2" }, "Profile Photo"), "                         ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                           ", /* @__PURE__ */ React.createElement("input", { type: "file", className: "form-control", name: "profilePhoto", accept: "image/*", onChange: handleWorkerProfileChange }), "                           ", /* @__PURE__ */ React.createElement("p", { className: "form-text mb-0" }, "Accepted: JPG, PNG. Clear face photo recommended."), "                           ", workerProfileForm.profilePhotoPreview && /* @__PURE__ */ React.createElement("img", { src: workerProfileForm.profilePhotoPreview, alt: "Worker profile preview", className: "img-fluid rounded border mt-2" }), "                         "), "                          ", /* @__PURE__ */ React.createElement("h3", { className: "h6 fw-bold mb-2" }, "Personal Information"), "                         ", /* @__PURE__ */ React.createElement("div", { className: "row g-2 mb-3" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "First Name"), "                             ", /* @__PURE__ */ React.createElement("input", { name: "firstName", className: "form-control", value: workerProfileForm.firstName, onChange: handleWorkerProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Last Name"), "                             ", /* @__PURE__ */ React.createElement("input", { name: "lastName", className: "form-control", value: workerProfileForm.lastName, onChange: handleWorkerProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Email"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "email", name: "email", className: "form-control", value: workerProfileForm.email, onChange: handleWorkerProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Phone Number"), "                             ", /* @__PURE__ */ React.createElement("input", { name: "phone", className: "form-control", value: workerProfileForm.phone, onChange: handleWorkerProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Barangay"), "                             ", /* @__PURE__ */ React.createElement("select", { name: "barangay", className: "form-select", value: workerProfileForm.barangay, onChange: handleWorkerProfileChange }, "                               ", /* @__PURE__ */ React.createElement("option", { value: "" }, "---Select Barangay---"), "                               ", renderBarangayOptions(), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Street / House No."), "                             ", /* @__PURE__ */ React.createElement("input", { name: "streetAddress", className: "form-control", value: workerProfileForm.streetAddress, onChange: handleWorkerProfileChange }), "                           "), "                         "), "                          ", /* @__PURE__ */ React.createElement("h3", { className: "h6 fw-bold mb-2" }, "Worker Information"), "                         ", /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, "                           ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Bio / About Me"), "                           ", /* @__PURE__ */ React.createElement("textarea", { name: "bio", className: "form-control", rows: "3", value: workerProfileForm.bio, onChange: handleWorkerProfileChange }), "                         "), "                         ", /* @__PURE__ */ React.createElement("div", { className: "row g-2 mb-3" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Availability"), "                             ", /* @__PURE__ */ React.createElement("div", { className: "form-check mt-1" }, "                               ", /* @__PURE__ */ React.createElement("input", { className: "form-check-input", type: "checkbox", id: "availability", name: "availability", checked: workerProfileForm.availability, onChange: handleWorkerProfileChange }), "                               ", /* @__PURE__ */ React.createElement("label", { className: "form-check-label", htmlFor: "availability" }, "                                 Available                               "), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Hourly Rate (PHP)"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "number", step: "0.01", min: "0", name: "hourlyRate", className: "form-control", value: workerProfileForm.hourlyRate, onChange: handleWorkerProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Daily Rate (PHP)"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "number", step: "0.01", min: "0", name: "dailyRate", className: "form-control", value: workerProfileForm.dailyRate, onChange: handleWorkerProfileChange }), "                           "), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                           ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "                             Skills ", /* @__PURE__ */ React.createElement("span", { className: "fw-normal text-muted" }, "(Select all that apply)"), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "skills-grid" }, "                             ", SKILLS.map((skill) => /* @__PURE__ */ React.createElement("label", { key: skill, className: "form-check" }, "                                 ", /* @__PURE__ */ React.createElement("input", { type: "checkbox", className: "form-check-input", checked: workerProfileForm.skills.includes(skill), onChange: () => toggleWorkerProfileSkill(skill) }), "                                 ", /* @__PURE__ */ React.createElement("span", { className: "form-check-label" }, skill), "                               ")), "                           "), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2" }, "                           ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", type: "submit" }, "                             Save Changes                           "), "                           ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary", type: "button", onClick: openWorkerDashboard }, "                             Cancel                           "), "                         "), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "worker-applications" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerFindJobs }, "                     Find Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "                     My Applications                     ", workerApplicationUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, workerApplicationUnreadCount), "                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerGetVerified }, "                     Get Verified                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerNotifications }, "                     Notifications                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "My Applications"), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", workerMiniPhoto ? /* @__PURE__ */ React.createElement("img", { src: workerMiniPhoto, alt: "Worker profile", className: "worker-mini-avatar" }) : /* @__PURE__ */ React.createElement("span", { className: "worker-mini-avatar worker-mini-fallback" }, "                         ", (currentUser?.displayName || "W").slice(0, 1).toUpperCase(), "                       "), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Worker"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "applications-filter mt-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "row g-2" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                       ", /* @__PURE__ */ React.createElement("select", { className: "form-select" }, "                         ", /* @__PURE__ */ React.createElement("option", null, "All Status"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Pending"), "                         ", /* @__PURE__ */ React.createElement("option", null, "In Progress"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Completed"), "                       "), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "col-md-2" }, "                       ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary w-100" }, "Filter"), "                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "card border-0 shadow-sm mt-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "table-responsive" }, "                     ", /* @__PURE__ */ React.createElement("table", { className: "table align-middle mb-0" }, "                       ", /* @__PURE__ */ React.createElement("thead", null, "                         ", /* @__PURE__ */ React.createElement("tr", null, "                           ", /* @__PURE__ */ React.createElement("th", null, "Job"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Household"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Distance"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Rate"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Status"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Applied"), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("tbody", null, "                         ", workerApplications.length > 0 ? workerApplications.map((job) => /* @__PURE__ */ React.createElement("tr", { key: `${job.id}-${job.appliedAt}` }, "                               ", /* @__PURE__ */ React.createElement("td", null, job.jobTitle || job.serviceType), "                               ", /* @__PURE__ */ React.createElement("td", null, job.householdName || "Household"), "                               ", /* @__PURE__ */ React.createElement("td", null, formatLocation(job.barangay, job.streetAddress)), "                               ", /* @__PURE__ */ React.createElement("td", null, formatRate(job.offeredRate, job.rateType)), "                               ", /* @__PURE__ */ React.createElement("td", null, job.applicationStatus || "Pending"), "                               ", /* @__PURE__ */ React.createElement("td", null, job.appliedAt), "                             ")) : /* @__PURE__ */ React.createElement("tr", null, "                             ", /* @__PURE__ */ React.createElement("td", { colSpan: "6", className: "text-center text-muted py-4" }, "                               No applications yet.                             "), "                           "), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "worker-get-verified" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerFindJobs }, "                     Find Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerApplications }, "                     My Applications                     ", workerApplicationUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, workerApplicationUnreadCount), "                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "Get Verified"), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerNotifications }, "                     Notifications                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", currentWorker?.verification === "Verified" ? /* @__PURE__ */ React.createElement("div", { className: "profile-card mt-3" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Get Verified"), "                     ", /* @__PURE__ */ React.createElement("div", { className: "p-4" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "verification-note mb-3" }, "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-2" }, "You're already verified"), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, "                           Your verification is already approved by the admin, so the details below are now read-only.                         "), "                       "), "                        ", currentWorker.verificationSubmission && /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("div", { className: "verification-note h-100" }, "                               ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Primary ID"), "                               ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, currentWorker.verificationSubmission.primaryIdName), "                               ", currentWorker.verificationSubmission.primaryIdPreview && /* @__PURE__ */ React.createElement("img", { src: currentWorker.verificationSubmission.primaryIdPreview, alt: "Primary ID", className: "img-fluid rounded border mt-2" }), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("div", { className: "verification-note h-100" }, "                               ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Supporting Document"), "                               ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, currentWorker.verificationSubmission.secondaryDocName), "                               ", currentWorker.verificationSubmission.secondaryDocPreview && /* @__PURE__ */ React.createElement("img", { src: currentWorker.verificationSubmission.secondaryDocPreview, alt: "Supporting document", className: "img-fluid rounded border mt-2" }), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                             ", /* @__PURE__ */ React.createElement("div", { className: "verification-note" }, "                               ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Admin Note"), "                               ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 small" }, "                                 ", currentWorker.verificationReviewedBy ? `Verified by ${currentWorker.verificationReviewedBy} on ${currentWorker.verificationReviewedAt}.` : "Verified by admin.", "                               "), "                             "), "                           "), "                         "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2 mt-3" }, "                         ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-secondary", onClick: openWorkerDashboard }, "                           Back                         "), "                       "), "                     "), "                   ") : /* @__PURE__ */ React.createElement("div", { className: "verification-wrap" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "verification-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "verification-card-head" }, "Submit Verification Documents"), "                       ", /* @__PURE__ */ React.createElement("form", { className: "p-3 p-md-4", onSubmit: handleVerificationSubmit }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "verification-note mb-3" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 small" }, "                             ", /* @__PURE__ */ React.createElement("strong", null, "Why get verified?"), " Verified workers appear higher in smart matching and                             help households trust your profile faster.                           "), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                           ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Primary ID Document"), "                           ", /* @__PURE__ */ React.createElement("input", { type: "file", className: "form-control", name: "primaryId", onChange: handleVerificationChange }), "                           ", /* @__PURE__ */ React.createElement("p", { className: "form-text mb-0" }, "                             Accepted: Government-issued ID (SSS, GSIS, Passport, etc.)                           "), "                           ", verificationForm.primaryIdName && /* @__PURE__ */ React.createElement("p", { className: "small text-muted mt-1 mb-0" }, "Selected: ", verificationForm.primaryIdName), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                           ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Supporting Document"), "                           ", /* @__PURE__ */ React.createElement("input", { type: "file", className: "form-control", name: "secondaryDoc", onChange: handleVerificationChange }), "                           ", /* @__PURE__ */ React.createElement("p", { className: "form-text mb-0" }, "                             Accepted: Barangay clearance, NBI clearance, certificate of employment, etc.                           "), "                           ", verificationForm.secondaryDocName && /* @__PURE__ */ React.createElement("p", { className: "small text-muted mt-1 mb-0" }, "Selected: ", verificationForm.secondaryDocName), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                           ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Additional Notes (Optional)"), "                           ", /* @__PURE__ */ React.createElement("textarea", { className: "form-control", rows: "3", name: "notes", placeholder: "Add any notes about your submitted documents...", value: verificationForm.notes, onChange: handleVerificationChange }), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2" }, "                           ", /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary" }, "                             Submit Documents                           "), "                           ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-secondary", onClick: openWorkerDashboard }, "                             Cancel                           "), "                         "), "                       "), "                     "), "                   "), "               "), "             "), "           "), "          ", view === "worker-notifications" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerFindJobs }, "                     Find Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerApplications }, "                     My Applications                     ", workerApplicationUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, workerApplicationUnreadCount), "                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openWorkerGetVerified }, "                     Get Verified                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "Notifications"), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "Notifications"), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", workerMiniPhoto ? /* @__PURE__ */ React.createElement("img", { src: workerMiniPhoto, alt: "Worker profile", className: "worker-mini-avatar" }) : /* @__PURE__ */ React.createElement("span", { className: "worker-mini-avatar worker-mini-fallback" }, "                         ", (currentUser?.displayName || "W").slice(0, 1).toUpperCase(), "                       "), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Worker"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-end mt-3" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: () => markAllNotificationsRead(workerNotificationsWithReadState) }, "                     Mark All as Read                   "), "                 "), "                 ", /* @__PURE__ */ React.createElement("div", { className: "mt-3 d-grid gap-2" }, "                   ", workerNotificationsWithReadState.map((item) => /* @__PURE__ */ React.createElement("article", { className: `notification-card ${item.unread ? "unread" : ""}`, key: item.id, role: "button", tabIndex: 0, onClick: () => markNotificationRead(item.id), onKeyDown: (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      markNotificationRead(item.id);
    }
  } }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, item.date), "                       ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-1" }, item.title), "                       ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, item.message), "                     ")), "                 "), "               "), "             "), "           "), "          ", view === "admin-dashboard" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "Admin Panel"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: `worker-nav-item ${adminSection === "verification" ? "active" : ""}`, onClick: openAdminDashboard }, "                     Verification Queue                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: `worker-nav-item ${adminSection === "history" ? "active" : ""}`, onClick: openAdminWorkersHistory }, "                     Workers History                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "                     ", adminSection === "history" ? "Workers History" : "Verification Dashboard", "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-dark" }, "Admin"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", adminSection === "verification" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "                     ", /* @__PURE__ */ React.createElement("div", { className: "row g-3 mt-1" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Pending"), "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, pendingVerificationRequests.length), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Under Review"), "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, "                             ", verificationRequests.filter((item) => item.status === "Under Review").length, "                           "), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Approved"), "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, approvedVerificationRequests.length), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-3" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Rejected"), "                           ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, rejectedVerificationRequests.length), "                         "), "                       "), "                     "), "                      ", /* @__PURE__ */ React.createElement("div", { className: "card border-0 shadow-sm mt-4" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "card-header bg-white d-flex justify-content-between align-items-center" }, "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-0 fw-bold" }, "Worker Verification Requests"), "                         ", /* @__PURE__ */ React.createElement("span", { className: "small text-muted" }, verificationRequests.length, " total"), "                       "), "                       ", selectedVerificationRequest && /* @__PURE__ */ React.createElement("div", { className: "p-3 border-bottom bg-light" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-between align-items-start gap-3 flex-wrap" }, "                             ", /* @__PURE__ */ React.createElement("div", null, "                               ", /* @__PURE__ */ React.createElement("h3", { className: "h6 mb-1" }, selectedVerificationRequest.workerName), "                               ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-0" }, "@", selectedVerificationRequest.workerUsername), "                             "), "                             ", /* @__PURE__ */ React.createElement("span", { className: `badge ${selectedVerificationRequest.status === "Approved" ? "text-bg-success" : selectedVerificationRequest.status === "Rejected" ? "text-bg-danger" : "text-bg-warning"}` }, "                               ", selectedVerificationRequest.status, "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "row g-2 mt-2" }, "                             ", selectedVerificationRequest.primaryIdPreview && /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                                 ", /* @__PURE__ */ React.createElement("div", { className: "verification-note h-100" }, "                                   ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-2" }, "Primary ID Preview"), "                                   ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link p-0 border-0", onClick: () => openFilePreview(selectedVerificationRequest.primaryIdPreview) }, "                                     ", /* @__PURE__ */ React.createElement("img", { src: selectedVerificationRequest.primaryIdPreview, alt: "Primary ID preview", className: "img-fluid rounded border" }), "                                   "), "                                 "), "                               "), "                             ", selectedVerificationRequest.secondaryDocPreview && /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                                 ", /* @__PURE__ */ React.createElement("div", { className: "verification-note h-100" }, "                                   ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-2" }, "Supporting Doc Preview"), "                                   ", /* @__PURE__ */ React.createElement("a", { href: selectedVerificationRequest.secondaryDocPreview, download: selectedVerificationRequest.secondaryDocName || "supporting-doc", target: "_blank", rel: "noreferrer", className: "d-inline-block" }, "                                     ", /* @__PURE__ */ React.createElement("img", { src: selectedVerificationRequest.secondaryDocPreview, alt: "Supporting document preview", className: "img-fluid rounded border" }), "                                   "), "                                   ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-0 mt-2" }, "Click to download the file."), "                                 "), "                               "), "                           "), "                         "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3 d-grid gap-3" }, "                         ", verificationRequests.length > 0 ? verificationRequests.map((request) => /* @__PURE__ */ React.createElement("article", { className: `verification-admin-card ${selectedVerificationRequestId === request.id ? "selected" : ""}`, key: request.id, role: "button", tabIndex: 0, onClick: () => openVerificationRequest(request.id), onKeyDown: (event) => {
    if (event.key === "Enter" || event.key === " ") {
      openVerificationRequest(request.id);
    }
  } }, "                               ", /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-between align-items-start gap-3 flex-wrap" }, "                                 ", /* @__PURE__ */ React.createElement("div", null, "                                   ", /* @__PURE__ */ React.createElement("h3", { className: "h6 mb-1" }, request.workerName), "                                   ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, "@", request.workerUsername), "                                   ", /* @__PURE__ */ React.createElement("p", { className: "small mb-1" }, "                                     ", /* @__PURE__ */ React.createElement("strong", null, "Status:"), " ", request.status, "                                   "), "                                   ", /* @__PURE__ */ React.createElement("p", { className: "small mb-1" }, "                                     ", /* @__PURE__ */ React.createElement("strong", null, "Submitted:"), " ", request.submittedAt, "                                   "), "                                   ", request.reviewedAt && /* @__PURE__ */ React.createElement("p", { className: "small mb-1" }, "                                       ", /* @__PURE__ */ React.createElement("strong", null, "Reviewed:"), " ", request.reviewedAt, "                                     "), "                                   ", request.reviewNote && /* @__PURE__ */ React.createElement("p", { className: "small mb-0" }, "                                       ", /* @__PURE__ */ React.createElement("strong", null, "Admin Note:"), " ", request.reviewNote, "                                     "), "                                 "), "                                 ", /* @__PURE__ */ React.createElement("span", { className: `badge ${request.status === "Approved" ? "text-bg-success" : request.status === "Rejected" ? "text-bg-danger" : "text-bg-warning"}` }, "                                   ", request.status, "                                 "), "                               "), "                                ", /* @__PURE__ */ React.createElement("div", { className: "row g-2 mt-2" }, "                                 ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                                   ", /* @__PURE__ */ React.createElement("div", { className: "verification-note h-100" }, "                                     ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Primary ID"), "                                     ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 small" }, request.primaryIdName), "                                   "), "                                 "), "                                 ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                                   ", /* @__PURE__ */ React.createElement("div", { className: "verification-note h-100" }, "                                     ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Supporting Doc"), "                                     ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 small" }, request.secondaryDocName), "                                   "), "                                 "), "                                 ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                                   ", /* @__PURE__ */ React.createElement("div", { className: "verification-note h-100" }, "                                     ", /* @__PURE__ */ React.createElement("p", { className: "small fw-semibold mb-1" }, "Notes"), "                                     ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 small" }, request.notes || "No additional notes provided."), "                                   "), "                                 "), "                               "), "                                ", request.status === "Pending" || request.status === "Under Review" ? /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2 mt-3 flex-wrap" }, "                                   ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-success btn-sm", onClick: () => handleAdminApproveVerification(request.id) }, "                                     Approve                                   "), "                                   ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-danger btn-sm", onClick: () => handleAdminRejectVerification(request.id) }, "                                     Reject                                   "), "                                 ") : null, "                             ")) : /* @__PURE__ */ React.createElement("div", { className: "text-center text-muted py-4" }, "No verification requests yet."), "                       "), "                     "), "                   ") : /* @__PURE__ */ React.createElement("div", { className: "card border-0 shadow-sm mt-4" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "card-header bg-white d-flex justify-content-between align-items-center" }, "                       ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-0 fw-bold" }, "Workers History"), "                       ", /* @__PURE__ */ React.createElement("span", { className: "small text-muted" }, "Verified and submitted workers"), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "table-responsive" }, "                       ", /* @__PURE__ */ React.createElement("table", { className: "table align-middle mb-0" }, "                         ", /* @__PURE__ */ React.createElement("thead", null, "                           ", /* @__PURE__ */ React.createElement("tr", null, "                             ", /* @__PURE__ */ React.createElement("th", null, "Worker"), "                             ", /* @__PURE__ */ React.createElement("th", null, "Verification"), "                             ", /* @__PURE__ */ React.createElement("th", null, "Submitted"), "                             ", /* @__PURE__ */ React.createElement("th", null, "Reviewed By"), "                           "), "                         "), "                         ", /* @__PURE__ */ React.createElement("tbody", null, "                           ", adminVisibleWorkers.length > 0 ? adminVisibleWorkers.map((worker) => /* @__PURE__ */ React.createElement("tr", { key: worker.id }, "                                 ", /* @__PURE__ */ React.createElement("td", null, getDisplayName(worker.firstName, worker.lastName, worker.username)), "                                 ", /* @__PURE__ */ React.createElement("td", null, "                                   ", /* @__PURE__ */ React.createElement("span", { className: `badge ${worker.verification === "Verified" ? "text-bg-success" : worker.verification === "Under Review" ? "text-bg-warning" : "text-bg-secondary"}` }, "                                     ", worker.verification || "Not Yet Verified", "                                   "), "                                 "), "                                 ", /* @__PURE__ */ React.createElement("td", null, worker.verificationSubmission?.submittedAt || "None"), "                                 ", /* @__PURE__ */ React.createElement("td", null, worker.verificationReviewedBy || "None"), "                               ")) : /* @__PURE__ */ React.createElement("tr", null, "                               ", /* @__PURE__ */ React.createElement("td", { colSpan: "4", className: "text-center text-muted py-4" }, "                                 No verified or registered workers to display.                               "), "                             "), "                         "), "                       "), "                     "), "                   "), "               "), "             "), "           "), "          ", view === "household-post-job" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "Post a Job"), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdMyJobs }, "                     My Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdNotifications }, "                     Notifications                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "Post a New Job"), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, currentUser?.displayName || "Household"), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Household"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "profile-card mt-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Post a New Job"), "                   ", /* @__PURE__ */ React.createElement("form", { className: "p-3 p-md-4", onSubmit: handleHouseholdJobSubmit }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Job Title"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "jobTitle", className: "form-control", placeholder: "e.g. House Cleaning - 3 Bedroom", value: householdJobForm.jobTitle, onChange: handleHouseholdJobChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Service Type"), "                         ", /* @__PURE__ */ React.createElement("select", { name: "serviceType", className: "form-select", value: householdJobForm.serviceType, onChange: handleHouseholdJobChange }, "                           ", /* @__PURE__ */ React.createElement("option", { value: "" }, "---Select Service---"), "                           ", SKILLS.map((skill) => /* @__PURE__ */ React.createElement("option", { key: skill, value: skill }, "                               ", skill, "                             ")), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Schedule Type"), "                         ", /* @__PURE__ */ React.createElement("select", { name: "scheduleType", className: "form-select", value: householdJobForm.scheduleType, onChange: handleHouseholdJobChange }, "                           ", /* @__PURE__ */ React.createElement("option", null, "One - Time"), "                           ", /* @__PURE__ */ React.createElement("option", null, "Part-Time"), "                           ", /* @__PURE__ */ React.createElement("option", null, "Full-Time"), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Preferred Date"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "date", name: "preferredDate", className: "form-control", value: householdJobForm.preferredDate, onChange: handleHouseholdJobChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Preferred Time"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "time", name: "preferredTime", className: "form-control", value: householdJobForm.preferredTime, onChange: handleHouseholdJobChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Job Description"), "                         ", /* @__PURE__ */ React.createElement("textarea", { name: "description", className: "form-control", rows: "3", placeholder: "Describe the job in detail...", value: householdJobForm.description, onChange: handleHouseholdJobChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Barangay"), "                         ", /* @__PURE__ */ React.createElement("select", { name: "barangay", className: "form-select", value: householdJobForm.barangay, onChange: handleHouseholdJobChange }, "                           ", /* @__PURE__ */ React.createElement("option", { value: "" }, "---Select Barangay---"), "                           ", renderBarangayOptions(), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Street / House No."), "                         ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "streetAddress", className: "form-control", value: householdJobForm.streetAddress, onChange: handleHouseholdJobChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Offered Rate (PHP)"), "                         ", /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", step: "0.01", name: "offeredRate", className: "form-control", value: householdJobForm.offeredRate, onChange: handleHouseholdJobChange }), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                         ", /* @__PURE__ */ React.createElement("label", { className: "form-label fw-semibold" }, "Rate Type"), "                         ", /* @__PURE__ */ React.createElement("select", { name: "rateType", className: "form-select", value: householdJobForm.rateType, onChange: handleHouseholdJobChange }, "                           ", /* @__PURE__ */ React.createElement("option", null, "Per Day"), "                           ", /* @__PURE__ */ React.createElement("option", null, "Per Hour"), "                           ", /* @__PURE__ */ React.createElement("option", null, "Fixed Rate"), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "col-12 d-flex gap-2" }, "                         ", /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary" }, "                           Post Job                         "), "                         ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-secondary", onClick: openHouseholdDashboard }, "                           Cancel                         "), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "household-profile" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdPostJob }, "                     Post a Job                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdMyJobs }, "                     My Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "My Profile"), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdNotifications }, "                     Notifications                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-4" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "My Profile"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3 text-center" }, "                         ", householdProfileForm.profilePhotoPreview ? /* @__PURE__ */ React.createElement("img", { src: householdProfileForm.profilePhotoPreview, alt: "Household profile", className: "profile-photo-large mb-2" }) : /* @__PURE__ */ React.createElement("div", { className: "profile-avatar mb-2" }, "                             ", (householdProfileForm.firstName || "H").slice(0, 1).toUpperCase(), "                           "), "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-1" }, "                           ", getDisplayName(householdProfileForm.firstName, householdProfileForm.lastName, householdProfileForm.username), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "text-muted mb-2" }, "@", householdProfileForm.username || "household"), "                         ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Household"), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "px-3 pb-3" }, "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Barangay:"), " ", householdProfileForm.barangay || "Not set", "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Phone:"), " ", householdProfileForm.phone || "Not set", "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-2 small" }, "                           ", /* @__PURE__ */ React.createElement("strong", null, "Email:"), " ", householdProfileForm.email || "Not set", "                         "), "                       "), "                     "), "                   "), "                    ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-8" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Edit Profile Information"), "                       ", /* @__PURE__ */ React.createElement("form", { className: "p-3", onSubmit: handleHouseholdProfileSave }, "                         ", /* @__PURE__ */ React.createElement("h3", { className: "h6 fw-bold mb-2" }, "Profile Photo"), "                         ", /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, "                           ", /* @__PURE__ */ React.createElement("input", { type: "file", className: "form-control", name: "profilePhoto", accept: "image/*", onChange: handleHouseholdProfileChange }), "                           ", /* @__PURE__ */ React.createElement("p", { className: "form-text mb-0" }, "Accepted: JPG, PNG. Use a clear profile photo."), "                           ", householdProfileForm.profilePhotoPreview && /* @__PURE__ */ React.createElement("img", { src: householdProfileForm.profilePhotoPreview, alt: "Household profile preview", className: "img-fluid rounded border mt-2" }), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "row g-2 mb-3" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "First Name"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "firstName", className: "form-control", value: householdProfileForm.firstName, onChange: handleHouseholdProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Last Name"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "lastName", className: "form-control", value: householdProfileForm.lastName, onChange: handleHouseholdProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Username"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "username", className: "form-control", value: householdProfileForm.username, disabled: true }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Email"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "email", name: "email", className: "form-control", value: householdProfileForm.email, onChange: handleHouseholdProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Phone Number"), "                             ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "phone", className: "form-control", value: householdProfileForm.phone, onChange: handleHouseholdProfileChange }), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Barangay"), "                             ", /* @__PURE__ */ React.createElement("select", { name: "barangay", className: "form-select", value: householdProfileForm.barangay, onChange: handleHouseholdProfileChange }, "                               ", /* @__PURE__ */ React.createElement("option", { value: "" }, "---Select Barangay---"), "                               ", renderBarangayOptions(), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-12" }, "                             ", /* @__PURE__ */ React.createElement("label", { className: "form-label small fw-semibold mb-1" }, "Street / House No."), "                             ", /* @__PURE__ */ React.createElement("input", { type: "text", name: "streetAddress", className: "form-control", value: householdProfileForm.streetAddress, onChange: handleHouseholdProfileChange }), "                           "), "                         "), "                          ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2" }, "                           ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", type: "submit" }, "                             Save Profile                           "), "                           ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary", type: "button", onClick: openHouseholdDashboard }, "                             Back to Dashboard                           "), "                         "), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "household-my-jobs" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdPostJob }, "                     Post a Job                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active" }, "My Jobs"), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdNotifications }, "                     Notifications                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "My Jobs"), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, currentUser?.displayName || "Household"), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Household"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", !householdJobs.length && /* @__PURE__ */ React.createElement("div", { className: "profile-card mt-3" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "p-4 text-center" }, "                       ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-2" }, "No job posts yet"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "text-muted mb-3" }, "                         Kapag nag-post ka ng job, lalabas dito ang details at matched workers.                       "), "                       ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: openHouseholdPostJob }, "                         Post a New Job                       "), "                     "), "                   "), "                  ", householdJobs.length > 0 && selectedJob && /* @__PURE__ */ React.createElement(React.Fragment, null, "                     ", /* @__PURE__ */ React.createElement("div", { className: "my-jobs-list mt-3" }, "                       ", householdJobs.map((job) => /* @__PURE__ */ React.createElement("button", { key: job.id, type: "button", className: `job-summary-card ${selectedJob.id === job.id ? "active" : ""}`, onClick: () => openHouseholdJobDetail(job.id) }, "                           ", /* @__PURE__ */ React.createElement("div", null, "                             ", /* @__PURE__ */ React.createElement("p", { className: "job-summary-title mb-1" }, job.jobTitle || job.serviceType), "                             ", /* @__PURE__ */ React.createElement("p", { className: "job-summary-meta mb-0" }, "                               ", job.serviceType, " ??? ", formatLocation(job.barangay, job.streetAddress), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("span", { className: `badge ${getJobStatusBadgeClass(job.status)}` }, "                             ", job.status, "                           "), "                         ")), "                     "), "                      ", /* @__PURE__ */ React.createElement("div", { className: "my-jobs-card mt-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "my-jobs-card-head d-flex justify-content-between align-items-center" }, "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h6 fw-bold mb-0" }, selectedJob.jobTitle || selectedJob.serviceType), "                         ", /* @__PURE__ */ React.createElement("span", { className: `badge ${selectedJob.status === "Cancelled" ? "text-bg-danger" : "text-bg-primary"}` }, "                           ", selectedJob.status, "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3" }, "                         ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-3" }, "                             ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, "Service Type"), "                             ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 fw-semibold" }, selectedJob.serviceType), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-3" }, "                             ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, "Schedule"), "                             ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 fw-semibold" }, formatScheduleLabel(selectedJob.scheduleType)), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-3" }, "                             ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, "Date & Time"), "                             ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 fw-semibold" }, "                               ", formatDateTime(selectedJob.preferredDate, selectedJob.preferredTime), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-3" }, "                             ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, "Offered Rate"), "                             ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 fw-semibold text-primary" }, "                               ", formatRate(selectedJob.offeredRate, selectedJob.rateType), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-3" }, "                             ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, "Location"), "                             ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 fw-semibold" }, "                               ", formatLocation(selectedJob.barangay, selectedJob.streetAddress), "                             "), "                           "), "                           ", /* @__PURE__ */ React.createElement("div", { className: "col-md-9" }, "                             ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, "Description"), "                             ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 fw-semibold" }, "                               ", selectedJob.description || "No description provided.", "                             "), "                           "), "                         "), "                         ", selectedJob.status !== "Cancelled" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-danger btn-sm mt-3", type: "button", onClick: () => handleCancelJob(selectedJob.id) }, "                             Cancel Job                           "), "                       "), "                     "), "                      ", /* @__PURE__ */ React.createElement("div", { className: "my-jobs-card mt-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "my-jobs-card-head d-flex justify-content-between align-items-center" }, "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h6 fw-bold mb-0" }, "Smart Matched Workers"), "                         ", /* @__PURE__ */ React.createElement("span", { className: "fw-semibold small" }, selectedMatchedWorkers.length, " worker(s) found"), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "small px-3 py-2 border-bottom bg-light" }, "                         Click a worker to view their full profile and description.                       "), "                        ", /* @__PURE__ */ React.createElement("div", { className: "p-2 p-md-3 d-grid gap-2" }, "                         ", selectedMatchedWorkers.map((worker, index) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "matched-worker-item matched-worker-button", key: worker.id, onClick: () => openMatchedWorkerProfile(worker.id, selectedJob.id) }, "                             ", /* @__PURE__ */ React.createElement("div", { className: "d-flex align-items-center gap-3" }, "                               ", /* @__PURE__ */ React.createElement("span", { className: "match-rank" }, index + 1), "                               ", /* @__PURE__ */ React.createElement("div", { className: "profile-avatar match-avatar" }, "                                 ", (worker.avatar || worker.firstName || worker.username || "W").slice(0, 1).toUpperCase(), "                               "), "                               ", /* @__PURE__ */ React.createElement("div", { className: "flex-grow-1 text-start" }, "                                 ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 fw-semibold" }, "                                   ", getDisplayName(worker.firstName, worker.lastName, worker.username), "                                 "), "                                 ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2 flex-wrap" }, "                                   ", (worker.skills || []).slice(0, 2).map((skill) => /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary", key: `${worker.id}-${skill}` }, "                                       ", skill, "                                     ")), "                                   ", /* @__PURE__ */ React.createElement("span", { className: `badge ${worker.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}` }, "                                     ", worker.verification || "Not Yet Verified", "                                   "), "                                   ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-light border text-dark" }, "                                     ", formatCurrency(worker.dailyRate), "/day                                   "), "                                   ", /* @__PURE__ */ React.createElement("span", { className: "small text-muted align-self-center" }, worker.rating), "                                 "), "                               "), "                               ", /* @__PURE__ */ React.createElement("div", { className: "distance-pill" }, "                                 ", /* @__PURE__ */ React.createElement("span", { className: "distance-value" }, worker.distanceLabel || formatDistance(worker.distanceKm, worker.distanceLabel) || "Distance unavailable"), "                                 ", /* @__PURE__ */ React.createElement("span", { className: "distance-label" }, "MATCH"), "                               "), "                             "), "                           ")), "                       "), "                     "), "                   "), "               "), "             "), "           "), "          ", view === "household-worker-profile" && selectedWorker && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdPostJob }, "                     Post a Job                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active", onClick: openHouseholdMyJobs }, "                     My Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active", onClick: openHouseholdNotifications }, "                     Notifications                     ", householdUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, householdUnreadCount), "                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-4" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3 text-center" }, "                         ", selectedWorkerPhoto ? /* @__PURE__ */ React.createElement("img", { className: "profile-photo-large mb-2", src: selectedWorkerPhoto, alt: `${getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username)} profile` }) : /* @__PURE__ */ React.createElement("div", { className: "profile-avatar mb-2" }, "                           ", (selectedWorker.avatar || selectedWorker.firstName || "W").slice(0, 1).toUpperCase(), "                         "), "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h5 mb-1" }, "                           ", getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-2" }, "                           ", formatLocation(selectedWorker.barangay, selectedWorker.streetAddress), "                         "), "                         ", /* @__PURE__ */ React.createElement("span", { className: `badge ${selectedWorker.verification === "Verified" ? "text-bg-success" : "text-bg-warning"}` }, "                           ", selectedWorker.verification || "Not Yet Verified", "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("div", { className: "px-3 pb-3" }, "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Rating"), "                           ", /* @__PURE__ */ React.createElement("strong", null, selectedWorker.rating || "No ratings yet"), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Jobs Done"), "                           ", /* @__PURE__ */ React.createElement("strong", null, selectedWorker.reviewsDone || 0), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Experience"), "                           ", /* @__PURE__ */ React.createElement("strong", null, selectedWorker.yearsExperience || 0, " yr(s)"), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Status"), "                           ", /* @__PURE__ */ React.createElement("strong", null, selectedWorker.status || "Available"), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Distance"), "                           ", /* @__PURE__ */ React.createElement("strong", null, selectedWorker.distanceLabel || formatDistance(selectedWorker.distanceKm, selectedWorker.distanceLabel) || "Distance unavailable"), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Hourly Rate"), "                           ", /* @__PURE__ */ React.createElement("strong", null, formatCurrency(selectedWorker.hourlyRate)), "                         "), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-3 small d-flex justify-content-between" }, "                           ", /* @__PURE__ */ React.createElement("span", null, "Daily Rate"), "                           ", /* @__PURE__ */ React.createElement("strong", null, formatCurrency(selectedWorker.dailyRate)), "                         "), "                         ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary w-100 mb-2", type: "button", onClick: handleHireWorker }, "                           Hire This Worker                         "), "                         ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary w-100", type: "button", onClick: openHouseholdMyJobs }, "                           Go Back                         "), "                       "), "                     "), "                   "), "                    ", /* @__PURE__ */ React.createElement("div", { className: "col-lg-8" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "profile-card mb-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "About"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3" }, "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, selectedWorker.bio || "No description provided yet."), "                       "), "                     "), "                      ", /* @__PURE__ */ React.createElement("div", { className: "profile-card mb-3" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Skills & Expertise"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3 d-flex gap-2 flex-wrap" }, "                         ", (selectedWorker.skills || []).map((skill) => /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary", key: `${selectedWorker.id}-${skill}` }, "                             ", skill, "                           ")), "                       "), "                     "), "                      ", /* @__PURE__ */ React.createElement("div", { className: "profile-card" }, "                       ", /* @__PURE__ */ React.createElement("div", { className: "profile-card-head" }, "Reviews & Ratings"), "                       ", /* @__PURE__ */ React.createElement("div", { className: "p-3 d-grid gap-3" }, "                         ", (selectedWorker.receivedReviews || []).length > 0 ? selectedWorker.receivedReviews.map((review) => /* @__PURE__ */ React.createElement("article", { key: review.id, className: "review-item" }, "                               ", /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-between gap-3" }, "                                 ", /* @__PURE__ */ React.createElement("div", null, "                                   ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 fw-semibold" }, review.authorName || review.author || "User"), "                                   ", /* @__PURE__ */ React.createElement("p", { className: "mb-1 small text-muted" }, review.feedback || review.comment || ""), "                                   ", /* @__PURE__ */ React.createElement("p", { className: "mb-0 small text-muted" }, review.createdAt || review.date || "Recently"), "                                 "), "                                 ", /* @__PURE__ */ React.createElement("strong", null, review.rating != null ? `${review.rating}/5` : "Feedback"), "                               "), "                             ")) : /* @__PURE__ */ React.createElement("p", { className: "mb-0 text-muted" }, "No reviews yet."), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "          ", view === "household-notifications" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdPostJob }, "                     Post a Job                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdMyJobs }, "                     My Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active", onClick: openHouseholdNotifications }, "                     Notifications                     ", householdUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, householdUnreadCount), "                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0 d-flex align-items-center gap-2" }, "                     Notifications                     ", householdUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, householdUnreadCount), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, currentUser?.displayName || "Household"), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Household"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "applications-filter mt-3" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "row g-2" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "col-md-4" }, "                       ", /* @__PURE__ */ React.createElement("select", { className: "form-select" }, "                         ", /* @__PURE__ */ React.createElement("option", null, "All Notifications"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Job Updates"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Worker Matches"), "                         ", /* @__PURE__ */ React.createElement("option", null, "Job Status"), "                       "), "                     "), "                     ", /* @__PURE__ */ React.createElement("div", { className: "col-md-3 ms-md-auto" }, "                       ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary w-100", type: "button", onClick: () => markAllNotificationsRead(householdNotificationsWithReadState) }, "                         Mark All as Read                       "), "                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "mt-3 d-grid gap-2" }, "                   ", householdNotificationsWithReadState.length > 0 ? householdNotificationsWithReadState.map((item) => /* @__PURE__ */ React.createElement("article", { className: `notification-card ${item.unread ? "unread" : ""}`, key: item.id, role: "button", tabIndex: 0, onClick: () => {
    markNotificationRead(item.id);
    openHouseholdNotificationWorker(item);
  }, onKeyDown: (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      markNotificationRead(item.id);
      openHouseholdNotificationWorker(item);
    }
  } }, "                         ", /* @__PURE__ */ React.createElement("p", { className: "small text-muted mb-1" }, item.date), "                         ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-1" }, item.title), "                         ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, item.message), "                         ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline-secondary btn-sm mt-3", onClick: () => openHouseholdNotificationWorker(item) }, "                           View Details                         "), "                       ")) : /* @__PURE__ */ React.createElement("article", { className: "notification-card" }, "                       ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-1" }, "No notifications yet"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "mb-0" }, "There are no applications or updates for this household account yet."), "                     "), "                 "), "               "), "             "), "           "), "          ", view === "household-dashboard" && /* @__PURE__ */ React.createElement("section", { className: "worker-dashboard" }, "             ", /* @__PURE__ */ React.createElement("div", { className: "worker-layout" }, "               ", /* @__PURE__ */ React.createElement("aside", { className: "worker-sidebar" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-sidebar-head" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-logo" }, "GG"), "                   ", /* @__PURE__ */ React.createElement("p", { className: "worker-brand mb-0" }, "GawaGo Community Platform"), "                 "), "                 ", /* @__PURE__ */ React.createElement("nav", { className: "worker-nav" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item active", onClick: openHouseholdDashboard }, "                     Dashboard                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdPostJob }, "                     Post a Job                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdMyJobs }, "                     My Jobs                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdProfile }, "                     My Profile                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "worker-nav-item", onClick: openHouseholdNotifications }, "                     Notifications                     ", householdUnreadCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "nav-count-badge" }, householdUnreadCount), "                   "), "                 "), "               "), "                ", /* @__PURE__ */ React.createElement("div", { className: "worker-content" }, "                 ", /* @__PURE__ */ React.createElement("div", { className: "worker-topbar" }, "                   ", /* @__PURE__ */ React.createElement("h1", { className: "h4 mb-0" }, "Welcome, ", currentUser?.displayName || "Household", "!"), "                   ", /* @__PURE__ */ React.createElement("div", { className: "worker-user-meta d-flex align-items-center gap-2" }, "                     ", /* @__PURE__ */ React.createElement("span", { className: "small fw-semibold" }, currentUser?.displayName || "Household"), "                     ", /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-primary" }, "Household"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: goBack }, "                       Back                     "), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", type: "button", onClick: handleLogout }, "                       Log Out                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "row g-3 mt-1" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-4" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Active Jobs"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, "                         ", householdJobs.filter((job) => job.status === "Open").length, "                       "), "                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-4" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Cancelled Jobs"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, "                         ", householdJobs.filter((job) => job.status === "Cancelled").length, "                       "), "                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "col-md-6 col-xl-4" }, "                     ", /* @__PURE__ */ React.createElement("div", { className: "metric-card" }, "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-label mb-1" }, "Posted Jobs"), "                       ", /* @__PURE__ */ React.createElement("p", { className: "metric-value mb-0" }, householdJobs.length), "                     "), "                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "d-flex gap-2 flex-wrap mt-3" }, "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: openHouseholdPostJob }, "                     Post a New Job                   "), "                   ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-primary btn-sm", onClick: openHouseholdMyJobs }, "                     View All My Jobs                   "), "                 "), "                  ", /* @__PURE__ */ React.createElement("div", { className: "card border-0 shadow-sm mt-4" }, "                   ", /* @__PURE__ */ React.createElement("div", { className: "card-header bg-white d-flex justify-content-between align-items-center" }, "                     ", /* @__PURE__ */ React.createElement("h2", { className: "h6 mb-0 fw-bold" }, "Recent Job Posts"), "                     ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", onClick: openHouseholdMyJobs }, "                       View All                     "), "                   "), "                   ", /* @__PURE__ */ React.createElement("div", { className: "table-responsive" }, "                     ", /* @__PURE__ */ React.createElement("table", { className: "table align-middle mb-0" }, "                       ", /* @__PURE__ */ React.createElement("thead", null, "                         ", /* @__PURE__ */ React.createElement("tr", null, "                           ", /* @__PURE__ */ React.createElement("th", null, "Type"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Barangay"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Rate"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Status"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Applications"), "                           ", /* @__PURE__ */ React.createElement("th", null, "Action"), "                         "), "                       "), "                       ", /* @__PURE__ */ React.createElement("tbody", null, "                         ", householdJobs.length > 0 ? householdJobs.map((job) => /* @__PURE__ */ React.createElement("tr", { key: job.id }, "                               ", /* @__PURE__ */ React.createElement("td", null, job.serviceType), "                               ", /* @__PURE__ */ React.createElement("td", null, job.barangay || "Not set"), "                               ", /* @__PURE__ */ React.createElement("td", null, formatRate(job.offeredRate, job.rateType)), "                               ", /* @__PURE__ */ React.createElement("td", null, "                                 ", /* @__PURE__ */ React.createElement("span", { className: `badge ${getJobStatusBadgeClass(job.status)}` }, "                                   ", job.status, "                                 "), "                               "), "                               ", /* @__PURE__ */ React.createElement("td", null, buildMatchedWorkersForJob(job, registeredWorkers).length), "                               ", /* @__PURE__ */ React.createElement("td", null, "                                 ", /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline-secondary btn-sm", onClick: () => openHouseholdJobDetail(job.id) }, "                                   View                                 "), "                               "), "                             ")) : /* @__PURE__ */ React.createElement("tr", null, "                             ", /* @__PURE__ */ React.createElement("td", { colSpan: "6", className: "text-center text-muted py-4" }, "                               No posted jobs yet.                             "), "                           "), "                       "), "                     "), "                   "), "                 "), "               "), "             "), "           "), "       "), "     ");
}
export {
  App as default
};



