import { TAYABAS_BARANGAY_BOUNDARIES } from "../data/tayabasBarangayBoundaries";
import { normalizeBarangayName } from "./locationUtils";

function pointInRing(longitude, latitude, ring) {
  let inside = false;
  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index) {
    const current = ring[index] || [];
    const previous = ring[previousIndex] || [];
    const currentLongitude = Number(current[0]);
    const currentLatitude = Number(current[1]);
    const previousLongitude = Number(previous[0]);
    const previousLatitude = Number(previous[1]);
    if (![currentLongitude, currentLatitude, previousLongitude, previousLatitude].every(Number.isFinite)) {
      continue;
    }
    const crossesLatitude = currentLatitude > latitude !== previousLatitude > latitude;
    const intersectLongitude =
      ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
        (previousLatitude - currentLatitude) +
      currentLongitude;
    if (crossesLatitude && longitude < intersectLongitude) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygonCoordinates(longitude, latitude, polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates?.[0])) {
    return false;
  }
  const outerRing = polygonCoordinates[0];
  if (!pointInRing(longitude, latitude, outerRing)) {
    return false;
  }
  const holes = polygonCoordinates.slice(1);
  return !holes.some((ring) => pointInRing(longitude, latitude, ring));
}

function getFeatureBarangay(feature) {
  const properties = feature?.properties || {};
  return normalizeBarangayName(
    properties.barangay ||
      properties.name ||
      properties.NAME_3 ||
      properties.ADM4_EN ||
      properties.BRGY_NAME ||
      properties.Barangay ||
      "",
  );
}

export function getBarangayFromBoundary(latitude, longitude, featureCollection = TAYABAS_BARANGAY_BOUNDARIES) {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  if (!Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) {
    return "";
  }
  const features = Array.isArray(featureCollection?.features) ? featureCollection.features : [];
  for (const feature of features) {
    const geometry = feature?.geometry || {};
    const barangay = getFeatureBarangay(feature);
    if (!barangay) {
      continue;
    }
    if (
      geometry.type === "Polygon" &&
      pointInPolygonCoordinates(numericLongitude, numericLatitude, geometry.coordinates)
    ) {
      return barangay;
    }
    if (
      geometry.type === "MultiPolygon" &&
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.some((coordinates) =>
        pointInPolygonCoordinates(numericLongitude, numericLatitude, coordinates),
      )
    ) {
      return barangay;
    }
  }
  return "";
}

export function hasBarangayBoundaryData(featureCollection = TAYABAS_BARANGAY_BOUNDARIES) {
  return Array.isArray(featureCollection?.features) && featureCollection.features.length > 0;
}
