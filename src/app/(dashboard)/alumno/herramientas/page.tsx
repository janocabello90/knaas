"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Link2,
  Loader2,
  Star,
  Users,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Wrench,
  ChevronRight,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NpsData {
  connected: boolean;
  message?: string;
  npsUrl?: string;
  clinic?: { name: string; slug: string; teamSize: number };
  metrics?: {
    npsScore: number | null;
    avgScore: number | null;
    total: number;
    promoters: number;
    passives: number;
    detractors: number;
    trend: "up" | "down" | "stable" | null;
    recentNps: number | null;
    previousNps: number | null;
  };
  latestResponses?: {
    score: number;
    category: string;
    feedback: string | null;
    date: string;
    staff: string[] | null;
  }[];
  staffNps?: { name: string; nps: number; total: number }[];
  npsAppUrl?: string;
  surveyUrl?: string;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  status: "active" | "coming-soon";
  url?: string;
}

/* ------------------------------------------------------------------ */
/*  Tool definitions (extensible)                                      */
/* ------------------------------------------------------------------ */

const TOOLS: Tool[] = [
  {
    id: "nps",
    name: "NPS FisioReferentes",
    description:
      "Mide la satisfacción de tus pacientes con encuestas NPS y haz seguimiento por fisioterapeuta.",
    icon: <Star size={24} />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    status: "active",
  },
  {
    id: "brujula",
    name: "La Brújula",
    description:
      "Tu mapa de madurez empresarial como dueño de clínica. Descubre dónde estás y hacia dónde ir.",
    icon: <Sparkles size={24} />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    status: "coming-soon",
  },
  {
    id: "calculadora",
    name: "Calculadora de Rentabilidad",
    description:
      "Simula escenarios de pricing, costes y capacidad para tu clínica.",
    icon: <BarChart3 size={24} />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    status: "coming-soon",
  },
];

/* ------------------------------------------------------------------ */
/*  Score color helper                                                 */
/* ------------------------------------------------------------------ */

function npsColor(score: number | null) {
  if (score === null) return "text-gray-400";
  if (score >= 50) return "text-emerald-600";
  if (score >= 0) return "text-amber-600";
  return "text-red-600";
}

function npsBg(score: number | null) {
  if (score === null) return "bg-gray-50";
  if (score >= 50) return "bg-emerald-50";
  if (score >= 0) return "bg-amber-50";
  return "bg-red-50";
}

function categoryColor(cat: string) {
  if (cat === "promoter") return "text-emerald-600 bg-emerald-50";
  if (cat === "passive") return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function categoryLabel(cat: string) {
  if (cat === "promoter") return "Promotor";
  if (cat === "passive") return "Pasivo";
  return "Detractor";
}

/* ------------------------------------------------------------------ */
/*  NPS Card Component                                                 */
/* ------------------------------------------------------------------ */

function NpsCard() {
  const [data, setData] = useState<NpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/alumno/herramientas/nps")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ connected: false, message: "Error de conexión" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Star size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">NPS FisioReferentes</h3>
            <p className="text-sm text-gray-500">Cargando datos...</p>
          </div>
          <Loader2 size={20} className="ml-auto animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Not connected — show setup CTA
  if (!data?.connected) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Star size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">NPS FisioReferentes</h3>
            <p className="mt-1 text-sm text-gray-500">
              {data?.message || "Configura tu sistema NPS para medir la satisfacción de pacientes."}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <a
            href={data?.npsUrl || "https://nps-fisioreferentes.vercel.app/registro"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Configurar NPS
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
          <Star size={20} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">NPS — {data.clinic?.name}</h3>
          <p className="text-xs text-gray-500">Últimos 90 días</p>
        </div>
        <div className="flex gap-2">
          {data.surveyUrl && (
            <a
              href={data.surveyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              title="Enlace de encuesta"
            >
              <Link2 size={14} />
              Encuesta
            </a>
          )}
          {data.npsAppUrl && (
            <a
              href={data.npsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Panel NPS
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Metric cards */}
      {m && (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {/* NPS Score */}
          <div className={`rounded-lg p-3 ${npsBg(m.npsScore)}`}>
            <p className="text-xs font-medium text-gray-500">NPS Score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${npsColor(m.npsScore)}`}>
                {m.npsScore !== null ? m.npsScore : "—"}
              </span>
              {m.trend === "up" && (
                <TrendingUp size={16} className="text-emerald-500" />
              )}
              {m.trend === "down" && (
                <TrendingDown size={16} className="text-red-500" />
              )}
              {m.trend === "stable" && (
                <Minus size={16} className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Total responses */}
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-medium text-gray-500">Respuestas</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{m.total}</p>
          </div>

          {/* Promoters */}
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="flex items-center gap-1">
              <ThumbsUp size={12} className="text-emerald-500" />
              <p className="text-xs font-medium text-gray-500">Promotores</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {m.promoters}
            </p>
          </div>

          {/* Detractors */}
          <div className="rounded-lg bg-red-50 p-3">
            <div className="flex items-center gap-1">
              <ThumbsDown size={12} className="text-red-500" />
              <p className="text-xs font-medium text-gray-500">Detractores</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {m.detractors}
            </p>
          </div>
        </div>
      )}

      {/* Expandable detail */}
      {m && m.total > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <span>Ver detalle</span>
            <ChevronRight
              size={16}
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>

          {expanded && (
            <div className="space-y-4 border-t border-gray-100 p-4">
              {/* Staff NPS */}
              {data.staffNps && data.staffNps.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users size={14} />
                    NPS por Fisioterapeuta
                  </h4>
                  <div className="space-y-2">
                    {data.staffNps.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">{s.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            {s.total} resp.
                          </span>
                          <span
                            className={`text-sm font-bold ${npsColor(s.nps)}`}
                          >
                            {s.nps}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest responses */}
              {data.latestResponses && data.latestResponses.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-700">
                    Últimas respuestas
                  </h4>
                  <div className="space-y-2">
                    {data.latestResponses.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <span
                          className={`mt-0.5 rounded px-2 py-0.5 text-xs font-bold ${categoryColor(
                            r.category
                          )}`}
                        >
                          {r.score}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-medium ${categoryColor(
                                r.category
                              )} rounded px-1.5 py-0.5`}
                            >
                              {categoryLabel(r.category)}
                            </span>
                            {r.staff && r.staff.length > 0 && (
                              <span className="text-xs text-gray-400">
                                · {r.staff.join(", ")}
                              </span>
                            )}
                          </div>
                          {r.feedback && (
                            <p className="mt-1 text-sm text-gray-600">
                              &ldquo;{r.feedback}&rdquo;
                            </p>
                          )}
                        </div>
                        <span className="whitespace-nowrap text-xs text-gray-400">
                          {new Date(r.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Coming-soon card                                                   */
/* ------------------------------------------------------------------ */

function ComingSoonCard({ tool }: { tool: Tool }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 opacity-75">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.bgColor}`}
        >
          <span className={tool.color}>{tool.icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{tool.name}</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              Próximamente
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function HerramientasPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hub de Herramientas FR
            </h1>
            <p className="text-sm text-gray-500">
              Todas las herramientas de FisioReferentes para gestionar tu clínica
            </p>
          </div>
        </div>
      </div>

      {/* Active tools */}
      <div className="space-y-4">
        <NpsCard />
      </div>

      {/* Coming soon tools */}
      {TOOLS.filter((t) => t.status === "coming-soon").length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Próximamente
          </h2>
          {TOOLS.filter((t) => t.status === "coming-soon").map((tool) => (
            <ComingSoonCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
