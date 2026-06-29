import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

type ClientNotification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
};

const ClientNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 10;

  const fetchNotifications = async (page: number) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/dashboard/client-notifications/?page=${page}`);
      setNotifications(res.data.results || res.data || []);
      setTotalCount(res.data.count || (res.data.results || res.data || []).length);
    } catch (err) {
      console.error("Error loading client notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await axiosInstance.patch(`/dashboard/client-notifications/${notificationId}/mark-read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.patch("/dashboard/client-notifications/mark-all-read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_completed":
        return <i className="bi bi-check2-circle text-success fs-4"></i>;
      case "milestone_completed":
        return <i className="bi bi-flag-fill text-primary fs-4"></i>;
      case "invoice_generated":
        return <i className="bi bi-cash-stack text-warning fs-4"></i>;
      case "project_completed":
        return <i className="bi bi-trophy-fill text-info fs-4"></i>;
      default:
        return <i className="bi bi-bell-fill text-secondary fs-4"></i>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 animate__animated animate__fadeIn">
        <div>
          <h2 className="fw-bold text-dark mb-1">Notifications</h2>
          <p className="text-muted mb-0">Stay updated on development stages, task completions, SEO log approvals, and invoice generations.</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm"
            onClick={handleMarkAllAsRead}
          >
            <i className="bi bi-check-all me-1"></i> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5 animate__animated animate__fadeInUp">
          <i className="bi bi-bell-slash text-muted" style={{ fontSize: "4rem" }}></i>
          <h5 className="mt-3 fw-bold text-dark">No Notifications</h5>
          <p className="text-muted">You do not have any notification alerts at this time.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeInUp">
          <div className="list-group list-group-flush">
            {notifications.map((notif) => (
              <div
                className={`list-group-item py-3 border-0 d-flex justify-content-between align-items-center rounded-3 mb-2 transition-all ${
                  !notif.read ? "bg-light border-start border-primary border-4" : ""
                }`}
                key={notif.id}
                style={{ cursor: "pointer" }}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
              >
                <div className="d-flex align-items-center">
                  <div className="me-3">{getNotificationIcon(notif.notification_type)}</div>
                  <div>
                    <h6 className={`mb-1 text-dark ${!notif.read ? "fw-bold" : "fw-normal"}`}>
                      {notif.title}
                    </h6>
                    <p className="mb-0 text-secondary small">{notif.message}</p>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      <i className="bi bi-clock me-1"></i> {notif.created_at}
                    </span>
                  </div>
                </div>
                {!notif.read && (
                  <button
                    className="btn btn-link text-decoration-none text-primary btn-sm fw-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.id);
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                className="btn btn-outline-primary rounded-pill btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              <span className="small text-secondary fw-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-primary rounded-pill btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientNotificationsPage;
