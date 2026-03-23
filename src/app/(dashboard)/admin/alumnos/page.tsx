import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { StepProgress } from "@prisma/client";

type AlumnoWithRelations = Awaited<ReturnType<typeof getAlumnos>>[number];

async function getAlumnos() {
  return prisma.user.findMany({
    where: { role: "ALUMNO" },
    include: {
      clinics: true,
      enrollments: {
        include: {
          cohort: true,
          stepProgress: {
            orderBy: { stepNumber: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

function getProgressColor(completed: number, total: number) {
  const pct = (completed / total) * 100;
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-blue-500";
  if (pct >= 25) return "bg-amber-500";
  return "bg-gray-300";
}

export default async function AlumnosPage() {
  await requireRole(["SUPERADMIN"]);
  const alumnos = await getAlumnos();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""} registrado{alumnos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/alumnos/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Crear alumno
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o clínica..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Alumno
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Clínica
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cohorte
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Progreso
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Registro
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {alumnos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                  No hay alumnos registrados todavía.
                  <Link href="/admin/alumnos/nuevo" className="ml-1 text-blue-600 hover:underline">
                    Crear el primero
                  </Link>
                </td>
              </tr>
            ) : (
              alumnos.map((alumno: AlumnoWithRelations) => {
                const enrollment = alumno.enrollments[0];
                const completedSteps = enrollment?.stepProgress.filter(
                  (s: StepProgress) => s.status === "COMPLETED"
                ).length ?? 0;
                const totalSteps = 16;
                const currentStep = enrollment?.stepProgress.find(
                  (s: StepProgress) => s.status === "IN_PROGRESS"
                );

                return (
                  <tr key={alumno.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/alumnos/${alumno.id}`} className="group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                            {alumno.firstName.charAt(0)}{alumno.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                              {alumno.firstName} {alumno.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{alumno.email}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {alumno.clinics[0]?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {enrollment?.cohort.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${getProgressColor(completedSteps, totalSteps)}`}
                            style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {completedSteps}/{totalSteps}
                        </span>
                      </div>
                      {currentStep && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          Paso {currentStep.stepNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          enrollment?.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : enrollment?.status === "PAUSED"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {enrollment?.status === "ACTIVE"
                          ? "Activo"
                          : enrollment?.status === "PAUSED"
                          ? "Pausado"
                          : enrollment?.status ?? "Sin programa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateShort(alumno.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
