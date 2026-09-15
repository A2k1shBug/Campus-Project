import { get, post, put, del } from "./apiClient.js";

// GET /api/comment?page=&size= -> ApiResponse<PaginatedResponse<CommentResponseDto>>
// Returns every comment the current user can see (their own posts' comments
// plus comments on public posts), per the backend's visibility rule.
export async function getMyVisibleComments({ page = 0, size = 10 } = {}) {
  const response = await get("/api/comment", { page, size });
  return response.data;
}

// POST /api/comment  body: { postId, text } -> CommentResponseDto
export function createComment({ postId, text }) {
  return post("/api/comment", { postId, text });
}

// PUT /api/comment/{id}  body: { postId, text } -> CommentResponseDto
export function updateComment(id, { postId, text }) {
  return put(`/api/comment/${id}`, { postId, text });
}

// DELETE /api/comment/{id}
export function deleteComment(id) {
  return del(`/api/comment/${id}`);
}

// GET /api/comment/{postId}/comments/count -> number
export function getCommentCount(postId) {
  return get(`/api/comment/${postId}/comments/count`);
}

// GET /api/comment/recommendations -> ApiResponse<CommentResponseDto[]>
// Sentiment-based comment recommendations for the logged-in user (identified
// via the JWT, no params needed). The backend only starts returning results
// once the user has commented on 10+ different posts — until then "data" is
// just an empty array, which the UI treats as a "not unlocked yet" state
// rather than an error.
export async function getRecommendations() {
  const response = await get("/api/comment/recommendations");
  return response.data;
}

// The recommendations endpoint returns an empty array both when the
// feature is still "locked" (user hasn't commented on 10+ different posts
// yet) AND when it's unlocked but there's simply no good match right now
// -- there's no flag telling us which case we're in.
//
// This is a best-effort way to tell them apart on the frontend: page
// through the same comments endpoint MyCommentsPage/PostDetailPage.jsx
// already use, keep only comments written by the given user, and count
// how many *different* posts show up. Capped at a handful of pages so a
// very active account doesn't page forever -- if the user has commented
// on 10+ different posts, we'll find that well within the cap.
export async function getMyCommentedPostCount(userName, { maxPages = 10, size = 50 } = {}) {
  const postIds = new Set();
  let page = 0;

  while (page < maxPages) {
    const result = await getMyVisibleComments({ page, size });
    const content = result?.content || [];

    for (const comment of content) {
      if (comment.userName === userName) postIds.add(comment.postId);
    }

    if (result?.last || content.length === 0) break;
    page += 1;
  }

  return postIds.size;
}
