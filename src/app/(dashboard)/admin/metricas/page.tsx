"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Loader,
  DollarSign,
  Clock,
  Percent,
  Star,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KpiSnapshot = {
  id: string;
  monthYear: string;
  patientsActive: number | null;
  avgTicket: number | null;
  recurrenceRate: number | null;
  ownerHours: number | null;
  grossMargin: number | null;
  revenue: number | null;
  nps: number | null;
  occupancy: number | null;
  churnPct: number | null;
  isBaseline: boolean;
};

type ClinicData = {
  id: string;
  name: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string | null;
    enrollments: { cohort: { name: string; program: string } }[];
  };
  kpiSnapshots: KpiSnapshot[];
};

type CohortOption = {
  id: string;
  name: string;
  program: string;
};

const KPI_COLUMNS = [
  { key: "revenue", label: "Facturación", unit: "€", icon: <DollarSign size={12} />, color: "text-green-600" },
  { key: "patientsActive", label: "Pacientes", unit: "", icon: <Users size={12} />, color: "text-blue-600" },
  { key: "avgTicket", label: "Ticket", unit: "€", icon: <DollarSign size={12} />, color: "text-emerald-600" },
  { key: "recurrenceRate", label: "Recurrencia", unit: "%", icon: <ArrowUpRight size={12} />, color: "text-violet-600" },
  { key: "occupancy", label: "Ocupación", unit: "%", icon: <Percent size={12} />, color: "text-amber-600" },
  { key: "grossMargin", label: "Margen", unit: "%", icon: <Percent size={12} />, color: "text-teal-600" },
  { key: "ownerHours", label: "Horas", unit: "h", icon: <Clock size={12} />, color: "text-orange-600" },
  { key: "nps", label: "NPS", unit: "", icon: <Star size={12} />, color: "text-yellow-600" },
];

function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
}

function getTrendIcon(current: number | null, previous: number | null, inverse = false): React.ReactNode {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return <Minus size={10} className="text-gray-300" />;
  const isUp = diff > 0;
  const isGood = inverse ? !isUp : isUp;
  const color = isGood ? "text-green-500" : "text-red-400";
  return isUp ? <TrendingUp size={10} className={color} /> : <TrendingDown size={10} className={color} />;
}

export default function AdminMetricasPage() {
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = (cohortId?: string) => {
    setLoading(true);
    const url = cohortId
      ? `/api/admin/metricas?cohortId=${cohortId}`
      : "/api/admin/metricas";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setClinics(data.clinics ?? []);
        setCohorts(data.cohorts ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohort(cohortId);
    fetchData(cohortId || undefined);
  };

  // Aggregate stats
  const allLatest = clinics
    .map((c) => c.kpiSnapshots[c.kpiSnapshots.length - 1])
    .filter(Boolean);

  const avgRevenue =
    allLatest.length > 0
      ? allLatest.reduce((sum, s) => sum + (s?.revenue ?? 0), 0) / allLatest.filter((s) => s?.revenue != null).length
      : null;
  const avgTicket =
    allLatest.length > 0
      ? allLatest.reduce((sum, s) => sum + (s?.avgTicket ?? 0), 0) / allLatest.filter((s) => s?.avgTicket != null).length
      : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PodiumMetrics</h1>
          <p className="mt-1 text-sm text-gray-500">
            KPIs de todas las clínicas · {clinics.length} clínica{clinics.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={selectedCohort}
            onChange={(e) => handleCohortChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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

      {/* Summary cards */}
      {allLatest.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Clínicas con datos</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{allLatest.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Facturación media</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {avgRevenue != null ? `${Math.round(avgRevenue).toLocaleString("es-ES")} €` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Ticket medio (media)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {avgTicket != null ? `${avgTicket.toFixed(0)} €` : "—"}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={24} className="animate-spin text-blue-600" />
        </div>
      ) : clinics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-600">Ningún alumno ha registrado métricas todavía</p>
          <p className="mt-1 text-sm text-gray-500">
            Los alumnos pueden registrar sus KPIs desde PodiumMetrics en su panel.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {clinics.map((clinic) => {
            const latest = clinic.kpiSnapshots[clinic.kpiSnapshots.length - 1];
            const previous = clinic.kpiSnapshots.length > 1 ? clinic.kpiSnapshots[clinic.kpiSnapshots.length - 2] : null;
            const baseline = clinic.kpiSnapshots.find((s) => s.isBaseline) ?? clinic.kpiSnapshots[0];
            const cohortName = clinic.user.enrollments[0]?.cohort?.name;
            const initials = `${clinic.user.firstName[0]}${clinic.user.lastName[0]}`.toUpperCase();

            return (
              <div key={clinic.id} className="rounded-xl border border-gray-200 bg-white p-5">
                {/* Clinic header */}
                <div className="mb-4 flex items-center gap-3">
                  {clinic.user.photo ? (
                    <img src={clinic.user.photo} className="h-10 w-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {initials}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {clinic.name} — {clinic.user.firstName} {clinic.user.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {cohortName ?? "Sin cohorte"} · {clinic.kpiSnapshots.length} registro{clinic.kpiSnapshots.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Latest KPIs inline */}
                {latest ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {KPI_COLUMNS.map((col) => {
                      const val = latest[col.key as keyof KpiSnapshot] as number | null;
                      const prevVal = previous?.[col.key as keyof KpiSnapshot] as number | null;
                      const inverse = col.key === "ownerHours";
                      return (
                        <div key={col.key} className="rounded-lg bg-gray-50 p-2 text-center">
                          <p className="text-[10px] font-medium text-gray-400">{col.label}</p>
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-sm font-bold text-gray-900">
                              {val != null ? val.toLocaleString("es-ES", { maximumFractionDigits: 0 }) : "—"}
                            </p>
                            {getTrendIcon(val, prevVal, inverse)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Sin datos registrados</p>
                )}

                {/* Mini timeline */}
                {clinic.kpiSnapshots.length > 1 && (
                  <div className="mt-3 flex items-center gap-1 overflow-x-auto">
                    <p className="shrink-0 text-[10px] text-gray-400">Historial:</p>
                    {clinic.kpiSnapshots.map((snap) => (
                      <span
                        key={snap.monthYear}
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium",
                          snap === latest
                            ? "bg-blue-100 text-blue-700"
                            : snap.isBaseline
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {getMonthLabel(snap.monthYear)}
                      </span>
                    ))}
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
