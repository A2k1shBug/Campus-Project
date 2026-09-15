import { get, post } from "./apiClient.js";

export const REACTION_TYPES = ["LIKE", "LOVE", "HAHA", "HAPPY", "SAD"];

// GET /api/react?page=&size= -> ApiResponse<PaginatedResponse<ReactionResponseDto>>
export async function getMyVisibleReactions({ page = 0, size = 10 } = {}) {
  const response = await get("/api/react", { page, size });
  return response.data;
}

// POST /api/react  body: { postId, reactionType }
// The backend toggles: reacting with the same type again removes the
// reaction; reacting with a different type switches it. No response body.
export function reactToPost({ postId, reactionType }) {
  return post("/api/react", { postId, reactionType });
}

// GET /api/react/{postId}/count -> number
export function getReactionCount(postId) {
  return get(`/api/react/${postId}/count`);
}
