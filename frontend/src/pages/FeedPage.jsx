import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getFeed } from "../services/postService.js";
import { useAuth } from "../context/AuthContext.jsx";
import PostCard from "../components/PostCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Avatar from "../components/Avatar.jsx";
import "./FeedPage.css";

const PAGE_SIZE = 10;

export default function FeedPage() {
  const { user } = useAuth();
  const location = useLocation();
  const justPosted = Boolean(location.state?.justPosted);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (pageNumber, { append }) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const data = await getFeed({ page: pageNumber, size: PAGE_SIZE });
      setPosts((prev) => (append ? [...prev, ...data.content] : data.content));
      setHasNext(data.hasNext);
      setPage(data.pageNumber);
    } catch (err) {
      setError(err.message || "Couldn't load the feed.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(0, { append: false });
  }, [loadPage]);

  function handleDeleted(postId) {
    setPosts((prev) => prev.filter((p) => p.postId !== postId));
  }

  return (
    <div className="feed-page">
      <Link to="/new" className="feed-composer card">
        <Avatar name={user?.userName} />
        <span>What's on your mind, {user?.userName?.split(" ")[0] || "there"}?</span>
      </Link>

      {justPosted && !error && (
        <div className="feed-posted-note">
         Your post is live! Tap refresh if you don't see it below yet.
          <button type="button" onClick={() => loadPage(0, { append: false })}>
            Refresh now
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={() => loadPage(0, { append: false })} />}

      {loading ? (
        <LoadingSpinner label="Loading your feed..." />
      ) : posts.length === 0 && !error ? (
        <EmptyState
          title="Your feed is quiet"
          description="Posts from you and everyone's public posts will show up here."
          action={
            <Link to="/new" className="btn btn-accent">
              Write the first post
            </Link>
          }
        />
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.postId} post={post} onDeleted={handleDeleted} />
          ))}

          {hasNext && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => loadPage(page + 1, { append: true })}
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
