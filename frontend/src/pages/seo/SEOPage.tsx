import React, { useState } from "react";
import {
  Globe,
  Zap,
  TrendingUp,
  Shield,
  Download,
  Plus,
  BarChart3,
  Link2,
  Settings,
  MapPin,
  Users
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const chartData = [
  { name: "Jan", traffic: 4000 },
  { name: "Feb", traffic: 3200 },
  { name: "Mar", traffic: 4800 },
  { name: "Apr", traffic: 5100 },
  { name: "May", traffic: 6200 },
  { name: "Jun", traffic: 7200 }
];

const SEOPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="container-fluid py-4" style={{ background: "#f5f7fb" }}>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">SEO & Social Performance</h2>
          <p className="text-muted mb-0">
            Monitor rankings, audit performance, and optimize visibility.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary">
            <Download size={16} className="me-2" />
            Export Report
          </button>
          <button
  className="btn btn-primary"
  onClick={() => setShowModal(true)}
>
  <Plus size={16} className="me-2" />
  Add SEO Task
</button>
        </div>
      </div>

      {/* METRICS */}
      <div className="row g-4 mb-4">
        {[
          { title: "ON-PAGE SCORE", value: "82%", icon: <Globe size={20} />, color: "primary" },
          { title: "AVG LCP", value: "1.2s", icon: <Zap size={20} />, color: "success" },
          { title: "RANKINGS UP", value: "24", icon: <TrendingUp size={20} />, color: "info" },
          { title: "SPAM SCORE", value: "0.5%", icon: <Shield size={20} />, color: "warning" }
        ].map((m, i) => (
          <div key={i} className="col-md-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <div className={`p-3 bg-${m.color}-subtle text-${m.color} rounded-3 mb-3`}>
                {m.icon}
              </div>
              <small className="text-muted fw-semibold">{m.title}</small>
              <h3 className="fw-bold mt-2">{m.value}</h3>
            </div>
          </div>
        ))}
      </div>
      {/* ACTIVE SEO TASKS */}
<div className="card border-0 shadow-sm rounded-4 mb-4">
  <div className="p-4 border-bottom">
    <h5 className="fw-bold mb-0">Active SEO Tasks</h5>
  </div>

  <div className="table-responsive">
    <table className="table align-middle mb-0">
      <thead style={{ background: "#f8f9fc" }}>
        <tr>
          <th className="px-4 py-3">TASK ID</th>
          <th className="py-3">SEO TYPE</th>
          <th className="py-3">CREATED AT</th>
          <th className="px-4 py-3 text-end">STATUS</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="px-4 fw-bold">#1</td>
          <td>
            <span className="badge bg-info-subtle text-info">
              ON PAGE
            </span>
          </td>
          <td>1/1/2024</td>
          <td className="px-4 text-end">
            <span className="badge bg-success">
              Active
            </span>
          </td>
        </tr>

        <tr>
          <td className="px-4 fw-bold">#2</td>
          <td>
            <span className="badge bg-info-subtle text-info">
              KEYWORD
            </span>
          </td>
          <td>1/2/2024</td>
          <td className="px-4 text-end">
            <span className="badge bg-success">
              Active
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
      {/* SEARCH VISIBILITY + AI AUDIT */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">
              <BarChart3 size={18} className="me-2" />
              Search Visibility Trend
            </h5>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="traffic"
                    stroke="#0d6efd"
                    fill="#0d6efd"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card text-white rounded-4 shadow-sm p-4"
            style={{ background: "linear-gradient(135deg,#1e293b,#111827)" }}>
            <h5 className="fw-bold mb-3">⚡ AI SEO Audit</h5>
            <p className="small">
              Enter a URL to get a real-time SEO analysis.
            </p>
            <div className="input-group">
              <input className="form-control" placeholder="https://example.com" />
              <button className="btn btn-primary">Audit</button>
            </div>
          </div>
        </div>
      </div>

      {/* OFF PAGE + TECHNICAL */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">
              <Link2 size={18} className="me-2 text-primary" />
              Off-Page Activity
            </h5>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>URL</th>
                  <th>DA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Backlink</td>
                  <td><a href="#">https://directory.com</a></td>
                  <td>45</td>
                  <td><span className="badge bg-success">Live</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">
              <Settings size={18} className="me-2 text-primary" />
              Technical SEO
            </h5>
            <div className="row">
              <div className="col-6 mb-3">
                <small className="text-muted">Broken Links</small>
                <h4 className="fw-bold text-success">0</h4>
              </div>
              <div className="col-6 mb-3">
                <small className="text-muted">Sitemap</small>
                <h4 className="fw-bold text-primary">Updated</h4>
              </div>
              <div className="col-6">
                <small className="text-muted">LCP</small>
                <h4 className="fw-bold">1.2s</h4>
              </div>
              <div className="col-6">
                <small className="text-muted">CLS</small>
                <h4 className="fw-bold">0.05</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KEYWORD + LOCAL SEO */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">Keyword Tracking</h5>
            <table className="table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Position</th>
                  <th>Difficulty</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>enterprise pms</td>
                  <td>1,200</td>
                  <td>45%</td>
                  <td><span className="badge bg-success">#1</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">
              <MapPin size={18} className="me-2 text-primary" />
              Local SEO (GMB)
            </h5>
            <p className="fw-semibold">Grehasoft Solutions</p>
            <small className="text-muted">Software Company</small>
            <div className="mt-2">
              ⭐ 4.8 (150 reviews)
            </div>
            <button className="btn btn-outline-primary w-100 mt-3">
              Connect New Profile
            </button>
          </div>
        </div>
      </div>

     {/* SOCIAL MEDIA REACH */}
<div
  className="card border-0 rounded-4 p-4 mt-4"
  style={{
    background: "#e6f0ff",
  }}
>
  <h5 className="fw-bold mb-3">
    <Users size={18} className="me-2 text-primary" />
    Social Media Reach
  </h5>

  <div
    className="bg-white rounded-3 p-3 d-flex justify-content-between align-items-center shadow-sm"
  >
    <div>
      <div className="fw-semibold">LinkedIn</div>
      <div className="text-muted small">
        Likes: 120 &nbsp; Reach: 1,500
      </div>
    </div>

    <div className="text-muted small">
      2024-02-01
    </div>
  </div>

  <div className="text-center mt-3">
    <a href="#" className="fw-semibold text-primary text-decoration-none">
      View Detailed Analytics →
    </a>
  </div>
</div>
{showModal && (
  <>
    {/* Overlay */}
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 1050
      }}
      onClick={() => setShowModal(false)}
    />

    {/* Modal */}
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1060
      }}
    >
      <div
        className="bg-white rounded-4 shadow-lg p-4"
        style={{
          width: "100%",
          maxWidth: "500px"
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Add New SEO Task</h5>
          <button
            className="btn btn-sm btn-light"
            onClick={() => setShowModal(false)}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            SEO Task Type
          </label>
          <select className="form-select">
            <option>On-Page Optimization</option>
            <option>Keyword Research</option>
            <option>Backlink Building</option>
            <option>Technical SEO</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold">
            Description
          </label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Describe the task..."
          />
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-light"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button className="btn btn-primary">
            Create Task
          </button>
        </div>
      </div>
    </div>
  </>
)}
    </div>
  );
};

export default SEOPage;