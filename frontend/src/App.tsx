import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import Dashboard from "./pages/dashboard/Dashboard";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import ProjectKanbanPage from "./pages/projects/ProjectKanbanPage";
import TasksPage from "./pages/tasks/TasksPage";
import LeadsPage from "./pages/crm/LeadsPage";

import ClientsPage from "./pages/clients/ClientsPage";
import SEOPage from "./pages/seo/SEOPage";
import UsersPage from "./pages/admin/users/UsersPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import DepartmentsPage from "./pages/admin/departments/DepartmentsPage";
import TaskTypesPage from "./pages/admin/task-types/TaskTypesPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { NotificationProvider } from "./context/NotificationContext";
import {
  TaskStatus,
  Task,
  Project,
  Lead,
  User,
  Department,
  TaskType,
  Milestone,
  Client,
  Role,
  ProjectMember,
  ActivityLog,
  Permission,
} from "./types";

import axiosInstance from "./api/axiosInstance";

import CreateInvoicePage from "./pages/invoices/CreateInvoicePage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import InvoiceDetailsPage from "./pages/invoices/InvoiceDetailsPage";
import ProposalsPage from "./pages/crm/ProposalsPage";
import RemindersPage from "./pages/crm/RemindersPage";
import HRDocumentsPage from "./pages/hr/HRDocumentsPage";
import InfrastructurePage from "./pages/infrastructure/InfrastructurePage";
import ServersPage from "./pages/infrastructure/ServersPage";
import CredentialsPage from "./pages/infrastructure/CredentialsPage";
import DomainsPage from "./pages/infrastructure/DomainsPage";
import SEOWebsitesPage from "./pages/seo/SEOWebsitesPage";

