
import React, { useState, useMemo } from 'react';
import { TaskType } from '../../../types';

interface TaskTypesPageProps {
  taskTypes: TaskType[];
  crud: any;
}

const TaskTypesPage: React.FC<TaskTypesPageProps> = ({ taskTypes, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TaskType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTypes = useMemo(() => {
    return taskTypes.filter(tt => 
      tt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (tt.description && tt.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [taskTypes, searchTerm]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = { 
      name: (formData.get('name') as string).toUpperCase(), 
      description: formData.get('description') as string 
    };
    
    if (editingType) {
      crud.update(editingType.id, data);
    } else {
      crud.add(data);
    }
    setModalOpen(false);
    setEditingType(null);
  };

  const openEdit = (tt: TaskType) => {
    setEditingType(tt);
    setModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
          <div>
            <h4 className="fw-bold mb-1 text-dark">Task Classifications</h4>
            <p className="text-secondary small mb-0">Define and manage categorical work types for project workflows</p>
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={() => { setEditingType(null); setModalOpen(true); }}>
            <i className="bi bi-tag-fill me-2"></i>Register Task Type
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
                  placeholder="Filter by name or description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-8 text-end">
              <span className="text-secondary smaller fw-bold uppercase">System Types: {taskTypes.length}</span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-professional align-middle mb-0">
            <thead>
              <tr>
                <th className="px-4">Identifier</th>
                <th>Functional Description</th>
                <th>Created At</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="text-muted opacity-50">
                      <i className="bi bi-tags fs-1 d-block mb-3"></i>
                      No task types match your current selection.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTypes.map(tt => (
                  <tr key={tt.id} className="hover-bg-light transition">
                    <td className="px-4">
                      <span className="badge bg-light text-dark border px-3 py-2 font-monospace tracking-wide">
                        {tt.name}
                      </span>
                    </td>
                    <td>
                      <p className="small text-secondary mb-0 text-truncate" style={{ maxWidth: '400px' }} title={tt.description}>
                        {tt.description || 'No detailed description provided for this classification.'}
                      </p>
                    </td>
                    <td className="small text-muted">{tt.createdAt || 'N/A'}</td>
                    <td className="text-end px-4">
                      <div className="btn-group shadow-sm rounded-3 overflow-hidden border">
                        <button className="btn btn-sm btn-white border-end" onClick={() => openEdit(tt)} title="Configure Type">
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button className="btn btn-sm btn-white" onClick={() => { if(confirm(`Revoke classification type: ${tt.name}?`)) crud.delete(tt.id); }} title="Remove Type">
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
                    {editingType ? <><i className="bi bi-gear-fill me-2"></i>Modify Classification</> : <><i className="bi bi-plus-circle-fill me-2"></i>New Classification</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-4">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Classification Name *</label>
                    <input 
                      name="name" 
                      type="text" 
                      className="form-control form-control-lg border-light bg-light font-monospace" 
                      defaultValue={editingType?.name} 
                      placeholder="e.g. DEV, SEO, DESIGN" 
                      style={{ textTransform: 'uppercase' }}
                      required 
                    />
                    <div className="form-text smaller text-muted">Use concise unique identifiers for reporting purposes.</div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label smaller fw-bold text-secondary uppercase tracking-wider">Description</label>
                    <textarea 
                      name="description" 
                      className="form-control border-light bg-light" 
                      rows={4} 
                      defaultValue={editingType?.description} 
                      placeholder="Explain the scope of tasks that fall under this classification..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2 border" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-dark fw-bold px-4 py-2 shadow-sm">
                    {editingType ? 'Update Classification' : 'Register Type'}
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

export default TaskTypesPage;
