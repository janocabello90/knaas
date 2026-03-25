"use client";

import { useState, useEffect, useCallback } from "react";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  type: "SINGLE" | "INSTALLMENT";
  method: "STRIPE" | "TRANSFERENCIA";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  installmentNumber: number | null;
  totalInstallments: number | null;
  stripePaymentIntentId: string | null;
  stripeSessionId: string | null;
  invoiceNumber: string | null;
  notes: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photo: string | null;
    nifCif: string | null;
    fiscalName: string | null;
    businessType: string | null;
  };
  cohort: { id: string; name: string } | null;
  enrollment: { id: string; subscriptionType: string } | null;
};

type CohortOption = { id: string; name: string };
type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollments: { id: string; cohort: { id: string; name: string } }[];
};

type Stats = {
  totalRevenue: number;
  pendingAmount: number;
  totalPayments: number;
  completedPayments: number;
  pendingTransfers: number;
  refundedAmount: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Pagado", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Fallido", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Reembolsado", color: "bg-gray-100 text-gray-600" },
};

const METHOD_CONFIG: Record<string, { label: string; color: string }> = {
  STRIPE: { label: "Stripe", color: "bg-purple-100 text-purple-700" },
  TRANSFERENCIA: { label: "Transferencia", color: "bg-blue-100 text-blue-700" },
};

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

