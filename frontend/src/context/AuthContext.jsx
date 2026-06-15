import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/client";
import { loginService, logoutService, meService } from "../services/authService";

const AUTH_STORAGE_KEY = "mediflow_auth_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyToken = async (nextToken) => {
    if (nextToken) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, nextToken);
      setToken(nextToken);
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setToken(null);
    }
  };

  const restoreSession = async () => {
    try {
      setIsLoading(true);

      const storedToken = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(storedToken);

      const currentUser = await meService();
      setUser(currentUser);
    } catch (error) {
      await applyToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async ({ identifier, password }) => {
    const data = await loginService({ identifier, password });
    await applyToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutService();
      }
    } catch (error) {
      // ignore server logout failure
    } finally {
      await applyToken(null);
      setUser(null);
    }
  };

  const refreshMe = async () => {
    const currentUser = await meService();
    setUser(currentUser);
    return currentUser;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      refreshMe,
      setUser,
    }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}