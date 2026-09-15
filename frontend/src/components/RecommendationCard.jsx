import React from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import { formatTimestamp } from "../utils/dateUtils.js";
import "./RecommendationCard.css";

// Same label/class maps used by CommentItem.jsx and MyCommentsPage.jsx —
// kept here too so this card has no dependency on those files and can't
// accidentally break them.
const SENTIMENT_LABEL = { POSITIVE: "Positive", NEUTRAL: "Neutral", NEGATIVE: "Negative" };
const SENTIMENT_CLASS = {
  POSITIVE: "sentiment-positive",
  NEUTRAL: "sentiment-neutral",
  NEGATIVE: "sentiment-negative",
};

export default function RecommendationCard({ comment }) {
  return (
    <li className="recommendation-card">
      <Avatar name={comment.userName} size={30} />
      <div className="recommendation-card-body">
        <div className="recommendation-card-top">
          <span className="recommendation-card-author">{comment.userName}</span>
          {comment.sentiment && (
            <span
              className={`recommendation-card-sentiment ${SENTIMENT_CLASS[comment.sentiment] || ""}`}
              title={SENTIMENT_LABEL[comment.sentiment] || comment.sentiment}
            >
              {SENTIMENT_LABEL[comment.sentiment] || comment.sentiment}
              {comment.confidence != null && (
                <span className="recommendation-card-confidence">
                  {" "}
                  · {Math.round(comment.confidence * 100)}%
                </span>
              )}
            </span>
          )}
          <span className="recommendation-card-time">{formatTimestamp(comment.createAt)}</span>
        </div>

        <p className="recommendation-card-text">{comment.text}</p>

        <Link to={`/posts/${comment.postId}`} className="recommendation-card-link">
          View post
        </Link>
      </div>
    </li>
  );
}
