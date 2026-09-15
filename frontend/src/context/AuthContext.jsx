import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authService from "../services/authService.js";
import * as userService from "../services/userService.js";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../utils/tokenStorage.js";
import { registerUnauthorizedHandler } from "../services/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, userName, roles }
  const [initializing, setInitializing] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    try {
      const me = await userService.getCurrentUser();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      clearTokens();
      return null;
    }
  }, []);

  // On first load, if we already have tokens saved, fetch the profile so a
  // page refresh doesn't sign the person out.
  useEffect(() => {
    (async () => {
      if (getAccessToken()) {
        await loadCurrentUser();
      }
      setInitializing(false);
    })();
  }, [loadCurrentUser]);

  // If a call anywhere in the app comes back 401 with no usable refresh
  // token, drop the session so the UI reflects reality.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  const login = useCallback(
    async ({ userName, password }) => {
      const { accessToken, refreshToken } = await authService.login({ userName, password });
      setTokens({ accessToken, refreshToken });
      return loadCurrentUser();
    },
    [loadCurrentUser]
  );

  const signUp = useCallback(({ userName, password }) => {
    return authService.signUp({ userName, password });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Even if the backend call fails (e.g. token already gone), still
      // clear the local session so the person is signed out client-side.
    }
    clearTokens();
    setUser(null);
  }, []);

  const logoutAllDevices = useCallback(async () => {
    if (user?.userName) {
      await authService.logoutAllDevices(user.userName);
    }
    clearTokens();
    setUser(null);
  }, [user]);

  const refreshProfile = useCallback(() => loadCurrentUser(), [loadCurrentUser]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: Boolean(user?.roles?.includes("ADMIN")),
    initializing,
    login,
    signUp,
    logout,
    logoutAllDevices,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
