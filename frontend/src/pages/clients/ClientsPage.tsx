import React, { useState, useMemo } from 'react';
import { Client } from '../../types';
import { useForm } from '../../hooks/useForm';
import FormField from '../../components/FormField';

interface ClientsPageProps {
  clients: Client[];
  crud: any;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients = [], crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
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
        await crud.update(editingClient.id, payload);
      } else {
        await crud.add(payload);
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
    await crud.delete(deleteClientId);
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
              Total Accounts: {clients.length}
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
                <th>Mailing Address</th>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
};

export default ClientsPage;