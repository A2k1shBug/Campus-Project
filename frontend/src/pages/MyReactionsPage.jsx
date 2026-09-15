import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyVisibleReactions, reactToPost } from "../services/reactionService.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatTimestamp } from "../utils/dateUtils.js";
import "./MyReactionsPage.css";

const PAGE_SIZE = 15;

const EMOJI = { LIKE: "👍", LOVE: "❤️", HAHA: "😂", HAPPY: "😊", SAD: "😢" };

export default function MyReactionsPage() {
  const { user } = useAuth();
  const [reactions, setReactions] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [removingKey, setRemovingKey] = useState(null);

  const load = useCallback(async (pageNumber, { append }) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const data = await getMyVisibleReactions({ page: pageNumber, size: PAGE_SIZE });
      setReactions((prev) => (append ? [...prev, ...data.content] : data.content));
      setHasNext(data.hasNext);
      setPage(data.pageNumber);
    } catch (err) {
      setError(err.message || "Couldn't load reactions.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(0, { append: false });
  }, [load]);

  // Reacting again with the same type is how the backend removes a
  // reaction (see ReactionService.createReaction) — there's no separate
  // delete endpoint, so "Remove" just replays that same call.
  async function handleRemove(reaction) {
    const key = `${reaction.postId}:${reaction.reactionType}`;
    setRemovingKey(key);
    setError("");
    try {
      await reactToPost({ postId: reaction.postId, reactionType: reaction.reactionType });
      setReactions((prev) =>
        prev.filter((r) => !(r.postId === reaction.postId && r.userName === reaction.userName))
      );
    } catch (err) {
      setError(err.message || "Couldn't remove this reaction.");
    } finally {
      setRemovingKey(null);
    }
  }

  return (
    <div className="reactions-page">
      <h2 className="reactions-page-heading">Reactions</h2>
      <p className="reactions-page-sub">Reactions on your posts and on public posts.</p>

      {error && <ErrorBanner message={error} onRetry={() => load(0, { append: false })} />}

      {loading ? (
        <LoadingSpinner label="Loading reactions..." />
      ) : reactions.length === 0 && !error ? (
        <EmptyState title="No reactions yet" description="Reactions will show up here as people react to posts." />
      ) : (
        <>
          <ul className="reactions-page-list">
            {reactions.map((reaction, idx) => {
              const key = `${reaction.postId}:${reaction.reactionType}:${idx}`;
              const isMine = reaction.userName === user?.userName;
              return (
                <li key={key} className="card reactions-page-item">
                  <Avatar name={reaction.userName} size={32} />
                  <div className="reactions-page-item-body">
                    <span className="reactions-page-item-line">
                      <strong>{reaction.userName}</strong> reacted{" "}
                      <span className="reactions-page-emoji">{EMOJI[reaction.reactionType] || ""}</span>{" "}
                      {reaction.reactionType.toLowerCase()}
                    </span>
                    <span className="reactions-page-item-time">{formatTimestamp(reaction.createdAt)}</span>
                  </div>
                  <div className="reactions-page-item-actions">
                    <Link to={`/posts/${reaction.postId}`}>View post</Link>
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleRemove(reaction)}
                        disabled={removingKey === `${reaction.postId}:${reaction.reactionType}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
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
