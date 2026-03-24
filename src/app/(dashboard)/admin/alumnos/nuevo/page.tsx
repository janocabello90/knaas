'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Cohort {
  id: string;
  name: string;
  program: string;
}

export default function NuevoAlumnoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    clinicName: '',
    cohortId: '',
  });

  // Fetch cohorts on mount
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        setLoadingCohorts(true);
        const response = await fetch('/api/admin/cohortes');
        if (!response.ok) {
          throw new Error('Error al cargar cohortes');
        }
        const data: Cohort[] = await response.json();
        setCohorts(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(`Error: ${errorMessage}`);
      } finally {
        setLoadingCohorts(false);
      }
    };

    fetchCohorts();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.lastName.trim()) {
      setError('El apellido es requerido');
      return;
    }
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }
    if (!formData.clinicName.trim()) {
      setError('El nombre de la clínica es requerido');
      return;
    }
    if (!formData.cohortId) {
      setError('Debes seleccionar una cohorte');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/alumnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      // Success - redirect to alumnos list
      router.push('/admin/alumnos');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/alumnos"
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear nuevo alumno</h1>
          <p className="mt-1 text-sm text-gray-500">
            Rellena el formulario para registrar un nuevo estudiante
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First and Last Name Row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ej: Juan"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Ej: García"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Ej: juan@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Phone (Optional) */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono <span className="text-gray-400">(Opcional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Ej: +34 912 345 678"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Clinic Name */}
          <div>
            <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la clínica *
            </label>
            <input
              id="clinicName"
              name="clinicName"
              type="text"
              value={formData.clinicName}
              onChange={handleInputChange}
              placeholder="Ej: Clínica FisioVida"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Cohort Select */}
          <div>
            <label htmlFor="cohortId" className="block text-sm font-medium text-gray-700 mb-2">
              Cohorte *
            </label>
            {loadingCohorts ? (
              <div className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-gray-50 text-sm text-gray-500">
                Cargando cohortes...
              </div>
            ) : (
              <select
                id="cohortId"
                name="cohortId"
                value={formData.cohortId}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading || cohorts.length === 0}
              >
                <option value="">Selecciona una cohorte</option>
                {cohorts.map((cohort: Cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} ({cohort.program})
                  </option>
                ))}
              </select>
            )}
            {!loadingCohorts && cohorts.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No hay cohortes disponibles. Crea una antes de añadir alumnos.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || loadingCohorts || cohorts.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creando...' : 'Crear alumno'}
            </button>

            <Link
              href="/admin/alumnos"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
