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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────
type UserRef = { id: string; firstName: string; lastName: string };
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
type AssignableUser = { id: string; firstName: string; lastName: string; role: string };

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
  const [filterStatus, setFilterStatus] = useState<string>("active"); // "active" | "all" | "completed"
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

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterStatus === "active" && t.status === "COMPLETED") return false;
    if (filterStatus === "completed" && t.status !== "COMPLETED") return false;
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
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          Nueva tarea
        </button>
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
      <div className="mb-4 flex items-center gap-3">
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
      </div>

      {/* Task sections */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <Target size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-600">No hay tareas en esta vista</p>
          <p className="mt-1 text-sm text-gray-500">Crea una nueva tarea con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* In Progress */}
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

          {/* Pending */}
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

          {/* Completed */}
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
// TASK SECTION
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
// TASK ROW
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
          {/* Category badge */}
          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", cat.color)}>
            {cat.icon}
            {cat.label}
          </span>
          {/* Priority dot */}
          <span className={cn("text-[10px] font-medium", pri.color)}>
            ● {pri.label}
          </span>
          {/* Cohort */}
          {task.cohort && (
            <span className="text-[10px] text-gray-400">
              {task.cohort.name}
            </span>
          )}
          {/* Assigned */}
          {task.assignedTo && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
              → {task.assignedTo.firstName}
            </span>
          )}
          {/* Due date */}
          {due && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px] font-medium",
                due.urgent ? "text-red-500" : "text-gray-400"
              )}
            >
              <Calendar size={9} />
              {due.label}
            </span>
          )}
          {/* Description preview */}
          {task.description && (
            <span className="truncate text-[10px] text-gray-400 max-w-[200px]">
              {task.description}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
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

    // Build trigger config
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
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
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
          {/* Title */}
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

          {/* Description */}
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

          {/* Category + Priority */}
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

          {/* Assigned + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Asignar a</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Sin asignar</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Fecha límite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cohort */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cohorte relacionada</label>
            <select
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Ninguna</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.program})
                </option>
              ))}
            </select>
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

            {/* Trigger-specific config */}
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

          {/* Submit */}
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
