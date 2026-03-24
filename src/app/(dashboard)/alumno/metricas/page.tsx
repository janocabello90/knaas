"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Loader,
  Plus,
  Users,
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

type KpiField = {
  key: string;
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  decimals: number;
  description: string;
};

const KPI_FIELDS: KpiField[] = [
  { key: "revenue", label: "Facturación", unit: "€", icon: <DollarSign size={16} />, color: "text-green-600 bg-green-50", decimals: 0, description: "Facturación mensual total" },
  { key: "patientsActive", label: "Pacientes activos", unit: "", icon: <Users size={16} />, color: "text-blue-600 bg-blue-50", decimals: 0, description: "Pacientes que han venido este mes" },
  { key: "avgTicket", label: "Ticket medio", unit: "€", icon: <DollarSign size={16} />, color: "text-emerald-600 bg-emerald-50", decimals: 2, description: "Ingreso medio por paciente" },
  { key: "recurrenceRate", label: "Tasa de recurrencia", unit: "%", icon: <ArrowUpRight size={16} />, color: "text-violet-600 bg-violet-50", decimals: 1, description: "% de pacientes que vuelven" },
  { key: "occupancy", label: "Ocupación", unit: "%", icon: <Percent size={16} />, color: "text-amber-600 bg-amber-50", decimals: 1, description: "% de horas ocupadas vs disponibles" },
  { key: "grossMargin", label: "Margen bruto", unit: "%", icon: <Percent size={16} />, color: "text-teal-600 bg-teal-50", decimals: 1, description: "% de beneficio tras costes directos" },
  { key: "ownerHours", label: "Horas propietario", unit: "h/sem", icon: <Clock size={16} />, color: "text-orange-600 bg-orange-50", decimals: 1, description: "Horas semanales que dedicas a la clínica" },
  { key: "nps", label: "NPS", unit: "", icon: <Star size={16} />, color: "text-yellow-600 bg-yellow-50", decimals: 0, description: "Net Promoter Score (-100 a 100)" },
  { key: "churnPct", label: "Churn", unit: "%", icon: <TrendingDown size={16} />, color: "text-red-600 bg-red-50", decimals: 1, description: "% de pacientes que dejan de venir" },
];

function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getTrend(current: number | null, previous: number | null, inverse = false): { icon: React.ReactNode; color: string } | null {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return { icon: <Minus size={12} />, color: "text-gray-400" };
  const isUp = diff > 0;
  const isGood = inverse ? !isUp : isUp;
  return {
    icon: isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />,
    color: isGood ? "text-green-600" : "text-red-500",
  };
}

