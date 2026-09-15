import React from "react";
import "./LoadingSpinner.css";

export default function LoadingSpinner({ label = "Loading...", fullPage = false }) {
  return (
    <div className={fullPage ? "spinner-wrap spinner-wrap-full" : "spinner-wrap"}>
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
