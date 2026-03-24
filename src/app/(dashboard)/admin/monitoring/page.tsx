"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Zap,
  DollarSign,
  Users,
  AlertTriangle,
  Bot,
  Clock,
  TrendingUp,
  Hash,
  Loader,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────
type GlobalStats = {
  totalSessions: number;
  totalTokens: number;
  totalCost: number;
  totalAlumnos: number;
  activeAlerts: number;
  avgTokensPerSession: number;
  avgCostPerSession: number;
};

type DailyUsage = {
  date: string;
  sessions: number;
  tokens: number;
  cost: number;
};

type ModeUsage = {
  mode: string;
  sessions: number;
  tokens: number;
  cost: number;
};

type StepUsage = {
  step: number;
  sessions: number;
  tokens: number;
  cost: number;
};

type CohortUsage = {
  name: string;
  program: string;
  sessions: number;
  tokens: number;
  cost: number;
};

type TopUser = {
  id: string;
  name: string;
  sessions: number;
  tokens: number;
  cost: number;
  cohort: string;
};

type StudentActivity = {
  userId: string;
  name: string;
  cohort: string;
  program: string;
  currentStep: number;
  completedSteps: number;
  lastSession: string | null;
  activityStatus: "active" | "warning" | "inactive";
};

type RecentSession = {
  id: string;
  user: string;
  cohort: string;
  mode: string;
  stepNumber: number;
  tokensUsed: number;
  costEstimate: number;
  startedAt: string;
};

type AlertItem = {
  id: string;
  type: string;
  message: string;
  user: string;
  cohort: string;
  triggeredAt: string;
  resolvedAt: string | null;
};

type MonthlyCost = {
  month: string;
  sessions: number;
  tokens: number;
  cost: number;
};

type MonitoringData = {
  global: GlobalStats;
  dailyUsage: DailyUsage[];
  byMode: ModeUsage[];
  byStep: StepUsage[];
  byCohort: CohortUsage[];
  topUsers: TopUser[];
  studentActivity: StudentActivity[];
  recentSessions: RecentSession[];
  alerts: AlertItem[];
  monthlyCost: MonthlyCost[];
};

// ── Helpers ────────────────────────────────────────────────────────────
const MODE_LABELS: Record<string, string> = {
  ACOMPANANTE: "Acompañante",
  ANALISTA: "Analista",
  GENERADOR: "Generador",
};

const MODE_COLORS: Record<string, string> = {
  ACOMPANANTE: "bg-blue-100 text-blue-700",
  ANALISTA: "bg-purple-100 text-purple-700",
  GENERADOR: "bg-emerald-100 text-emerald-700",
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  INACTIVITY: "Inactividad",
  KPI_DEVIATION: "Desviación KPI",
  CONCEPTUAL_ERROR: "Error conceptual",
  COHERENCE: "Coherencia",
  BLOCK: "Bloqueo",
};

const PROGRAM_COLORS: Record<string, string> = {
  ACTIVA: "bg-blue-100 text-blue-700",
  OPTIMIZA: "bg-purple-100 text-purple-700",
  ESCALA: "bg-amber-100 text-amber-700",
};

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Ayer";
  return `Hace ${days}d`;
}

function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(month) - 1]} '${year.slice(2)}`;
}

