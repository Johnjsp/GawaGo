export function useHouseholdJobLocation({
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
}) {
  async function captureHouseholdJobLocation(showSuccessMessage = true) {
    const resolvedLocation = await resolveLocationCoordinates(
      householdJobForm.barangay,
      householdJobForm.streetAddress,
      true,
    );
    if (!resolvedLocation) {
      window.alert(
        "We could not detect or estimate your location yet. Please allow browser location access or complete the barangay and street fields first.",
      );
      return null;
    }
    setHouseholdJobCoordinates({
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
    });
    setHouseholdJobLocationPreview(resolvedLocation);
    setHouseholdJobForm((prev) => ({
      ...prev,
      barangay: getFallbackBarangay(resolvedLocation.barangay || prev.barangay),
      streetAddress:
        resolvedLocation.streetAddress ||
        formatCoordinateAddress(resolvedLocation.latitude, resolvedLocation.longitude),
    }));
    if (showSuccessMessage) {
      if (resolvedLocation.warning) {
        window.alert(resolvedLocation.warning);
      } else {
        window.alert(
          resolvedLocation.source === "device"
            ? "Current location captured successfully. You can now post the job."
            : "We estimated your location from the address fields and loaded the map preview.",
        );
      }
    }
    return resolvedLocation;
  }
  async function placeHouseholdJobPin(latitude, longitude, source = "manual", showSuccessMessage = false) {
    const reverseResult = await reverseGeocodeCoordinates(
      latitude,
      longitude,
      householdJobForm.barangay,
      householdJobForm.streetAddress,
    );
    const fallbackLocation = buildCoordinateLocation(
      latitude,
      longitude,
      await getNearestBarangayFromCoordinates(latitude, longitude),
      formatCoordinateAddress(latitude, longitude),
      source,
    );
    const resolvedBarangay = getFallbackBarangay(reverseResult?.barangay || fallbackLocation.barangay);
    const resolvedLatitude = source === "manual" ? fallbackLocation.latitude : reverseResult?.latitude ?? fallbackLocation.latitude;
    const resolvedLongitude =
      source === "manual" ? fallbackLocation.longitude : reverseResult?.longitude ?? fallbackLocation.longitude;
    const resolvedStreetAddress =
      reverseResult?.streetAddress ||
      fallbackLocation.streetAddress ||
      formatCoordinateAddress(resolvedLatitude, resolvedLongitude);
    const resolvedLocation = {
      latitude: Number(Number(resolvedLatitude).toFixed(7)),
      longitude: Number(Number(resolvedLongitude).toFixed(7)),
      barangay: resolvedBarangay,
      streetAddress: resolvedStreetAddress,
      locationLabel: reverseResult?.locationLabel || formatLocation(resolvedBarangay, resolvedStreetAddress),
      mapUrl: buildMapPreviewUrl(resolvedLatitude, resolvedLongitude),
      source,
      warning:
        source === "manual"
          ? "Manual pin placed. Review the auto-filled address before posting."
          : reverseResult?.warning || "",
    };
    setHouseholdJobCoordinates({
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
    });
    setHouseholdJobLocationPreview(resolvedLocation);
    setHouseholdJobForm((prev) => ({
      ...prev,
      barangay: getFallbackBarangay(resolvedLocation.barangay || prev.barangay),
      streetAddress:
        resolvedLocation.streetAddress ||
        formatCoordinateAddress(resolvedLocation.latitude, resolvedLocation.longitude),
    }));
    if (source !== "manual") {
      setHouseholdJobMapMode("preview");
    }
    if (showSuccessMessage) {
      window.alert(
        source === "manual"
          ? "Manual pin saved. Barangay and street fields were updated automatically."
          : "Location updated.",
      );
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
    const fallbackLocation = buildCoordinateLocation(
      barangayCenter.latitude,
      barangayCenter.longitude,
      selectedBarangay,
      `Barangay ${selectedBarangay}, Tayabas City`,
      "address",
    );
    setHouseholdJobCoordinates({
      latitude: fallbackLocation.latitude,
      longitude: fallbackLocation.longitude,
    });
    setHouseholdJobLocationPreview(fallbackLocation);
    setHouseholdJobMapMode("preview");
    householdJobMapViewRef.current = {
      center: [fallbackLocation.latitude, fallbackLocation.longitude],
      zoom: 15,
      touched: false,
    };
    setHouseholdJobForm((prev) => ({
      ...prev,
      barangay: selectedBarangay,
      streetAddress: fallbackLocation.streetAddress,
    }));
    if (householdJobBarangaySyncRef.current !== syncId) {
      return null;
    }
    return fallbackLocation;
  }
  return {
    captureHouseholdJobLocation,
    placeHouseholdJobPin,
    syncHouseholdJobBarangayLocation,
  };
}
