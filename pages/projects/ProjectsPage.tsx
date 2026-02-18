
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, ProjectStatus, User, Department, Client } from '../../types';

interface ProjectsPageProps {
  projects: Project[];
  users: User[];
  departments: Department[];
  clients: Client[];
  crud: any;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, users, departments, clients, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const selectedClientId = Number(data.clientId);
    const selectedClient = clients.find(c => c.id === selectedClientId);

    const payload = {
      name: data.name as string,
      clientId: selectedClientId,
      clientName: selectedClient?.companyName || 'Unknown',
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
          <p className="text-secondary small mb-0">Overview of all active and historical enterprise projects</p>
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
              <div className="text-muted small mb-4">
                <i className="bi bi-building me-1"></i> {p.clientName || 'N/A'}
              </div>
              
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
                <div className="progress shadow-sm" style={{ height: '10px' }}>
                  <div className="progress-bar bg-primary" style={{ width: `${p.progress}%` }}></div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-light flex-grow-1 fw-bold text-secondary border-0" onClick={() => { setEditingProject(p); setModalOpen(true); }}>Edit</button>
                <Link to={`/projects/${p.id}/kanban`} className="btn btn-light flex-grow-1 fw-bold text-secondary text-decoration-none d-flex align-items-center justify-content-center border-0">Kanban</Link>
                <Link to={`/projects/${p.id}`} className="btn btn-dark flex-grow-1 fw-bold text-white text-decoration-none d-flex align-items-center justify-content-center border-0">Details</Link>
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-12 text-center py-5">
            <h5 className="text-muted fw-bold">No projects found. Create one to get started.</h5>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pb-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold">{editingProject ? 'Update Project' : 'Create New Project'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Project Name *</label>
                    <input name="name" type="text" className="form-control" defaultValue={editingProject?.name} placeholder="e.g. Website Redesign" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Select Client *</label>
                    <select name="clientId" className="form-select" defaultValue={editingProject?.clientId} required>
                      <option value="">Choose a client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.companyName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Department</label>
                      <select name="department" className="form-select" defaultValue={editingProject?.departmentId}>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Manager</label>
                      <select name="manager" className="form-select" defaultValue={editingProject?.projectManagerId}>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Start Date</label>
                      <input name="startDate" type="date" className="form-control" defaultValue={editingProject?.startDate} />
                    </div>
                    <div className="col">
                      <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">End Date</label>
                      <input name="endDate" type="date" className="form-control" defaultValue={editingProject?.endDate} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Status</label>
                    <select name="status" className="form-select" defaultValue={editingProject?.status || 'not_started'}>
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 border-0" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 border-0">Save Project</button>
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
