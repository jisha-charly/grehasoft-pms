
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Task, User, Department, Milestone, ProjectMember, ActivityLog, TaskStatus, TaskType, ProjectStatus, TaskFile, TaskReview } from '../../types';
import TaskDetailsModal from '../../components/TaskDetailsModal';

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modal Visibility States
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);

  // Editing Item States
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);

  if (!project) return <div className="p-5 text-center"><h3 className="text-muted">Project not found</h3><Link to="/projects">Back to list</Link></div>;

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectMilestones = milestones.filter(m => m.projectId === project.id);
  const projectMembers = members.filter(m => m.projectId === project.id);
  const projectActivity = activity.filter(a => a.projectId === project.id);

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      projectId: project.id,
      milestoneId: fd.get('milestoneId') ? Number(fd.get('milestoneId')) : undefined,
      title: fd.get('title'),
      description: fd.get('description'),
      priority: fd.get('priority'),
      status: fd.get('status') as TaskStatus || TaskStatus.TODO,
      dueDate: fd.get('dueDate'),
      taskTypeId: Number(fd.get('taskTypeId')),
      assignees: [Number(fd.get('assignee'))]
    };

    if (editingTask) {
      taskCrud.update(editingTask.id, payload);
    } else {
      taskCrud.add(payload);
    }
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleMilestoneSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      projectId: project.id,
      title: fd.get('title'),
      dueDate: fd.get('dueDate'),
    };

    if (editingMilestone) {
      milestoneCrud.update(editingMilestone.id, payload);
    } else {
      milestoneCrud.add({ ...payload, status: 'pending', progress: 0 });
    }
    setMilestoneModalOpen(false);
    setEditingMilestone(null);
  };

  const handleMemberSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      projectId: project.id,
      userId: Number(fd.get('userId')),
      roleInProject: fd.get('roleInProject'),
    };

    if (editingMember) {
      memberCrud.update(editingMember.id, { roleInProject: payload.roleInProject });
    } else {
      memberCrud.add({ ...payload, addedAt: new Date().toISOString() });
    }
    setMemberModalOpen(false);
    setEditingMember(null);
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
            <p className="text-secondary small mb-0">Client: <span className="fw-semibold text-primary">{project.clientName}</span></p>
          </div>
          <div className="d-flex gap-2">
            <Link to={`/projects/${project.id}/kanban`} className="btn btn-outline-dark fw-bold btn-sm px-3 shadow-sm bg-white border">
              <i className="bi bi-kanban me-2"></i> Board View
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: 'Status', value: project.status.replace('_', ' '), icon: 'bi-activity', color: 'primary' },
          { label: 'Progress', value: `${project.progress}%`, icon: 'bi-bullseye', color: 'info' },
          { label: 'Total Tasks', value: projectTasks.length, icon: 'bi-check2-circle', color: 'dark' },
          { label: 'Deadline', value: project.endDate, icon: 'bi-calendar3', color: 'danger' }
        ].map((s, i) => (
          <div className="col-lg-3 col-md-6" key={i}>
            <div className="card p-3 border-0 shadow-sm d-flex flex-row align-items-center h-100">
              <div className={`p-2 rounded-3 bg-${s.color}-subtle text-${s.color} me-3`}><i className={`bi ${s.icon} fs-5`}></i></div>
              <div>
                <div className="text-secondary small fw-bold text-uppercase mb-0" style={{fontSize: '0.65rem'}}>{s.label}</div>
                <div className="fw-bold text-dark">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white border-bottom-0 pt-3 px-4">
          <ul className="nav nav-pills gap-2 pb-2">
            {['overview', 'tasks', 'milestones', 'team', 'activity'].map(tab => (
              <li className="nav-item" key={tab}>
                <button className={`nav-link text-capitalize px-4 py-2 small fw-bold ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-body p-4 bg-white">
          {activeTab === 'overview' && (
            <div className="row g-4">
              <div className="col-lg-8">
                <h6 className="fw-bold mb-3">Project Summary</h6>
                <p className="text-muted small">Comprehensive oversight of {project.name}. All functional requirements and milestones are tracked here.</p>
                <div className="row g-3 mt-4">
                  <div className="col-md-6"><div className="p-3 rounded bg-light border-0"><div className="small text-secondary fw-bold uppercase mb-1" style={{fontSize: '0.6rem'}}>Department</div><div className="fw-bold">{departments.find(d => d.id === project.departmentId)?.name || 'N/A'}</div></div></div>
                  <div className="col-md-6"><div className="p-3 rounded bg-light border-0"><div className="small text-secondary fw-bold uppercase mb-1" style={{fontSize: '0.6rem'}}>Project Manager</div><div className="fw-bold">{users.find(u => u.id === project.projectManagerId)?.name || 'N/A'}</div></div></div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card p-3 bg-light border-0 h-100">
                  <h6 className="fw-bold mb-3 small uppercase text-secondary">Task Distribution</h6>
                  {['todo', 'in_progress', 'done', 'blocked'].map(st => (
                    <div key={st} className="d-flex justify-content-between align-items-center mb-2 small fw-bold">
                      <span className="text-capitalize text-secondary">{st.replace('_', ' ')}</span>
                      <span>{projectTasks.filter(t => t.status === st).length}</span>
                    </div>
                  ))}
                  <div className="mt-4 pt-3 border-top">
                    <div className="small fw-bold mb-2">Completion Rate</div>
                    <div className="progress" style={{height: '8px'}}>
                      <div className="progress-bar bg-success" style={{width: `${project.progress}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Project Deliverables</h6>
                <button className="btn btn-primary btn-sm fw-bold px-3" onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}>
                  <i className="bi bi-plus-lg me-2"></i>New Task
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-professional align-middle mb-0">
                  <thead><tr><th>Task Name</th><th>Status</th><th>Priority</th><th>Due Date</th><th className="text-end">Action</th></tr></thead>
                  <tbody>
                    {projectTasks.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-5 text-muted small">No tasks assigned to this project yet.</td></tr>
                    ) : (
                      projectTasks.map(t => (
                        <tr key={t.id} onClick={() => setSelectedTask(t)} style={{cursor: 'pointer'}}>
                          <td><div className="fw-bold text-dark">{t.title}</div><div className="smaller text-muted">{t.description.substring(0, 40)}...</div></td>
                          <td><span className={`badge ${t.status === 'done' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>{t.status}</span></td>
                          <td><span className={`badge ${t.priority === 'high' ? 'bg-danger' : 'bg-info'}`}>{t.priority}</span></td>
                          <td className="small text-secondary">{t.dueDate}</td>
                          <td className="text-end">
                            <div className="btn-group">
                              <button className="btn btn-sm btn-light" onClick={(e) => { e.stopPropagation(); setEditingTask(t); setTaskModalOpen(true); }}>
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-light text-danger" onClick={(e) => { e.stopPropagation(); taskCrud.delete(t.id); }}>
                                <i className="bi bi-trash"></i>
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
          )}

          {activeTab === 'milestones' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Strategic Milestones</h6>
                <button className="btn btn-dark btn-sm fw-bold px-3" onClick={() => { setEditingMilestone(null); setMilestoneModalOpen(true); }}>
                  <i className="bi bi-flag me-2"></i>Add Milestone
                </button>
              </div>
              <div className="list-group list-group-flush">
                {projectMilestones.length === 0 ? (
                  <div className="text-center py-5 text-muted small border rounded-3 border-dashed">No milestones defined for this roadmap.</div>
                ) : (
                  projectMilestones.map(m => (
                    <div key={m.id} className="list-group-item py-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          <div 
                            className={`p-2 rounded-circle me-3 shadow-sm border d-flex align-items-center justify-content-center ${m.status === 'completed' ? 'bg-success text-white' : 'bg-white text-secondary'}`}
                            style={{width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.8rem'}}
                            onClick={() => milestoneCrud.update(m.id, { status: m.status === 'completed' ? 'pending' : 'completed' })}
                          >
                            <i className={`bi ${m.status === 'completed' ? 'bi-check-lg' : 'bi-circle'}`}></i>
                          </div>
                          <div>
                            <div className={`fw-bold ${m.status === 'completed' ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>{m.title}</div>
                            <div className="smaller text-secondary fw-semibold">Target: {m.dueDate}</div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="small fw-bold text-dark mb-1">{m.progress}% Complete</div>
                          <div className="btn-group">
                            <button className="btn btn-sm btn-light py-0 px-2" onClick={() => { setEditingMilestone(m); setMilestoneModalOpen(true); }}>
                              <i className="bi bi-pencil smaller"></i>
                            </button>
                            <button className="btn btn-sm btn-light text-danger py-0 px-2" onClick={() => milestoneCrud.delete(m.id)}>
                              <i className="bi bi-trash smaller"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="progress mt-2" style={{height: '6px'}}>
                        <div className={`progress-bar ${m.status === 'completed' ? 'bg-success' : 'bg-primary'}`} style={{width: `${m.progress}%`}}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Assigned Team Members</h6>
                <button className="btn btn-primary btn-sm fw-bold px-3" onClick={() => { setEditingMember(null); setMemberModalOpen(true); }}>
                  <i className="bi bi-person-plus me-2"></i>Add Member
                </button>
              </div>
              <div className="row g-3">
                {projectMembers.length === 0 ? (
                  <div className="col-12 text-center py-5 text-muted small">No members assigned to this project.</div>
                ) : (
                  projectMembers.map(m => {
                    const user = users.find(u => u.id === m.userId);
                    return (
                      <div className="col-md-4" key={m.id}>
                        <div className="card p-3 bg-light border-0 shadow-none d-flex flex-row align-items-center h-100">
                          <img src={`https://i.pravatar.cc/40?u=${m.userId}`} className="rounded-circle me-3 border shadow-sm" alt="" />
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark small">{user?.name}</div>
                            <div className="text-primary smaller fw-bold uppercase">{m.roleInProject}</div>
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <button className="btn btn-link text-primary p-0 text-decoration-none" onClick={() => { setEditingMember(m); setMemberModalOpen(true); }}>
                              <i className="bi bi-pencil smaller"></i>
                            </button>
                            <button className="btn btn-link text-danger p-0 text-decoration-none" onClick={() => memberCrud.delete(m.id)}>
                              <i className="bi bi-person-dash fs-6"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="timeline py-2">
              <h6 className="fw-bold mb-4">Project Activity Logs</h6>
              {projectActivity.length === 0 ? (
                <div className="text-center py-5 text-muted small">No recent activity found.</div>
              ) : (
                projectActivity.map(a => (
                  <div key={a.id} className="d-flex mb-4">
                    <div className="flex-shrink-0 me-3">
                      <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                        <i className="bi bi-lightning-charge smaller"></i>
                      </div>
                    </div>
                    <div>
                      <div className="small fw-bold text-dark mb-1">
                        {users.find(u => u.id === a.userId)?.name} 
                        <span className="fw-normal text-secondary ms-1">{a.action}</span>
                      </div>
                      <div className="smaller text-muted"><i className="bi bi-clock me-1"></i>{a.createdAt}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleTaskSubmit}>
                <div className="modal-header pt-4 px-4 bg-white border-0">
                  <h5 className="modal-title fw-bold text-dark">{editingTask ? 'Edit Task' : 'New Project Task'}</h5>
                  <button type="button" className="btn-close" onClick={() => setTaskModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-12"><label className="form-label smaller fw-bold uppercase text-secondary">Task Title *</label><input name="title" className="form-control" defaultValue={editingTask?.title} required /></div>
                    <div className="col-12"><label className="form-label smaller fw-bold uppercase text-secondary">Description</label><textarea name="description" className="form-control" rows={3} defaultValue={editingTask?.description}></textarea></div>
                    <div className="col-md-6"><label className="form-label smaller fw-bold uppercase text-secondary">Milestone (Optional)</label><select name="milestoneId" className="form-select" defaultValue={editingTask?.milestoneId}><option value="">Not linked</option>{projectMilestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                    <div className="col-md-6"><label className="form-label smaller fw-bold uppercase text-secondary">Task Type</label><select name="taskTypeId" className="form-select" defaultValue={editingTask?.taskTypeId}>{taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}</select></div>
                    <div className="col-md-4"><label className="form-label smaller fw-bold uppercase text-secondary">Priority</label><select name="priority" className="form-select" defaultValue={editingTask?.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                    <div className="col-md-4"><label className="form-label smaller fw-bold uppercase text-secondary">Status</label><select name="status" className="form-select" defaultValue={editingTask?.status || 'todo'}><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="blocked">Blocked</option><option value="done">Completed</option></select></div>
                    <div className="col-md-4"><label className="form-label smaller fw-bold uppercase text-secondary">Due Date</label><input name="dueDate" type="date" className="form-control" defaultValue={editingTask?.dueDate} required /></div>
                    <div className="col-md-12"><label className="form-label smaller fw-bold uppercase text-secondary">Assignee</label><select name="assignee" className="form-select" defaultValue={editingTask?.assignees[0]}>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                  </div>
                </div>
                <div className="modal-footer bg-white border-0 pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setTaskModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold">{editingTask ? 'Update Task' : 'Create Task'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {isMilestoneModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleMilestoneSubmit}>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold">{editingMilestone ? 'Edit Milestone' : 'Create Milestone'}</h5>
                  <button type="button" className="btn-close" onClick={() => setMilestoneModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3"><label className="form-label smaller fw-bold">Milestone Title</label><input name="title" className="form-control" defaultValue={editingMilestone?.title} required /></div>
                  <div className="mb-3"><label className="form-label smaller fw-bold">Target Date</label><input name="dueDate" type="date" className="form-control" defaultValue={editingMilestone?.dueDate} required /></div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setMilestoneModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-dark fw-bold">{editingMilestone ? 'Update Milestone' : 'Add Milestone'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {isMemberModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleMemberSubmit}>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold">{editingMember ? 'Change Project Role' : 'Add Project Member'}</h5>
                  <button type="button" className="btn-close" onClick={() => setMemberModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  {!editingMember && (
                    <div className="mb-3">
                      <label className="form-label smaller fw-bold">Select User</label>
                      <select name="userId" className="form-select">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                      </select>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label smaller fw-bold">Internal Project Role</label>
                    <select name="roleInProject" className="form-select" defaultValue={editingMember?.roleInProject}>
                      <option value="MEMBER">Team Member</option>
                      <option value="QA">Quality Assurance</option>
                      <option value="VIEWER">Observer/Viewer</option>
                      <option value="PM">Associate PM</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setMemberModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold">{editingMember ? 'Update Role' : 'Assign to Team'}</button>
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
