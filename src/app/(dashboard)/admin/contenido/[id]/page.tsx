"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Video as VideoIcon,
  Type,
  BookOpen,
  Quote,
  Lightbulb,
  AlertTriangle,
  List as ListIcon,
  AlertCircle as SeparatorIcon,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  ClipboardPaste,
  X,
} from "lucide-react";

type BlockType = "heading" | "paragraph" | "quote" | "callout" | "list" | "warning" | "video" | "image" | "separator";

interface Block {
  id: string;
  type: BlockType;
  content?: string;
  items?: string[];
  icon?: "pin" | "bulb" | "warning" | "flag";
  videoUrl?: string;
  videoProvider?: "youtube" | "loom";
  imageUrl?: string;
  imageAlt?: string;
}

interface Lesson {
  id: string;
  step_number: number;
  phase: string;
  lesson_number: number;
  title: string;
  subtitle: string;
  blocks: Block[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

const PHASES = ["saber", "decidir", "activar"];
const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "heading", label: "Título", icon: <Type className="w-4 h-4" /> },
  { type: "paragraph", label: "Texto", icon: <BookOpen className="w-4 h-4" /> },
  { type: "quote", label: "Cita", icon: <Quote className="w-4 h-4" /> },
  { type: "callout", label: "Destacado", icon: <Lightbulb className="w-4 h-4" /> },
  { type: "list", label: "Lista", icon: <ListIcon className="w-4 h-4" /> },
  { type: "warning", label: "Aviso", icon: <AlertTriangle className="w-4 h-4" /> },
  { type: "video", label: "Vídeo", icon: <VideoIcon className="w-4 h-4" /> },
  { type: "image", label: "Imagen", icon: <ImageIcon className="w-4 h-4" /> },
  { type: "separator", label: "Separador", icon: <SeparatorIcon className="w-4 h-4" /> },
];

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);

  return debouncedValue;
}

