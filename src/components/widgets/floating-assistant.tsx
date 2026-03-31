"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Send,
  Bot,
  User,
  Compass,
  Search,
  Wand2,
  X,
  Key,
  ExternalLink,
  Sparkles,
  Minus,
  Maximize2,
} from "lucide-react";
import Link from "next/link";

/* ───── Types ───── */
type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type KnaasMode = "acompanante" | "analista" | "generador";

/* ───── Mode config ───── */
const modeConfig: Record<
  KnaasMode,
  { label: string; icon: React.ReactNode; color: string; bg: string; activeBg: string; desc: string }
> = {
  acompanante: {
    label: "Acompañante",
    icon: <Compass size={14} />,
    color: "text-emerald-700",
    bg: "border-emerald-200 hover:bg-emerald-50",
    activeBg: "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200",
    desc: "Te guía paso a paso",
  },
  analista: {
    label: "Analista",
    icon: <Search size={14} />,
    color: "text-purple-700",
    bg: "border-purple-200 hover:bg-purple-50",
    activeBg: "bg-purple-50 border-purple-300 ring-1 ring-purple-200",
    desc: "Analiza tus decisiones",
  },
  generador: {
    label: "Generador",
    icon: <Wand2 size={14} />,
    color: "text-amber-700",
    bg: "border-amber-200 hover:bg-amber-50",
    activeBg: "bg-amber-50 border-amber-300 ring-1 ring-amber-200",
    desc: "Genera borradores",
  },
};

/* ───── Detect current step from URL ───── */
function useCurrentStep(): number | null {
  const pathname = usePathname();
  // Matches /alumno/programa/paso/3 → 3
  const match = pathname.match(/\/alumno\/programa\/paso\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/* ───── Small API-key modal (adapted for floating panel) ───── */
function ApiKeyMiniModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/40 p-4">
      <div className="relative w-full rounded-xl bg-white p-5 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <X size={16} />
        </button>
        <div className="mb-3 flex items-center gap-2">
          <Key size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">Configurar API Key</h3>
        </div>
        <p className="mb-3 text-xs text-gray-600">
          Academia IA necesita una API key de Anthropic para funcionar.
        </p>
        <div className="mb-3 rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <ol className="list-inside list-decimal space-y-1">
            <li>
              Ve a{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium underline"
              >
                console.anthropic.com <ExternalLink size={10} />
              </a>
            </li>
            <li>Crea una key y cópiala</li>
            <li>Pide a tu admin que la guarde en Ajustes</li>
          </ol>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente IA. Conozco tu clínica y tu progreso en el programa.\n\n¿En qué puedo ayudarte?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<KnaasMode>("acompanante");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentStep = useCurrentStep();

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasUnread(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = {
        message: userMessage.content,
        mode,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      };
      // If we detected a step from the URL, pass it so the API can contextualize
      if (currentStep !== null) {
        body.stepOverride = currentStep;
      }

      const res = await fetch("/api/academia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok && data.error) {
        if (
          data.error.toLowerCase().includes("api key") ||
          data.error.toLowerCase().includes("anthropic")
        ) {
          setShowApiKeyModal(true);
          setMessages((prev) => prev.slice(0, -1));
          setInput(userMessage.content);
          setIsLoading(false);
          return;
        }
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response ?? data.error ?? "Ha ocurrido un error inesperado.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If panel is closed, mark unread
      if (!isOpen) setHasUnread(true);
    } catch {
      setShowApiKeyModal(true);
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating bubble ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95"
          aria-label="Abrir asistente IA"
        >
          <Sparkles size={24} />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
            </span>
          )}
        </button>
      )}

      {/* ── Chat panel ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[540px] w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* API key modal overlay */}
          {showApiKeyModal && (
            <ApiKeyMiniModal onClose={() => setShowApiKeyModal(false)} />
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-white" />
              <div>
                <h3 className="text-sm font-semibold text-white">Academia IA</h3>
                {currentStep !== null && (
                  <p className="text-[10px] text-blue-200">Paso {currentStep}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/alumno/academia"
                className="rounded-lg p-1.5 text-blue-200 hover:bg-blue-500 hover:text-white"
                title="Abrir en pantalla completa"
              >
                <Maximize2 size={14} />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-blue-200 hover:bg-blue-500 hover:text-white"
                title="Minimizar"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-blue-200 hover:bg-blue-500 hover:text-white"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1.5 border-b border-gray-100 px-3 py-2">
            {(Object.entries(modeConfig) as [KnaasMode, (typeof modeConfig)[KnaasMode]][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                    mode === key
                      ? `${config.activeBg} ${config.color}`
                      : `border-gray-200 bg-white text-gray-500 ${config.bg}`
                  )}
                >
                  {config.icon}
                  {config.label}
                </button>
              )
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      msg.role === "assistant"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <Bot size={12} />
                    ) : (
                      <User size={12} />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                      msg.role === "assistant"
                        ? "bg-gray-50 text-gray-800"
                        : "bg-blue-600 text-white"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Bot size={12} />
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0.15s]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 px-3 py-2">
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                placeholder={
                  mode === "acompanante"
                    ? "Pregunta sobre tu paso actual..."
                    : mode === "analista"
                    ? "Describe la decisión a analizar..."
                    : "¿Qué output necesitas?"
                }
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
