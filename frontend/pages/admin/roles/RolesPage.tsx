
import React, { useState } from 'react';
import { Role } from '../../../types';

interface RolesPageProps {
  roles: Role[];
  crud: any;
}

const RolesPage: React.FC<RolesPageProps> = ({ roles, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (editingRole) {
      crud.update(editingRole.id, data);
    } else {
      crud.add(data);
    }
    setModalOpen(false);
    setEditingRole(null);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">System Roles</h4>
          <p className="text-secondary small mb-0">Define permissions and access levels</p>
        </div>
        <button className="btn btn-dark btn-sm fw-bold px-3" onClick={() => { setEditingRole(null); setModalOpen(true); }}>
          <i className="bi bi-shield-lock me-2"></i>Create Role
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-professional align-middle mb-0">
          <thead>
            <tr>
              <th className="px-4">Role Name</th>
              <th>Description</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td className="px-4"><span className="fw-bold text-primary">{role.name}</span></td>
                <td className="small text-secondary">{role.description}</td>
                <td className="text-end px-4">
                  <div className="btn-group">
                    <button className="btn btn-sm btn-light" onClick={() => openEdit(role)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(role.id)}><i className="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pt-4 px-4">
                  <h5 className="modal-title fw-bold">{editingRole ? 'Edit Role' : 'New Role'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Role Name</label>
                    <input name="name" type="text" className="form-control" defaultValue={editingRole?.name} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Description</label>
                    <textarea name="description" className="form-control" rows={3} defaultValue={editingRole?.description}></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold">Save Role</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;
