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
  Building2,
  Receipt,
  Zap,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENARIOS, type Scenario, type PlaygroundKpi } from "./scenarios";

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const sumArr = (arr: number[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const COST_GROUPS = [
  { key: "APROV", label: "Aprovisionamiento", color: "bg-amber-500" },
  { key: "INFRA", label: "Infraestructura", color: "bg-blue-500" },
  { key: "PERS_CLIN", label: "Personal clínico", color: "bg-indigo-500" },
  { key: "PERS_GEST", label: "Personal gestión", color: "bg-purple-500" },
  { key: "MKT", label: "Marketing", color: "bg-pink-500" },
  { key: "OTROS", label: "Otros", color: "bg-gray-500" },
];

function monthLabel(my: string) {
  const [y, m] = my.split("-");
  const mi = parseInt(m) - 1;
  return `${MONTHS[mi] || m} ${y.slice(2)}`;
}

// ══════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ══════════════════════════════════════════════════════════════

function KpiCard({ label, value, prev, format = "currency", icon }: {
  label: string; value: number | null; prev?: number | null;
  format?: "currency" | "number" | "percent" | "score"; icon: React.ReactNode;
}) {
  const display = value == null ? "—" : format === "currency" ? fmt(value) : format === "percent" ? fmtPct(value) : format === "score" ? value.toFixed(1) : value.toLocaleString("es-ES");
  let trend: "up" | "down" | "flat" | null = null; let trendVal = "";
  if (value != null && prev != null && prev !== 0) {
    const diff = ((value - prev) / Math.abs(prev)) * 100;
    if (Math.abs(diff) < 0.5) trend = "flat"; else if (diff > 0) trend = "up"; else trend = "down";
    trendVal = `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">{label}</span><span className="text-gray-400">{icon}</span></div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{display}</p>
      {trend && (<div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-gray-400")}>{trend === "up" ? <TrendingUp size={14} /> : trend === "down" ? <TrendingDown size={14} /> : <Minus size={14} />}<span>{trendVal} vs mes ant.</span></div>)}
    </div>
  );
}

function MiniChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1); const min = Math.min(...data); const range = max - min || 1;
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((v, i) => {
        const pct = 20 + ((v - min) / range) * 80;
        return (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full rounded-t bg-blue-500 transition-all" style={{ height: `${pct}%`, minHeight: 2 }} />
          <span className="text-[9px] text-gray-400">{labels[i]}</span>
        </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DIAGNOSTICO VIEW — Radiografía + Capacidad + Estrategia
// ══════════════════════════════════════════════════════════════

function DiagnosticoView({ scenario }: { scenario: Scenario }) {
  const { ejercicio1: ej1, ejercicio2: ej2, sistema } = scenario.diagData;
  const totalFac = sumArr(ej1.aFac);
  const totalSes = sumArr(ej1.aSes);
  const totalNew = sumArr(ej1.aNew);
  const totalGastosMes = ej1.gastos.reduce((s, g) => s + g.valor, 0);
  const totalGastosAnual = totalGastosMes * 12;
  const ticketMedio = totalSes > 0 ? totalFac / totalSes : 0;
  const beneficio = totalFac - totalGastosAnual;

  // Group gastos by prefix
  const gastosByGroup: Record<string, number> = {};
  for (const g of ej1.gastos) {
    const grp = COST_GROUPS.find(cg => g.partida.startsWith(cg.key));
    const key = grp?.key || "OTROS";
    gastosByGroup[key] = (gastosByGroup[key] || 0) + g.valor;
  }

  return (
    <div className="space-y-6">
      {/* ── RADIOGRAFÍA ─────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Radiografía del Año Anterior</h3>
        </div>

        {/* Monthly billing chart */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">Facturación mensual</p>
          <div className="flex items-end gap-1 h-24">
            {ej1.aFac.map((v, i) => {
              const max = Math.max(...ej1.aFac, 1); const min = Math.min(...ej1.aFac); const range = max - min || 1;
              const pct = 20 + ((v - min) / range) * 80; // min bar = 20%, max = 100%
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[8px] text-gray-400">{fmt(v)}</span>
                  <div className="w-full rounded-t bg-blue-500" style={{ height: `${pct}%`, minHeight: 2 }} />
                  <span className="text-[9px] text-gray-400">{MONTHS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg bg-blue-50 p-3"><p className="text-[10px] text-blue-600 font-medium">Facturación anual</p><p className="text-lg font-bold text-gray-900">{fmt(totalFac)}</p></div>
          <div className="rounded-lg bg-blue-50 p-3"><p className="text-[10px] text-blue-600 font-medium">Sesiones anuales</p><p className="text-lg font-bold text-gray-900">{totalSes.toLocaleString("es-ES")}</p></div>
          <div className="rounded-lg bg-blue-50 p-3"><p className="text-[10px] text-blue-600 font-medium">Ticket medio</p><p className="text-lg font-bold text-gray-900">{fmt(Math.round(ticketMedio))}</p></div>
          <div className="rounded-lg bg-blue-50 p-3"><p className="text-[10px] text-blue-600 font-medium">Pac. nuevos anuales</p><p className="text-lg font-bold text-gray-900">{totalNew}</p></div>
        </div>

        {/* KPIs globales */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg border border-gray-100 p-3"><p className="text-[10px] text-gray-500">Pacientes totales</p><p className="font-bold text-gray-900">{ej1.gPac}</p></div>
          <div className="rounded-lg border border-gray-100 p-3"><p className="text-[10px] text-gray-500">Churn anual</p><p className="font-bold text-gray-900">{ej1.gChurn}%</p></div>
          <div className="rounded-lg border border-gray-100 p-3"><p className="text-[10px] text-gray-500">NPS</p><p className="font-bold text-gray-900">{ej1.gNps}</p></div>
        </div>

        {/* Services table */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Servicios</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-500"><th className="pb-2 pr-3 text-left font-medium">Servicio</th><th className="pb-2 pr-3 text-right font-medium">Duración</th><th className="pb-2 pr-3 text-right font-medium">Precio</th><th className="pb-2 pr-3 text-right font-medium">Fac. anual</th><th className="pb-2 pr-3 text-right font-medium">Sesiones</th><th className="pb-2 text-right font-medium">Pacientes</th></tr></thead>
              <tbody>
                {ej1.srvs.map(srv => (
                  <tr key={srv.sid} className="border-b border-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-800">{srv.name}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{srv.mins} min</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{fmt(srv.precio)}</td>
                    <td className="py-2 pr-3 text-right text-gray-700">{fmt(sumArr(srv.facM))}</td>
                    <td className="py-2 pr-3 text-right text-gray-700">{sumArr(srv.sesM).toLocaleString("es-ES")}</td>
                    <td className="py-2 text-right text-gray-700">{srv.pac}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workers table */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Profesionales</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-500"><th className="pb-2 pr-3 text-left font-medium">Profesional</th><th className="pb-2 pr-3 text-right font-medium">Tipo</th><th className="pb-2 pr-3 text-right font-medium">Horas/sem</th><th className="pb-2 pr-3 text-right font-medium">Dedicación</th><th className="pb-2 text-right font-medium">Servicios</th></tr></thead>
              <tbody>
                {ej1.wrks.map(wrk => (
                  <tr key={wrk.wid} className="border-b border-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-800">{wrk.name}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{wrk.tipo}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{wrk.hconv}h</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{wrk.pct}%</td>
                    <td className="py-2 text-right text-gray-600">{wrk.srvIds.map(id => ej1.srvs.find(s => s.sid === id)?.name || id).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gastos breakdown */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Gastos mensuales</p>
          <div className="space-y-2">
            {COST_GROUPS.map(cg => {
              const val = gastosByGroup[cg.key] || 0;
              if (val === 0) return null;
              const pctVal = totalGastosMes > 0 ? (val / totalGastosMes) * 100 : 0;
              return (
                <div key={cg.key}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><div className={cn("h-2.5 w-2.5 rounded-full", cg.color)} /><span className="text-gray-700">{cg.label}</span></div>
                    <div className="flex items-center gap-3"><span className="text-gray-500">{pctVal.toFixed(1)}%</span><span className="font-medium text-gray-800">{fmt(val)}</span></div>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100"><div className={cn("h-1.5 rounded-full", cg.color)} style={{ width: `${Math.min(pctVal, 100)}%` }} /></div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
              <span className="text-gray-700">Total mensual</span><span className="text-gray-900">{fmt(totalGastosMes)}</span>
            </div>
          </div>
        </div>

        {/* P&L */}
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Resultado anual</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos</span><span className="font-semibold text-blue-700">{fmt(totalFac)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Gastos</span><span className="font-semibold text-gray-600">-{fmt(totalGastosAnual)}</span></div>
            <div className={cn("flex justify-between rounded-lg px-3 py-2 text-sm", beneficio >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200")}>
              <span className={beneficio >= 0 ? "font-medium text-emerald-700" : "font-medium text-red-700"}>Beneficio</span>
              <span className={cn("font-bold", beneficio >= 0 ? "text-emerald-700" : "text-red-700")}>{beneficio >= 0 ? "+" : ""}{fmt(beneficio)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CAPACIDAD INSTALADA ─────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Capacidad Instalada</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-[10px] text-gray-500">Días/semana</p><p className="font-bold text-gray-900">{ej2.diasSem}</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-[10px] text-gray-500">Semanas/año</p><p className="font-bold text-gray-900">{ej2.semanasAno}</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-500"><th className="pb-2 pr-3 text-left font-medium">Sala</th><th className="pb-2 pr-3 text-right font-medium">Servicio</th><th className="pb-2 pr-3 text-right font-medium">Ses/hora</th><th className="pb-2 pr-3 text-right font-medium">Horas/día</th><th className="pb-2 pr-3 text-right font-medium">Ticket deseado</th><th className="pb-2 text-right font-medium">Cap. semanal €</th></tr></thead>
            <tbody>
              {ej2.salas.map(sala => {
                const capSem = sala.sesHora * sala.horasDia * ej2.diasSem * sala.ticket;
                return (
                  <tr key={sala.id} className="border-b border-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-800">{sala.nombre}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{sala.servNombre}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{sala.sesHora}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{sala.horasDia}h</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{fmt(sala.ticket)}</td>
                    <td className="py-2 text-right font-medium text-gray-700">{fmt(capSem)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(() => {
          const capAnual = ej2.salas.reduce((s, sala) => s + sala.sesHora * sala.horasDia * ej2.diasSem * sala.ticket * ej2.semanasAno, 0);
          const capActual80 = capAnual * 0.8;
          return (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 p-3"><p className="text-[10px] text-blue-600 font-medium">Cap. anual 100%</p><p className="text-lg font-bold text-gray-900">{fmt(capAnual)}</p></div>
              <div className="rounded-lg bg-emerald-50 p-3"><p className="text-[10px] text-emerald-600 font-medium">Cap. óptima (80%)</p><p className="text-lg font-bold text-gray-900">{fmt(capActual80)}</p></div>
            </div>
          );
        })()}
      </div>

      {/* ── OBJETIVO Y ESTRATEGIA ──────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Objetivo y Estrategia</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-[10px] text-gray-500">Sueldo deseado</p><p className="font-bold text-gray-900">{fmt(sistema.sueldo)}/mes</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-[10px] text-gray-500">Margen objetivo</p><p className="font-bold text-gray-900">{sistema.margen}%</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-[10px] text-gray-500">Fac. año anterior</p><p className="font-bold text-gray-900">{fmt(sistema.facAnoAnterior)}</p></div>
          <div className="rounded-lg bg-blue-50 p-3"><p className="text-[10px] text-blue-600 font-medium">Objetivo facturación</p><p className="text-lg font-bold text-gray-900">{fmt(sistema.objFac)}</p></div>
        </div>

        {/* Palancas */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Palancas seleccionadas</p>
          <div className="space-y-3">
            {sistema.palancas.map(p => {
              const det = sistema.palancaDetalles[p];
              const PALANCAS_MAP: Record<string, { label: string; icon: string }> = {
                precio: { label: "Subida de precios", icon: "💰" },
                recurrencia: { label: "Recurrencia", icon: "🔄" },
                captacion: { label: "Captación", icon: "🎯" },
                retencion: { label: "Fidelización", icon: "🤝" },
                ocupacion: { label: "Ocupación", icon: "📈" },
                servicios: { label: "Nuevos servicios", icon: "✨" },
                costes: { label: "Reducción costes", icon: "✂️" },
              };
              const info = PALANCAS_MAP[p] || { label: p, icon: "⚡" };
              return (
                <div key={p} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{info.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{info.label}</span>
                  </div>
                  {det && <p className="text-xs text-gray-600 ml-6">{det.enfoque}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Forecast chart */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Forecast mensual</p>
          <div className="flex items-end gap-1 h-20">
            {(() => { const fMax = Math.max(...sistema.forecast, 1); const fMin = Math.min(...sistema.forecast); const fRange = fMax - fMin || 1; return sistema.forecast.map((v, i) => {
              const pct = 20 + ((v - fMin) / fRange) * 80;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-t bg-emerald-500" style={{ height: `${pct}%`, minHeight: 2 }} />
                  <span className="text-[9px] text-gray-400">{MONTHS[i]}</span>
                </div>
              );
            }); })()}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Total forecast: {fmt(sumArr(sistema.forecast))}</span>
            <span>Δ vs anterior: {sistema.facAnoAnterior > 0 ? `+${(((sumArr(sistema.forecast) - sistema.facAnoAnterior) / sistema.facAnoAnterior) * 100).toFixed(1)}%` : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CUADRO DE MANDOS VIEW — KPI Dashboard + history
// ══════════════════════════════════════════════════════════════

function CuadroMandosView({ scenario }: { scenario: Scenario }) {
  const kpiHistory = scenario.kpiHistory;
  const kpi = kpiHistory[kpiHistory.length - 1];
  const prevKpi = kpiHistory[kpiHistory.length - 2] ?? null;
  const ej1 = scenario.diagData.ejercicio1;

  const chartLabels = kpiHistory.map(h => monthLabel(h.monthYear));
  const chartRevenue = kpiHistory.map(h => h.revenue);
  const chartSessions = kpiHistory.map(h => h.totalSessions);

  const churnCalc = kpi.totalPatients12m > 0 ? Math.round((kpi.singleVisitPat12m / kpi.totalPatients12m) * 10000) / 100 : 0;
  const prevChurn = prevKpi && prevKpi.totalPatients12m > 0 ? Math.round((prevKpi.singleVisitPat12m / prevKpi.totalPatients12m) * 10000) / 100 : null;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Facturación" value={kpi.revenue} prev={prevKpi?.revenue} format="currency" icon={<DollarSign size={18} />} />
        <KpiCard label="Sesiones" value={kpi.totalSessions} prev={prevKpi?.totalSessions} format="number" icon={<Activity size={18} />} />
        <KpiCard label="Ticket Medio" value={kpi.avgTicket} prev={prevKpi?.avgTicket} format="currency" icon={<Target size={18} />} />
        <KpiCard label="Pacientes Nuevos" value={kpi.newPatients} prev={prevKpi?.newPatients} format="number" icon={<UserPlus size={18} />} />
        <KpiCard label="NPS" value={kpi.nps} prev={prevKpi?.nps} format="score" icon={<Star size={18} />} />
        <KpiCard label="Churn Rate" value={churnCalc} prev={prevChurn} format="percent" icon={<TrendingDown size={18} />} />
        <KpiCard label="Ocupación" value={kpi.occupancy} prev={prevKpi?.occupancy} format="percent" icon={<Percent size={18} />} />
        <KpiCard label="Margen Bruto" value={kpi.grossMargin} prev={prevKpi?.grossMargin} format="percent" icon={<Briefcase size={18} />} />
        <KpiCard label="Equipo" value={ej1.wrks.length} format="number" icon={<Users size={18} />} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h3 className="mb-3 text-sm font-semibold text-gray-700">Facturación (6 meses)</h3><MiniChart data={chartRevenue} labels={chartLabels} /></div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h3 className="mb-3 text-sm font-semibold text-gray-700">Sesiones (6 meses)</h3><MiniChart data={chartSessions} labels={chartLabels} /></div>
      </div>

      {/* Per-service breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Desglose por Servicio — {monthLabel(kpi.monthYear)}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-500"><th className="pb-2 pr-4 font-medium">Servicio</th><th className="pb-2 pr-4 font-medium text-right">Facturación</th><th className="pb-2 pr-4 font-medium text-right">Sesiones</th><th className="pb-2 pr-4 font-medium text-right">Ticket Medio</th><th className="pb-2 pr-4 font-medium text-right">Pac. Únicos 12m</th><th className="pb-2 font-medium text-right">% Total</th></tr></thead>
            <tbody>
              {ej1.srvs.map(srv => {
                const key = String(srv.sid); const sd = kpi.serviceData[key]; if (!sd) return null;
                const pctRev = kpi.revenue > 0 ? (sd.revenue / kpi.revenue) * 100 : 0;
                const ticket = sd.sessions > 0 ? sd.revenue / sd.sessions : 0;
                return (
                  <tr key={key} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{srv.name}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{fmt(sd.revenue)}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{sd.sessions}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{fmt(Math.round(ticket))}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{sd.uniquePatients12m}</td>
                    <td className="py-2 text-right"><span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{pctRev.toFixed(1)}%</span></td>
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
            <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-500"><th className="pb-2 pr-4 font-medium">Profesional</th><th className="pb-2 pr-4 font-medium text-right">Facturación</th><th className="pb-2 pr-4 font-medium text-right">Sesiones</th><th className="pb-2 pr-4 font-medium text-right">Horas/sem</th><th className="pb-2 font-medium text-right">% Total</th></tr></thead>
            <tbody>
              {ej1.wrks.map(wrk => {
                const key = String(wrk.wid); const wd = kpi.workerData[key]; if (!wd) return null;
                const pctRev = kpi.revenue > 0 ? (wd.revenue / kpi.revenue) * 100 : 0;
                return (
                  <tr key={key} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{wrk.name}{wd.isOwner && <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">OWNER</span>}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{fmt(wd.revenue)}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{wd.sessions}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{wrk.hconv}h</td>
                    <td className="py-2 text-right"><span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{pctRev.toFixed(1)}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gastos + P&L */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Estructura de Gastos + P&L</h3>
        <div className="space-y-3 mb-4">
          {Object.entries(kpi.monthlyExpenses).map(([group, val]) => {
            const totalExp = Object.values(kpi.monthlyExpenses).reduce((s, v) => s + v, 0);
            const pct = totalExp > 0 ? (val / totalExp) * 100 : 0;
            const cg = COST_GROUPS.find(c => c.key === group);
            if (!cg || val === 0) return null;
            return (
              <div key={group}>
                <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className={cn("h-2.5 w-2.5 rounded-full", cg.color)} /><span className="text-gray-700">{cg.label}</span></div><div className="flex items-center gap-3"><span className="text-gray-500">{pct.toFixed(1)}%</span><span className="font-medium text-gray-800">{fmt(val)}</span></div></div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100"><div className={cn("h-1.5 rounded-full", cg.color)} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              </div>
            );
          })}
        </div>
        {(() => {
          const totalExp = Object.values(kpi.monthlyExpenses).reduce((s, v) => s + v, 0);
          const benefit = kpi.revenue - totalExp;
          return (
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Ingresos</span><span className="font-semibold text-blue-700">{fmt(kpi.revenue)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Gastos</span><span className="font-semibold text-gray-600">-{fmt(totalExp)}</span></div>
              <div className={cn("flex justify-between rounded-lg px-3 py-2 text-sm", benefit >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200")}>
                <span className={benefit >= 0 ? "font-medium text-emerald-700" : "font-medium text-red-700"}>Beneficio</span>
                <span className={cn("font-bold", benefit >= 0 ? "text-emerald-700" : "text-red-700")}>{benefit >= 0 ? "+" : ""}{fmt(benefit)}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* History table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Historial de KPIs (6 meses)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-500"><th className="pb-2 pr-3 text-left font-medium">Mes</th><th className="pb-2 pr-3 text-right font-medium">Facturación</th><th className="pb-2 pr-3 text-right font-medium">Sesiones</th><th className="pb-2 pr-3 text-right font-medium">Ticket</th><th className="pb-2 pr-3 text-right font-medium">NPS</th><th className="pb-2 pr-3 text-right font-medium">Ocupación</th><th className="pb-2 text-right font-medium">Margen</th></tr></thead>
            <tbody>
              {kpiHistory.map(h => (
                <tr key={h.monthYear} className="border-b border-gray-50">
                  <td className="py-2 pr-3 font-medium text-gray-800">{monthLabel(h.monthYear)}</td>
                  <td className="py-2 pr-3 text-right text-gray-700">{fmt(h.revenue)}</td>
                  <td className="py-2 pr-3 text-right text-gray-700">{h.totalSessions}</td>
                  <td className="py-2 pr-3 text-right text-gray-700">{fmt(Math.round(h.avgTicket))}</td>
                  <td className="py-2 pr-3 text-right text-gray-700">{h.nps.toFixed(1)}</td>
                  <td className="py-2 pr-3 text-right text-gray-700">{h.occupancy}%</td>
                  <td className="py-2 text-right"><span className={cn("font-medium", h.grossMargin >= 20 ? "text-emerald-600" : h.grossMargin >= 10 ? "text-amber-600" : "text-red-600")}>{h.grossMargin.toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PLAYGROUND PAGE
// ══════════════════════════════════════════════════════════════

type Tab = "diagnostico" | "metricas";

export default function PlaygroundPage() {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const [tab, setTab] = useState<Tab>("diagnostico");
  const scenario = SCENARIOS.find(s => s.id === selectedId)!;

  const handleScenarioChange = (id: string) => {
    setSelectedId(id);
    setTab("diagnostico");
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "diagnostico", label: "Diagnóstico 360°", icon: <BarChart3 size={16} /> },
    { key: "metricas", label: "Cuadro de Mandos", icon: <Activity size={16} /> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100"><Gamepad2 size={22} className="text-orange-600" /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Playground</h1>
          <p className="text-sm text-gray-500">Escenarios de demostración — proceso completo de un alumno</p>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="grid gap-4 sm:grid-cols-3">
        {SCENARIOS.map(sc => (
          <button key={sc.id} onClick={() => handleScenarioChange(sc.id)} className={cn(
            "rounded-xl border-2 p-4 text-left transition-all",
            selectedId === sc.id ? `${sc.borderColor} ${sc.color} ring-2 ring-offset-1 ${sc.borderColor.replace("border", "ring")}` : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          )}>
            <div className="flex items-center gap-2"><span className="text-xl">{sc.emoji}</span><span className={cn("font-semibold", selectedId === sc.id ? sc.textColor : "text-gray-900")}>{sc.name}</span></div>
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{sc.description}</p>
          </button>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Scenario info */}
      <div className={cn("rounded-xl border px-4 py-3", scenario.borderColor, scenario.color)}>
        <span className={cn("text-sm font-medium", scenario.textColor)}>
          {scenario.emoji} {scenario.name}
        </span>
        <span className="ml-3 text-sm text-gray-600">
          {scenario.diagData.ejercicio1.srvs.length} servicios · {scenario.diagData.ejercicio1.wrks.length} profesionales · {scenario.diagData.ejercicio1.gastos.length} partidas de gasto
        </span>
      </div>

      {/* Content */}
      {tab === "diagnostico" ? (
        <DiagnosticoView scenario={scenario} />
      ) : (
        <CuadroMandosView scenario={scenario} />
      )}
    </div>
  );
}
