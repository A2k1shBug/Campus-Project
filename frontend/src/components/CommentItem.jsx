import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import { formatTimestamp } from "../utils/dateUtils.js";
import "./CommentItem.css";

// Sentiment is filled in asynchronously by the backend's AI pipeline, so a
// brand new comment may briefly have sentiment: null — we just omit the
// dot in that case rather than guessing.
const SENTIMENT_LABEL = {
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
};

const SENTIMENT_CLASS = {
  POSITIVE: "sentiment-positive",
  NEUTRAL: "sentiment-neutral",
  NEGATIVE: "sentiment-negative",
};

export default function CommentItem({ comment, onUpdate, onDelete, canModerate = false }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user?.userName === comment.userName;
  const canDelete = isOwner || canModerate;

  async function handleSave() {
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setError("Comments need at least 3 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onUpdate(comment.id, trimmed);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Couldn't save that change.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await onDelete(comment.id);
    } catch (err) {
      setError(err.message || "Couldn't delete this comment.");
      setDeleting(false);
    }
  }

  return (
    <li className="comment-item">
      <Avatar name={comment.userName} size={30} />
      <div className="comment-item-body">
        <div className="comment-item-bubble">
          <div className="comment-item-top">
            <span className="comment-item-author">{comment.userName}</span>
            {comment.sentiment && (
              <span
                className={`comment-item-sentiment ${SENTIMENT_CLASS[comment.sentiment] || ""}`}
                title={SENTIMENT_LABEL[comment.sentiment] || comment.sentiment}
              >
                {SENTIMENT_LABEL[comment.sentiment] || comment.sentiment}
                {comment.confidence != null && (
                  <span className="comment-item-confidence">
                    {" "}
                    · {Math.round(comment.confidence * 100)}%
                  </span>
                )}
              </span>
            )}
          </div>

          {editing ? (
            <div className="comment-item-edit">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                autoFocus
              />
            </div>
          ) : (
            <p className="comment-item-text">{comment.text}</p>
          )}
        </div>

        <div className="comment-item-actions">
          <span className="comment-item-time">{formatTimestamp(comment.createAt)}</span>

          {editing ? (
            <>
              <button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setText(comment.text);
                  setError("");
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {isOwner && (
                <button type="button" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
              {canDelete && (
                <button type="button" onClick={handleDelete} disabled={deleting} className="comment-item-delete">
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </>
          )}
        </div>

        {error && <p className="comment-item-error">{error}</p>}
      </div>
    </li>
  );
}
