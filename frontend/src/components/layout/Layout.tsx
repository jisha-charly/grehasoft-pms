import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth(); // ❌ removed hasRole
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'bi-speedometer2', roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.SALES_MANAGER] },
    { label: 'Projects', path: '/projects', icon: 'bi-briefcase', roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.CLIENT] },
    { label: 'Tasks', path: '/tasks', icon: 'bi-check2-square', roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER] },
    { label: 'Clients', path: '/clients', icon: 'bi-people', roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.SALES_MANAGER] },
    { label: 'CRM', path: '/crm', icon: 'bi-graph-up-arrow', roles: [UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE] },
    { label: 'SEO', path: '/seo', icon: 'bi-search', roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER] },
    { label: 'Invoices', path: '/invoices', icon: 'bi-receipt', roles: [UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER] },
  ];

  const adminItems = [
  { label: 'Users', path: '/admin/users', icon: 'bi-people' },
  { label: 'Roles', path: '/admin/roles', icon: 'bi-person-badge' },
  { label: 'Departments', path: '/admin/departments', icon: 'bi-diagram-3' },
  { label: 'Task Types', path: '/admin/task-types', icon: 'bi-list-task' },
];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              {navItems
               .filter(item => user?.role && item.roles.includes(user.role as UserRole))
                .map((item) => (
                  <li className="nav-item" key={item.path}>
                    <Link
                      className={`nav-link px-3 d-flex align-items-center ${
                        location.pathname === item.path
                          ? 'active text-primary fw-bold'
                          : 'text-secondary'
                      }`}
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
        </div>
      </nav>

      <div className="container-fluid py-4 px-4">
        {children}
      </div>
    </>
  );
};

export default Layout;
