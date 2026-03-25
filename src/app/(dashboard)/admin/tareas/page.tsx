"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trash2,
  Pencil,
  X,
  Zap,
  Calendar,
  Users,
  BookOpen,
  Mail,
  BarChart3,
  Target,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Filter,
  LayoutList,
  Columns3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────
type UserRef = { id: string; firstName: string; lastName: string; photo?: string | null };
type CohortRef = { id: string; name: string; program: string };

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  assignedTo: UserRef | null;
  createdBy: UserRef;
  cohort: CohortRef | null;
  triggerType: string;
  triggerConfig: Record<string, unknown> | null;
  completedAt: string | null;
  createdAt: string;
};

type CohortOption = { id: string; name: string; program: string; status: string };
type AssignableUser = { id: string; firstName: string; lastName: string; role: string; photo?: string | null };

// ── Constants ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "mentorias", label: "Mentorías", icon: <Calendar size={14} />, color: "bg-blue-100 text-blue-700" },
  { value: "contenido", label: "Contenido", icon: <BookOpen size={14} />, color: "bg-purple-100 text-purple-700" },
  { value: "alumnos", label: "Alumnos", icon: <Users size={14} />, color: "bg-green-100 text-green-700" },
  { value: "comunicacion", label: "Comunicación", icon: <Mail size={14} />, color: "bg-cyan-100 text-cyan-700" },
  { value: "kpis", label: "KPIs", icon: <BarChart3 size={14} />, color: "bg-amber-100 text-amber-700" },
  { value: "general", label: "General", icon: <Target size={14} />, color: "bg-gray-100 text-gray-700" },
];

const PRIORITIES = [
  { value: "LOW", label: "Baja", color: "text-gray-400" },
  { value: "MEDIUM", label: "Media", color: "text-blue-500" },
  { value: "HIGH", label: "Alta", color: "text-orange-500" },
  { value: "URGENT", label: "Urgente", color: "text-red-600" },
];

const TRIGGER_TYPES = [
  { value: "MANUAL", label: "Manual", desc: "Se marca a mano" },
  { value: "MENTORIAS_SCHEDULED", label: "Mentorías programadas", desc: "Se autocompleta cuando la cohorte tiene mentorías" },
  { value: "CEREBRO_DOCS_UPLOADED", label: "Docs en Cerebro FR", desc: "Se autocompleta cuando hay docs subidos" },
  { value: "MESSAGES_SENT", label: "Mensajes enviados", desc: "Se autocompleta cuando se envían mensajes a la cohorte" },
  { value: "KPI_REVIEW", label: "KPIs revisados", desc: "Se autocompleta cuando todos los alumnos tienen KPIs" },
  { value: "ALUMNOS_ONBOARDED", label: "Onboarding completo", desc: "Se autocompleta cuando todos completaron onboarding" },
  { value: "STEPS_VALIDATED", label: "Pasos validados", desc: "Se autocompleta cuando se validan outputs de un paso" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));
const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((p) => [p.value, p]));

function getCategoryConfig(cat: string) {
  return CATEGORY_MAP[cat] ?? CATEGORIES[CATEGORIES.length - 1];
}

