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
  ChevronDown,
  Lock,
  AlertTriangle,
  ExternalLink,
  Heart,
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
  // Cost allocation: { [partidaGroup]: { [sid]: percentage } }
  costAlloc: Record<string, Record<number, number>>;
  pacCanales: PacCanal[];  // patient channels
};

type PacCanal = {
  id: number;
  canal: string;      // e.g. "Instagram", "Google", "Boca a boca"
  pacientes: number;  // total patients from this channel
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
  // NEW FIELDS:
  srvFacM: Record<number, number[]>;  // { [sid]: 12 monthly billing }
  srvSesM: Record<number, number[]>;  // { [sid]: 12 monthly sessions }
  churnAnual: number;  // optional annual churn rate
  npsMedio: number;    // average NPS
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
  ticket: number; // ticket medio DESEADO
};

// ─── Sistema 5 pasos ────────────────────────────────────────
type SistemaData = {
  sueldo: number;
  margen: number;
  facAnoAnterior: number;
  objFac: number;
  palancas: string[];
  palancaDetalles: Record<string, PalancaDetalle>;
  forecast: number[];  // 12 monthly forecast
  forecastSesiones: number[]; // 12 monthly session forecast
};

type PalancaDetalle = {
  enfoque: string; // description of focus
  ticketObjetivo?: number;
  sesionesExtra?: number;
  pacientesNuevos?: number;
};

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const EMPTY_12 = () => Array(12).fill(0);

const DEFAULT_EJ1: Ej1Data = {
  aFac: EMPTY_12(), aSes: EMPTY_12(), aNew: EMPTY_12(),
  gPac: 0, gChurn: 0, gNps: 0,
  srvs: [],
  wrks: [],
  gastos: [
    // Aprovisionamiento
    { id: 1, concepto: "Compras de mercancías / mantenimiento instalación", partida: "APROV_COMPRAS", valor: 0 },
    { id: 2, concepto: "Material de oficina y recepción", partida: "APROV_OFICINA", valor: 0 },
    { id: 3, concepto: "Suministros desechables y fungibles", partida: "APROV_FUNGIBLES", valor: 0 },
    // Infraestructura
    { id: 4, concepto: "Arrendamientos y cánones", partida: "INFRA_ALQUILER", valor: 0 },
    { id: 5, concepto: "Gastos de comunidad e IBI", partida: "INFRA_COMUNIDAD", valor: 0 },
    { id: 6, concepto: "Reparaciones y conservación", partida: "INFRA_REPARACIONES", valor: 0 },
    { id: 7, concepto: "Servicios bancarios y similares", partida: "INFRA_BANCO", valor: 0 },
    { id: 8, concepto: "Suministros agua, gas y electricidad", partida: "INFRA_SUMINISTROS", valor: 0 },
    { id: 9, concepto: "Primas de seguros", partida: "INFRA_SEGUROS", valor: 0 },
    { id: 10, concepto: "Teléfono e internet", partida: "INFRA_TELECOM", valor: 0 },
    { id: 11, concepto: "Hosting, web y dominios", partida: "INFRA_HOSTING", valor: 0 },
    { id: 12, concepto: "Renting de máquinas y amortizaciones", partida: "INFRA_RENTING", valor: 0 },
    { id: 13, concepto: "Software de gestión", partida: "INFRA_SOFTWARE", valor: 0 },
    { id: 14, concepto: "Otros servicios (desinfección, residuos...)", partida: "INFRA_OTROS", valor: 0 },
    // Personal clínico
    { id: 15, concepto: "Sueldos y salarios — personal clínico", partida: "PERS_CLIN_SUELDOS", valor: 0 },
    { id: 16, concepto: "Gastos sociales y SS — clínico", partida: "PERS_CLIN_SS", valor: 0 },
    { id: 17, concepto: "Coste propio propietario como clínico (sombrero fisio)", partida: "PERS_CLIN_PROP", valor: 0 },
    // Personal gestión
    { id: 18, concepto: "Sueldos y salarios — personal gestión", partida: "PERS_GEST_SUELDOS", valor: 0 },
    { id: 19, concepto: "Gastos sociales y SS — gestión", partida: "PERS_GEST_SS", valor: 0 },
    { id: 20, concepto: "Prestación de servicios de otros profesionales", partida: "PERS_GEST_EXTERNO", valor: 0 },
    // Marketing
    { id: 21, concepto: "Marketing y publicidad", partida: "MKT", valor: 0 },
  ],
  costAlloc: {},
  dIngSrv: 0, dIngOtros: 0,
  pacCanales: [],
};

const DEFAULT_EJ2: Ej2Data = {
  diasSem: 5, semanasAno: 46,
  salas: [],
};

const DEFAULT_SISTEMA: SistemaData = {
  sueldo: 0, margen: 25, facAnoAnterior: 0, objFac: 0,
  palancas: [], palancaDetalles: {},
  forecast: EMPTY_12(), forecastSesiones: EMPTY_12(),
};

const PALANCAS_OPTIONS = [
  { key: "precio", label: "Subida de precios", icon: "💰", desc: "Incrementar el ticket medio de tus servicios actuales" },
  { key: "recurrencia", label: "Recurrencia (más sesiones/paciente)", icon: "🔄", desc: "Conseguir que cada paciente venga más veces" },
  { key: "captacion", label: "Captación de nuevos pacientes", icon: "🎯", desc: "Atraer nuevos pacientes a la clínica" },
  { key: "retencion", label: "Reducir churn / fidelizar", icon: "🤝", desc: "Retener más pacientes y reducir bajas" },
  { key: "ocupacion", label: "Mejorar ocupación", icon: "📈", desc: "Llenar más huecos en la agenda" },
  { key: "servicios", label: "Nuevos servicios", icon: "✨", desc: "Lanzar servicios nuevos o complementarios" },
  { key: "costes", label: "Reducción de costes", icon: "✂️", desc: "Optimizar gastos para mejorar el margen" },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "—");

// ── Phase completion checks ─────────────────────────────────
function isEj1Complete(ej1: Ej1Data): boolean {
  const hasSrvs = ej1.srvs.length > 0 && ej1.srvs.every((s) => s.name.trim() !== "" && sum(s.facM) > 0);
  const hasWrks = ej1.wrks.length > 0;
  const hasGastos = ej1.gastos.some((g) => g.valor > 0);
  return hasSrvs && hasWrks && hasGastos;
}

