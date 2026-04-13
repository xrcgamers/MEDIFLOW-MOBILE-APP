import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCachedStaffUserService,
  getCurrentStaffService,
  loginStaffService,
  logoutStaffService,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const cachedUser = await getCachedStaffUserService();

        if (!cachedUser) {
          setUser(null);
          return;
        }

        const freshUser = await getCurrentStaffService();
        setUser(freshUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (form) => {
    const result = await loginStaffService(form);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await logoutStaffService();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      logout,
      setUser,
    }),
    [user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}