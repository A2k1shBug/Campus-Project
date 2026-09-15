import React from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you're looking for doesn't exist."
      action={
        <Link to="/" className="btn btn-accent">
          Back to feed
        </Link>
      }
    />
  );
}
