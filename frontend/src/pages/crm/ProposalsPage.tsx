import React, { useState, useEffect } from 'react';
import { Proposal, Lead, ProposalItem } from '../../types';
import { generateProposalPDF } from '../../utils/pdfGenerator';
import { useLocation } from "react-router-dom";
import axiosInstance from '../../api/axiosInstance';
import { useCrud } from '../../hooks/useCrud';

interface ProposalsPageProps {
  leads: Lead[];
  setProjects?: (projects: any[]) => void;
  setLeads?: (leads: any[]) => void;
}

const ProposalsPage: React.FC<ProposalsPageProps> = ({ leads, setProjects, setLeads }) => {
  const {
    items: proposals,
    pagination: { page, setPage, totalPages, totalCount: count },
    add,
    update,
    delete: remove,
    refetch,
    setItems: setProposalsList,
  } = useCrud<Proposal>({ endpoint: '/proposals' });

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([
    { service: '', description: '', cost: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const location = useLocation();

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const params = new URLSearchParams(location.search);
  const leadId = params.get("lead");
 useEffect(() => {
  if (leadId) {
    axiosInstance.get(`/leads/${leadId}/`).then(res => {
      const lead = res.data;

      setSelectedLeadId(lead.id);   // ⭐ important
      setClientName(lead.name);
      setEmail(lead.email);
      setPhone(lead.phone);

      setModalOpen(true);
    });
  }
}, [leadId]);

 useEffect(() => {
  if (editingProposal) {
    // ✅ Existing logic
    setItems(editingProposal.items || [{ service: '', description: '', cost: 0 }]);
    setDiscount(editingProposal.discount || 0);

    // 🔥 ADD THIS BLOCK
    const lead = leads.find(l => l.id === editingProposal.leadId);

    if (lead) {
      setSelectedLeadId(lead.id);   // ✅ FIX DROPDOWN
      setClientName(lead.name);
      setEmail(lead.email);
      setPhone(lead.phone);
    }

  } else {
    setItems([{ service: '', description: '', cost: 0 }]);
    setDiscount(0);

    // 🔥 Reset when creating new
    setSelectedLeadId('');
    setClientName('');
    setEmail('');
    setPhone('');
  }
}, [editingProposal, isModalOpen, leads]);


  useEffect(() => {
  if (!selectedLeadId) return;

  const lead = leads.find(l => l.id === Number(selectedLeadId));

  if (lead) {
    setClientName(lead.name);
    setEmail(lead.email);
    setPhone(lead.phone);
  }
}, [selectedLeadId, leads]);

  const subtotal = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalAmount = subtotal - discount;

  const handleAddItem = () => {
    setItems([...items, { service: '', description: '', cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProposalItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const selectedLead = leads.find(l => l.id === Number(data.leadId));

    const payload = {
      lead: Number(data.leadId),
      leadName: selectedLead?.name,
    
      title: data.title,
      description: data.description,
      projectOverview: data.projectOverview,
      items: items,
      subtotal: subtotal,
      discount: discount,
      amount: totalAmount,
      status: data.status || 'draft'
    };

    if (editingProposal) {
      await update(editingProposal.id!, payload);
    } else {
      await add(payload);
    }
    setModalOpen(false);
    setEditingProposal(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-success';
      case 'sent': return 'bg-primary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

const handleConvert = async (proposal: Proposal) => {
  try {
    console.log("Converting proposal:", proposal.id);

    const res = await axiosInstance.post(
      `/proposals/${proposal.id}/convert/`
    );

    console.log("✅ Convert success:", res.data);

    // ✅ update UI instantly
    setProposalsList(prev =>
      prev.map(p =>
        p.id === proposal.id
          ? { ...p, is_converted: true, client: res.data.project?.client }
          : p
      )
    );

    // ✅ refresh projects
    if (setProjects) {
      const projectRes = await axiosInstance.get('/projects/?limit=1000');
      setProjects(projectRes.data.results ?? []);
    }

    // ✅ refresh leads
    if (setLeads) {
      const leadsRes = await axiosInstance.get('/leads/');
      setLeads(leadsRes.data.results ?? leadsRes.data ?? []);
    }

  } catch (err: any) {
    console.error("❌ Convert error:", err.response?.data);
    alert(err.response?.data?.error || "Convert failed");
  }
};
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">Business Proposals</h4>
          <p className="text-secondary small mb-0">Manage and track client project proposals</p>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm" onClick={() => { setEditingProposal(null); setModalOpen(true); }}>
          <i className="bi bi-plus-lg me-2"></i>Create Proposal
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 small text-uppercase fw-bold text-secondary">Title</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Lead</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Amount</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Status</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Created</th>
              <th className="text-end px-4 py-3 small text-uppercase fw-bold text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">No proposals found</td>
              </tr>
            ) : (
             proposals.map(proposal => (
                <tr key={proposal.id}>
                  <td className="px-4 fw-bold">{proposal.title}</td>
                  <td>{proposal.leadName}</td>
                  <td><span className="fw-bold text-primary">₹{proposal.amount.toLocaleString()}</span></td>
                  <td>
                    <span className={`badge rounded-pill ${getStatusBadgeClass(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="small text-muted">{new Date(proposal.created_at).toLocaleDateString()}</td>
                  <td className="text-end px-4">
            <div className="btn-group">

  {/* Converted badge OR Convert button */}
 {proposal.is_converted ? (
  <span className="badge bg-success-subtle text-success border border-success me-2 py-2 px-3">
    <i className="bi bi-check-circle-fill me-1"></i>Converted
  </span>
) : proposal.status === "accepted" && (
  <button
    className="btn btn-sm btn-outline-success me-2 shadow-sm"
   onClick={() => handleConvert(proposal)}
  >
    <i className="bi bi-rocket-takeoff me-1"></i>Convert
  </button>
)}

  

  {/* Download PDF */}
  <button
    className="btn btn-sm btn-outline-dark me-2 shadow-sm"
    onClick={() => generateProposalPDF(proposal)}
    title="Download PDF Proposal"
  >
    <i className="bi bi-file-earmark-pdf me-1"></i>PDF
  </button>

  {/* WhatsApp */}
  <button
    className="btn btn-sm btn-outline-success me-2 shadow-sm"
    onClick={() => {
      const lead = leads.find(l => l.id === proposal.leadId);
      if (lead?.phone) {
        const message = encodeURIComponent(
          `Hi ${lead.name}, here is the proposal for "${proposal.title}".`
        );
        window.open(
          `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${message}`,
          '_blank'
        );
      }
    }}
  >
    <i className="bi bi-whatsapp"></i>
  </button>

  {/* Email */}
  <button
    className="btn btn-sm btn-outline-primary me-2 shadow-sm"
    onClick={() => {
      const lead = leads.find(l => l.id === proposal.leadId);
      if (lead?.email) {
        const subject = encodeURIComponent(`Proposal: ${proposal.title}`);
        const body = encodeURIComponent(
          `Hi ${lead.name},\n\nPlease find the attached proposal.`
        );
        window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
      }
    }}
  >
    <i className="bi bi-envelope"></i>
  </button>

  {/* Edit */}
  <button
    className="btn btn-sm btn-light me-2 border shadow-sm"
    onClick={() => {
  setEditingProposal(proposal);
  setSelectedLeadId(proposal.leadId);   // ⭐ important
  setModalOpen(true);
}}
  >
    <i className="bi bi-pencil"></i>
  </button>

  {/* Delete */}
  <button
    className="btn btn-sm btn-light text-danger border shadow-sm"
    onClick={() => remove(proposal.id)}
  >
    <i className="bi bi-trash"></i>
  </button>

</div>
                    {proposal.lastSentAt && (
                      <div className="smaller text-secondary mt-1">
                        <i className="bi bi-send me-1"></i>Sent: {new Date(proposal.lastSentAt).toLocaleDateString()}
                      </div>
                    )}
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

  {/* PREV */}
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

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">{editingProposal ? 'Edit Proposal' : 'Create Proposal'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold">Lead</label>
                     <select
  name="leadId"
  className="form-select"
  value={selectedLeadId || ""} 
  onChange={(e) => setSelectedLeadId(Number(e.target.value))}
  required
>
  <option value="">Select Lead</option>
  {leads.map(l => (
    <option key={l.id} value={l.id}>{l.name}</option>
  ))}
</select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold">Title</label>
                      <input name="title" type="text" className="form-control" defaultValue={editingProposal?.title} placeholder="e.g. Website Redesign" required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Status</label>
                    <select name="status" className="form-select" defaultValue={editingProposal?.status || 'draft'}>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Project Overview</label>
                    <textarea name="projectOverview" className="form-control" rows={3} defaultValue={editingProposal?.projectOverview} placeholder="Project goals and objectives..."></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description (Intro)</label>
                    <textarea name="description" className="form-control" rows={2} defaultValue={editingProposal?.description} placeholder="Brief introduction..."></textarea>
                  </div>

                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">Estimated Cost Table</h6>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddItem}>
                      <i className="bi bi-plus-lg me-1"></i>Add Item
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: '30%' }}>Service</th>
                          <th style={{ width: '40%' }}>Description</th>
                          <th style={{ width: '20%' }}>Cost (₹)</th>
                          <th style={{ width: '10%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                value={item.service} 
                                onChange={(e) => handleItemChange(index, 'service', e.target.value)} 
                                placeholder="Service name"
                                required
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                value={item.description} 
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                                placeholder="Details"
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                className="form-control form-control-sm text-end" 
                                value={item.cost} 
                                onChange={(e) => handleItemChange(index, 'cost', Number(e.target.value))} 
                                required
                              />
                            </td>
                            <td className="text-center">
                              <button 
                                type="button" 
                                className="btn btn-link text-danger p-0" 
                                onClick={() => handleRemoveItem(index)}
                                disabled={items.length === 1}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="text-end fw-bold">Subtotal:</td>
                          <td className="text-end fw-bold">₹{subtotal.toLocaleString()}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="text-end fw-bold">Discount:</td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control form-control-sm text-end" 
                              value={discount} 
                              onChange={(e) => setDiscount(Number(e.target.value))} 
                            />
                          </td>
                          <td></td>
                        </tr>
                        <tr className="table-primary">
                          <td colSpan={2} className="text-end fw-bold">Grand Total:</td>
                          <td className="text-end fw-bold">₹{totalAmount.toLocaleString()}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 shadow-sm">Save Proposal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalsPage;
