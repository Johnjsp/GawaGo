export function isTransientBlobUrl(value) {
  return /^blob:/i.test(String(value || "").trim());
}

export function stripTransientBlobUrls(value) {
  if (typeof value === "string") {
    return isTransientBlobUrl(value) ? "" : value;
  }
  if (Array.isArray(value)) {
    return value.map(stripTransientBlobUrls);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, stripTransientBlobUrls(entry)]));
}

export function readFileAsDataUrl(file) {
  if (!file) {
    return Promise.resolve("");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file preview."));
    reader.readAsDataURL(file);
  });
}
