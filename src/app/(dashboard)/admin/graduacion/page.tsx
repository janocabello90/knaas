"use client";

import { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  Check,
  X,
  HelpCircle,
  UtensilsCrossed,
  Loader2,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Rsvp = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  cohort_name: string;
  attendance: "si" | "no" | "no_se";
  guests: number;
  guest_names: string | null;
  allergies: string | null;
  dietary_notes: string | null;
  comments: string | null;
  updated_at: string;
};

type Summary = {
  total: number;
  attending: number;
  notAttending: number;
  undecided: number;
  totalGuests: number;
  totalPeople: number;
  withAllergies: number;
};

export default function AdminGraduacionPage() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "si" | "no" | "no_se">("all");

  useEffect(() => {
    fetch("/api/admin/graduacion")
      .then((r) => r.json())
      .then((data) => {
        setRsvps(data.rsvps ?? []);
        setSummary(data.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? rsvps : rsvps.filter((r) => r.attendance === filter);

  const attendanceLabel: Record<string, string> = {
    si: "Asiste",
    no: "No asiste",
    no_se: "Pendiente",
  };
  const attendanceColor: Record<string, string> = {
    si: "bg-green-100 text-green-700",
    no: "bg-gray-100 text-gray-500",
    no_se: "bg-amber-100 text-amber-700",
  };
  const attendanceIcon: Record<string, React.ReactNode> = {
    si: <Check size={14} />,
    no: <X size={14} />,
    no_se: <HelpCircle size={14} />,
  };

  function exportCSV() {
    const headers = [
      "Nombre",
      "Email",
      "Teléfono",
      "Cohorte",
      "Asistencia",
      "Acompañantes",
      "Nombres acompañantes",
      "Alergias",
      "Preferencias alimentarias",
      "Comentarios",
    ];
    const rows = rsvps.map((r) => [
      `${r.first_name} ${r.last_name}`,
      r.email,
      r.phone ?? "",
      r.cohort_name,
      attendanceLabel[r.attendance],
      r.attendance === "si" ? r.guests : 0,
      r.guest_names ?? "",
      r.allergies ?? "",
      r.dietary_notes ?? "",
      r.comments ?? "",
    ]);
    const csv =
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join(
        "\n"
      );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graduacion-rsvp.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <GraduationCap size={28} className="text-rose-500" />
            Graduación — RSVPs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Respuestas de asistencia a la ceremonia de graduación
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Confirman asistencia
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {summary.attending}
            </p>
            <p className="text-xs text-green-600">
              + {summary.totalGuests} acompañantes = {summary.totalPeople}{" "}
              personas
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <X size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                No asisten
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-600">
              {summary.notAttending}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2">
              <HelpCircle size={18} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Pendientes
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-amber-700">
              {summary.undecided}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={18} className="text-rose-500" />
              <span className="text-sm font-medium text-rose-800">
                Con alergias
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {summary.withAllergies}
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(["all", "si", "no", "no_se"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "all"
              ? `Todos (${rsvps.length})`
              : `${attendanceLabel[f]} (${rsvps.filter((r) => r.attendance === f).length})`}
          </button>
        ))}
      </div>

      {/* RSVP table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">
            {rsvps.length === 0
              ? "Todavía no hay respuestas"
              : "No hay respuestas con este filtro"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Asistencia</th>
                <th className="px-4 py-3">Acomp.</th>
                <th className="px-4 py-3">Alergias / Dieta</th>
                <th className="px-4 py-3">Comentarios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {r.first_name} {r.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                    {r.phone && (
                      <p className="text-xs text-gray-400">{r.phone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        attendanceColor[r.attendance]
                      )}
                    >
                      {attendanceIcon[r.attendance]}
                      {attendanceLabel[r.attendance]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.attendance === "si" ? (
                      <div>
                        <span className="font-medium text-gray-900">
                          {r.guests}
                        </span>
                        {r.guest_names && (
                          <p className="text-xs text-gray-500">
                            {r.guest_names}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.attendance === "si" ? (
                      <div className="space-y-0.5">
                        {r.allergies && (
                          <p className="text-xs">
                            <span className="font-medium text-red-600">
                              Alergias:
                            </span>{" "}
                            {r.allergies}
                          </p>
                        )}
                        {r.dietary_notes && (
                          <p className="text-xs">
                            <span className="font-medium text-amber-600">
                              Dieta:
                            </span>{" "}
                            {r.dietary_notes}
                          </p>
                        )}
                        {!r.allergies && !r.dietary_notes && (
                          <span className="text-gray-300">Sin restricciones</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.comments || (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
