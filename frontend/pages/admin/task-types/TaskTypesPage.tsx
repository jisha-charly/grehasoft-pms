import React, { useState } from 'react';
import { TaskType } from '../../../types';

interface TaskTypesPageProps {
  taskTypes: TaskType[];
  crud: any;
}

const TaskTypesPage: React.FC<TaskTypesPageProps> = ({ taskTypes, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TaskType | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { name: fd.get('name'), description: fd.get('description') };
    if (editingType) crud.update(editingType.id, data); else crud.add(data);
    setModalOpen(false);
    setEditingType(null);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-4 px-4 d-flex justify-content-between align-items-center border-0">
        <div>
          <h4 className="fw-bold mb-0">Task Categories</h4>
          <p className="text-secondary small mb-0">Define classifications for enterprise workflow tasks</p>
        </div>
        <button className="btn btn-primary btn-sm fw-bold px-3 shadow-sm" onClick={() => { setEditingType(null); setModalOpen(true); }}>Add Task Type</button>
      </div>
      <div className="table-responsive">
        <table className="table table-professional align-middle mb-0">
          <thead>
            <tr>
              <th className="px-4">Category Name</th>
              <th>Description</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taskTypes.map(tt => (
              <tr key={tt.id}>
                <td className="px-4 fw-bold text-dark">{tt.name}</td>
                <td className="small text-secondary">{tt.description || 'General task type'}</td>
                <td className="text-end px-4">
                  <div className="btn-group">
                    <button className="btn btn-sm btn-light" onClick={() => { setEditingType(tt); setModalOpen(true); }}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(tt.id)}><i className="bi bi-trash"></i></button>
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
                <div className="modal-header border-0 pt-4 px-4 bg-white"><h5 className="modal-title fw-bold">{editingType ? 'Edit Category' : 'New Category'}</h5><button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button></div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3"><label className="form-label small fw-bold text-secondary">Name</label><input name="name" className="form-control" defaultValue={editingType?.name} required /></div>
                  <div className="mb-3"><label className="form-label small fw-bold text-secondary">Description</label><textarea name="description" className="form-control" defaultValue={editingType?.description}></textarea></div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white"><button type="button" className="btn btn-light fw-bold" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary fw-bold">Save Changes</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTypesPage;