import React from "react";
import "./Avatar.css";

const PALETTE = ["#6F5AF6", "#2F9E63", "#C7871A", "#D6486B", "#2D6FE0"];

function colorFor(name) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, size = 38 }) {
  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
  const bg = colorFor(name);

  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
