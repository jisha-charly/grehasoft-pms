import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Clock, Calendar, CheckCircle, Globe, FileText, Filter, RefreshCw } from "lucide-react";

type DailyWorkItem = {
  id: number;
  activity_type_name: string;
  count: number;
  keyword: string;
  submission_url: string;
  domain_authority: number;
  spam_score: number;
  time_spent_minutes?: number | null;
};

type DailyWorkLog = {
  id: number;
  website_name: string;
  executive_name: string;
  log_date: string;
  status: string;
  total_count: number;
  remarks?: string;
  remarks_by_manager?: string;
  items: DailyWorkItem[];
};

type ProjectTaskUpdate = {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  project_name: string;
  updated_at: string;
  assignee_name?: string;
};

type Website = {
  id: number;
  website_name: string;
};

type ActivityType = {
  id: number;
  name: string;
};

type Project = {
  id: number;
  name: string;
};

type UnifiedUpdate = {
  id: string;
  type: "seo_log" | "task_update";
  title: string;
  description: string;
  date: string;
  status: string;
  meta: any;
};

const ClientDailyUpdatesPage: React.FC = () => {
  const [logs, setLogs] = useState<DailyWorkLog[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<ProjectTaskUpdate[]>([]);
  const [unifiedUpdates, setUnifiedUpdates] = useState<UnifiedUpdate[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter states
  const [selectedWebsite, setSelectedWebsite] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>(""); // "seo" or "dev"

  useEffect(() => {
    // Load dropdown filter choices
    const fetchFilters = async () => {
      try {
        const [webRes, actRes, projRes] = await Promise.all([
          axiosInstance.get("/websites/?all=true"),
          axiosInstance.get("/seo/activity-types/?all=true"),
          axiosInstance.get("/projects/")
        ]);
        setWebsites(webRes.data.results || webRes.data || []);
        setActivityTypes(actRes.data.results || actRes.data || []);
        setProjects(projRes.data.results || projRes.data || []);
      } catch (err) {
        console.error("Error loading daily log filters:", err);
      }
    };
    fetchFilters();
  }, []);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      // 1. Fetch SEO Logs
      let seoUrl = "/seo-daily-logs/?all=true";
      if (selectedWebsite) seoUrl += `&website=${selectedWebsite}`;
      if (startDate) seoUrl += `&log_date_after=${startDate}`;
      if (endDate) seoUrl += `&log_date_before=${endDate}`;

      const seoRes = await axiosInstance.get(seoUrl);
      const seoData = seoRes.data.results || seoRes.data || [];

      // 2. Fetch Tasks (to extract recent task developments)
      let taskUrl = "/tasks/";
      if (selectedProject) taskUrl += `?project=${selectedProject}`;
      const taskRes = await axiosInstance.get(taskUrl);
      const taskData = taskRes.data.results || taskRes.data || [];

      // Convert SEO Daily Logs
      let convertedLogs: UnifiedUpdate[] = seoData.map((log: DailyWorkLog) => ({
        id: `seo-log-${log.id}`,
        type: "seo_log",
        title: `SEO work submitted for ${log.website_name}`,
        description: `${log.total_count} off-page submissions. Remarks: ${log.remarks || 'No comments'}`,
        date: log.log_date,
        status: log.status,
        meta: log
      }));

      // Convert task updates (PM Tasks)
      let convertedTasks: UnifiedUpdate[] = taskData.map((t: any) => {
        const pDate = t.created_at ? t.created_at.split("T")[0] : t.due_date;
        return {
          id: `task-${t.id}`,
          type: "task_update",
          title: `Project Task: ${t.title}`,
          description: `Task status updated to '${t.status}' for project ${t.project_name || 'N/A'}. Priority: ${t.priority}`,
          date: pDate || "",
          status: t.status,
          meta: t
        };
      });

      // Filter by project on frontend for SEO logs if chosen
      if (selectedProject) {
        const projObj = projects.find(p => p.id.toString() === selectedProject);
        if (projObj) {
          convertedLogs = convertedLogs.filter((u: UnifiedUpdate) =>
            u.meta.website_name.toLowerCase().includes(projObj.name.toLowerCase()) ||
            projObj.name.toLowerCase().includes(u.meta.website_name.toLowerCase())
          );
        }
      }

      // Filter by dates for task updates
      if (startDate) {
        convertedTasks = convertedTasks.filter(u => u.date >= startDate);
      }
      if (endDate) {
        convertedTasks = convertedTasks.filter(u => u.date <= endDate);
      }

      // Combine and filter by type (SEO or Dev)
      let combined = [...convertedLogs, ...convertedTasks];
      if (selectedType === "seo") {
        combined = combined.filter(u => u.type === "seo_log");
      } else if (selectedType === "dev") {
        combined = combined.filter(u => u.type === "task_update");
      }

      // Sort newest first
      combined.sort((a, b) => b.date.localeCompare(a.date));

      setUnifiedUpdates(combined);
    } catch (err) {
      console.error("Error fetching unified work updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [selectedWebsite, selectedProject, startDate, endDate, selectedType]);

  const handleClearFilters = () => {
    setSelectedWebsite("");
    setSelectedProject("");
    setStartDate("");
    setEndDate("");
    setSelectedType("");
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="mb-4 animate__animated animate__fadeIn">
        <h2 className="fw-bold text-dark mb-1">Updates Stream</h2>
        <p className="text-muted mb-0">Review daily off-page SEO logs, project task progress, and deployment reports.</p>
      </div>

      {/* Filter panel */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white animate__animated animate__fadeInUp">
        <h6 className="fw-bold text-dark mb-3"><Filter size={16} className="me-2" />Filter Updates</h6>
        <div className="row g-3">
          <div className="col-md-2">
            <label className="form-label small text-secondary fw-bold">Project</label>
            <select
              className="form-select rounded-pill btn-sm"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label small text-secondary fw-bold">Website</label>
            <select
              className="form-select rounded-pill btn-sm"
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
            >
              <option value="">All Websites</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>{w.website_name}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label small text-secondary fw-bold">Module Focus</label>
            <select
              className="form-select rounded-pill btn-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Services</option>
              <option value="dev">Development & Tasks</option>
              <option value="seo">SEO & Backlinks</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label small text-secondary fw-bold">Start Date</label>
            <input
              type="date"
              className="form-control rounded-pill btn-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small text-secondary fw-bold">End Date</label>
            <input
              type="date"
              className="form-control rounded-pill btn-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {(selectedWebsite || selectedProject || startDate || endDate || selectedType) && (
          <div className="mt-3 text-end">
            <button className="btn btn-outline-secondary rounded-pill btn-sm" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : unifiedUpdates.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5 bg-white animate__animated animate__fadeInUp">
          <Clock className="mx-auto text-muted opacity-25 mb-3" size={48} />
          <h5 className="fw-bold text-dark">No updates recorded</h5>
          <p className="text-muted">No activities fit your active filters.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4 animate__animated animate__fadeInUp">
          {unifiedUpdates.map((update) => (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" key={update.id}>
              
              {/* Header section */}
              <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-2 flex-wrap gap-2">
                <div>
                  <span className={`badge ${update.type === "seo_log" ? "bg-info text-white" : "bg-primary text-white"} rounded-pill px-3 py-1 mb-2 fw-semibold`} style={{ fontSize: "0.7rem" }}>
                    {update.type === "seo_log" ? "SEO CAMPAIGN" : "PROJECT TASK"}
                  </span>
                  <h5 className="fw-bold text-dark mb-1">{update.title}</h5>
                  <span className="text-muted small d-block">
                    Logged Date: <strong className="text-dark">{update.date}</strong>
                  </span>
                </div>
                <span className={`badge px-3 py-2 rounded-pill ${
                  update.status === "approved" || update.status === "completed" || update.status === "done" ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"
                }`}>
                  {update.status}
                </span>
              </div>

              {/* Description remarks */}
              <p className="text-muted small mb-3">{update.description}</p>

              {/* Nested tables for SEO items */}
              {update.type === "seo_log" && update.meta.items && (
                <div className="table-responsive">
                  <table className="table align-middle table-sm mt-2">
                    <thead>
                      <tr className="table-light">
                        <th>Activity Type</th>
                        <th>Count</th>
                        <th>Keyword Target</th>
                        <th>Submission URL</th>
                        <th className="text-center">Domain Authority</th>
                        <th className="text-center">Spam Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {update.meta.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="fw-medium text-dark">{item.activity_type_name}</td>
                          <td className="fw-bold">{item.count}</td>
                          <td className="text-muted small">{item.keyword || "N/A"}</td>
                          <td className="text-truncate" style={{ maxWidth: "250px" }}>
                            {item.submission_url ? (
                              <a href={item.submission_url} target="_blank" rel="noreferrer" className="text-info text-decoration-none">
                                {item.submission_url}
                              </a>
                            ) : "N/A"}
                          </td>
                          <td className="text-center">{item.domain_authority || "N/A"}</td>
                          <td className="text-center">{item.spam_score !== null ? `${item.spam_score}%` : "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientDailyUpdatesPage;