export default function LessonEditorPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isDraft, setIsDraft] = useState(true);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // Debounce the lesson data for auto-save
  const debouncedLesson = useDebounce(lesson, 2000);

  // Auto-save effect
  useEffect(() => {
    if (!debouncedLesson || lessonId === "new") return;

    const autoSave = async () => {
      try {
        setSaveStatus("saving");
        const res = await fetch(`/api/admin/lessons/${lessonId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: debouncedLesson.title,
            subtitle: debouncedLesson.subtitle,
            blocks: debouncedLesson.blocks,
            published: debouncedLesson.published,
          }),
        });

        if (!res.ok) {
          throw new Error("Error al guardar");
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
      }
    };

    autoSave();
  }, [debouncedLesson, lessonId]);

  // Load lesson
  useEffect(() => {
    if (lessonId === "new") {
      setLesson({
        id: "new",
        step_number: 0,
        phase: "saber",
        lesson_number: 0,
        title: "",
        subtitle: "",
        blocks: [],
        published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    loadLesson();
  }, [lessonId]);

  async function loadLesson() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/lessons/${lessonId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cargar lección");
      }
      const data = await res.json();
      setLesson(data);
      setIsDraft(!data.published);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!lesson) return;

    try {
      setSaveStatus("saving");
      const isNew = lessonId === "new";

      if (isNew) {
        // Create new lesson
        const res = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepNumber: lesson.step_number,
            phase: lesson.phase,
            lessonNumber: lesson.lesson_number,
            title: lesson.title,
            subtitle: lesson.subtitle,
            blocks: lesson.blocks,
            published: lesson.published,
          }),
        });

        if (!res.ok) {
          throw new Error("Error al crear lección");
        }

        const data = await res.json();
        setSaveStatus("saved");
        router.push(`/admin/contenido/${data.id}`);
      } else {
        // Update existing lesson
        const res = await fetch(`/api/admin/lessons/${lessonId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lesson.title,
            subtitle: lesson.subtitle,
            blocks: lesson.blocks,
            published: lesson.published,
          }),
        });

        if (!res.ok) {
          throw new Error("Error al guardar lección");
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  function parseTextToBlocks(text: string): Block[] {
    const lines = text.split("\n");
    const blocks: Block[] = [];
    let currentListItems: string[] = [];

    function flushList() {
      if (currentListItems.length > 0) {
        blocks.push({
          id: crypto.randomUUID(),
          type: "list",
          items: [...currentListItems],
        });
        currentListItems = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines (they just separate paragraphs)
      if (!trimmed) {
        flushList();
        continue;
      }

      // Detect headings: lines in ALL CAPS (min 3 chars, no lowercase) or lines starting with #
      if (trimmed.startsWith("# ")) {
        flushList();
        blocks.push({
          id: crypto.randomUUID(),
          type: "heading",
          content: trimmed.replace(/^#+\s*/, ""),
        });
        continue;
      }

      if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(trimmed) && !/^\d/.test(trimmed) && trimmed.length < 120) {
        flushList();
        blocks.push({
          id: crypto.randomUUID(),
          type: "heading",
          content: trimmed,
        });
        continue;
      }

      // Detect quotes: lines starting with > or "
      if (trimmed.startsWith(">") || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        flushList();
        blocks.push({
          id: crypto.randomUUID(),
          type: "quote",
          content: trimmed.replace(/^>\s*/, "").replace(/^"|"$/g, ""),
        });
        continue;
      }

      // Detect list items: lines starting with - , * , • , or numbered (1. 2. etc)
      if (/^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "");
        currentListItems.push(itemText);
        continue;
      }

      // Detect separators: lines that are just --- or === or ___
      if (/^[-=_]{3,}$/.test(trimmed)) {
        flushList();
        blocks.push({
          id: crypto.randomUUID(),
          type: "separator",
        });
        continue;
      }

      // Detect video URLs
      if ((trimmed.includes("youtube.com") || trimmed.includes("youtu.be") || trimmed.includes("loom.com")) && trimmed.startsWith("http")) {
        flushList();
        let provider: "youtube" | "loom" | undefined;
        if (trimmed.includes("youtube") || trimmed.includes("youtu.be")) provider = "youtube";
        else if (trimmed.includes("loom")) provider = "loom";
        blocks.push({
          id: crypto.randomUUID(),
          type: "video",
          videoUrl: trimmed,
          videoProvider: provider,
        });
        continue;
      }

      // Everything else is a paragraph
      flushList();
      blocks.push({
        id: crypto.randomUUID(),
        type: "paragraph",
        content: trimmed,
      });
    }

    flushList();
    return blocks;
  }

  function handlePasteContent() {
    if (!lesson || !pasteText.trim()) return;
    const newBlocks = parseTextToBlocks(pasteText);
    setLesson({ ...lesson, blocks: [...lesson.blocks, ...newBlocks] });
    setPasteText("");
    setShowPasteModal(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="flex items-gap-3 gap-3 rounded-lg bg-red-50 p-4 text-red-700">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Error al cargar la lección</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Guardando...</span>
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm">Guardado</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Error al guardar</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={lessonId !== "new" && saveStatus === "saving"}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>

      {/* Title and metadata */}
      <div className="space-y-4 border-b border-gray-200 pb-6">
        <input
          type="text"
          value={lesson.title}
          onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
          placeholder="Título de la lección"
          className="w-full text-3xl font-bold outline-none placeholder-gray-300 text-gray-900"
        />

        <input
          type="text"
          value={lesson.subtitle}
          onChange={(e) => setLesson({ ...lesson, subtitle: e.target.value })}
          placeholder="Subtítulo (opcional)"
          className="w-full text-lg outline-none placeholder-gray-300 text-gray-600"
        />

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paso
            </label>
            <input
              type="number"
              value={lesson.step_number}
              onChange={(e) =>
                setLesson({ ...lesson, step_number: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fase
            </label>
            <select
              value={lesson.phase}
              onChange={(e) => setLesson({ ...lesson, phase: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {PHASES.map((phase) => (
                <option key={phase} value={phase}>
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de lección
            </label>
            <input
              type="number"
              value={lesson.lesson_number}
              onChange={(e) =>
                setLesson({ ...lesson, lesson_number: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <button
              onClick={() => setLesson({ ...lesson, published: !lesson.published })}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                lesson.published
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {lesson.published ? "Publicada" : "Borrador"}
            </button>
          </div>
        </div>
      </div>

      {/* Blocks editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Contenido</h2>
          <button
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" />
            Pegar contenido
          </button>
        </div>

        {lesson.blocks.length === 0 ? (
          <div className="text-center py-8 rounded-lg border border-dashed border-gray-300 bg-gray-50">
            <p className="text-gray-600 mb-4">Aún no hay bloques de contenido</p>
            <AddBlockButton
              onAddBlock={(type) => addBlock(lesson, setLesson, type, 0)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {lesson.blocks.map((block, index) => (
              <div key={block.id} className="space-y-2">
                <BlockEditor
                  block={block}
                  onChange={(updated) => {
                    const newBlocks = [...lesson.blocks];
                    newBlocks[index] = updated;
                    setLesson({ ...lesson, blocks: newBlocks });
                  }}
                  onDelete={() => {
                    const newBlocks = lesson.blocks.filter((_, i) => i !== index);
                    setLesson({ ...lesson, blocks: newBlocks });
                  }}
                  onMoveUp={() => {
                    if (index === 0) return;
                    const newBlocks = [...lesson.blocks];
                    [newBlocks[index - 1], newBlocks[index]] = [
                      newBlocks[index],
                      newBlocks[index - 1],
                    ];
                    setLesson({ ...lesson, blocks: newBlocks });
                  }}
                  onMoveDown={() => {
                    if (index === lesson.blocks.length - 1) return;
                    const newBlocks = [...lesson.blocks];
                    [newBlocks[index], newBlocks[index + 1]] = [
                      newBlocks[index + 1],
                      newBlocks[index],
                    ];
                    setLesson({ ...lesson, blocks: newBlocks });
                  }}
                />

                {index < lesson.blocks.length - 1 && (
                  <AddBlockButton
                    onAddBlock={(type) => addBlock(lesson, setLesson, type, index + 1)}
                  />
                )}
              </div>
            ))}

            <AddBlockButton
              onAddBlock={(type) =>
                addBlock(lesson, setLesson, type, lesson.blocks.length)
              }
            />
          </div>
        )}
      </div>

      {/* Paste content modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pegar contenido</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pega el texto de la lección. Se detectarán automáticamente títulos, párrafos, listas y citas. Después podrás añadir imágenes y vídeos.
                </p>
              </div>
              <button
                onClick={() => { setShowPasteModal(false); setPasteText(""); }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-auto">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Pega aquí todo el contenido de la lección...\n\nLos TÍTULOS EN MAYÚSCULAS se detectan como encabezados.\nLas líneas que empiezan con - o • se convierten en listas.\nLas líneas con > se convierten en citas.\nLos enlaces de YouTube o Loom se incrustan como vídeo.\nEl resto se convierte en párrafos."}
                className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-mono"
                autoFocus
              />
              {pasteText.trim() && (
                <p className="text-xs text-gray-500 mt-2">
                  Se generarán ~{parseTextToBlocks(pasteText).length} bloques
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => { setShowPasteModal(false); setPasteText(""); }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePasteContent}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Convertir en bloques
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add block helper
function addBlock(
  lesson: Lesson,
  setLesson: (lesson: Lesson) => void,
  type: BlockType,
  index: number
) {
  const newBlock: Block = {
    id: crypto.randomUUID(),
    type,
    content: "",
    items: type === "list" ? [""] : undefined,
    icon: type === "callout" ? "bulb" : undefined,
    videoUrl: type === "video" ? "" : undefined,
    imageUrl: type === "image" ? "" : undefined,
    imageAlt: type === "image" ? "" : undefined,
  };

  const newBlocks = [...lesson.blocks];
  newBlocks.splice(index, 0, newBlock);
  setLesson({ ...lesson, blocks: newBlocks });
}

// Add Block Button Component
function AddBlockButton({ onAddBlock }: { onAddBlock: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir bloque
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
      {BLOCK_TYPES.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => {
            onAddBlock(type);
            setOpen(false);
          }}
          className="flex flex-col items-center gap-2 p-2 text-xs rounded-lg hover:bg-white hover:border border-gray-200 transition-colors"
        >
          {icon}
          <span className="text-gray-700">{label}</span>
        </button>
      ))}
    </div>
  );
}

// Block Editor Component
function BlockEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors group">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-600 capitalize">
          {BLOCK_TYPES.find((bt) => bt.type === block.type)?.label || block.type}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onMoveUp}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Mover arriba"
          >
            <ArrowUp className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onMoveDown}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Mover abajo"
          >
            <ArrowDown className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {block.type === "heading" && (
          <textarea
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Escribe el título..."
            className="w-full text-2xl font-bold outline-none border-none resize-none placeholder-gray-300"
            rows={2}
          />
        )}

        {block.type === "paragraph" && (
          <textarea
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Escribe el párrafo..."
            className="w-full text-base outline-none border-none resize-none placeholder-gray-300"
            rows={3}
          />
        )}

        {block.type === "quote" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-1 bg-blue-400 rounded-full flex-shrink-0" />
              <textarea
                value={block.content || ""}
                onChange={(e) => onChange({ ...block, content: e.target.value })}
                placeholder="Escribe la cita..."
                className="w-full text-base italic outline-none border-none resize-none placeholder-gray-300"
                rows={2}
              />
            </div>
          </div>
        )}

        {block.type === "callout" && (
          <div className="space-y-3">
            <div className="flex gap-2 items-start">
              <select
                value={block.icon || "bulb"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    icon: e.target.value as "pin" | "bulb" | "warning" | "flag",
                  })
                }
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="pin">📌 Pin</option>
                <option value="bulb">💡 Bulb</option>
                <option value="warning">⚠️ Warning</option>
                <option value="flag">🏁 Flag</option>
              </select>
            </div>
            <textarea
              value={block.content || ""}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              placeholder="Escribe el destacado..."
              className="w-full text-base outline-none border border-gray-200 rounded p-3 resize-none placeholder-gray-300"
              rows={3}
            />
          </div>
        )}

        {block.type === "list" && (
          <div className="space-y-2">
            {(block.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-gray-400">•</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[idx] = e.target.value;
                    onChange({ ...block, items: newItems });
                  }}
                  placeholder={`Elemento ${idx + 1}`}
                  className="flex-1 text-base outline-none border-none placeholder-gray-300"
                />
                <button
                  onClick={() => {
                    const newItems = (block.items || []).filter((_, i) => i !== idx);
                    onChange({ ...block, items: newItems });
                  }}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newItems = [...(block.items || []), ""];
                onChange({ ...block, items: newItems });
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Añadir elemento
            </button>
          </div>
        )}

        {block.type === "warning" && (
          <div className="space-y-3">
            <div className="flex gap-2 items-center text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Aviso</span>
            </div>
            <textarea
              value={block.content || ""}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              placeholder="Escribe el aviso..."
              className="w-full text-base outline-none border border-orange-200 bg-orange-50 rounded p-3 resize-none placeholder-orange-400"
              rows={2}
            />
          </div>
        )}

        {block.type === "video" && (
          <div className="space-y-3">
            <input
              type="text"
              value={block.videoUrl || ""}
              onChange={(e) => {
                const url = e.target.value;
                let provider: "youtube" | "loom" | undefined;
                if (url.includes("youtube.com") || url.includes("youtu.be")) {
                  provider = "youtube";
                } else if (url.includes("loom.com")) {
                  provider = "loom";
                }
                onChange({
                  ...block,
                  videoUrl: url,
                  videoProvider: provider,
                });
              }}
              placeholder="Pega la URL de YouTube o Loom..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none"
            />
            {block.videoUrl && (
              <div className="bg-gray-100 rounded aspect-video flex items-center justify-center">
                <VideoPreview url={block.videoUrl} provider={block.videoProvider} />
              </div>
            )}
          </div>
        )}

        {block.type === "image" && (
          <ImageBlockEditor block={block} onChange={onChange} />
        )}

        {block.type === "separator" && (
          <div className="py-4">
            <div className="h-px bg-gray-300" />
          </div>
        )}
      </div>
    </div>
  );
}

// Image Block Editor with Upload
function ImageBlockEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (block: Block) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La imagen no puede superar los 5MB");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/lessons/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      onChange({ ...block, imageUrl: data.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload area */}
      {!block.imageUrl && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Arrastra una imagen aquí o <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP — Máx. 5MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          // Reset so the same file can be re-selected
          e.target.value = "";
        }}
      />

      {uploadError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {uploadError}
        </p>
      )}

      {/* URL fallback — collapsed when image exists */}
      {!block.imageUrl && (
        <div className="flex items-center gap-2">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400">o pega una URL</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>
      )}

      {!block.imageUrl && (
        <input
          type="text"
          value={block.imageUrl || ""}
          onChange={(e) => onChange({ ...block, imageUrl: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none"
        />
      )}

      {/* Alt text */}
      <input
        type="text"
        value={block.imageAlt || ""}
        onChange={(e) => onChange({ ...block, imageAlt: e.target.value })}
        placeholder="Texto alternativo / pie de foto (opcional)"
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none"
      />

      {/* Preview with replace option */}
      {block.imageUrl && (
        <div className="relative bg-gray-100 rounded overflow-hidden group/img">
          <img
            src={block.imageUrl}
            alt={block.imageAlt || ""}
            className="w-full max-h-96 object-contain"
          />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg text-xs font-medium shadow hover:bg-white transition-colors"
            >
              Cambiar imagen
            </button>
            <button
              onClick={() => onChange({ ...block, imageUrl: "" })}
              className="px-3 py-1.5 bg-red-500/90 text-white rounded-lg text-xs font-medium shadow hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Video Preview Component
function VideoPreview({
  url,
  provider,
}: {
  url: string;
  provider?: "youtube" | "loom";
}) {
  let embedUrl = "";

  if (provider === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtube.com")) {
      videoId = url.split("v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  } else if (provider === "loom" || url.includes("loom.com")) {
    const loomId = url.split("/").pop()?.split("?")[0] || "";
    if (loomId) {
      embedUrl = `https://www.loom.com/embed/${loomId}`;
    }
  }

  if (!embedUrl) {
    return <p className="text-sm text-gray-600">URL no válida</p>;
  }

  return (
    <iframe
      src={embedUrl}
      className="w-full h-full rounded"
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
}
