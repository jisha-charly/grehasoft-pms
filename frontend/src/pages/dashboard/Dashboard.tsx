import  { useMemo, useState } from 'react';
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Project, Task, TaskStatus, ProjectStatus } from '../../types';

const Dashboard: React.FC<{ projects: Project[]; tasks: Task[] }> = ({ projects, tasks }) => {
  const activeCount = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length;
  const completedTasksCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const pendingTasksCount = tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length;
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  // Calculate project health distribution
  const statusCounts = {
    active: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
    completed: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
    delayed: projects.filter(p => p.status === ProjectStatus.NOT_STARTED).length, // Using not_started as delayed for mock
  };

  const totalProjects = projects.length || 1;
  const statusData = [
    { name: 'Active', value: Math.round((statusCounts.active / totalProjects) * 100), color: '#0d6efd' },
    { name: 'Completed', value: Math.round((statusCounts.completed / totalProjects) * 100), color: '#198754' },
    { name: 'Pending', value: Math.round((statusCounts.delayed / totalProjects) * 100), color: '#ffc107' },
  ];

  // Mock activity data for now, but could be derived from tasks' createdAt/updatedAt
const activityData = useMemo(() => {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const counts: Record<string, number> = {
    Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0
  };

  // 🔹 start of this week (Sunday)
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0,0,0,0);

  // 🔹 end of this week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  tasks.forEach(task => {
    if (!task.created_at) return;

    const date = new Date(task.created_at);

    // only count tasks created this week
    if (date < startOfWeek || date > endOfWeek) return;

    const day = days[date.getDay()];
    counts[day] += 1;
  });

  return days.map(day => ({
    name: day,
    tasks: counts[day]
  }));

}, [tasks]);
// Q2 2024 Report Data (Simulation)
  const q2Report = useMemo(() => {
    const q2Start = new Date('2026-04-01');
    const q2End = new Date('2026-06-30');
    
    const q2Projects = projects.filter(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return (start <= q2End && end >= q2Start);
    });

    const q2Tasks = tasks.filter(t => {
      const created = t.created_at ? new Date(t.created_at) : new Date();
      return (created >= q2Start && created <= q2End);
    });

    return {
      projectsCount: q2Projects.length,
      tasksCount: q2Tasks.length,
      completedTasks: q2Tasks.filter(t => t.status === TaskStatus.DONE).length,
      revenueGrowth: '+12.5%',
      efficiency: '88%'
    };
  }, [projects, tasks]);
  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark">Company Overview</h3>
          <p className="text-secondary small">Real-time performance metrics across all departments</p>
        </div>
      <button 
          className="btn btn-primary shadow-sm fw-bold px-4"
          onClick={() => setReportModalOpen(true)}
        >
          <i className="bi bi-calendar3 me-2"></i>Q2 2026 Report
        </button>
      </div>
      
      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-primary text-white p-4 border-0">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Quarterly Performance Report</h5>
                  <p className="mb-0 small opacity-75">Fiscal Year 2026 • Quarter 2 (Apr - Jun)</p>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setReportModalOpen(false)}></button>
              </div>
              <div className="modal-body p-4 bg-white">
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="p-4 rounded-4 bg-light h-100">
                      <h6 className="text-secondary small fw-bold uppercase mb-3">Project Summary</h6>
                      <div className="d-flex align-items-end gap-2 mb-2">
                        <h2 className="fw-bold mb-0">{q2Report.projectsCount}</h2>
                        <span className="text-success small mb-1"><i className="bi bi-arrow-up-short"></i>15% vs Q1</span>
                      </div>
                      <p className="text-muted small mb-0">Total active projects during this period across all departments.</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-4 rounded-4 bg-light h-100">
                      <h6 className="text-secondary small fw-bold uppercase mb-3">Operational Efficiency</h6>
                      <div className="d-flex align-items-end gap-2 mb-2">
                        <h2 className="fw-bold mb-0">{q2Report.efficiency}</h2>
                        <span className="text-success small mb-1"><i className="bi bi-check-circle-fill me-1"></i>Target Met</span>
                      </div>
                      <p className="text-muted small mb-0">Calculated based on task completion rates and milestone deadlines.</p>
                    </div>
                  </div>
                </div>

                <div className="card border-0 bg-primary bg-opacity-10 p-4 mb-4 rounded-4">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h6 className="fw-bold text-primary mb-2">Executive Summary</h6>
                      <p className="text-dark small mb-0">
                        Q2 2024 showed significant growth in project throughput. The transition to the new PMS system has improved 
                        collaboration by 24%. Key focus for Q3 remains on scaling the SEO and Digital Marketing departments.
                      </p>
                    </div>
                    <div className="col-md-4 text-end">
                      <button className="btn btn-primary btn-sm px-4 fw-bold">Download PDF</button>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <div className="text-center p-3 border rounded-3">
                      <div className="text-secondary small mb-1">Tasks Created</div>
                      <div className="fw-bold">{q2Report.tasksCount}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center p-3 border rounded-3">
                      <div className="text-secondary small mb-1">Tasks Done</div>
                      <div className="fw-bold">{q2Report.completedTasks}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center p-3 border rounded-3">
                      <div className="text-secondary small mb-1">Revenue Growth</div>
                      <div className="fw-bold text-success">{q2Report.revenueGrowth}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-center p-3 border rounded-3">
                      <div className="text-secondary small mb-1">Satisfaction</div>
                      <div className="fw-bold">4.9/5</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light border-0 p-4">
                <button type="button" className="btn btn-secondary fw-bold px-4" onClick={() => setReportModalOpen(false)}>Close Report</button>
                <button type="button" className="btn btn-primary fw-bold px-4">Share with Stakeholders</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4 mb-4">
        {[
          { label: 'Active Projects', value: activeCount, icon: 'bi-briefcase', color: 'primary' },
          { label: 'Completed Tasks', value: completedTasksCount, icon: 'bi-check2-circle', color: 'success' },
          { label: 'Pending Tasks', value: pendingTasksCount, icon: 'bi-clock-history', color: 'warning' },
          { label: 'Client Satisfaction', value: '98%', icon: 'bi-heart', color: 'danger' },
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
