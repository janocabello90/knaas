"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Compass, Search, Wand2, X, Key, ExternalLink } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type KnaasMode = "acompanante" | "analista" | "generador";

const modeConfig: Record<KnaasMode, { label: string; icon: React.ReactNode; color: string; bg: string; desc: string }> = {
  acompanante: {
    label: "Acompañante",
    icon: <Compass size={16} />,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    desc: "Te guía paso a paso en el programa",
  },
  analista: {
    label: "Analista",
    icon: <Search size={16} />,
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    desc: "Analiza tus decisiones con rigor estratégico",
  },
  generador: {
    label: "Generador",
    icon: <Wand2 size={16} />,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    desc: "Genera borradores de outputs personalizados",
  },
};

function ApiKeyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <Key size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configurar API Key</h2>
            <p className="text-sm text-gray-500">Necesaria para activar KNAAS</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="mb-2 font-semibold text-blue-900">¿Qué es esto?</p>
            <p className="text-blue-800">
              KNAAS funciona con Claude, la IA de Anthropic. Para usarlo necesitas una API key — es como una contraseña que conecta tu cuenta con el servicio de IA.
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <p className="mb-2 font-semibold text-amber-900">¿Cuánto cuesta?</p>
            <p className="text-amber-800">
              Pagas solo por lo que uses. Una conversación típica cuesta entre 0,01€ y 0,05€.
              El uso medio de un alumno en todo el programa ACTIVA ronda los 5-15€ en total.
              Anthropic te da 5$ gratis de crédito al crear tu cuenta.
            </p>
          </div>

          <div className="rounded-xl bg-green-50 p-4">
            <p className="mb-3 font-semibold text-green-900">¿Cómo se configura? (2 minutos)</p>
            <ol className="list-inside list-decimal space-y-2 text-green-800">
              <li>
                Ve a{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-green-700 underline"
                >
                  console.anthropic.com
                  <ExternalLink size={12} />
                </a>{" "}
                y crea una cuenta (o inicia sesión)
              </li>
              <li>Haz clic en <strong>"Create Key"</strong></li>
              <li>Copia la clave que empieza por <code className="rounded bg-green-100 px-1.5 py-0.5 text-xs">sk-ant-...</code></li>
              <li>Pide a tu mentor o admin de FisioReferentes que la guarde en <strong>Ajustes</strong></li>
            </ol>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">
              Tu API key se almacena de forma segura y solo se usa para las conversaciones de KNAAS.
              Ningún dato de tu clínica sale del sistema. Puedes cambiarla o eliminarla en cualquier momento.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export default function KnaasPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy el KNAAS, tu asistente del programa ACTIVA de FisioReferentes. Conozco tu clínica, tus números y el trabajo que has hecho hasta aquí.\n\n¿En qué puedo ayudarte hoy? Puedo acompañarte en tu paso actual, analizar una decisión o generar un borrador de cualquier output del programa.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<KnaasMode>("acompanante");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const res = await fetch("/api/knaas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          mode,
          history: messages.map((m: Message) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok && data.error) {
        // Check if error is about missing API key
        if (data.error.toLowerCase().includes("api key") || data.error.toLowerCase().includes("anthropic")) {
          setShowApiKeyModal(true);
          // Remove the user message since it didn't get processed
          setMessages((prev) => prev.slice(0, -1));
          setInput(userMessage.content);
          setIsLoading(false);
          return;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response ?? data.error ?? "Ha ocurrido un error inesperado.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setShowApiKeyModal(true);
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-4xl flex-col">
      {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KNAAS</h1>
          <p className="text-sm text-gray-500">
            Knowledge Navigator & Adaptive Assistance System
          </p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="mb-4 flex gap-2">
        {(Object.entries(modeConfig) as [KnaasMode, typeof modeConfig.acompanante][]).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                mode === key
                  ? `${config.bg} ${config.color} ring-2 ring-offset-1`
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              {config.icon}
              {config.label}
            </button>
          )
        )}
      </div>
      <p className="mb-4 text-xs text-gray-400">{modeConfig[mode].desc}</p>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
        <div className="space-y-4">
          {messages.map((msg: Message, i: number) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
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
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              mode === "acompanante"
                ? "Pregúntame sobre tu paso actual..."
                : mode === "analista"
                ? "Describe la decisión que quieres analizar..."
                : "¿Qué output quieres que genere?"
            }
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-gray-400">
          KNAAS usa la API de Anthropic con tu clave personal. Tus datos nunca salen del sistema.
        </p>
      </div>
    </div>
  );
}
