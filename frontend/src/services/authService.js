import { apiRequest } from "./apiClient.js";

// GET /api/auth/suggest-username?userName=...
// Backend returns the given name unchanged if it's free, or the name with
// a random number appended if it's taken. This does NOT reserve anything.
export async function suggestUsername(userName) {
  const suggestion = await apiRequest("/api/auth/suggest-username", {
    method: "GET",
    query: { userName },
  });
  return suggestion;
}

// POST /api/auth/sign_up  body: { userName, password }
export function signUp({ userName, password }) {
  return apiRequest("/api/auth/sign_up", {
    method: "POST",
    body: { userName, password },
  });
}

// POST /api/auth/login  body: { userName, password }
// returns { accessToken, refreshToken }
export function login({ userName, password }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: { userName, password },
  });
}

// POST /api/auth/refresh  body: { refreshToken } -> { accessToken }
export function refreshAccessToken(refreshToken) {
  return apiRequest("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

// POST /api/auth/logout  body: { refreshToken }
export function logout(refreshToken) {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

// POST /api/auth/logout-all?userEmail=<username>
// The backend parameter is named userEmail but it is matched against the
// stored userName field, so we pass the signed-in username here.
export function logoutAllDevices(userName) {
  return apiRequest("/api/auth/logout-all", {
    method: "POST",
    query: { userEmail: userName },
  });
}
