"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Video,
  Clock,
  Loader,
  ExternalLink,
  PlayCircle,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  title: string;
  date: string;
  stepNumber: number | null;
  zoomLink: string | null;
  expertName: string | null;
  summary: string | null;
  recordingUrl: string | null;
  cohortName: string;
  attended: boolean | null;
  isPast: boolean;
};

export default function AlumnoMentoriasPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/alumno/mentorias");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  const upcoming = sessions.filter((s) => !s.isPast);
  const past = sessions.filter((s) => s.isPast);

  // Sort upcoming by date ascending (nearest first)
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function daysUntil(dateStr: string) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Mañana";
    if (diff < 0) return "Pasada";
    return `En ${diff} días`;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mentorías</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sesiones de mentoría de tu programa · {sessions[0]?.cohortName || "Sin cohorte"}
        </p>
      </div>

      {/* Upcoming sessions */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">Próximas sesiones</h2>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            {upcoming.length}
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Calendar className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay sesiones programadas próximamente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((session, idx) => (
              <div
                key={session.id}
                className={cn(
                  "rounded-xl border bg-white p-5 transition-shadow hover:shadow-md",
                  idx === 0 ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-200"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {session.stepNumber && (
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Paso {session.stepNumber}
                        </span>
                      )}
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        idx === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {daysUntil(session.date)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-gray-900">{session.title}</h3>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {formatTime(session.date)}
                      </span>
                      {session.expertName && (
                        <span className="flex items-center gap-1.5">
                          <User size={14} />
                          {session.expertName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zoom link button */}
                  {session.zoomLink && (
                    <a
                      href={session.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      <Video size={16} />
                      Unirse
                    </a>
                  )}
                </div>

                {session.summary && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                    <FileText size={14} className="mb-1 inline-block" /> {session.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past sessions */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Sesiones pasadas</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {past.length}
          </span>
        </div>

        {past.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Aún no hay sesiones pasadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {past.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    {session.stepNumber && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        Paso {session.stepNumber}
                      </span>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{session.title}</h3>
                      <p className="text-xs text-gray-500">{formatDate(session.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Attendance badge */}
                    {session.attended !== null && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        session.attended
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {session.attended ? "Asistí" : "No asistí"}
                      </span>
                    )}

                    {session.recordingUrl && (
                      <PlayCircle size={18} className="text-blue-500" />
                    )}

                    {expandedId === session.id ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedId === session.id && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {formatTime(session.date)}
                      </span>
                      {session.expertName && (
                        <span className="flex items-center gap-1.5">
                          <User size={14} />
                          {session.expertName}
                        </span>
                      )}
                    </div>

                    {session.summary && (
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                        <p className="mb-1 text-xs font-semibold text-gray-500 uppercase">Resumen</p>
                        {session.summary}
                      </div>
                    )}

                    {session.recordingUrl && (
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                      >
                        <PlayCircle size={16} />
                        Ver grabación
                        <ExternalLink size={14} />
                      </a>
                    )}

                    {!session.recordingUrl && !session.summary && (
                      <p className="text-sm text-gray-400 italic">
                        Aún no hay resumen ni grabación disponible para esta sesión.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
