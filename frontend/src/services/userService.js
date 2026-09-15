import { get, put, del } from "./apiClient.js";

// GET /api/user/me -> { id, userName, roles }
export function getCurrentUser() {
  return get("/api/user/me");
}

// PUT /api/user/{id}  body: { userName, password } (either can be omitted/blank to leave unchanged)
export function updateUser(id, { userName, password }) {
  return put(`/api/user/${id}`, { userName, password });
}

// DELETE /api/user/{id}
export function deleteUser(id) {
  return del(`/api/user/${id}`);
}
