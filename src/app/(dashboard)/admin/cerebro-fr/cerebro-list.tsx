"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Tag,
  Search,
  Filter,
  Pencil,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CerebroDoc = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  program: string | null;
  stepNumber: number | null;
  tags: string[];
  content: string | null;
  isActive: boolean;
  createdAt: string;
  uploadedBy: { firstName: string; lastName: string };
};

const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "metodologia", label: "Metodología" },
  { value: "caso_exito", label: "Caso de éxito" },
  { value: "plantilla", label: "Plantilla" },
  { value: "referencia", label: "Referencia" },
  { value: "experto", label: "Experto" },
];

const PROGRAMS = [
  { value: "", label: "Todos" },
  { value: "ACTIVA", label: "ACTIVA" },
  { value: "OPTIMIZA", label: "OPTIMIZA" },
  { value: "ESCALA", label: "ESCALA" },
];

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    metodologia: "bg-blue-100 text-blue-700",
    caso_exito: "bg-green-100 text-green-700",
    plantilla: "bg-purple-100 text-purple-700",
    referencia: "bg-amber-100 text-amber-700",
    experto: "bg-red-100 text-red-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    metodologia: "Metodología",
    caso_exito: "Caso de éxito",
    plantilla: "Plantilla",
    referencia: "Referencia",
    experto: "Experto",
  };
  return labels[category] || category;
}

function getProgramBadgeColor(program: string): string {
  const colors: Record<string, string> = {
    ACTIVA: "bg-blue-100 text-blue-700",
    OPTIMIZA: "bg-green-100 text-green-700",
    ESCALA: "bg-purple-100 text-purple-700",
  };
  return colors[program] || "bg-gray-100 text-gray-700";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CerebroList({ initialDocs }: { initialDocs: CerebroDoc[] }) {
  const router = useRouter();
  const [docs, setDocs] = useState<CerebroDoc[]>(initialDocs);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CerebroDoc | null>(null);

  const filtered = docs.filter((doc) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      doc.title.toLowerCase().includes(term) ||
      (doc.description ?? "").toLowerCase().includes(term) ||
      doc.tags.some((t) => t.toLowerCase().includes(term)) ||
      (doc.content ?? "").toLowerCase().includes(term);

    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    const matchesProgram =
      !programFilter || doc.program === programFilter;

    return matchesSearch && matchesCategory && matchesProgram;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cerebro-fr/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== deleteId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };

  const activeFiltersCount =
    (categoryFilter ? 1 : 0) + (programFilter ? 1 : 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cerebro FR</h1>
          <p className="mt-1 text-sm text-gray-500">
            {docs.length} documento{docs.length !== 1 ? "s" : ""} en la base de
            conocimiento
          </p>
        </div>
        <Link
          href="/admin/cerebro-fr/subir"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Subir documento
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por título, descripción, tags o contenido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              showFilters || activeFiltersCount > 0
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <Filter size={16} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Programa
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {PROGRAMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setCategoryFilter("");
                  setProgramFilter("");
                }}
                className="self-end text-xs text-blue-600 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {(search || activeFiltersCount > 0) && (
        <p className="mb-4 text-xs text-gray-500">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="mb-2 text-gray-600">
            {docs.length === 0
              ? "No hay documentos en Cerebro FR todavía."
              : "No se encontraron documentos con esos filtros."}
          </p>
          {docs.length === 0 && (
            <Link
              href="/admin/cerebro-fr/subir"
              className="text-blue-600 hover:underline"
            >
              Sube el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              {/* Actions (top right) */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Vista previa"
                >
                  <Eye size={14} />
                </button>
                <Link
                  href={`/admin/cerebro-fr/editar/${doc.id}`}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                  title="Editar"
                >
                  <Pencil size={14} />
                </Link>
                <button
                  onClick={() => setDeleteId(doc.id)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Category Badge */}
              <div className="mb-3">
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-1 text-xs font-medium",
                    getCategoryColor(doc.category)
                  )}
                >
                  {getCategoryLabel(doc.category)}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900">
                {doc.title}
              </h3>

              {/* Program + Step */}
              <div className="mb-3 flex flex-wrap gap-2">
                {doc.program && (
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      getProgramBadgeColor(doc.program)
                    )}
                  >
                    {doc.program}
                  </span>
                )}
                {doc.stepNumber && (
                  <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    Paso {doc.stepNumber}
                  </span>
                )}
              </div>

              {/* Tags */}
              {doc.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {doc.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 4 && (
                    <span className="text-[10px] text-gray-400">
                      +{doc.tags.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {doc.description && (
                <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                  {doc.description}
                </p>
              )}

              {/* Footer */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">
                  {doc.uploadedBy.firstName} {doc.uploadedBy.lastName} ·{" "}
                  {formatDate(doc.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Eliminar documento?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Esta acción no se puede deshacer. El documento se eliminará
              permanentemente de Cerebro FR.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      getCategoryColor(previewDoc.category)
                    )}
                  >
                    {getCategoryLabel(previewDoc.category)}
                  </span>
                  {previewDoc.program && (
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                        getProgramBadgeColor(previewDoc.program)
                      )}
                    >
                      {previewDoc.program}
                    </span>
                  )}
                  {previewDoc.stepNumber && (
                    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      Paso {previewDoc.stepNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {previewDoc.title}
                </h3>
                {previewDoc.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {previewDoc.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {previewDoc.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1">
                  {previewDoc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {previewDoc.content}
              </div>
            </div>
            <div className="flex justify-between border-t border-gray-200 p-4">
              <p className="text-xs text-gray-400">
                {previewDoc.uploadedBy.firstName}{" "}
                {previewDoc.uploadedBy.lastName} ·{" "}
                {formatDate(previewDoc.createdAt)}
              </p>
              <Link
                href={`/admin/cerebro-fr/editar/${previewDoc.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
              >
                <Pencil size={14} />
                Editar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
