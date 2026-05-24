import { STATUS_PRIORITY } from "../constants/appConstants";
import { getDisplayName } from "./formatters";

export function getHouseholdNotifications(jobs, workers) {
  return jobs.flatMap((job) => (job.applications || []).map((application) => {
    const worker = workers.find((item) => item.id === application.workerId);
    return {
      id: `application-${job.id}-${application.workerId}-${application.appliedAt}`,
      title: "New worker application",
      message: `${getDisplayName(worker?.firstName, worker?.lastName, worker?.username)} applied to "${job.jobTitle || job.serviceType}".`,
      date: application.appliedAt || "Recently",
      workerId: application.workerId,
      jobId: job.id,
    };
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getVerificationNotifications(requests, workers) {
  return requests.map((request) => {
    const worker = workers.find((item) => item.id === request.workerId);
    return {
      id: `verification-${request.id}`,
      title: `Verification ${request.status}`,
      message: `${getDisplayName(worker?.firstName, worker?.lastName, worker?.username)}'s documents are ${request.status.toLowerCase()}.`,
      date: request.submittedAt || request.reviewedAt || "Recently",
    };
  }).sort((a, b) => (STATUS_PRIORITY[a.title.split(" ").pop()] || 0) - (STATUS_PRIORITY[b.title.split(" ").pop()] || 0));
}
