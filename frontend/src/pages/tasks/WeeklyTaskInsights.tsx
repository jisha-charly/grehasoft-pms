
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Task, User, TaskStatus, Project } from '../../types';

interface WeeklyTaskInsightsProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
}

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6610f2', '#fd7e14', '#20c997'];

const WeeklyTaskInsights: React.FC<WeeklyTaskInsightsProps> = ({ tasks, users, projects }) => {
  const now = new Date();

const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay());
startOfWeek.setHours(0,0,0,0);

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);
endOfWeek.setHours(23,59,59,999);
  // Helper to get current week's tasks
 const weeklyTasks = useMemo(() => {
  return tasks.filter(task => {
    const date = task.due_date || task.dueDate;

    if (!date) return false;

    const due = new Date(date);

    return due >= startOfWeek && due <= endOfWeek;
  });
}, [tasks, startOfWeek, endOfWeek]);

  // 1. Task Status Distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.BLOCKED]: 0,
      [TaskStatus.DONE]: 0,
    };
    weeklyTasks.forEach(t => counts[t.status]++);
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' ').toUpperCase(), value }));
  }, [weeklyTasks]);

  // 2. Workload by User
  const workloadData = useMemo(() => {
    return users.map(user => {
    const userTasks = weeklyTasks.filter(t => 
  (t.assignees || []).includes(user.id)
);
      return {
        name: user.name.split(' ')[0],
        tasks: userTasks.length,
        completed: userTasks.filter(t => t.status === TaskStatus.DONE).length
      };
    }).filter(d => d.tasks > 0);
  }, [weeklyTasks, users]);

  // 3. Daily Completion Trend
  const trendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ name: day, completed: 0, total: 0 }));
    
    weeklyTasks.forEach(t => {
  if (!t.due_date) return;   // 🔹 prevent undefined error

  const date = t.due_date || t.dueDate;
if (!date) return;

const dayIndex = new Date(date).getDay();

  data[dayIndex].total++;

  if (t.status === TaskStatus.DONE) {
    data[dayIndex].completed++;
  }
});
    return data;
  }, [weeklyTasks]);

  // 4. Priority Distribution
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { high: 0, medium: 0, low: 0 };
    weeklyTasks.forEach(t => counts[t.priority]++);
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [weeklyTasks]);

  if (weeklyTasks.length === 0) {
    return (
      <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
        <i className="bi bi-bar-chart text-muted fs-1 mb-3 d-block"></i>
        <h4 className="fw-bold">No tasks scheduled for this week</h4>
       <p className="text-secondary">
Try adding tasks with due dates between 
{startOfWeek.toDateString()} and {endOfWeek.toDateString()}.
</p>
      </div>
    );
  }

  const completedTasks = weeklyTasks.filter(t => t.status === TaskStatus.DONE).length;
  const completionRate = Math.round((completedTasks / weeklyTasks.length) * 100);

  return (
    <div className="weekly-insights">
      {/* Summary Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-primary text-white">
            <div className="small opacity-75 mb-1">Weekly Tasks</div>
            <div className="h3 fw-bold mb-0">{weeklyTasks.length}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-success text-white">
            <div className="small opacity-75 mb-1">Completed</div>
            <div className="h3 fw-bold mb-0">{completedTasks}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-info text-white">
            <div className="small opacity-75 mb-1">Completion Rate</div>
            <div className="h3 fw-bold mb-0">{completionRate}%</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 bg-warning text-dark">
            <div className="small opacity-75 mb-1">Active Assignees</div>
            <div className="h3 fw-bold mb-0">{workloadData.length}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Status Distribution */}
        <div className="col-lg-4">
          <div className="card h-100 border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-4 text-dark">Status Distribution</h6>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Workload by User */}
        <div className="col-lg-8">
          <div className="card h-100 border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-4 text-dark">Team Workload (Current Week)</h6>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8f9fa'}} />
                  <Legend />
                  <Bar dataKey="tasks" name="Total Tasks" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#198754" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="col-lg-8">
          <div className="card h-100 border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-4 text-dark">Daily Task Trend</h6>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total Assigned" stroke="#6c757d" strokeWidth={2} dot={{r: 4}} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#198754" strokeWidth={3} dot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="col-lg-4">
          <div className="card h-100 border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-4 text-dark">Priority Breakdown</h6>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{fill: '#f8f9fa'}} />
                  <Bar dataKey="value" name="Tasks" fill="#6610f2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTaskInsights;