function isEj2Complete(ej2: Ej2Data): boolean {
  return ej2.salas.length > 0 && ej2.salas.every((s) => s.ticket > 0 && s.sesHora > 0);
}

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

  // Phase unlock logic
  const ej1Done = isEj1Complete(ej1);
  const ej2Done = isEj2Complete(ej2);

  const isPhaseUnlocked = (key: Phase): boolean => {
    if (key === "ej1") return true;
    if (key === "ej2") return ej1Done;
    if (key === "sistema") return ej1Done && ej2Done;
    return false;
  };

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

  const trySetPhase = (key: Phase) => {
    if (isPhaseUnlocked(key)) setPhase(key);
  };

  const goNext = () => {
    const nextPhase = PHASES[phaseIdx + 1]?.key;
    if (nextPhase && isPhaseUnlocked(nextPhase)) setPhase(nextPhase);
  };

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

      {/* Phase navigation with lock */}
      <div className="mb-6 flex gap-2 rounded-xl border border-gray-200 bg-white p-1.5">
        {PHASES.map((p, i) => {
          const unlocked = isPhaseUnlocked(p.key);
          const isCurrent = phase === p.key;
          return (
            <button
              key={p.key}
              onClick={() => trySetPhase(p.key)}
              disabled={!unlocked}
              className={`flex flex-1 items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                isCurrent
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : unlocked
                    ? "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    : "cursor-not-allowed text-gray-300"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                isCurrent ? "bg-blue-600 text-white"
                  : unlocked ? "bg-gray-100 text-gray-500"
                    : "bg-gray-100 text-gray-300"
              }`}>
                {unlocked ? i + 1 : <Lock size={12} />}
              </span>
              <div className="text-left">
                <div>{p.label}</div>
                <div className="text-xs font-normal opacity-60">
                  {unlocked ? p.desc : "Completa el ejercicio anterior"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {phase === "ej1" && <Ejercicio1 data={ej1} update={updateEj1} />}
      {phase === "ej2" && <Ejercicio2 data={ej2} update={updateEj2} servicios={ej1.srvs} ej1={ej1} />}
      {phase === "sistema" && <Sistema5Pasos data={sistema} update={updateSistema} ej1={ej1} ej2={ej2} />}

      {/* Prev / Next */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => trySetPhase(PHASES[phaseIdx - 1]?.key ?? phase)}
          disabled={phaseIdx === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        {phaseIdx < PHASES.length - 1 ? (
          <button
            onClick={goNext}
            disabled={!isPhaseUnlocked(PHASES[phaseIdx + 1]?.key)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium ${
              isPhaseUnlocked(PHASES[phaseIdx + 1]?.key)
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isPhaseUnlocked(PHASES[phaseIdx + 1]?.key) ? (
              <>Siguiente <ChevronRight size={16} /></>
            ) : (
              <>
                <Lock size={14} /> Completa este ejercicio para continuar
              </>
            )}
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
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  prefix?: string;
  className?: string;
  min?: number;
  disabled?: boolean;
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
        disabled={disabled}
        className={`block w-full rounded-md border border-gray-300 py-1.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
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

// ── Collapsible instructions component ──────────────────────
function InstructionDropdown({
  title,
  intro,
  steps,
  videoUrl,
  videoLabel,
  color = "blue",
}: {
  title: string;
  intro: string;
  steps?: string[];
  videoUrl?: string;
  videoLabel?: string;
  color?: "blue" | "green";
}) {
  const [open, setOpen] = useState(false);
  const colors = color === "green"
    ? { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-500", badge: "bg-green-100 text-green-600" }
    : { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500", badge: "bg-blue-100 text-blue-600" };

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 px-4 py-3 text-sm font-medium ${colors.text} hover:opacity-80 transition`}
      >
        <Info size={16} className={`shrink-0 ${colors.icon}`} />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className={`px-4 pb-4 text-sm ${colors.text} space-y-2 border-t ${colors.border}`}>
          <p className="pt-3">{intro}</p>
          {steps && steps.length > 0 && (
            <ol className="ml-4 list-decimal space-y-1">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${colors.badge} hover:opacity-80`}
            >
              <ExternalLink size={12} />
              {videoLabel || "Ver vídeo tutorial"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Auto-calculated field display ───────────────────────────
function AutoField({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 tabular-nums">
        {value}
      </div>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EJERCICIO 1 — RADIOGRAFÍA ACTUAL
// ══════════════════════════════════════════════════════════════

function Ejercicio1({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const [section, setSection] = useState<"B" | "C" | "F" | "D" | "E" | "A">("B");

  // Section completion checks for sub-locking
  const sectionBDone = data.srvs.length > 0 && data.srvs.every((s) => s.name.trim() !== "" && sum(s.facM) > 0);
  const sectionCDone = data.wrks.length > 0 && data.wrks.every((w) => w.name.trim() !== "");
  const sectionDDone = data.gastos.some((g) => g.valor > 0);
  const sectionEDone = Object.keys(data.costAlloc).some((k) => Object.keys(data.costAlloc[k] || {}).length > 0);

  const isSectionUnlocked = (key: string): boolean => {
    if (key === "B") return true;
    if (key === "C") return sectionBDone;
    if (key === "F") return sectionBDone;
    if (key === "D") return sectionCDone;
    if (key === "E") return sectionDDone;
    if (key === "A") return sectionEDone;
    return false;
  };

  const SECTIONS = [
    { key: "B" as const, label: "Servicios", icon: <Zap size={14} /> },
    { key: "C" as const, label: "Profesionales", icon: <Users size={14} /> },
    { key: "F" as const, label: "Pacientes", icon: <Heart size={14} /> },
    { key: "D" as const, label: "Cuenta de resultados", icon: <Receipt size={14} /> },
    { key: "E" as const, label: "Margen por servicio", icon: <TrendingUp size={14} /> },
    { key: "A" as const, label: "KPIs globales", icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="space-y-4">
      <InstructionDropdown
        title="Instrucciones: Radiografía actual"
        intro="En este ejercicio vas a recoger los datos del año anterior de tu clínica. Estos datos son la base de todo tu diagnóstico y plan de acción posterior. Cuanto más precisos sean, mejor será tu estrategia."
        steps={[
          "Empieza por los Servicios: define cada servicio con su facturación y sesiones mensuales.",
          "Añade a tu equipo de Profesionales con su rendimiento por servicio.",
          "Registra los Pacientes nuevos por mes y los canales de captación.",
          "Revisa la Cuenta de Resultados con gastos y repercusión de costes.",
          "El Margen por servicio se calcula automáticamente.",
          "Los KPIs globales se generan como resumen final de todo el análisis.",
        ]}
      />

      {/* Sub-section nav */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {SECTIONS.map((s) => {
          const unlocked = isSectionUnlocked(s.key);
          return (
            <button
              key={s.key}
              onClick={() => unlocked && setSection(s.key)}
              disabled={!unlocked}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                section === s.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : unlocked
                    ? "text-gray-500 hover:text-gray-700"
                    : "text-gray-300 cursor-not-allowed"
              }`}
            >
              {unlocked ? s.icon : <Lock size={10} />} {s.label}
            </button>
          );
        })}
      </div>

      {section === "B" && <SeccionB data={data} update={update} />}
      {section === "C" && <SeccionC data={data} update={update} />}
      {section === "F" && <SeccionF data={data} update={update} />}
      {section === "D" && <SeccionD data={data} update={update} />}
      {section === "E" && <SeccionE data={data} update={update} />}
      {section === "A" && <SeccionA data={data} update={update} />}
    </div>
  );
}

// ── Section A: Global KPIs (Read-Only Summary) ──────────────

function SeccionA({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const totalGastos = sum(data.gastos.map((g) => g.valor));

  // Helper to compute cost per service
  const getServiceCosts = (sid: number): number => {
    let total = 0;
    COST_GROUPS.forEach((g) => {
      const groupTotal = getGroupTotal(data.gastos, g.key);
      const alloc = data.costAlloc?.[g.key]?.[sid] ?? (data.srvs.length > 0 ? 100 / data.srvs.length : 0);
      const pct = alloc / 100;
      total += groupTotal * pct;
    });
    return total;
  };

  return (
    <div className="space-y-6">
      <InstructionDropdown
        color="green"
        title="Tu resumen de radiografía"
        intro="Esta sección muestra un resumen automático de todos los datos que has introducido en las secciones anteriores. Los KPIs globales se calculan automáticamente a partir de tus servicios, profesionales, pacientes y gastos."
      />

      {/* Card 1: Facturación mensual */}
      <Card title="Facturación mensual" subtitle="Auto-calculada desde los servicios">
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
                {MONTHS.map((_, i) => {
                  const monthTotal = sum(data.srvs.map((s) => s.facM[i] || 0));
                  return (
                    <td key={i} className="px-0.5 text-center text-sm text-gray-700">
                      {fmt(monthTotal)}
                    </td>
                  );
                })}
                <td className="px-2 text-center font-semibold text-gray-900">
                  {fmt(sum(data.srvs.map((s) => sum(s.facM))))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card 2: Sesiones mensuales */}
      <Card title="Sesiones mensuales" subtitle="Auto-calculada desde los servicios">
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
                {MONTHS.map((_, i) => {
                  const monthTotal = sum(data.srvs.map((s) => s.sesM[i] || 0));
                  return (
                    <td key={i} className="px-0.5 text-center text-sm text-gray-700">
                      {monthTotal.toLocaleString("es-ES")}
                    </td>
                  );
                })}
                <td className="px-2 text-center font-semibold text-gray-900">
                  {sum(data.srvs.map((s) => sum(s.sesM))).toLocaleString("es-ES")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card 3: Pacientes nuevos */}
      <Card title="Pacientes nuevos" subtitle="Desde la sección Pacientes">
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
                  <td key={i} className="px-0.5 text-center text-sm text-gray-700">
                    {v.toLocaleString("es-ES")}
                  </td>
                ))}
                <td className="px-2 text-center font-semibold text-gray-900">
                  {sum(data.aNew).toLocaleString("es-ES")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card 4: KPIs por servicio */}
      {data.srvs.length > 0 && (
        <Card title="KPIs por servicio">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Servicio</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500">Ticket medio</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500">Margen %</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500">Recurrencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.srvs.map((srv) => {
                  const totalFac = sum(srv.facM);
                  const totalSes = sum(srv.sesM);
                  const ticketMedio = totalSes > 0 ? totalFac / totalSes : 0;
                  const costs = getServiceCosts(srv.sid);
                  const margenPct = totalFac > 0 ? ((totalFac - costs) / totalFac) * 100 : 0;
                  const recurrencia = totalSes > 0 && srv.pac > 0 ? totalSes / srv.pac : 0;

                  return (
                    <tr key={srv.sid}>
                      <td className="py-2 font-medium text-gray-900">{srv.name}</td>
                      <td className="py-2 text-right text-gray-600">{fmt(ticketMedio)}</td>
                      <td className="py-2 text-right text-gray-600">{margenPct.toFixed(1)}%</td>
                      <td className="py-2 text-right text-gray-600">{recurrencia.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Card 5: KPIs globales */}
      <Card title="KPIs globales" subtitle="Resumen consolidado">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Churn rate global</label>
            <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
              {data.gPac > 0 ? pct(data.gChurn, data.gPac) : "—"}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">NPS medio</label>
            <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
              {data.wrks.length > 0
                ? (data.wrks.reduce((acc, w) => acc + (w.npsMedio || 0), 0) / data.wrks.length).toFixed(1)
                : "—"}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ticket medio global</label>
            <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
              {sum(data.srvs.map((s) => sum(s.sesM))) > 0
                ? fmt(sum(data.srvs.map((s) => sum(s.facM))) / sum(data.srvs.map((s) => sum(s.sesM))))
                : "—"}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Pacientes activos totales</label>
            <NumInput value={data.gPac} onChange={(v) => update((p) => ({ ...p, gPac: v }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Bajas / Churn anual</label>
            <NumInput value={data.gChurn} onChange={(v) => update((p) => ({ ...p, gChurn: v }))} />
          </div>
        </div>
      </Card>

      {/* Card 6: Margen unitario por servicio (same as SeccionE) */}
      {data.srvs.length > 0 && (
        <Card title="Margen unitario por servicio" subtitle="Facturación menos costes repercutidos, dividido entre sesiones">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-medium text-gray-500">Servicio</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500">Facturación</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500">Costes</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500">Beneficio</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500">Sesiones</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500">Margen/sesión</th>
                  <th className="pb-3 text-right text-xs font-medium text-gray-500">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.srvs.map((srv) => {
                  const totalFac = sum(srv.facM);
                  const totalSes = sum(srv.sesM);
                  const costs = getServiceCosts(srv.sid);
                  const beneficio = totalFac - costs;
                  const margenUnitario = totalSes > 0 ? beneficio / totalSes : 0;
                  const margenPct = totalFac > 0 ? (beneficio / totalFac) * 100 : 0;

                  return (
                    <tr key={srv.sid}>
                      <td className="py-3 font-medium text-gray-900">{srv.name || `Servicio ${srv.sid}`}</td>
                      <td className="py-3 text-right text-gray-600">{fmt(totalFac)}</td>
                      <td className="py-3 text-right text-gray-600">{fmt(costs)}</td>
                      <td className={`py-3 text-right font-semibold ${beneficio >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {fmt(beneficio)}
                      </td>
                      <td className="py-3 text-right text-gray-600">{totalSes.toLocaleString("es-ES")}</td>
                      <td className={`py-3 text-right font-bold ${margenUnitario >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {totalSes > 0 ? fmt(margenUnitario) : "—"}
                      </td>
                      <td className={`py-3 text-right font-medium ${margenPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {totalFac > 0 ? `${margenPct.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td className="py-3 text-gray-700">TOTAL</td>
                  <td className="py-3 text-right text-gray-700">{fmt(sum(data.srvs.map((s) => sum(s.facM))))}</td>
                  <td className="py-3 text-right text-gray-700">{fmt(totalGastos)}</td>
                  <td className={`py-3 text-right ${sum(data.srvs.map((s) => sum(s.facM))) - totalGastos >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {fmt(sum(data.srvs.map((s) => sum(s.facM))) - totalGastos)}
                  </td>
                  <td className="py-3 text-right text-gray-700">{sum(data.srvs.map((s) => sum(s.sesM))).toLocaleString("es-ES")}</td>
                  <td className="py-3 text-right text-gray-400">—</td>
                  <td className="py-3 text-right text-gray-400">
                    {sum(data.srvs.map((s) => sum(s.facM))) > 0
                      ? `${(((sum(data.srvs.map((s) => sum(s.facM))) - totalGastos) / sum(data.srvs.map((s) => sum(s.facM)))) * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Visual breakdown per service */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {data.srvs.map((srv) => {
              const totalFac = sum(srv.facM);
              const costs = getServiceCosts(srv.sid);
              const beneficio = totalFac - costs;
              const margenPct = totalFac > 0 ? (beneficio / totalFac) * 100 : 0;

              return (
                <div key={srv.sid} className={`rounded-xl border-2 p-4 ${beneficio >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <p className="text-sm font-semibold text-gray-800">{srv.name || `Servicio ${srv.sid}`}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${beneficio >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {margenPct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">margen</span>
                  </div>
                  {/* Cost breakdown mini-bars */}
                  <div className="mt-2 flex gap-0.5 overflow-hidden rounded-full" style={{ height: "6px" }}>
                    {COST_GROUPS.map((g) => {
                      const groupTotal = getGroupTotal(data.gastos, g.key);
                      const alloc = data.costAlloc?.[g.key]?.[srv.sid] ?? (data.srvs.length > 0 ? 100 / data.srvs.length : 0);
                      const pct = alloc / 100;
                      const groupCost = groupTotal * pct;
                      const pctOfFac = totalFac > 0 ? (groupCost / totalFac) * 100 : 0;
                      if (pctOfFac === 0) return null;
                      return (
                        <div
                          key={g.key}
                          className={`${g.color}`}
                          style={{ width: `${pctOfFac}%` }}
                          title={`${g.label}: ${fmt(groupCost)} (${pctOfFac.toFixed(1)}%)`}
                        />
                      );
                    })}
                    {beneficio > 0 && (
                      <div className="bg-green-400" style={{ width: `${margenPct}%` }} title={`Beneficio: ${fmt(beneficio)}`} />
                    )}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>Costes: {fmt(costs)}</span>
                    <span className={beneficio >= 0 ? "text-green-600" : "text-red-600"}>Beneficio: {fmt(beneficio)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
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
      <InstructionDropdown
        color="green"
        title="Instrucciones de este paso"
        intro="Define cada servicio que ofrece tu clínica con sus datos mensuales. El ticket medio de cada servicio se calcula automáticamente dividiendo la facturación total entre las sesiones totales. Estos datos se heredarán al Ejercicio 2 (Capacidad instalada)."
        steps={[
          "Añade un servicio con el botón inferior.",
          "Indica el nombre, duración y precio de referencia.",
          "Rellena la facturación y sesiones mensuales. El ticket medio se calcula solo.",
          "Repite para cada servicio que ofreces.",
        ]}
      />

      {data.srvs.map((srv) => {
        const totalFac = sum(srv.facM);
        const totalSes = sum(srv.sesM);
        const ticketMedioAuto = totalSes > 0 ? totalFac / totalSes : 0;

        return (
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
                <AutoField
                  label="Ticket medio"
                  value={ticketMedioAuto > 0 ? fmt(ticketMedioAuto) : "—"}
                  sublabel="Facturación / Sesiones"
                />
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
                    <td className="px-1 text-center text-xs font-semibold">{fmt(totalFac)}</td>
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
                    <td className="px-1 text-center text-xs font-semibold">{totalSes.toLocaleString("es-ES")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ticket medio auto + pacientes */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs font-medium text-gray-500">Ticket medio auto: </span>
                  <span className="text-sm font-bold text-blue-700">{ticketMedioAuto > 0 ? fmt(ticketMedioAuto) : "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">Pacientes distintos:</label>
                  <NumInput value={srv.pac} onChange={(v) => updateSrv(srv.sid, (s) => ({ ...s, pac: v }))} className="inline-block w-20" />
                </div>
              </div>
              {data.srvs.length > 1 && (
                <button onClick={() => removeService(srv.sid)} className="text-xs text-red-500 hover:text-red-700">
                  <Trash2 size={14} className="inline" /> Eliminar
                </button>
              )}
            </div>
          </Card>
        );
      })}

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
        srvFacM: {}, srvSesM: {}, churnAnual: 0, npsMedio: 0,
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
      <InstructionDropdown
        color="green"
        title="Instrucciones de este paso"
        intro="Define a cada profesional de tu equipo. La jornada (%) indica el porcentaje de la jornada completa que trabaja. Asigna los servicios que realiza cada uno."
        steps={[
          "Añade un profesional con el botón inferior.",
          "Indica nombre, tipo, horas/año convenio y % de jornada.",
          "Selecciona los servicios que realiza (deben estar creados en la sección anterior).",
          "Marca las semanas de vacaciones por mes.",
        ]}
      />

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

          {/* Service billing and sessions per month */}
          {wrk.srvIds.map((sid) => {
            const srv = data.srvs.find((s) => s.sid === sid);
            const facM = wrk.srvFacM[sid] || EMPTY_12();
            const sesM = wrk.srvSesM[sid] || EMPTY_12();
            return (
              <div key={sid}>
                {/* Billing row */}
                <p className="mb-2 text-xs font-medium text-gray-500">Fac. {srv?.name || `Servicio ${sid}`}</p>
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
                        {facM.map((v, i) => (
                          <td key={i} className="px-0.5">
                            <NumInput
                              value={v}
                              onChange={(val) =>
                                updateWrk(wrk.wid, (w) => {
                                  const newFacM = { ...w.srvFacM };
                                  if (!newFacM[sid]) newFacM[sid] = EMPTY_12();
                                  const arr = [...newFacM[sid]];
                                  arr[i] = val;
                                  newFacM[sid] = arr;
                                  return { ...w, srvFacM: newFacM };
                                })
                              }
                              className="text-xs"
                            />
                          </td>
                        ))}
                        <td className="px-1 text-center text-xs font-semibold">{fmt(sum(facM))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Sessions row */}
                <p className="mb-2 text-xs font-medium text-gray-500">Ses. {srv?.name || `Servicio ${sid}`}</p>
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
                        {sesM.map((v, i) => (
                          <td key={i} className="px-0.5">
                            <NumInput
                              value={v}
                              onChange={(val) =>
                                updateWrk(wrk.wid, (w) => {
                                  const newSesM = { ...w.srvSesM };
                                  if (!newSesM[sid]) newSesM[sid] = EMPTY_12();
                                  const arr = [...newSesM[sid]];
                                  arr[i] = val;
                                  newSesM[sid] = arr;
                                  return { ...w, srvSesM: newSesM };
                                })
                              }
                              className="text-xs"
                            />
                          </td>
                        ))}
                        <td className="px-1 text-center text-xs font-semibold">{sum(sesM).toLocaleString("es-ES")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Churn rate and NPS */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Churn rate anual (%)</label>
              <NumInput value={wrk.churnAnual} onChange={(v) => updateWrk(wrk.wid, (w) => ({ ...w, churnAnual: v }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">NPS medio</label>
              <NumInput value={wrk.npsMedio} onChange={(v) => updateWrk(wrk.wid, (w) => ({ ...w, npsMedio: v }))} />
            </div>
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

// ── Section F: Pacientes ─────────────────────────────────────

function SeccionF({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const setMonthly = (idx: number, val: number) => {
    update((prev) => {
      const arr = [...prev.aNew];
      arr[idx] = val;
      return { ...prev, aNew: arr };
    });
  };

  const addCanal = () => {
    update((prev) => ({
      ...prev,
      pacCanales: [...prev.pacCanales, {
        id: Math.max(0, ...prev.pacCanales.map((c) => c.id)) + 1,
        canal: "",
        pacientes: 0,
      }],
    }));
  };

  const removeCanal = (id: number) => {
    update((prev) => ({
      ...prev,
      pacCanales: prev.pacCanales.filter((c) => c.id !== id),
    }));
  };

  const updateCanal = (id: number, fn: (c: PacCanal) => PacCanal) => {
    update((prev) => ({
      ...prev,
      pacCanales: prev.pacCanales.map((c) => (c.id === id ? fn(c) : c)),
    }));
  };

  return (
    <div className="space-y-6">
      <InstructionDropdown
        color="green"
        title="Instrucciones de este paso"
        intro="Registra los pacientes nuevos por mes y cómo han conocido tu clínica. Esto te permitirá analizar tus canales de captación y su eficiencia."
        steps={[
          "Indica los pacientes nuevos cada mes del año anterior.",
          "Añade los canales por los que te han conocido (Instagram, Google, recomendación, etc.).",
          "Estima el número de pacientes que llegaron de cada canal.",
        ]}
      />

      {/* Card 1: Pacientes nuevos por mes */}
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
                    <NumInput value={v} onChange={(val) => setMonthly(i, val)} />
                  </td>
                ))}
                <td className="px-2 text-center font-semibold text-gray-900">{sum(data.aNew).toLocaleString("es-ES")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card 2: Canales de captación */}
      <Card title="¿Cómo nos han conocido?">
        <div className="space-y-3">
          {data.pacCanales.map((canal) => (
            <div key={canal.id} className="flex items-center gap-3">
              <input
                type="text"
                value={canal.canal}
                onChange={(e) => updateCanal(canal.id, (c) => ({ ...c, canal: e.target.value }))}
                placeholder="Ej: Instagram, Google, Boca a boca..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <div className="w-32">
                <NumInput
                  value={canal.pacientes}
                  onChange={(v) => updateCanal(canal.id, (c) => ({ ...c, pacientes: v }))}
                  placeholder="Nº pacientes"
                />
              </div>
              {data.pacCanales.length > 0 && (
                <button onClick={() => removeCanal(canal.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addCanal}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <Plus size={14} /> Añadir canal
        </button>
        {data.pacCanales.length > 0 && (
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-600">Total de pacientes por canales:</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {sum(data.pacCanales.map((c) => c.pacientes)).toLocaleString("es-ES")}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Section D: Cuenta de resultados ─────────────────────────

function SeccionD({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const totalFacSrvs = sum(data.srvs.map((s) => sum(s.facM)));
  const totalIngresos = totalFacSrvs + data.dIngOtros;
  const totalGastos = sum(data.gastos.map((g) => g.valor));
  const beneficio = totalIngresos - totalGastos;
  const margen = totalIngresos > 0 ? (beneficio / totalIngresos) * 100 : 0;

  const alloc = data.costAlloc || {};

  // Initialize even distribution if a group has no allocation yet
  const getAlloc = (groupKey: string, sid: number): number => {
    if (alloc[groupKey]?.[sid] != null) return alloc[groupKey][sid];
    return data.srvs.length > 0 ? Math.round((100 / data.srvs.length) * 10) / 10 : 0;
  };

  // Independent allocation — no auto-balance, each slider is independent
  const setAlloc = (groupKey: string, sid: number, value: number) => {
    update((prev) => {
      const prevAlloc = prev.costAlloc || {};
      const groupAlloc = { ...(prevAlloc[groupKey] || {}) };

      // If allocation doesn't exist yet, initialize with even distribution
      if (Object.keys(groupAlloc).length === 0) {
        prev.srvs.forEach((s) => {
          groupAlloc[s.sid] = Math.round((100 / prev.srvs.length) * 10) / 10;
        });
      }

      groupAlloc[sid] = Math.max(0, value);

      return {
        ...prev,
        costAlloc: { ...prevAlloc, [groupKey]: groupAlloc },
      };
    });
  };

  // Compute totals
  const totalGastosByGroup: Record<string, number> = {};
  COST_GROUPS.forEach((g) => {
    totalGastosByGroup[g.key] = getGroupTotal(data.gastos, g.key);
  });

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
      <InstructionDropdown
        color="green"
        title="Instrucciones de este paso"
        intro="Aquí defines los ingresos adicionales y los gastos operativos para calcular el beneficio y margen de tu clínica. Esta información es fundamental para fijar tu objetivo de facturación."
      />

      {/* Revenue summary */}
      <Card title="Ingresos">
        <div className="grid gap-4 sm:grid-cols-3">
          <AutoField label="Facturación por servicios" value={fmt(totalFacSrvs)} sublabel="Suma de servicios" />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Otros ingresos</label>
            <NumInput
              value={data.dIngOtros}
              onChange={(v) => update((p) => ({ ...p, dIngOtros: v }))}
              prefix="€"
            />
            <p className="mt-1 text-xs text-gray-400">Formación, productos, etc.</p>
          </div>
          <AutoField label="Total ingresos" value={fmt(totalIngresos)} />
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
                className="w-64 rounded-md border border-gray-300 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="" disabled>— Selecciona partida —</option>
                <optgroup label="Aprovisionamiento">
                  <option value="APROV_COMPRAS">Compras de mercancías / mant. instalación</option>
                  <option value="APROV_OFICINA">Material de oficina y recepción</option>
                  <option value="APROV_FUNGIBLES">Suministros desechables y fungibles</option>
                  <option value="APROV_EXTERNO">Trabajos realizados por otras empresas</option>
                </optgroup>
                <optgroup label="Infraestructura">
                  <option value="INFRA_ALQUILER">Arrendamientos y cánones</option>
                  <option value="INFRA_COMUNIDAD">Gastos de comunidad e IBI</option>
                  <option value="INFRA_REPARACIONES">Reparaciones y conservación</option>
                  <option value="INFRA_BANCO">Servicios bancarios y similares</option>
                  <option value="INFRA_SUMINISTROS">Suministros agua, gas y electricidad</option>
                  <option value="INFRA_SEGUROS">Primas de seguros</option>
                  <option value="INFRA_TELECOM">Teléfono e internet</option>
                  <option value="INFRA_HOSTING">Hosting, web y dominios</option>
                  <option value="INFRA_RENTING">Renting de máquinas y amortizaciones</option>
                  <option value="INFRA_SOFTWARE">Software de gestión</option>
                  <option value="INFRA_OTROS">Otros servicios (desinfección, residuos...)</option>
                </optgroup>
                <optgroup label="Personal clínico">
                  <option value="PERS_CLIN_SUELDOS">Sueldos y salarios — personal clínico</option>
                  <option value="PERS_CLIN_SS">Gastos sociales y SS — clínico</option>
                  <option value="PERS_CLIN_PROP">Coste propio propietario como clínico</option>
                </optgroup>
                <optgroup label="Personal gestión">
                  <option value="PERS_GEST_SUELDOS">Sueldos y salarios — personal gestión</option>
                  <option value="PERS_GEST_SS">Gastos sociales y SS — gestión</option>
                  <option value="PERS_GEST_EXTERNO">Prestación de servicios de otros profesionales</option>
                </optgroup>
                <optgroup label="Marketing">
                  <option value="MKT">Marketing y publicidad</option>
                </optgroup>
                <optgroup label="Otros">
                  <option value="OTROS">Otros gastos</option>
                </optgroup>
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

      {/* Cost allocation per group */}
      {COST_GROUPS.map((group) => {
        const groupTotal = totalGastosByGroup[group.key];
        if (groupTotal === 0) return null; // Skip groups with no costs

        const groupSum = sum(data.srvs.map((s) => getAlloc(group.key, s.sid)));

        return (
          <Card key={group.key} title={group.label} subtitle={`Total: ${fmt(groupTotal)} — Reparte entre servicios`}>
            {/* Balance indicator */}
            <div className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 ${Math.abs(groupSum - 100) < 0.5 ? "bg-blue-50" : "bg-amber-50"}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${Math.abs(groupSum - 100) < 0.5 ? "bg-blue-500" : "bg-amber-500"}`} />
              <span className={`text-sm font-medium ${Math.abs(groupSum - 100) < 0.5 ? "text-blue-700" : "text-amber-700"}`}>
                {Math.abs(groupSum - 100) < 0.5
                  ? `${groupSum.toFixed(1)}% — Correcto`
                  : `${groupSum.toFixed(1)}% — La suma debe ser exactamente 100%`}
              </span>
            </div>

            <div className="space-y-4">
              {data.srvs.map((srv) => {
                const pctValue = getAlloc(group.key, srv.sid);
                const costForSrv = groupTotal * (pctValue / 100);
                return (
                  <div key={srv.sid} className="flex items-center gap-3">
                    <div className="w-32 truncate text-sm font-medium text-gray-700" title={srv.name || `Servicio ${srv.sid}`}>
                      {srv.name || `Servicio ${srv.sid}`}
                    </div>
                    {/* Slider */}
                    <div className="relative flex-1">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={pctValue}
                        onChange={(e) => setAlloc(group.key, srv.sid, parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
                      />
                      <div
                        className={`absolute top-0 left-0 h-2 rounded-full pointer-events-none ${group.color} opacity-30`}
                        style={{ width: `${Math.min(pctValue, 100)}%` }}
                      />
                    </div>
                    {/* Manual input */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={pctValue || ""}
                        onChange={(e) => setAlloc(group.key, srv.sid, parseFloat(e.target.value) || 0)}
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                    {/* Cost result */}
                    <div className="w-20 text-right text-xs font-medium text-gray-500">
                      {fmt(costForSrv)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* P&L Summary */}
      <Card title="Resumen de la cuenta de resultados">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-xs font-medium text-blue-600">Ingresos</p>
            <p className="mt-1 text-lg font-bold text-blue-700">{fmt(totalIngresos)}</p>
          </div>
          <div className="rounded-lg bg-gray-100 p-4 text-center">
            <p className="text-xs font-medium text-gray-600">Gastos</p>
            <p className="mt-1 text-lg font-bold text-gray-700">{fmt(totalGastos)}</p>
          </div>
          <div className={`rounded-lg p-4 text-center ${beneficio >= 0 ? "bg-green-50" : "bg-red-50"}`}>
            <p className={`text-xs font-medium ${beneficio >= 0 ? "text-green-600" : "text-red-600"}`}>Beneficio</p>
            <p className={`mt-1 text-lg font-bold ${beneficio >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(beneficio)}</p>
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

// ── Section E: Repercusión de costes / Margen por servicio ──

const COST_GROUPS = [
  { key: "APROV", label: "Aprovisionamiento", color: "bg-amber-500" },
  { key: "INFRA", label: "Infraestructura", color: "bg-blue-500" },
  { key: "PERS_CLIN", label: "Personal clínico", color: "bg-indigo-500" },
  { key: "PERS_GEST", label: "Personal gestión", color: "bg-purple-500" },
  { key: "MKT", label: "Marketing", color: "bg-pink-500" },
  { key: "OTROS", label: "Otros", color: "bg-gray-500" },
];

function getGroupTotal(gastos: Gasto[], groupKey: string): number {
  return sum(gastos.filter((g) => g.partida.startsWith(groupKey)).map((g) => g.valor));
}

function SeccionE({ data, update }: { data: Ej1Data; update: (fn: (p: Ej1Data) => Ej1Data) => void }) {
  const alloc = data.costAlloc || {};

  // Initialize even distribution if a group has no allocation yet
  const getAlloc = (groupKey: string, sid: number): number => {
    if (alloc[groupKey]?.[sid] != null) return alloc[groupKey][sid];
    return data.srvs.length > 0 ? Math.round((100 / data.srvs.length) * 10) / 10 : 0;
  };

  // Compute totals
  const totalGastosByGroup: Record<string, number> = {};
  COST_GROUPS.forEach((g) => {
    totalGastosByGroup[g.key] = getGroupTotal(data.gastos, g.key);
  });
  const totalGastos = sum(Object.values(totalGastosByGroup));

  // Compute cost per service
  const serviceCosts: Record<number, { total: number; byGroup: Record<string, number> }> = {};
  data.srvs.forEach((srv) => {
    const byGroup: Record<string, number> = {};
    let total = 0;
    COST_GROUPS.forEach((g) => {
      const pct = getAlloc(g.key, srv.sid) / 100;
      const cost = totalGastosByGroup[g.key] * pct;
      byGroup[g.key] = cost;
      total += cost;
    });
    serviceCosts[srv.sid] = { total, byGroup };
  });

  return (
    <div className="space-y-6">
      <InstructionDropdown
        color="green"
        title="Instrucciones: Margen por servicio"
        intro="Esta sección muestra el margen unitario resultante de cada servicio después de la repercusión de costes. Los costes se han distribuido en la sección anterior (Cuenta de resultados)."
      />

      {/* Margin result per service */}
      <Card title="Margen unitario por servicio" subtitle="Facturación menos costes repercutidos, dividido entre sesiones">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-xs font-medium text-gray-500">Servicio</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500">Facturación</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500">Costes</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500">Beneficio</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500">Sesiones</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500">Margen/sesión</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500">Margen %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.srvs.map((srv) => {
                const totalFac = sum(srv.facM);
                const totalSes = sum(srv.sesM);
                const costs = serviceCosts[srv.sid]?.total ?? 0;
                const beneficio = totalFac - costs;
                const margenUnitario = totalSes > 0 ? beneficio / totalSes : 0;
                const margenPct = totalFac > 0 ? (beneficio / totalFac) * 100 : 0;

                return (
                  <tr key={srv.sid}>
                    <td className="py-3 font-medium text-gray-900">{srv.name || `Servicio ${srv.sid}`}</td>
                    <td className="py-3 text-right text-gray-600">{fmt(totalFac)}</td>
                    <td className="py-3 text-right text-gray-600">{fmt(costs)}</td>
                    <td className={`py-3 text-right font-semibold ${beneficio >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(beneficio)}
                    </td>
                    <td className="py-3 text-right text-gray-600">{totalSes.toLocaleString("es-ES")}</td>
                    <td className={`py-3 text-right font-bold ${margenUnitario >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {totalSes > 0 ? fmt(margenUnitario) : "—"}
                    </td>
                    <td className={`py-3 text-right font-medium ${margenPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {totalFac > 0 ? `${margenPct.toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className="py-3 text-gray-700">TOTAL</td>
                <td className="py-3 text-right text-gray-700">{fmt(sum(data.srvs.map((s) => sum(s.facM))))}</td>
                <td className="py-3 text-right text-gray-700">{fmt(totalGastos)}</td>
                <td className={`py-3 text-right ${sum(data.srvs.map((s) => sum(s.facM))) - totalGastos >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {fmt(sum(data.srvs.map((s) => sum(s.facM))) - totalGastos)}
                </td>
                <td className="py-3 text-right text-gray-700">{sum(data.srvs.map((s) => sum(s.sesM))).toLocaleString("es-ES")}</td>
                <td className="py-3 text-right text-gray-400">—</td>
                <td className="py-3 text-right text-gray-400">
                  {sum(data.srvs.map((s) => sum(s.facM))) > 0
                    ? `${(((sum(data.srvs.map((s) => sum(s.facM))) - totalGastos) / sum(data.srvs.map((s) => sum(s.facM)))) * 100).toFixed(1)}%`
                    : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Visual breakdown per service */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {data.srvs.map((srv) => {
            const totalFac = sum(srv.facM);
            const costs = serviceCosts[srv.sid]?.total ?? 0;
            const beneficio = totalFac - costs;
            const margenPct = totalFac > 0 ? (beneficio / totalFac) * 100 : 0;

            return (
              <div key={srv.sid} className={`rounded-xl border-2 p-4 ${beneficio >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <p className="text-sm font-semibold text-gray-800">{srv.name || `Servicio ${srv.sid}`}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${beneficio >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {margenPct.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">margen</span>
                </div>
                {/* Cost breakdown mini-bars */}
                <div className="mt-2 flex gap-0.5 overflow-hidden rounded-full" style={{ height: "6px" }}>
                  {COST_GROUPS.map((g) => {
                    const groupCost = serviceCosts[srv.sid]?.byGroup[g.key] ?? 0;
                    const pct = totalFac > 0 ? (groupCost / totalFac) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={g.key}
                        className={`${g.color}`}
                        style={{ width: `${pct}%` }}
                        title={`${g.label}: ${fmt(groupCost)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                  {beneficio > 0 && (
                    <div className="bg-green-400" style={{ width: `${margenPct}%` }} title={`Beneficio: ${fmt(beneficio)}`} />
                  )}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>Costes: {fmt(costs)}</span>
                  <span className={beneficio >= 0 ? "text-green-600" : "text-red-600"}>Beneficio: {fmt(beneficio)}</span>
                </div>
              </div>
            );
          })}
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
  ej1,
}: {
  data: Ej2Data;
  update: (fn: (p: Ej2Data) => Ej2Data) => void;
  servicios: Servicio[];
  ej1: Ej1Data;
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

  // Facturación real del año anterior
  const facAnterior = sum(ej1.aFac);
  const ocupacionActual = totalFacMax > 0 ? (facAnterior / totalFacMax) * 100 : 0;

  return (
    <div className="space-y-6">
      <InstructionDropdown
        title="Instrucciones: Capacidad instalada"
        intro="En este ejercicio vas a definir las salas y espacios de tu clínica y su capacidad máxima. Es clave que fijes un ticket medio DESEADO para cada sala/servicio, ya que este dato alimentará el cálculo del forecast y los objetivos que te marques."
        steps={[
          "Configura los días laborables y semanas al año.",
          "Añade cada sala o espacio de tratamiento.",
          "Asigna un servicio, sesiones/hora, horas/día y, muy importante, el ticket medio que QUIERES conseguir.",
          "El sistema calculará automáticamente tu capacidad máxima y tu escenario óptimo (80% de ocupación).",
        ]}
      />

      <InstructionDropdown
        color="green"
        title="Sobre el ticket medio deseado"
        intro="El ticket medio que indiques aquí es el que TÚ quieres conseguir, no necesariamente el que tienes ahora. Este dato será fundamental para calcular el forecast y los KPIs objetivo. Si quieres subir precios, refleja aquí el precio objetivo."
      />

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
                <th className="pb-2 text-center text-xs font-medium text-gray-500">Ticket deseado</th>
                <th className="pb-2 text-right text-xs font-medium text-gray-500">Ses/año</th>
                <th className="pb-2 text-right text-xs font-medium text-gray-500">Fac. óptima/año</th>
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

      {/* Scenarios: Current vs Optimal only */}
      <Card title="Tu situación vs. escenario óptimo">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Current state — blue */}
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Tu estadio actual</p>
            <p className="mt-2 text-2xl font-bold text-blue-800">{fmt(facAnterior)}</p>
            <p className="mt-1 text-sm text-blue-600">
              {ocupacionActual > 0 ? `${ocupacionActual.toFixed(1)}% de ocupación` : "Sin datos del año anterior"}
            </p>
            {sum(ej1.aSes) > 0 && (
              <p className="mt-1 text-xs text-blue-500">{sum(ej1.aSes).toLocaleString("es-ES")} sesiones/año</p>
            )}
          </div>

          {/* Optimal — green */}
          <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Escenario óptimo (80%)</p>
            <p className="mt-2 text-2xl font-bold text-green-800">{fmt(totalFacMax * 0.8)}</p>
            <p className="mt-1 text-sm text-green-600">80% de ocupación</p>
            <p className="mt-1 text-xs text-green-500">{Math.round(totalSesAno * 0.8).toLocaleString("es-ES")} sesiones/año</p>
          </div>
        </div>

        {facAnterior > 0 && totalFacMax > 0 && (
          <div className="mt-4">
            {/* Progress bar */}
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>Ocupación actual: <strong className="text-blue-700">{ocupacionActual.toFixed(1)}%</strong></span>
              <span>100%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, ocupacionActual)}%` }}
              />
            </div>
            <div className="relative mt-1">
              <div className="absolute left-[80%] -translate-x-1/2 text-xs font-medium text-green-600">
                80% óptimo
              </div>
            </div>
          </div>
        )}
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
  const ocupacionActual = facMax > 0 ? (facAnterior / facMax) * 100 : 0;

  // Ticket medio ponderado from ej2 salas
  const ticketMedioPonderado = (() => {
    const totalSes = ej2.salas.reduce((acc, s) => acc + s.sesHora * s.horasDia * ej2.diasSem * ej2.semanasAno, 0);
    if (totalSes === 0) return 0;
    const totalFac = ej2.salas.reduce((acc, s) => {
      const ses = s.sesHora * s.horasDia * ej2.diasSem * ej2.semanasAno;
      return acc + ses * s.ticket;
    }, 0);
    return totalFac / totalSes;
  })();

  // Calculate objFac from sueldo + margen
  const calcObj = () => {
    if (data.sueldo > 0 && data.margen > 0) {
      const needed = totalGastos + data.sueldo;
      const obj = Math.round(needed / (data.margen / 100));
      update((p) => ({ ...p, objFac: obj }));
    }
  };

  // Generate forecast with session distribution
  const genForecast = () => {
    if (data.objFac <= 0) return;
    // Weight by previous year's monthly distribution, or equal
    const totalPrev = sum(ej1.aFac);
    const forecast = totalPrev > 0
      ? ej1.aFac.map((m) => Math.round((m / totalPrev) * data.objFac))
      : EMPTY_12().map(() => Math.round(data.objFac / 12));

    // Also generate session forecast based on ticket medio deseado
    const forecastSesiones = ticketMedioPonderado > 0
      ? forecast.map((f) => Math.round(f / ticketMedioPonderado))
      : EMPTY_12();

    update((p) => ({ ...p, forecast, forecastSesiones }));
  };

  // Sub-step lock logic within Sistema
  const isPasoUnlocked = (n: number): boolean => {
    if (n === 1) return true;
    if (n === 2) return true; // always visible (summary)
    if (n === 3) return true; // can set objective anytime
    if (n === 4) return data.objFac > 0;
    if (n === 5) return data.objFac > 0 && data.palancas.length > 0;
    return false;
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
        {PASOS.map((p, i) => {
          const unlocked = isPasoUnlocked(p.n);
          return (
            <div key={p.n} className="flex items-center">
              <button
                onClick={() => unlocked && setPaso(p.n)}
                disabled={!unlocked}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  paso === p.n
                    ? "bg-blue-600 text-white"
                    : unlocked
                      ? paso > p.n
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                {unlocked ? p.icon : <Lock size={10} />} {p.label}
              </button>
              {i < PASOS.length - 1 && <ArrowRight size={12} className="mx-1 text-gray-300" />}
            </div>
          );
        })}
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
              <p className="text-xs text-amber-600">Ticket medio actual</p>
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

      {/* Paso 2: Escenarios — only current vs optimal */}
      {paso === 2 && (
        <Card title="Tu situación actual vs. escenario óptimo" subtitle="Datos del Ejercicio 2">
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Tu estadio actual</p>
              <p className="mt-2 text-2xl font-bold text-blue-800">{fmt(facAnterior)}</p>
              <p className="mt-1 text-xs text-blue-500">{sum(ej1.aSes).toLocaleString("es-ES")} sesiones/año</p>
            </div>
            <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Escenario óptimo (80%)</p>
              <p className="mt-2 text-2xl font-bold text-green-800">{fmt(facMax * 0.8)}</p>
              <p className="mt-1 text-xs text-green-500">{Math.round(totalSesAno * 0.8).toLocaleString("es-ES")} sesiones/año</p>
            </div>
          </div>
          {facAnterior > 0 && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Ocupación actual estimada: <strong>{ocupacionActual.toFixed(1)}%</strong> de la capacidad máxima — el objetivo real que quieres alcanzar es el escenario óptimo (80%).
            </div>
          )}
        </Card>
      )}

      {/* Paso 3: Objetivo */}
      {paso === 3 && (
        <Card title="Define tu objetivo de facturación">
          <InstructionDropdown
            color="green"
            title="Instrucciones: Define tu objetivo"
            intro="¿Qué quieres que te deje tu negocio en beneficio? Piensa en: salario para ti + beneficio para la empresa y reinversión. El sistema calculará la facturación necesaria para conseguirlo."
            steps={[
              "Indica tu sueldo objetivo bruto anual. Recuerda que nuestra recomendación antes de tratar de crecer es que tú al menos saques una nómina con un coste empresa similar a la de un fisio, así que debes sumarlo.",
              "Fija el margen objetivo (%) que quieres que tenga tu negocio después de gastos.",
              "Pulsa 'Calcular objetivo' y el sistema te dirá cuánto necesitas facturar.",
            ]}
          />

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>
                <strong>Recomendación:</strong> Antes de tratar de crecer, asegúrate de que tu sueldo objetivo incluya al menos una nómina equivalente al coste empresa de un fisioterapeuta. Si no llegas a eso, esa es tu primera prioridad.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
        <div className="space-y-4">
          <InstructionDropdown
            title="Instrucciones: Estrategia"
            intro="Seleccionar estas vías de crecimiento va a ser clave, pero deben estar alineadas con todo el trabajo que has hecho hasta ahora. El sistema verificará que tu estrategia es coherente con tu radiografía, tu capacidad y tu objetivo."
            steps={[
              "Selecciona las 3-4 palancas principales que usarás para cerrar la brecha.",
              "Para cada palanca seleccionada, concreta los detalles: ¿cuánto esperas de cada una?",
              "Estos detalles alimentarán el forecast del siguiente paso.",
            ]}
          />

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
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${active ? "text-blue-700" : "text-gray-700"}`}>
                        {pal.label}
                      </span>
                      <p className={`text-xs ${active ? "text-blue-500" : "text-gray-400"}`}>{pal.desc}</p>
                    </div>
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

          {/* Detail per selected palanca */}
          {data.palancas.length > 0 && (
            <Card title="Concreta tu estrategia" subtitle="Detalla cómo aplicarás cada palanca seleccionada">
              <div className="space-y-4">
                {data.palancas.map((key) => {
                  const pal = PALANCAS_OPTIONS.find((p) => p.key === key)!;
                  const detalle = data.palancaDetalles?.[key] || { enfoque: "" };
                  const updateDetalle = (field: string, val: string | number) => {
                    update((prev) => ({
                      ...prev,
                      palancaDetalles: {
                        ...prev.palancaDetalles,
                        [key]: { ...detalle, [field]: val },
                      },
                    }));
                  };
                  return (
                    <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-gray-700">{pal.icon} {pal.label}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs text-gray-500">¿Cómo lo vas a aplicar?</label>
                          <textarea
                            value={detalle.enfoque}
                            onChange={(e) => updateDetalle("enfoque", e.target.value)}
                            placeholder="Describe brevemente tu enfoque..."
                            rows={2}
                            className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        {key === "precio" && (
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Ticket medio objetivo</label>
                            <NumInput
                              value={detalle.ticketObjetivo || 0}
                              onChange={(v) => updateDetalle("ticketObjetivo", v)}
                              prefix="€"
                            />
                          </div>
                        )}
                        {(key === "captacion") && (
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Pacientes nuevos/mes objetivo</label>
                            <NumInput
                              value={detalle.pacientesNuevos || 0}
                              onChange={(v) => updateDetalle("pacientesNuevos", v)}
                            />
                          </div>
                        )}
                        {key === "recurrencia" && (
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Sesiones extra/paciente/año</label>
                            <NumInput
                              value={detalle.sesionesExtra || 0}
                              onChange={(v) => updateDetalle("sesionesExtra", v)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coherence check */}
              {data.objFac > 0 && facMax > 0 && data.objFac > facMax * 0.95 && !data.palancas.includes("servicios") && !data.palancas.includes("ocupacion") && (
                <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Tu objetivo está cerca de tu capacidad máxima. Considera añadir "Nuevos servicios" o "Mejorar ocupación" como palancas, o revisa si necesitas ampliar capacidad.
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Paso 5: Forecast */}
      {paso === 5 && (
        <div className="space-y-6">
          <InstructionDropdown
            title="Instrucciones: KPIs y Forecast"
            intro="Haciendo click en 'Generar forecast automático' el sistema te establecerá unos objetivos mensuales de facturación y sesiones basados en la estacionalidad del año anterior y el ticket medio deseado que definiste en Capacidad instalada."
            steps={[
              "Pulsa el botón para generar el forecast automáticamente.",
              "El sistema distribuirá tu objetivo siguiendo la estacionalidad del año anterior.",
              "Calculará las sesiones necesarias por mes usando tu ticket medio deseado.",
              "Puedes ajustar manualmente cualquier mes si lo necesitas.",
            ]}
          />

          <Card title="Forecast mensual" subtitle="Facturación y sesiones objetivo distribuidas en 12 meses">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {data.objFac > 0 && (
                <button
                  onClick={genForecast}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Generar forecast automático
                </button>
              )}
              {ticketMedioPonderado > 0 && (
                <span className="text-xs text-gray-500">
                  Ticket medio deseado: <strong className="text-blue-700">{fmt(ticketMedioPonderado)}</strong> (de Capacidad instalada)
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="pb-2 text-left text-xs text-gray-500 w-24">Concepto</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="px-0.5 pb-2 text-center text-xs text-gray-500">{m}</th>
                    ))}
                    <th className="px-2 pb-2 text-center text-xs font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Previous year billing */}
                  <tr>
                    <td className="py-1 text-xs font-medium text-gray-500">Fac. ant.</td>
                    {ej1.aFac.map((v, i) => (
                      <td key={i} className="px-0.5 text-center text-xs text-gray-400">{v > 0 ? fmt(v) : "—"}</td>
                    ))}
                    <td className="px-2 text-center text-xs font-semibold text-gray-500">{fmt(facAnterior)}</td>
                  </tr>
                  {/* Forecast billing */}
                  <tr>
                    <td className="py-1 text-xs font-medium text-blue-600">Obj. fac.</td>
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
                  {/* Forecast sessions */}
                  <tr>
                    <td className="py-1 text-xs font-medium text-green-600">Obj. ses.</td>
                    {(data.forecastSesiones || EMPTY_12()).map((v, i) => (
                      <td key={i} className="px-0.5">
                        <NumInput
                          value={v}
                          onChange={(val) =>
                            update((prev) => {
                              const fs = [...(prev.forecastSesiones || EMPTY_12())];
                              fs[i] = val;
                              return { ...prev, forecastSesiones: fs };
                            })
                          }
                          className="text-xs"
                        />
                      </td>
                    ))}
                    <td className="px-2 text-center text-xs font-bold text-green-700">{sum(data.forecastSesiones || EMPTY_12()).toLocaleString("es-ES")}</td>
                  </tr>
                  {/* Previous year sessions */}
                  <tr>
                    <td className="py-1 text-xs font-medium text-gray-500">Ses. ant.</td>
                    {ej1.aSes.map((v, i) => (
                      <td key={i} className="px-0.5 text-center text-xs text-gray-400">{v > 0 ? v.toLocaleString("es-ES") : "—"}</td>
                    ))}
                    <td className="px-2 text-center text-xs font-semibold text-gray-500">{sum(ej1.aSes).toLocaleString("es-ES")}</td>
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

          {/* KPI summary — captación, recurrencia, etc */}
          {sum(data.forecast) > 0 && (
            <Card title="Cuadro de mandos objetivo">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-xs font-medium text-blue-600">Facturación objetivo</p>
                  <p className="mt-1 text-xl font-bold text-blue-800">{fmt(data.objFac)}</p>
                  <p className="mt-1 text-xs text-blue-500">vs {fmt(facAnterior)} anterior</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-xs font-medium text-green-600">Sesiones objetivo</p>
                  <p className="mt-1 text-xl font-bold text-green-800">{sum(data.forecastSesiones || EMPTY_12()).toLocaleString("es-ES")}</p>
                  <p className="mt-1 text-xs text-green-500">vs {sum(ej1.aSes).toLocaleString("es-ES")} anterior</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <p className="text-xs font-medium text-amber-600">Ticket medio deseado</p>
                  <p className="mt-1 text-xl font-bold text-amber-800">{ticketMedioPonderado > 0 ? fmt(ticketMedioPonderado) : "—"}</p>
                  <p className="mt-1 text-xs text-amber-500">
                    vs {sum(ej1.aSes) > 0 ? fmt(facAnterior / sum(ej1.aSes)) : "—"} actual
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <p className="text-xs font-medium text-purple-600">Crecimiento</p>
                  <p className="mt-1 text-xl font-bold text-purple-800">{crecimientoPct.toFixed(1)}%</p>
                  <p className="mt-1 text-xs text-purple-500">
                    {data.palancas.length} palanca{data.palancas.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Palancas summary */}
              {data.palancas.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-200 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Estrategia seleccionada</p>
                  <div className="flex flex-wrap gap-2">
                    {data.palancas.map((key) => {
                      const pal = PALANCAS_OPTIONS.find((p) => p.key === key);
                      return (
                        <span key={key} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {pal?.icon} {pal?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Full summary card */}
          <Card title="Resumen del diagnóstico">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Situación actual</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Facturación: <strong>{fmt(facAnterior)}</strong></p>
                  <p>Sesiones: <strong>{sum(ej1.aSes).toLocaleString("es-ES")}</strong></p>
                  <p>Ticket medio: <strong>{sum(ej1.aSes) > 0 ? fmt(facAnterior / sum(ej1.aSes)) : "—"}</strong></p>
                  <p>Servicios: <strong>{ej1.srvs.length}</strong> · Profesionales: <strong>{ej1.wrks.length}</strong></p>
                  <p>Capacidad máx: <strong>{fmt(facMax)}</strong> · Ocupación: <strong>{ocupacionActual.toFixed(1)}%</strong></p>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Objetivo y estrategia</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Objetivo: <strong>{fmt(data.objFac)}</strong> (+{crecimientoPct.toFixed(1)}%)</p>
                  <p>Sueldo objetivo: <strong>{fmt(data.sueldo)}</strong></p>
                  <p>Ticket medio deseado: <strong>{ticketMedioPonderado > 0 ? fmt(ticketMedioPonderado) : "—"}</strong></p>
                  <p>Palancas: <strong>{data.palancas.length > 0 ? data.palancas.map((p) => PALANCAS_OPTIONS.find((o) => o.key === p)?.label).join(", ") : "Sin seleccionar"}</strong></p>
                </div>
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
        {paso < 5 && isPasoUnlocked(paso + 1) && (
          <button
            onClick={() => setPaso((p) => Math.min(5, p + 1))}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Siguiente paso <ChevronRight size={14} />
          </button>
        )}
        {paso < 5 && !isPasoUnlocked(paso + 1) && (
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Lock size={12} /> Completa este paso para continuar
          </span>
        )}
      </div>
    </div>
  );
}
