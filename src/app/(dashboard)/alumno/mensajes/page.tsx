"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  MailOpen,
  Clock,
  Loader,
  Users,
  User,
  ChevronDown,
  ChevronUp,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MessageItem = {
  id: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  from: { id: string; firstName: string; lastName: string; photo: string | null; role: string };
  cohort: { id: string; name: string } | null;
};

export default function AlumnoMensajesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch("/api/alumno/mensajes");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    const msg = messages.find((m) => m.id === id);
    if (msg?.readAt) return; // Already read

    try {
      await fetch("/api/alumno/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id }),
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, readAt: new Date().toISOString() } : m
        )
      );
    } catch {
      // Non-critical
    }
  }

  function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      markAsRead(id);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  function formatFullDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const unreadCount = messages.filter((m) => !m.readAt).length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comunicaciones de tu programa y mentores
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            <Mail size={14} />
            {unreadCount} sin leer
          </span>
        )}
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No tienes mensajes todavía</p>
          <p className="mt-1 text-xs text-gray-400">
            Aquí recibirás comunicaciones de tu mentor y del equipo
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const isUnread = !msg.readAt;
            const isExpanded = expandedId === msg.id;
            const isBroadcast = !msg.cohort ? false : true;

            return (
              <div
                key={msg.id}
                className={cn(
                  "rounded-xl border bg-white transition-all",
                  isUnread
                    ? "border-blue-200 shadow-sm"
                    : "border-gray-200",
                  isExpanded && "shadow-md"
                )}
              >
                <button
                  onClick={() => handleExpand(msg.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  {/* Read status icon */}
                  <div className="shrink-0">
                    {isUnread ? (
                      <div className="relative">
                        <Mail size={20} className="text-blue-600" />
                        <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                      </div>
                    ) : (
                      <MailOpen size={20} className="text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          "truncate text-sm",
                          isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"
                        )}
                      >
                        {msg.subject}
                      </h3>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {msg.from.role === "SUPERADMIN" || msg.from.role === "MENTOR" ? (
                          <User size={10} />
                        ) : (
                          <Users size={10} />
                        )}
                        {msg.from.firstName} {msg.from.lastName}
                      </span>
                      {isBroadcast && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          {msg.cohort?.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock size={10} />
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                    <p className="mb-3 text-xs text-gray-400">
                      {formatFullDate(msg.createdAt)}
                    </p>
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {msg.body}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
