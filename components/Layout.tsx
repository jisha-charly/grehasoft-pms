
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string; role: UserRole };
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
    { label: 'Reports', path: '/reports', icon: 'bi-file-earmark-bar-graph' },
  ];

  const adminItems = [
    { label: 'Users', path: '/admin/users' },
    { label: 'Roles', path: '/admin/roles' },
    { label: 'Departments', path: '/admin/departments' },
    { label: 'Task Types', path: '/admin/task-types' },
  ];

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-3">
        <div className="container-fluid px-4">
          <Link className="navbar-brand text-primary d-flex align-items-center" to="/">
            <i className="bi bi-stack me-2"></i>
            GREHASOFT <span className="badge bg-light text-dark ms-2 fw-normal fs-6 border">v2.0</span>
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
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
                  <button className="btn btn-light dropdown-toggle btn-sm" type="button" data-bs-toggle="dropdown">
                    Settings
                  </button>
                  <ul className="dropdown-menu">
                    {adminItems.map(item => (
                      <li key={item.path}><Link className="dropdown-item" to={item.path}>{item.label}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-end me-3 d-none d-sm-block">
                <div className="fw-bold small">{user.name}</div>
                <div className="text-primary smaller" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{user.role.replace('_', ' ')}</div>
              </div>
              
              <button className="btn btn-outline-danger btn-sm rounded-circle">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4 px-4">
        {children}
      </div>
    </>
  );
};

export default Layout;
