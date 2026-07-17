import React from 'react';

interface FixedSectionEditorProps {
  sectionId: string;
}

const FixedSectionEditor: React.FC<FixedSectionEditorProps> = ({ sectionId }) => {
  return (
    <div className="alert alert-info py-2 px-3 mb-0">
      <div className="d-flex align-items-center mb-2">
        <i className="bi bi-info-circle-fill me-2 fs-5 text-primary"></i>
        <span className="fw-bold text-dark small">Standard Policy Page</span>
      </div>
      <p className="smaller text-secondary mb-3">
        The content of this section is fixed by Grehasoft's policies to maintain standard terms and additional charges. It is generated automatically in the final PDF.
      </p>
      
      {sectionId === 'additional_charges' && (
        <div className="table-responsive bg-white border p-2 rounded">
          <table className="table table-sm table-bordered mb-0 smaller text-dark" style={{ fontSize: '11px' }}>
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-bold">1. Domain & Hosting</td>
                <td>
                  • The client may independently purchase the domain name and credentials.<br/>
                  • Alternatively, Grehasoft can register it on their behalf.<br/>
                  • Website hosting provided through Grehasoft reseller hosting.<br/>
                  • Securely deployed, maintained and hosted.
                </td>
                <td>Starts from ₹5,000/yr</td>
              </tr>
              <tr>
                <td className="fw-bold">2. SSL Certificate</td>
                <td>
                  If a free SSL is used, no charge applies. Premium SSL must be purchased by client.
                </td>
                <td>Included / Client Paid</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {sectionId === 'maintenance_cost' && (
        <div className="bg-white border p-3 rounded smaller text-dark" style={{ fontSize: '12px' }}>
          <p className="fw-bold mb-1">3. Maintenance Cost (* If required by client only)</p>
          <ul className="ps-3 mb-2">
            <li>Security, Plugin & Theme Updates</li>
            <li>Content Updates & Backups</li>
            <li>User Management</li>
          </ul>
          <p className="fw-bold mb-1">Pricing Plans:</p>
          <ul className="ps-3 mb-2">
            <li>Yearly Advance: ₹25,000</li>
            <li>Quarterly Advance: ₹7,000</li>
            <li>Monthly: ₹3,000</li>
          </ul>
          <p className="text-muted fst-italic mb-0 border-top pt-2">
            "If the client does not opt for any maintenance plan, future maintenance requests will be charged based on functionality or development time at ₹500/hour."
          </p>
        </div>
      )}

      {sectionId === 'terms_conditions' && (
        <div className="bg-white border p-3 rounded smaller text-dark" style={{ fontSize: '12px', maxHeight: '250px', overflowY: 'auto' }}>
          <p className="fw-bold mb-1">1. Payment Terms</p>
          <p className="text-muted ps-2">Dynamic payment schedule values from proposal settings.</p>
          
          <p className="fw-bold mb-1">2. Project Scope & Costs</p>
          <p className="text-muted ps-2">Scope changes revision policies.</p>
          
          <p className="fw-bold mb-1">3. Scope Limitation</p>
          <p className="text-muted ps-2">Information website only, no custom systems.</p>
          
          <p className="fw-bold mb-1">4. Design & Banner Images Policy</p>
          <p className="text-muted ps-2">Royalty-free & AI-generated images usage.</p>
          
          <p className="fw-bold mb-1">5. Client Provided Images</p>
          <p className="text-muted ps-2">High-quality image requirements.</p>

          <p className="fw-bold mb-1">6. Design</p>
          <p className="text-muted ps-2">1 initial design, 2 free revisions.</p>
          
          <p className="fw-bold mb-1">...</p>
          <p className="text-muted ps-2">Please see the final generated PDF for the full 15 clauses.</p>
        </div>
      )}
    </div>
  );
};

export default FixedSectionEditor;
