import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Period = "Weekly" | "Monthly" | "Quarterly" | "Annual";
type ViewName =
  | "dashboard"
  | "task-list"
  | "on-hold"
  | "clients"
  | "tasks-weekly"
  | "tasks-monthly"
  | "tasks-quarterly"
  | "tasks-annual";

type Status = "Not Started" | "In Progress" | "On Hold" | "Completed";

type Task = {
  id: string;
  seriesKey: string;
  client: string;
  title: string;
  due: string;
  period: Period;
  comments: string;
  status: Status;
  completedAt?: string;
  createdAt: string;
};

const STORAGE_KEY = "taskflow_engine_v2";

const seedTasks: Task[] = [
  createSeedTask({
    id: "1",
    client: "Efes Produce",
    title: "Payroll Mate: Generate paystubs",
    due: "2026-04-09",
    period: "Weekly",
    comments: "",
    status: "In Progress",
  }),
  createSeedTask({
    id: "2",
    client: "Efes Produce",
    title: "PDF: Employee paystubs exported",
    due: "2026-04-09",
    period: "Weekly",
    comments: "",
    status: "In Progress",
  }),
  createSeedTask({
    id: "3",
    client: "Efes Produce",
    title: "PDF: Federal Deposit Requirement",
    due: "2026-04-09",
    period: "Weekly",
    comments: "",
    status: "In Progress",
  }),
  createSeedTask({
    id: "4",
    client: "Efes Produce",
    title: "Excel: State tax report file prepared",
    due: "2026-04-09",
    period: "Weekly",
    comments: "",
    status: "In Progress",
  }),
  createSeedTask({
    id: "5",
    client: "Efes Produce",
    title: "Payroll Mate: Backup completed",
    due: "2026-04-09",
    period: "Weekly",
    comments: "",
    status: "In Progress",
  }),
  createSeedTask({
    id: "6",
    client: "Bake Fusion",
    title: "Payroll Mate: Generate paystubs",
    due: "2026-04-09",
    period: "Weekly",
    comments: "",
    status: "Not Started",
  }),
  createSeedTask({
    id: "7",
    client: "Bake Fusion",
    title: "PDF: Federal Deposit Requirement",
    due: "2026-04-10",
    period: "Monthly",
    comments: "",
    status: "Not Started",
  }),
  createSeedTask({
    id: "8",
    client: "Aygun Market",
    title: "Excel: State tax report file prepared",
    due: "2026-04-10",
    period: "Quarterly",
    comments: "",
    status: "On Hold",
  }),
  createSeedTask({
    id: "9",
    client: "Aygun Market",
    title: "MyconneCT: State tax payment submitted",
    due: "2026-04-10",
    period: "Monthly",
    comments: "",
    status: "Not Started",
  }),
  createSeedTask({
    id: "10",
    client: "Efes Produce",
    title: "MyconneCT: State tax payment submitted",
    due: "2026-04-09",
    period: "Annual",
    comments: "",
    status: "Completed",
  }),
];

const emptyTask = {
  client: "",
  title: "",
  due: "",
  period: "Weekly" as Period,
  comments: "",
  status: "Not Started" as Status,
};

