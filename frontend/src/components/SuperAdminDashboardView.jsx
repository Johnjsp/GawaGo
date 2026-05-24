import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardSidebar, MetricCard } from "./DashboardLayout";
import SuperAdminHeatMap from "./SuperAdminHeatMap";
import {
  ANALYTICS_CHART_COLORS,
  BARANGAYS,
  PHILIPPINES_MAP_CENTER,
  SKILLS,
} from "../constants/appConstants";
import {
  buildBarangayAnalytics,
  buildBarangayHeatMapData,
  buildMonthlyJobRequests,
  buildRatingDistribution,
  buildServiceAnalytics,
  getWorkerRatingValue,
} from "../utils/analyticsUtils";
import { formatCurrency, getDisplayName, isImagePreviewUrl } from "../utils/formatters";
import { loadLeafletAssets } from "../utils/mapAssets";

export default function SuperAdminDashboardView({
  currentUser,
  handleAdminApproveVerification,
  handleAdminRejectVerification,
  handleLogout,
  heatMapMetric,
  openFilePreview,
  openVerificationRequest,
  pendingVerificationRequests,
  postedJobs,
  registeredHouseholds,
  registeredWorkers,
  rejectedVerificationRequests,
  selectedVerificationRequest,
  setHeatMapMetric,
  setSuperAdminSection,
  superAdminSection,
  verificationRequests,
}) {
  const [verificationModalRequestId, setVerificationModalRequestId] = React.useState(null);
  const totalApplications = postedJobs.reduce((sum, job) => sum + (job.applications || []).length, 0);
  const activeApplications = postedJobs.reduce(
    (sum, job) =>
      sum +
      (job.applications || []).filter(
        (application) => !["Rejected", "Completed", "Cancelled"].includes(application.status),
      ).length,
    0,
  );
  const ongoingMatches = postedJobs.filter((job) =>
    (job.applications || []).some((application) => application.status === "Hired"),
  ).length;
  const cancelledRequests = postedJobs.filter((job) => job.status === "Cancelled").length;
  const completedServices = postedJobs.filter((job) => job.status === "Completed").length;
  const verifiedWorkers = registeredWorkers.filter((worker) => worker.verification === "Verified").length;
  const totalUsers = registeredWorkers.length + registeredHouseholds.length;
  const verifiedPercent = registeredWorkers.length ? Math.round((verifiedWorkers / registeredWorkers.length) * 100) : 0;
  const barangayDemand = BARANGAYS.map((barangay) => ({
    barangay,
    jobs: postedJobs.filter((job) => job.barangay === barangay).length,
    workers: registeredWorkers.filter((worker) => worker.barangay === barangay).length,
  }))
    .filter((item) => item.jobs || item.workers)
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 6);
  const jobCategories = SKILLS.map((skill) => {
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
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const activeJobs = postedJobs.filter((job) => job.status === "Open").length;
  const monthlyJobRequests = buildMonthlyJobRequests(postedJobs);
  const serviceAnalytics = buildServiceAnalytics(postedJobs);
  const barangayJobAnalytics = buildBarangayAnalytics(postedJobs, (job) => job.barangay, "jobs");
  const barangayWorkerAnalytics = buildBarangayAnalytics(registeredWorkers, (worker) => worker.barangay, "workers");
  const workerRatingValues = registeredWorkers.map(getWorkerRatingValue).filter((rating) => rating != null);
  const averageWorkerRating = workerRatingValues.length
    ? (workerRatingValues.reduce((sum, rating) => sum + rating, 0) / workerRatingValues.length).toFixed(2)
    : "No ratings yet";
  const ratingDistribution = buildRatingDistribution(registeredWorkers);
  const rejectedWorkerVerifications = registeredWorkers.filter((worker) => worker.verification === "Rejected").length;
  const heatMapOptions = [
    {
      id: "jobs",
      label: "Job Demand",
    },
    {
      id: "workers",
      label: "Worker Availability",
    },
    {
      id: "completed",
      label: "Completed Services",
    },
    {
      id: "verification",
      label: "Pending Verifications",
    },
  ];
  const selectedHeatMapOption = heatMapOptions.find((option) => option.id === heatMapMetric) || heatMapOptions[0];
  const heatMapData = buildBarangayHeatMapData(
    postedJobs,
    registeredWorkers,
    verificationRequests,
    selectedHeatMapOption.id,
  );
  const recentAuditLogs = [
    ...verificationRequests.slice(0, 6).map((request) => ({
      id: `verification-${request.id}`,
      timestamp: request.reviewedAt || request.submittedAt || "Recently",
      admin: request.reviewedBy || currentUser?.displayName || "Super Admin",
      action: `${request.status} verification`,
      target: request.workerName || request.workerUsername,
      status: request.status,
    })),
    {
      id: "system-login",
      timestamp: "Current session",
      admin: currentUser?.displayName || "Super Admin",
      action: "superadmin_login",
      target: "GawaGo frontend",
      status: "Success",
    },
  ];
  const tabs = [
    {
      id: "verification",
      label: "Verification Queue",
    },
    {
      id: "analytics",
      label: "Analytics",
    },
    {
      id: "adminmgmt",
      label: "Admin Management",
    },
    {
      id: "audit",
      label: "Audit Logs",
    },
  ];
  const renderStatusBadge = (status) => {
    const badgeClass =
      status === "Approved" || status === "Success"
        ? "text-bg-success"
        : status === "Rejected"
          ? "text-bg-danger"
          : "text-bg-warning";
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };
  const verificationModalRequest =
    verificationRequests.find((request) => String(request.id) === String(verificationModalRequestId)) || null;
  const verificationModalWorker =
    verificationModalRequest &&
    registeredWorkers.find(
      (worker) =>
        String(worker.id) === String(verificationModalRequest.workerId) ||
        worker.username === verificationModalRequest.workerUsername ||
        getDisplayName(worker.firstName, worker.lastName, worker.username) === verificationModalRequest.workerName,
    );
  const openVerificationModal = (request) => {
    openVerificationRequest(request.id);
    setVerificationModalRequestId(request.id);
  };
  const closeVerificationModal = () => {
    setVerificationModalRequestId(null);
  };
  const approveVerificationRequest = (requestId) => {
    handleAdminApproveVerification(requestId);
    closeVerificationModal();
  };
  const rejectVerificationRequest = (requestId) => {
    handleAdminRejectVerification(requestId);
    closeVerificationModal();
  };
  return (
    <div className="app-shell">
      <main>
        <section className="worker-dashboard superadmin-dashboard">
          <div className="worker-layout">
            <DashboardSidebar
              brand="SuperAdmin Panel"
              items={tabs.map((tab) => ({
                ...tab,
                active: superAdminSection === tab.id,
                onClick: () => setSuperAdminSection(tab.id),
              }))}
              footerAction={{
                label: "Log Out",
                onClick: handleLogout,
              }}
            />
            <div className="worker-content">
              <div className="row g-3 mt-1">
                <div className="col-md-6 col-xl">
                  <MetricCard
                    label="Pending Verifications"
                    value={pendingVerificationRequests.length}
                    note="Queue needing admin review"
                    className="superadmin-stat-danger"
                  />
                </div>
                <div className="col-md-6 col-xl">
                  <MetricCard
                    label="Verified Workers"
                    value={verifiedWorkers}
                    note={`${verifiedPercent}% of worker accounts`}
                    className="superadmin-stat-success"
                  />
                </div>
                <div className="col-md-6 col-xl">
                  <MetricCard
                    label="Rejected Workers"
                    value={Math.max(rejectedVerificationRequests.length, rejectedWorkerVerifications)}
                    note="Verification requests rejected"
                    className="superadmin-stat-danger"
                  />
                </div>
                <div className="col-md-6 col-xl">
                  <MetricCard
                    label="Total Users"
                    value={totalUsers}
                    note={`${registeredHouseholds.length} households, ${registeredWorkers.length} workers`}
                    className="superadmin-stat-warning"
                  />
                </div>
              </div>

              <div className="superadmin-tabs mt-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`superadmin-tab ${superAdminSection === tab.id ? "active" : ""}`}
                    onClick={() => setSuperAdminSection(tab.id)}
                  >
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
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Worker</th>
                          <th>Submitted</th>
                          <th>Submitted Files</th>
                          <th>Review Note</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verificationRequests.length > 0 ? (
                          verificationRequests.map((request) => (
                            <tr
                              className="verification-queue-row"
                              key={request.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openVerificationModal(request)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openVerificationModal(request);
                                }
                              }}
                            >
                              <td>
                                <strong>{request.workerName}</strong>
                                <br />
                                <span className="small text-muted">@{request.workerUsername}</span>
                              </td>
                              <td>{request.submittedAt || "Recently"}</td>
                              <td>
                                {[request.primaryIdName || "Primary ID", request.secondaryDocName || "Supporting Doc"]
                                  .filter(Boolean)
                                  .join(", ")}
                              </td>
                              <td>{request.reviewNote || request.notes || "No notes yet"}</td>
                              <td>{renderStatusBadge(request.status)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No verification requests yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {verificationModalRequest && (
                    <div className="superadmin-verification-modal-backdrop" role="presentation" onClick={closeVerificationModal}>
                      <section
                        aria-modal="true"
                        className="superadmin-verification-modal"
                        role="dialog"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="superadmin-verification-modal-body">
                          <div className="superadmin-verification-worker-profile">
                            <div className="superadmin-verification-avatar">
                              {String(verificationModalRequest.workerName || verificationModalRequest.workerUsername || "W")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="superadmin-verification-profile-name">
                                <h3>{verificationModalRequest.workerName || "Worker"}</h3>
                                {renderStatusBadge(verificationModalRequest.status)}
                              </div>
                              <p>@{verificationModalRequest.workerUsername || "worker"}</p>
                            </div>
                            <div className="superadmin-verification-profile-facts">
                              <div>
                                <strong>Submitted Date</strong>
                                <span>{verificationModalRequest.submittedAt || "Recently"}</span>
                              </div>
                              <div>
                                <strong>Full Name</strong>
                                <span>
                                  {verificationModalWorker
                                    ? getDisplayName(
                                        verificationModalWorker.firstName,
                                        verificationModalWorker.lastName,
                                        verificationModalWorker.username,
                                      )
                                    : verificationModalRequest.workerName || "Not available"}
                                </span>
                              </div>
                              <div>
                                <strong>Phone</strong>
                                <span>{verificationModalWorker?.phone || "Not set"}</span>
                              </div>
                              <div>
                                <strong>Email</strong>
                                <span>{verificationModalWorker?.email || "Not set"}</span>
                              </div>
                              <div>
                                <strong>Barangay</strong>
                                <span>{verificationModalWorker?.barangay || "Not set"}</span>
                              </div>
                              <div>
                                <strong>Address</strong>
                                <span>{verificationModalWorker?.streetAddress || "Not set"}</span>
                              </div>
                              <div>
                                <strong>Skills</strong>
                                <span>{(verificationModalWorker?.skills || []).join(", ") || "No skills listed"}</span>
                              </div>
                              <div>
                                <strong>Rate</strong>
                                <span>
                                  {verificationModalWorker
                                    ? `${formatCurrency(verificationModalWorker.dailyRate)}/day`
                                    : "Not set"}
                                </span>
                              </div>
                              <div>
                                <strong>Experience</strong>
                                <span>{verificationModalWorker?.yearsExperience || 0} yr(s)</span>
                              </div>
                              <div>
                                <strong>Worker Notes</strong>
                                <span>{verificationModalRequest.notes || "No notes submitted."}</span>
                              </div>
                              <div>
                                <strong>Admin Note</strong>
                                <span>{verificationModalRequest.reviewNote || "No admin note yet."}</span>
                              </div>
                            </div>
                          </div>
                          <div className="verification-document-card superadmin-verification-documents h-100">
                            <h3>Submitted Documents</h3>
                            {[
                              {
                                label: "Primary ID",
                                name: verificationModalRequest.primaryIdName,
                                preview: verificationModalRequest.primaryIdPreview,
                              },
                              {
                                label: "Supporting Document",
                                name: verificationModalRequest.secondaryDocName,
                                preview: verificationModalRequest.secondaryDocPreview,
                              },
                            ].map((documentItem) => (
                              <div className="superadmin-verification-document-item" key={documentItem.label}>
                                <p className="small text-muted mb-1">{documentItem.label}</p>
                                <p className="fw-semibold mb-2">{documentItem.name || "No file name"}</p>
                                {documentItem.preview ? (
                                  isImagePreviewUrl(documentItem.preview) ? (
                                    <button
                                      type="button"
                                      className="verification-document-preview"
                                      onClick={() => openFilePreview(documentItem.preview)}
                                    >
                                      <img src={documentItem.preview} alt={`${documentItem.label} preview`} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => openFilePreview(documentItem.preview)}
                                    >
                                      Open Document
                                    </button>
                                  )
                                ) : (
                                  <p className="small text-muted mb-0">
                                    Preview file is not stored for this backend record.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="superadmin-verification-modal-actions">
                          {!["Approved", "Rejected"].includes(verificationModalRequest.status) ? (
                            <>
                              <button
                                className="btn btn-success"
                                type="button"
                                onClick={() => approveVerificationRequest(verificationModalRequest.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                type="button"
                                onClick={() => rejectVerificationRequest(verificationModalRequest.id)}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button className="btn btn-primary" type="button" onClick={closeVerificationModal}>
                              Done
                            </button>
                          )}
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              )}

              {superAdminSection === "analytics" && (
                <>
                  <div className="superadmin-analytics mt-3">
                    <div className="row g-3 mt-1">
                      <div className="col-md-6 col-xl-2">
                        <MetricCard label="Total Users" value={totalUsers} className="analytics-summary-card" />
                      </div>
                      <div className="col-md-6 col-xl-2">
                        <MetricCard
                          label="Total Workers"
                          value={registeredWorkers.length}
                          className="analytics-summary-card"
                        />
                      </div>
                      <div className="col-md-6 col-xl-2">
                        <MetricCard
                          label="Households"
                          value={registeredHouseholds.length}
                          className="analytics-summary-card"
                        />
                      </div>
                      <div className="col-md-6 col-xl-2">
                        <MetricCard label="Active Jobs" value={activeJobs} className="analytics-summary-card" />
                      </div>
                      <div className="col-md-6 col-xl-2">
                        <MetricCard
                          label="Completed Jobs"
                          value={completedServices}
                          className="analytics-summary-card"
                        />
                      </div>
                      <div className="col-md-6 col-xl-2">
                        <MetricCard
                          label="Pending Verifications"
                          value={pendingVerificationRequests.length}
                          className="analytics-summary-card"
                        />
                      </div>
                    </div>

                    <div className="profile-card analytics-card">
                      <div className="profile-card-head analytics-heatmap-head">
                        <span>Barangay Heat Map</span>
                        <div
                          className="btn-group btn-group-sm analytics-heatmap-tabs"
                          role="group"
                          aria-label="Heat map metric"
                        >
                          {heatMapOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`btn ${heatMapMetric === option.id ? "btn-primary" : "btn-outline-primary"}`}
                              onClick={() => setHeatMapMetric(option.id)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <SuperAdminHeatMap
                        data={heatMapData}
                        metricLabel={selectedHeatMapOption.label}
                        mapCenter={PHILIPPINES_MAP_CENTER}
                        loadLeafletAssets={loadLeafletAssets}
                      />
                    </div>

                    <div className="row g-3 mt-1 analytics-chart-grid">
                      <div className="col-xl-6">
                        <div className="profile-card analytics-card h-100">
                          <div className="profile-card-head">Monthly Job Requests</div>
                          <div className="analytics-chart-wrap">
                            <ResponsiveContainer width="100%" height={280}>
                              <LineChart
                                data={monthlyJobRequests}
                                margin={{
                                  top: 16,
                                  right: 18,
                                  left: 0,
                                  bottom: 4,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ff" />
                                <XAxis
                                  dataKey="month"
                                  tick={{
                                    fill: "#5f6b7b",
                                    fontSize: 12,
                                  }}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  tick={{
                                    fill: "#5f6b7b",
                                    fontSize: 12,
                                  }}
                                />
                                <Tooltip />
                                <Line
                                  type="monotone"
                                  dataKey="requests"
                                  stroke="#667eea"
                                  strokeWidth={3}
                                  dot={{
                                    r: 4,
                                  }}
                                  activeDot={{
                                    r: 6,
                                  }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-6">
                        <div className="profile-card analytics-card h-100">
                          <div className="profile-card-head">Most Requested Services</div>
                          <div className="analytics-chart-wrap">
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart
                                data={serviceAnalytics}
                                margin={{
                                  top: 16,
                                  right: 18,
                                  left: 0,
                                  bottom: 4,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ff" />
                                <XAxis
                                  dataKey="service"
                                  tick={{
                                    fill: "#5f6b7b",
                                    fontSize: 12,
                                  }}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  tick={{
                                    fill: "#5f6b7b",
                                    fontSize: 12,
                                  }}
                                />
                                <Tooltip />
                                <Bar dataKey="requests" radius={[8, 8, 0, 0]}>
                                  {serviceAnalytics.map((entry, index) => (
                                    <Cell
                                      key={entry.service}
                                      fill={ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length]}
                                    />
                                  ))}
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
                              <thead>
                                <tr>
                                  <th>Barangay</th>
                                  <th>Job Requests</th>
                                  <th>Demand</th>
                                </tr>
                              </thead>
                              <tbody>
                                {barangayJobAnalytics.length > 0 ? (
                                  barangayJobAnalytics.map((item) => (
                                    <tr key={item.barangay}>
                                      <td>{item.barangay}</td>
                                      <td>{item.jobs}</td>
                                      <td>
                                        <div className="analytics-meter">
                                          <span
                                            style={{
                                              width: `${Math.max(8, (item.jobs / Math.max(...barangayJobAnalytics.map((row) => row.jobs), 1)) * 100)}%`,
                                            }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="3" className="text-center text-muted py-4">
                                      No barangay job data yet.
                                    </td>
                                  </tr>
                                )}
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
                              <thead>
                                <tr>
                                  <th>Barangay</th>
                                  <th>Workers</th>
                                  <th>Availability</th>
                                </tr>
                              </thead>
                              <tbody>
                                {barangayWorkerAnalytics.length > 0 ? (
                                  barangayWorkerAnalytics.map((item) => (
                                    <tr key={item.barangay}>
                                      <td>{item.barangay}</td>
                                      <td>{item.workers}</td>
                                      <td>
                                        <div className="analytics-meter availability">
                                          <span
                                            style={{
                                              width: `${Math.max(8, (item.workers / Math.max(...barangayWorkerAnalytics.map((row) => row.workers), 1)) * 100)}%`,
                                            }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="3" className="text-center text-muted py-4">
                                      No barangay worker data yet.
                                    </td>
                                  </tr>
                                )}
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
                              <BarChart
                                data={ratingDistribution}
                                margin={{
                                  top: 16,
                                  right: 18,
                                  left: 0,
                                  bottom: 4,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ff" />
                                <XAxis
                                  dataKey="stars"
                                  tick={{
                                    fill: "#5f6b7b",
                                    fontSize: 12,
                                  }}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  tick={{
                                    fill: "#5f6b7b",
                                    fontSize: 12,
                                  }}
                                />
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
                              <thead>
                                <tr>
                                  <th>Category</th>
                                  <th>Posts</th>
                                  <th>Average Rate</th>
                                </tr>
                              </thead>
                              <tbody>
                                {jobCategories.length > 0 ? (
                                  jobCategories.map((item) => (
                                    <tr key={item.skill}>
                                      <td>{item.skill}</td>
                                      <td>{item.count}</td>
                                      <td>{formatCurrency(item.averageRate)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="3" className="text-center text-muted py-4">
                                      No rate data yet.
                                    </td>
                                  </tr>
                                )}
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
                    <button className="btn btn-primary btn-sm" type="button">
                      Add Admin
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Admin Name</th>
                          <th>Username</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <strong>Super Admin</strong>
                          </td>
                          <td>superadmin</td>
                          <td>Full System Control</td>
                          <td>
                            <span className="badge text-bg-dark">Owner</span>
                          </td>
                          <td>
                            <button className="btn btn-outline-secondary btn-sm" type="button">
                              Manage
                            </button>
                          </td>
                        </tr>
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
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Admin</th>
                          <th>Action</th>
                          <th>Target</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAuditLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{log.timestamp}</td>
                            <td>{log.admin}</td>
                            <td>{log.action}</td>
                            <td>{log.target}</td>
                            <td>{renderStatusBadge(log.status)}</td>
                          </tr>
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
