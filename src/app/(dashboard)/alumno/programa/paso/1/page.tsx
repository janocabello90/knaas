"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3,
  Building2,
  Users,
  Receipt,
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  Info,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type DiagData = {
  ejercicio1?: Ej1Data;
  ejercicio2?: Ej2Data;
  sistema?: SistemaData;
};

// ─── Ejercicio 1 ────────────────────────────────────────────
type Ej1Data = {
  aFac: number[];  // 12 monthly billing
  aSes: number[];  // 12 monthly sessions
  aNew: number[];  // 12 monthly new patients
  gPac: number;    // total patients
  gChurn: number;  // annual churn
  gNps: number;    // NPS
  srvs: Servicio[];
  wrks: Profesional[];
  gastos: Gasto[];
  dIngSrv: number;
  dIngOtros: number;
};

type Servicio = {
  sid: number;
  name: string;
  mins: number;
  precio: number;
  facM: number[];  // 12 monthly billing
  sesM: number[];  // 12 monthly sessions
  pac: number;
};

type Profesional = {
  wid: number;
  name: string;
  tipo: string;
  hconv: number;
  pct: number;
  srvIds: number[];
  vacM: number[];  // 12 monthly vacation weeks
};

type Gasto = {
  id: number;
  concepto: string;
  partida: string;
  valor: number;
};

// ─── Ejercicio 2 ────────────────────────────────────────────
type Ej2Data = {
  diasSem: number;
  semanasAno: number;
  salas: Sala[];
};

type Sala = {
  id: number;
  nombre: string;
  servNombre: string;
  sesHora: number;
  horasDia: number;
  ticket: number;
};

// ─── Sistema 5 pasos ────────────────────────────────────────
type SistemaData = {
  sueldo: number;
  margen: number;
  facAnoAnterior: number;
  objFac: number;
  palancas: string[];
  forecast: number[];  // 12 monthly forecast
};

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const EMPTY_12 = () => Array(12).fill(0);

const DEFAULT_EJ1: Ej1Data = {
  aFac: EMPTY_12(), aSes: EMPTY_12(), aNew: EMPTY_12(),
  gPac: 0, gChurn: 0, gNps: 0,
  srvs: [
    { sid: 1, name: "Fisioterapia", mins: 45, precio: 45, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 2, name: "Aparatología", mins: 30, precio: 35, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 3, name: "Readaptación", mins: 60, precio: 50, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 4, name: "Gimnasio", mins: 60, precio: 30, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 5, name: "Osteopatía", mins: 50, precio: 55, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 6, name: "Podología", mins: 30, precio: 40, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 7, name: "Nutrición", mins: 45, precio: 50, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 8, name: "Psicología", mins: 50, precio: 60, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 9, name: "Traumatología / Servicios Médicos", mins: 30, precio: 80, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
    { sid: 10, name: "Estética", mins: 45, precio: 50, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0 },
  ],
  wrks: [{ wid: 1, name: "", tipo: "Fisioterapeuta", hconv: 1800, pct: 100, srvIds: [1], vacM: EMPTY_12() }],
  gastos: [
    { id: 1, concepto: "Alquiler", partida: "LOCAL", valor: 0 },
    { id: 2, concepto: "Nóminas", partida: "PERSONAL", valor: 0 },
    { id: 3, concepto: "Seguros", partida: "SEGUROS", valor: 0 },
    { id: 4, concepto: "Suministros", partida: "SUMINISTROS", valor: 0 },
    { id: 5, concepto: "Marketing", partida: "MARKETING", valor: 0 },
  ],
  dIngSrv: 0, dIngOtros: 0,
};

const DEFAULT_EJ2: Ej2Data = {
  diasSem: 5, semanasAno: 46,
  salas: [{ id: 1, nombre: "Sala 1", servNombre: "Fisioterapia", sesHora: 1, horasDia: 8, ticket: 45 }],
};

const DEFAULT_SISTEMA: SistemaData = {
  sueldo: 0, margen: 25, facAnoAnterior: 0, objFac: 0,
  palancas: [], forecast: EMPTY_12(),
};

const PALANCAS_OPTIONS = [
  { key: "precio", label: "Subida de precios", icon: "💰" },
  { key: "recurrencia", label: "Recurrencia (más sesiones/paciente)", icon: "🔄" },
  { key: "captacion", label: "Captación de nuevos pacientes", icon: "🎯" },
  { key: "retencion", label: "Reducir churn / fidelizar", icon: "🤝" },
  { key: "ocupacion", label: "Mejorar ocupación", icon: "📈" },
  { key: "servicios", label: "Nuevos servicios", icon: "✨" },
  { key: "costes", label: "Reducción de costes", icon: "✂️" },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "—");

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════

type Phase = "ej1" | "ej2" | "sistema";

const PHASES: { key: Phase; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "ej1", label: "Radiografía actual", icon: <BarChart3 size={18} />, desc: "KPIs del año anterior" },
  { key: "ej2", label: "Capacidad instalada", icon: <Building2 size={18} />, desc: "Salas y escenarios" },
  { key: "sistema", label: "Objetivo y estrategia", icon: <Target size={18} />, desc: "5 pasos estratégicos" },
];

