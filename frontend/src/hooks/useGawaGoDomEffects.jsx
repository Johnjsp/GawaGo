import React, { useEffect } from "react";
export function useGawaGoDomEffects({
  captureHouseholdJobLocation,
  clearAuthToken,
  currentHousehold,
  currentUser,
  currentWorker,
  currentWorkerJobDetail,
  formatDistance,
  formatLocation,
  getBarangayCenter,
  getDisplayName,
  getHiringProgressLabel,
  getHouseholdPhoto,
  getPendingApplicationCount,
  getSavedHouseholdLocation,
  handleRejectApplication,
  haversineDistanceKm,
  householdJobCoordinates,
  householdJobForm,
  householdJobLocationPreview,
  householdJobMapContainerIdRef,
  householdJobMapMode,
  householdJobMapRef,
  householdJobMapViewRef,
  householdJobs,
  loadLeafletAssets,
  openFilePreview,
  placeHouseholdJobPin,
  registeredHouseholds,
  selectedJob,
  selectedJobId,
  selectedVerificationRequestId,
  selectedWorker,
  setCurrentUser,
  setHouseholdJobForm,
  setHouseholdJobMapMode,
  setLoginForm,
  setSelectedJobId,
  setSelectedVerificationRequestId,
  setSelectedWorkerId,
  setUnauthorizedHandler,
  setView,
  verificationRequests,
  view,
  workerVisibleJobs,
}) {
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
    if (!householdJobs.some((item) => String(item.id) === String(selectedJobId))) {
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
  }, [
    view,
    currentHousehold?.barangay,
    currentHousehold?.streetAddress,
    currentUser?.profile?.location_label,
    currentUser?.profile?.locationLabel,
  ]);
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
      setHouseholdJobForm((prev) => ({
        ...prev,
        workersNeeded: event.target.value,
      }));
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
    heading.textContent =
      householdJobLocationPreview?.source === "device"
        ? "Current Location Preview"
        : householdJobLocationPreview?.source === "address"
          ? "Address-based Preview"
          : householdJobLocationPreview?.source === "manual"
            ? "Manual Pin Preview"
            : "Philippines Map Preview";
    const title = document.createElement("h3");
    title.className = "household-job-map-title mb-2";
    title.textContent = householdJobLocationPreview?.mapUrl
      ? "Check the saved job pin before posting"
      : householdJobMapMode === "manual"
        ? "Manual pin mode is active"
        : "The map opens on the Philippines, then drops a pin after location capture";
    const address = document.createElement("p");
    address.className = "small text-muted mb-2";
    address.textContent =
      householdJobLocationPreview?.locationLabel ||
      "Use your current location or complete the address fields to place the job on the map.";
    const coords = document.createElement("p");
    coords.className = "small mb-2 household-job-map-coords";
    coords.textContent =
      householdJobLocationPreview?.latitude != null && householdJobLocationPreview?.longitude != null
        ? `Latitude: ${householdJobLocationPreview.latitude}, Longitude: ${householdJobLocationPreview.longitude}`
        : "No confirmed map pin yet.";
    const accuracy = document.createElement("p");
    accuracy.className = "small mb-3 household-job-map-accuracy";
    accuracy.textContent = householdJobLocationPreview?.accuracy
      ? `Reported device accuracy: about ${Math.round(householdJobLocationPreview.accuracy)} meters`
      : householdJobMapMode === "manual"
        ? "Click or drag anywhere in the Philippines map to set the exact job location, then review the auto-filled address fields."
        : "Map opens at the Philippines by default and adds a pin after you confirm location.";
    const mapWrap = document.createElement("div");
    mapWrap.className = "household-job-map-frame";
    const mapNode = document.createElement("div");
    mapNode.id = householdJobMapContainerIdRef.current;
    mapNode.className = "household-job-map-canvas";
    mapWrap.append(mapNode);
    const buttonWrap = document.createElement("div");
    buttonWrap.className = "household-location-actions-panel";
    buttonWrap.dataset.locationCaptureWrap = "true";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary btn-sm household-location-trigger";
    button.textContent =
      householdJobCoordinates?.latitude != null && householdJobCoordinates?.longitude != null
        ? "Location Ready"
        : "Use My Current Location";
    const manualButton = document.createElement("button");
    manualButton.type = "button";
    manualButton.className = `btn btn-outline-secondary btn-sm ${householdJobMapMode === "manual" ? "active" : ""}`;
    manualButton.textContent = householdJobMapMode === "manual" ? "Click the Map to Pin" : "Pin on Map Manually";
    const actions = document.createElement("div");
    actions.className = "d-flex gap-2 flex-wrap";
    const helper = document.createElement("p");
    helper.className = "form-text mb-0 household-location-helper";
    helper.textContent =
      householdJobMapMode === "manual"
        ? "Manual pin mode is active. Click on the map to place the exact job location and auto-fill the address."
        : householdJobCoordinates?.latitude != null && householdJobCoordinates?.longitude != null
          ? `Current coordinates saved for this job: ${householdJobCoordinates.latitude}, ${householdJobCoordinates.longitude}`
          : "Capture your current browser location or pin the exact job location on the map.";
    const handleLocationClick = async () => {
      await captureHouseholdJobLocation();
    };
    const handleManualClick = () => {
      setHouseholdJobMapMode((prev) => (prev === "manual" ? "preview" : "manual"));
    };
    button.addEventListener("click", handleLocationClick);
    manualButton.addEventListener("click", handleManualClick);
    actions.append(button, manualButton);
    buttonWrap.append(actions, helper);
    const warning = document.createElement("p");
    warning.className = "small mb-2 household-job-map-warning";
    warning.textContent = householdJobLocationPreview?.warning || "";
    if (!householdJobLocationPreview?.warning) {
      warning.style.display = "none";
    }
    const note = document.createElement("p");
    note.className = "small text-muted mt-2 mb-0";
    note.textContent = "Geocoding uses OpenRouteService, while the visual map preview is rendered with OpenStreetMap.";
    card.append(heading, title, address, coords, accuracy, mapWrap, buttonWrap, warning, note);
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
          marker = L.marker([latitude, longitude], {
            draggable: true,
          }).addTo(mapInstance);
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
          await syncMarker(
            householdJobLocationPreview.latitude,
            householdJobLocationPreview.longitude,
            householdJobLocationPreview.source || "manual",
          );
        } else {
          mapInstance.setView(householdJobMapViewRef.current.center, householdJobMapViewRef.current.zoom);
        }
        mapInstance.on("moveend zoomend", () => {
          const center = mapInstance.getCenter();
          householdJobMapViewRef.current = {
            center: [center.lat, center.lng],
            zoom: mapInstance.getZoom(),
            touched: true,
          };
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
          warning.textContent =
            "Interactive map could not be loaded right now. You can still use current location or typed address.";
        }
      }
    })();
    return () => {
      cancelled = true;
      if (householdJobMapRef.current) {
        householdJobMapRef.current.remove();
        householdJobMapRef.current = null;
      }
      button.removeEventListener("click", handleLocationClick);
      manualButton.removeEventListener("click", handleManualClick);
      previewWrap.remove();
    };
  }, [
    view,
    householdJobCoordinates?.latitude,
    householdJobCoordinates?.longitude,
    householdJobLocationPreview?.mapUrl,
    householdJobLocationPreview?.latitude,
    householdJobLocationPreview?.longitude,
    householdJobLocationPreview?.locationLabel,
    householdJobLocationPreview?.source,
    householdJobLocationPreview?.warning,
    householdJobLocationPreview?.accuracy,
    householdJobMapMode,
  ]);
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
    const hireButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent.includes("Hire This Worker"),
    );
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
    if (view !== "worker-job-detail" || !currentWorkerJobDetail) {
      return;
    }
    const applyButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent.includes("Apply Now"),
    );
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
    const actionCards = Array.from(document.querySelectorAll("button"))
      .filter((button) => button.textContent.includes("View Details") || button.textContent.includes("Apply Now"))
      .map((button) => button.closest(".profile-card") || button.parentElement)
      .filter(Boolean);
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
      const distanceKm = haversineDistanceKm(
        workerPoint.latitude,
        workerPoint.longitude,
        jobPoint.latitude,
        jobPoint.longitude,
      );
      const badge = document.createElement("div");
      badge.dataset.workerJobDistance = "true";
      badge.className = "worker-job-distance-badge";
      badge.textContent = formatDistance(distanceKm);
      card.appendChild(badge);
    });
    const applyButtons = Array.from(document.querySelectorAll("button")).filter((button) =>
      button.textContent.includes("Apply Now"),
    );
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
        badge.textContent =
          "Locked until verified: you can browse jobs, but applications are unavailable until admin approval.";
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
    const request =
      verificationRequests.find((item) => item.id === selectedWorker.verificationRequestId) ||
      verificationRequests.find((item) => item.workerId === selectedWorker.id) ||
      selectedWorker.verificationSubmission;
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
      {
        label: "View Primary ID",
        url: request.primaryIdPreview,
      },
      {
        label: "View Secondary Document",
        url: request.secondaryDocPreview,
      },
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
    alert.textContent =
      "Your account is not verified yet. Please complete verification to become eligible for hiring and priority matching.";
    badgeRow.parentElement?.insertBefore(alert, badgeRow.nextSibling);
    return () => alert.remove();
  }, [view, currentWorker]);
  useEffect(() => {
    document.querySelectorAll("[data-sidebar-logout]").forEach((node) => node.remove());
    document.querySelectorAll(".worker-topbar .btn.btn-outline-secondary.btn-sm").forEach((button) => {
      button.style.display = "";
    });
  }, [view, currentUser]);
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthToken();
      setCurrentUser(null);
      setSelectedWorkerId(null);
      setSelectedJobId(null);
      setLoginForm({
        username: "",
        password: "",
        role: "worker",
      });
      setView("login");
    });
    return () => setUnauthorizedHandler(null);
  }, []);
}
