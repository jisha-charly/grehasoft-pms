import React, { useState, useMemo } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Eye, Pencil, Trash, Search, Plus } from "lucide-react";
import { useCrud } from "../../hooks/useCrud";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Project {
  id: number;
  name: string;
}

interface Domain {
  id: number;
  domain_name: string;
}

interface Credential {
  id: number;
  project: number;
  project_name?: string;
  domain: number;
  domain_name?: string;
  admin_url: string;
  admin_username: string;
  admin_password?: string;
  cpanel_url?: string;
  cpanel_username?: string;
  cpanel_password?: string;
  ftp_host?: string;
  ftp_username?: string;
  ftp_password?: string;
  client_email?: string;
  client_email_password?: string;
  business_email?: string;
  business_email_password?: string;
  business_email_type?: string;
  notes?: string;
}

interface CredentialsPageProps {
  projects?: Project[];
  domains?: Domain[];
}

const CredentialsPage: React.FC<CredentialsPageProps> = ({ projects = [], domains = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Custom Hook replaces standalone endpoints for consistent behavior
  const {
    items: credentials,
    pagination: { page: currentPage, setPage, totalPages },
    add,
    update,
    delete: deleteCredential,
    refetch,
    loading
  } = useCrud<Credential>({ 
    endpoint: '/infrastructure/credentials',
    queryParams: { search: searchTerm }
  });

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewCredential, setViewCredential] = useState<Credential | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<number | null>(null);

  const [form, setForm] = useState({
    project: "",
    domain: "",
    admin_url: "",
    admin_username: "",
    admin_password: "",
    cpanel_url: "",
    cpanel_username: "",
    cpanel_password: "",
    ftp_host: "",
    ftp_username: "",
    ftp_password: "",
    client_email: "",
    client_email_password: "",
    business_email: "",
    business_email_password: "",
    business_email_type: "",
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.project) newErrors.project = "Project is required";
    if (!form.domain) newErrors.domain = "Domain is required";
    if (!form.admin_url) newErrors.admin_url = "Admin URL is required";
    if (!form.admin_username) newErrors.admin_username = "Admin Username is required";
    if (!form.admin_password) newErrors.admin_password = "Admin Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    // Clear individual error
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        project: Number(form.project),
        domain: Number(form.domain)
      };

      if (isEditMode && editingId) {
        await update(editingId, payload);
      } else {
        await add(payload);
      }
      
      closeModal();
      refetch();
    } catch (error: any) {
      console.error(error.response?.data);
      alert(error.response?.data?.message || "Error saving credential");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cred: Credential) => {
    setForm({
      project: cred.project.toString(),
      domain: cred.domain.toString(),
      admin_url: cred.admin_url || "",
      admin_username: cred.admin_username || "",
      admin_password: cred.admin_password || "",
      cpanel_url: cred.cpanel_url || "",
      cpanel_username: cred.cpanel_username || "",
      cpanel_password: cred.cpanel_password || "",
      ftp_host: cred.ftp_host || "",
      ftp_username: cred.ftp_username || "",
      ftp_password: cred.ftp_password || "",
      client_email: cred.client_email || "",
      client_email_password: cred.client_email_password || "",
      business_email: cred.business_email || "",
      business_email_password: cred.business_email_password || "",
      business_email_type: cred.business_email_type || "",
      notes: cred.notes || ""
    });
    setEditingId(cred.id);
    setIsEditMode(true);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this credential?")) {
      try {
        await deleteCredential(id);
        refetch();
      } catch (error) {
        console.error("Error deleting credential", error);
        alert("Failed to delete credential");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingId(null);
    setErrors({});
    setForm({
      project: "",
      domain: "",
      admin_url: "",
      admin_username: "",
      admin_password: "",
      cpanel_url: "",
      cpanel_username: "",
      cpanel_password: "",
      ftp_host: "",
      ftp_username: "",
      ftp_password: "",
      client_email: "",
      client_email_password: "",
      business_email: "",
      business_email_password: "",
      business_email_type: "",
      notes: ""
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const pageNumbers: number[] = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  );

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Website Credentials</h3>
          <p className="text-secondary small mb-0">Manage secure access credentials for client domains</p>
        </div>
        
        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />
            <input 
              type="text" 
              className="form-control ps-5 border-0 shadow-sm rounded-pill" 
              placeholder="Search credentials..." 
              value={searchTerm}
              onChange={handleSearch}
              style={{ width: '250px' }}
            />
          </div>
          <button className="btn btn-primary fw-bold px-4 shadow-sm rounded-pill d-flex align-items-center" onClick={() => setShowModal(true)}>
            <Plus size={16} className="me-2" /> New Credential
          </button>
        </div>
      </div>

      {loading && credentials.length === 0 ? (
        <div className="text-center p-5">Loading credentials...</div>
      ) : (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="py-3">Domain</th>
                  <th className="py-3">Admin URL</th>
                  <th className="py-3">Admin Username</th>
                  <th className="py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No credentials found matching your search.
                    </td>
                  </tr>
                )}
                {credentials.map((cred) => (
                  <tr key={cred.id}>
                    <td className="px-4 py-3 fw-medium text-dark">{cred.project_name || "-"}</td>
                    <td className="py-3 text-secondary">{cred.domain_name || "-"}</td>
                    <td className="py-3">
                      {cred.admin_url ? (
                        <a href={cred.admin_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-primary">
                          {cred.admin_url}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="py-3 text-secondary">{cred.admin_username || "-"}</td>
                    <td className="py-3 text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-light text-primary rounded-circle p-2"
                          title="View"
                          onClick={() => setViewCredential(cred)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-light text-warning rounded-circle p-2"
                          title="Edit"
                          onClick={() => handleEdit(cred)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-light text-danger rounded-circle p-2"
                          title="Delete"
                       onClick={() => setCredentialToDelete(cred.id)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-end align-items-center gap-1 mb-5">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPage(1)}
          >
            « First
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ‹ Prev
          </button>
          {pageNumbers.map(num => (
            <button
              key={num}
              className={`btn btn-sm ${currentPage === num ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next ›
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPage(totalPages)}
          >
            Last »
          </button>
        </div>
      )}

      {/* VIEW MODAL (Unchanged functionality) */}
      {viewCredential && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header border-0 pt-4 px-4 bg-white">
                <h5 className="modal-title fw-bold text-dark">Credential Details</h5>
                <button type="button" className="btn-close" onClick={() => setViewCredential(null)} />
              </div>
              <div className="modal-body p-4 bg-white">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <strong>Project:</strong> <br />
                    <span className="text-secondary">{viewCredential.project_name || "-"}</span>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Domain:</strong> <br />
                    <span className="text-secondary">{viewCredential.domain_name || "-"}</span>
                  </div>
                </div>
                
                <hr className="text-muted opacity-25" />
                <h6 className="fw-bold text-dark mb-3">Admin Access</h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <strong>URL:</strong> <br />
                    <span className="text-secondary">{viewCredential.admin_url || "-"}</span>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Username:</strong> <br />
                    <span className="text-secondary">{viewCredential.admin_username || "-"}</span>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Password:</strong> <br />
                    <code className="bg-light px-2 py-1 rounded text-dark">{viewCredential.admin_password || "-"}</code>
                  </div>
                </div>

                <hr className="text-muted opacity-25" />
                <h6 className="fw-bold text-dark mb-3">cPanel Access</h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <strong>URL:</strong> <br />
                    <span className="text-secondary">{viewCredential.cpanel_url || "-"}</span>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Username:</strong> <br />
                    <span className="text-secondary">{viewCredential.cpanel_username || "-"}</span>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Password:</strong> <br />
                    <code className="bg-light px-2 py-1 rounded text-dark">{viewCredential.cpanel_password || "-"}</code>
                  </div>
                </div>

                <hr className="text-muted opacity-25" />
                <h6 className="fw-bold text-dark mb-3">FTP Access</h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <strong>Host:</strong> <br />
                    <span className="text-secondary">{viewCredential.ftp_host || "-"}</span>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Username:</strong> <br />
                    <span className="text-secondary">{viewCredential.ftp_username || "-"}</span>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Password:</strong> <br />
                    <code className="bg-light px-2 py-1 rounded text-dark">{viewCredential.ftp_password || "-"}</code>
                  </div>
                </div>

                <hr className="text-muted opacity-25" />
                <h6 className="fw-bold text-dark mb-3">Email Configuration</h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <strong>Client Email:</strong> <br />
                    <span className="text-secondary">{viewCredential.client_email || "-"}</span>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Email Password:</strong> <br />
                    <code className="bg-light px-2 py-1 rounded text-dark">{viewCredential.client_email_password || "-"}</code>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-4 mb-3">
                    <strong>Business Email:</strong> <br />
                    <span className="text-secondary">{viewCredential.business_email || "-"}</span>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Email Password:</strong> <br />
                    <code className="bg-light px-2 py-1 rounded text-dark">{viewCredential.business_email_password || "-"}</code>
                  </div>
                  <div className="col-md-4 mb-3">
                    <strong>Email Type:</strong> <br />
                    <span className="text-secondary text-capitalize">{viewCredential.business_email_type || "-"}</span>
                  </div>
                </div>

                {viewCredential.notes && (
                  <>
                    <hr className="text-muted opacity-25" />
                    <h6 className="fw-bold text-dark mb-3">Notes</h6>
                    <p className="text-secondary" style={{ whiteSpace: "pre-wrap" }}>{viewCredential.notes}</p>
                  </>
                )}

              </div>
              <div className="modal-footer border-0 px-4 pb-4 bg-white d-flex gap-2">
                <button className="btn btn-light fw-bold px-4 rounded-pill" onClick={() => setViewCredential(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">
                    {isEditMode ? "Edit Website Credential" : "Add Website Credential"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    {/* Project & Domain */}
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Project <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.project ? 'is-invalid' : ''}`}
                        name="project"
                        value={form.project}
                        onChange={handleChange}
                      >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {errors.project && <div className="invalid-feedback">{errors.project}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Domain <span className="text-danger">*</span></label>
                      <select
                        className={`form-select ${errors.domain ? 'is-invalid' : ''}`}
                        name="domain"
                        value={form.domain}
                        onChange={handleChange}
                      >
                        <option value="">Select Domain</option>
                        {domains.map((d) => (
                          <option key={d.id} value={d.id}>{d.domain_name}</option>
                        ))}
                      </select>
                      {errors.domain && <div className="invalid-feedback">{errors.domain}</div>}
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-dark border-bottom pb-2">Admin Access</h6>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-medium text-dark">Admin URL <span className="text-danger">*</span></label>
                      <input
                        className={`form-control ${errors.admin_url ? 'is-invalid' : ''}`}
                        name="admin_url"
                        placeholder="https://example.com/admin"
                        value={form.admin_url}
                        onChange={handleChange}
                      />
                      {errors.admin_url && <div className="invalid-feedback">{errors.admin_url}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Admin Username <span className="text-danger">*</span></label>
                      <input
                        className={`form-control ${errors.admin_username ? 'is-invalid' : ''}`}
                        name="admin_username"
                        placeholder="admin"
                        value={form.admin_username}
                        onChange={handleChange}
                      />
                      {errors.admin_username && <div className="invalid-feedback">{errors.admin_username}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Admin Password <span className="text-danger">*</span></label>
                      <input
                        type="password"
                        className={`form-control ${errors.admin_password ? 'is-invalid' : ''}`}
                        name="admin_password"
                        placeholder="••••••••"
                        value={form.admin_password}
                        onChange={handleChange}
                      />
                      {errors.admin_password && <div className="invalid-feedback">{errors.admin_password}</div>}
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-dark border-bottom pb-2">cPanel Access</h6>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-medium text-dark">cPanel URL</label>
                      <input
                        className="form-control"
                        name="cpanel_url"
                        placeholder="https://example.com:2083"
                        value={form.cpanel_url}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">cPanel Username</label>
                      <input
                        className="form-control"
                        name="cpanel_username"
                        placeholder="username"
                        value={form.cpanel_username}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">cPanel Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="cpanel_password"
                        placeholder="••••••••"
                        value={form.cpanel_password}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-dark border-bottom pb-2">FTP Access</h6>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-medium text-dark">FTP Host</label>
                      <input
                        className="form-control"
                        name="ftp_host"
                        placeholder="ftp.example.com"
                        value={form.ftp_host}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">FTP Username</label>
                      <input
                        className="form-control"
                        name="ftp_username"
                        placeholder="username"
                        value={form.ftp_username}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">FTP Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="ftp_password"
                        placeholder="••••••••"
                        value={form.ftp_password}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-dark border-bottom pb-2">Email Configuration</h6>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Client Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="client_email"
                        placeholder="info@example.com"
                        value={form.client_email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Client Email Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="client_email_password"
                        placeholder="••••••••"
                        value={form.client_email_password}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mt-3">
                      <label className="form-label fw-medium text-dark">Business Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="business_email"
                        placeholder="hr@example.com"
                        value={form.business_email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mt-3">
                      <label className="form-label fw-medium text-dark">Business Email Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="business_email_password"
                        placeholder="••••••••"
                        value={form.business_email_password}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mt-3">
                      <label className="form-label fw-medium text-dark">Business Email Type</label>
                      <select
                        className="form-select"
                        name="business_email_type"
                        value={form.business_email_type}
                        onChange={handleChange}
                      >
                        <option value="">Select Type</option>
                        <option value="gsuite">GSuite</option>
                        <option value="zoho">Zoho</option>
                        <option value="google">Google Workspace</option>
                        <option value="microsoft">Microsoft 365</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="col-12 mt-4">
                      <label className="form-label fw-medium text-dark">Notes</label>
                      <textarea
                        className="form-control"
                        name="notes"
                        placeholder="Any additional details..."
                        rows={3}
                        value={form.notes}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 p-4 pt-0 bg-white d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light fw-bold px-4 rounded-pill"
                    onClick={closeModal}
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4 shadow-sm rounded-pill"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : isEditMode ? (
                      "Update Credential"
                    ) : (
                      "Save Credential"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      <DeleteConfirmModal
  isOpen={credentialToDelete !== null}
  title="Delete Credential"
  message="Are you sure you want to delete this credential?"
  onClose={() => setCredentialToDelete(null)}
  onConfirm={async () => {
    if (credentialToDelete) {
      await deleteCredential(credentialToDelete);
      refetch();
      setCredentialToDelete(null);
    }
  }}
/>
    </div>
  );
};

export default CredentialsPage;