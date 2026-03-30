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
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type ServiceEntry = {
  revenue: number;
  sessions: number;
  uniquePatients12m: number;
};

type WorkerEntry = {
  revenue: number;
  sessions: number;
  isOwner: boolean;
};

type KpiSnapshot = {
  id: string;
  monthYear: string;
  // Per-entity JSON
  serviceData: Record<string, ServiceEntry> | null;
  workerData: Record<string, WorkerEntry> | null;
  // Inputs
  newPatients: number | null;
  totalPatients12m: number | null;
  singleVisitPat12m: number | null;
  nps: number | null;
  monthlyExpenses: Record<string, number> | null;
  useManualExpenses: boolean;
  // Computed
  revenue: number | null;
  avgTicket: number | null;
  churnPct: number | null;
  occupancy: number | null;
  grossMargin: number | null;
  // Legacy
  patientsActive: number | null;
  isBaseline: boolean;
};

type DiagService = {
  sid: number;
  name: string;
  facM: number[];
  sesM: number[];
  mins?: number;
};

type DiagWorker = {
  wid: number;
  name: string;
  tipo: string;
  hconv?: number;
  pct?: number;
};

type DiagGasto = {
  id: number;
  concepto: string;
  partida: string;
  valor: number;
};

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
    gastos?: DiagGasto[];
    costAlloc?: Record<string, Record<number, number>>;
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

const COST_GROUPS = ["APROV", "INFRA", "PERS_CLIN", "PERS_GEST", "MKT", "OTROS"];

const COST_LABELS: Record<string, string> = {
  APROV: "Aprovisionamiento",
  INFRA: "Infraestructura",
  PERS_CLIN: "Personal Clínico",
  PERS_GEST: "Personal Gestión",
  MKT: "Marketing",
  OTROS: "Otros",
};

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split("-");
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
}

function getCurrentMonthYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getTrend(
  current: number | null,
  previous: number | null,
  inverse = false
): { icon: React.ReactNode; color: string; pct: string } | null {
  if (current == null || previous == null || previous === 0) return null;
  const pct = (((current - previous) / Math.abs(previous)) * 100).toFixed(0);
  const num = parseInt(pct);
  const isUp = inverse ? num < 0 : num > 0;
  const isDown = inverse ? num > 0 : num < 0;
  return {
    icon: isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : <Minus size={14} />,
    color: isUp ? "text-green-600" : isDown ? "text-red-600" : "text-gray-400",
    pct: `${isUp ? "+" : ""}${pct}%`,
  };
}

