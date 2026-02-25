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
  tasks,
  projects,
  taskTypes,
  users,
  milestones,
  crud,
  currentUser
}) => {
  const { hasPermission } = useAuth();

  if (!Array.isArray(tasks)) {
    return <div className="p-4">Loading tasks...</div>;
  }

  const [viewMode, setViewMode] = useState<'list' | 'insights'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string | 'all'>('all');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const validationSchema = {
    projectId: { required: true, message: 'Please select a project.' },
    title: { required: true, message: 'Task title is required.' },
    dueDate: { required: true, message: 'Due date is required.' }
  };

  const { values, errors, isSubmitting, handleChange, handleSubmit, resetForm } = useForm({
    initialValues: {
      projectId: '',
      milestoneId: '',
      title: '',
      description: '',
      priority: 'medium',
      status: TaskStatus.TODO,
      dueDate: '',
      taskTypeId: taskTypes?.[0]?.id?.toString() || '',
      assignee: currentUser?.id?.toString() || ''
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
    return tasks
      .filter((task): task is Task => !!task && typeof task.id !== 'undefined')
      .filter(task => {
        const matchesSearch =
          task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesProject && matchesPriority;
      });
  }, [tasks, searchTerm, statusFilter, projectFilter, priorityFilter]);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return <span className="badge bg-success-subtle text-success">Done</span>;
      case TaskStatus.IN_PROGRESS:
        return <span className="badge bg-primary-subtle text-primary">In Progress</span>;
      case TaskStatus.BLOCKED:
        return <span className="badge bg-danger-subtle text-danger">Blocked</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary">To Do</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-danger text-white',
      medium: 'bg-warning text-dark',
      low: 'bg-info text-white'
    };
    return (
      <span className={`badge ${colors[priority] || 'bg-secondary'} ms-1`}>
        {priority?.toUpperCase()}
      </span>
    );
  };

  const handleOpenNewTask = () => {
    resetForm();
    setModalOpen(true);
  };

  return (
    <div className="tasks-container">

      {/* HEADER + VIEW MODE */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Task Management</h2>
          <p className="text-secondary small mb-0">
            Browse tasks or view weekly performance insights
          </p>
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
            <button className="btn btn-primary btn-sm" onClick={handleOpenNewTask}>
              <i className="bi bi-plus-lg me-2"></i>New Task
            </button>
          )}
        </div>
      </div>

      {/* FILTER CARD */}
      {viewMode === 'list' && (
        <>
          <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
            <div className="row g-3">
              <div className="col-lg-4">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="col-lg-2">
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">Any Status</option>
                  <option value={TaskStatus.TODO}>To Do</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.BLOCKED}>Blocked</option>
                  <option value={TaskStatus.DONE}>Completed</option>
                </select>
              </div>

              <div className="col-lg-3">
                <select
                  className="form-select form-select-sm"
                  value={projectFilter}
                  onChange={(e) =>
                    setProjectFilter(
                      e.target.value === 'all' ? 'all' : Number(e.target.value)
                    )
                  }
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-lg-3">
                <select
                  className="form-select form-select-sm"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">Any Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => {
                      const projectName =
                        projects.find(p => p.id === task.projectId)?.name || "Unknown";

                      return (
                        <tr key={task.id}>
                          <td>
                            <div className="fw-bold">{task.title}</div>
                            <div className="small text-muted">{task.description}</div>
                          </td>
                          <td>{getStatusBadge(task.status)}</td>
                          <td>{getPriorityBadge(task.priority)}</td>
                          <td>{projectName}</td>
                          <td>{task.dueDate}</td>
                          <td>
                            {hasPermission(Permission.MANAGE_TASKS) && (
                              <button
                                className="btn btn-sm btn-light text-danger"
                                onClick={() => crud.delete(task.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewMode === 'insights' && (
        <WeeklyTaskInsights tasks={tasks} users={users} projects={projects} />
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