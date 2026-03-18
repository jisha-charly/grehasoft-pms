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
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getDefaultRoute = (user: User | null): string => {
  if (!user) return "/login";
  if (user.is_superuser) return "/";

  const perms = (user.role_permissions || []).map((p) => String(p).toUpperCase());

  if (perms.includes("VIEW_DASHBOARD")) return "/";
  if (perms.includes("VIEW_PROJECTS")) return "/projects";
  if (perms.includes("VIEW_TASKS")) return "/tasks";
  if (perms.includes("VIEW_LEADS")) return "/crm";
  if (perms.includes("VIEW_CLIENTS")) return "/clients";

  return "/profile";
};

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
          role_permissions: backendUser.role_permissions,
          departmentId: backendUser.department,
          status: backendUser.status,
          createdAt: backendUser.created_at,
          is_superuser: backendUser.is_superuser,
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
      `${import.meta.env.VITE_API_BASE}/api/token/`,
      { username, password }
    );

    const { access, refresh } = res.data;

    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    const userRes = await api.get("/users/me/");
    const backendUser = userRes.data;

    const newUser = {
      id: backendUser.id,
      name: backendUser.name,
      username: backendUser.username,
      email: backendUser.email,
      role: backendUser.role_name as UserRole,
      role_permissions: backendUser.role_permissions,
      departmentId: backendUser.department,
      status: backendUser.status,
      createdAt: backendUser.created_at,
      is_superuser: backendUser.is_superuser,
    };
    
    setUser(newUser);
    return newUser;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};
 const updateUser = async (updates: Partial<User>) => {
  if (!user) return;

  try {
    const res = await api.patch(`/users/${user.id}/`, updates);

    const updatedUser = res.data;

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUser(updatedUser);

  } catch (error) {
    console.error("Error updating user profile:", error);
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
    if (user.is_superuser) return true; // Native Django bypass
    if (!user.role_permissions) return false;
    
    // Normalize string cases to ensure case-insensitive comparison
    const targetPerm = String(permission).toUpperCase();
    return user.role_permissions.some(
      (p) => String(p).toUpperCase() === targetPerm
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
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