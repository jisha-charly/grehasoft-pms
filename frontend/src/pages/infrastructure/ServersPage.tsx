import React, { useState, useMemo, useEffect } from "react";
import { Server } from "../../types";
import { useCrud } from "../../hooks/useCrud";
import { Pencil, Trash, Search, Plus } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";

const ServersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Connect useCrud for API handling; using default pagination
  const { 
    items: servers, 
    pagination: { page: currentPage, setPage, totalPages },
    add, 
    update,
    delete: deleteServer,
    refetch,
    loading 
  } = useCrud<Server>({
    endpoint: "/infrastructure/servers"
  });

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    provider: "",
    owner: "",
    ip_address: "",
    notes: ""
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client-side filtering since backend search is not configured
  const filteredServers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return servers.filter(
      (server) =>
        server.name?.toLowerCase().includes(term) ||
        server.provider?.toLowerCase().includes(term) ||
        server.owner?.toLowerCase().includes(term) ||
        server.ip_address?.toLowerCase().includes(term)
    );
  }, [servers, searchTerm]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) {
      errors.name = "Server name is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    // Clear error dynamically when user types
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: "" });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editingId) {
        await update(editingId, form);
      } else {
        await add(form);
      }
      closeModal();
      refetch();
    } catch (error: any) {
      console.error(error.response?.data);
      alert(error.response?.data?.message || "Error saving server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (server: Server) => {
    setForm({
      name: server.name || "",
      provider: server.provider || "",
      owner: server.owner || "",
      ip_address: server.ip_address || "",
      notes: server.notes || ""
    });
    setEditingId(server.id);
    setIsEditMode(true);
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this server?")) {
      try {
        await deleteServer(id);
        refetch();
      } catch (error) {
        console.error("Error deleting server", error);
        alert("Failed to delete server");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormErrors({});
    setForm({
      name: "",
      provider: "",
      owner: "",
      ip_address: "",
      notes: ""
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset pagination on search
  };

  const pageNumbers: number[] = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  );
const [infrastructureStats, setInfrastructureStats] = useState({
    totalServers: 0,
    totalDomains: 0,
    expiringDomainsCount: 0,
    totalCredentials: 0
  });

  useEffect(() => {
  const fetchStats = async () => {
    try {
      const [serversRes, domainsRes, credentialsRes] = await Promise.all([
        axiosInstance.get("/infrastructure/servers/"),
        axiosInstance.get("/infrastructure/domains/"),
        axiosInstance.get("/infrastructure/credentials/")
      ]);

      const servers = serversRes.data.results || serversRes.data || [];
      const domains = domainsRes.data.results || domainsRes.data || [];
      const credentials = credentialsRes.data.results || credentialsRes.data || [];

      const now = new Date();

      const expiring = domains.filter((d: any) => {
        if (!d.expiry_date) return false;

        const expiry = new Date(d.expiry_date);
        const days = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);

        return days >= 0 && days <= 30;
      });

      setInfrastructureStats({
        totalServers: servers.length,
        totalDomains: domains.length,
        expiringDomainsCount: expiring.length,
        totalCredentials: credentials.length
      });

    } catch (error) {
      console.error("Error fetching infrastructure stats", error);
    }
  };

  fetchStats();
}, []);
  return (
    <div className="container-fluid p-0">
         <div className="row g-4 mb-4">
        <div className="col-12">
          <h5 className="fw-bold mb-3 text-dark">Infrastructure Overview</h5>
          <div className="row g-4">
            {[
              { label: 'Servers', value: infrastructureStats.totalServers, icon: 'bi-hdd-network', color: 'primary' },
              { label: 'Domains', value: infrastructureStats.totalDomains, icon: 'bi-globe', color: 'info' },
              { label: 'Expiring Soon', value: infrastructureStats.expiringDomainsCount, icon: 'bi-exclamation-triangle', color: 'warning' },
              { label: 'Credentials', value: infrastructureStats.totalCredentials, icon: 'bi-shield-lock', color: 'success' },
            ].map((stat, i) => (
              <div className="col-md-3" key={i}>
                <div className="card p-4 h-100 border-0 shadow-sm">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`p-2 rounded-3 bg-${stat.color}-subtle text-${stat.color}`}>
                      <i className={`bi ${stat.icon} fs-4`}></i>
                    </div>
                  </div>
                  <h3 className="fw-bold mb-1 text-dark">{stat.value}</h3>
                  <p className="text-secondary small fw-bold mb-0 text-uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Servers</h3>
          <p className="text-secondary small mb-0">Manage hosting servers and infrastructure assets</p>
        </div>
   

        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative">
            <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />
            <input
              type="text"
              className="form-control ps-5 border-0 shadow-sm rounded-pill"
              placeholder="Search servers..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ width: "250px" }}
            />
          </div>
          <button
            className="btn btn-primary fw-bold px-4 shadow-sm rounded-pill d-flex align-items-center"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} className="me-2" /> New Server
          </button>
        </div>
      </div>

      {loading && servers.length === 0 ? (
        <div className="text-center p-5">Loading servers...</div>
      ) : (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="py-3">Provider</th>
                  <th className="py-3">IP Address</th>
                  <th className="py-3">Notes</th>
                  <th className="py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No servers found matching your criteria.
                    </td>
                  </tr>
                )}
                {filteredServers.map((server) => (
                  <tr key={server.id}>
                    <td className="px-4 py-3 fw-medium text-dark">{server.name || "-"}</td>
                    <td className="py-3 text-secondary">{server.provider || "-"}</td>
                    <td className="py-3 text-secondary">
                      {server.ip_address ? (
                        <code className="bg-light px-2 py-1 rounded text-dark">{server.ip_address}</code>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 text-secondary text-truncate" style={{ maxWidth: "200px" }}>
                      {server.notes || "-"}
                    </td>
                    <td className="py-3 text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-light text-warning rounded-circle p-2"
                          title="Edit"
                          onClick={() => handleEdit(server)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-light text-danger rounded-circle p-2"
                          title="Delete"
                          onClick={() => handleDelete(server.id)}
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

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleSave} noValidate>
                <div className="modal-header border-0 pt-4 px-4 bg-white">
                  <h5 className="modal-title fw-bold text-dark">
                    {isEditMode ? "Edit Server" : "Add Server"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-medium text-dark">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                        name="name"
                        placeholder="e.g., Production DB Server"
                        value={form.name}
                        onChange={handleChange}
                      />
                      {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Provider</label>
                      <input
                        className="form-control"
                        name="provider"
                        placeholder="e.g., AWS, DigitalOcean"
                        value={form.provider}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium text-dark">Owner</label>
                      <input
                        className="form-control"
                        name="owner"
                        placeholder="e.g., Client Name, Internal"
                        value={form.owner}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-medium text-dark">IP Address</label>
                      <input
                        className="form-control"
                        name="ip_address"
                        placeholder="192.168.1.1"
                        value={form.ip_address}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-medium text-dark">Notes</label>
                      <textarea
                        className="form-control"
                        name="notes"
                        placeholder="Any additional details or configuration notes..."
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
                    disabled={isSubmitting || (Object.keys(formErrors).length > 0 && form.name === "")}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : isEditMode ? (
                      "Update Server"
                    ) : (
                      "Save Server"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServersPage;