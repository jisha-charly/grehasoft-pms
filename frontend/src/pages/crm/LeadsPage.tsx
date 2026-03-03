import React, { useState, useEffect } from 'react';
import { Lead, LeadAssignment, LeadFollowup, User, UserRole, Client, Project, Department, ProjectStatus } from '../../types';
import axiosInstance from '../../api/axiosInstance';
import { useForm } from '../../hooks/useForm';
import FormField from '../../components/FormField';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
interface LeadsPageProps {
  leads: Lead[];
  crud: any;
  users: User[];
  clients: Client[];
  clientCrud: any;
  projects: Project[];
  projectCrud: any;
  departments: Department[];
}

const LeadsPage: React.FC<LeadsPageProps> = ({
  leads = [],
  crud,
  users = [],
  clients = [],
  clientCrud,
  projects = [],
  projectCrud,
  departments = []
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConvertModalOpen, setConvertModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [followups, setFollowups] = useState<LeadFollowup[]>([]);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [leadList, setLeadList] = useState<Lead[]>(leads || []);
  const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
const currentUserId = users?.[0]?.id || null;
  const salesExecs = (users || []).filter
  (u =>  u.role_name === UserRole.SALES_EXECUTIVE ||
      u.role_name === UserRole.SALES_MANAGER ||
      u.role_name === UserRole.SUPER_ADMIN
  );

  useEffect(() => {
    if (selectedLead) {
      fetchLeadDetails(selectedLead.id);
    }
  }, [selectedLead]);

 const fetchLeadDetails = async (leadId: number) => {
  try {
    const [assignRes, followRes] = await Promise.all([
      axiosInstance.get(`/lead-assignments/?lead_id=${leadId}`),
      axiosInstance.get(`/lead-followups/?lead_id=${leadId}`)
    ]);

    setAssignments(assignRes.data);
    setFollowups(followRes.data);

  } catch (error) {
    console.error("Error fetching lead details:", error);
  }
};
  
useEffect(() => {
  fetchLeads();
}, [searchTerm, statusFilter]);

  const fetchLeads = async () => {
  const params: any = {};

  if (searchTerm) params.search = searchTerm;

  // ✅ do NOT send status if it's "all"
  if (statusFilter && statusFilter !== "all") {
    params.status = statusFilter;
  }

  const res = await axiosInstance.get("/leads/", { params });
  setLeadList(res.data);
};
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
        converted_project_id: formData.converted_project_id ? Number(formData.converted_project_id) : null
      };

      if (editingLead) {
        await crud.update(editingLead.id, payload);
      } else {
        await crud.add(payload);
      }
      setModalOpen(false);
      setEditingLead(null);
    }
  });

  const handleAddFollowup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!selectedLead) return;

  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData.entries());

  try {
    await axiosInstance.post('/lead-followups/', {
      lead: selectedLead.id,
      followup_type: data.followup_type,
      notes: data.notes,
      next_followup: data.next_followup || null,
      status: 'pending'
    });

    await fetchLeadDetails(selectedLead.id);
    (e.target as HTMLFormElement).reset();

  } catch (error) {
    console.error("Error adding followup:", error);
  }
};
 const handleDeleteClick = (lead: Lead) => {
  setLeadToDelete(lead);
  setDeleteModalOpen(true);
};

