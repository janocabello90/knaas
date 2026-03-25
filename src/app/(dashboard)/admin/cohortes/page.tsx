'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Archive,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  X,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cohort {
  id: string;
  name: string;
  description: string;
  program: 'ACTIVA' | 'OPTIMIZA' | 'ESCALA';
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  maxStudents: number;
  currentStudents: number;
  price: number;
  installmentPrice: number;
  installmentCount: number;
  mentors: Array<{ id: string; name: string; avatar?: string }>;
  totalRevenue: number;
  expectedRevenue: number;
}

interface Stats {
  totalCohorts: number;
  activeCohorts: number;
  totalStudents: number;
  totalRevenue: number;
}

interface FormData {
  name: string;
  program: 'ACTIVA' | 'OPTIMIZA' | 'ESCALA';
  description: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  maxStudents: number;
  price: number;
  installmentPrice: number;
  installmentCount: number;
}

const INITIAL_FORM_STATE: FormData = {
  name: '',
  program: 'ACTIVA',
  description: '',
  startDate: '',
  endDate: '',
  status: 'DRAFT',
  maxStudents: 0,
  price: 0,
  installmentPrice: 0,
  installmentCount: 1,
};

export default function CohortesPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  // Fetch cohorts and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/cohortes');
      if (!response.ok) throw new Error('Failed to fetch cohorts');
      const data = await response.json();
      setCohorts(data.cohorts || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (cohort?: Cohort) => {
    if (cohort) {
      setEditingId(cohort.id);
      setFormData({
        name: cohort.name,
        program: cohort.program,
        description: cohort.description,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        status: cohort.status,
        maxStudents: cohort.maxStudents,
        price: cohort.price,
        installmentPrice: cohort.installmentPrice,
        installmentCount: cohort.installmentCount,
      });
    } else {
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(INITIAL_FORM_STATE);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const url = editingId
        ? `/api/admin/cohortes/${editingId}`
        : '/api/admin/cohortes';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} cohort`);
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas archivar esta cohorte?')) return;

    try {
      const response = await fetch(`/api/admin/cohortes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (!response.ok) throw new Error('Failed to archive cohort');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getProgramBadgeColor = (
    program: 'ACTIVA' | 'OPTIMIZA' | 'ESCALA'
  ): string => {
    switch (program) {
      case 'ACTIVA':
        return 'bg-green-100 text-green-800';
      case 'OPTIMIZA':
        return 'bg-blue-100 text-blue-800';
      case 'ESCALA':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  ): string => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  ): string => {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activa',
      COMPLETED: 'Completada',
      ARCHIVED: 'Archivada',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cohortes</h1>
          <p className="mt-2 text-gray-600">
            Administra y controla todas las cohortes de tu plataforma
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Cohorte
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Stats Row */}
      {stats && !loading && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total de Cohortes"
            value={stats.totalCohorts}
            icon={<Users size={24} />}
            color="blue"
          />
          <StatCard
            label="Cohortes Activas"
            value={stats.activeCohorts}
            icon={<TrendingUp size={24} />}
            color="green"
          />
          <StatCard
            label="Alumnos Totales"
            value={stats.totalStudents}
            icon={<Users size={24} />}
            color="purple"
          />
          <StatCard
            label="Ingresos Totales"
            value={`€${stats.totalRevenue.toLocaleString('es-ES')}`}
            icon={<DollarSign size={24} />}
            color="amber"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      )}

      {/* Cohorts Grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {cohorts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
              <Users size={48} className="mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-600">
                No hay cohortes creadas
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Crea tu primera cohorte haciendo clic en el botón "Nueva Cohorte"
              </p>
            </div>
          ) : (
            cohorts.map((cohort) => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                onEdit={() => handleOpenModal(cohort)}
                onArchive={() => handleArchive(cohort.id)}
                programBadgeColor={getProgramBadgeColor(cohort.program)}
                statusBadgeColor={getStatusBadgeColor(cohort.status)}
                statusLabel={getStatusLabel(cohort.status)}
              />
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CohortModal
          isOpen={showModal}
          isEditing={!!editingId}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
          submitting={submitting}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn('rounded-lg p-3', colorClasses[color])}>{icon}</div>
      </div>
    </div>
  );
}

interface CohortCardProps {
  cohort: Cohort;
  onEdit: () => void;
  onArchive: () => void;
  programBadgeColor: string;
  statusBadgeColor: string;
  statusLabel: string;
}

function CohortCard({
  cohort,
  onEdit,
  onArchive,
  programBadgeColor,
  statusBadgeColor,
  statusLabel,
}: CohortCardProps) {
  const studentPercentage = Math.round(
    (cohort.currentStudents / cohort.maxStudents) * 100
  );
  const revenuePercentage = Math.round(
    (cohort.totalRevenue / cohort.expectedRevenue) * 100
  );

  const startDate = new Date(cohort.startDate).toLocaleDateString('es-ES');
  const endDate = new Date(cohort.endDate).toLocaleDateString('es-ES');

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{cohort.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{cohort.description}</p>
          </div>
          <div className="flex gap-2">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                programBadgeColor
              )}
            >
              {cohort.program}
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                statusBadgeColor
              )}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>
              {startDate} - {endDate}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Students */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Alumnos</span>
            <span className="text-gray-600">
              {cohort.currentStudents}/{cohort.maxStudents}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(studentPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Revenue */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Ingresos</span>
            <span className="text-gray-600">
              €{cohort.totalRevenue.toLocaleString('es-ES')} / €
              {cohort.expectedRevenue.toLocaleString('es-ES')}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${Math.min(revenuePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
          <div>
            <p className="text-xs text-gray-600">Pago único</p>
            <p className="text-lg font-bold text-gray-900">
              €{cohort.price.toLocaleString('es-ES')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">
              {cohort.installmentCount} cuotas
            </p>
            <p className="text-lg font-bold text-gray-900">
              €{cohort.installmentPrice.toLocaleString('es-ES')}
            </p>
          </div>
        </div>

        {/* Mentors */}
        {cohort.mentors.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-gray-700">Mentores</p>
            <div className="flex gap-2">
              {cohort.mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-semibold"
                  title={mentor.name}
                >
                  {mentor.avatar ? (
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    mentor.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Actions */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Edit size={16} />
          Editar
        </button>
        <button
          onClick={onArchive}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Archive size={16} />
          Archivar
        </button>
      </div>
    </div>
  );
}

interface CohortModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
}

function CohortModal({
  isOpen,
  isEditing,
  formData,
  setFormData,
  onSubmit,
  onClose,
  submitting,
}: CohortModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Cohorte' : 'Nueva Cohorte'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-8 py-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Python Avanzado Q1 2026"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* Program and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programa
                </label>
                <select
                  value={formData.program}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      program: e.target.value as FormData['program'],
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
                >
                  <option value="ACTIVA">ACTIVA</option>
                  <option value="OPTIMIZA">OPTIMIZA</option>
                  <option value="ESCALA">ESCALA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as FormData['status'],
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="ACTIVE">Activa</option>
                  <option value="COMPLETED">Completada</option>
                  <option value="ARCHIVED">Archivada</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe el contenido y objetivos de esta cohorte..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de Alumnos
              </label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxStudents: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="30"
                min="1"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Precios</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Pago Único (EUR)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="299.99"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Cuota Mensual (EUR)
                  </label>
                  <input
                    type="number"
                    value={formData.installmentPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installmentPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="99.99"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    # Cuotas
                  </label>
                  <input
                    type="number"
                    value={formData.installmentCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installmentCount: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="3"
                    min="1"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader size={16} className="animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Cohorte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