// ── Sparkline bar chart ────────────────────────────────────────────────
function MiniBarChart({
  data,
  valueKey,
  color = "bg-blue-500",
  height = 48,
}: {
  data: { date: string; [key: string]: string | number }[];
  valueKey: string;
  color?: string;
  height?: number;
}) {
  const values = data.map((d) => (d[valueKey] as number) || 0);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((d, i) => {
        const val = (d[valueKey] as number) || 0;
        const h = (val / max) * height;
        return (
          <div
            key={d.date}
            className="group relative flex-1"
            style={{ height }}
          >
            <div
              className={cn("absolute bottom-0 w-full rounded-t-sm transition-all", color)}
              style={{ height: Math.max(h, 1) }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-800 px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap group-hover:block">
              {d.date.slice(5)}: {val.toLocaleString("es-ES")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Horizontal bar ─────────────────────────────────────────────────────
function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

// ── Tab component ──────────────────────────────────────────────────────
type Tab = "overview" | "usage" | "students" | "alerts";

// ════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════
export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | "active" | "warning" | "inactive">("all");

  useEffect(() => {
    fetch("/api/admin/monitoring")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle size={32} className="mx-auto mb-2 text-red-400" />
        <p className="font-medium text-red-700">Error al cargar datos de monitoring</p>
      </div>
    );
  }

  const { global: g } = data;
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Resumen", icon: <Activity size={16} /> },
    { key: "usage", label: "Uso IA", icon: <Bot size={16} /> },
    { key: "students", label: "Alumnos", icon: <Users size={16} /> },
    { key: "alerts", label: "Alertas", icon: <AlertTriangle size={16} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monitoring IA</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consumo de KNAAS, actividad de alumnos y alertas del sistema
        </p>
      </div>

      {/* Global Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Sesiones KNAAS", value: g.totalSessions.toLocaleString("es-ES"), icon: <Bot size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Tokens totales", value: formatTokens(g.totalTokens), icon: <Zap size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Coste total", value: formatCost(g.totalCost), icon: <DollarSign size={18} />, color: "bg-green-50 text-green-600" },
          { label: "Coste / sesión", value: formatCost(g.avgCostPerSession), icon: <TrendingUp size={18} />, color: "bg-purple-50 text-purple-600" },
          { label: "Alumnos", value: g.totalAlumnos.toString(), icon: <Users size={18} />, color: "bg-cyan-50 text-cyan-600" },
          { label: "Alertas activas", value: g.activeAlerts.toString(), icon: <AlertTriangle size={18} />, color: g.activeAlerts > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <div className={cn("rounded-lg p-1.5", card.color)}>{card.icon}</div>
            </div>
            <p className="mt-2 text-xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "usage" && <UsageTab data={data} />}
      {activeTab === "students" && (
        <StudentsTab
          data={data}
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
        />
      )}
      {activeTab === "alerts" && <AlertsTab data={data} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ════════════════════════════════════════════════════════════════════════
function OverviewTab({ data }: { data: MonitoringData }) {
  return (
    <div className="space-y-6">
      {/* Daily usage chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Actividad diaria (últimos 30 días)</h3>
        <p className="mb-4 text-xs text-gray-500">Sesiones KNAAS por día</p>
        <MiniBarChart data={data.dailyUsage} valueKey="sessions" color="bg-blue-400" height={64} />
        <div className="mt-2 flex justify-between text-[10px] text-gray-400">
          <span>{data.dailyUsage[0]?.date.slice(5)}</span>
          <span>{data.dailyUsage[data.dailyUsage.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Two columns: cost trend + mode breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly cost */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Coste mensual</h3>
          {data.monthlyCost.length === 0 ? (
            <p className="text-xs text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {data.monthlyCost.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-gray-500">{getMonthLabel(m.month)}</span>
                  <div className="flex-1">
                    <HBar
                      value={m.cost}
                      max={Math.max(...data.monthlyCost.map((x) => x.cost), 1)}
                      color="bg-green-400"
                    />
                  </div>
                  <span className="w-16 text-right text-xs font-bold text-gray-700">
                    {formatCost(m.cost)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mode breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Uso por modo</h3>
          {data.byMode.length === 0 ? (
            <p className="text-xs text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {data.byMode.map((m) => {
                const totalSessions = data.byMode.reduce((sum, x) => sum + x.sessions, 0);
                const pct = totalSessions > 0 ? ((m.sessions / totalSessions) * 100).toFixed(0) : "0";
                return (
                  <div key={m.mode} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-28 rounded-full px-2.5 py-1 text-center text-xs font-medium",
                        MODE_COLORS[m.mode] ?? "bg-gray-100 text-gray-600"
                      )}
                    >
                      {MODE_LABELS[m.mode] ?? m.mode}
                    </span>
                    <div className="flex-1">
                      <HBar
                        value={m.sessions}
                        max={Math.max(...data.byMode.map((x) => x.sessions), 1)}
                        color={
                          m.mode === "ACOMPANANTE"
                            ? "bg-blue-400"
                            : m.mode === "ANALISTA"
                              ? "bg-purple-400"
                              : "bg-emerald-400"
                        }
                      />
                    </div>
                    <div className="w-20 text-right">
                      <span className="text-xs font-bold text-gray-700">{m.sessions}</span>
                      <span className="ml-1 text-[10px] text-gray-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
              <div className="mt-2 border-t border-gray-100 pt-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {data.byMode.map((m) => (
                    <div key={m.mode}>
                      <p className="text-[10px] text-gray-400">{MODE_LABELS[m.mode] ?? m.mode}</p>
                      <p className="text-xs font-bold text-gray-700">{formatCost(m.cost)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top users + cohort breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top users */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Top 10 alumnos por consumo</h3>
          {data.topUsers.length === 0 ? (
            <p className="text-xs text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {data.topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900">{u.name}</p>
                    <p className="text-[10px] text-gray-400">{u.cohort}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-700">{formatCost(u.cost)}</p>
                    <p className="text-[10px] text-gray-400">{u.sessions} ses.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cohort breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Consumo por cohorte</h3>
          {data.byCohort.length === 0 ? (
            <p className="text-xs text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {data.byCohort.map((c) => (
                <div key={c.name} className="rounded-lg border border-gray-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">{c.name}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          PROGRAM_COLORS[c.program] ?? "bg-gray-100 text-gray-600"
                        )}
                      >
                        {c.program}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-green-600">{formatCost(c.cost)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded bg-gray-50 px-2 py-1">
                      <p className="text-[10px] text-gray-400">Sesiones</p>
                      <p className="text-xs font-bold text-gray-700">{c.sessions}</p>
                    </div>
                    <div className="rounded bg-gray-50 px-2 py-1">
                      <p className="text-[10px] text-gray-400">Tokens</p>
                      <p className="text-xs font-bold text-gray-700">{formatTokens(c.tokens)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: USAGE (detailed AI usage)
// ════════════════════════════════════════════════════════════════════════
function UsageTab({ data }: { data: MonitoringData }) {
  return (
    <div className="space-y-6">
      {/* Daily cost chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Coste diario (últimos 30 días)</h3>
        <p className="mb-4 text-xs text-gray-500">Gasto en USD por día</p>
        <MiniBarChart data={data.dailyUsage} valueKey="cost" color="bg-green-400" height={64} />
        <div className="mt-2 flex justify-between text-[10px] text-gray-400">
          <span>{data.dailyUsage[0]?.date.slice(5)}</span>
          <span>{data.dailyUsage[data.dailyUsage.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Token chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Tokens diarios</h3>
        <p className="mb-4 text-xs text-gray-500">Consumo de tokens por día</p>
        <MiniBarChart data={data.dailyUsage} valueKey="tokens" color="bg-amber-400" height={64} />
        <div className="mt-2 flex justify-between text-[10px] text-gray-400">
          <span>{data.dailyUsage[0]?.date.slice(5)}</span>
          <span>{data.dailyUsage[data.dailyUsage.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Usage by step */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Uso por paso del programa</h3>
        {data.byStep.length === 0 ? (
          <p className="text-xs text-gray-400">Sin datos</p>
        ) : (
          <div className="space-y-2">
            {data.byStep.map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                  {s.step}
                </span>
                <div className="flex-1">
                  <HBar
                    value={s.sessions}
                    max={Math.max(...data.byStep.map((x) => x.sessions), 1)}
                    color="bg-blue-400"
                  />
                </div>
                <div className="flex w-36 items-center gap-3 text-right">
                  <span className="text-xs text-gray-500">{s.sessions} ses.</span>
                  <span className="text-xs font-medium text-gray-700">{formatTokens(s.tokens)} tok</span>
                  <span className="text-xs font-bold text-green-600">{formatCost(s.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent sessions table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Últimas 20 sesiones</h3>
        {data.recentSessions.length === 0 ? (
          <p className="text-xs text-gray-400">Sin sesiones</p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 border-b border-gray-100 pb-2 text-[10px] font-medium text-gray-400">
              <span className="col-span-3">Alumno</span>
              <span className="col-span-2">Cohorte</span>
              <span className="col-span-2">Modo</span>
              <span className="col-span-1 text-center">Paso</span>
              <span className="col-span-1 text-right">Tokens</span>
              <span className="col-span-1 text-right">Coste</span>
              <span className="col-span-2 text-right">Fecha</span>
            </div>
            {data.recentSessions.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-12 gap-2 rounded-lg px-0 py-2 text-xs hover:bg-gray-50"
              >
                <span className="col-span-3 truncate font-medium text-gray-900">{s.user}</span>
                <span className="col-span-2 truncate text-gray-500">{s.cohort}</span>
                <span className="col-span-2">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                      MODE_COLORS[s.mode] ?? "bg-gray-100 text-gray-600"
                    )}
                  >
                    {MODE_LABELS[s.mode] ?? s.mode}
                  </span>
                </span>
                <span className="col-span-1 text-center text-gray-600">P{s.stepNumber}</span>
                <span className="col-span-1 text-right text-gray-600">{formatTokens(s.tokensUsed)}</span>
                <span className="col-span-1 text-right font-medium text-green-600">{formatCost(s.costEstimate)}</span>
                <span className="col-span-2 text-right text-gray-400">{timeAgo(s.startedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: STUDENTS
// ════════════════════════════════════════════════════════════════════════
function StudentsTab({
  data,
  activityFilter,
  setActivityFilter,
}: {
  data: MonitoringData;
  activityFilter: "all" | "active" | "warning" | "inactive";
  setActivityFilter: (f: "all" | "active" | "warning" | "inactive") => void;
}) {
  const filtered =
    activityFilter === "all"
      ? data.studentActivity
      : data.studentActivity.filter((s) => s.activityStatus === activityFilter);

  const counts = {
    all: data.studentActivity.length,
    active: data.studentActivity.filter((s) => s.activityStatus === "active").length,
    warning: data.studentActivity.filter((s) => s.activityStatus === "warning").length,
    inactive: data.studentActivity.filter((s) => s.activityStatus === "inactive").length,
  };

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: "Todos", color: "bg-gray-100 text-gray-700" },
            { key: "active", label: "Activos", color: "bg-green-100 text-green-700" },
            { key: "warning", label: "Riesgo", color: "bg-amber-100 text-amber-700" },
            { key: "inactive", label: "Inactivos", color: "bg-red-100 text-red-700" },
          ] as const
        ).map((pill) => (
          <button
            key={pill.key}
            onClick={() => setActivityFilter(pill.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              activityFilter === pill.key
                ? cn(pill.color, "ring-2 ring-offset-1", pill.key === "all" ? "ring-gray-300" : pill.key === "active" ? "ring-green-300" : pill.key === "warning" ? "ring-amber-300" : "ring-red-300")
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            )}
          >
            {pill.label} ({counts[pill.key]})
          </button>
        ))}
      </div>

      {/* Student cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <Users size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">No hay alumnos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const statusConfig = {
              active: { color: "border-l-green-400 bg-green-50/30", badge: "bg-green-100 text-green-700", label: "Activo", icon: <CheckCircle size={12} /> },
              warning: { color: "border-l-amber-400 bg-amber-50/30", badge: "bg-amber-100 text-amber-700", label: "Riesgo", icon: <Clock size={12} /> },
              inactive: { color: "border-l-red-400 bg-red-50/30", badge: "bg-red-100 text-red-700", label: "Inactivo", icon: <XCircle size={12} /> },
            }[s.activityStatus];

            const progressPct = Math.round((s.completedSteps / 16) * 100);

            return (
              <div
                key={s.userId}
                className={cn(
                  "rounded-xl border border-gray-200 border-l-4 p-4",
                  statusConfig.color
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">{s.cohort}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            PROGRAM_COLORS[s.program] ?? "bg-gray-100 text-gray-600"
                          )}
                        >
                          {s.program}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress */}
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Progreso</p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-gray-200">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              progressPct >= 75
                                ? "bg-green-400"
                                : progressPct >= 40
                                  ? "bg-blue-400"
                                  : "bg-amber-400"
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600">
                          {s.completedSteps}/16
                        </span>
                      </div>
                    </div>
                    {/* Current step */}
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Paso actual</p>
                      <p className="text-xs font-bold text-blue-600">P{s.currentStep || "—"}</p>
                    </div>
                    {/* Last session */}
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Última sesión</p>
                      <p className="text-xs font-medium text-gray-700">
                        {s.lastSession ? timeAgo(s.lastSession) : "Nunca"}
                      </p>
                    </div>
                    {/* Status badge */}
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium",
                        statusConfig.badge
                      )}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: ALERTS
// ════════════════════════════════════════════════════════════════════════
function AlertsTab({ data }: { data: MonitoringData }) {
  const [showResolved, setShowResolved] = useState(false);

  const displayed = showResolved
    ? data.alerts
    : data.alerts.filter((a) => !a.resolvedAt);

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {data.alerts.filter((a) => !a.resolvedAt).length} alertas activas
          {data.alerts.filter((a) => a.resolvedAt).length > 0 &&
            ` · ${data.alerts.filter((a) => a.resolvedAt).length} resueltas`}
        </p>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <Eye size={14} />
          {showResolved ? "Solo activas" : "Ver resueltas"}
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
          <p className="font-medium text-gray-600">
            {showResolved ? "No hay alertas registradas" : "No hay alertas activas"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Las alertas se generan automáticamente al detectar inactividad, desviaciones o bloqueos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((a) => {
            const alertColors: Record<string, string> = {
              INACTIVITY: "border-l-amber-400 bg-amber-50/40",
              KPI_DEVIATION: "border-l-red-400 bg-red-50/40",
              CONCEPTUAL_ERROR: "border-l-orange-400 bg-orange-50/40",
              COHERENCE: "border-l-purple-400 bg-purple-50/40",
              BLOCK: "border-l-red-500 bg-red-50/40",
            };

            const alertBadges: Record<string, string> = {
              INACTIVITY: "bg-amber-100 text-amber-700",
              KPI_DEVIATION: "bg-red-100 text-red-700",
              CONCEPTUAL_ERROR: "bg-orange-100 text-orange-700",
              COHERENCE: "bg-purple-100 text-purple-700",
              BLOCK: "bg-red-100 text-red-700",
            };

            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-xl border border-gray-200 border-l-4 p-4",
                  a.resolvedAt ? "bg-gray-50 opacity-60" : alertColors[a.type] ?? "bg-gray-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          alertBadges[a.type] ?? "bg-gray-100 text-gray-600"
                        )}
                      >
                        {ALERT_TYPE_LABELS[a.type] ?? a.type}
                      </span>
                      <span className="text-[10px] text-gray-400">{a.user}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{a.cohort}</span>
                    </div>
                    <p className="text-sm text-gray-700">{a.message}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-[10px] text-gray-400">{timeAgo(a.triggeredAt)}</p>
                    {a.resolvedAt && (
                      <span className="mt-1 flex items-center gap-1 text-[10px] text-green-600">
                        <CheckCircle size={10} />
                        Resuelta
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
