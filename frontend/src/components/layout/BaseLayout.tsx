import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TrackingAPI from '../../api/trackingAPI';
import './Layout.css';
import { useNotifications } from "../../context/NotificationContext";

export interface BaseNavChild {
  id: string;
  label: string;
  route: string;
  active?: boolean;
}

export interface BaseNavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
  children?: BaseNavChild[];
  isActionButton?: boolean;
}

interface BaseLayoutProps {
  children: React.ReactNode;
  navItems: BaseNavItem[];
  adminItems?: { label: string; path: string; icon: string }[];
  showAdminMenu?: boolean;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  navItems,
  adminItems = [
    { label: 'Users', path: '/admin/users', icon: 'bi-people' },
    { label: 'Roles', path: '/admin/roles', icon: 'bi-person-badge' },
    { label: 'Departments', path: '/admin/departments', icon: 'bi-diagram-3' },
    { label: 'Task Types', path: '/admin/task-types', icon: 'bi-list-task' },
  ],
  showAdminMenu = false,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { notifications } = useNotifications();

  // Scroll Container Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!user) return null;

  // Heartbeat session tracking
  useEffect(() => {
    if (!user) return;
    const trackingAPI = new TrackingAPI();
    const sendPing = () => {
      trackingAPI.sendHeartbeat().catch((err) => {
        console.warn('Browser heartbeat failed:', err);
      });
    };
    sendPing();
    const interval = setInterval(sendPing, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to dismiss notification dropdown
  useEffect(() => {
    const handleClick = () => setShowDropdown(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Close sidebar drawer on path changes
  useEffect(() => {
    setSidebarOpen(false);
    document.querySelectorAll(".layout-backdrop, .modal-backdrop").forEach((el) => el.remove());
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      document.querySelectorAll(".layout-backdrop, .modal-backdrop").forEach((el) => el.remove());
    };
  }, []);

  const handleLogout = async () => {
    document.querySelectorAll(".modal-backdrop, .layout-backdrop").forEach(el => el.remove());
    document.body.classList.remove("modal-open");
    try {
      const trackingAPI = new TrackingAPI();
      await trackingAPI.logout();
    } catch (e) {
      console.warn("Tracking logout failed:", e);
    }
    logout();
    navigate('/login');
  };

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [navItems]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
        checkScroll();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", checkScroll);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", checkScroll);
    };
  }, []);

  const scrollBy = (amount: number) => {
    scrollContainerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Flatten items for mobile drawer
  const flatMobileItems = navItems.flatMap((item) => {
    if (item.isActionButton) return [];
    if (item.children && item.children.length) {
      return item.children.map((child) => ({
        label: child.label,
        path: child.route,
        icon: item.icon,
        active: child.active !== undefined ? child.active : location.pathname === child.route,
      }));
    }
    return item.route
      ? [
        {
          label: item.label,
          path: item.route,
          icon: item.icon,
          active: item.active !== undefined ? item.active : location.pathname === item.route,
        },
      ]
      : [];
  });

  return (
    <div className="app-layout-wrapper">
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm app-navbar">
        <div className="container-fluid px-4">
          <Link className="navbar-brand text-primary d-flex align-items-center fw-bold me-2 nav-left flex-shrink-0" to="/">
            <i className="bi bi-stack me-2"></i>
            GREHASOFT <span className="badge bg-light text-dark ms-2 fw-normal fs-6 border">v2.0</span>
          </Link>

          {/* Desktop Nav */}
          <div className="d-none d-lg-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
            {canScrollLeft && (
              <button
                className="btn btn-sm btn-white bg-white border shadow-sm rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center ms-3"
                style={{ width: '32px', height: '32px' }}
                onClick={() => scrollBy(-200)}
                aria-label="Scroll left"
              >
                <i className="bi bi-chevron-left text-secondary"></i>
              </button>
            )}

            <div className={`nav-center nav-scroll-container flex-grow-1 mx-2 ${!canScrollLeft ? 'ms-lg-3' : ''}`} ref={scrollContainerRef}>
              <ul className="navbar-nav mb-0 flex-nowrap h-100 align-items-center px-1">
                {navItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;

                  if (hasChildren) {
                    const isActiveGroup = item.children!.some(
                      (child) => child.active !== undefined ? child.active : location.pathname === child.route
                    );
                    return (
                      <li className="nav-item dropdown h-100 d-flex align-items-center" key={item.id}>
                        <button
                          className={`nav-link dropdown-toggle px-3 d-flex align-items-center border-0 bg-transparent ${isActiveGroup || item.active
                            ? "active text-primary fw-bold"
                            : "text-secondary"
                            }`}
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className={`bi ${item.icon} me-2`} />
                          {item.label}
                        </button>
                        <ul className="dropdown-menu shadow border-0 mt-2 rounded-3">
                          {item.children!.map((child) => {
                            const active = child.active !== undefined ? child.active : location.pathname === child.route;
                            return (
                              <li key={child.id}>
                                <Link
                                  className={`dropdown-item py-2 small fw-medium d-flex align-items-center ${active ? "active fw-bold" : ""}`}
                                  to={child.route}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  }

                  if (item.isActionButton) {
                    return (
                      <li className="nav-item h-100 d-flex align-items-center ms-2" key={item.id}>
                        <Link
                          to={item.route || "#"}
                          className="btn btn-sm btn-success rounded-3 d-flex align-items-center fw-semibold text-white px-3"
                        >
                          <i className={`bi ${item.icon} me-1`}></i>
                          {item.label}
                        </Link>
                      </li>
                    );
                  }

                  if (item.route) {
                    const active = item.active !== undefined ? item.active : location.pathname === item.route;
                    return (
                      <li className="nav-item h-100 d-flex align-items-center" key={item.id}>
                        <Link
                          className={`nav-link px-3 d-flex align-items-center ${active ? "active text-primary fw-bold" : "text-secondary"}`}
                          to={item.route}
                        >
                          <i className={`bi ${item.icon} me-2`}></i>
                          {item.label}
                        </Link>
                      </li>
                    );
                  }

                  return null;
                })}
              </ul>
            </div>

            {canScrollRight && (
              <button
                className="btn btn-sm btn-white bg-white border shadow-sm rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center me-2"
                style={{ width: '32px', height: '32px' }}
                onClick={() => scrollBy(200)}
                aria-label="Scroll right"
              >
                <i className="bi bi-chevron-right text-secondary"></i>
              </button>
            )}

            {/* Nav Right */}
            <div className="nav-right d-flex align-items-center flex-shrink-0 ms-3 ps-3 border-start">
              <div className="position-relative me-3">
                <button
                  className="btn btn-light position-relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <i className="bi bi-bell"></i>
                  {notifications.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="position-absolute end-0 mt-2 bg-white shadow rounded-3 p-3" style={{ width: "300px", zIndex: 1000 }}>
                    <h6 className="fw-bold mb-2">Notifications</h6>
                    {notifications.length === 0 ? (
                      <div className="text-muted small">No alerts</div>
                    ) : (
                      notifications.slice(0, 5).map((n, i) => (
                        <div
                          key={i}
                          className="border-bottom py-2 small cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (n.type === "reminder") {
                              navigate("/reminders");
                            } else if (n.type === "domain" || n.type === "expired") {
                              navigate("/infrastructure/domains");
                            }
                            setShowDropdown(false);
                          }}
                        >
                          <div className="fw-semibold text-primary">{n.message}</div>
                          <div className="text-muted small">{n.date}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center">
                {showAdminMenu && (
                  <div className="dropdown me-3">
                    <button className="btn btn-light dropdown-toggle btn-sm fw-bold border-0" type="button" data-bs-toggle="dropdown">
                      Admin
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                      {adminItems.map(item => (
                        <li key={item.path}>
                          <Link className="dropdown-item py-2 small fw-medium d-flex align-items-center" to={item.path}>
                            <i className={`bi ${item.icon} me-2`}></i>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="dropdown">
                  <button className="btn btn-link text-decoration-none text-dark d-flex align-items-center p-0 border-0" type="button" data-bs-toggle="dropdown">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '35px', height: '35px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {user.username.charAt(0)}
                    </div>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                    <li className="px-3 py-2 border-bottom mb-2">
                      <div className="fw-bold small">{user.name || user.username}</div>
                      <div className="text-primary smaller" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{user.role_name || user.role}</div>
                    </li>
                    <li>
                      <Link className="dropdown-item d-flex align-items-center py-2 small fw-medium" to="/profile">
                        <i className="bi bi-person-circle me-2 text-primary"></i> My Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item d-flex align-items-center py-2 small fw-medium" to="/profile">
                        <i className="bi bi-key me-2 text-warning"></i> Change Password
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center py-2 small fw-medium text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Drawer actions */}
          <div className="d-flex d-lg-none align-items-center gap-2 ms-auto">
            <button
              type="button"
              className="btn btn-light border-0 shadow-sm"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            <div className="dropdown">
              <button className="btn btn-link text-decoration-none text-dark d-flex align-items-center p-0 border-0" type="button" data-bs-toggle="dropdown">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '35px', height: '35px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {user.username.charAt(0)}
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                <li className="px-3 py-2 border-bottom mb-2">
                  <div className="fw-bold small">{user.name || user.username}</div>
                  <div className="text-primary smaller" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{user.role_name || user.role}</div>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center py-2 small fw-medium" to="/profile">
                    <i className="bi bi-person-circle me-2 text-primary"></i> My Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center py-2 small fw-medium" to="/profile">
                    <i className="bi bi-key me-2 text-warning"></i> Change Password
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2 small fw-medium text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer menu */}
      {sidebarOpen && <div className="layout-backdrop d-lg-none" onClick={() => setSidebarOpen(false)} />}
      <aside className={`layout-drawer d-lg-none ${sidebarOpen ? 'open' : ''}`}>
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <Link className="text-primary d-flex align-items-center fw-bold text-decoration-none" to="/" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-stack me-2"></i>
            GREHASOFT
          </Link>
          <button type="button" className="btn btn-light border-0" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <nav className="p-2">
          <ul className="list-unstyled mb-2">
            {flatMobileItems.map((item) => (
              <li key={item.path}>
                <Link
                  className={`d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${item.active ? 'text-primary fw-bold bg-primary-subtle' : 'text-secondary'}`}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`bi ${item.icon}`}></i>
                  {item.label}
                </Link>
              </li>
            ))}

            {navItems.filter(item => item.isActionButton).map(item => (
              <li key={item.id}>
                <Link
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none text-white bg-success mt-2 fw-semibold"
                  to={item.route || "#"}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`bi ${item.icon}`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {showAdminMenu && (
            <>
              <div className="px-3 pt-2 pb-1 small text-secondary fw-bold text-uppercase">Admin</div>
              <ul className="list-unstyled mb-0">
                {adminItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        className={`d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${active ? 'text-primary fw-bold bg-primary-subtle' : 'text-secondary'}`}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <i className={`bi ${item.icon}`}></i>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>
      </aside>

      <main className="app-main-content">
        <div className="container-fluid py-4 px-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default BaseLayout;
