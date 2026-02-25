import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axiosInstance";
import axios from "axios";
import {
  User,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from "../types";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= VERIFY TOKEN ON APP LOAD ================= */

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("access");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me/");
        const backendUser = res.data;

        setUser({
          id: backendUser.id,
          name: backendUser.name,
          username: backendUser.username,
          email: backendUser.email,
          role: backendUser.role_name as UserRole, // ✅ FIXED
          departmentId: backendUser.department,
          status: backendUser.status,
          createdAt: backendUser.created_at,
        });
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  /* ================= LOGIN ================= */

  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/token/",
        { username, password }
      );

      const { access, refresh } = res.data;

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      // Fetch user info after login
      const userRes = await api.get("/users/me/");
      const backendUser = userRes.data;

      setUser({
        id: backendUser.id,
        name: backendUser.name,
        username: backendUser.username,
        email: backendUser.email,
        role: backendUser.role_name as UserRole, // ✅ FIXED
        departmentId: backendUser.department,
        status: backendUser.status,
        createdAt: backendUser.created_at,
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  /* ================= PERMISSION CHECK ================= */

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    const rolePermissions = ROLE_PERMISSIONS[user.role];

    if (!rolePermissions) return false;

    return rolePermissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
        hasPermission,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};