"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Plus,
  Trash2,
  X,
  Users,
  User,
  Loader,
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MessageItem = {
  id: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  from: { id: string; firstName: string; lastName: string; photo: string | null; role: string };
  to: { id: string; firstName: string; lastName: string; photo: string | null } | null;
  cohort: { id: string; name: string; program: string } | null;
};

type CohortOption = { id: string; name: string; program: string };

type StudentOption = { id: string; firstName: string; lastName: string; email: string; cohortName: string };

export default function AdminMensajesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCohort, setFilterCohort] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compose modal
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState<"cohort" | "direct">("cohort");
  const [form, setForm] = useState({
    subject: "",
    content: "",
    cohortId: "",
    toId: "",
  });

  useEffect(() => {
    fetchMessages();
    fetchStudents();
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch("/api/admin/mensajes");
      const data = await res.json();
      setMessages(data.messages || []);
      setCohorts(data.cohorts || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch("/api/admin/alumnos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(
          data.map((a: { id: string; firstName: string; lastName: string; email: string; enrollments?: { cohort?: { name: string } }[] }) => ({
            id: a.id,
            firstName: a.firstName,
            lastName: a.lastName,
            email: a.email,
            cohortName: a.enrollments?.[0]?.cohort?.name || "",
          }))
        );
      }
    } catch {
      // Students list is optional, non-critical
    }
  }

  async function handleSend() {
    if (!form.subject.trim() || !form.content.trim()) return;
    if (sendMode === "cohort" && !form.cohortId) return;
    if (sendMode === "direct" && !form.toId) return;

    setSending(true);
    try {
      const payload = {
        subject: form.subject,
        content: form.content,
        cohortId: sendMode === "cohort" ? form.cohortId : undefined,
        toId: sendMode === "direct" ? form.toId : undefined,
      };
      const res = await fetch("/api/admin/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowCompose(false);
        setForm({ subject: "", content: "", cohortId: "", toId: "" });
        fetchMessages();
      }
    } catch (err) {
      console.error("Error sending:", err);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este mensaje?")) return;
    await fetch(`/api/admin/mensajes/${id}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  const filtered = messages.filter((m) => {
    if (filterCohort && m.cohort?.id !== filterCohort) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        `${m.from.firstName} ${m.from.lastName}`.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Envía comunicaciones a cohortes o alumnos individuales
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nuevo mensaje
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por asunto o contenido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterCohort}
            onChange={(e) => setFilterCohort(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas las cohortes</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-xs text-gray-500">Total enviados</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Users size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter((m) => m.cohort && !m.to).length}
              </p>
              <p className="text-xs text-gray-500">A cohortes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <User size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter((m) => m.to).length}
              </p>
              <p className="text-xs text-gray-500">Directos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No hay mensajes</p>
          <button
            onClick={() => setShowCompose(true)}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Enviar el primer mensaje
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Type badge */}
                  {msg.to ? (
                    <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                      Directo
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      Cohorte
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{msg.subject}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {msg.to
                        ? `Para: ${msg.to.firstName} ${msg.to.lastName}`
                        : `Para: ${msg.cohort?.name || "Todos"}`}
                      {" · "}
                      {formatDate(msg.createdAt)} a las {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(msg.id);
                    }}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expandedId === msg.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {expandedId === msg.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock size={12} />
                    {formatDate(msg.createdAt)} · {formatTime(msg.createdAt)}
                    {msg.readAt && (
                      <span className="ml-2 text-green-600">· Leído {formatDate(msg.readAt)}</span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {msg.body}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo mensaje</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Send mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSendMode("cohort")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    sendMode === "cohort"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <Users size={16} />
                  A cohorte
                </button>
                <button
                  onClick={() => setSendMode("direct")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    sendMode === "direct"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <User size={16} />
                  A alumno
                </button>
              </div>

              {/* Recipient */}
              {sendMode === "cohort" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cohorte</label>
                  <select
                    value={form.cohortId}
                    onChange={(e) => setForm({ ...form, cohortId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecciona cohorte...</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.program})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alumno</label>
                  <select
                    value={form.toId}
                    onChange={(e) => setForm({ ...form, toId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecciona alumno...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} {s.cohortName ? `(${s.cohortName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Asunto del mensaje..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Escribe tu mensaje..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowCompose(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !form.subject || !form.content || (sendMode === "cohort" ? !form.cohortId : !form.toId)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
