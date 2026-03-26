"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type ConsentMap = Record<string, { granted: boolean; version: string; grantedAt: string | null }>;

const REQUIRED_CONSENTS = ["terms", "privacy"];

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consents, setConsents] = useState<ConsentMap>({});
  const [saving, setSaving] = useState(false);
  const [localChecks, setLocalChecks] = useState({
    terms: false,
    privacy: false,
    ai_processing: false,
  });

  const fetchConsents = useCallback(async () => {
    try {
      const res = await fetch("/api/alumno/consents");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setConsents(data.consents);

      // Check if required consents are granted with current version
      const missing = REQUIRED_CONSENTS.some(
        (p) => !data.consents[p]?.granted || data.consents[p]?.version !== data.requiredVersion
      );
      setNeedsConsent(missing);
    } catch {
      // If API fails, allow through (don't block the app)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConsents(); }, [fetchConsents]);

  const handleAccept = async () => {
    if (!localChecks.terms || !localChecks.privacy) return;
    setSaving(true);
    try {
      await fetch("/api/alumno/consents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consents: {
            terms: true,
            privacy: true,
            ai_processing: localChecks.ai_processing,
          },
        }),
      });
      setNeedsConsent(false);
    } catch {
      alert("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (!needsConsent) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Antes de continuar</h2>
        <p className="mt-2 text-sm text-gray-600">
          Para utilizar la plataforma necesitamos que revises y aceptes nuestras condiciones
          de uso y política de privacidad.
        </p>

        <div className="mt-6 space-y-4">
          {/* Terms — Required */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localChecks.terms}
              onChange={(e) => setLocalChecks((p) => ({ ...p, terms: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              He leído y acepto los{" "}
              <Link href="/legal/terminos" target="_blank" className="font-medium text-blue-600 underline">
                Términos y Condiciones
              </Link>{" "}
              y el{" "}
              <Link href="/legal/aviso-legal" target="_blank" className="font-medium text-blue-600 underline">
                Aviso Legal
              </Link>.
              <span className="text-red-500"> *</span>
            </span>
          </label>

          {/* Privacy — Required */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localChecks.privacy}
              onChange={(e) => setLocalChecks((p) => ({ ...p, privacy: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              He leído y acepto la{" "}
              <Link href="/legal/privacidad" target="_blank" className="font-medium text-blue-600 underline">
                Política de Privacidad
              </Link>.
              <span className="text-red-500"> *</span>
            </span>
          </label>

          {/* AI Processing — Optional */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localChecks.ai_processing}
              onChange={(e) => setLocalChecks((p) => ({ ...p, ai_processing: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Consiento el procesamiento de mis datos por el asistente de IA (Anthropic Claude)
              para recibir orientación educativa personalizada.{" "}
              <Link href="/legal/privacidad#4-procesamiento-por-inteligencia-artificial" target="_blank" className="text-blue-600 underline">
                Más información
              </Link>.
              <span className="text-gray-400"> (opcional)</span>
            </span>
          </label>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          <span className="text-red-500">*</span> Campos obligatorios. Puedes modificar tus
          preferencias en cualquier momento desde tu Área Privada.
        </p>

        <button
          onClick={handleAccept}
          disabled={!localChecks.terms || !localChecks.privacy || saving}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Aceptar y continuar"}
        </button>
      </div>
    </div>
  );
}