function Section({
  title,
  icon,
  children,
  hint,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="text-indigo-600">{icon}</div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {hint && <span className="text-xs text-gray-500">({hint})</span>}
      </div>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function MetricasPage() {
  const [tab, setTab] = useState<"dashboard" | "registro" | "historial">("dashboard");
  const [snapshots, setSnapshots] = useState<KpiSnapshot[]>([]);
  const [editMonth, setEditMonth] = useState(getCurrentMonthYear());
  const [diagData, setDiagData] = useState<DiagData | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ─ Form state for registration
  const [serviceData, setServiceData] = useState<Record<string, ServiceEntry>>({});
  const [workerData, setWorkerData] = useState<Record<string, WorkerEntry>>({});
  const [newPatients, setNewPatients] = useState<number | null>(null);
  const [totalPatients12m, setTotalPatients12m] = useState<number | null>(null);
  const [singleVisitPat12m, setSingleVisitPat12m] = useState<number | null>(null);
  const [nps, setNps] = useState<number | null>(null);
  const [useManualExpenses, setUseManualExpenses] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({});

  const ej1 = diagData?.ejercicio1;
  const services = ej1?.srvs?.filter((s) => s.name) ?? [];
  const workers = ej1?.wrks?.filter((w) => w.name) ?? [];

  // Load snapshots and diag data
  useEffect(() => {
    const loadData = async () => {
      let loadedSnapshots: KpiSnapshot[] = [];
      try {
        const res = await fetch("/api/alumno/metricas");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        loadedSnapshots = data.snapshots || [];
        setSnapshots(loadedSnapshots);
      } catch (err) {
        console.error("Error loading metrics:", err);
      }

      try {
        const res = await fetch("/api/alumno/diag");
        if (!res.ok) throw new Error("Failed to fetch diagnostico");
        const data = await res.json();
        setDiagData(data);
      } catch (err) {
        console.error("Error loading diagnostico:", err);
      }

      // Auto-populate form state from latest snapshot so Dashboard cards show data
      if (loadedSnapshots.length > 0) {
        const latest = loadedSnapshots[loadedSnapshots.length - 1];
        setEditMonth(latest.monthYear);
        setServiceData(latest.serviceData || {});
        setWorkerData(latest.workerData || {});
        setNewPatients(latest.newPatients);
        setTotalPatients12m(latest.totalPatients12m);
        setSingleVisitPat12m(latest.singleVisitPat12m);
        setNps(latest.nps);
        setUseManualExpenses(latest.useManualExpenses ?? false);
        setMonthlyExpenses(latest.monthlyExpenses || {});
      }
    };

    loadData();
  }, []);

  // Load month data
  const loadMonthData = (monthYear: string) => {
    setEditMonth(monthYear);
    setTab("registro");
    const existing = snapshots.find((s) => s.monthYear === monthYear);

    if (existing) {
      setServiceData(existing.serviceData || {});
      setWorkerData(existing.workerData || {});
      setNewPatients(existing.newPatients);
      setTotalPatients12m(existing.totalPatients12m);
      setSingleVisitPat12m(existing.singleVisitPat12m);
      setNps(existing.nps);
      setUseManualExpenses(existing.useManualExpenses ?? false);
      setMonthlyExpenses(existing.monthlyExpenses || {});
    } else {
      setServiceData({});
      setWorkerData({});
      setNewPatients(null);
      setTotalPatients12m(null);
      setSingleVisitPat12m(null);
      setNps(null);
      setUseManualExpenses(false);
      setMonthlyExpenses({});
    }
  };

  // ─ Computed values
  const computedTotalRevenue = useMemo(() => {
    return sum(Object.values(serviceData).map((s) => s.revenue));
  }, [serviceData]);

  const computedTotalSessions = useMemo(() => {
    return sum(Object.values(serviceData).map((s) => s.sessions));
  }, [serviceData]);

  const computedAvgTicket = useMemo(() => {
    if (computedTotalSessions === 0) return 0;
    return computedTotalRevenue / computedTotalSessions;
  }, [computedTotalRevenue, computedTotalSessions]);

  // Recurrence: per service = sessions last 12m / uniquePatients12m
  const computedServiceRecurrence = useMemo(() => {
    const rec: Record<string, number> = {};
    services.forEach((srv) => {
      const key = String(srv.sid);
      const sd = serviceData[key];
      if (sd && sd.uniquePatients12m > 0) {
        rec[key] = sd.sessions / sd.uniquePatients12m;
      }
    });
    return rec;
  }, [services, serviceData]);

  // Global recurrence: weighted by service revenue
  const computedGlobalRecurrence = useMemo(() => {
    if (computedTotalRevenue === 0) return 0;
    let weighted = 0;
    services.forEach((srv) => {
      const key = String(srv.sid);
      const sd = serviceData[key];
      if (sd && sd.uniquePatients12m > 0) {
        const recurrence = sd.sessions / sd.uniquePatients12m;
        weighted += recurrence * (sd.revenue / computedTotalRevenue);
      }
    });
    return weighted;
  }, [services, serviceData, computedTotalRevenue]);

  // Owner productivity
  const computedOwnerRevenue = useMemo(() => {
    const owner = Object.values(workerData).find((w) => w.isOwner);
    return owner ? owner.revenue : 0;
  }, [workerData]);

  const computedOwnerProductivity = useMemo(() => {
    if (computedTotalRevenue === 0) return 0;
    return (computedOwnerRevenue / computedTotalRevenue) * 100;
  }, [computedOwnerRevenue, computedTotalRevenue]);

  // Churn rate
  const computedChurnRate = useMemo(() => {
    if (!totalPatients12m || totalPatients12m === 0) return null;
    if (!singleVisitPat12m) return null;
    return (singleVisitPat12m / totalPatients12m) * 100;
  }, [totalPatients12m, singleVisitPat12m]);

  // Occupancy: sum(srv.sessions * srv.mins / 60) / sum(wrk.hconv * 4.33) * 100
  const computedOccupancy = useMemo(() => {
    if (!ej1) return null;

    const totalHoursSold = services.reduce((acc, srv) => {
      const sd = serviceData[String(srv.sid)];
      if (sd) {
        const mins = srv.mins || 0;
        acc += (sd.sessions * mins) / 60;
      }
      return acc;
    }, 0);

    const totalHoursAvailable = workers.reduce((acc, wrk) => {
      const hconv = wrk.hconv || 0;
      acc += hconv * 4.33;
      return acc;
    }, 0);

    if (totalHoursAvailable === 0) return null;
    return (totalHoursSold / totalHoursAvailable) * 100;
  }, [ej1, services, workers, serviceData]);

  // Gross margin
  // costAlloc structure: { "APROV": { sid: pct, ... }, "INFRA": { sid: pct, ... }, ... }
  // gastos: [{ id, partida: "APROV_...", nombre, valor }] — partida starts with group key
  const COST_GROUP_KEYS = ["APROV", "INFRA", "PERS_CLIN", "PERS_GEST", "MKT", "OTROS"];

  const diagMonthlyCosts = useMemo(() => {
    if (!ej1?.gastos) return 0;
    // Total annual gastos from diagnostico, divided by 12 for monthly estimate
    const annualTotal = ej1.gastos.reduce((acc: number, g: DiagGasto) => acc + (Number(g.valor) || 0), 0);
    return annualTotal / 12;
  }, [ej1]);

  const computedGrossMargin = useMemo(() => {
    if (computedTotalRevenue === 0) return null;

    let costs = 0;

    if (useManualExpenses) {
      costs = sum(Object.values(monthlyExpenses));
    } else {
      // Use monthly cost estimate from diagnostico gastos
      if (!ej1?.gastos) return null;
      costs = diagMonthlyCosts;
    }

    const margin = ((computedTotalRevenue - costs) / computedTotalRevenue) * 100;
    return margin;
  }, [useManualExpenses, monthlyExpenses, computedTotalRevenue, ej1, diagMonthlyCosts]);

  // Save
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");

    try {
      const snapshot: KpiSnapshot = {
        id: `${editMonth}-${Date.now()}`,
        monthYear: editMonth,
        serviceData: Object.keys(serviceData).length > 0 ? serviceData : null,
        workerData: Object.keys(workerData).length > 0 ? workerData : null,
        newPatients,
        totalPatients12m,
        singleVisitPat12m,
        nps,
        monthlyExpenses: useManualExpenses && Object.keys(monthlyExpenses).length > 0 ? monthlyExpenses : null,
        useManualExpenses,
        revenue: computedTotalRevenue || null,
        avgTicket: computedAvgTicket || null,
        churnPct: computedChurnRate || null,
        occupancy: computedOccupancy || null,
        grossMargin: computedGrossMargin || null,
        patientsActive: null,
        isBaseline: false,
      };

      const res = await fetch("/api/alumno/metricas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSnapshots((prev) => {
        const filtered = prev.filter((s) => s.monthYear !== editMonth);
        return [...filtered, snapshot];
      });

      setSuccessMsg(`Métricas de ${getMonthLabel(editMonth)} guardadas`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving metrics:", err);
      setSuccessMsg("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // ─ Dashboard data
  const year = parseInt(editMonth.split("-")[0]);
  const month = parseInt(editMonth.split("-")[1]);
  const currentYearSnapshots = snapshots.filter((s) => s.monthYear.startsWith(String(year)));

  const monthlyRevenue = Array(12)
    .fill(0)
    .map((_, i) => {
      const my = `${year}-${String(i + 1).padStart(2, "0")}`;
      const snap = snapshots.find((s) => s.monthYear === my);
      return snap?.revenue ?? null;
    });

  const monthlyChurn = Array(12)
    .fill(0)
    .map((_, i) => {
      const my = `${year}-${String(i + 1).padStart(2, "0")}`;
      const snap = snapshots.find((s) => s.monthYear === my);
      return snap?.churnPct ?? null;
    });

  return (
    <div className="space-y-6 pb-40">
      {/* ══════════════════════════════════════════════════════════
          TAB NAVIGATION
          ══════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["dashboard", "registro", "historial"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition",
              tab === t
                ? "border-b-2 border-blue-600 text-blue-600"
                : "border-b-2 border-transparent text-gray-600 hover:text-gray-900"
            )}
          >
            {t === "dashboard" && "Dashboard"}
            {t === "registro" && "Registro de métricas"}
            {t === "historial" && "Historial"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB: Dashboard
          ══════════════════════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-gray-500">Facturación total</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {computedTotalRevenue > 0 ? fmt(computedTotalRevenue) : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-gray-500">Sesiones totales</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {computedTotalSessions > 0 ? computedTotalSessions : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-gray-500">Ticket medio</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {computedAvgTicket > 0 ? `${computedAvgTicket.toFixed(2)} €` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-gray-500">NPS</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{nps ?? "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-gray-500">Pacientes nuevos</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{newPatients ?? "—"}</p>
            </div>
            <div className={cn("rounded-lg border border-gray-200 p-4", computedChurnRate && computedChurnRate > 0 ? "bg-red-50" : "bg-white")}>
              <p className="text-xs font-medium uppercase text-gray-500">Churn %</p>
              <p className={cn("mt-2 text-2xl font-bold", computedChurnRate && computedChurnRate > 0 ? "text-red-600" : "text-gray-900")}>
                {computedChurnRate != null ? `${computedChurnRate.toFixed(1)}%` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-gray-500">Ocupación %</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {computedOccupancy != null ? `${computedOccupancy.toFixed(1)}%` : "—"}
              </p>
            </div>
            <div className={cn("rounded-lg border border-gray-200 p-4", computedGrossMargin && computedGrossMargin > 0 ? "bg-green-50" : "bg-white")}>
              <p className="text-xs font-medium uppercase text-gray-500">Margen bruto %</p>
              <p className={cn("mt-2 text-2xl font-bold", computedGrossMargin && computedGrossMargin > 0 ? "text-green-600" : "text-gray-900")}>
                {computedGrossMargin != null ? `${computedGrossMargin.toFixed(1)}%` : "—"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Recurrencia global (últimos 12 meses)</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {computedGlobalRecurrence > 0 ? `${computedGlobalRecurrence.toFixed(2)} ses/pac` : "—"}
            </p>
          </div>

          {/* Recent activity */}
          {snapshots.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 font-bold text-gray-900">Últimos registros</h3>
              <div className="space-y-2">
                {[...snapshots]
                  .reverse()
                  .slice(0, 5)
                  .map((snap) => (
                    <div key={snap.monthYear} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{getMonthLabel(snap.monthYear)}</span>
                      <span className="font-medium text-gray-900">{snap.revenue ? fmt(snap.revenue) : "—"}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: Registro de métricas
          ══════════════════════════════════════════════════════════ */}
      {tab === "registro" && (
        <div className="space-y-6">
          {/* Month selector */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <label className="text-sm font-medium text-gray-700">Mes a registrar:</label>
            <input
              type="month"
              value={editMonth}
              onChange={(e) => loadMonthData(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* 1. Facturación y ventas por servicio */}
          <Section title="Facturación y ventas por servicio" icon={<DollarSign size={20} />}>
            {services.length === 0 ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                <AlertCircle className="mb-2 inline" size={16} /> Completa primero el diagnóstico para registrar servicios.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Servicio</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Facturación (€)</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Sesiones</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Ticket medio</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Pac. únicos 12m</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((srv) => {
                        const key = String(srv.sid);
                        const sd = serviceData[key] || { revenue: 0, sessions: 0, uniquePatients12m: 0 };
                        const ticketMedio = sd.sessions > 0 ? sd.revenue / sd.sessions : 0;
                        return (
                          <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{srv.name}</td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={sd.revenue}
                                onChange={(e) =>
                                  setServiceData({
                                    ...serviceData,
                                    [key]: { ...sd, revenue: parseFloat(e.target.value) || 0 },
                                  })
                                }
                                className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={sd.sessions}
                                onChange={(e) =>
                                  setServiceData({
                                    ...serviceData,
                                    [key]: { ...sd, sessions: parseInt(e.target.value) || 0 },
                                  })
                                }
                                className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {ticketMedio > 0 ? `${ticketMedio.toFixed(2)} €` : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={sd.uniquePatients12m}
                                onChange={(e) =>
                                  setServiceData({
                                    ...serviceData,
                                    [key]: { ...sd, uniquePatients12m: parseInt(e.target.value) || 0 },
                                  })
                                }
                                placeholder="Búscalo en tu software"
                                className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                                title="Total de pacientes distintos atendidos en este servicio en los últimos 12 meses."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Recurrence per service */}
                <div className="mt-4 space-y-2 rounded-lg bg-indigo-50 p-4">
                  {services.map((srv) => {
                    const rec = computedServiceRecurrence[String(srv.sid)];
                    return (
                      <div key={srv.sid} className="flex items-center justify-between text-sm">
                        <span className="text-indigo-900">{srv.name}:</span>
                        <span className="font-medium text-indigo-700">
                          {rec ? `Recurrencia: ${rec.toFixed(2)} ses/pac` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Section>

          {/* 2. Facturación y ventas por profesional */}
          <Section title="Facturación y ventas por profesional" icon={<Briefcase size={20} />}>
            {workers.length === 0 ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                <AlertCircle className="mb-2 inline" size={16} /> Completa primero el diagnóstico para registrar profesionales.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Profesional</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Tipo</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Facturación (€)</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Sesiones</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Ticket medio</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Propietario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map((wrk) => {
                        const key = String(wrk.wid);
                        const wd = workerData[key] || { revenue: 0, sessions: 0, isOwner: false };
                        const ticketMedio = wd.sessions > 0 ? wd.revenue / wd.sessions : 0;
                        return (
                          <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{wrk.name}</td>
                            <td className="px-4 py-3 text-gray-600">{wrk.tipo}</td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={wd.revenue}
                                onChange={(e) =>
                                  setWorkerData({
                                    ...workerData,
                                    [key]: { ...wd, revenue: parseFloat(e.target.value) || 0 },
                                  })
                                }
                                className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={wd.sessions}
                                onChange={(e) =>
                                  setWorkerData({
                                    ...workerData,
                                    [key]: { ...wd, sessions: parseInt(e.target.value) || 0 },
                                  })
                                }
                                className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {ticketMedio > 0 ? `${ticketMedio.toFixed(2)} €` : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={wd.isOwner}
                                onChange={(e) => {
                                  const newWorkerData = { ...workerData };
                                  // Uncheck all others
                                  Object.keys(newWorkerData).forEach((w) => {
                                    newWorkerData[w] = { ...newWorkerData[w], isOwner: false };
                                  });
                                  // Check this one
                                  newWorkerData[key] = { ...wd, isOwner: e.target.checked };
                                  setWorkerData(newWorkerData);
                                }}
                                className="h-4 w-4 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Owner productivity */}
                <div className="mt-4 rounded-lg bg-violet-50 p-4 text-sm">
                  <p className="font-medium text-violet-900">
                    Productividad del propietario: {computedOwnerProductivity.toFixed(1)}%
                  </p>
                </div>
              </>
            )}
          </Section>

          {/* 3. Pacientes */}
          <Section title="Pacientes" icon={<Users size={20} />}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pacientes nuevos este mes</label>
                <input
                  type="number"
                  min="0"
                  value={newPatients ?? ""}
                  onChange={(e) => setNewPatients(parseInt(e.target.value) || null)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              {/* Churn section */}
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="mb-3 font-medium text-gray-900">CHURN</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pacientes totales últimos 12 meses</label>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Total de pacientes distintos que han sido atendidos en tu clínica en los últimos 12 meses. Búscalo en tu software de gestión.
                    </p>
                    <input
                      type="number"
                      min="0"
                      value={totalPatients12m ?? ""}
                      onChange={(e) => setTotalPatients12m(parseInt(e.target.value) || null)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Pacientes de 1 sola visita últimos 12 meses</label>
                    <p className="mt-0.5 text-xs text-gray-500">De todos esos pacientes, ¿cuántos vinieron solo 1 vez?</p>
                    <input
                      type="number"
                      min="0"
                      value={singleVisitPat12m ?? ""}
                      onChange={(e) => setSingleVisitPat12m(parseInt(e.target.value) || null)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>

                  {computedChurnRate != null && (
                    <div className={cn("rounded-lg p-3", computedChurnRate > 0 ? "bg-red-100" : "bg-green-100")}>
                      <p className={cn("text-sm font-medium", computedChurnRate > 0 ? "text-red-700" : "text-green-700")}>
                        Churn rate: {computedChurnRate.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* 4. NPS */}
          <Section title="NPS" icon={<Star size={20} />}>
            <div>
              <p className="mb-3 text-sm text-gray-600">
                En una escala del 0 al 10, ¿cuán probable es que tus pacientes te recomienden?
              </p>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNps(n)}
                    className={cn(
                      "h-10 w-10 rounded-lg border font-medium transition",
                      nps === n
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-900 hover:border-blue-600"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* 5. Ocupación */}
          <Section title="Ocupación (auto-calculada)" icon={<Clock size={20} />}>
            {!ej1 ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                <AlertCircle className="mb-2 inline" size={16} /> Completa primero el diagnóstico.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <p className="mb-2 font-medium text-gray-900">Desglose de cálculo:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>
                      Total horas vendidas: {services.reduce((acc, srv) => {
                        const sd = serviceData[String(srv.sid)];
                        if (sd) {
                          const mins = srv.mins || 0;
                          acc += (sd.sessions * mins) / 60;
                        }
                        return acc;
                      }, 0).toFixed(1)} h
                    </li>
                    <li>
                      Total horas disponibles: {workers.reduce((acc, wrk) => {
                        const hconv = wrk.hconv || 0;
                        acc += hconv * 4.33;
                        return acc;
                      }, 0).toFixed(1)} h
                    </li>
                  </ul>
                </div>
                {computedOccupancy != null ? (
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <p className="text-xs font-medium uppercase text-blue-500">Ocupación</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">{computedOccupancy.toFixed(1)}%</p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">—</div>
                )}
              </div>
            )}
          </Section>

          {/* 6. Margen bruto */}
          <Section title="Margen bruto" icon={<TrendingUp size={20} />}>
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUseManualExpenses(!useManualExpenses)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition",
                    useManualExpenses ? "bg-blue-600" : "bg-gray-300"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition",
                      useManualExpenses ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {useManualExpenses ? "Gastos manualmente" : "Usar diagnóstico"}
                </span>
              </div>

              {useManualExpenses ? (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Ten en cuenta la repercusión que hiciste en el ejercicio diagnóstico. Si has añadido nuevos servicios, deberás ajustar la repercusión.
                  </div>

                  <div className="space-y-3">
                    {COST_GROUPS.map((group) => (
                      <div key={group}>
                        <label className="text-sm font-medium text-gray-700">{COST_LABELS[group]}</label>
                        <input
                          type="number"
                          min="0"
                          value={monthlyExpenses[group] ?? ""}
                          onChange={(e) =>
                            setMonthlyExpenses({
                              ...monthlyExpenses,
                              [group]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                          placeholder="€"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {!ej1?.costAlloc || !ej1?.gastos ? (
                    <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                      <AlertCircle className="mb-2 inline" size={16} /> Datos de diagnóstico no disponibles.
                    </div>
                  ) : (
                    <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-700">
                      Auto-calculando costos desde diagnóstico...
                    </div>
                  )}
                </>
              )}

              {computedGrossMargin != null && (
                <div className={cn("rounded-lg p-4 text-center", computedGrossMargin > 0 ? "bg-green-50" : "bg-red-50")}>
                  <p className={cn("text-xs font-medium uppercase", computedGrossMargin > 0 ? "text-green-500" : "text-red-500")}>
                    Margen bruto
                  </p>
                  <p className={cn("mt-1 text-2xl font-bold", computedGrossMargin > 0 ? "text-green-700" : "text-red-700")}>
                    {computedGrossMargin.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* 7. Resumen auto-calculado */}
          <Section title="Resumen auto-calculado" icon={<Calculator size={20} />}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">Facturación total</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {computedTotalRevenue > 0 ? fmt(computedTotalRevenue) : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-500">Sesiones totales</p>
                <p className="mt-1 text-xl font-bold text-blue-700">
                  {computedTotalSessions > 0 ? computedTotalSessions : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-purple-500">Ticket medio</p>
                <p className="mt-1 text-xl font-bold text-purple-700">
                  {computedAvgTicket > 0 ? `${computedAvgTicket.toFixed(2)} €` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-cyan-50 p-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-500">Ocupación %</p>
                <p className="mt-1 text-xl font-bold text-cyan-700">
                  {computedOccupancy != null ? `${computedOccupancy.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div className={cn("rounded-lg p-4 text-center", computedChurnRate && computedChurnRate > 0 ? "bg-red-50" : "bg-orange-50")}>
                <p className={cn("text-[11px] font-medium uppercase tracking-wide", computedChurnRate && computedChurnRate > 0 ? "text-red-500" : "text-orange-500")}>
                  Churn %
                </p>
                <p className={cn("mt-1 text-xl font-bold", computedChurnRate && computedChurnRate > 0 ? "text-red-700" : "text-orange-700")}>
                  {computedChurnRate != null ? `${computedChurnRate.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div className={cn("rounded-lg p-4 text-center", computedGrossMargin && computedGrossMargin > 0 ? "bg-green-50" : "bg-gray-50")}>
                <p className={cn("text-[11px] font-medium uppercase tracking-wide", computedGrossMargin && computedGrossMargin > 0 ? "text-green-500" : "text-gray-500")}>
                  Margen bruto %
                </p>
                <p className={cn("mt-1 text-xl font-bold", computedGrossMargin && computedGrossMargin > 0 ? "text-green-700" : "text-gray-700")}>
                  {computedGrossMargin != null ? `${computedGrossMargin.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>
          </Section>

          {/* Save bar */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-lg">
            <div>
              {successMsg ? (
                <p className="text-sm font-medium text-green-600">{successMsg}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Registrando métricas de <strong>{getMonthLabel(editMonth)}</strong>
                </p>
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
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Churn %</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Ocupación %</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500">Margen %</th>
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
                      <td className="px-3 py-3 text-right text-gray-600">
                        {sum(Object.values(snap.serviceData || {}).map((s) => s.sessions)) > 0
                          ? sum(Object.values(snap.serviceData || {}).map((s) => s.sessions))
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.avgTicket != null ? `${snap.avgTicket.toFixed(2)} €` : "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.newPatients ?? "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.nps ?? "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.churnPct != null ? `${snap.churnPct.toFixed(1)}%` : "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.occupancy != null ? `${snap.occupancy.toFixed(1)}%` : "—"}</td>
                      <td className="px-3 py-3 text-right text-gray-600">{snap.grossMargin != null ? `${snap.grossMargin.toFixed(1)}%` : "—"}</td>
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
