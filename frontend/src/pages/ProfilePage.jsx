import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { updateUser, deleteUser } from "../services/userService.js";
import { getPasswordChecks } from "../utils/validators.js";
import Avatar from "../components/Avatar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, logout, logoutAllDevices, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState(user?.userName || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const passwordChecks = password ? getPasswordChecks(password) : [];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password && password !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    const usernameChanged = userName.trim() && userName.trim() !== user.userName;

    setSaving(true);
    try {
      await updateUser(user.id, {
        userName: usernameChanged ? userName.trim() : "",
        password: password || "",
      });

      if (usernameChanged) {
        // Your access token is tied to the old username, so the backend
        // will reject further requests with it. Sign out and ask the
        // person to log back in with their new username rather than
        // leaving them in a broken half-signed-in state.
        await logout();
        navigate("/login", { state: { justSignedUp: false } });
        return;
      }

      await refreshProfile();
      setPassword("");
      setConfirmPassword("");
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message || "Couldn't update your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteUser(user.id);
      await logout();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message || "Couldn't delete your account.");
      setDeleting(false);
    }
  }

  async function handleLogoutAll() {
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
      navigate("/login");
    } catch (err) {
      setError(err.message || "Couldn't log out of all devices.");
      setLoggingOutAll(false);
    }
  }

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <Avatar name={user.userName} size={56} />
        <div>
          <h2>{user.userName}</h2>
          <div className="profile-roles">
            {user.roles?.map((role) => (
              <span key={role} className="profile-role-badge">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="card profile-section">
        <h3>Account settings</h3>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        {success && <p className="profile-success">{success}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="profileUserName">Username</label>
            <input
              id="profileUserName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            {userName.trim() !== user.userName && (
              <span className="field-hint">Changing your username will sign you out — you'll log back in with the new one.</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="profilePassword">New password</label>
            <input
              id="profilePassword"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep your current password"
            />
            {password && (
              <ul className="password-hints">
                {passwordChecks.map((check) => (
                  <li key={check.key} className={check.met ? "met" : ""}>
                    {check.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {password && (
            <div className="field">
              <label htmlFor="profileConfirmPassword">Confirm new password</label>
              <input
                id="profileConfirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      <section className="card profile-section">
        <h3>Sessions</h3>
        <p className="profile-section-desc">Sign out on every device where you're logged in.</p>
        <button type="button" className="btn btn-ghost" onClick={handleLogoutAll} disabled={loggingOutAll}>
          {loggingOutAll ? "Logging out..." : "Log out everywhere"}
        </button>
      </section>

      <section className="card profile-section profile-danger">
        <h3>Delete account</h3>
        <p className="profile-section-desc">
          This permanently deletes your account, posts, comments, and reactions. This can't be undone.
        </p>
        <ErrorBanner message={deleteError} onDismiss={() => setDeleteError("")} />

        {!confirmingDelete ? (
          <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
            Delete my account
          </button>
        ) : (
          <div className="profile-delete-confirm">
            <span>Are you sure? This is permanent.</span>
            <div className="profile-delete-confirm-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, delete everything"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