const App: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;

  /* ================= STATE ================= */

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  /* ============== SAFE DATA HANDLER ============== */

  const safeData = (res: any) =>
    Array.isArray(res?.data)
      ? res.data
      : res?.data?.results || res?.data?.data || [];

  /* ============== FETCH MASTER DATA (AUTH SAFE) ============== */

  useEffect(() => {
    // ✅ wait until auth finishes checking token
    if (loading) return;

    // ✅ only fetch when logged in
    if (!isAuthenticated) return;

    const fetchMasterData = async () => {
      try {
        const [
          usersRes,
          rolesRes,
          deptsRes,
          typesRes,
          projectsRes,
          clientsRes,
          tasksRes,
          leadsRes,
        ] = await Promise.all([
          axiosInstance.get("/users"),
          axiosInstance.get("/roles"),
          axiosInstance.get("/departments"),
          axiosInstance.get("/task-types"),
          axiosInstance.get("/projects"),
          axiosInstance.get("/clients"),
          axiosInstance.get("/tasks"),
          axiosInstance.get("/leads"),
        ]);

        setUsers(safeData(usersRes));
        setRoles(safeData(rolesRes));
        setDepartments(safeData(deptsRes));
        setTaskTypes(safeData(typesRes));
        setProjects(projectsRes.data?.results ?? []);
        setClients(safeData(clientsRes));
        setTasks(safeData(tasksRes));
        setLeads(safeData(leadsRes));
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
    };

    fetchMasterData();
  }, [isAuthenticated, loading]);

  /* ================= AUTO PROGRESS ================= */

  useEffect(() => {
    if (!tasks.length) return;

    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        const projTasks = tasks.filter((t) => t.projectId === proj.id);
        if (!projTasks.length) return proj;

        const done = projTasks.filter((t) => t.status === TaskStatus.DONE).length;
        const progress = Math.round((done / projTasks.length) * 100);

        if (proj.progress_percentage === progress) return proj;

        return { ...proj, progressPercentage: progress };
      })
    );
  }, [tasks]);

  /* ================= CRUD HELPERS ================= */

  const createCrud = (endpoint: string, setter: any) => ({
    add: async (item: any) => {
      const res = await axiosInstance.post(`${endpoint}/`, item);

      const newItem = res.data.data || res.data;   // ✅ FIX
      setter((prev: any[]) => [...prev, newItem]);
    },

    update: async (id: number | string, updates: any) => {
      const res = await axiosInstance.patch(`${endpoint}/${id}/`, updates);

      const updatedItem = res.data.data || res.data;  // ✅ FIX
      setter((prev: any[]) =>
        prev.map((i) => (i.id === id ? updatedItem : i))
      );
    },

    delete: async (id: number | string) => {
      await axiosInstance.delete(`${endpoint}/${id}/`);
      setter((prev: any[]) => prev.filter((i) => i.id !== id));
    },
  });

  const projectCrud = createCrud("/projects", setProjects);
  const taskCrud = createCrud("/tasks", setTasks);

  const handleUpdatePassword = async (newPassword: string, currentPassword: string) => {
    try {

      await axiosInstance.post("/users/change-password/", {
        currentPassword: currentPassword,
        newPassword: newPassword
      });

      // add activity log
      const logRes = await axiosInstance.post("/activity-logs/", {
        action: "Changed Password",
        projectId: 0
      });

      setActivityLogs((prev) => [logRes.data, ...prev]);

    } catch (error) {
      console.error("Error updating password:", error);
    }
  };

  const handleUpdateProfile = async (data: any) => {
    try {

      await axiosInstance.patch(`/users/${data.id}/`, {
        name: data.name,
        email: data.email,
        username: data.username
      });

      const logRes = await axiosInstance.post("/activity-logs/", {
        action: "Updated Profile",
        user: data.id
      });

      setActivityLogs((prev) => [logRes.data, ...prev]);

    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const milestoneCrud = createCrud("/milestones", setMilestones);
  const memberCrud = createCrud("/project-members", setProjectMembers);
  useEffect(() => {
  const cleanUI = () => {
    // remove overlays
    document.querySelectorAll(".modal-backdrop, .layout-backdrop")
      .forEach(el => el.remove());

    // fix body scroll lock
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "auto";
  };

  cleanUI();

  window.addEventListener("hashchange", cleanUI);

  return () => window.removeEventListener("hashchange", cleanUI);
}, []);

  /* ================= ROUTES ================= */

  return (
     <NotificationProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute requiredPermission={Permission.VIEW_DASHBOARD}>
              <Layout >
                <Dashboard projects={projects} tasks={tasks} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute requiredPermission={Permission.VIEW_PROJECTS}>
              <Layout >
                <ProjectsPage
                  users={users}
                  departments={departments}
                  clients={clients}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute requiredPermission={Permission.VIEW_PROJECTS}>
              <Layout>
                <ProjectDetailsPage
                  projects={projects}
                  tasks={tasks}
                  users={users}
                  departments={departments}
                  milestones={milestones}
                  members={projectMembers}
                  activity={activityLogs}
                  projectCrud={projectCrud}
                  milestoneCrud={milestoneCrud}
                  memberCrud={memberCrud}
                  taskCrud={taskCrud}
                  taskTypes={taskTypes}
                  currentUser={user!}
                />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/projects/:id/kanban" element={<ProtectedRoute requiredPermission={Permission.MANAGE_TASKS}><Layout ><ProjectKanbanPage projects={projects} tasks={tasks} setTasks={setTasks} milestones={milestones} users={users} crud={taskCrud} taskTypes={taskTypes} currentUser={user!} /></Layout></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute requiredPermission={Permission.VIEW_TASKS}><Layout ><TasksPage milestones={milestones} projects={projects} taskTypes={taskTypes} users={users} currentUser={user!} /></Layout></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute requiredPermission={Permission.VIEW_CLIENTS}><Layout ><ClientsPage /></Layout></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute requiredPermission={Permission.VIEW_LEADS}><Layout ><LeadsPage users={users} clients={clients} departments={departments} setProjects={setProjects} /></Layout></ProtectedRoute>} />
        <Route path="/seo" element={<ProtectedRoute requiredPermission={Permission.VIEW_TASKS}><Layout><SEOPage /></Layout></ProtectedRoute>} />
       <Route path="/seo/websites" element={<ProtectedRoute requiredPermission={Permission.VIEW_TASKS}><Layout><SEOWebsitesPage /></Layout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredPermission={Permission.MANAGE_USERS}><Layout><UsersPage roles={roles} departments={departments} /></Layout></ProtectedRoute>} />
        <Route
          path="/infrastructure"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}>
              <Layout>
                <InfrastructurePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}>
              <Layout >
                <RolesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}>
              <Layout >
                <DepartmentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/task-types"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}>
              <Layout>
                <TaskTypesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredPermission={Permission.VIEW_DASHBOARD}>
              <Layout>
                <ProfilePage
                  activityLogs={activityLogs}
                  onUpdatePassword={handleUpdatePassword}
                  onUpdateProfile={handleUpdateProfile}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/create" element={<CreateInvoicePage />} />
        <Route path="/invoices/edit/:id" element={<CreateInvoicePage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
        <Route path="/reminders" element={<ProtectedRoute requiredPermission={Permission.VIEW_REMINDERS}><Layout><RemindersPage /></Layout></ProtectedRoute>} />
        <Route path="/proposals" element={<ProtectedRoute requiredPermission={Permission.VIEW_PROPOSALS}><Layout><ProposalsPage leads={leads} setProjects={setProjects} /></Layout></ProtectedRoute>} />
        <Route path="/hr-documents" element={<ProtectedRoute requiredPermission={Permission.GENERATE_HR_DOCS}><Layout><HRDocumentsPage /></Layout></ProtectedRoute>} />
        <Route
          path="/admin/servers"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_INFRASTRUCTURE}>
              <Layout>
                <ServersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/infrastructure/domains"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_INFRASTRUCTURE}>
                <Layout>
              <DomainsPage />
</Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/infrastructure/credentials"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_INFRASTRUCTURE}>
              <Layout>
                <CredentialsPage />
              </Layout>
            </ProtectedRoute>
          }
        />


        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </NotificationProvider>

  );
};

export default App;