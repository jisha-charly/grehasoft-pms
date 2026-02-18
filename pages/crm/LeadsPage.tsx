
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
          <h4 className="fw-bold mb-0">Sales Pipeline</h4>
          <p className="text-secondary small mb-0">Tracking prospects and conversion rates</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
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
                <td className="px-4 fw-bold">{lead.name}</td>
                <td>
                  <div className="small text-dark">{lead.email}</div>
                  <div className="smaller text-muted">{lead.phone}</div>
                </td>
                <td><span className="badge bg-light text-dark border">{lead.source}</span></td>
                <td>
                  <span className={`badge rounded-pill ${
                    lead.status === 'converted' ? 'bg-success' : 
                    lead.status === 'new' ? 'bg-info text-white' : 
                    lead.status === 'qualified' ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="text-end px-4">
                  <div className="btn-group">
                    {lead.status !== 'converted' && (
                      <button className="btn btn-sm btn-outline-success me-2" onClick={() => crud.convert(lead.id)}>
                        <i className="bi bi-rocket-takeoff me-1"></i> Convert
                      </button>
                    )}
                    <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(lead.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content border-0">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Add New Prospect</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Full Name</label>
                    <input name="name" type="text" className="form-control" placeholder="John Doe" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Email Address</label>
                    <input name="email" type="email" className="form-control" placeholder="john@example.com" required />
                  </div>
                  <div className="row">
                    <div className="col mb-3">
                      <label className="form-label small fw-bold">Phone Number</label>
                      <input name="phone" type="text" className="form-control" placeholder="+1..." />
                    </div>
                    <div className="col mb-3">
                      <label className="form-label small fw-bold">Source</label>
                      <select name="source" className="form-select">
                        <option value="Google Ads">Google Ads</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Referral">Referral</option>
                        <option value="Website">Website</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-4">Add Lead</button>
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
