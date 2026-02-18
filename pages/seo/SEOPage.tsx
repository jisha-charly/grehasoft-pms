
import React from 'react';

const SEOPage: React.FC = () => (
  <div className="row g-4">
    <div className="col-12">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="fw-bold mb-0 text-dark">SEO Performance</h4>
        <div className="badge bg-primary">Automated Tracking On</div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold mb-0 text-primary">82</h2>
        <div className="text-secondary small fw-bold">ON-PAGE SCORE</div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold mb-0 text-success">1.2s</h2>
        <div className="text-secondary small fw-bold">AVG LCP</div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold mb-0 text-info">24</h2>
        <div className="text-secondary small fw-bold">POSITIONS UP</div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card p-3 text-center">
        <h2 className="fw-bold mb-0 text-warning">0.5%</h2>
        <div className="text-secondary small fw-bold">SPAM SCORE</div>
      </div>
    </div>
    <div className="col-12">
      <div className="card p-4">
        <h5 className="fw-bold mb-4">GMB Profile Tracking</h5>
        <div className="list-group list-group-flush">
          {['Downtown Office', 'Retail Branch A', 'Service Center North'].map(branch => (
            <div key={branch} className="list-group-item d-flex justify-content-between align-items-center py-3">
              <div>
                <div className="fw-bold">{branch}</div>
                <div className="small text-secondary">Verified Profile</div>
              </div>
              <div className="text-end">
                <div className="text-warning"><i className="bi bi-star-fill"></i> 4.8 (124 reviews)</div>
                <div className="badge bg-success-subtle text-success">+5 calls this week</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SEOPage;
