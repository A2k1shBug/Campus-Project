import React, { useCallback, useEffect, useState } from "react";
import { getAllUsers } from "../services/adminService.js";
import Avatar from "../components/Avatar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatTimestamp } from "../utils/dateUtils.js";
import "./AdminUsersPage.css";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (pageNumber, { append }) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const data = await getAllUsers({ page: pageNumber, size: PAGE_SIZE });
      setUsers((prev) => (append ? [...prev, ...data.content] : data.content));
      setHasNext(data.hasNext);
      setPage(data.pageNumber);
    } catch (err) {
      setError(err.message || "Couldn't load users.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(0, { append: false });
  }, [load]);

  return (
    <div className="admin-page">
      <h2 className="admin-page-heading">All users</h2>
      <p className="admin-page-sub">Visible to admins only.</p>

      {error && <ErrorBanner message={error} onRetry={() => load(0, { append: false })} />}

      {loading ? (
        <LoadingSpinner label="Loading users..." />
      ) : users.length === 0 && !error ? (
        <EmptyState title="No users found" />
      ) : (
        <>
          <div className="card admin-table">
            <div className="admin-table-row admin-table-head">
              <span>User</span>
              <span>Joined</span>
            </div>
            {users.map((u) => (
              <div className="admin-table-row" key={u.userName}>
                <span className="admin-table-user">
                  <Avatar name={u.userName} size={30} />
                  {u.userName}
                </span>
                <span className="admin-table-date">{formatTimestamp(u.dateTime)}</span>
              </div>
            ))}
          </div>

          {hasNext && (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => load(page + 1, { append: true })}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
