import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../components/layout/Layout";
import axiosInstance from "../../api/axiosInstance";
import { useCrud } from "../../hooks/useCrud";
import { Eye, Pencil, Trash, Search, Plus } from "lucide-react";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useAlert } from "@/hooks/useAlert";
import { AlertVariant } from "@/types/alert";
import { getErrorMessage } from "@/utils/getErrorMessage";

interface Domain {
  id: number;
  domain_name: string;
  project: number;
  project_name?: string;
  provider?: string;
  purchase_date?: string;
  expiry_date?: string;
  server?: number;
  server_name?: string;
  notes?: string;
}

const DomainsPage: React.FC = () => {
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState("");

  const { 
    items: domains, 
    pagination: { page: currentPage, setPage, totalPages },
    add, 
    update,
    delete: deleteDomain,
    refetch,
    loading 
  } = useCrud<Domain>({
    endpoint: "/infrastructure/domains",
    queryParams: { search: searchTerm }
  });

  const [servers, setServers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewDomain, setViewDomain] = useState<Domain | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<number | null>(null);

  const [form, setForm] = useState({
    project: "",
    domain_name: "",
    provider: "",
    purchase_date: "",
    expiry_date: "",
    server: "",
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const serverRes = await axiosInstance.get("/infrastructure/servers/");
      const projectRes = await axiosInstance.get("/projects/");

      setServers(serverRes.data.results || serverRes.data || []);
      setProjects(projectRes.data.results || projectRes.data || []);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.project) newErrors.project = "Project is required";
    if (!form.domain_name.trim()) newErrors.domain_name = "Domain name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    // Clear individual error when user types/selects
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
        server: form.server ? Number(form.server) : null,
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
      showAlert({
        variant: AlertVariant.ERROR,
        message: getErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (domain: Domain) => {
    setForm({
      project: domain.project ? domain.project.toString() : "",
      domain_name: domain.domain_name || "",
      provider: domain.provider || "",
      purchase_date: domain.purchase_date ? domain.purchase_date.split('T')[0] : "",
      expiry_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : "",
      server: domain.server ? domain.server.toString() : "",
      notes: domain.notes || ""
    });
    setEditingId(domain.id);
    setIsEditMode(true);
    setErrors({});
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingId(null);
    setErrors({});
    setForm({
      project: "",
      domain_name: "",
      provider: "",
      purchase_date: "",
      expiry_date: "",
      server: "",
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
            <h3 className="fw-bold mb-1">Domains</h3>
            <p className="text-secondary small mb-0">Manage registered domain names and their lifecycle</p>
          </div>
          
          <div className="d-flex gap-2 align-items-center">
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />
              <input 
                type="text" 
                className="form-control ps-5 border-0 shadow-sm rounded-pill" 
                placeholder="Search domains..." 
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: '250px' }}
              />
            </div>
            <button className="btn btn-primary fw-bold px-4 shadow-sm rounded-pill d-flex align-items-center" onClick={() => setShowModal(true)}>
              <Plus size={16} className="me-2" /> New Domain
            </button>
          </div>
        </div>

        {loading && domains.length === 0 ? (
          <div className="text-center p-5">Loading domains...</div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3">Domain</th>
                    <th className="py-3">Project</th>
                    <th className="py-3">Server</th>
                    <th className="py-3">Expiry</th>
                    <th className="py-3 text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        No domains found matching your search.
                      </td>
                    </tr>
                  )}
                  {domains.map((d: Domain) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 fw-medium text-dark">{d.domain_name || "-"}</td>
                      <td className="py-3 text-secondary">{d.project_name || "-"}</td>
                      <td className="py-3 text-secondary">{d.server_name || "-"}</td>
                      <td className="py-3 text-secondary">{d.expiry_date || "-"}</td>
                      <td className="py-3 text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-light text-primary rounded-circle p-2"
                            title="View"
                            onClick={() => setViewDomain(d)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-light text-warning rounded-circle p-2"
                            title="Edit"
                            onClick={() => handleEdit(d)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-light text-danger rounded-circle p-2"
                            title="Delete"
                          onClick={() => setDomainToDelete(d.id)}
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
            {pageNumbers.map((num) => (
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

        {/* VIEW MODAL */}
        {viewDomain && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">Domain Details</h5>
                  <button type="button" className="btn-close" onClick={() => setViewDomain(null)} />
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Domain Name:</strong> <br />
                      <span className="text-secondary">{viewDomain.domain_name || "-"}</span>
                    </div>
                    <div className="col-md-6">
                      <strong>Project:</strong> <br />
                      <span className="text-secondary">{viewDomain.project_name || "-"}</span>
                    </div>
                    <div className="col-md-6">
                      <strong>Provider:</strong> <br />
                      <span className="text-secondary">{viewDomain.provider || "-"}</span>
                    </div>
                    <div className="col-md-6">
                      <strong>Server:</strong> <br />
                      <span className="text-secondary">{viewDomain.server_name || "-"}</span>
                    </div>
                    <div className="col-md-6">
                      <strong>Purchase Date:</strong> <br />
                      <span className="text-secondary">{viewDomain.purchase_date || "-"}</span>
                    </div>
                    <div className="col-md-6">
                      <strong>Expiry Date:</strong> <br />
                      <span className="text-secondary">{viewDomain.expiry_date || "-"}</span>
                    </div>
                    {(viewDomain.notes) && (
                      <div className="col-12 mt-3">
                        <strong>Notes:</strong> <br />
                        <span className="text-secondary" style={{ whiteSpace: "pre-wrap" }}>{viewDomain.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4 bg-white d-flex gap-2">
                  <button className="btn btn-light fw-bold px-4 rounded-pill" onClick={() => setViewDomain(null)}>
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="modal-header border-0 pt-4 px-4 bg-white">
                    <h5 className="modal-title fw-bold text-dark">
                      {isEditMode ? "Edit Domain" : "Add Domain"}
                    </h5>
                    <button type="button" className="btn-close" onClick={closeModal} />
                  </div>

                  <div className="modal-body p-4 bg-white">
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label fw-medium text-dark">Domain Name <span className="text-danger">*</span></label>
                        <input
                          className={`form-control ${errors.domain_name ? 'is-invalid' : ''}`}
                          name="domain_name"
                          placeholder="e.g., example.com"
                          value={form.domain_name}
                          onChange={handleChange}
                        />
                        {errors.domain_name && <div className="invalid-feedback">{errors.domain_name}</div>}
                      </div>

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
                        <label className="form-label fw-medium text-dark">Server</label>
                        <select
                          className="form-select"
                          name="server"
                          value={form.server}
                          onChange={handleChange}
                        >
                          <option value="">Select Server</option>
                          {servers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label fw-medium text-dark">Provider</label>
                        <input
                          className="form-control"
                          name="provider"
                          placeholder="e.g., GoDaddy, Namecheap"
                          value={form.provider}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium text-dark">Purchase Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="purchase_date"
                          value={form.purchase_date}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-medium text-dark">Expiry Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="expiry_date"
                          value={form.expiry_date}
                          onChange={handleChange}
                        />
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
                        "Update Domain"
                      ) : (
                        "Save Domain"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}



        <DeleteConfirmModal
  isOpen={domainToDelete !== null}
  title="Delete Domain"
  message="Are you sure you want to delete this domain?"
  onClose={() => setDomainToDelete(null)}
  onConfirm={async () => {
    if (domainToDelete) {
      await deleteDomain(domainToDelete);
      refetch();
      setDomainToDelete(null);
    }
  }}
/>
      </div>
    
  );
};

export default DomainsPage;