
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
import { UserRole, TaskStatus, Task, Project, Lead, ProjectStatus, User, Department, TaskType, Milestone, Client, Role, ProjectMember, ActivityLog, TaskFile, TaskReview, Permission } from './types';
import axiosInstance from './api/axiosInstance';

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

  const [leads, setLeads] = useState<Lead[]>([]);

  const [projects, setProjects] = useState<Project[]>([
    { id: 101, name: 'Enterprise Portal', clientId: 1, clientName: 'Acme Corp', departmentId: 1, projectManagerId: 1, createdBy: 1, startDate: '2024-01-01', endDate: '2024-12-31', status: ProjectStatus.IN_PROGRESS, progressPercentage: 35, createdAt: '2024-01-01' }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', projectId: 101, title: 'API Integration', description: 'Connect backend services', priority: 'high', status: TaskStatus.DONE, boardOrder: 0, dueDate: '2026-02-16', assignees: [3], taskTypeId: 1, milestoneId: 1 },
    { id: '2', projectId: 101, title: 'Database Schema Design', description: 'Design MySQL schema', priority: 'high', status: TaskStatus.IN_PROGRESS, boardOrder: 1, dueDate: '2026-02-17', assignees: [1], taskTypeId: 1, milestoneId: 1 },
    { id: '3', projectId: 101, title: 'UI Mockups', description: 'Create Figma designs', priority: 'medium', status: TaskStatus.DONE, boardOrder: 2, dueDate: '2026-02-18', assignees: [2], taskTypeId: 3, milestoneId: 1 },
    { id: '4', projectId: 101, title: 'SEO Audit', description: 'Keyword research', priority: 'low', status: TaskStatus.TODO, boardOrder: 3, dueDate: '2026-02-19', assignees: [3], taskTypeId: 2, milestoneId: 1 },
    { id: '5', projectId: 101, title: 'Bug Fixing', description: 'Fix login issues', priority: 'high', status: TaskStatus.BLOCKED, boardOrder: 4, dueDate: '2026-02-20', assignees: [1, 3], taskTypeId: 1, milestoneId: 1 },
    { id: '6', projectId: 101, title: 'Content Strategy', description: 'Plan blog posts', priority: 'medium', status: TaskStatus.IN_PROGRESS, boardOrder: 5, dueDate: '2026-02-21', assignees: [2], taskTypeId: 2, milestoneId: 1 },
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
      const progressPercentage = Math.round((doneCount / projTasks.length) * 100);
      return { ...proj, progressPercentage };
    });

    if (JSON.stringify(updatedMilestones) !== JSON.stringify(milestones)) setMilestones(updatedMilestones);
    if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) setProjects(updatedProjects);
  }, [tasks, milestones, projects]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [usersRes, deptsRes, typesRes, projectsRes, clientsRes, tasksRes, leadsRes] = await Promise.all([
          axiosInstance.get('/users'),
          axiosInstance.get('/departments'),
          axiosInstance.get('/task-types'),
          axiosInstance.get('/projects'),
          axiosInstance.get('/clients'),
          axiosInstance.get('/tasks'),
          axiosInstance.get('/leads')
        ]);
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
        setTaskTypes(typesRes.data);
        setProjects(projectsRes.data);
        setClients(clientsRes.data);
        setTasks(tasksRes.data);
        setLeads(leadsRes.data);
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    runAutoCalculations();
  }, [tasks, runAutoCalculations]);

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

  const projectCrud = {
    add: async (item: any) => {
      try {
        const res = await axiosInstance.post('/projects', item);
        setProjects(prev => [...prev, res.data]);
      } catch (error) {
        console.error("Error adding project:", error);
      }
    },
    update: async (id: number, updates: any) => {
      try {
        const res = await axiosInstance.patch(`/projects/${id}`, updates);
        setProjects(prev => prev.map(p => p.id === id ? res.data : p));
      } catch (error) {
        console.error("Error updating project:", error);
      }
    },
    delete: async (id: number) => {
      try {
        await axiosInstance.delete(`/projects/${id}`);
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const taskCrud = {
    add: async (item: any) => {
      try {
        const res = await axiosInstance.post('/tasks', item);
        setTasks(prev => [...prev, res.data]);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    },
    update: async (id: string | number, updates: any) => {
      try {
        const res = await axiosInstance.patch(`/tasks/${id}`, updates);
        setTasks(prev => prev.map(t => t.id === id ? res.data : t));
      } catch (error) {
        console.error("Error updating task:", error);
      }
    },
    delete: async (id: string | number) => {
      try {
        await axiosInstance.delete(`/tasks/${id}`);
        setTasks(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };
  const userCrud = handleCRUD(setUsers, users, 'users');
  const roleCrud = handleCRUD(setRoles, roles, 'roles');
  const deptCrud = handleCRUD(setDepartments, departments, 'departments');
  const taskTypeCrud = handleCRUD(setTaskTypes, taskTypes, 'task-types');
  const clientCrud = {
    add: async (item: any) => {
      try {
        const res = await axiosInstance.post('/clients', item);
        setClients(prev => [...prev, res.data]);
      } catch (error) {
        console.error("Error adding client:", error);
      }
    },
    update: async (id: number | string, updates: any) => {
      try {
        const res = await axiosInstance.patch(`/clients/${id}`, updates);
        setClients(prev => prev.map(c => c.id === id ? res.data : c));
      } catch (error) {
        console.error("Error updating client:", error);
      }
    },
    delete: async (id: number | string) => {
      try {
        await axiosInstance.delete(`/clients/${id}`);
        setClients(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  const leadCrud = {
    add: async (item: any) => {
      try {
        const res = await axiosInstance.post('/leads', item);
        setLeads(prev => [...prev, res.data]);
      } catch (error) {
        console.error("Error adding lead:", error);
      }
    },
    update: async (id: number | string, updates: any) => {
      try {
        const res = await axiosInstance.patch(`/leads/${id}`, updates);
        setLeads(prev => prev.map(l => l.id === id ? res.data : l));
      } catch (error) {
        console.error("Error updating lead:", error);
      }
    },
    delete: async (id: number | string) => {
      try {
        await axiosInstance.delete(`/leads/${id}`);
        setLeads(prev => prev.filter(l => l.id !== id));
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

  const milestoneCrud = handleCRUD(setMilestones, milestones, 'milestones');
  const memberCrud = handleCRUD(setProjectMembers, projectMembers, 'members');

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute requiredPermission={Permission.VIEW_DASHBOARD}><Layout tasks={tasks}><Dashboard projects={projects} tasks={tasks} /></Layout></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute requiredPermission={Permission.VIEW_PROJECTS}><Layout tasks={tasks}><ProjectsPage projects={projects} users={users} departments={departments} clients={clients} crud={projectCrud} /></Layout></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute requiredPermission={Permission.VIEW_PROJECTS}><Layout tasks={tasks}><ProjectDetailsPage projects={projects} tasks={tasks} users={users} departments={departments} milestones={milestones} members={projectMembers} activity={activityLogs} projectCrud={projectCrud} milestoneCrud={milestoneCrud} memberCrud={memberCrud} taskCrud={taskCrud} taskTypes={taskTypes} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={users[0]} /></Layout></ProtectedRoute>} />
          <Route path="/projects/:id/kanban" element={<ProtectedRoute requiredPermission={Permission.MANAGE_TASKS}><Layout tasks={tasks}><ProjectKanbanPage projects={projects} tasks={tasks} setTasks={setTasks} milestones={milestones} users={users} crud={taskCrud} taskTypes={taskTypes} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={users[0]} /></Layout></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute requiredPermission={Permission.VIEW_TASKS}><Layout tasks={tasks}><TasksPage tasks={tasks} setTasks={setTasks} milestones={milestones} projects={projects} taskTypes={taskTypes} users={users} crud={taskCrud} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={users[0]} /></Layout></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute requiredPermission={Permission.VIEW_CLIENTS}><Layout tasks={tasks}><ClientsPage clients={clients} crud={clientCrud} /></Layout></ProtectedRoute>} />
          <Route path="/crm" element={<ProtectedRoute requiredPermission={Permission.VIEW_LEADS}><Layout tasks={tasks}><LeadsPage leads={leads} crud={leadCrud} users={users} /></Layout></ProtectedRoute>} />
          <Route path="/seo" element={<ProtectedRoute requiredPermission={Permission.VIEW_TASKS}><Layout tasks={tasks}><SEOPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredPermission={Permission.MANAGE_USERS}><Layout tasks={tasks}><UsersPage users={users} roles={roles} departments={departments} crud={userCrud} /></Layout></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}><Layout tasks={tasks}><RolesPage roles={roles} crud={roleCrud} /></Layout></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}><Layout tasks={tasks}><DepartmentsPage departments={departments} crud={deptCrud} /></Layout></ProtectedRoute>} />
          <Route path="/admin/task-types" element={<ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}><Layout tasks={tasks}><TaskTypesPage taskTypes={taskTypes} crud={taskTypeCrud} /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
