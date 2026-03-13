import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Permission, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth(); // ❌ removed hasRole
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  type NavChild = { label: string; path: string };
  type NavItem = {
    label: string;
    icon: string;
    roles: UserRole[];
    path?: string;
    children?: NavChild[];
  };

  const navigationConfig: NavItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: "bi-speedometer2",
      roles: [
        UserRole.SUPER_ADMIN,
        UserRole.PROJECT_MANAGER,
        UserRole.TEAM_MEMBER,
        UserRole.SALES_MANAGER,
      ],
    },
    {
      label: "Projects",
      path: "/projects",
      icon: "bi-briefcase",
      roles: [
        UserRole.SUPER_ADMIN,
        UserRole.PROJECT_MANAGER,
        UserRole.TEAM_MEMBER,
        UserRole.CLIENT,
      ],
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: "bi-check2-square",
      roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER],
    },
    {
      label: "Clients",
      path: "/clients",
      icon: "bi-people",
      roles: [
        UserRole.SUPER_ADMIN,
        UserRole.PROJECT_MANAGER,
        UserRole.SALES_MANAGER,
      ],
    },
    {
      label: "CRM",
      icon: "bi-graph-up-arrow",
      roles: [
        UserRole.SUPER_ADMIN,
        UserRole.SALES_MANAGER,
        UserRole.SALES_EXECUTIVE,
      ],
      children: [
        { label: "Leads", path: "/crm" },
        { label: "Proposals", path: "/proposals" },
      ],
    },
    {
      label: "Finance",
      icon: "bi-cash-stack",
      roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER],
      children: [{ label: "Invoices", path: "/invoices" }],
    },
    {
      label: "Operations",
      icon: "bi-gear",
      roles: [
        UserRole.SUPER_ADMIN,
        UserRole.SALES_MANAGER,
        UserRole.SALES_EXECUTIVE,
      ],
      children: [
        { label: "Reminders", path: "/reminders" },
        { label: "SEO", path: "/seo" },
      ],
    },
    {
      label: "HR Docs",
      path: "/hr-documents",
      icon: "bi-file-earmark-lock",
      roles: [UserRole.SUPER_ADMIN],
    },
    {
     label: "Infrastructure",
     icon: "bi-hdd-network",
      roles: [UserRole.SUPER_ADMIN],
     children: [
    { label: "Servers", path: "/admin/servers" },
    { label: "Domains", path: "/infrastructure/domains" },
    { label: "Credentials", path: "/infrastructure/credentials" }
  ]
  },
   ];

  const hasAccess = (roles: UserRole[]) => {
    return !!(user?.role && roles.includes(user.role as UserRole));
  };

  // Flat list for mobile drawer (keeps existing drawer JSX unchanged)
  const navItems = navigationConfig.flatMap((item) => {
    if (item.children && item.children.length) {
      return item.children.map((child) => ({
        label: child.label,
        path: child.path,
        icon: item.icon,
        roles: item.roles,
      }));
    }
    return item.path
      ? [
          {
            label: item.label,
            path: item.path,
            icon: item.icon,
            roles: item.roles,
          },
        ]
      : [];
  });

  const adminItems = [
  { label: 'Users', path: '/admin/users', icon: 'bi-people' },
  { label: 'Roles', path: '/admin/roles', icon: 'bi-person-badge' },
  { label: 'Departments', path: '/admin/departments', icon: 'bi-diagram-3' },
  { label: 'Task Types', path: '/admin/task-types', icon: 'bi-list-task' },
  { label: "Servers", path: "/admin/servers", icon: "bi-hdd-network" }
];

  const handleLogout = () => {
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

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-3 shadow-sm">
        <div className="container-fluid px-4">
          <Link className="navbar-brand text-primary d-flex align-items-center fw-bold" to="/">
            <i className="bi bi-stack me-2"></i>
            GREHASOFT <span className="badge bg-light text-dark ms-2 fw-normal fs-6 border">v2.0</span>
          </Link>

          {/* Desktop nav (>=992px) */}
          <div className="d-none d-lg-flex flex-grow-1 align-items-center">
            <ul className="navbar-nav me-auto mb-0 ms-lg-4">
              {navigationConfig
                .filter((item) => hasAccess(item.roles))
                .map((item) => {
                  const hasChildren = item.children && item.children.length > 0;

                  if (hasChildren) {
                    const isActiveGroup = item.children!.some(
                      (child) => location.pathname === child.path
                    );
                    return (
                      <li className="nav-item dropdown" key={item.label}>
                        <button
                          className={`nav-link dropdown-toggle px-3 d-flex align-items-center ${
                            isActiveGroup
                              ? "active text-primary fw-bold"
                              : "text-secondary"
                          }`}
                          type="button"
                          data-bs-toggle="dropdown"
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
                                  className={`dropdown-item py-2 small fw-medium d-flex align-items-center ${
                                    active ? "active fw-bold" : ""
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
                      <li className="nav-item" key={item.path}>
                        <Link
                          className={`nav-link px-3 d-flex align-items-center ${
                            active
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

            <div className="d-flex align-items-center">
              {user.role === UserRole.SUPER_ADMIN && (
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
                <button className="btn btn-link text-decoration-none text-dark d-flex align-items-center p-0 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <div className="text-end me-2 d-none d-sm-block">
                    <div className="fw-bold small text-dark">{user.name}</div>
                    <div className="text-primary smaller fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.02em' }}>{user.role.replace('_', ' ')}</div>
                  </div>
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '35px', height: '35px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {user.username.charAt(0)}
                  </div>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                  <li className="px-3 py-2 d-sm-none border-bottom mb-2">
                    <div className="fw-bold small">{user.name}</div>
                    <div className="text-primary smaller" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{user.role.replace('_', ' ')}</div>
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
              <button className="btn btn-link text-decoration-none text-dark d-flex align-items-center p-0 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '35px', height: '35px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {user.username.charAt(0)}
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                <li className="px-3 py-2 border-bottom mb-2">
                  <div className="fw-bold small">{user.name}</div>
                  <div className="text-primary smaller" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{user.role.replace('_', ' ')}</div>
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
              .filter((item) => user?.role && item.roles.includes(user.role as UserRole))
              .map((item) => {
                const active = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      className={`d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
                        active ? 'text-primary fw-bold bg-primary-subtle' : 'text-secondary'
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

          {user.role === UserRole.SUPER_ADMIN && (
            <>
              <div className="px-3 pt-2 pb-1 small text-secondary fw-bold text-uppercase">Admin</div>
              <ul className="list-unstyled mb-0">
                {adminItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        className={`d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
                          active ? 'text-primary fw-bold bg-primary-subtle' : 'text-secondary'
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

      <div className="container-fluid py-4 px-4">
        {children}
      </div>
    </>
  );
};

export default Layout;
