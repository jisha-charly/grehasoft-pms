
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Task, User, Department, Milestone, ProjectMember, ActivityLog, TaskStatus, TaskType, ProjectStatus, TaskFile, TaskReview } from '../../types';
import TaskDetailsModal from '../../components/TaskDetailsModal';

// @google/genai guidelines: Define missing props to resolve Type Error in App.tsx
interface ProjectDetailsPageProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  departments: Department[];
  milestones: Milestone[];
  members: ProjectMember[];
  activity: ActivityLog[];
  projectCrud: any;
  milestoneCrud: any;
  memberCrud: any;
  taskCrud: any;
  taskTypes: TaskType[];
  taskFiles: TaskFile[];
  taskReviews: TaskReview[];
  fileCrud: any;
  reviewCrud: any;
  currentUser: User;
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ 
  projects, tasks, users, departments, milestones, members, activity, projectCrud, milestoneCrud, memberCrud, taskCrud, taskTypes,
  taskFiles, taskReviews, fileCrud, reviewCrud, currentUser 
}) => {
  const { id } = useParams<{ id: string }>();
  const project = projects.find(p => p.id === Number(id));
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal States
  const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isEditProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!project) return <div className="p-5 text-center"><h3 className="text-muted">Project not found</h3><Link to="/projects">Back to list</Link></div>;

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectMilestones = milestones.filter(m => m.projectId === project.id);
  const projectMembers = members.filter(m => m.projectId === project.id);
  const projectActivity = activity.filter(a => a.projectId === project.id);

  const stats = [
    { label: 'Status', value: project.status.replace('_', ' '), icon: 'bi-activity', color: 'primary' },
    { label: 'Progress', value: `${project.progress}%`, icon: 'bi-bullseye', color: 'info' },
    { label: 'Total Tasks', value: projectTasks.length, icon: 'bi-check2-circle', color: 'dark' },
    { label: 'Completed', value: projectTasks.filter(t => t.status === TaskStatus.DONE).length, icon: 'bi-check-all', color: 'success' },
    { label: 'In Progress', value: projectTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, icon: 'bi-clock', color: 'warning' },
  ];

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    taskCrud.add({
      projectId: project.id,
      milestoneId: fd.get('milestoneId') ? Number(fd.get('milestoneId')) : undefined,
      title: fd.get('title'),
      description: fd.get('description'),
      priority: fd.get('priority'),
      status: fd.get('status') || TaskStatus.TODO,
      dueDate: fd.get('dueDate'),
      taskTypeId: Number(fd.get('taskTypeId')),
      assignees: [Number(fd.get('assignee'))]
    });
    setTaskModalOpen(false);
  };

  const handleProjectEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    projectCrud.update(project.id, {
      name: fd.get('name'),
      clientName: fd.get('clientName'),
      status: fd.get('status'),
      progress: Number(fd.get('progress'))
    });
    setEditProjectModalOpen(false);
  };

  return (
    <div className="container-fluid p-0">
      <div className="mb-4">
        <Link to="/projects" className="text-secondary text-decoration-none small mb-2 d-inline-block">
          <i className="bi bi-arrow-left me-1"></i> Back to Projects
        </Link>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="fw-bold mb-1 text-dark">{project.name}</h3>
            <p className="text-secondary small mb-0">
              Client: <span className="fw-semibold">{project.clientName}</span> • 
              Department: <span className="fw-semibold">{departments.find(d => d.id === project.departmentId)?.name}</span>
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to={`/projects/${project.id}/kanban`} className="btn btn-outline-dark fw-bold btn-sm px-3 shadow-sm bg-white">
              <i className="bi bi-kanban me-2"></i> Kanban Board
            </Link>
            <button className="btn btn-dark fw-bold btn-sm px-3 shadow-sm" onClick={() => setEditProjectModalOpen(true)}>
              <i className="bi bi-pencil me-2"></i> Edit Project
            </button>
          </div>
        </div>
      </div>
      
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div className="col-lg col-md-4 col-6" key={i}>
            <div className="card h-100 p-3 border-0 shadow-sm d-flex flex-row align-items-center">
              <div className={`p-2 rounded-3 bg-${s.color}-subtle text-${s.color} me-3`}>
                <i className={`bi ${s.icon} fs-5`}></i>
              </div>
              <div>
                <div className="text-secondary small fw-bold text-uppercase mb-0" style={{fontSize: '0.65rem', letterSpacing: '0.05rem'}}>
                  {s.label}
                </div>
                <div className="fw-bold text-dark">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white border-bottom-0 pt-3 px-4">
          <ul className="nav nav-pills gap-2">
            {['overview', 'tasks', 'milestones', 'team', 'activity'].map(tab => (
              <li className="nav-item" key={tab}>
                <button 
                  className={`nav-link text-capitalize px-4 py-2 small fw-bold ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'team' ? 'Team' : tab}
                  {tab === 'tasks' && <span className="ms-2 badge bg-light text-dark">{projectTasks.length}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-body p-4">
          {activeTab === 'overview' && (
            <div className="row g-4">
              <div className="col-lg-7">
                <h6 className="fw-bold mb-4 text-dark">Project Information</h6>
                <div className="row g-4 mb-5">
                  <div className="col-md-6">
                    <div className="text-secondary small fw-bold text-uppercase mb-2" style={{fontSize: '0.65rem'}}>Project Manager</div>
                    <div className="d-flex align-items-center">
                      <img src={`https://i.pravatar.cc/32?u=${project.projectManagerId}`} className="rounded-circle me-2 border shadow-sm" alt="" />
                      <span className="small fw-bold">{users.find(u => u.id === project.projectManagerId)?.name}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-secondary small fw-bold text-uppercase mb-2" style={{fontSize: '0.65rem'}}>Timeline</div>
                    <div className="small fw-bold text-dark">
                      <i className="bi bi-calendar3 me-2 text-primary"></i>
                      {project.startDate} - {project.endDate}
                    </div>
                  </div>
                  <div className="col-12 mt-4">
                    <div className="text-secondary small fw-bold text-uppercase mb-2" style={{fontSize: '0.65rem'}}>Created</div>
                    <div className="small fw-bold text-dark">{project.startDate}</div>
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <h6 className="fw-bold mb-4 text-dark">Task Distribution</h6>
                {[
                  { label: 'To Do', status: TaskStatus.TODO, color: 'secondary' },
                  { label: 'In Progress', status: TaskStatus.IN_PROGRESS, color: 'primary' },
                  { label: 'Completed', status: TaskStatus.DONE, color: 'success' },
                  { label: 'Blocked', status: TaskStatus.BLOCKED, color: 'danger' }
                ].map(item => {
                  const count = projectTasks.filter(t => t.status === item.status).length;
                  const percent = projectTasks.length ? (count / projectTasks.length) * 100 : 0;
                  return (
                    <div key={item.status} className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small text-secondary fw-semibold">
                          <i className={`bi bi-circle-fill me-2 text-${item.color}`} style={{fontSize: '0.5rem'}}></i>
                          {item.label}
                        </span>
                        <span className="small fw-bold">{count}</span>
                      </div>
                      <div className="progress" style={{height: '6px'}}>
                        <div className={`progress-bar bg-${item.color}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-5 p-3 rounded-3 bg-light border border-dashed">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold">Overall Progress</span>
                    <span className="badge bg-primary px-3">{project.progress}%</span>
                  </div>
                  <div className="progress" style={{height: '10px'}}>
                    <div className="progress-bar progress-bar-striped progress-bar-animated" style={{width: `${project.progress}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="table-responsive">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold mb-0">All Tasks</h6>
                <button className="btn btn-primary btn-sm fw-bold px-3" onClick={() => setTaskModalOpen(true)}>
                  <i className="bi bi-plus-lg me-2"></i>New Task
                </button>
              </div>
              <table className="table table-professional align-middle">
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Assignees</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted">No tasks assigned to this project yet.</td></tr>
                  ) : (
                    projectTasks.map(task => (
                      <tr key={task.id} onClick={() => setSelectedTask(task)} style={{cursor: 'pointer'}}>
                        <td><div className="fw-bold text-dark">{task.title}</div><div className="smaller text-muted">{task.description.substring(0, 40)}...</div></td>
                        <td>
                          <span className={`badge rounded-pill fw-bold py-2 px-3 ${
                            task.status === TaskStatus.DONE ? 'bg-success-subtle text-success' : 
                            task.status === TaskStatus.IN_PROGRESS ? 'bg-primary-subtle text-primary' : 
                            task.status === TaskStatus.BLOCKED ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge rounded-pill fw-bold py-1 px-2 ${
                            task.priority === 'high' ? 'bg-danger text-white' : 
                            task.priority === 'medium' ? 'bg-warning text-dark' : 'bg-info text-white'
                          }`} style={{fontSize: '0.65rem'}}>
                            {task.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="small text-secondary fw-semibold"><i className="bi bi-calendar-event me-2"></i>{task.dueDate}</td>
                        <td>
                          <div className="avatar-group">
                            {task.assignees.map(uid => (
                              <img key={uid} src={`https://i.pravatar.cc/32?u=${uid}`} className="rounded-circle" title={users.find(u => u.id === uid)?.name} alt="" />
                            ))}
                          </div>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-light text-danger" onClick={(e) => { e.stopPropagation(); taskCrud.delete(task.id); }}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold mb-0">Roadmap Milestones</h6>
                <button className="btn btn-sm btn-dark fw-bold px-3" onClick={() => setMilestoneModalOpen(true)}>
                  <i className="bi bi-plus-lg me-2"></i>Add Milestone
                </button>
              </div>
              <div className="list-group list-group-flush">
                {projectMilestones.length === 0 ? (
                  <div className="text-center py-5 border rounded-3 bg-light"><i className="bi bi-flag fs-1 text-muted d-block mb-3"></i>No milestones defined.</div>
                ) : (
                  projectMilestones.map(m => (
                    <div key={m.id} className="list-group-item d-flex justify-content-between align-items-center py-3 border-0 rounded-4 bg-light mb-3 shadow-sm hover-shadow transition">
                      <div className="d-flex align-items-center px-2">
                        <div 
                          className={`p-2 rounded-circle me-4 shadow-sm border d-flex align-items-center justify-content-center ${m.status === 'completed' ? 'bg-success text-white' : 'bg-white text-secondary'}`}
                          style={{width: '40px', height: '40px', cursor: 'pointer'}}
                          onClick={() => milestoneCrud.update(m.id, { status: m.status === 'completed' ? 'pending' : 'completed' })}
                        >
                          <i className={`bi ${m.status === 'completed' ? 'bi-check-lg' : 'bi-circle'}`}></i>
                        </div>
                        <div>
                          <div className={`fw-bold ${m.status === 'completed' ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>{m.title}</div>
                          <div className="smaller text-secondary fw-semibold">
                            <i className="bi bi-clock me-1"></i> Due Date: {m.dueDate}
                          </div>
                        </div>
                      </div>
                      <div className="px-2">
                        <button className="btn btn-sm btn-light text-danger rounded-pill" onClick={() => milestoneCrud.delete(m.id)}><i className="bi bi-trash"></i></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold mb-0">Project Team Members</h6>
                <button className="btn btn-sm btn-dark fw-bold px-3" onClick={() => setMemberModalOpen(true)}>
                  <i className="bi bi-person-plus me-2"></i>Add Member
                </button>
              </div>
              <div className="row g-3">
                {projectMembers.map(m => {
                  const user = users.find(u => u.id === m.userId);
                  return (
                    <div className="col-lg-4 col-md-6" key={m.id}>
                      <div className="card border p-3 bg-light d-flex flex-row align-items-center shadow-none hover-shadow transition">
                        <img src={`https://i.pravatar.cc/48?u=${m.userId}`} className="rounded-circle me-3 border shadow-sm" alt="" />
                        <div className="flex-grow-1">
                          <div className="fw-bold text-dark">{user?.name}</div>
                          <div className="smaller text-primary fw-bold text-uppercase tracking-wider">{m.roleInProject}</div>
                        </div>
                        <button className="btn btn-sm btn-link text-danger p-0 text-decoration-none" onClick={() => memberCrud.delete(m.id)}>
                          <i className="bi bi-person-dash fs-5"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-feed">
              <h6 className="fw-bold mb-4">Latest Activity</h6>
              {projectActivity.length === 0 ? (
                <div className="text-center py-4 text-muted small">No logs found for this project.</div>
              ) : (
                projectActivity.map(a => (
                  <div key={a.id} className="d-flex mb-4 pb-4 border-bottom last-border-0">
                    <div className="me-3">
                      <img src={`https://i.pravatar.cc/40?u=${a.userId}`} className="rounded-circle border shadow-sm" alt="" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small fw-bold text-dark mb-1">
                        {users.find(u => u.id === a.userId)?.name} 
                        <span className="fw-normal text-secondary ms-1">{a.action}</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="smaller text-muted"><i className="bi bi-clock me-1"></i>{a.createdAt}</div>
                        {a.taskId && <div className="smaller text-primary fw-bold"><i className="bi bi-hash me-1"></i>Task-{a.taskId}</div>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {isTaskModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleTaskSubmit}>
                <div className="modal-header bg-white border-bottom-0 pt-4 px-4">
                  <h5 className="modal-title fw-bold">Create New Task</h5>
                  <button type="button" className="btn-close" onClick={() => setTaskModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Project *</label>
                      <select name="projectId" className="form-select bg-light border-0" defaultValue={project.id} disabled>
                        <option value={project.id}>{project.name}</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Milestone</label>
                      <select name="milestoneId" className="form-select">
                        <option value="">Select Milestone (Optional)...</option>
                        {projectMilestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Task Title *</label>
                      <input name="title" type="text" className="form-control" placeholder="Enter task title" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Description</label>
                      <textarea name="description" className="form-control" rows={3} placeholder="Enter task description"></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Task Type</label>
                      <select name="taskTypeId" className="form-select">
                        {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Due Date</label>
                      <input name="dueDate" type="date" className="form-control" required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Priority</label>
                      <select name="priority" className="form-select">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Status</label>
                      <select name="status" className="form-select">
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Completed</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary text-uppercase">Assign To</label>
                      <select name="assignee" className="form-select">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 pb-4 px-4 bg-white gap-2">
                  <button type="button" className="btn btn-secondary fw-bold px-4" onClick={() => setTaskModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Assign Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isMilestoneModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                milestoneCrud.add({
                  projectId: project.id,
                  title: fd.get('title'),
                  dueDate: fd.get('dueDate'),
                  status: 'pending'
                });
                setMilestoneModalOpen(false);
              }}>
                <div className="modal-header border-0 pt-4 px-4 bg-white"><h5 className="modal-title fw-bold">Add Milestone</h5><button type="button" className="btn-close" onClick={() => setMilestoneModalOpen(false)}></button></div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3"><label className="form-label small fw-bold text-secondary text-uppercase">Milestone Title</label><input name="title" className="form-control" placeholder="e.g. Beta Launch" required /></div>
                  <div className="mb-3"><label className="form-label small fw-bold text-secondary text-uppercase">Due Date</label><input name="dueDate" type="date" className="form-control" required /></div>
                </div>
                <div className="modal-footer border-0 pb-4 px-4 bg-white">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setMilestoneModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Save Milestone</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isMemberModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                memberCrud.add({
                  projectId: project.id,
                  userId: Number(fd.get('userId')),
                  roleInProject: fd.get('roleInProject')
                });
                setMemberModalOpen(false);
              }}>
                <div className="modal-header border-0 pt-4 px-4 bg-white"><h5 className="modal-title fw-bold">Add Team Member</h5><button type="button" className="btn-close" onClick={() => setMemberModalOpen(false)}></button></div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Select User</label>
                    <select name="userId" className="form-select">
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Project Role</label>
                    <select name="roleInProject" className="form-select">
                      <option value="MEMBER">Member</option>
                      <option value="QA">QA</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 pb-4 px-4 bg-white">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setMemberModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Add to Team</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isEditProjectModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleProjectEditSubmit}>
                <div className="modal-header border-0 pt-4 px-4 bg-white"><h5 className="modal-title fw-bold">Edit Project</h5><button type="button" className="btn-close" onClick={() => setEditProjectModalOpen(false)}></button></div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3"><label className="form-label small fw-bold text-secondary text-uppercase">Project Name</label><input name="name" className="form-control" defaultValue={project.name} required /></div>
                  <div className="mb-3"><label className="form-label small fw-bold text-secondary text-uppercase">Client Name</label><input name="clientName" className="form-control" defaultValue={project.clientName} /></div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Status</label>
                    <select name="status" className="form-select" defaultValue={project.status}>
                      {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary text-uppercase">Overall Progress (%)</label>
                    <input name="progress" type="number" className="form-control" defaultValue={project.progress} min="0" max="100" />
                  </div>
                </div>
                <div className="modal-footer border-0 pb-4 px-4 bg-white">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setEditProjectModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Update Project</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} onClose={() => setSelectedTask(null)} files={taskFiles} reviews={taskReviews} users={users} currentUser={currentUser}
          onAddFile={fileCrud.add} onAddReview={reviewCrud.add} onUpdateStatus={taskCrud.update}
        />
      )}
    </div>
  );
};

export default ProjectDetailsPage;
