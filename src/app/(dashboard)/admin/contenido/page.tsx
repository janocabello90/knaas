"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, AlertCircle } from "lucide-react";

interface Lesson {
  id: string;
  step_number: number;
  phase: string;
  lesson_number: number;
  title: string;
  subtitle: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function ContenidoPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/lessons");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cargar lecciones");
      }
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // Group lessons by step
  const groupedByStep = lessons.reduce((acc, lesson) => {
    const key = lesson.step_number;
    if (!acc[key]) acc[key] = [];
    acc[key].push(lesson);
    return acc;
  }, {} as Record<number, Lesson[]>);

  const sortedSteps = Object.keys(groupedByStep)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contenido del Programa</h1>
          <p className="mt-2 text-gray-600">Gestiona las lecciones y bloques de contenido para cada paso</p>
        </div>
        <Link
          href="/admin/contenido/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva lección
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-gap-3 gap-3 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Lessons list */}
      {!loading && !error && lessons.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-gray-600 mb-4">No hay lecciones creadas aún</p>
          <Link
            href="/admin/contenido/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primera lección
          </Link>
        </div>
      )}

      {!loading && sortedSteps.length > 0 && (
        <div className="space-y-8">
          {sortedSteps.map((step) => (
            <div key={step} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Paso {step}</h2>
              <div className="grid gap-4">
                {groupedByStep[step]
                  .sort((a, b) => {
                    const phaseOrder = { saber: 0, decidir: 1, activar: 2 };
                    const phaseCompare =
                      (phaseOrder[a.phase as keyof typeof phaseOrder] || 999) -
                      (phaseOrder[b.phase as keyof typeof phaseOrder] || 999);
                    if (phaseCompare !== 0) return phaseCompare;
                    return a.lesson_number - b.lesson_number;
                  })
                  .map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/admin/contenido/${lesson.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {lesson.title || "Sin título"}
                          </h3>
                          {lesson.subtitle && (
                            <p className="mt-1 text-sm text-gray-600">{lesson.subtitle}</p>
                          )}
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                              {lesson.phase}
                            </span>
                            <span className="text-gray-500">
                              {lesson.lesson_number > 0 && `Lección ${lesson.lesson_number}`}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-white ${
                                lesson.published ? "bg-green-600" : "bg-gray-400"
                              }`}
                            >
                              {lesson.published ? "Publicada" : "Borrador"}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                          <div>
                            {new Date(lesson.updated_at).toLocaleDateString("es-ES")}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
