// src/state/AppContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { createAPIEndPointAuth } from "../config/api/apiAuth";

const STORAGE_KEY = "user_profile";

export const getUserData = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData || storedData === "undefined" || storedData === "null") {
      return {};
    }
    const parsedData = JSON.parse(storedData);
    return typeof parsedData === "object" && parsedData !== null
      ? parsedData
      : {};
  } catch (error) {
    console.error("🚨 Failed to parse user_profile:", error);
    return {};
  }
};

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(getUserData);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔹 Always fetch user from API
  const fetchUser = useCallback(async () => {
    try {
      // Try to get the ID from current state or localStorage
      const id = user?.id || getUserData()?.id;
      if (id) {
        const response = await createAPIEndPointAuth("user/").fetchById(
          `${id}`
        );
        if (response?.data) {
          setUser(response.data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
          localStorage.setItem("user_role", response.data?.user_role || "");
        }
      }
    } catch (error) {
      console.error("❌ Error refreshing user profile:", error);
    }
  }, [user?.id]);

  // ✅ Auto-refresh user on every app load (page refresh)
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Keep state in sync across tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        const next = getUserData();
        if (Object.keys(next).length > 0) {
          setUser((prev) =>
            JSON.stringify(prev) !== JSON.stringify(next) ? next : prev
          );
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, sidebarOpen, setSidebarOpen, fetchUser }),
    [user, sidebarOpen, fetchUser]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
