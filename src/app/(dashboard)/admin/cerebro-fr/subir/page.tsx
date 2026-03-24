"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Loader,
  Upload,
  FileText,
  Type,
  ArrowLeft,
  File,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FormData = {
  title: string;
  description: string;
  category: string;
  program: string;
  stepNumber: string;
  tags: string;
  content: string;
};

type InputMode = "file" | "text";

export default function SubirDocumentoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "fundamentos",
    program: "",
    stepNumber: "",
    tags: "",
    content: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "docx", "doc", "txt", "md"];
    if (!ext || !allowed.includes(ext)) {
      setError(`Formato .${ext} no soportado. Usa PDF, DOCX, TXT o MD.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo no puede superar los 10MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
    // Auto-fill title from filename if empty
    if (!formData.title) {
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
      setFormData((prev) => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError("El título es obligatorio");
        setLoading(false);
        return;
      }

      if (inputMode === "file") {
        if (!selectedFile) {
          setError("Selecciona un archivo para subir");
          setLoading(false);
          return;
        }

        // File upload
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("title", formData.title.trim());
        fd.append("description", formData.description.trim());
        fd.append("category", formData.category);
        fd.append("program", formData.program);
        fd.append("stepNumber", formData.stepNumber);
        fd.append("tags", formData.tags);

        const res = await fetch("/api/admin/cerebro-fr/upload", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al subir el archivo");
        }
      } else {
        // Text paste
        if (!formData.content.trim()) {
          setError("El contenido es obligatorio");
          setLoading(false);
          return;
        }

        const stepNumber = formData.stepNumber ? parseInt(formData.stepNumber, 10) : null;
        if (stepNumber && (stepNumber < 1 || stepNumber > 16)) {
          setError("El paso debe estar entre 1 y 16");
          setLoading(false);
          return;
        }

        const tags = formData.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0);

        const res = await fetch("/api/admin/cerebro-fr", {
          method: "POST",
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
          throw new Error(data.error || "Error al subir el documento");
        }
      }

      router.push("/admin/cerebro-fr");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setLoading(false);
    }
  };

  const fileSizeLabel = selectedFile
    ? selectedFile.size > 1024 * 1024
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(selectedFile.size / 1024).toFixed(0)} KB`
    : "";

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "PDF";
    if (ext === "docx" || ext === "doc") return "DOC";
    if (ext === "txt") return "TXT";
    if (ext === "md") return "MD";
    return "FILE";
  };

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
        <h1 className="text-2xl font-bold text-gray-900">
          Subir documento a Cerebro FR
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          El contenido se extrae automáticamente y KNAAS lo usará para dar
          mejores respuestas a los alumnos.
        </p>
      </div>

      {/* Input mode tabs */}
      <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setInputMode("file")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            inputMode === "file"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Upload size={16} />
          Subir archivo
        </button>
        <button
          type="button"
          onClick={() => setInputMode("text")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            inputMode === "text"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Type size={16} />
          Pegar texto
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
      >
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* File upload area */}
        {inputMode === "file" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Archivo *
            </label>
            <p className="mb-3 text-xs text-gray-500">
              PDF, Word (.docx), texto (.txt) o Markdown (.md) — máximo 10MB
            </p>

            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  dragOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                )}
              >
                <Upload
                  size={32}
                  className={cn(
                    "mx-auto mb-3",
                    dragOver ? "text-blue-500" : "text-gray-400"
                  )}
                />
                <p className="text-sm font-medium text-gray-700">
                  Arrastra un archivo aquí o haz clic para seleccionar
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  PDF, DOCX, TXT, MD
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                  {fileIcon(selectedFile.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">{fileSizeLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
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
            Descripción / Contexto
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Describe qué contiene este documento. KNAAS usa esta descripción
            para decidir cuándo es relevante mostrarlo a un alumno.
          </p>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Ej: Metodología para calcular el ticket medio ideal según modelo de clínica. Incluye fórmula EPIC y ejemplos reales de 3 clínicas."
            rows={3}
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category + Program in row */}
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        {/* Step + Tags in row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="stepNumber" className="block text-sm font-medium text-gray-900">
              Paso (1-16)
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
              placeholder="ventas, pricing, equipo"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content (only for text mode) */}
        {inputMode === "text" && (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-900">
              Contenido del documento *
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Pega aquí el contenido completo. KNAAS lo usará como referencia.
            </p>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Pega el contenido completo del documento aquí..."
              rows={12}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            {loading
              ? inputMode === "file"
                ? "Procesando archivo..."
                : "Subiendo..."
              : "Subir documento"}
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
