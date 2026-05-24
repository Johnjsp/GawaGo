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
  return { detail: rawBody };
}
