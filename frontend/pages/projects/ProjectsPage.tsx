import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Project, ProjectStatus, User, Department, Client, Permission } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProjectsPageProps {
  projects: Project[];
  users: User[];
  departments: Department[];
  clients: Client[];
  crud: any;
}

const ITEMS_PER_PAGE = 6;

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, users, departments, clients, crud }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canManage = hasPermission(Permission.MANAGE_PROJECTS);

  // Search & Filter
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const validate = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.name || data.name.length < 3) newErrors.name = 'Project title must be at least 3 characters.';
    if (!data.clientId) newErrors.clientId = 'Please select a client.';
    if (!data.departmentId) newErrors.departmentId = 'Please select a department.';
    if (!data.startDate) newErrors.startDate = 'Start date is required.';
    if (!data.endDate) newErrors.endDate = 'Deadline is required.';
    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      newErrors.endDate = 'Deadline cannot be before start date.';
    }
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      clientId: Number(fd.get('clientId')),
      departmentId: Number(fd.get('departmentId')),
      projectManagerId: Number(fd.get('projectManagerId')),
      createdBy: editingProject ? editingProject.createdBy : (currentUser?.id || 1),
      startDate: fd.get('startDate') as string,
      endDate: fd.get('endDate') as string,
      status: fd.get('status') as ProjectStatus,
      progressPercentage: Number(fd.get('progressPercentage') || 0)
    };

    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (editingProject) {
      crud.update(editingProject.id, data);
    } else {
      crud.add(data);
    }
    setModalOpen(false);
    setErrors({});
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Company Projects</h3>
          <p className="text-secondary small mb-0">Active enterprise initiatives and historical archives</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
            <input 
              type="text" 
              className="form-control ps-5 border-0 shadow-sm rounded-pill" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '250px' }}
            />
          </div>
          {canManage && (
            <button className="btn btn-dark fw-bold px-4 shadow-sm rounded-pill" onClick={() => { setEditingProject(null); setModalOpen(true); setErrors({}); }}>
              <i className="bi bi-plus-lg me-2"></i>New Project
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {paginatedProjects.length > 0 ? paginatedProjects.map(p => (
          <div className="col-lg-4 col-md-6" key={p.id}>
            <div className="card h-100 p-4 border-0 shadow-sm hover-shadow transition rounded-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="fw-bold fs-5 text-dark text-truncate" style={{maxWidth: '70%'}}>{p.name}</div>
                <span className={`badge rounded-pill ${p.status === 'completed' ? 'bg-success-subtle text-success' : p.status === 'on_hold' ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-secondary small mb-4"><i className="bi bi-building me-1"></i> {p.clientName || 'Internal Project'}</p>
              
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1 small fw-bold">
                  <span className="text-secondary">Progress</span>
                  <span className="text-dark">{p.progressPercentage}%</span>
                </div>
                <div className="progress bg-light rounded-pill" style={{height: '8px'}}>
                  <div className={`progress-bar rounded-pill ${p.status === 'completed' ? 'bg-success' : 'bg-primary'}`} style={{width: `${p.progressPercentage}%`}}></div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-auto">
                {canManage && (
                  <>
                    <button className="btn btn-light btn-sm flex-grow-1 fw-bold text-secondary rounded-pill" onClick={() => { setEditingProject(p); setModalOpen(true); setErrors({}); }}>Edit</button>
                    <button className="btn btn-light btn-sm fw-bold text-danger rounded-circle p-2" onClick={() => { if(confirm('Delete project?')) crud.delete(p.id); }}><i className="bi bi-trash"></i></button>
                  </>
                )}
                <Link to={`/projects/${p.id}/kanban`} className="btn btn-light btn-sm flex-grow-1 fw-bold text-secondary d-flex align-items-center justify-content-center text-decoration-none rounded-pill">Kanban</Link>
                <Link to={`/projects/${p.id}`} className="btn btn-dark btn-sm flex-grow-1 fw-bold text-white d-flex align-items-center justify-content-center text-decoration-none shadow-sm rounded-pill">Details</Link>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-12 text-center py-5">
            <i className="bi bi-folder-x fs-1 text-secondary opacity-25"></i>
            <p className="text-secondary mt-2">No projects found matching your search.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-5">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link border-0 shadow-sm rounded-circle me-2" onClick={() => setCurrentPage(prev => prev - 1)}><i className="bi bi-chevron-left"></i></button>
            </li>
            {[...Array(totalPages)].map((_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                <button className={`page-link border-0 shadow-sm rounded-circle me-2 ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white text-dark'}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link border-0 shadow-sm rounded-circle" onClick={() => setCurrentPage(prev => prev + 1)}><i className="bi bi-chevron-right"></i></button>
            </li>
          </ul>
        </nav>
      )}

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">{editingProject ? 'Edit Project Profile' : 'Initiate New Project'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary uppercase">Project Title *</label>
                    <input name="name" className={`form-control bg-light border-0 ${errors.name ? 'is-invalid' : ''}`} defaultValue={editingProject?.name} placeholder="Enter project name" />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary uppercase">Client *</label>
                      <select name="clientId" className={`form-select bg-light border-0 ${errors.clientId ? 'is-invalid' : ''}`} defaultValue={editingProject?.clientId}>
                        <option value="">Select Client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                      </select>
                      {errors.clientId && <div className="invalid-feedback">{errors.clientId}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary uppercase">Department *</label>
                      <select name="departmentId" className={`form-select bg-light border-0 ${errors.departmentId ? 'is-invalid' : ''}`} defaultValue={editingProject?.departmentId}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {errors.departmentId && <div className="invalid-feedback">{errors.departmentId}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary uppercase">Start Date *</label>
                      <input name="startDate" type="date" className={`form-control bg-light border-0 ${errors.startDate ? 'is-invalid' : ''}`} defaultValue={editingProject?.startDate} />
                      {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary uppercase">Deadline *</label>
                      <input name="endDate" type="date" className={`form-control bg-light border-0 ${errors.endDate ? 'is-invalid' : ''}`} defaultValue={editingProject?.endDate} />
                      {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary uppercase">Project Manager</label>
                      <select name="projectManagerId" className="form-select bg-light border-0" defaultValue={editingProject?.projectManagerId}>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary uppercase">Status</label>
                      <select name="status" className="form-select bg-light border-0" defaultValue={editingProject?.status}>
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    {editingProject && (
                      <div className="col-md-12">
                        <label className="form-label small fw-bold text-secondary uppercase">Progress ({editingProject.progressPercentage}%)</label>
                        <input type="range" name="progressPercentage" className="form-range" min="0" max="100" defaultValue={editingProject.progressPercentage} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white d-flex gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 rounded-pill" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm rounded-pill">
                    {editingProject ? 'Update Project' : 'Launch Project'}
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

export default ProjectsPage;
