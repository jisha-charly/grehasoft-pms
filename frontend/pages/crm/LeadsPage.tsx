import React, { useState } from 'react';
import { Lead } from '../../types';

interface LeadsPageProps {
  leads: Lead[];
  crud: any;
}

const LeadsPage: React.FC<LeadsPageProps> = ({ leads, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    crud.add({
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: data.source,
      status: 'new'
    });
    setModalOpen(false);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Sales Pipeline</h4>
          <p className="text-secondary small mb-0">Tracking prospects and conversion rates</p>
        </div>
        <button className="btn btn-primary btn-sm fw-bold px-3" onClick={() => setModalOpen(true)}>
          <i className="bi bi-person-plus me-2"></i>New Lead
        </button>
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
            {leads.map(lead => (
              <tr key={lead.id}>
                <td className="px-4 fw-bold text-dark">{lead.name}</td>
                <td>
                  <div className="small text-dark">{lead.email}</div>
                  <div className="smaller text-muted">{lead.phone}</div>
                </td>
                <td><span className="badge bg-light text-dark border fw-normal">{lead.source}</span></td>
                <td><span className={`badge rounded-pill ${lead.status === 'converted' ? 'bg-success' : 'bg-primary'}`}>{lead.status}</span></td>
                <td className="text-end px-4">
                  <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(lead.id)}><i className="bi bi-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 bg-white pt-4 px-4">
                  <h5 className="modal-title fw-bold">Add New Prospect</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="mb-3"><label className="form-label smaller fw-bold">Full Name</label><input name="name" className="form-control" required /></div>
                  <div className="mb-3"><label className="form-label smaller fw-bold">Email</label><input name="email" type="email" className="form-control" required /></div>
                  <div className="mb-3"><label className="form-label smaller fw-bold">Phone</label><input name="phone" className="form-control" /></div>
                  <div className="mb-3"><label className="form-label smaller fw-bold">Source</label><select name="source" className="form-select"><option value="Web">Website</option><option value="Ads">Ads</option><option value="Referral">Referral</option></select></div>
                </div>
                <div className="modal-footer border-0 bg-white pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold">Add Lead</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;