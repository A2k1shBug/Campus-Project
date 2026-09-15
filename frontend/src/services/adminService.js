import { get } from "./apiClient.js";

// GET /Admin_userInfo/getAllUser?page=&size= -> ApiResponse<PaginatedResponse<UserResponse>>
// Requires ROLE_ADMIN. Note this endpoint doesn't live under /api like the
// rest of the backend — that's a backend routing detail, not a typo here.
export async function getAllUsers({ page = 0, size = 10 } = {}) {
  const response = await get("/Admin_userInfo/getAllUser", { page, size });
  return response.data;
}