const handleConfirmDelete = async () => {
  if (!leadToDelete) return;

  try {
    await crud.delete(leadToDelete.id);

    // remove from local list
    setLeadList(prev => prev.filter(l => l.id !== leadToDelete.id));

  } catch (error) {
    console.error("Delete failed:", error);
  }

  setDeleteModalOpen(false);
  setLeadToDelete(null);
};
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setValues({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      source: lead.source,
      status: lead.status,
      converted_project_id: lead.converted_project?.toString() || ''
    });
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    resetForm();
    setModalOpen(true);
  };

  const handleOpenConvert = (lead: Lead) => {
    setConvertingLead(lead);
    convertForm.setValues({
      clientName: lead.name,
      companyName: '',
      email: lead.email,
      phone: lead.phone || '',
      address: '',
      projectName: `${lead.name} Project`,
      departmentId: '',
      projectManagerId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setConvertModalOpen(true);
  };

  const convertForm = useForm({
    initialValues: {
      clientName: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      projectName: '',
      departmentId: '',
      projectManagerId: '',
      startDate: '',
      endDate: ''
    },
    validationSchema: {
      clientName: { required: true, message: 'Client name is required.' },
      companyName: { required: true, message: 'Company name is required.' },
      projectName: { required: true, message: 'Project name is required.' },
      departmentId: { required: true, message: 'Department is required.' },
      projectManagerId: { required: true, message: 'Project Manager is required.' },
      startDate: { required: true, message: 'Start date is required.' },
      endDate: { required: true, message: 'End date is required.' }
    },
    onSubmit: async (values) => {
      if (!convertingLead) return;
      try {
        const clientData = {
          name: values.clientName,
          companyName: values.companyName,
          email: values.email,
          phone: values.phone,
          address: values.address
        };
        const projectData = {
          name: values.projectName,
          departmentId: Number(values.departmentId),
          projectManagerId: Number(values.projectManagerId),
          startDate: values.startDate,
          endDate: values.endDate,
          status: ProjectStatus.NOT_STARTED,
          progressPercentage: 0,
          createdBy: currentUserId // Mocking current user
        };

        await crud.convert(convertingLead.id, clientData, projectData);
        // ✅ refresh leads
await axiosInstance.get("/leads/"); // or whatever your list function is
        setConvertModalOpen(false);
        setConvertingLead(null);
      } catch (error) {
        console.error("Conversion failed:", error);
      }
    }
  });

  const handleAssignExec = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const formData = new FormData(e.currentTarget);
    const execId = Number(formData.get('sales_exec_id'));
    if (!execId) return;

    try {
      await crud.assign(selectedLead.id, execId);
      fetchLeadDetails(selectedLead.id);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Assignment failed:", error);
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsModalOpen(true);
  };
  
 const stats = {
  total: leadList.length,
  new: leadList.filter(l => l.status === 'new').length,
  contacted: leadList.filter(l => l.status === 'contacted').length,
  qualified: leadList.filter(l => l.status === 'qualified').length,
  converted: leadList.filter(l => l.status === 'converted').length,
};

  return (
     <>
    <div className="container-fluid p-0">
      {/* Pipeline Summary */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Leads', count: stats.total, color: 'primary', icon: 'people' },
          { label: 'New', count: stats.new, color: 'info', icon: 'plus-circle' },
          { label: 'Contacted', count: stats.contacted, color: 'warning', icon: 'telephone' },
          { label: 'Qualified', count: stats.qualified, color: 'indigo', icon: 'check-circle' },
          { label: 'Converted', count: stats.converted, color: 'success', icon: 'briefcase' },
        ].map((s, i) => (
          <div key={i} className="col">
            <div className="card border-0 shadow-sm p-3">
              <div className="d-flex align-items-center">
                <div className={`bg-${s.color}-subtle text-${s.color} rounded-3 p-2 me-3`}>
                  <i className={`bi bi-${s.icon} fs-5`}></i>
                </div>
                <div>
                  <div className="text-secondary smaller fw-bold uppercase">{s.label}</div>
                  <div className="fs-4 fw-bold text-dark">{s.count}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Sales Pipeline</h4>
          <p className="text-secondary small mb-0">Tracking prospects and conversion rates</p>
        </div>
        <button className="btn btn-primary btn-sm fw-bold px-3 shadow-sm" onClick={handleAddNew}>
          <i className="bi bi-person-plus me-2"></i>New Lead
        </button>
      </div>
 <div className="px-4 pb-3 border-bottom">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
              <input 
                type="text" 
                className="form-control bg-light border-0" 
                placeholder="Search leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select form-select-sm bg-light border-0"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-professional align-middle mb-0">
          <thead>
            <tr>
              <th className="px-4">Prospect</th>
              <th>Contact Info</th>
              <th>Source</th>
              <th>Status</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
           {leadList
  .filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchTerm));

    const matchesStatus =
      !statusFilter || statusFilter === "all"
        ? true
        : lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .map(lead => (
              <tr key={lead.id} className="hover-bg-light transition">
                <td className="px-4 fw-bold text-dark">
                  {lead.name}
                  {lead.status === 'converted' && lead.converted_project&& (
                    <div className="smaller mt-1">
                      <a href={`#/projects/${lead.converted_project}`} className="text-decoration-none text-success fw-bold d-flex align-items-center">
                        <i className="bi bi-box-arrow-up-right me-1"></i>View Project
                      </a>
                    </div>
                  )}
                </td>
                <td>
                  <div className="small text-dark">{lead.email}</div>
                  <div className="smaller text-muted">{lead.phone}</div>
                </td>
                <td><span className="badge bg-light text-dark border fw-normal">{lead.source}</span></td>
                <td>
                  <span className={`badge rounded-pill ${lead.status === 'converted' ? 'bg-success' : 'bg-primary'}`}>{lead.status}</span>
                </td>
                <td className="text-end px-4">
                  <div className="btn-group shadow-sm rounded-3 overflow-hidden">
                    {lead.status !== 'converted' && (
                      <button className="btn btn-sm btn-white border-end" onClick={() => handleOpenConvert(lead)} title="Convert to Project">
                        <i className="bi bi-arrow-repeat text-success"></i>
                      </button>
                    )}
                    <button className="btn btn-sm btn-white border-end" onClick={() => handleViewDetails(lead)} title="View Details">
                      <i className="bi bi-eye text-info"></i>
                    </button>
                    <button className="btn btn-sm btn-white border-end" onClick={() => handleEdit(lead)} title="Edit Lead">
                      <i className="bi bi-pencil text-primary"></i>
                    </button>
                   <button
  className="btn btn-sm btn-white"
  onClick={() => handleDeleteClick(lead)}
  title="Delete Lead"
>
  <i className="bi bi-trash text-danger"></i>
</button>
                      
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Lead Modal */}
      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header border-0 bg-white pt-4 px-4">
                  <h5 className="modal-title fw-bold text-dark">{editingLead ? 'Update Prospect Profile' : 'Register New Prospect'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-12">
                      <FormField
                        label="Full Name *"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="e.g. Alex Thompson"
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField
                        label="Email *"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="alex@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField
                        label="Phone"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        placeholder="+91 00000 00000"
                      />
                    </div>
                    <div className="col-12">
                      <FormField
                        label="Source"
                        name="source"
                        type="select"
                        value={values.source}
                        onChange={handleChange}
                        options={[
                          { label: 'Website', value: 'Web' },
                          { label: 'Ads', value: 'Ads' },
                          { label: 'Referral', value: 'Referral' },
                          { label: 'Direct', value: 'Direct' }
                        ]}
                      />
                    </div>
                    {editingLead && (
                      <>
                        <div className="col-md-6">
                          <FormField
                            label="Status"
                            name="status"
                            type="select"
                            value={values.status}
                            onChange={handleChange}
                            options={[
                              { label: 'New', value: 'new' },
                              { label: 'Contacted', value: 'contacted' },
                              { label: 'Qualified', value: 'qualified' },
                              { label: 'Converted', value: 'converted' },
                              { label: 'Lost', value: 'lost' }
                            ]}
                          />
                        </div>
                        <div className="col-md-6">
                          <FormField
                            label="Converted Project ID"
                            name="converted_project_id"
                            type="number"
                            value={values.converted_project_id}
                            onChange={handleChange}
                            placeholder="Project ID"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 bg-white pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                    ) : (
                      editingLead ? 'Save Changes' : 'Confirm Registration'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal (Assignments & Followups) */}
      {isDetailsModalOpen && selectedLead && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header border-0 bg-white pt-4 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark">{selectedLead.name}</h5>
                  <p className="text-secondary smaller mb-0">{selectedLead.email} | {selectedLead.phone}</p>
                </div>
                <button type="button" className="btn-close" onClick={() => setDetailsModalOpen(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="row g-4">
                  <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100 p-3">
                      <h6 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-person-badge me-2 text-primary"></i>Assignments</h6>
                      
                      <form onSubmit={handleAssignExec} className="mb-3">
                        <div className="input-group input-group-sm">
                          <select name="sales_exec_id" className="form-select bg-light border-0" required>
                            <option value="">Assign Executive...</option>
                            {salesExecs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                          <button type="submit" className="btn btn-primary"><i className="bi bi-plus"></i></button>
                        </div>
                      </form>

                      {assignments.length === 0 ? (
                        <p className="text-muted smaller italic">No executives assigned yet.</p>
                      ) : (
                        <ul className="list-group list-group-flush">
                          {assignments.map(a => (
  <li key={a.id} className="list-group-item bg-transparent px-0 py-2 border-0">
    <div className="fw-bold small">
      {a.sales_exec_details?.name || 'Unknown'}
    </div>
    <div className="smaller text-muted">
      Assigned: {new Date(a.assigned_at).toLocaleDateString()}
    </div>
  </li>
))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-3 mb-4">
                      <h6 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-chat-dots me-2 text-primary"></i>Follow-up History</h6>
                      <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                        {followups.length === 0 ? (
                          <p className="text-muted smaller italic text-center py-4">No follow-up history found.</p>
                        ) : (
                          <div className="timeline-simple">
                            {followups.map(f => (
                              <div key={f.id} className="mb-3 border-start border-primary border-3 ps-3 py-1">
                                <div className="d-flex justify-content-between">
                                  <span className="badge bg-primary-subtle text-primary smaller text-uppercase">{f.followup_type}</span>
                                  <span className="smaller text-muted">{new Date(f.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="small mb-1 mt-1 text-dark">{f.notes}</p>
                                {f.next_followup && <div className="smaller fw-bold text-warning">Next: {f.next_followup}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card border-0 shadow-sm p-3">
                      <h6 className="fw-bold mb-3 d-flex align-items-center"><i className="bi bi-plus-circle me-2 text-success"></i>New Follow-up</h6>
                      <form onSubmit={handleAddFollowup}>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <select name="followup_type" className="form-select form-select-sm bg-light border-0" required>
                              <option value="call">Call</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="meeting">Meeting</option>
                              <option value="email">Email</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <input name="next_followup" type="date" className="form-control form-control-sm bg-light border-0" />
                          </div>
                          <div className="col-12">
                            <textarea name="notes" className="form-control form-control-sm bg-light border-0" rows={2} placeholder="Add notes here..." required></textarea>
                          </div>
                          <div className="col-12 text-end">
                            <button type="submit" className="btn btn-success btn-sm fw-bold px-3">Log Follow-up</button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Convert Lead Modal */}
      {isConvertModalOpen && convertingLead && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={convertForm.handleSubmit} noValidate>
                <div className="modal-header border-0 bg-white pt-4 px-4">
                  <h5 className="modal-title fw-bold text-dark">Convert Lead to Project</h5>
                  <button type="button" className="btn-close" onClick={() => setConvertModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-12"><h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">Client Information</h6></div>
                    <div className="col-md-6">
                      <FormField label="Client Name" name="clientName" value={convertForm.values.clientName} onChange={convertForm.handleChange} error={convertForm.errors.clientName} required />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Company Name" name="companyName" value={convertForm.values.companyName} onChange={convertForm.handleChange} error={convertForm.errors.companyName} required />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Email" name="email" type="email" value={convertForm.values.email} onChange={convertForm.handleChange} />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Phone" name="phone" value={convertForm.values.phone} onChange={convertForm.handleChange} />
                    </div>
                    <div className="col-12">
                      <FormField label="Address" name="address" type="textarea" value={convertForm.values.address} onChange={convertForm.handleChange} rows={2} />
                    </div>

                    <div className="col-12 mt-4"><h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">Project Details</h6></div>
                    <div className="col-12">
                      <FormField label="Project Name" name="projectName" value={convertForm.values.projectName} onChange={convertForm.handleChange} error={convertForm.errors.projectName} required />
                    </div>
                    <div className="col-md-6">
                      <FormField 
                        label="Department" 
                        name="departmentId" 
                        type="select" 
                        value={convertForm.values.departmentId} 
                        onChange={convertForm.handleChange} 
                        error={convertForm.errors.departmentId} 
                        required 
                      options={(Array.isArray(departments) ? departments : [])
  .filter(d => d && d.id)
  .map(d => ({
    label: d.name ?? '',
    value: String(d.id)
  }))
}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField 
                        label="Project Manager" 
                        name="projectManagerId" 
                        type="select" 
                        value={convertForm.values.projectManagerId} 
                        onChange={convertForm.handleChange} 
                        error={convertForm.errors.projectManagerId} 
                        required 
                    options={(Array.isArray(users) ? users : [])
  .filter(u =>
    u &&
    (u.role_name === UserRole.PROJECT_MANAGER ||
     u.role_name === UserRole.SUPER_ADMIN)
  )
  .map(u => ({
    label: u.name ?? '',
    value: String(u.id)
  }))
}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Start Date" name="startDate" type="date" value={convertForm.values.startDate} onChange={convertForm.handleChange} error={convertForm.errors.startDate} required />
                    </div>
                    <div className="col-md-6">
                      <FormField label="End Date" name="endDate" type="date" value={convertForm.values.endDate} onChange={convertForm.handleChange} error={convertForm.errors.endDate} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-white pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setConvertModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm" disabled={convertForm.isSubmitting}>
                    {convertForm.isSubmitting ? 'Converting...' : 'Convert & Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>


    {deleteModalOpen && leadToDelete && (
  <DeleteConfirmModal
    isOpen={deleteModalOpen}
    title="Delete Lead"
    message={`Are you sure you want to delete "${leadToDelete.name}"? This action cannot be undone.`}
    onClose={() => {
      setDeleteModalOpen(false);
      setLeadToDelete(null);
    }}
    onConfirm={handleConfirmDelete}
  />
)}
     </>
  );
};

export default LeadsPage;
