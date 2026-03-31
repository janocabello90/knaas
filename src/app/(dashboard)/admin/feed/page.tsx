"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Loader2,
  Pin,
  Trash2,
  MessageSquare,
  Send,
  X,
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  body: string;
  category: string | null;
  pinned: boolean;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  author_first_name: string;
  author_last_name: string;
}

export default function AdminFeedPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadTopics() {
    try {
      const res = await fetch("/api/admin/feed");
      if (!res.ok) throw new Error("Error cargando temas");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTopics(); }, []);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          body: newBody,
          category: newCategory || null,
          pinned: newPinned,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error creando tema");
      }
      setNewTitle("");
      setNewBody("");
      setNewCategory("");
      setNewPinned(false);
      setShowNew(false);
      loadTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este tema y todas sus respuestas?")) return;
    try {
      await fetch(`/api/admin/feed/${id}`, { method: "DELETE" });
      loadTopics();
    } catch {
      setError("Error eliminando tema");
    }
  }

  async function handleTogglePin(topic: Topic) {
    try {
      await fetch(`/api/admin/feed/${topic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !topic.pinned }),
      });
      loadTopics();
    } catch {
      setError("Error actualizando tema");
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("es-ES", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed de la comunidad</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea temas de discusión para los alumnos. Ellos pueden responder y seguir los hilos.
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showNew ? <X size={16} /> : <Plus size={16} />}
          {showNew ? "Cancelar" : "Nuevo tema"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* New topic form */}
      {showNew && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Título del tema</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Bienvenidos a la cohorte de abril"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mensaje</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Escribe el contenido del tema..."
                rows={5}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-1">Categoría (opcional)</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ej: Anuncios, Recursos, Debate..."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Fijar arriba</span>
              </label>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publicar tema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topics list */}
      {topics.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p>No hay temas todavía</p>
          <p className="text-sm mt-1">Crea el primer tema para abrir la conversación</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className={`rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow ${
                topic.pinned ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {topic.pinned && (
                      <Pin size={14} className="text-blue-500 flex-shrink-0" />
                    )}
                    {topic.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {topic.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{topic.title}</h3>
                  {topic.body && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{topic.body.replace(/<[^>]+>/g, "").slice(0, 150)}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{topic.author_first_name} {topic.author_last_name}</span>
                    <span>{formatDate(topic.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {topic.reply_count} {topic.reply_count === 1 ? "respuesta" : "respuestas"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePin(topic)}
                    title={topic.pinned ? "Desfijar" : "Fijar arriba"}
                    className={`p-1.5 rounded hover:bg-gray-100 ${topic.pinned ? "text-blue-500" : "text-gray-300"}`}
                  >
                    <Pin size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
                    title="Eliminar"
                    className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