export default function DiagnosticoPage() {
  const [phase, setPhase] = useState<Phase>("ej1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [ej1, setEj1] = useState<Ej1Data>(DEFAULT_EJ1);
  const [ej2, setEj2] = useState<Ej2Data>(DEFAULT_EJ2);
  const [sistema, setSistema] = useState<SistemaData>(DEFAULT_SISTEMA);

  const year = new Date().getFullYear();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load data ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/alumno/diagnostico?year=${year}`);
      if (!res.ok) throw new Error("Error");
      const json = await res.json();
      const d = json.data as DiagData;
      if (d.ejercicio1) setEj1({ ...DEFAULT_EJ1, ...d.ejercicio1 });
      if (d.ejercicio2) setEj2({ ...DEFAULT_EJ2, ...d.ejercicio2 });
      if (d.sistema) setSistema({ ...DEFAULT_SISTEMA, ...d.sistema });
    } catch {
      // First time — use defaults
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Auto-save (debounced 2s) ──────────────────────────────
  const saveData = useCallback(async (e1: Ej1Data, e2: Ej2Data, s: SistemaData) => {
    try {
      setSaving(true);
      await fetch("/api/alumno/diagnostico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          data: { ejercicio1: e1, ejercicio2: e2, sistema: s },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [year]);

  const scheduleSave = useCallback((e1: Ej1Data, e2: Ej2Data, s: SistemaData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(e1, e2, s), 2000);
  }, [saveData]);

  // Wrappers that update state + trigger autosave
  const updateEj1 = (fn: (prev: Ej1Data) => Ej1Data) => {
    setEj1((prev) => {
      const next = fn(prev);
      scheduleSave(next, ej2, sistema);
      return next;
    });
  };
  const updateEj2 = (fn: (prev: Ej2Data) => Ej2Data) => {
    setEj2((prev) => {
      const next = fn(prev);
      scheduleSave(ej1, next, sistema);
      return next;
    });
  };
  const updateSistema = (fn: (prev: SistemaData) => SistemaData) => {
    setSistema((prev) => {
      const next = fn(prev);
      scheduleSave(ej1, ej2, next);
      return next;
    });
  };

  const manualSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveData(ej1, ej2, sistema);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const phaseIdx = PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Paso 1 · ACTIVA</p>
          <h1 className="text-2xl font-bold text-gray-900">Diagnóstico 360°</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa los datos de tu clínica para generar tu radiografía, capacidad y estrategia
          </p>
        </div>
        <button
          onClick={manualSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "Guardando..." : saved ? "Guardado" : "Guardar"}
        </button>
      </div>

      {/* Phase navigation */}
      <div className="mb-6 flex gap-2 rounded-xl border border-gray-200 bg-white p-1.5">
        {PHASES.map((p, i) => (
          <button
            key={p.key}
            onClick={() => setPhase(p.key)}
            className={`flex flex-1 items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              phase === p.key
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              phase === p.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
            }`}>{i + 1}</span>
            <div className="text-left">
              <div>{p.label}</div>
              <div className="text-xs font-normal opacity-60">{p.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      {phase === "ej1" && <Ejercicio1 data={ej1} update={updateEj1} />}
      {phase === "ej2" && <Ejercicio2 data={ej2} update={updateEj2} servicios={ej1.srvs} />}
      {phase === "sistema" && <Sistema5Pasos data={sistema} update={updateSistema} ej1={ej1} ej2={ej2} />}

      {/* Prev / Next */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setPhase(PHASES[phaseIdx - 1]?.key ?? phase)}
          disabled={phaseIdx === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        {phaseIdx < PHASES.length - 1 ? (
          <button
            onClick={() => setPhase(PHASES[phaseIdx + 1].key)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={manualSave}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <Check size={16} /> Completar Diagnóstico
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ══════════════════════════════════════════════════════════════

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
  prefix,
  className,
  min,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  prefix?: string;
  className?: string;
  min?: number;
}) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{prefix}</span>}
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder || "0"}
        min={min}
        className={`block w-full rounded-md border border-gray-300 py-1.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          prefix ? "pl-6 pr-2" : "px-2"
        } ${className || ""}`}
      />
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
      <Info size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EJERCICIO 1 — RADIOGRAFÍA ACTUAL
// ══════════════════════════════════════════════════════════════

function Ejercicio1({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const [section, setSection] = useState<"A" | "B" | "C" | "D">("A");

  const SECTIONS = [
    { key: "A" as const, label: "KPIs globales", icon: <BarChart3 size={14} /> },
    { key: "B" as const, label: "Servicios", icon: <Zap size={14} /> },
    { key: "C" as const, label: "Profesionales", icon: <Users size={14} /> },
    { key: "D" as const, label: "Cuenta de resultados", icon: <Receipt size={14} /> },
  ];

  return (
    <div className="space-y-4">
      <InfoBox>
        Introduce los datos del <strong>año anterior</strong> de tu clínica. Estos datos son la base de tu diagnóstico.
        Si no tienes un dato exacto, pon tu mejor estimación.
      </InfoBox>

      {/* Sub-section nav */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
              section === s.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {section === "A" && <SeccionA data={data} update={update} />}
      {section === "B" && <SeccionB data={data} update={update} />}
      {section === "C" && <SeccionC data={data} update={update} />}
      {section === "D" && <SeccionD data={data} update={update} />}
    </div>
  );
}

// ── Section A: Global KPIs ──────────────────────────────────

function SeccionA({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const setMonthly = (field: "aFac" | "aSes" | "aNew", idx: number, val: number) => {
    update((prev) => {
      const arr = [...prev[field]];
      arr[idx] = val;
      return { ...prev, [field]: arr };
    });
  };

  return (
    <div className="space-y-6">
      <Card title="Facturación mensual" subtitle="Facturación total por mes (sin IVA)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {MONTHS.map((m) => (
                  <th key={m} className="px-1 pb-2 text-center text-xs font-medium text-gray-500">{m}</th>
                ))}
                <th className="px-2 pb-2 text-center text-xs font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {data.aFac.map((v, i) => (
                  <td key={i} className="px-0.5">
                    <NumInput value={v} onChange={(val) => setMonthly("aFac", i, val)} prefix="€" />
                  </td>
                ))}
                <td className="px-2 text-center font-semibold text-gray-900">{fmt(sum(data.aFac))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Sesiones mensuales" subtitle="Número total de sesiones realizadas por mes">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {MONTHS.map((m) => (
                  <th key={m} className="px-1 pb-2 text-center text-xs font-medium text-gray-500">{m}</th>
                ))}
                <th className="px-2 pb-2 text-center text-xs font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {data.aSes.map((v, i) => (
                  <td key={i} className="px-0.5">
                    <NumInput value={v} onChange={(val) => setMonthly("aSes", i, val)} />
                  </td>
                ))}
                <td className="px-2 text-center font-semibold text-gray-900">{sum(data.aSes).toLocaleString("es-ES")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Pacientes nuevos por mes">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {MONTHS.map((m) => (
                  <th key={m} className="px-1 pb-2 text-center text-xs font-medium text-gray-500">{m}</th>
                ))}
                <th className="px-2 pb-2 text-center text-xs font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {data.aNew.map((v, i) => (
                  <td key={i} className="px-0.5">
                    <NumInput value={v} onChange={(val) => setMonthly("aNew", i, val)} />
                  </td>
                ))}
                <td className="px-2 text-center font-semibold text-gray-900">{sum(data.aNew).toLocaleString("es-ES")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="KPIs anuales globales">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Pacientes activos totales</label>
            <NumInput value={data.gPac} onChange={(v) => update((p) => ({ ...p, gPac: v }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Bajas / Churn anual</label>
            <NumInput value={data.gChurn} onChange={(v) => update((p) => ({ ...p, gChurn: v }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">NPS (Net Promoter Score)</label>
            <NumInput value={data.gNps} onChange={(v) => update((p) => ({ ...p, gNps: v }))} min={-100} />
          </div>
        </div>
        {data.gPac > 0 && (
          <div className="mt-4 flex gap-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <span>Tasa de churn: <strong>{pct(data.gChurn, data.gPac)}</strong></span>
            <span>Ticket medio: <strong>{sum(data.aFac) > 0 && sum(data.aSes) > 0 ? fmt(sum(data.aFac) / sum(data.aSes)) : "—"}</strong></span>
            <span>Facturación/paciente: <strong>{fmt(sum(data.aFac) / data.gPac)}</strong></span>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Section B: Services ─────────────────────────────────────

function SeccionB({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const addService = () => {
    update((prev) => ({
      ...prev,
      srvs: [...prev.srvs, {
        sid: Math.max(0, ...prev.srvs.map((s) => s.sid)) + 1,
        name: "", mins: 45, precio: 0, facM: EMPTY_12(), sesM: EMPTY_12(), pac: 0,
      }],
    }));
  };

  const removeService = (sid: number) => {
    update((prev) => ({ ...prev, srvs: prev.srvs.filter((s) => s.sid !== sid) }));
  };

  const updateSrv = (sid: number, fn: (s: Servicio) => Servicio) => {
    update((prev) => ({
      ...prev,
      srvs: prev.srvs.map((s) => (s.sid === sid ? fn(s) : s)),
    }));
  };

  const setSrvMonth = (sid: number, field: "facM" | "sesM", idx: number, val: number) => {
    updateSrv(sid, (s) => {
      const arr = [...s[field]];
      arr[idx] = val;
      return { ...s, [field]: arr };
    });
  };

  return (
    <div className="space-y-6">
      <InfoBox>
        Define los servicios que ofrece tu clínica y sus datos mensuales. Se heredan al Ejercicio 2 automáticamente.
      </InfoBox>

      {data.srvs.map((srv) => (
        <Card key={srv.sid} title={srv.name || `Servicio ${srv.sid}`}>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Nombre del servicio</label>
              <input
                type="text"
                value={srv.name}
                onChange={(e) => updateSrv(srv.sid, (s) => ({ ...s, name: e.target.value }))}
                placeholder="Ej: Fisioterapia manual"
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Duración (min)</label>
              <NumInput value={srv.mins} onChange={(v) => updateSrv(srv.sid, (s) => ({ ...s, mins: v }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Precio medio</label>
              <NumInput value={srv.precio} onChange={(v) => updateSrv(srv.sid, (s) => ({ ...s, precio: v }))} prefix="€" />
            </div>
          </div>

          {/* Monthly billing */}
          <p className="mb-2 text-xs font-medium text-gray-500">Facturación mensual</p>
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {MONTHS.map((m) => <th key={m} className="px-0.5 pb-1 text-center text-xs text-gray-400">{m}</th>)}
                  <th className="px-1 pb-1 text-center text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {srv.facM.map((v, i) => (
                    <td key={i} className="px-0.5">
                      <NumInput value={v} onChange={(val) => setSrvMonth(srv.sid, "facM", i, val)} className="text-xs" />
                    </td>
                  ))}
                  <td className="px-1 text-center text-xs font-semibold">{fmt(sum(srv.facM))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Monthly sessions */}
          <p className="mb-2 text-xs font-medium text-gray-500">Sesiones mensuales</p>
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {MONTHS.map((m) => <th key={m} className="px-0.5 pb-1 text-center text-xs text-gray-400">{m}</th>)}
                  <th className="px-1 pb-1 text-center text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {srv.sesM.map((v, i) => (
                    <td key={i} className="px-0.5">
                      <NumInput value={v} onChange={(val) => setSrvMonth(srv.sid, "sesM", i, val)} className="text-xs" />
                    </td>
                  ))}
                  <td className="px-1 text-center text-xs font-semibold">{sum(srv.sesM).toLocaleString("es-ES")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="mr-2 text-xs font-medium text-gray-600">Pacientes distintos:</label>
              <NumInput value={srv.pac} onChange={(v) => updateSrv(srv.sid, (s) => ({ ...s, pac: v }))} className="inline-block w-20" />
            </div>
            {data.srvs.length > 1 && (
              <button onClick={() => removeService(srv.sid)} className="text-xs text-red-500 hover:text-red-700">
                <Trash2 size={14} className="inline" /> Eliminar
              </button>
            )}
          </div>
        </Card>
      ))}

      <button onClick={addService} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600">
        <Plus size={16} /> Añadir servicio
      </button>
    </div>
  );
}

// ── Section C: Professionals ────────────────────────────────

function SeccionC({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const addPro = () => {
    update((prev) => ({
      ...prev,
      wrks: [...prev.wrks, {
        wid: Math.max(0, ...prev.wrks.map((w) => w.wid)) + 1,
        name: "", tipo: "Fisioterapeuta", hconv: 1800, pct: 100, srvIds: [], vacM: EMPTY_12(),
      }],
    }));
  };

  const removePro = (wid: number) => {
    update((prev) => ({ ...prev, wrks: prev.wrks.filter((w) => w.wid !== wid) }));
  };

  const updateWrk = (wid: number, fn: (w: Profesional) => Profesional) => {
    update((prev) => ({
      ...prev,
      wrks: prev.wrks.map((w) => (w.wid === wid ? fn(w) : w)),
    }));
  };

  return (
    <div className="space-y-6">
      <InfoBox>
        Define a cada profesional de tu equipo. La jornada (%) indica el porcentaje de la jornada completa que trabaja.
      </InfoBox>

      {data.wrks.map((wrk) => (
        <Card key={wrk.wid} title={wrk.name || `Profesional ${wrk.wid}`}>
          <div className="mb-4 grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
              <input
                type="text"
                value={wrk.name}
                onChange={(e) => updateWrk(wrk.wid, (w) => ({ ...w, name: e.target.value }))}
                placeholder="Ej: María García"
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
              <select
                value={wrk.tipo}
                onChange={(e) => updateWrk(wrk.wid, (w) => ({ ...w, tipo: e.target.value }))}
                className="block w-full rounded-md border border-gray-300 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option>Fisioterapeuta</option>
                <option>Osteópata</option>
                <option>Podólogo</option>
                <option>Nutricionista</option>
                <option>Psicólogo</option>
                <option>Administrativo</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Horas/año convenio</label>
              <NumInput value={wrk.hconv} onChange={(v) => updateWrk(wrk.wid, (w) => ({ ...w, hconv: v }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Jornada (%)</label>
              <NumInput value={wrk.pct} onChange={(v) => updateWrk(wrk.wid, (w) => ({ ...w, pct: v }))} />
            </div>
          </div>

          {/* Services this professional covers */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-gray-600">Servicios que realiza</label>
            <div className="flex flex-wrap gap-2">
              {data.srvs.map((srv) => {
                const active = wrk.srvIds.includes(srv.sid);
                return (
                  <button
                    key={srv.sid}
                    onClick={() => {
                      updateWrk(wrk.wid, (w) => ({
                        ...w,
                        srvIds: active ? w.srvIds.filter((id) => id !== srv.sid) : [...w.srvIds, srv.sid],
                      }));
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {srv.name || `Servicio ${srv.sid}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vacation weeks per month */}
          <p className="mb-2 text-xs font-medium text-gray-500">Semanas de vacaciones por mes</p>
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {MONTHS.map((m) => <th key={m} className="px-0.5 pb-1 text-center text-xs text-gray-400">{m}</th>)}
                  <th className="px-1 pb-1 text-center text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {wrk.vacM.map((v, i) => (
                    <td key={i} className="px-0.5">
                      <NumInput
                        value={v}
                        onChange={(val) =>
                          updateWrk(wrk.wid, (w) => {
                            const vacM = [...w.vacM];
                            vacM[i] = val;
                            return { ...w, vacM };
                          })
                        }
                        className="text-xs"
                      />
                    </td>
                  ))}
                  <td className="px-1 text-center text-xs font-semibold">{sum(wrk.vacM)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            {data.wrks.length > 1 && (
              <button onClick={() => removePro(wrk.wid)} className="text-xs text-red-500 hover:text-red-700">
                <Trash2 size={14} className="inline" /> Eliminar
              </button>
            )}
          </div>
        </Card>
      ))}

      <button onClick={addPro} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600">
        <Plus size={16} /> Añadir profesional
      </button>
    </div>
  );
}

