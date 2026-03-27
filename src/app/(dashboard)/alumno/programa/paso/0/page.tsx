"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain,
  Heart,
  Target,
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2,
  Check,
  Lightbulb,
  AlertTriangle,
  Flame,
  FileSignature,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type MentalidadData = {
  ejercicio1?: Ej1Data; // Autoevaluación
  ejercicio2?: Ej2Data; // Carta de compromiso
};

type Ej1Data = {
  situacionActual: string;
  horasSemanaClinica: number;
  horasSemanaTratando: number;
  horasSemanaGestion: number;
  porQueAbriste: string;
  queTeFrustra: string;
  queTeGustaría: string;
  miedos: string[];
  excusas: string[];
  creenciasLimitantes: string[];
  nivelSatisfaccion: number; // 1-10
  nivelEstres: number; // 1-10
  nivelControl: number; // 1-10
  identidad: "tecnico" | "hibrido" | "empresario" | "";
};

type Ej2Data = {
  compromiso: string;
  queEstoyDispuestoACambiar: string;
  queDejoDeHacer: string;
  comoMedireMiProgreso: string;
  firma: string; // name as signature
  fecha: string;
};

const DEFAULT_EJ1: Ej1Data = {
  situacionActual: "",
  horasSemanaClinica: 0,
  horasSemanaTratando: 0,
  horasSemanaGestion: 0,
  porQueAbriste: "",
  queTeFrustra: "",
  queTeGustaría: "",
  miedos: [""],
  excusas: [""],
  creenciasLimitantes: [""],
  nivelSatisfaccion: 5,
  nivelEstres: 5,
  nivelControl: 5,
  identidad: "",
};

const DEFAULT_EJ2: Ej2Data = {
  compromiso: "",
  queEstoyDispuestoACambiar: "",
  queDejoDeHacer: "",
  comoMedireMiProgreso: "",
  firma: "",
  fecha: new Date().toISOString().split("T")[0],
};

// ══════════════════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════════════════

