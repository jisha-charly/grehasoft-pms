
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole, User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'bi-speedometer2' },
    { label: 'Projects', path: '/projects', icon: 'bi-briefcase' },
    { label: 'Tasks', path: '/tasks', icon: 'bi-check2-square' },
    { label: 'Clients', path: '/clients', icon: 'bi-people' },
    { label: 'CRM', path: '/crm', icon: 'bi-graph-up-arrow' },
    { label: 'SEO', path: '/seo', icon: 'bi-search' },
  ];

  const adminItems = [
    { label: 'Users', path: '/admin/users' },
    { label: 'Roles', path: '/admin/roles' },
    { label: 'Departments', path: '/admin/departments' },
    { label: 'Task Types', path: '/admin/task-types' },
  ];

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
              {navItems.map((item) => (
                <li className="nav-item" key={item.path}>
                  <Link
                    className={`nav-link px-3 d-flex align-items-center ${location.pathname === item.path ? 'active text-primary' : 'text-secondary'}`}
                    to={item.path}
                  >
                    <i className={`bi ${item.icon} me-2`}></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center">
              {user.role === UserRole.SUPER_ADMIN && (
                <div className="dropdown me-3">
                  <button className="btn btn-light dropdown-toggle btn-sm fw-bold border-0" type="button" data-bs-toggle="dropdown">Admin</button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                    {adminItems.map(item => (
                      <li key={item.path}><Link className="dropdown-item py-2 small fw-medium" to={item.path}>{item.label}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-end me-3">
                <div className="fw-bold small text-dark">{user.name}</div>
                <div className="text-primary smaller fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.02em' }}>{user.role}</div>
              </div>
              <button className="btn btn-outline-danger btn-sm rounded-circle"><i className="bi bi-box-arrow-right"></i></button>
            </div>
          </div>
        </div>
      </nav>
      <div className="container-fluid py-4 px-4">{children}</div>
    </>
  );
};

export default Layout;
