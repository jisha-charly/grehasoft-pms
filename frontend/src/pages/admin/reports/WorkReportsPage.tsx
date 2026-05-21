import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import TrackingAPI from '../../../api/trackingAPI';
import { 
  BarChart2, 
  Calendar, 
  Clock, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Search, 
  TrendingUp, 
  Users, 
  UserCheck,
  AlertTriangle,
  RotateCw,
  TrendingDown,
  Layers,
  ArrowRight,
  Monitor,
  Eye,
  Coffee
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface User {
  id: number;
  name?: string;
  username: string;
  email: string;
  department_name?: string;
  department?: number;
}

interface Department {
  id: number;
  name: string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const WorkReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'employee'>('daily');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Master lists
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Common Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab-specific filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  // Data States
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any>({
    total_weekly_hours: '00:00:00',
    average_activity_percentage: 0.0,
    most_productive_day: '-',
    total_idle_time: '00:00:00',
    attendance_days: 0,
    app_usage_summary: [],
    daily_productivity_trend: [],
    weekly_work_hours: []
  });
  const [monthlyData, setMonthlyData] = useState<any>({
    total_monthly_work_hours: '00:00:00',
    total_productive_hours: '00:00:00',
    total_idle_hours: '00:00:00',
    attendance_summary: {
      total_sessions: 0,
      avg_sessions_per_day: 0.0,
      unique_days_worked: 0,
      active_employees_count: 0
    },
    employee_ranking: [],
    productivity_trends: []
  });
  const [employeeData, setEmployeeData] = useState<any>(null);
  
  // Pre-fetch masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          axiosInstance.get('/users'),
          axiosInstance.get('/departments')
        ]);
        
        const safeData = (res: any) =>
          Array.isArray(res?.data)
            ? res.data
            : res?.data?.results || res?.data?.data || [];
            
        const usersList = safeData(usersRes);
        setUsers(usersList);
        setDepartments(safeData(deptsRes));
        
        // Auto select first user
        if (usersList.length > 0) {
          setSelectedUser(usersList[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
      }
    };
    fetchMasters();
  }, []);

  // Fetch Report Data
  const fetchReportData = async () => {
    setLoading(true);
    const trackingAPI = new TrackingAPI();
    
    try {
      if (activeTab === 'daily') {
        const data = await trackingAPI.getDailyReport({
          start_date: startDate,
          end_date: endDate,
          department_id: selectedDept || undefined,
          search: searchQuery || undefined
        });
        setDailyData(data);
      } else if (activeTab === 'weekly') {
        const data = await trackingAPI.getWeeklyReport({
          start_date: startDate,
          end_date: endDate,
          department_id: selectedDept || undefined
        });
        setWeeklyData(data);
      } else if (activeTab === 'monthly') {
        const data = await trackingAPI.getMonthlyReport({
          year: selectedYear,
          month: selectedMonth,
          department_id: selectedDept || undefined
        });
        setMonthlyData(data);
      } else if (activeTab === 'employee') {
        if (!selectedUser) return;
        const data = await trackingAPI.getEmployeeAnalytics({
          user_id: parseInt(selectedUser),
          start_date: startDate,
          end_date: endDate
        });
        setEmployeeData(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate, selectedDept, selectedYear, selectedMonth, selectedUser]);

  // Auto refresh interval setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!loading) {
        fetchReportData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, startDate, endDate, selectedDept, selectedYear, selectedMonth, selectedUser, loading]);

  // Quick Date Setters
  const setQuickDates = (type: 'today' | 'yesterday' | 'week' | 'month') => {
    const today = new Date();
    if (type === 'today') {
      const dateStr = today.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (type === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (type === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  // Exporter Trigger
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setExporting(true);
      const trackingAPI = new TrackingAPI();
      
      const exportParams: any = {
        type: activeTab,
        format
      };
      
      if (activeTab === 'daily') {
        exportParams.start_date = startDate;
        exportParams.end_date = endDate;
        if (selectedDept) exportParams.department_id = selectedDept;
        if (searchQuery) exportParams.search = searchQuery;
      } else if (activeTab === 'weekly') {
        exportParams.start_date = startDate;
        exportParams.end_date = endDate;
        if (selectedDept) exportParams.department_id = selectedDept;
      } else if (activeTab === 'monthly') {
        exportParams.year = selectedYear;
        exportParams.month = selectedMonth;
        if (selectedDept) exportParams.department_id = selectedDept;
      } else if (activeTab === 'employee') {
        if (!selectedUser) return;
        exportParams.user_id = selectedUser;
        exportParams.start_date = startDate;
        exportParams.end_date = endDate;
      }
      
      const blob = await trackingAPI.exportReport(exportParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const ext = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      a.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.${ext}`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  // Summary Metrics calculations for widgets
  const getDailySummaryStats = () => {
    if (dailyData.length === 0) return { tracked: '0h', activePct: 0, activeCount: 0, idleCount: 0 };
    
    let totalTrackedSec = 0;
    let totalProdSec = 0;
    let activeEmployees = 0;
    let idleEmployees = 0;
    
    dailyData.forEach(item => {
      totalTrackedSec += item.raw_tracked_seconds || 0;
      totalProdSec += item.raw_productive_seconds || 0;
      if (item.status === 'Active') activeEmployees++;
      else if (item.status === 'Idle') idleEmployees++;
    });
    
    const avgActivityPct = totalTrackedSec > 0 ? (totalProdSec / totalTrackedSec) * 100 : 0;
    return {
      tracked: `${Math.round(totalTrackedSec / 3600)}h`,
      activePct: Math.round(avgActivityPct),
      activeCount: activeEmployees,
      idleCount: idleEmployees
    };
  };

  const dailySummaryStats = getDailySummaryStats();

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '90vh' }}>
      
      {/* Title Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-slate-800 d-flex align-items-center" style={{ color: '#1E293B' }}>
            <BarChart2 className="me-2 text-primary" size={28} /> Reports & Analytics
          </h2>
          <p className="text-muted mb-0">Monitor productive time, activity levels, app usage and breaks.</p>
        </div>
        
        {/* Export Buttons */}
        <div className="d-flex gap-2 mt-3 mt-md-0 align-items-center">
          <div className="form-check form-switch mb-0 me-2 bg-white px-3 py-2 rounded border shadow-sm d-flex align-items-center gap-2" style={{ height: '38px' }}>
            <input
              className="form-check-input cursor-pointer"
              type="checkbox"
              id="autoRefreshToggle"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label className="form-check-label fw-semibold text-secondary small cursor-pointer mb-0" htmlFor="autoRefreshToggle" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Auto Refresh {autoRefresh && <span className="badge bg-success ms-1" style={{ padding: '3px 6px', fontSize: '9px', verticalAlign: 'middle' }}>Live</span>}
            </label>
          </div>
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => fetchReportData()}
            disabled={loading}
          >
            <RotateCw size={16} className={loading ? 'spin-animation' : ''} /> Refresh
          </button>
          <div className="dropdown">
            <button 
              className="btn btn-primary dropdown-toggle d-flex align-items-center gap-2"
              type="button" 
              data-bs-toggle="dropdown"
              disabled={exporting}
            >
              <Download size={16} /> {exporting ? 'Exporting...' : 'Export Report'}
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm">
              <li>
                <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleExport('csv')}>
                  <FileText size={16} className="text-secondary" /> Export CSV
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleExport('excel')}>
                  <FileSpreadsheet size={16} className="text-success" /> Export Excel
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => handleExport('pdf')}>
                  <FileText size={16} className="text-danger" /> Export PDF
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-2 bg-white rounded-3">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <button 
                className={`nav-link py-3 fw-semibold ${activeTab === 'daily' ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => { setActiveTab('daily'); setQuickDates('today'); }}
              >
                Daily Summary
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link py-3 fw-semibold ${activeTab === 'weekly' ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => { setActiveTab('weekly'); setQuickDates('week'); }}
              >
                Weekly Trends
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link py-3 fw-semibold ${activeTab === 'monthly' ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab('monthly')}
              >
                Monthly Rankings
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link py-3 fw-semibold ${activeTab === 'employee' ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => { setActiveTab('employee'); setQuickDates('week'); }}
              >
                Employee Analytics
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body bg-white rounded-3">
          <div className="row g-3 align-items-end">
            
            {/* Conditional Date Pickers / Selectors */}
            {activeTab !== 'monthly' ? (
              <>
                <div className="col-12 col-md-3">
                  <label className="form-label text-secondary fw-semibold small">Start Date</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><Calendar size={16} className="text-muted" /></span>
                    <input 
                      type="date" 
                      className="form-control bg-light border-start-0 ps-0" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label text-secondary fw-semibold small">End Date</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><Calendar size={16} className="text-muted" /></span>
                    <input 
                      type="date" 
                      className="form-control bg-light border-start-0 ps-0" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-12 col-md-3">
                  <label className="form-label text-secondary fw-semibold small">Year</label>
                  <select 
                    className="form-select bg-light"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label text-secondary fw-semibold small">Month</label>
                  <select 
                    className="form-select bg-light"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Quick Date Presets (for Daily/Weekly/Employee) */}
            {activeTab !== 'monthly' && (
              <div className="col-12 col-md-3">
                <label className="form-label text-secondary fw-semibold small">Quick Range</label>
                <div className="d-flex gap-1">
                  <button type="button" className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => setQuickDates('today')}>Today</button>
                  <button type="button" className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => setQuickDates('yesterday')}>Yesterday</button>
                  <button type="button" className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => setQuickDates('week')}>Last 7d</button>
                </div>
              </div>
            )}

            {/* Department Filter (except for Employee tab) */}
            {activeTab !== 'employee' && (
              <div className="col-12 col-md-2">
                <label className="form-label text-secondary fw-semibold small">Department</label>
                <select 
                  className="form-select bg-light" 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee Selector (Only for Employee tab) */}
            {activeTab === 'employee' && (
              <div className="col-12 col-md-3">
                <label className="form-label text-secondary fw-semibold small">Employee</label>
                <select 
                  className="form-select bg-light"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.username}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Daily search filter */}
            {activeTab === 'daily' && (
              <div className="col-12 col-md-2">
                <label className="form-label text-secondary fw-semibold small">Search Employee</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><Search size={16} className="text-muted" /></span>
                  <input 
                    type="text" 
                    className="form-control bg-light border-start-0 ps-0" 
                    placeholder="Name/Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading report...</span>
          </div>
        </div>
      ) : (
        <>
          {/* DAILY TAB */}
          {activeTab === 'daily' && (
            <div>
              {/* Stats Widgets */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-body p-4 d-flex align-items-center">
                      <div className="p-3 bg-indigo-50 rounded-3 me-3" style={{ backgroundColor: '#EEF2F6', color: '#4F46E5' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Total Work Hours</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{dailySummaryStats.tracked}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-body p-4 d-flex align-items-center">
                      <div className="p-3 bg-emerald-50 rounded-3 me-3" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Avg. Productivity</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{dailySummaryStats.activePct}%</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-body p-4 d-flex align-items-center">
                      <div className="p-3 bg-blue-50 rounded-3 me-3" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                        <UserCheck size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Active Employees</h6>
                        <h3 className="fw-bold mb-0 text-success">{dailySummaryStats.activeCount} <span className="text-muted small fw-normal">online</span></h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-body p-4 d-flex align-items-center">
                      <div className="p-3 bg-amber-50 rounded-3 me-3" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Idle Employees</h6>
                        <h3 className="fw-bold mb-0 text-warning">{dailySummaryStats.idleCount} <span className="text-muted small fw-normal">idle</span></h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Daily Tracking Aggregations</h5>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px' }}>
                    <thead className="bg-light">
                      <tr className="text-secondary small fw-bold">
                        <th className="px-4 py-3">Employee</th>
                        <th className="py-3">Code / Dept</th>
                        <th className="py-3 text-center">First seen</th>
                        <th className="py-3 text-center">Last active</th>
                        <th className="py-3 text-center">Productive time</th>
                        <th className="py-3 text-center">Idle time</th>
                        <th className="py-3 text-center">Break count</th>
                        <th className="py-3 text-center">Activity %</th>
                        <th className="px-4 py-3 text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-5 text-muted">
                            No tracking records found for this criteria.
                          </td>
                        </tr>
                      ) : (
                        dailyData.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center">
                                <div className="avatar-circle me-3 bg-primary text-white d-flex justify-content-center align-items-center fw-bold" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>
                                  {item.full_name?.charAt(0).toUpperCase() || 'E'}
                                </div>
                                <div>
                                  <div className="fw-semibold text-slate-800" style={{ color: '#1E293B' }}>{item.full_name}</div>
                                  <div className="text-muted small">{item.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="fw-medium small" style={{ color: '#64748B' }}>{item.employee_code || '-'}</div>
                              <span className="badge rounded-pill bg-light text-secondary border">{item.department}</span>
                            </td>
                            <td className="py-3 text-center text-slate-600 font-monospace small">
                              {item.first_login ? new Date(item.first_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3 text-center text-slate-600 font-monospace small">
                              {item.last_active ? new Date(item.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3 text-center font-semibold text-success font-monospace">
                              {item.productive_time}
                            </td>
                            <td className="py-3 text-center font-monospace text-slate-500">
                              {item.idle_time}
                            </td>
                            <td className="py-3 text-center">
                              <span className="badge bg-light text-dark border rounded">{item.break_count}</span>
                            </td>
                            <td className="py-3 text-center">
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <span className={`fw-bold ${item.activity_percentage >= 70 ? 'text-success' : item.activity_percentage >= 40 ? 'text-warning' : 'text-danger'}`}>
                                  {item.activity_percentage}%
                                </span>
                                <div className="progress" style={{ width: '60px', height: '6px' }}>
                                  <div 
                                    className={`progress-bar ${item.activity_percentage >= 70 ? 'bg-success' : item.activity_percentage >= 40 ? 'bg-warning' : 'bg-danger'}`} 
                                    role="progressbar" 
                                    style={{ width: `${item.activity_percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-end">
                              <span className={`badge ${
                                item.status === 'Active' ? 'bg-success' : item.status === 'Idle' ? 'bg-warning text-dark' : 'bg-secondary'
                              } rounded-pill px-3 py-2 fw-medium`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* WEEKLY TRENDS TAB */}
          {activeTab === 'weekly' && (
            <div>
              {/* Stats Widgets */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm bg-white p-4">
                    <div className="d-flex align-items-center">
                      <div className="p-3 rounded-3 me-3" style={{ backgroundColor: '#EEF2F6', color: '#4F46E5' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Total Weekly Hours</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{weeklyData.total_weekly_hours}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm bg-white p-4">
                    <div className="d-flex align-items-center">
                      <div className="p-3 rounded-3 me-3" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Avg. Weekly Activity</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{weeklyData.average_activity_percentage}%</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm bg-white p-4">
                    <div className="d-flex align-items-center">
                      <div className="p-3 rounded-3 me-3" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                        <UserCheck size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Most Productive Day</h6>
                        <h4 className="fw-bold mb-0 text-slate-800" style={{ color: '#1E293B', fontSize: '1.15rem' }}>{weeklyData.most_productive_day}</h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="card border-0 shadow-sm bg-white p-4">
                    <div className="d-flex align-items-center">
                      <div className="p-3 rounded-3 me-3" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                        <Users size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Attendance Count</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{weeklyData.attendance_days} <span className="text-muted small fw-normal">days</span></h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="row g-4 mb-4">
                {/* 1. Daily Productivity Area Chart */}
                <div className="col-12 col-md-8">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Productivity vs Idle Trends</h5>
                    </div>
                    <div className="card-body">
                      {weeklyData.daily_productivity_trend?.length > 0 ? (
                        <div style={{ width: '100%', height: '300px' }}>
                          <ResponsiveContainer>
                            <ComposedChart data={weeklyData.daily_productivity_trend}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="date" tickLine={false} />
                              <YAxis tickLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="productive_hours" name="Productive Time (Hrs)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="idle_hours" name="Idle Time (Hrs)" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-5 text-muted">No data available for charts.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Top Apps Chart */}
                <div className="col-12 col-md-4">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-header bg-white py-3 border-0">
                      <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Top Apps (By Duration)</h5>
                    </div>
                    <div className="card-body">
                      {weeklyData.app_usage_summary?.length > 0 ? (
                        <div style={{ width: '100%', height: '240px' }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={weeklyData.app_usage_summary}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="duration_seconds"
                                nameKey="app_name"
                              >
                                {weeklyData.app_usage_summary.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => `${Math.round(Number(value || 0)/60)} mins`} />
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Pie legend */}
                          <div className="d-flex flex-wrap gap-2 justify-content-center small mt-2">
                            {weeklyData.app_usage_summary.slice(0, 4).map((entry: any, index: number) => (
                              <span key={index} className="d-flex align-items-center me-2">
                                <span className="badge p-1 rounded-circle me-1" style={{ backgroundColor: COLORS[index % COLORS.length], width: '8px', height: '8px', display: 'inline-block' }}></span>
                                {entry.app_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-5 text-muted">No app activities logged.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Apps List Table */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Weekly App Activity Summary</h5>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr className="text-secondary small fw-bold">
                        <th className="px-4 py-3">Application Name</th>
                        <th className="py-3">Category</th>
                        <th className="py-3 text-center">Total Time Spent</th>
                        <th className="px-4 py-3 text-end">Productivity Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.app_usage_summary?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">No app records.</td>
                        </tr>
                      ) : (
                        weeklyData.app_usage_summary?.map((app: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 fw-semibold" style={{ color: '#1E293B' }}>
                              {app.app_name}
                            </td>
                            <td className="py-3">
                              <span className="badge bg-light text-dark border">{app.category}</span>
                            </td>
                            <td className="py-3 text-center font-monospace font-semibold text-primary">
                              {app.duration_formatted}
                            </td>
                            <td className="px-4 py-3 text-end">
                              <span className={`badge ${app.is_productive ? 'bg-success' : 'bg-danger'} px-2 py-1`}>
                                {app.is_productive ? 'Productive' : 'Non-productive'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MONTHLY RANKINGS TAB */}
          {activeTab === 'monthly' && (
            <div>
              {/* Monthly Stats */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <div className="card border-0 shadow-sm bg-white p-4">
                    <div className="d-flex align-items-center">
                      <div className="p-3 rounded-3 me-3 text-primary" style={{ backgroundColor: '#EEF2F6' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Total Month Hours</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{monthlyData.total_monthly_work_hours}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="card border-0 shadow-sm bg-white p-4">
                    <div className="d-flex align-items-center">
                      <div className="p-3 rounded-3 me-3 text-success" style={{ backgroundColor: '#ECFDF5' }}>
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Productive Hours</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{monthlyData.total_productive_hours}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="card border-0 shadow-sm bg-white p-4">
                    <div className="d-flex align-items-center">
                      <div className="p-3 rounded-3 me-3 text-warning" style={{ backgroundColor: '#FFFBEB' }}>
                        <Coffee size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1 small uppercase fw-bold">Total Idle Hours</h6>
                        <h3 className="fw-bold mb-0" style={{ color: '#1E293B' }}>{monthlyData.total_idle_hours}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Month ranking chart */}
              <div className="card border-0 shadow-sm mb-4 bg-white">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Monthly Employee Productivity Ranking (Hrs)</h5>
                </div>
                <div className="card-body">
                  {monthlyData.employee_ranking?.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                      <ResponsiveContainer>
                        <ComposedChart data={monthlyData.employee_ranking.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="full_name" tickLine={false} />
                          <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="productive_hours" name="Productive Hours" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="tracked_hours" name="Total Hours Tracked" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">No monthly ranking data available.</div>
                  )}
                </div>
              </div>

              {/* Table Rankings */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Employee Productivity Rankings</h5>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr className="text-secondary small fw-bold">
                        <th className="px-4 py-3">Rank</th>
                        <th className="py-3">Employee</th>
                        <th className="py-3">Code / Dept</th>
                        <th className="py-3 text-center">Productive hours</th>
                        <th className="py-3 text-center">Total hours</th>
                        <th className="px-4 py-3 text-end">Avg. Activity %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.employee_ranking?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">No records this month.</td>
                        </tr>
                      ) : (
                        monthlyData.employee_ranking?.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 fw-bold text-slate-800" style={{ fontSize: '1.1rem' }}>
                              #{idx + 1}
                            </td>
                            <td className="py-3">
                              <div className="fw-semibold text-slate-800" style={{ color: '#1E293B' }}>{item.full_name}</div>
                              <div className="text-muted small">{item.employee_code}</div>
                            </td>
                            <td className="py-3">
                              <span className="badge rounded-pill bg-light text-secondary border">{item.department}</span>
                            </td>
                            <td className="py-3 text-center font-semibold text-success font-monospace">
                              {item.productive_hours} hrs
                            </td>
                            <td className="py-3 text-center font-semibold text-primary font-monospace">
                              {item.tracked_hours} hrs
                            </td>
                            <td className="px-4 py-3 text-end fw-bold text-primary">
                              {item.activity_percentage}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEE ANALYTICS TAB */}
          {activeTab === 'employee' && employeeData && (
            <div>
              {/* Employee Summary Card */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4 bg-white rounded-3">
                  <div className="row align-items-center">
                    <div className="col-12 col-md-6 d-flex align-items-center mb-3 mb-md-0">
                      <div className="avatar-circle bg-primary text-white d-flex justify-content-center align-items-center fw-bold me-3" style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '1.5rem' }}>
                        {employeeData.employee.full_name?.charAt(0).toUpperCase() || 'E'}
                      </div>
                      <div>
                        <h4 className="fw-bold mb-1 text-slate-800" style={{ color: '#1E293B' }}>{employeeData.employee.full_name}</h4>
                        <div className="text-muted d-flex align-items-center gap-2">
                          <span>{employeeData.employee.employee_code}</span>
                          <span className="badge bg-light text-secondary border">{employeeData.employee.department}</span>
                          <span>&bull;</span>
                          <span>{employeeData.employee.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-12 col-md-6 d-flex flex-wrap gap-3 justify-content-md-end">
                      <div className="p-3 bg-light rounded text-center" style={{ minWidth: '100px' }}>
                        <div className="text-muted small uppercase fw-semibold">Tracked</div>
                        <div className="fw-bold text-primary font-monospace">{employeeData.totals.total_tracked_time}</div>
                      </div>
                      <div className="p-3 bg-light rounded text-center" style={{ minWidth: '100px' }}>
                        <div className="text-muted small uppercase fw-semibold">Productive</div>
                        <div className="fw-bold text-success font-monospace">{employeeData.totals.productive_time}</div>
                      </div>
                      <div className="p-3 bg-light rounded text-center" style={{ minWidth: '100px' }}>
                        <div className="text-muted small uppercase fw-semibold">Idle</div>
                        <div className="fw-bold text-warning font-monospace">{employeeData.totals.idle_time}</div>
                      </div>
                      <div className="p-3 bg-light rounded text-center" style={{ minWidth: '100px' }}>
                        <div className="text-muted small uppercase fw-semibold">Activity</div>
                        <div className="fw-bold text-info font-monospace">{employeeData.totals.activity_percentage}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub tabs in employee report */}
              <div className="row g-4 mb-4">
                
                {/* Apps usage list */}
                <div className="col-12 col-md-7">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-header bg-white py-3 border-0">
                      <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Application Activity Breakdown</h5>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr className="text-secondary small fw-bold">
                            <th className="px-4 py-3">App Name</th>
                            <th className="py-3 text-center">Category</th>
                            <th className="py-3 text-center">Time Spent</th>
                            <th className="py-3 text-center">Keyboard / Mouse</th>
                            <th className="px-4 py-3 text-end">% Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeData.app_usage.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-muted">No app tracking records.</td>
                            </tr>
                          ) : (
                            employeeData.app_usage.slice(0, 10).map((app: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 fw-semibold text-slate-800" style={{ color: '#1E293B' }}>{app.app_name}</td>
                                <td className="py-3 text-center">
                                  <span className={`badge ${app.is_productive ? 'bg-success' : 'bg-danger'} px-2 py-1`}>
                                    {app.category}
                                  </span>
                                </td>
                                <td className="py-3 text-center font-monospace text-primary fw-medium">{app.total_time}</td>
                                <td className="py-3 text-center small text-muted font-monospace">
                                  K: {app.key_presses} / M: {app.mouse_moves}
                                </td>
                                <td className="px-4 py-3 text-end font-semibold text-slate-600">{app.percentage_of_total}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Breaks analysis list */}
                <div className="col-12 col-md-5">
                  <div className="card border-0 shadow-sm h-100 bg-white">
                    <div className="card-header bg-white py-3 border-0">
                      <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Breaks Timeline & Gap Analysis</h5>
                    </div>
                    <div className="card-body p-0">
                      <div className="p-3 bg-light border-bottom d-flex justify-content-between small text-muted fw-semibold">
                        <span>Total Breaks: {employeeData.totals.break_count}</span>
                        <span>Break Time: {employeeData.totals.total_break_time}</span>
                      </div>
                      
                      <div className="p-3" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {employeeData.breaks.length === 0 ? (
                          <div className="text-center py-5 text-muted small">No breaks or offline gaps detected.</div>
                        ) : (
                          <div className="timeline-activity">
                            {employeeData.breaks.map((brk: any, idx: number) => (
                              <div key={idx} className="d-flex mb-3 align-items-start gap-3">
                                <div className="p-2 rounded bg-light border text-warning d-flex align-items-center justify-content-center">
                                  <Coffee size={18} />
                                </div>
                                <div className="flex-grow-1 border-bottom pb-2">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-semibold text-slate-800" style={{ color: '#1E293B' }}>
                                      {brk.type === 'offline' ? 'Offline Break' : 'Idle Gap'}
                                    </span>
                                    <span className="badge bg-amber-50 text-warning border-amber-200 border rounded font-monospace small">{brk.duration}</span>
                                  </div>
                                  <div className="text-muted small mt-1">
                                    {new Date(brk.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &rarr; {new Date(brk.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Daily breakdown table */}
              <div className="card border-0 shadow-sm bg-white">
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Detailed Daily Tracking Timeline</h5>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr className="text-secondary small fw-bold">
                        <th className="px-4 py-3">Date</th>
                        <th className="py-3 text-center">First seen</th>
                        <th className="py-3 text-center">Last seen</th>
                        <th className="py-3 text-center">Tracked duration</th>
                        <th className="py-3 text-center">Productive duration</th>
                        <th className="py-3 text-center">Idle duration</th>
                        <th className="py-3 text-center">Breaks</th>
                        <th className="px-4 py-3 text-end">Productivity %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeData.daily_breakdown.map((day: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 fw-semibold text-slate-800" style={{ color: '#1E293B' }}>
                            {new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 text-center font-monospace small text-muted">
                            {new Date(day.first_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 text-center font-monospace small text-muted">
                            {new Date(day.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 text-center font-monospace text-slate-800 fw-medium">{day.total_tracked_time}</td>
                          <td className="py-3 text-center font-monospace text-success fw-semibold">{day.productive_time}</td>
                          <td className="py-3 text-center font-monospace text-slate-500">{day.idle_time}</td>
                          <td className="py-3 text-center text-slate-500">{day.break_count}</td>
                          <td className="px-4 py-3 text-end fw-bold text-primary">{day.activity_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkReportsPage;
