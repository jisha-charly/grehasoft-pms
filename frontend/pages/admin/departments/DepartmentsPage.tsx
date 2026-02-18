
import React, { useState, useMemo } from 'react';
import { Department } from '../../../types';

interface DepartmentsPageProps {
  departments: Department[];
  crud: any;
}

const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ departments, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parentIdStr = formData.get('parentId') as string;
    
    const data = {
      name: formData.get('name') as string,
      parentId: parentIdStr ? Number(parentIdStr) : null
    };
    
    if (editingDept) {
      crud.update(editingDept.id, data);
    } else {
      crud.add(data);
    }
    setModalOpen(false);
    setEditingDept(null);
  };

  const getParentName = (parentId?: number) => {
    if (!parentId) return null;
    return departments.find(d => d.id === parentId)?.name;
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
          <div>
            <h4 className="fw-bold mb-1 text-dark">Organizational Units</h4>
            <p className="text-secondary small mb-0">Define corporate departments and functional sub-units</p>
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={() => { setEditingDept(null); setModalOpen(true); }}>
            <i className="bi bi-diagram-3-fill me-2"></i>Create Department
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
                  placeholder="Filter by name..." 
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
                <th className="px-4">Department Name</th>
                <th>Relationship</th>
                <th>Created At</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="text-muted opacity-50">
                      <i className="bi bi-diagram-2 fs-1 d-block mb-3"></i>
                      No departments match your search.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDepartments.map(dept => {
                  const parentName = getParentName(dept.parentId);
                  return (
                    <tr key={dept.id} className="hover-bg-light transition">
                      <td className="px-4">
                        <div className="d-flex align-items-center">
                          {dept.parentId && <i className="bi bi-arrow-return-right text-muted me-2 smaller"></i>}
                          <span className={`fw-bold ${dept.parentId ? 'text-secondary small' : 'text-dark'}`}>{dept.name}</span>
                        </div>
                      </td>
                      <td>
                        {parentName ? (
                          <span className="badge bg-light text-primary border fw-normal py-1 px-2">
                            <i className="bi bi-layers me-1"></i>Sub of {parentName}
                          </span>
                        ) : (
                          <span className="badge bg-primary-subtle text-primary border-0 fw-bold py-1 px-2 uppercase smaller">
                            Primary Unit
                          </span>
                        )}
                      </td>
                      <td className="small text-muted">{dept.createdAt || 'N/A'}</td>
                      <td className="text-end px-4">
                        <div className="btn-group shadow-sm rounded-3 overflow-hidden border">
                          <button className="btn btn-sm btn-white border-end" onClick={() => openEdit(dept)} title="Modify Configuration">
                            <i className="bi bi-pencil-square text-primary"></i>
                          </button>
                          <button className="btn btn-sm btn-white" onClick={() => { if(confirm(`Confirm deletion of ${dept.name}?`)) crud.delete(dept.id); }} title="Remove Unit">
                            <i className="bi bi-trash3 text-danger"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                    {editingDept ? <><i className="bi bi-gear-wide me-2"></i>Edit Department</> : <><i className="bi bi-plus-circle me-2"></i>New Department</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-4">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Unit Name *</label>
                    <input 
                      name="name" 
                      type="text" 
                      className="form-control form-control-lg border-light bg-light" 
                      defaultValue={editingDept?.name} 
                      placeholder="e.g. Design Services" 
                      required 
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Parent Division</label>
                    <select 
                      name="parentId" 
                      className="form-select form-select-lg border-light bg-light" 
                      defaultValue={editingDept?.parentId || ''}
                    >
                      <option value="">None (Primary Department)</option>
                      {departments
                        .filter(d => d.id !== editingDept?.id) // Prevent self-parenting
                        .map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))
                      }
                    </select>
                    <div className="form-text smaller text-muted">Nested departments help organize sub-services and specialized teams.</div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2 border" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-dark fw-bold px-4 py-2 shadow-sm">
                    {editingDept ? 'Update Details' : 'Confirm Definition'}
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

export default DepartmentsPage;
