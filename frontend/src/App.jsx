import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import PostDetailPage from "./pages/PostDetailPage.jsx";
import CreateEditPostPage from "./pages/CreateEditPostPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MyCommentsPage from "./pages/MyCommentsPage.jsx";
import MyReactionsPage from "./pages/MyReactionsPage.jsx";
import RecommendationsPage from "./pages/RecommendationsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  const { initializing } = useAuth();

  // Wait for the "do we already have a valid session?" check (GET
  // /api/user/me using a saved token) before rendering anything that
  // depends on auth state — avoids a flash of the login page on refresh.
  if (initializing) {
    return <LoadingSpinner label="Loading..." fullPage />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <FeedPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/new"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateEditPostPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/posts/:postId"
        element={
          <ProtectedRoute>
            <Layout>
              <PostDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/posts/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateEditPostPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/comments"
        element={
          <ProtectedRoute>
            <Layout>
              <MyCommentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reactions"
        element={
          <ProtectedRoute>
            <Layout>
              <MyReactionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <Layout>
              <RecommendationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <AdminUsersPage />
            </Layout>
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
