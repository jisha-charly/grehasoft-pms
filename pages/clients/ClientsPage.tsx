
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
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const payload = {
      name: data.name as string,
      email: data.email as string,
      phone: data.phone as string,
      companyName: data.companyName as string,
      gstNo: data.gstNo as string,
      address: data.address as string,
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
          <h3 className="fw-bold mb-1">Client Directory</h3>
          <p className="text-secondary small mb-0">Manage business accounts and contact profiles</p>
        </div>
        <button className="btn btn-dark fw-bold" onClick={() => { setEditingClient(null); setModalOpen(true); }}>
          <i className="bi bi-person-plus me-2"></i>Register Client
        </button>
      </div>

      <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
        <div className="input-group input-group-sm w-25">
          <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
          <input 
            type="text" 
            className="form-control bg-light border-0" 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-professional align-middle mb-0">
            <thead>
              <tr>
                <th className="px-4">Client Name</th>
                <th>Company Details</th>
                <th>Contact Info</th>
                <th>GST Identification</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">No clients found in directory.</td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id}>
                    <td className="px-4">
                      <div className="fw-bold text-dark">{client.name}</div>
                      <div className="smaller text-muted">Joined: {client.createdAt}</div>
                    </td>
                    <td>
                      <div className="fw-semibold text-primary">{client.companyName}</div>
                      <div className="smaller text-secondary text-truncate" style={{ maxWidth: '200px' }}>{client.address}</div>
                    </td>
                    <td>
                      <div className="small text-dark">{client.email}</div>
                      <div className="smaller text-muted">{client.phone}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border fw-normal">{client.gstNo || 'Not Provided'}</span>
                    </td>
                    <td className="text-end px-4">
                      <div className="btn-group">
                        <button className="btn btn-sm btn-light me-2" onClick={() => handleEdit(client)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-light text-danger" onClick={() => crud.delete(client.id)}>
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

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-header border-0 bg-white pt-4 px-4">
                  <h5 className="modal-title fw-bold">{editingClient ? 'Update Client Profile' : 'New Client Registration'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase">Contact Person *</label>
                      <input name="name" type="text" className="form-control" defaultValue={editingClient?.name} placeholder="e.g. John Doe" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase">Company Name *</label>
                      <input name="companyName" type="text" className="form-control" defaultValue={editingClient?.companyName} placeholder="e.g. Acme Corp" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase">Email Address *</label>
                      <input name="email" type="email" className="form-control" defaultValue={editingClient?.email} placeholder="john@company.com" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase">Phone Number</label>
                      <input name="phone" type="text" className="form-control" defaultValue={editingClient?.phone} placeholder="+91..." />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase">GST Number (Optional)</label>
                      <input name="gstNo" type="text" className="form-control" defaultValue={editingClient?.gstNo} placeholder="15-digit GSTIN" />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label smaller fw-bold text-secondary text-uppercase">Registered Address</label>
                      <textarea name="address" className="form-control" rows={3} defaultValue={editingClient?.address} placeholder="Full business address..."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4 pt-0 bg-white">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Save Profile</button>
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
