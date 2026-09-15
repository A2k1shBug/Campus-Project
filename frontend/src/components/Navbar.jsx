import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo">
          Sentiment Analysis
        </NavLink>

        <nav className="navbar-links" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Feed
          </NavLink>
          <NavLink to="/comments" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Comments
          </NavLink>
          <NavLink to="/reactions" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Reactions
          </NavLink>
          <NavLink to="/recommendations" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            For you
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="navbar-right">
          <NavLink to="/new" className="btn btn-accent navbar-new-btn">
            New post
          </NavLink>

          <div className="navbar-menu" ref={menuRef}>
            <button
              type="button"
              className="navbar-avatar-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar name={user?.userName} size={34} />
            </button>

            {menuOpen && (
              <div className="navbar-dropdown" role="menu">
                <div className="navbar-dropdown-name">{user?.userName}</div>
                <NavLink to="/profile" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                  Profile settings
                </NavLink>
                <button type="button" className="navbar-dropdown-item" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="navbar-mobile" aria-label="Primary mobile">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}>
          Feed
        </NavLink>
        <NavLink to="/comments" className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}>
          Comments
        </NavLink>
        <NavLink to="/new" className="mobile-link mobile-link-new" aria-label="New post">
          +
        </NavLink>
        <NavLink to="/reactions" className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}>
          Reactions
        </NavLink>
        <NavLink to="/recommendations" className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}>
          For you
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}>
          Profile
        </NavLink>
      </nav>
    </header>
  );
}
