// c:\Users\user\OneDrive\Desktop\jisha\grehasoftnew\frontend\src\pages\infrastructure\InfrastructurePage.tsx
import React, { useMemo, useState } from "react";
import { useCrud } from "../../hooks/useCrud";
import { useAuth } from "../../context/AuthContext";
import { Permission, Project, UserRole } from "../../types";

type DomainRow = {
  id: number;
  project: number;
  project_name?: string;
  domain_name: string;
  provider?: string;
  purchase_date?: string | null;
  expiry_date?: string | null;
  renewal_cost?: string | number | null;
  server?: number | null;
  server_name?: string | null;
  notes?: string;
};

type WebsiteCredential = {
  id: number;
  project: number;
  domain: number;
  admin_url?: string;
  admin_username?: string;
  admin_password?: string;
  cpanel_url?: string;
  cpanel_username?: string;
  cpanel_password?: string;
  ftp_host?: string;
  ftp_username?: string;
  ftp_password?: string;
  contact_form_email?: string;
  client_email?: string;
  client_email_password?: string;
  notes?: string;
};

type ServerRow = {
  id: number;
  name: string;
  provider?: string;
};

const InfrastructurePage: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const isAdmin =
    !!user &&
    (user.role === UserRole.SUPER_ADMIN ||
      hasPermission(Permission.MANAGE_SETTINGS) ||
      hasPermission(Permission.MANAGE_USERS));

  const {
    items: domains,
    pagination: { page, setPage, totalPages },
    add: addDomain,
    update: updateDomain,
    delete: deleteDomain,
    refetch: refetchDomains,
  } = useCrud<DomainRow>({ endpoint: "/infrastructure/domains" });

  const { items: credentials } = useCrud<WebsiteCredential>({
    endpoint: "/infrastructure/credentials",
  });

  const { items: projects } = useCrud<Project>({
    endpoint: "/projects",
  });

  const { items: servers } = useCrud<ServerRow>({
    endpoint: "/infrastructure/servers",
  });

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [editForm, setEditForm] = useState<{
    provider: string;
    expiry_date: string;
    notes: string;
  }>({
    provider: "",
    expiry_date: "",
    notes: "",
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    domain_name: string;
    project: string;
    server: string;
    provider: string;
    admin_url: string;
    admin_username: string;
    admin_password: string;
    cpanel_username: string;
    cpanel_password: string;
    ftp_host: string;
    ftp_username: string;
    ftp_password: string;
    client_email: string;
    client_email_password: string;
    purchase_date: string;
    expiry_date: string;
    notes: string;
  }>({
    domain_name: "",
    project: "",
    server: "",
    provider: "",
    admin_url: "",
    admin_username: "",
    admin_password: "",
    cpanel_username: "",
    cpanel_password: "",
    ftp_host: "",
    ftp_username: "",
    ftp_password: "",
    client_email: "",
    client_email_password: "",
    purchase_date: "",
    expiry_date: "",
    notes: "",
  });

  const [createErrors, setCreateErrors] = useState<{
    domain_name?: string;
    project?: string;
    provider?: string;
    expiry_date?: string;
  }>({});

  const selectedDomain = useMemo(
    () => domains.find((d) => d.id === selectedDomainId) || null,
    [domains, selectedDomainId]
  );

  const filteredDomains = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return domains;
    return domains.filter((d) => {
      const domain = d.domain_name?.toLowerCase() || "";
      const project = d.project_name?.toLowerCase() || "";
      const provider = d.provider?.toLowerCase() || "";
      return (
        domain.includes(term) || project.includes(term) || provider.includes(term)
      );
    });
  }, [domains, searchTerm]);

  const domainCredentials = useMemo(
    () =>
      selectedDomain
        ? credentials.filter((c) => c.domain === selectedDomain.id)
        : [],
    [credentials, selectedDomain]
  );

  const openViewDetails = (domainId: number) => {
    setSelectedDomainId(domainId);
    setShowPasswords(false);
    setViewModalOpen(true);
  };

  const openEdit = (domain: DomainRow) => {
    setSelectedDomainId(domain.id);
    setEditForm({
      provider: domain.provider || "",
      expiry_date: domain.expiry_date || "",
      notes: domain.notes || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    await updateDomain(selectedDomain.id, {
      provider: editForm.provider,
      expiry_date: editForm.expiry_date || null,
      notes: editForm.notes,
    });
    setEditModalOpen(false);
    await refetchDomains();
  };

  const handleDelete = async (domain: DomainRow) => {
    if (!confirm(`Delete infrastructure for domain ${domain.domain_name}?`))
      return;
    await deleteDomain(domain.id);
    await refetchDomains();
  };

  const mask = (value?: string) => (value ? "••••••••" : "");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof createErrors = {};
    if (!createForm.domain_name.trim()) {
      errors.domain_name = "Domain name is required.";
    }
    if (!createForm.project) {
      errors.project = "Project is required.";
    }
    if (!createForm.provider.trim()) {
      errors.provider = "Provider is required.";
    }
    if (!createForm.expiry_date) {
      errors.expiry_date = "Expiry date is required.";
    }

    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await addDomain({
      domain_name: createForm.domain_name,
      project: Number(createForm.project),
      server: createForm.server ? Number(createForm.server) : null,
      provider: createForm.provider,
      admin_url: createForm.admin_url,
      admin_username: createForm.admin_username,
      admin_password: createForm.admin_password,
      cpanel_url: "", // optional not in form
      cpanel_username: createForm.cpanel_username,
      cpanel_password: createForm.cpanel_password,
      ftp_host: createForm.ftp_host,
      ftp_username: createForm.ftp_username,
      ftp_password: createForm.ftp_password,
      contact_form_email: "",
      client_email: createForm.client_email,
      client_email_password: createForm.client_email_password,
      purchase_date: createForm.purchase_date || null,
      expiry_date: createForm.expiry_date,
      renewal_cost: null,
      notes: createForm.notes,
    } as any);

    setCreateModalOpen(false);
    setCreateForm({
      domain_name: "",
      project: "",
      server: "",
      provider: "",
      admin_url: "",
      admin_username: "",
      admin_password: "",
      cpanel_username: "",
      cpanel_password: "",
      ftp_host: "",
      ftp_username: "",
      ftp_password: "",
      client_email: "",
      client_email_password: "",
      purchase_date: "",
      expiry_date: "",
      notes: "",
    });
    setCreateErrors({});
    await refetchDomains();
  };

  const renderExpiryCell = (domain: DomainRow) => {
    if (!domain.expiry_date) return "—";
    const today = new Date();
    const expiry = new Date(domain.expiry_date);
    const diffMs = expiry.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="badge bg-danger-subtle text-danger">
          Expired ({domain.expiry_date})
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="badge bg-warning-subtle text-warning">
          Expires soon ({domain.expiry_date})
        </span>
      );
    }
    return domain.expiry_date;
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h3 className="fw-bold mb-1">Website Infrastructure</h3>
            <p className="text-secondary small mb-0">
              Manage domains, servers, and access credentials for all projects.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm shadow-sm"
            onClick={() => setCreateModalOpen(true)}
          >
            <i className="bi bi-plus-lg me-2" />
            Add Infrastructure
          </button>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <div className="p-3 border-bottom">
              <div className="row g-2">
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by domain, project, or provider..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <table className="table align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4">Domain Name</th>
                <th>Project</th>
                <th>Server</th>
                <th>Expiry Date</th>
                <th>Provider</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No infrastructure records found.
                  </td>
                </tr>
              ) : (
                filteredDomains.map((domain) => (
                  <tr key={domain.id}>
                    <td className="px-4 fw-bold">{domain.domain_name}</td>
                    <td>{domain.project_name || `#${domain.project}`}</td>
                    <td>{domain.server_name || "—"}</td>
                    <td>{renderExpiryCell(domain)}</td>
                    <td>{domain.provider || "—"}</td>
                    <td className="text-end px-4">
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          onClick={() => openViewDetails(domain.id)}
                          title="View details"
                        >
                          <i className="bi bi-eye" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-light"
                              onClick={() => openEdit(domain)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light text-danger"
                              onClick={() => handleDelete(domain)}
                              title="Delete"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="d-flex justify-content-end align-items-center gap-1 p-3">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              « First
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                className={`btn btn-sm ${
                  page === num ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next ›
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              Last »
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* View Details Modal */}
      {viewModalOpen && selectedDomain && (
        <div className="modal show d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  Infrastructure Details — {selectedDomain.domain_name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6 className="fw-bold small text-uppercase">Domain</h6>
                  <div className="small text-secondary">
                    <div>
                      <span className="fw-bold">Project: </span>
                      {selectedDomain.project_name || `#${selectedDomain.project}`}
                    </div>
                    <div>
                      <span className="fw-bold">Provider: </span>
                      {selectedDomain.provider || "—"}
                    </div>
                    <div>
                      <span className="fw-bold">Expiry: </span>
                      {selectedDomain.expiry_date || "—"}
                    </div>
                    <div>
                      <span className="fw-bold">Server: </span>
                      {selectedDomain.server_name || "—"}
                    </div>
                  </div>
                </div>

                {domainCredentials.length === 0 ? (
                  <div className="alert alert-light small mb-0">
                    No credentials found for this domain.
                  </div>
                ) : (
                  domainCredentials.map((cred) => (
                    <div className="border rounded p-3 mb-3 bg-light" key={cred.id}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <h6 className="fw-bold small text-uppercase">
                            Admin Access
                          </h6>
                          <div className="small text-secondary">
                            <div>
                              <span className="fw-bold">URL: </span>
                              {cred.admin_url || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Username: </span>
                              {cred.admin_username || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Password: </span>
                              {isAdmin ? (
                                <>
                                  {showPasswords
                                    ? cred.admin_password || "—"
                                    : mask(cred.admin_password)}
                                  {cred.admin_password && (
                                    <button
                                      type="button"
                                      className="btn btn-link btn-sm p-0 ms-2"
                                      onClick={() =>
                                        setShowPasswords((prev) => !prev)
                                      }
                                    >
                                      <i
                                        className={`bi ${
                                          showPasswords ? "bi-eye-slash" : "bi-eye"
                                        }`}
                                      />
                                    </button>
                                  )}
                                </>
                              ) : (
                                mask(cred.admin_password)
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <h6 className="fw-bold small text-uppercase">CPanel</h6>
                          <div className="small text-secondary">
                            <div>
                              <span className="fw-bold">URL: </span>
                              {cred.cpanel_url || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Username: </span>
                              {cred.cpanel_username || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Password: </span>
                              {isAdmin ? (
                                showPasswords
                                  ? cred.cpanel_password || "—"
                                  : mask(cred.cpanel_password)
                              ) : (
                                mask(cred.cpanel_password)
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <h6 className="fw-bold small text-uppercase">FTP</h6>
                          <div className="small text-secondary">
                            <div>
                              <span className="fw-bold">Host: </span>
                              {cred.ftp_host || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Username: </span>
                              {cred.ftp_username || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Password: </span>
                              {isAdmin ? (
                                showPasswords
                                  ? cred.ftp_password || "—"
                                  : mask(cred.ftp_password)
                              ) : (
                                mask(cred.ftp_password)
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <h6 className="fw-bold small text-uppercase">
                            Email Configuration
                          </h6>
                          <div className="small text-secondary">
                            <div>
                              <span className="fw-bold">Contact Form: </span>
                              {cred.contact_form_email || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Client Email: </span>
                              {cred.client_email || "—"}
                            </div>
                            <div>
                              <span className="fw-bold">Email Password: </span>
                              {isAdmin ? (
                                showPasswords
                                  ? cred.client_email_password || "—"
                                  : mask(cred.client_email_password)
                              ) : (
                                mask(cred.client_email_password)
                              )}
                            </div>
                          </div>
                        </div>

                        {cred.notes && (
                          <div className="col-12">
                            <h6 className="fw-bold small text-uppercase">Notes</h6>
                            <p className="small text-secondary mb-0">{cred.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Domain Modal (simple provider/expiry/notes editing) */}
      {editModalOpen && selectedDomain && (
        <div className="modal show d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">
                    Edit Domain — {selectedDomain.domain_name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditModalOpen(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Provider</label>
                    <input
                      className="form-control"
                      value={editForm.provider}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, provider: e.target.value }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Expiry Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.expiry_date}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          expiry_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, notes: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Infrastructure Modal */}
      {createModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">Add Infrastructure</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setCreateModalOpen(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Domain Name *
                      </label>
                      <input
                        className={`form-control ${
                          createErrors.domain_name ? "is-invalid" : ""
                        }`}
                        value={createForm.domain_name}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            domain_name: e.target.value,
                          }))
                        }
                      />
                      {createErrors.domain_name && (
                        <div className="invalid-feedback">
                          {createErrors.domain_name}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Project *
                      </label>
                      <select
                        className={`form-select ${
                          createErrors.project ? "is-invalid" : ""
                        }`}
                        value={createForm.project}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, project: e.target.value }))
                        }
                      >
                        <option value="">-- Select Project --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {createErrors.project && (
                        <div className="invalid-feedback">
                          {createErrors.project}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Server</label>
                      <select
                        className="form-select"
                        value={createForm.server}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, server: e.target.value }))
                        }
                      >
                        <option value="">-- Select Server --</option>
                        {servers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Provider *
                      </label>
                      <input
                        className={`form-control ${
                          createErrors.provider ? "is-invalid" : ""
                        }`}
                        value={createForm.provider}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            provider: e.target.value,
                          }))
                        }
                      />
                      {createErrors.provider && (
                        <div className="invalid-feedback">
                          {createErrors.provider}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Admin URL
                      </label>
                      <input
                        className="form-control"
                        value={createForm.admin_url}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            admin_url: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Admin Username
                      </label>
                      <input
                        className="form-control"
                        value={createForm.admin_username}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            admin_username: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Admin Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={createForm.admin_password}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            admin_password: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        CPanel Username
                      </label>
                      <input
                        className="form-control"
                        value={createForm.cpanel_username}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            cpanel_username: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        CPanel Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={createForm.cpanel_password}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            cpanel_password: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">FTP Host</label>
                      <input
                        className="form-control"
                        value={createForm.ftp_host}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            ftp_host: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        FTP Username
                      </label>
                      <input
                        className="form-control"
                        value={createForm.ftp_username}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            ftp_username: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        FTP Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={createForm.ftp_password}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            ftp_password: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Client Email
                      </label>
                      <input
                        className="form-control"
                        value={createForm.client_email}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            client_email: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Client Email Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={createForm.client_email_password}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            client_email_password: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={createForm.purchase_date}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            purchase_date: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        className={`form-control ${
                          createErrors.expiry_date ? "is-invalid" : ""
                        }`}
                        value={createForm.expiry_date}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            expiry_date: e.target.value,
                          }))
                        }
                      />
                      {createErrors.expiry_date && (
                        <div className="invalid-feedback">
                          {createErrors.expiry_date}
                        </div>
                      )}
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-bold small">Notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={createForm.notes}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            notes: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Save Infrastructure
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

export default InfrastructurePage;