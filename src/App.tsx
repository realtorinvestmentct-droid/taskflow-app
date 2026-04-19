import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Workflow =
  | "Admin & Compliance"
  | "Account Payable"
  | "Payroll"
  | "Bookkeeping Cycles"
  | "Property Management"
  | "Marketing (CRM)";

type Cadence =
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Semi Annual"
  | "Annual"
  | "Custom";

type DueDateAdjustment = "None" | "Next Business Day" | "Previous Business Day";

type ViewName =
  | "dashboard"
  | "task-list"
  | "on-hold"
  | "clients"
  | "tasks-weekly"
  | "tasks-monthly"
  | "tasks-quarterly"
  | "tasks-semi-annual"
  | "tasks-annual"
  | "tasks-custom";

type Status = "Not Started" | "In Progress" | "On Hold" | "Completed";

type TaskCategory =
  | "Utilities"
  | "Insurance"
  | "Tax & Government"
  | "Licenses & Certificates"
  | "Legal & Compliance"
  | "Prepare & Generate Payroll"
  | "Payroll Tax Payments"
  | "File Payroll Reports"
  | "Bookkeeping Cycles"
  | "Financial Reports";

type ClientName =
  | "Efes Produce"
  | "Bake Fusion"
  | "Aygun Market"
  | "732 Washington"
  | "795 Savin"
  | "797 Savin";

