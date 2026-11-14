// Small helper: attaches the logged-in user's session token to API requests.
// The server uses this token (not any client-supplied email) to decide who the caller is.

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem("lomon_auth_token") || localStorage.getItem("token");
  } catch (_e) {
    return null;
  }
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}
