import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { deletePost } from "../services/postService.js";
import Avatar from "./Avatar.jsx";
import { formatTimestamp } from "../utils/dateUtils.js";
import "./PostCard.css";

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOwner = user?.userName === post.userName;

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deletePost(post.postId);
      onDeleted?.(post.postId);
    } catch (err) {
      setError(err.message || "Couldn't delete this post.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <article className="post-card card">
      <header className="post-card-header">
        <Avatar name={post.userName} />
        <div className="post-card-meta">
          <span className="post-card-author">{post.userName}</span>
          <span className="post-card-time">{formatTimestamp(post.createAt)}</span>
        </div>

        {isOwner && (
          <div className="post-card-owner-actions">
            <button
              type="button"
              className="post-card-icon-btn"
              onClick={() => navigate(`/posts/${post.postId}/edit`)}
              aria-label="Edit post"
              title="Edit post"
            >
              ✎
            </button>
            <button
              type="button"
              className="post-card-icon-btn post-card-icon-btn-danger"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete post"
              title="Delete post"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      <Link to={`/posts/${post.postId}`} className="post-card-body">
        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-text">{post.text}</p>
      </Link>

      {error && <p className="post-card-error">{error}</p>}

      {confirmingDelete && (
        <div className="post-card-confirm">
          <span>Delete this post? This can't be undone.</span>
          <div className="post-card-confirm-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      <footer className="post-card-footer">
        <Link to={`/posts/${post.postId}`} className="post-card-view-btn">
          View post →
        </Link>
      </footer>
    </article>
  );
}
