import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  OPENROUTESERVICE_API_KEY,
  OPENROUTESERVICE_SEARCH_URL,
  TAYABAS_CITY_CENTER,
} from "../constants/appConstants";

let leafletAssetsPromise = null;

function localFormatDistance(distanceKm) {
  const numericDistance = Number(distanceKm);
  if (!Number.isFinite(numericDistance) || numericDistance < 0) {
    return "Distance not available";
  }
  if (numericDistance < 1) {
    return `${Math.max(1, Math.round(numericDistance * 1000))} meters away`;
  }
  return `${numericDistance.toFixed(1)} km away`;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const values = [lat1, lon1, lat2, lon2].map(Number);
  if (!values.every(Number.isFinite)) {
    return null;
  }
  const [firstLatitude, firstLongitude, secondLatitude, secondLongitude] = values;
  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(secondLatitude - firstLatitude);
  const deltaLongitude = toRadians(secondLongitude - firstLongitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(firstLatitude)) * Math.cos(toRadians(secondLatitude)) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
        existingScript.addEventListener("error", () => reject(new Error("Unable to load Leaflet map assets.")), {
          once: true,
        });
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

async function geocodeAddress(address) {
  const query = String(address || "").trim();
  if (!query || !OPENROUTESERVICE_API_KEY) {
    return null;
  }
  try {
    const response = await fetch(
      `${OPENROUTESERVICE_SEARCH_URL}?text=${encodeURIComponent(query)}&boundary.country=PH&focus.point.lon=${encodeURIComponent(TAYABAS_CITY_CENTER.longitude)}&focus.point.lat=${encodeURIComponent(TAYABAS_CITY_CENTER.latitude)}&size=1&layers=address,street,locality,neighbourhood`,
      {
        method: "GET",
        headers: { Authorization: OPENROUTESERVICE_API_KEY, Accept: "application/json, application/geo+json" },
      },
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
    return { latitude, longitude };
  } catch (error) {
    return null;
  }
}

function createMapIcon(L, label, markerType) {
  const safeLabel = String(label || "").replace(/[<>&"]/g, "");
  return L.divIcon({
    className: `location-distance-marker location-distance-marker-${markerType}`,
    html: `<span>${safeLabel}</span>`,
    iconSize: markerType === "household" ? [44, 28] : [28, 28],
    iconAnchor: markerType === "household" ? [22, 14] : [14, 14],
  });
}

function buildCoordinatePoint(latitude, longitude) {
  const resolvedLatitude = Number(latitude);
  const resolvedLongitude = Number(longitude);
  if (!Number.isFinite(resolvedLatitude) || !Number.isFinite(resolvedLongitude)) {
    return null;
  }
  return { latitude: resolvedLatitude, longitude: resolvedLongitude };
}

export default function LocationDistanceMap({
  userLatitude,
  userLongitude,
  targetLatitude,
  targetLongitude,
  userLocation = "User location",
  targetLocation = "Target location",
  distanceKm,
  formatDistanceFn,
}) {
  const mapNodeRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [resolvedPoints, setResolvedPoints] = useState({
    user: buildCoordinatePoint(userLatitude, userLongitude),
    target: buildCoordinatePoint(targetLatitude, targetLongitude),
  });
  const [status, setStatus] = useState("loading");
  const [mapStatus, setMapStatus] = useState("idle");

  useEffect(() => {
    let cancelled = false;
    async function resolvePoints() {
      const nextUser = buildCoordinatePoint(userLatitude, userLongitude) || (await geocodeAddress(userLocation));
      const nextTarget =
        buildCoordinatePoint(targetLatitude, targetLongitude) || (await geocodeAddress(targetLocation));
      if (cancelled) {
        return;
      }
      setResolvedPoints({ user: nextUser, target: nextTarget });
      setStatus(nextUser && nextTarget ? "ready" : "missing");
    }
    resolvePoints();
    return () => {
      cancelled = true;
    };
  }, [userLatitude, userLongitude, targetLatitude, targetLongitude, userLocation, targetLocation]);

  const resolvedDistanceKm = useMemo(() => {
    if (distanceKm !== null && distanceKm !== undefined && distanceKm !== "") {
      return Number(distanceKm);
    }
    if (!resolvedPoints.user || !resolvedPoints.target) {
      return null;
    }
    return haversineDistanceKm(
      resolvedPoints.user.latitude,
      resolvedPoints.user.longitude,
      resolvedPoints.target.latitude,
      resolvedPoints.target.longitude,
    );
  }, [distanceKm, resolvedPoints]);
  const distanceLabel = (formatDistanceFn || localFormatDistance)(resolvedDistanceKm);

  useEffect(() => {
    let cancelled = false;
    async function renderMap() {
      const userPointReady =
        resolvedPoints.user &&
        Number.isFinite(Number(resolvedPoints.user.latitude)) &&
        Number.isFinite(Number(resolvedPoints.user.longitude));
      const targetPointReady =
        resolvedPoints.target &&
        Number.isFinite(Number(resolvedPoints.target.latitude)) &&
        Number.isFinite(Number(resolvedPoints.target.longitude));
      if (!mapNodeRef.current || !userPointReady || !targetPointReady) {
        return;
      }
      setMapStatus("loading");
      let mapRendered = false;
      const fallbackTimer = window.setTimeout(() => {
        if (!cancelled && !mapRendered) {
          setMapStatus("fallback");
        }
      }, 1800);
      try {
        const L = await loadLeafletAssets();
        if (cancelled || !L) {
          return;
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        const map = L.map(mapNodeRef.current, { zoomControl: true, scrollWheelZoom: true });
        mapInstanceRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        const userPoint = [resolvedPoints.user.latitude, resolvedPoints.user.longitude];
        const targetPoint = [resolvedPoints.target.latitude, resolvedPoints.target.longitude];
        L.marker(userPoint, { icon: createMapIcon(L, "YOU", "household") })
          .addTo(map)
          .bindPopup(userLocation || "User location");
        L.marker(targetPoint, { icon: createMapIcon(L, "W", "worker") })
          .addTo(map)
          .bindPopup(targetLocation || "Target location");
        L.polyline([userPoint, targetPoint], { color: "#0d6efd", weight: 4, opacity: 0.85 }).addTo(map);
        map.fitBounds(L.latLngBounds([userPoint, targetPoint]).pad(0.28));
        mapRendered = true;
        window.clearTimeout(fallbackTimer);
        setMapStatus("ready");
      } catch (error) {
        window.clearTimeout(fallbackTimer);
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
  }, [resolvedPoints, userLocation, targetLocation]);

  return (
    <div className="location-distance-map">
      <div className="location-distance-map-canvas" ref={mapNodeRef}>
        {status === "loading" && <div className="location-distance-map-placeholder">Loading map...</div>}
        {status === "missing" && (
          <div className="location-distance-map-placeholder">Location coordinates unavailable.</div>
        )}
        {status === "ready" && mapStatus !== "ready" && (
          <div className="location-distance-fallback">
            <div className="location-distance-fallback-route">
              <span className="location-distance-fallback-pin user-pin">YOU</span>
              <span className="location-distance-fallback-line" />
              <span className="location-distance-fallback-pin target-pin">W</span>
            </div>
            <div className="location-distance-fallback-label">
              <strong>{distanceLabel}</strong>
              <small>
                {mapStatus === "fallback"
                  ? "Map tiles unavailable, showing approximate route."
                  : "Preparing map view..."}
              </small>
            </div>
          </div>
        )}
      </div>
      <div className="location-distance-summary">
        <span>{distanceLabel}</span>
        <small>
          {userLocation || "User location"} to {targetLocation || "target location"}
        </small>
      </div>
    </div>
  );
}
