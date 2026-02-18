
import React, { useState, useCallback, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
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
  // Global User Session
  // @google/genai guidelines: Use the User interface and ensure role property matches UserRole enum
  const [currentUser] = useState<User>({
    id: 1, 
    name: 'Alex Thompson', 
    username: 'alex_admin',
    email: 'alex@grehasoft.com', 
    role: UserRole.SUPER_ADMIN, 
    departmentId: 1, 
    status: 'active'
  });

  // Master Data
  const [roles, setRoles] = useState<Role[]>([
    { id: 1, name: 'SUPER_ADMIN', description: 'Total system access' },
    { id: 2, name: 'PROJECT_MANAGER', description: 'Manage projects and teams' },
    { id: 3, name: 'TEAM_MEMBER', description: 'Task execution' },
    { id: 4, name: 'SALES_MANAGER', description: 'Manage sales pipeline' },
    { id: 5, name: 'SALES_EXECUTIVE', description: 'Lead conversion' },
    { id: 6, name: 'CLIENT', description: 'External project view' }
  ]);

  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: 'Development', description: 'Core software engineering' },
    { id: 2, name: 'SEO & Marketing', description: 'Digital growth team' },
    { id: 3, name: 'Sales', description: 'Revenue generation' }
  ]);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([
    { id: 1, name: 'Development' }, { id: 2, name: 'SEO' }, { id: 3, name: 'Design' }
  ]);

  // @google/genai guidelines: Update users array to use the role property instead of roleId
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Alex Thompson', username: 'alex_admin', email: 'alex@grehasoft.com', role: UserRole.SUPER_ADMIN, departmentId: 1, status: 'active' },
    { id: 2, name: 'Sarah PM', username: 'sarah_pm', email: 'sarah@grehasoft.com', role: UserRole.PROJECT_MANAGER, departmentId: 1, status: 'active' },
    { id: 3, name: 'John Dev', username: 'john_dev', email: 'john@grehasoft.com', role: UserRole.TEAM_MEMBER, departmentId: 1, status: 'active' }
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: 'John Client', email: 'john@acme.com', phone: '555-0199', companyName: 'Acme Corp', address: '123 Business St', createdAt: '2024-01-01' }
  ]);

  // Operational Data
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

  // Helpers
  const logActivity = (projectId: number, action: string, taskId?: string) => {
    setActivityLogs(prev => [{
      id: Date.now(),
      userId: currentUser.id,
      projectId,
      taskId,
      action,
      createdAt: new Date().toLocaleString()
    }, ...prev]);
  };

  // AUTO-CALCULATION LOGIC
  const runAutoCalculations = useCallback(() => {
    const updatedMilestones = milestones.map(ms => {
      const msTasks = tasks.filter(t => t.milestoneId === ms.id);
      if (msTasks.length === 0) return { ...ms, progress: 0, status: 'pending' as const };
      
      const doneCount = msTasks.filter(t => t.status === TaskStatus.DONE).length;
      const progress = Math.round((doneCount / msTasks.length) * 100);
      const newStatus = progress === 100 ? ('completed' as const) : ('pending' as const);
      
      return { ...ms, progress, status: newStatus };
    });

    const updatedProjects = projects.map(proj => {
      const projTasks = tasks.filter(t => t.projectId === proj.id);
      if (projTasks.length === 0) return proj;
      
      const doneCount = projTasks.filter(t => t.status === TaskStatus.DONE).length;
      const progress = Math.round((doneCount / projTasks.length) * 100);
      
      return proj.progress !== progress ? { ...proj, progress } : proj;
    });

    if (JSON.stringify(updatedMilestones) !== JSON.stringify(milestones)) setMilestones(updatedMilestones);
    if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) setProjects(updatedProjects);
  }, [tasks, milestones, projects]);

  useEffect(() => {
    runAutoCalculations();
  }, [tasks]);

  // CRUD Implementations
  const handleCRUD = (setter: any, data: any[], domain?: string) => ({
    add: (item: any) => {
      const newId = Date.now();
      const newItem = { ...item, id: domain === 'tasks' ? String(newId) : newId };
      setter((prev: any[]) => [...prev, newItem]);
      if (item.projectId) {
        logActivity(item.projectId, `Added new ${domain?.slice(0, -1) || 'item'}: ${item.title || item.name || ''}`);
      }
    },
    update: (id: number | string, updates: any) => {
      setter((prev: any[]) => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    },
    delete: (id: number | string) => {
      const itemToDelete = data.find(i => i.id === id);
      setter((prev: any[]) => prev.filter(i => i.id !== id));
      if (itemToDelete?.projectId) {
        logActivity(itemToDelete.projectId, `Deleted ${domain?.slice(0, -1) || 'item'}: ${itemToDelete.title || itemToDelete.name || ''}`);
      }
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
    <Router>
      <Layout user={currentUser}>
        <Routes>
          <Route path="/" element={<Dashboard projects={projects} />} />
          <Route path="/projects" element={<ProjectsPage projects={projects} users={users} departments={departments} clients={clients} crud={projectCrud} />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage 
            projects={projects} tasks={tasks} users={users} departments={departments} milestones={milestones}
            members={projectMembers} activity={activityLogs} projectCrud={projectCrud} milestoneCrud={milestoneCrud} 
            memberCrud={memberCrud} taskCrud={taskCrud} taskTypes={taskTypes} 
            taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={currentUser}
          />} />
          <Route path="/projects/:id/kanban" element={<ProjectKanbanPage
            projects={projects} tasks={tasks} setTasks={setTasks} milestones={milestones} users={users}
            crud={taskCrud} taskTypes={taskTypes} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={currentUser}
          />} />
          <Route path="/tasks" element={<TasksPage 
            tasks={tasks} setTasks={setTasks} milestones={milestones} projects={projects} taskTypes={taskTypes} users={users}
            crud={taskCrud} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={{}} reviewCrud={{}} currentUser={currentUser}
          />} />
          <Route path="/clients" element={<ClientsPage clients={clients} crud={clientCrud} />} />
          <Route path="/crm" element={<LeadsPage leads={[]} crud={{}} />} />
          <Route path="/seo" element={<SEOPage />} />
          <Route path="/admin/users" element={<UsersPage users={users} roles={roles} departments={departments} crud={userCrud} />} />
          <Route path="/admin/roles" element={<RolesPage roles={roles} crud={roleCrud} />} />
          <Route path="/admin/departments" element={<DepartmentsPage departments={departments} crud={deptCrud} />} />
          <Route path="/admin/task-types" element={<TaskTypesPage taskTypes={taskTypes} crud={taskTypeCrud} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
