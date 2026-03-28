"use client";

import { useState, useMemo } from "react";
import {
  Gamepad2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Star,
  UserPlus,
  Activity,
  Target,
  Percent,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENARIOS, type Scenario, type PlaygroundKpi } from "./scenarios";

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const MONTHS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function monthLabel(my: string) {
  const [y, m] = my.split("-");
  return `${MONTHS[m] || m} ${y.slice(2)}`;
}

// ══════════════════════════════════════════════════════════════
// KPI CARD
// ══════════════════════════════════════════════════════════════

function KpiCard({
  label,
  value,
  prev,
  format = "currency",
  icon,
}: {
  label: string;
  value: number | null;
  prev?: number | null;
  format?: "currency" | "number" | "percent" | "score";
  icon: React.ReactNode;
}) {
  const display = value == null ? "—" :
    format === "currency" ? fmt(value) :
    format === "percent" ? fmtPct(value) :
    format === "score" ? value.toFixed(1) :
    value.toLocaleString("es-ES");

  let trend: "up" | "down" | "flat" | null = null;
  let trendVal = "";
  if (value != null && prev != null && prev !== 0) {
    const diff = ((value - prev) / Math.abs(prev)) * 100;
    if (Math.abs(diff) < 0.5) trend = "flat";
    else if (diff > 0) trend = "up";
    else trend = "down";
    trendVal = `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{display}</p>
      {trend && (
        <div className={cn(
          "mt-1 flex items-center gap-1 text-xs font-medium",
          trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-gray-400"
        )}>
          {trend === "up" ? <TrendingUp size={14} /> : trend === "down" ? <TrendingDown size={14} /> : <Minus size={14} />}
          <span>{trendVal} vs mes anterior</span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MINI CHART — sparkline-style bars
// ══════════════════════════════════════════════════════════════

function MiniChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t bg-blue-500 transition-all"
            style={{ height: `${(v / max) * 100}%`, minHeight: 2 }}
          />
          <span className="text-[9px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EDITABLE KPI ROW (for tweaking scenario values)
// ══════════════════════════════════════════════════════════════

function EditableField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step ?? 1}
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {suffix && <span className="text-xs text-gray-400 w-6">{suffix}</span>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PLAYGROUND PAGE
// ══════════════════════════════════════════════════════════════

export default function PlaygroundPage() {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === selectedId)!;

  // Editable copy of the latest month's KPI
  const baseKpi = scenario.kpiHistory[scenario.kpiHistory.length - 1];
  const prevKpi = scenario.kpiHistory[scenario.kpiHistory.length - 2] ?? null;
  const [editKpi, setEditKpi] = useState<PlaygroundKpi>({ ...baseKpi });
  const [showEditor, setShowEditor] = useState(false);

  // Reset when scenario changes
  const handleScenarioChange = (id: string) => {
    setSelectedId(id);
    const sc = SCENARIOS.find((s) => s.id === id)!;
    const latest = sc.kpiHistory[sc.kpiHistory.length - 1];
    setEditKpi({ ...latest });
    setShowEditor(false);
  };

  // Recompute derived values
  const kpi = useMemo(() => {
    const totalRev = Object.values(editKpi.serviceData).reduce((s, v) => s + v.revenue, 0);
    const totalSes = Object.values(editKpi.serviceData).reduce((s, v) => s + v.sessions, 0);
    const totalExpenses = Object.values(editKpi.monthlyExpenses).reduce((s, v) => s + v, 0);
    return {
      ...editKpi,
      revenue: totalRev,
      totalSessions: totalSes,
      avgTicket: totalSes > 0 ? Math.round((totalRev / totalSes) * 100) / 100 : 0,
      grossMargin: totalRev > 0 ? Math.round(((totalRev - totalExpenses) / totalRev) * 10000) / 100 : 0,
    };
  }, [editKpi]);

  // Chart data — history + current edited month
  const historyForChart = [...scenario.kpiHistory.slice(0, -1), kpi];
  const chartLabels = historyForChart.map((h) => monthLabel(h.monthYear));
  const chartRevenue = historyForChart.map((h) => h.revenue);
  const chartSessions = historyForChart.map((h) => h.totalSessions);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Gamepad2 size={22} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Playground</h1>
          <p className="text-sm text-gray-500">
            Escenarios de demostración para enseñar cómo cambian los KPIs
          </p>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="grid gap-4 sm:grid-cols-3">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => handleScenarioChange(sc.id)}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              selectedId === sc.id
                ? `${sc.borderColor} ${sc.color} ring-2 ring-offset-1 ${sc.borderColor.replace("border", "ring")}`
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{sc.emoji}</span>
              <span className={cn("font-semibold", selectedId === sc.id ? sc.textColor : "text-gray-900")}>
                {sc.name}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{sc.description}</p>
          </button>
        ))}
      </div>

      {/* Scenario info bar */}
      <div className={cn("rounded-xl border p-4", scenario.borderColor, scenario.color)}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className={cn("font-medium", scenario.textColor)}>
            {scenario.emoji} {scenario.name}
          </span>
          <span className="text-gray-600">
            {scenario.services.length} servicios · {scenario.workers.length} profesionales · {scenario.gastos.length} partidas de gasto
          </span>
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Edit3 size={14} />
            {showEditor ? "Ocultar editor" : "Editar valores"}
            {showEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Editor panel */}
      {showEditor && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Editar datos del mes actual ({monthLabel(kpi.monthYear)})
          </h3>

          {/* Per service */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Por Servicio</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {scenario.services.map((srv) => {
                const key = String(srv.sid);
                const sd = editKpi.serviceData[key] || { revenue: 0, sessions: 0, uniquePatients12m: 0 };
                return (
                  <div key={key} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-800 mb-2">{srv.name}</p>
                    <EditableField
                      label="Facturación"
                      value={sd.revenue}
                      suffix="€"
                      onChange={(v) => setEditKpi((p) => ({
                        ...p,
                        serviceData: { ...p.serviceData, [key]: { ...sd, revenue: v } },
                      }))}
                    />
                    <EditableField
                      label="Sesiones"
                      value={sd.sessions}
                      onChange={(v) => setEditKpi((p) => ({
                        ...p,
                        serviceData: { ...p.serviceData, [key]: { ...sd, sessions: v } },
                      }))}
                    />
                    <EditableField
                      label="Pacientes únicos 12m"
                      value={sd.uniquePatients12m}
                      onChange={(v) => setEditKpi((p) => ({
                        ...p,
                        serviceData: { ...p.serviceData, [key]: { ...sd, uniquePatients12m: v } },
                      }))}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global inputs */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Indicadores Globales</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <EditableField label="Pacientes nuevos" value={editKpi.newPatients} onChange={(v) => setEditKpi((p) => ({ ...p, newPatients: v }))} />
                <EditableField label="Total pacientes 12m" value={editKpi.totalPatients12m} onChange={(v) => setEditKpi((p) => ({ ...p, totalPatients12m: v }))} />
                <EditableField label="Pac. 1 sola visita 12m" value={editKpi.singleVisitPat12m} onChange={(v) => setEditKpi((p) => ({ ...p, singleVisitPat12m: v }))} />
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <EditableField label="NPS (0-10)" value={editKpi.nps} min={0} max={10} step={0.1} onChange={(v) => setEditKpi((p) => ({ ...p, nps: v }))} />
                <EditableField label="Ocupación" value={editKpi.occupancy} suffix="%" min={0} max={100} onChange={(v) => setEditKpi((p) => ({ ...p, occupancy: v }))} />
              </div>
            </div>
          </div>

          {/* Monthly expenses */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Gastos Mensuales</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(editKpi.monthlyExpenses).map(([group, val]) => (
                <EditableField
                  key={group}
                  label={group.replace("_", " ")}
                  value={val}
                  suffix="€"
                  onChange={(v) => setEditKpi((p) => ({
                    ...p,
                    monthlyExpenses: { ...p.monthlyExpenses, [group]: v },
                  }))}
                />
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-end">
            <button
              onClick={() => setEditKpi({ ...baseKpi })}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Restaurar valores originales
            </button>
          </div>
        </div>
      )}

      {/* KPI Dashboard */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dashboard — {monthLabel(kpi.monthYear)}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Facturación"
            value={kpi.revenue}
            prev={prevKpi?.revenue}
            format="currency"
            icon={<DollarSign size={18} />}
          />
          <KpiCard
            label="Sesiones"
            value={kpi.totalSessions}
            prev={prevKpi?.totalSessions}
            format="number"
            icon={<Activity size={18} />}
          />
          <KpiCard
            label="Ticket Medio"
            value={kpi.avgTicket}
            prev={prevKpi?.avgTicket}
            format="currency"
            icon={<Target size={18} />}
          />
          <KpiCard
            label="Pacientes Nuevos"
            value={kpi.newPatients}
            prev={prevKpi?.newPatients}
            format="number"
            icon={<UserPlus size={18} />}
          />
          <KpiCard
            label="NPS"
            value={kpi.nps}
            prev={prevKpi?.nps}
            format="score"
            icon={<Star size={18} />}
          />
          <KpiCard
            label="Churn Rate"
            value={kpi.totalPatients12m > 0
              ? Math.round((kpi.singleVisitPat12m / kpi.totalPatients12m) * 10000) / 100
              : 0}
            prev={prevKpi ? (prevKpi.totalPatients12m > 0
              ? Math.round((prevKpi.singleVisitPat12m / prevKpi.totalPatients12m) * 10000) / 100
              : 0) : null}
            format="percent"
            icon={<TrendingDown size={18} />}
          />
          <KpiCard
            label="Ocupación"
            value={kpi.occupancy}
            prev={prevKpi?.occupancy}
            format="percent"
            icon={<Percent size={18} />}
          />
          <KpiCard
            label="Margen Bruto"
            value={kpi.grossMargin}
            prev={prevKpi?.grossMargin}
            format="percent"
            icon={<Briefcase size={18} />}
          />
          <KpiCard
            label="Equipo"
            value={scenario.workers.length}
            format="number"
            icon={<Users size={18} />}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Facturación (6 meses)</h3>
          <MiniChart data={chartRevenue} labels={chartLabels} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Sesiones (6 meses)</h3>
          <MiniChart data={chartSessions} labels={chartLabels} />
        </div>
      </div>

      {/* Per-service breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Desglose por Servicio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="pb-2 pr-4 font-medium">Servicio</th>
                <th className="pb-2 pr-4 font-medium text-right">Facturación</th>
                <th className="pb-2 pr-4 font-medium text-right">Sesiones</th>
                <th className="pb-2 pr-4 font-medium text-right">Ticket Medio</th>
                <th className="pb-2 pr-4 font-medium text-right">Pac. Únicos 12m</th>
                <th className="pb-2 font-medium text-right">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {scenario.services.map((srv) => {
                const key = String(srv.sid);
                const sd = kpi.serviceData[key];
                if (!sd) return null;
                const pctRev = kpi.revenue > 0 ? (sd.revenue / kpi.revenue) * 100 : 0;
                const ticket = sd.sessions > 0 ? sd.revenue / sd.sessions : 0;
                return (
                  <tr key={key} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{srv.name}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{fmt(sd.revenue)}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{sd.sessions}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{fmt(Math.round(ticket))}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{sd.uniquePatients12m}</td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {pctRev.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-worker breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Desglose por Profesional</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                <th className="pb-2 pr-4 font-medium">Profesional</th>
                <th className="pb-2 pr-4 font-medium text-right">Facturación</th>
                <th className="pb-2 pr-4 font-medium text-right">Sesiones</th>
                <th className="pb-2 pr-4 font-medium text-right">Horas/semana</th>
                <th className="pb-2 font-medium text-right">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {scenario.workers.map((wrk) => {
                const key = String(wrk.wid);
                const wd = kpi.workerData[key];
                if (!wd) return null;
                const pctRev = kpi.revenue > 0 ? (wd.revenue / kpi.revenue) * 100 : 0;
                return (
                  <tr key={key} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">
                      {wrk.name}
                      {wd.isOwner && (
                        <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                          OWNER
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-700">{fmt(wd.revenue)}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{wd.sessions}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{wrk.hconv}h</td>
                    <td className="py-2 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {pctRev.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gastos summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Estructura de Gastos</h3>
        <div className="space-y-3">
          {Object.entries(kpi.monthlyExpenses).map(([group, val]) => {
            const totalExp = Object.values(kpi.monthlyExpenses).reduce((s, v) => s + v, 0);
            const pct = totalExp > 0 ? (val / totalExp) * 100 : 0;
            const groupColors: Record<string, string> = {
              APROV: "bg-amber-500",
              INFRA: "bg-blue-500",
              PERS_CLIN: "bg-indigo-500",
              PERS_GEST: "bg-purple-500",
              MKT: "bg-pink-500",
              OTROS: "bg-gray-500",
            };
            const groupLabels: Record<string, string> = {
              APROV: "Aprovisionamiento",
              INFRA: "Infraestructura",
              PERS_CLIN: "Personal Clínico",
              PERS_GEST: "Personal Gestión",
              MKT: "Marketing",
              OTROS: "Otros",
            };
            return (
              <div key={group}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", groupColors[group] || "bg-gray-400")} />
                    <span className="text-gray-700">{groupLabels[group] || group}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{pct.toFixed(1)}%</span>
                    <span className="font-medium text-gray-800">{fmt(val)}</span>
                  </div>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                  <div
                    className={cn("h-1.5 rounded-full transition-all", groupColors[group] || "bg-gray-400")}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
            <span className="text-gray-700">Total Gastos</span>
            <span className="text-gray-900">
              {fmt(Object.values(kpi.monthlyExpenses).reduce((s, v) => s + v, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Resumen P&L</h3>
        {(() => {
          const totalExp = Object.values(kpi.monthlyExpenses).reduce((s, v) => s + v, 0);
          const benefit = kpi.revenue - totalExp;
          const isPositive = benefit >= 0;
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ingresos</span>
                <span className="font-semibold text-blue-700">{fmt(kpi.revenue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Gastos</span>
                <span className="font-semibold text-gray-600">-{fmt(totalExp)}</span>
              </div>
              <div className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                isPositive ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
              )}>
                <span className={isPositive ? "font-medium text-emerald-700" : "font-medium text-red-700"}>
                  Beneficio
                </span>
                <span className={cn("font-bold", isPositive ? "text-emerald-700" : "text-red-700")}>
                  {isPositive ? "+" : ""}{fmt(benefit)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
