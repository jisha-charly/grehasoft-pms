import React, { useState, useMemo } from 'react';
import { Task, Project, TaskType, User, TaskStatus, Milestone, TaskFile, TaskReview } from '../../types';

interface TasksPageProps {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  milestones: Milestone[];
  projects: Project[];
  taskTypes: TaskType[];
  users: User[];
  crud: any;
  taskFiles: TaskFile[];
  taskReviews: TaskReview[];
  fileCrud: any;
  reviewCrud: any;
  currentUser: User;
}

const TasksPage: React.FC<TasksPageProps> = ({ 
  tasks, projects, taskTypes, users, milestones, crud, taskFiles, taskReviews, fileCrud, reviewCrud, currentUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [projectFilter, setProjectFilter] = useState<number | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string | 'all'>('all');

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

  return (
    <div className="tasks-container">
      <div className="mb-4">
        <h2 className="fw-bold mb-1 text-dark">All Tasks</h2>
        <p className="text-secondary small mb-0">Browse and filter tasks across all active projects</p>
      </div>

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
              {filteredTasks.map(task => (
                <tr key={task.id}>
                  <td className="ps-4">
                    <div className="fw-bold text-dark">{task.title}</div>
                    <div className="smaller text-muted text-truncate" style={{ maxWidth: '250px' }}>{task.description}</div>
                  </td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>{getPriorityBadge(task.priority)}</td>
                  <td><span className="badge bg-light text-dark border fw-normal">{projects.find(p => p.id === task.projectId)?.name}</span></td>
                  <td className="small text-secondary fw-semibold"><i className="bi bi-calendar3 me-1"></i> {task.dueDate}</td>
                  <td className="text-end pe-4">
                    <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(task.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;