import { ApiError } from "../utils/ApiError.js";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
} from "../utils/tokenStorage.js";

// The backend URL. Configure with a .env file — see .env.example.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Endpoints that never need an Authorization header and must never trigger
// a refresh-and-retry loop.
const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/sign_up",
  "/api/auth/suggest-username",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/logout-all",
];

let onUnauthorized = null;
// Called by AuthContext so the app can react (e.g. redirect to /login)
// when the refresh token itself is no longer valid.
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// The backend returns different body shapes depending on the endpoint:
//   - JSON objects/arrays for most successful responses
//   - a raw (unquoted) string for /api/auth/suggest-username and for the
//     login failure branch ("Incorrect username or password")
//   - an empty body for 204s and for POST /api/react
// This reads the body once as text and only parses it as JSON if it looks
// like JSON, so none of those cases throw a parsing error.
async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(data, fallback) {
  if (data == null) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object" && typeof data.message === "string") return data.message;
  return fallback;
}

async function doFetch(path, options) {
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p));
  const headers = { ...(options.headers || {}) };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (!isPublicAuthPath) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  return response;
}

// Ensures only one refresh request is in flight even if several API calls
// fail with 401 at the same time.
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new ApiError("Not signed in", 401, null);

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await readBody(response);

    if (!response.ok) {
      throw new ApiError(extractMessage(data, "Session expired"), response.status, data);
    }

    setAccessToken(data.accessToken);
    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Makes an API request against the Spring Boot backend.
 *
 * @param {string} path - e.g. "/api/posts"
 * @param {object} options - { method, body, headers, query }
 */
export async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers, query } = options;

  let fullPath = path;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });
    const qs = params.toString();
    if (qs) fullPath = `${path}?${qs}`;
  }

  const fetchOptions = {
    method,
    headers,
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  };

  let response = await doFetch(fullPath, fetchOptions);
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p));

  // Access token expired mid-session: refresh once, then retry the original
  // call. If refresh itself fails, the user is signed out.
  if (response.status === 401 && !isPublicAuthPath && getRefreshToken()) {
    try {
      await refreshAccessToken();
      response = await doFetch(fullPath, fetchOptions);
    } catch (refreshError) {
      clearTokens();
      if (onUnauthorized) onUnauthorized();
      throw new ApiError("Your session expired. Please sign in again.", 401, null);
    }
  }

  if (response.status === 401 && !isPublicAuthPath && !getRefreshToken()) {
    clearTokens();
    if (onUnauthorized) onUnauthorized();
  }

  const data = await readBody(response);

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "You need to sign in to do that."
        : response.status === 403
        ? "You don't have permission to do that."
        : response.status === 404
        ? "We couldn't find that."
        : response.status >= 500
        ? "Something went wrong on our end. Please try again."
        : "Something went wrong.";

    throw new ApiError(extractMessage(data, fallback), response.status, data);
  }

  return data;
}

export function get(path, query) {
  return apiRequest(path, { method: "GET", query });
}

export function post(path, body) {
  return apiRequest(path, { method: "POST", body });
}

export function put(path, body) {
  return apiRequest(path, { method: "PUT", body });
}

export function del(path) {
  return apiRequest(path, { method: "DELETE" });
}
