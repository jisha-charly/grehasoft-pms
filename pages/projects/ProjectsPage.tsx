
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, ProjectStatus, User, Department } from '../../types';

interface ProjectsPageProps {
  projects: Project[];
  users: User[];
  departments: Department[];
  crud: any;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, users, departments, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      name: data.name as string,
      clientName: data.clientName as string,
      status: data.status as ProjectStatus,
      projectManagerId: Number(data.manager),
      departmentId: Number(data.department),
      startDate: data.startDate as string,
      endDate: data.endDate as string,
    };

    if (editingProject) {
      crud.update(editingProject.id, payload);
    } else {
      crud.add(payload);
    }
    setModalOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">Projects</h3>
        </div>
        <button className="btn btn-dark fw-bold" onClick={() => { setEditingProject(null); setModalOpen(true); }}>
          <i className="bi bi-plus-lg me-2"></i>New Project
        </button>
      </div>

      <div className="row g-4">
        {projects.map(p => (
          <div className="col-md-6 col-lg-4" key={p.id}>
            <div className="card h-100 p-4 border-0 shadow-sm">
              <div className="mb-1 fw-bold fs-5 text-dark">{p.name}</div>
              <div className="text-muted small mb-4">{p.clientName || 'N/A'}</div>
              
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary small fw-medium">Status:</span>
                <span className={`badge ${p.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary small fw-medium">Progress:</span>
                  <span className="fw-bold small">{p.progress}%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar bg-primary" style={{ width: `${p.progress}%` }}></div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-light flex-grow-1 fw-bold text-secondary" onClick={() => { setEditingProject(p); setModalOpen(true); }}>Edit</button>
                <Link to={`/projects/${p.id}/kanban`} className="btn btn-light flex-grow-1 fw-bold text-secondary text-decoration-none d-flex align-items-center justify-content-center">Kanban</Link>
                <Link to={`/projects/${p.id}`} className="btn btn-dark flex-grow-1 fw-bold text-white text-decoration-none d-flex align-items-center justify-content-center">Details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pb-0 pt-4 px-4">
                  <h5 className="modal-title fw-bold">Project Details</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Project Name *</label>
                    <input name="name" type="text" className="form-control" defaultValue={editingProject?.name} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Client Name</label>
                    <input name="clientName" type="text" className="form-control" defaultValue={editingProject?.clientName} />
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary">Department</label>
                      <select name="department" className="form-select" defaultValue={editingProject?.departmentId}>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary">Manager</label>
                      <select name="manager" className="form-select" defaultValue={editingProject?.projectManagerId}>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary">Start Date</label>
                      <input name="startDate" type="date" className="form-control" defaultValue={editingProject?.startDate} />
                    </div>
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary">End Date</label>
                      <input name="endDate" type="date" className="form-control" defaultValue={editingProject?.endDate} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Status</label>
                    <select name="status" className="form-select" defaultValue={editingProject?.status}>
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Save Project</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
