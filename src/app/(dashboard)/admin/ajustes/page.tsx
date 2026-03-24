"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff, Loader } from "lucide-react";

type ApiKeyState = {
  exists: boolean;
  masked: string | null;
};

export default function AjustesPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeyState, setApiKeyState] = useState<ApiKeyState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null>(null);

  // Load API key status on mount
  useEffect(() => {
    const loadApiKeyStatus = async (): Promise<void> => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/ajustes");
        if (!response.ok) {
          throw new Error("Error al cargar la configuración");
        }
        const data = await response.json();
        setApiKeyState(data);
        setProfileData(data.profile);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadApiKeyStatus();
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (!apiKey.trim()) {
        setError("La API key no puede estar vacía");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/admin/ajustes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar la API key");
      }

      setSuccess("API key guardada correctamente");
      setApiKey("");
      // Reload API key state
      const statusResponse = await fetch("/api/admin/ajustes");
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setApiKeyState(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura tu cuenta y las integraciones de KNAAS
        </p>
      </div>

      <div className="space-y-6">
        {/* API Key Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Key de Anthropic</h2>
          <p className="mb-4 text-sm text-gray-600">
            Tu API key de Anthropic se usa para alimentar KNAAS. Se almacena de forma segura.
          </p>

          {apiKeyState?.exists && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                API key configurada: <span className="font-mono">{apiKeyState.masked}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle size={20} className="mt-0.5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSaveApiKey} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-900">
                {apiKeyState?.exists ? "Actualizar API key" : "Agregar API key"}
              </label>
              <div className="relative mt-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  id="apiKey"
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Obtén tu API key en{" "}
                <a
                  href="https://console.anthropic.com/account/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader size={16} className="animate-spin" />}
              {saving ? "Guardando..." : "Guardar API key"}
            </button>
          </form>
        </div>

        {/* Profile Section */}
        {profileData && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Perfil</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900">Nombre</label>
                <p className="mt-1 text-sm text-gray-600">
                  {profileData.firstName} {profileData.lastName}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-900">Email</label>
                <p className="mt-1 text-sm text-gray-600">{profileData.email}</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-900">Rol</label>
                <p className="mt-1">
                  <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                    {profileData.role}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
