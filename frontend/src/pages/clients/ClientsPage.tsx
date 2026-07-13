import React, { useState, useMemo } from 'react';
import { Client } from '../../types';
import { useForm } from '../../hooks/useForm';
import { useCrud } from '../../hooks/useCrud';
import FormField from '../../components/FormField';
import axiosInstance from '../../api/axiosInstance';

const ClientsPage: React.FC = () => {
  const {
    items: clients,
    pagination: { page, setPage, totalPages },
    add,
    update,
    delete: deleteClient,
    refetch,
  } = useCrud<Client>({ endpoint: '/clients' });

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);

  // Create Portal Account Modal state
  const [showCreatePortalModal, setShowCreatePortalModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [portalConfirmPassword, setPortalConfirmPassword] = useState('');
  const [createPortalError, setCreatePortalError] = useState<string | null>(null);
  const [createPortalSubmitting, setCreatePortalSubmitting] = useState(false);

  // Manage Portal Users Modal state
  const [showManagePortalModal, setShowManagePortalModal] = useState(false);
  const [manageActionLoading, setManageActionLoading] = useState<number | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);

  // Add Portal User Subform state (inside Manage Portal Users Modal)
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);

  // Edit Username sub-state
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUsernameVal, setEditUsernameVal] = useState('');

  const handleOpenCreatePortalAccount = (client: Client) => {
    setSelectedClient(client);
    setPortalUsername('');
    setPortalPassword('');
    setPortalConfirmPassword('');
    setCreatePortalError(null);
    setShowCreatePortalModal(true);
  };

  const handleOpenManagePortalUsers = (client: Client) => {
    setSelectedClient(client);
    setManageError(null);
    setShowAddUserForm(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
    setAddUserError(null);
    setEditingUserId(null);
    setShowManagePortalModal(true);
  };

  const handleCreatePortalAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUsername.trim() || !portalPassword) {
      setCreatePortalError("Username and password are required.");
      return;
    }
    if (portalPassword !== portalConfirmPassword) {
      setCreatePortalError("Passwords do not match.");
      return;
    }
    setCreatePortalSubmitting(true);
    setCreatePortalError(null);
    try {
      await axiosInstance.post(`/clients/${selectedClient?.id}/create-portal-account/`, {
        username: portalUsername,
        password: portalPassword
      });
      setShowCreatePortalModal(false);
      refetch();
    } catch (err: any) {
      setCreatePortalError(err.response?.data?.error || "Failed to create account.");
    } finally {
      setCreatePortalSubmitting(false);
    }
  };

  const handleAddAdditionalUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserUsername.trim() || !newUserPassword) {
      setAddUserError("Username and password are required.");
      return;
    }
    if (newUserPassword !== newUserConfirmPassword) {
      setAddUserError("Passwords do not match.");
      return;
    }
    setAddUserSubmitting(true);
    setAddUserError(null);
    try {
      await axiosInstance.post(`/clients/${selectedClient?.id}/create-portal-account/`, {
        username: newUserUsername,
        password: newUserPassword,
        name: newUserName.trim() || undefined,
        email: newUserEmail.trim() || undefined
      });
      setShowAddUserForm(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserConfirmPassword('');
      
      const updated = await refetch();
      const currentClient = updated.results.find(c => c.id === selectedClient?.id);
      if (currentClient) {
        setSelectedClient(currentClient);
      }
    } catch (err: any) {
      setAddUserError(err.response?.data?.error || "Failed to create user.");
    } finally {
      setAddUserSubmitting(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPass = prompt("Enter new password for this user:");
    if (newPass === null) return;
    if (!newPass.trim()) {
      alert("Password cannot be empty.");
      return;
    }
    setManageActionLoading(userId);
    setManageError(null);
    try {
      await axiosInstance.post(`/clients/${selectedClient?.id}/reset-portal-user-password/`, {
        user_id: userId,
        password: newPass
      });
      alert("Password reset successfully.");
    } catch (err: any) {
      setManageError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setManageActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    setManageActionLoading(userId);
    setManageError(null);
    try {
      await axiosInstance.post(`/clients/${selectedClient?.id}/toggle-portal-user-status/`, {
        user_id: userId
      });
      const updated = await refetch();
      const currentClient = updated.results.find(c => c.id === selectedClient?.id);
      if (currentClient) {
        setSelectedClient(currentClient);
      }
    } catch (err: any) {
      setManageError(err.response?.data?.error || "Failed to toggle status.");
    } finally {
      setManageActionLoading(null);
    }
  };

  const handleSaveUsername = async (userId: number) => {
    if (!editUsernameVal.trim()) {
      alert("Username cannot be empty.");
      return;
    }
    setManageActionLoading(userId);
    setManageError(null);
    try {
      await axiosInstance.post(`/clients/${selectedClient?.id}/edit-portal-user-username/`, {
        user_id: userId,
        username: editUsernameVal
      });
      setEditingUserId(null);
      const updated = await refetch();
      const currentClient = updated.results.find(c => c.id === selectedClient?.id);
      if (currentClient) {
        setSelectedClient(currentClient);
      }
    } catch (err: any) {
      setManageError(err.response?.data?.error || "Failed to update username.");
    } finally {
      setManageActionLoading(null);
    }
  };

  const handleDeletePortalUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this portal user? This will permanently remove their login access.")) return;
    setManageActionLoading(userId);
    setManageError(null);
    try {
      await axiosInstance.post(`/clients/${selectedClient?.id}/delete-portal-user/`, {
        user_id: userId
      });
      const updated = await refetch();
      const currentClient = updated.results.find(c => c.id === selectedClient?.id);
      if (currentClient) {
        setSelectedClient(currentClient);
      }
    } catch (err: any) {
      setManageError(err.response?.data?.error || "Failed to delete user.");
    } finally {
      setManageActionLoading(null);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  /* ================= VALIDATION ================= */

  const validationSchema = {
    contact_person: {
      required: true,
      message: 'Contact person name is required.'
    },
    company_name: {
      required: true,
      message: 'Company name is required.'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter a valid corporate email address.'
    }
  };

  /* ================= FORM ================= */

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setValues
  } = useForm({
    initialValues: {
      contact_person: '',
      email: '',
      phone: '',
      company_name: '',
      gst_number: '',
      address: ''
    },
    validationSchema,
    onSubmit: async (formData) => {

      const payload = {
       name: formData.contact_person,   // ✅ map to backend
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        gst_number: formData.gst_number,
        address: formData.address
      };

      if (editingClient) {
        await update(editingClient.id!, payload);
      } else {
        await add(payload);
      }

      resetForm();
      setEditingClient(null);
      setModalOpen(false);
    }
  });

  /* ================= SAFE SEARCH ================= */

  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];

    return clients.filter((c) => {
      const name = c.name?.toLowerCase() || '';
      const company = c.company_name?.toLowerCase() || '';
      const email = c.email?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();

      return (
        name.includes(term) ||
        company.includes(term) ||
        email.includes(term)
      );
    });
  }, [clients, searchTerm]);

  /* ================= HANDLERS ================= */

  const handleEdit = (client: Client) => {
    setEditingClient(client);

    setValues({
      contact_person: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company_name: client.company_name || '',
      gst_number: client.gst_number || '',
      address: client.address || ''
    });

    setModalOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setEditingClient(null);
    setModalOpen(true);
  };

 const handleDelete = (id: number) => {
  setDeleteClientId(id);
};

