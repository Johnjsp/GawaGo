import React, { useEffect, useState } from "react";
import { DashboardSidebar, DashboardTopbar } from "./DashboardLayout";
import JobImageGallery from "./JobImageGallery";
import LocationDistanceMap from "./LocationDistanceMap";
import { formatDistance, formatLocation, formatRate, getDisplayName, getHouseholdPhoto } from "../utils/formatters";
import { getHiringProgressLabel, getJobStatusBadgeClass } from "../utils/jobUtils";
import { haversineDistanceKm } from "../utils/locationServices";

export default function WorkerJobDetailView({
  currentWorker,
  currentWorkerJobDetail,
  currentWorkerJobHousehold,
  handleApplyToJob,
  handleLogout,
  openWorkerApplications,
  openWorkerDashboard,
  openWorkerFindJobs,
  openWorkerGetVerified,
  openWorkerNotifications,
  openWorkerProfile,
  workerApplicationUnreadCount,
}) {
  const job = currentWorkerJobDetail;
  const household = currentWorkerJobHousehold;
  const householdName = getDisplayName(
    household?.firstName,
    household?.lastName,
    job?.householdName || job?.householdUsername || "Household",
  );
  const householdPhoto = getHouseholdPhoto(household);
  const alreadyApplied =
    job && currentWorker
      ? (job.applications || []).some(
          (application) =>
            String(application.workerId) === String(currentWorker.id) ||
            application.workerUsername === currentWorker.username,
        )
      : false;
  const jobLatitude = job?.latitude ?? household?.latitude ?? null;
  const jobLongitude = job?.longitude ?? household?.longitude ?? null;
  const workerLatitude = currentWorker?.latitude ?? null;
  const workerLongitude = currentWorker?.longitude ?? null;
  const jobDistanceKm = haversineDistanceKm(workerLatitude, workerLongitude, jobLatitude, jobLongitude);
  const [routeDistanceKm, setRouteDistanceKm] = useState(null);
  const distanceLabel = formatDistance(routeDistanceKm ?? jobDistanceKm);
  const canApply = currentWorker?.verification === "Verified";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    setRouteDistanceKm(null);
  }, [job?.id, currentWorker?.id, currentWorker?.username]);
  useEffect(() => {
    document.body.classList.toggle("gawago-mobile-menu-open", mobileMenuOpen);
    return () => document.body.classList.remove("gawago-mobile-menu-open");
  }, [mobileMenuOpen]);
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
  return (
    <div className="app-shell">
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
      <main>
        <section className="worker-dashboard worker-job-detail-page">
          <div className="worker-layout">
            <DashboardSidebar
              items={[
                {
                  id: "dashboard",
                  label: "Dashboard",
                  onClick: openWorkerDashboard,
                },
                {
                  id: "find-jobs",
                  label: "Find Jobs",
                  active: true,
                  onClick: openWorkerFindJobs,
                },
                {
                  id: "profile",
                  label: "My Profile",
                  onClick: openWorkerProfile,
                },
                {
                  id: "applications",
                  label: "My Applications",
                  count: workerApplicationUnreadCount,
                  onClick: openWorkerApplications,
                },
                {
                  id: "verified",
                  label: "Get Verified",
                  section: "Account",
                  onClick: openWorkerGetVerified,
                },
                {
                  id: "notifications",
                  label: "Notifications",
                  onClick: openWorkerNotifications,
                },
              ]}
              footerAction={{
                label: "Log Out",
                onClick: handleLogout,
              }}
            />
            <div className="worker-content">
              <DashboardTopbar title="Job Details" />
              {!job ? (
                <div className="profile-card mt-3">
                  <div className="profile-card-head">Job not found</div>
                  <div className="p-3">
                    <p className="mb-3 text-muted">This job is no longer available or could not be loaded.</p>
                    <button className="btn btn-primary" type="button" onClick={openWorkerFindJobs}>
                      Back to Find Jobs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="worker-job-detail-shell">
                  <div className="worker-job-detail-main">
                    <div className="profile-card worker-job-household-card" data-household-profile-preview="true">
                      <div className="profile-card-head">Household Profile</div>
                      <div className="worker-job-household-body">
                        {householdPhoto ? (
                          <img src={householdPhoto} alt={`${householdName} profile`} className="household-profile-photo" />
                        ) : (
                          <div className="household-profile-fallback">
                            {(householdName || "H").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="mb-1 fw-semibold">{householdName}</p>
                          <p className="mb-1 small text-muted">
                            {formatLocation(household?.barangay || job.barangay, household?.streetAddress || job.streetAddress)}
                          </p>
                          <p className="mb-0 small text-muted">
                            {[household?.phone ? `+63${household.phone}` : "", household?.email || ""]
                              .filter(Boolean)
                              .join(" | ") || "Contact details not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="profile-card worker-job-info-card">
                      <div className="profile-card-head d-flex justify-content-between align-items-center gap-3">
                        <span>{job.jobTitle || job.serviceType}</span>
                        <span className={`badge ${getJobStatusBadgeClass(job.status)}`}>{job.status || "Open"}</span>
                      </div>
                      <div className="worker-job-info-body">
                        <dl className="worker-job-detail-list">
                          <div>
                            <dt>Service</dt>
                            <dd>{job.serviceType || "Not set"}</dd>
                          </div>
                          <div>
                            <dt>Schedule</dt>
                            <dd>{job.scheduleType || "Not set"}</dd>
                          </div>
                          <div>
                            <dt>Date</dt>
                            <dd>{job.preferredDate || "Not set"}</dd>
                          </div>
                          <div>
                            <dt>Time</dt>
                            <dd>{job.preferredTime || "Not set"}</dd>
                          </div>
                          <div>
                            <dt>Needed</dt>
                            <dd>{getHiringProgressLabel(job)} hired</dd>
                          </div>
                          <div>
                            <dt>Rate</dt>
                            <dd>{formatRate(job.offeredRate, job.rateType)}</dd>
                          </div>
                          <div>
                            <dt>Location</dt>
                            <dd>{formatLocation(household?.barangay || job.barangay, household?.streetAddress || job.streetAddress)}</dd>
                          </div>
                        </dl>
                        <div className="worker-job-description">
                          <p className="small text-muted fw-semibold mb-1">Descriptions</p>
                          <p className="mb-0">{job.description || "No description provided."}</p>
                        </div>
                        <div className="worker-job-actions">
                          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openWorkerFindJobs}>
                            Back to Find Jobs
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            type="button"
                            disabled={alreadyApplied || !canApply}
                            onClick={() => handleApplyToJob(job.id)}
                          >
                            {alreadyApplied ? "Already Applied" : "Apply Now"}
                          </button>
                        </div>
                        {!canApply && !alreadyApplied && (
                          <div className="alert alert-warning mt-3 mb-0 py-2">
                            You cannot apply yet. Please complete your verification first to unlock job applications.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="profile-card worker-job-map-card" data-worker-job-distance-map="true">
                    <div className="profile-card-head d-flex justify-content-between align-items-center gap-3">
                      <span>Distance & Locations</span>
                      <span className="badge text-bg-light">{distanceLabel}</span>
                    </div>
                    <div className="worker-job-map-body">
                      <LocationDistanceMap
                        userLatitude={workerLatitude}
                        userLongitude={workerLongitude}
                        targetLatitude={jobLatitude}
                        targetLongitude={jobLongitude}
                        userLocation={formatLocation(currentWorker?.barangay, currentWorker?.streetAddress)}
                        targetLocation={formatLocation(
                          household?.barangay || job.barangay,
                          household?.streetAddress || job.streetAddress,
                        )}
                        distanceKm={jobDistanceKm}
                        formatDistanceFn={formatDistance}
                        onRouteDistanceChange={setRouteDistanceKm}
                      />
                    </div>
                  </div>

                  <div className="profile-card worker-job-photos-card">
                    <div className="profile-card-head">Photos of Work Area</div>
                    <div className="worker-job-photos-body">
                      <p className="small text-muted mb-3">These photos help workers see the area before applying.</p>
                      <JobImageGallery images={job.images || []} />
                    </div>
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
