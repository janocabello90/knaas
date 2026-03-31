"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
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
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
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
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [addMenuAt, setAddMenuAt] = useState<number | null>(null);
  const [blockMenuAt, setBlockMenuAt] = useState<string | null>(null);

  const debouncedLesson = useDebounce(lesson, 2000);

  // Auto-save
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
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}`);
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al cargar lección");
      }
      const data = await res.json();
      setLesson(data);
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
      setError(null);
      const isNew = lessonId === "new";

      const url = isNew ? "/api/admin/lessons" : `/api/admin/lessons/${lessonId}`;
      const body = isNew
        ? {
            stepNumber: lesson.step_number,
            phase: lesson.phase,
            lessonNumber: lesson.lesson_number,
            title: lesson.title,
            subtitle: lesson.subtitle,
            blocks: lesson.blocks,
            published: lesson.published,
          }
        : {
            title: lesson.title,
            subtitle: lesson.subtitle,
            blocks: lesson.blocks,
            published: lesson.published,
          };

      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setSaveStatus("saved");
      if (isNew && data.id) {
        router.push(`/admin/contenido/${data.id}`);
      } else {
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  function addBlock(type: BlockType, index: number) {
    if (!lesson) return;
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
    setAddMenuAt(null);
  }

  function updateBlock(index: number, updated: Block) {
    if (!lesson) return;
    const newBlocks = [...lesson.blocks];
    newBlocks[index] = updated;
    setLesson({ ...lesson, blocks: newBlocks });
  }

  function deleteBlock(index: number) {
    if (!lesson) return;
    setLesson({ ...lesson, blocks: lesson.blocks.filter((_, i) => i !== index) });
    setBlockMenuAt(null);
  }

  function moveBlock(index: number, dir: -1 | 1) {
    if (!lesson) return;
    const target = index + dir;
    if (target < 0 || target >= lesson.blocks.length) return;
    const newBlocks = [...lesson.blocks];
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setLesson({ ...lesson, blocks: newBlocks });
  }

  function changeBlockType(index: number, newType: BlockType) {
    if (!lesson) return;
    const block = lesson.blocks[index];
    const updated: Block = { ...block, type: newType };
    if (newType === "list" && !updated.items) updated.items = [updated.content || ""];
    if (newType === "callout" && !updated.icon) updated.icon = "bulb";
    if (newType === "video") { updated.videoUrl = updated.videoUrl || ""; }
    if (newType === "image") { updated.imageUrl = updated.imageUrl || ""; updated.imageAlt = updated.imageAlt || ""; }
    updateBlock(index, updated);
    setBlockMenuAt(null);
  }

  function parseTextToBlocks(text: string): Block[] {
    const lines = text.split("\n");
    const blocks: Block[] = [];
    let currentListItems: string[] = [];

    function flushList() {
      if (currentListItems.length > 0) {
        blocks.push({ id: crypto.randomUUID(), type: "list", items: [...currentListItems] });
        currentListItems = [];
      }
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { flushList(); continue; }

      if (trimmed.startsWith("# ")) {
        flushList();
        blocks.push({ id: crypto.randomUUID(), type: "heading", content: trimmed.replace(/^#+\s*/, "") });
        continue;
      }
      if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(trimmed) && !/^\d/.test(trimmed) && trimmed.length < 120) {
        flushList();
        blocks.push({ id: crypto.randomUUID(), type: "heading", content: trimmed });
        continue;
      }
      if (trimmed.startsWith(">") || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        flushList();
        blocks.push({ id: crypto.randomUUID(), type: "quote", content: trimmed.replace(/^>\s*/, "").replace(/^"|"$/g, "") });
        continue;
      }
      if (/^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
        currentListItems.push(trimmed.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, ""));
        continue;
      }
      if (/^[-=_]{3,}$/.test(trimmed)) {
        flushList();
        blocks.push({ id: crypto.randomUUID(), type: "separator" });
        continue;
      }
      if ((trimmed.includes("youtube.com") || trimmed.includes("youtu.be") || trimmed.includes("loom.com")) && trimmed.startsWith("http")) {
        flushList();
        let provider: "youtube" | "loom" | undefined;
        if (trimmed.includes("youtube") || trimmed.includes("youtu.be")) provider = "youtube";
        else if (trimmed.includes("loom")) provider = "loom";
        blocks.push({ id: crypto.randomUUID(), type: "video", videoUrl: trimmed, videoProvider: provider });
        continue;
      }
      flushList();
      blocks.push({ id: crypto.randomUUID(), type: "paragraph", content: trimmed });
    }
    flushList();
    return blocks;
  }

  function handlePasteContent() {
    if (!lesson || !pasteText.trim()) return;
    setLesson({ ...lesson, blocks: [...lesson.blocks, ...parseTextToBlocks(pasteText)] });
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
      <div className="flex gap-3 rounded-lg bg-red-50 p-4 text-red-700">
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
    <div className="max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-20 py-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          {/* Metadata compact */}
          <span className="text-xs text-gray-400">
            Paso {lesson.step_number} · {lesson.phase} · Lección {lesson.lesson_number}
          </span>
          <button
            onClick={() => setLesson({ ...lesson, published: !lesson.published })}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              lesson.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {lesson.published ? "Publicada" : "Borrador"}
          </button>
          {saveStatus === "saving" && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {saveStatus === "saved" && <Check className="w-4 h-4 text-green-500" />}
          {saveStatus === "error" && (
            <span className="text-xs text-red-500 max-w-48 truncate">{error || "Error"}</span>
          )}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar
          </button>
        </div>
      </div>

      {/* Settings row (collapsed, expandable) */}
      <details className="mb-6 text-sm">
        <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Ajustes de la lección</summary>
        <div className="grid grid-cols-4 gap-4 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Paso</label>
            <input type="number" value={lesson.step_number} onChange={(e) => setLesson({ ...lesson, step_number: parseInt(e.target.value, 10) || 0 })} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fase</label>
            <select value={lesson.phase} onChange={(e) => setLesson({ ...lesson, phase: e.target.value })} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm">
              {PHASES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nº Lección</label>
            <input type="number" value={lesson.lesson_number} onChange={(e) => setLesson({ ...lesson, lesson_number: parseInt(e.target.value, 10) || 0 })} className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <button onClick={() => setLesson({ ...lesson, published: !lesson.published })} className={`w-full px-2.5 py-1.5 rounded text-sm font-medium ${lesson.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {lesson.published ? "Publicada" : "Borrador"}
            </button>
          </div>
        </div>
      </details>

      {/* Document title */}
      <input
        type="text"
        value={lesson.title}
        onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
        placeholder="Título de la lección"
        className="w-full text-4xl font-bold outline-none placeholder-gray-200 text-gray-900 mb-2"
      />
      <input
        type="text"
        value={lesson.subtitle}
        onChange={(e) => setLesson({ ...lesson, subtitle: e.target.value })}
        placeholder="Subtítulo (opcional)"
        className="w-full text-xl outline-none placeholder-gray-200 text-gray-500 mb-8"
      />

      {/* Document body */}
      <div className="relative">
        {lesson.blocks.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-400 mb-4">Empieza a escribir o pega contenido</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ClipboardPaste className="w-4 h-4" />
                Pegar contenido
              </button>
              <button
                onClick={() => addBlock("paragraph", 0)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Bloque vacío
              </button>
            </div>
          </div>
        )}

        {lesson.blocks.map((block, index) => (
          <div
            key={block.id}
            className="group/block relative"
            onMouseEnter={() => setHoveredBlock(block.id)}
            onMouseLeave={() => { setHoveredBlock(null); }}
          >
            {/* Hover handle - left side */}
            <div className={`absolute -left-10 top-0 flex flex-col items-center gap-0.5 transition-opacity ${hoveredBlock === block.id ? "opacity-100" : "opacity-0"}`}>
              <button
                onClick={() => setBlockMenuAt(blockMenuAt === block.id ? null : block.id)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="Opciones"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Block menu popup */}
            {blockMenuAt === block.id && (
              <div className="absolute -left-10 top-7 z-30 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-44">
                <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" /> Mover arriba
                </button>
                <button onClick={() => moveBlock(index, 1)} disabled={index === lesson.blocks.length - 1} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" /> Mover abajo
                </button>
                <div className="border-t border-gray-100 my-1" />
                <div className="px-3 py-1 text-xs text-gray-400">Cambiar tipo</div>
                {BLOCK_TYPES.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => changeBlockType(index, type)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 ${block.type === type ? "text-blue-600 font-medium" : "text-gray-700"}`}
                  >
                    {icon} {label}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => deleteBlock(index)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            )}

            {/* Block content - clean, inline */}
            <NotionBlock block={block} onChange={(b) => updateBlock(index, b)} />

            {/* Add between blocks */}
            <div className={`relative h-1 group/add ${hoveredBlock === block.id ? "" : ""}`}>
              <div className="absolute inset-x-0 -top-1 -bottom-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setAddMenuAt(addMenuAt === index + 1 ? null : index + 1)}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              {addMenuAt === index + 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-3 z-30 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1 flex-wrap w-80">
                  {BLOCK_TYPES.map(({ type, label, icon }) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type, index + 1)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-700 rounded hover:bg-gray-50"
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Bottom actions */}
        {lesson.blocks.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => addBlock("paragraph", lesson.blocks.length)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Añadir bloque
            </button>
            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" />
              Pegar contenido
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(blockMenuAt || addMenuAt !== null) && (
        <div className="fixed inset-0 z-20" onClick={() => { setBlockMenuAt(null); setAddMenuAt(null); }} />
      )}

      {/* Paste modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pegar contenido</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pega el texto de la lección. Se formateará automáticamente.
                </p>
              </div>
              <button onClick={() => { setShowPasteModal(false); setPasteText(""); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-auto">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Pega aquí todo el contenido de la lección...\n\nTÍTULOS EN MAYÚSCULAS → encabezados\nLíneas con - o • → listas\nLíneas con > → citas\nURLs de YouTube/Loom → vídeos\nEl resto → párrafos"}
                className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 font-mono"
                autoFocus
              />
              {pasteText.trim() && (
                <p className="text-xs text-gray-500 mt-2">Se generarán ~{parseTextToBlocks(pasteText).length} bloques</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => { setShowPasteModal(false); setPasteText(""); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={handlePasteContent} disabled={!pasteText.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                Convertir en bloques
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================
   Notion-style block renderer – clean, inline, no borders
   ========================================================== */
function NotionBlock({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <textarea
          value={block.content || ""}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          placeholder="Título"
          className="w-full text-2xl font-bold outline-none resize-none placeholder-gray-200 text-gray-900 py-2"
          rows={1}
          onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
        />
      );

    case "paragraph":
      return (
        <textarea
          value={block.content || ""}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          placeholder="Escribe aquí..."
          className="w-full text-base leading-relaxed outline-none resize-none placeholder-gray-200 text-gray-700 py-1"
          rows={1}
          onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
        />
      );

    case "quote":
      return (
        <div className="flex gap-3 py-2">
          <div className="w-1 bg-blue-400 rounded-full flex-shrink-0" />
          <textarea
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Cita..."
            className="w-full text-base italic outline-none resize-none placeholder-gray-200 text-gray-600"
            rows={1}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
          />
        </div>
      );

    case "callout":
      return (
        <div className="flex gap-3 py-3 px-4 bg-blue-50 rounded-lg border border-blue-100">
          <select
            value={block.icon || "bulb"}
            onChange={(e) => onChange({ ...block, icon: e.target.value as Block["icon"] })}
            className="text-lg bg-transparent border-none outline-none cursor-pointer self-start"
          >
            <option value="pin">📌</option>
            <option value="bulb">💡</option>
            <option value="warning">⚠️</option>
            <option value="flag">🏁</option>
          </select>
          <textarea
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Nota destacada..."
            className="w-full text-base outline-none resize-none placeholder-gray-300 text-gray-700 bg-transparent"
            rows={1}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
          />
        </div>
      );

    case "warning":
      return (
        <div className="flex gap-3 py-3 px-4 bg-orange-50 rounded-lg border border-orange-100">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <textarea
            value={block.content || ""}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            placeholder="Aviso importante..."
            className="w-full text-base outline-none resize-none placeholder-orange-300 text-gray-700 bg-transparent"
            rows={1}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
          />
        </div>
      );

    case "list":
      return (
        <div className="py-1 space-y-1">
          {(block.items || []).map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 group/item">
              <span className="text-gray-400 mt-1 select-none">•</span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...(block.items || [])];
                  newItems[idx] = e.target.value;
                  onChange({ ...block, items: newItems });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const newItems = [...(block.items || [])];
                    newItems.splice(idx + 1, 0, "");
                    onChange({ ...block, items: newItems });
                  }
                  if (e.key === "Backspace" && !item && (block.items || []).length > 1) {
                    e.preventDefault();
                    const newItems = (block.items || []).filter((_, i) => i !== idx);
                    onChange({ ...block, items: newItems });
                  }
                }}
                placeholder="Elemento de lista"
                className="flex-1 text-base outline-none placeholder-gray-200 text-gray-700"
              />
              <button
                onClick={() => onChange({ ...block, items: (block.items || []).filter((_, i) => i !== idx) })}
                className="p-0.5 opacity-0 group-hover/item:opacity-100 hover:bg-red-50 rounded transition-opacity"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...block, items: [...(block.items || []), ""] })}
            className="text-sm text-gray-400 hover:text-gray-600 pl-5"
          >
            + nuevo elemento
          </button>
        </div>
      );

    case "video":
      return (
        <div className="py-2">
          <input
            type="text"
            value={block.videoUrl || ""}
            onChange={(e) => {
              const url = e.target.value;
              let provider: "youtube" | "loom" | undefined;
              if (url.includes("youtube.com") || url.includes("youtu.be")) provider = "youtube";
              else if (url.includes("loom.com")) provider = "loom";
              onChange({ ...block, videoUrl: url, videoProvider: provider });
            }}
            placeholder="Pega URL de YouTube o Loom..."
            className="w-full text-sm outline-none placeholder-gray-300 text-gray-600 mb-2 px-3 py-2 bg-gray-50 rounded-lg"
          />
          {block.videoUrl && <VideoPreview url={block.videoUrl} provider={block.videoProvider} />}
        </div>
      );

    case "image":
      return <ImageBlockEditor block={block} onChange={onChange} />;

    case "separator":
      return <div className="py-4"><div className="h-px bg-gray-200" /></div>;

    default:
      return null;
  }
}

/* ==================== Image Upload Block ==================== */
function ImageBlockEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file.type.startsWith("image/")) { setUploadError("Solo imágenes"); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Máx 5MB"); return; }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/lessons/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      onChange({ ...block, imageUrl: data.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="py-2">
      {!block.imageUrl && (
        <div
          className="border border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
        >
          {uploading
            ? <Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
            : <div className="text-gray-400"><Upload className="w-6 h-6 mx-auto mb-2" /><p className="text-sm">Arrastra imagen o <span className="text-blue-500">haz clic</span></p></div>
          }
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
      {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
      <input
        type="text"
        value={block.imageAlt || ""}
        onChange={(e) => onChange({ ...block, imageAlt: e.target.value })}
        placeholder="Pie de foto (opcional)"
        className="w-full text-sm outline-none placeholder-gray-200 text-gray-500 mt-2"
      />
      {block.imageUrl && (
        <div className="relative mt-2 group/img rounded-lg overflow-hidden">
          <img src={block.imageUrl} alt={block.imageAlt || ""} className="w-full rounded-lg" />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
            <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 bg-white/90 text-gray-700 rounded text-xs shadow hover:bg-white">Cambiar</button>
            <button onClick={() => onChange({ ...block, imageUrl: "" })} className="px-2 py-1 bg-red-500/90 text-white rounded text-xs shadow hover:bg-red-600">Quitar</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== Video Preview ==================== */
function VideoPreview({ url, provider }: { url: string; provider?: "youtube" | "loom" }) {
  let embedUrl = "";
  if (provider === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    let vid = "";
    if (url.includes("youtube.com")) vid = url.split("v=")[1]?.split("&")[0] || "";
    else if (url.includes("youtu.be")) vid = url.split("youtu.be/")[1]?.split("?")[0] || "";
    if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
  } else if (provider === "loom" || url.includes("loom.com")) {
    const lid = url.split("/").pop()?.split("?")[0] || "";
    if (lid) embedUrl = `https://www.loom.com/embed/${lid}`;
  }
  if (!embedUrl) return <p className="text-sm text-gray-400 py-2">URL no válida</p>;
  return <div className="aspect-video rounded-lg overflow-hidden bg-gray-100"><iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" /></div>;
}
