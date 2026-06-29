import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Link } from "react-router-dom";
import {
  Briefcase, CheckCircle, Clock, FileText, Globe, Bell, AlertTriangle, ChevronRight,
  TrendingUp, Download, Plus, MessageSquare, Shield, DollarSign, Calendar
} from "lucide-react";

type ClientProfile = {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
};

type DashboardMetrics = {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  website_development_projects: number;
  mobile_app_projects: number;
  seo_projects: number;
  branding_projects: number;
  pending_project_tasks: number;
  completed_project_tasks: number;
  pending_seo_tasks: number;
  completed_seo_tasks: number;
  today_work_updates: number;
  files_uploaded: number;
  latest_report: string;
  current_milestone: string;
  pending_invoices: number;
  paid_invoices: number;
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

type RecentDocument = {
  id: string;
  name: string;
  type: string;
  project_name: string;
  date: string;
  url: string;
  download_url: string | null;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
};

type Deadline = {
  type: string;
  title: string;
  due_date: string;
  status: string;
  project_name: string;
};

type Invoice = {
  id: number;
  invoice_number: string;
  total: string;
  status: string;
  issue_date: string;
  due_date: string;
};

type DashboardData = {
  profile: ClientProfile;
  metrics: DashboardMetrics;
  recent_activities: UnifiedActivity[];
  recent_documents: RecentDocument[];
  recent_notifications: Notification[];
  invoices: Invoice[];
  upcoming_deadlines: Deadline[];
};

const ClientDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const res = await axiosInstance.get("/client/dashboard/overview/");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching dashboard overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownloadInvoice = async (url: string) => {
    try {
      window.open(`${axiosInstance.defaults.baseURL}${url.replace("/api/v1", "")}`, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const getModuleBadgeColor = (module: string) => {
    switch (module.toLowerCase()) {
      case "projects":
        return "bg-primary text-white";
      case "seo":
        return "bg-info text-white";
      case "invoices":
        return "bg-success text-white";
      case "tasks":
        return "bg-warning text-dark";
      case "proposals":
        return "bg-secondary text-white";
      default:
        return "bg-dark text-white";
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

  const metrics = data?.metrics;
  const profile = data?.profile;
  const recentActivities = data?.recent_activities || [];
  const recentDocuments = data?.recent_documents || [];
  const notifications = data?.recent_notifications || [];
  const deadlines = data?.upcoming_deadlines || [];
  const invoices = data?.invoices || [];

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* Welcome Banner */}
      <div className="row mb-4 animate__animated animate__fadeIn">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden" 
               style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)" }}>
            <div className="position-absolute top-0 end-0 opacity-10" style={{ transform: "translate(20%, -20%)" }}>
              <Shield size={300} />
            </div>
            <div className="position-relative">
              <span className="badge bg-white-50 text-white mb-2 px-3 py-1.5 fw-semibold rounded-pill">
                Client Portal
              </span>
              <h1 className="fw-bold mb-1">Welcome back, {profile?.name || "Client"}!</h1>
              <p className="mb-0 opacity-75">
                {profile?.company_name ? `Corporate Profile: ${profile.company_name}` : "Access all your development, SEO, and billing activities in one place."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Notifications Alerts */}
      {notifications.length > 0 && (
        <div className="row mb-4 animate__animated animate__fadeIn">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-warning-subtle border-start border-warning border-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center">
                  <Bell className="text-warning me-3" size={24} />
                  <div>
                    <strong className="text-warning-emphasis">You have {notifications.length} unread updates</strong>
                    <span className="text-secondary small d-block">Review invoice updates, deliverables uploads, or timeline changes.</span>
                  </div>
                </div>
                <Link to="/client/notifications" className="btn btn-warning btn-sm rounded-pill px-3 fw-bold">
                  View All
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Summary Row */}
      <div className="row g-3 mb-4 animate__animated animate__fadeInUp">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 hover-lift">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-primary-subtle text-primary rounded-4 me-3">
                <Briefcase size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Active Projects</small>
                <h3 className="fw-bold text-dark mb-0">{metrics?.active_projects || 0}</h3>
              </div>
            </div>
            <div className="mt-3 text-muted small">
              Total assigned: <span className="fw-bold">{metrics?.total_projects || 0}</span>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 hover-lift">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-success-subtle text-success rounded-4 me-3">
                <CheckCircle size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Project Tasks</small>
                <h3 className="fw-bold text-dark mb-0">
                  {metrics?.completed_project_tasks || 0}/{((metrics?.pending_project_tasks || 0) + (metrics?.completed_project_tasks || 0))}
                </h3>
              </div>
            </div>
            <div className="mt-3 text-muted small">
              Pending: <span className="fw-bold text-danger">{metrics?.pending_project_tasks || 0}</span> tasks
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 hover-lift">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-info-subtle text-info rounded-4 me-3">
                <Globe size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>SEO Targets</small>
                <h3 className="fw-bold text-dark mb-0">
                  {metrics?.completed_seo_tasks || 0}/{((metrics?.pending_seo_tasks || 0) + (metrics?.completed_seo_tasks || 0))}
                </h3>
              </div>
            </div>
            <div className="mt-3 text-muted small">
              SEO Websites: <span className="fw-bold">{metrics?.seo_projects || 0}</span>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 hover-lift">
            <div className="d-flex align-items-center">
              <div className="p-3 bg-danger-subtle text-danger rounded-4 me-3">
                <DollarSign size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Pending Invoices</small>
                <h3 className="fw-bold text-dark mb-0">{metrics?.pending_invoices || 0}</h3>
              </div>
            </div>
            <div className="mt-3 text-muted small">
              Paid invoices: <span className="fw-bold">{metrics?.paid_invoices || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Aggregated Layout Grid */}
      <div className="row g-4 mb-4">
        {/* Left Side: Timeline Feed */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white animate__animated animate__fadeInUp">
            <h5 className="fw-bold text-dark mb-4">Unified Activity Timeline</h5>
            
            {recentActivities.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <Clock className="mx-auto mb-3 opacity-25" size={48} />
                <p className="mb-0">No active work records logged under your account yet.</p>
              </div>
            ) : (
              <div className="timeline-feed">
                {recentActivities.map((act, index) => (
                  <div className="d-flex mb-4 position-relative" key={index}>
                    {index !== recentActivities.length - 1 && (
                      <div className="position-absolute bg-light border-start" 
                           style={{ left: "20px", top: "40px", bottom: "-30px", width: "2px", zIndex: 1 }}></div>
                    )}
                    <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
                         style={{ width: "40px", height: "40px", zIndex: 2, background: "#f3f4f6" }}>
                      <span className="small text-muted fw-bold">
                        {act.module.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start justify-content-between flex-wrap gap-1">
                        <div>
                          <span className={`badge ${getModuleBadgeColor(act.module)} rounded-pill px-2 py-0.5 small me-2`}>
                            {act.module.toUpperCase()}
                          </span>
                          <span className="text-muted small">
                            {new Date(act.timestamp).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <span className="small text-secondary fw-semibold">by {act.performed_by}</span>
                      </div>
                      <p className="mb-0 fw-bold text-dark mt-1">{act.title}</p>
                      <p className="mb-0 text-muted small">{act.description}</p>
                      
                      {(act.project || act.website) && (
                        <div className="d-flex gap-2 mt-1 flex-wrap">
                          {act.project && (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-0.5" style={{ fontSize: "0.7rem" }}>
                              Project: {act.project}
                            </span>
                          )}
                          {act.website && (
                            <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2.5 py-0.5" style={{ fontSize: "0.7rem" }}>
                              Website: {act.website}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Sidebar widgets */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4">
            
            {/* Upcoming Deadlines Widget */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeInUp">
              <h5 className="fw-bold text-dark mb-3">Upcoming Deadlines</h5>
              {deadlines.length === 0 ? (
                <p className="text-muted small mb-0">No upcoming milestones or task deadlines scheduled.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {deadlines.map((dl, idx) => (
                    <div key={idx} className="p-3 bg-light rounded-3 d-flex align-items-start justify-content-between gap-2 border-start border-danger border-3">
                      <div className="text-truncate">
                        <span className="badge bg-danger-subtle text-danger rounded-pill px-2 py-0.5 mb-1" style={{ fontSize: "0.65rem" }}>
                          {dl.type.toUpperCase()}
                        </span>
                        <h6 className="fw-bold mb-0 text-dark text-truncate small">{dl.title}</h6>
                        <span className="text-muted small text-truncate d-block" style={{ fontSize: "0.75rem" }}>
                          Proj: {dl.project_name}
                        </span>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <span className="small text-danger fw-bold d-block" style={{ fontSize: "0.75rem" }}>
                          {dl.due_date}
                        </span>
                        <span className="text-muted small" style={{ fontSize: "0.7rem" }}>Due</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Centralized Documents Widget */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeInUp">
              <h5 className="fw-bold text-dark mb-3">Centralized Vault</h5>
              {recentDocuments.length === 0 ? (
                <p className="text-muted small mb-0">No downloadable invoices or files available.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {recentDocuments.map((doc, idx) => (
                    <div key={idx} className="d-flex align-items-center justify-content-between p-2.5 rounded-3 hover-bg-light transition">
                      <div className="d-flex align-items-center text-truncate me-2">
                        <FileText className="text-secondary me-2.5 flex-shrink-0" size={18} />
                        <div className="text-truncate">
                          <h6 className="mb-0 fw-bold text-dark small text-truncate">{doc.name}</h6>
                          <span className="text-muted small" style={{ fontSize: "0.7rem" }}>{doc.type} • {doc.date}</span>
                        </div>
                      </div>
                      
                      {doc.type === "Proposal" ? (
                        <Link to={doc.url} className="btn btn-outline-primary btn-sm rounded-circle p-1.5 flex-shrink-0">
                          <ChevronRight size={14} />
                        </Link>
                      ) : doc.download_url ? (
                        <button className="btn btn-outline-primary btn-sm rounded-circle p-1.5 flex-shrink-0"
                                onClick={() => handleDownloadInvoice(doc.download_url!)}>
                          <Download size={14} />
                        </button>
                      ) : (
                        <a href={doc.url} target="_blank" rel="noreferrer" 
                           className="btn btn-outline-secondary btn-sm rounded-circle p-1.5 flex-shrink-0">
                          <ChevronRight size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                  <Link to="/client/documents" className="btn btn-outline-primary rounded-pill w-100 btn-sm mt-2 fw-semibold">
                    Open Vault
                  </Link>
                </div>
              )}
            </div>

            {/* Unpaid Invoices Widget */}
            {invoices.some(inv => inv.status !== "paid") && (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white animate__animated animate__fadeInUp">
                <h5 className="fw-bold text-dark mb-3">Pending Payments</h5>
                <div className="d-flex flex-column gap-2">
                  {invoices.filter(inv => inv.status !== "paid").map((inv, idx) => (
                    <div key={idx} className="p-3 bg-danger-subtle rounded-3 border-start border-danger border-3 d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark small">Inv #{inv.invoice_number}</h6>
                        <span className="text-secondary small" style={{ fontSize: "0.75rem" }}>Due: {inv.due_date}</span>
                      </div>
                      <div className="text-end">
                        <strong className="text-danger d-block">Rs {inv.total}</strong>
                        <span className="badge bg-danger rounded-pill py-0.5 px-2 text-uppercase" style={{ fontSize: "0.6rem" }}>Unpaid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
