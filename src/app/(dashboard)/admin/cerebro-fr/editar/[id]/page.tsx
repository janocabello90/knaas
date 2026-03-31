"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, Loader, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

type FormData = {
  title: string;
  description: string;
  category: string;
  program: string;
  stepNumber: string;
  tags: string;
  content: string;
};

export default function EditarDocumentoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "fundamentos",
    program: "",
    stepNumber: "",
    tags: "",
    content: "",
  });

  useEffect(() => {
    fetch(`/api/admin/cerebro-fr/${id}`)
      .then((r) => r.json())
      .then((doc) => {
        setFormData({
          title: doc.title || "",
          description: doc.description || "",
          category: doc.category || "metodologia",
          program: doc.program || "",
          stepNumber: doc.stepNumber ? String(doc.stepNumber) : "",
          tags: (doc.tags || []).join(", "),
          content: doc.content || "",
        });
      })
      .catch(() => setError("Error al cargar el documento"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!formData.title.trim()) {
        setError("El título es obligatorio");
        setSaving(false);
        return;
      }
      if (!formData.content.trim()) {
        setError("El contenido es obligatorio");
        setSaving(false);
        return;
      }

      const stepNumber = formData.stepNumber ? parseInt(formData.stepNumber, 10) : null;
      if (stepNumber != null && (stepNumber < 0 || stepNumber > 13)) {
        setError("El paso debe estar entre 0 y 13");
        setSaving(false);
        return;
      }

      const tags = formData.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      const res = await fetch(`/api/admin/cerebro-fr/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          program: formData.program || null,
          stepNumber,
          tags,
          content: formData.content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar");
      }

      router.push("/admin/cerebro-fr");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/cerebro-fr"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={14} />
          Volver a Cerebro FR
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar documento</h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
      >
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="mt-0.5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-900">
            Título *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-900">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={2}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-900">
            Categoría *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="fundamentos">Fundamentos</option>
            <option value="caso_exito">Caso de éxito</option>
            <option value="plantilla">Plantilla</option>
            <option value="referencia">Referencia</option>
            <option value="experto">Experto</option>
          </select>
        </div>

        {/* Program */}
        <div>
          <label htmlFor="program" className="block text-sm font-medium text-gray-900">
            Programa
          </label>
          <select
            id="program"
            name="program"
            value={formData.program}
            onChange={handleInputChange}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Aplica a todos</option>
            <option value="ACTIVA">ACTIVA</option>
            <option value="OPTIMIZA">OPTIMIZA</option>
            <option value="ESCALA">ESCALA</option>
          </select>
        </div>

        {/* Step Number */}
        <div>
          <label htmlFor="stepNumber" className="block text-sm font-medium text-gray-900">
            Número de paso (1-16)
          </label>
          <input
            type="number"
            id="stepNumber"
            name="stepNumber"
            value={formData.stepNumber}
            onChange={handleInputChange}
            min="1"
            max="16"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-900">
            Etiquetas
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="Separadas por comas: ventas, pricing, equipo"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-900">
            Contenido *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={12}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