// ── Section D: Cuenta de resultados ─────────────────────────

function SeccionD({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const totalIngresos = sum(data.aFac) + data.dIngOtros;
  const totalGastos = sum(data.gastos.map((g) => g.valor));
  const beneficio = totalIngresos - totalGastos;
  const margen = totalIngresos > 0 ? (beneficio / totalIngresos) * 100 : 0;

  const addGasto = () => {
    update((prev) => ({
      ...prev,
      gastos: [...prev.gastos, {
        id: Math.max(0, ...prev.gastos.map((g) => g.id)) + 1,
        concepto: "", partida: "OTROS", valor: 0,
      }],
    }));
  };

  const removeGasto = (id: number) => {
    update((prev) => ({ ...prev, gastos: prev.gastos.filter((g) => g.id !== id) }));
  };

  return (
    <div className="space-y-6">
      <InfoBox>
        Aquí defines los ingresos adicionales y los gastos operativos para calcular el beneficio y margen de tu clínica.
      </InfoBox>

      {/* Revenue summary */}
      <Card title="Ingresos">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Facturación por servicios</label>
            <div className="rounded-md bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">{fmt(sum(data.aFac))}</div>
            <p className="mt-1 text-xs text-gray-400">Viene de la sección A</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Otros ingresos</label>
            <NumInput
              value={data.dIngOtros}
              onChange={(v) => update((p) => ({ ...p, dIngOtros: v }))}
              prefix="€"
            />
            <p className="mt-1 text-xs text-gray-400">Formación, productos, etc.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Total ingresos</label>
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{fmt(totalIngresos)}</div>
          </div>
        </div>
      </Card>

      {/* Expenses */}
      <Card title="Gastos operativos">
        <div className="space-y-3">
          {data.gastos.map((gasto) => (
            <div key={gasto.id} className="flex items-center gap-3">
              <input
                type="text"
                value={gasto.concepto}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    gastos: prev.gastos.map((g) =>
                      g.id === gasto.id ? { ...g, concepto: e.target.value } : g
                    ),
                  }))
                }
                placeholder="Concepto"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <select
                value={gasto.partida}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    gastos: prev.gastos.map((g) =>
                      g.id === gasto.id ? { ...g, partida: e.target.value } : g
                    ),
                  }))
                }
                className="w-36 rounded-md border border-gray-300 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="LOCAL">Local</option>
                <option value="PERSONAL">Personal</option>
                <option value="SEGUROS">Seguros</option>
                <option value="SUMINISTROS">Suministros</option>
                <option value="MARKETING">Marketing</option>
                <option value="FORMACION">Formación</option>
                <option value="MATERIAL">Material clínico</option>
                <option value="TECNOLOGIA">Tecnología</option>
                <option value="OTROS">Otros</option>
              </select>
              <div className="w-28">
                <NumInput
                  value={gasto.valor}
                  onChange={(v) =>
                    update((prev) => ({
                      ...prev,
                      gastos: prev.gastos.map((g) =>
                        g.id === gasto.id ? { ...g, valor: v } : g
                      ),
                    }))
                  }
                  prefix="€"
                />
              </div>
              <button onClick={() => removeGasto(gasto.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addGasto} className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
          <Plus size={14} /> Añadir gasto
        </button>
      </Card>

      {/* P&L Summary */}
      <Card title="Resumen de la cuenta de resultados">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <p className="text-xs font-medium text-green-600">Ingresos</p>
            <p className="mt-1 text-lg font-bold text-green-700">{fmt(totalIngresos)}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-xs font-medium text-red-600">Gastos</p>
            <p className="mt-1 text-lg font-bold text-red-700">{fmt(totalGastos)}</p>
          </div>
          <div className={`rounded-lg p-4 text-center ${beneficio >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
            <p className={`text-xs font-medium ${beneficio >= 0 ? "text-blue-600" : "text-red-600"}`}>Beneficio</p>
            <p className={`mt-1 text-lg font-bold ${beneficio >= 0 ? "text-blue-700" : "text-red-700"}`}>{fmt(beneficio)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xs font-medium text-gray-600">Margen</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{margen.toFixed(1)}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EJERCICIO 2 — CAPACIDAD INSTALADA
// ══════════════════════════════════════════════════════════════

function Ejercicio2({
  data,
  update,
  servicios,
}: {
  data: Ej2Data;
  update: (fn: (p: Ej2Data) => Ej2Data) => void;
  servicios: Servicio[];
}) {
  const addSala = () => {
    update((prev) => ({
      ...prev,
      salas: [...prev.salas, {
        id: Math.max(0, ...prev.salas.map((s) => s.id)) + 1,
        nombre: `Sala ${prev.salas.length + 1}`,
        servNombre: servicios[0]?.name || "",
        sesHora: 1,
        horasDia: 8,
        ticket: 0,
      }],
    }));
  };

  const removeSala = (id: number) => {
    update((prev) => ({ ...prev, salas: prev.salas.filter((s) => s.id !== id) }));
  };

  // Calculations
  const sesAno = (sala: Sala) => sala.sesHora * sala.horasDia * data.diasSem * data.semanasAno;
  const facAno = (sala: Sala) => sesAno(sala) * sala.ticket;
  const totalSesAno = data.salas.reduce((acc, s) => acc + sesAno(s), 0);
  const totalFacMax = data.salas.reduce((acc, s) => acc + facAno(s), 0);

  const scenarios = [
    { pct: 100, label: "100% ocupación" },
    { pct: 80, label: "80% ocupación" },
    { pct: 60, label: "60% ocupación" },
    { pct: 30, label: "30% ocupación" },
  ];

  return (
    <div className="space-y-6">
      <InfoBox>
        Define las salas/espacios de tu clínica y su capacidad. El sistema calcula automáticamente los escenarios de ocupación.
      </InfoBox>

      {/* Config */}
      <Card title="Configuración general">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Días laborables por semana</label>
            <NumInput value={data.diasSem} onChange={(v) => update((p) => ({ ...p, diasSem: v }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Semanas laborables al año</label>
            <NumInput value={data.semanasAno} onChange={(v) => update((p) => ({ ...p, semanasAno: v }))} />
          </div>
        </div>
      </Card>

      {/* Rooms table */}
      <Card title="Tabla de explotación por sala">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 text-left text-xs font-medium text-gray-500">Sala</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-500">Servicio</th>
                <th className="pb-2 text-center text-xs font-medium text-gray-500">Ses/hora</th>
                <th className="pb-2 text-center text-xs font-medium text-gray-500">Horas/día</th>
                <th className="pb-2 text-center text-xs font-medium text-gray-500">Ticket</th>
                <th className="pb-2 text-right text-xs font-medium text-gray-500">Ses/año</th>
                <th className="pb-2 text-right text-xs font-medium text-gray-500">Fac. máx/año</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.salas.map((sala) => (
                <tr key={sala.id}>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={sala.nombre}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          salas: prev.salas.map((s) => (s.id === sala.id ? { ...s, nombre: e.target.value } : s)),
                        }))
                      }
                      className="w-24 rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={sala.servNombre}
                      onChange={(e) =>
                        update((prev) => ({
                          ...prev,
                          salas: prev.salas.map((s) => (s.id === sala.id ? { ...s, servNombre: e.target.value } : s)),
                        }))
                      }
                      className="w-36 rounded border border-gray-200 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {servicios.map((srv) => (
                        <option key={srv.sid} value={srv.name}>{srv.name || `Servicio ${srv.sid}`}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-1 w-20">
                    <NumInput
                      value={sala.sesHora}
                      onChange={(v) =>
                        update((prev) => ({
                          ...prev,
                          salas: prev.salas.map((s) => (s.id === sala.id ? { ...s, sesHora: v } : s)),
                        }))
                      }
                    />
                  </td>
                  <td className="py-2 px-1 w-20">
                    <NumInput
                      value={sala.horasDia}
                      onChange={(v) =>
                        update((prev) => ({
                          ...prev,
                          salas: prev.salas.map((s) => (s.id === sala.id ? { ...s, horasDia: v } : s)),
                        }))
                      }
                    />
                  </td>
                  <td className="py-2 px-1 w-20">
                    <NumInput
                      value={sala.ticket}
                      onChange={(v) =>
                        update((prev) => ({
                          ...prev,
                          salas: prev.salas.map((s) => (s.id === sala.id ? { ...s, ticket: v } : s)),
                        }))
                      }
                      prefix="€"
                    />
                  </td>
                  <td className="py-2 text-right text-sm font-medium text-gray-700">
                    {sesAno(sala).toLocaleString("es-ES")}
                  </td>
                  <td className="py-2 text-right text-sm font-semibold text-gray-900">
                    {fmt(facAno(sala))}
                  </td>
                  <td className="py-2 pl-2">
                    {data.salas.length > 1 && (
                      <button onClick={() => removeSala(sala.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td colSpan={5} className="py-2 text-sm text-gray-700">TOTAL MÁXIMO</td>
                <td className="py-2 text-right text-sm">{totalSesAno.toLocaleString("es-ES")}</td>
                <td className="py-2 text-right text-sm">{fmt(totalFacMax)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button onClick={addSala} className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
          <Plus size={14} /> Añadir sala
        </button>
      </Card>

      {/* Scenarios */}
      <Card title="Escenarios de ocupación">
        <div className="grid gap-4 sm:grid-cols-4">
          {scenarios.map((sc) => (
            <div
              key={sc.pct}
              className={`rounded-lg border-2 p-4 text-center ${
                sc.pct === 80 ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <p className={`text-xs font-medium ${sc.pct === 80 ? "text-blue-600" : "text-gray-500"}`}>
                {sc.label} {sc.pct === 80 && "⭐"}
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {fmt((totalFacMax * sc.pct) / 100)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {Math.round((totalSesAno * sc.pct) / 100).toLocaleString("es-ES")} sesiones
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SISTEMA DE 5 PASOS
// ══════════════════════════════════════════════════════════════

function Sistema5Pasos({
  data,
  update,
  ej1,
  ej2,
}: {
  data: SistemaData;
  update: (fn: (p: SistemaData) => SistemaData) => void;
  ej1: Ej1Data;
  ej2: Ej2Data;
}) {
  const [paso, setPaso] = useState(1);

  // Derived values
  const facAnterior = sum(ej1.aFac);
  const totalGastos = sum(ej1.gastos.map((g) => g.valor));
  const totalSesAno = ej2.salas.reduce((acc, s) => acc + s.sesHora * s.horasDia * ej2.diasSem * ej2.semanasAno, 0);
  const facMax = ej2.salas.reduce((acc, s) => acc + s.sesHora * s.horasDia * ej2.diasSem * ej2.semanasAno * s.ticket, 0);
  const brecha = data.objFac > 0 ? data.objFac - facAnterior : 0;
  const crecimientoPct = facAnterior > 0 ? ((data.objFac / facAnterior) - 1) * 100 : 0;

  // Calculate objFac from sueldo + margen
  const calcObj = () => {
    if (data.sueldo > 0 && data.margen > 0) {
      const needed = totalGastos + data.sueldo;
      const obj = Math.round(needed / (data.margen / 100));
      update((p) => ({ ...p, objFac: obj }));
    }
  };

  // Generate forecast
  const genForecast = () => {
    if (data.objFac <= 0) return;
    // Weight by previous year's monthly distribution, or equal
    const totalPrev = sum(ej1.aFac);
    const forecast = totalPrev > 0
      ? ej1.aFac.map((m) => Math.round((m / totalPrev) * data.objFac))
      : EMPTY_12().map(() => Math.round(data.objFac / 12));
    update((p) => ({ ...p, forecast }));
  };

  const PASOS = [
    { n: 1, label: "Radiografía", icon: <BarChart3 size={14} /> },
    { n: 2, label: "Escenarios", icon: <Building2 size={14} /> },
    { n: 3, label: "Objetivo", icon: <Target size={14} /> },
    { n: 4, label: "Estrategia", icon: <Zap size={14} /> },
    { n: 5, label: "KPIs y forecast", icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {PASOS.map((p, i) => (
          <div key={p.n} className="flex items-center">
            <button
              onClick={() => setPaso(p.n)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                paso === p.n
                  ? "bg-blue-600 text-white"
                  : paso > p.n
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {p.icon} {p.label}
            </button>
            {i < PASOS.length - 1 && <ArrowRight size={12} className="mx-1 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Paso 1: Resumen radiografía */}
      {paso === 1 && (
        <Card title="Resumen de tu radiografía actual" subtitle="Datos del Ejercicio 1">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Facturación anual</p>
              <p className="mt-1 text-xl font-bold text-blue-800">{fmt(facAnterior)}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-xs text-purple-600">Sesiones totales</p>
              <p className="mt-1 text-xl font-bold text-purple-800">{sum(ej1.aSes).toLocaleString("es-ES")}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-green-600">Pacientes nuevos/año</p>
              <p className="mt-1 text-xl font-bold text-green-800">{sum(ej1.aNew).toLocaleString("es-ES")}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Ticket medio</p>
              <p className="mt-1 text-xl font-bold text-amber-800">
                {sum(ej1.aSes) > 0 ? fmt(facAnterior / sum(ej1.aSes)) : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs text-red-600">Tasa de churn</p>
              <p className="mt-1 text-xl font-bold text-red-800">{pct(ej1.gChurn, ej1.gPac)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-600">Servicios · Profesionales</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{ej1.srvs.length} · {ej1.wrks.length}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Paso 2: Escenarios */}
      {paso === 2 && (
        <Card title="Resumen de capacidad y escenarios" subtitle="Datos del Ejercicio 2">
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Capacidad máxima (100%)</p>
              <p className="mt-1 text-xl font-bold text-blue-800">{fmt(facMax)}</p>
              <p className="mt-1 text-xs text-blue-500">{totalSesAno.toLocaleString("es-ES")} sesiones/año</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-green-600">Escenario óptimo (80%)</p>
              <p className="mt-1 text-xl font-bold text-green-800">{fmt(facMax * 0.8)}</p>
              <p className="mt-1 text-xs text-green-500">{Math.round(totalSesAno * 0.8).toLocaleString("es-ES")} sesiones/año</p>
            </div>
          </div>
          {facAnterior > 0 && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Ocupación actual estimada: <strong>{pct(facAnterior, facMax)}</strong> de la capacidad máxima
            </div>
          )}
        </Card>
      )}

      {/* Paso 3: Objetivo */}
      {paso === 3 && (
        <Card title="Define tu objetivo de facturación" subtitle="¿Cuánto necesitas facturar para vivir como quieres?">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Sueldo objetivo (bruto/año)</label>
              <NumInput value={data.sueldo} onChange={(v) => update((p) => ({ ...p, sueldo: v }))} prefix="€" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Margen objetivo (%)</label>
              <NumInput value={data.margen} onChange={(v) => update((p) => ({ ...p, margen: v }))} />
            </div>
            <div className="flex items-end">
              <button
                onClick={calcObj}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Calcular objetivo
              </button>
            </div>
          </div>

          {data.objFac > 0 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-xs text-green-600">Objetivo de facturación</p>
                  <p className="mt-1 text-2xl font-bold text-green-800">{fmt(data.objFac)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-xs text-blue-600">Brecha vs año anterior</p>
                  <p className="mt-1 text-2xl font-bold text-blue-800">{fmt(brecha)}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <p className="text-xs text-purple-600">Crecimiento necesario</p>
                  <p className="mt-1 text-2xl font-bold text-purple-800">{crecimientoPct.toFixed(1)}%</p>
                </div>
              </div>

              {facMax > 0 && data.objFac > facMax * 0.8 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Tu objetivo supera el 80% de tu capacidad máxima. Necesitarás ampliar capacidad o subir precios.
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Paso 4: Estrategia / Palancas */}
      {paso === 4 && (
        <Card title="Selecciona tus palancas de crecimiento" subtitle="Elige 3-4 palancas principales para alcanzar tu objetivo">
          {brecha > 0 && (
            <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Necesitas cubrir una brecha de <strong>{fmt(brecha)}</strong> ({crecimientoPct.toFixed(1)}% de crecimiento).
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {PALANCAS_OPTIONS.map((pal) => {
              const active = data.palancas.includes(pal.key);
              return (
                <button
                  key={pal.key}
                  onClick={() =>
                    update((prev) => ({
                      ...prev,
                      palancas: active
                        ? prev.palancas.filter((p) => p !== pal.key)
                        : [...prev.palancas, pal.key],
                    }))
                  }
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                    active
                      ? "border-blue-400 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{pal.icon}</span>
                  <span className={`text-sm font-medium ${active ? "text-blue-700" : "text-gray-700"}`}>
                    {pal.label}
                  </span>
                  {active && <Check size={16} className="ml-auto text-blue-600" />}
                </button>
              );
            })}
          </div>

          {data.palancas.length > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              {data.palancas.length} palanca{data.palancas.length !== 1 ? "s" : ""} seleccionada{data.palancas.length !== 1 ? "s" : ""}
            </p>
          )}
        </Card>
      )}

      {/* Paso 5: Forecast */}
      {paso === 5 && (
        <div className="space-y-6">
          <Card title="Forecast mensual de facturación" subtitle="Distribuye tu objetivo en los 12 meses">
            {data.objFac > 0 && (
              <button
                onClick={genForecast}
                className="mb-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Generar forecast automático
              </button>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="pb-2 text-left text-xs text-gray-500">Mes</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="px-0.5 pb-2 text-center text-xs text-gray-500">{m}</th>
                    ))}
                    <th className="px-2 pb-2 text-center text-xs font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 text-xs font-medium text-gray-500">Año ant.</td>
                    {ej1.aFac.map((v, i) => (
                      <td key={i} className="px-0.5 text-center text-xs text-gray-400">{v > 0 ? fmt(v) : "—"}</td>
                    ))}
                    <td className="px-2 text-center text-xs font-semibold text-gray-500">{fmt(facAnterior)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-xs font-medium text-blue-600">Objetivo</td>
                    {data.forecast.map((v, i) => (
                      <td key={i} className="px-0.5">
                        <NumInput
                          value={v}
                          onChange={(val) =>
                            update((prev) => {
                              const fc = [...prev.forecast];
                              fc[i] = val;
                              return { ...prev, forecast: fc };
                            })
                          }
                          className="text-xs"
                        />
                      </td>
                    ))}
                    <td className="px-2 text-center text-xs font-bold text-blue-700">{fmt(sum(data.forecast))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {data.objFac > 0 && sum(data.forecast) > 0 && (
              <div className="mt-4 text-sm text-gray-500">
                Forecast total: <strong>{fmt(sum(data.forecast))}</strong> — Objetivo: <strong>{fmt(data.objFac)}</strong>
                {Math.abs(sum(data.forecast) - data.objFac) > 100 && (
                  <span className="ml-2 text-amber-600">(diferencia de {fmt(Math.abs(sum(data.forecast) - data.objFac))})</span>
                )}
              </div>
            )}
          </Card>

          {/* Summary card */}
          <Card title="Resumen del diagnóstico">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Situación actual</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>Facturación: <strong>{fmt(facAnterior)}</strong></li>
                  <li>Sesiones: <strong>{sum(ej1.aSes).toLocaleString("es-ES")}</strong></li>
                  <li>Servicios: <strong>{ej1.srvs.length}</strong> · Profesionales: <strong>{ej1.wrks.length}</strong></li>
                  <li>Capacidad máx: <strong>{fmt(facMax)}</strong></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Objetivo y estrategia</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>Objetivo: <strong>{fmt(data.objFac)}</strong> (+{crecimientoPct.toFixed(1)}%)</li>
                  <li>Sueldo objetivo: <strong>{fmt(data.sueldo)}</strong></li>
                  <li>Palancas: <strong>{data.palancas.length > 0 ? data.palancas.map((p) => PALANCAS_OPTIONS.find((o) => o.key === p)?.label).join(", ") : "Sin seleccionar"}</strong></li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Paso navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={() => setPaso((p) => Math.max(1, p - 1))}
          disabled={paso === 1}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Paso anterior
        </button>
        {paso < 5 && (
          <button
            onClick={() => setPaso((p) => Math.min(5, p + 1))}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Siguiente paso <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