function sortTasks(tasks: Task[]) {
  const periodOrder: Record<Period, number> = {
    Weekly: 1,
    Monthly: 2,
    Quarterly: 3,
    Annual: 4,
  };

  return [...tasks].sort((a, b) => {
    const dueCompare = a.due.localeCompare(b.due);
    if (dueCompare !== 0) return dueCompare;

    const periodCompare = periodOrder[a.period] - periodOrder[b.period];
    if (periodCompare !== 0) return periodCompare;

    const clientCompare = a.client.localeCompare(b.client);
    if (clientCompare !== 0) return clientCompare;

    return a.title.localeCompare(b.title);
  });
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [currentView, setCurrentView] = useState<ViewName>("dashboard");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyTask);

  const [columnWidths, setColumnWidths] = useState({
    index: 60,
    client: 150,
    title: 360,
    due: 120,
    period: 110,
    actions: 150,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

const totalTasks = tasks.length;
const onHoldCount = tasks.filter((t) => t.status === "On Hold").length;
const completedCount = tasks.filter((t) => t.status === "Completed").length;
const weeklyCount = tasks.filter((t) => t.period === "Weekly").length;
const monthlyCount = tasks.filter((t) => t.period === "Monthly").length;
const quarterlyCount = tasks.filter((t) => t.period === "Quarterly").length;
const annualCount = tasks.filter((t) => t.period === "Annual").length;

const clients = useMemo(() => {
  const grouped = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.client] = (acc[task.client] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
}, [tasks]);

function formatDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}
const visibleRows = useMemo(() => {
  let list = [...tasks];

  if (currentView === "task-list") {
    list = list.filter(
      (t) =>
        t.status !== "Completed" &&
        t.status !== "On Hold" &&
        !isThisWeek(t.due)
    );
  } else if (currentView === "on-hold") {
    list = list.filter((t) => t.status === "On Hold");
  } else if (currentView === "tasks-weekly") {
    list = list.filter((t) => t.period === "Weekly");
  } else if (currentView === "tasks-monthly") {
    list = list.filter((t) => t.period === "Monthly");
  } else if (currentView === "tasks-quarterly") {
    list = list.filter((t) => t.period === "Quarterly");
  } else if (currentView === "tasks-annual") {
    list = list.filter((t) => t.period === "Annual");
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (t) =>
        t.client.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.comments.toLowerCase().includes(q)
    );
  }

  return sortTasks(list);
}, [tasks, currentView, search]);

  const weekPreview = useMemo(() => {
    return sortTasks(
      tasks.filter(
        (t) =>
          isThisWeek(t.due) &&
          t.status !== "Completed" &&
          t.status !== "On Hold"
      )
    );
  }, [tasks]);

  const setField = <K extends keyof typeof emptyTask>(
    key: K,
    value: (typeof emptyTask)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

const addTask = () => {
  if (!form.client.trim() || !form.title.trim() || !form.due) return;

  const task: Task = {
    id: createId(),
    seriesKey: makeSeriesKey(form.client, form.title, form.period),
    client: form.client.trim(),
    title: form.title.trim(),
    due: form.due,
    period: form.period,
    comments: form.comments.trim(),
    status: "Not Started",
    createdAt: new Date().toISOString(),
  };

  setTasks((prev) => sortTasks([...prev, task]));
  setForm(emptyTask);
  setShowAddModal(false);
};

  const moveToOnHold = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "On Hold" } : t))
    );
  };

const moveToActive = (id: string) => {
  const today = formatDate(new Date());

  setTasks((prev) =>
    sortTasks(
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              due: today,
              status: "In Progress",
            }
          : t
      )
    )
  );

  setCurrentView("dashboard");
};

  const completeTask = (id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;

      const updated = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "Completed" as Status,
              completedAt: new Date().toISOString(),
            }
          : t
      );

      const nextDue = addPeriod(task.due, task.period);

      const nextExists = updated.some(
        (t) =>
          t.seriesKey === task.seriesKey &&
          t.due === nextDue &&
          t.period === task.period
      );

      if (nextExists) return sortTasks(updated);

      const nextTask: Task = {
        id: createId(),
        seriesKey: task.seriesKey,
        client: task.client,
        title: task.title,
        due: nextDue,
        period: task.period,
        comments: task.comments,
        status: isThisWeek(nextDue) ? "In Progress" : "Not Started",
        createdAt: new Date().toISOString(),
      };

      return sortTasks([...updated, nextTask]);
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const updateDueDate = (id: string, due: string) => {
    setTasks((prev) =>
      sortTasks(prev.map((t) => (t.id === id ? { ...t, due } : t)))
    );
  };

