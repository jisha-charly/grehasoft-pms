
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole, Permission, Task } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  tasks?: Task[];
}

const Layout: React.FC<LayoutProps> = ({ children, tasks = [] }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'bi-speedometer2', permission: Permission.VIEW_DASHBOARD },
    { label: 'Projects', path: '/projects', icon: 'bi-briefcase', permission: Permission.VIEW_PROJECTS },
    { label: 'Tasks', path: '/tasks', icon: 'bi-check2-square', permission: Permission.VIEW_TASKS },
    { label: 'Clients', path: '/clients', icon: 'bi-people', permission: Permission.VIEW_CLIENTS },
    { label: 'CRM', path: '/crm', icon: 'bi-graph-up-arrow', permission: Permission.VIEW_LEADS },
    { label: 'SEO', path: '/seo', icon: 'bi-search', permission: Permission.VIEW_TASKS },
  ];

  const adminItems = [
    { label: 'Users', path: '/admin/users', permission: Permission.MANAGE_USERS },
    { label: 'Roles', path: '/admin/roles', permission: Permission.MANAGE_SETTINGS },
    { label: 'Departments', path: '/admin/departments', permission: Permission.MANAGE_SETTINGS },
    { label: 'Task Types', path: '/admin/task-types', permission: Permission.MANAGE_SETTINGS },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleAdminItems = adminItems.filter(item => hasPermission(item.permission));

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-3 shadow-sm">
        <div className="container-fluid px-4">
          <Link className="navbar-brand text-primary d-flex align-items-center fw-bold" to="/">
            <i className="bi bi-stack me-2"></i>
            GREHASOFT <span className="badge bg-light text-dark ms-2 fw-normal fs-6 border">v2.0</span>
          </Link>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
              {navItems.filter(item => hasPermission(item.permission)).map((item) => (
                <li className="nav-item" key={item.path}>
                  <Link
                    className={`nav-link px-3 d-flex align-items-center ${location.pathname === item.path ? 'active text-primary fw-bold' : 'text-secondary'}`}
                    to={item.path}
                  >
                    <i className={`bi ${item.icon} me-2`}></i>
                    {item.label}
                    {item.label === 'Tasks' && tasks.length > 0 && (
                      <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.6rem' }}>
                        {tasks.length}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center">
              {visibleAdminItems.length > 0 && (
                <div className="dropdown me-3">
                  <button className="btn btn-light dropdown-toggle btn-sm fw-bold border-0" type="button" data-bs-toggle="dropdown">Admin</button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                    {visibleAdminItems.map(item => (
                      <li key={item.path}><Link className="dropdown-item py-2 small fw-medium" to={item.path}>{item.label}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-end me-3">
                <div className="fw-bold small text-dark">{user.name}</div>
                <div className="text-primary smaller fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.02em' }}>{user.role.replace('_', ' ')}</div>
              </div>
              <button className="btn btn-outline-danger btn-sm rounded-circle shadow-sm" onClick={handleLogout} title="Logout">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="container-fluid py-4 px-4">{children}</div>
    </>
  );
};

export default Layout;
