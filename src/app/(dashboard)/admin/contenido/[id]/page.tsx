"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List as ListIcon,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Video as VideoIcon,
  Minus,
  Link as LinkIcon,
  AlertTriangle,
  Eye,
  EyeOff,
  Upload,
  Type,
  Sparkles,
} from "lucide-react";

interface Lesson {
  id: string;
  step_number: number;
  phase: string;
  lesson_number: number;
  title: string;
  subtitle: string;
  blocks: unknown;
  published: boolean;
}

// ── Toolbar button ──
function TBtn({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep focus in editor
        onClick();
      }}
      title={label}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
        active ? "bg-gray-200 text-blue-600" : "text-gray-600"
      }`}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />;
}

export default function LessonEditorPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const isNew = id === "new";

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [stepNumber, setStepNumber] = useState(0);
  const [phase, setPhase] = useState("saber");
  const [lessonNumber, setLessonNumber] = useState(0);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formatting, setFormatting] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load lesson ──
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/lessons/${id}`);
        if (!res.ok) throw new Error("Error cargando lección");
        const data = await res.json();
        setLesson(data);
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setStepNumber(data.step_number);
        setPhase(data.phase);
        setLessonNumber(data.lesson_number);
        setPublished(data.published);

        // Load content into editor
        setTimeout(() => {
          if (editorRef.current) {
            const blocks = data.blocks;
            if (blocks && typeof blocks === "object" && !Array.isArray(blocks) && blocks.html) {
              // New format: { html: "..." }
              editorRef.current.innerHTML = blocks.html;
            } else if (Array.isArray(blocks) && blocks.length > 0) {
              // Legacy block format — convert to HTML
              editorRef.current.innerHTML = blocksToHtml(blocks);
            } else {
              editorRef.current.innerHTML = "<p><br></p>";
            }
          }
        }, 50);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  // ── Convert legacy blocks to HTML ──
  function blocksToHtml(blocks: Record<string, unknown>[]): string {
    return blocks
      .map((b) => {
        const type = b.type as string;
        const content = (b.content as string) || "";
        switch (type) {
          case "heading":
            return `<h2>${content}</h2>`;
          case "paragraph":
            return `<p>${content}</p>`;
          case "quote":
            return `<blockquote>${content}</blockquote>`;
          case "callout":
            return `<div class="callout" data-icon="${b.icon || "bulb"}">${content}</div>`;
          case "warning":
            return `<div class="warning">${content}</div>`;
          case "list":
            return `<ul>${((b.items as string[]) || []).map((i) => `<li>${i}</li>`).join("")}</ul>`;
          case "video": {
            const url = (b.videoUrl as string) || "";
            return `<div class="video-embed" data-url="${url}">[Video: ${url}]</div>`;
          }
          case "image": {
            const imgUrl = (b.imageUrl as string) || "";
            const alt = (b.imageAlt as string) || "";
            return `<figure><img src="${imgUrl}" alt="${alt}" /></figure>`;
          }
          case "separator":
            return "<hr />";
          default:
            return `<p>${content}</p>`;
        }
      })
      .join("\n");
  }

  // ── Get editor HTML ──
  function getEditorHtml(): string {
    return editorRef.current?.innerHTML || "";
  }

  // ── Auto-save ──
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 3000);
  }, []);

  // ── Save ──
  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const htmlContent = getEditorHtml();
      const body = {
        title,
        subtitle,
        blocks: { html: htmlContent },
        published,
        ...(isNew ? { stepNumber, phase, lessonNumber } : {}),
      };

      const url = isNew ? "/api/admin/lessons" : `/api/admin/lessons/${id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      if (isNew && data.id) {
        router.replace(`/admin/contenido/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // ── Exec command helpers ──
  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    scheduleAutoSave();
  }

  function formatBlock(tag: string) {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    scheduleAutoSave();
  }

  // ── Insert image ──
  async function handleInsertImage() {
    let url = imageUrl;

    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch("/api/admin/lessons/upload-image", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Error subiendo imagen");
        const data = await res.json();
        url = data.url;
      } catch {
        setError("Error subiendo imagen");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (url) {
      exec("insertHTML", `<figure><img src="${url}" alt="" style="max-width:100%;border-radius:8px;" /><figcaption></figcaption></figure><p><br></p>`);
    }
    setShowImageModal(false);
    setImageUrl("");
    setImageFile(null);
  }

  // ── Insert video ──
  function handleInsertVideo() {
    const url = videoUrl.trim();
    if (!url) return;

    let embedUrl = "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const vid = url.includes("v=")
        ? url.split("v=")[1]?.split("&")[0]
        : url.split("youtu.be/")[1]?.split("?")[0];
      if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
    } else if (url.includes("loom.com")) {
      const lid = url.split("/").pop()?.split("?")[0];
      if (lid) embedUrl = `https://www.loom.com/embed/${lid}`;
    }

    if (embedUrl) {
      exec(
        "insertHTML",
        `<div class="video-embed" contenteditable="false" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:16px 0;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div><p><br></p>`
      );
    } else {
      exec("insertHTML", `<p><a href="${url}" target="_blank">${url}</a></p>`);
    }
    setShowVideoModal(false);
    setVideoUrl("");
  }

  // ── Insert callout ──
  function insertCallout() {
    exec(
      "insertHTML",
      `<div class="callout" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:12px 0;">💡 Escribe aquí...</div><p><br></p>`
    );
  }

  // ── Insert warning ──
  function insertWarning() {
    exec(
      "insertHTML",
      `<div class="warning" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin:12px 0;">⚠️ Escribe aquí...</div><p><br></p>`
    );
  }

  // ── Format with AI ──
  async function handleFormatAI() {
    if (!editorRef.current) return;

    // Get plain text from editor
    const rawText = editorRef.current.innerText?.trim();
    if (!rawText) {
      setError("No hay texto para maquetar");
      return;
    }

    setFormatting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/lessons/format-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const { html } = await res.json();
      if (html && editorRef.current) {
        editorRef.current.innerHTML = html;
        scheduleAutoSave();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al maquetar");
    } finally {
      setFormatting(false);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/contenido")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} /> Contenido
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
            >
              Paso {stepNumber} · {phase} · Lección {lessonNumber}
            </button>

            <button
              onClick={() => {
                setPublished(!published);
                scheduleAutoSave();
              }}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                published
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {published ? <Eye size={14} /> : <EyeOff size={14} />}
              {published ? "Publicado" : "Borrador"}
            </button>

            {error && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {error}
              </span>
            )}
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check size={14} /> Guardado
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto grid grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Paso</label>
              <input
                type="number"
                value={stepNumber}
                onChange={(e) => setStepNumber(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Fase</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="saber">Saber</option>
                <option value="decidir">Decidir</option>
                <option value="hacer">Activar</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nº lección</label>
              <input
                type="number"
                value={lessonNumber}
                onChange={(e) => setLessonNumber(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleAutoSave();
          }}
          placeholder="Título de la lección"
          className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-2"
        />

        {/* Subtitle */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            scheduleAutoSave();
          }}
          placeholder="Subtítulo (opcional)"
          className="w-full text-lg text-gray-500 placeholder-gray-300 border-none outline-none bg-transparent mb-6"
        />

        {/* Formatting toolbar */}
        <div className="sticky top-[49px] z-20 bg-white border border-gray-200 rounded-lg px-2 py-1.5 mb-4 flex items-center gap-0.5 flex-wrap shadow-sm">
          <TBtn icon={<Type size={16} />} label="Párrafo" onClick={() => formatBlock("p")} />
          <TBtn icon={<Heading1 size={16} />} label="Título" onClick={() => formatBlock("h2")} />
          <TBtn icon={<Heading2 size={16} />} label="Subtítulo" onClick={() => formatBlock("h3")} />
          <Divider />
          <TBtn icon={<Bold size={16} />} label="Negrita" onClick={() => exec("bold")} />
          <TBtn icon={<Italic size={16} />} label="Cursiva" onClick={() => exec("italic")} />
          <TBtn icon={<UnderlineIcon size={16} />} label="Subrayado" onClick={() => exec("underline")} />
          <Divider />
          <TBtn icon={<ListIcon size={16} />} label="Lista" onClick={() => exec("insertUnorderedList")} />
          <TBtn icon={<ListOrdered size={16} />} label="Lista numerada" onClick={() => exec("insertOrderedList")} />
          <TBtn icon={<Quote size={16} />} label="Cita" onClick={() => formatBlock("blockquote")} />
          <Divider />
          <TBtn icon={<LinkIcon size={16} />} label="Enlace" onClick={() => {
            const url = prompt("URL del enlace:");
            if (url) exec("createLink", url);
          }} />
          <TBtn icon={<ImageIcon size={16} />} label="Imagen" onClick={() => setShowImageModal(true)} />
          <TBtn icon={<VideoIcon size={16} />} label="Vídeo" onClick={() => setShowVideoModal(true)} />
          <Divider />
          <TBtn icon={<Minus size={16} />} label="Separador" onClick={() => exec("insertHTML", "<hr /><p><br></p>")} />
          <TBtn
            icon={<span className="text-xs font-bold">💡</span>}
            label="Destacado"
            onClick={insertCallout}
          />
          <TBtn
            icon={<AlertTriangle size={14} />}
            label="Aviso"
            onClick={insertWarning}
          />
          <Divider />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormatAI();
            }}
            disabled={formatting}
            title="Maquetar con IA — da formato automático al texto"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {formatting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {formatting ? "Maquetando..." : "Maquetar con IA"}
          </button>
        </div>

        {/* Content editable area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleAutoSave}
          onPaste={(e) => {
            // Clean paste — strip unwanted formatting, keep basic HTML
            e.preventDefault();
            const html = e.clipboardData.getData("text/html");
            const text = e.clipboardData.getData("text/plain");
            if (html) {
              // Insert cleaned HTML
              const clean = html
                .replace(/<meta[^>]*>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/style="[^"]*"/gi, "")
                .replace(/class="[^"]*"/gi, "");
              document.execCommand("insertHTML", false, clean);
            } else {
              // Plain text — convert line breaks to paragraphs
              const paragraphs = text.split(/\n\n+/).map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
              document.execCommand("insertHTML", false, paragraphs || text);
            }
            scheduleAutoSave();
          }}
          className="min-h-[500px] bg-white border border-gray-200 rounded-lg p-6 outline-none prose prose-sm max-w-none
            [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-gray-900 [&>h2]:mt-6 [&>h2]:mb-3
            [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-gray-800 [&>h3]:mt-4 [&>h3]:mb-2
            [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-3
            [&>blockquote]:border-l-4 [&>blockquote]:border-blue-300 [&>blockquote]:bg-blue-50 [&>blockquote]:pl-4 [&>blockquote]:py-3 [&>blockquote]:pr-4 [&>blockquote]:rounded-r-lg [&>blockquote]:italic [&>blockquote]:text-blue-900 [&>blockquote]:my-4
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1 [&>ul]:text-gray-700 [&>ul]:my-3
            [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-1 [&>ol]:text-gray-700 [&>ol]:my-3
            [&>hr]:border-gray-200 [&>hr]:my-6
            [&>figure]:my-4 [&>figure>img]:rounded-lg [&>figure>img]:max-w-full
            [&_.callout]:bg-amber-50 [&_.callout]:border [&_.callout]:border-amber-200 [&_.callout]:rounded-lg [&_.callout]:p-4 [&_.callout]:my-3
            [&_.warning]:bg-red-50 [&_.warning]:border [&_.warning]:border-red-200 [&_.warning]:rounded-lg [&_.warning]:p-4 [&_.warning]:my-3
            [&_a]:text-blue-600 [&_a]:underline
            [&_.video-embed]:rounded-lg [&_.video-embed]:overflow-hidden [&_.video-embed]:my-4
          "
          data-placeholder="Empieza a escribir tu lección..."
          style={{ minHeight: 500 }}
        />

        {/* Empty state placeholder via CSS */}
        <style>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          [contenteditable] img {
            max-width: 100%;
            border-radius: 8px;
          }
          [contenteditable] figure {
            margin: 16px 0;
          }
          [contenteditable] figcaption {
            text-align: center;
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 4px;
          }
        `}</style>
      </div>

      {/* Image modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Insertar imagen</h3>

            {/* Upload */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith("image/")) setImageFile(file);
              }}
            >
              <Upload size={24} className="mx-auto mb-2 text-gray-400" />
              {imageFile ? (
                <p className="text-sm text-green-600">{imageFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Arrastra o haz clic para subir</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImageFile(file);
                }}
              />
            </div>

            <div className="text-center text-xs text-gray-400 mb-3">o pega una URL</div>

            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowImageModal(false); setImageUrl(""); setImageFile(null); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleInsertImage}
                disabled={(!imageUrl && !imageFile) || uploading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : "Insertar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Insertar vídeo</h3>
            <p className="text-sm text-gray-500 mb-3">YouTube o Loom</p>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... o https://loom.com/share/..."
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowVideoModal(false); setVideoUrl(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleInsertVideo}
                disabled={!videoUrl.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Insertar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for drag-drop images directly in editor */}
      <input type="file" className="hidden" />
    </div>
  );
}
