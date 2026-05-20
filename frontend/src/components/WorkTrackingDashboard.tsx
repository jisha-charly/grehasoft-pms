import React, { useEffect, useState, useCallback, useMemo } from 'react';
import TrackingAPI, { EmployeeStatus } from '../api/trackingAPI';

interface DashboardState {
  employees: EmployeeStatus[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

const WorkTrackingDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    employees: [],
    loading: true,
    error: null,
    refreshing: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Idle' | 'Offline'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'work_time'>('name');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const api = useMemo(() => new TrackingAPI(), []);

  // Fetch employee status
  const fetchEmployees = useCallback(async () => {
    setState((prev) => ({ ...prev, refreshing: true }));
    try {
      const data = await api.getEmployeeStatus();
      const employees = Array.isArray(data) ? data : [data];
      setState((prev) => ({ ...prev, employees, error: null, refreshing: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        refreshing: false,
      }));
    }
  }, [api]);

  // Initial fetch
  useEffect(() => {
    fetchEmployees().then(() => setState((prev) => ({ ...prev, loading: false })));
  }, [fetchEmployees]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchEmployees();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchEmployees]);

  // Toggle tracking for employee
  const handleToggleTracking = async (userId: number, currentEnabled: boolean) => {
    try {
      setState((prev) => ({
        ...prev,
        employees: prev.employees.map(emp => 
          emp.user_id === userId ? { ...emp, is_tracking_enabled: !currentEnabled } : emp
        )
      }));
      await api.toggleTracking(userId, !currentEnabled);
    } catch (error) {
      console.error('Failed to toggle tracking:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to toggle tracking',
      }));
      fetchEmployees();
    }
  };

  // Filter and sort employees
  const processedEmployees = useMemo(() => {
    return state.employees
      .filter((emp) => {
        const empName = emp.full_name || `${emp.first_name} ${emp.last_name}`.trim() || emp.email;
        const matchesSearch = empName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             emp.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'All' || emp.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name': {
            const nameA = a.full_name || `${a.first_name} ${a.last_name}`.trim() || a.email;
            const nameB = b.full_name || `${b.first_name} ${b.last_name}`.trim() || b.email;
            return nameA.localeCompare(nameB);
          }
          case 'status': {
            const statusOrder = { Active: 0, Idle: 1, Offline: 2 };
            return (statusOrder[a.status as keyof typeof statusOrder] ?? 3) -
                   (statusOrder[b.status as keyof typeof statusOrder] ?? 3);
          }
          case 'work_time':
            return (b.total_work_time || '').localeCompare(a.total_work_time || '');
          default:
            return 0;
        }
      });
  }, [state.employees, searchQuery, filterStatus, sortBy]);

  const getInitials = (fullName: string | undefined, email: string) => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: number) => {
    const colors = [
      '#4f46e5', // indigo
      '#10b981', // emerald
      '#f59e0b', // amber
      '#3b82f6', // blue
      '#ec4899', // pink
      '#8b5cf6', // violet
      '#06b6d4'  // cyan
    ];
    return colors[userId % colors.length];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="badge bg-success-subtle text-success">Active</span>;
      case 'Idle':
        return <span className="badge bg-warning-subtle text-warning">Idle</span>;
      case 'Offline':
        return <span className="badge bg-secondary-subtle text-secondary">Offline</span>;
      default:
        return <span className="badge bg-light text-dark">{status}</span>;
    }
  };

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="tasks-container p-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Employee Work Tracking</h2>
          <p className="text-secondary small mb-0">
            Browse employee activities and manage tracking
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoRefreshSwitch"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label className="form-check-label small" htmlFor="autoRefreshSwitch" style={{ cursor: 'pointer' }}>
              Auto-refresh
            </label>
          </div>
          <button
            className="btn btn-primary btn-sm ms-2"
            onClick={fetchEmployees}
            disabled={state.refreshing}
          >
            <i className={`bi bi-arrow-clockwise me-1`}></i>
            Sync
          </button>
        </div>
      </div>

      {state.error && (
        <div className="alert alert-danger py-2 px-3 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {state.error}
        </div>
      )}

      {/* FILTER CARD */}
      <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
        <div className="row g-3">
          <div className="col-lg-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="col-lg-3">
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="All">Any Status</option>
              <option value="Active">Active Only</option>
              <option value="Idle">Idle Only</option>
              <option value="Offline">Offline Only</option>
            </select>
          </div>

          <div className="col-lg-3">
            <select
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="work_time">Sort by Work Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>Login Info</th>
                <th>Last Seen</th>
                <th>Daily Work Time</th>
                <th className="text-center">Tracking Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    Loading dashboard...
                  </td>
                </tr>
              ) : processedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No employees found.
                  </td>
                </tr>
              ) : (
                processedEmployees.map(emp => (
                  <tr key={emp.user_id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold me-3 shadow-sm"
                          style={{ 
                            width: '38px', 
                            height: '38px', 
                            backgroundColor: getAvatarColor(emp.user_id),
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(emp.full_name, emp.email)}
                        </div>
                        <div>
                          <div className="fw-semibold text-dark mb-0" style={{ fontSize: '0.9rem' }}>
                            {emp.full_name || emp.email}
                          </div>
                          <div className="d-flex align-items-center gap-2 mt-1" style={{ fontSize: '0.75rem' }}>
                            <span className="badge bg-light text-secondary border px-2 py-0.5 rounded-pill fw-medium">
                              {emp.employee_code || `GS-26-${String(emp.user_id).padStart(3, '0')}`}
                            </span>
                            {emp.full_name && (
                              <span className="text-muted">{emp.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getStatusBadge(emp.status)}</td>
                    <td>
                      {emp.first_login_time ? (
                        <>
                          <div className="small">{formatDate(emp.first_login_time)}</div>
                          <div className="small text-muted">{formatTime(emp.first_login_time)}</div>
                        </>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      {emp.last_ping ? (
                        <>
                          <div className="small">{formatDate(emp.last_ping)}</div>
                          <div className="small text-muted">{formatTime(emp.last_ping)}</div>
                        </>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      <div className="fw-medium">{emp.total_work_time || '00:00:00'}</div>
                    </td>
                    <td className="text-center">
                      <div className="form-check form-switch d-flex justify-content-center mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={emp.is_tracking_enabled}
                          onChange={() => handleToggleTracking(emp.user_id, emp.is_tracking_enabled)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                        {emp.is_tracking_enabled ? 'TRACKING ON' : 'PAUSED'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default WorkTrackingDashboard;
