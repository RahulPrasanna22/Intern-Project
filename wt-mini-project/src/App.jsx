import React, { useEffect, useState, useRef } from "react";
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

const API = "/api/users";

// ─── Nav ────────────────────────────────────────────────────────────────────
function Nav({ darkMode, setDarkMode, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const links = [
    { href: "/", label: "Dashboard", icon: "⊞" },
    { href: "/tasks", label: "Tasks", icon: "✓" },
    { href: "/settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <nav className="top-nav">
      <div className="nav-brand" onClick={() => navigate("/")}>
        <span className="nav-logo">◈</span>
        <span className="nav-title">TaskFlow</span>
      </div>
      <div className="nav-links">
        {links.map((l) => (
          <Link
            key={l.href}
            to={l.href}
            className={`nav-link ${location.pathname === l.href ? "active" : ""}`}
          >
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        <span className="nav-user-badge">
          <span className="badge-dot" />
          {user.username}
        </span>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          Logout
        </button>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode((p) => !p)}
          title="Toggle theme"
        >
          {darkMode ? "🌙" : "☀️"}
        </button>
      </div>
    </nav>
  );
}

// ─── Login Page ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isRegister ? "/register" : "/login";
      const res = await axios.post(`${API}${endpoint}`, form);
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">◈</span>
          <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
          <p>{isRegister ? "Join TaskFlow to stay organized" : "Login to manage your tasks"}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="field-input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="field-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary login-submit">
            {isRegister ? "Sign Up" : "Login"}
          </button>
        </form>
        <div className="login-footer">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button className="text-btn" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({ task, selected, onClick }) {
  const now = new Date();
  const end = new Date(task.endDate);
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  const urgency = diffDays < 3 ? "urgent" : diffDays <= 5 ? "warning" : diffDays <= 7 ? "soon" : "fine";
  const priorityColor = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" }[task.priority] || "#6b7280";

  return (
    <div className={`task-card ${urgency} ${selected ? "selected" : ""}`} onClick={() => onClick(task)}>
      <div className="task-card-header">
        <span className="task-name">{task.taskName}</span>
        <span className="priority-badge" style={{ background: priorityColor }}>{task.priority}</span>
      </div>
      <div className="task-card-meta">
        <span className="task-due">📅 {new Date(task.endDate).toLocaleDateString()}</span>
        <span className={`task-days ${urgency}`}>
          {diffDays >= 0 ? `${diffDays}d left` : "Overdue"}
        </span>
      </div>
      {task.notes && <div className="task-notes-preview">{task.notes.slice(0, 60)}{task.notes.length > 60 ? "…" : ""}</div>}
    </div>
  );
}

// ─── Task Form Modal ─────────────────────────────────────────────────────────
function TaskModal({ visible, task, onSave, onClose }) {
  const [form, setForm] = useState({ taskName: "", endDate: "", priority: "Medium", notes: "" });

  useEffect(() => {
    if (task) setForm({ taskName: task.taskName, endDate: task.endDate?.slice(0, 10) || "", priority: task.priority, notes: task.notes || "" });
    else setForm({ taskName: "", endDate: "", priority: "Medium", notes: "" });
  }, [task, visible]);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? "Edit Task" : "New Task"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="field-label">Task Name</label>
          <input className="field-input" type="text" value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} placeholder="What needs to be done?" autoFocus />

          <label className="field-label">Due Date</label>
          <input className="field-input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />

          <label className="field-label">Priority</label>
          <div className="priority-select">
            {["Low", "Medium", "High"].map((p) => (
              <button key={p} className={`priority-btn ${form.priority === p ? "active" : ""} p-${p.toLowerCase()}`} onClick={() => setForm({ ...form, priority: p })}>{p}</button>
            ))}
          </div>

          <label className="field-label">Notes</label>
          <textarea className="field-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any additional details…" />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)}>{task ? "Update Task" : "Add Task"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Details Panel ──────────────────────────────────────────────────────
function TaskDetails({ task, onClose }) {
  if (!task) return null;
  const now = new Date();
  const end = new Date(task.endDate);
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const priorityColor = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" }[task.priority] || "#6b7280";

  return (
    <aside className="details-panel">
      <div className="details-header">
        <h3>Task Details</h3>
        <button className="icon-btn delete" onClick={onClose}>✕</button>
      </div>
      <div className="details-body">
        <div className="detail-title">{task.taskName}</div>
        <div className="detail-meta">
          <div className="detail-chip" style={{ background: priorityColor + "22", color: priorityColor, border: `1px solid ${priorityColor}44` }}>
            {task.priority} Priority
          </div>
          <div className="detail-chip overdue-chip">
            {diffDays >= 0 ? `${diffDays} days left` : "Overdue"}
          </div>
        </div>
        <div className="detail-row">
          <span className="detail-label">Due Date</span>
          <span className="detail-value">{new Date(task.endDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Notes</span>
          <span className="detail-value">{task.notes || "No additional notes."}</span>
        </div>
      </div>
    </aside>
  );
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function DashboardPage({ tasks }) {
  const totalTasks = tasks.length;
  const now = new Date();
  const urgentTasks = tasks.filter(t => {
    const diff = Math.ceil((new Date(t.endDate) - now) / (1000 * 60 * 60 * 24));
    return diff < 3 && diff >= 0;
  }).length;
  const overdue = tasks.filter(t => new Date(t.endDate) < now).length;

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back — here's your overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠</div>
          <div className="stat-value">{urgentTasks}</div>
          <div className="stat-label">Due Soon</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">!</div>
          <div className="stat-value">{overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-section full-width">
          <h2 className="section-title">Upcoming Tasks</h2>
          <div className="upcoming-list">
            {tasks
              .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
              .slice(0, 6)
              .map((t) => {
                const diff = Math.ceil((new Date(t.endDate) - now) / (1000 * 60 * 60 * 24));
                const urgency = diff < 3 ? "urgent" : diff <= 7 ? "warning" : "fine";
                return (
                  <div key={t._id} className={`upcoming-item ${urgency}`}>
                    <div className="upcoming-info">
                      <div className="upcoming-name">{t.taskName}</div>
                      <div className="upcoming-date">📅 {new Date(t.endDate).toLocaleDateString()}</div>
                    </div>
                    <div className={`upcoming-days ${urgency}`}>
                      {diff >= 0 ? `${diff}d left` : "Overdue"}
                    </div>
                  </div>
                );
              })}
            {totalTasks === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <p>All clear! No tasks yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksPage({ tasks, fetchTasks, token }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleSave = async (form) => {
    if (!form.taskName || !form.endDate) return alert("Fill Task Name and End Date");
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingTask) {
        await axios.put(`${API}/tasks/${editingTask._id}`, form, config);
      } else {
        await axios.post(`${API}/tasks`, form, config);
      }
      await fetchTasks();
      setModalVisible(false);
      setEditingTask(null);
    } catch (err) {
      alert("Error saving task");
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return alert("Select a task first");
    if (!window.confirm("Delete this task?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API}/tasks/${selectedTask._id}`, config);
      await fetchTasks();
      setSelectedTask(null);
    } catch (err) {
      alert("Error deleting task");
    }
  };

  return (
    <div className="page tasks-page">
      <div className="tasks-layout">
        <div className="tasks-main">
          <div className="page-header row">
            <div>
              <h1 className="page-title">Tasks</h1>
              <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="page-actions">
              <button className="btn-primary" onClick={() => {
                setEditingTask(null);
                setModalVisible(true);
              }}>+ New Task</button>
              {selectedTask && (
                <>
                  <button className="btn-secondary" onClick={() => {
                    setEditingTask(selectedTask);
                    setModalVisible(true);
                  }}>Edit</button>
                  <button className="btn-danger" onClick={handleDelete}>Delete</button>
                </>
              )}
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state large">
              <div className="empty-icon">✓</div>
              <h3>No tasks yet</h3>
              <p>Create your first task to get started.</p>
            </div>
          ) : (
            <div className="task-grid">
              {tasks.map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  selected={selectedTask?._id === t._id}
                  onClick={(task) => setSelectedTask(selectedTask?._id === task._id ? null : task)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedTask && (
          <TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </div>

      <TaskModal
        visible={modalVisible}
        task={editingTask}
        onSave={handleSave}
        onClose={() => { setModalVisible(false); setEditingTask(null); }}
      />
    </div>
  );
}

function SettingsPage({ darkMode, setDarkMode }) {
  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your experience</p>
      </div>
      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">Dark Mode</div>
            <div className="setting-desc">Switch between light and dark themes</div>
          </div>
          <button
            className={`toggle-switch ${darkMode ? "on" : ""}`}
            onClick={() => setDarkMode((p) => !p)}
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">About</div>
            <div className="setting-desc">TaskFlow v3.0 — Secure Task Management</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [tasks, setTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  const fetchTasks = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error("fetch error", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userToken);
    navigate("/");
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!token && location.pathname !== "/login") {
    return <Navigate to="/login" />;
  }

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : "light-mode"}`}>
      <Nav darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout} />
      <div className="app-body">
        <div className="page-wrapper">
          <Routes>
            <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
            <Route path="/" element={<DashboardPage tasks={tasks} />} />
            <Route path="/tasks" element={<TasksPage tasks={tasks} fetchTasks={fetchTasks} token={token} />} />
            <Route path="/settings" element={<SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
