import React, { useEffect, useState, useCallback, useMemo } from 'react';
import TrackingAPI, { EmployeeStatus } from '../api/trackingAPI';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Code,
  Globe,
  Brush,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Terminal,
  Play,
  Pause,
  Clock,
  Search,
  RefreshCw,
  Filter,
  Users,
  UserCheck,
  UserMinus,
  UserX,
  ShieldAlert,
  X,
  Activity,
  ChevronRight,
  Monitor,
  MousePointer,
  Keyboard,
  Info,
  Calendar,
  ArrowRight,
  Loader2,
  Eye
} from 'lucide-react';

interface DashboardState {
  employees: EmployeeStatus[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

const getProgressBarColor = (pct: number) => {
  if (pct >= 70) return 'linear-gradient(90deg, #10b981 0%, #059669 100%)'; // Emerald gradient
  if (pct >= 40) return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'; // Amber gradient
  return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'; // Red/Rose gradient
};

// Map app names to Lucide icons with custom tailwind colors
const getAppIcon = (appName: string | null | undefined) => {
  if (!appName) return <Monitor className="w-4 h-4 text-slate-400" />;
  const name = appName.toLowerCase();
  if (name.includes('code') || name.includes('vs') || name.includes('cursor') || name.includes('pycharm') || name.includes('studio') || name.includes('intellij')) {
    return <Code className="w-4 h-4 text-indigo-500" />;
  }
  if (name.includes('chrome') || name.includes('firefox') || name.includes('safari') || name.includes('edge') || name.includes('browser') || name.includes('opera')) {
    return <Globe className="w-4 h-4 text-sky-500" />;
  }
  if (name.includes('figma') || name.includes('photoshop') || name.includes('illustrator') || name.includes('canvas') || name.includes('brush') || name.includes('design')) {
    return <Brush className="w-4 h-4 text-pink-500" />;
  }
  if (name.includes('slack') || name.includes('teams') || name.includes('discord') || name.includes('zoom') || name.includes('skype') || name.includes('chat')) {
    return <MessageSquare className="w-4 h-4 text-emerald-500" />;
  }
  if (name.includes('excel') || name.includes('sheet') || name.includes('csv') || name.includes('table')) {
    return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
  }
  if (name.includes('word') || name.includes('doc') || name.includes('note') || name.includes('pdf')) {
    return <FileText className="w-4 h-4 text-blue-500" />;
  }
  if (name.includes('terminal') || name.includes('cmd') || name.includes('powershell') || name.includes('bash') || name.includes('zsh')) {
    return <Terminal className="w-4 h-4 text-slate-800" />;
  }
  return <Monitor className="w-4 h-4 text-slate-500" />;
};

// Subcomponent to display real-time live-updating session duration
const ActiveDurationTimer: React.FC<{ loginTime: string | null; isOffline: boolean }> = ({ loginTime, isOffline }) => {
  const [durationStr, setDurationStr] = useState('00:00:00');

  useEffect(() => {
    if (isOffline || !loginTime) {
      setDurationStr('—');
      return;
    }

    const calculate = () => {
      const start = new Date(loginTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const seconds = Math.floor(diff / 1000);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;

      setDurationStr(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [loginTime, isOffline]);

  return (
    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
      {durationStr}
    </span>
  );
};

// Live heartbeat badge showing real-time updates and last seen status
const LiveStatusBadge: React.FC<{ emp: EmployeeStatus }> = ({ emp }) => {
  const isOffline = emp.status === 'Offline';
  const isIdle = emp.status === 'Idle';
  const isPaused = !emp.is_tracking_enabled;
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (isOffline || isPaused || !emp.last_ping) {
      setSecondsAgo(null);
      return;
    }

    const update = () => {
      const pingTime = new Date(emp.last_ping!).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - pingTime) / 1000));
      setSecondsAgo(diff);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [emp.last_ping, isOffline, isPaused]);

  const statusIndicator = useMemo(() => {
    if (isPaused) return <span className="pulse-indicator-paused me-2" />;
    if (isOffline) return <span className="pulse-indicator-offline me-2" />;
    if (isIdle) return <span className="pulse-indicator-idle me-2" style={{ animation: 'pulse-yellow 1.4s infinite' }} />;
    return <span className="pulse-indicator-active me-2 glowing-heartbeat" />;
  }, [isOffline, isIdle, isPaused]);

  if (isPaused) {
    return (
      <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-pill d-inline-flex align-items-center">
        {statusIndicator} Paused
      </span>
    );
  }
  if (isOffline) {
    return (
      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2.5 py-1 rounded-pill d-inline-flex align-items-center">
        {statusIndicator} Offline
      </span>
    );
  }
  if (isIdle) {
    const tooltipText = secondsAgo !== null 
      ? `Last heartbeat received ${secondsAgo}s ago` 
      : 'Idle status active';
    return (
      <span 
        className="badge bg-warning-subtle text-warning border border-warning-subtle px-2.5 py-1 rounded-pill d-inline-flex align-items-center"
        title={tooltipText}
        style={{ cursor: 'help' }}
      >
        {statusIndicator} Idle
      </span>
    );
  }

  const tooltipText = secondsAgo !== null 
    ? `Last heartbeat received ${secondsAgo}s ago` 
    : 'Live heartbeat active';

  return (
    <span 
      className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill d-inline-flex align-items-center live-badge-hover position-relative"
      title={tooltipText}
      style={{ cursor: 'help' }}
    >
      {statusIndicator} Active
      <span className="ms-1.5 badge bg-success text-white py-0 px-1 rounded small-live-tag pulse-glowing">LIVE</span>
    </span>
  );
};

// Premium color-coded application indicator pills
const AppPill: React.FC<{ appName: string | null | undefined; isIdle: boolean; isOffline: boolean }> = ({ appName, isIdle, isOffline }) => {
  const styles = useMemo(() => {
    if (isOffline || !appName) {
      if (isOffline) {
        return {
          bg: '#f8fafc',
          border: '#e2e8f0',
          text: '#64748b',
          label: 'Tracker Disconnected'
        };
      }
      return {
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#d97706',
        label: 'Idle'
      };
    }

    const name = appName.toLowerCase();
    if (name.includes('code') || name.includes('vs') || name.includes('cursor') || name.includes('pycharm') || name.includes('studio') || name.includes('intellij')) {
      return {
        bg: '#eff6ff',
        border: '#bfdbfe',
        text: '#2563eb',
        label: appName
      };
    }
    if (name.includes('chrome') || name.includes('firefox') || name.includes('safari') || name.includes('edge') || name.includes('browser') || name.includes('opera')) {
      return {
        bg: '#fef9c3',
        border: '#fde047',
        text: '#a16207',
        label: appName
      };
    }
    if (name.includes('figma') || name.includes('photoshop') || name.includes('illustrator') || name.includes('canvas') || name.includes('brush') || name.includes('design')) {
      return {
        bg: '#faf5ff',
        border: '#e9d5ff',
        text: '#7c3aed',
        label: appName
      };
    }
    if (name.includes('youtube') || name.includes('media') || name.includes('video') || name.includes('netflix') || name.includes('spotify')) {
      return {
        bg: '#fef2f2',
        border: '#fecaca',
        text: '#dc2626',
        label: appName
      };
    }
    if (name.includes('terminal') || name.includes('cmd') || name.includes('powershell') || name.includes('bash') || name.includes('zsh')) {
      return {
        bg: '#f1f5f9',
        border: '#cbd5e1',
        text: '#1e293b',
        label: appName
      };
    }
    
    return {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      text: '#16a34a',
      label: appName
    };
  }, [appName, isIdle, isOffline]);

  return (
    <span 
      className="badge px-2.5 py-1.5 rounded d-inline-flex align-items-center gap-1.5 fw-bold"
      style={{
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.text,
        fontSize: '0.8rem'
      }}
    >
      {getAppIcon(isOffline || !appName ? null : appName)}
      <span>{styles.label}</span>
    </span>
  );
};

// Premium subcomponent inside Employee Sliding Drawer showing ticking session stats
const DrawerSessionDetails: React.FC<{ emp: EmployeeStatus }> = ({ emp }) => {
  const isOffline = emp.status === 'Offline';
  const [durationStr, setDurationStr] = useState('00:00:00');
  const [heartbeatStr, setHeartbeatStr] = useState('—');

  useEffect(() => {
    if (isOffline || !emp.login_time) {
      setDurationStr('—');
      return;
    }

    const calculate = () => {
      const start = new Date(emp.login_time!).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const seconds = Math.floor(diff / 1000);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;

      setDurationStr(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [emp.login_time, isOffline]);

  useEffect(() => {
    if (isOffline || !emp.last_ping) {
      setHeartbeatStr('—');
      return;
    }

    const update = () => {
      const pingTime = new Date(emp.last_ping!).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - pingTime) / 1000));
      
      if (diff < 5) {
        setHeartbeatStr('Just now (active)');
      } else if (diff < 60) {
        setHeartbeatStr(`${diff}s ago`);
      } else {
        const mins = Math.floor(diff / 60);
        setHeartbeatStr(`${mins}m ago`);
      }
    };

    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [emp.last_ping, isOffline]);

  return (
    <div className="card glass-card p-3 mb-4 border-slate-200">
      <h6 className="fw-bold mb-2.5 text-slate-700 d-flex align-items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Current Session Metrics
      </h6>
      <div className="row g-2">
        <div className="col-6 border-end">
          <div className="mb-2">
            <span className="text-slate-400 text-xxs d-block font-bold">SESSION START</span>
            <span className="fw-bold text-slate-700 text-xs">
              {emp.login_time ? new Date(emp.login_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-xxs d-block font-bold">TRACKED DURATION</span>
            <span className="font-mono fw-bold text-indigo-600 text-sm bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded d-inline-block mt-1">
              {durationStr}
            </span>
          </div>
        </div>
        <div className="col-6 ps-3">
          <div className="mb-2">
            <span className="text-slate-400 text-xxs d-block font-bold">LAST HEARTBEAT</span>
            <span className="fw-bold text-slate-700 text-xs d-flex align-items-center gap-1 mt-1">
              {!isOffline && <span className="pulse-indicator-active" style={{ width: '7px', height: '7px', animationDuration: '1.2s' }} />}
              {heartbeatStr}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-xxs d-block font-bold">LAST ACTIVE FOCUS</span>
            <span className="fw-bold text-slate-600 text-xs d-block text-truncate mt-1" style={{ maxWidth: '180px' }} title={emp.current_window || 'No focus window'}>
              {emp.current_window || 'Idle / Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Most Used Applications Widget for Detail Drawer
const MostUsedAppsWidget: React.FC<{ activities: any[] }> = ({ activities }) => {
  const appStats = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    
    // Group durations by app name
    const groups: { [key: string]: number } = {};
    let totalSec = 0;
    
    activities.forEach((act) => {
      const name = act.app_name || 'Idle';
      const duration = Number(act.duration_seconds) || 0;
      groups[name] = (groups[name] || 0) + duration;
      totalSec += duration;
    });
    
    if (totalSec === 0) totalSec = 1;
    
    return Object.entries(groups)
      .map(([name, sec]) => ({
        name,
        seconds: sec,
        percentage: Math.round((sec / totalSec) * 100)
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5); // top 5
  }, [activities]);

  const formatSec = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getAppProgressColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('code') || lowerName.includes('vs') || lowerName.includes('cursor')) return '#2563eb'; // blue
    if (lowerName.includes('chrome') || lowerName.includes('firefox')) return '#eab308'; // yellow
    if (lowerName.includes('figma') || lowerName.includes('photoshop')) return '#a855f7'; // purple
    if (lowerName.includes('youtube')) return '#ef4444'; // red
    if (lowerName.includes('terminal') || lowerName.includes('cmd')) return '#1e293b'; // dark gray
    return '#10b981'; // green for other productive apps
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-3 text-slate-400 text-xs">
        No application usage statistics available yet.
      </div>
    );
  }

  return (
    <div className="card border bg-slate-50 p-3 mb-4" style={{ borderRadius: '10px' }}>
      <h6 className="fw-bold text-slate-700 mb-3" style={{ fontSize: '0.85rem' }}>
        Most Used Applications
      </h6>
      <div className="d-flex flex-column gap-3">
        {appStats.map((app) => (
          <div key={app.name}>
            <div className="d-flex align-items-center justify-content-between mb-1 text-xs">
              <div className="d-flex align-items-center gap-1.5 fw-bold text-slate-700">
                {getAppIcon(app.name)}
                <span className="text-truncate" style={{ maxWidth: '160px' }}>{app.name}</span>
              </div>
              <div className="fw-bold text-slate-500">
                {formatSec(app.seconds)} <span className="text-slate-400 text-xxs font-normal">({app.percentage}%)</span>
              </div>
            </div>
            <div className="progress" style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${app.percentage}%`,
                  backgroundColor: getAppProgressColor(app.name),
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }}
                aria-valuenow={app.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Table row component for employee status
const EmployeeRow: React.FC<{
  emp: EmployeeStatus;
  onToggleTracking: (userId: number, currentEnabled: boolean) => void;
  onViewDetails: (userId: number) => void;
  onForceSync: () => void;
}> = ({ emp, onToggleTracking, onViewDetails, onForceSync }) => {
  const isOffline = emp.status === 'Offline';
  const isIdle = emp.status === 'Idle';
  const isPaused = !emp.is_tracking_enabled;

  const productiveTime = emp.productive_time || emp.productiveTime || emp.total_work_time || '00:00:00';
  const idleTime = emp.idle_time || emp.idleTime || '00:00:00';

  const rowClass = useMemo(() => {
    if (isPaused) return 'premium-table-row row-offline';
    if (isOffline) return 'premium-table-row row-offline';
    if (isIdle) return 'premium-table-row row-idle';
    return 'premium-table-row row-active';
  }, [isOffline, isIdle, isPaused]);

  const initials = useMemo(() => {
    if (emp.full_name && emp.full_name.trim()) {
      const parts = emp.full_name.trim().split(/\s+/);
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return emp.email.substring(0, 2).toUpperCase();
  }, [emp.full_name, emp.email]);

  const avatarColor = useMemo(() => {
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];
    return colors[emp.user_id % colors.length];
  }, [emp.user_id]);

  return (
    <tr className={rowClass}>
      <td className="px-4 py-2">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold me-3 shadow-sm"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: avatarColor,
              fontSize: '0.8rem',
              flexShrink: 0
            }}
          >
            {initials}
          </div>
          <div>
            <div className="fw-bold text-slate-800 mb-0.5" style={{ fontSize: '0.85rem' }}>
              {emp.full_name || emp.email}
            </div>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.7rem' }}>
              <span className="badge bg-slate-100 text-slate-600 border px-1.5 py-0.5 rounded fw-medium">
                {emp.employee_code || `GS-26-${String(emp.user_id).padStart(3, '0')}`}
              </span>
              <span className="text-slate-400">{emp.email}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="py-2">
        <LiveStatusBadge emp={emp} />
      </td>
      <td className="py-2">
        <div className="fw-bold text-emerald-600" style={{ fontSize: '0.85rem' }}>
          {productiveTime}
        </div>
      </td>
      <td className="py-2">
        <div className="fw-semibold text-slate-500" style={{ fontSize: '0.85rem' }}>
          {idleTime}
        </div>
      </td>
      <td className="py-2">
        <AppPill appName={emp.current_app} isIdle={isIdle} isOffline={isOffline} />
      </td>
      <td className="py-2">
        {emp.login_time && emp.current_window ? (
          <div className="text-slate-500 text-xs text-truncate d-block" style={{ maxWidth: '160px' }} title={emp.current_window}>
            {emp.current_window}
          </div>
        ) : (
          <span className="text-slate-400 small">—</span>
        )}
      </td>
      <td className="py-2">
        {emp.login_time ? (
          <div className="d-flex flex-column gap-0.5">
            <span className="text-xxs text-slate-500 fw-medium">
              Start: {new Date(emp.login_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
            <ActiveDurationTimer loginTime={emp.login_time} isOffline={isOffline} />
          </div>
        ) : (
          <span className="text-slate-400 small">—</span>
        )}
      </td>
      <td className="py-2">
        {emp.login_time ? (
          <div style={{ width: '100px' }}>
            <div className="d-flex align-items-center justify-content-between mb-0.5" style={{ fontSize: '0.7rem' }}>
              <span className="fw-semibold text-slate-600">{(emp.activity_percentage ?? 0)}%</span>
            </div>
            <div className="progress" style={{ height: '5px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${(emp.activity_percentage ?? 0)}%`,
                  background: getProgressBarColor(emp.activity_percentage ?? 0),
                  borderRadius: '3px',
                  transition: 'width 0.6s ease'
                }}
                aria-valuenow={emp.activity_percentage ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        ) : (
          <span className="text-slate-400 small">—</span>
        )}
      </td>
      <td className="py-2 text-end px-4">
        <div className="d-flex gap-2 justify-content-end align-items-center">
          <button
            className="btn btn-outline-slate btn-action"
            title="View Real-Time Drawer"
            onClick={() => onViewDetails(emp.user_id)}
            style={{ width: '28px', height: '28px' }}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              checked={emp.is_tracking_enabled}
              onChange={() => onToggleTracking(emp.user_id, emp.is_tracking_enabled)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
      </td>
    </tr>
  );
};

const WorkTrackingDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    employees: [],
    loading: true,
    error: null,
    refreshing: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDepartment, setFilterDepartment] = useState<string>('All');
  const [filterApp, setFilterApp] = useState<string>('All');
  const [filterActivity, setFilterActivity] = useState<string>('All');
  const [filterTracking, setFilterTracking] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'work_time'>('status');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Drawer status state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [drawerData, setDrawerData] = useState<EmployeeStatus | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats'>('timeline');

  const selectedUserIdRef = React.useRef(selectedUserId);
  
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const api = useMemo(() => new TrackingAPI(), []);

  // Fetch all employees status
  const fetchEmployees = async (isInitial = false) => {
    if (isInitial) {
      setState((prev) => ({ ...prev, loading: true }));
    } else {
      setState((prev) => ({ ...prev, refreshing: true }));
    }
    try {
      const data = await api.getEmployeeStatus();
      console.log("TRACKING API RESPONSE", data);
      const employees = Array.isArray(data) ? data : [data];
      setState((prev) => ({ ...prev, employees, error: null, refreshing: false, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        refreshing: false,
        loading: false,
      }));
    }
  };

  // Fetch detailed drawer data for selected employee
  const fetchDrawerDetails = async (userId: number) => {
    setDrawerLoading(true);
    try {
      const details = await api.getEmployeeStatus(userId);
      console.log("TRACKING DETAILED API RESPONSE", details);
      setDrawerData(Array.isArray(details) ? details[0] : details);
      setDrawerLoading(false);
    } catch (err) {
      console.error('Failed to fetch detailed employee metrics:', err);
      setDrawerLoading(false);
    }
  };

  // Trigger drawer fetch when user is selected
  useEffect(() => {
    if (selectedUserId !== null) {
      fetchDrawerDetails(selectedUserId);
    } else {
      setDrawerData(null);
    }
  }, [selectedUserId]);

  // Initial load
  useEffect(() => {
    fetchEmployees(true);
  }, []);

  // 5 seconds real-time polling interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchEmployees();
      const currentSelectedId = selectedUserIdRef.current;
      if (currentSelectedId !== null) {
        fetchDrawerDetails(currentSelectedId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Toggle tracking with Optimistic UI updates
  const handleToggleTracking = async (userId: number, currentEnabled: boolean) => {
    // Keep local backup for rolling back
    const previousEmployees = state.employees;

    // Optimistic state update
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((emp) =>
        emp.user_id === userId ? { ...emp, is_tracking_enabled: !currentEnabled } : emp
      )
    }));

    try {
      await api.toggleTracking(userId, !currentEnabled);
    } catch (error) {
      console.error('Failed to toggle tracking on server, reverting...', error);
      setState((prev) => ({
        ...prev,
        employees: previousEmployees,
        error: 'Failed to update tracking toggle. Local state reverted.'
      }));
    }
  };

  // Formulating available filter options dynamically
  const uniqueApps = (() => {
    const apps = new Set<string>();
    state.employees.forEach((e) => {
      if (e.current_app) apps.add(e.current_app);
    });
    return Array.from(apps);
  })();

  // Handle manual force sync
  const handleForceSync = () => {
    fetchEmployees();
    if (selectedUserId !== null) {
      fetchDrawerDetails(selectedUserId);
    }
  };

  // Filter and sort core processing
  const processedEmployees = state.employees
    .filter((emp) => {
      const empName = emp.full_name || `${emp.first_name} ${emp.last_name}`.trim() || emp.email;
      const matchesSearch =
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.current_app || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.current_window || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'All' || emp.status === filterStatus;

      // Dynamic checks for additional filters
      const matchesApp = filterApp === 'All' || emp.current_app === filterApp;

      let matchesActivity = true;
      if (filterActivity !== 'All') {
        const act = emp.activity_percentage ?? 0;
        if (filterActivity === 'high') matchesActivity = act >= 70;
        else if (filterActivity === 'mid') matchesActivity = act >= 40 && act < 70;
        else if (filterActivity === 'low') matchesActivity = act < 40;
      }

      const matchesTracking =
        filterTracking === 'All' ||
        (filterTracking === 'enabled' && emp.is_tracking_enabled) ||
        (filterTracking === 'disabled' && !emp.is_tracking_enabled);

      return matchesSearch && matchesStatus && matchesApp && matchesActivity && matchesTracking;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': {
          const nameA = a.full_name || `${a.first_name} ${a.last_name}`.trim() || a.email;
          const nameB = b.full_name || `${b.first_name} ${b.last_name}`.trim() || b.email;
          return nameA.localeCompare(nameB);
        }
        case 'status': {
          const statusOrder = { Active: 0, Idle: 1, Offline: 2 };
          return (
            (statusOrder[a.status as keyof typeof statusOrder] ?? 3) -
            (statusOrder[b.status as keyof typeof statusOrder] ?? 3)
          );
        }
        case 'work_time': {
          const workTimeA = a.productive_time || a.productiveTime || a.total_work_time || '';
          const workTimeB = b.productive_time || b.productiveTime || b.total_work_time || '';
          return workTimeB.localeCompare(workTimeA);
        }
        default:
          return 0;
      }
    });

  // Operational metrics for summary cards
  const stats = (() => {
    const total = state.employees.length;
    const active = state.employees.filter((emp) => emp.status === 'Active' && emp.is_tracking_enabled).length;
    const idle = state.employees.filter((emp) => emp.status === 'Idle' && emp.is_tracking_enabled).length;
    const offline = state.employees.filter((emp) => emp.status === 'Offline' && emp.is_tracking_enabled).length;
    const disabled = state.employees.filter((emp) => !emp.is_tracking_enabled).length;

    return {
      total,
      active,
      idle,
      offline,
      disabled,
    };
  })();

  // Find active employee for live debug overlay
  const debugEmployee = state.employees.find((emp) => emp.is_tracking_enabled && emp.status !== 'Offline') 
    || state.employees[0];

  return (
    <div className="live-dashboard-container p-4">

      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes pulse-yellow {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes pulse-red {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes heartbeat {
          0% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.95; }
        }
        .pulse-indicator-active {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #10b981;
          animation: pulse-green 1.8s infinite;
        }
        .pulse-indicator-idle {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #f59e0b;
          animation: pulse-yellow 1.8s infinite;
        }
        .pulse-indicator-paused {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #ef4444;
          animation: pulse-red 1.8s infinite;
        }
        .pulse-indicator-offline {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: #64748b;
        }
        .glowing-heartbeat {
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
        }
        .pulse-glowing {
          animation: heartbeat 1.4s infinite ease-in-out;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }
        .live-badge-hover:hover {
          background-color: #d1fae5 !important;
          border-color: #10b981 !important;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          border-radius: 14px !important;
          box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 4px 6px -4px rgba(15, 23, 42, 0.04) !important;
        }
        .table-responsive {
          max-height: calc(100vh - 280px);
          overflow-y: auto;
        }
        table thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #f8fafc !important;
          box-shadow: inset 0 -1px 0 #e2e8f0;
        }
        .premium-table-row {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 1px solid #f1f5f9;
        }
        .premium-table-row:hover {
          background-color: rgba(248, 250, 252, 0.8) !important;
        }
        .premium-table-row.row-active {
          border-left: 3px solid #10b981;
        }
        .premium-table-row.row-idle {
          border-left: 3px solid #f59e0b;
        }
        .premium-table-row.row-offline {
          border-left: 3px solid #94a3b8;
        }
        .small-live-tag {
          font-size: 0.6rem !important;
          letter-spacing: 0.8px;
          padding: 1px 4px !important;
          font-weight: 800;
        }
        .text-xxs {
          font-size: 0.65rem !important;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .btn-action {
          width: 32px;
          height: 32px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          transition: all 0.15s ease;
        }
        .btn-action:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1040;
        }
        .drawer-sheet {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 480px;
          background: white;
          box-shadow: -10px 0 30px rgba(15, 23, 42, 0.15);
          z-index: 1050;
          display: flex;
          flex-direction: column;
          border-left: 1px solid #e2e8f0;
        }
        .drawer-header {
          padding: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
        }
        .timeline-stepper {
          border-left: 2px solid #e2e8f0;
          margin-left: 10px;
          padding-left: 20px;
        }
        .timeline-step {
          position: relative;
          padding-bottom: 1.25rem;
        }
        .timeline-step-icon {
          position: absolute;
          left: -28px;
          top: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          border: 2px solid #6366f1;
        }
        .timeline-time-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>

      {/* TOP HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center gap-2.5">
            <span className="pulse-indicator-active" style={{ width: '11px', height: '11px' }} />
            <h2 className="fw-bold mb-0 text-slate-800" style={{ letterSpacing: '-0.5px' }}>
              Grehasoft LIVE Monitor
            </h2>
            <span className="badge bg-success text-white py-1 px-2.5 rounded-pill shadow-xs border border-success-subtle font-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              LIVE COMMAND CENTER
            </span>
          </div>
          <p className="text-secondary small mb-0 mt-1">
            Real-time workforce activities, screen monitoring, and operational statistics
          </p>
        </div>

        <div className="d-flex gap-3 align-items-center">
          <div className="form-check form-switch mb-0 bg-white border px-3 py-1.5 rounded shadow-xs d-flex align-items-center gap-2">
            <input
              className="form-check-input ms-0 cursor-pointer"
              type="checkbox"
              id="autoRefreshSwitch"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <label className="form-check-label small font-bold text-slate-700 cursor-pointer mb-0" htmlFor="autoRefreshSwitch">
              5s LIVE POLLING
            </label>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm font-bold px-3 py-2"
            onClick={handleForceSync}
            disabled={state.refreshing}
            style={{ borderRadius: '10px' }}
          >
            {state.refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync
          </button>
        </div>
      </div>

      {state.error && (
        <div className="alert alert-danger py-2.5 px-4 shadow-sm mb-4 border border-danger-subtle d-flex align-items-center gap-2" role="alert" style={{ borderRadius: '10px' }}>
          <ShieldAlert className="w-4 h-4 text-danger" />
          <span className="small text-danger fw-semibold">{state.error}</span>
        </div>
      )}

      {/* SUMMARY OPERATIONAL CARDS */}
      <div className="row g-3.5 mb-4">
        {/* Total Card */}
        <div className="col-12 col-sm-6 col-xl-2.4 col-md-4 col-lg-3">
          <div className="card glass-card p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-slate-400 text-xxs uppercase">Total Workforce</div>
                <div className="fs-3 fw-black text-slate-800 mt-1">{stats.total}</div>
              </div>
              <div className="rounded-3 p-2.5 bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Card */}
        <div className="col-12 col-sm-6 col-xl-2.4 col-md-4 col-lg-3">
          <div className="card glass-card p-3 h-100 border-success-subtle">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-slate-400 text-xxs uppercase d-flex align-items-center gap-1.5">
                  <span className="pulse-indicator-active" /> Active Now
                </div>
                <div className="fs-3 fw-black text-slate-800 mt-1">{stats.active}</div>
              </div>
              <div className="rounded-3 p-2.5 bg-emerald-50 text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Idle Card */}
        <div className="col-12 col-sm-6 col-xl-2.4 col-md-4 col-lg-3">
          <div className="card glass-card p-3 h-100 border-warning-subtle">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-slate-400 text-xxs uppercase d-flex align-items-center gap-1.5">
                  <span className="pulse-indicator-idle" /> Idle / Inactive
                </div>
                <div className="fs-3 fw-black text-slate-800 mt-1">{stats.idle}</div>
              </div>
              <div className="rounded-3 p-2.5 bg-amber-50 text-amber-600">
                <UserMinus className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Offline Card */}
        <div className="col-12 col-sm-6 col-xl-2.4 col-md-4 col-lg-3">
          <div className="card glass-card p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-slate-400 text-xxs uppercase d-flex align-items-center gap-1.5">
                  <span className="pulse-indicator-offline" /> Offline Staff
                </div>
                <div className="fs-3 fw-black text-slate-800 mt-1">{stats.offline}</div>
              </div>
              <div className="rounded-3 p-2.5 bg-slate-50 text-slate-600">
                <UserX className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Disabled Card */}
        <div className="col-12 col-sm-6 col-xl-2.4 col-md-4 col-lg-3">
          <div className="card glass-card p-3 h-100 border-danger-subtle">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-slate-400 text-xxs uppercase d-flex align-items-center gap-1.5">
                  <span className="pulse-indicator-paused" /> Tracking Paused
                </div>
                <div className="fs-3 fw-black text-slate-800 mt-1">{stats.disabled}</div>
              </div>
              <div className="rounded-3 p-2.5 bg-red-50 text-red-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CURRENTLY WORKING ON PANEL */}
      <div className="card glass-card p-3 mb-4 border-indigo-subtle" style={{ borderLeft: '4px solid #6366f1' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="pulse-indicator-active" style={{ width: '8px', height: '8px' }} />
            <h6 className="fw-bold mb-0 text-slate-800" style={{ fontSize: '0.9rem' }}>
              Currently Working On
            </h6>
            <span className="badge bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-pill text-xxs font-bold px-2 py-0.5">
              {state.employees.filter(e => e.status !== 'Offline' && e.login_time).length} ONLINE
            </span>
          </div>
          <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider">REAL-TIME MONITOR</span>
        </div>

        {state.employees.filter(e => e.status !== 'Offline' && e.login_time).length === 0 ? (
          <div className="text-center py-3 text-slate-400 text-xs fw-semibold">
            All personnel are currently offline. No active sessions detected.
          </div>
        ) : (
          <div className="row g-3">
            {state.employees
              .filter(e => e.status !== 'Offline' && e.login_time)
              .map(emp => {
                const isIdle = emp.status === 'Idle';
                const avatarColor = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'][emp.user_id % 7];
                const initials = emp.full_name
                  ? emp.full_name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()
                  : emp.email.substring(0, 2).toUpperCase();

                return (
                  <div key={emp.user_id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div className="bg-white border rounded p-2.5 d-flex align-items-start gap-2.5 shadow-xs hover-shadow-sm transition-all" style={{ minHeight: '90px' }}>
                      <div
                        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs position-relative"
                        style={{
                          width: '34px',
                          height: '34px',
                          backgroundColor: avatarColor,
                          fontSize: '0.75rem',
                          flexShrink: 0
                        }}
                      >
                        {initials}
                        <span 
                          className={`position-absolute bottom-0 end-0 border border-white rounded-circle ${isIdle ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: '9px', height: '9px', transform: 'translate(2px, 2px)' }}
                        />
                      </div>
                      
                      <div className="overflow-hidden flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                          <span className="fw-bold text-slate-800 text-truncate text-xs" style={{ maxWidth: '120px' }}>
                            {emp.full_name || emp.email}
                          </span>
                          <ActiveDurationTimer loginTime={emp.login_time} isOffline={false} />
                        </div>
                        
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          <AppPill appName={emp.current_app} isIdle={isIdle} isOffline={false} />
                        </div>
                        
                        <div className="text-slate-500 text-truncate text-xxs" title={emp.current_window || 'No active app'}>
                          {emp.current_window || 'System Idle'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* SEARCH AND ADVANCED FILTERS PANEL */}
      <div className="card glass-card p-3.5 mb-4">
        <div className="row g-3">
          {/* Debounced Search */}
          <div className="col-lg-3 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                className="form-control form-control-sm border-start-0 ps-0"
                placeholder="Search staff, active app or window..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-lg-2 col-md-6">
            <div className="d-flex align-items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Now</option>
                <option value="Idle">Idle Only</option>
                <option value="Offline">Offline Only</option>
              </select>
            </div>
          </div>

          {/* Active App Filter */}
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select form-select-sm"
              value={filterApp}
              onChange={(e) => setFilterApp(e.target.value)}
              style={{ borderRadius: '8px' }}
            >
              <option value="All">All Apps</option>
              {uniqueApps.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Level Filter */}
          <div className="col-lg-2 col-md-6">
            <select
              className="form-select form-select-sm"
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              style={{ borderRadius: '8px' }}
            >
              <option value="All">All Productivity Levels</option>
              <option value="high">High Activity (≥70%)</option>
              <option value="mid">Mid Activity (40% - 69%)</option>
              <option value="low">Low Activity (&lt;40%)</option>
            </select>
          </div>

          {/* Tracking Status Filter */}
          <div className="col-lg-1.5 col-md-6">
            <select
              className="form-select form-select-sm"
              value={filterTracking}
              onChange={(e) => setFilterTracking(e.target.value)}
              style={{ borderRadius: '8px' }}
            >
              <option value="All">All Toggles</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Paused Only</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="col-lg-1.5 col-md-6 ms-auto">
            <select
              className="form-select form-select-sm bg-light"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ borderRadius: '8px' }}
            >
              <option value="status">Order by Status</option>
              <option value="name">Order by Name</option>
              <option value="work_time">Order by Work Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* OPERATIONS CONSOLE WORKSPACE TABLE */}
      <div className="card glass-card" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ tableLayout: 'auto' }}>
            <thead className="table-light text-uppercase text-slate-500 font-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>
              <tr>
                <th className="py-3 px-4" style={{ width: '22%' }}>Employee Profile</th>
                <th className="py-3" style={{ width: '13%' }}>Live Status</th>
                <th className="py-3" style={{ width: '10%' }}>Productive Time</th>
                <th className="py-3" style={{ width: '10%' }}>Idle Time</th>
                <th className="py-3" style={{ width: '15%' }}>Current App</th>
                <th className="py-3" style={{ width: '15%' }}>Active Window</th>
                <th className="py-3" style={{ width: '10%' }}>Session Timer</th>
                <th className="py-3" style={{ width: '15%' }}>Live Activity</th>
                <th className="py-3 text-end px-4" style={{ width: '10%' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <span>Bootstrapping LIVE employee monitor...</span>
                  </td>
                </tr>
              ) : processedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted font-semibold">
                    No tracked sessions found matching search or filters.
                  </td>
                </tr>
              ) : (
                processedEmployees.map((emp) => (
                  <EmployeeRow
                    key={emp.user_id}
                    emp={emp}
                    onToggleTracking={handleToggleTracking}
                    onViewDetails={setSelectedUserId}
                    onForceSync={handleForceSync}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LIVE INTERACTIVE SLIDING SIDE DRAWER */}
      <AnimatePresence>
        {selectedUserId !== null && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserId(null)}
            />

            {/* Slide-out Sheet */}
            <motion.div
              className="drawer-sheet"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Header */}
              <div className="drawer-header bg-slate-900 text-white">
                <div>
                  <h5 className="fw-black mb-0">{drawerData?.full_name || drawerData?.email}</h5>
                  <span className="text-slate-400 text-xxs font-mono uppercase">
                    ID: {drawerData?.employee_code || `GS-26-${selectedUserId}`}
                  </span>
                </div>
                <button
                  className="btn bg-slate-800 text-white hover:bg-slate-700 p-1.5 border-0 rounded"
                  onClick={() => setSelectedUserId(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="drawer-body">
                {drawerLoading ? (
                  <div className="text-center py-5">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    <span className="text-slate-500 font-semibold small">Fetching real-time tracking graphs...</span>
                  </div>
                ) : drawerData ? (
                  <div>
                    {/* Real-time Status Badge Row */}
                    <div className="d-flex justify-content-between align-items-center mb-4 bg-slate-50 p-2.5 rounded border">
                      <div className="d-flex align-items-center">
                        <Activity className="w-4 h-4 text-indigo-600 me-2" />
                        <span className="small text-slate-700 fw-bold">Live Status:</span>
                      </div>
                      <span className={`badge ${
                        drawerData.status === 'Active' ? 'bg-success' : drawerData.status === 'Idle' ? 'bg-warning text-dark' : 'bg-secondary'
                      } px-2.5 py-1 rounded-pill font-bold`}>
                        {drawerData.status}
                      </span>
                    </div>

                    {/* Drawer Session details card */}
                    <DrawerSessionDetails emp={drawerData} />

                    {/* Dynamic Tabs */}
                    <div className="nav nav-pills nav-fill bg-slate-100 p-1 rounded-pill border mb-4">
                      <button
                        className={`nav-link py-1.5 rounded-pill font-bold small border-0 ${activeTab === 'timeline' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 bg-transparent'}`}
                        onClick={() => setActiveTab('timeline')}
                      >
                        Timeline
                      </button>
                      <button
                        className={`nav-link py-1.5 rounded-pill font-bold small border-0 ${activeTab === 'stats' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 bg-transparent'}`}
                        onClick={() => setActiveTab('stats')}
                      >
                        Productivity
                      </button>
                    </div>

                    {/* Tab 1: Stepper App Timeline */}
                    {activeTab === 'timeline' && (
                      <div>
                        <h6 className="fw-bold mb-3 text-slate-700 d-flex align-items-center gap-2">
                          <Calendar className="w-4 h-4" /> Today's Active Timeline
                        </h6>
                        {!drawerData.app_activities || drawerData.app_activities.length === 0 ? (
                          <div className="text-center py-4 text-slate-400 small border border-dashed rounded">
                            No app tracking pings recorded for this session today.
                          </div>
                        ) : (
                          <div className="timeline-stepper">
                            {drawerData.app_activities.map((act: any) => (
                              <div key={act.id} className="timeline-step">
                                <div className="timeline-step-icon" />
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="d-flex align-items-center gap-1.5">
                                    {getAppIcon(act.app_name)}
                                    <span className="fw-bold text-slate-800 text-sm">{act.app_name}</span>
                                  </div>
                                  <span className="timeline-time-badge font-mono">
                                    {new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="text-slate-500 text-xs mt-1 text-truncate" style={{ maxWidth: '340px' }} title={act.window_title}>
                                  {act.window_title}
                                </div>
                                <div className="d-flex gap-2.5 mt-1.5 text-xxs text-slate-400">
                                  <span className="bg-slate-50 border px-1.5 py-0.5 rounded">Duration: {Math.round(act.duration_seconds)}s</span>
                                  <span className="d-flex align-items-center"><MousePointer className="w-2.5 h-2.5 me-0.5" /> {act.mouse_moves}</span>
                                  <span className="d-flex align-items-center"><Keyboard className="w-2.5 h-2.5 me-0.5" /> {act.key_presses}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Recharts Productivity Analytics & Productivity Gauge */}
                    {activeTab === 'stats' && (
                      <div>
                        {/* Circular Progress Gauge */}
                        <div className="card glass-card p-3.5 mb-4 bg-slate-900 text-white d-flex align-items-center justify-content-between flex-row">
                          <div>
                            <span className="text-slate-400 text-xxs uppercase font-bold">Productivity Level</span>
                            <h4 className="fw-black mb-0 text-white mt-1">{(drawerData.activity_percentage ?? 0)}%</h4>
                          </div>
                          <div className="rounded-circle d-flex align-items-center justify-content-center fw-black text-indigo-600 bg-white" style={{ width: '56px', height: '56px', fontSize: '1rem', border: '3px solid #6366f1' }}>
                            {drawerData.activity_percentage}%
                          </div>
                        </div>

                        {/* Most Used Applications Widget */}
                        <MostUsedAppsWidget activities={drawerData.app_activities || []} />

                        {/* Recharts Work vs Idle Graph */}
                        <h6 className="fw-bold mb-3 text-slate-700">Daily Work vs Idle Hour (Minutes)</h6>
                        <div style={{ width: '100%', height: '220px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drawerData.timeline_data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={4} />
                              <YAxis tick={{ fontSize: 9 }} unit="m" />
                              <RechartsTooltip />
                              <Legend wrapperStyle={{ fontSize: 10 }} />
                              <Bar dataKey="productive" name="Productive (min)" fill="#10b981" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="idle" name="Idle (min)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Mouse / Keyboard Activity */}
                        <div className="card border bg-slate-50 p-3 mt-4" style={{ borderRadius: '10px' }}>
                          <h6 className="fw-bold text-slate-700 d-block mb-2" style={{ fontSize: '0.9rem' }}>Total System Interactions</h6>
                          <div className="row g-2 text-center text-xs">
                            <div className="col-4 border-end">
                              <span className="text-slate-400 d-block text-xxs">MOUSE MOVES</span>
                              <span className="fw-bold text-indigo-600 fs-6">{drawerData.mouse_moves ?? drawerData.mouseMoves ?? 0}</span>
                            </div>
                            <div className="col-4 border-end">
                              <span className="text-slate-400 d-block text-xxs">KEY PRESSES</span>
                              <span className="fw-bold text-indigo-600 fs-6">{drawerData.key_presses ?? drawerData.keyPresses ?? 0}</span>
                            </div>
                            <div className="col-4">
                              <span className="text-slate-400 d-block text-xxs">CLICKS</span>
                              <span className="fw-bold text-indigo-600 fs-6">{drawerData.clicks ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-5 text-slate-400">Failed to load detailed operational data.</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* REAL-TIME LIVE DEBUG OVERLAY */}
      <div 
        className="position-fixed" 
        style={{ 
          bottom: '20px', 
          right: '20px', 
          zIndex: 1030,
          maxWidth: '320px',
          width: '100%',
        }}
      >
        <div className="card glass-card shadow-lg border-primary p-3 animate-fade-in" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-1.5">
              <span className="pulse-indicator-active animate-pulse" style={{ width: '8px', height: '8px', backgroundColor: '#6366f1', animation: 'none' }} />
              <h6 className="fw-bold mb-0 text-slate-800" style={{ fontSize: '0.8rem' }}>
                Pipeline Live Debug Overlay
              </h6>
            </div>
            <span className="badge bg-indigo text-white font-mono" style={{ fontSize: '0.6rem' }}>Active Tracker</span>
          </div>
          
          {debugEmployee ? (
            <div className="d-flex flex-column gap-2 text-xs">
              <div className="d-flex justify-content-between">
                <span className="text-slate-400 font-bold">User Focus:</span>
                <span className="fw-bold text-slate-700 text-truncate" style={{ maxWidth: '180px' }}>
                  {debugEmployee.full_name || debugEmployee.email}
                </span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-slate-400 font-bold">App Focus:</span>
                <span className="badge bg-light text-slate-800 fw-bold border d-flex align-items-center gap-1">
                  {getAppIcon(debugEmployee.current_app)}
                  {debugEmployee.current_app || 'None'}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-slate-400 font-bold">Window Focus:</span>
                <span className="fw-bold text-slate-600 text-truncate" style={{ maxWidth: '180px' }} title={debugEmployee.current_window || ''}>
                  {debugEmployee.current_window || '—'}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-slate-400 font-bold">Heartbeat Status:</span>
                <span className={`fw-bold ${debugEmployee.status === 'Idle' ? 'text-warning' : debugEmployee.status === 'Active' ? 'text-success' : 'text-slate-400'}`}>
                  {debugEmployee.status || 'Offline'}
                </span>
              </div>

              <div className="row g-1 mt-1 text-center py-2 bg-slate-50 border rounded">
                <div className="col-4 border-end">
                  <span className="text-slate-400 text-xxs font-bold d-block">MOVES</span>
                  <span className="font-mono fw-bold text-indigo-600">{debugEmployee.mouse_moves ?? debugEmployee.mouseMoves ?? 0}</span>
                </div>
                <div className="col-4 border-end">
                  <span className="text-slate-400 text-xxs font-bold d-block">KEYS</span>
                  <span className="font-mono fw-bold text-indigo-600">{debugEmployee.key_presses ?? debugEmployee.keyPresses ?? 0}</span>
                </div>
                <div className="col-4">
                  <span className="text-slate-400 text-xxs font-bold d-block">CLICKS</span>
                  <span className="font-mono fw-bold text-indigo-600">{debugEmployee.clicks ?? 0}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between mt-1">
                <span className="text-slate-400 font-bold">Productive Time:</span>
                <span className="font-mono fw-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                  {debugEmployee.productive_time || debugEmployee.productiveTime || debugEmployee.total_work_time || '00:00:00'}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-slate-400 font-bold">Idle Time:</span>
                <span className="font-mono fw-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                  {debugEmployee.idle_time || debugEmployee.idleTime || '00:00:00'}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-1 pt-1.5 border-top">
                <span className="text-slate-400 text-xxs font-bold">LAST HEARTBEAT:</span>
                <span className="font-mono text-xxs text-slate-500">
                  {debugEmployee.last_ping ? new Date(debugEmployee.last_ping).toLocaleTimeString('en-US', { hour12: false }) : 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 text-slate-400 text-xs">
              No tracking employees online
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkTrackingDashboard;
