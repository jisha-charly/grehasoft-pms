
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Data
  let projects = [
    { id: 101, name: 'E-commerce Website Development', clientId: 1, clientName: 'Fox Media', departmentId: 2, projectManagerId: 1, createdBy: 1, startDate: '2024-01-01', endDate: '2024-06-30', status: 'in_progress', progressPercentage: 45, createdAt: '2024-01-01T00:00:00Z' },
    { id: 102, name: 'Mobile App Development', clientId: 2, clientName: 'XYZ Enterprises', departmentId: 2, projectManagerId: 2, createdBy: 1, startDate: '2024-02-10', endDate: '2024-08-30', status: 'in_progress', progressPercentage: 25, createdAt: '2024-02-10T00:00:00Z' },
  ];

  let tasks = [
    { id: '1', projectId: 101, milestoneId: 1, title: 'Setup Database Schema', description: 'Design MySQL schema and relationships.', priority: 'high', status: 'done', boardOrder: 0, dueDate: '2024-02-20', assignees: [1], taskTypeId: 1, createdBy: 1, createdAt: '2024-01-01T00:00:00Z' },
    { id: '2', projectId: 101, milestoneId: 1, title: 'Develop User Authentication', description: 'JWT based login and registration.', priority: 'high', status: 'in_progress', boardOrder: 0, dueDate: '2024-02-20', assignees: [3], taskTypeId: 1, createdBy: 1, createdAt: '2024-01-01T00:00:00Z' },
  ];

  let taskAssignments = [
    { id: 1, taskId: '1', employeeId: 1, assignedBy: 1, assignedAt: '2024-01-01T10:00:00Z', createdAt: '2024-01-01T10:00:00Z' },
    { id: 2, taskId: '2', employeeId: 3, assignedBy: 1, assignedAt: '2024-01-05T10:00:00Z', createdAt: '2024-01-05T10:00:00Z' },
  ];

  let taskProgress = [
    { id: 1, taskId: '2', progressPercentage: 50, updatedBy: 3, updatedAt: '2024-02-15T10:00:00Z' }
  ];

  let taskFiles = [
    { id: 1, taskId: '1', uploadedBy: 1, filePath: '/uploads/schema.pdf', fileType: 'application/pdf', revisionNo: 1, uploadedAt: '2024-02-10T10:00:00Z' }
  ];

  let taskReviews = [
    { id: 1, taskFileId: 1, reviewerId: 2, reviewedByRole: 'PM', reviewVersion: 1, comments: 'Looks good.', status: 'approved', reviewedAt: '2024-02-11T10:00:00Z' }
  ];

  let taskComments = [
    { id: 1, taskId: '2', userId: 1, comment: 'Please check the JWT expiration time.', createdAt: '2024-02-12T10:00:00Z' }
  ];

  let milestones = [
    { id: 1, projectId: 101, title: 'Database Design', dueDate: '2024-02-15', status: 'completed' },
    { id: 2, projectId: 101, title: 'API Beta Release', dueDate: '2024-04-10', status: 'pending' },
  ];

  let members = [
    { id: 1, projectId: 101, userId: 1, roleInProject: 'PM', addedAt: '2024-01-01' },
    { id: 2, projectId: 101, userId: 3, roleInProject: 'MEMBER', addedAt: '2024-01-05' },
  ];

  let activityLogs = [
    { id: 1, userId: 1, projectId: 101, action: 'Created project', createdAt: '2024-01-01 10:00' },
  ];

  let users = [
    { id: 1, name: 'Alex Thompson', username: 'alex_admin', email: 'alex@grehasoft.com', role: 'SUPER_ADMIN', departmentId: 1, status: 'active' },
    { id: 2, name: 'Sarah PM', username: 'sarah_pm', email: 'sarah@grehasoft.com', role: 'PROJECT_MANAGER', departmentId: 1, status: 'active' },
    { id: 3, name: 'John Employee', username: 'john_emp', email: 'john@grehasoft.com', role: 'TEAM_MEMBER', departmentId: 1, status: 'active' }
  ];

  let departments = [
    { id: 1, name: 'Software Development', createdAt: '2024-01-01' },
    { id: 2, name: 'Frontend Engineering', parentId: 1, createdAt: '2024-01-05' },
    { id: 3, name: 'Backend Engineering', parentId: 1, createdAt: '2024-01-05' },
    { id: 4, name: 'Digital Marketing', createdAt: '2024-01-10' },
    { id: 5, name: 'SEO Services', parentId: 4, createdAt: '2024-01-12' }
  ];

  let taskTypes = [
    { id: 1, name: 'DEV', description: 'Core software development and engineering tasks.', createdAt: '2024-01-01' },
    { id: 2, name: 'SEO', description: 'Search engine optimization and visibility tasks.', createdAt: '2024-01-01' },
    { id: 3, name: 'DESIGN', description: 'UI/UX and creative asset production.', createdAt: '2024-01-01' },
    { id: 4, name: 'ADS', description: 'Paid marketing campaigns and advertisement management.', createdAt: '2024-01-01' }
  ];

  let clients = [
    { id: 1, name: 'John Client', email: 'john@acme.com', phone: '555-0199', companyName: 'Acme Corp', address: '123 Business St', createdAt: '2024-01-01' }
  ];

  let leads = [
    { id: 1, name: 'Robert Fox', email: 'robert@foxmedia.com', phone: '555-0101', source: 'Web', status: 'new', converted_project_id: null, createdAt: '2024-02-01' },
    { id: 2, name: 'Jane Cooper', email: 'jane@xyz.com', phone: '555-0102', source: 'Ads', status: 'contacted', converted_project_id: null, createdAt: '2024-02-05' },
  ];

  let leadAssignments = [
    { id: 1, lead_id: 1, sales_exec_id: 1, assigned_at: '2024-02-01T10:00:00Z' }
  ];

  let leadFollowups = [
    { id: 1, lead_id: 1, followup_type: 'call', notes: 'Initial discovery call', next_followup: '2024-02-10', status: 'done', created_by: 1, created_at: '2024-02-01T11:00:00Z' }
  ];

  let seoTasks = [
    { id: 1, task_id: '1', seo_type: 'on_page', createdAt: '2024-01-01' },
    { id: 2, task_id: '2', seo_type: 'keyword', createdAt: '2024-01-02' }
  ];

  let seoOnPage = [
    { id: 1, seo_task_id: 1, page_url: 'https://example.com', title_optimized: true, meta_optimized: true, keyword_density: 2.5, mobile_friendly: true, page_speed_status: 'Good', createdAt: '2024-01-01' }
  ];

  let seoKeywords = [
    { id: 1, seo_task_id: 2, keyword: 'enterprise pms', search_volume: 1200, difficulty: 45, current_rank: 12, target_rank: 1, createdAt: '2024-01-02' }
  ];

  let gmbProfiles = [
    { id: 1, project_id: 101, business_name: 'Grehasoft Solutions', category: 'Software Company', rating: 4.8, total_reviews: 150, createdAt: '2024-01-01' }
  ];

  let socialMediaPosts = [
    { id: 1, project_id: 101, platform: 'LinkedIn', post_type: 'Article', language: 'English', post_url: 'https://linkedin.com/post/1', posting_date: '2024-02-01', createdAt: '2024-02-01' }
  ];

  let socialMetrics = [
    { id: 1, post_id: 1, likes: 120, comments: 15, shares: 10, reach: 1500, createdAt: '2024-02-02' }
  ];

  // API Routes
  app.get("/api/v1/users", (req, res) => res.json(users));
  app.get("/api/v1/departments", (req, res) => res.json(departments));
  app.get("/api/v1/task-types", (req, res) => res.json(taskTypes));
  app.get("/api/v1/clients", (req, res) => res.json(clients));
  app.get("/api/v1/leads", (req, res) => res.json(leads));

  app.post("/api/v1/leads", (req, res) => {
    const newLead = { 
      ...req.body, 
      id: Date.now(), 
      converted_project_id: null,
      createdAt: new Date().toISOString().split('T')[0] 
    };
    leads.push(newLead);
    res.status(201).json(newLead);
  });

  app.patch("/api/v1/leads/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(leads[index]);
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  });

  app.delete("/api/v1/leads/:id", (req, res) => {
    const id = Number(req.params.id);
    leads = leads.filter(l => l.id !== id);
    res.status(204).send();
  });

  // Lead Assignments & Followups
  app.get("/api/v1/leads/:id/assignments", (req, res) => {
    res.json(leadAssignments.filter(a => a.lead_id === Number(req.params.id)));
  });

  app.get("/api/v1/leads/:id/followups", (req, res) => {
    res.json(leadFollowups.filter(f => f.lead_id === Number(req.params.id)));
  });

  app.post("/api/v1/lead-followups", (req, res) => {
    const newFollowup = { ...req.body, id: Date.now(), created_at: new Date().toISOString() };
    leadFollowups.push(newFollowup);
    res.status(201).json(newFollowup);
  });

  // SEO Endpoints
  app.get("/api/v1/seo-tasks", (req, res) => res.json(seoTasks));
  app.get("/api/v1/seo-onpage", (req, res) => res.json(seoOnPage));
  app.get("/api/v1/seo-keywords", (req, res) => res.json(seoKeywords));
  app.get("/api/v1/gmb-profiles", (req, res) => res.json(gmbProfiles));
  app.get("/api/v1/social-media-posts", (req, res) => res.json(socialMediaPosts));
  app.get("/api/v1/social-metrics", (req, res) => res.json(socialMetrics));

  app.post("/api/v1/seo-tasks", (req, res) => {
    const newTask = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() };
    seoTasks.push(newTask);
    res.status(201).json(newTask);
  });

  app.post("/api/v1/seo-onpage", (req, res) => {
    const newData = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() };
    seoOnPage.push(newData);
    res.status(201).json(newData);
  });

  app.post("/api/v1/seo-keywords", (req, res) => {
    const newData = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() };
    seoKeywords.push(newData);
    res.status(201).json(newData);
  });

  app.post("/api/v1/social-media-posts", (req, res) => {
    const newData = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() };
    socialMediaPosts.push(newData);
    res.status(201).json(newData);
  });

  app.post("/api/v1/social-metrics", (req, res) => {
    const newData = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() };
    socialMetrics.push(newData);
    res.status(201).json(newData);
  });

  app.post("/api/v1/clients", (req, res) => {
    const newClient = { ...req.body, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] };
    clients.push(newClient);
    res.status(201).json(newClient);
  });

  app.patch("/api/v1/clients/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...req.body };
      res.json(clients[index]);
    } else {
      res.status(404).json({ error: "Client not found" });
    }
  });

  app.delete("/api/v1/clients/:id", (req, res) => {
    const id = Number(req.params.id);
    clients = clients.filter(c => c.id !== id);
    res.status(204).send();
  });

  app.get("/api/v1/projects", (req, res) => res.json(projects));

  app.get("/api/v1/projects/:id", (req, res) => {
    const project = projects.find(p => p.id === Number(req.params.id));
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  });

  app.post("/api/v1/projects", (req, res) => {
    const newProject = { 
      ...req.body, 
      id: Date.now(), 
      progressPercentage: 0, 
      createdAt: new Date().toISOString() 
    };
    projects.push(newProject);
    res.status(201).json(newProject);
  });

  app.patch("/api/v1/projects/:id", (req, res) => {
    const index = projects.findIndex(p => p.id === Number(req.params.id));
    if (index !== -1) {
      projects[index] = { ...projects[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(projects[index]);
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  });

  app.delete("/api/v1/projects/:id", (req, res) => {
    projects = projects.filter(p => p.id !== Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/v1/projects/:id/tasks", (req, res) => {
    const projectTasks = tasks.filter(t => t.projectId === Number(req.params.id));
    res.json(projectTasks);
  });

  app.get("/api/v1/projects/:id/milestones", (req, res) => {
    const projectMilestones = milestones.filter(m => m.projectId === Number(req.params.id));
    res.json(projectMilestones);
  });

  app.get("/api/v1/projects/:id/members", (req, res) => {
    const projectMembers = members.filter(m => m.projectId === Number(req.params.id));
    res.json(projectMembers);
  });

  app.get("/api/v1/projects/:id/activity", (req, res) => {
    const projectActivity = activityLogs.filter(a => a.projectId === Number(req.params.id));
    res.json(projectActivity);
  });

  app.get("/api/v1/tasks/:id/assignments", (req, res) => {
    res.json(taskAssignments.filter(a => a.taskId === req.params.id));
  });

  app.get("/api/v1/tasks/:id/progress", (req, res) => {
    res.json(taskProgress.filter(p => p.taskId === req.params.id));
  });

  app.get("/api/v1/tasks/:id/files", (req, res) => {
    res.json(taskFiles.filter(f => f.taskId === req.params.id));
  });

  app.get("/api/v1/tasks/:id/comments", (req, res) => {
    res.json(taskComments.filter(c => c.taskId === req.params.id));
  });

  app.get("/api/v1/task-files/:id/reviews", (req, res) => {
    res.json(taskReviews.filter(r => r.taskFileId === Number(req.params.id)));
  });

  app.post("/api/v1/task-comments", (req, res) => {
    const newComment = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() };
    taskComments.push(newComment);
    res.status(201).json(newComment);
  });

  app.post("/api/v1/task-progress", (req, res) => {
    const newProgress = { ...req.body, id: Date.now(), updatedAt: new Date().toISOString() };
    taskProgress.push(newProgress);
    res.status(201).json(newProgress);
  });

  app.post("/api/v1/task-files", (req, res) => {
    const newFile = { ...req.body, id: Date.now(), uploadedAt: new Date().toISOString() };
    taskFiles.push(newFile);
    res.status(201).json(newFile);
  });

  app.post("/api/v1/task-reviews", (req, res) => {
    const newReview = { ...req.body, id: Date.now(), reviewedAt: new Date().toISOString() };
    taskReviews.push(newReview);
    res.status(201).json(newReview);
  });

  app.get("/api/v1/tasks", (req, res) => {
    res.json(tasks);
  });

  // Task CRUD
  app.post("/api/v1/tasks", (req, res) => {
    const newTask = { ...req.body, id: String(Date.now()) };
    tasks.push(newTask);
    res.status(201).json(newTask);
  });

  app.patch("/api/v1/tasks/:id", (req, res) => {
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...req.body };
      res.json(tasks[index]);
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  });

  app.delete("/api/v1/tasks/:id", (req, res) => {
    tasks = tasks.filter(t => t.id !== req.params.id);
    res.status(204).send();
  });

  app.post("/api/v1/tasks/reorder", (req, res) => {
    const { taskIds } = req.body;
    // In a real app, we would update the 'boardOrder' of these tasks.
    // For this mock, we just return success.
    res.json({ status: "success" });
  });

  // Milestone CRUD
  app.post("/api/v1/milestones", (req, res) => {
    const newMilestone = { ...req.body, id: Date.now(), status: 'pending', progress: 0 };
    milestones.push(newMilestone);
    res.status(201).json(newMilestone);
  });

  app.patch("/api/v1/milestones/:id", (req, res) => {
    const index = milestones.findIndex(m => m.id === Number(req.params.id));
    if (index !== -1) {
      milestones[index] = { ...milestones[index], ...req.body };
      res.json(milestones[index]);
    } else {
      res.status(404).json({ error: "Milestone not found" });
    }
  });

  app.delete("/api/v1/milestones/:id", (req, res) => {
    milestones = milestones.filter(m => m.id !== Number(req.params.id));
    res.status(204).send();
  });

  // Member CRUD
  app.post("/api/v1/members", (req, res) => {
    const newMember = { ...req.body, id: Date.now(), addedAt: new Date().toISOString() };
    members.push(newMember);
    res.status(201).json(newMember);
  });

  app.delete("/api/v1/members/:id", (req, res) => {
    members = members.filter(m => m.id !== Number(req.params.id));
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
