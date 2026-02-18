
import React, { useState, useCallback, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/dashboard/Dashboard';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage';
import ProjectKanbanPage from './pages/projects/ProjectKanbanPage';
import TasksPage from './pages/tasks/TasksPage';
import LeadsPage from './pages/crm/LeadsPage';
import ClientsPage from './pages/clients/ClientsPage';
import SEOPage from './pages/seo/SEOPage';
import UsersPage from './pages/admin/users/UsersPage';
import RolesPage from './pages/admin/roles/RolesPage';
import DepartmentsPage from './pages/admin/departments/DepartmentsPage';
import TaskTypesPage from './pages/admin/task-types/TaskTypesPage';
import { UserRole, TaskStatus, Task, Project, Lead, ProjectStatus, User, Department, TaskType, Milestone, Client, Role, ProjectMember, ActivityLog, TaskFile, TaskReview } from './types';

const App: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([
    { id: 1, name: 'SUPER_ADMIN', description: 'Full administrative access to all modules.', createdAt: '2024-01-01' },
    { id: 2, name: 'PROJECT_MANAGER', description: 'Manage projects, teams, and task workflows.', createdAt: '2024-01-01' },
    { id: 3, name: 'TEAM_MEMBER', description: 'Execute assigned tasks and update progress.', createdAt: '2024-01-01' },
    { id: 4, name: 'SALES_MANAGER', description: 'Oversee leads and sales performance.', createdAt: '2024-01-01' },
    { id: 5, name: 'SALES_EXECUTIVE', description: 'Lead generation and prospect follow-ups.', createdAt: '2024-01-01' },
    { id: 6, name: 'CLIENT', description: 'External visibility into project timelines.', createdAt: '2024-01-01' }
  ]);

  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: 'Software Development', createdAt: '2024-01-01' },
    { id: 2, name: 'Frontend Engineering', parentId: 1, createdAt: '2024-01-05' },
    { id: 3, name: 'Backend Engineering', parentId: 1, createdAt: '2024-01-05' },
    { id: 4, name: 'Digital Marketing', createdAt: '2024-01-10' },
    { id: 5, name: 'SEO Services', parentId: 4, createdAt: '2024-01-12' }
  ]);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([
    { id: 1, name: 'DEV', description: 'Core software development and engineering tasks.', createdAt: '2024-01-01' },
    { id: 2, name: 'SEO', description: 'Search engine optimization and visibility tasks.', createdAt: '2024-01-01' },
    { id: 3, name: 'DESIGN', description: 'UI/UX and creative asset production.', createdAt: '2024-01-01' },
    { id: 4, name: 'ADS', description: 'Paid marketing campaigns and advertisement management.', createdAt: '2024-01-01' }
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Alex Thompson', username: 'alex_admin', email: 'alex@grehasoft.com', role: UserRole.SUPER_ADMIN, departmentId: 1, status: 'active' },
    { id: 2, name: 'Sarah PM', username: 'sarah_pm', email: 'sarah@grehasoft.com', role: UserRole.PROJECT_MANAGER, departmentId: 1, status: 'active' },
    { id: 3, name: 'John Employee', username: 'john_emp', email: 'john@grehasoft.com', role: UserRole.TEAM_MEMBER, departmentId: 1, status: 'active' }
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: 'John Client', email: 'john@acme.com', phone: '555-0199', companyName: 'Acme Corp', address: '123 Business St', createdAt: '2024-01-01' }
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: 101, name: 'Enterprise Portal', clientId: 1, clientName: 'Acme Corp', departmentId: 1, projectManagerId: 1, startDate: '2024-01-01', endDate: '2024-12-31', status: ProjectStatus.IN_PROGRESS, progress: 35 }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', projectId: 101, title: 'API Integration', description: 'Connect backend services', priority: 'high', status: TaskStatus.IN_PROGRESS, boardOrder: 0, dueDate: '2024-06-01', assignees: [3], taskTypeId: 1, milestoneId: 1 }
  ]);

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, projectId: 101, title: 'Backend Core Foundation', dueDate: '2024-05-15', status: 'pending', progress: 0 }
  ]);

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([
    { id: 1, projectId: 101, userId: 1, roleInProject: 'PM', addedAt: '2024-01-01' },
    { id: 2, projectId: 101, userId: 3, roleInProject: 'MEMBER', addedAt: '2024-01-05' }
  ]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: 1, userId: 1, projectId: 101, action: 'Initialized enterprise project architecture', createdAt: '2024-01-01 10:00' }
  ]);

  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
  const [taskReviews, setTaskReviews] = useState<TaskReview[]>([]);

  const runAutoCalculations = useCallback(() => {
    const updatedMilestones: Milestone[] = milestones.map(ms => {
      const msTasks = tasks.filter(t => t.milestoneId === ms.id);
      if (msTasks.length === 0) return { ...ms, progress: 0, status: 'pending' as const };
      const doneCount = msTasks.filter(t => t.status === TaskStatus.DONE).length;
      const progress = Math.round((doneCount / msTasks.length) * 100);
      return { ...ms, progress, status: (progress === 100 ? 'completed' : 'pending') as 'completed' | 'pending' };
    });

    const updatedProjects = projects.map(proj => {
      const projTasks = tasks.filter(t => t.projectId === proj.id);
      if (projTasks.length === 0) return proj;
      const doneCount = projTasks.filter(t => t.status === TaskStatus.DONE).length;
      const progress = Math.round((doneCount / projTasks.length) * 100);
      return { ...proj, progress };
    });

    if (JSON.stringify(updatedMilestones) !== JSON.stringify(milestones)) setMilestones(updatedMilestones);
    if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) setProjects(updatedProjects);
  }, [tasks, milestones, projects]);

  useEffect(() => {
    runAutoCalculations();
  }, [tasks]);

  const handleCRUD = (setter: any, data: any[], domain?: string) => ({
    add: (item: any) => {
      const newId = Date.now();
      const newItem = { 
        ...item, 
        id: domain === 'tasks' ? String(newId) : newId,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setter((prev: any[]) => [...prev, newItem]);
    },
    update: (id: number | string, updates: any) => {
      setter((prev: any[]) => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : i));
    },
    delete: (id: number | string) => {
      setter((prev: any[]) => prev.filter(i => i.id !== id));
    }
  });

  const projectCrud = handleCRUD(setProjects, projects, 'projects');
  const taskCrud = handleCRUD(setTasks, tasks, 'tasks');
  const userCrud = handleCRUD(setUsers, users, 'users');
  const roleCrud = handleCRUD(setRoles, roles, 'roles');
  const deptCrud = handleCRUD(setDepartments, departments, 'departments');
  const taskTypeCrud = handleCRUD(setTaskTypes, taskTypes, 'task-types');
  const clientCrud = handleCRUD(setClients, clients, 'clients');
  const milestoneCrud = handleCRUD(setMilestones, milestones, 'milestones');
  const memberCrud = handleCRUD(setProjectMembers, projectMembers, 'members');

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard projects={projects} /></Layout></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.CLIENT]}><Layout><ProjectsPage projects={projects} users={users} departments={departments} clients={clients} crud={projectCrud} /></Layout></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><Layout><ProjectDetailsPage projects={projects} tasks={tasks} users={users} departments={departments} milestones={milestones} members={projectMembers} activity={activityLogs} projectCrud={projectCrud} milestoneCrud={milestoneCrud} memberCrud={memberCrud} taskCrud={taskCrud} taskTypes={taskTypes} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={users[0]} /></Layout></ProtectedRoute>} />
          <Route path="/projects/:id/kanban" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER]}><Layout><ProjectKanbanPage projects={projects} tasks={tasks} setTasks={setTasks} milestones={milestones} users={users} crud={taskCrud} taskTypes={taskTypes} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={users[0]} /></Layout></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER]}><Layout><TasksPage tasks={tasks} setTasks={setTasks} milestones={milestones} projects={projects} taskTypes={taskTypes} users={users} crud={taskCrud} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={users[0]} /></Layout></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.SALES_MANAGER]}><Layout><ClientsPage clients={clients} crud={clientCrud} /></Layout></ProtectedRoute>} />
          <Route path="/crm" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE]}><Layout><LeadsPage leads={[]} crud={{}} /></Layout></ProtectedRoute>} />
          <Route path="/seo" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER]}><Layout><SEOPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><Layout><UsersPage users={users} roles={roles} departments={departments} crud={userCrud} /></Layout></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><Layout><RolesPage roles={roles} crud={roleCrud} /></Layout></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><Layout><DepartmentsPage departments={departments} crud={deptCrud} /></Layout></ProtectedRoute>} />
          <Route path="/admin/task-types" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><Layout><TaskTypesPage taskTypes={taskTypes} crud={taskTypeCrud} /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
