"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader } from "lucide-react";

type FormData = {
  title: string;
  description: string;
  category: string;
  program: string;
  stepNumber: string;
  tags: string;
  content: string;
};

export default function SubirDocumentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "metodologia",
    program: "",
    stepNumber: "",
    tags: "",
    content: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError("El título es obligatorio");
        setLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        setError("El contenido es obligatorio");
        setLoading(false);
        return;
      }

      // Parse stepNumber if provided
      const stepNumber = formData.stepNumber ? parseInt(formData.stepNumber, 10) : null;
      if (stepNumber && (stepNumber < 1 || stepNumber > 16)) {
        setError("El paso debe estar entre 1 y 16");
        setLoading(false);
        return;
      }

      // Parse tags
      const tags = formData.tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        program: formData.program || null,
        stepNumber,
        tags,
        content: formData.content.trim(),
      };

      const response = await fetch("/api/admin/cerebro-fr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al subir el documento");
      }

      // Redirect on success
      router.push("/admin/cerebro-fr");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subir documento a Cerebro FR</h1>
        <p className="mt-1 text-sm text-gray-500">
          Agrega un nuevo documento a la base de conocimiento del programa
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {/* Error Message */}
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
            placeholder="Ej: Estrategia de pricing para clínicas de fisioterapia"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-900">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Resumen breve del documento"
            rows={2}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <option value="metodologia">Metodología</option>
            <option value="caso_exito">Caso de éxito</option>
            <option value="plantilla">Plantilla</option>
            <option value="referencia">Referencia</option>
            <option value="experto">Experto</option>
          </select>
        </div>

        {/* Program */}
        <div>
          <label htmlFor="program" className="block text-sm font-medium text-gray-900">
            Programa (opcional)
          </label>
          <select
            id="program"
            name="program"
            value={formData.program}
            onChange={handleInputChange}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Aplica a todos los programas</option>
            <option value="ACTIVA">ACTIVA</option>
            <option value="OPTIMIZA">OPTIMIZA</option>
            <option value="ESCALA">ESCALA</option>
          </select>
        </div>

        {/* Step Number */}
        <div>
          <label htmlFor="stepNumber" className="block text-sm font-medium text-gray-900">
            Número de paso (opcional, 1-16)
          </label>
          <input
            type="number"
            id="stepNumber"
            name="stepNumber"
            value={formData.stepNumber}
            onChange={handleInputChange}
            min="1"
            max="16"
            placeholder="Ej: 5"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-900">
            Etiquetas (opcional)
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
            Contenido del documento *
          </label>
          <p className="mt-1 text-xs text-gray-600">
            Pega el contenido del documento aquí. Por ahora almacenamos el texto directamente.
          </p>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Pega el contenido completo del documento aquí..."
            rows={10}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            {loading ? "Subiendo..." : "Subir documento"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
