
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Task, User, Department, Milestone, ProjectMember, ActivityLog, TaskStatus, TaskType, ProjectStatus, TaskFile, TaskReview } from '../../types';
import TaskDetailsModal from '../../components/TaskDetailsModal';
import axiosInstance from '../../api/axiosInstance';
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import { getResults } from '@/utils/apiHelper';
import { getClientDisplayName } from '../../utils/clientDisplay';
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
  currentUser: User;
}

const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ 
  projects: initialProjects, tasks: initialTasks, users, departments, milestones: initialMilestones, 
  members: initialMembers, activity: initialActivity, projectCrud, milestoneCrud, memberCrud, taskCrud, taskTypes,
  currentUser 
}) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectActivity, setProjectActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
const [taskErrors, setTaskErrors] = useState<any>({});
const [milestoneErrors, setMilestoneErrors] = useState<any>({});

const validateTask = (fd: FormData) => {
  let errors: any = {};

  const title = fd.get("title")?.toString().trim();
  const description = fd.get("description")?.toString().trim();
  const dueDate = fd.get("dueDate")?.toString();
  const assignee = fd.get("assignee");
  const taskTypeId = fd.get("taskTypeId");
  const priority = fd.get("priority");
  const status = fd.get("status");

  if (!title) {
    errors.title = "Task title is required";
  } else if (title.length < 3) {
    errors.title = "Task title must be at least 3 characters";
  }

  if (!description) {
    errors.description = "Description is required";
  }
  
  if (!taskTypeId) {
    errors.taskTypeId = "Task type is required";
  }
  
  if (!priority) {
    errors.priority = "Priority is required";
  }
  
  if (!status) {
    errors.status = "Status is required";
  }

  if (!dueDate) {
    errors.dueDate = "Due date is required";
  } else {
    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.dueDate = "Due date cannot be in the past";
    }
  }

  if (!assignee) {
    errors.assignee = "Assignee is required";
  }

  setTaskErrors(errors);
  return Object.keys(errors).length === 0;
};

const validateMilestone = (fd: FormData) => {
  let errors: any = {};
  const title = fd.get("title")?.toString().trim();
  const dueDate = fd.get("dueDate")?.toString();

  if (!title) {
    errors.title = "Milestone title is required";
  } else if (title.length < 3) {
    errors.title = "Milestone title must be at least 3 characters";
  }

  if (!dueDate) {
    errors.dueDate = "Target date is required";
  } else {
    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.dueDate = "Target date cannot be in the past";
    } else if (project?.endDate) {
      const projectEnd = new Date(project.endDate);
      projectEnd.setHours(0, 0, 0, 0);
      if (selectedDate > projectEnd) {
        errors.dueDate = "Target date cannot be greater than project end date";
      }
    }
  }

  setMilestoneErrors(errors);
  return Object.keys(errors).length === 0;
};

