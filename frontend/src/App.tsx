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
import LeadsPage from "./pages/crm/Leadspage";
//import Leadspage from "./pages/crm/Leadspage";
import ClientsPage from "./pages/clients/ClientsPage";
import SEOPage from "./pages/seo/SEOPage";
import UsersPage from "./pages/admin/users/UsersPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import DepartmentsPage from "./pages/admin/departments/DepartmentsPage";
import TaskTypesPage from "./pages/admin/task-types/TaskTypesPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
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
      setProjects(safeData(projectsRes));
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
  const clientCrud = createCrud("/clients", setClients);
const leadCrud = {
  ...createCrud("/leads", setLeads),

convert: async (
  leadId: number,
  clientData: any,
  projectData: any
) => {
  try {
    let clientId: number | null = null;

    // 🔹 Always create client (or adjust logic if needed)
    const clientRes = await axiosInstance.post("/clients/", {
      name: clientData.name,
      company_name: clientData.companyName,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
    });

    clientId = clientRes.data.id;

    // 🔹 Update lead with new client
    await axiosInstance.patch(`/leads/${leadId}/`, {
      client: clientId,
    });

    // 🔹 Convert lead to project
    const convertRes = await axiosInstance.post(
      `/leads/${leadId}/convert_to_project/`,
      {
         name: projectData.name,
    client: clientId,
    department: projectData.departmentId,
    project_manager: projectData.projectManagerId,
    created_by: projectData.createdBy,
    start_date: projectData.startDate,
    end_date: projectData.endDate,
    status: projectData.status,
    progress_percentage: projectData.progressPercentage
      }
    );

    return convertRes.data;

  }
  
   catch (error) {
    console.error("Conversion failed:", error);
    throw error;
  }
},

  // ✅ ADD THIS METHOD
  assign: async (leadId: number, execId: number) => {
    try {
      const res = await axiosInstance.post("/lead-assignments/", {
        lead: leadId,
        sales_exec: execId,
      });

      return res.data;
    } catch (error) {
      console.error("Assignment failed:", error);
      throw error;
    }
  }

};

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

    
  const roleCrud = createCrud("/roles", setRoles);
  const deptCrud = createCrud("/departments", setDepartments);
  const taskTypeCrud = createCrud("/task-types", setTaskTypes);
  const userCrud = createCrud("/users", setUsers);
  const milestoneCrud = createCrud("/milestones", setMilestones);
  const memberCrud = createCrud("/project-members", setProjectMembers);

  /* ================= ROUTES ================= */

  return (
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
                  projects={projects}
                  users={users}
                  departments={departments}
                  clients={clients}
                  crud={projectCrud}
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
          <Route path="/tasks" element={<ProtectedRoute requiredPermission={Permission.VIEW_TASKS}><Layout ><TasksPage tasks={tasks} setTasks={setTasks} milestones={milestones} projects={projects} taskTypes={taskTypes} users={users} crud={taskCrud} currentUser={user!}/></Layout></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute requiredPermission={Permission.VIEW_CLIENTS}><Layout ><ClientsPage clients={clients} crud={clientCrud} /></Layout></ProtectedRoute>} />
          <Route path="/crm" element={<ProtectedRoute requiredPermission={Permission.VIEW_LEADS}><Layout ><LeadsPage leads={leads}
  crud={leadCrud}
  users={users}
  clients={clients}
  clientCrud={clientCrud}
  projects={projects}
  projectCrud={projectCrud}
  departments={departments}     /></Layout></ProtectedRoute>} />
         <Route path="/seo" element={<ProtectedRoute requiredPermission={Permission.VIEW_TASKS}><Layout><SEOPage /></Layout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredPermission={Permission.MANAGE_USERS}><Layout><UsersPage users={users} roles={roles} departments={departments} crud={userCrud} /></Layout></ProtectedRoute>} />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}>
              <Layout >
                <RolesPage roles={roles} crud={roleCrud} />
              </Layout>
            </ProtectedRoute>
          }
        />

          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}>
                <Layout >
                  <DepartmentsPage departments={departments} crud={deptCrud} />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/task-types"
            element={
              <ProtectedRoute requiredPermission={Permission.MANAGE_SETTINGS}>
                <Layout>
                  <TaskTypesPage taskTypes={taskTypes} crud={taskTypeCrud} />
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
   
  );
};

export default App;