function timeUntilDue(dateStr: string | null): { label: string; urgent: boolean } | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d atrasada`, urgent: true };
  if (days === 0) return { label: "Hoy", urgent: true };
  if (days === 1) return { label: "Mañana", urgent: false };
  return { label: `${days}d`, urgent: false };
}

// ── Avatar component ───────────────────────────────────────────────────
function Avatar({ user, size = 24 }: { user: UserRef | null; size?: number }) {
  if (!user) return null;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const px = `${size}px`;

  if (user.photo) {
    return (
      <img
        src={user.photo}
        alt={`${user.firstName} ${user.lastName}`}
        className="shrink-0 rounded-full object-cover"
        style={{ width: px, height: px }}
        title={`${user.firstName} ${user.lastName}`}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600"
      style={{ width: px, height: px, fontSize: `${Math.round(size * 0.4)}px` }}
      title={`${user.firstName} ${user.lastName}`}
    >
      {initials}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════
export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoCompleted, setAutoCompleted] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [filterPerson, setFilterPerson] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTasks = useCallback(() => {
    fetch("/api/admin/tareas")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.tasks ?? []);
        setAssignableUsers(data.assignableUsers ?? []);
        setCohorts(data.cohorts ?? []);
        if (data.autoCompleted?.length > 0) {
          setAutoCompleted(data.autoCompleted);
          setTimeout(() => setAutoCompleted([]), 5000);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusToggle = async (task: Task) => {
    const nextStatus =
      task.status === "COMPLETED"
        ? "PENDING"
        : task.status === "PENDING"
          ? "IN_PROGRESS"
          : "COMPLETED";

    const res = await fetch(`/api/admin/tareas/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) fetchTasks();
  };

  const handleStatusChange = async (task: Task, newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED") => {
    if (task.status === newStatus) return;
    const res = await fetch(`/api/admin/tareas/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const res = await fetch(`/api/admin/tareas/${id}`, { method: "DELETE" });
    if (res.ok) fetchTasks();
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  // Filter logic — in kanban mode always show all statuses in their columns
  const filteredTasks = tasks.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (viewMode === "list") {
      if (filterStatus === "active" && t.status === "COMPLETED") return false;
      if (filterStatus === "completed" && t.status !== "COMPLETED") return false;
    }
    if (filterPerson !== "all") {
      if (filterPerson === "unassigned") {
        if (t.assignedTo) return false;
      } else {
        if (t.assignedTo?.id !== filterPerson) return false;
      }
    }
    return true;
  });

  const pendingTasks = filteredTasks.filter((t) => t.status === "PENDING");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = filteredTasks.filter((t) => t.status === "COMPLETED");

  // Stats
  const totalPending = tasks.filter((t) => t.status === "PENDING").length;
  const totalInProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const totalCompleted = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdue = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Tareas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tareas de la academia · auto-verificación activada
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md p-1.5 transition-all",
                viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
              title="Vista lista"
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "rounded-md p-1.5 transition-all",
                viewMode === "kanban" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
              )}
              title="Vista Kanban"
            >
              <Columns3 size={18} />
            </button>
          </div>
          <button
            onClick={() => { setEditingTask(null); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Nueva tarea
          </button>
        </div>
      </div>

      {/* Auto-completed banner */}
      {autoCompleted.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <Sparkles size={18} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">
            {autoCompleted.length === 1
              ? "1 tarea se ha auto-completado"
              : `${autoCompleted.length} tareas se han auto-completado`}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="mb-5 grid grid-cols-4 gap-3">
        {[
          { label: "Pendientes", value: totalPending, icon: <Circle size={16} />, color: "text-gray-500 bg-gray-50" },
          { label: "En progreso", value: totalInProgress, icon: <Clock size={16} />, color: "text-blue-600 bg-blue-50" },
          { label: "Completadas", value: totalCompleted, icon: <CheckCircle2 size={16} />, color: "text-green-600 bg-green-50" },
          { label: "Atrasadas", value: overdue, icon: <AlertTriangle size={16} />, color: overdue > 0 ? "text-red-600 bg-red-50" : "text-gray-400 bg-gray-50" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <div className={cn("rounded-lg p-1.5", s.color)}>{s.icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] font-medium text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter size={14} />
          <span>Filtrar:</span>
        </div>
        {/* Status filter */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {[
            { key: "active", label: "Activas" },
            { key: "all", label: "Todas" },
            { key: "completed", label: "Hechas" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                filterStatus === f.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
        >
          <option value="all">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {/* Person filter */}
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-gray-400" />
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setFilterPerson("all")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                filterPerson === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700"
              )}
            >
              Todos
            </button>
            {assignableUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => setFilterPerson(filterPerson === u.id ? "all" : u.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-all",
                  filterPerson === u.id
                    ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                title={`${u.firstName} ${u.lastName}`}
              >
                <Avatar user={u} size={20} />
                <span>{u.firstName}</span>
              </button>
            ))}
            <button
              onClick={() => setFilterPerson(filterPerson === "unassigned" ? "all" : "unassigned")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                filterPerson === "unassigned"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700"
              )}
            >
              Sin asignar
            </button>
          </div>
        </div>
      </div>

      {/* Views */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <Target size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-600">No hay tareas en esta vista</p>
          <p className="mt-1 text-sm text-gray-500">Crea una nueva tarea con el botón de arriba</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* ── KANBAN VIEW ─────────────────────────────────────────────── */
        <div className="grid grid-cols-3 gap-4">
          <KanbanColumn
            title="Pendientes"
            icon={<Circle size={16} className="text-gray-400" />}
            tasks={pendingTasks}
            status="PENDING"
            color="border-gray-200"
            autoCompleted={autoCompleted}
            onToggle={handleStatusToggle}
            onStatusChange={handleStatusChange}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <KanbanColumn
            title="En progreso"
            icon={<Clock size={16} className="text-blue-500" />}
            tasks={inProgressTasks}
            status="IN_PROGRESS"
            color="border-blue-200"
            autoCompleted={autoCompleted}
            onToggle={handleStatusToggle}
            onStatusChange={handleStatusChange}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <KanbanColumn
            title="Completadas"
            icon={<CheckCircle2 size={16} className="text-green-500" />}
            tasks={completedTasks}
            status="COMPLETED"
            color="border-green-200"
            autoCompleted={autoCompleted}
            onToggle={handleStatusToggle}
            onStatusChange={handleStatusChange}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        /* ── LIST VIEW ───────────────────────────────────────────────── */
        <div className="space-y-6">
          {inProgressTasks.length > 0 && (
            <TaskSection
              title="En progreso"
              icon={<Clock size={16} className="text-blue-600" />}
              tasks={inProgressTasks}
              autoCompleted={autoCompleted}
              onToggle={handleStatusToggle}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          {pendingTasks.length > 0 && (
            <TaskSection
              title="Pendientes"
              icon={<Circle size={16} className="text-gray-400" />}
              tasks={pendingTasks}
              autoCompleted={autoCompleted}
              onToggle={handleStatusToggle}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          {completedTasks.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <CheckCircle2 size={16} className="text-green-500" />
                Completadas ({completedTasks.length})
              </button>
              {showCompleted && (
                <TaskSection
                  title=""
                  tasks={completedTasks}
                  autoCompleted={autoCompleted}
                  onToggle={handleStatusToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  dimmed
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TaskFormModal
          task={editingTask}
          assignableUsers={assignableUsers}
          cohorts={cohorts}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchTasks(); }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// KANBAN COLUMN
// ════════════════════════════════════════════════════════════════════════
function KanbanColumn({
  title,
  icon,
  tasks,
  status,
  color,
  autoCompleted,
  onToggle,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  color: string;
  autoCompleted: string[];
  onToggle: (t: Task) => void;
  onStatusChange: (t: Task, s: "PENDING" | "IN_PROGRESS" | "COMPLETED") => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn("rounded-xl border-2 bg-gray-50/50 p-3", color)}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-blue-50/50"); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove("bg-blue-50/50"); }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("bg-blue-50/50");
        const taskId = e.dataTransfer.getData("taskId");
        const task = tasks.find((t) => t.id === taskId);
        if (!task) {
          // Task is from another column, find it globally
          const draggedTask = JSON.parse(e.dataTransfer.getData("task") || "null");
          if (draggedTask) onStatusChange(draggedTask, status);
        }
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-500 shadow-sm">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            wasAutoCompleted={autoCompleted.includes(task.id)}
            onToggle={() => onToggle(task)}
            onStatusChange={(s) => onStatusChange(task, s)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// KANBAN CARD
// ════════════════════════════════════════════════════════════════════════
function KanbanCard({
  task,
  wasAutoCompleted,
  onToggle,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: Task;
  wasAutoCompleted: boolean;
  onToggle: () => void;
  onStatusChange: (s: "PENDING" | "IN_PROGRESS" | "COMPLETED") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = getCategoryConfig(task.category);
  const pri = PRIORITY_MAP[task.priority] ?? PRIORITIES[1];
  const due = timeUntilDue(task.dueDate);
  const isAutomatic = task.triggerType !== "MANUAL";
  const isDone = task.status === "COMPLETED";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.setData("task", JSON.stringify(task));
        e.currentTarget.classList.add("opacity-50");
      }}
      onDragEnd={(e) => { e.currentTarget.classList.remove("opacity-50"); }}
      className={cn(
        "group cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
        wasAutoCompleted ? "border-green-300 bg-green-50/50 animate-pulse" : "border-gray-200",
        isDone && "opacity-60"
      )}
    >
      {/* Top: priority + actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] font-semibold", pri.color)}>●</span>
          <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium", cat.color)}>
            {cat.icon}
            {cat.label}
          </span>
          {isAutomatic && (
            <span className="flex items-center gap-0.5 rounded bg-violet-100 px-1 py-0.5 text-[8px] font-medium text-violet-700">
              <Zap size={7} />
              Auto
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className={cn("mt-2 text-sm font-medium leading-tight", isDone ? "text-gray-400 line-through" : "text-gray-900")}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{task.description}</p>
      )}

      {/* Bottom: assignee + due + cohort */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <Avatar user={task.assignedTo} size={22} />
              <span className="text-[10px] font-medium text-gray-600">{task.assignedTo.firstName}</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-400">Sin asignar</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.cohort && (
            <span className="truncate max-w-[80px] rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500">
              {task.cohort.name}
            </span>
          )}
          {due && (
            <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", due.urgent ? "text-red-500" : "text-gray-400")}>
              <Calendar size={9} />
              {due.label}
            </span>
          )}
        </div>
      </div>

      {/* Quick status buttons */}
      <div className="mt-2 flex gap-1 border-t border-gray-100 pt-2">
        {(["PENDING", "IN_PROGRESS", "COMPLETED"] as const).map((s) => {
          const isActive = task.status === s;
          const labels = { PENDING: "Pendiente", IN_PROGRESS: "En progreso", COMPLETED: "Hecha" };
          const colors = {
            PENDING: isActive ? "bg-gray-200 text-gray-700" : "text-gray-400 hover:bg-gray-100",
            IN_PROGRESS: isActive ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:bg-blue-50",
            COMPLETED: isActive ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-green-50",
          };
          return (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={cn("flex-1 rounded px-1.5 py-1 text-[9px] font-medium transition-all", colors[s])}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TASK SECTION (list view)
// ════════════════════════════════════════════════════════════════════════
function TaskSection({
  title,
  icon,
  tasks,
  autoCompleted,
  onToggle,
  onEdit,
  onDelete,
  dimmed,
}: {
  title: string;
  icon?: React.ReactNode;
  tasks: Task[];
  autoCompleted: string[];
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  dimmed?: boolean;
}) {
  return (
    <div>
      {title && (
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          {title} ({tasks.length})
        </div>
      )}
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            wasAutoCompleted={autoCompleted.includes(task.id)}
            onToggle={() => onToggle(task)}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
            dimmed={dimmed}
          />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TASK ROW (list view)
// ════════════════════════════════════════════════════════════════════════
function TaskRow({
  task,
  wasAutoCompleted,
  onToggle,
  onEdit,
  onDelete,
  dimmed,
}: {
  task: Task;
  wasAutoCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  dimmed?: boolean;
}) {
  const cat = getCategoryConfig(task.category);
  const pri = PRIORITY_MAP[task.priority] ?? PRIORITIES[1];
  const due = timeUntilDue(task.dueDate);
  const isAutomatic = task.triggerType !== "MANUAL";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all hover:shadow-sm",
        wasAutoCompleted
          ? "border-green-300 bg-green-50/50 animate-pulse"
          : task.status === "IN_PROGRESS"
            ? "border-blue-200"
            : "border-gray-200",
        dimmed && "opacity-60"
      )}
    >
      {/* Status checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 transition-transform hover:scale-110"
        title={
          task.status === "COMPLETED"
            ? "Marcar como pendiente"
            : task.status === "PENDING"
              ? "Marcar en progreso"
              : "Marcar como completada"
        }
      >
        {task.status === "COMPLETED" ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : task.status === "IN_PROGRESS" ? (
          <Clock size={20} className="text-blue-500" />
        ) : (
          <Circle size={20} className="text-gray-300 hover:text-blue-400" />
        )}
      </button>

      {/* Assignee avatar */}
      <Avatar user={task.assignedTo} size={28} />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              task.status === "COMPLETED" ? "text-gray-400 line-through" : "text-gray-900"
            )}
          >
            {task.title}
          </span>
          {isAutomatic && (
            <span className="flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-700" title="Se auto-verifica">
              <Zap size={8} />
              Auto
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", cat.color)}>
            {cat.icon}
            {cat.label}
          </span>
          <span className={cn("text-[10px] font-medium", pri.color)}>
            ● {pri.label}
          </span>
          {task.cohort && (
            <span className="text-[10px] text-gray-400">{task.cohort.name}</span>
          )}
          {task.assignedTo && (
            <span className="text-[10px] text-gray-500">→ {task.assignedTo.firstName}</span>
          )}
          {due && (
            <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", due.urgent ? "text-red-500" : "text-gray-400")}>
              <Calendar size={9} />
              {due.label}
            </span>
          )}
          {task.description && (
            <span className="truncate text-[10px] text-gray-400 max-w-[200px]">{task.description}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// FORM MODAL
// ════════════════════════════════════════════════════════════════════════
function TaskFormModal({
  task,
  assignableUsers,
  cohorts,
  onClose,
  onSaved,
}: {
  task: Task | null;
  assignableUsers: AssignableUser[];
  cohorts: CohortOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!task;
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [category, setCategory] = useState(task?.category ?? "general");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [assignedToId, setAssignedToId] = useState(task?.assignedTo?.id ?? "");
  const [cohortId, setCohortId] = useState(task?.cohort?.id ?? "");
  const [triggerType, setTriggerType] = useState(task?.triggerType ?? "MANUAL");
  const [triggerMinSessions, setTriggerMinSessions] = useState(
    (task?.triggerConfig as Record<string, unknown>)?.minSessions as number ?? 4
  );
  const [triggerMinDocs, setTriggerMinDocs] = useState(
    (task?.triggerConfig as Record<string, unknown>)?.minDocs as number ?? 1
  );
  const [triggerStepNumber, setTriggerStepNumber] = useState(
    (task?.triggerConfig as Record<string, unknown>)?.stepNumber as number ?? 1
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);

    let triggerConfig: Record<string, unknown> | null = null;
    if (triggerType === "MENTORIAS_SCHEDULED") {
      triggerConfig = { minSessions: triggerMinSessions };
    } else if (triggerType === "CEREBRO_DOCS_UPLOADED") {
      triggerConfig = { minDocs: triggerMinDocs, stepNumber: triggerStepNumber || undefined };
    } else if (triggerType === "MESSAGES_SENT") {
      triggerConfig = { minMessages: 1 };
    } else if (triggerType === "STEPS_VALIDATED") {
      triggerConfig = { stepNumber: triggerStepNumber };
    }

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      dueDate: dueDate || null,
      assignedToId: assignedToId || null,
      cohortId: cohortId || null,
      triggerType,
      triggerConfig,
    };

    const url = isEdit ? `/api/admin/tareas/${task.id}` : "/api/admin/tareas";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) onSaved();
  };

  const needsCohort = [
    "MENTORIAS_SCHEDULED",
    "MESSAGES_SENT",
    "KPI_REVIEW",
    "ALUMNOS_ONBOARDED",
    "STEPS_VALIDATED",
  ].includes(triggerType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Programar mentorías de mayo para Cohorte ACTIVA"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned to - with avatars */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Asignar a</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAssignedToId("")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  !assignedToId ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                Sin asignar
              </button>
              {assignableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setAssignedToId(u.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    assignedToId === u.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <Avatar user={u} size={22} />
                  {u.firstName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Fecha límite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Cohorte relacionada</label>
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Ninguna</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.program})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-verification */}
          <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-violet-700">
              <Zap size={12} />
              Auto-verificación
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="mb-2 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-violet-600">
              {TRIGGER_TYPES.find((t) => t.value === triggerType)?.desc}
            </p>

            {triggerType === "MENTORIAS_SCHEDULED" && (
              <div className="mt-2">
                <label className="text-[10px] text-violet-600">Mínimo de sesiones programadas</label>
                <input
                  type="number"
                  min={1}
                  value={triggerMinSessions}
                  onChange={(e) => setTriggerMinSessions(parseInt(e.target.value) || 1)}
                  className="mt-0.5 w-20 rounded border border-violet-200 bg-white px-2 py-1 text-xs"
                />
              </div>
            )}
            {triggerType === "CEREBRO_DOCS_UPLOADED" && (
              <div className="mt-2 flex gap-3">
                <div>
                  <label className="text-[10px] text-violet-600">Mín. docs</label>
                  <input
                    type="number"
                    min={1}
                    value={triggerMinDocs}
                    onChange={(e) => setTriggerMinDocs(parseInt(e.target.value) || 1)}
                    className="mt-0.5 w-16 rounded border border-violet-200 bg-white px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-violet-600">Paso (opcional)</label>
                  <input
                    type="number"
                    min={0}
                    max={16}
                    value={triggerStepNumber}
                    onChange={(e) => setTriggerStepNumber(parseInt(e.target.value) || 0)}
                    className="mt-0.5 w-16 rounded border border-violet-200 bg-white px-2 py-1 text-xs"
                  />
                </div>
              </div>
            )}
            {triggerType === "STEPS_VALIDATED" && (
              <div className="mt-2">
                <label className="text-[10px] text-violet-600">Paso a validar</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={triggerStepNumber}
                  onChange={(e) => setTriggerStepNumber(parseInt(e.target.value) || 1)}
                  className="mt-0.5 w-16 rounded border border-violet-200 bg-white px-2 py-1 text-xs"
                />
              </div>
            )}

            {needsCohort && !cohortId && (
              <p className="mt-2 text-[10px] font-medium text-red-500">
                ⚠ Selecciona una cohorte arriba para que el auto-check funcione
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader size={14} className="animate-spin" />}
              {isEdit ? "Guardar" : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
