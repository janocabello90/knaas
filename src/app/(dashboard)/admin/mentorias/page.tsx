"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Video,
  Clock,
  Users,
  Loader,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  PlayCircle,
  Filter,
  Target,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Attendee = {
  id: string;
  attended: boolean;
  user: { id: string; firstName: string; lastName: string; photo: string | null };
};

type Session = {
  id: string;
  title: string;
  date: string;
  stepNumber: number | null;
  zoomLink: string | null;
  expertName: string | null;
  objectives: string | null;
  summary: string | null;
  recordingUrl: string | null;
  cohortId: string;
  cohort: { name: string; program: string };
  attendees: Attendee[];
};

type CohortOption = { id: string; name: string; program: string };

type FormData = {
  title: string;
  cohortId: string;
  date: string;
  stepNumber: string;
  zoomLink: string;
  expertName: string;
  objectives: string;
  summary: string;
  recordingUrl: string;
};

const emptyForm: FormData = {
  title: "",
  cohortId: "",
  date: "",
  stepNumber: "",
  zoomLink: "",
  expertName: "",
  objectives: "",
  summary: "",
  recordingUrl: "",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMentoriasPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCohort, setFilterCohort] = useState("");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState("");

  const fetchData = (cohortId?: string) => {
    setLoading(true);
    const url = cohortId ? `/api/admin/mentorias?cohortId=${cohortId}` : "/api/admin/mentorias";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setCohorts(data.cohorts ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilterChange = (cohortId: string) => {
    setFilterCohort(cohortId);
    fetchData(cohortId || undefined);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (s: Session) => {
    setForm({
      title: s.title,
      cohortId: s.cohortId || "",
      date: new Date(s.date).toISOString().slice(0, 16),
      stepNumber: s.stepNumber ? String(s.stepNumber) : "",
      zoomLink: s.zoomLink ?? "",
      expertName: s.expertName ?? "",
      objectives: s.objectives ?? "",
      summary: s.summary ?? "",
      recordingUrl: s.recordingUrl ?? "",
    });
    setEditingId(s.id);
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (!form.title.trim()) { setError("El título es obligatorio"); setSaving(false); return; }
      if (!form.date) { setError("La fecha es obligatoria"); setSaving(false); return; }

      const payload = {
        title: form.title,
        date: form.date,
        stepNumber: form.stepNumber ? parseInt(form.stepNumber) : null,
        zoomLink: form.zoomLink,
        expertName: form.expertName,
        objectives: form.objectives,
        summary: form.summary,
        recordingUrl: form.recordingUrl,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/mentorias/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al actualizar");
      } else {
        if (!form.cohortId) { setError("Selecciona una cohorte"); setSaving(false); return; }
        const res = await fetch("/api/admin/mentorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, cohortId: form.cohortId }),
        });
        if (!res.ok) throw new Error("Error al crear");
      }

      setShowForm(false);
      fetchData(filterCohort || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/mentorias/${deleteId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== deleteId));
    } catch (err) { console.error(err); }
    setDeleteId(null);
  };

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.date) >= now);
  const past = sessions.filter((s) => new Date(s.date) < now);

  // Check if a past session is missing recording/summary (needs attention)
  const needsAttention = (s: Session) => new Date(s.date) < now && (!s.recordingUrl || !s.summary);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorías</h1>
          <p className="mt-1 text-sm text-gray-500">
            {sessions.length} sesión{sessions.length !== 1 ? "es" : ""}
            {past.filter(needsAttention).length > 0 && (
              <span className="ml-2 text-amber-600">
                · {past.filter(needsAttention).length} sin completar
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterCohort}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas las cohortes</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.program})</option>
              ))}
            </select>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Nueva sesión
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={24} className="animate-spin text-blue-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-600">No hay sesiones de mentoría</p>
          <button onClick={openCreate} className="mt-3 text-sm font-medium text-blue-600 hover:underline">
            Crear la primera
          </button>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-600">
                Próximas ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <SessionCard key={s.id} session={s} onEdit={openEdit} onDelete={setDeleteId} />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Pasadas ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((s) => (
                  <SessionCard key={s.id} session={s} onEdit={openEdit} onDelete={setDeleteId} isPast needsAttention={needsAttention(s)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Editar sesión" : "Nueva sesión de mentoría"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Mentoría grupal — Paso 3: Pricing"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Cohort (shown in both create AND edit) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Cohorte {!editingId && "*"}
                  {editingId && <span className="text-xs text-gray-400 ml-1">(no editable)</span>}
                </label>
                <select
                  value={form.cohortId}
                  onChange={(e) => setForm((p) => ({ ...p, cohortId: e.target.value }))}
                  disabled={!!editingId}
                  className={cn(
                    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none",
                    editingId && "bg-gray-50 text-gray-500"
                  )}
                >
                  <option value="">Selecciona cohorte</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.program})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">Paso (1-16)</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={form.stepNumber}
                    onChange={(e) => setForm((p) => ({ ...p, stepNumber: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Enlace Zoom / Meet</label>
                <input
                  type="url"
                  value={form.zoomLink}
                  onChange={(e) => setForm((p) => ({ ...p, zoomLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Experto invitado</label>
                <input
                  type="text"
                  value={form.expertName}
                  onChange={(e) => setForm((p) => ({ ...p, expertName: e.target.value }))}
                  placeholder="Nombre del experto (si aplica)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Objectives — NEW */}
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <Target size={14} className="text-blue-500" />
                  Objetivos de la sesión
                </label>
                <textarea
                  value={form.objectives}
                  onChange={(e) => setForm((p) => ({ ...p, objectives: e.target.value }))}
                  rows={3}
                  placeholder="¿Qué se va a trabajar en esta sesión? Objetivos clave..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Post-session section */}
              <div className="border-t border-gray-200 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Post-sesión (rellenar después)
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <FileText size={14} className="text-green-500" />
                      Resumen / Notas
                    </label>
                    <textarea
                      value={form.summary}
                      onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                      rows={3}
                      placeholder="Resumen de la sesión, puntos clave, tareas..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <PlayCircle size={14} className="text-red-500" />
                      URL de la grabación
                    </label>
                    <input
                      type="url"
                      value={form.recordingUrl}
                      onChange={(e) => setForm((p) => ({ ...p, recordingUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear sesión"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">¿Eliminar sesión?</h3>
            <p className="mt-2 text-sm text-gray-600">Esta acción no se puede deshacer.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session: s,
  onEdit,
  onDelete,
  isPast = false,
  needsAttention = false,
}: {
  session: Session;
  onEdit: (s: Session) => void;
  onDelete: (id: string) => void;
  isPast?: boolean;
  needsAttention?: boolean;
}) {
  const isToday = new Date(s.date).toDateString() === new Date().toDateString();

  return (
    <div
      className={cn(
        "group rounded-xl border bg-white p-5 transition-shadow hover:shadow-md",
        isToday ? "border-blue-200 ring-2 ring-blue-100" :
        needsAttention ? "border-amber-200 bg-amber-50/30" :
        isPast ? "border-gray-200 opacity-80" : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
            {isToday && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">HOY</span>
            )}
            {needsAttention && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                Falta grabación/resumen
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(s.date)}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
              {s.cohort.name} · {s.cohort.program}
            </span>
            {s.stepNumber && (
              <span className="text-gray-400">Paso {s.stepNumber}</span>
            )}
            {s.expertName && (
              <span className="flex items-center gap-1 text-violet-600">
                <Users size={12} />
                {s.expertName}
              </span>
            )}
          </div>

          {/* Objectives */}
          {s.objectives && (
            <div className="mt-2 flex items-start gap-1.5">
              <Target size={12} className="mt-0.5 shrink-0 text-blue-500" />
              <p className="line-clamp-2 text-xs text-blue-700">{s.objectives}</p>
            </div>
          )}

          {s.summary && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-600">{s.summary}</p>
          )}

          {/* Action links */}
          <div className="mt-3 flex items-center gap-3">
            {s.zoomLink && (
              <a
                href={s.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <Video size={12} />
                Unirse
                <ExternalLink size={10} />
              </a>
            )}
            {s.recordingUrl && (
              <a
                href={s.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:underline"
              >
                <PlayCircle size={12} />
                Grabación
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {/* Edit/Delete */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(s)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(s.id)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
