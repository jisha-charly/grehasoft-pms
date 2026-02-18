
import React, { useState } from 'react';
import { TaskType } from '../../types';

interface TaskTypesPageProps {
  taskTypes: TaskType[];
  crud: any;
}

const TaskTypesPage: React.FC<TaskTypesPageProps> = ({ taskTypes, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TaskType | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      name: data.name as string
    };

    if (editingType) {
      crud.update(editingType.id, payload);
    } else {
      crud.add(payload);
    }
    setModalOpen(false);
    setEditingType(null);
  };

  const openEdit = (tt: TaskType) => {
    setEditingType(tt);
    setModalOpen(true);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">Task Classifications</h4>
          <p className="text-secondary small mb-0">Define types of work across the organization</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditingType(null); setModalOpen(true); }}>
          <i className="bi bi-plus-lg me-2"></i>New Task Type
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-professional align-middle mb-0">
          <thead>
            <tr>
              <th className="px-4">ID</th>
              <th>Task Type Name</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taskTypes.map(tt => (
              <tr key={tt.id}>
                <td className="px-4 text-secondary small">#{tt.id}</td>
                <td><span className="fw-bold">{tt.name}</span></td>
                <td className="text-end px-4">
                  <div className="btn-group">
                    <button className="btn btn-sm btn-light" onClick={() => openEdit(tt)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(tt.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
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
                  <h5 className="modal-title fw-bold">{editingType ? 'Edit Task Type' : 'Create Task Type'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Type Name</label>
                    <input name="name" type="text" className="form-control" defaultValue={editingType?.name} placeholder="e.g. Bug Fix, Research, QA" required />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">Save Changes</button>
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
