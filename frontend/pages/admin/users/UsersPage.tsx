
import React, { useState, useMemo } from 'react';
import { User, Role, Department, UserRole } from '../../../types';

interface UsersPageProps {
  users: User[];
  roles: Role[];
  departments: Department[];
  crud: any;
}

const UsersPage: React.FC<UsersPageProps> = ({ users, roles, departments, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      username: fd.get('username') as string,
      email: fd.get('email') as string,
      role: fd.get('role') as UserRole, // @google/genai guidelines: Use the string-based role property
      departmentId: Number(fd.get('departmentId')),
      status: fd.get('status') as 'active' | 'inactive',
    };

    if (editingUser) {
      crud.update(editingUser.id, data);
    } else {
      crud.add(data);
    }
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
          <div>
            <h4 className="fw-bold mb-1 text-dark">User Management</h4>
            <p className="text-secondary small mb-0">Administer system users, roles, and department access</p>
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={() => { setEditingUser(null); setModalOpen(true); }}>
            <i className="bi bi-person-plus-fill me-2"></i>Provision Account
          </button>
        </div>
        
        <div className="px-4 pb-3">
          <div className="row align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-0 px-3"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-0 py-2" 
                  placeholder="Search by name, username or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-professional align-middle mb-0">
            <thead>
              <tr>
                <th className="px-4">Identity</th>
                <th>Username</th>
                <th>Corporate Email</th>
                <th>Department</th>
                <th>System Role</th>
                <th>Status</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-people fs-1 opacity-25 d-block mb-3"></i>
                      <h6 className="fw-bold">No users found</h6>
                      <p className="small mb-0">Refine your search or create a new user profile.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover-bg-light transition">
                    <td className="px-4">
                      <div className="d-flex align-items-center">
                        <img src={`https://i.pravatar.cc/38?u=${u.id}`} className="rounded-circle me-3 border shadow-sm" alt="" />
                        <span className="fw-bold text-dark">{u.name}</span>
                      </div>
                    </td>
                    <td><code className="text-primary smaller fw-bold">@{u.username}</code></td>
                    <td className="small text-secondary">{u.email}</td>
                    <td>
                      <span className="badge bg-light text-dark border fw-normal">
                        {departments.find(d => d.id === u.departmentId)?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className="text-primary fw-bold smaller tracking-wider text-uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <div className="btn-group shadow-sm rounded-3 overflow-hidden border">
                        <button className="btn btn-sm btn-white border-end" onClick={() => handleEdit(u)} title="Edit User">
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button className="btn btn-sm btn-white" onClick={() => { if(confirm('Permanently delete this user account?')) crud.delete(u.id); }} title="Delete User">
                          <i className="bi bi-trash3 text-danger"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingUser ? <><i className="bi bi-person-gear me-2"></i>Update User Account</> : <><i className="bi bi-person-plus me-2"></i>Provision New Account</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Full Legal Name *</label>
                      <input name="name" className="form-control form-control-lg border-light bg-light" defaultValue={editingUser?.name} placeholder="e.g. Alex Thompson" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">System Username *</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text border-light bg-light text-muted">@</span>
                        <input name="username" className="form-control border-light bg-light" defaultValue={editingUser?.username} placeholder="username" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Corporate Email *</label>
                      <input name="email" type="email" className="form-control form-control-lg border-light bg-light" defaultValue={editingUser?.email} placeholder="alex@grehasoft.com" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Security Password {editingUser && '(Optional)'}</label>
                      <input name="password" type="password" className="form-control form-control-lg border-light bg-light" placeholder="••••••••" required={!editingUser} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Access Role *</label>
                      <select name="role" className="form-select form-select-lg border-light bg-light" defaultValue={editingUser?.role} required>
                        <option value="">Assign a role...</option>
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Assigned Department *</label>
                      <select name="departmentId" className="form-select form-select-lg border-light bg-light" defaultValue={editingUser?.departmentId} required>
                        <option value="">Choose department...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Account Visibility & Status</label>
                      <select name="status" className="form-select form-select-lg border-light bg-light" defaultValue={editingUser?.status}>
                        <option value="active">Active - Full Platform Access</option>
                        <option value="inactive">Inactive - Account Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2 border" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-dark fw-bold px-4 py-2 shadow-sm">
                    {editingUser ? 'Save Account Changes' : 'Confirm Provisioning'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
