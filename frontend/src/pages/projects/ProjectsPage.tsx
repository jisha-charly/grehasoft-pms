import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Project, ProjectStatus, User, Department, Client, Permission } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import FormField from '../../components/FormField';

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

  const canManage = hasPermission(Permission.MANAGE_PROJECTS);

  const validationSchema = {
    name: {
      required: true,
      minLength: 3,
      message: 'Project title must be at least 3 characters.'
    },
    clientId: {
      required: true,
      message: 'Please select a client.'
    },
    departmentId: {
      required: true,
      message: 'Please select a department.'
    },
    startDate: {
      required: true,
      message: 'Start date is required.'
    },
    endDate: {
      required: true,
      message: 'Deadline is required.',
      validate: (value: string, values: any) => {
        if (values.startDate && value && new Date(values.startDate) > new Date(value)) {
          return 'Deadline cannot be before start date.';
        }
        return true;
      }
    }
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setValues
  } = useForm({
    initialValues: {
      name: '',
      clientId: '',
      departmentId: '',
      projectManagerId: users[0]?.id || '',
      startDate: '',
      endDate: '',
      status: 'not_started' as ProjectStatus,
      progressPercentage: 0
    },
    validationSchema,
  onSubmit: async (values) => {
      const payload = {
        name: values.name,

        client: Number(values.clientId),
        department: Number(values.departmentId),
        project_manager: Number(values.projectManagerId),

        // ✅ get from logged-in user
        created_by: currentUser?.id,

        start_date: values.startDate,
        end_date: values.endDate,

        status: values.status
      };

  if (editingProject) {
        await crud.update(editingProject.id, payload);
      } else {
        await crud.add(payload);
      }

      resetForm();
      setModalOpen(false);
    }
  });

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

  const handleOpenModal = (project: Project | null = null) => {
    setEditingProject(project);
    if (project) {
      setValues({
        name: project.name,
        clientId: project.clientId.toString(),
        departmentId: project.department.toString(),
        projectManagerId: project.project_manager.toString(),
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        progressPercentage: project.progress_percentage
      });
    } else {
      resetForm();
    }
    setModalOpen(true);
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
            <button className="btn btn-dark fw-bold px-4 shadow-sm rounded-pill" onClick={() => handleOpenModal(null)}>
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
                  <span className="text-dark">{p.progress_percentage}%</span>
                </div>
                <div className="progress bg-light rounded-pill" style={{height: '8px'}}>
                  <div className={`progress-bar rounded-pill ${p.status === 'completed' ? 'bg-success' : 'bg-primary'}`} style={{width: `${p.progress_percentage}%`}}></div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-auto">
                {canManage && (
                  <>
                    <button className="btn btn-light btn-sm flex-grow-1 fw-bold text-secondary rounded-pill" onClick={() => handleOpenModal(p)}>Edit</button>
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
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-header border-0 pt-4 px-4 bg-white">
            <h5 className="modal-title fw-bold text-dark">
              {editingProject ? 'Edit Project Profile' : 'Initiate New Project'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setModalOpen(false)}
            ></button>
          </div>

          <div className="modal-body p-4 bg-white">

            {/* Project Title */}
            <FormField label="Project Title" error={errors.name} required>
              <input
                type="text"
                name="name"
                value={values.name}
               onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                className="form-control"
                placeholder="Enter project name"
              />
            </FormField>

            <div className="row g-3 mb-3">

              {/* Client */}
              <div className="col-md-6">
                <FormField label="Client" error={errors.clientId} required>
                  <select
                    name="clientId"
                    value={values.clientId}
                   onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                    className="form-select"
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Department */}
              <div className="col-md-6">
                <FormField label="Department" error={errors.departmentId} required>
                  <select
                    name="departmentId"
                    value={values.departmentId}
                  onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                    className="form-select"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Start Date */}
              <div className="col-md-6">
                <FormField label="Start Date" error={errors.startDate} required>
                  <input
                    type="date"
                    name="startDate"
                    value={values.startDate}
                   onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                    className="form-control"
                  />
                </FormField>
              </div>

              {/* Deadline */}
              <div className="col-md-6">
                <FormField label="Deadline" error={errors.endDate} required>
                  <input
                    type="date"
                    name="endDate"
                    value={values.endDate}
                    onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                    className="form-control"
                  />
                </FormField>
              </div>

              {/* Project Manager */}
              <div className="col-md-6">
                <FormField label="Project Manager">
                  <select
                    name="projectManagerId"
                    value={values.projectManagerId}
                   onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                    className="form-select"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Status */}
              <div className="col-md-6">
                <FormField label="Status">
                  <select
                    name="status"
                    value={values.status}
                  onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                    className="form-select"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </FormField>
              </div>

              {/* Progress (Edit only) */}
              {editingProject && (
                <div className="col-md-12">
                  <label className="form-label small fw-bold text-secondary">
                    Progress ({values.progressPercentage}%)
                  </label>
                  <input
                    type="range"
                    name="progressPercentage"
                    className="form-range"
                    min="0"
                    max="100"
                    value={values.progressPercentage}
                   onChange={(e) =>
  handleChange(
    e.target.name as keyof typeof values,
    e.target.value
  )
}
                  />
                </div>
              )}

            </div>
          </div>

          <div className="modal-footer border-0 p-4 pt-0 bg-white d-flex gap-2">
            <button
              type="button"
              className="btn btn-light fw-bold px-4 rounded-pill"
              onClick={() => setModalOpen(false)}
            >
              Discard
            </button>

            <button
              type="submit"
              className="btn btn-primary fw-bold px-4 shadow-sm rounded-pill"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : editingProject ? (
                'Update Project'
              ) : (
                'Launch Project'
              )}
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
