import React, { useState, useMemo } from 'react';
import { Task, Project, TaskType, User, TaskStatus, Milestone, Permission } from '../../types';
import WeeklyTaskInsights from './WeeklyTaskInsights';
import { useAuth } from '../../context/AuthContext';
import TaskDetailsModal from '../../components/TaskDetailsModal';
import { useForm } from '../../hooks/useForm';
import FormField from '../../components/FormField';

interface TasksPageProps {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  milestones: Milestone[];
  projects: Project[];
  taskTypes: TaskType[];
  users: User[];
  crud: any;
  currentUser: User;
}

const TasksPage: React.FC<TasksPageProps> = ({ 
  tasks, projects, taskTypes, users, milestones, crud, currentUser 
}) => {
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'insights'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string | 'all'>('all');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const validationSchema = {
    projectId: {
      required: true,
      message: 'Please select a project.'
    },
    title: {
      required: true,
      message: 'Task title is required.'
    },
    dueDate: {
      required: true,
      message: 'Due date is required.'
    }
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm
  } = useForm({
    initialValues: {
      projectId: '',
      milestoneId: '',
      title: '',
      description: '',
      priority: 'medium',
      status: TaskStatus.TODO,
      dueDate: '',
      taskTypeId: taskTypes[0]?.id.toString() || '',
      assignee: currentUser.id.toString()
    },
    validationSchema,
    onSubmit: async (formData) => {
      await crud.add({
        projectId: Number(formData.projectId),
        milestoneId: formData.milestoneId ? Number(formData.milestoneId) : undefined,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status as TaskStatus,
        dueDate: formData.dueDate,
        taskTypeId: Number(formData.taskTypeId),
        assignees: [Number(formData.assignee)]
      });
      setModalOpen(false);
    }
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesProject && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, projectFilter, priorityFilter]);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return <span className="badge bg-success-subtle text-success px-2 py-1 small fw-bold">done</span>;
      case TaskStatus.IN_PROGRESS: return <span className="badge bg-primary-subtle text-primary px-2 py-1 small fw-bold">in progress</span>;
      case TaskStatus.BLOCKED: return <span className="badge bg-danger-subtle text-danger px-2 py-1 small fw-bold">blocked</span>;
      default: return <span className="badge bg-secondary-subtle text-secondary px-2 py-1 small fw-bold">todo</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = { high: 'bg-danger text-white', medium: 'bg-warning text-dark', low: 'bg-info text-white' };
    return <span className={`badge ${colors[priority] || 'bg-secondary'} px-2 py-1 small fw-bold ms-1`}>{priority.toUpperCase()}</span>;
  };

  const handleOpenNewTask = () => {
    resetForm();
    setModalOpen(true);
  };

  return (
    <div className="tasks-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Task Management</h2>
          <p className="text-secondary small mb-0">Browse tasks or view weekly performance insights</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group bg-white shadow-sm p-1 rounded-3">
            <button 
              className={`btn btn-sm px-3 ${viewMode === 'list' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="bi bi-list-ul me-2"></i>List View
            </button>
            <button 
              className={`btn btn-sm px-3 ${viewMode === 'insights' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setViewMode('insights')}
            >
              <i className="bi bi-bar-chart-line me-2"></i>Weekly Insights
            </button>
          </div>
          {hasPermission(Permission.MANAGE_TASKS) && (
            <button className="btn btn-primary btn-sm fw-bold px-3 shadow-sm" onClick={handleOpenNewTask}>
              <i className="bi bi-plus-lg me-2"></i>New Task
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
            <div className="row g-3">
              <div className="col-lg-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                  <input 
                    type="text" 
                    className="form-control bg-light border-start-0" 
                    placeholder="Search tasks..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-2">
                <select className="form-select form-select-sm fw-semibold" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  <option value="all">Any Status</option>
                  <option value={TaskStatus.TODO}>To Do</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.BLOCKED}>Blocked</option>
                  <option value={TaskStatus.DONE}>Completed</option>
                </select>
              </div>
              <div className="col-lg-3">
                <select className="form-select form-select-sm fw-semibold" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                  <option value="all">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="col-lg-3">
                <select className="form-select form-select-sm fw-semibold" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="all">Any Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Task Details</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">No tasks found matching your criteria.</td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => (
                      <tr key={task.id} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                        <td className="ps-4">
                          <div className="fw-bold text-dark">{task.title}</div>
                          <div className="smaller text-muted text-truncate" style={{ maxWidth: '250px' }}>{task.description}</div>
                        </td>
                        <td>{getStatusBadge(task.status)}</td>
                        <td>{getPriorityBadge(task.priority)}</td>
                        <td><span className="badge bg-light text-dark border fw-normal">{projects.find(p => p.id === task.projectId)?.name}</span></td>
                        <td className="small text-secondary fw-semibold"><i className="bi bi-calendar3 me-1"></i> {task.dueDate}</td>
                        <td className="text-end pe-4">
                          {hasPermission(Permission.MANAGE_TASKS) && (
                            <button className="btn btn-sm btn-light text-danger" onClick={(e) => { e.stopPropagation(); crud.delete(task.id); }}><i className="bi bi-trash"></i></button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <WeeklyTaskInsights tasks={tasks} users={users} projects={projects} />
      )}
      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 bg-white shadow-lg overflow-hidden">
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header pt-4 px-4 bg-white border-0">
                  <h5 className="modal-title fw-bold">Create New Task</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <FormField
                        label="Project *"
                        name="projectId"
                        type="select"
                        value={values.projectId}
                        onChange={handleChange}
                        error={errors.projectId}
                        options={[
                          { label: 'Select Project...', value: '' },
                          ...projects.map(p => ({ label: p.name, value: p.id.toString() }))
                        ]}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField
                        label="Milestone"
                        name="milestoneId"
                        type="select"
                        value={values.milestoneId}
                        onChange={handleChange}
                        options={[
                          { label: 'Select Milestone...', value: '' },
                          ...milestones.map(m => ({ label: m.title, value: m.id.toString() }))
                        ]}
                      />
                    </div>
                    <div className="col-12">
                      <FormField
                        label="Task Title *"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        error={errors.title}
                        placeholder="What needs to be done?"
                      />
                    </div>
                    <div className="col-12">
                      <FormField
                        label="Description"
                        name="description"
                        type="textarea"
                        value={values.description}
                        onChange={handleChange}
                        placeholder="Provide details..."
                        rows={3}
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Priority"
                        name="priority"
                        type="select"
                        value={values.priority}
                        onChange={handleChange}
                        options={[
                          { label: 'Low', value: 'low' },
                          { label: 'Medium', value: 'medium' },
                          { label: 'High', value: 'high' }
                        ]}
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Status"
                        name="status"
                        type="select"
                        value={values.status}
                        onChange={handleChange}
                        options={[
                          { label: 'To Do', value: 'todo' },
                          { label: 'In Progress', value: 'in_progress' },
                          { label: 'Blocked', value: 'blocked' },
                          { label: 'Completed', value: 'done' }
                        ]}
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Task Type"
                        name="taskTypeId"
                        type="select"
                        value={values.taskTypeId}
                        onChange={handleChange}
                        options={taskTypes.map(tt => ({ label: tt.name, value: tt.id.toString() }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <FormField
                        label="Due Date *"
                        name="dueDate"
                        type="date"
                        value={values.dueDate}
                        onChange={handleChange}
                        error={errors.dueDate}
                      />
                    </div>
                    <div className="col-md-8">
                      <FormField
                        label="Assignee"
                        name="assignee"
                        type="select"
                        value={values.assignee}
                        onChange={handleChange}
                        options={users.map(u => ({ label: u.name, value: u.id.toString() }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-white border-0 pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
                    ) : (
                      'Create Task'
                    )}
                  </button>
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
          onUpdateStatus={crud.update}
        />
      )}
    </div>
  );
};

export default TasksPage;
