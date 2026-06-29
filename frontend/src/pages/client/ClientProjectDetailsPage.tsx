import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import {
  ArrowLeft, Clock, Calendar, CheckSquare, Flag, FileText, MessageSquare,
  Globe, BarChart, TrendingUp, Settings, Activity, Sparkles, User, ExternalLink, Download
} from "lucide-react";

import { getClientDisplayName } from "../../utils/clientDisplay";

type Project = {
  id: number;
  name: string;
  description: string;
  status: string;
  progress_percentage: number;
  start_date: string;
  end_date: string;
  project_manager_name?: string;
  client?: {
    id: number;
    company_name?: string;
    name?: string;
    full_name?: string;
    email?: string;
  };
};

type Website = {
  id: number;
  website_name: string;
  domain_url: string;
  start_date: string;
  package_plan: string;
  assigned_executive_name?: string;
  status: string;
  notes: string;
  sitemap_url?: string;
  google_analytics_id?: string;
  google_search_console_id?: string;
};

type Milestone = {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  due_date: string;
};

type Task = {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  assignee_name?: string;
};

type TaskFile = {
  id: number;
  file: string;
  task_title: string;
  uploaded_at: string;
};

type TaskComment = {
  id: number;
  user_name: string;
  comment: string;
  created_at: string;
};

type UnifiedActivity = {
  module: string;
  activity_type: string;
  title: string;
  description: string;
  status: string;
  performed_by: string;
  project: string | null;
  website: string | null;
  timestamp: string;
};

type SEOTask = {
  id: number;
  title: string;
  description: string;
  status: "pending" | "completed";
  due_date: string;
  priority: string;
  assigned_executive_name?: string;
};

type SEODailyLog = {
  id: number;
  log_date: string;
  total_count: number;
  status: string;
  remarks: string;
  items: any[];
  proof_file?: string;
};

type SEOKeyword = {
  id: number;
  keyword: string;
  search_volume: number;
  difficulty_score: number;
  priority: string;
  current_rank: number | null;
  target_rank: number | null;
};

const ClientProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isSEOCampaign = id?.startsWith("seo-");
  const projectDbId = isSEOCampaign ? null : Number(id);
  const websiteDbId = isSEOCampaign && id ? Number(id.replace("seo-", "")) : null;

  const [project, setProject] = useState<Project | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  
  // SEO campaign states
  const [seoWebsites, setSeoWebsites] = useState<Website[]>([]);
  const [seoTasks, setSeoTasks] = useState<SEOTask[]>([]);
  const [seoLogs, setSeoLogs] = useState<SEODailyLog[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<SEOKeyword[]>([]);

  // Discussion comments modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjectDetails = async () => {
    try {
      if (isSEOCampaign && websiteDbId) {
        // Fetch SEO Website specific details
        const webRes = await axiosInstance.get(`/websites/${websiteDbId}/`);
        setWebsite(webRes.data);

        // Fetch SEO tasks, logs, keywords for this website
        const [tasksRes, logsRes, kwRes] = await Promise.all([
          axiosInstance.get(`/seo-tasks/?website=${websiteDbId}`),
          axiosInstance.get(`/seo-daily-logs/?website=${websiteDbId}`),
          axiosInstance.get(`/seo-keywords/?website=${websiteDbId}`)
        ]);

        setSeoTasks(tasksRes.data.results || tasksRes.data || []);
        setSeoLogs(logsRes.data.results || logsRes.data || []);
        setSeoKeywords(kwRes.data.results || kwRes.data || []);

      } else if (projectDbId) {
        // Fetch PM project details
        const [projRes, milestoneRes, taskRes, actRes, allWebsRes] = await Promise.all([
          axiosInstance.get(`/projects/${projectDbId}/`),
          axiosInstance.get(`/milestones/?project=${projectDbId}`),
          axiosInstance.get(`/tasks/?project=${projectDbId}`),
          axiosInstance.get(`/client/projects/${projectDbId}/activity/`),
          axiosInstance.get("/websites/")
        ]);

        setProject(projRes.data);
        setMilestones(milestoneRes.data.results || milestoneRes.data || []);
        setActivities(actRes.data.activities || []);

        const tasksList = taskRes.data.results || taskRes.data || [];
        setTasks(tasksList);

        // Fetch files for PM project tasks
        const filePromises = tasksList.map((t: any) =>
          axiosInstance.get(`/task-files/?task=${t.id}`)
            .then(res => (res.data.results || res.data || []).map((f: any) => ({
              ...f,
              task_title: t.title
            })))
            .catch(() => [])
        );
        const resolvedFiles = await Promise.all(filePromises);
        setFiles(resolvedFiles.flat());

        // Check if the client has SEO websites
        const clientWebs = allWebsRes.data.results || allWebsRes.data || [];
        setSeoWebsites(clientWebs);

        if (clientWebs.length > 0) {
          // Aggregate SEO data for client's websites to merge into the PM project detail tabs dynamically
          const tasksPromises = clientWebs.map((w: Website) => axiosInstance.get(`/seo-tasks/?website=${w.id}`).then(res => res.data.results || res.data || []).catch(() => []));
          const logsPromises = clientWebs.map((w: Website) => axiosInstance.get(`/seo-daily-logs/?website=${w.id}`).then(res => res.data.results || res.data || []).catch(() => []));
          const kwPromises = clientWebs.map((w: Website) => axiosInstance.get(`/seo-keywords/?website=${w.id}`).then(res => res.data.results || res.data || []).catch(() => []));

          const allSeoTasks = await Promise.all(tasksPromises);
          const allSeoLogs = await Promise.all(logsPromises);
          const allSeoKws = await Promise.all(kwPromises);

          setSeoTasks(allSeoTasks.flat());
          setSeoLogs(allSeoLogs.flat());
          setSeoKeywords(allSeoKws.flat());
        }
      }
    } catch (err) {
      console.error("Error fetching campaign/project details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const loadComments = async (taskId: number) => {
    try {
      const res = await axiosInstance.get(`/task-comments/?task=${taskId}`);
      setComments(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setComments([]);
    loadComments(task.id);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    setSubmittingComment(true);
    try {
      await axiosInstance.post("/task-comments/", {
        task: selectedTask.id,
        comment: newComment.trim()
      });
      setNewComment("");
      loadComments(selectedTask.id);
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Dynamic tabs determination based on loaded data presence
  const showSEOTabs = isSEOCampaign || seoWebsites.length > 0;
  const showPMTabs = !isSEOCampaign;

  const tabs = [
    { id: "overview", label: "Overview", icon: <Sparkles size={16} /> },
    { id: "timeline", label: "Timeline Feed", icon: <Activity size={16} /> },
    ...(showPMTabs && milestones.length > 0 ? [{ id: "milestones", label: `Milestones (${milestones.length})`, icon: <Flag size={16} /> }] : []),
    ...(showPMTabs && tasks.length > 0 ? [{ id: "tasks", label: `Tasks (${tasks.length})`, icon: <CheckSquare size={16} /> }] : []),
    ...(showPMTabs && files.length > 0 ? [{ id: "files", label: `Files (${files.length})`, icon: <FileText size={16} /> }] : []),
    ...(showSEOTabs ? [
      { id: "seo-tasks", label: `SEO Tasks (${seoTasks.length})`, icon: <CheckSquare size={16} className="text-info" /> },
      { id: "seo-updates", label: `SEO Daily Updates (${seoLogs.length})`, icon: <Globe size={16} className="text-info" /> },
      { id: "seo-rankings", label: `Rankings (${seoKeywords.length})`, icon: <TrendingUp size={16} className="text-info" /> }
    ] : [])
  ];

  // Visual roadmap progress levels
  const pmPhases = [
    { name: "Initiation", min: 0 },
    { name: "Proposal", min: 15 },
    { name: "Planning", min: 30 },
    { name: "Development", min: 50 },
    { name: "Testing", min: 75 },
    { name: "Deployment & SEO", min: 90 },
    { name: "Completed", min: 100 }
  ];

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      
      {/* Header Breadcrumbs Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white animate__animated animate__fadeIn">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <Link to="/client/projects" className="btn btn-link text-decoration-none text-muted p-0 mb-2 d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" /> Back to Portfolio
            </Link>
            <h2 className="fw-bold text-dark mb-0">{isSEOCampaign ? website?.website_name : project?.name}</h2>
            {!isSEOCampaign && project && (
              <p className="text-secondary small mb-0 mt-1">Client: <span className="fw-semibold text-primary">{getClientDisplayName(project.client)}</span></p>
            )}
            {isSEOCampaign && (
              <a href={website?.domain_url} target="_blank" rel="noreferrer" className="text-info small d-flex align-items-center gap-1 mt-1 text-decoration-none">
                {website?.domain_url} <ExternalLink size={12} />
              </a>
            )}
          </div>
          <span className={`badge px-3 py-2 fs-7 rounded-pill ${
            (isSEOCampaign ? website?.status : project?.status) === "completed" || (isSEOCampaign ? website?.status : project?.status) === "active" ? "bg-success-subtle text-success" : "bg-primary-subtle text-primary"
          }`}>
            {isSEOCampaign ? (website?.status === "active" ? "Campaign Active" : "Campaign Inactive") : (project?.status === "completed" ? "Completed" : "In Progress")}
          </span>
        </div>
        <p className="text-muted mb-0">{isSEOCampaign ? website?.notes : project?.description}</p>
      </div>

      {/* Navigation Dynamic Tabs */}
      <ul className="nav nav-pills gap-2 mb-4 bg-white p-2 rounded-4 shadow-sm animate__animated animate__fadeIn flex-wrap">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link rounded-pill fw-bold d-flex align-items-center gap-2 ${activeTab === tab.id ? "active" : "text-secondary"}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tabs panels container */}
      <div className="tab-content animate__animated animate__fadeInUp">
        
        {/* OVERVIEW PANEL */}
        {activeTab === "overview" && (
          <div className="row g-4">
            <div className="col-lg-8">
              {isSEOCampaign ? (
                // SEO Website Overview Details
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-dark mb-4">SEO Campaign Status</h5>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="p-3 bg-light rounded-3">
                        <span className="text-muted small d-block">SEO Plan</span>
                        <strong className="text-dark text-capitalize">{website?.package_plan} Package</strong>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="p-3 bg-light rounded-3">
                        <span className="text-muted small d-block">Campaign Launch</span>
                        <strong className="text-dark">{website?.start_date || "N/A"}</strong>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3">
                        <span className="text-muted small d-block">Technical Details</span>
                        <div className="small text-muted mt-2">
                          <div>Sitemap: <span className="text-dark fw-semibold">{website?.sitemap_url || "Not Registered"}</span></div>
                          <div>Analytics ID: <span className="text-dark fw-semibold">{website?.google_analytics_id || "Not Linked"}</span></div>
                          <div>Search Console URL: <span className="text-dark fw-semibold">{website?.google_search_console_id || "Not Linked"}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // PM Project Overview Details
                <>
                  {/* Roadmap Progress Status */}
                  <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <h5 className="fw-bold text-dark mb-4">Roadmap Delivery Tracker</h5>
                    <div className="position-relative py-3">
                      <div className="progress position-absolute w-100" style={{ height: "4px", top: "25px", zIndex: 1 }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${project?.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center position-relative" style={{ zIndex: 2 }}>
                        {pmPhases.map((ph, idx) => {
                          const reached = (project?.progress_percentage || 0) >= ph.min;
                          return (
                            <div className="text-center" key={idx} style={{ width: "80px" }}>
                              <div
                                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto border-3 shadow-sm ${reached ? "bg-primary text-white border-primary" : "bg-white text-muted border-light"}`}
                                style={{ width: "36px", height: "36px" }}
                              >
                                <span className="fw-bold" style={{ fontSize: "0.8rem" }}>{idx+1}</span>
                              </div>
                              <span className="small d-block mt-2 fw-medium text-dark" style={{ fontSize: "0.7rem" }}>
                                {ph.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <h6 className="text-secondary small fw-bold text-uppercase">Start Date</h6>
                        <p className="fw-bold mb-0 text-dark">{project?.start_date || "N/A"}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <h6 className="text-secondary small fw-bold text-uppercase">Expected Delivery</h6>
                        <p className="fw-bold mb-0 text-dark">{project?.end_date || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar Details: Executive Contacts */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
                <h5 className="fw-bold text-dark mb-4">Assigned Support</h5>
                <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3" style={{ width: "70px", height: "70px", fontSize: "1.8rem" }}>
                  {isSEOCampaign ? (website?.assigned_executive_name?.charAt(0) || "S") : (project?.project_manager_name?.charAt(0) || "M")}
                </div>
                <h6 className="fw-bold mb-1 text-dark">
                  {isSEOCampaign ? (website?.assigned_executive_name || "SEO Executive") : (project?.project_manager_name || "Manager")}
                </h6>
                <span className="badge bg-secondary-subtle text-secondary small mb-4">
                  {isSEOCampaign ? "SEO Campaign Lead" : "Project Manager"}
                </span>
                <p className="text-muted small mb-0">For review or direct reports updates, contact your assigned support representative.</p>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE FEED TAB */}
        {activeTab === "timeline" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-4">Live Activity Stream</h5>
            {activities.length === 0 ? (
              <p className="text-muted text-center py-5">No recent activity logs recorded for this project.</p>
            ) : (
              <div className="timeline-feed">
                {activities.map((act, index) => (
                  <div className="d-flex mb-4 position-relative" key={index}>
                    {index !== activities.length - 1 && (
                      <div className="position-absolute bg-light border-start" 
                           style={{ left: "20px", top: "40px", bottom: "-30px", width: "2px", zIndex: 1 }}></div>
                    )}
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                         style={{ width: "40px", height: "40px", zIndex: 2, background: "#f3f4f6" }}>
                      <span className="small text-muted fw-bold">{act.module.substring(0,2).toUpperCase()}</span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start justify-content-between flex-wrap">
                        <div>
                          <span className="badge bg-primary text-white rounded-pill px-2 py-0.5 small me-2">{act.module.toUpperCase()}</span>
                          <span className="text-muted small">{act.timestamp}</span>
                        </div>
                        <span className="small text-secondary fw-semibold">by {act.performed_by}</span>
                      </div>
                      <p className="mb-0 fw-bold text-dark mt-1">{act.title}</p>
                      <p className="mb-0 text-muted small">{act.description}</p>
                      {act.website && (
                        <span className="badge bg-info-subtle text-info mt-1 rounded-pill">{act.website}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MILESTONES TAB */}
        {activeTab === "milestones" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-4">Project Milestones</h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Milestone Goal</th>
                    <th>Target Date</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m) => (
                    <tr key={m.id}>
                      <td className="fw-bold text-dark">{m.title}</td>
                      <td>{m.due_date}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 ${m.status === "completed" ? "bg-success-subtle text-success" : "bg-primary-subtle text-primary"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="text-muted small">{m.description || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-4">Assigned Project Tasks</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Target Date</th>
                    <th>Assignee</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-bold text-dark">{t.title}</td>
                      <td><span className="badge bg-warning text-dark text-capitalize">{t.priority}</span></td>
                      <td><span className="badge bg-primary text-capitalize">{t.status}</span></td>
                      <td>{t.due_date || "N/A"}</td>
                      <td className="text-muted small">{t.assignee_name || "Unassigned"}</td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => handleOpenTask(t)}>
                          Discuss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === "files" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-4">Project Vault Attachments</h5>
            <div className="row g-3">
              {files.map((f) => (
                <div className="col-md-6" key={f.id}>
                  <div className="d-flex align-items-center p-3 border rounded-3 bg-light">
                    <div className="p-2.5 bg-danger-subtle text-danger rounded-3 me-3">
                      <FileText size={24} />
                    </div>
                    <div className="text-truncate flex-grow-1">
                      <h6 className="fw-bold mb-0 text-dark text-truncate small">{f.file.split("/").pop()}</h6>
                      <span className="text-muted small d-block" style={{ fontSize: "0.7rem" }}>Task: {f.task_title}</span>
                    </div>
                    <a href={f.file} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm rounded-circle p-1.5 ms-2">
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO TASKS TAB */}
        {activeTab === "seo-tasks" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-4">SEO Campaign Action Items</h5>
            {seoTasks.length === 0 ? (
              <p className="text-muted text-center py-5">No SEO tasks scheduled for this website campaign.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Action Plan</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Target Date</th>
                      <th>Representative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seoTasks.map((t) => (
                      <tr key={t.id}>
                        <td className="fw-bold text-dark">{t.title}</td>
                        <td><span className="badge bg-warning text-dark text-capitalize">{t.priority}</span></td>
                        <td>
                          <span className={`badge px-3 py-1 rounded-pill ${t.status === "completed" ? "bg-success-subtle text-success" : "bg-primary-subtle text-primary"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>{t.due_date}</td>
                        <td className="text-secondary small">{t.assigned_executive_name || "SEO Executive"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SEO DAILY UPDATES TAB */}
        {activeTab === "seo-updates" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-4">Daily Activity Reports</h5>
            {seoLogs.length === 0 ? (
              <p className="text-muted text-center py-5">No daily updates logged for this campaign.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Submission Date</th>
                      <th>Total Submissions</th>
                      <th>Verification Status</th>
                      <th>Executive Remarks</th>
                      <th>Proof Deliverables</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seoLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="fw-bold text-dark">{log.log_date}</td>
                        <td><strong className="text-primary">{log.total_count}</strong> links optimized</td>
                        <td>
                          <span className={`badge rounded-pill px-2.5 py-1 ${
                            log.status === "approved" ? "bg-success-subtle text-success" : log.status === "rejected" ? "bg-danger-subtle text-danger" : "bg-secondary-subtle text-secondary"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="text-muted small" style={{ maxWidth: "250px" }}>{log.remarks || "No comments"}</td>
                        <td>
                          {log.proof_file ? (
                            <a href={log.proof_file} target="_blank" rel="noreferrer" className="btn btn-outline-info btn-sm rounded-pill px-3">
                              Download Proof
                            </a>
                          ) : (
                            <span className="text-muted small">No File</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SEO KEYWORD RANKINGS TAB */}
        {activeTab === "seo-rankings" && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-4">Organic Keyword Rankings</h5>
            {seoKeywords.length === 0 ? (
              <p className="text-muted text-center py-5">No target keywords registered for tracking rankings yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Keyword Target</th>
                      <th>Search Volume</th>
                      <th>SEO Difficulty</th>
                      <th>Priority</th>
                      <th className="text-center">Current Position</th>
                      <th className="text-center">Goal Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seoKeywords.map((kw) => (
                      <tr key={kw.id}>
                        <td className="fw-bold text-dark">{kw.keyword}</td>
                        <td>{kw.search_volume.toLocaleString()} searches</td>
                        <td>{kw.difficulty_score}% difficulty</td>
                        <td><span className="badge bg-light text-secondary border rounded-pill px-2.5">{kw.priority}</span></td>
                        <td className="text-center"><strong className="text-primary">{kw.current_rank || "100+"}</strong></td>
                        <td className="text-center"><strong className="text-success">{kw.target_rank || "Top 10"}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* DISCUSS DIALOG COMMENT POPUP */}
      {selectedTask && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">{selectedTask.title}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedTask(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-4">{selectedTask.description || "No task description details."}</p>
                <hr className="my-4 opacity-10" />

                <h6 className="fw-bold text-dark mb-3">Live Feed Discussion</h6>
                <div className="comments-box overflow-y-auto mb-3 p-3 bg-light rounded-3" style={{ maxHeight: "250px" }}>
                  {comments.length === 0 ? (
                    <div className="text-center py-4 text-muted small">No comments logged. Drop your message below.</div>
                  ) : (
                    comments.map((c) => (
                      <div className="d-flex mb-3 animate__animated animate__fadeIn" key={c.id}>
                        <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-2" style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                          {c.user_name.charAt(0)}
                        </div>
                        <div className="bg-white p-2.5 rounded-3 shadow-sm flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold small text-dark">{c.user_name}</span>
                            <span className="text-muted small" style={{ fontSize: "0.7rem" }}>
                              {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mb-0 text-muted small">{c.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handlePostComment} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control rounded-pill btn-sm"
                    placeholder="Ask a question or add details..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" disabled={submittingComment}>
                    {submittingComment ? "Submitting..." : "Comment"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProjectDetailsPage;
