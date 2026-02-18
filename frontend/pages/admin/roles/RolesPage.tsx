
import React, { useState, useMemo } from 'react';
import { Role } from '../../../types';

interface RolesPageProps {
  roles: Role[];
  crud: any;
}

const RolesPage: React.FC<RolesPageProps> = ({ roles, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: (formData.get('name') as string).toUpperCase().replace(/\s+/g, '_'),
      description: formData.get('description') as string
    };
    
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

  const getRoleBadgeColor = (name: string) => {
    if (name === 'ADMIN') return 'bg-danger';
    if (name.includes('MANAGER')) return 'bg-primary';
    if (name === 'CLIENT') return 'bg-info';
    return 'bg-secondary';
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
          <div>
            <h4 className="fw-bold mb-1 text-dark">Access Roles</h4>
            <p className="text-secondary small mb-0">Manage system permissions and functional authorization levels</p>
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={() => { setEditingRole(null); setModalOpen(true); }}>
            <i className="bi bi-shield-lock-fill me-2"></i>Define New Role
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
                  placeholder="Filter roles..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-8 text-end">
              <span className="text-secondary smaller fw-bold uppercase">Active Entities: {roles.length}</span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-professional align-middle mb-0">
            <thead>
              <tr>
                <th className="px-4">Internal Name</th>
                <th>Description</th>
                <th>Created At</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="text-muted opacity-50">
                      <i className="bi bi-shield-slash fs-1 d-block mb-3"></i>
                      No roles match your search criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoles.map(role => (
                  <tr key={role.id} className="hover-bg-light transition">
                    <td className="px-4">
                      <div className="d-flex align-items-center">
                        <span className={`badge ${getRoleBadgeColor(role.name)} me-2`} style={{ width: '8px', height: '8px', padding: 0, borderRadius: '50%' }}></span>
                        <span className="fw-bold text-dark font-monospace" style={{ letterSpacing: '0.025em' }}>{role.name}</span>
                      </div>
                    </td>
                    <td><p className="small text-secondary mb-0 text-truncate" style={{ maxWidth: '350px' }}>{role.description}</p></td>
                    <td className="small text-muted">{role.createdAt || 'N/A'}</td>
                    <td className="text-end px-4">
                      <div className="btn-group shadow-sm rounded-3 overflow-hidden border">
                        <button className="btn btn-sm btn-white border-end" onClick={() => openEdit(role)} title="Modify Permissions">
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button className="btn btn-sm btn-white" onClick={() => { if(confirm(`Confirm deletion of role: ${role.name}?`)) crud.delete(role.id); }} title="Revoke Role">
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
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingRole ? <><i className="bi bi-gear-wide-connected me-2"></i>Update Role Schema</> : <><i className="bi bi-shield-plus me-2"></i>Provision New Role</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Internal Identifier *</label>
                    <input 
                      name="name" 
                      type="text" 
                      className="form-control form-control-lg border-light bg-light font-monospace" 
                      defaultValue={editingRole?.name} 
                      placeholder="e.g. PROJECT_MANAGER" 
                      style={{ textTransform: 'uppercase' }}
                      required 
                    />
                    <div className="form-text smaller text-muted">Use uppercase and underscores for system compatibility.</div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Functional Description</label>
                    <textarea 
                      name="description" 
                      className="form-control border-light bg-light" 
                      rows={4} 
                      defaultValue={editingRole?.description} 
                      placeholder="Specify the scope of access and responsibilities..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2 border" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-dark fw-bold px-4 py-2 shadow-sm">
                    {editingRole ? 'Save Changes' : 'Confirm Role Definition'}
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

export default RolesPage;
