
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import KanbanBoard from '../../components/KanbanBoard';
import TaskDetailsModal from '../../components/TaskDetailsModal';
import { Task, Project, TaskType, User, TaskStatus, Milestone, TaskFile, TaskReview } from '../../types';
import axiosInstance from '../../api/axiosInstance';

interface ProjectKanbanPageProps {
  projects: Project[];
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  users: User[];
  milestones: Milestone[];
  crud: any;
  taskTypes: TaskType[];
  currentUser: User;
}

const ProjectKanbanPage: React.FC<ProjectKanbanPageProps> = ({ 
  projects: initialProjects, tasks: initialTasks, setTasks, users, milestones: initialMilestones, crud, taskTypes, currentUser 
}) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [projRes, tasksRes, milestonesRes] = await Promise.all([
          axiosInstance.get(`/projects/${id}`),
          axiosInstance.get(`/projects/${id}/tasks`),
          axiosInstance.get(`/projects/${id}/milestones`),
        ]);
        setProject(projRes.data);
        setProjectTasks(tasksRes.data);
        setProjectMilestones(milestonesRes.data);
      } catch (error) {
        console.error("Error fetching kanban data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary" role="status"></div><p className="mt-2">Loading board...</p></div>;
  if (!project) return <div className="p-5 text-center"><h3>Project not found</h3><Link to="/projects">Back to list</Link></div>;

  const handleTasksReorder = async (newTasks: Task[]) => {
    setProjectTasks(newTasks);
    try {
      await axiosInstance.post('/tasks/reorder', { taskIds: newTasks.map(t => t.id) });
    } catch (error) {
      console.error("Error reordering tasks:", error);
    }
  };

  const handleTaskUpdate = async (taskId: string | number, updates: Partial<Task>) => {
    try {
      const res = await axiosInstance.patch(`/tasks/${taskId}`, updates);
      setProjectTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(res.data);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleNewTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    try {
      const res = await axiosInstance.post('/tasks', payload);
      setProjectTasks(prev => [...prev, res.data]);
      setModalOpen(false);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  return (
    <div className="kanban-page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Work Board</h2>
          <p className="text-secondary small mb-0">Sprint management for <strong>{project.name}</strong></p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/projects/${project.id}`} className="btn btn-outline-secondary btn-sm fw-bold px-3 shadow-sm bg-white border">Back to Project</Link>
          <button className="btn btn-primary fw-bold btn-sm px-3 shadow-sm" onClick={() => setModalOpen(true)}>
            <i className="bi bi-plus-lg me-2"></i>New Task
          </button>
        </div>
      </div>

      <KanbanBoard 
        tasks={projectTasks} 
        onTaskUpdate={handleTaskUpdate} 
        onTasksReorder={handleTasksReorder} 
        onTaskClick={setSelectedTask} 
      />

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 bg-white shadow-lg overflow-hidden">
              <form onSubmit={handleNewTaskSubmit}>
                <div className="modal-header pt-4 px-4 bg-white border-0">
                  <h5 className="modal-title fw-bold">Add Task to {project.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Milestone</label>
                      <select name="milestoneId" className="form-select bg-light border-0">
                        <option value="">Select Milestone...</option>
                        {projectMilestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Task Title *</label>
                      <input name="title" className="form-control" required placeholder="What needs to be done?" />
                    </div>
                    <div className="col-12">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Description</label>
                      <textarea name="description" className="form-control" rows={3} placeholder="Provide details..."></textarea>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Priority</label>
                      <select name="priority" className="form-select">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Status</label>
                      <select name="status" className="form-select">
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Completed</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Task Type</label>
                      <select name="taskTypeId" className="form-select">
                        {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Due Date</label>
                      <input name="dueDate" type="date" className="form-control" required />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label smaller fw-bold uppercase text-secondary">Assignee</label>
                      <select name="assignee" className="form-select">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-white border-0 pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Create Task</button>
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
          onUpdateStatus={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default ProjectKanbanPage;
