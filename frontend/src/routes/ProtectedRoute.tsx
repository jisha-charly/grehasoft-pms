import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getDefaultRoute } from "../context/AuthContext";
import { Permission } from "../types";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { isAuthenticated, hasPermission, loading, logout, user } = useAuth();
  const location = useLocation();
const navigate = useNavigate();
  // Wait until auth finishes loading
  if (loading) return null;

  // 🔐 Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🔐 Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // If they lack basic dashboard permission, show a static error instead of looping
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="text-center p-5 bg-white shadow-sm rounded-4 border">
          <i className="bi bi-shield-lock text-danger" style={{ fontSize: "4rem" }}></i>
          <h2 className="mt-3 fw-bold text-dark">Access Denied</h2>
          <p className="text-muted mt-2 mb-4">You do not have the required permissions to view this page.<br/>Contact your administrator to assign permissions to your role.</p>
          {/* 🔥 BUTTON GROUP */}
        <div className="d-flex gap-2 justify-content-center">
          
          {/* Safe Default Landing Route Button */}
          <button
            className="btn btn-primary px-4 py-2"
            onClick={() => navigate(getDefaultRoute(user))}
          >
            Go to Home
          </button>

          {/* 🔥 LOGOUT */}
          <button
            className="btn btn-outline-danger px-4 py-2"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;