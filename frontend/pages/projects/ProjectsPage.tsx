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
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name'),
      clientId: Number(fd.get('clientId')),
      departmentId: Number(fd.get('departmentId')),
      projectManagerId: Number(fd.get('projectManagerId')),
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
      status: fd.get('status'),
      progress: Number(fd.get('progress') || 0)
    };
    if (editingProject) crud.update(editingProject.id, data); else crud.add(data);
    setModalOpen(false);
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Company Projects</h3>
          <p className="text-secondary small mb-0">Active enterprise initiatives and historical archives</p>
        </div>
        <button className="btn btn-dark fw-bold px-4 shadow-sm" onClick={() => { setEditingProject(null); setModalOpen(true); }}>
          <i className="bi bi-plus-lg me-2"></i>New Project
        </button>
      </div>

      <div className="row g-4">
        {projects.map(p => (
          <div className="col-lg-4 col-md-6" key={p.id}>
            <div className="card h-100 p-4 border-0 shadow-sm hover-shadow transition">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="fw-bold fs-5 text-dark text-truncate" style={{maxWidth: '70%'}}>{p.name}</div>
                <span className={`badge ${p.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>{p.status.replace('_', ' ')}</span>
              </div>
              <p className="text-secondary small mb-4"><i className="bi bi-building me-1"></i> {p.clientName || 'Internal Project'}</p>
              
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1 small fw-bold">
                  <span className="text-secondary">Progress</span>
                  <span className="text-dark">{p.progress}%</span>
                </div>
                <div className="progress" style={{height: '10px'}}><div className="progress-bar" style={{width: `${p.progress}%`}}></div></div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-light btn-sm flex-grow-1 fw-bold text-secondary" onClick={() => { setEditingProject(p); setModalOpen(true); }}>Edit</button>
                <Link to={`/projects/${p.id}/kanban`} className="btn btn-light btn-sm flex-grow-1 fw-bold text-secondary d-flex align-items-center justify-content-center text-decoration-none">Kanban</Link>
                <Link to={`/projects/${p.id}`} className="btn btn-dark btn-sm flex-grow-1 fw-bold text-white d-flex align-items-center justify-content-center text-decoration-none shadow-sm">Details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pt-4 px-4 bg-white"><h5 className="modal-title fw-bold">{editingProject ? 'Edit Project' : 'Initiate Project'}</h5><button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button></div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3"><label className="form-label small fw-bold text-secondary uppercase">Project Title</label><input name="name" className="form-control" defaultValue={editingProject?.name} required /></div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6"><label className="form-label small fw-bold text-secondary uppercase">Client</label><select name="clientId" className="form-select" defaultValue={editingProject?.clientId}>{clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></div>
                    <div className="col-md-6"><label className="form-label small fw-bold text-secondary uppercase">Department</label><select name="departmentId" className="form-select" defaultValue={editingProject?.departmentId}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div className="col-md-6"><label className="form-label small fw-bold text-secondary uppercase">Start Date</label><input name="startDate" type="date" className="form-control" defaultValue={editingProject?.startDate} /></div>
                    <div className="col-md-6"><label className="form-label small fw-bold text-secondary uppercase">Deadline</label><input name="endDate" type="date" className="form-control" defaultValue={editingProject?.endDate} /></div>
                    <div className="col-md-6"><label className="form-label small fw-bold text-secondary uppercase">Manager</label><select name="projectManagerId" className="form-select" defaultValue={editingProject?.projectManagerId}>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div className="col-md-6"><label className="form-label small fw-bold text-secondary uppercase">Status</label><select name="status" className="form-select" defaultValue={editingProject?.status}><option value="not_started">Not Started</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white"><button type="button" className="btn btn-light fw-bold px-4" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm">Save Project</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;