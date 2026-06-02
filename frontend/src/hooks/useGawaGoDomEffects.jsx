import { useEffect } from "react";
export function useGawaGoDomEffects({
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
