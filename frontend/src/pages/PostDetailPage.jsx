import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getPostDetail, deletePost } from "../services/postService.js";
import { createComment, updateComment, deleteComment, getMyVisibleComments } from "../services/commentService.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import ReactionBar from "../components/ReactionBar.jsx";
import CommentItem from "../components/CommentItem.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatTimestamp } from "../utils/dateUtils.js";
import "./PostDetailPage.css";

export default function PostDetailPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPostDetail(postId);
      setDetail(data);
      // The post-detail endpoint's comment DTO doesn't include sentiment/confidence
      // (backend limitation), but GET /api/comment does. Backfill it here so the
      // sentiment badge shows up without waiting on a backend change.
      enrichCommentsWithSentiment(data.comments, postId).then((enriched) => {
        if (enriched) {
          setDetail((prev) => (prev ? { ...prev, comments: enriched } : prev));
        }
      });
    } catch (err) {
      setError(err.message || "Couldn't load this post.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Pages through the user's visible comments looking for ones on this post,
  // and returns `comments` with sentiment/confidence merged in wherever a match
  // is found (matched by comment id). Gives up after a reasonable number of
  // pages so a very active feed doesn't page forever.
  async function enrichCommentsWithSentiment(comments, currentPostId) {
    if (!comments || comments.length === 0) return null;

    const sentimentById = new Map();
    let page = 0;
    const size = 50;
    const maxPages = 20;

    try {
      while (page < maxPages && sentimentById.size < comments.length) {
        const result = await getMyVisibleComments({ page, size });
        const content = result?.content || [];

        for (const c of content) {
          if (c.postId === currentPostId && (c.sentiment != null || c.confidence != null)) {
            sentimentById.set(c.id, { sentiment: c.sentiment, confidence: c.confidence });
          }
        }

        if (result?.last || content.length === 0) break;
        page += 1;
      }
    } catch {
      // Best-effort enrichment — if this fails, comments still render fine
      // without the sentiment badge.
      return null;
    }

    if (sentimentById.size === 0) return null;

    return comments.map((c) =>
      sentimentById.has(c.id) ? { ...c, ...sentimentById.get(c.id) } : c
    );
  }

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddComment(e) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (trimmed.length < 3) {
      setCommentError("Comments need at least 3 characters.");
      return;
    }
    setPostingComment(true);
    setCommentError("");
    try {
      const created = await createComment({ postId, text: trimmed });
      setDetail((prev) => ({
        ...prev,
        comments: [
          ...prev.comments,
          { id: created.id, text: created.text, userName: created.userName, createAt: created.createAt },
        ],
        post: { ...prev.post, commentCount: prev.post.commentCount + 1 },
      }));
      setCommentText("");
    } catch (err) {
      setCommentError(err.message || "Couldn't post your comment.");
    } finally {
      setPostingComment(false);
    }
  }

  async function handleUpdateComment(commentId, text) {
    await updateComment(commentId, { postId, text });
    setDetail((prev) => ({
      ...prev,
      comments: prev.comments.map((c) => (c.id === commentId ? { ...c, text } : c)),
    }));
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(commentId);
    setDetail((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
      post: { ...prev.post, commentCount: Math.max(0, prev.post.commentCount - 1) },
    }));
  }

  async function handleDeletePost() {
    setDeletingPost(true);
    try {
      await deletePost(postId);
      navigate("/");
    } catch (err) {
      setError(err.message || "Couldn't delete this post.");
      setDeletingPost(false);
      setConfirmingDelete(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading post..." />;

  if (error && !detail) {
    return <ErrorBanner message={error} onRetry={load} />;
  }

  if (!detail) return null;

  const { post, comments, reactions } = detail;
  const isOwner = user?.userName === post.userName;
  const myReactionEntry = reactions.find((r) => r.userName === user?.userName);

  return (
    <div className="post-detail-page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <article className="card post-detail-card">
        <header className="post-detail-header">
          <Avatar name={post.userName} size={42} />
          <div className="post-detail-meta">
            <span className="post-detail-author">{post.userName}</span>
            <span className="post-detail-time">{formatTimestamp(post.createAt)}</span>
          </div>

          {isOwner && (
            <div className="post-detail-owner-actions">
              <Link to={`/posts/${postId}/edit`} className="btn btn-ghost">
                Edit
              </Link>
              <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
                Delete
              </button>
            </div>
          )}
        </header>

        <h1 className="post-detail-title">{post.title}</h1>
        <p className="post-detail-text">{post.text}</p>

        {confirmingDelete && (
          <div className="post-card-confirm">
            <span>Delete this post? This can't be undone.</span>
            <div className="post-card-confirm-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeletePost} disabled={deletingPost}>
                {deletingPost ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}

        <div className="post-detail-reactions">
          <ReactionBar
            postId={postId}
            count={post.reactionCount}
            myReaction={myReactionEntry?.reactionType || null}
            onChanged={(count, myReaction) => {
              setDetail((prev) => {
                const withoutMine = prev.reactions.filter((r) => r.userName !== user?.userName);
                const nextReactions = myReaction
                  ? [...withoutMine, { reactionType: myReaction, userName: user.userName, createAt: new Date().toISOString() }]
                  : withoutMine;
                return { ...prev, post: { ...prev.post, reactionCount: count }, reactions: nextReactions };
              });
            }}
          />
        </div>
      </article>

      <section className="post-detail-comments">
        <h2 className="post-detail-comments-heading">
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </h2>

        <form onSubmit={handleAddComment} className="card comment-form">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
          />
          {commentError && <p className="comment-form-error">{commentError}</p>}
          <div className="comment-form-actions">
            <button type="submit" className="btn btn-accent" disabled={postingComment}>
              {postingComment ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>

        {comments.length === 0 ? (
          <EmptyState title="No comments yet" description="Be the first to say something." />
        ) : (
          <ul className="comment-list">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                canModerate={isOwner}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