const TABS = [
  { key: "situacion", label: "Tu situación", icon: Brain },
  { key: "miedos", label: "Miedos y excusas", icon: AlertTriangle },
  { key: "identidad", label: "Tu identidad", icon: Lightbulb },
  { key: "compromiso", label: "Carta de compromiso", icon: FileSignature },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════

export default function Paso0Page() {
  const [data, setData] = useState<MentalidadData>({});
  const [ej1, setEj1] = useState<Ej1Data>(DEFAULT_EJ1);
  const [ej2, setEj2] = useState<Ej2Data>(DEFAULT_EJ2);
  const [tab, setTab] = useState<TabKey>("situacion");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load ──
  useEffect(() => {
    fetch("/api/alumno/programa/paso/0")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ejercicio1) setEj1({ ...DEFAULT_EJ1, ...d.ejercicio1 });
        if (d?.ejercicio2) setEj2({ ...DEFAULT_EJ2, ...d.ejercicio2 });
        setData(d || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Auto-save ──
  const save = useCallback(
    async (e1: Ej1Data, e2: Ej2Data) => {
      setSaving(true);
      try {
        await fetch("/api/alumno/programa/paso/0", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ejercicio1: e1, ejercicio2: e2 }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        console.error("Save error:", e);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const debouncedSave = useCallback(
    (e1: Ej1Data, e2: Ej2Data) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(e1, e2), 2000);
    },
    [save]
  );

  const updateEj1 = <K extends keyof Ej1Data>(key: K, value: Ej1Data[K]) => {
    setEj1((prev) => {
      const next = { ...prev, [key]: value };
      debouncedSave(next, ej2);
      return next;
    });
  };

  const updateEj2 = <K extends keyof Ej2Data>(key: K, value: Ej2Data[K]) => {
    setEj2((prev) => {
      const next = { ...prev, [key]: value };
      debouncedSave(ej1, next);
      return next;
    });
  };

  // ── List helpers ──
  const updateListItem = (key: "miedos" | "excusas" | "creenciasLimitantes", idx: number, value: string) => {
    setEj1((prev) => {
      const arr = [...prev[key]];
      arr[idx] = value;
      const next = { ...prev, [key]: arr };
      debouncedSave(next, ej2);
      return next;
    });
  };

  const addListItem = (key: "miedos" | "excusas" | "creenciasLimitantes") => {
    setEj1((prev) => {
      const next = { ...prev, [key]: [...prev[key], ""] };
      return next;
    });
  };

  const removeListItem = (key: "miedos" | "excusas" | "creenciasLimitantes", idx: number) => {
    setEj1((prev) => {
      const arr = prev[key].filter((_, i) => i !== idx);
      const next = { ...prev, [key]: arr.length === 0 ? [""] : arr };
      debouncedSave(next, ej2);
      return next;
    });
  };

  // ── Tab navigation ──
  const tabIdx = TABS.findIndex((t) => t.key === tab);
  const prevTab = tabIdx > 0 ? TABS[tabIdx - 1] : null;
  const nextTab = tabIdx < TABS.length - 1 ? TABS[tabIdx + 1] : null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/alumno/programa" className="hover:text-blue-600">Programa</a>
          <ChevronRight size={14} />
          <span className="font-medium text-gray-900">Paso 0</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Mentalidad: de Fisio a Empresario</h1>
        <p className="mt-1 text-sm text-gray-500">
          El primer paso es el más importante. Antes de tocar números, necesitas un cambio de chip.
        </p>
      </div>

      {/* Save indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        {saving && (
          <span className="flex items-center gap-1 text-blue-500">
            <Loader2 size={14} className="animate-spin" /> Guardando...
          </span>
        )}
        {saved && (
          <span className="flex items-center gap-1 text-green-600">
            <Check size={14} /> Guardado
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {/* ── Tab: Situación ── */}
        {tab === "situacion" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Tu situación actual</h2>
              <p className="text-sm text-gray-500 mb-4">Sé honesto contigo mismo. Nadie más verá estas respuestas.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe tu situación actual como dueño de clínica
              </label>
              <textarea
                value={ej1.situacionActual}
                onChange={(e) => updateEj1("situacionActual", e.target.value)}
                rows={4}
                placeholder="¿Cómo te sientes? ¿Cómo es tu día a día? ¿Estás donde querías estar?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas/semana en la clínica</label>
                <input
                  type="number"
                  value={ej1.horasSemanaClinica || ""}
                  onChange={(e) => updateEj1("horasSemanaClinica", +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas/semana tratando</label>
                <input
                  type="number"
                  value={ej1.horasSemanaTratando || ""}
                  onChange={(e) => updateEj1("horasSemanaTratando", +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas/semana en gestión</label>
                <input
                  type="number"
                  value={ej1.horasSemanaGestion || ""}
                  onChange={(e) => updateEj1("horasSemanaGestion", +e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {ej1.horasSemanaClinica > 0 && ej1.horasSemanaTratando > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  <strong>{Math.round((ej1.horasSemanaTratando / ej1.horasSemanaClinica) * 100)}%</strong> de tu tiempo
                  lo pasas tratando pacientes.{" "}
                  {ej1.horasSemanaTratando / ej1.horasSemanaClinica > 0.7
                    ? "Eres más técnico que empresario. Ese es precisamente el cambio que vamos a trabajar."
                    : ej1.horasSemanaTratando / ej1.horasSemanaClinica > 0.4
                    ? "Estás en una zona híbrida. Tienes margen para crecer como empresario."
                    : "Ya dedicas más tiempo a gestionar que a tratar. Buen punto de partida."}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Por qué abriste tu clínica?</label>
              <textarea
                value={ej1.porQueAbriste}
                onChange={(e) => updateEj1("porQueAbriste", e.target.value)}
                rows={3}
                placeholder="Vuelve al origen. ¿Qué te motivó a dar el paso?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué es lo que más te frustra del día a día?</label>
              <textarea
                value={ej1.queTeFrustra}
                onChange={(e) => updateEj1("queTeFrustra", e.target.value)}
                rows={3}
                placeholder="Sin filtros. ¿Qué te quita energía, qué te preocupa?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo te gustaría que fuera tu vida dentro de 12 meses?</label>
              <textarea
                value={ej1.queTeGustaría}
                onChange={(e) => updateEj1("queTeGustaría", e.target.value)}
                rows={3}
                placeholder="Sé concreto. Horarios, ingresos, equipo, vacaciones, sensaciones..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Satisfaction scales */}
            <div className="space-y-4">
              {[
                { key: "nivelSatisfaccion" as const, label: "Nivel de satisfacción con tu clínica", color: "blue" },
                { key: "nivelEstres" as const, label: "Nivel de estrés", color: "red" },
                { key: "nivelControl" as const, label: "Sensación de control sobre el negocio", color: "green" },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}: <span className={`font-bold text-${color}-600`}>{ej1[key]}/10</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ej1[key]}
                    onChange={(e) => updateEj1(key, +e.target.value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Miedos y excusas ── */}
        {tab === "miedos" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Miedos, excusas y creencias limitantes</h2>
              <p className="text-sm text-gray-500 mb-4">
                Todo empresario los tiene. Ponerlos por escrito es el primer paso para superarlos.
              </p>
            </div>

            {/* Miedos */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Mis miedos como dueño de clínica
              </label>
              {ej1.miedos.map((m, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={m}
                    onChange={(e) => updateListItem("miedos", i, e.target.value)}
                    placeholder={`Miedo ${i + 1}...`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {ej1.miedos.length > 1 && (
                    <button onClick={() => removeListItem("miedos", i)} className="text-red-400 hover:text-red-600 px-2">×</button>
                  )}
                </div>
              ))}
              <button onClick={() => addListItem("miedos")} className="text-sm text-blue-600 hover:text-blue-800">+ Añadir miedo</button>
            </div>

            {/* Excusas */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Flame size={16} className="text-orange-500" />
                Excusas que me pongo para no cambiar
              </label>
              {ej1.excusas.map((e, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={e}
                    onChange={(ev) => updateListItem("excusas", i, ev.target.value)}
                    placeholder={`Excusa ${i + 1}: "Es que no tengo tiempo para...", "Es que mi zona..."...`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {ej1.excusas.length > 1 && (
                    <button onClick={() => removeListItem("excusas", i)} className="text-red-400 hover:text-red-600 px-2">×</button>
                  )}
                </div>
              ))}
              <button onClick={() => addListItem("excusas")} className="text-sm text-blue-600 hover:text-blue-800">+ Añadir excusa</button>
            </div>

            {/* Creencias limitantes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Brain size={16} className="text-purple-500" />
                Creencias limitantes que detecto en mí
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Ejemplos: "Los fisios no podemos cobrar más", "Si subo el precio perderé pacientes", "No sé de números"...
              </p>
              {ej1.creenciasLimitantes.map((c, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={c}
                    onChange={(e) => updateListItem("creenciasLimitantes", i, e.target.value)}
                    placeholder={`Creencia ${i + 1}...`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {ej1.creenciasLimitantes.length > 1 && (
                    <button onClick={() => removeListItem("creenciasLimitantes", i)} className="text-red-400 hover:text-red-600 px-2">×</button>
                  )}
                </div>
              ))}
              <button onClick={() => addListItem("creenciasLimitantes")} className="text-sm text-blue-600 hover:text-blue-800">+ Añadir creencia</button>
            </div>

            {ej1.miedos.filter(Boolean).length > 0 && ej1.excusas.filter(Boolean).length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm text-amber-800">
                  <strong>Has identificado {ej1.miedos.filter(Boolean).length} miedos y {ej1.excusas.filter(Boolean).length} excusas.</strong>{" "}
                  Reconocerlos es valiente y necesario. Durante el programa, trabajaremos sobre cada uno de ellos con acciones concretas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Identidad ── */}
        {tab === "identidad" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">¿Quién eres hoy?</h2>
              <p className="text-sm text-gray-500 mb-4">
                No hay respuesta buena o mala. Hay una respuesta honesta.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  value: "tecnico" as const,
                  icon: Heart,
                  title: "Técnico",
                  desc: "Trato pacientes todo el día. La gestión me la como con patatas. Mi clínica depende de mí al 100%.",
                  color: "red",
                },
                {
                  value: "hibrido" as const,
                  icon: Target,
                  title: "Híbrido",
                  desc: "Trato y gestiono. Hago de todo. A veces siento que no hago nada bien porque no me da la vida.",
                  color: "amber",
                },
                {
                  value: "empresario" as const,
                  icon: Lightbulb,
                  title: "Empresario",
                  desc: "Dedico la mayor parte del tiempo a gestionar, planificar y hacer crecer el negocio.",
                  color: "green",
                },
              ].map(({ value, icon: Icon, title, desc, color }) => (
                <button
                  key={value}
                  onClick={() => updateEj1("identidad", value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    ej1.identidad === value
                      ? `border-${color}-500 bg-${color}-50 ring-2 ring-${color}-200`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon size={24} className={`mb-2 text-${color}-500`} />
                  <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                  <p className="mt-1 text-xs text-gray-600">{desc}</p>
                </button>
              ))}
            </div>

            {ej1.identidad && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  {ej1.identidad === "tecnico" && (
                    <>Te identificas como <strong>técnico</strong>. Es el punto de partida más habitual en nuestros alumnos. El programa ACTIVA está diseñado exactamente para este salto: de fisio a empresario, paso a paso.</>
                  )}
                  {ej1.identidad === "hibrido" && (
                    <>Estás en la <strong>zona híbrida</strong>. Ya has dado algunos pasos, pero probablemente sientes que no avanzas lo suficiente en ninguna dirección. ACTIVA te ayudará a estructurar ese cambio.</>
                  )}
                  {ej1.identidad === "empresario" && (
                    <>Ya te identificas como <strong>empresario</strong>. ACTIVA te ayudará a consolidar lo que ya tienes y a identificar los puntos ciegos que todo empresario tiene.</>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Carta de compromiso ── */}
        {tab === "compromiso" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Tu carta de compromiso</h2>
              <p className="text-sm text-gray-500 mb-4">
                Este es un pacto contigo mismo. Escríbelo con honestidad. Volveremos a leerlo en el Paso 16.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mi compromiso con este programa
              </label>
              <textarea
                value={ej2.compromiso}
                onChange={(e) => updateEj2("compromiso", e.target.value)}
                rows={4}
                placeholder="Yo me comprometo a... (sé específico: horas, actitud, acciones concretas)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué estoy dispuesto a cambiar?
              </label>
              <textarea
                value={ej2.queEstoyDispuestoACambiar}
                onChange={(e) => updateEj2("queEstoyDispuestoACambiar", e.target.value)}
                rows={3}
                placeholder="Hábitos, horarios, formas de pensar, decisiones que llevo posponiendo..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué dejo de hacer a partir de hoy?
              </label>
              <textarea
                value={ej2.queDejoDeHacer}
                onChange={(e) => updateEj2("queDejoDeHacer", e.target.value)}
                rows={3}
                placeholder="Quejarme sin actuar, comparar mi clínica con otras, poner excusas..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cómo mediré mi progreso?
              </label>
              <textarea
                value={ej2.comoMedireMiProgreso}
                onChange={(e) => updateEj2("comoMedireMiProgreso", e.target.value)}
                rows={3}
                placeholder="Completar cada paso a tiempo, aplicar lo aprendido la misma semana, llevar un diario..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Firma */}
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu firma (nombre completo)</label>
                  <input
                    value={ej2.firma}
                    onChange={(e) => updateEj2("firma", e.target.value)}
                    placeholder="Nombre y apellidos"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={ej2.fecha}
                    onChange={(e) => updateEj2("fecha", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {ej2.firma && (
                <p className="mt-4 text-center text-lg italic text-gray-600">
                  &ldquo;{ej2.firma}&rdquo; — {ej2.fecha}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {prevTab ? (
          <button
            onClick={() => setTab(prevTab.key)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
            {prevTab.label}
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={() => save(ej1, ej2)}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar
        </button>

        {nextTab ? (
          <button
            onClick={() => setTab(nextTab.key)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {nextTab.label}
            <ChevronRight size={16} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
