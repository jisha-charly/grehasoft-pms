import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Link } from "react-router-dom";
import { Briefcase, Globe, Shield, User, Calendar, ExternalLink, Activity } from "lucide-react";

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
  type: "development" | "seo" | "branding" | "mobile";
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
};

const ClientProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAllClientServices = async () => {
      try {
        const [projRes, webRes] = await Promise.all([
          axiosInstance.get("/projects/"),
          axiosInstance.get("/websites/")
        ]);

        const pmProjects = (projRes.data.results || projRes.data || []).map((p: any) => {
          let projectType: Project["type"] = "development";
          const lowerName = p.name.toLowerCase();
          if (lowerName.includes("branding") || lowerName.includes("logo") || lowerName.includes("design")) {
            projectType = "branding";
          } else if (lowerName.includes("mobile") || lowerName.includes("app")) {
            projectType = "mobile";
          }
          return { ...p, type: projectType };
        });

        setProjects(pmProjects);
        setWebsites(webRes.data.results || webRes.data || []);
      } catch (err) {
        console.error("Error loading client projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllClientServices();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
      case "active":
        return <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 text-capitalize">Active</span>;
      case "completed":
        return <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1 text-capitalize">Completed</span>;
      case "on_hold":
        return <span className="badge bg-warning-subtle text-warning rounded-pill px-3 py-1 text-capitalize">On Hold</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1 text-capitalize">{status}</span>;
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

  const hasServices = projects.length > 0 || websites.length > 0;

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="mb-4 animate__animated animate__fadeIn">
        <h2 className="fw-bold text-dark mb-1">Your Portfolio</h2>
        <p className="text-muted mb-0">Monitor Website Development, SEO Campaigns, Mobile Apps, and Branding services in one place.</p>
      </div>

      {!hasServices ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5 animate__animated animate__fadeInUp">
          <Briefcase className="mx-auto text-muted opacity-20 mb-3" size={64} />
          <h5 className="fw-bold text-dark">No Services Found</h5>
          <p className="text-muted">You do not have any active projects or websites assigned to your account.</p>
        </div>
      ) : (
        <div className="row g-4 animate__animated animate__fadeInUp">
          {/* Render Development Projects */}
          {projects.map((proj) => (
            <div className="col-md-6 col-lg-4" key={`project-${proj.id}`}>
              <div className="card border-0 shadow-sm rounded-4 h-100 hover-lift d-flex flex-column bg-white">
                <div className="card-body p-4 d-flex flex-column flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge bg-primary text-white rounded-pill px-2.5 py-0.5 text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                      {proj.type === "branding" ? "Branding" : proj.type === "mobile" ? "Mobile App" : "Website Development"}
                    </span>
                    {getStatusBadge(proj.status)}
                  </div>

                  <h5 className="fw-bold text-dark mb-2 text-truncate">{proj.name}</h5>
                  <p className="text-secondary small mb-3"><i className="bi bi-building me-1"></i> {getClientDisplayName(proj.client)}</p>
                  
                  <p className="text-muted small mb-4 flex-grow-1 text-truncate-3">
                    {proj.description || "No project description provided."}
                  </p>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-secondary fw-semibold">Development Progress</span>
                      <span className="small text-dark fw-bold">{proj.progress_percentage || 0}%</span>
                    </div>
                    <div className="progress" style={{ height: "6px" }}>
                      <div
                        className="progress-bar bg-primary rounded-pill"
                        role="progressbar"
                        style={{ width: `${proj.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <hr className="my-3 opacity-10" />

                  <div className="row g-2 mb-4">
                    <div className="col-6">
                      <span className="text-muted small d-block" style={{ fontSize: "0.7rem" }}>Start Date</span>
                      <span className="fw-semibold text-dark small">{proj.start_date || "N/A"}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-muted small d-block" style={{ fontSize: "0.7rem" }}>Deadline</span>
                      <span className="fw-semibold text-dark small">{proj.end_date || "N/A"}</span>
                    </div>
                  </div>

                  {proj.project_manager_name && (
                    <div className="d-flex align-items-center bg-light p-2 rounded-3 mb-4">
                      <User size={16} className="text-primary me-2" />
                      <div className="text-truncate">
                        <span className="text-muted small d-block" style={{ fontSize: "0.65rem" }}>Project Manager</span>
                        <span className="fw-bold text-dark small text-truncate">{proj.project_manager_name}</span>
                      </div>
                    </div>
                  )}

                  <Link to={`/client/projects/${proj.id}`} className="btn btn-primary rounded-pill w-100 mt-auto fw-bold">
                    Open Dashboard Hub
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Render SEO Websites */}
          {websites.map((web) => (
            <div className="col-md-6 col-lg-4" key={`website-${web.id}`}>
              <div className="card border-0 shadow-sm rounded-4 h-100 hover-lift d-flex flex-column bg-white border-start border-info border-4">
                <div className="card-body p-4 d-flex flex-column flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge bg-info text-white rounded-pill px-2.5 py-0.5 text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                      SEO Campaign
                    </span>
                    {getStatusBadge(web.status)}
                  </div>

                  <h5 className="fw-bold text-dark mb-1 text-truncate">{web.website_name}</h5>
                  <a href={web.domain_url} target="_blank" rel="noreferrer" 
                     className="text-info small mb-3 d-flex align-items-center gap-1 text-decoration-none">
                    {web.domain_url} <ExternalLink size={12} />
                  </a>

                  <p className="text-muted small mb-4 flex-grow-1 text-truncate-3">
                    {web.notes || "SEO campaign optimization for target keywords ranking."}
                  </p>

                  <div className="p-3 bg-light rounded-3 mb-4">
                    <div className="row g-2">
                      <div className="col-6">
                        <span className="text-muted small d-block" style={{ fontSize: "0.65rem" }}>SEO Package</span>
                        <span className="fw-bold text-dark small text-capitalize">{web.package_plan}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted small d-block" style={{ fontSize: "0.65rem" }}>Launch Date</span>
                        <span className="fw-bold text-dark small">{web.start_date || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {web.assigned_executive_name && (
                    <div className="d-flex align-items-center bg-light p-2 rounded-3 mb-4">
                      <User size={16} className="text-info me-2" />
                      <div className="text-truncate">
                        <span className="text-muted small d-block" style={{ fontSize: "0.65rem" }}>Assigned Executive</span>
                        <span className="fw-bold text-dark small text-truncate">{web.assigned_executive_name}</span>
                      </div>
                    </div>
                  )}

                  {/* For SEO Websites, we link to ClientProjectDetailsPage but can load SEO specific tabs dynamically */}
                  <Link to={`/client/projects/seo-${web.id}`} className="btn btn-info text-white rounded-pill w-100 mt-auto fw-bold">
                    Open Campaign Hub
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientProjectsPage;
