"use client";

import { useState, useEffect, useMemo } from "react";
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
  UserPlus,
  Activity,
  Info,
  Calculator,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type ServiceEntry = { revenue: number; sessions: number };
type WorkerEntry = { revenue: number; sessions: number };

type KpiSnapshot = {
  id: string;
  monthYear: string;
  // Per-entity JSON
  serviceData: Record<string, ServiceEntry> | null;
  workerData: Record<string, WorkerEntry> | null;
  // Inputs
  newPatients: number | null;
  totalPatients: number | null;
  totalSessions: number | null;
  nps: number | null;
  churnPct: number | null;
  occupancy: number | null;
  ownerHours: number | null;
  grossMargin: number | null;
  // Computed
  revenue: number | null;
  avgTicket: number | null;
  recurrenceRate: number | null;
  // Legacy
  patientsActive: number | null;
  isBaseline: boolean;
};

type DiagService = { sid: number; name: string; facM: number[]; sesM: number[] };
type DiagWorker = { wid: number; name: string; tipo: string };

type DiagData = {
  ejercicio1?: {
    aFac: number[];
    aSes: number[];
    aNew: number[];
    gPac: number;
    gChurn: number;
    gNps: number;
    srvs: DiagService[];
    wrks: DiagWorker[];
  };
  sistema?: {
    objFac: number;
    forecast: number[];
    forecastSesiones: number[];
    palancas: string[];
    sueldo: number;
  };
};

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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
// SECTION CARD COMPONENT
// ══════════════════════════════════════════════════════════════

