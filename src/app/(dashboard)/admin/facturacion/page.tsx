"use client";

import { useState, useEffect, useCallback } from "react";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  type: "SINGLE" | "INSTALLMENT";
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

type Stats = {
  totalRevenue: number;
  pendingAmount: number;
  totalPayments: number;
  completedPayments: number;
  failedPayments: number;
  refundedAmount: number;
};

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Pagado", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Fallido", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Reembolsado", color: "bg-gray-100 text-gray-600" },
};

const TYPE_LABELS: Record<string, string> = {
  SINGLE: "Pago único",
  INSTALLMENT: "Cuota",
};

function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FacturacionPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [cohortFilter, setCohortFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create payment modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: "",
    cohortId: "",
    amount: "",
    type: "SINGLE",
    status: "COMPLETED",
    installmentNumber: "",
    totalInstallments: "",
    invoiceNumber: "",
    notes: "",
  });

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (cohortFilter) params.set("cohortId", cohortFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/facturacion?${params}`);
      if (!res.ok) throw new Error("Error al cargar pagos");
      const data = await res.json();
      setPayments(data.payments);
      setCohorts(data.cohorts);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cohortFilter, searchQuery]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Fetch students for the create modal
  useEffect(() => {
    if (showCreateModal && students.length === 0) {
      fetch("/api/admin/accesos")
        .then((r) => r.json())
        .then((data) => {
          if (data.students) {
            setStudents(
              data.students.map((s: { id: string; firstName: string; lastName: string; email: string }) => ({
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [showCreateModal, students.length]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.userId || !createForm.amount) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/facturacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          amount: parseFloat(createForm.amount),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear pago");
      }

      setShowCreateModal(false);
      setCreateForm({
        userId: "",
        cohortId: "",
        amount: "",
        type: "SINGLE",
        status: "COMPLETED",
        installmentNumber: "",
        totalInstallments: "",
        invoiceNumber: "",
        notes: "",
      });
      await fetchPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de pagos, facturas e ingresos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Registrar Pago
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Ingresos Totales</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {stats.completedPayments} pagos completados
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Pendiente de Cobro</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingAmount)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {stats.totalPayments - stats.completedPayments - stats.failedPayments} pendientes
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Pagos Totales</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stats.totalPayments}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {stats.failedPayments} fallidos
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Reembolsos</p>
            <p className="mt-1 text-2xl font-bold text-gray-600">
              {formatCurrency(stats.refundedAmount)}
            </p>
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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 font-medium underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Payments Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No hay pagos registrados</p>
          <p className="mt-1 text-sm text-gray-400">
            Los pagos aparecerán aquí cuando se registren manualmente o se
            completen vía Stripe
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Cohorte</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() =>
                      setExpandedId(expandedId === p.id ? null : p.id)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.user.photo ? (
                          <img
                            src={p.user.photo}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {p.user.firstName[0]}
                            {p.user.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.user.firstName} {p.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.cohort?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {TYPE_LABELS[p.type] || p.type}
                        {p.type === "INSTALLMENT" &&
                          p.installmentNumber &&
                          ` ${p.installmentNumber}/${p.totalInstallments}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(p.amount, p.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_LABELS[p.status]?.color || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[p.status]?.label || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.paidAt
                        ? formatDate(p.paidAt)
                        : formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.invoiceNumber || "—"}
                    </td>
                  </tr>

                  {/* Expanded details */}
                  {expandedId === p.id && (
                    <tr key={`${p.id}-details`}>
                      <td colSpan={7} className="bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Datos fiscales
                            </p>
                            <p className="mt-1 text-gray-700">
                              {p.user.fiscalName || "No registrado"}
                            </p>
                            <p className="text-gray-500">
                              NIF/CIF: {p.user.nifCif || "—"}
                            </p>
                            <p className="text-gray-500">
                              Tipo:{" "}
                              {p.user.businessType === "AUTONOMO"
                                ? "Autónomo"
                                : p.user.businessType === "EMPRESA"
                                  ? "Empresa"
                                  : p.user.businessType === "PARTICULAR"
                                    ? "Particular"
                                    : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Stripe
                            </p>
                            <p className="mt-1 text-gray-500">
                              PI:{" "}
                              {p.stripePaymentIntentId
                                ? `${p.stripePaymentIntentId.slice(0, 20)}...`
                                : "Manual"}
                            </p>
                            <p className="text-gray-500">
                              Session:{" "}
                              {p.stripeSessionId
                                ? `${p.stripeSessionId.slice(0, 20)}...`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Suscripción
                            </p>
                            <p className="mt-1 text-gray-500">
                              {p.enrollment?.subscriptionType || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Notas
                            </p>
                            <p className="mt-1 text-gray-500">
                              {p.notes || "Sin notas"}
                            </p>
                            {p.refundedAt && (
                              <p className="mt-1 text-red-500">
                                Reembolsado: {formatDate(p.refundedAt)}
                              </p>
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
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Registrar Pago Manual
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="mt-4 space-y-4">
              {/* Student */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Alumno *
                </label>
                <select
                  value={createForm.userId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, userId: e.target.value })
                  }
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

              {/* Cohort */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cohorte
                </label>
                <select
                  value={createForm.cohortId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, cohortId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Sin cohorte</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Importe (EUR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.amount}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amount: e.target.value })
                    }
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, type: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="SINGLE">Pago único</option>
                    <option value="INSTALLMENT">Cuota</option>
                  </select>
                </div>
              </div>

              {/* Installment details */}
              {createForm.type === "INSTALLMENT" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cuota nº
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.installmentNumber}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          installmentNumber: e.target.value,
                        })
                      }
                      placeholder="1"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Total cuotas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.totalInstallments}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          totalInstallments: e.target.value,
                        })
                      }
                      placeholder="6"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Status + Invoice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, status: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="COMPLETED">Pagado</option>
                    <option value="PENDING">Pendiente</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nº Factura
                  </label>
                  <input
                    type="text"
                    value={createForm.invoiceNumber}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        invoiceNumber: e.target.value,
                      })
                    }
                    placeholder="FR-2026-001"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notas
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Transferencia bancaria, beca, etc."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !createForm.userId || !createForm.amount}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? "Registrando..." : "Registrar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
