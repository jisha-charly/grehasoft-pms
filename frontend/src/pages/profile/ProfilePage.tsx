
import React, { useState, useEffect } from 'react';
import { User, ActivityLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
interface ProfilePageProps {
  activityLogs: ActivityLog[];
  onUpdatePassword: (newPassword: string, currentPassword: string) => Promise<void>;
  onUpdateProfile: (data: any) => Promise<void>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ activityLogs, onUpdatePassword, onUpdateProfile }) => {
  const { user, updateUser } = useAuth();
  
  // Profile details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
  const [errors, setErrors] = useState<{ 
    name?: string, 
    email?: string, 
    username?: string,
    currentPassword?: string,
    newPassword?: string,
    confirmPassword?: string
  }>({});

  // Activity Log state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'auth' | 'project' | 'task' | 'profile'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [visibleLogsCount, setVisibleLogsCount] = useState(10);
  const [logs, setLogs] = useState<any[]>([]);
  const fetchActivityLogs = async () => {
  try {
    const res = await axiosInstance.get("/activity-logs/");
    setLogs(res.data);
  } catch (error) {
    console.error("Error fetching logs:", error);
  }
};
  
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
    setEmail(user.email ?? "");
    setUsername(user.username ?? "");
    }
  }, [user]);

  if (!user) return null;

  const userActivity = activityLogs
    .filter(log => log.userId === user.id)
    .filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = 
        filterType === 'all' || 
        (filterType === 'auth' && (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('password'))) ||
        (filterType === 'project' && log.projectId > 0) ||
        (filterType === 'task' && log.taskId) ||
        (filterType === 'profile' && log.action.toLowerCase().includes('profile'));
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const displayedLogs = userActivity.slice(0, visibleLogsCount);

  const validateProfile = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    
    if (!username.trim()) newErrors.username = 'Username is required';
    else if (username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleProfileUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateProfile()) return;

  await onUpdateProfile({
    id: user.id,
    name,
    email,
    username
  });

  updateUser({
    name,
    email,
    username
  });

  setIsEditingProfile(false);
  setMessage({ type: "success", text: "Profile updated successfully" });

  setTimeout(() => setMessage(null), 3000);
};

  const validatePassword = () => {
    const newErrors: typeof errors = {};
    
    if (!currentPassword) newErrors.currentPassword = 'Current password is required';
    
    if (!newPassword) newErrors.newPassword = 'New password is required';
    else if (newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'New passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    
  await onUpdatePassword(newPassword, currentPassword);
    setMessage({ type: 'success', text: 'Password updated successfully' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col">
          <h2 className="fw-bold">User Profile</h2>
          <p className="text-muted">Manage your account settings and view activity</p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-4">
          {/* Profile Info */}
          <div className="card border-0 shadow-sm mb-4 overflow-hidden">
            <div className="card-body text-center py-5">
              <div className="mb-3 position-relative d-inline-block">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow" style={{ width: '100px', height: '100px', fontSize: '2.5rem', fontWeight: 'bold' }}>
                 {user.name?.split(" ").map(n => n[0]).join("").toUpperCase() ?? "U"}
                </div>
                <button className="btn btn-sm btn-light rounded-circle position-absolute bottom-0 end-0 shadow-sm border" title="Change Avatar">
                  <i className="bi bi-camera"></i>
                </button>
              </div>
              <h4 className="fw-bold mb-1">{user.name}</h4>
              <p className="text-muted mb-3">{user.email}</p>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-bold">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <div className="card-footer bg-white border-top-0 px-4 pb-4">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Status</span>
                <span className="badge bg-success-subtle text-success rounded-pill px-2">Active</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Username</span>
                <span className="fw-bold small">{user.username}</span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Change Password</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handlePasswordChange}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Current Password</label>
                  <input 
                    type="password" 
                    className={`form-control form-control-sm ${errors.currentPassword ? 'is-invalid' : ''}`}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  {errors.currentPassword && <div className="invalid-feedback small">{errors.currentPassword}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">New Password</label>
                  <input 
                    type="password" 
                    className={`form-control form-control-sm ${errors.newPassword ? 'is-invalid' : ''}`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  {errors.newPassword && <div className="invalid-feedback small">{errors.newPassword}</div>}
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold">Confirm New Password</label>
                  <input 
                    type="password" 
                    className={`form-control form-control-sm ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {errors.confirmPassword && <div className="invalid-feedback small">{errors.confirmPassword}</div>}
                </div>
                <button type="submit" className="btn btn-primary btn-sm w-100 fw-bold">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {/* Edit Profile Details */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Profile Details</h5>
              {!isEditingProfile && (
                <button className="btn btn-outline-primary btn-sm fw-bold" onClick={() => setIsEditingProfile(true)}>
                  <i className="bi bi-pencil me-1"></i> Edit Profile
                </button>
              )}
            </div>
            <div className="card-body p-4">
              {isEditingProfile ? (
                <form onSubmit={handleProfileUpdate}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Full Name</label>
                      <input 
                        type="text" 
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Username</label>
                      <input 
                        type="text" 
                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                      {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Email Address</label>
                      <input 
                        type="email" 
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                    <div className="col-12 mt-4 d-flex gap-2">
                      <button type="submit" className="btn btn-primary fw-bold px-4">Save Changes</button>
                      <button type="button" className="btn btn-light fw-bold px-4" onClick={() => {
                        setIsEditingProfile(false);
                          setName(user.name ?? "");
setEmail(user.email ?? "");
setUsername(user.username ?? "");
                        setErrors({});
                      }}>Cancel</button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Full Name</div>
                    <div className="fw-bold">{user.name}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Username</div>
                    <div className="fw-bold">{user.username}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Email Address</div>
                    <div className="fw-bold">{user.email}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">Department</div>
                    <div className="fw-bold">Software Development</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Activity Log</h5>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select form-select-sm border-0 bg-light fw-bold" 
                    style={{ width: 'auto' }}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
              
              <div className="row g-2 mb-2">
                <div className="col-md-7">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-0"><i className="bi bi-search"></i></span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0" 
                      placeholder="Search activity..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <select 
                    className="form-select form-select-sm bg-light border-0 fw-medium"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                  >
                    <option value="all">All Activity</option>
                    <option value="auth">Authentication</option>
                    <option value="project">Projects</option>
                    <option value="task">Tasks</option>
                    <option value="profile">Profile Updates</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3 border-0 small text-muted text-uppercase fw-bold">Action</th>
                      <th className="py-3 border-0 small text-muted text-uppercase fw-bold">Date & Time</th>
                      <th className="py-3 border-0 small text-muted text-uppercase fw-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLogs.length > 0 ? (
                      displayedLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className={`rounded-circle p-2 me-3 ${
                                log.action.toLowerCase().includes('password') ? 'bg-warning-subtle text-warning' : 
                                log.action.toLowerCase().includes('login') ? 'bg-info-subtle text-info' : 
                                log.action.toLowerCase().includes('profile') ? 'bg-success-subtle text-success' :
                                log.action.toLowerCase().includes('project') ? 'bg-primary-subtle text-primary' :
                                log.action.toLowerCase().includes('task') ? 'bg-purple-subtle text-purple' :
                                'bg-secondary-subtle text-secondary'
                              }`}>
                                <i className={`bi ${
                                  log.action.toLowerCase().includes('password') ? 'bi-key' : 
                                  log.action.toLowerCase().includes('login') ? 'bi-box-arrow-in-right' : 
                                  log.action.toLowerCase().includes('profile') ? 'bi-person-check' :
                                  log.action.toLowerCase().includes('project') ? 'bi-briefcase' :
                                  log.action.toLowerCase().includes('task') ? 'bi-check2-square' :
                                  'bi-lightning'
                                }`}></i>
                              </div>
                              <span className="fw-medium">{log.action}</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted small">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-3">
                            {log.projectId > 0 && <span className="badge bg-light text-dark border me-1">Project #{log.projectId}</span>}
                            {log.taskId && <span className="badge bg-light text-dark border">Task #{log.taskId}</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-muted">
                          <div className="mb-2"><i className="bi bi-search fs-2"></i></div>
                          No matching activity found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {userActivity.length > visibleLogsCount && (
              <div className="card-footer bg-white border-top p-3 text-center">
                <button 
                  className="btn btn-link btn-sm text-decoration-none fw-bold"
                  onClick={() => setVisibleLogsCount(prev => prev + 10)}
                >
                  Load More Activity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
