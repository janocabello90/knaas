"use client";

import { useState, useEffect } from "react";
import { Camera, Save, User, MapPin, Briefcase, Loader2, Receipt, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  photo: string;
  bio: string;
  city: string;
  province: string;
  country: string;
  linkedinUrl: string;
  instagramUrl: string;
  yearsExperience: string;
  specialty: string;
  motivation: string;
  // Billing
  fiscalName: string;
  nifCif: string;
  businessType: string;
  companyName: string;
  fiscalAddress: string;
  fiscalCity: string;
  fiscalProvince: string;
  fiscalPostalCode: string;
  fiscalCountry: string;
  irpfApplies: boolean;
  // Shipping
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingCountry: string;
};

export default function AlumnoAjustesPage() {
  const [form, setForm] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    photo: "",
    bio: "",
    city: "",
    province: "",
    country: "España",
    linkedinUrl: "",
    instagramUrl: "",
    yearsExperience: "",
    specialty: "",
    motivation: "",
    fiscalName: "",
    nifCif: "",
    businessType: "",
    companyName: "",
    fiscalAddress: "",
    fiscalCity: "",
    fiscalProvince: "",
    fiscalPostalCode: "",
    fiscalCountry: "España",
    irpfApplies: false,
    shippingName: "",
    shippingAddress: "",
    shippingCity: "",
    shippingProvince: "",
    shippingPostalCode: "",
    shippingCountry: "España",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/alumno/profile")
      .then((res) => res.json())
      .then((data: ProfileData) => {
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          birthDate: data.birthDate ? data.birthDate.substring(0, 10) : "",
          photo: data.photo || "",
          bio: data.bio || "",
          city: data.city || "",
          province: data.province || "",
          country: data.country || "España",
          linkedinUrl: data.linkedinUrl || "",
          instagramUrl: data.instagramUrl || "",
          yearsExperience: data.yearsExperience ? String(data.yearsExperience) : "",
          specialty: data.specialty || "",
          motivation: data.motivation || "",
          fiscalName: data.fiscalName || "",
          nifCif: data.nifCif || "",
          businessType: data.businessType || "",
          companyName: data.companyName || "",
          fiscalAddress: data.fiscalAddress || "",
          fiscalCity: data.fiscalCity || "",
          fiscalProvince: data.fiscalProvince || "",
          fiscalPostalCode: data.fiscalPostalCode || "",
          fiscalCountry: data.fiscalCountry || "España",
          irpfApplies: data.irpfApplies || false,
          shippingName: data.shippingName || "",
          shippingAddress: data.shippingAddress || "",
          shippingCity: data.shippingCity || "",
          shippingProvince: data.shippingProvince || "",
          shippingPostalCode: data.shippingPostalCode || "",
          shippingCountry: data.shippingCountry || "España",
        });
        if (data.photo) setPhotoPreview(data.photo);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar el perfil");
        setLoading(false);
      });
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/alumno/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
          birthDate: form.birthDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Actualiza tu información personal y profesional
        </p>
      </div>

      {/* Photo */}
      <div className="mb-8 flex items-center gap-6">
        <label className="group relative cursor-pointer">
          <div className={cn(
            "flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 transition-all",
            photoPreview ? "border-blue-200" : "border-dashed border-gray-300 group-hover:border-blue-400"
          )}>
            {photoPreview ? (
              <img src={photoPreview} alt="Foto" className="h-full w-full object-cover" />
            ) : (
              <Camera size={28} className="text-gray-400 group-hover:text-blue-500" />
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </label>
        <div>
          <p className="text-sm font-medium text-gray-900">{form.firstName} {form.lastName}</p>
          <p className="text-sm text-gray-500">{form.email}</p>
          <p className="mt-1 text-xs text-gray-400">Haz clic en la foto para cambiarla</p>
        </div>
      </div>

      {/* Datos personales */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <User size={18} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Datos personales</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Apellidos</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
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

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Una frase sobre ti que verán tus compañeros..."
            rows={2}
            className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Ubicación y redes */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Ubicación y redes</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ciudad</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Provincia</label>
            <input
              type="text"
              value={form.province}
              onChange={(e) => updateField("province", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">País</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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

      {/* Perfil profesional */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Briefcase size={18} className="text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Perfil profesional</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Años de experiencia</label>
            <input
              type="number"
              value={form.yearsExperience}
              onChange={(e) => updateField("yearsExperience", e.target.value)}
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
              placeholder="Traumatología, deportiva..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">¿Por qué te apuntaste a ACTIVA?</label>
          <textarea
            value={form.motivation}
            onChange={(e) => updateField("motivation", e.target.value)}
            placeholder="Tu motivación..."
            rows={3}
            className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Datos de facturación */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Datos de facturación</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={form.businessType}
              onChange={(e) => updateField("businessType", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="PARTICULAR">Particular</option>
              <option value="AUTONOMO">Autónomo</option>
              <option value="EMPRESA">Empresa</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre fiscal</label>
            <input
              type="text"
              value={form.fiscalName}
              onChange={(e) => updateField("fiscalName", e.target.value)}
              placeholder="Nombre completo o razón social"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">NIF / CIF</label>
            <input
              type="text"
              value={form.nifCif}
              onChange={(e) => updateField("nifCif", e.target.value)}
              placeholder="12345678A"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {form.businessType === "EMPRESA" && (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Razón social</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="Nombre de la empresa S.L."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Dirección fiscal</label>
          <input
            type="text"
            value={form.fiscalAddress}
            onChange={(e) => updateField("fiscalAddress", e.target.value)}
            placeholder="Calle, número, piso..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ciudad</label>
            <input type="text" value={form.fiscalCity} onChange={(e) => updateField("fiscalCity", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Provincia</label>
            <input type="text" value={form.fiscalProvince} onChange={(e) => updateField("fiscalProvince", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Código postal</label>
            <input type="text" value={form.fiscalPostalCode} onChange={(e) => updateField("fiscalPostalCode", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">País</label>
            <input type="text" value={form.fiscalCountry} onChange={(e) => updateField("fiscalCountry", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.irpfApplies}
              onChange={(e) => setForm((prev) => ({ ...prev, irpfApplies: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Aplicar retención de IRPF (soy autónomo/profesional)</span>
          </label>
        </div>
      </div>

      {/* Dirección de envío */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Truck size={18} className="text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">Dirección de envío</h2>
          <span className="text-xs text-gray-400">(si es diferente a la fiscal)</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre para envío</label>
            <input type="text" value={form.shippingName} onChange={(e) => updateField("shippingName", e.target.value)} placeholder="Nombre completo del destinatario" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Dirección</label>
            <input type="text" value={form.shippingAddress} onChange={(e) => updateField("shippingAddress", e.target.value)} placeholder="Calle, número, piso..." className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ciudad</label>
            <input type="text" value={form.shippingCity} onChange={(e) => updateField("shippingCity", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Provincia</label>
            <input type="text" value={form.shippingProvince} onChange={(e) => updateField("shippingProvince", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Código postal</label>
            <input type="text" value={form.shippingPostalCode} onChange={(e) => updateField("shippingPostalCode", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">País</label>
            <input type="text" value={form.shippingCountry} onChange={(e) => updateField("shippingCountry", e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Save button */}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {success && (
          <span className="text-sm font-medium text-green-600">Perfil actualizado correctamente</span>
        )}
      </div>
    </div>
  );
}
