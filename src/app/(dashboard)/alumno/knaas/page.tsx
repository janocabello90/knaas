"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Compass, Search, Wand2 } from "lucide-react";

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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response ?? "Lo siento, ha habido un error. Inténtalo de nuevo.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error de conexión. Verifica tu API key de Anthropic en Ajustes.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-4xl flex-col">
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
