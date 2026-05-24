let leafletAssetsPromise = null;

export async function loadLeafletAssets() {
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
        existingScript.addEventListener("error", () => reject(new Error("Unable to load Leaflet map assets.")), { once: true });
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
