import { useEffect } from "react";
import { STORAGE_KEYS } from "../constants/appConstants";
import { stripTransientBlobUrls } from "../utils/mediaUtils";

export function useGawaGoPersistence({
  notificationReads,
  postedJobs,
  registeredHouseholds,
  registeredWorkers,
  verificationRequests,
}) {
  function saveStoredValue(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(stripTransientBlobUrls(value)));
    } catch (error) {
      return;
    }
  }

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.workers, registeredWorkers);
  }, [registeredWorkers]);

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.households, registeredHouseholds);
  }, [registeredHouseholds]);

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.verificationRequests, verificationRequests);
  }, [verificationRequests]);

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.jobs, postedJobs);
  }, [postedJobs]);

  useEffect(() => {
    saveStoredValue(STORAGE_KEYS.notificationReads, notificationReads);
  }, [notificationReads]);
}