function Section({ title, icon, children, hint }: { title: string; icon: React.ReactNode; children: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded-lg bg-blue-50 p-1.5 text-blue-600">{icon}</span>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        </div>
        {hint && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>{hint}</span>
          </div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
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
  const [successMsg, setSuccessMsg] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");

  // Form state for the registration form
  const [srvForm, setSrvForm] = useState<Record<string, ServiceEntry>>({});
  const [wrkForm, setWrkForm] = useState<Record<string, WorkerEntry>>({});
  const [newPatients, setNewPatients] = useState("");
  const [totalPatients, setTotalPatients] = useState("");
  const [nps, setNps] = useState("");
  const [churnPct, setChurnPct] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [ownerHours, setOwnerHours] = useState("");
  const [grossMargin, setGrossMargin] = useState("");

  const year = new Date().getFullYear();

  // Diagnostico data
  const ej1 = diagData?.ejercicio1;
  const sistema = diagData?.sistema;
  const services = ej1?.srvs?.filter((s) => s.name) ?? [];
  const workers = ej1?.wrks?.filter((w) => w.name) ?? [];

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

  // ── Load month data into form ───────────────────────────────
  const loadMonthData = (monthYear: string) => {
    setEditMonth(monthYear);
    const existing = snapshots.find((s) => s.monthYear === monthYear);

    if (existing) {
      // Populate service form
      const sd = (existing.serviceData ?? {}) as Record<string, ServiceEntry>;
      setSrvForm(sd);

      // Populate worker form
      const wd = (existing.workerData ?? {}) as Record<string, WorkerEntry>;
      setWrkForm(wd);

      setNewPatients(existing.newPatients != null ? String(existing.newPatients) : "");
      setTotalPatients(existing.totalPatients != null ? String(existing.totalPatients) : "");
      setNps(existing.nps != null ? String(existing.nps) : "");
      setChurnPct(existing.churnPct != null ? String(existing.churnPct) : "");
      setOccupancy(existing.occupancy != null ? String(existing.occupancy) : "");
      setOwnerHours(existing.ownerHours != null ? String(existing.ownerHours) : "");
      setGrossMargin(existing.grossMargin != null ? String(existing.grossMargin) : "");
    } else {
      setSrvForm({});
      setWrkForm({});
      setNewPatients("");
      setTotalPatients("");
      setNps("");
      setChurnPct("");
      setOccupancy("");
      setOwnerHours("");
      setGrossMargin("");
    }

    setTab("registro");
  };

  // ── Computed values from form ───────────────────────────────
  const computedTotalRevenue = useMemo(() => {
    return Object.values(srvForm).reduce((acc, e) => acc + (Number(e.revenue) || 0), 0);
  }, [srvForm]);

  const computedTotalSessions = useMemo(() => {
    return Object.values(srvForm).reduce((acc, e) => acc + (Number(e.sessions) || 0), 0);
  }, [srvForm]);

  const computedAvgTicket = useMemo(() => {
    if (computedTotalSessions <= 0) return 0;
    return computedTotalRevenue / computedTotalSessions;
  }, [computedTotalRevenue, computedTotalSessions]);

  // Rolling 12-month recurrence from existing snapshots + current form
  const computedRecurrence = useMemo(() => {
    const [yearStr, monthStr] = editMonth.split("-");
    const y = parseInt(yearStr);
    const m = parseInt(monthStr);
    const months12: string[] = [];
    for (let i = 0; i < 12; i++) {
      let mm = m - i;
      let yy = y;
      while (mm <= 0) { mm += 12; yy -= 1; }
      months12.push(`${yy}-${String(mm).padStart(2, "0")}`);
    }

    let totalSes = 0;
    let totalPat = 0;

    // Past snapshots
    snapshots
      .filter((s) => months12.includes(s.monthYear) && s.monthYear !== editMonth)
      .forEach((s) => {
        totalSes += s.totalSessions ?? 0;
        totalPat += s.totalPatients ?? 0;
      });

    // Current month form data
    totalSes += computedTotalSessions || 0;
    totalPat += parseInt(totalPatients) || 0;

    if (totalPat <= 0) return null;
    return Math.round((totalSes / totalPat) * 100) / 100;
  }, [snapshots, editMonth, computedTotalSessions, totalPatients]);

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const payload = {
        monthYear: editMonth,
        serviceData: Object.keys(srvForm).length > 0 ? srvForm : null,
        workerData: Object.keys(wrkForm).length > 0 ? wrkForm : null,
        newPatients: newPatients !== "" ? parseInt(newPatients) : null,
        totalPatients: totalPatients !== "" ? parseInt(totalPatients) : null,
        totalSessions: computedTotalSessions > 0 ? computedTotalSessions : null,
        revenue: computedTotalRevenue > 0 ? computedTotalRevenue : null,
        nps: nps !== "" ? parseFloat(nps) : null,
        churnPct: churnPct !== "" ? parseFloat(churnPct) : null,
        occupancy: occupancy !== "" ? parseFloat(occupancy) : null,
        ownerHours: ownerHours !== "" ? parseFloat(ownerHours) : null,
        grossMargin: grossMargin !== "" ? parseFloat(grossMargin) : null,
      };

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
        setSuccessMsg("Métricas guardadas correctamente");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived data for dashboard ──────────────────────────────
  const forecast = sistema?.forecast ?? Array(12).fill(0);
  const forecastSes = sistema?.forecastSesiones ?? Array(12).fill(0);
  const prevYearFac = ej1?.aFac ?? Array(12).fill(0);

  const currentYearSnapshots = snapshots.filter((s) => s.monthYear.startsWith(String(year)));
  const monthlyRevenue = Array(12).fill(null) as (number | null)[];
  currentYearSnapshots.forEach((s) => {
    const monthIdx = parseInt(s.monthYear.split("-")[1]) - 1;
    monthlyRevenue[monthIdx] = s.revenue;
  });

  const actualFacYTD = sum(monthlyRevenue.map((v) => v ?? 0));
  const forecastYTD = sum(forecast.slice(0, new Date().getMonth() + 1));
  const prevYearFacTotal = sum(prevYearFac);
  const latestSnapshot = snapshots[snapshots.length - 1];
  const previousSnapshot = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const motivational = getMotivationalMessage(sistema?.objFac ?? 0, actualFacYTD, forecastYTD);

  // ── KPI summary fields for dashboard cards ──────────────────
  const dashboardKpis = [
    { key: "revenue", label: "Facturación", unit: "€", icon: <DollarSign size={16} />, color: "text-blue-600 bg-blue-50", decimals: 0 },
    { key: "totalSessions", label: "Sesiones totales", unit: "", icon: <Activity size={16} />, color: "text-indigo-600 bg-indigo-50", decimals: 0 },
    { key: "avgTicket", label: "Ticket medio", unit: "€", icon: <Calculator size={16} />, color: "text-emerald-600 bg-emerald-50", decimals: 2 },
    { key: "newPatients", label: "Pacientes nuevos", unit: "", icon: <UserPlus size={16} />, color: "text-cyan-600 bg-cyan-50", decimals: 0 },
    { key: "totalPatients", label: "Pacientes únicos", unit: "", icon: <Users size={16} />, color: "text-blue-600 bg-blue-50", decimals: 0 },
    { key: "recurrenceRate", label: "Recurrencia", unit: "ses/pac", icon: <ArrowUpRight size={16} />, color: "text-violet-600 bg-violet-50", decimals: 2 },
    { key: "occupancy", label: "Ocupación", unit: "%", icon: <Percent size={16} />, color: "text-amber-600 bg-amber-50", decimals: 1 },
    { key: "nps", label: "NPS", unit: "", icon: <Star size={16} />, color: "text-yellow-600 bg-yellow-50", decimals: 0 },
    { key: "churnPct", label: "Churn", unit: "%", icon: <TrendingDown size={16} />, color: "text-orange-600 bg-orange-50", decimals: 1 },
    { key: "ownerHours", label: "Horas propietario", unit: "h/sem", icon: <Clock size={16} />, color: "text-gray-600 bg-gray-50", decimals: 1 },
    { key: "grossMargin", label: "Margen bruto", unit: "%", icon: <Percent size={16} />, color: "text-teal-600 bg-teal-50", decimals: 1 },
  ];

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

      {/* ══════════════════════════════════════════════════════════
          TAB: Dashboard
          ══════════════════════════════════════════════════════════ */}
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

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Objetivo anual</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{sistema?.objFac ? fmt(sistema.objFac) : "—"}</p>
              <p className="mt-1 text-xs text-gray-400">Forecast YTD: {fmt(forecastYTD)}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Año anterior</p>
              <p className="mt-2 text-2xl font-bold text-gray-500">{fmt(prevYearFacTotal)}</p>
              {actualFacYTD > 0 && prevYearFacTotal > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  Crecimiento: <span className={actualFacYTD > sum(prevYearFac.slice(0, new Date().getMonth() + 1)) ? "text-green-600 font-medium" : "text-red-500"}>
                    {(((actualFacYTD / sum(prevYearFac.slice(0, new Date().getMonth() + 1))) - 1) * 100).toFixed(1)}%
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Último mes registrado</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {latestSnapshot ? getMonthLabel(latestSnapshot.monthYear) : "—"}
              </p>
              {latestSnapshot?.revenue != null && (
                <p className="mt-1 text-xs text-gray-400">Facturación: {fmt(latestSnapshot.revenue)}</p>
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
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium text-gray-400">Año ant.</td>
                    {prevYearFac.map((v: number, i: number) => (
                      <td key={i} className="py-2 text-center text-xs text-gray-400">{v > 0 ? fmt(v) : "—"}</td>
                    ))}
                    <td className="py-2 text-center text-xs font-semibold text-gray-400">{fmt(prevYearFacTotal)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium text-blue-600">Objetivo</td>
                    {forecast.map((v: number, i: number) => (
                      <td key={i} className="py-2 text-center text-xs text-blue-600">{v > 0 ? fmt(v) : "—"}</td>
                    ))}
                    <td className="py-2 text-center text-xs font-semibold text-blue-700">{fmt(sum(forecast))}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium text-green-600">Real</td>
                    {monthlyRevenue.map((v, i) => (
                      <td key={i} className="py-2 text-center text-xs font-medium">
                        {v != null ? (
                          <span className={v >= (forecast[i] || 0) ? "text-green-600" : "text-red-500"}>{fmt(v)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 text-center text-xs font-bold text-green-700">{fmt(actualFacYTD)}</td>
                  </tr>
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
                  const maxVal = Math.max(...prevYearFac, ...forecast, ...monthlyRevenue.map((v) => v ?? 0), 1);
                  const prevH = (prevYearFac[i] / maxVal) * 100;
                  const foreH = (forecast[i] / maxVal) * 100;
                  const realH = monthlyRevenue[i] != null ? ((monthlyRevenue[i] as number) / maxVal) * 100 : 0;
                  return (
                    <div key={m} className="flex flex-1 flex-col items-center gap-0.5">
                      <div className="flex w-full items-end justify-center gap-px" style={{ height: "140px" }}>
                        <div className="w-2 rounded-t bg-gray-300" style={{ height: `${prevH}%`, minHeight: prevH > 0 ? "2px" : "0" }} title={`Anterior: ${fmt(prevYearFac[i])}`} />
                        <div className="w-2 rounded-t bg-blue-400" style={{ height: `${foreH}%`, minHeight: foreH > 0 ? "2px" : "0" }} title={`Objetivo: ${fmt(forecast[i])}`} />
                        <div className={`w-2 rounded-t ${monthlyRevenue[i] != null ? (monthlyRevenue[i]! >= forecast[i] ? "bg-green-500" : "bg-red-400") : "bg-transparent"}`}
                          style={{ height: `${realH}%`, minHeight: realH > 0 ? "2px" : "0" }}
                          title={monthlyRevenue[i] != null ? `Real: ${fmt(monthlyRevenue[i]!)}` : "Sin dato"} />
                      </div>
                      <span className="text-[10px] text-gray-400">{m}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-gray-300" /><span className="text-[10px] text-gray-500">Año anterior</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-blue-400" /><span className="text-[10px] text-gray-500">Objetivo</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-green-500" /><span className="text-[10px] text-gray-500">Real</span></div>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          {latestSnapshot && (
            <div>
              <h3 className="mb-3 text-base font-semibold text-gray-900">KPIs del último mes</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dashboardKpis.map((field) => {
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

      {/* ══════════════════════════════════════════════════════════
          TAB: Registro mensual
          ══════════════════════════════════════════════════════════ */}
      {tab === "registro" && (
        <div className="space-y-6">
          {/* Month selector */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Selecciona un mes</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {MONTHS.map((m, i) => {
                const my = `${year}-${String(i + 1).padStart(2, "0")}`;
                const hasData = snapshots.some((s) => s.monthYear === my);
                const isSelected = my === editMonth;
                return (
                  <button
                    key={m}
                    onClick={() => loadMonthData(my)}
                    className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200"
                        : hasData
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

          {/* ── Registration form ──────────────────────────── */}
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 px-5 py-3 text-center">
            <p className="text-base font-semibold text-blue-800">
              Registro de métricas: {getMonthLabel(editMonth)}
            </p>
          </div>

          {services.length === 0 && workers.length === 0 && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4 text-center text-sm text-amber-700">
              <p className="font-medium">No tienes servicios ni profesionales definidos</p>
              <p className="mt-1">Completa primero el Diagnóstico 360° (Paso 1) para definir tus servicios y equipo.</p>
            </div>
          )}

          {/* ── 1. Facturación y ventas por servicio ────────── */}
          {services.length > 0 && (
            <Section
              title="Facturación y ventas por servicio"
              icon={<DollarSign size={16} />}
              hint="Introduce la facturación y el número de sesiones de cada servicio en este mes. El ticket medio se calcula automáticamente."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-left text-xs font-medium text-gray-500">Servicio</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500">Facturación (€)</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500">Sesiones</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500">
                        <span className="flex items-center justify-end gap-1">
                          <Calculator size={12} />
                          Ticket medio
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((srv) => {
                      const key = String(srv.sid);
                      const entry = srvForm[key] ?? { revenue: 0, sessions: 0 };
                      const ticket = entry.sessions > 0 ? entry.revenue / entry.sessions : 0;
                      return (
                        <tr key={srv.sid} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900">{srv.name}</td>
                          <td className="py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={entry.revenue || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSrvForm((prev) => ({ ...prev, [key]: { ...entry, revenue: val } }));
                              }}
                              placeholder="0"
                              className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={entry.sessions || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setSrvForm((prev) => ({ ...prev, [key]: { ...entry, sessions: val } }));
                              }}
                              placeholder="0"
                              className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <span className="inline-block w-24 rounded-lg bg-gray-100 px-3 py-1.5 text-right text-sm font-semibold tabular-nums text-gray-700">
                              {ticket > 0 ? `${ticket.toFixed(2)} €` : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-semibold">
                      <td className="py-3 text-gray-700">TOTAL</td>
                      <td className="py-3 text-right text-gray-700">{fmt(computedTotalRevenue)}</td>
                      <td className="py-3 text-right text-gray-700">{computedTotalSessions.toLocaleString("es-ES")}</td>
                      <td className="py-3 text-right text-gray-700">
                        {computedAvgTicket > 0 ? `${computedAvgTicket.toFixed(2)} €` : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Section>
          )}

          {/* ── 2. Facturación y ventas por profesional ─────── */}
          {workers.length > 0 && (
            <Section
              title="Facturación y ventas por profesional"
              icon={<Briefcase size={16} />}
              hint="Introduce la facturación y sesiones de cada profesional. Estos datos te ayudarán a evaluar la productividad individual."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-left text-xs font-medium text-gray-500">Profesional</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-400">Tipo</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500">Facturación (€)</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500">Sesiones</th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500">
                        <span className="flex items-center justify-end gap-1">
                          <Calculator size={12} />
                          Ticket medio
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((wrk) => {
                      const key = String(wrk.wid);
                      const entry = wrkForm[key] ?? { revenue: 0, sessions: 0 };
                      const ticket = entry.sessions > 0 ? entry.revenue / entry.sessions : 0;
                      return (
                        <tr key={wrk.wid} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900">{wrk.name}</td>
                          <td className="py-3 text-xs text-gray-400">{wrk.tipo || "—"}</td>
                          <td className="py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={entry.revenue || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setWrkForm((prev) => ({ ...prev, [key]: { ...entry, revenue: val } }));
                              }}
                              placeholder="0"
                              className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={entry.sessions || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setWrkForm((prev) => ({ ...prev, [key]: { ...entry, sessions: val } }));
                              }}
                              placeholder="0"
                              className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <span className="inline-block w-24 rounded-lg bg-gray-100 px-3 py-1.5 text-right text-sm font-semibold tabular-nums text-gray-700">
                              {ticket > 0 ? `${ticket.toFixed(2)} €` : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* ── 3. Métricas de pacientes ──────────────────── */}
          <Section
            title="Pacientes y sesiones"
            icon={<Users size={16} />}
            hint="Pacientes nuevos y pacientes únicos totales del mes. Estos datos los puedes obtener de tu software de gestión clínica."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Pacientes nuevos este mes</label>
                <p className="mb-2 text-[11px] text-gray-400">Pacientes que han acudido por primera vez a tu clínica</p>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={newPatients}
                  onChange={(e) => setNewPatients(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Pacientes únicos totales</label>
                <p className="mb-2 text-[11px] text-gray-400">Total de pacientes distintos que han sido atendidos este mes. Búscalo en tu software de gestión.</p>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={totalPatients}
                  onChange={(e) => setTotalPatients(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </Section>

          {/* ── 4. Indicadores clave ──────────────────────── */}
          <Section
            title="Indicadores clave"
            icon={<Activity size={16} />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">NPS (Net Promoter Score)</label>
                <p className="mb-2 text-[11px] text-gray-400">De -100 a 100. ¿Cuán probable es que tus pacientes te recomienden?</p>
                <input
                  type="number"
                  min={-100}
                  max={100}
                  step={1}
                  value={nps}
                  onChange={(e) => setNps(e.target.value)}
                  placeholder="—"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Churn rate (%)</label>
                <p className="mb-2 text-[11px] text-gray-400">% de pacientes que han dejado de acudir este mes</p>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={churnPct}
                  onChange={(e) => setChurnPct(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Ocupación (%)</label>
                <p className="mb-2 text-[11px] text-gray-400">% de horas ocupadas respecto a las disponibles</p>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Horas semanales del propietario</label>
                <p className="mb-2 text-[11px] text-gray-400">Media de horas semanales que dedicas a la clínica</p>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={ownerHours}
                  onChange={(e) => setOwnerHours(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">Margen bruto (%)</label>
                <p className="mb-2 text-[11px] text-gray-400">% de beneficio tras costes directos</p>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={grossMargin}
                  onChange={(e) => setGrossMargin(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </Section>

          {/* ── 5. Resumen y valores calculados ────────────── */}
          <Section
            title="Resumen auto-calculado"
            icon={<Calculator size={16} />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">Facturación total</p>
                <p className="mt-1 text-xl font-bold text-blue-700">{fmt(computedTotalRevenue)}</p>
                <p className="mt-0.5 text-[10px] text-blue-400">Suma de servicios</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">Sesiones totales</p>
                <p className="mt-1 text-xl font-bold text-indigo-700">{computedTotalSessions.toLocaleString("es-ES")}</p>
                <p className="mt-0.5 text-[10px] text-indigo-400">Suma de servicios</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">Ticket medio</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {computedAvgTicket > 0 ? `${computedAvgTicket.toFixed(2)} €` : "—"}
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-400">Facturación / Sesiones</p>
              </div>
              <div className="rounded-lg bg-violet-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-violet-500">Tasa recurrencia</p>
                <p className="mt-1 text-xl font-bold text-violet-700">
                  {computedRecurrence != null ? `${computedRecurrence.toFixed(2)} ses/pac` : "—"}
                </p>
                <p className="mt-0.5 text-[10px] text-violet-400">Últimos 12 meses</p>
              </div>
            </div>
          </Section>

          {/* ── Save bar ────────────────────────────────────── */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-lg">
            <div>
              {successMsg ? (
                <p className="text-sm font-medium text-green-600">{successMsg}</p>
              ) : (
                <p className="text-sm text-gray-500">Registrando métricas de <strong>{getMonthLabel(editMonth)}</strong></p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Guardando..." : "Guardar métricas"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: Historial
          ══════════════════════════════════════════════════════════ */}
      {tab === "historial" && (
        <div>
          {snapshots.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Mes</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Facturación</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Sesiones</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Ticket medio</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Pac. nuevos</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">NPS</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Churn</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Recurrencia</th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map((snap) => (
                    <tr key={snap.monthYear} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {getMonthLabel(snap.monthYear)}
                        {snap.isBaseline && (
                          <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">BASE</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.revenue != null ? fmt(snap.revenue) : "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.totalSessions != null ? snap.totalSessions.toLocaleString("es-ES") : "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.avgTicket != null ? `${snap.avgTicket.toFixed(2)} €` : "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.newPatients ?? "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.nps ?? "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.churnPct != null ? `${snap.churnPct}%` : "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.recurrenceRate != null ? `${snap.recurrenceRate.toFixed(2)}` : "—"}</td>
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
    </div>
  );
}
