export async function readResponseData(response) {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) {
    return null;
  }
  const rawBody = await response.text();
  if (!rawBody) {
    return null;
  }
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      return { detail: rawBody };
    }
  }
  if (/^\s*<!doctype html/i.test(rawBody) || /^\s*<html/i.test(rawBody)) {
    const titleMatch = rawBody.match(/<title>(.*?)<\/title>/is);
    const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim();
    return { detail: title || "The backend returned an HTML error page. Check the Django server console." };
  }
  return { detail: rawBody };
}
