import React from "react";
import "./ErrorBanner.css";

// Shows the message that came back from the backend (already extracted
// from either an ExceptionResponseDto or a plain-text error by apiClient).
export default function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <span className="error-banner-dot" aria-hidden="true" />
      <span className="error-banner-text">{message}</span>
      <span className="error-banner-actions">
        {onRetry && (
          <button type="button" className="error-banner-action" onClick={onRetry}>
            Try again
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="error-banner-action"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        )}
      </span>
    </div>
  );
}
