
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const activityData = [
  { name: 'Mon', tasks: 12 },
  { name: 'Tue', tasks: 19 },
  { name: 'Wed', tasks: 15 },
  { name: 'Thu', tasks: 22 },
  { name: 'Fri', tasks: 30 },
  { name: 'Sat', tasks: 8 },
  { name: 'Sun', tasks: 5 },
];

const statusData = [
  { name: 'Active', value: 70, color: '#0d6efd' },
  { name: 'Delayed', value: 20, color: '#dc3545' },
  { name: 'Pending', value: 10, color: '#ffc107' },
];

const Dashboard: React.FC<{ projects: any[] }> = ({ projects }) => {
  const activeCount = projects.filter(p => p.status === 'in_progress').length;
  
  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark">Company Overview</h3>
          <p className="text-secondary small">Real-time performance metrics across all departments</p>
        </div>
        <button className="btn btn-primary"><i className="bi bi-calendar3 me-2"></i>Q2 2024 Report</button>
      </div>

      <div className="row g-4 mb-4">
        {[
          { label: 'Active Projects', value: activeCount, icon: 'bi-briefcase', color: 'primary' },
          { label: 'Pending Approvals', value: '08', icon: 'bi-clock-history', color: 'warning' },
          { label: 'Client Satisfaction', value: '98%', icon: 'bi-heart', color: 'danger' },
          { label: 'Revenue Growth', value: '+14%', icon: 'bi-trending-up', color: 'success' },
        ].map((stat, i) => (
          <div className="col-md-3" key={i}>
            <div className="card p-4 h-100 border-0 shadow-sm">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className={`p-2 rounded-3 bg-${stat.color}-subtle text-${stat.color}`}>
                  <i className={`bi ${stat.icon} fs-4`}></i>
                </div>
                <span className="badge bg-light text-dark border fw-normal">Live</span>
              </div>
              <h3 className="fw-bold mb-1 text-dark">{stat.value}</h3>
              <p className="text-secondary small fw-bold mb-0 text-uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card p-4 h-100 border-0 shadow-sm">
            <h5 className="fw-bold mb-4 text-dark">Weekly Task Throughput</h5>
            <div className="h-100" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6c757d' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6c757d' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="tasks" stroke="#0d6efd" strokeWidth={4} dot={{ r: 6, fill: '#0d6efd', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card p-4 h-100 border-0 shadow-sm">
            <h5 className="fw-bold mb-4 text-dark">Project Health</h5>
            <div className="d-flex flex-column align-items-center">
              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-100 mt-3">
                {statusData.map((s, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-secondary"><i className="bi bi-circle-fill me-2" style={{ color: s.color, fontSize: '0.6rem' }}></i>{s.name}</span>
                    <span className="fw-bold small">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
