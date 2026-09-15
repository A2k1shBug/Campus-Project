import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { suggestUsername } from "../services/authService.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { usernameLooksValid, getPasswordChecks } from "../utils/validators.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "../styles/auth.css";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [userNameTouchedManually, setUserNameTouchedManually] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const debouncedName = useDebounce(fullName, 500);
  const passwordChecks = getPasswordChecks(password);

  // Ask the backend for a suggested username whenever the person finishes
  // typing their name. This does not reserve the username — it's just a
  // suggestion the person can accept or edit before signing up.
  useEffect(() => {
    const trimmed = debouncedName.trim();
    if (!trimmed || userNameTouchedManually) {
      setSuggestion("");
      return;
    }

    let cancelled = false;
    setCheckingUsername(true);

    suggestUsername(trimmed)
      .then((result) => {
        if (cancelled) return;
        setSuggestion(result);
        setUserName(result);
      })
      .catch(() => {
        if (!cancelled) setSuggestion("");
      })
      .finally(() => {
        if (!cancelled) setCheckingUsername(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedName, userNameTouchedManually]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!userName.trim()) {
      setError("Choose a username first.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ userName: userName.trim(), password });
      navigate("/login", { state: { justSignedUp: true } });
    } catch (err) {
      setError(err.message || "Couldn't create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-brand">Sentiment Analysis</div>
        <p className="auth-subtitle">Create an account to start posting.</p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="fullName">Your name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sanju Tharu"
              autoFocus
            />
            <span className="field-hint">We'll suggest a username based on this.</span>
          </div>

          {checkingUsername && <p className="checking-note">Checking username availability...</p>}

          {suggestion && !userNameTouchedManually && (
            <div className="username-suggestion">
              Suggested username: <strong>{suggestion}</strong>
              <button type="button" onClick={() => setUserNameTouchedManually(true)}>
                Edit
              </button>
            </div>
          )}

          <div className="field">
            <label htmlFor="userName">Username</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setUserNameTouchedManually(true);
              }}
              placeholder="Letters, spaces, optional trailing numbers"
              className={userName && !usernameLooksValid(userName) ? "has-error" : ""}
            />
            {userName && !usernameLooksValid(userName) && (
              <span className="field-error">
                Only letters and spaces, with optional numbers at the end (e.g. "Sanju Tharu583").
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
            <ul className="password-hints">
              {passwordChecks.map((check) => (
                <li key={check.key} className={check.met ? "met" : ""}>
                  {check.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              className={confirmPassword && confirmPassword !== password ? "has-error" : ""}
            />
            {confirmPassword && confirmPassword !== password && (
              <span className="field-error">Passwords don't match.</span>
            )}
          </div>

          <button type="submit" className="btn btn-accent btn-block" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
