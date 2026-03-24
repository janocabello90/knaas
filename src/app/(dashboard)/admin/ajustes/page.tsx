"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader,
  Save,
  User,
  MapPin,
  Briefcase,
  Camera,
  Linkedin,
  Instagram,
  Phone,
} from "lucide-react";

type ApiKeyState = {
  exists: boolean;
  masked: string | null;
};

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  photo: string | null;
  bio: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  specialty: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
};

export default function AjustesPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeyState, setApiKeyState] = useState<ApiKeyState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [profileSuccess, setProfileSuccess] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/admin/ajustes")
      .then((r) => r.json())
      .then((data) => {
        setApiKeyState(data);
        setProfile(data.profile ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveApiKey = async (e: React.FormEvent<HTMLFormElement>) => {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar");
      }

      setSuccess("API key guardada correctamente");
      setApiKey("");
      const statusResponse = await fetch("/api/admin/ajustes");
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setApiKeyState(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setProfileSuccess("");

    try {
      const response = await fetch("/api/admin/ajustes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          photo: profile.photo,
          bio: profile.bio,
          phone: profile.phone,
          city: profile.city,
          province: profile.province,
          country: profile.country,
          specialty: profile.specialty,
          yearsExperience: profile.yearsExperience,
          linkedinUrl: profile.linkedinUrl,
          instagramUrl: profile.instagramUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar perfil");
      }

      setProfileSuccess("Perfil actualizado correctamente");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSavingProfile(false);
    }
  };

  const updateProfile = (field: keyof ProfileData, value: string | number | null) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura tu cuenta, perfil y las integraciones de KNAAS
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        {profile && (
          <form onSubmit={handleSaveProfile} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Mi perfil</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  {profile.role}
                </span>
                <span className="text-xs text-gray-400">{profile.email}</span>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">{profileSuccess}</p>
              </div>
            )}

            {/* Photo */}
            <div className="mb-5">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                <Camera size={12} className="mr-1 inline" />
                URL de foto de perfil
              </label>
              <input
                type="url"
                value={profile.photo ?? ""}
                onChange={(e) => updateProfile("photo", e.target.value || null)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Name */}
            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  <User size={12} className="mr-1 inline" />
                  Nombre
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => updateProfile("firstName", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Apellidos</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => updateProfile("lastName", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                <Phone size={12} className="mr-1 inline" />
                Teléfono
              </label>
              <input
                type="tel"
                value={profile.phone ?? ""}
                onChange={(e) => updateProfile("phone", e.target.value || null)}
                placeholder="+34 600 000 000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Bio */}
            <div className="mb-5">
              <label className="mb-1 block text-xs font-medium text-gray-600">Bio</label>
              <textarea
                value={profile.bio ?? ""}
                onChange={(e) => updateProfile("bio", e.target.value || null)}
                placeholder="Cuéntanos un poco sobre ti..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Location */}
            <div className="mb-5 grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  <MapPin size={12} className="mr-1 inline" />
                  Ciudad
                </label>
                <input
                  type="text"
                  value={profile.city ?? ""}
                  onChange={(e) => updateProfile("city", e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Provincia</label>
                <input
                  type="text"
                  value={profile.province ?? ""}
                  onChange={(e) => updateProfile("province", e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">País</label>
                <input
                  type="text"
                  value={profile.country ?? ""}
                  onChange={(e) => updateProfile("country", e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Professional */}
            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  <Briefcase size={12} className="mr-1 inline" />
                  Especialidad
                </label>
                <input
                  type="text"
                  value={profile.specialty ?? ""}
                  onChange={(e) => updateProfile("specialty", e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Años de experiencia</label>
                <input
                  type="number"
                  min={0}
                  value={profile.yearsExperience ?? ""}
                  onChange={(e) => updateProfile("yearsExperience", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Social */}
            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  <Linkedin size={12} className="mr-1 inline" />
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={profile.linkedinUrl ?? ""}
                  onChange={(e) => updateProfile("linkedinUrl", e.target.value || null)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  <Instagram size={12} className="mr-1 inline" />
                  Instagram
                </label>
                <input
                  type="text"
                  value={profile.instagramUrl ?? ""}
                  onChange={(e) => updateProfile("instagramUrl", e.target.value || null)}
                  placeholder="@usuario o URL"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingProfile ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              {savingProfile ? "Guardando..." : "Guardar perfil"}
            </button>
          </form>
        )}

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
                  onChange={(e) => setApiKey(e.target.value)}
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
      </div>
    </div>
  );
}