const confirmDelete = async () => {
  if (deleteClientId !== null) {
    await deleteClient(deleteClientId);
    setDeleteClientId(null);
  }
};

  /* ================= UI ================= */

  return (
    <div className="container-fluid p-0">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark">Client Management</h3>
          <p className="text-secondary small mb-0">
            Manage business accounts, GST details, and contact information
          </p>
        </div>

        <button
          className="btn btn-primary fw-bold shadow-sm px-4"
          onClick={handleAddNew}
        >
          <i className="bi bi-person-plus-fill me-2"></i>
          Register New Client
        </button>
      </div>

      {/* SEARCH CARD */}
      <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
        <div className="row align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0 px-3">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-0 py-2"
                placeholder="Search by name, company or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-8 text-end">
            <span className="text-secondary small fw-bold">
              Total Accounts: {clients?.length ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4">Client / Contact</th>
                <th>Company & GST</th>
                <th>Contact Info</th>
                <th>Address</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    <i className="bi bi-people fs-1 opacity-25 d-block mb-3"></i>
                    <h6 className="fw-bold">No clients found</h6>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4">
                      <div className="fw-bold text-dark">
                        {client.name}
                      </div>
                      <div className="small text-muted">
                       Joined: {client.created_at}
                      </div>
                    </td>

                    <td>
                      <div className="fw-bold text-primary mb-1">
                        {client.company_name}
                      </div>
                      <span className="badge bg-light text-secondary border fw-normal">
                        GST: {client.gst_number || 'Unregistered'}
                      </span>
                    </td>

                    <td>
                      <div className="small text-dark">
                        {client.email}
                      </div>
                      <div className="small text-muted">
                        {client.phone || 'No phone'}
                      </div>
                    </td>

                    <td>
                      <div className="small text-muted">
                        {client.address || '—'}
                      </div>
                    </td>

                    <td className="text-end px-4">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        {client.portal_users && client.portal_users.length > 0 ? (
                          <button
                            className="btn btn-xs btn-outline-success fw-bold py-1 px-2 rounded-3 text-uppercase"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleOpenManagePortalUsers(client)}
                          >
                            <i className="bi bi-gear-fill me-1"></i> Manage Portal Users
                          </button>
                        ) : (
                          <button
                            className="btn btn-xs btn-outline-primary fw-bold py-1 px-2 rounded-3 text-uppercase"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleOpenCreatePortalAccount(client)}
                          >
                            <i className="bi bi-shield-lock-fill me-1"></i> Create Portal Account
                          </button>
                        )}
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => handleEdit(client)}
                          >
                            <i className="bi bi-pencil-square text-primary"></i>
                          </button>

                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => handleDelete(client.id)}
                          >
                            <i className="bi bi-trash3 text-danger"></i>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="d-flex justify-content-end align-items-center gap-1 p-3">

  {/* FIRST */}
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(1)}
  >
    « First
  </button>

  {/* PREVIOUS */}
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
  >
    ‹ Prev
  </button>

  {/* PAGE NUMBERS */}
  {pageNumbers.map(num => (
    <button
      key={num}
      className={`btn btn-sm ${page === num ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => setPage(num)}
    >
      {num}
    </button>
  ))}

  {/* NEXT */}
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => setPage(page + 1)}
  >
    Next ›
  </button>

  {/* LAST */}
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleSubmit} noValidate>

                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">
                    {editingClient ? 'Update Client Profile' : 'Register New Client'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      resetForm();
                      setModalOpen(false);
                    }}
                  ></button>
                </div>

                <div className="modal-body">

                  <FormField label="Contact Person Name *" required error={errors.contact_person}>
                    <input
                      name="contact_person"
                      className="form-control"
                      value={values.contact_person}
                      onChange={(e) =>
                        handleChange(e.target.name as keyof typeof values, e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Company Name *" required error={errors.company_name}>
                    <input
                      name="company_name"
                      className="form-control"
                      value={values.company_name}
                      onChange={(e) =>
                        handleChange(e.target.name as keyof typeof values, e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Email Address *" required error={errors.email}>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={values.email}
                      onChange={(e) =>
                        handleChange(e.target.name as keyof typeof values, e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Phone Number">
                    <input
                      name="phone"
                      className="form-control"
                      value={values.phone}
                      onChange={(e) =>
                        handleChange(e.target.name as keyof typeof values, e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="GST Number">
                    <input
                      name="gst_number"
                      className="form-control"
                      value={values.gst_number}
                      onChange={(e) =>
                        handleChange(e.target.name as keyof typeof values, e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Address">
                    <textarea
                      name="address"
                      className="form-control"
                      rows={3}
                      value={values.address}
                      onChange={(e) =>
                        handleChange(e.target.name as keyof typeof values, e.target.value)
                      }
                    />
                  </FormField>

                </div>

                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      resetForm();
                      setModalOpen(false);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : editingClient ? 'Save Changes' : 'Confirm Registration'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}



      {deleteClientId !== null && (
  <div className="modal show d-block bg-dark bg-opacity-50">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content border-0 rounded-4 shadow-lg">

        <div className="modal-header border-0">
          <h5 className="modal-title fw-bold text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirm Deletion
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setDeleteClientId(null)}
          ></button>
        </div>

        <div className="modal-body">
          <p className="mb-0">
            Are you sure you want to delete this client?
            This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer border-0">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => setDeleteClientId(null)}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmDelete}
          >
            Delete Client
          </button>
        </div>

      </div>
    </div>
  </div>
)}

      {/* CREATE PORTAL ACCOUNT MODAL */}
      {showCreatePortalModal && selectedClient && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleCreatePortalAccountSubmit}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-shield-lock-fill text-primary me-2"></i>
                    Create Portal Account
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreatePortalModal(false)}
                  ></button>
                </div>

                <div className="modal-body py-3">
                  {createPortalError && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                      {createPortalError}
                    </div>
                  )}

                  <div className="mb-3 bg-light p-3 rounded-3 border">
                    <div className="row g-2">
                      <div className="col-12 border-bottom pb-2 mb-2">
                        <label className="text-secondary small fw-bold d-block text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Company</label>
                        <span className="text-dark fw-bold">{selectedClient.company_name}</span>
                      </div>
                      <div className="col-md-6">
                        <label className="text-secondary small fw-bold d-block text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Contact Person</label>
                        <span className="text-secondary small">{selectedClient.name}</span>
                      </div>
                      <div className="col-md-6">
                        <label className="text-secondary small fw-bold d-block text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Email</label>
                        <span className="text-secondary small">{selectedClient.email}</span>
                      </div>
                      <div className="col-12 mt-2 border-top pt-2">
                        <label className="text-secondary small fw-bold d-block text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Role</label>
                        <span className="badge bg-primary-subtle text-primary fw-bold text-uppercase">CLIENT (Read Only)</span>
                      </div>
                    </div>
                  </div>

                  <FormField label="Username *" required>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. rahul.technova"
                      required
                      value={portalUsername}
                      onChange={(e) => setPortalUsername(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Password *" required>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="********"
                      required
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Confirm Password *" required>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="********"
                      required
                      value={portalConfirmPassword}
                      onChange={(e) => setPortalConfirmPassword(e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light rounded-3 fw-semibold"
                    onClick={() => setShowCreatePortalModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-3 fw-bold"
                    disabled={createPortalSubmitting}
                  >
                    {createPortalSubmitting ? 'Creating...' : 'Create Portal Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PORTAL USERS MODAL */}
      {showManagePortalModal && selectedClient && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-people-fill text-success me-2"></i>
                  Manage Portal Users – {selectedClient.company_name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowManagePortalModal(false)}
                ></button>
              </div>

              <div className="modal-body py-3">
                {manageError && (
                  <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                    {manageError}
                  </div>
                )}

                {/* ADD USER SUBFORM BUTTON */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary small fw-bold">
                    Active Portal Accounts: {selectedClient.portal_users?.length ?? 0}
                  </span>
                  <button
                    className={`btn btn-sm ${showAddUserForm ? 'btn-secondary' : 'btn-primary'} fw-bold rounded-3`}
                    onClick={() => {
                      setShowAddUserForm(!showAddUserForm);
                      setAddUserError(null);
                    }}
                  >
                    {showAddUserForm ? 'Cancel Add User' : 'Add Additional User'}
                  </button>
                </div>

                {/* ADD ADDITIONAL USER FORM */}
                {showAddUserForm && (
                  <form onSubmit={handleAddAdditionalUserSubmit} className="card bg-light border p-3 mb-4 rounded-3 animate__animated animate__fadeIn">
                    <h6 className="fw-bold mb-3 border-bottom pb-2">Add Additional Client Portal User</h6>
                    
                    {addUserError && (
                      <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                        {addUserError}
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Neha Joseph"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="e.g. neha@company.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label small fw-semibold text-muted">Username *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. neha.technova"
                          required
                          value={newUserUsername}
                          onChange={(e) => setNewUserUsername(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="********"
                          required
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Confirm Password *</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="********"
                          required
                          value={newUserConfirmPassword}
                          onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-light"
                        onClick={() => setShowAddUserForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary fw-bold"
                        disabled={addUserSubmitting}
                      >
                        {addUserSubmitting ? 'Saving...' : 'Add Portal User'}
                      </button>
                    </div>
                  </form>
                )}

                {/* PORTAL USERS LIST */}
                <div className="table-responsive border rounded-3 bg-white">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase">
                      <tr>
                        <th className="ps-3 py-2">Name & Email</th>
                        <th className="py-2">Username</th>
                        <th className="py-2">Status</th>
                        <th className="text-end pe-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedClient.portal_users || selectedClient.portal_users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted small">
                            No portal users associated with this client.
                          </td>
                        </tr>
                      ) : (
                        selectedClient.portal_users.map((user: any) => (
                          <tr key={user.id}>
                            <td className="ps-3">
                              <div className="fw-bold text-dark small">{user.name || 'Unnamed User'}</div>
                              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{user.email || 'No Email'}</div>
                            </td>
                            <td>
                              {editingUserId === user.id ? (
                                <div className="input-group input-group-sm" style={{ maxWidth: '200px' }}>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editUsernameVal}
                                    onChange={(e) => setEditUsernameVal(e.target.value)}
                                  />
                                  <button
                                    className="btn btn-success text-white"
                                    type="button"
                                    onClick={() => handleSaveUsername(user.id)}
                                    disabled={manageActionLoading === user.id}
                                  >
                                    <i className="bi bi-check-lg"></i>
                                  </button>
                                  <button
                                    className="btn btn-light"
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                  >
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="small fw-semibold">{user.username}</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${user.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="text-end pe-3">
                              <div className="d-inline-flex gap-1">
                                {editingUserId !== user.id && (
                                  <button
                                    className="btn btn-xs btn-outline-secondary py-1 px-2 rounded small"
                                    style={{ fontSize: '0.7rem' }}
                                    title="Edit Username"
                                    onClick={() => {
                                      setEditingUserId(user.id);
                                      setEditUsernameVal(user.username);
                                    }}
                                    disabled={manageActionLoading !== null}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                )}
                                <button
                                  className="btn btn-xs btn-outline-warning py-1 px-2 rounded small text-dark"
                                  style={{ fontSize: '0.7rem' }}
                                  title="Reset Password"
                                  onClick={() => handleResetPassword(user.id)}
                                  disabled={manageActionLoading !== null}
                                >
                                  <i className="bi bi-key-fill"></i>
                                </button>
                                <button
                                  className={`btn btn-xs ${user.is_active ? 'btn-outline-danger' : 'btn-outline-success'} py-1 px-2 rounded small`}
                                  style={{ fontSize: '0.7rem' }}
                                  title={user.is_active ? 'Deactivate Account' : 'Activate Account'}
                                  onClick={() => handleToggleStatus(user.id)}
                                  disabled={manageActionLoading !== null}
                                >
                                  <i className={`bi ${user.is_active ? 'bi-lock-fill' : 'bi-unlock-fill'}`}></i>
                                </button>
                                <button
                                  className="btn btn-xs btn-outline-danger py-1 px-2 rounded small"
                                  style={{ fontSize: '0.7rem' }}
                                  title="Delete User"
                                  onClick={() => handleDeletePortalUser(user.id)}
                                  disabled={manageActionLoading !== null}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary rounded-3 fw-bold px-4"
                  onClick={() => setShowManagePortalModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;