export function useGawaGoActions({
  EMPTY_HOUSEHOLD_FORM,
  EMPTY_HOUSEHOLD_REVIEW_FORM,
  EMPTY_WORKER_FEEDBACK_FORM,
  EMPTY_WORKER_FORM,
  SUPER_ADMIN_ACCOUNT,
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
  isJobOpenForApplications,
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
  setSuperAdminSection,
  setVerificationRequests,
  setView,
  setWorkerFeedbackForm,
  setWorkerForm,
  verificationForm,
  verificationRequests,
  workerFeedbackForm,
  workerForm,
  workerProfileForm,
}) {
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
          body: {
            worker_username: currentWorker.username,
            worker_role: "worker",
            note: "",
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to apply for this job."));
        }
        const appliedAt = data?.applied_at || new Date().toLocaleString("en-PH");
        const application = {
          id: data?.id || `application-${job.id}-${currentWorker.id}-${Date.now()}`,
          workerId: data?.worker || currentWorker.id,
          workerName:
            data?.worker_name ||
            getDisplayName(currentWorker.firstName, currentWorker.lastName, currentWorker.username),
          workerUsername: data?.worker_username || currentWorker.username,
          appliedAt,
          status: "Pending",
        };
        setPostedJobs((prev) =>
          prev.map((item) =>
            item.id === jobId
              ? {
                  ...item,
                  applications: [...(item.applications || []), application],
                }
              : item,
          ),
        );
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert("Application sent to the household.");
        setView("worker-applications");
      } catch (error) {
        const appliedAt = new Date().toLocaleString("en-PH");
        const application = {
          id: `application-${job.id}-${currentWorker.id}-${Date.now()}`,
          workerId: currentWorker.id,
          workerName: getDisplayName(currentWorker.firstName, currentWorker.lastName, currentWorker.username),
          workerUsername: currentWorker.username,
          appliedAt,
          status: "Pending",
        };
        setPostedJobs((prev) =>
          prev.map((item) =>
            item.id === jobId
              ? {
                  ...item,
                  applications: [...(item.applications || []), application],
                }
              : item,
          ),
        );
        window.alert(error.message || "Application sent locally.");
        setView("worker-applications");
      }
    })();
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
      const hiredAt = new Date().toLocaleString("en-PH");
      const applicationRecord = existingApplication
        ? {
            ...existingApplication,
            status: "Hired",
            hiredAt,
          }
        : {
            id: `application-${selectedJob.id}-${selectedWorker.id}-${Date.now()}`,
            workerId: selectedWorker.id,
            workerName: getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username),
            workerUsername: selectedWorker.username,
            appliedAt: hiredAt,
            hiredAt,
            status: "Hired",
          };
      const applicationStatusTargetId = isNumericIdentifier(existingApplication?.id)
        ? existingApplication.id
        : selectedJob.id;
      try {
        const response = await apiRequest(`jobs/applications/${applicationStatusTargetId}/status/`, {
          method: "PATCH",
          auth: false,
          body: {
            household_username: currentHousehold.username,
            status: "hired",
            job_id: selectedJob.id,
            worker_username: selectedWorker.username,
            worker_role: "worker",
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to hire worker."));
        }
        const normalizedApplication = normalizeBackendApplication(data);
        setPostedJobs((prev) =>
          prev.map((job) => {
            if (job.id !== selectedJob.id) {
              return job;
            }
            const nextApplication = normalizedApplication || applicationRecord;
            const applications = existingApplication
              ? (job.applications || []).map((application) => {
                  const matchesWorkerId =
                    application.workerId != null && String(application.workerId) === String(selectedWorker.id);
                  const matchesWorkerUsername =
                    application.workerUsername &&
                    selectedWorker.username &&
                    application.workerUsername === selectedWorker.username;
                  return matchesWorkerId || matchesWorkerUsername ? nextApplication : application;
                })
              : [...(job.applications || []), nextApplication];
            const nextJob = {
              ...job,
              cancellationReason: "",
              selectedWorkerId: selectedWorker.id,
              selectedWorkerName: getDisplayName(
                selectedWorker.firstName,
                selectedWorker.lastName,
                selectedWorker.username,
              ),
              hiredAt,
              applications,
            };
            const isFilled = getHiredWorkerCount(nextJob) >= getWorkersNeeded(nextJob);
            return {
              ...nextJob,
              status: isFilled ? "Already found a worker" : "Open",
              applications: isFilled
                ? applications.map((application) =>
                    application.status === "Pending"
                      ? {
                          ...application,
                          status: "Closed",
                        }
                      : application,
                  )
                : applications,
            };
          }),
        );
        setRegisteredWorkers((prev) =>
          prev.map((worker) =>
            worker.id === selectedWorker.id
              ? {
                  ...worker,
                  status: "Hired",
                  hiredBy: currentHousehold.username,
                  hiredJobId: selectedJob.id,
                  applicationNotifications: [
                    ...(worker.applicationNotifications || []),
                    {
                      id: `hired-${selectedJob.id}-${selectedWorker.id}-${Date.now()}`,
                      title: "You were hired",
                      message: `${getDisplayName(currentHousehold.firstName, currentHousehold.lastName, currentHousehold.username)} hired you for ${selectedJob.jobTitle || selectedJob.serviceType}.`,
                      date: hiredAt,
                      unread: true,
                    },
                  ],
                }
              : worker,
          ),
        );
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert(
          `${getDisplayName(selectedWorker.firstName, selectedWorker.lastName, selectedWorker.username)} has been hired for ${selectedJob.jobTitle || selectedJob.serviceType}.`,
        );
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
      const rejectedAt = new Date().toLocaleString("en-PH");
      const message = `Thank you for applying to ${job.jobTitle || job.serviceType}. The household chose another applicant for now, but you can still apply to other open jobs.`;
      const applicationStatusTargetId = isNumericIdentifier(existingApplication?.id) ? existingApplication.id : job.id;
      try {
        const response = await apiRequest(`jobs/applications/${applicationStatusTargetId}/status/`, {
          method: "PATCH",
          auth: false,
          body: {
            household_username: currentHousehold?.username || currentUser?.username || "",
            status: "rejected",
            job_id: job.id,
            worker_username: worker.username,
            worker_role: "worker",
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to reject application."));
        }
        const normalizedApplication = normalizeBackendApplication(data);
        setPostedJobs((prev) =>
          prev.map((item) =>
            item.id === jobId
              ? {
                  ...item,
                  applications: (item.applications || []).map((application) => {
                    const matchesWorkerId =
                      application.workerId != null && String(application.workerId) === String(worker.id);
                    const matchesWorkerUsername =
                      application.workerUsername && worker.username && application.workerUsername === worker.username;
                    return matchesWorkerId || matchesWorkerUsername
                      ? {
                          ...(normalizedApplication || application),
                          status: "Rejected",
                          rejectedAt,
                          rejectionMessage: message,
                        }
                      : application;
                  }),
                }
              : item,
          ),
        );
        setRegisteredWorkers((prev) =>
          prev.map((item) =>
            item.id === workerId
              ? {
                  ...item,
                  applicationNotifications: [
                    ...(item.applicationNotifications || []),
                    {
                      id: `rejected-${jobId}-${workerId}-${Date.now()}`,
                      title: "Application update",
                      message,
                      date: rejectedAt,
                      unread: true,
                    },
                  ],
                }
              : item,
          ),
        );
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
  function handleLoginSubmit(event) {
    event.preventDefault();
    const username = loginForm.username.trim();
    const demoPassword = loginForm.password.trim();
    const normalizedUsername = username.toLowerCase();
    const isSuperAdminLogin =
      normalizedUsername === SUPER_ADMIN_ACCOUNT.username && demoPassword === SUPER_ADMIN_ACCOUNT.password;
    if (!username || !loginForm.password) {
      window.alert("Please enter your username and password.");
      return;
    }
    if (isSuperAdminLogin) {
      clearAuthToken();
      setCurrentUser({
        role: "admin",
        username: SUPER_ADMIN_ACCOUNT.username,
        displayName: SUPER_ADMIN_ACCOUNT.displayName,
        isSuperAdmin: true,
      });
      setSuperAdminSection("verification");
      setView("superadmin-dashboard");
      return;
    }
    const localWorker =
      loginForm.role === "worker"
        ? registeredWorkers.find((item) => String(item.username || "").toLowerCase() === normalizedUsername)
        : null;
    if (localWorker && localWorker.password === loginForm.password) {
      clearAuthToken();
      setCurrentUser({
        id: localWorker.id,
        role: "worker",
        username: localWorker.username,
        email: localWorker.email || "",
        displayName: getDisplayName(localWorker.firstName, localWorker.lastName, localWorker.username),
      });
      setView("worker-dashboard");
      return;
    }
    const localHousehold =
      loginForm.role === "household"
        ? registeredHouseholds.find((item) => String(item.username || "").toLowerCase() === normalizedUsername)
        : null;
    if (localHousehold && localHousehold.password === loginForm.password) {
      clearAuthToken();
      setCurrentUser({
        id: localHousehold.id,
        role: "household",
        username: localHousehold.username,
        email: localHousehold.email || "",
        displayName: getDisplayName(localHousehold.firstName, localHousehold.lastName, localHousehold.username),
      });
      setView("household-dashboard");
      return;
    }
    (async () => {
      try {
        const response = await apiRequest("accounts/login/", {
          method: "POST",
          auth: false,
          body: {
            username,
            password: loginForm.password,
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          const loginError = new Error(data?.detail || "Login failed.");
          loginError.status = response.status;
          throw loginError;
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
        setView(
          resolvedRole === "superadmin"
            ? "superadmin-dashboard"
            : resolvedRole === "admin"
              ? "admin-dashboard"
              : resolvedRole === "household"
                ? "household-dashboard"
                : "worker-dashboard",
        );
      } catch (error) {
        if (error.status === 403) {
          window.alert(error.message || "Account is not verified yet.");
          return;
        }
        if (loginForm.role === "worker") {
          const worker = registeredWorkers.find((item) => item.username.toLowerCase() === username.toLowerCase());
          if (!worker || worker.password !== loginForm.password) {
            window.alert(error.message || "Worker account not found. Please register first.");
            return;
          }
          clearAuthToken();
          setCurrentUser({
            role: "worker",
            username: worker.username,
            displayName: getDisplayName(worker.firstName, worker.lastName, worker.username),
          });
          setView("worker-dashboard");
          return;
        }
        const household = registeredHouseholds.find((item) => item.username.toLowerCase() === username.toLowerCase());
        if (!household || household.password !== loginForm.password) {
          window.alert(error.message || "Household account not found. Please register first.");
          return;
        }
        clearAuthToken();
        setCurrentUser({
          role: "household",
          username: household.username,
          displayName: getDisplayName(household.firstName, household.lastName, household.username),
        });
        setView("household-dashboard");
      }
    })();
  }
  function handleWorkerRegisterSubmit(event) {
    event.preventDefault();
    const requiredFields = [
      workerForm.firstName,
      workerForm.lastName,
      workerForm.username,
      workerForm.email,
      workerForm.phone,
      workerForm.barangay,
      workerForm.streetAddress,
      workerForm.password,
      workerForm.confirmPassword,
    ];
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
    const usernameTaken = registeredWorkers.some(
      (item) => item.username.toLowerCase() === workerForm.username.trim().toLowerCase(),
    );
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
            skills: Array.from(
              new Set([
                ...(workerForm.skills || []),
                ...(workerForm.customSkill.trim() ? [workerForm.customSkill.trim()] : []),
              ]),
            ),
            hourly_rate: workerForm.hourlyRate,
            daily_rate: workerForm.dailyRate,
            location_label:
              resolvedLocation?.locationLabel || formatLocation(workerForm.barangay, workerForm.streetAddress),
            latitude: resolvedLocation?.latitude ?? null,
            longitude: resolvedLocation?.longitude ?? null,
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to create worker account."));
        }
        const backendWorker = normalizeBackendWorkerPayload({
          user: data?.user,
          profile: data?.profile,
        });
        const workerAccount = {
          ...workerForm,
          skills: Array.from(
            new Set([
              ...(workerForm.skills || []),
              ...(workerForm.customSkill.trim() ? [workerForm.customSkill.trim()] : []),
            ]),
          ),
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
        setRegisteredWorkers((prev) => [
          backendWorker || workerAccount,
          ...prev.filter((item) => item.username?.toLowerCase() !== workerAccount.username.toLowerCase()),
        ]);
        setWorkerForm(EMPTY_WORKER_FORM);
        setLoginForm({
          username: "",
          password: "",
          role: "worker",
        });
        setView("login");
        window.alert(data?.detail || "Worker account created. You can now login.");
      } catch (error) {
        window.alert(error.message || "Unable to create worker account.");
      }
    })();
  }
  function handleHouseholdRegisterSubmit(event) {
    event.preventDefault();
    const requiredFields = [
      householdForm.firstName,
      householdForm.lastName,
      householdForm.username,
      householdForm.email,
      householdForm.phone,
      householdForm.barangay,
      householdForm.streetAddress,
      householdForm.password,
      householdForm.confirmPassword,
    ];
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
    const usernameTaken = registeredHouseholds.some(
      (item) => item.username.toLowerCase() === householdForm.username.trim().toLowerCase(),
    );
    if (usernameTaken) {
      window.alert("Username already exists for a household account.");
      return;
    }
    (async () => {
      try {
        const resolvedLocation = await resolveLocationCoordinates(
          householdForm.barangay,
          householdForm.streetAddress,
          false,
        );
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
            location_label:
              resolvedLocation?.locationLabel || formatLocation(householdForm.barangay, householdForm.streetAddress),
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
        setLoginForm({
          username: "",
          password: "",
          role: "household",
        });
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
      const resolvedLocation = await resolveLocationCoordinates(
        workerProfileForm.barangay,
        workerProfileForm.streetAddress,
        false,
      );
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
              location_label:
                resolvedLocation?.locationLabel ||
                formatLocation(workerProfileForm.barangay, workerProfileForm.streetAddress),
              latitude: nextWorkerPatch.latitude,
              longitude: nextWorkerPatch.longitude,
            },
          });
          const data = await readResponseData(response);
          if (!response.ok) {
            throw new Error(getApiErrorMessage(data, "Unable to update worker profile."));
          }
          const backendWorker = normalizeBackendWorkerPayload({
            user: data?.user || {
              username: currentUser.username,
              email: workerProfileForm.email,
              first_name: workerProfileForm.firstName,
              last_name: workerProfileForm.lastName,
            },
            profile: data?.profile,
          });
          if (backendWorker) {
            mergeBackendWorkerIntoState({
              ...backendWorker,
              profilePhotoPreview: workerProfileForm.profilePhotoPreview || backendWorker.profilePhotoPreview || "",
            });
          }
        }
        setRegisteredWorkers((prev) =>
          prev.map((item) => {
            if (item.username !== currentUser.username) {
              return item;
            }
            return {
              ...item,
              ...nextWorkerPatch,
              profilePhotoPreview: workerProfileForm.profilePhotoPreview || item.profilePhotoPreview || "",
              receivedReviews: item.receivedReviews || [],
              givenFeedback: item.givenFeedback || [],
            };
          }),
        );
        setCurrentUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            displayName: getDisplayName(
              workerProfileForm.firstName,
              workerProfileForm.lastName,
              workerProfileForm.username,
            ),
            profile: prev.profile
              ? {
                  ...prev.profile,
                  phone: workerProfileForm.phone,
                  bio: workerProfileForm.bio,
                  years_experience: Number(workerProfileForm.yearsExperience || 0),
                  skills: workerProfileForm.skills,
                  hourly_rate: workerProfileForm.hourlyRate,
                  daily_rate: workerProfileForm.dailyRate,
                  location_label:
                    resolvedLocation?.locationLabel ||
                    formatLocation(workerProfileForm.barangay, workerProfileForm.streetAddress),
                  latitude: nextWorkerPatch.latitude,
                  longitude: nextWorkerPatch.longitude,
                }
              : prev.profile,
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
          const existingIndex = prev.findIndex(
            (item) => item.workerUsername === worker.username && item.status !== "Rejected",
          );
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
            verificationNotifications: [
              {
                id: `submission-${normalizedRequest.id}`,
                title: "Verification Submitted",
                message: "Your documents were sent to the admin for review.",
                date: normalizedRequest.submittedAt || new Date().toLocaleString("en-PH"),
                unread: true,
              },
            ],
          });
        } else {
          setRegisteredWorkers((prev) =>
            prev.map((item) =>
              item.username === worker.username
                ? {
                    ...item,
                    verification: "Under Review",
                    verificationRequestId: normalizedRequest.id,
                    verificationSubmission: normalizedRequest,
                    verificationNotifications: [
                      {
                        id: `submission-${normalizedRequest.id}`,
                        title: "Verification Submitted",
                        message: "Your documents were sent to the admin for review.",
                        date: normalizedRequest.submittedAt || new Date().toLocaleString("en-PH"),
                        unread: true,
                      },
                    ],
                  }
                : item,
            ),
          );
        }
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                profile:
                  data?.worker?.profile ||
                  (prev.profile
                    ? {
                        ...prev.profile,
                        verification_status: "pending",
                        verification_request: normalizedRequest,
                      }
                    : prev.profile),
              }
            : prev,
        );
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
    setRegisteredHouseholds((prev) =>
      prev.map((item) => {
        if (item.username !== currentUser.username) {
          return item;
        }
        return {
          ...item,
          firstName: householdProfileForm.firstName,
          lastName: householdProfileForm.lastName,
          email: householdProfileForm.email,
          phone: householdProfileForm.phone,
          barangay: householdProfileForm.barangay,
          streetAddress: householdProfileForm.streetAddress,
          profilePhotoName: householdProfileForm.profilePhotoName || item.profilePhotoName || "",
          profilePhotoPreview: householdProfileForm.profilePhotoPreview || item.profilePhotoPreview || "",
          receivedFeedback: item.receivedFeedback || [],
        };
      }),
    );
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        barangay: householdProfileForm.barangay,
        streetAddress: householdProfileForm.streetAddress,
        displayName: getDisplayName(
          householdProfileForm.firstName,
          householdProfileForm.lastName,
          householdProfileForm.username,
        ),
        profile: prev.profile
          ? {
              ...prev.profile,
              location_label: formatLocation(householdProfileForm.barangay, householdProfileForm.streetAddress),
            }
          : prev.profile,
      };
    });
    setPostedJobs((prev) =>
      prev.map((job) => {
        if (job.householdUsername !== currentUser.username) {
          return job;
        }
        return {
          ...job,
          householdName: getDisplayName(
            householdProfileForm.firstName,
            householdProfileForm.lastName,
            householdProfileForm.username,
          ),
        };
      }),
    );
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
          body: {
            household_username: currentHousehold?.username || currentUser?.username || "",
            status: "cancelled",
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to cancel job."));
        }
        const normalizedJob = normalizeBackendJob(data);
        if (normalizedJob) {
          setPostedJobs((prev) =>
            prev.map((item) => (String(item.id) === String(normalizedJob.id) ? normalizedJob : item)),
          );
        }
        await refreshJobsFromBackend();
      } catch (error) {
        setPostedJobs((prev) => prev.filter((jobRecord) => String(jobRecord.id) !== String(jobId)));
      } finally {
        if (String(selectedJobId) === String(jobId)) {
          setSelectedJobId(null);
        }
      }
    })();
  }
  function handleConfirmJobCompleted(jobId = selectedJob?.id) {
    if (!jobId) {
      window.alert("Select a job first.");
      return;
    }
    const markCompletedLocally = () => {
      setPostedJobs((prev) =>
        prev.map((job) =>
          String(job.id) === String(jobId)
            ? {
                ...job,
                status: "Completed",
                completedAt: new Date().toLocaleString("en-PH"),
                applications: (job.applications || []).map((application) =>
                  application.status === "Hired" ? { ...application, status: "Completed" } : application,
                ),
              }
            : job,
        ),
      );
    };
    markCompletedLocally();
    (async () => {
      try {
        const response = await apiRequest(`jobs/${jobId}/`, {
          method: "PATCH",
          auth: false,
          body: {
            household_username: currentHousehold?.username || currentUser?.username || "",
            status: "completed",
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to complete job."));
        }
        const normalizedJob = normalizeBackendJob(data);
        if (normalizedJob) {
          setPostedJobs((prev) =>
            prev.map((item) => (String(item.id) === String(normalizedJob.id) ? normalizedJob : item)),
          );
        }
        await refreshJobsFromBackend();
        await refreshNotificationsFromBackend();
      } catch (error) {
        window.alert(error.message || "Job marked as completed locally.");
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
        setRegisteredWorkers((prev) =>
          prev.map((worker) =>
            worker.id === selectedWorker.id
              ? {
                  ...worker,
                  receivedReviews: [...(worker.receivedReviews || []), review],
                  rating: review.rating || worker.rating,
                  reviewsDone: (worker.reviewsDone || 0) + 1,
                }
              : worker,
          ),
        );
        setRegisteredHouseholds((prev) =>
          prev.map((household) =>
            household.username === currentUser.username
              ? {
                  ...household,
                  givenFeedback: [...(household.givenFeedback || []), review],
                }
              : household,
          ),
        );
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
        setRegisteredHouseholds((prev) =>
          prev.map((item) =>
            item.username === household.username
              ? {
                  ...item,
                  receivedFeedback: [...(item.receivedFeedback || []), review],
                }
              : item,
          ),
        );
        setRegisteredWorkers((prev) =>
          prev.map((worker) =>
            worker.id === currentWorker.id
              ? {
                  ...worker,
                  givenFeedback: [...(worker.givenFeedback || []), review],
                }
              : worker,
          ),
        );
        setWorkerFeedbackForm(EMPTY_WORKER_FEEDBACK_FORM);
        window.alert(error.message || "Feedback submitted locally.");
      }
    })();
  }
  function handleWorkerFeedbackForReviewSubmit(review, feedbackText) {
    if (!currentWorker) {
      window.alert("Please login as a worker first.");
      return;
    }
    const feedback = String(feedbackText || "").trim();
    if (!feedback) {
      window.alert("Please write feedback before sending.");
      return;
    }
    const householdUsername = review?.authorUsername || "";
    const household =
      registeredHouseholds.find((item) => item.username === householdUsername) ||
      registeredHouseholds.find(
        (item) => getDisplayName(item.firstName, item.lastName, item.username) === review?.authorName,
      );
    if (!household) {
      window.alert("Household profile not found.");
      return;
    }
    const localReview = normalizeReview({
      id: `feedback-${Date.now()}`,
      authorRole: "worker",
      authorUsername: currentWorker.username,
      authorName: "Anonymous Worker",
      targetUsername: household.username,
      targetName: getDisplayName(household.firstName, household.lastName, household.username),
      rating: null,
      feedback,
      jobTitle: review?.jobTitle || "",
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
            job_title: review?.jobTitle || "",
            feedback,
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to submit feedback."));
        }
        await refreshReviewsFromBackend();
        await refreshNotificationsFromBackend();
        window.alert("Anonymous feedback sent to the household.");
      } catch (error) {
        setRegisteredHouseholds((prev) =>
          prev.map((item) =>
            item.username === household.username
              ? {
                  ...item,
                  receivedFeedback: [...(item.receivedFeedback || []), localReview],
                }
              : item,
          ),
        );
        setRegisteredWorkers((prev) =>
          prev.map((worker) =>
            worker.username === currentWorker.username
              ? {
                  ...worker,
                  givenFeedback: [...(worker.givenFeedback || []), localReview],
                }
              : worker,
          ),
        );
        window.alert(error.message || "Anonymous feedback submitted locally.");
      }
    })();
  }
  function handleHouseholdJobSubmit(event) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "household") {
      window.alert("Please login as a household account first.");
      return;
    }
    if (
      !householdJobForm.serviceType ||
      !householdJobForm.preferredDate ||
      !householdJobForm.preferredTime ||
      getWorkersNeeded(householdJobForm) < 1
    ) {
      window.alert("Please complete the service type, preferred date, preferred time, and number of workers needed.");
      return;
    }
    (async () => {
      const resolvedLocation =
        householdJobLocationPreview ||
        (await resolveLocationCoordinates(householdJobForm.barangay, householdJobForm.streetAddress, true));
      const scheduledLabel = `${formatScheduleLabel(householdJobForm.scheduleType)}${householdJobForm.preferredDate ? ` on ${householdJobForm.preferredDate}` : ""}${householdJobForm.preferredTime ? ` at ${householdJobForm.preferredTime}` : ""}`;
      const resolvedLatitude =
        resolvedLocation?.latitude ??
        householdJobCoordinates?.latitude ??
        currentUser?.profile?.latitude ??
        currentHousehold?.latitude ??
        null;
      const resolvedLongitude =
        resolvedLocation?.longitude ??
        householdJobCoordinates?.longitude ??
        currentUser?.profile?.longitude ??
        currentHousehold?.longitude ??
        null;
      if (resolvedLatitude == null || resolvedLongitude == null) {
        window.alert(
          "Location is required before posting a job. Click 'Use My Current Location' or complete the barangay and street fields so we can estimate the map location first.",
        );
        return;
      }
      if (resolvedLocation) {
        setHouseholdJobLocationPreview(resolvedLocation);
        setHouseholdJobCoordinates({
          latitude: resolvedLatitude,
          longitude: resolvedLongitude,
        });
      }
      const payload = {
        household_username: currentHousehold?.username || currentUser.username,
        title: householdJobForm.jobTitle.trim() || householdJobForm.serviceType,
        job_type: householdJobForm.serviceType,
        required_skill: householdJobForm.serviceType,
        schedule: scheduledLabel,
        description: householdJobForm.description.trim(),
        location_label:
          resolvedLocation?.locationLabel ||
          formatLocation(householdJobForm.barangay.trim(), householdJobForm.streetAddress.trim()),
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        service_rate: householdJobForm.offeredRate,
        worker_slots: getWorkersNeeded(householdJobForm),
      };
      const imageFiles = Array.isArray(householdJobImages) ? householdJobImages : [];
      try {
        const requestBody = imageFiles.length > 0 ? new FormData() : payload;
        if (requestBody instanceof FormData) {
          Object.entries(payload).forEach(([key, value]) => {
            requestBody.append(key, value ?? "");
          });
          imageFiles.forEach((file) => requestBody.append("images", file));
        }
        const response = await apiRequest("jobs/", {
          method: "POST",
          auth: false,
          body: requestBody,
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
        const newJob = createJobRecord(
          {
            ...householdJobForm,
            latitude: resolvedLatitude,
            longitude: resolvedLongitude,
          },
          currentHousehold,
          Date.now(),
        );
        setPostedJobs((prev) => [newJob, ...prev]);
        setSelectedJobId(newJob.id);
        window.alert(error.message || "Job posted locally.");
      } finally {
        const savedLocation = getSavedHouseholdLocation(currentHousehold, currentUser);
        setHouseholdJobCoordinates(null);
        setHouseholdJobLocationPreview(null);
        setHouseholdJobImages([]);
        setHouseholdJobForm({
          jobTitle: "",
          serviceType: "",
          scheduleType: "One - Time",
          preferredDate: "",
          preferredTime: "",
          description: "",
          barangay: savedLocation.barangay,
          streetAddress: savedLocation.streetAddress,
          offeredRate: "0.00",
          rateType: "Per Day",
          workersNeeded: "1",
        });
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
          body: {
            action: "approve",
            reviewed_by: currentUser?.displayName || "Super Admin",
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to approve verification request."));
        }
        const normalizedRequest = normalizeVerificationRequest(data.verification_request || data);
        const reviewedAt = normalizedRequest.reviewedAt || new Date().toLocaleString("en-PH");
        const backendWorker = normalizeBackendWorkerPayload(data.worker);
        setVerificationRequests((prev) => prev.map((item) => (item.id === requestId ? normalizedRequest : item)));
        if (backendWorker) {
          mergeBackendWorkerIntoState({
            ...backendWorker,
            verification: "Verified",
            verificationReviewedAt: reviewedAt,
            verificationReviewedBy: currentUser?.displayName || "Admin",
            profilePhotoPreview: normalizedRequest.primaryIdPreview || backendWorker.profilePhotoPreview || "",
            verificationNotifications: [
              {
                id: `approved-${normalizedRequest.id}`,
                title: "Verified",
                message: "Your worker account has been verified by the admin.",
                date: reviewedAt,
                unread: true,
              },
            ],
          });
        } else {
          setRegisteredWorkers((prev) =>
            prev.map((worker) =>
              worker.id === normalizedRequest.workerId
                ? {
                    ...worker,
                    verification: "Verified",
                    verificationReviewedAt: reviewedAt,
                    verificationReviewedBy: currentUser?.displayName || "Admin",
                    profilePhotoPreview: normalizedRequest.primaryIdPreview || worker.profilePhotoPreview || "",
                    verificationNotifications: [
                      {
                        id: `approved-${normalizedRequest.id}`,
                        title: "Verified",
                        message: "Your worker account has been verified by the admin.",
                        date: reviewedAt,
                        unread: true,
                      },
                    ],
                  }
                : worker,
            ),
          );
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
    const reviewNote =
      window.prompt("Enter rejection note:", "Please resubmit clearer documents.") || "Rejected by admin.";
    (async () => {
      try {
        const response = await apiRequest(`common/verification-requests/${requestId}/review/`, {
          method: "POST",
          auth: false,
          body: {
            action: "reject",
            review_note: reviewNote,
            reviewed_by: currentUser?.displayName || "Super Admin",
          },
        });
        const data = await readResponseData(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Unable to reject verification request."));
        }
        const normalizedRequest = normalizeVerificationRequest(data.verification_request || data);
        const reviewedAt = normalizedRequest.reviewedAt || new Date().toLocaleString("en-PH");
        const backendWorker = normalizeBackendWorkerPayload(data.worker);
        setVerificationRequests((prev) => prev.map((item) => (item.id === requestId ? normalizedRequest : item)));
        if (backendWorker) {
          mergeBackendWorkerIntoState({
            ...backendWorker,
            verification: "Rejected",
            verificationReviewedAt: reviewedAt,
            verificationReviewedBy: currentUser?.displayName || "Admin",
            verificationRejectionNote: reviewNote,
            profilePhotoPreview: backendWorker.profilePhotoPreview || "",
            verificationNotifications: [
              {
                id: `rejected-${normalizedRequest.id}`,
                title: "Verification Rejected",
                message: reviewNote,
                date: reviewedAt,
                unread: true,
              },
            ],
          });
        } else {
          setRegisteredWorkers((prev) =>
            prev.map((worker) =>
              worker.id === normalizedRequest.workerId
                ? {
                    ...worker,
                    verification: "Rejected",
                    verificationReviewedAt: reviewedAt,
                    verificationReviewedBy: currentUser?.displayName || "Admin",
                    verificationRejectionNote: reviewNote,
                    profilePhotoPreview: worker.profilePhotoPreview || "",
                    verificationNotifications: [
                      {
                        id: `rejected-${normalizedRequest.id}`,
                        title: "Verification Rejected",
                        message: reviewNote,
                        date: reviewedAt,
                        unread: true,
                      },
                    ],
                  }
                : worker,
            ),
          );
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
  return {
    handleApplyToJob,
    handleHireWorker,
    handleRejectApplication,
    handleLoginSubmit,
    handleWorkerRegisterSubmit,
    handleHouseholdRegisterSubmit,
    handleWorkerProfileSave,
    handleVerificationSubmit,
    handleHouseholdProfileSave,
    handleCancelJob,
    handleHouseholdReviewSubmit,
    handleWorkerFeedbackSubmit,
    handleWorkerFeedbackForReviewSubmit,
    handleHouseholdJobSubmit,
    handleConfirmJobCompleted,
    handleAdminApproveVerification,
    handleAdminRejectVerification,
  };
}
