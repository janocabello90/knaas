"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  Building2,
  Receipt,
  GraduationCap,
  Shield,
  Bell,
  Save,
  Loader2,
  Check,
  ChevronRight,
  FileText,
  Calendar,
  CreditCard,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────
type Profile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  bio: string | null;
  phone: string | null;
  birthDate: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  yearsExperience: number | null;
  specialty: string | null;
  motivation: string | null;
};

type Clinic = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  model: string | null;
  cyclePhase: string | null;
  teamCount: number;
  services: unknown;
  channels: string[];
} | null;

type Billing = {
  fiscalName: string | null;
  nifCif: string | null;
  businessType: string | null;
  companyName: string | null;
  fiscalAddress: string | null;
  fiscalCity: string | null;
  fiscalProvince: string | null;
  fiscalPostalCode: string | null;
  fiscalCountry: string | null;
  irpfApplies: boolean;
};

type Enrollment = {
  id: string;
  subscriptionType: string;
  status: string;
  enrolledAt: string;
  cohort: {
    id: string;
    name: string;
    program: string;
    status: string;
    startDate: string;
    endDate: string | null;
  };
};

type Payment = {
  id: string;
  baseAmount: number;
  ivaRate: number;
  ivaAmount: number;
  totalAmount: number;
  currency: string;
  type: string;
  method: string;
  status: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
  invoiceNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  cohort: { id: string; name: string } | null;
};

type Tab = "perfil" | "clinica" | "facturacion" | "programas" | "seguridad" | "notificaciones";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "perfil", label: "Mi Perfil", icon: <User size={18} /> },
  { key: "clinica", label: "Mi Clínica", icon: <Building2 size={18} /> },
  { key: "facturacion", label: "Facturación", icon: <Receipt size={18} /> },
  { key: "programas", label: "Mis Programas", icon: <GraduationCap size={18} /> },
  { key: "seguridad", label: "Seguridad", icon: <Shield size={18} /> },
  { key: "notificaciones", label: "Notificaciones", icon: <Bell size={18} /> },
];

function fmt(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Pagado", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Fallido", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Reembolsado", color: "bg-gray-100 text-gray-600" },
};

const ENROLLMENT_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Activo", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  PAUSED: { label: "Pausado", color: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Completado", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

const PROGRAM_COLOR: Record<string, string> = {
  ACTIVA: "bg-green-100 text-green-700 border-green-200",
  OPTIMIZA: "bg-blue-100 text-blue-700 border-blue-200",
  ESCALA: "bg-purple-100 text-purple-700 border-purple-200",
};