export default function FacturacionPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [cohortFilter, setCohortFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    cohortId: "",
    enrollmentId: "",
    totalAmount: "",
    method: "STRIPE" as "STRIPE" | "TRANSFERENCIA",
    type: "SINGLE" as "SINGLE" | "INSTALLMENT",
    installments: "1",
    invoicePrefix: "",
    notes: "",
  });

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (methodFilter) params.set("method", methodFilter);
      if (cohortFilter) params.set("cohortId", cohortFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/facturacion?${params}`);
      if (!res.ok) throw new Error("Error al cargar pagos");
      const data = await res.json();
      setPayments(data.payments);
      setCohorts(data.cohorts);
      setStudents(data.students || []);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, cohortFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When student changes, auto-set cohort from their enrollment
  useEffect(() => {
    if (form.userId) {
      const student = students.find((s) => s.id === form.userId);
      if (student?.enrollments?.length === 1) {
        setForm((f) => ({
          ...f,
          cohortId: student.enrollments[0].cohort.id,
          enrollmentId: student.enrollments[0].id,
        }));
      }
    }
  }, [form.userId, students]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.totalAmount) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/facturacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          cohortId: form.cohortId || null,
          enrollmentId: form.enrollmentId || null,
          totalAmount: parseFloat(form.totalAmount),
          method: form.method,
          type: form.type,
          installments: parseInt(form.installments),
          invoicePrefix: form.invoicePrefix || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear pagos");
      }

      const data = await res.json();
      setSuccess(
        `${data.count} pago(s) creado(s) correctamente como ${form.method === "STRIPE" ? "Stripe" : "Transferencia"}`
      );
      setShowCreate(false);
      setForm({
        userId: "",
        cohortId: "",
        enrollmentId: "",
        totalAmount: "",
        method: "STRIPE",
        type: "SINGLE",
        installments: "1",
        invoicePrefix: "",
        notes: "",
      });
      await fetchData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (paymentId: string, action: string) => {
    const labels: Record<string, string> = {
      verify_transfer: "verificar esta transferencia",
      mark_failed: "marcar como fallido",
      refund: "marcar como reembolsado",
    };

    if (!confirm(`¿Seguro que quieres ${labels[action] || action}?`)) return;

    try {
      setActionLoading(paymentId);
      const res = await fetch("/api/admin/facturacion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }

      setSuccess(
        action === "verify_transfer"
          ? "Transferencia verificada correctamente"
          : action === "refund"
            ? "Pago marcado como reembolsado"
            : "Pago actualizado"
      );
      await fetchData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setActionLoading(null);
    }
  };

  const selectedStudent = students.find((s) => s.id === form.userId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de pagos — Stripe y transferencias bancarias
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Nuevo Pago
        </button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-medium underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Ingresos Totales</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{fmt(stats.totalRevenue)}</p>
            <p className="mt-1 text-xs text-gray-400">{stats.completedPayments} pagos cobrados</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Pendiente de Cobro</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{fmt(stats.pendingAmount)}</p>
            <p className="mt-1 text-xs text-gray-400">
              {stats.pendingTransfers} transferencias por verificar
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Pagos Totales</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Reembolsos</p>
            <p className="mt-1 text-2xl font-bold text-gray-600">{fmt(stats.refundedAmount)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, email o NIF..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos los métodos</option>
          <option value="STRIPE">Stripe</option>
          <option value="TRANSFERENCIA">Transferencia</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="COMPLETED">Pagado</option>
          <option value="PENDING">Pendiente</option>
          <option value="FAILED">Fallido</option>
          <option value="REFUNDED">Reembolsado</option>
        </select>
        <select
          value={cohortFilter}
          onChange={(e) => setCohortFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todas las cohortes</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No hay pagos registrados</p>
          <p className="mt-1 text-sm text-gray-400">
            Usa &quot;+ Nuevo Pago&quot; para crear pagos por Stripe o transferencia bancaria
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Cohorte</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.user.photo ? (
                          <img src={p.user.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {p.user.firstName[0]}{p.user.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.user.firstName} {p.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{p.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.cohort?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${METHOD_CONFIG[p.method]?.color}`}>
                        {METHOD_CONFIG[p.method]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.type === "INSTALLMENT"
                        ? `Cuota ${p.installmentNumber}/${p.totalInstallments}`
                        : "Pago único"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">{fmt(p.amount, p.currency)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CONFIG[p.status]?.color}`}>
                        {STATUS_CONFIG[p.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.paidAt ? fmtDate(p.paidAt) : fmtDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {p.status === "PENDING" && p.method === "TRANSFERENCIA" && (
                        <button
                          onClick={() => handleAction(p.id, "verify_transfer")}
                          disabled={actionLoading === p.id}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === p.id ? "..." : "✓ Verificar"}
                        </button>
                      )}
                      {p.status === "COMPLETED" && (
                        <button
                          onClick={() => handleAction(p.id, "refund")}
                          disabled={actionLoading === p.id}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Reembolsar
                        </button>
                      )}
                      {p.status === "PENDING" && p.method === "STRIPE" && (
                        <span className="text-xs text-gray-400">Esperando Stripe</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded */}
                  {expandedId === p.id && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={8} className="bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium text-gray-400">Datos fiscales</p>
                            <p className="mt-1 text-gray-700">{p.user.fiscalName || "No registrado"}</p>
                            <p className="text-gray-500">NIF/CIF: {p.user.nifCif || "—"}</p>
                            <p className="text-gray-500">
                              Tipo: {p.user.businessType === "AUTONOMO" ? "Autónomo" : p.user.businessType === "EMPRESA" ? "Empresa" : p.user.businessType === "PARTICULAR" ? "Particular" : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400">Nº Factura</p>
                            <p className="mt-1 text-gray-700">{p.invoiceNumber || "Sin asignar"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              {p.method === "STRIPE" ? "Stripe IDs" : "Método"}
                            </p>
                            {p.method === "STRIPE" ? (
                              <>
                                <p className="mt-1 text-gray-500 text-xs">
                                  PI: {p.stripePaymentIntentId ? `${p.stripePaymentIntentId.slice(0, 24)}...` : "—"}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  Session: {p.stripeSessionId ? `${p.stripeSessionId.slice(0, 24)}...` : "—"}
                                </p>
                              </>
                            ) : (
                              <p className="mt-1 text-gray-700">Transferencia bancaria</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400">Notas</p>
                            <p className="mt-1 text-gray-500 whitespace-pre-line">{p.notes || "Sin notas"}</p>
                            {p.refundedAt && (
                              <p className="mt-1 text-red-500">Reembolsado: {fmtDate(p.refundedAt)}</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Payment Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nuevo Pago</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              {/* Payment method selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, method: "STRIPE" })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                      form.method === "STRIPE"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                    <span className="text-sm font-medium text-gray-900">Link de Stripe</span>
                    <span className="text-xs text-gray-500 text-center">
                      Se genera un enlace de pago
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, method: "TRANSFERENCIA" })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                      form.method === "TRANSFERENCIA"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">🏦</span>
                    <span className="text-sm font-medium text-gray-900">Transferencia</span>
                    <span className="text-xs text-gray-500 text-center">
                      Se verifica manualmente
                    </span>
                  </button>
                </div>
              </div>

              {/* Student */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Alumno *</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value, cohortId: "", enrollmentId: "" })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Seleccionar alumno...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} — {s.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cohort (auto from student or manual) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cohorte</label>
                <select
                  value={form.cohortId}
                  onChange={(e) => {
                    const cohortId = e.target.value;
                    const enrollment = selectedStudent?.enrollments.find((en) => en.cohort.id === cohortId);
                    setForm({ ...form, cohortId, enrollmentId: enrollment?.id || "" });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Sin cohorte</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Total amount */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Importe total (EUR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  required
                  placeholder="3000.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Payment type: single or installments */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Forma de pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "SINGLE", installments: "1" })}
                    className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      form.type === "SINGLE"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    Pago único
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "INSTALLMENT", installments: "3" })}
                    className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      form.type === "INSTALLMENT"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    Fraccionado
                  </button>
                </div>
              </div>

              {/* Installment selector */}
              {form.type === "INSTALLMENT" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Número de cuotas
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, installments: String(n) })}
                        className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                          form.installments === String(n)
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                  {form.totalAmount && (
                    <p className="mt-2 text-sm text-gray-500">
                      {parseInt(form.installments)} cuotas de{" "}
                      <span className="font-semibold text-gray-700">
                        {fmt(parseFloat(form.totalAmount) / parseInt(form.installments))}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Invoice prefix */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Prefijo factura
                </label>
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  placeholder="FR-2026-001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {form.type === "INSTALLMENT" && parseInt(form.installments) > 1
                    ? `Se generarán: ${form.invoicePrefix || "FR-2026-001"}-01, -02, etc.`
                    : "Número de factura para este pago"}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder={
                    form.method === "TRANSFERENCIA"
                      ? "Ej: Pendiente de recibir transferencia. Ref: ACTIVA-2026"
                      : "Notas opcionales..."
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Summary */}
              {form.userId && form.totalAmount && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Resumen</p>
                  <p className="text-sm text-gray-700">
                    {form.method === "STRIPE" ? "💳 Link de Stripe" : "🏦 Transferencia bancaria"}
                    {" · "}
                    {form.type === "INSTALLMENT" && parseInt(form.installments) > 1
                      ? `${form.installments} cuotas de ${fmt(parseFloat(form.totalAmount) / parseInt(form.installments))}`
                      : `Pago único de ${fmt(parseFloat(form.totalAmount))}`}
                  </p>
                  {form.method === "TRANSFERENCIA" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Los pagos se crearán como &quot;Pendiente&quot; — podrás verificar cada
                      transferencia cuando llegue
                    </p>
                  )}
                  {form.method === "STRIPE" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Los pagos se crearán como &quot;Pendiente&quot; — Stripe los marcará automáticamente
                      cuando el alumno pague
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.userId || !form.totalAmount}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating
                    ? "Creando..."
                    : form.method === "STRIPE"
                      ? "Crear Pago Stripe"
                      : "Registrar Transferencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
