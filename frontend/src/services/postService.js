import { get, post, put, del } from "./apiClient.js";

// GET /api/posts?page=&size= -> ApiResponse<PaginatedResponse<PostResponseDto>>
export async function getFeed({ page = 0, size = 10 } = {}) {
  const response = await get("/api/posts", { page, size });
  return response.data;
}

// GET /api/posts/{postId} -> ApiResponse<PostDetailDto>
export async function getPostDetail(postId) {
  const response = await get(`/api/posts/${postId}`);
  return response.data;
}

// POST /api/posts  body: { title, content, typeOfAccess } -> Posts
export function createPost({ title, content, typeOfAccess }) {
  return post("/api/posts", { title, content, typeOfAccess });
}

// PUT /api/posts/{id}  body: { title, content, typeOfAccess } -> Posts
export function updatePost(id, { title, content, typeOfAccess }) {
  return put(`/api/posts/${id}`, { id, title, content, typeOfAccess });
}

// DELETE /api/posts/{id}
export function deletePost(id) {
  return del(`/api/posts/${id}`);
}
