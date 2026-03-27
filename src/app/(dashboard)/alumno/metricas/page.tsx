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
  Target,
  ChevronDown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

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

type DiagData = {
  ejercicio1?: {
    aFac: number[];
    aSes: number[];
    aNew: number[];
    gPac: number;
    gChurn: number;
    gNps: number;
    srvs: { sid: number; name: string; facM: number[]; sesM: number[] }[];
  };
  sistema?: {
    objFac: number;
    forecast: number[];
    forecastSesiones: number[];
    palancas: string[];
    sueldo: number;
  };
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

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
}

function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getTrend(current: number | null, previous: number | null, inverse = false): { icon: React.ReactNode; color: string; pct: string } | null {
  if (current == null || previous == null || previous === 0) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return { icon: <Minus size={12} />, color: "text-gray-400", pct: "0%" };
  const isUp = diff > 0;
  const isGood = inverse ? !isUp : isUp;
  const pctChange = ((diff / previous) * 100).toFixed(1);
  return {
    icon: isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />,
    color: isGood ? "text-green-600" : "text-red-500",
    pct: `${isUp ? "+" : ""}${pctChange}%`,
  };
}

function getMotivationalMessage(objFac: number, actualFacYTD: number, forecastYTD: number): { text: string; color: string } {
  if (objFac === 0 || forecastYTD === 0) return { text: "Completa tu Diagnóstico 360° para establecer objetivos", color: "text-gray-500" };
  const ratio = actualFacYTD / forecastYTD;
  if (ratio >= 1.1) return { text: "Vas por encima del objetivo. ¡Sigue así, campeón/a!", color: "text-green-700" };
  if (ratio >= 1.0) return { text: "Estás cumpliendo tu objetivo. ¡Buen trabajo!", color: "text-green-600" };
  if (ratio >= 0.9) return { text: "Estás cerca del objetivo. ¡Un pequeño empujón más!", color: "text-amber-600" };
  if (ratio >= 0.75) return { text: "Hay margen de mejora. Revisa tu estrategia y ajusta las palancas.", color: "text-orange-600" };
  return { text: "Estás por debajo del objetivo. Es momento de actuar. Consulta con tu mentor.", color: "text-red-600" };
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════

type Tab = "dashboard" | "registro" | "historial";

export default function MetricasPage() {
  const [snapshots, setSnapshots] = useState<KpiSnapshot[]>([]);
  const [diagData, setDiagData] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMonth, setEditMonth] = useState(getCurrentMonthYear());
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");

  const year = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      fetch("/api/alumno/metricas").then((r) => r.json()),
      fetch(`/api/alumno/diagnostico?year=${year}`).then((r) => r.json()).catch(() => null),
    ])
      .then(([metricasRes, diagRes]) => {
        setSnapshots(metricasRes.snapshots ?? []);
        if (diagRes?.data) setDiagData(diagRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

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

  // Derived data
  const ej1 = diagData?.ejercicio1;
  const sistema = diagData?.sistema;
  const forecast = sistema?.forecast ?? Array(12).fill(0);
  const forecastSes = sistema?.forecastSesiones ?? Array(12).fill(0);
  const prevYearFac = ej1?.aFac ?? Array(12).fill(0);
  const prevYearSes = ej1?.aSes ?? Array(12).fill(0);

  // Current year snapshots grouped by month
  const currentYearSnapshots = snapshots.filter((s) => s.monthYear.startsWith(String(year)));
  const monthlyRevenue = Array(12).fill(null) as (number | null)[];
  const monthlySessions = Array(12).fill(null) as (number | null)[];
  currentYearSnapshots.forEach((s) => {
    const monthIdx = parseInt(s.monthYear.split("-")[1]) - 1;
    monthlyRevenue[monthIdx] = s.revenue;
    monthlySessions[monthIdx] = s.patientsActive; // approximate sessions from patients
  });

  const actualFacYTD = sum(monthlyRevenue.map((v) => v ?? 0));
  const forecastYTD = sum(forecast.slice(0, new Date().getMonth() + 1));
  const prevYearFacTotal = sum(prevYearFac);

  const latestSnapshot = snapshots[snapshots.length - 1];
  const previousSnapshot = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

  const motivational = getMotivationalMessage(sistema?.objFac ?? 0, actualFacYTD, forecastYTD);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Cuadro de Mandos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Controla tu evolución: año anterior vs objetivo vs realidad
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

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {([
          { key: "dashboard" as Tab, label: "Dashboard", icon: <BarChart3 size={14} /> },
          { key: "registro" as Tab, label: "Registro mensual", icon: <Plus size={14} /> },
          { key: "historial" as Tab, label: "Historial", icon: <Clock size={14} /> },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Dashboard ────────────────────────── */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* Motivational message */}
          {sistema?.objFac && sistema.objFac > 0 && (
            <div className={`rounded-xl border-2 px-5 py-4 text-center ${
              motivational.color.includes("green")
                ? "border-green-200 bg-green-50"
                : motivational.color.includes("amber")
                  ? "border-amber-200 bg-amber-50"
                  : motivational.color.includes("orange")
                    ? "border-orange-200 bg-orange-50"
                    : "border-red-200 bg-red-50"
            }`}>
              <p className={`text-base font-semibold ${motivational.color}`}>
                {motivational.text}
              </p>
            </div>
          )}

          {/* Top summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Actual YTD */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Facturación real (YTD)</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{fmt(actualFacYTD)}</p>
              {forecastYTD > 0 && (
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>vs objetivo</span>
                    <span className={actualFacYTD >= forecastYTD ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                      {((actualFacYTD / forecastYTD) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${actualFacYTD >= forecastYTD ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${Math.min(100, (actualFacYTD / forecastYTD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Objective */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Objetivo anual</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{sistema?.objFac ? fmt(sistema.objFac) : "—"}</p>
              <p className="mt-1 text-xs text-gray-400">
                Forecast YTD: {fmt(forecastYTD)}
              </p>
            </div>

            {/* Previous year */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Año anterior</p>
              <p className="mt-2 text-2xl font-bold text-gray-500">{fmt(prevYearFacTotal)}</p>
              {actualFacYTD > 0 && prevYearFacTotal > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  Crecimiento actual: <span className={actualFacYTD > prevYearFacTotal ? "text-green-600 font-medium" : "text-red-500"}>
                    {(((actualFacYTD / sum(prevYearFac.slice(0, new Date().getMonth() + 1))) - 1) * 100).toFixed(1)}%
                  </span>
                </p>
              )}
            </div>

            {/* Latest KPI highlight */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Último mes registrado</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {latestSnapshot ? getMonthLabel(latestSnapshot.monthYear) : "—"}
              </p>
              {latestSnapshot?.revenue != null && (
                <p className="mt-1 text-xs text-gray-400">
                  Facturación: {fmt(latestSnapshot.revenue)}
                </p>
              )}
            </div>
          </div>

          {/* Monthly comparison table */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Comparativa mensual de facturación</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-xs font-medium text-gray-500 w-28">Concepto</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="pb-3 text-center text-xs font-medium text-gray-500">{m}</th>
                    ))}
                    <th className="pb-3 text-center text-xs font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Previous year */}
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium text-gray-400">Año ant.</td>
                    {prevYearFac.map((v, i) => (
                      <td key={i} className="py-2 text-center text-xs text-gray-400">
                        {v > 0 ? fmt(v) : "—"}
                      </td>
                    ))}
                    <td className="py-2 text-center text-xs font-semibold text-gray-400">{fmt(prevYearFacTotal)}</td>
                  </tr>
                  {/* Forecast */}
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium text-blue-600">Objetivo</td>
                    {forecast.map((v, i) => (
                      <td key={i} className="py-2 text-center text-xs text-blue-600">
                        {v > 0 ? fmt(v) : "—"}
                      </td>
                    ))}
                    <td className="py-2 text-center text-xs font-semibold text-blue-700">{fmt(sum(forecast))}</td>
                  </tr>
                  {/* Actual */}
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium text-green-600">Real</td>
                    {monthlyRevenue.map((v, i) => (
                      <td key={i} className="py-2 text-center text-xs font-medium">
                        {v != null ? (
                          <span className={v >= (forecast[i] || 0) ? "text-green-600" : "text-red-500"}>
                            {fmt(v)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 text-center text-xs font-bold text-green-700">{fmt(actualFacYTD)}</td>
                  </tr>
                  {/* Deviation */}
                  <tr>
                    <td className="py-2 text-xs font-medium text-gray-500">Desviación</td>
                    {monthlyRevenue.map((v, i) => {
                      if (v == null || !forecast[i]) return <td key={i} className="py-2 text-center text-xs text-gray-300">—</td>;
                      const dev = v - forecast[i];
                      return (
                        <td key={i} className={`py-2 text-center text-xs font-medium ${dev >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {dev >= 0 ? "+" : ""}{fmt(dev)}
                        </td>
                      );
                    })}
                    <td className={`py-2 text-center text-xs font-bold ${actualFacYTD >= forecastYTD ? "text-green-600" : "text-red-500"}`}>
                      {forecastYTD > 0 ? `${actualFacYTD >= forecastYTD ? "+" : ""}${fmt(actualFacYTD - forecastYTD)}` : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual bar chart */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium text-gray-500">Visualización mensual</p>
              <div className="flex items-end gap-1" style={{ height: "160px" }}>
                {MONTHS.map((m, i) => {
                  const maxVal = Math.max(
                    ...prevYearFac, ...forecast,
                    ...monthlyRevenue.map((v) => v ?? 0),
                    1,
                  );
                  const prevH = (prevYearFac[i] / maxVal) * 100;
                  const foreH = (forecast[i] / maxVal) * 100;
                  const realH = monthlyRevenue[i] != null ? ((monthlyRevenue[i] as number) / maxVal) * 100 : 0;

                  return (
                    <div key={m} className="flex flex-1 flex-col items-center gap-0.5">
                      <div className="flex w-full items-end justify-center gap-px" style={{ height: "140px" }}>
                        {/* Prev year */}
                        <div
                          className="w-2 rounded-t bg-gray-300"
                          style={{ height: `${prevH}%`, minHeight: prevH > 0 ? "2px" : "0" }}
                          title={`Anterior: ${fmt(prevYearFac[i])}`}
                        />
                        {/* Forecast */}
                        <div
                          className="w-2 rounded-t bg-blue-400"
                          style={{ height: `${foreH}%`, minHeight: foreH > 0 ? "2px" : "0" }}
                          title={`Objetivo: ${fmt(forecast[i])}`}
                        />
                        {/* Real */}
                        <div
                          className={`w-2 rounded-t ${monthlyRevenue[i] != null ? (monthlyRevenue[i]! >= forecast[i] ? "bg-green-500" : "bg-red-400") : "bg-transparent"}`}
                          style={{ height: `${realH}%`, minHeight: realH > 0 ? "2px" : "0" }}
                          title={monthlyRevenue[i] != null ? `Real: ${fmt(monthlyRevenue[i]!)}` : "Sin dato"}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">{m}</span>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-gray-300" />
                  <span className="text-[10px] text-gray-500">Año anterior</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-blue-400" />
                  <span className="text-[10px] text-gray-500">Objetivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-green-500" />
                  <span className="text-[10px] text-gray-500">Real</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current month KPI cards */}
          {latestSnapshot && (
            <div>
              <h3 className="mb-3 text-base font-semibold text-gray-900">KPIs del último mes</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {KPI_FIELDS.map((field) => {
                  const value = latestSnapshot[field.key as keyof KpiSnapshot] as number | null;
                  const prevValue = previousSnapshot?.[field.key as keyof KpiSnapshot] as number | null;
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
                            {trend.icon} {trend.pct}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {value != null
                          ? `${value.toLocaleString("es-ES", { maximumFractionDigits: field.decimals })}${field.unit ? ` ${field.unit}` : ""}`
                          : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No data state */}
          {!latestSnapshot && !sistema?.objFac && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <BarChart3 size={40} className="mx-auto mb-3 text-gray-400" />
              <p className="mb-2 font-medium text-gray-600">Aún no tienes datos</p>
              <p className="text-sm text-gray-500">
                Completa el Diagnóstico 360° para establecer objetivos y empieza a registrar tus KPIs mensuales.
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
        </div>
      )}

      {/* ── TAB: Registro mensual ─────────────────── */}
      {tab === "registro" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Registra los KPIs de tu clínica mes a mes. Estos datos se reflejarán automáticamente en tu cuadro de mandos.
          </div>

          {/* Quick month selector */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Selecciona un mes</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {MONTHS.map((m, i) => {
                const my = `${year}-${String(i + 1).padStart(2, "0")}`;
                const hasData = snapshots.some((s) => s.monthYear === my);
                return (
                  <button
                    key={m}
                    onClick={() => loadMonthData(my)}
                    className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition ${
                      hasData
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-blue-300"
                    }`}
                  >
                    <span className="block">{m}</span>
                    {hasData && <span className="mt-1 block text-[10px] text-green-500">Registrado</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Historial ────────────────────────── */}
      {tab === "historial" && (
        <div>
          {snapshots.length > 0 ? (
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
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <p className="font-medium text-gray-600">No hay registros todavía</p>
              <p className="mt-1 text-sm text-gray-500">Empieza registrando tus KPIs del mes actual.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Editar/Añadir KPIs ─────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold text-gray-900">
              Métricas de {getMonthLabel(editMonth)}
            </h3>
            <p className="mb-5 text-xs text-gray-500">
              Rellena los KPIs que tengas. Los campos vacíos se guardan como &ldquo;sin dato&rdquo;.
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