export default function MetricasPage() {
  const [snapshots, setSnapshots] = useState<KpiSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMonth, setEditMonth] = useState(getCurrentMonthYear());
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/alumno/metricas")
      .then((r) => r.json())
      .then((data) => {
        setSnapshots(data.snapshots ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMonthData = (monthYear: string) => {
    setEditMonth(monthYear);
    const existing = snapshots.find((s) => s.monthYear === monthYear);
    if (existing) {
      const data: Record<string, string> = {};
      KPI_FIELDS.forEach((f) => {
        const val = existing[f.key as keyof KpiSnapshot];
        data[f.key] = val != null ? String(val) : "";
      });
      setFormData(data);
    } else {
      setFormData({});
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const payload: Record<string, unknown> = { monthYear: editMonth };
      KPI_FIELDS.forEach((f) => {
        const val = formData[f.key];
        payload[f.key] = val !== undefined && val !== "" ? Number(val) : null;
      });

      const res = await fetch("/api/alumno/metricas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setSnapshots((prev) => {
          const filtered = prev.filter((s) => s.monthYear !== editMonth);
          return [...filtered, saved].sort((a, b) => a.monthYear.localeCompare(b.monthYear));
        });
        setSuccessMsg("Métricas guardadas");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const latestSnapshot = snapshots[snapshots.length - 1];
  const previousSnapshot = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const baselineSnapshot = snapshots.find((s) => s.isBaseline) ?? snapshots[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PodiumMetrics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra y visualiza los KPIs de tu clínica mes a mes
          </p>
        </div>
        <button
          onClick={() => loadMonthData(getCurrentMonthYear())}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Registrar mes
        </button>
      </div>

      {/* Current KPIs cards */}
      {latestSnapshot ? (
        <div className="mb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Último registro — {getMonthLabel(latestSnapshot.monthYear)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KPI_FIELDS.map((field) => {
              const value = latestSnapshot[field.key as keyof KpiSnapshot] as number | null;
              const prevValue = previousSnapshot?.[field.key as keyof KpiSnapshot] as number | null;
              const baseValue = baselineSnapshot?.[field.key as keyof KpiSnapshot] as number | null;
              const inverse = field.key === "churnPct" || field.key === "ownerHours";
              const trend = getTrend(value, prevValue, inverse);

              return (
                <div key={field.key} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className={cn("flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium", field.color)}>
                      {field.icon}
                      {field.label}
                    </div>
                    {trend && (
                      <span className={cn("flex items-center gap-0.5 text-xs font-medium", trend.color)}>
                        {trend.icon}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {value != null
                      ? `${value.toLocaleString("es-ES", { maximumFractionDigits: field.decimals })}${field.unit ? ` ${field.unit}` : ""}`
                      : "—"}
                  </p>
                  {baseValue != null && value != null && baselineSnapshot !== latestSnapshot && (
                    <p className="mt-1 text-[10px] text-gray-400">
                      Inicio: {baseValue.toLocaleString("es-ES", { maximumFractionDigits: field.decimals })}{field.unit ? ` ${field.unit}` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="mb-2 font-medium text-gray-600">Aún no tienes métricas registradas</p>
          <p className="text-sm text-gray-500">
            Empieza registrando los KPIs del mes actual para que KNAAS pueda darte recomendaciones personalizadas.
          </p>
          <button
            onClick={() => loadMonthData(getCurrentMonthYear())}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Registrar primer mes
          </button>
        </div>
      )}

      {/* History table */}
      {snapshots.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Historial</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Mes</th>
                  {KPI_FIELDS.slice(0, 6).map((f) => (
                    <th key={f.key} className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((snap) => (
                  <tr key={snap.monthYear} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {getMonthLabel(snap.monthYear)}
                      {snap.isBaseline && (
                        <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                          BASE
                        </span>
                      )}
                    </td>
                    {KPI_FIELDS.slice(0, 6).map((f) => {
                      const val = snap[f.key as keyof KpiSnapshot] as number | null;
                      return (
                        <td key={f.key} className="px-3 py-3 text-right text-gray-600">
                          {val != null ? val.toLocaleString("es-ES", { maximumFractionDigits: f.decimals }) : "—"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => loadMonthData(snap.monthYear)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold text-gray-900">
              Métricas de {getMonthLabel(editMonth)}
            </h3>
            <p className="mb-5 text-xs text-gray-500">
              Rellena los KPIs que tengas. Los campos vacíos se guardan como "sin dato".
            </p>

            {/* Month selector */}
            <div className="mb-5">
              <label className="mb-1 block text-xs font-medium text-gray-500">Mes</label>
              <input
                type="month"
                value={editMonth}
                onChange={(e) => loadMonthData(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* KPI fields */}
            <div className="space-y-4">
              {KPI_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span className={cn("flex items-center justify-center rounded-md p-1", field.color)}>
                      {field.icon}
                    </span>
                    {field.label}
                    {field.unit && <span className="text-xs text-gray-400">({field.unit})</span>}
                  </label>
                  <p className="mb-1.5 text-[11px] text-gray-400">{field.description}</p>
                  <input
                    type="number"
                    step={field.decimals > 0 ? "0.01" : "1"}
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder="—"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Baseline checkbox */}
            <label className="mt-5 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData["isBaseline"] === "true"}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isBaseline: String(e.target.checked) }))
                }
                className="rounded border-gray-300"
              />
              Marcar como línea base (P1 — punto de partida)
            </label>

            {/* Success message */}
            {successMsg && (
              <p className="mt-3 text-sm font-medium text-green-600">{successMsg}</p>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Guardando..." : "Guardar métricas"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
