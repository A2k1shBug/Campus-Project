import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPost, updatePost, getPostDetail } from "../services/postService.js";
import { useAuth } from "../context/AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import "./CreateEditPostPage.css";

const CONTENT_MAX = 200;

export default function CreateEditPostPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [typeOfAccess, setTypeOfAccess] = useState("PUBLIC");
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode) return;

    let cancelled = false;
    (async () => {
      try {
        const detail = await getPostDetail(id);
        if (cancelled) return;
        setTitle(detail.post.title);
        setContent(detail.post.text);
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load this post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Give your post a title and some content.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        // The backend's update endpoint currently only applies title and
        // content changes — visibility can't be changed after a post is
        // created, so we always resend "PUBLIC" here just to satisfy the
        // request's validation; it has no effect on the saved post.
        await updatePost(id, { title: title.trim(), content: content.trim(), typeOfAccess: "PUBLIC" });
        navigate(`/posts/${id}`);
      } else {
        // POST /api/posts returns the raw Posts document. Its `id` is a
        // MongoDB ObjectId, and without a custom Jackson serializer on the
        // backend that field may not come back as a plain hex string — so
        // rather than guess its shape, we go back to the feed instead of
        // jumping straight to the new post's detail page.
        await createPost({ title: title.trim(), content: content.trim(), typeOfAccess });
        navigate("/", { state: { justPosted: true } });
      }
    } catch (err) {
      setError(err.message || "Couldn't save your post.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading post..." />;

  return (
    <div className="post-form-page">
      <h2 className="post-form-heading">{isEditMode ? "Edit post" : "Create a post"}</h2>

      <form onSubmit={handleSubmit} className="card post-form" noValidate>
        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give it a headline"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="content">What's on your mind?</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
            placeholder="Share something..."
            rows={5}
          />
          <span className="field-hint">
            {content.length}/{CONTENT_MAX} characters
          </span>
        </div>

        {!isEditMode && (
          <div className="field">
            <label htmlFor="typeOfAccess">Who can see this?</label>
            <div className="visibility-toggle">
              <button
                type="button"
                className={typeOfAccess === "PUBLIC" ? "visibility-btn is-active" : "visibility-btn"}
                onClick={() => setTypeOfAccess("PUBLIC")}
              >
                🌍 Public
              </button>
              <button
                type="button"
                className={typeOfAccess === "PRIVATE" ? "visibility-btn is-active" : "visibility-btn"}
                onClick={() => setTypeOfAccess("PRIVATE")}
              >
                🔒 Only me
              </button>
            </div>
          </div>
        )}

        <div className="post-form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={submitting}>
            {submitting ? (isEditMode ? "Saving..." : "Posting...") : isEditMode ? "Save changes" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