const startResize = (
  column: keyof typeof columnWidths,
  startX: number
) => {
  const startWidth = columnWidths[column];

  const onMouseMove = (e: MouseEvent) => {
    const nextWidth = Math.max(60, startWidth + (e.clientX - startX));
    setColumnWidths((prev) => ({
      ...prev,
      [column]: nextWidth,
    }));
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

  const exportCSV = () => {
    const headers = [
      "Client",
      "Job Title",
      "Due",
      "Period",
      "Comments",
      "Status",
      "Series Key",
    ];

    const rows = tasks.map((task) => [
      task.client,
      task.title,
      task.due,
      task.period,
      task.comments,
      task.status,
      task.seriesKey,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taskflow-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const pageTitle =
    currentView === "dashboard"
      ? "Dashboard"
      : currentView === "task-list"
      ? "Task List"
      : currentView === "on-hold"
      ? "On Hold"
      : currentView === "clients"
      ? "Clients"
      : currentView === "tasks-weekly"
      ? "Weekly"
      : currentView === "tasks-monthly"
      ? "Monthly"
      : currentView === "tasks-quarterly"
      ? "Quarterly"
      : "Annual";

  const pageSubtitle =
    currentView === "dashboard"
      ? "This week’s working area driven by the master task list"
      : currentView === "task-list"
      ? "Master repository sorted by due date"
      : currentView === "on-hold"
      ? "Tasks currently paused"
      : currentView === "clients"
      ? "Client overview from the master task list"
      : "Filtered view from the master task list";

  const clientClass = (client: string) => {
    if (client === "Efes Produce") return "client-chip client-efes";
    if (client === "Bake Fusion") return "client-chip client-bake";
    if (client === "Aygun Market") return "client-chip client-aygun";
    return "client-chip";
  };

  const periodClass = (period: Period) => {
    if (period === "Weekly") return "period-chip period-weekly";
    if (period === "Monthly") return "period-chip period-monthly";
    if (period === "Quarterly") return "period-chip period-quarterly";
    return "period-chip period-annual";
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div>
            <div className="brand-title">TaskFlow</div>
            <div className="brand-subtitle">WORK TRACKER</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">WORKSPACE</div>

          <button
            className={`nav-btn ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentView("dashboard")}
          >
            <span>◈ Dashboard</span>
          </button>

          <button
            className={`nav-btn ${currentView === "task-list" ? "active" : ""}`}
            onClick={() => setCurrentView("task-list")}
          >
            <span>☰ Task List</span>
            <span className="nav-badge">{totalTasks}</span>
          </button>

          <button
            className={`nav-btn ${currentView === "on-hold" ? "active" : ""}`}
            onClick={() => setCurrentView("on-hold")}
          >
            <span>⏸ On Hold</span>
            <span className="nav-badge">{onHoldCount}</span>
          </button>

          <button
            className={`nav-btn ${currentView === "clients" ? "active" : ""}`}
            onClick={() => setCurrentView("clients")}
          >
            <span>👥 Clients</span>
            <span className="nav-badge">{clients.length}</span>
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-label">MASTER LIST</div>

          <button
            className={`nav-btn ${currentView === "tasks-weekly" ? "active" : ""}`}
            onClick={() => setCurrentView("tasks-weekly")}
          >
            <span>📅 Weekly</span>
            <span className="nav-badge">{weeklyCount}</span>
          </button>

          <button
            className={`nav-btn ${currentView === "tasks-monthly" ? "active" : ""}`}
            onClick={() => setCurrentView("tasks-monthly")}
          >
            <span>🗓️ Monthly</span>
            <span className="nav-badge">{monthlyCount}</span>
          </button>

          <button
            className={`nav-btn ${currentView === "tasks-quarterly" ? "active" : ""}`}
            onClick={() => setCurrentView("tasks-quarterly")}
          >
            <span>📊 Quarterly</span>
            <span className="nav-badge">{quarterlyCount}</span>
          </button>

          <button
            className={`nav-btn ${currentView === "tasks-annual" ? "active" : ""}`}
            onClick={() => setCurrentView("tasks-annual")}
          >
            <span>📋 Annual</span>
            <span className="nav-badge">{annualCount}</span>
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-label">ACTIONS</div>

          <button className="nav-btn" onClick={() => setShowAddModal(true)}>
            <span>＋ Add Task</span>
          </button>

          <button className="nav-btn" onClick={() => setCurrentView("dashboard")}>
            <span>↻ Refresh Week</span>
          </button>
        </div>

        <div className="sidebar-footer">
          ● Auto-saved • {completedCount} completed
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>

          <div className="topbar-actions">
            <button className="ghost-btn" onClick={exportCSV}>
              ↓ Export CSV
            </button>
          </div>
        </div>

        {currentView === "dashboard" ? (
          <div className="panel wide-panel">
            <div className="panel-header">
              <div className="panel-title">🗓 This Week — Active Tasks</div>
              <button
                className="ghost-small"
                onClick={() => setCurrentView("task-list")}
              >
                View all →
              </button>
            </div>

            {weekPreview.length > 0 ? (
<div className="table-wrap">
  <table>
    <colgroup>
      <col style={{ width: columnWidths.client }} />
      <col style={{ width: columnWidths.title }} />
      <col style={{ width: columnWidths.due }} />
      <col style={{ width: columnWidths.period }} />
      <col style={{ width: columnWidths.actions }} />
    </colgroup>

    <thead>
      <tr>
        <th className="resizable-th">
          Client
          <span
            className="resize-handle"
            onMouseDown={(e) => startResize("client", e.clientX)}
          />
        </th>
        <th className="resizable-th">
          Job Title
          <span
            className="resize-handle"
            onMouseDown={(e) => startResize("title", e.clientX)}
          />
        </th>
        <th className="resizable-th">
          Due
          <span
            className="resize-handle"
            onMouseDown={(e) => startResize("due", e.clientX)}
          />
        </th>
        <th className="resizable-th">
          Period
          <span
            className="resize-handle"
            onMouseDown={(e) => startResize("period", e.clientX)}
          />
        </th>
        <th className="resizable-th">
          Actions
          <span
            className="resize-handle"
            onMouseDown={(e) => startResize("actions", e.clientX)}
          />
        </th>
      </tr>
    </thead>

    <tbody>
      {weekPreview.map((task) => (
        <tr key={task.id}>
          <td>
            <span className={clientClass(task.client)}>
              {task.client}
            </span>
          </td>
          <td>{task.title}</td>
          <td>{formatDisplayDate(task.due)}</td>
          <td>
            <span className={periodClass(task.period)}>
              {task.period}
            </span>
          </td>
          <td className="actions">
            <button
              className="hold-btn"
              onClick={() => moveToOnHold(task.id)}
            >
              On Hold
            </button>
            <button
              className="done-btn"
              onClick={() => completeTask(task.id)}
            >
              Done
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
            ) : (
              <div className="empty-dashboard">
                No active tasks for this week.
              </div>
            )}
          </div>
        ) : currentView === "clients" ? (
          <div className="panel wide-panel">
            <div className="panel-title">Clients</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Total Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(([client, count]) => (
                    <tr key={client}>
                      <td>
                        <span className={clientClass(client)}>{client}</span>
                      </td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <div className="search-panel">
              <input
                className="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
              />
            </div>

            <div className="panel wide-panel">
              <div className="panel-title">{pageTitle}</div>
              <div className="table-wrap">
                <table>
                  <colgroup>
                    <col style={{ width: columnWidths.index }} />
                    <col style={{ width: columnWidths.client }} />
                    <col style={{ width: columnWidths.title }} />
                    <col style={{ width: columnWidths.due }} />
                    <col style={{ width: columnWidths.period }} />
                    <col style={{ width: columnWidths.actions }} />
                  </colgroup>

                  <thead>
                    <tr>
                      <th className="resizable-th">
                        #
                        <span
                          className="resize-handle"
                          onMouseDown={(e) => startResize("index", e.clientX)}
                        />
                      </th>
                      <th className="resizable-th">
                        Client
                        <span
                          className="resize-handle"
                          onMouseDown={(e) => startResize("client", e.clientX)}
                        />
                      </th>
                      <th className="resizable-th">
                        Job Title
                        <span
                          className="resize-handle"
                          onMouseDown={(e) => startResize("title", e.clientX)}
                        />
                      </th>
                      <th className="resizable-th">
                        Due
                        <span
                          className="resize-handle"
                          onMouseDown={(e) => startResize("due", e.clientX)}
                        />
                      </th>
                      <th className="resizable-th">
                        Period
                        <span
                          className="resize-handle"
                          onMouseDown={(e) => startResize("period", e.clientX)}
                        />
                      </th>
                      <th className="resizable-th">
                        Actions
                        <span
                          className="resize-handle"
                          onMouseDown={(e) => startResize("actions", e.clientX)}
                        />
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRows.map((task, index) => (
                      <tr key={task.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className={clientClass(task.client)}>
                            {task.client}
                          </span>
                        </td>
                        <td>{task.title}</td>
<td>
  {currentView === "task-list" ? (
    <input
      type="date"
      className="due-date-input"
      value={task.due}
      onChange={(e) => updateDueDate(task.id, e.target.value)}
    />
  ) : (
    formatDisplayDate(task.due)
  )}
</td>
                        <td>
                          <span className={periodClass(task.period)}>
                            {task.period}
                          </span>
                        </td>
                        <td className="actions">
                          {currentView === "on-hold" ? (
                            <>
                              <button
                                className="ghost-small"
                                onClick={() => moveToActive(task.id)}
                              >
                                Active
                              </button>
                              <button
                                className="done-btn"
                                onClick={() => completeTask(task.id)}
                              >
                                Done
                              </button>
                            </>
                          ) : currentView === "task-list" ? (
                            <>
                              <button
                                className="ghost-small"
                                onClick={() => moveToActive(task.id)}
                              >
                                Active
                              </button>
                              <button
                                className="danger-btn"
                                onClick={() => deleteTask(task.id)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <button
                              className="danger-btn"
                              onClick={() => deleteTask(task.id)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {visibleRows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 18 }}>
                          No tasks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Task</h2>
            <p>Task will be added to the master list as a recurring series item.</p>

            <label>Client *</label>
            <select
              className="modal-input"
              value={form.client}
              onChange={(e) => setField("client", e.target.value)}
            >
              <option value="">Select client</option>
              <option value="Efes Produce">Efes Produce</option>
              <option value="Bake Fusion">Bake Fusion</option>
              <option value="Aygun Market">Aygun Market</option>
            </select>

            <label>Job Title *</label>
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Descriptive job title"
            />

            <div className="modal-row">
              <div>
                <label>Due Date *</label>
                <input
                  className="modal-input"
                  type="date"
                  value={form.due}
                  onChange={(e) => setField("due", e.target.value)}
                />
              </div>

              <div>
                <label>Period *</label>
                <select
                  className="modal-input"
                  value={form.period}
                  onChange={(e) => setField("period", e.target.value as Period)}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
            </div>

            <label>Comments</label>
            <input
              className="modal-input"
              value={form.comments}
              onChange={(e) => setField("comments", e.target.value)}
              placeholder="Optional notes"
            />

            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={addTask}>
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function createSeedTask(task: Omit<Task, "seriesKey" | "createdAt">): Task {
  return {
    ...task,
    seriesKey: makeSeriesKey(task.client, task.title, task.period),
    createdAt: new Date().toISOString(),
  };
}

function loadTasks(): Task[] {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return seedTasks;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return seedTasks;

    return sortTasks(
      parsed.map((task) => ({
        ...task,
        seriesKey:
          task.seriesKey ||
          makeSeriesKey(task.client, task.title, task.period as Period),
        createdAt: task.createdAt || new Date().toISOString(),
      }))
    );
  } catch {
    return seedTasks;
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function makeSeriesKey(client: string, title: string, period: Period) {
  return `${client.trim().toLowerCase()}__${title
    .trim()
    .toLowerCase()}__${period.toLowerCase()}`;
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSunday(monday: Date) {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isThisWeek(dateStr: string) {
  const due = new Date(`${dateStr}T00:00:00`);
  const monday = getMonday(new Date());
  const sunday = getSunday(monday);
  return due >= monday && due <= sunday;
}

function addPeriod(dateStr: string, period: Period) {
  const date = new Date(`${dateStr}T00:00:00`);

  if (period === "Weekly") {
    date.setDate(date.getDate() + 7);
  } else if (period === "Monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (period === "Quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default App;