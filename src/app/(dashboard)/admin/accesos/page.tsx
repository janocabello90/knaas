"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Copy,
  Plus,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  Loader,
  Link2,
  UserPlus,
  Users,
  DollarSign,
  Clock,
  X,
} from "lucide-react";

interface StudentData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  lastLogin?: string;
  enrollments: {
    id: string;
    status: string;
    enrolledAt: string;
    subscriptionType: string;
    cohort: {
      id: string;
      name: string;
    };
  }[];
  billingInfo?: {
    nifCif: string;
    fiscalName: string;
    businessType: string;
  };
  paymentSummary: {
    totalPaid: number;
    pending: number;
  };
}

interface InvitationData {
  id: string;
  code: string;
  type: string;
  cohortId: string;
  cohort: {
    id: string;
    name: string;
  };
  email?: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  price?: number;
  installmentsOk: boolean;
  createdBy: string;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface Stats {
  totalStudents: number;
  active: number;
  pending: number;
  totalRevenue: number;
}

interface Cohort {
  id: string;
  name: string;
}

type TabKey = "alumnos" | "enlaces" | "crear";

export default function AccesosPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("alumnos");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCohort, setFilterCohort] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Expanded student
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [linkForm, setLinkForm] = useState({
    type: "PAYMENT",
    cohortId: "",
    email: "",
    maxUses: "5",
    price: "",
    installmentsOk: false,
  });

  const [enrollForm, setEnrollForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    cohortId: "",
    subscriptionType: "NORMAL",
    paymentMethod: "",
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/accesos");
      if (!response.ok) throw new Error("Error al cargar datos de accesos");
      const data = await response.json();
      setStudents(data.students || []);
      setInvitations(data.invitations || []);
      setStats(data.stats || null);

      // Extract unique cohorts
      const cohortMap = new Map<string, Cohort>();
      (data.students || []).forEach((s: StudentData) => {
        s.enrollments.forEach((e) => {
          cohortMap.set(e.cohort.id, e.cohort);
        });
      });
      (data.invitations || []).forEach((i: InvitationData) => {
        cohortMap.set(i.cohort.id, i.cohort);
      });
      setCohorts(Array.from(cohortMap.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Also fetch cohorts from the cohortes API for the forms
  const [allCohorts, setAllCohorts] = useState<Cohort[]>([]);
  useEffect(() => {
    fetch("/api/admin/cohortes")
      .then((r) => r.json())
      .then((data) => {
        if (data.cohorts) {
          setAllCohorts(
            data.cohorts.map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const availableCohorts = allCohorts.length > 0 ? allCohorts : cohorts;

  // Filter students
  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query);

    const matchesCohort = filterCohort
      ? student.enrollments.some((e) => e.cohort.id === filterCohort)
      : true;

    const matchesStatus = filterStatus
      ? student.enrollments.some((e) => e.status === filterStatus)
      : true;

    return matchesSearch && matchesCohort && matchesStatus;
  });

  // Create invitation link
  const handleCreateLink = async () => {
    if (!linkForm.cohortId) {
      setError("Selecciona una cohorte");
      return;
    }
    try {
      setIsCreatingLink(true);
      setError(null);
      const response = await fetch("/api/admin/accesos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: linkForm.type,
          cohortId: linkForm.cohortId,
          email: linkForm.email || null,
          maxUses: parseInt(linkForm.maxUses),
          price: linkForm.type === "PAYMENT" ? parseFloat(linkForm.price) : null,
          installmentsOk: linkForm.installmentsOk,
          expiresAt: null,
        }),
      });
      if (!response.ok) throw new Error("Error al crear enlace");
      setSuccessMsg("Enlace creado correctamente");
      setShowLinkModal(false);
      setLinkForm({
        type: "PAYMENT",
        cohortId: "",
        email: "",
        maxUses: "5",
        price: "",
        installmentsOk: false,
      });
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear enlace");
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Enroll student manually
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !enrollForm.email ||
      !enrollForm.firstName ||
      !enrollForm.lastName ||
      !enrollForm.cohortId
    ) {
      setError("Rellena todos los campos obligatorios");
      return;
    }
    try {
      setIsEnrolling(true);
      setError(null);
      const response = await fetch("/api/admin/accesos/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollForm),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al matricular alumno");
      }
      setSuccessMsg("Alumno matriculado correctamente");
      setEnrollForm({
        email: "",
        firstName: "",
        lastName: "",
        cohortId: "",
        subscriptionType: "NORMAL",
        paymentMethod: "",
      });
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al matricular");
    } finally {
      setIsEnrolling(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg("Copiado al portapapeles");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Get initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName || "?")[0]}${(lastName || "?")[0]}`.toUpperCase();
  };

  // Status colors
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    PAUSED: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: "Activo",
    PENDING: "Pendiente",
    PAUSED: "Pausado",
    CANCELLED: "Cancelado",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "alumnos", label: "Alumnos", icon: <Users size={16} /> },
    { key: "enlaces", label: "Enlaces", icon: <Link2 size={16} /> },
    { key: "crear", label: "Crear Acceso", icon: <UserPlus size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Accesos
        </h1>
        <p className="mt-2 text-gray-600">
          Administra estudiantes, enlaces de invitación y accesos
        </p>
      </div>

      {/* Error / Success alerts */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <p>{successMsg}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Alumnos" value={stats.totalStudents} icon={<Users size={24} />} color="blue" />
          <StatCard label="Activos" value={stats.active} icon={<Eye size={24} />} color="green" />
          <StatCard label="Pendientes" value={stats.pending} icon={<Clock size={24} />} color="yellow" />
          <StatCard label="Ingresos" value={`€${(stats.totalRevenue || 0).toFixed(2)}`} icon={<DollarSign size={24} />} color="purple" />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-200 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Alumnos */}
      {activeTab === "alumnos" && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900">Estudiantes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona la información y estatus de los estudiantes
            </p>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 outline-none"
                />
              </div>
              <select
                value={filterCohort}
                onChange={(e) => setFilterCohort(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
              >
                <option value="">Todas las cohortes</option>
                {availableCohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
              >
                <option value="">Todos los estatus</option>
                <option value="ACTIVE">Activo</option>
                <option value="PENDING">Pendiente</option>
                <option value="PAUSED">Pausado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
                <AlertCircle size={16} />
                No se encontraron estudiantes
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id}>
                  {/* Main row */}
                  <button
                    onClick={() =>
                      setExpandedStudent(
                        expandedStudent === student.id ? null : student.id
                      )
                    }
                    className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {getInitials(student.firstName, student.lastName)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {student.email}
                      </p>
                    </div>

                    {/* Cohort */}
                    {student.enrollments[0] && (
                      <span className="hidden text-sm text-gray-600 md:block">
                        {student.enrollments[0].cohort.name}
                      </span>
                    )}

                    {/* Status */}
                    {student.enrollments[0] && (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          statusColors[student.enrollments[0].status] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {statusLabels[student.enrollments[0].status] ||
                          student.enrollments[0].status}
                      </span>
                    )}

                    {/* Subscription type */}
                    {student.enrollments[0] && (
                      <span className="hidden rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600 lg:block">
                        {student.enrollments[0].subscriptionType}
                      </span>
                    )}

                    {/* Payment */}
                    <div className="hidden shrink-0 text-right text-sm lg:block">
                      <span className="font-medium text-gray-900">
                        €{(student.paymentSummary?.totalPaid || 0).toFixed(2)}
                      </span>
                      {(student.paymentSummary?.pending || 0) > 0 && (
                        <span className="ml-1 text-red-600">
                          (€{student.paymentSummary.pending.toFixed(2)} pdte)
                        </span>
                      )}
                    </div>

                    {/* Toggle icon */}
                    {expandedStudent === student.id ? (
                      <EyeOff size={16} className="shrink-0 text-gray-400" />
                    ) : (
                      <Eye size={16} className="shrink-0 text-gray-400" />
                    )}
                  </button>

                  {/* Expanded details */}
                  {expandedStudent === student.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Billing */}
                        {student.billingInfo && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-gray-700">
                              Información Fiscal
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-gray-500">NIF/CIF: </span>
                                {student.billingInfo.nifCif || "—"}
                              </p>
                              <p>
                                <span className="text-gray-500">Nombre Fiscal: </span>
                                {student.billingInfo.fiscalName || "—"}
                              </p>
                              <p>
                                <span className="text-gray-500">Tipo: </span>
                                {student.billingInfo.businessType || "—"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Enrollment */}
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-gray-700">
                            Matrícula
                          </h4>
                          <div className="space-y-1 text-sm">
                            {student.enrollments[0] && (
                              <p>
                                <span className="text-gray-500">Inscrito: </span>
                                {new Date(
                                  student.enrollments[0].enrolledAt
                                ).toLocaleDateString("es-ES")}
                              </p>
                            )}
                            {student.lastLogin && (
                              <p>
                                <span className="text-gray-500">Último acceso: </span>
                                {new Date(student.lastLogin).toLocaleDateString(
                                  "es-ES"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <button className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          Activar
                        </button>
                        <button className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          Pausar
                        </button>
                        <button className="rounded-lg border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Enlaces */}
      {activeTab === "enlaces" && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Enlaces de Invitación
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Crea y gestiona enlaces para que los estudiantes se registren
              </p>
            </div>
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Crear Enlace
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {invitations.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
                <AlertCircle size={16} />
                No hay enlaces de invitación aún
              </div>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-gray-800">
                        {inv.code}
                      </code>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          inv.type === "PAYMENT"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        )}
                      >
                        {inv.type === "PAYMENT" ? "De Pago" : "Gratuito"}
                      </span>
                      <span className="text-sm text-gray-600">
                        {inv.cohort.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Usos: {inv.usedCount}/{inv.maxUses}
                      {inv.price != null && inv.price > 0 && ` · €${inv.price.toFixed(2)}`}
                      {inv.email && ` · ${inv.email}`}
                      {inv.expiresAt &&
                        ` · Expira: ${new Date(inv.expiresAt).toLocaleDateString("es-ES")}`}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/register?code=${inv.code}`
                      )
                    }
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Copiar enlace"
                  >
                    <Copy size={16} />
                  </button>

                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      inv.isActive
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    )}
                  >
                    {inv.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Crear Acceso */}
      {activeTab === "crear" && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Crear Acceso Manual
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Registra un nuevo estudiante manualmente en el sistema
            </p>
          </div>

          <form onSubmit={handleEnroll} className="max-w-2xl p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={enrollForm.email}
                    onChange={(e) =>
                      setEnrollForm({ ...enrollForm, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    placeholder="Juan"
                    value={enrollForm.firstName}
                    onChange={(e) =>
                      setEnrollForm({ ...enrollForm, firstName: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    placeholder="Pérez"
                    value={enrollForm.lastName}
                    onChange={(e) =>
                      setEnrollForm({ ...enrollForm, lastName: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Cohorte *
                  </label>
                  <select
                    value={enrollForm.cohortId}
                    onChange={(e) =>
                      setEnrollForm({ ...enrollForm, cohortId: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">Selecciona una cohorte</option>
                    {availableCohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Tipo de Suscripción *
                  </label>
                  <select
                    value={enrollForm.subscriptionType}
                    onChange={(e) =>
                      setEnrollForm({
                        ...enrollForm,
                        subscriptionType: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                  >
                    <option value="BECA">Beca</option>
                    <option value="NORMAL">Normal</option>
                    <option value="INVITACION">Invitación</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Método de Pago
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Tarjeta, Transferencia"
                    value={enrollForm.paymentMethod}
                    onChange={(e) =>
                      setEnrollForm({
                        ...enrollForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isEnrolling}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnrolling && <Loader size={16} className="animate-spin" />}
                Crear Estudiante
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                Crear Enlace de Invitación
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <select
                  value={linkForm.type}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, type: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                >
                  <option value="FREE">Gratuito</option>
                  <option value="PAYMENT">De Pago</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Cohorte
                </label>
                <select
                  value={linkForm.cohortId}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, cohortId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                >
                  <option value="">Selecciona una cohorte</option>
                  {availableCohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email (opcional — para enlace personalizado)
                </label>
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={linkForm.email}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Máximo de Usos
                </label>
                <input
                  type="number"
                  min="1"
                  value={linkForm.maxUses}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, maxUses: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                />
              </div>

              {linkForm.type === "PAYMENT" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Precio (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={linkForm.price}
                    onChange={(e) =>
                      setLinkForm({ ...linkForm, price: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="installments"
                  checked={linkForm.installmentsOk}
                  onChange={(e) =>
                    setLinkForm({
                      ...linkForm,
                      installmentsOk: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="installments"
                  className="text-sm font-medium text-gray-700"
                >
                  Permitir pagos en cuotas
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLink}
                disabled={isCreatingLink}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingLink && <Loader size={16} className="animate-spin" />}
                Crear Enlace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats card component
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "purple";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn("rounded-lg p-3", colorClasses[color])}>{icon}</div>
      </div>
    </div>
  );
}
