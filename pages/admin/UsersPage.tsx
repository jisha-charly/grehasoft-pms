
import React, { useState } from 'react';
import { User, UserRole, Department } from '../../types';

interface UsersPageProps {
  users: User[];
  departments: Department[];
  crud: any;
}

const UsersPage: React.FC<UsersPageProps> = ({ users, departments, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    crud.add({
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      departmentId: Number(data.department)
    });
    setModalOpen(false);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">System Users</h4>
          <p className="text-secondary small mb-0">Manage roles and platform access</p>
        </div>
        <button className="btn btn-dark btn-sm" onClick={() => setModalOpen(true)}>
          <i className="bi bi-person-gear me-2"></i>Add User
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-professional align-middle mb-0">
          <thead>
            <tr>
              <th className="px-4">User</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4">
                  <div className="d-flex align-items-center">
                    <img src={`https://i.pravatar.cc/32?u=${user.id}`} className="rounded-circle me-3" alt="avatar" />
                    <span className="fw-bold">{user.name}</span>
                  </div>
                </td>
                <td className="small">{user.email}</td>
                <td><span className="badge bg-light text-dark border">{departments.find(d => d.id === user.departmentId)?.name}</span></td>
                <td><span className="text-primary fw-bold smaller uppercase tracking-tighter">{user.role.replace('_', ' ')}</span></td>
                <td><span className="badge bg-success-subtle text-success">{user.status}</span></td>
                <td className="text-end px-4">
                  <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(user.id)}>
                    <i className="bi bi-person-x"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Provision New User</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Full Name</label>
                    <input name="name" type="text" className="form-control" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Corporate Email</label>
                    <input name="email" type="email" className="form-control" required />
                  </div>
                  <div className="row">
                    <div className="col mb-3">
                      <label className="form-label small fw-bold">Role</label>
                      <select name="role" className="form-select">
                        {Object.values(UserRole).map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="col mb-3">
                      <label className="form-label small fw-bold">Department</label>
                      <select name="department" className="form-select">
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark btn-sm px-4">Create Account</button>
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