useEffect(() => {
  const fetchData = async () => {
    if (!id) return;

    setLoading(true);

    try {
      // ✅ 1. Fetch project FIRST
      const projRes = await axiosInstance.get(`/projects/${id}/`);
      setProject(projRes.data);

      // ✅ 2. Fetch others separately (do NOT break page if one fails)
      const [tasksRes, milestonesRes, membersRes] =
        await Promise.allSettled([
          axiosInstance.get(`/tasks/?project=${id}`),
          axiosInstance.get(`/milestones/`),
          axiosInstance.get(`/members/`),
        ]);

       if (tasksRes.status === "fulfilled") {
  const normalizedTasks = getResults(tasksRes.value).map((t: any) => ({
    ...t,
    dueDate: t.due_date,
    milestoneId: t.milestone,
    taskTypeId: t.task_type,
  }));
  setProjectTasks(normalizedTasks);
}

     if (milestonesRes.status === "fulfilled")
 setProjectMilestones(
  getResults(milestonesRes.value).filter(
    (m: any) => m.project === Number(id)
  )
);

if (membersRes.status === "fulfilled")
  setProjectMembers(
  getResults(membersRes.value).filter(
    (m: any) => m.project === Number(id)
  )
);

    } catch (error) {
      console.error("Error fetching project:", error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);

useEffect(() => {
  if (!id) return;
  axiosInstance.get(`/project-activity-logs/?project=${id}`)
    .then(res => {
      setProjectActivity(getResults(res));
    })
    .catch(err => console.error(err));
}, [id]);

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary" role="status"></div><p className="mt-2">Loading project details...</p></div>;
  if (!project) return <div className="p-5 text-center"><h3 className="text-muted">Project not found</h3><Link to="/projects">Back to list</Link></div>;

  const handleTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);

  if (!validateTask(fd)) return;

  const payload = {
    project: project.id,
    milestone: fd.get('milestoneId')
      ? Number(fd.get('milestoneId'))
      : null,
    title: fd.get('title'),
    description: fd.get('description'),
    priority: fd.get('priority'),
    status: fd.get('status'),
    due_date: fd.get('dueDate'),
    task_type: Number(fd.get('taskTypeId')),
    assignees: fd.get('assignee')
      ? [Number(fd.get('assignee'))]
      : []
  };
try {
  if (editingTask) {
    const res = await axiosInstance.patch(
      `/tasks/${editingTask.id}/`,
      payload
    );

    const updatedTask = {
      ...res.data,
      dueDate: res.data.due_date,
      milestoneId: res.data.milestone,
      taskTypeId: res.data.task_type,
    };

    setProjectTasks(prev =>
      prev.map(t =>
        t.id === editingTask.id ? updatedTask : t
      )
    );
  } else {
    const res = await axiosInstance.post('/tasks/', payload);

    const newTask = {
      ...res.data,
      dueDate: res.data.due_date,
      milestoneId: res.data.milestone,
      taskTypeId: res.data.task_type,
    };

    setProjectTasks(prev => [...prev, newTask]);
  }

  // ✅ CLOSE MODAL INSIDE TRY
  setTaskModalOpen(false);
  setEditingTask(null);

} catch (error: any) {
  console.error("Error saving task:", error);
  if (error.response?.data) {
    const errors: any = {};
    Object.keys(error.response.data).forEach(key => {
      const fieldMap: any = { due_date: 'dueDate', task_type: 'taskTypeId' };
      const errorField = fieldMap[key] || key;
      errors[errorField] = Array.isArray(error.response.data[key]) ? error.response.data[key][0] : error.response.data[key];
    });
    setTaskErrors(errors);
  }
}};


  const handleMilestoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (!validateMilestone(fd)) return;
    
    const payload = {
      project: project?.id,
      title: fd.get('title'),
      due_date: fd.get('dueDate'),
    };

    try {
      if (editingMilestone) {
        const res = await axiosInstance.patch( `/milestones/${editingMilestone.id}/`, payload);
        setProjectMilestones(prev => prev.map(m => m.id === editingMilestone.id ? res.data : m));
      } else {
        const res = await axiosInstance.post('/milestones/', payload);
        setProjectMilestones(prev => [...prev, res.data]);
      }
      setMilestoneModalOpen(false);
      setEditingMilestone(null);
    } catch (error: any) {
      console.error("Error saving milestone:", error);
      if (error.response?.data) {
        const errors: any = {};
        Object.keys(error.response.data).forEach(key => {
          const fieldMap: any = { due_date: 'dueDate' };
          const errorField = fieldMap[key] || key;
          errors[errorField] = Array.isArray(error.response.data[key]) ? error.response.data[key][0] : error.response.data[key];
        });
        setMilestoneErrors(errors);
      }
    }
  };

  const handleMilestoneToggle = async (milestone: Milestone) => {
    try {
      const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
      const res = await axiosInstance.patch(`/milestones/${milestone.id}/`, { status: newStatus });
      setProjectMilestones(prev => prev.map(m => m.id === milestone.id ? res.data : m));
    } catch (error) {
      console.error("Error toggling milestone status:", error);
    }
  };

  const confirmDeleteMilestone = async () => {
  if (!selectedMilestoneId) return;

  try {
    await axiosInstance.delete(`/milestones/${selectedMilestoneId}/`);
    setProjectMilestones(prev =>
      prev.filter(m => m.id !== selectedMilestoneId)
    );
  } catch (error) {
    console.error("Error deleting milestone:", error);
  }
};

 const handleMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);

  try {
    if (editingMember) {
      // ✅ UPDATE EXISTING MEMBER
      const res = await axiosInstance.patch(
        `/members/${editingMember.id}/`,
        {
          role_in_project: fd.get("roleInProject"),
        }
      );

      setProjectMembers(prev =>
        prev.map(m =>
          m.id === editingMember.id ? res.data : m
        )
      );

    } else {
      // ✅ ADD NEW MEMBER
      const payload = {
        project: project.id,
        user: Number(fd.get("userId")),
        role_in_project: fd.get("roleInProject"),
      };

      const res = await axiosInstance.post("/members/", payload);

      setProjectMembers(prev => [...prev, res.data]);
    }

    setMemberModalOpen(false);
    setEditingMember(null);

  } catch (error) {
    console.error("Error saving member:", error);
  }
};

  const handleMemberDelete = async () => {
  if (!memberToDelete) return;

  try {
    await axiosInstance.delete(`/members/${memberToDelete}/`);
    setProjectMembers(prev =>
      prev.filter(m => m.id !== memberToDelete)
    );
  } catch (error) {
    console.error("Error removing member:", error);
  }

  setMemberToDelete(null);
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
            <p className="text-secondary small mb-0">Client: <span className="fw-semibold text-primary">{getClientDisplayName(project.client)}</span></p>
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
          { label: 'Progress', value: `${project.progress_percentage}%`, icon: 'bi-bullseye', color: 'info' },
          { label: 'Total Tasks', value: projectTasks.length, icon: 'bi-list-task', color: 'dark' },
          { label: 'Completed Tasks', value: projectTasks.filter(t => t.status==='done').length, icon: 'bi-check2-circle', color: 'success' },
          { label: 'Total Milestones', value: projectMilestones.length, icon: 'bi-flag', color: 'secondary' },
          { label: 'Completed Milestones', value: projectMilestones.filter(m => m.status==='completed').length, icon: 'bi-flag-fill', color: 'success' }
        ].map((s, i) => (
          <div className="col-12 col-sm-6 col-md-4 col-xl" key={i}>
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
               <button
  className={`nav-link px-4 py-2 fw-semibold rounded-pill ${
    activeTab === tab
      ? 'bg-primary text-white shadow-sm'
      : 'bg-light text-dark'
  }`}
  onClick={() => setActiveTab(tab)}
>
  {tab}
</button>
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
                  <div className="col-md-6"><div className="p-3 rounded bg-light border-0"><div className="small text-secondary fw-bold uppercase mb-1" style={{fontSize: '0.6rem'}}>Department</div><div className="fw-bold">{departments.find(d => d.id === project.department
                    
                  )?.name || 'N/A'}</div></div></div>
                  <div className="col-md-6"><div className="p-3 rounded bg-light border-0"><div className="small text-secondary fw-bold uppercase mb-1" style={{fontSize: '0.6rem'}}>Project Manager</div><div className="fw-bold">{users.find(u => u.id === project.project_manager)?.name || 'N/A'}</div></div></div>
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
                      <div className="progress-bar bg-success"style={{ width: `${project.progress_percentage}%` }}></div>
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
                <button className="btn btn-primary btn-sm fw-bold px-3" onClick={() => { setEditingTask(null); setTaskErrors({}); setTaskModalOpen(true); }}>
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
                              <button className="btn btn-sm btn-light" onClick={(e) => { e.stopPropagation(); setEditingTask(t); setTaskErrors({}); setTaskModalOpen(true); }}>
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-light text-danger" onClick={(e) => {
  e.stopPropagation();
  setTaskToDelete(t);
}}>
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
                <button className="btn btn-dark btn-sm fw-bold px-3" onClick={() => { setEditingMilestone(null); setMilestoneErrors({}); setMilestoneModalOpen(true); }}>
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
                            onClick={() => handleMilestoneToggle(m)}
                          >
                            <i className={`bi ${m.status === 'completed' ? 'bi-check-lg' : 'bi-circle'}`}></i>
                          </div>
                          <div>
                            <div className={`fw-bold ${m.status === 'completed' ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>{m.title}</div>
                            <div className="smaller text-secondary fw-semibold">Target: {m.dueDate}</div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="small fw-bold text-dark mb-1">{m.progress_percentage}% Complete</div>
                          <div className="btn-group">
                            <button className="btn btn-sm btn-light py-0 px-2" onClick={() => { setEditingMilestone(m); setMilestoneErrors({}); setMilestoneModalOpen(true); }}>
                              <i className="bi bi-pencil smaller"></i>
                            </button>
                            <button className="btn btn-sm btn-light text-danger py-0 px-2" onClick={() => {
  setSelectedMilestoneId(m.id);
  setDeleteModalOpen(true);
}}>
                              <i className="bi bi-trash smaller"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="progress mt-2" style={{height: '6px'}}>
                        <div className={`progress-bar ${m.status === 'completed' ? 'bg-success' : 'bg-primary'}`} style={{ width: `${m.progress_percentage}%` }}></div>
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
  const user = m.user_details;

  return (
    <div className="col-md-4" key={m.id}>
      <div className="card p-3 bg-light border-0 shadow-none d-flex flex-row align-items-center h-100">
        
        <img
          src={`https://i.pravatar.cc/40?u=${m.user}`}
          className="rounded-circle me-3 border shadow-sm"
          alt=""
        />

        <div className="flex-grow-1">
          <div className="fw-bold text-dark small">
            {user?.name}
          </div>

          <div className="text-primary smaller fw-bold uppercase">
            {m.role_in_project}
          </div>
        </div>

        <div className="d-flex flex-column gap-1">
          <button
            className="btn btn-link text-primary p-0 text-decoration-none"
            onClick={() => {
              setEditingMember(m);
              setMemberModalOpen(true);
            }}
          >
            <i className="bi bi-pencil smaller"></i>
          </button>

          <button
            className="btn btn-link text-danger p-0 text-decoration-none"
            onClick={() => setMemberToDelete(m.id)}
          >
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
                <p>No recent activity found.</p>
              ) : (
                projectActivity.map(activity => (
                  <div key={activity.id} className="border-bottom py-2">
                    <strong>{activity.user_name}</strong> {activity.description}
                    <div className="text-muted small">
                      {new Date(activity.created_at).toLocaleString()}
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
              <form onSubmit={handleTaskSubmit} noValidate onChange={(e: any) => {
                if (taskErrors[e.target.name]) {
                  setTaskErrors({ ...taskErrors, [e.target.name]: null });
                }
              }}>
                <div className="modal-header pt-4 px-4 bg-white border-0">
                  <h5 className="modal-title fw-bold text-dark">{editingTask ? 'Edit Task' : 'New Project Task'}</h5>
                  <button type="button" className="btn-close" onClick={() => setTaskModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-12"><label className="form-label smaller fw-bold uppercase text-secondary">Task Title *</label><input name="title" className={`form-control ${taskErrors.title ? 'is-invalid' : ''}`} defaultValue={editingTask?.title} />{taskErrors.title && (
  <div className="invalid-feedback">{taskErrors.title}</div>
)}</div>
                    <div className="col-12"><label className="form-label smaller fw-bold uppercase text-secondary">Description *</label><textarea name="description" className={`form-control ${taskErrors.description ? 'is-invalid' : ''}`} rows={3} defaultValue={editingTask?.description}></textarea>
                    {taskErrors.description && (
                      <div className="invalid-feedback">{taskErrors.description}</div>
                    )}
                    </div>
                    <div className="col-md-6"><label className="form-label smaller fw-bold uppercase text-secondary">Milestone (Optional)</label><select name="milestoneId" className={`form-select ${taskErrors.milestoneId ? 'is-invalid' : ''}`} defaultValue={editingTask?.milestoneId}><option value="">Not linked</option>{projectMilestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
                    {taskErrors.milestoneId && (
                      <div className="invalid-feedback">{taskErrors.milestoneId}</div>
                    )}
                    </div>
                    <div className="col-md-6"><label className="form-label smaller fw-bold uppercase text-secondary">Task Type *</label><select name="taskTypeId" className={`form-select ${taskErrors.taskTypeId ? 'is-invalid' : ''}`} defaultValue={editingTask?.taskTypeId}><option value="">Select type</option>{taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}</select>
                    {taskErrors.taskTypeId && (
                      <div className="invalid-feedback">{taskErrors.taskTypeId}</div>
                    )}
                    </div>
                    <div className="col-md-4"><label className="form-label smaller fw-bold uppercase text-secondary">Priority *</label><select name="priority" className={`form-select ${taskErrors.priority ? 'is-invalid' : ''}`} defaultValue={editingTask?.priority}><option value="">Select priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                    {taskErrors.priority && (
                      <div className="invalid-feedback">{taskErrors.priority}</div>
                    )}
                    </div>
                    <div className="col-md-4"><label className="form-label smaller fw-bold uppercase text-secondary">Status *</label><select name="status" className={`form-select ${taskErrors.status ? 'is-invalid' : ''}`} defaultValue={editingTask?.status || 'todo'}><option value="">Select status</option><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="blocked">Blocked</option><option value="done">Completed</option></select>
                    {taskErrors.status && (
                      <div className="invalid-feedback">{taskErrors.status}</div>
                    )}
                    </div>
                    <div className="col-md-4"><label className="form-label smaller fw-bold uppercase text-secondary">Due Date *</label><input name="dueDate" type="date" className={`form-control ${taskErrors.dueDate ? 'is-invalid' : ''}`} defaultValue={editingTask?.dueDate} />
                    {taskErrors.dueDate && (
                      <div className="invalid-feedback">{taskErrors.dueDate}</div>
                    )}
                    </div>
                    <div className="col-md-12"><label className="form-label smaller fw-bold uppercase text-secondary">Assignee *</label><select name="assignee" className={`form-select ${taskErrors.assignee ? 'is-invalid' : ''}`} defaultValue={editingTask?.assignees?.[0] || ""}><option value="">Select assignee</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                    {taskErrors.assignee && (
                      <div className="invalid-feedback">{taskErrors.assignee}</div>
                    )}
                    </div>
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
              <form onSubmit={handleMilestoneSubmit} noValidate onChange={(e: any) => {
                if (milestoneErrors[e.target.name]) {
                  setMilestoneErrors({ ...milestoneErrors, [e.target.name]: null });
                }
              }}>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold">{editingMilestone ? 'Edit Milestone' : 'Create Milestone'}</h5>
                  <button type="button" className="btn-close" onClick={() => setMilestoneModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3"><label className="form-label smaller fw-bold">Milestone Title *</label><input name="title" className={`form-control ${milestoneErrors.title ? 'is-invalid' : ''}`} defaultValue={editingMilestone?.title} />
                  {milestoneErrors.title && (
                    <div className="invalid-feedback">{milestoneErrors.title}</div>
                  )}
                  </div>
                  <div className="mb-3"><label className="form-label smaller fw-bold">Target Date *</label><input name="dueDate" type="date" className={`form-control ${milestoneErrors.dueDate ? 'is-invalid' : ''}`} defaultValue={editingMilestone?.dueDate} />
                  {milestoneErrors.dueDate && (
                    <div className="invalid-feedback">{milestoneErrors.dueDate}</div>
                  )}
                  </div>
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
                    <select name="roleInProject" className="form-select" defaultValue={editingMember?.role_in_project}>
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
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          users={users} 
          currentUser={currentUser}
          onUpdateStatus={async (id, updates) => {
            const res = await axiosInstance.get(`/tasks/?project=${project.id}`);

const normalized = getResults(res).map((task: any) => ({
  ...task,
  id: Number(task.id),
}));

setProjectTasks(normalized);
          }}
        />
      )}
      <DeleteConfirmModal
  isOpen={deleteModalOpen}
  onClose={() => setDeleteModalOpen(false)}
  onConfirm={confirmDeleteMilestone}
  title="Delete Milestone"
  message="Are you sure you want to delete this milestone?"
/>

<DeleteConfirmModal
  isOpen={!!taskToDelete}
  onClose={() => setTaskToDelete(null)}
  onConfirm={async () => {
    if (!taskToDelete) return;

    try {
      await axiosInstance.delete(`/tasks/${taskToDelete.id}/`);

      setProjectTasks(prev =>
        prev.filter(t => t.id !== taskToDelete.id)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }

    setTaskToDelete(null);
  }}
  title="Delete Task"
  message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
/>



<DeleteConfirmModal
  isOpen={!!memberToDelete}
  title="Remove Member"
  message="Are you sure you want to remove this member from the project?"
  onConfirm={handleMemberDelete}
  onClose={() => setMemberToDelete(null)}
/>
    </div>
  );
};

export default ProjectDetailsPage;
