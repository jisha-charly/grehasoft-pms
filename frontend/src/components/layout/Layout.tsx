import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Permission, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import TrackingAPI from '../../api/trackingAPI';
import './Layout.css';
import { useNotifications } from "../../context/NotificationContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth(); // ✅ Using dynamic RBAC
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  type NavChild = { label: string; path: string; permission?: Permission };
  type NavItem = {
    label: string;
    icon: string;
    permission: Permission;
    path?: string;
    children?: NavChild[];
  };

  const navigationConfig: NavItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: "bi-speedometer2",
      permission: Permission.VIEW_DASHBOARD,
    },
    {
      label: "Projects",
      path: "/projects",
      icon: "bi-briefcase",
      permission: Permission.VIEW_PROJECTS,
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: "bi-check2-square",
      permission: Permission.VIEW_TASKS,
    },
    {
      label: "Clients",
      path: "/clients",
      icon: "bi-people",
      permission: Permission.VIEW_CLIENTS,
    },
    {
      label: "CRM",
      icon: "bi-graph-up-arrow",
      permission: Permission.VIEW_LEADS,
      children: [
        { label: "Leads", path: "/crm", permission: Permission.VIEW_LEADS },
        { label: "Proposals", path: "/proposals", permission: Permission.VIEW_PROPOSALS },
      ],
    },
    {
      label: "Finance",
      icon: "bi-cash-stack",
      permission: Permission.VIEW_LEADS,
      children: [{ label: "Invoices", path: "/invoices", permission: Permission.VIEW_LEADS }],
    },
    {
      label: "Operations",
      icon: "bi-gear",
      permission: Permission.VIEW_REMINDERS,
      children: [
        { label: "Reminders", path: "/reminders", permission: Permission.VIEW_REMINDERS },
        { label: "SEO", path: "/seo", permission: Permission.VIEW_TASKS },
        { label: "SEO Websites", path: "/seo/websites", permission: Permission.VIEW_TASKS }
      ],
    },
    {
      label: "HR Docs",
      path: "/hr-documents",
      icon: "bi-file-earmark-lock",
      permission: Permission.GENERATE_HR_DOCS,
    },
    {
      label: "Infrastructure",
      icon: "bi-hdd-network",
      permission: Permission.MANAGE_INFRASTRUCTURE,
      children: [
        { label: "Servers", path: "/admin/servers", permission: Permission.MANAGE_INFRASTRUCTURE },
        { label: "Domains", path: "/infrastructure/domains", permission: Permission.MANAGE_INFRASTRUCTURE },
        { label: "Credentials", path: "/infrastructure/credentials", permission: Permission.MANAGE_INFRASTRUCTURE }
      ]
    },
    {
      label: "Work Tracking",
      path: "/admin/tracking",
      icon: "bi-clock-history",
      permission: Permission.MANAGE_SETTINGS,
    },
    {
      label: "Work Reports",
      path: "/admin/reports",
      icon: "bi-graph-up",
      permission: Permission.MANAGE_SETTINGS,
    },
  ];

  const hasAccess = (permission?: Permission) => {
    return !!(permission && hasPermission(permission));
  };

  const accessibleNavConfig = navigationConfig.map(item => {
    if (item.children) {
      const accessibleChildren = item.children.filter(child =>
        hasAccess(child.permission || item.permission)
      );
      if (accessibleChildren.length > 0 || hasAccess(item.permission)) {
        return { ...item, children: accessibleChildren };
      }
      return null;
    }
    return hasAccess(item.permission) ? item : null;
  }).filter(Boolean) as NavItem[];

  // Flat list for mobile drawer (keeps existing drawer JSX unchanged)
  const navItems = accessibleNavConfig.flatMap((item) => {
    if (item.children && item.children.length) {
      return item.children.map((child) => ({
        label: child.label,
        path: child.path,
        icon: item.icon,
        permission: child.permission || item.permission,
      }));
    }
    return item.path
      ? [
        {
          label: item.label,
          path: item.path,
          icon: item.icon,
          permission: item.permission,
        },
      ]
      : [];
  });

  const adminItems = [
    { label: 'Users', path: '/admin/users', icon: 'bi-people' },
    { label: 'Roles', path: '/admin/roles', icon: 'bi-person-badge' },
    { label: 'Departments', path: '/admin/departments', icon: 'bi-diagram-3' },
    { label: 'Task Types', path: '/admin/task-types', icon: 'bi-list-task' },

  ];

  const handleLogout = async () => {
    // 🔥 clean overlays before leaving
    document.querySelectorAll(".modal-backdrop, .layout-backdrop")
      .forEach(el => el.remove());

    document.body.classList.remove("modal-open");

    // Call tracking logout endpoint to mark user Offline immediately
    try {
      const trackingAPI = new TrackingAPI();
      await trackingAPI.logout();
    } catch (e) {
      console.warn("Tracking logout failed:", e);
    }

    logout();
    navigate('/login');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    if (sidebarOpen) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  // Simple browser heartbeat to keep the user's session active if they are browsing
  useEffect(() => {
    if (!user) return;

    const trackingAPI = new TrackingAPI();

    const sendPing = () => {
      trackingAPI.sendHeartbeat().catch((err) => {
        console.warn('Browser heartbeat failed:', err);
      });
    };

    // Send initial ping
    sendPing();

    // Set interval for every 30 seconds
    const interval = setInterval(sendPing, 30000);

    return () => clearInterval(interval);
  }, [user]);


  const { notifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClick = () => setShowDropdown(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);


  useEffect(() => {
    // close sidebar on route change
    setSidebarOpen(false);

    // 🔥 remove any leftover backdrop
    document
      .querySelectorAll(".layout-backdrop, .modal-backdrop")
      .forEach((el) => el.remove());
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      document
        .querySelectorAll(".layout-backdrop, .modal-backdrop")
        .forEach((el) => el.remove());
    };
  }, []);

  // Horizontal scroll state & logic
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1); // -1 for pixel rounding
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [accessibleNavConfig]);

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

  return (
    <div className="app-layout-wrapper">
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm app-navbar">
        <div className="container-fluid px-4">
          {/* nav-left */}
          <Link className="navbar-brand text-primary d-flex align-items-center fw-bold me-2 nav-left flex-shrink-0" to="/">
            <i className="bi bi-stack me-2"></i>
            GREHASOFT <span className="badge bg-light text-dark ms-2 fw-normal fs-6 border">v2.0</span>
          </Link>

          {/* Desktop nav (>=992px) */}
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

            {/* nav-center (scrollable) */}
            <div className={`nav-center nav-scroll-container flex-grow-1 mx-2 ${!canScrollLeft ? 'ms-lg-3' : ''}`} ref={scrollContainerRef}>
              <ul className="navbar-nav mb-0 flex-nowrap h-100 align-items-center px-1">
                {accessibleNavConfig
                  .map((item) => {
                    const hasChildren = item.children && item.children.length > 0;

                    if (hasChildren) {
                      const isActiveGroup = item.children!.some(
                        (child) => location.pathname === child.path
                      );
                      return (
                        <li className="nav-item dropdown h-100 d-flex align-items-center" key={item.label}>
                          <button
                            className={`nav-link dropdown-toggle px-3 d-flex align-items-center border-0 bg-transparent ${isActiveGroup
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
                              const active = location.pathname === child.path;
                              return (
                                <li key={child.path}>
                                  <Link
                                    className={`dropdown-item py-2 small fw-medium d-flex align-items-center ${active ? "active fw-bold" : ""
                                      }`}
                                    to={child.path}
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

                    if (item.path) {
                      const active = location.pathname === item.path;
                      return (
                        <li className="nav-item h-100 d-flex align-items-center" key={item.path}>
                          <Link
                            className={`nav-link px-3 d-flex align-items-center ${active
                              ? "active text-primary fw-bold"
                              : "text-secondary"
                              }`}
                            to={item.path}
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

            {/* nav-right */}
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
                    <span
                      className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger ${notifications.some(n => n.type === "domain") ? "blink-alert" : ""
                        }`}
                    >
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div
                    className="position-absolute end-0 mt-2 bg-white shadow rounded-3 p-3"
                    style={{ width: "300px", zIndex: 1000 }}
                  >
                    <h6 className="fw-bold mb-2">Notifications</h6>

                    {notifications.length === 0 ? (
                      <div className="text-muted small">No alerts</div>
                    ) : (
                      notifications.slice(0, 5).map((n, i) => (
                        <div
                          key={i}
                          className="border-bottom py-2 small cursor-pointer"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();

                            // ✅ Only store domain dismiss
                            if (n.type === "domain" || n.type === "expired") {
                              const dismissedDomains = JSON.parse(
                                localStorage.getItem("dismissedDomains") || "[]"
                              );

                              const domainName = n.message.split(": ")[1]; // extract grehasoft.com

                              if (!dismissedDomains.includes(domainName)) {
                                dismissedDomains.push(domainName);
                                localStorage.setItem(
                                  "dismissedDomains",
                                  JSON.stringify(dismissedDomains)
                                );
                              }
                            }

                            // navigation
                            if (n.type === "reminder") {
                              navigate("/reminders");
                            } else if (n.type === "domain" || n.type === "expired") {
                              navigate("/infrastructure/domains");
                            }

                            setShowDropdown(false);
                          }}
                        >
                          <div
                            className={`fw-semibold ${n.type === "expired"
                              ? "text-danger"
                              : n.type === "domain"
                                ? "text-warning"
                                : "text-primary"
                              }`}
                          >
                            {n.message}
                          </div>
                          <div className="text-muted small">{n.date}</div>
                        </div>
                      ))
                    )}

                    {/*  <div className="text-center mt-2">
  <button
    className="btn btn-sm btn-primary w-100"
    onClick={(e) => {
      e.stopPropagation(); // 🔥 IMPORTANT

      const hasDomain = notifications.some(n => n.type === "domain");

      if (hasDomain) {
        navigate("/infrastructure/domains"); // ✅ FIXED
      } else {
        navigate("/reminders");
      }

      setShowDropdown(false);
    }}
  >
    View All
  </button>
</div>*/}
                  </div>
                )}
              </div>
              <div className="d-flex align-items-center">
                {hasAccess(Permission.MANAGE_SETTINGS) && (
                  <div className="dropdown me-3">
                    <button
                      className="btn btn-light dropdown-toggle btn-sm fw-bold border-0"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
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
                  <button className="btn btn-link text-decoration-none text-dark d-flex align-items-center p-0 border-0" type="button" data-bs-toggle="dropdown"
                    aria-expanded="false">
                    {/*<div className="text-end me-2 d-none d-sm-block">
                    <div className="fw-bold small text-dark">{user.name}</div>
                    <div className="text-primary smaller fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.02em' }}>{user.role.replace('_', ' ')}</div>
                  </div>*/}
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '35px', height: '35px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {user.username.charAt(0)}
                    </div>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                    <li className="px-3 py-2 d-sm-none border-bottom mb-2">
                      <div className="fw-bold small">{user.name}</div>
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

          {/* Mobile/tablet actions (<992px) */}
          <div className="d-flex d-lg-none align-items-center gap-2 ms-auto">
            <button
              type="button"
              className="btn btn-light border-0 shadow-sm"
              aria-label="Toggle navigation menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            <div className="dropdown">
              <button className="btn btn-link text-decoration-none text-dark d-flex align-items-center p-0 border-0" type="button" data-bs-toggle="dropdown"
                aria-expanded="false">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '35px', height: '35px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {user.username.charAt(0)}
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                <li className="px-3 py-2 border-bottom mb-2">
                  <div className="fw-bold small">{user.name}</div>
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

      {/* Mobile/tablet drawer (<992px) */}
      {sidebarOpen && <div className="layout-backdrop d-lg-none" onClick={() => setSidebarOpen(false)} />}
      <aside
        className={`layout-drawer d-lg-none ${sidebarOpen ? 'open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <Link
            className="text-primary d-flex align-items-center fw-bold text-decoration-none"
            to="/"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-stack me-2"></i>
            GREHASOFT
          </Link>
          <button
            type="button"
            className="btn btn-light border-0"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <nav className="p-2">
          <ul className="list-unstyled mb-2">
            {navItems
              .map((item) => {
                const active = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      className={`d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${active ? 'text-primary fw-bold bg-primary-subtle' : 'text-secondary'
                        }`}
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

          {hasAccess(Permission.MANAGE_SETTINGS) && (
            <>
              <div className="px-3 pt-2 pb-1 small text-secondary fw-bold text-uppercase">Admin</div>
              <ul className="list-unstyled mb-0">
                {adminItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        className={`d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${active ? 'text-primary fw-bold bg-primary-subtle' : 'text-secondary'
                          }`}
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

export default Layout;
