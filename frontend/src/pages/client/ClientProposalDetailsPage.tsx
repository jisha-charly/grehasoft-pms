import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { generateProposalPDF } from "../../utils/pdfGenerator";
import { Proposal } from "../../types";
import {
  ArrowLeft, Download, FileText, Calendar, CheckSquare, Shield,
  DollarSign, Clock, Briefcase, FileCode, AlertTriangle, ShieldAlert, FileQuestion
} from "lucide-react";

const ClientProposalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      setLoading(true);
      setErrorStatus(null);
      try {
        const res = await axiosInstance.get(`/proposals/${id}/`);
        setProposal(res.data);
      } catch (err: any) {
        console.error("Error loading client proposal details:", err);
        if (err.response?.status === 403) {
          setErrorStatus(403);
        } else if (err.response?.status === 404) {
          setErrorStatus(404);
        } else {
          setErrorStatus(500);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProposal();
    }
  }, [id]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-success-subtle text-success border border-success-subtle";
      case "sent":
        return "bg-primary-subtle text-primary border border-primary-subtle";
      case "rejected":
        return "bg-danger-subtle text-danger border border-danger-subtle";
      default:
        return "bg-secondary-subtle text-secondary border border-secondary-subtle";
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 bg-light min-vh-100">
        {/* Header Breadcrumb Skeleton */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white placeholder-glow">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
            <div className="col-12 col-md-6 animate__animated animate__pulse animate__infinite">
              <span className="placeholder col-4 mb-3 rounded" style={{ height: "16px" }}></span>
              <h2 className="placeholder col-10 rounded py-3 mt-1" style={{ height: "40px" }}></h2>
              <div className="d-flex gap-2 mt-2">
                <span className="placeholder col-3 rounded" style={{ height: "16px" }}></span>
                <span className="placeholder col-3 rounded" style={{ height: "16px" }}></span>
              </div>
            </div>
            <div className="col-12 col-md-4 text-md-end">
              <span className="placeholder col-4 py-3 rounded-pill me-2" style={{ height: "38px" }}></span>
              <span className="placeholder col-6 py-3 rounded-pill" style={{ height: "38px" }}></span>
            </div>
          </div>
        </div>

        <div className="row g-4 placeholder-glow">
          <div className="col-lg-8 animate__animated animate__pulse animate__infinite">
            <div className="d-flex flex-column gap-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <span className="placeholder col-3 mb-3 py-2 rounded" style={{ height: "24px" }}></span>
                <span className="placeholder col-12 mb-2 rounded" style={{ height: "16px" }}></span>
                <span className="placeholder col-10 mb-2 rounded" style={{ height: "16px" }}></span>
              </div>
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <span className="placeholder col-4 mb-3 py-2 rounded" style={{ height: "24px" }}></span>
                <span className="placeholder col-12 mb-2 rounded" style={{ height: "16px" }}></span>
                <span className="placeholder col-11 mb-2 rounded" style={{ height: "16px" }}></span>
                <span className="placeholder col-9 mb-2 rounded" style={{ height: "16px" }}></span>
              </div>
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <span className="placeholder col-5 mb-3 py-2 rounded" style={{ height: "24px" }}></span>
                <span className="placeholder col-12 rounded" style={{ height: "120px" }}></span>
              </div>
            </div>
          </div>
          <div className="col-lg-4 animate__animated animate__pulse animate__infinite">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <span className="placeholder col-6 mb-4 py-2 rounded" style={{ height: "24px" }}></span>
              <span className="placeholder col-8 mb-2 rounded" style={{ height: "16px" }}></span>
              <span className="placeholder col-10 mb-2 rounded" style={{ height: "16px" }}></span>
              <span className="placeholder col-6 mb-2 rounded" style={{ height: "16px" }}></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="container py-5 bg-light min-vh-100 d-flex flex-column align-items-center justify-content-center animate__animated animate__fadeIn">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white" style={{ maxWidth: "500px" }}>
          <div className="p-4 bg-danger-subtle text-danger rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: "100px", height: "100px" }}>
            <ShieldAlert size={48} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Access Denied</h4>
          <p className="text-muted mb-4">You do not have authorization to view this business proposal. If this is an error, please reach out to your sales executive.</p>
          <div className="d-grid gap-2">
            <Link to="/client/dashboard" className="btn btn-primary rounded-pill py-2.5 fw-bold shadow-sm">
              Return to Dashboard
            </Link>
            <Link to="/client/documents" className="btn btn-outline-secondary rounded-pill py-2.5 fw-semibold">
              Go to Documents Vault
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorStatus === 404) {
    return (
      <div className="container py-5 bg-light min-vh-100 d-flex flex-column align-items-center justify-content-center animate__animated animate__fadeIn">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white" style={{ maxWidth: "500px" }}>
          <div className="p-4 bg-warning-subtle text-warning-emphasis rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: "100px", height: "100px" }}>
            <FileQuestion size={48} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Proposal Not Found</h4>
          <p className="text-muted mb-4">The proposal document you are looking for does not exist or has been removed from the server.</p>
          <div className="d-grid gap-2">
            <Link to="/client/documents" className="btn btn-primary rounded-pill py-2.5 fw-bold shadow-sm">
              Back to Documents
            </Link>
            <Link to="/client/dashboard" className="btn btn-outline-secondary rounded-pill py-2.5 fw-semibold">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="container py-5 bg-light min-vh-100 d-flex flex-column align-items-center justify-content-center animate__animated animate__fadeIn">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white" style={{ maxWidth: "500px" }}>
          <div className="p-4 bg-secondary-subtle text-secondary rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: "100px", height: "100px" }}>
            <AlertTriangle size={48} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Server Error</h4>
          <p className="text-muted mb-4">An error occurred while attempting to fetch this proposal document. Please try again later.</p>
          <Link to="/client/dashboard" className="btn btn-primary rounded-pill py-2.5 fw-bold shadow-sm">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  // Fallback for overview / description if empty
  const projectOverview = proposal.projectOverview || "To develop a user-friendly, professional, and SEO-optimized website that enhances the client's online presence, improves visibility, and facilitates efficient product and order management.";
  const descriptionIntro = proposal.description || "Thank you for considering GrehaSoft for your website development needs. As discussed, we have reviewed the reference website and are pleased to submit a proposal for your consideration.";

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* Header Breadcrumbs Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white animate__animated animate__fadeIn">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
          <div>
            <Link to="/client/documents" className="btn btn-link text-decoration-none text-muted p-0 mb-2 d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" /> Back to Documents
            </Link>
            <h2 className="fw-bold text-dark mb-1">{proposal.title}</h2>
            <div className="d-flex align-items-center gap-3 text-secondary small flex-wrap">
              <span className="fw-semibold text-primary">{(proposal as any).proposal_number || `PROP-${proposal.id.toString().padStart(4, '0')}`}</span>
              <span>•</span>
              <span className="d-flex align-items-center"><Calendar size={14} className="me-1" /> {new Date(proposal.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className={`badge px-3 py-2 rounded-pill text-capitalize ${getStatusBadgeColor(proposal.status)}`}>
              {proposal.status}
            </span>
            <button
              onClick={() => generateProposalPDF(proposal)}
              className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
            >
              <Download size={16} /> Download Proposal PDF
            </button>
          </div>
        </div>
      </div>

      <div className="row g-4 animate__animated animate__fadeInUp">
        {/* Left column: Details */}
        <div className="col-lg-8">
          <div className="d-flex flex-column gap-4">
            
            {/* Project Overview */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Project Overview
              </h5>
              <p className="text-muted leading-relaxed mb-0">{projectOverview}</p>
            </div>

            {/* Scope of Work */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <CheckSquare size={20} className="text-primary" /> Scope of Work
              </h5>
              <p className="text-muted leading-relaxed mb-4">{descriptionIntro}</p>
              
              <h6 className="fw-bold text-dark mb-2">Core Website Features Included:</h6>
              <ul className="list-group list-group-flush mb-4">
                <li className="list-group-item px-0 py-2.5 bg-transparent border-light text-muted small d-flex align-items-start gap-2">
                  <span className="badge bg-primary-subtle text-primary rounded-circle p-1 mt-0.5">1</span>
                  <div><strong>Device Independence:</strong> Fully responsive design optimized for mobile, tablet, and desktop screens.</div>
                </li>
                <li className="list-group-item px-0 py-2.5 bg-transparent border-light text-muted small d-flex align-items-start gap-2">
                  <span className="badge bg-primary-subtle text-primary rounded-circle p-1 mt-0.5">2</span>
                  <div><strong>SEO Friendliness:</strong> Integration of search-engine-friendly URLs, meta fields, and image tags.</div>
                </li>
                <li className="list-group-item px-0 py-2.5 bg-transparent border-light text-muted small d-flex align-items-start gap-2">
                  <span className="badge bg-primary-subtle text-primary rounded-circle p-1 mt-0.5">3</span>
                  <div><strong>Social Media Integration:</strong> Easy sharing features and direct links to official corporate channels.</div>
                </li>
                <li className="list-group-item px-0 py-2.5 bg-transparent border-light text-muted small d-flex align-items-start gap-2">
                  <span className="badge bg-primary-subtle text-primary rounded-circle p-1 mt-0.5">4</span>
                  <div><strong>Analytics and Tracking:</strong> Seamless integration of Google Analytics and Google Search Console tools.</div>
                </li>
              </ul>
            </div>

            {/* Timeline */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Clock size={20} className="text-primary" /> Estimated Timeline
              </h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block mb-1">Phase 1: Design & Dev</span>
                    <strong className="text-dark">2 - 3 Weeks</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block mb-1">Phase 2: QA & Review</span>
                    <strong className="text-dark">1 Week</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <span className="text-muted small d-block mb-1">Phase 3: Deployment</span>
                    <strong className="text-dark">Immediate on Sign-off</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <DollarSign size={20} className="text-primary" /> Pricing Summary
              </h5>
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="bg-light text-secondary small fw-bold">
                    <tr>
                      <th style={{ width: "30%" }}>Deliverable / Service</th>
                      <th style={{ width: "50%" }}>Scope Description</th>
                      <th style={{ width: "20%" }} className="text-end">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.items && proposal.items.length > 0 ? (
                      proposal.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-dark small">{item.service}</td>
                          <td className="text-muted small">{item.description || "Project deliverable implementation"}</td>
                          <td className="text-end text-dark small fw-semibold">₹{Number(item.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="fw-bold text-dark small">Website Development Services</td>
                        <td className="text-muted small">Full customized website layout design and production deployment.</td>
                        <td className="text-end text-dark small fw-semibold">₹{Number(proposal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="text-end text-muted small fw-bold">Subtotal:</td>
                      <td className="text-end text-dark small fw-semibold">₹{Number(proposal.subtotal || proposal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {proposal.discount && Number(proposal.discount) > 0 ? (
                      <tr>
                        <td colSpan={2} className="text-end text-muted small fw-bold text-success">Discount:</td>
                        <td className="text-end text-success small fw-semibold">-₹{Number(proposal.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ) : null}
                    <tr className="table-primary border-primary">
                      <td colSpan={2} className="text-end fw-bold text-primary-emphasis">Grand Total:</td>
                      <td className="text-end fw-bold text-primary-emphasis fs-6">₹{Number(proposal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Shield size={20} className="text-primary" /> Terms & Conditions
              </h5>
              <div className="row g-2" style={{ maxHeight: "300px", overflowY: "auto" }}>
                <div className="col-12 text-muted small">
                  <div className="mb-2"><strong>1. Payment Schedule:</strong> 50% upfront payment required to initiate the project, with the remaining 50% due immediately upon project completion and deployment readiness.</div>
                  <div className="mb-2"><strong>2. Scope Boundary:</strong> Estimates are based on the current agreed requirements. Any additions or custom modules requested subsequently may result in extra development cost.</div>
                  <div className="mb-2"><strong>3. Revisions:</strong> Includes 1 initial concept layout mock-up and up to 2 subsequent revision cycles before sign-off.</div>
                  <div className="mb-2"><strong>4. Content Delivery:</strong> The client is responsible for delivering all assets (logos, content copy, photography) within 7 business days of signing to prevent timeline extensions.</div>
                  <div className="mb-2"><strong>5. Subscriptions & Third-Party:</strong> Domain names, SSL certificates, host servers, API integrations, and plugin licenses are third-party costs and not bundled in the core quote.</div>
                  <div className="mb-2"><strong>6. Validity:</strong> This document and pricing structure are valid for 3 months from the date of issuance.</div>
                  <div className="mb-2"><strong>7. Technical Support:</strong> Post-deployment support is available Monday through Friday, 9:00 AM to 6:00 PM IST (excluding national holidays).</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Right column: Info cards */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4">
            
            {/* Client Info Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <FileText size={20} className="text-primary" /> Client Profile
              </h5>
              <div className="d-flex flex-column gap-3">
                <div>
                  <span className="text-muted small d-block">Authorized Contact</span>
                  <strong className="text-dark">{(proposal as any).client_details?.name || proposal.leadName || "Valued Client"}</strong>
                </div>
                {((proposal as any).client_details?.company_name) && (
                  <div>
                    <span className="text-muted small d-block">Company / Business Name</span>
                    <strong className="text-dark">{(proposal as any).client_details.company_name}</strong>
                  </div>
                )}
                {((proposal as any).client_details?.email || proposal.leadEmail) && (
                  <div>
                    <span className="text-muted small d-block">Email Address</span>
                    <strong className="text-dark">{(proposal as any).client_details?.email || proposal.leadEmail}</strong>
                  </div>
                )}
                {((proposal as any).client_details?.phone || proposal.leadPhone) && (
                  <div>
                    <span className="text-muted small d-block">Contact Phone</span>
                    <strong className="text-dark">{(proposal as any).client_details?.phone || proposal.leadPhone}</strong>
                  </div>
                )}
                {((proposal as any).client_details?.address) && (
                  <div>
                    <span className="text-muted small d-block">Billing Address</span>
                    <p className="mb-0 text-dark small">{(proposal as any).client_details.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <FileCode size={20} className="text-primary" /> Vault Attachments
              </h5>
              <div className="p-3 bg-light rounded-3 text-center">
                <FileText className="text-muted opacity-30 mb-2" size={32} />
                <p className="text-muted small mb-0">No external attachment documents are appended to this proposal vault.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProposalDetailsPage;
