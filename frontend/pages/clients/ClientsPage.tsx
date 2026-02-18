import React, { useState, useMemo } from 'react';
import { Client } from '../../types';

interface ClientsPageProps {
  clients: Client[];
  crud: any;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, crud }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const payload = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      companyName: fd.get('companyName') as string,
      gstNo: fd.get('gstNo') as string,
      address: fd.get('address') as string,
    };

    if (editingClient) {
      crud.update(editingClient.id, payload);
    } else {
      crud.add(payload);
    }
    setModalOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark">Client Management</h3>
          <p className="text-secondary small mb-0">Manage business accounts, GST details, and contact information</p>
        </div>
        <button className="btn btn-primary fw-bold shadow-sm px-4" onClick={() => { setEditingClient(null); setModalOpen(true); }}>
          <i className="bi bi-person-plus-fill me-2"></i>Register New Client
        </button>
      </div>

      <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
        <div className="row align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0 px-3"><i className="bi bi-search text-muted"></i></span>
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
            <span className="text-secondary small fw-bold uppercase">Total Accounts: {clients.length}</span>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-professional align-middle mb-0">
            <thead>
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
                  <td colSpan={5} className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-people fs-1 opacity-25 d-block mb-3"></i>
                      <h6 className="fw-bold">No clients found</h6>
                      <p className="small mb-0">Try adjusting your search or register a new client.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover-bg-light transition">
                    <td className="px-4">
                      <div className="d-flex align-items-center">
                        <div className="avatar-placeholder bg-primary-subtle text-primary rounded-circle me-3 d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{width: '38px', height: '38px', fontSize: '0.9rem'}}>
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{client.name}</div>
                          <div className="smaller text-muted">Joined: {client.createdAt}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold text-primary mb-1">{client.companyName}</div>
                      <div className="small">
                        <span className="badge bg-light text-secondary border fw-normal">
                          <i className="bi bi-hash me-1"></i>GST: {client.gstNo || 'Unregistered'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="small text-dark fw-medium"><i className="bi bi-envelope-at me-2 text-muted"></i>{client.email}</div>
                      <div className="smaller text-secondary"><i className="bi bi-telephone me-2 text-muted"></i>{client.phone}</div>
                    </td>
                    <td>
                      <div className="smaller text-secondary text-truncate" style={{ maxWidth: '200px' }} title={client.address}>
                        <i className="bi bi-geo-alt me-1"></i>{client.address}
                      </div>
                    </td>
                    <td className="text-end px-4">
                      <div className="btn-group shadow-sm rounded-3 overflow-hidden">
                        <button className="btn btn-sm btn-white border-end" onClick={() => handleEdit(client)} title="Edit Client">
                          <i className="bi bi-pencil-square text-primary"></i>
                        </button>
                        <button className="btn btn-sm btn-white" onClick={() => { if(confirm('Are you sure you want to delete this client?')) crud.delete(client.id); }} title="Delete Client">
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

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 bg-white pt-4 px-4">
                  <h5 className="modal-title fw-bold text-dark">
                    {editingClient ? <><i className="bi bi-pencil-square me-2"></i>Update Client Profile</> : <><i className="bi bi-person-plus me-2"></i>Register New Client</>}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase tracking-wider">Contact Person Name *</label>
                      <input name="name" type="text" className="form-control form-control-lg border-light bg-light" defaultValue={editingClient?.name} placeholder="e.g. John Doe" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase tracking-wider">Company Name *</label>
                      <input name="companyName" type="text" className="form-control form-control-lg border-light bg-light" defaultValue={editingClient?.companyName} placeholder="e.g. Grehasoft Solutions" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase tracking-wider">Email Address *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-light"><i className="bi bi-envelope"></i></span>
                        <input name="email" type="email" className="form-control form-control-lg border-light bg-light" defaultValue={editingClient?.email} placeholder="client@company.com" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase tracking-wider">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-light"><i className="bi bi-phone"></i></span>
                        <input name="phone" type="text" className="form-control form-control-lg border-light bg-light" defaultValue={editingClient?.phone} placeholder="+91 00000 00000" />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase tracking-wider">GST Registration Number</label>
                      <input name="gstNo" type="text" className="form-control form-control-lg border-light bg-light" defaultValue={editingClient?.gstNo} placeholder="Enter 15-digit GSTIN" />
                      <div className="form-text smaller text-muted">Optional: Required for tax invoicing.</div>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase tracking-wider">Office Address</label>
                      <textarea name="address" className="form-control border-light bg-light" rows={3} defaultValue={editingClient?.address} placeholder="Enter full registered business address..."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4 py-2" onClick={() => setModalOpen(false)}>Discard Changes</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2 shadow-sm">
                    {editingClient ? 'Save Profile Updates' : 'Confirm Registration'}
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

export default ClientsPage;