// ── Main Page ──────────────────────────────────────────────────────
export default function AlumnoAjustesPage() {
  const [tab, setTab] = useState<Tab>("perfil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [clinic, setClinic] = useState<Clinic>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState<Record<string, string>>({});
  const [clinicForm, setClinicForm] = useState<Record<string, string>>({});
  const [billingForm, setBillingForm] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alumno/ajustes");
      if (!res.ok) throw new Error("Error al cargar datos");
      const data = await res.json();
      setProfile(data.profile);
      setClinic(data.clinic);
      setBilling(data.billing);
      setEnrollments(data.enrollments || []);
      setPayments(data.payments || []);

      // Init forms
      const p = data.profile;
      setProfileForm({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        phone: p.phone || "",
        bio: p.bio || "",
        city: p.city || "",
        province: p.province || "",
        country: p.country || "España",
        linkedinUrl: p.linkedinUrl || "",
        instagramUrl: p.instagramUrl || "",
        yearsExperience: p.yearsExperience?.toString() || "",
        specialty: p.specialty || "",
        motivation: p.motivation || "",
      });

      const c = data.clinic;
      setClinicForm({
        name: c?.name || "",
        address: c?.address || "",
        phone: c?.phone || "",
        email: c?.email || "",
        model: c?.model || "",
        cyclePhase: c?.cyclePhase || "",
        teamCount: c?.teamCount?.toString() || "1",
      });

      const b = data.billing;
      setBillingForm({
        fiscalName: b?.fiscalName || "",
        nifCif: b?.nifCif || "",
        businessType: b?.businessType || "",
        companyName: b?.companyName || "",
        fiscalAddress: b?.fiscalAddress || "",
        fiscalCity: b?.fiscalCity || "",
        fiscalProvince: b?.fiscalProvince || "",
        fiscalPostalCode: b?.fiscalPostalCode || "",
        fiscalCountry: b?.fiscalCountry || "España",
        irpfApplies: b?.irpfApplies ? "true" : "false",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (section: string, data: Record<string, unknown>) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const res = await fetch("/api/alumno/ajustes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      setSuccess("Guardado correctamente");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // If API failed and we have no profile data, show error state
  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center">
          <p className="text-sm text-red-700">{error || "No se pudieron cargar tus datos. Inténtalo de nuevo."}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tu perfil, clínica, facturación y preferencias
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Layout: sidebar tabs + content */}
      <div className="flex gap-6">
        {/* Tab navigation */}
        <nav className="w-56 shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white p-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  tab === t.key
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {t.icon}
                {t.label}
                {tab === t.key && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {tab === "perfil" && (
            <PerfilTab
              profile={profile!}
              form={profileForm}
              setForm={setProfileForm}
              onSave={() => handleSave("profile", profileForm)}
              saving={saving}
            />
          )}
          {tab === "clinica" && (
            <ClinicaTab
              clinic={clinic}
              form={clinicForm}
              setForm={setClinicForm}
              onSave={() => handleSave("clinic", clinicForm)}
              saving={saving}
            />
          )}
          {tab === "facturacion" && (
            <FacturacionTab
              billing={billing!}
              payments={payments}
              form={billingForm}
              setForm={setBillingForm}
              onSave={() => handleSave("billing", billingForm)}
              saving={saving}
            />
          )}
          {tab === "programas" && <ProgramasTab enrollments={enrollments} payments={payments} />}
          {tab === "seguridad" && <SeguridadTab email={profile?.email || ""} />}
          {tab === "notificaciones" && <NotificacionesTab />}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  textarea,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  textarea?: boolean;
}) {
  const cls =
    "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className={cls}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cls}
        />
      )}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {saving ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

// ── Tab: Perfil ───────────────────────────────────────────────────
function PerfilTab({
  profile,
  form,
  setForm,
  onSave,
  saving,
}: {
  profile: Profile;
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const up = (key: string, val: string) => setForm({ ...form, [key]: val });

  return (
    <div className="space-y-6">
      <SectionCard title="Información personal">
        {/* Avatar + name */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
            {profile.photo ? (
              <img src={profile.photo} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" id="firstName" value={form.firstName} onChange={(v) => up("firstName", v)} />
          <Field label="Apellidos" id="lastName" value={form.lastName} onChange={(v) => up("lastName", v)} />
          <Field label="Teléfono" id="phone" value={form.phone} onChange={(v) => up("phone", v)} type="tel" placeholder="+34 600 000 000" />
          <Field label="Especialidad" id="specialty" value={form.specialty} onChange={(v) => up("specialty", v)} placeholder="Fisioterapia deportiva, ATM..." />
          <Field label="Años de experiencia" id="yearsExperience" value={form.yearsExperience} onChange={(v) => up("yearsExperience", v)} type="number" />
          <Field label="Ciudad" id="city" value={form.city} onChange={(v) => up("city", v)} />
          <Field label="Provincia" id="province" value={form.province} onChange={(v) => up("province", v)} />
          <Field label="País" id="country" value={form.country} onChange={(v) => up("country", v)} />
        </div>
      </SectionCard>

      <SectionCard title="Sobre ti">
        <div className="space-y-4">
          <Field label="Bio" id="bio" value={form.bio} onChange={(v) => up("bio", v)} textarea placeholder="Cuéntanos un poco sobre ti y tu trayectoria..." />
          <Field label="¿Por qué te apuntaste al programa?" id="motivation" value={form.motivation} onChange={(v) => up("motivation", v)} textarea />
        </div>
      </SectionCard>

      <SectionCard title="Redes sociales">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" id="linkedinUrl" value={form.linkedinUrl} onChange={(v) => up("linkedinUrl", v)} placeholder="https://linkedin.com/in/..." />
          <Field label="Instagram" id="instagramUrl" value={form.instagramUrl} onChange={(v) => up("instagramUrl", v)} placeholder="https://instagram.com/..." />
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton saving={saving} onClick={onSave} />
      </div>
    </div>
  );
}

// ── Tab: Clínica ──────────────────────────────────────────────────
function ClinicaTab({
  clinic,
  form,
  setForm,
  onSave,
  saving,
}: {
  clinic: Clinic;
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const up = (key: string, val: string) => setForm({ ...form, [key]: val });

  return (
    <div className="space-y-6">
      <SectionCard title="Datos de la clínica">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de la clínica" id="clinicName" value={form.name} onChange={(v) => up("name", v)} placeholder="Clínica FisioVida" />
          <Field label="Email de la clínica" id="clinicEmail" value={form.email} onChange={(v) => up("email", v)} type="email" placeholder="info@miclinica.com" />
          <Field label="Teléfono" id="clinicPhone" value={form.phone} onChange={(v) => up("phone", v)} type="tel" />
          <Field label="Dirección" id="clinicAddress" value={form.address} onChange={(v) => up("address", v)} placeholder="Calle, número, ciudad" />
        </div>
      </SectionCard>

      <SectionCard title="Modelo de negocio">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="model" className="mb-1.5 block text-sm font-medium text-gray-700">
              Modelo de clínica
            </label>
            <select
              id="model"
              value={form.model}
              onChange={(e) => up("model", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="GURISTA">Gurista</option>
              <option value="EMPRESARIAL">Empresarial</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>
          <Field label="Fase del ciclo" id="cyclePhase" value={form.cyclePhase} onChange={(v) => up("cyclePhase", v)} placeholder="Inicio, Crecimiento, Madurez..." />
          <Field label="Personas en el equipo" id="teamCount" value={form.teamCount} onChange={(v) => up("teamCount", v)} type="number" />
        </div>
      </SectionCard>

      {/* Current clinic info card */}
      {clinic && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-900">Datos actuales registrados</p>
          <div className="mt-3 grid gap-2 text-sm text-blue-800 sm:grid-cols-2">
            <p>Clínica: <strong>{clinic.name}</strong></p>
            <p>Modelo: <strong>{clinic.model || "No definido"}</strong></p>
            <p>Equipo: <strong>{clinic.teamCount} persona{clinic.teamCount !== 1 ? "s" : ""}</strong></p>
            {clinic.channels.length > 0 && (
              <p>Canales: <strong>{clinic.channels.join(", ")}</strong></p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <SaveButton saving={saving} onClick={onSave} />
      </div>
    </div>
  );
}

// ── Tab: Facturación ──────────────────────────────────────────────
function FacturacionTab({
  billing,
  payments,
  form,
  setForm,
  onSave,
  saving,
}: {
  billing: Billing;
  payments: Payment[];
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const up = (key: string, val: string) => setForm({ ...form, [key]: val });

  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Total pagado</p>
          <p className="mt-1 text-xl font-bold text-green-600">{fmt(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Pendiente</p>
          <p className="mt-1 text-xl font-bold text-yellow-600">{fmt(totalPending)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Pagos totales</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{payments.length}</p>
        </div>
      </div>

      {/* Datos fiscales */}
      <SectionCard title="Datos fiscales">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="businessType" className="mb-1.5 block text-sm font-medium text-gray-700">
              Tipo de contribuyente
            </label>
            <select
              id="businessType"
              value={form.businessType}
              onChange={(e) => up("businessType", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Seleccionar...</option>
              <option value="PARTICULAR">Particular</option>
              <option value="AUTONOMO">Autónomo</option>
              <option value="EMPRESA">Empresa</option>
            </select>
          </div>
          <Field label="Nombre fiscal" id="fiscalName" value={form.fiscalName} onChange={(v) => up("fiscalName", v)} placeholder="Nombre completo o razón social" />
          <Field label="NIF / CIF" id="nifCif" value={form.nifCif} onChange={(v) => up("nifCif", v)} placeholder="12345678A" />
          {form.businessType === "EMPRESA" && (
            <Field label="Razón social" id="companyName" value={form.companyName} onChange={(v) => up("companyName", v)} />
          )}
          <Field label="Dirección fiscal" id="fiscalAddress" value={form.fiscalAddress} onChange={(v) => up("fiscalAddress", v)} />
          <Field label="Ciudad" id="fiscalCity" value={form.fiscalCity} onChange={(v) => up("fiscalCity", v)} />
          <Field label="Provincia" id="fiscalProvince" value={form.fiscalProvince} onChange={(v) => up("fiscalProvince", v)} />
          <Field label="Código postal" id="fiscalPostalCode" value={form.fiscalPostalCode} onChange={(v) => up("fiscalPostalCode", v)} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            id="irpf"
            type="checkbox"
            checked={form.irpfApplies === "true"}
            onChange={(e) => up("irpfApplies", e.target.checked ? "true" : "false")}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="irpf" className="text-sm text-gray-700">
            Aplico retención de IRPF (autónomos)
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <SaveButton saving={saving} onClick={onSave} />
        </div>
      </SectionCard>

      {/* Payment history */}
      <SectionCard title="Historial de pagos">
        {payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No hay pagos registrados todavía.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Concepto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Método</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Base</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">IVA</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => {
                  const st = STATUS_MAP[p.status] || { label: p.status, color: "bg-gray-100 text-gray-600" };
                  const concept = p.cohort?.name
                    ? p.installmentNumber
                      ? `${p.cohort.name} — Cuota ${p.installmentNumber}/${p.totalInstallments}`
                      : p.cohort.name
                    : p.invoiceNumber || "Pago";
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{fmtDate(p.paidAt || p.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{concept}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.method === "STRIPE" ? "Tarjeta" : "Transferencia"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(p.baseAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{fmt(p.ivaAmount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(p.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", st.color)}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Tab: Mis Programas ────────────────────────────────────────────
function ProgramasTab({
  enrollments,
  payments,
}: {
  enrollments: Enrollment[];
  payments: Payment[];
}) {
  return (
    <div className="space-y-6">
      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <GraduationCap size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-600">No estás matriculado en ningún programa</p>
          <p className="mt-1 text-sm text-gray-500">Contacta con tu mentor o administrador</p>
        </div>
      ) : (
        enrollments.map((e) => {
          const est = ENROLLMENT_STATUS[e.status] || { label: e.status, color: "bg-gray-100 text-gray-600" };
          const progColor = PROGRAM_COLOR[e.cohort.program] || "bg-gray-100 text-gray-700 border-gray-200";
          const cohortPayments = payments.filter((p) => p.cohort?.id === e.cohort.id);
          const paid = cohortPayments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.totalAmount, 0);
          const pending = cohortPayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.totalAmount, 0);

          return (
            <div key={e.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", progColor)}>
                        {e.cohort.program}
                      </span>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", est.color)}>
                        {est.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{e.cohort.name}</h3>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>Desde {fmtDate(e.enrolledAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Tipo de suscripción</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {e.subscriptionType === "NORMAL"
                        ? "Normal"
                        : e.subscriptionType === "BECA"
                          ? "Beca"
                          : e.subscriptionType === "INVITACION"
                            ? "Invitación"
                            : e.subscriptionType}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-green-600">Pagado</p>
                    <p className="mt-1 font-semibold text-green-700">{fmt(paid)}</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-600">Pendiente</p>
                    <p className="mt-1 font-semibold text-yellow-700">{fmt(pending)}</p>
                  </div>
                </div>

                {/* Payment detail for this program */}
                {cohortPayments.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-gray-500">Detalle de pagos</p>
                    <div className="space-y-1.5">
                      {cohortPayments.map((p) => {
                        const st = STATUS_MAP[p.status] || { label: p.status, color: "bg-gray-100 text-gray-600" };
                        return (
                          <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CreditCard size={14} className="text-gray-400" />
                              <span className="text-gray-700">
                                {p.installmentNumber
                                  ? `Cuota ${p.installmentNumber}/${p.totalInstallments}`
                                  : "Pago único"}
                              </span>
                              {p.invoiceNumber && (
                                <span className="text-xs text-gray-400">{p.invoiceNumber}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{fmt(p.totalAmount)}</span>
                              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st.color)}>
                                {st.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Tab: Seguridad ────────────────────────────────────────────────
function SeguridadTab({ email }: { email: string }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleChangePassword = async () => {
    setMsg("");
    setErr("");
    if (!newPw || newPw.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPw !== confirmPw) {
      setErr("Las contraseñas no coinciden");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/alumno/ajustes/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al cambiar contraseña");
      }
      setMsg("Contraseña actualizada correctamente");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Cambiar contraseña">
        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email de la cuenta</label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">{email}</p>
          </div>
          <Field label="Contraseña actual" id="currentPw" value={currentPw} onChange={setCurrentPw} type="password" />
          <Field label="Nueva contraseña" id="newPw" value={newPw} onChange={setNewPw} type="password" placeholder="Mínimo 8 caracteres" />
          <Field label="Confirmar nueva contraseña" id="confirmPw" value={confirmPw} onChange={setConfirmPw} type="password" />

          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="flex items-center gap-1.5 text-sm text-green-600"><Check size={14} />{msg}</p>}

          <SaveButton saving={saving} onClick={handleChangePassword} />
        </div>
      </SectionCard>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Sesiones activas</h2>
        <p className="text-sm text-gray-500">
          Si sospechas que alguien ha accedido a tu cuenta, cambia tu contraseña. Las sesiones activas se cerrarán automáticamente.
        </p>
      </div>
    </div>
  );
}

// ── Tab: Notificaciones ───────────────────────────────────────────
function NotificacionesTab() {
  const [prefs, setPrefs] = useState({
    emailMentorias: true,
    emailMensajes: true,
    emailPagos: true,
    emailPrograma: true,
    emailNovedades: false,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  const notifOptions: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "emailMentorias", label: "Mentorías", desc: "Recordatorios de sesiones de mentoría programadas" },
    { key: "emailMensajes", label: "Mensajes", desc: "Notificaciones de nuevos mensajes privados" },
    { key: "emailPagos", label: "Pagos", desc: "Confirmaciones de pago y recordatorios de cuotas pendientes" },
    { key: "emailPrograma", label: "Programa", desc: "Actualizaciones sobre tu progreso y nuevos contenidos disponibles" },
    { key: "emailNovedades", label: "Novedades", desc: "Newsletter y novedades de FisioReferentes" },
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Preferencias de email">
        <p className="mb-5 text-sm text-gray-500">
          Elige qué notificaciones quieres recibir por email. Los avisos críticos (como problemas con pagos) siempre se envían.
        </p>
        <div className="space-y-4">
          {notifOptions.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
              <button
                onClick={() => toggle(opt.key)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  prefs[opt.key] ? "bg-blue-600" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    prefs[opt.key] && "translate-x-5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            Las preferencias de notificación se guardarán automáticamente. Los emails transaccionales (confirmaciones de pago, acceso a la plataforma) no se pueden desactivar.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
