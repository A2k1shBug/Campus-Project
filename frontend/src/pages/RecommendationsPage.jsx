import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendations, getMyCommentedPostCount } from "../services/commentService.js";
import { getPostDetail } from "../services/postService.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import RecommendationCard from "../components/RecommendationCard.jsx";
import "./RecommendationsPage.css";

// Must match the backend's unlock rule (comment on 10+ different posts).
// Only used to pick which friendly message to show -- the backend is the
// real source of truth for whether recommendations are actually returned.
const UNLOCK_THRESHOLD = 10;

// Turns the flat list the API returns into groups keyed by postId, in the
// order each post first appears. Comments about the same post end up
// together under one heading instead of scattered through the list.
function groupByPost(comments) {
  const order = [];
  const commentsByPostId = new Map();

  for (const comment of comments) {
    if (!commentsByPostId.has(comment.postId)) {
      commentsByPostId.set(comment.postId, []);
      order.push(comment.postId);
    }
    commentsByPostId.get(comment.postId).push(comment);
  }

  return order.map((postId) => ({
    postId,
    postTitle: null,
    comments: commentsByPostId.get(postId),
  }));
}

// Best-effort: look up each group's post title so the heading says
// something like "Why remote work fails" instead of a raw post ID. If a
// lookup fails (post was deleted, etc.) that group just falls back to a
// plain "View post" link -- it doesn't block the rest of the page.
async function attachPostTitles(groups) {
  return Promise.all(
    groups.map(async (group) => {
      try {
        const detail = await getPostDetail(group.postId);
        return { ...group, postTitle: detail?.post?.title || null };
      } catch {
        return group;
      }
    })
  );
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  // "loading" | "locked" | "empty" | "ready" | "error"
  const [status, setStatus] = useState("loading");
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const recommendations = await getRecommendations();

      if (recommendations && recommendations.length > 0) {
        const grouped = groupByPost(recommendations);
        setGroups(await attachPostTitles(grouped));
        setStatus("ready");
        return;
      }

      // Empty list -- figure out which "empty" this actually is.
      const commentedPostCount = await getMyCommentedPostCount(user?.userName).catch(() => null);

      if (commentedPostCount != null && commentedPostCount < UNLOCK_THRESHOLD) {
        setStatus("locked");
      } else {
        // Either unlocked with no matches, or we couldn't tell for sure --
        // either way, this message is honest and not alarming.
        setStatus("empty");
      }
    } catch (err) {
      setError(err.message || "Couldn't load recommendations.");
      setStatus("error");
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="recommendations-page">
      <h2 className="recommendations-page-heading">For you</h2>
      <p className="recommendations-page-sub">
        Comments with a different perspective, picked from posts across the app based on what you've been commenting on.
      </p>

      {status === "loading" && <LoadingSpinner label="Finding recommendations..." />}

      {status === "error" && <ErrorBanner message={error} onRetry={load} />}

      {status === "locked" && (
        <EmptyState
          title="Comment on a few more posts to unlock this"
          description={`Recommendations unlock once you've commented on ${UNLOCK_THRESHOLD} different posts. Keep exploring the feed, and check back here.`}
        />
      )}

      {status === "empty" && (
        <EmptyState
          title="No recommendations right now"
          description="You're all set -- we just don't have a good match yet. Check back later as more comments come in."
        />
      )}

      {status === "ready" && (
        <div className="recommendations-page-groups">
          {groups.map((group) => (
            <section key={group.postId} className="card recommendations-page-group">
              <header className="recommendations-page-group-header">
                <span className="recommendations-page-group-label">From</span>
                <Link to={`/posts/${group.postId}`} className="recommendations-page-group-title">
                  {group.postTitle || "View post"}
                </Link>
              </header>

              <ul className="recommendations-page-group-list">
                {group.comments.map((comment) => (
                  <RecommendationCard key={comment.id} comment={comment} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
