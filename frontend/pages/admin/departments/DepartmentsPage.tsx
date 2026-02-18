
import React, { useState } from 'react';
import { Department } from '../../../types';

interface DepartmentsPageProps {
  departments: Department[];
  crud: any;
}

const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ departments, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (editingDept) {
      crud.update(editingDept.id, data);
    } else {
      crud.add(data);
    }
    setModalOpen(false);
    setEditingDept(null);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">Departments</h4>
          <p className="text-secondary small mb-0">Corporate divisions and functional units</p>
        </div>
        <button className="btn btn-dark btn-sm fw-bold px-3" onClick={() => { setEditingDept(null); setModalOpen(true); }}>
          <i className="bi bi-diagram-3 me-2"></i>Add Department
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-professional align-middle mb-0">
          <thead>
            <tr>
              <th className="px-4">ID</th>
              <th>Department Name</th>
              <th>Description</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => (
              <tr key={dept.id}>
                <td className="px-4 text-secondary small">#{dept.id}</td>
                <td><span className="fw-bold text-dark">{dept.name}</span></td>
                <td className="small text-muted">{dept.description || 'No description'}</td>
                <td className="text-end px-4">
                  <div className="btn-group">
                    <button className="btn btn-sm btn-light" onClick={() => openEdit(dept)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(dept.id)}><i className="bi bi-trash"></i></button>
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
                  <h5 className="modal-title fw-bold">{editingDept ? 'Edit Department' : 'New Department'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Department Name</label>
                    <input name="name" type="text" className="form-control" defaultValue={editingDept?.name} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Description</label>
                    <textarea name="description" className="form-control" rows={3} defaultValue={editingDept?.description}></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold">Save Department</button>
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
