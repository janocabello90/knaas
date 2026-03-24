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
  ChevronLeft,
  ChevronRight,
  Target,
  CalendarPlus,
  List,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  cohortName: string;
  attended: boolean | null;
  isPast: boolean;
};

function buildGoogleCalUrl(session: Session): string {
  const start = new Date(session.date);
  const end = new Date(start.getTime() + 90 * 60 * 1000); // 1.5h default

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: session.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [
      session.objectives ? `Objetivos: ${session.objectives}` : "",
      session.zoomLink ? `Enlace: ${session.zoomLink}` : "",
      session.expertName ? `Experto: ${session.expertName}` : "",
      `Cohorte: ${session.cohortName}`,
    ]
      .filter(Boolean)
      .join("\n"),
    location: session.zoomLink || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --- Calendar helpers ---
const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay() - 1; // Monday = 0
  if (startDow < 0) startDow = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

export default function AlumnoMentoriasPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  const upcoming = sessions.filter((s) => !s.isPast).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = sessions.filter((s) => s.isPast);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function daysUntil(dateStr: string) {
    const diff = Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Mañana";
    if (diff < 0) return "Pasada";
    return `En ${diff} días`;
  }

  // Calendar: sessions for current month
  function getSessionsForDay(day: number) {
    return sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day;
    });
  }

  const daysWithSessions = new Set(
    sessions
      .filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
      .map((s) => new Date(s.date).getDate())
  );

  const selectedDaySessions = selectedDay ? getSessionsForDay(selectedDay) : [];

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
    setSelectedDay(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorías</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sesiones de mentoría · {sessions[0]?.cohortName || "Sin cohorte"}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "list" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List size={14} />
            Lista
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "calendar" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <LayoutGrid size={14} />
            Calendario
          </button>
        </div>
      </div>

      {/* ============ CALENDAR VIEW ============ */}
      {view === "calendar" && (
        <div className="space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <h2 className="text-base font-semibold text-gray-900">
              {MONTHS_ES[calMonth]} {calYear}
            </h2>
            <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Grid */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
              {DAYS_ES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {getMonthDays(calYear, calMonth).map((day, i) => {
                const isToday =
                  day === now.getDate() &&
                  calMonth === now.getMonth() &&
                  calYear === now.getFullYear();
                const hasSessions = day ? daysWithSessions.has(day) : false;
                const isSelected = day === selectedDay;

                return (
                  <button
                    key={i}
                    onClick={() => day && setSelectedDay(isSelected ? null : day)}
                    disabled={!day}
                    className={cn(
                      "relative flex h-14 items-center justify-center border-b border-r border-gray-100 text-sm transition-colors",
                      day ? "hover:bg-blue-50 cursor-pointer" : "cursor-default",
                      isToday && "font-bold",
                      isSelected && "bg-blue-100",
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          isToday && !isSelected && "bg-blue-600 text-white",
                          isSelected && "bg-blue-600 text-white",
                        )}>
                          {day}
                        </span>
                        {hasSessions && !isSelected && !isToday && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}
                        {hasSessions && (isSelected || isToday) && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-blue-300" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day sessions */}
          {selectedDay && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600">
                {selectedDay} de {MONTHS_ES[calMonth]}
                {selectedDaySessions.length === 0 && " — Sin sesiones"}
              </p>
              {selectedDaySessions.map((session) => (
                <SessionCardCompact key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ LIST VIEW ============ */}
      {view === "list" && (
        <>
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
                        <div className="flex items-center gap-2 flex-wrap">
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

                        {/* Objectives */}
                        {session.objectives && (
                          <div className="mt-3 rounded-lg bg-blue-50 p-3">
                            <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-blue-600">
                              <Target size={12} />
                              Objetivos
                            </p>
                            <p className="text-sm text-blue-800">{session.objectives}</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {session.zoomLink && (
                          <a
                            href={session.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                          >
                            <Video size={16} />
                            Unirse
                          </a>
                        )}
                        <a
                          href={buildGoogleCalUrl(session)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <CalendarPlus size={16} />
                          Agendar
                        </a>
                      </div>
                    </div>

                    {session.summary && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
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
                        {session.recordingUrl && <PlayCircle size={18} className="text-blue-500" />}
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

                        {session.objectives && (
                          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                            <p className="mb-1 text-xs font-semibold text-blue-500 uppercase">Objetivos</p>
                            {session.objectives}
                          </div>
                        )}

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
                            Aún no hay resumen ni grabación disponible.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// Compact session card for calendar view
function SessionCardCompact({ session }: { session: Session }) {
  const isPast = session.isPast;

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className={cn(
      "rounded-xl border bg-white p-4 transition-shadow hover:shadow-md",
      isPast ? "border-gray-200 opacity-80" : "border-blue-200"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {session.stepNumber && (
              <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                Paso {session.stepNumber}
              </span>
            )}
            <span className="text-xs text-gray-500">{formatTime(session.date)}</span>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-gray-900">{session.title}</h3>
          {session.expertName && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <User size={10} /> {session.expertName}
            </p>
          )}
          {session.objectives && (
            <p className="mt-1 text-xs text-blue-600 line-clamp-1">
              <Target size={10} className="inline mr-1" />
              {session.objectives}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {!isPast && session.zoomLink && (
            <a
              href={session.zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Video size={12} />
              Unirse
            </a>
          )}
          {!isPast && (
            <a
              href={buildGoogleCalUrl(session)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <CalendarPlus size={12} />
              Agendar
            </a>
          )}
          {isPast && session.recordingUrl && (
            <a
              href={session.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              <PlayCircle size={12} />
              Ver
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
