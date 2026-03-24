"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ArrowRight, ArrowLeft, User, MapPin, Briefcase, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    photo: "",
    city: "",
    province: "",
    country: "España",
    linkedinUrl: "",
    instagramUrl: "",
    yearsExperience: "",
    specialty: "",
    motivation: "",
    bio: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        updateField("photo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/alumno/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
          birthDate: form.birthDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar el perfil");
        setLoading(false);
        return;
      }

      router.push("/alumno/programa");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const canAdvance = () => {
    if (step === 1) return form.firstName.trim() && form.lastName.trim() && form.phone.trim();
    if (step === 2) return form.city.trim();
    return true;
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido a ACTIVA</h1>
        <p className="mt-2 text-gray-500">
          Antes de empezar, necesitamos conocerte un poco mejor. Esto nos ayuda a personalizar tu experiencia en el programa.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all",
                step === s
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : step > s
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 3 && (
              <div className={cn("h-1 w-12 rounded-full", step > s ? "bg-green-500" : "bg-gray-200")} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Step 1: Datos personales */}
        {step === 1 && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Datos personales</h2>
                <p className="text-sm text-gray-500">Tu información básica</p>
              </div>
            </div>

            {/* Photo upload */}
            <div className="mb-6 flex justify-center">
              <label className="group relative cursor-pointer">
                <div className={cn(
                  "flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-dashed transition-all",
                  photoPreview ? "border-blue-300" : "border-gray-300 group-hover:border-blue-400"
                )}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera size={28} className="mx-auto text-gray-400 group-hover:text-blue-500" />
                      <span className="mt-1 block text-xs text-gray-400">Añadir foto</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  placeholder="Tu nombre"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Apellidos *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder="Tus apellidos"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+34 600 000 000"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Ubicación y redes */}
        {step === 2 && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Ubicación y redes</h2>
                <p className="text-sm text-gray-500">¿Dónde está tu clínica?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Ciudad *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Madrid"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Provincia</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  placeholder="Madrid"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">País</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">LinkedIn</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => updateField("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Instagram</label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={(e) => updateField("instagramUrl", e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Perfil profesional */}
        {step === 3 && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <Briefcase size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Perfil profesional</h2>
                <p className="text-sm text-gray-500">Cuéntanos sobre tu trayectoria</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Años de experiencia</label>
                <input
                  type="number"
                  value={form.yearsExperience}
                  onChange={(e) => updateField("yearsExperience", e.target.value)}
                  placeholder="5"
                  min="0"
                  max="50"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Especialidad</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => updateField("specialty", e.target.value)}
                  placeholder="Traumatología, deportiva, suelo pélvico..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Heart size={14} className="mr-1 inline text-red-400" />
                ¿Por qué te apuntaste a ACTIVA?
              </label>
              <textarea
                value={form.motivation}
                onChange={(e) => updateField("motivation", e.target.value)}
                placeholder="Cuéntanos qué te motivó a dar el paso, qué esperas conseguir, qué cambio buscas en tu clínica..."
                rows={4}
                className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Breve bio</label>
              <textarea
                value={form.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Una frase sobre ti que verán tus compañeros de cohorte..."
                rows={2}
                className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as Step)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Empezar el programa"}
              {!loading && <ArrowRight size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
