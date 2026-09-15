import React from "react";
import Navbar from "./Navbar.jsx";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
    </div>
  );
}
