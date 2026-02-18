import React from 'react';

const SEOPage: React.FC = () => (
  <div className="row g-4">
    <div className="col-12"><h4 className="fw-bold mb-0 text-dark">SEO Performance Tracking</h4></div>
    <div className="col-md-3"><div className="card p-4 text-center border-0 shadow-sm"><h2 className="fw-bold mb-1 text-primary">82</h2><div className="text-secondary smaller fw-bold uppercase">ON-PAGE SCORE</div></div></div>
    <div className="col-md-3"><div className="card p-4 text-center border-0 shadow-sm"><h2 className="fw-bold mb-1 text-success">1.2s</h2><div className="text-secondary smaller fw-bold uppercase">AVG LCP</div></div></div>
    <div className="col-md-3"><div className="card p-4 text-center border-0 shadow-sm"><h2 className="fw-bold mb-1 text-info">24</h2><div className="text-secondary smaller fw-bold uppercase">RANKINGS UP</div></div></div>
    <div className="col-md-3"><div className="card p-4 text-center border-0 shadow-sm"><h2 className="fw-bold mb-1 text-warning">0.5%</h2><div className="text-secondary smaller fw-bold uppercase">SPAM SCORE</div></div></div>
  </div>
);

export default SEOPage;