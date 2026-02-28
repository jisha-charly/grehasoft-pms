import React, { useState, useEffect } from 'react';
import { Lead, LeadAssignment, LeadFollowup, User, UserRole } from '../../types';
import axiosInstance from '../../api/axiosInstance';
import { useForm } from '../../hooks/useForm';
import FormField from '../../components/FormField';

interface LeadsPageProps {
  leads: Lead[];
  crud: any;
  users: User[];
}

const LeadsPage: React.FC<LeadsPageProps> = ({
  leads = [],
  crud,
  users = []
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [followups, setFollowups] = useState<LeadFollowup[]>([]);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const salesExecs = users.filter(
    u =>
      u.role === UserRole.SALES_EXECUTIVE ||
      u.role === UserRole.SALES_MANAGER ||
      u.role === UserRole.SUPER_ADMIN
  );

  /* ================= FETCH LEAD DETAILS ================= */

  useEffect(() => {
    if (selectedLead) {
      fetchLeadDetails(selectedLead.id);
    }
  }, [selectedLead]);

  const fetchLeadDetails = async (leadId: number) => {
    try {
      setLoadingDetails(true);

      const [assignRes, followRes] = await Promise.all([
        axiosInstance.get(`/leads/${leadId}/assignments`),
        axiosInstance.get(`/leads/${leadId}/followups`)
      ]);

      setAssignments(assignRes?.data || []);
      setFollowups(followRes?.data || []);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      setAssignments([]);
      setFollowups([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  /* ================= VALIDATION ================= */

  const validationSchema = {
    name: {
      required: true,
      message: 'Full name is required.'
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
      name: '',
      email: '',
      phone: '',
      source: 'Web',
      status: 'new',
      converted_project_id: ''
    },
    validationSchema,
    onSubmit: async (formData) => {
      const payload = {
        ...formData,
        converted_project_id: formData.converted_project_id
          ? Number(formData.converted_project_id)
          : null
      };

      try {
        if (editingLead) {
          await crud.update(editingLead.id, payload);
        } else {
          await crud.add(payload);
        }

        resetForm();
        setEditingLead(null);
        setModalOpen(false);
      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }
  });

  /* ================= FOLLOW-UP ================= */

  const handleAddFollowup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await axiosInstance.post('/lead-followups', {
        lead_id: selectedLead.id,
        followup_type: data.followup_type,
        notes: data.notes,
        next_followup: data.next_followup || null,
        status: 'pending',
        created_by: users?.[0]?.id || null
      });

      await fetchLeadDetails(selectedLead.id);
      e.currentTarget.reset();
    } catch (error) {
      console.error('Error adding followup:', error);
    }
  };

  /* ================= HANDLERS ================= */

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);

    setValues({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'Web',
      status: lead.status || 'new',
      converted_project_id: lead.converted_project?.toString() || ''
    });

    setModalOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setEditingLead(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      await crud.delete(id);
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsModalOpen(true);
  };

  /* ================= UI ================= */

  return (
    <div className="card shadow-sm border-0">

      {/* HEADER */}
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Sales Pipeline</h4>
          <p className="text-secondary small mb-0">
            Tracking prospects and conversion rates
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm fw-bold px-3 shadow-sm"
          onClick={handleAddNew}
        >
          <i className="bi bi-person-plus me-2"></i>New Lead
        </button>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4">Prospect</th>
              <th>Contact Info</th>
              <th>Source</th>
              <th>Status</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 fw-bold">{lead.name}</td>

                  <td>
                    <div className="small">{lead.email}</div>
                    <div className="small text-muted">{lead.phone || '—'}</div>
                  </td>

                  <td>
                    <span className="badge bg-light text-dark border">
                      {lead.source}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        lead.status === 'converted'
                          ? 'bg-success'
                          : 'bg-primary'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>

                  <td className="text-end px-4">
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => handleViewDetails(lead)}
                      >
                        <i className="bi bi-eye text-info"></i>
                      </button>

                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => handleEdit(lead)}
                      >
                        <i className="bi bi-pencil text-primary"></i>
                      </button>

                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => handleDelete(lead.id)}
                      >
                        <i className="bi bi-trash text-danger"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Add/Edit Lead Modal */}
{isModalOpen && (
  <div className="modal show d-block bg-dark bg-opacity-50">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} noValidate>

          <div className="modal-header border-0 bg-white pt-4 px-4">
            <h5 className="modal-title fw-bold">
              {editingLead ? 'Update Prospect Profile' : 'Register New Prospect'}
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

          <div className="modal-body p-4 bg-white">
            <div className="row g-3">

              <div className="col-12">
                <FormField label="Full Name *" required error={errors.name}>
                  <input
                    name="name"
                    className="form-control"
                    value={values.name}
                    onChange={(e) =>
                      handleChange(
                        e.target.name as keyof typeof values,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>

              <div className="col-md-6">
                <FormField label="Email *" required error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={values.email}
                    onChange={(e) =>
                      handleChange(
                        e.target.name as keyof typeof values,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>

              <div className="col-md-6">
                <FormField label="Phone">
                  <input
                    name="phone"
                    className="form-control"
                    value={values.phone}
                    onChange={(e) =>
                      handleChange(
                        e.target.name as keyof typeof values,
                        e.target.value
                      )
                    }
                  />
                </FormField>
              </div>

              <div className="col-12">
                <FormField label="Source">
                  <select
                    name="source"
                    className="form-select"
                    value={values.source}
                    onChange={(e) =>
                      handleChange(
                        e.target.name as keyof typeof values,
                        e.target.value
                      )
                    }
                  >
                    <option value="Web">Website</option>
                    <option value="Ads">Ads</option>
                    <option value="Referral">Referral</option>
                    <option value="Direct">Direct</option>
                  </select>
                </FormField>
              </div>

            </div>
          </div>

          <div className="modal-footer border-0 bg-white pb-4 px-4">
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
              {isSubmitting ? 'Saving...' : editingLead ? 'Save Changes' : 'Confirm Registration'}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
)}
      </div>

    </div>
  );
};

export default LeadsPage;