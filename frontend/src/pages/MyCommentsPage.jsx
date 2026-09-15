import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyVisibleComments, deleteComment } from "../services/commentService.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatTimestamp } from "../utils/dateUtils.js";
import "./MyCommentsPage.css";

const PAGE_SIZE = 15;

const SENTIMENT_LABEL = { POSITIVE: "Positive", NEUTRAL: "Neutral", NEGATIVE: "Negative" };
const SENTIMENT_CLASS = {
  POSITIVE: "sentiment-positive",
  NEUTRAL: "sentiment-neutral",
  NEGATIVE: "sentiment-negative",
};

export default function MyCommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (pageNumber, { append }) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const data = await getMyVisibleComments({ page: pageNumber, size: PAGE_SIZE });
      setComments((prev) => (append ? [...prev, ...data.content] : data.content));
      setHasNext(data.hasNext);
      setPage(data.pageNumber);
    } catch (err) {
      setError(err.message || "Couldn't load comments.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(0, { append: false });
  }, [load]);

  async function handleDelete(id) {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || "Couldn't delete this comment.");
    }
  }

  return (
    <div className="comments-page">
      <h2 className="comments-page-heading">Comments</h2>
      <p className="comments-page-sub">
        Every comment on your posts and on public posts, newest activity first.
      </p>

      {error && <ErrorBanner message={error} onRetry={() => load(0, { append: false })} />}

      {loading ? (
        <LoadingSpinner label="Loading comments..." />
      ) : comments.length === 0 && !error ? (
        <EmptyState title="No comments to show" description="Comments will show up here once people start talking." />
      ) : (
        <>
          <ul className="comments-page-list">
            {comments.map((comment) => (
              <li key={comment.id} className="card comments-page-item">
                <Avatar name={comment.userName} size={32} />
                <div className="comments-page-item-body">
                  <div className="comments-page-item-top">
                    <span className="comments-page-item-author">{comment.userName}</span>
                    {comment.sentiment && (
                      <span className={`comments-page-sentiment ${SENTIMENT_CLASS[comment.sentiment] || ""}`}>
                        {SENTIMENT_LABEL[comment.sentiment] || comment.sentiment}
                      </span>
                    )}
                    <span className="comments-page-item-time">{formatTimestamp(comment.createAt)}</span>
                  </div>
                  <p className="comments-page-item-text">{comment.text}</p>
                  <div className="comments-page-item-actions">
                    <Link to={`/posts/${comment.postId}`}>View post</Link>
                    {comment.userName === user?.userName && (
                      <button type="button" onClick={() => handleDelete(comment.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {hasNext && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => load(page + 1, { append: true })}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
