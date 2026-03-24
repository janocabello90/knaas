"use client";

import { useState, useEffect } from "react";
import { Mail, ChevronRight, Loader } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type RecentMessage = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  from: { firstName: string; lastName: string; role: string };
  cohort: { name: string } | null;
};

export function UnreadMessagesWidget() {
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [countRes, messagesRes] = await Promise.all([
          fetch("/api/alumno/mensajes/unread-count"),
          fetch("/api/alumno/mensajes"),
        ]);
        const countData = await countRes.json();
        const messagesData = await messagesRes.json();

        setCount(countData.count || 0);
        // Get latest 3 unread messages
        const unread = (messagesData.messages || [])
          .filter((m: { readAt: string | null }) => !m.readAt)
          .slice(0, 3);
        setRecent(unread);
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Loader size={16} className="animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Cargando mensajes...</span>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return null; // Don't show widget if no unread messages
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Ahora";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="rounded-lg bg-blue-100 p-2">
              <Mail size={18} className="text-blue-600" />
            </div>
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {count > 99 ? "99+" : count}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Mensajes nuevos</h3>
            <p className="text-xs text-gray-500">
              {count} sin leer
            </p>
          </div>
        </div>
        <Link
          href="/alumno/mensajes"
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
        >
          Ver todos
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Recent unread messages */}
      {recent.length > 0 && (
        <div className="space-y-2">
          {recent.map((msg) => (
            <Link
              key={msg.id}
              href="/alumno/mensajes"
              className="flex items-start gap-3 rounded-lg bg-white border border-gray-100 p-3 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{msg.subject}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {msg.from.firstName} {msg.from.lastName}
                  <span className="mx-1">·</span>
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
