
import React, { useState, useCallback, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage';
import ProjectKanbanPage from './pages/projects/ProjectKanbanPage';
import TasksPage from './pages/tasks/TasksPage';
import LeadsPage from './pages/crm/LeadsPage';
import ClientsPage from './pages/clients/ClientsPage';
import SEOPage from './pages/seo/SEOPage';
import UsersPage from './pages/admin/UsersPage';
import TaskTypesPage from './pages/admin/TaskTypesPage';
import { UserRole, TaskStatus, Task, Project, Lead, ProjectStatus, User, Department, TaskType, Milestone, ProjectMember, ActivityLog, TaskFile, TaskReview, Client } from './types';

const App: React.FC = () => {
  // Authentication & Master Data
  const [currentUser] = useState<User>({
    id: 1, name: 'Alex Thompson', email: 'alex@grehasoft.com', role: UserRole.SUPER_ADMIN, departmentId: 1, status: 'active'
  });

  const [departments] = useState<Department[]>([
    { id: 1, name: 'IT Support' }, { id: 2, name: 'Development' }, { id: 3, name: 'Marketing' }
  ]);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([
    { id: 1, name: 'Feature' }, { id: 2, name: 'Bug' }, { id: 3, name: 'SEO' }, { id: 4, name: 'Design' }
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Alex Thompson', email: 'alex@grehasoft.com', role: UserRole.SUPER_ADMIN, departmentId: 1, status: 'active' },
    { id: 2, name: 'Sarah Jenkins', email: 'sarah@grehasoft.com', role: UserRole.PROJECT_MANAGER, departmentId: 2, status: 'active' },
    { id: 3, name: 'John Doe', email: 'john@grehasoft.com', role: UserRole.TEAM_MEMBER, departmentId: 2, status: 'active' },
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: 'Robert Fox', email: 'robert@foxmedia.com', phone: '555-0101', companyName: 'Fox Media', gstNo: '27AAACF1234A1Z1', address: '123 Media Ave, Mumbai', createdAt: '2024-01-10' },
    { id: 2, name: 'Jane Doe', email: 'jane@enterprise.com', phone: '555-0202', companyName: 'XYZ Enterprises', address: '456 Business Blvd, Bangalore', createdAt: '2024-02-15' },
  ]);

  // Main States
  const [projects, setProjects] = useState<Project[]>([
    { id: 101, name: 'E-commerce Website Development', clientId: 1, clientName: 'Fox Media', departmentId: 2, projectManagerId: 1, startDate: '2024-01-01', endDate: '2024-06-30', status: ProjectStatus.IN_PROGRESS, progress: 45 },
    { id: 102, name: 'Mobile App Development', clientId: 2, clientName: 'XYZ Enterprises', departmentId: 2, projectManagerId: 2, startDate: '2024-02-10', endDate: '2024-08-30', status: ProjectStatus.IN_PROGRESS, progress: 25 },
  ]);

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, projectId: 101, title: 'Database Design', dueDate: '2024-02-15', status: 'completed' },
    { id: 2, projectId: 101, title: 'API Beta Release', dueDate: '2024-04-10', status: 'pending' },
  ]);

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([
    { id: 1, projectId: 101, userId: 1, roleInProject: 'PM', addedAt: '2024-01-01' },
    { id: 2, projectId: 101, userId: 3, roleInProject: 'MEMBER', addedAt: '2024-01-05' },
  ]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: 1, userId: 1, projectId: 101, action: 'Created project', createdAt: '2024-01-01 10:00' },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', projectId: 101, milestoneId: 1, title: 'Setup Database Schema', description: 'Design MySQL schema and relationships.', priority: 'high', status: TaskStatus.DONE, boardOrder: 0, dueDate: '2024-02-20', assignees: [1], taskTypeId: 1 },
    { id: '2', projectId: 101, milestoneId: 1, title: 'Develop User Authentication', description: 'JWT based login and registration.', priority: 'high', status: TaskStatus.IN_PROGRESS, boardOrder: 0, dueDate: '2024-02-20', assignees: [3], taskTypeId: 1 },
  ]);

  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([
    { id: 1, taskId: '1', uploadedBy: 1, filePath: 'schema_v1.pdf', fileType: 'application/pdf', revisionNo: 1, uploadedAt: '2024-02-15 09:00' }
  ]);

  const [taskReviews, setTaskReviews] = useState<TaskReview[]>([
    { id: 1, taskFileId: 1, reviewerId: 1, reviewedByRole: 'ADMIN', reviewVersion: 1, comments: 'Schema looks good, proceed.', status: 'approved', reviewedAt: '2024-02-15 10:00' }
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    { id: 1, name: 'Robert Fox', email: 'robert@foxmedia.com', phone: '555-0101', source: 'LinkedIn', status: 'qualified', createdAt: '2024-05-15' },
  ]);

  // AUTO-CALCULATION LOGIC
  const runAutoCalculations = useCallback(() => {
    const updatedMilestones = milestones.map(ms => {
      const msTasks = tasks.filter(t => t.milestoneId === ms.id);
      if (msTasks.length === 0) return ms;
      const allDone = msTasks.every(t => t.status === TaskStatus.DONE);
      const newStatus: 'pending' | 'completed' = allDone ? 'completed' : 'pending';
      return ms.status !== newStatus ? { ...ms, status: newStatus } : ms;
    });

    const updatedProjects = projects.map(proj => {
      const projMilestones = updatedMilestones.filter(ms => ms.projectId === proj.id);
      if (projMilestones.length === 0) return proj;
      const completedCount = projMilestones.filter(ms => ms.status === 'completed').length;
      const progress = Math.round((completedCount / projMilestones.length) * 100);
      return proj.progress !== progress ? { ...proj, progress } : proj;
    });

    if (JSON.stringify(updatedMilestones) !== JSON.stringify(milestones)) setMilestones(updatedMilestones);
    if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) setProjects(updatedProjects);
  }, [tasks, milestones, projects]);

  useEffect(() => {
    runAutoCalculations();
  }, [tasks]);

  // CRUD Actions
  const handleClientCRUD = {
    add: (c: any) => setClients([...clients, { ...c, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] }]),
    update: (id: number, updates: any) => setClients(clients.map(c => c.id === id ? { ...c, ...updates } : c)),
    delete: (id: number) => setClients(clients.filter(c => c.id !== id))
  };

  const handleProjectCRUD = {
    add: (p: any) => setProjects([...projects, { ...p, id: Date.now(), progress: 0 }]),
    update: (id: number, updates: any) => setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p)),
    delete: (id: number) => setProjects(projects.filter(p => p.id !== id))
  };

  const handleMilestoneCRUD = {
    add: (m: any) => setMilestones([...milestones, { ...m, id: Date.now() }]),
    update: (id: number, updates: any) => setMilestones(milestones.map(m => m.id === id ? { ...m, ...updates } : m)),
    delete: (id: number) => setMilestones(milestones.filter(m => m.id !== id))
  };

  const handleMemberCRUD = {
    add: (m: any) => setProjectMembers([...projectMembers, { ...m, id: Date.now(), addedAt: new Date().toISOString() }]),
    delete: (id: number) => setProjectMembers(projectMembers.filter(m => m.id !== id))
  };

  const handleTaskCRUD = {
    add: (t: any) => {
      const newTask = { ...t, id: String(Date.now()), boardOrder: tasks.length };
      setTasks([...tasks, newTask]);
      setActivityLogs([{ id: Date.now(), userId: currentUser.id, projectId: t.projectId, taskId: newTask.id, action: `Created task: ${t.title}`, createdAt: new Date().toLocaleString() }, ...activityLogs]);
    },
    update: (id: string, updates: any) => setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t)),
    delete: (id: string) => setTasks(tasks.filter(t => t.id !== id))
  };

  const handleFileCRUD = {
    add: (f: any) => setTaskFiles([...taskFiles, { ...f, id: Date.now(), uploadedAt: new Date().toLocaleString() }]),
    delete: (id: number) => setTaskFiles(taskFiles.filter(f => f.id !== id))
  };

  const handleReviewCRUD = {
    add: (r: any) => setTaskReviews([...taskReviews, { ...r, id: Date.now(), reviewedAt: new Date().toLocaleString() }])
  };

  return (
    <Router>
      <Layout user={currentUser}>
        <Routes>
          <Route path="/" element={<Dashboard projects={projects} />} />
          <Route path="/projects" element={<ProjectsPage projects={projects} users={users} departments={departments} clients={clients} crud={handleProjectCRUD} />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage 
            projects={projects} tasks={tasks} users={users} departments={departments} milestones={milestones}
            members={projectMembers} activity={activityLogs} projectCrud={handleProjectCRUD} milestoneCrud={handleMilestoneCRUD}
            memberCrud={handleMemberCRUD} taskCrud={handleTaskCRUD} taskTypes={taskTypes}
            taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={handleFileCRUD} reviewCrud={handleReviewCRUD} currentUser={currentUser}
          />} />
          <Route path="/projects/:id/kanban" element={<ProjectKanbanPage
            projects={projects} tasks={tasks} setTasks={setTasks} milestones={milestones} users={users}
            crud={handleTaskCRUD} taskTypes={taskTypes} taskFiles={taskFiles} taskReviews={taskReviews}
            fileCrud={handleFileCRUD} reviewCrud={handleReviewCRUD} currentUser={currentUser}
          />} />
          <Route path="/tasks" element={<TasksPage 
            tasks={tasks} setTasks={setTasks} milestones={milestones} projects={projects} taskTypes={taskTypes} users={users}
            crud={handleTaskCRUD} taskFiles={taskFiles} taskReviews={taskReviews} fileCrud={handleFileCRUD} reviewCrud={handleReviewCRUD} currentUser={currentUser}
          />} />
          <Route path="/clients" element={<ClientsPage clients={clients} crud={handleClientCRUD} />} />
          <Route path="/crm" element={<LeadsPage leads={leads} crud={{}} />} />
          <Route path="/seo" element={<SEOPage />} />
          <Route path="/admin/users" element={<UsersPage users={users} departments={departments} crud={{}} />} />
          <Route path="/admin/task-types" element={<TaskTypesPage taskTypes={taskTypes} crud={{}} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
