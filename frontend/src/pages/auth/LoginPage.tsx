
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "//dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username,  password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow-lg border-0" style={{ width: '400px', borderRadius: '1.5rem' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-stack fs-2"></i>
            </div>
            <h3 className="fw-bold text-dark">Welcome Back</h3>
            <p className="text-muted small">Sign in to access Grehasoft PMS</p>
          </div>

          {error && <div className="alert alert-danger py-2 small border-0">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary uppercase tracking-wider">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-person"></i></span>
                <input 
                  type="text" 
                  className="form-control form-control-lg bg-light border-0" 
                  placeholder="e.g. alex_admin" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary uppercase tracking-wider">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-key"></i></span>
                <input 
                  type="password" 
                  className="form-control form-control-lg bg-light border-0" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-secondary uppercase tracking-wider">Access Tier (Simulation)</label>
              <select 
                className="form-select bg-light border-0" 
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {Object.values(UserRole).map(r => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm py-3" style={{ borderRadius: '0.75rem' }}>
              Authenticate
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <a href="#" className="text-decoration-none small text-muted hover-primary transition">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
