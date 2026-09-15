import React, { useState, useRef, useEffect } from "react";
import { reactToPost } from "../services/reactionService.js";
import "./ReactionBar.css";

const REACTIONS = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "HAHA", emoji: "😂", label: "Haha" },
  { type: "HAPPY", emoji: "😊", label: "Happy" },
  { type: "SAD", emoji: "😢", label: "Sad" },
];

const EMOJI_BY_TYPE = Object.fromEntries(REACTIONS.map((r) => [r.type, r.emoji]));

/**
 * Reaction picker + live count.
 *
 * The POST /api/react endpoint toggles server-side: reacting with the same
 * type removes it, reacting with a different type switches it. We mirror
 * that logic optimistically here so the UI updates instantly, then let the
 * caller know so it can keep its own state (e.g. a post list) in sync.
 *
 * `myReaction` may be unknown (null) on screens where the backend doesn't
 * tell us which reaction — if any — the current user already left.
 */
export default function ReactionBar({ postId, count, myReaction = null, onChanged }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handlePick(type) {
    setPickerOpen(false);
    setError("");
    setSubmitting(true);

    const previousCount = count;
    const previousReaction = myReaction;

    let nextCount = count;
    let nextReaction = type;

    if (myReaction === type) {
      nextCount = Math.max(0, count - 1);
      nextReaction = null;
    } else if (!myReaction) {
      nextCount = count + 1;
    }
    // switching from one type to another leaves the count unchanged

    onChanged?.(nextCount, nextReaction);

    try {
      await reactToPost({ postId, reactionType: type });
    } catch (err) {
      // roll back on failure
      onChanged?.(previousCount, previousReaction);
      setError(err.message || "Couldn't react to this post.");
    } finally {
      setSubmitting(false);
    }
  }

  const quickButtonEmoji = myReaction ? EMOJI_BY_TYPE[myReaction] : "🤍";

  return (
    <div className="reaction-bar" ref={wrapRef}>
      <div className="reaction-bar-row">
        <button
          type="button"
          className={myReaction ? "reaction-quick-btn is-active" : "reaction-quick-btn"}
          onClick={() => setPickerOpen((v) => !v)}
          disabled={submitting}
          aria-haspopup="menu"
          aria-expanded={pickerOpen}
        >
          <span aria-hidden="true">{quickButtonEmoji}</span>
          <span>{myReaction ? REACTIONS.find((r) => r.type === myReaction)?.label : "React"}</span>
        </button>
        <span className="reaction-count">{count}</span>

        {pickerOpen && (
          <div className="reaction-picker" role="menu">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                type="button"
                role="menuitem"
                className={r.type === myReaction ? "reaction-picker-item is-active" : "reaction-picker-item"}
                onClick={() => handlePick(r.type)}
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="reaction-error">{error}</p>}
    </div>
  );
}