type Task = {
  id: string;
  seriesKey: string;
  workflow: Workflow;
  category: TaskCategory;
  client: ClientName;
  title: string;
  due: string;
  cadence: Cadence;
  customDays?: number;
  dueDateAdjustment: DueDateAdjustment;
  comments: string;
  status: Status;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

const STORAGE_KEY = "taskflow_engine_v3_final";

const WORKFLOWS: Workflow[] = [
  "Admin & Compliance",
  "Account Payable",
  "Payroll",
  "Bookkeeping Cycles",
  "Property Management",
  "Marketing (CRM)",
];

const CATEGORIES: TaskCategory[] = [
  "Utilities",
  "Insurance",
  "Tax & Government",
  "Licenses & Certificates",
  "Legal & Compliance",
  "Prepare & Generate Payroll",
  "Payroll Tax Payments",
  "File Payroll Reports",
  "Bookkeeping Cycles",
  "Financial Reports",
];

const CLIENTS: ClientName[] = [
  "Efes Produce",
  "Bake Fusion",
  "Aygun Market",
  "732 Washington",
  "795 Savin",
  "797 Savin",
];

const CADENCES: Cadence[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Semi Annual",
  "Annual",
  "Custom",
];

const ADJUSTMENTS: DueDateAdjustment[] = [
  "None",
  "Next Business Day",
  "Previous Business Day",
];

const seedTasks: Task[] = [];

type TaskForm = Omit<Task, "id" | "seriesKey" | "createdAt" | "updatedAt" | "completedAt">;

const emptyTask: TaskForm = {
  workflow: "Payroll",
  category: "Prepare & Generate Payroll",
  client: "Efes Produce",
  title: "",
  due: "",
  cadence: "Weekly",
  customDays: 30,
  dueDateAdjustment: "None",
  comments: "",
  status: "Not Started",
};

function sortTasks(tasks: Task[]) {
  const cadenceOrder: Record<Cadence, number> = {
    Weekly: 1,
    Monthly: 2,
    Quarterly: 3,
    "Semi Annual": 4,
    Annual: 5,
    Custom: 6,
  };

  return [...tasks].sort((a, b) => {
    const dueCompare = a.due.localeCompare(b.due);
    if (dueCompare !== 0) return dueCompare;

    const workflowCompare = a.workflow.localeCompare(b.workflow);
    if (workflowCompare !== 0) return workflowCompare;

    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare !== 0) return categoryCompare;

    const clientCompare = a.client.localeCompare(b.client);
    if (clientCompare !== 0) return clientCompare;

    const cadenceCompare = cadenceOrder[a.cadence] - cadenceOrder[b.cadence];
    if (cadenceCompare !== 0) return cadenceCompare;

    return a.title.localeCompare(b.title);
  });
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [currentView, setCurrentView] = useState<ViewName>("dashboard");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<TaskForm>(emptyTask);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [workflowFilter, setWorkflowFilter] = useState<Workflow | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "All">("All");
  const [clientFilter, setClientFilter] = useState<ClientName | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");

  const [columnWidths, setColumnWidths] = useState({
    index: 60,
    workflow: 190,
    category: 190,
    client: 160,
    title: 330,
    due: 130,
    cadence: 130,
    status: 130,
    actions: 220,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const totalTasks = tasks.length;
  const onHoldCount = tasks.filter((t) => t.status === "On Hold").length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const weeklyCount = tasks.filter((t) => t.cadence === "Weekly").length;
  const monthlyCount = tasks.filter((t) => t.cadence === "Monthly").length;
  const quarterlyCount = tasks.filter((t) => t.cadence === "Quarterly").length;
  const semiAnnualCount = tasks.filter((t) => t.cadence === "Semi Annual").length;
  const annualCount = tasks.filter((t) => t.cadence === "Annual").length;
  const customCount = tasks.filter((t) => t.cadence === "Custom").length;

  const clients = useMemo(() => {
    const grouped = tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.client] = (acc[task.client] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks]);

  const dashboardRows = useMemo(() => {
    return sortTasks(
      tasks.filter(
        (t) =>
          isThisWeek(t.due) &&
          t.status !== "Completed" &&
          t.status !== "On Hold"
      )
    );
  }, [tasks]);

  const visibleRows = useMemo(() => {
    let list = [...tasks];

    if (currentView === "task-list") {
      list = list.filter((t) => t.status !== "Completed");
    } else if (currentView === "on-hold") {
      list = list.filter((t) => t.status === "On Hold");
    } else if (currentView === "tasks-weekly") {
      list = list.filter((t) => t.cadence === "Weekly" && t.status !== "Completed");
    } else if (currentView === "tasks-monthly") {
      list = list.filter((t) => t.cadence === "Monthly" && t.status !== "Completed");
    } else if (currentView === "tasks-quarterly") {
      list = list.filter((t) => t.cadence === "Quarterly" && t.status !== "Completed");
    } else if (currentView === "tasks-semi-annual") {
      list = list.filter((t) => t.cadence === "Semi Annual" && t.status !== "Completed");
    } else if (currentView === "tasks-annual") {
      list = list.filter((t) => t.cadence === "Annual" && t.status !== "Completed");
    } else if (currentView === "tasks-custom") {
      list = list.filter((t) => t.cadence === "Custom" && t.status !== "Completed");
    }

    if (workflowFilter !== "All") {
      list = list.filter((t) => t.workflow === workflowFilter);
    }

    if (categoryFilter !== "All") {
      list = list.filter((t) => t.category === categoryFilter);
    }

    if (clientFilter !== "All") {
      list = list.filter((t) => t.client === clientFilter);
    }

    if (statusFilter !== "All") {
      list = list.filter((t) => t.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.workflow.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.client.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.comments.toLowerCase().includes(q) ||
          t.cadence.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q)
      );
    }

    return sortTasks(list);
  }, [
    tasks,
    currentView,
    workflowFilter,
    categoryFilter,
    clientFilter,
    statusFilter,
    search,
  ]);

  const setField = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyTask);
    setEditingId(null);
  };

  const addTask = () => {
    if (!form.title.trim() || !form.due) return;
    if (form.cadence === "Custom" && (!form.customDays || form.customDays < 1)) return;

    const trimmedTitle = form.title.trim();

    const task: Task = {
      id: createId(),
      seriesKey: makeSeriesKey({
        workflow: form.workflow,
        category: form.category,
        client: form.client,
        title: trimmedTitle,
        cadence: form.cadence,
        customDays: form.customDays,
        dueDateAdjustment: form.dueDateAdjustment,
      }),
      workflow: form.workflow,
      category: form.category,
      client: form.client,
      title: trimmedTitle,
      due: applyDueDateAdjustment(form.due, form.dueDateAdjustment),
      cadence: form.cadence,
      customDays: form.cadence === "Custom" ? form.customDays : undefined,
      dueDateAdjustment: form.dueDateAdjustment,
      comments: form.comments.trim(),
      status: isThisWeek(form.due) ? "In Progress" : "Not Started",
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => sortTasks([...prev, task]));
    resetForm();
    setShowAddModal(false);
  };

  const openEditModal = (task: Task) => {
    setEditingId(task.id);
    setForm({
      workflow: task.workflow,
      category: task.category,
      client: task.client,
      title: task.title,
      due: task.due,
      cadence: task.cadence,
      customDays: task.customDays ?? 30,
      dueDateAdjustment: task.dueDateAdjustment,
      comments: task.comments,
      status: task.status,
    });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingId || !form.title.trim() || !form.due) return;
    if (form.cadence === "Custom" && (!form.customDays || form.customDays < 1)) return;

    setTasks((prev) =>
      sortTasks(
        prev.map((task) => {
          if (task.id !== editingId) return task;

          const due = applyDueDateAdjustment(form.due, form.dueDateAdjustment);

          return {
            ...task,
            workflow: form.workflow,
            category: form.category,
            client: form.client,
            title: form.title.trim(),
            due,
            cadence: form.cadence,
            customDays: form.cadence === "Custom" ? form.customDays : undefined,
            dueDateAdjustment: form.dueDateAdjustment,
            comments: form.comments.trim(),
            status: form.status,
            seriesKey: makeSeriesKey({
              workflow: form.workflow,
              category: form.category,
              client: form.client,
              title: form.title.trim(),
              cadence: form.cadence,
              customDays: form.customDays,
              dueDateAdjustment: form.dueDateAdjustment,
            }),
            updatedAt: new Date().toISOString(),
          };
        })
      )
    );

    resetForm();
    setShowEditModal(false);
  };

  const moveToOnHold = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "On Hold", updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const moveToActive = (id: string) => {
    setTasks((prev) =>
      sortTasks(
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: isThisWeek(t.due) ? "In Progress" : "Not Started",
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      )
    );
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
              updatedAt: new Date().toISOString(),
            }
          : t
      );

      const nextDue = getNextDueDate(task);

      const nextExists = updated.some(
        (t) =>
          t.seriesKey === task.seriesKey &&
          t.due === nextDue &&
          t.status !== "Completed"
      );

      if (nextExists) return sortTasks(updated);

      const nextTask: Task = {
        id: createId(),
        seriesKey: task.seriesKey,
        workflow: task.workflow,
        category: task.category,
        client: task.client,
        title: task.title,
        due: nextDue,
        cadence: task.cadence,
        customDays: task.customDays,
        dueDateAdjustment: task.dueDateAdjustment,
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
      sortTasks(
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                due: applyDueDateAdjustment(due, t.dueDateAdjustment),
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      )
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
      "Workflow",
      "Category",
      "Client",
      "Job Title",
      "Due",
      "Cadence",
      "Custom Days",
      "Due Date Adjustment",
      "Comments",
      "Status",
      "Series Key",
    ];

    const rows = tasks.map((task) => [
      task.workflow,
      task.category,
      task.client,
      task.title,
      task.due,
      task.cadence,
      task.customDays ?? "",
      task.dueDateAdjustment,
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
      : currentView === "tasks-semi-annual"
      ? "Semi Annual"
      : currentView === "tasks-annual"
      ? "Annual"
      : "Custom";

  const pageSubtitle =
    currentView === "dashboard"
      ? "This week’s active work across all workflows"
      : currentView === "task-list"
      ? "Master repository with filters and editing"
      : currentView === "on-hold"
      ? "Tasks currently paused"
      : currentView === "clients"
      ? "Client overview from the master task list"
      : "Filtered task view";

  const workflowClass = (workflow: Workflow) =>
    `workflow-chip workflow-${slugify(workflow)}`;

  const categoryClass = (category: TaskCategory) =>
    `category-chip category-${slugify(category)}`;

  const clientClass = (client: ClientName) => {
    if (client === "Efes Produce") return "client-chip client-efes";
    if (client === "Bake Fusion") return "client-chip client-bake";
    if (client === "Aygun Market") return "client-chip client-aygun";
    if (client === "732 Washington") return "client-chip client-property";
    if (client === "795 Savin") return "client-chip client-property";
    return "client-chip client-property";
  };

  const cadenceClass = (cadence: Cadence) =>
    `period-chip period-${slugify(cadence)}`;

  const statusClass = (status: Status) => `status-chip status-${slugify(status)}`;

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
          <div className="nav-label">BY CADENCE</div>

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
            <span>🗓 Monthly</span>
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
            className={`nav-btn ${currentView === "tasks-semi-annual" ? "active" : ""}`}
            onClick={() => setCurrentView("tasks-semi-annual")}
          >
            <span>◐ Semi Annual</span>
            <span className="nav-badge">{semiAnnualCount}</span>
          </button>

          <button
            className={`nav-btn ${currentView === "tasks-annual" ? "active" : ""}`}
            onClick={() => setCurrentView("tasks-annual")}
          >
            <span>📋 Annual</span>
            <span className="nav-badge">{annualCount}</span>
          </button>

          <button
            className={`nav-btn ${currentView === "tasks-custom" ? "active" : ""}`}
            onClick={() => setCurrentView("tasks-custom")}
          >
            <span>⚙ Custom</span>
            <span className="nav-badge">{customCount}</span>
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-label">ACTIONS</div>

          <button className="nav-btn" onClick={() => setShowAddModal(true)}>
            <span>＋ Add Task</span>
          </button>

          <button className="nav-btn" onClick={exportCSV}>
            <span>↓ Export CSV</span>
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
        </div>

        {currentView !== "clients" && (
          <div className="search-panel">
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
            />

            <select
              className="filter-select"
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value as Workflow | "All")}
            >
              <option value="All">All Workflows</option>
              {WORKFLOWS.map((workflow) => (
                <option key={workflow} value={workflow}>
                  {workflow}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | "All")}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value as ClientName | "All")}
            >
              <option value="All">All Clients</option>
              {CLIENTS.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | "All")}
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}

        {currentView === "dashboard" ? (
          <div className="panel wide-panel">
            <div className="panel-title">This Week — Active Tasks</div>

            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: columnWidths.workflow }} />
                  <col style={{ width: columnWidths.category }} />
                  <col style={{ width: columnWidths.client }} />
                  <col style={{ width: columnWidths.title }} />
                  <col style={{ width: columnWidths.due }} />
                  <col style={{ width: columnWidths.cadence }} />
                  <col style={{ width: columnWidths.status }} />
                  <col style={{ width: columnWidths.actions }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Category</th>
                    <th>Client</th>
                    <th>Job Title</th>
                    <th>Due</th>
                    <th>Cadence</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboardRows.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <span className={workflowClass(task.workflow)}>
                          {task.workflow}
                        </span>
                      </td>
                      <td>
                        <span className={categoryClass(task.category)}>
                          {task.category}
                        </span>
                      </td>
                      <td>
                        <span className={clientClass(task.client)}>{task.client}</span>
                      </td>
                      <td>{task.title}</td>
                      <td>{formatDisplayDate(task.due)}</td>
                      <td>
                        <span className={cadenceClass(task.cadence)}>
                          {task.cadence}
                        </span>
                      </td>
                      <td>
                        <span className={statusClass(task.status)}>{task.status}</span>
                      </td>
                      <td className="actions">
                        <button className="ghost-small" onClick={() => openEditModal(task)}>
                          Edit
                        </button>
                        <button className="hold-btn" onClick={() => moveToOnHold(task.id)}>
                          On Hold
                        </button>
                        <button className="done-btn" onClick={() => completeTask(task.id)}>
                          Done
                        </button>
                      </td>
                    </tr>
                  ))}

                  {dashboardRows.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 18 }}>
                        No active tasks due this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    <th>Active</th>
                    <th>On Hold</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {CLIENTS.map((client) => {
                    const clientTasks = tasks.filter((t) => t.client === client);
                    const active = clientTasks.filter(
                      (t) => t.status !== "Completed" && t.status !== "On Hold"
                    ).length;
                    const onHold = clientTasks.filter((t) => t.status === "On Hold").length;
                    const completed = clientTasks.filter(
                      (t) => t.status === "Completed"
                    ).length;

                    return (
                      <tr key={client}>
                        <td>
                          <span className={clientClass(client)}>{client}</span>
                        </td>
                        <td>{clientTasks.length}</td>
                        <td>{active}</td>
                        <td>{onHold}</td>
                        <td>{completed}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="panel wide-panel">
            <div className="panel-title">{pageTitle}</div>
            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: columnWidths.index }} />
                  <col style={{ width: columnWidths.workflow }} />
                  <col style={{ width: columnWidths.category }} />
                  <col style={{ width: columnWidths.client }} />
                  <col style={{ width: columnWidths.title }} />
                  <col style={{ width: columnWidths.due }} />
                  <col style={{ width: columnWidths.cadence }} />
                  <col style={{ width: columnWidths.status }} />
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
                      Workflow
                      <span
                        className="resize-handle"
                        onMouseDown={(e) => startResize("workflow", e.clientX)}
                      />
                    </th>
                    <th className="resizable-th">
                      Category
                      <span
                        className="resize-handle"
                        onMouseDown={(e) => startResize("category", e.clientX)}
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
                      Cadence
                      <span
                        className="resize-handle"
                        onMouseDown={(e) => startResize("cadence", e.clientX)}
                      />
                    </th>
                    <th className="resizable-th">
                      Status
                      <span
                        className="resize-handle"
                        onMouseDown={(e) => startResize("status", e.clientX)}
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
                        <span className={workflowClass(task.workflow)}>
                          {task.workflow}
                        </span>
                      </td>
                      <td>
                        <span className={categoryClass(task.category)}>
                          {task.category}
                        </span>
                      </td>
                      <td>
                        <span className={clientClass(task.client)}>{task.client}</span>
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
                        <span className={cadenceClass(task.cadence)}>
                          {task.cadence}
                          {task.cadence === "Custom" && task.customDays
                            ? ` (${task.customDays}d)`
                            : ""}
                        </span>
                      </td>
                      <td>
                        <span className={statusClass(task.status)}>{task.status}</span>
                      </td>
                      <td className="actions">
                        <button className="ghost-small" onClick={() => openEditModal(task)}>
                          Edit
                        </button>

                        {task.status === "On Hold" ? (
                          <button
                            className="ghost-small"
                            onClick={() => moveToActive(task.id)}
                          >
                            Active
                          </button>
                        ) : (
                          <button
                            className="hold-btn"
                            onClick={() => moveToOnHold(task.id)}
                          >
                            On Hold
                          </button>
                        )}

                        <button
                          className="done-btn"
                          onClick={() => completeTask(task.id)}
                          disabled={task.status === "Completed"}
                        >
                          Done
                        </button>

                        <button
                          className="danger-btn"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: 18 }}>
                        No tasks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {(showAddModal || showEditModal) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{showEditModal ? "Edit Task" : "Add New Task"}</h2>
            <p>
              {showEditModal
                ? "Update task details and recurrence settings."
                : "Create a recurring task in the master system."}
            </p>

            <label>Workflow *</label>
            <select
              className="modal-input"
              value={form.workflow}
              onChange={(e) => setField("workflow", e.target.value as Workflow)}
            >
              {WORKFLOWS.map((workflow) => (
                <option key={workflow} value={workflow}>
                  {workflow}
                </option>
              ))}
            </select>

            <label>Category *</label>
            <select
              className="modal-input"
              value={form.category}
              onChange={(e) => setField("category", e.target.value as TaskCategory)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label>Client *</label>
            <select
              className="modal-input"
              value={form.client}
              onChange={(e) => setField("client", e.target.value as ClientName)}
            >
              {CLIENTS.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
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
                <label>Cadence *</label>
                <select
                  className="modal-input"
                  value={form.cadence}
                  onChange={(e) => setField("cadence", e.target.value as Cadence)}
                >
                  {CADENCES.map((cadence) => (
                    <option key={cadence} value={cadence}>
                      {cadence}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.cadence === "Custom" && (
              <>
                <label>Custom Days *</label>
                <input
                  className="modal-input"
                  type="number"
                  min={1}
                  value={form.customDays ?? 30}
                  onChange={(e) =>
                    setField("customDays", Number(e.target.value) || 1)
                  }
                  placeholder="Number of days"
                />
              </>
            )}

            <label>Due-Date Adjustment</label>
            <select
              className="modal-input"
              value={form.dueDateAdjustment}
              onChange={(e) =>
                setField(
                  "dueDateAdjustment",
                  e.target.value as DueDateAdjustment
                )
              }
            >
              {ADJUSTMENTS.map((adjustment) => (
                <option key={adjustment} value={adjustment}>
                  {adjustment}
                </option>
              ))}
            </select>

            {showEditModal && (
              <>
                <label>Status</label>
                <select
                  className="modal-input"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as Status)}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </>
            )}

            <label>Comments</label>
            <textarea
              className="modal-input"
              rows={4}
              value={form.comments}
              onChange={(e) => setField("comments", e.target.value)}
              placeholder="Optional notes"
            />

            <div className="modal-actions">
              <button
                className="ghost-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={showEditModal ? saveEdit : addTask}
              >
                {showEditModal ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
        workflow: task.workflow || "Payroll",
        category: task.category || "Prepare & Generate Payroll",
        client: task.client || "Efes Produce",
        dueDateAdjustment: task.dueDateAdjustment || "None",
        cadence: task.cadence || "Weekly",
        customDays: task.cadence === "Custom" ? task.customDays || 30 : undefined,
        seriesKey:
          task.seriesKey ||
          makeSeriesKey({
            workflow: task.workflow || "Payroll",
            category: task.category || "Prepare & Generate Payroll",
            client: task.client || "Efes Produce",
            title: task.title || "",
            cadence: task.cadence || "Weekly",
            customDays: task.customDays || 30,
            dueDateAdjustment: task.dueDateAdjustment || "None",
          }),
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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}

function makeSeriesKey(task: {
  workflow?: string;
  category?: string;
  client?: string;
  title?: string;
  cadence?: string;
  customDays?: number;
  dueDateAdjustment?: string;
}) {
  return [
    task.workflow ?? "",
    task.category ?? "",
    task.client ?? "",
    task.title ?? "",
    task.cadence ?? "",
    task.customDays ?? "",
    task.dueDateAdjustment ?? "",
  ]
    .map((value) => String(value).trim().toLowerCase().replace(/\s+/g, "-"))
    .join("|");
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

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function adjustToBusinessDay(date: Date, adjustment: DueDateAdjustment) {
  const adjusted = new Date(date);

  if (adjustment === "None") return adjusted;

  while (isWeekend(adjusted)) {
    if (adjustment === "Next Business Day") {
      adjusted.setDate(adjusted.getDate() + 1);
    } else {
      adjusted.setDate(adjusted.getDate() - 1);
    }
  }

  return adjusted;
}

function applyDueDateAdjustment(dateStr: string, adjustment: DueDateAdjustment) {
  const raw = new Date(`${dateStr}T00:00:00`);
  const adjusted = adjustToBusinessDay(raw, adjustment);
  return formatDate(adjusted);
}

function addCadence(dateStr: string, cadence: Cadence, customDays?: number) {
  const date = new Date(`${dateStr}T00:00:00`);

  if (cadence === "Weekly") {
    date.setDate(date.getDate() + 7);
  } else if (cadence === "Monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (cadence === "Quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else if (cadence === "Semi Annual") {
    date.setMonth(date.getMonth() + 6);
  } else if (cadence === "Annual") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setDate(date.getDate() + (customDays || 30));
  }

  return formatDate(date);
}

function getNextDueDate(task: Task) {
  const nextRaw = addCadence(task.due, task.cadence, task.customDays);
  return applyDueDateAdjustment(nextRaw, task.dueDateAdjustment);
}

export default App;